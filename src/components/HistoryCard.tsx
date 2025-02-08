import React, { useEffect } from 'react';
import { Card, CardHeader, CardContent } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { InvestmentData } from '../types';
import { formatCurrency } from '../utils/formatters';
import { useInvestmentData } from '../hooks/useInvestmentData';

interface HistoryCardProps {
  investmentData: InvestmentData[];
  currency: string;
}

const HistoryCard: React.FC<HistoryCardProps> = ({ investmentData, currency }) => {
  const { cumulativeData } = useInvestmentData(investmentData);

  useEffect(() => {
    const tableBody = document.querySelector('.overflow-y-auto');
    if (tableBody) {
      tableBody.scrollTop = tableBody.scrollHeight;
    }
  }, [cumulativeData]);

  const totalInvestment = investmentData.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Card className="w-full lg:w-2/5 bg-zinc-900 text-white shadow-xl border border-zinc-800 rounded-lg overflow-hidden">
      <CardHeader className="p-6 bg-zinc-800">
        <h3 className="text-xl font-semibold">Investment History</h3>
      </CardHeader>
      <CardContent className="p-6">
        <div className="relative">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-zinc-900">
              <TableRow className="border-b border-zinc-700">
                <TableHead className="w-1/3 text-zinc-400">Date</TableHead>
                <TableHead className="w-1/3 text-right text-zinc-400">Amount</TableHead>
                <TableHead className="w-1/3 text-right text-zinc-400">Cumulative</TableHead>
              </TableRow>
            </TableHeader>
          </Table>
          <div className="overflow-y-auto max-h-[calc(100vh-24rem)]">
            <Table>
              <TableBody>
                {cumulativeData.map((item, index) => (
                  <TableRow key={index} className="border-b border-zinc-800 hover:bg-zinc-800">
                    <TableCell>
                      {(() => {
                        const date = new Date(item.date);
                        // Use UTC methods but format as Month Day, Year
                        const month = date.toLocaleString('default', { month: 'long', timeZone: 'UTC' });
                        const day = date.getUTCDate();
                        const year = date.getUTCFullYear();
                        return `${month} ${day}, ${year}`;
                      })()}
                    </TableCell>
                    <TableCell className="text-right text-green-400">{formatCurrency(item.amount, currency)}</TableCell>
                    <TableCell className="text-right text-yellow-500">{formatCurrency(item.cumulativeAmount, currency)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Table>
            <TableBody>
              <TableRow className="font-bold bg-zinc-800 sticky bottom-0">
                <TableCell>Total</TableCell>
                <TableCell className="text-right text-green-400">{formatCurrency(totalInvestment, currency)}</TableCell>
                <TableCell className="text-right text-yellow-500">{formatCurrency(totalInvestment, currency)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default HistoryCard;
