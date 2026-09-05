#!/usr/bin/env node
/**
 * eToro portfolio exporter
 *
 * Opens an isolated Chromium profile with Chrome DevTools Protocol enabled,
 * waits while you log in manually, then captures the portfolio API response and
 * writes clean CSV/JSON files. It does NOT save passwords, cookies, auth headers,
 * HAR files, or the raw eToro login payload by default.
 *
 * Usage:
 *   etoro-portfolio-export
 *   etoro-portfolio-export --out ~/Downloads/my-etoro-export --port 9223
 *
 * Requirements:
 *   - Node.js with global WebSocket support (Node 22+ recommended)
 *   - chromium, google-chrome, or chrome in PATH
 */

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import readline from 'node:readline/promises';
import process from 'node:process';

const LOGIN_URL = 'https://www.etoro.com/login';
const PORTFOLIO_URL = 'https://www.etoro.com/portfolio/overview';

function usage() {
  console.log(`Usage: etoro-portfolio-export [options]\n\nOptions:\n  --out DIR          Output directory. Default: ~/Downloads/etoro-export-<timestamp>\n  --port PORT        Local DevTools port. Default: 9222\n  --profile DIR      Chromium profile dir. Default: temp dir under /tmp\n  --keep-browser     Do not close Chromium after export\n  --keep-profile     Do not delete temporary Chromium profile after export\n  --timeout MS       Wait for portfolio API response. Default: 45000\n  --help             Show this help\n\nWhat it exports:\n  - portfolio_summary.csv/json: aggregated holdings by ticker/person\n  - positions_detail.csv: every open position from the portfolio payload\n  - copytrader_summary.csv: copied-person rows if present\n`);
}

function parseArgs(argv) {
  const args = {
    port: Number(process.env.ETORO_EXPORT_PORT || 9222),
    out: null,
    profile: null,
    keepBrowser: false,
    keepProfile: false,
    timeout: 45000,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') { usage(); process.exit(0); }
    if (a === '--out') args.out = expandHome(argv[++i]);
    else if (a.startsWith('--out=')) args.out = expandHome(a.slice('--out='.length));
    else if (a === '--port') args.port = Number(argv[++i]);
    else if (a.startsWith('--port=')) args.port = Number(a.slice('--port='.length));
    else if (a === '--profile') args.profile = expandHome(argv[++i]);
    else if (a.startsWith('--profile=')) args.profile = expandHome(a.slice('--profile='.length));
    else if (a === '--keep-browser') args.keepBrowser = true;
    else if (a === '--keep-profile') args.keepProfile = true;
    else if (a === '--timeout') args.timeout = Number(argv[++i]);
    else if (a.startsWith('--timeout=')) args.timeout = Number(a.slice('--timeout='.length));
    else throw new Error(`Unknown option: ${a}`);
  }
  if (!Number.isInteger(args.port) || args.port <= 0) throw new Error('Invalid --port');
  if (!Number.isFinite(args.timeout) || args.timeout < 5000) throw new Error('Invalid --timeout; use >= 5000 ms');
  return args;
}

function expandHome(p) {
  if (!p) return p;
  if (p === '~') return os.homedir();
  if (p.startsWith('~/')) return path.join(os.homedir(), p.slice(2));
  return p;
}

function timestampSlug() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function commandExists(cmd) {
  const r = spawnSync('sh', ['-lc', `command -v ${JSON.stringify(cmd)} >/dev/null 2>&1`]);
  return r.status === 0;
}

