import { useState, useMemo, useEffect } from "react";
import { InvestmentContent } from "../types";

interface DataPoint {
  date: string;
  amount: number | null;
  cumulativeAmount: number | null;
  yearEndValue: number | null;
}

export const useInvestmentData = (
  investmentData: InvestmentContent[],
  yearEndValues: InvestmentContent[] = [],
) => {
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
      itemDate.setHours(0, 0, 0, 0);
      const compareDate = new Date(startDate);
      compareDate.setHours(0, 0, 0, 0);
      return itemDate >= compareDate;
    });
  }, [investmentData, timeRange, selectedYear]);

  const cumulativeData = useMemo(() => {
    // Ordenar los datos por fecha primero
    const sortedData = [...filteredData].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    let cumulativeAmountSum = 0;
    return sortedData.map((item, index) => ({
      date: item.date,
      amount: item.isYearEndValue ? null : item.amount,
      cumulativeAmount: item.isYearEndValue
        ? null
        : (cumulativeAmountSum += item.amount),
      cumulativeYearAmount:
        index === 0 || item.isYearEndValue ? item.amount : null,
    }));
  }, [filteredData]);

  const filteredYearEndValues = useMemo(() => {
    if (selectedYear !== "ALL") {
      const year = parseInt(selectedYear);
      return yearEndValues.filter(
        (item) => new Date(item.date).getFullYear() === year,
      );
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
        return yearEndValues;
    }

    return yearEndValues.filter((item) => {
      const itemDate = new Date(item.date);
      itemDate.setHours(0, 0, 0, 0);
      const compareDate = new Date(startDate);
      compareDate.setHours(0, 0, 0, 0);
      return itemDate >= compareDate;
    });
  }, [yearEndValues, timeRange, selectedYear]);

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
    filteredYearEndValues,
  };
};
