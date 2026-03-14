"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    Cell,
    Pie,
    PieChart
} from "recharts";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Wallet, PieChart as PieIcon, Activity } from "lucide-react";
import { useMonthlyTrends } from "@/hooks/use-monthly-trends";
import { useCategoryBreakdown, useWealthDistribution } from "@/hooks/use-stats";
import { useState, useMemo } from "react";
import { SpendingHeatmap } from "./spending-heatmap";
import { useTransactions } from "@/hooks/use-transactions";
import { Transaction } from "@/lib/api-client";

interface DashboardChartsProps {
    startDate?: string;
    endDate?: string;
}

export function DashboardCharts({ startDate, endDate }: DashboardChartsProps) {
    const { transactions, isLoading: txLoading } = useTransactions(startDate, endDate);
    const { trends, isLoading: trendsLoading } = useMonthlyTrends();
    const { breakdown, isLoading: breakdownLoading } = useCategoryBreakdown();
    const { distribution, isLoading: distLoading } = useWealthDistribution();
    
    const [breakdownMode, setBreakdownMode] = useState<"expense" | "wealth">("expense");

    const monthlyData = useMemo(() => {
        if (trends.length > 0 && !startDate && !endDate) {
            return trends.map(t => ({
                name: new Date(t.month).toLocaleString('default', { month: 'short' }),
                income: t.income,
                expense: t.expense
            }));
        }

        // Fallback or FY filtered logic
        let months: string[] = [];
        if (startDate && endDate) {
            months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
        } else {
            const now = new Date();
            for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                months.push(d.toLocaleString('default', { month: 'short' }));
            }
        }

        const dataMap: Record<string, { income: number, expense: number }> = {};
        months.forEach(m => dataMap[m] = { income: 0, expense: 0 });

        transactions.forEach((t: Transaction) => {
            const date = new Date(t.date);
            const monthName = date.toLocaleString('default', { month: 'short' });
            if (dataMap[monthName]) {
                if (t.type === 'income') dataMap[monthName].income += t.amount;
                else dataMap[monthName].expense += t.amount;
            }
        });

        return months.map(m => ({
            name: m,
            income: dataMap[m].income,
            expense: dataMap[m].expense
        }));
    }, [transactions, trends, startDate, endDate]);

    const categoryData = useMemo(() => {
        const colors = ["#6366f1", "#8b5cf6", "#ec4899", "#3b82f6", "#10b981", "#f59e0b"];
        
        if (breakdownMode === "expense") {
            return breakdown.map((item, i) => ({
                name: item.category,
                value: item.amount,
                color: colors[i % colors.length]
            })).slice(0, 5);
        } else {
            return distribution.map((item, i) => ({
                name: item.type.charAt(0).toUpperCase() + item.type.slice(1),
                value: item.balance,
                color: colors[i % colors.length]
            }));
        }
    }, [breakdown, distribution, breakdownMode]);

    const isLoading = txLoading || trendsLoading || breakdownLoading || distLoading;

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-12 2xl:grid-cols-16">
            <Card className="lg:col-span-12 xl:col-span-5 2xl:col-span-6 border-0 shadow-lg bg-white/50 backdrop-blur-sm ring-1 ring-gray-100 dark:bg-gray-900/50 dark:ring-gray-800">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                             <Activity className="h-4 w-4 text-indigo-500" />
                             Cash Flow Performance
                        </CardTitle>
                    </div>
                    <Tabs defaultValue="area" className="w-[120px]">
                        <TabsList className="grid w-full grid-cols-2 bg-indigo-50/50">
                            <TabsTrigger value="area">Area</TabsTrigger>
                            <TabsTrigger value="bar">Bar</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </CardHeader>
                <CardContent>
                    <div className="h-[320px] w-full mt-4 flex items-center justify-center">
                        {trendsLoading ? (
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                                <p className="text-xs text-muted-foreground">Calculating trends...</p>
                            </div>
                        ) : monthlyData.every(d => d.income === 0 && d.expense === 0) ? (
                            <div className="text-center space-y-2">
                                <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full w-fit mx-auto">
                                    <Activity className="h-6 w-6 text-gray-400" />
                                </div>
                                <p className="text-sm text-muted-foreground italic">No cash flow activity recorded yet.</p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={monthlyData}>
                                    <defs>
                                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#9CA3AF', fontSize: 11 }}
                                        tickFormatter={(value) => value >= 1000 ? `₹${(value / 1000).toFixed(0)}k` : `₹${value}`}
                                    />
                                    <Tooltip
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="rounded-2xl border-0 bg-white/95 backdrop-blur-md p-4 shadow-2xl ring-1 ring-gray-100">
                                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{payload[0].payload.name}</p>
                                                        <div className="space-y-2">
                                                            <div className="flex items-center justify-between gap-8">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="h-2 w-2 rounded-full bg-indigo-500" />
                                                                    <span className="text-sm font-medium text-gray-600">Income</span>
                                                                </div>
                                                                <span className="font-bold text-indigo-700">₹{payload[0]?.value?.toLocaleString() || 0}</span>
                                                            </div>
                                                            <div className="flex items-center justify-between gap-8">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="h-2 w-2 rounded-full bg-rose-500" />
                                                                    <span className="text-sm font-medium text-gray-600">Expense</span>
                                                                </div>
                                                                <span className="font-bold text-rose-600">₹{payload[1]?.value?.toLocaleString() || 0}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            }
                                            return null
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="income"
                                        stroke="#6366f1"
                                        strokeWidth={4}
                                        fillOpacity={1}
                                        fill="url(#colorIncome)"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="expense"
                                        stroke="#f43f5e"
                                        strokeWidth={4}
                                        fillOpacity={1}
                                        fill="url(#colorExpense)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="lg:col-span-12 xl:col-span-3 2xl:col-span-4 h-full">
                <SpendingHeatmap transactions={transactions} isLoading={txLoading} />
            </div>

            <Card className="lg:col-span-12 xl:col-span-4 2xl:col-span-6 border-0 shadow-lg bg-white/50 backdrop-blur-sm ring-1 ring-gray-100 dark:bg-gray-900/50 dark:ring-gray-800">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        {breakdownMode === "expense" ? <PieIcon className="h-4 w-4 text-purple-500" /> : <Wallet className="h-4 w-4 text-emerald-500" />}
                        {breakdownMode === "expense" ? "Expense Split" : "Wealth Mix"}
                    </CardTitle>
                    <div className="flex bg-gray-100/50 p-1 rounded-lg ring-1 ring-gray-100">
                         <button 
                            onClick={() => setBreakdownMode("expense")}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${breakdownMode === "expense" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                         >
                            Spent
                         </button>
                         <button 
                            onClick={() => setBreakdownMode("wealth")}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${breakdownMode === "wealth" ? "bg-white text-emerald-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                         >
                            Wealth
                         </button>
                    </div>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center min-h-[350px]">
                    {breakdownLoading || distLoading ? (
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                            <p className="text-xs text-muted-foreground">Analyzing Breakdown...</p>
                        </div>
                    ) : categoryData.length === 0 ? (
                        <div className="text-center p-6 space-y-4">
                            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl w-fit mx-auto">
                                <PieIcon className="h-8 w-8 text-indigo-400" />
                            </div>
                            <div className="space-y-1">
                                <p className="font-bold text-gray-900 dark:text-gray-100">
                                    {breakdownMode === "expense" ? "No Expenses Yet" : "No Accounts Found"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {breakdownMode === "expense" 
                                        ? "Add transactions to see your spending patterns." 
                                        : "Link a Bank or Cash account to view your wealth distribution."}
                                </p>
                            </div>
                            <a 
                                href={breakdownMode === "expense" ? "/transactions" : "/ledgers"}
                                className="inline-block px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                {breakdownMode === "expense" ? "Add Transaction" : "Scale Your Accounts"}
                            </a>
                        </div>
                    ) : (
                        <>
                            <div className="h-[250px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={categoryData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={70}
                                            outerRadius={95}
                                            paddingAngle={8}
                                            dataKey="value"
                                            animationBegin={0}
                                            animationDuration={800}
                                        >
                                            {categoryData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    return (
                                                        <div className="rounded-2xl border-0 bg-white/95 backdrop-blur-md p-3 shadow-2xl ring-1 ring-gray-100">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: payload[0].payload.color }} />
                                                                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider font-mono">{payload[0].name}</span>
                                                            </div>
                                                            <span className="block font-black text-gray-800">₹{payload[0]?.value?.toLocaleString() || 0}</span>
                                                        </div>
                                                    )
                                                }
                                                return null
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="grid grid-cols-1 gap-2 w-full mt-6 px-4">
                                {categoryData.map((item) => (
                                    <div key={item.name} className="flex items-center group cursor-default">
                                        <div className="h-2 w-2 rounded-full transition-all group-hover:scale-150" style={{ backgroundColor: item.color }} />
                                        <span className="text-[11px] font-bold text-gray-500 ml-3 truncate uppercase tracking-tight">{item.name}</span>
                                        <span className="text-sm font-black ml-auto text-gray-900">₹{item.value.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