function findChromium() {
  if (process.env.CHROMIUM && commandExists(process.env.CHROMIUM)) return process.env.CHROMIUM;
  for (const c of ['chromium', 'google-chrome', 'google-chrome-stable', 'chrome']) {
    if (commandExists(c)) return c;
  }
  throw new Error('Could not find chromium/google-chrome/chrome in PATH');
}

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function fetchJson(url, timeoutMs = 5000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

async function waitForDevtools(port, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  let lastErr = null;
  while (Date.now() < deadline) {
    try { return await fetchJson(`http://127.0.0.1:${port}/json/version`, 1500); }
    catch (e) { lastErr = e; await sleep(400); }
  }
  throw new Error(`DevTools did not start on 127.0.0.1:${port}: ${lastErr?.message || lastErr}`);
}

async function getPageTarget(port) {
  const targets = await fetchJson(`http://127.0.0.1:${port}/json/list`, 5000);
  const page = targets.find(t => t.type === 'page' && String(t.url).includes('etoro.com'))
    || targets.find(t => t.type === 'page');
  if (!page) throw new Error('No Chromium page target found');
  return page;
}

class CDP {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 1;
    this.pending = new Map();
    this.handlers = new Map();
  }

  async connect() {
    if (typeof WebSocket !== 'function') {
      throw new Error('This Node.js does not provide global WebSocket. Use Node 22+ or newer.');
    }
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('WebSocket connection timeout')), 10000);
      this.ws.addEventListener('open', () => { clearTimeout(t); resolve(); }, { once: true });
      this.ws.addEventListener('error', ev => { clearTimeout(t); reject(ev.error || new Error('WebSocket error')); }, { once: true });
    });
    this.ws.addEventListener('message', ev => {
      let msg;
      try { msg = JSON.parse(ev.data); } catch { return; }
      if (msg.id && this.pending.has(msg.id)) {
        const p = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) p.reject(new Error(`${msg.error.code}: ${msg.error.message}`));
        else p.resolve(msg.result ?? {});
      } else if (msg.method) {
        const list = this.handlers.get(msg.method);
        if (list) for (const fn of list) fn(msg.params || {});
      }
    });
  }

  on(method, fn) {
    if (!this.handlers.has(method)) this.handlers.set(method, []);
    this.handlers.get(method).push(fn);
  }

  send(method, params = {}, timeoutMs = 15000) {
    const id = this.id++;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`CDP timeout: ${method}`));
        }
      }, timeoutMs);
      this.pending.set(id, {
        resolve: v => { clearTimeout(t); resolve(v); },
        reject: e => { clearTimeout(t); reject(e); },
      });
    });
  }

  close() {
    try { this.ws.close(); } catch {}
  }
}

function isPortfolioPayloadUrl(url) {
  return String(url).includes('/api/logindata/v2/logindata');
}

async function capturePortfolioPayload({ port, timeout }) {
  const target = await getPageTarget(port);
  const cdp = new CDP(target.webSocketDebuggerUrl);
  await cdp.connect();

  const requestIds = new Set();
  let done;
  let fail;
  const payloadPromise = new Promise((resolve, reject) => { done = resolve; fail = reject; });

  async function tryGetBody(requestId) {
    try {
      const res = await cdp.send('Network.getResponseBody', { requestId }, 10000);
      let body = res.body || '';
      if (res.base64Encoded) body = Buffer.from(body, 'base64').toString('utf8');
      const json = JSON.parse(body);
      const portfolio = json?.AggregatedResult?.ApiResponses?.PrivatePortfolio?.Content?.ClientPortfolio;
      const metadata = json?.AggregatedResult?.ApiResponses?.InstrumentsMetadata?.Content;
      const rates = json?.AggregatedResult?.ApiResponses?.Rates?.Content;
      if (portfolio && metadata && rates) done(json);
    } catch {
      // Ignore non-ready/expired/invalid bodies.
    }
  }

  cdp.on('Network.responseReceived', params => {
    const url = params.response?.url || '';
    if (isPortfolioPayloadUrl(url)) requestIds.add(params.requestId);
  });

  cdp.on('Network.loadingFinished', params => {
    if (requestIds.has(params.requestId)) setTimeout(() => tryGetBody(params.requestId), 50);
  });

  await cdp.send('Network.enable', {
    maxTotalBufferSize: 100000000,
    maxResourceBufferSize: 50000000,
  });
  await cdp.send('Page.enable');
  try { await cdp.send('Network.setCacheDisabled', { cacheDisabled: true }); } catch {}

  console.log(`Navigating to ${PORTFOLIO_URL} and waiting for portfolio API response...`);
  await cdp.send('Page.navigate', { url: PORTFOLIO_URL });

  const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error(`Timed out after ${timeout} ms waiting for eToro portfolio API response`)), timeout));
  try {
    return await Promise.race([payloadPromise, timeoutPromise]);
  } finally {
    cdp.close();
  }
}

