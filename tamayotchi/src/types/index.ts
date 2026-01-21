export enum Provider {
  ETORO = "ETORO",
  XTB = "XTB",
  A2CENSO = "A2CENSO",
  BRICKSAVE = "BRICKSAVE",
  TRII = "TRII",
}

export enum CurrencyCode {
  USD = "USD",
  COP = "COP",
}

export interface InvestmentContent {
  date: string;
  amount: number;
}

export interface InvestmentProvider {
  content: InvestmentContent[];
  yearEndValues: InvestmentContent[];
  currencyCode: string;
}

export type InvestmentData = Record<Provider, InvestmentProvider>;
