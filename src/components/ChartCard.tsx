import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardContent } from './ui/card';
import { Button } from './ui/button';
import { InvestmentData } from '../types';
import { formatCurrency, formatDate, formatXAxis } from '../utils/formatters';
import { useInvestmentData } from '../hooks/useInvestmentData'

interface ChartCardProps {
  platformName: string;
  investmentData: InvestmentData[];
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

  const totalInvestment = cumulativeData[cumulativeData.length - 1]?.cumulativeAmount || 0;
  const isYearSelected = selectedYear !== 'ALL';

  return (
    <Card className="w-full lg:w-3/5 bg-zinc-900 text-white shadow-xl border border-zinc-800 rounded-lg overflow-hidden lg:sticky lg:top-8 lg:h-[calc(100vh-8rem)]">
      <CardHeader className="p-6 bg-zinc-800">
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
      <CardContent className="h-[calc(100%-13rem)] p-6">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={cumulativeData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12, fill: '#888' }} 
              tickFormatter={formatXAxis}
              interval="preserveStartEnd"
              stroke="#444"
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#888' }} 
              tickFormatter={(value) => formatCurrency(value, currency)}
              domain={['dataMin', 'dataMax']}
              stroke="#444"
            />
            <Tooltip
              formatter={(value, name) => [
                formatCurrency(value as number, currency), 
                name === 'amount' ? 'Investment' : 'Total Accumulated'
              ]}
              labelFormatter={(label) => `Date: ${formatDate(label as string)}`}
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