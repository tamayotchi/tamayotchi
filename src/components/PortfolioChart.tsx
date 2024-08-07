import React from 'react';
import { InvestmentData } from '../types';
import ChartCard from './ChartCard';
import HistoryCard from './HistoryCard';

interface PortfolioChartProps {
  platformName: string;
  investmentData: InvestmentData[];
  currency: string;
}

const PortfolioChart: React.FC<PortfolioChartProps> = ({ platformName, investmentData, currency }) => {
  return (
    <div className="w-full min-h-screen bg-black text-white p-4 sm:p-8">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
        <ChartCard
          platformName={platformName}
          investmentData={investmentData}
          currency={currency}
        />
        <HistoryCard
          investmentData={investmentData}
          currency={currency}
        />
      </div>
    </div>
  );
};

export default PortfolioChart;