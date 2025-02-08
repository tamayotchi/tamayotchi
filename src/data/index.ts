import rawData from "./data.json";
import { CurrencyCode, InvestmentData } from "../types";

export const investmentData: InvestmentData = Object.entries(rawData).reduce(
  (acc, [provider, data]) => ({
    ...acc,
    [provider]: {
      content: data.content,
      currencyCode: CurrencyCode[data.currencyCode as keyof typeof CurrencyCode],
    },
  }),
  {} as InvestmentData
);
