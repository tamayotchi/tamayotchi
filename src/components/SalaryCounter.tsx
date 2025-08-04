import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SalaryCounterProps {
  isDarkMode: boolean;
}

export default function SalaryCounter({ isDarkMode }: SalaryCounterProps) {
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [startTime] = useState(Date.now());

  const MONTHLY_SALARY = 12_112_514;
  const SECONDS_PER_MONTH = 30 * 24 * 60 * 60;
  const SALARY_PER_SECOND = MONTHLY_SALARY / SECONDS_PER_MONTH;

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setSecondsElapsed(elapsed);
    }, 100);

    return () => clearInterval(interval);
  }, [startTime]);

  const totalEarned = secondsElapsed * SALARY_PER_SECOND;
  const earningsPerMinute = SALARY_PER_SECOND * 60;
  const earningsPerHour = SALARY_PER_SECOND * 3600;
  const earningsPerDay = SALARY_PER_SECOND * 86400;

  const formatCurrency = (amount: number) => {
    if (amount < 1) {
      return amount.toLocaleString("es-CO", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
      });
    }
    return amount.toLocaleString("es-CO", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  return (
    <Card className={`${isDarkMode ? "bg-gray-700 border-gray-600" : "bg-gray-300 border-gray-400"} font-mono`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-center text-lg">💰 SALARY COUNTER</CardTitle>
        <p className="text-center text-sm opacity-75">Monthly Salary: ${formatCurrency(MONTHLY_SALARY)} COP</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-center">
          <p className="text-sm opacity-75">Time on page:</p>
          <p className="text-xl font-bold">{formatTime(secondsElapsed)}</p>
        </div>
        
        <div className={`text-center p-3 rounded ${isDarkMode ? "bg-gray-800" : "bg-gray-200"}`}>
          <p className="text-sm opacity-75">Earned so far:</p>
          <p className="text-2xl font-bold text-green-400">
            ${formatCurrency(totalEarned)} COP
          </p>
        </div>

        <div className="space-y-1">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className={`text-center py-1 px-2 rounded border ${isDarkMode ? "bg-gray-800 border-gray-600" : "bg-gray-200 border-gray-400"}`}>
              <p className="opacity-75">Per second</p>
            </div>
            <div className={`text-center py-1 px-2 rounded border ${isDarkMode ? "bg-gray-800 border-gray-600" : "bg-gray-200 border-gray-400"}`}>
              <p className="opacity-75">Per minute</p>
            </div>
            <div className={`text-center py-1 px-2 rounded border ${isDarkMode ? "bg-gray-800 border-gray-600" : "bg-gray-200 border-gray-400"}`}>
              <p className="opacity-75">Per hour</p>
            </div>
            <div className={`text-center py-1 px-2 rounded border ${isDarkMode ? "bg-gray-800 border-gray-600" : "bg-gray-200 border-gray-400"}`}>
              <p className="opacity-75">Per day</p>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className={`text-center p-3 rounded border flex flex-col justify-center ${isDarkMode ? "bg-gray-800 border-gray-600" : "bg-gray-200 border-gray-400"}`}>
              <p className="font-bold text-sm">${formatCurrency(SALARY_PER_SECOND)}</p>
              <p className="text-xs opacity-60">COP</p>
            </div>
            <div className={`text-center p-3 rounded border flex flex-col justify-center ${isDarkMode ? "bg-gray-800 border-gray-600" : "bg-gray-200 border-gray-400"}`}>
              <p className="font-bold text-sm">${formatCurrency(earningsPerMinute)}</p>
              <p className="text-xs opacity-60">COP</p>
            </div>
            <div className={`text-center p-3 rounded border flex flex-col justify-center ${isDarkMode ? "bg-gray-800 border-gray-600" : "bg-gray-200 border-gray-400"}`}>
              <p className="font-bold text-sm">${formatCurrency(earningsPerHour)}</p>
              <p className="text-xs opacity-60">COP</p>
            </div>
            <div className={`text-center p-3 rounded border flex flex-col justify-center ${isDarkMode ? "bg-gray-800 border-gray-600" : "bg-gray-200 border-gray-400"}`}>
              <p className="font-bold text-sm">${formatCurrency(earningsPerDay)}</p>
              <p className="text-xs opacity-60">COP</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
