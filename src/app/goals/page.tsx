"use client"

import { useState } from "react"
import { useGoals, Goal } from "@/hooks/use-goals"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Target, Plus, TrendingUp, Calendar, Trash2, Edit2, Wallet } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { motion, AnimatePresence } from "framer-motion"
import { format } from "date-fns"
import { GoalModal } from "@/components/goals/goal-modal"
import { GoalHistoryModal } from "@/components/goals/goal-history-modal"
import { useToast } from "@/hooks/use-toast"

export default function GoalsPage() {
  const { goals, isLoading, deleteGoal } = useGoals()
  const { toast } = useToast()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [historyGoal, setHistoryGoal] = useState<Goal | null>(null)

  const handleEdit = (e: React.MouseEvent, goal: Goal) => {
    e.stopPropagation()
    setEditingGoal(goal)
    setIsAddOpen(true)
  }

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    if (confirm("Are you sure you want to delete this goal?")) {
      try {
        await deleteGoal(id)
        toast({
          title: "Goal Deleted",
          description: "Goal has been removed successfully.",
        })
      } catch (error) {
        toast({
            title: "Error",
            description: "Failed to delete goal.",
            variant: "destructive"
          })
      }
    }
  }

  const handleClose = () => {
    setIsAddOpen(false)
    setEditingGoal(null)
  }

  const totalTarget = goals.reduce((acc, g) => acc + g.targetAmount, 0)
  const totalSaved = goals.reduce((acc, g) => acc + g.currentAmount, 0)
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Savings Goals</h1>
          <p className="text-gray-500 mt-1 text-sm font-medium">Track your financial dreams and stay motivated.</p>
        </div>
        <Button 
          onClick={() => setIsAddOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-100 rounded-xl px-6 h-12 gap-2"
        >
          <Plus className="w-5 h-5" />
          Add New Goal
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-emerald-600 text-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Target className="w-24 h-24" />
          </div>
          <CardHeader>
            <CardTitle className="text-lg font-bold opacity-90">Total Target</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">₹{totalTarget.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <p className="mt-2 text-sm text-emerald-100 font-medium">Across {goals.length} active goals</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white overflow-hidden relative group">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-gray-500">Total Saved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">₹{totalSaved.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <div className="mt-4 flex items-center gap-2">
              <Progress value={overallProgress} className="h-2 flex-1" />
              <span className="text-xs font-bold text-emerald-600">{overallProgress.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white overflow-hidden relative group">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-gray-500">Remaining</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">₹{(totalTarget - totalSaved).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <p className="mt-2 text-sm text-gray-400 font-medium italic">Keep pushing!</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {goals.map((goal, index) => (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                onClick={() => setHistoryGoal(goal)}
                className="border-none shadow-sm hover:shadow-xl transition-all duration-500 group rounded-[2.5rem] cursor-pointer overflow-hidden bg-white active:scale-95"
              >
                <div style={{ backgroundColor: goal.color }} className="h-2 w-full" />
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-emerald-600 transition-colors uppercase tracking-tight">{goal.title}</CardTitle>
                    <CardDescription className="text-xs font-medium uppercase tracking-wider">{goal.category || "General"}</CardDescription>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-gray-400 hover:text-emerald-600"
                      onClick={(e) => handleEdit(e, goal)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-gray-400 hover:text-rose-500"
                      onClick={(e) => handleDelete(e, goal.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="flex justify-between items-end mb-2">
                    <div className="space-y-1">
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Progress</p>
                      <p className="text-lg font-bold text-gray-900">
                        ₹{goal.currentAmount.toLocaleString()} <span className="text-sm text-gray-400 font-normal">of ₹{goal.targetAmount.toLocaleString()}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-emerald-600">
                        {goal.targetAmount > 0 ? ((goal.currentAmount / goal.targetAmount) * 100).toFixed(0) : '0'}%
                      </p>
                    </div>
                  </div>
                  <Progress value={goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0} className="h-3 rounded-full bg-gray-100" />
                  
                  <div className="mt-6 flex flex-col gap-3">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{goal.deadline ? format(new Date(goal.deadline), 'MMM d, yyyy') : "No Deadline"}</span>
                      </div>
                      {goal.deadline && (
                         <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                      )}
                    </div>
                    
                    {goal.ledger && (
                      <div className="flex items-center gap-2 py-2 px-3 bg-gray-50 rounded-xl border border-gray-100">
                        <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter truncate">
                          Linked: {goal.ledger.name}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {goals.length === 0 && !isLoading && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-4 bg-white rounded-3xl border-2 border-dashed border-gray-100">
            <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Target className="w-10 h-10" />
            </div>
            <div className="max-w-xs space-y-1">
              <h3 className="font-bold text-lg text-gray-900">No Goals Yet</h3>
              <p className="text-sm text-gray-500">Dreams without goals are just dreams. Start tracking yours today!</p>
            </div>
            <Button 
                onClick={() => setIsAddOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-100 px-8"
            >
                Create My First Goal
            </Button>
          </div>
        )}
      </div>

      <GoalModal 
        isOpen={isAddOpen} 
        onClose={handleClose} 
        goal={editingGoal}
      />
      <GoalHistoryModal
        isOpen={!!historyGoal}
        onClose={() => setHistoryGoal(null)}
        goal={historyGoal}
      />
    </div>
  )
}

/* aria-label */
