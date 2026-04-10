"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Wallet, PiggyBank, TrendingUp, Plus, MoreVertical, ArrowRight, CreditCard, Banknote, Pencil, Trash2, Loader2, Info } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { Ledger, ledgerApi } from "@/lib/supabase-client"
import { motion, AnimatePresence } from "framer-motion"

const iconMap: Record<string, any> = {
  Wallet,
  PiggyBank,
  TrendingUp,
  CreditCard,
  Banknote
}

import { useAuth } from "@/context/auth-context"
import { usePermissions } from "@/hooks/use-permissions"

export default function LedgersPage() {
  const { user } = useAuth()
  const { canCreate, canEdit, canDelete } = usePermissions();

  const [ledgers, setLedgers] = useState<Ledger[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingLedger, setEditingLedger] = useState<Ledger | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    balance: "",
    initialBalance: "",
    icon: "Wallet"
  })

  // Fetch ledgers from API
  const fetchLedgers = async (backgroundRefresh = false) => {
    if (!backgroundRefresh) setIsLoading(true)
    console.log("[LedgersPage] Fetching ledgers...");
    try {
      const data = await ledgerApi.getAll()
      console.log("[LedgersPage] Received ledgers:", data);
      setLedgers(data)
    } catch (error) {
      console.error("[LedgersPage] Fetch error:", error);
      toast({ variant: "destructive", title: "Failed to load ledgers" })
    } finally {
      if (!backgroundRefresh) setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLedgers()
  }, [])

  // Force body to unlock when dialogs close (Fixes Radix UI pointer lock bug)
  useEffect(() => {
    if (!isAddOpen && !isEditOpen) {
      const timer = setTimeout(() => {
        document.body.style.pointerEvents = ""
        document.body.style.overflow = ""
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [isAddOpen, isEditOpen])

  const handleCreateLedger = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.balance) {
      toast({ variant: "destructive", title: "Required Fields Missing" })
      return
    }

    setIsSubmitting(true)
    const accountType = formData.icon === 'CreditCard' ? 'credit' : 'bank';

    try {
      const createdLedger = await ledgerApi.create({
        name: formData.name,
        description: formData.description,
        balance: parseFloat(formData.balance),
        icon: formData.icon,
        accountType: accountType as 'bank' | 'credit'
      })

      setLedgers(prev => [...prev, createdLedger])

      toast({
        title: "Ledger Created",
        description: `${formData.name} is now active.`,
        className: "bg-green-50 border-green-200 text-green-900"
      })

      setIsAddOpen(false)
      resetForm()
    } catch (err) {
      toast({ variant: "destructive", title: "Failed to create ledger" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditLedger = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingLedger || !formData.name || !editingLedger.id) return

    setIsSubmitting(true)
    const accountType = formData.icon === 'CreditCard' ? 'credit' : 'bank';

    try {
      const updateData = {
        ...editingLedger,
        name: formData.name,
        description: formData.description,
        balance: parseFloat(formData.balance),
        initialBalance: parseFloat(formData.initialBalance),
        icon: formData.icon,
        accountType: accountType as 'bank' | 'credit'
      };

      await ledgerApi.update(editingLedger.id, updateData)

      setLedgers(prev => prev.map(l => l.id === editingLedger.id ? { ...l, ...updateData } : l))

      toast({ title: "Ledger Updated" })
      setIsEditOpen(false)
      setEditingLedger(null)
      resetForm()
    } catch (err) {
      toast({ variant: "destructive", title: "Failed to update ledger" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteLedger = async (id: string | number) => {
    try {
      if (!id) return;
      await ledgerApi.delete(id.toString())
      setLedgers(prev => prev.filter(l => l.id !== id))
      toast({ title: "Ledger Removed" })
    } catch (err) {
      toast({ variant: "destructive", title: "Failed to delete ledger" })
    }
  }

  const openEdit = (l: Ledger) => {
    setEditingLedger(l)
    setFormData({ 
      name: l.name, 
      description: l.description || "", 
      balance: (l.balance || 0).toString(), 
      initialBalance: (l.initialBalance || l.balance || 0).toString(),
      icon: l.icon 
    })
    setIsEditOpen(true)
  }

  const resetForm = () => setFormData({ name: "", description: "", balance: "", initialBalance: "", icon: "Wallet" })

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8 p-1 pb-24"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400">Accounts & Ledgers</h1>
          <p className="text-muted-foreground mt-1">Manage your banking and credit accounts in ₹.</p>
        </div>
        {canCreate("CORE", "LEDGERS") && (
          <Button
            className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all"
            onClick={() => setIsAddOpen(true)}
          >
            <Plus className="h-4 w-4" />
            New Ledger
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-0 shadow-sm bg-white/50 h-[200px] flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-200" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {ledgers.length === 0 && !isLoading ? (
              <div className="col-span-full text-center py-10 text-muted-foreground">
                <p>No accounts found. Create one to get started.</p>
              </div>
            ) : (
              ledgers.map((l, index) => {
                const IconComp = iconMap[l.icon] || Wallet
                const isCredit = l.icon === 'CreditCard';
                const displayBalance = l.balance || 0;

                return (
                  <motion.div
                    key={l.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/50 backdrop-blur-sm ring-1 ring-gray-100 dark:bg-gray-900/50 dark:ring-gray-800 group relative overflow-hidden h-full flex flex-col">
                      <div className={`absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500 pointer-events-none`}>
                        <IconComp className={`h-32 w-32 ${isCredit ? 'text-purple-600' : 'text-indigo-600'}`} />
                      </div>

                      <div className="absolute top-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/50"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canEdit("CORE", "LEDGERS") && (
                              <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setTimeout(() => openEdit(l), 10); }}>
                                <Pencil className="h-4 w-4 mr-2" /> Rename
                              </DropdownMenuItem>
                            )}
                            {canDelete("CORE", "LEDGERS") && (
                              <DropdownMenuItem onSelect={(e) => { e.preventDefault(); if (l.id) handleDeleteLedger(l.id); }} className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <CardHeader className="pb-2">
                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-3 shadow-sm ${isCredit
                          ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
                          : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
                          }`}>
                          <IconComp className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">{l.name}</CardTitle>
                        {l.description && <p className="text-sm text-muted-foreground line-clamp-1">{l.description}</p>}
                      </CardHeader>

                      <CardContent className="flex-1">
                        <div className="mt-2">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Current Balance</p>
                          <div className={`text-2xl font-bold ${displayBalance < 0 ? 'text-rose-500' : 'text-gray-900 dark:text-gray-100'}`}>
                            ₹{displayBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            (Includes Initial Balance: ₹{(l.initialBalance ?? l.balance ?? 0).toLocaleString('en-IN')})
                          </p>
                        </div>
                      </CardContent>

                      <CardFooter className="border-t border-gray-100/50 bg-gray-50/30 dark:bg-gray-800/30 px-6 py-3">
                        <Button variant="ghost" asChild className="p-0 h-auto text-indigo-600 hover:text-indigo-700 hover:bg-transparent font-medium text-sm group/btn">
                          <Link href={`/ledgers/${l.id}`} className="flex items-center">
                            View Details
                            <ArrowRight className="h-3 w-3 ml-1 transform group-hover/btn:translate-x-1 transition-transform" />
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                )
              })
            )}
          </AnimatePresence>

          {canCreate("CORE", "LEDGERS") && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Button
                variant="outline"
                className="w-full h-full min-h-[220px] border-dashed border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50/50 flex flex-col gap-2 text-muted-foreground transition-all rounded-xl"
                onClick={() => setIsAddOpen(true)}
              >
                <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                  <Plus className="h-6 w-6 text-gray-400" />
                </div>
                <span className="font-semibold text-gray-900">Add New Ledger</span>
                <span className="text-xs text-center px-4">Track another bank account or credit card</span>
              </Button>
            </motion.div>
          )}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleCreateLedger}>
            <DialogHeader>
              <DialogTitle>Create Ledger</DialogTitle>
              <DialogDescription>Add a new account to track.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Account Name</Label>
                <Input id="name" placeholder="HDFC Savings, SBI, etc." value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="balance">Initial Balance (₹)</Label>
                <Input id="balance" type="number" placeholder="0.00" value={formData.balance} onChange={e => setFormData({ ...formData, balance: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Account Type</Label>
                <Select value={formData.icon} onValueChange={v => setFormData({ ...formData, icon: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Wallet">Bank Account</SelectItem>
                    <SelectItem value="CreditCard">Credit Card</SelectItem>
                    <SelectItem value="Banknote">Cash Wallet</SelectItem>
                    <SelectItem value="PiggyBank">Savings/Investment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="desc">Description (Optional)</Label>
                <Textarea id="desc" placeholder="Primary expenses account..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : "Create Account"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <form onSubmit={handleEditLedger}>
            <DialogHeader><DialogTitle>Edit Ledger</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input id="edit-name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="grid gap-2 opacity-60">
                <Label htmlFor="edit-balance">Current Tracking Balance (Auto-calculated)</Label>
                <Input id="edit-balance" type="number" value={formData.balance} onChange={e => setFormData({ ...formData, balance: e.target.value })} />
                <p className="text-[10px] text-muted-foreground italic">Note: Editing this will force-override your ledger's real-time balance.</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-initial">Initial (Starting) Balance (₹)</Label>
                <Input id="edit-initial" type="number" value={formData.initialBalance} onChange={e => setFormData({ ...formData, initialBalance: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-type">Type</Label>
                <Select value={formData.icon} onValueChange={v => setFormData({ ...formData, icon: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Wallet">Bank Account</SelectItem>
                    <SelectItem value="CreditCard">Credit Card</SelectItem>
                    <SelectItem value="Banknote">Cash Wallet</SelectItem>
                    <SelectItem value="PiggyBank">Savings</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-desc">Description</Label>
                <Textarea id="edit-desc" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