function typeName(typeId) {
  return ({
    1: 'Currency',
    2: 'Commodity',
    4: 'Index',
    5: 'Stock',
    6: 'ETF',
    10: 'Crypto',
  })[typeId] || `Type ${typeId ?? ''}`;
}

function money(n) {
  return Math.round((Number(n || 0) + Number.EPSILON) * 100) / 100;
}

function pct(n) {
  if (n == null || Number.isNaN(n)) return null;
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function format2(n) {
  return money(n).toFixed(2);
}

function csvCell(x) {
  const s = String(x ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function currentPriceAndConversion(position, ratesById) {
  const r = ratesById[position.InstrumentID];
  if (!r) return { price: 0, conversion: 1, rateMissing: true };
  if (position.IsBuy) return { price: Number(r.Bid || 0), conversion: Number(r.ConversionRateBid || 1), rateMissing: false };
  return { price: Number(r.Ask || 0), conversion: Number(r.ConversionRateAsk || 1), rateMissing: false };
}

function positionCalc(position, ratesById) {
  const { price, conversion, rateMissing } = currentPriceAndConversion(position, ratesById);
  const units = Number(position.Units || 0);
  const openRate = Number(position.OpenRate || 0);
  const openConversion = Number(position.OpenConversionRate || conversion || 1);
  const invested = Number(position.Amount || 0);

  const currentExposure = units * price * conversion;
  const openExposure = units * openRate * openConversion;
  const pnl = position.IsBuy ? (currentExposure - openExposure) : (openExposure - currentExposure);

  // eToro row net value for ordinary unleveraged long positions equals currentExposure.
  // For leveraged/short positions, amount + P/L is a better approximation of net value.
  const isPlainLong = position.IsBuy && Number(position.Leverage || 1) === 1;
  const value = isPlainLong ? currentExposure : invested + pnl;

  return {
    invested,
    value,
    gainLoss: value - invested,
    currentPrice: price,
    conversion,
    rateMissing,
  };
}

function parsePortfolio(loginPayload) {
  const responses = loginPayload.AggregatedResult.ApiResponses;
  const clientPortfolio = responses.PrivatePortfolio.Content.ClientPortfolio;
  const metadata = responses.InstrumentsMetadata.Content;
  const rates = responses.Rates.Content;

  const detailRows = [];
  const byHolding = new Map();

  function instrumentMeta(instrumentId) {
    return metadata[instrumentId] || { InstrumentID: instrumentId, SymbolFull: String(instrumentId), InstrumentDisplayName: '' };
  }

  function addHoldingRow(key, partial) {
    if (!byHolding.has(key)) byHolding.set(key, {
      category: partial.category,
      symbol: partial.symbol,
      name: partial.name,
      instrumentId: partial.instrumentId ?? '',
      invested: 0,
      value: 0,
      gainLoss: 0,
      openPositions: 0,
      units: 0,
    });
    const row = byHolding.get(key);
    row.invested += partial.invested || 0;
    row.value += partial.value || 0;
    row.gainLoss += partial.gainLoss || 0;
    row.openPositions += partial.openPositions || 0;
    row.units += partial.units || 0;
  }

  for (const p of clientPortfolio.Positions || []) {
    const meta = instrumentMeta(p.InstrumentID);
    const calc = positionCalc(p, rates);
    const category = typeName(meta.InstrumentTypeID);
    addHoldingRow(`instrument:${p.InstrumentID}`, {
      category,
      symbol: meta.SymbolFull,
      name: meta.InstrumentDisplayName,
      instrumentId: p.InstrumentID,
      invested: calc.invested,
      value: calc.value,
      gainLoss: calc.gainLoss,
      openPositions: 1,
      units: Number(p.Units || 0),
    });
    detailRows.push({
      ownerType: 'Direct',
      owner: '',
      positionId: p.PositionID,
      openDateTime: p.OpenDateTime,
      category,
      symbol: meta.SymbolFull,
      name: meta.InstrumentDisplayName,
      instrumentId: p.InstrumentID,
      side: p.IsBuy ? 'Buy' : 'Sell',
      leverage: p.Leverage,
      invested: calc.invested,
      value: calc.value,
      gainLoss: calc.gainLoss,
      units: Number(p.Units || 0),
      openRate: Number(p.OpenRate || 0),
      currentPrice: calc.currentPrice,
      totalFees: Number(p.TotalFees || 0),
      rateMissing: calc.rateMissing,
    });
  }

  const copyTraderSummary = [];
  for (const m of clientPortfolio.Mirrors || []) {
    let openInvested = 0;
    let openValue = 0;
    let openGainLoss = 0;
    let units = 0;

    for (const p of m.Positions || []) {
      const meta = instrumentMeta(p.InstrumentID);
      const calc = positionCalc(p, rates);
      openInvested += calc.invested;
      openValue += calc.value;
      openGainLoss += calc.gainLoss;
      units += Number(p.Units || 0);
      detailRows.push({
        ownerType: 'CopyTrader',
        owner: m.ParentUsername,
        positionId: p.PositionID,
        openDateTime: p.OpenDateTime,
        category: typeName(meta.InstrumentTypeID),
        symbol: meta.SymbolFull,
        name: meta.InstrumentDisplayName,
        instrumentId: p.InstrumentID,
        side: p.IsBuy ? 'Buy' : 'Sell',
        leverage: p.Leverage,
        invested: calc.invested,
        value: calc.value,
        gainLoss: calc.gainLoss,
        units: Number(p.Units || 0),
        openRate: Number(p.OpenRate || 0),
        currentPrice: calc.currentPrice,
        totalFees: Number(p.TotalFees || 0),
        rateMissing: calc.rateMissing,
      });
    }

    const cashInsideCopy = Number(m.AvailableAmount || 0);
    const closedPositionsNetProfit = Number(m.ClosedPositionsNetProfit || 0);
    const value = openValue + cashInsideCopy;
    const gainLoss = openGainLoss + closedPositionsNetProfit;
    const invested = value - gainLoss;

    addHoldingRow(`copy:${m.ParentUsername}`, {
      category: 'CopyTrader / Person',
      symbol: m.ParentUsername,
      name: m.ParentUsername,
      instrumentId: '',
      invested,
      value,
      gainLoss,
      openPositions: (m.Positions || []).length,
      units,
    });

    copyTraderSummary.push({
      username: m.ParentUsername,
      startedCopyDate: m.StartedCopyDate,
      value,
      invested,
      gainLoss,
      openPositions: (m.Positions || []).length,
      cashInsideCopy,
      openPositionsInvested: openInvested,
      openPositionsValue: openValue,
      openPositionsGainLoss: openGainLoss,
      closedPositionsNetProfit,
      initialInvestment: Number(m.InitialInvestment || 0),
      depositSummary: Number(m.DepositSummary || 0),
      withdrawalSummary: Number(m.WithdrawalSummary || 0),
    });
  }

  let holdings = Array.from(byHolding.values()).map(r => ({
    ...r,
    invested: money(r.invested),
    value: money(r.value),
    gainLoss: money(r.gainLoss),
    gainLossPct: r.invested ? pct((r.gainLoss / r.invested) * 100) : null,
    units: money(r.units),
  })).sort((a, b) => b.value - a.value);

  const availableCash = money(clientPortfolio.Credit || 0);
  const totalInvested = money(holdings.reduce((s, r) => s + r.invested, 0));
  const investedAssetsValue = money(holdings.reduce((s, r) => s + r.value, 0));
  const gainLoss = money(holdings.reduce((s, r) => s + r.gainLoss, 0));
  const portfolioValue = money(investedAssetsValue + availableCash);
  holdings = holdings.map(r => ({ ...r, portfolioPct: portfolioValue ? pct((r.value / portfolioValue) * 100) : null }));

  const categoryMap = new Map();
  for (const r of holdings) {
    const c = categoryMap.get(r.category) || { category: r.category, invested: 0, value: 0, gainLoss: 0, holdings: 0 };
    c.invested += r.invested;
    c.value += r.value;
    c.gainLoss += r.gainLoss;
    c.holdings += 1;
    categoryMap.set(r.category, c);
  }
  const byCategory = Array.from(categoryMap.values()).map(c => ({
    ...c,
    invested: money(c.invested),
    value: money(c.value),
    gainLoss: money(c.gainLoss),
    portfolioPct: portfolioValue ? pct((c.value / portfolioValue) * 100) : null,
  })).sort((a, b) => b.value - a.value);

  return {
    exportedAt: new Date().toISOString(),
    sourceEndpoint: '/api/logindata/v2/logindata',
    totals: { availableCash, totalInvested, investedAssetsValue, gainLoss, portfolioValue },
    byCategory,
    holdings,
    copyTraderSummary: copyTraderSummary.map(r => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, typeof v === 'number' ? money(v) : v]))),
    positions: detailRows.map(r => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, typeof v === 'number' ? money(v) : v]))),
  };
}

