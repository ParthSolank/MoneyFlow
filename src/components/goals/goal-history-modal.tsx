"use client"

import { useGoalHistory, Goal, useGoals } from "@/hooks/use-goals"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { format } from "date-fns"
import { Wallet, Calendar, History, TrendingUp, Plus, Loader2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLedgers } from "@/hooks/use-ledgers"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

interface GoalHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  goal: Goal | null
}

export function GoalHistoryModal({ isOpen, onClose, goal }: GoalHistoryModalProps) {
  const { history, isLoading, mutate: mutateHistory } = useGoalHistory(goal?.id)
  const { addContribution } = useGoals()
  const { ledgers } = useLedgers()
  const { toast } = useToast()
  
  const [isAdding, setIsAdding] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    amount: "",
    ledgerId: goal?.ledgerId?.toString() || "",
    notes: ""
  })

  if (!goal) return null

  const handleAddContribution = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(formData.amount)
    if (!formData.amount || amount <= 0) return

    // Validation: Check if ledger has enough balance
    if (formData.ledgerId) {
      const selectedLedger = ledgers.find((l: any) => l.id.toString() === formData.ledgerId)
      if (selectedLedger && selectedLedger.accountType !== 'credit' && selectedLedger.balance < amount) {
        toast({
          title: "Insufficient Balance",
          description: `The selected account (${selectedLedger.name}) only has ₹${selectedLedger.balance.toLocaleString()}.`,
          variant: "destructive"
        })
        return
      }
    }

    setIsSubmitting(true)
    try {
      await addContribution(goal.id, {
        amount: parseFloat(formData.amount),
        ledgerId: formData.ledgerId ? parseInt(formData.ledgerId) : undefined,
        notes: formData.notes
      })
      
      toast({
        title: "Progress Added",
        description: `Added ₹${formData.amount} to ${goal.title}`,
      })
      
      mutateHistory()
      setIsAdding(false)
      setFormData({
        amount: "",
        ledgerId: goal.ledgerId?.toString() || "",
        notes: ""
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add progress",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0 rounded-3xl border-none shadow-2xl">
        <div className="p-6 pb-4" style={{ backgroundColor: `${goal.color}10` }}>
          <DialogHeader className="mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: goal.color }}>
                <History className="w-6 h-6" />
              </div>
              <div className="text-left">
                <DialogTitle className="text-2xl font-black text-gray-900">{goal.title}</DialogTitle>
                <DialogDescription className="font-bold text-gray-500 uppercase tracking-widest text-[10px]">
                  Saving History & Progress
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-2">
            <div className="flex justify-between items-end mb-2">
               <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Total Progress</p>
                  <p className="text-2xl font-black text-gray-900">
                    ₹{goal.currentAmount.toLocaleString()} 
                    <span className="text-sm font-medium text-gray-400 ml-2">of ₹{goal.targetAmount.toLocaleString()}</span>
                  </p>
               </div>
               <div className="text-right">
                  <span className="text-2xl font-black" style={{ color: goal.color }}>
                    {((goal.currentAmount / goal.targetAmount) * 100).toFixed(0)}%
                  </span>
               </div>
            </div>
            <Progress value={(goal.currentAmount / goal.targetAmount) * 100} className="h-2.5 rounded-full bg-gray-50" />
          </div>
        </div>

        <div className="p-6 pt-2 flex-1 overflow-y-auto">
          {!isAdding ? (
             <Button 
               onClick={() => setIsAdding(true)}
               className="w-full mb-6 h-12 rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-bold gap-2 transition-all hover:scale-[1.02] active:scale-95"
               variant="ghost"
             >
               <Plus className="w-5 h-5" />
               Add New Progress
             </Button>
          ) : (
            <form onSubmit={handleAddContribution} className="mb-8 p-5 rounded-2xl bg-gray-50 border border-gray-100 animate-in slide-in-from-top-4 duration-300">
               <h4 className="font-black text-gray-900 text-xs uppercase tracking-widest mb-4">New Entry</h4>
               <div className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <Label className="text-[10px] font-black text-gray-400 uppercase">Amount</Label>
                     <Input 
                        type="number" 
                        placeholder="0.00" 
                        value={formData.amount}
                        className="rounded-xl h-11 border-gray-100 font-bold focus:ring-emerald-600"
                        onChange={(e) => setFormData({...formData, amount: e.target.value})}
                        autoFocus
                     />
                   </div>
                   <div className="space-y-2">
                     <Label className="text-[10px] font-black text-gray-400 uppercase">Account</Label>
                     <Select value={formData.ledgerId} onValueChange={(v) => setFormData({...formData, ledgerId: v})}>
                        <SelectTrigger className="rounded-xl h-11 border-gray-100 font-bold focus:ring-emerald-600">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                           {ledgers.map((l: any) => (
                             <SelectItem key={l.id} value={l.id.toString()}>{l.name}</SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                   </div>
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black text-gray-400 uppercase">Notes (Optional)</Label>
                    <Input 
                       placeholder="What's this for?" 
                       value={formData.notes}
                       className="rounded-xl h-11 border-gray-100 font-medium focus:ring-emerald-600"
                       onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    />
                 </div>
                 <div className="flex gap-2 pt-2">
                    <Button type="button" variant="ghost" className="flex-1 rounded-xl font-bold h-11" onClick={() => setIsAdding(false)}>Cancel</Button>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold h-11 shadow-lg shadow-emerald-100"
                    >
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Progress"}
                    </Button>
                 </div>
               </div>
            </form>
          )}

          <div className="space-y-1">
            <h4 className="font-black text-gray-400 text-[10px] uppercase tracking-widest mb-4 flex items-center gap-2">
              <TrendingUp className="w-3 h-3" />
              Recent Contributions
            </h4>
            
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center p-8 opacity-20"><Loader2 className="w-8 h-8 animate-spin" /></div>
              ) : history.length === 0 ? (
                <div className="text-center py-10 px-6 rounded-3xl bg-gray-50 border-2 border-dashed border-gray-100">
                   <p className="text-gray-400 font-bold text-sm italic">No entries yet. Time to save!</p>
                </div>
              ) : (
                history.map((item, idx) => (
                  <div key={item.id} className="relative pl-6 pb-6 last:pb-0 group">
                    {/* Timeline Line */}
                    {idx !== history.length - 1 && (
                      <div className="absolute left-[7px] top-4 bottom-0 w-0.5 bg-gray-100 group-hover:bg-emerald-100 transition-colors" />
                    )}
                    
                    {/* Timeline Dot */}
                    <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-white bg-gray-200 group-hover:bg-emerald-600 transition-all z-10" />
                    
                    <div className="bg-white group-hover:bg-gray-50 transition-all p-4 rounded-2xl border border-transparent group-hover:border-gray-100 group-hover:shadow-sm">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-lg font-black text-gray-900">₹{item.amount.toLocaleString()}</p>
                        <time className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                          {format(new Date(item.contributionDate), 'MMM d, yyyy • p')}
                        </time>
                      </div>
                      <div className="flex flex-wrap gap-3 items-center mt-2">
                        {item.ledger && (
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100/50">
                            <Wallet className="w-3 h-3" />
                            <span className="text-[10px] font-black uppercase tracking-tight">{item.ledger.name}</span>
                          </div>
                        )}
                        {item.notes && (
                           <p className="text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                             "{item.notes}"
                           </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* aria-label */
