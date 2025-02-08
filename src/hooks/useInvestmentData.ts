import { useState, useMemo, useEffect } from "react";
import { InvestmentContent } from "../types";

export const useInvestmentData = (investmentData: InvestmentContent[]) => {
  const [timeRange, setTimeRange] = useState("ALL");
  const [selectedYear, setSelectedYear] = useState("ALL");

  const years = useMemo(() => {
    const uniqueYears = [
      ...new Set(
        investmentData.map((item) => new Date(item.date).getFullYear()),
      ),
    ];
    return ["ALL", ...uniqueYears.sort((a, b) => b - a)];
  }, [investmentData]);

  const filteredData = useMemo(() => {
    let filtered = investmentData;

    if (selectedYear !== "ALL") {
      const year = parseInt(selectedYear);
      filtered = filtered.filter(
        (item) => new Date(item.date).getFullYear() === year,
      );
      return filtered;
    }

    const now = new Date();
    const startDate = new Date(now);

    switch (timeRange) {
      case "1M":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "3M":
        startDate.setMonth(now.getMonth() - 3);
        break;
      case "6M":
        startDate.setMonth(now.getMonth() - 6);
        break;
      case "YTD":
        startDate.setMonth(0);
        startDate.setDate(1);
        break;
      case "12M":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case "ALL":
        return filtered;
    }

    return filtered.filter((item) => {
      const itemDate = new Date(item.date);
      itemDate.setHours(0, 0, 0, 0); // Normalize to start of day
      const compareDate = new Date(startDate);
      compareDate.setHours(0, 0, 0, 0); // Normalize to start of day
      return itemDate >= compareDate;
    });
  }, [investmentData, timeRange, selectedYear]);

  const cumulativeData = useMemo(() => {
    let sum = 0;
    return filteredData.map((item) => ({
      date: item.date,
      amount: item.amount,
      cumulativeAmount: (sum += item.amount),
    }));
  }, [filteredData]);

  useEffect(() => {
    setTimeRange("ALL");
  }, [selectedYear]);

  return {
    timeRange,
    setTimeRange,
    selectedYear,
    setSelectedYear,
    years,
    filteredData,
    cumulativeData,
  };
};
