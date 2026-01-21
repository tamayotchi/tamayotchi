import React from "react";
import { InvestmentProvider } from "../types";
import ChartCard from "./ChartCard";
import HistoryCard from "./HistoryCard";

interface PortfolioChartProps {
  platformName: string;
  investmentData: InvestmentProvider;
}

const PortfolioChart: React.FC<PortfolioChartProps> = ({
  platformName,
  investmentData,
}) => {
  return (
    <div className="w-full min-h-screen bg-black text-white p-4 sm:p-8">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
        <ChartCard
          platformName={platformName}
          investmentData={investmentData.content}
          currency={investmentData.currencyCode}
        />
        <HistoryCard
          investmentData={investmentData.content}
          currency={investmentData.currencyCode}
        />
      </div>
    </div>
  );
};

export default PortfolioChart;
