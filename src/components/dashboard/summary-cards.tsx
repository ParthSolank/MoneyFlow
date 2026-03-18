"use client";

import { Card, CardContent } from "@/components/ui/card"
import { Wallet, ArrowUpCircle, ArrowDownCircle, Percent, TrendingUp, Loader2 } from "lucide-react"
import { useStats } from "@/hooks/use-stats";

interface SummaryCardsProps {
  startDate?: string;
  endDate?: string;
}

export function SummaryCards({ startDate, endDate }: SummaryCardsProps) {
  const { summary, isLoading } = useStats(startDate, endDate);

  const stats = [
    {
      title: "Total Balance",
      value: `₹${(summary.totalBalance ?? summary.balance).toLocaleString('en-IN')}`,
      description: "Available across all accounts",
      icon: Wallet,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-100 dark:bg-indigo-900/30",
      trend: (summary.totalBalance ?? summary.balance) >= 0 ? "up" : "down"
    },
    {
      title: "Monthly Income",
      value: `₹${summary.totalIncome.toLocaleString('en-IN')}`,
      description: "Real-time earnings tracked",
      icon: ArrowUpCircle,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-100 dark:bg-emerald-900/30",
      trend: "up"
    },
    {
      title: "Monthly Expenses",
      value: `₹${summary.totalExpenses.toLocaleString('en-IN')}`,
      description: `${summary.totalIncome > 0 ? ((summary.totalExpenses / summary.totalIncome) * 100).toFixed(1) : 0}% of income`,
      icon: ArrowDownCircle,
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-100 dark:bg-rose-900/30",
      trend: "down"
    },
    {
      title: "Savings Rate",
      value: `${summary.totalIncome > 0 ? (((summary.totalIncome - summary.totalExpenses) / summary.totalIncome) * 100).toFixed(1) : 0}%`,
      description: "Goal: 70%",
      icon: Percent,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-100 dark:bg-blue-900/30",
      trend: "neutral"
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white/50 backdrop-blur-sm ring-1 ring-gray-100 dark:bg-gray-900/50 dark:ring-gray-800 overflow-hidden relative group">
          <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500`}>
            <stat.icon className={`h-24 w-24 ${stat.color}`} />
          </div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                {isLoading ? <Loader2 className={`h-4 w-4 animate-spin ${stat.color}`} /> : <stat.icon className={`h-4 w-4 ${stat.color}`} />}
              </div>
            </div>
            <div className="text-2xl font-bold mt-2 text-gray-900 dark:text-gray-100 uppercase tracking-tight">
              {isLoading ? (
                <div className="h-8 w-24 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-md" />
              ) : stat.value}
            </div>
            <p className="text-xs text-muted-foreground mt-2 font-medium">
              {isLoading ? "Syncing..." : stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/* aria-label */