async function writeCsv(filePath, rows, columns) {
  const lines = [columns.map(c => c.header).join(',')];
  for (const row of rows) lines.push(columns.map(c => csvCell(c.value(row))).join(','));
  await fs.writeFile(filePath, lines.join('\n') + '\n');
}

async function writeOutputs(outDir, parsed) {
  await fs.mkdir(outDir, { recursive: true });

  const summaryJsonPath = path.join(outDir, 'portfolio_summary.json');
  const summaryCsvPath = path.join(outDir, 'portfolio_summary.csv');
  const positionsCsvPath = path.join(outDir, 'positions_detail.csv');
  const copyCsvPath = path.join(outDir, 'copytrader_summary.csv');
  const readmePath = path.join(outDir, 'README.txt');

  await fs.writeFile(summaryJsonPath, JSON.stringify(parsed, null, 2));
  await writeCsv(summaryCsvPath, parsed.holdings, [
    { header: 'category', value: r => r.category },
    { header: 'symbol', value: r => r.symbol },
    { header: 'name', value: r => r.name },
    { header: 'invested_usd', value: r => format2(r.invested) },
    { header: 'value_usd', value: r => format2(r.value) },
    { header: 'gain_loss_usd', value: r => format2(r.gainLoss) },
    { header: 'gain_loss_pct', value: r => r.gainLossPct ?? '' },
    { header: 'portfolio_pct', value: r => r.portfolioPct ?? '' },
    { header: 'open_positions', value: r => r.openPositions },
    { header: 'units', value: r => r.units },
    { header: 'instrument_id', value: r => r.instrumentId },
  ]);

  await writeCsv(positionsCsvPath, parsed.positions, [
    { header: 'owner_type', value: r => r.ownerType },
    { header: 'owner', value: r => r.owner },
    { header: 'position_id', value: r => r.positionId },
    { header: 'open_date_time', value: r => r.openDateTime },
    { header: 'category', value: r => r.category },
    { header: 'symbol', value: r => r.symbol },
    { header: 'name', value: r => r.name },
    { header: 'side', value: r => r.side },
    { header: 'leverage', value: r => r.leverage },
    { header: 'invested_usd', value: r => format2(r.invested) },
    { header: 'value_usd', value: r => format2(r.value) },
    { header: 'gain_loss_usd', value: r => format2(r.gainLoss) },
    { header: 'units', value: r => r.units },
    { header: 'open_rate', value: r => r.openRate },
    { header: 'current_price', value: r => r.currentPrice },
    { header: 'total_fees', value: r => r.totalFees },
    { header: 'instrument_id', value: r => r.instrumentId },
  ]);

  await writeCsv(copyCsvPath, parsed.copyTraderSummary, [
    { header: 'username', value: r => r.username },
    { header: 'started_copy_date', value: r => r.startedCopyDate },
    { header: 'invested_usd', value: r => format2(r.invested) },
    { header: 'value_usd', value: r => format2(r.value) },
    { header: 'gain_loss_usd', value: r => format2(r.gainLoss) },
    { header: 'open_positions', value: r => r.openPositions },
    { header: 'cash_inside_copy', value: r => format2(r.cashInsideCopy) },
    { header: 'closed_positions_net_profit', value: r => format2(r.closedPositionsNetProfit) },
    { header: 'open_positions_invested', value: r => format2(r.openPositionsInvested) },
    { header: 'open_positions_value', value: r => format2(r.openPositionsValue) },
  ]);

  await fs.writeFile(readmePath, `eToro portfolio export\n======================\n\nGenerated: ${parsed.exportedAt}\n\nFiles:\n- portfolio_summary.csv: aggregated holdings by ticker/person\n- portfolio_summary.json: same data plus category totals and detail arrays\n- positions_detail.csv: every open position from the current portfolio payload\n- copytrader_summary.csv: copied-person rows, if any\n\nMethod:\nThis script opens Chromium with Chrome DevTools Protocol bound to 127.0.0.1 only.\nAfter you log in manually, it navigates to https://www.etoro.com/portfolio/overview and captures the JSON response from:\n\n  GET https://www.etoro.com/api/logindata/v2/logindata?...\n\nIt reads:\n- AggregatedResult.ApiResponses.PrivatePortfolio.Content.ClientPortfolio\n- AggregatedResult.ApiResponses.InstrumentsMetadata.Content\n- AggregatedResult.ApiResponses.Rates.Content\n\nNo passwords, 2FA codes, cookies, auth headers, HAR files, or raw login payloads are written by default.\n`);

  return { summaryJsonPath, summaryCsvPath, positionsCsvPath, copyCsvPath, readmePath };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const outDir = args.out || path.join(os.homedir(), 'Downloads', `etoro-export-${timestampSlug()}`);
  const profileDir = args.profile || path.join(os.tmpdir(), `etoro-export-profile-${args.port}`);
  const shouldDeleteProfile = !args.profile && !args.keepProfile;
  const chromium = findChromium();

  await fs.mkdir(profileDir, { recursive: true });
  // If a previous Chromium crashed, these locks can block profile reuse.
  await Promise.all(['SingletonLock', 'SingletonSocket', 'SingletonCookie'].map(f => fs.rm(path.join(profileDir, f), { force: true }).catch(() => {})));

  console.log(`Opening Chromium: ${chromium}`);
  console.log(`DevTools: http://127.0.0.1:${args.port}`);
  console.log(`Temporary profile: ${profileDir}`);
  const browser = spawn(chromium, [
    `--user-data-dir=${profileDir}`,
    '--remote-debugging-address=127.0.0.1',
    `--remote-debugging-port=${args.port}`,
    '--no-first-run',
    '--new-window',
    LOGIN_URL,
  ], { detached: true, stdio: 'ignore' });
  browser.unref();

  await waitForDevtools(args.port);

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    console.log('\nLog in manually in the Chromium window.');
    console.log('Do NOT type your password or 2FA code in this terminal.');
    await rl.question('When you are fully logged in, press Enter here to export the portfolio... ');
  } finally {
    rl.close();
  }

  const payload = await capturePortfolioPayload({ port: args.port, timeout: args.timeout });
  const parsed = parsePortfolio(payload);
  const files = await writeOutputs(outDir, parsed);

  console.log('\nExport complete.');
  console.log(`Output directory: ${outDir}`);
  for (const [name, file] of Object.entries(files)) console.log(`- ${name}: ${file}`);
  console.log('\nTotals:');
  console.log(`- Available cash: $${format2(parsed.totals.availableCash)}`);
  console.log(`- Total invested: $${format2(parsed.totals.totalInvested)}`);
  console.log(`- Current portfolio value: $${format2(parsed.totals.portfolioValue)}`);
  console.log(`- Gain/Loss: $${format2(parsed.totals.gainLoss)}`);

  if (!args.keepBrowser) {
    // Close only the isolated Chromium launched with this profile/port.
    spawn('sh', ['-lc', `pkill -f ${JSON.stringify(`remote-debugging-port=${args.port}`)} || true`], { stdio: 'ignore' }).unref();
  }
  if (shouldDeleteProfile) {
    // Give Chromium a moment to exit, then remove temporary profile.
    setTimeout(() => { fs.rm(profileDir, { recursive: true, force: true }).catch(() => {}); }, 1500);
  }
}

main().catch(err => {
  console.error(`\nERROR: ${err.message}`);
  console.error('\nTips:');
  console.error('- Make sure you logged into the Chromium window opened by this script.');
  console.error('- If port 9222 is busy, run: etoro-portfolio-export --port 9223');
  console.error('- If eToro is slow, run: etoro-portfolio-export --timeout 90000');
  process.exit(1);
});
