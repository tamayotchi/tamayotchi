import rawData from "../../../priv/data/data.json";
import { CurrencyCode, InvestmentData, InvestmentProvider } from "../types";

type RawInvestmentProvider = {
  content: InvestmentProvider["content"];
  currencyCode: keyof typeof CurrencyCode;
};

const dataByProvider = rawData as Record<string, RawInvestmentProvider>;

export const investmentData: InvestmentData = Object.entries(dataByProvider).reduce(
  (acc, [provider, data]) => ({
    ...acc,
    [provider]: {
      content: data.content,
      currencyCode:
        CurrencyCode[data.currencyCode as keyof typeof CurrencyCode],
    },
  }),
  {} as InvestmentData,
);
