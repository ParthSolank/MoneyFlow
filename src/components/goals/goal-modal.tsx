"use client"

import { useState } from "react"
import { useGoals, Goal } from "@/hooks/use-goals"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Target, Calendar as CalendarIcon, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useSmartInsights } from "@/hooks/use-goals"
import { useLedgers } from "@/hooks/use-ledgers"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import React from "react" // Added React import for useEffect

interface GoalModalProps {
  isOpen: boolean
  onClose: () => void
  goal?: Goal | null
}

export function GoalModal({ isOpen, onClose, goal }: GoalModalProps) {
  const isEdit = !!goal;
  const { createGoal, updateGoal } = useGoals()
  const { mutate: mutateInsights } = useSmartInsights()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    targetAmount: "",
    currentAmount: "0",
    deadline: "",
    category: "",
    color: "#4f46e5",
    ledgerId: ""
  })
  
  const { ledgers } = useLedgers()

  // Sync form with goal prop when editing
  React.useEffect(() => {
    if (goal) {
      setFormData({
        title: goal.title,
        targetAmount: goal.targetAmount.toString(),
        currentAmount: goal.currentAmount.toString(),
        deadline: goal.deadline ? goal.deadline.split('T')[0] : "",
        category: goal.category || "",
        color: goal.color || "#4f46e5",
        ledgerId: goal.ledgerId?.toString() || ""
      })
    } else {
      setFormData({
        title: "",
        targetAmount: "",
        currentAmount: "0",
        deadline: "",
        category: "",
        color: "#4f46e5",
        ledgerId: ""
      })
    }
  }, [goal, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const target = parseFloat(formData.targetAmount)
    const current = parseFloat(formData.currentAmount || "0")

    if (!formData.title || isNaN(target) || target <= 0) {
      toast({
        title: "Validation Error",
        description: "Please provide a valid title and positive target amount.",
        variant: "destructive"
      })
      return
    }

    if (current > target) {
      toast({
        title: "Validation Error",
        description: "Starting amount cannot be greater than target amount.",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    try {
      const data = {
        title: formData.title,
        targetAmount: parseFloat(formData.targetAmount),
        currentAmount: parseFloat(formData.currentAmount),
        deadline: formData.deadline || undefined,
        category: formData.category,
        color: formData.color,
        ledgerId: formData.ledgerId ? parseInt(formData.ledgerId) : undefined
      }

      if (isEdit && goal) {
        await updateGoal(goal.id, data)
        toast({
            title: "Goal Updated",
            description: "Your savings goal has been updated successfully.",
        })
      } else {
        await createGoal(data)
        toast({
            title: "Goal Created",
            description: "Your new savings goal has been set successfully.",
        })
      }

      // Refresh both goals and insights
      mutateInsights()
      
      onClose()
      setFormData({
        title: "",
        targetAmount: "",
        currentAmount: "0",
        deadline: "",
        category: "",
        color: "#4f46e5",
        ledgerId: ""
      })
    } catch (error: any) {
      console.error("Failed to create goal:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create goal. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] rounded-2xl">
        <DialogHeader>
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
            <Target className="w-6 h-6" />
          </div>
          <DialogTitle className="text-2xl font-bold">{isEdit ? "Edit Savings Goal" : "Add Savings Goal"}</DialogTitle>
          <DialogDescription className="font-medium text-gray-500">
            {isEdit ? "Update your target progress and goal details." : "Set a new target and track your progress towards it."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-bold uppercase tracking-wider text-gray-400">Goal Title</Label>
            <Input
              id="title"
              placeholder="e.g. New Car, Emergency Fund"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="rounded-xl border-gray-100 focus:ring-emerald-600 h-11"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-bold uppercase tracking-wider text-gray-400">Linked Account (Ledger)</Label>
            <Select 
                value={formData.ledgerId} 
                onValueChange={(val) => setFormData({ ...formData, ledgerId: val })}
            >
                <SelectTrigger className="rounded-xl border-gray-100 focus:ring-emerald-600 h-11">
                    <SelectValue placeholder="Select an account" />
                </SelectTrigger>
                <SelectContent>
                    {ledgers.map((ledger: any) => (
                        <SelectItem key={ledger.id} value={ledger.id.toString()}>
                            {ledger.name} (₹{ledger.balance.toLocaleString()})
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="target" className="text-sm font-bold uppercase tracking-wider text-gray-400">Target Amount</Label>
              <Input
                id="target"
                type="number"
                placeholder="0.00"
                value={formData.targetAmount}
                onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                required
                className="rounded-xl border-gray-100 focus:ring-emerald-600 h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="current" className="text-sm font-bold uppercase tracking-wider text-gray-400">Starting Amount</Label>
              <Input
                id="current"
                type="number"
                placeholder="0.00"
                value={formData.currentAmount}
                onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
                className="rounded-xl border-gray-100 focus:ring-emerald-600 h-11"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deadline" className="text-sm font-bold uppercase tracking-wider text-gray-400">Deadline</Label>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="rounded-xl border-gray-100 focus:ring-emerald-600 h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm font-bold uppercase tracking-wider text-gray-400">Category</Label>
              <Input
                id="category"
                placeholder="e.g. Travel, Life"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="rounded-xl border-gray-100 focus:ring-emerald-600 h-11"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="color" className="text-sm font-bold uppercase tracking-wider text-gray-400">Theme Color</Label>
            <div className="flex gap-3">
              {["#4f46e5", "#10b981", "#db2777", "#ea580c", "#16a34a", "#0891b2"].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: c })}
                  className={cn(
                    "w-8 h-8 rounded-full transition-all ring-offset-2",
                    formData.color === c ? "ring-2 ring-emerald-600 scale-110" : "hover:scale-105"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <DialogFooter className="pt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="rounded-xl h-12 font-bold px-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-12 font-bold px-8 shadow-lg shadow-emerald-100 flex-1 sm:flex-none"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (isEdit ? "Update Goal" : "Create Goal")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
