"use client";

import { useState, useMemo, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { 
  format, 
  subDays, 
  startOfDay, 
  endOfDay, 
  startOfMonth, 
  endOfMonth, 
  parseISO 
} from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const DATE_RANGES = {
  "7D": { label: "Last 7 Days", days: 7 },
  "1M": { label: "Last Month", days: 30 },
  "3M": { label: "Last 3 Months", days: 90 },
  "6M": { label: "Last 6 Months", days: 180 },
  "YM": { label: "Select Year/Month", days: null, custom: true },
  "ALL": { label: "All Time", days: null },
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: currentYear - 2019 }, (_, i) => (2020 + i).toString());

// Updated function to convert UTC to IST
const convertUTCtoIST = (utcDate) => {
  return new Date(utcDate).toLocaleString('en-IN', { 
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

export function AccountChart({ transactions }) {
  const [dateRange, setDateRange] = useState("1M");
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[new Date().getMonth()]);
  const [showMonthSelector, setShowMonthSelector] = useState(false);

  useEffect(() => {
    if (dateRange !== "YM") {
      setShowMonthSelector(false);
    }
  }, [dateRange]);

  const handleYearSelect = (year) => {
    setSelectedYear(year);
    setShowMonthSelector(true);
  };

  const handleMonthSelect = (month) => {
    setSelectedMonth(month);
    setShowMonthSelector(false);
  };

  const filteredData = useMemo(() => {
    let startDate, endDate;
    const now = new Date();

    if (dateRange === "YM") {
      const monthIndex = MONTHS.indexOf(selectedMonth);
      const year = parseInt(selectedYear);
      const offsetInMs = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds

      // Calculate start date in UTC for the first day of the month at 00:00 IST
      const selectedMonthStartIST = new Date(year, monthIndex, 1, 0, 0, 0);
      const startDateTimestamp = selectedMonthStartIST - offsetInMs;
      startDate = new Date(startDateTimestamp);

      // Calculate end date in UTC for the first day of the next month at 00:00 IST
      let nextMonthIndex = monthIndex + 1;
      let nextYear = year;
      if (nextMonthIndex > 11) {
        nextMonthIndex = 0;
        nextYear += 1;
      }
      const selectedMonthEndIST = new Date(nextYear, nextMonthIndex, 1, 0, 0, 0);
      const endTimestamp = selectedMonthEndIST - offsetInMs - 1;
      endDate = new Date(endTimestamp);
    } else {
      const range = DATE_RANGES[dateRange];
      startDate = range.days
        ? startOfDay(subDays(now, range.days))
        : startOfDay(new Date(0));
      endDate = endOfDay(now);
    }

    // Filter transactions within date range
    const filtered = transactions.filter(t => {
      const txDateUTC = new Date(t.date); // UTC timestamp from Supabase
      return txDateUTC >= startDate && txDateUTC <= endDate;
    });

    // Group transactions by date in IST
    const grouped = filtered.reduce((acc, transaction) => {
      // Convert UTC to IST using the updated function
      const istDateString = convertUTCtoIST(transaction.date);
      // Extract just the day and month for display
      const parts = istDateString.split(' ');
      const formattedDate = `${parts[0]} ${parts[1]}`;

      if (!acc[formattedDate]) {
        acc[formattedDate] = { date: formattedDate, income: 0, expense: 0 };
      }
      if (transaction.type === "INCOME") {
        acc[formattedDate].income += transaction.amount;
      } else {
        acc[formattedDate].expense += transaction.amount;
      }
      return acc;
    }, {});

    // Convert to array and sort by date
    return Object.values(grouped).sort(
      (a, b) => {
        const [dayA, monthA] = a.date.split(" ");
        const [dayB, monthB] = b.date.split(" ");
        
        const monthsOrder = {
          "Jan": 0, "Feb": 1, "Mar": 2, "Apr": 3, "May": 4, "Jun": 5, 
          "Jul": 6, "Aug": 7, "Sep": 8, "Oct": 9, "Nov": 10, "Dec": 11
        };
        
        const monthDiff = monthsOrder[monthA] - monthsOrder[monthB];
        return monthDiff === 0 ? parseInt(dayA) - parseInt(dayB) : monthDiff;
      }
    );
  }, [transactions, dateRange, selectedYear, selectedMonth]);

  const totals = useMemo(() => {
    return filteredData.reduce(
      (acc, day) => ({
        income: acc.income + day.income,
        expense: acc.expense + day.expense,
      }),
      { income: 0, expense: 0 }
    );
  }, [filteredData]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
        <CardTitle className="text-base font-normal">
          Transaction Overview
        </CardTitle>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select range">{DATE_RANGES[dateRange]?.label}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(DATE_RANGES).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {dateRange === "YM" && (
            <AnimatePresence>
              <motion.div 
                className="flex items-center gap-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Select value={selectedYear} onValueChange={handleYearSelect}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Year">{selectedYear}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {showMonthSelector ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Select value={selectedMonth} onValueChange={handleMonthSelect}>
                      <SelectTrigger className="w-[130px]">
                        <SelectValue placeholder="Month">Select Month</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {MONTHS.map((month) => (
                          <SelectItem key={month} value={month}>
                            {month}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center"
                  >
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{selectedMonth}</span>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-around mb-6 text-sm">
          <div className="text-center">
            <p className="text-muted-foreground">Total Income</p>
            <p className="text-lg font-bold text-green-500">
            ₹{totals.income.toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground">Total Expenses</p>
            <p className="text-lg font-bold text-red-500">
            ₹{totals.expense.toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground">Net</p>
            <p
              className={`text-lg font-bold ${
                totals.income - totals.expense >= 0
                  ? "text-green-500"
                  : "text-red-500"
              }`}
            >
              ₹{(totals.income - totals.expense).toFixed(2)}
            </p>
          </div>
        </div>
        <div className="h-[300px]">
          {filteredData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={filteredData}
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `₹${value}`}
                />
                <Tooltip
                  formatter={(value) => [`₹${value}`, undefined]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="income"
                  name="Income"
                  fill="#22c55e"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="expense"
                  name="Expense"
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No data available for the selected period
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}