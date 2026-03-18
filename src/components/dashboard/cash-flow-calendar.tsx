"use client"

import { useState, useMemo } from "react"
import { Transaction } from "@/lib/api-client"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTransactions } from "@/hooks/use-transactions"
import { useLedgers } from "@/hooks/use-ledgers"
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns"
import { Calendar as CalendarIcon, TrendingUp, TrendingDown, Wallet, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function CashFlowCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const { transactions } = useTransactions()
  const { ledgers } = useLedgers()

  const currentBalance = useMemo(() => ledgers.reduce((acc, l) => acc + (l.balance || 0), 0), [ledgers])

  // Simple projection logic:
  // For the selected day, show transactions that happened and sum them up starting from current balance
  // This is a simplified version. A real version would project recurring tx into the future.
  
  const selectedDayTransactions = useMemo(() => {
    if (!date) return []
    const dateStr = format(date, 'yyyy-MM-dd')
    return transactions.filter((t: Transaction) => t.date === dateStr)
  }, [date, transactions])

  const dayTotal = selectedDayTransactions.reduce((acc: number, t: Transaction) => acc + (t.type === 'income' ? t.amount : -t.amount), 0)

  return (
    <Card className="border-0 shadow-lg bg-white/50 backdrop-blur-sm ring-1 ring-gray-100 overflow-hidden">
      <CardHeader className="border-b border-gray-50 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-2 bg-blue-100 rounded-lg">
            <CalendarIcon className="h-5 w-5 text-blue-600" />
          </div>
          Cash Flow Calendar
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex flex-col md:flex-row h-full lg:h-[400px]">
        <div className="p-4 border-r border-gray-50 bg-gray-50/30">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-xl border-none p-0"
            classNames={{
                day_today: "bg-emerald-100 text-emerald-900 font-bold rounded-lg",
                day_selected: "bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg",
            }}
          />
        </div>
        
        <div className="flex-1 flex flex-col bg-white">
          <div className="p-6 border-b border-gray-50">
            <div className="flex items-center justify-between mb-2">
               <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{date ? format(date, 'MMMM d, yyyy') : 'Select a date'}</span>
               {dayTotal !== 0 && (
                  <Badge className={cn(
                    "rounded-md",
                    dayTotal > 0 ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                  )}>
                    {dayTotal > 0 ? '+' : ''}₹{Math.abs(dayTotal).toLocaleString()}
                  </Badge>
               )}
            </div>
            <div className="flex items-baseline gap-2">
               <h3 className="text-2xl font-black text-gray-900 leading-none">Activity</h3>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
            {selectedDayTransactions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-2 opacity-40 py-10">
                <Wallet className="h-8 w-8" />
                <p className="text-sm font-medium">No activity on this day</p>
              </div>
            ) : (
              selectedDayTransactions.map((tx: Transaction) => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn(
                      "p-2 rounded-lg",
                      tx.type === 'income' ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                    )}>
                      {tx.type === 'income' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{tx.description}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{tx.category}</p>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className={cn(
                      "text-sm font-black",
                      tx.type === 'income' ? "text-emerald-600" : "text-rose-600"
                    )}>
                      {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 bg-gray-50/50 mt-auto">
             <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Total Balance</span>
                <span className="text-lg font-black text-emerald-600">₹{currentBalance.toLocaleString()}</span>
             </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/* aria-label */
