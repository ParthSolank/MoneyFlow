"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Transaction } from "@/lib/api-client";
import { Flame, Info } from "lucide-react";

interface SpendingHeatmapProps {
    transactions: Transaction[];
    isLoading: boolean;
}

export function SpendingHeatmap({ transactions, isLoading }: SpendingHeatmapProps) {
    // Generate last 14 days of data for the heatmap
    const heatmapData = useMemo(() => {
        const days = [];
        const now = new Date();

        // Last 28 days (4 weeks)
        for (let i = 27; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            const dayTransactions = transactions.filter(t =>
                t.type === 'expense' && t.date.startsWith(dateStr)
            );

            const total = dayTransactions.reduce((sum, t) => sum + t.amount, 0);

            days.push({
                date: dateStr,
                displayDate: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
                total,
                count: dayTransactions.length,
                intensity: total > 5000 ? 4 : total > 2000 ? 3 : total > 500 ? 2 : total > 0 ? 1 : 0
            });
        }
        return days;
    }, [transactions]);

    const intensityColors = [
        "bg-gray-100 dark:bg-gray-800", // 0
        "bg-orange-100 dark:bg-orange-900/20 text-orange-600", // 1
        "bg-orange-300 dark:bg-orange-700/40 text-orange-700", // 2
        "bg-orange-500 dark:bg-orange-600/70 text-white", // 3
        "bg-orange-600 dark:bg-orange-500 text-white shadow-lg shadow-orange-500/20", // 4
    ];

    if (isLoading) return null;

    return (
        <Card className="h-full border-0 shadow-lg bg-white/50 backdrop-blur-sm ring-1 ring-gray-100 dark:bg-gray-900/50 dark:ring-gray-800 flex flex-col overflow-hidden">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Flame className="h-4 w-4 text-orange-500" />
                    Spending Heat
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <Info className="h-3 w-3 text-muted-foreground ml-1" />
                            </TooltipTrigger>
                            <TooltipContent>Intensity of expenses over the last 4 weeks</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center py-2">
                <div className="grid grid-cols-7 gap-1.5 mx-auto">
                    {heatmapData.map((day) => (
                        <TooltipProvider key={day.date}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div
                                        className={`h-7 w-7 rounded-md ${intensityColors[day.intensity]} transition-all hover:scale-110 cursor-pointer flex items-center justify-center text-[8px] font-bold`}
                                    >
                                        {day.total > 0 ? `${(day.total / 1000).toFixed(0)}k` : ""}
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                    <div className="text-xs">
                                        <p className="font-bold">{day.displayDate}</p>
                                        <p>Spent: ₹{day.total.toLocaleString()}</p>
                                        <p>Orders: {day.count}</p>
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    ))}
                </div>
                <div className="flex justify-between mt-4 px-2 text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
                    <span>Older</span>
                    <span>Today</span>
                </div>
            </CardContent>
        </Card>
    );
}
