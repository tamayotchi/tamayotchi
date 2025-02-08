import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardContent } from './ui/card';
import { Button } from './ui/button';
import { InvestmentContent } from '../types';
import { formatCurrency } from '../utils/formatters';
import { useInvestmentData } from '../hooks/useInvestmentData'

interface ChartCardProps {
  platformName: string;
  investmentData: InvestmentContent[];
  currency: string;
}

const ChartCard: React.FC<ChartCardProps> = ({ platformName, investmentData, currency }) => {
  const [showTotal, setShowTotal] = useState(true);
  const {
    timeRange,
    setTimeRange,
    selectedYear,
    setSelectedYear,
    years,
    cumulativeData,
  } = useInvestmentData(investmentData);

  const totalInvestment = investmentData.reduce((sum, item) => sum + item.amount, 0);
  const isYearSelected = selectedYear !== 'ALL';

  return (
    <Card className="w-full bg-zinc-900 text-white shadow-xl border border-zinc-800 rounded-lg overflow-hidden">
      <CardHeader className="p-4 bg-zinc-800">
        <p className="text-sm text-zinc-400">{platformName}</p>
        <p className="text-5xl font-bold text-yellow-500">{formatCurrency(totalInvestment, currency)}</p>
        <p className="text-sm text-green-400">{`↑`}</p>
        <div className="flex flex-wrap justify-between items-center mt-6 gap-4">
          <div className="flex flex-wrap gap-2">
            {['1M', '3M', '6M', 'YTD', '12M', 'ALL'].map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'outline'}
                onClick={() => !isYearSelected && setTimeRange(range)}
                className={`text-xs ${
                  isYearSelected
                    ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                    : timeRange === range
                    ? 'bg-yellow-500 text-black'
                    : 'bg-zinc-800 text-white hover:bg-zinc-700'
                }`}
                disabled={isYearSelected}
              >
                {range}
              </Button>
            ))}
          </div>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-zinc-800 text-white border border-zinc-700 rounded px-2 py-1"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year === 'ALL' ? 'All Years' : `Year ${year}`}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            onClick={() => setShowTotal(!showTotal)}
            className="text-xs bg-zinc-800 text-white hover:bg-zinc-700"
          >
            {showTotal ? 'Hide Total' : 'Show Total'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="h-[60vh] sm:h-[50vh] p-1 sm:p-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={cumulativeData} margin={{ top: 10, right: 10, left: 5, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12, fill: '#888' }} 
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
              }}
              interval="preserveStartEnd"
              stroke="#444"
              angle={-45}
              textAnchor="end"
              height={60}
              tickMargin={5}
            type="category"
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#888' }} 
              tickFormatter={(value) => formatCurrency(value, currency)}
              domain={['dataMin', 'dataMax']}
              stroke="#444"
              width={50}
              tickMargin={5}
            />
            <Tooltip
              formatter={(value, name) => [
                formatCurrency(value as number, currency), 
                name === 'amount' ? 'Investment' : 'Total Accumulated'
              ]}
              labelFormatter={(label) => {
                const date = new Date(label);
                // Force UTC date in tooltip
                return `Date: ${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
              }}
              contentStyle={{ backgroundColor: '#222', border: 'none', color: '#fff' }}
            />
            <Line 
              type="stepAfter" 
              dataKey="amount" 
              stroke="#10B981" 
              strokeWidth={2} 
              dot={{ r: 3, fill: '#10B981' }}
              activeDot={{ r: 8, fill: '#10B981', stroke: '#222', strokeWidth: 2 }}
            />
            {showTotal && (
              <Line 
                type="monotone" 
                dataKey="cumulativeAmount" 
                stroke="#FFD700" 
                strokeWidth={2} 
                dot={{ r: 3, fill: '#FFD700' }}
                activeDot={{ r: 8, fill: '#FFD700', stroke: '#222', strokeWidth: 2 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default ChartCard;
