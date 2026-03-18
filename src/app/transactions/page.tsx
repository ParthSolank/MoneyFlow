"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Filter, Loader2, ArrowUpRight, ArrowDownRight, Wallet, CreditCard, Banknote, FileDown, Info, UploadCloud, FileText, MoreHorizontal, Pencil, Trash2, ReceiptText } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Transaction, Ledger, Category, transactionApi, categoryApi } from "@/lib/api-client";
import { useTransactions } from "@/hooks/use-transactions";
import { exportTransactionsToCSV } from "@/lib/export-utils";
import { FYSelector } from "@/components/fy-selector";
import { getCurrentFinancialYear } from "@/lib/financial-year-utils";

import { useAuth } from "@/context/auth-context";
import { usePermissions } from "@/hooks/use-permissions";

export default function TransactionsPage() {
  const { user } = useAuth();
  const { canCreate, canEdit, canDelete } = usePermissions();

  const [selectedFY, setSelectedFY] = useState(getCurrentFinancialYear());
  const [currentPage, setCurrentPage] = useState(1);
  const { transactions, isLoading, mutate, totalPages } = useTransactions(selectedFY.startDate, selectedFY.endDate, currentPage);
  const [searchTerm, setSearchTerm] = useState("")

  // Form State
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [ledgers, setLedgers] = useState<Ledger[]>([])
  const [dbCategories, setDbCategories] = useState<Category[]>([])
  const [importLedgerId, setImportLedgerId] = useState<string>("none")
  const [importFile, setImportFile] = useState<File | null>(null)

  const [editingId, setEditingId] = useState<number | null>(null)

  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    type: "expense",
    category: "",
    paymentMethod: "bank",
    ledgerId: "",
    date: new Date().toISOString().split('T')[0]
  })

  const [filterType, setFilterType] = useState<string>("all")
  const [filterPayment, setFilterPayment] = useState<string>("all")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [filterLedger, setFilterLedger] = useState<string>("all")

  const { toast } = useToast()

  // Reset page on filter change (#32)
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, filterPayment, filterCategory, filterLedger, selectedFY]);

  useEffect(() => {
    import("@/lib/api-client").then(({ ledgerApi, categoryApi }) => {
      ledgerApi.getAll().then((data) => {
        setLedgers(data);
      }).catch(console.error);

      categoryApi.getAll().then((data) => {
        setDbCategories(data);
      }).catch(console.error);
    });
  }, [])

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t: Transaction) => {
      if (!t) return false;

      const desc = (t.description || "").toLowerCase();
      const cat = (t.category || "").toLowerCase();
      const search = searchTerm.toLowerCase();

      const matchesSearch = desc.includes(search) || cat.includes(search);
      const matchesType = filterType === "all" || t.type === filterType;
      const matchesPayment = filterPayment === "all" || t.paymentMethod === filterPayment;
      const matchesCategory = filterCategory === "all" || t.category === filterCategory;
      const matchesLedger = filterLedger === "all" || t.ledgerId?.toString() === filterLedger;

      return matchesSearch && matchesType && matchesPayment && matchesCategory && matchesLedger;
    });
  }, [transactions, searchTerm, filterType, filterPayment, filterCategory, filterLedger]);

  const { totalDebit, totalCredit, startingBalance, finalBalance } = useMemo(() => {
    const debit = filteredTransactions.reduce((acc: number, tx: Transaction) => tx.type === 'expense' ? acc + tx.amount : acc, 0);
    const credit = filteredTransactions.reduce((acc: number, tx: Transaction) => tx.type === 'income' ? acc + tx.amount : acc, 0);

    const involvedLedgerIds = new Set(filteredTransactions.map((t: Transaction) => t.ledgerId?.toString()).filter(Boolean));
    const currentTotalBalance = ledgers
      .filter(l => l.id && involvedLedgerIds.has(l.id.toString()))
      .reduce((acc, l) => acc + (l.balance || 0), 0);

    // Set Final Balance to current ledger state and back-calculate Opening
    const finalBal = currentTotalBalance;
    const startingBal = finalBal - credit + debit;

    return { totalDebit: debit, totalCredit: credit, startingBalance: startingBal, finalBalance: finalBal };
  }, [filteredTransactions, ledgers]);

  // Calculate the running balance for each row (assuming descending order by date)
  const transactionsWithBalance = useMemo(() => {
    let currentBal = finalBalance;
    return filteredTransactions.map((tx: Transaction) => {
      const balanceForThisRow = currentBal;
      // Un-apply this row to get the balance for the next (older) row
      if (tx.type === 'income') currentBal -= tx.amount;
      else currentBal += tx.amount;
      return { ...tx, runningBalance: balanceForThisRow };
    });
  }, [filteredTransactions, finalBalance]);

  // Clear filters helper
  const clearFilters = () => {
    setFilterType("all")
    setFilterPayment("all")
    setFilterCategory("all")
    setFilterLedger("all")
    setSearchTerm("")
  }

  // Helper to get unique categories for filter
  const uniqueCategories = Array.from(new Set(transactions.map((t: Transaction) => t.category))).filter(Boolean) as string[];


  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.description.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Description is required.",
      })
      return
    }

    const amount = parseFloat(formData.amount)
    if (isNaN(amount) || amount <= 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Amount must be a positive number.",
      })
      return
    }

    if (!formData.category) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Category is required.",
      })
      return
    }

    if (!formData.ledgerId) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Account is required.",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        ...formData,
        amount: amount,
        type: formData.type as 'income' | 'expense',
        paymentMethod: formData.paymentMethod as 'bank' | 'credit' | 'cash',
        ledgerId: parseInt(formData.ledgerId)
      };

      if (editingId) {
        await transactionApi.update(editingId, payload);
        toast({
          title: "Success",
          description: "Transaction updated successfully.",
          className: "bg-green-50 border-green-200 text-green-900",
        });
      } else {
        await transactionApi.create(payload)
        toast({
          title: "Success",
          description: "Transaction added successfully.",
          className: "bg-green-50 border-green-200 text-green-900",
        })
      }

      // Refresh list and close dialog
      mutate()
      setIsOpen(false)
      // Reset form
      setEditingId(null)
      setFormData({
        description: "",
        amount: "",
        type: "expense",
        category: "",
        paymentMethod: "bank",
        ledgerId: "",
        date: new Date().toISOString().split('T')[0]
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${editingId ? 'update' : 'add'} transaction.`,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (tx: Transaction) => {
    if (!tx.id) return;
    setEditingId(tx.id);
    setFormData({
      description: tx.description,
      amount: tx.amount.toString(),
      type: tx.type,
      category: tx.category,
      paymentMethod: tx.paymentMethod,
      ledgerId: tx.ledgerId?.toString() || "",
      date: tx.date
    });
    // Delay opening to allow DropdownMenu to finish its closing animation completely
    setTimeout(() => setIsOpen(true), 350);
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this transaction?")) return;

    try {
      await transactionApi.delete(id);
      toast({ title: "Deleted", description: "Transaction removed successfully." });
      mutate();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: "Could not delete the transaction." });
    }
  }

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return;

    try {
      setIsImporting(true);
      const ledgerIdParam = importLedgerId && importLedgerId !== "none" ? Number(importLedgerId) : undefined;
      await transactionApi.importFile(importFile, ledgerIdParam);
      toast({ title: "Success", description: "Transactions imported successfully from file." });
      mutate();
      setIsImportOpen(false);
      setImportFile(null);
      setImportLedgerId("none");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Import Failed", description: error.message });
    } finally {
      setIsImporting(false);
    }
  };

  const handlePdfDownload = async (id: number) => {
    try {
      const blob = await transactionApi.generatePdf(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Transaction_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({ variant: "destructive", title: "Failed to generate PDF" });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8 p-1 pb-24"
    >
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-emerald-600/20 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/70 backdrop-blur-2xl p-8 rounded-3xl ring-1 ring-gray-200/50 shadow-2xl dark:bg-gray-950/70 dark:ring-gray-800">
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <div className="p-3.5 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-200 dark:shadow-none animate-pulse">
                <ReceiptText className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tighter text-gray-900 dark:text-gray-100 uppercase">
                  Cash <span className="text-indigo-600">Flow</span>
                </h1>
                <p className="text-muted-foreground font-medium text-sm">
                  Systematic tracking of your financial footprint
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white/50 dark:bg-gray-900/50 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center gap-3 pr-4">
              <div className="h-8 w-8 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Filter className="h-4 w-4 text-gray-500" />
              </div>
              <FYSelector value={selectedFY} onValueChange={setSelectedFY} />
            </div>

            <div className="flex items-center gap-2">
              <Dialog open={isImportOpen} onOpenChange={(open) => {
                setIsImportOpen(open);
                if (!open) document.body.style.pointerEvents = "auto";
              }}>
                <DialogTrigger asChild>
                  {canCreate("CORE", "TRANSACTIONS") && (
                    <Button variant="outline" className="h-12 px-5 rounded-2xl border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all font-bold gap-2" disabled={isImporting}>
                      <UploadCloud className="h-4 w-4" />
                      Import
                    </Button>
                  )}
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] rounded-3xl">
                  <form onSubmit={handleImportSubmit}>
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-black uppercase tracking-tight">Bulk Import</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-6 py-6">
                      <div className="grid gap-2">
                        <Label className="text-xs font-bold uppercase text-gray-400">Target Ledger</Label>
                        <Select value={importLedgerId} onValueChange={setImportLedgerId}>
                          <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="No specific ledger" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">General Pool</SelectItem>
                            {ledgers.map(l => (
                              <SelectItem key={l.id} value={l.id?.toString() || ""}>{l.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-xs font-bold uppercase text-gray-400">Statement File</Label>
                        <div className="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl p-8 text-center hover:border-indigo-400 transition-colors">
                          <Input type="file" id="file-upload" className="hidden" accept=".csv, .xls, .xlsx" onChange={(e) => setImportFile(e.target.files?.[0] || null)} />
                          <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                            <FileDown className="h-8 w-8 text-gray-300" />
                            <span className="text-sm font-semibold">{importFile ? importFile.name : "Click to select CSV/Excel"}</span>
                          </label>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={isImporting || !importFile} className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold uppercase tracking-widest text-xs">
                        {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Start Processing"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              <Button
                variant="outline"
                className="h-12 px-5 rounded-2xl border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all font-bold gap-2"
                onClick={() => exportTransactionsToCSV(transactions)}
                disabled={transactions.length === 0}
              >
                <FileDown className="h-4 w-4" />
                Export
              </Button>

              <Dialog open={isOpen} onOpenChange={(open) => {
                setIsOpen(open);
                if (!open) {
                  setEditingId(null);
                  setFormData({
                    description: "",
                    amount: "",
                    type: "expense",
                    category: "",
                    paymentMethod: "bank",
                    ledgerId: "",
                    date: new Date().toISOString().split('T')[0]
                  });
                  document.body.style.pointerEvents = "auto";
                }
              }}>
                <DialogTrigger asChild>
                  {canCreate("CORE", "TRANSACTIONS") && (
                    <Button className="h-12 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-200 dark:shadow-none transition-all hover:scale-105 active:scale-95 font-bold gap-2 text-white" disabled={isImporting}>
                      <Plus className="h-5 w-5" />
                      Add Entry
                    </Button>
                  )}
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <form onSubmit={handleSaveTransaction}>
                    <DialogHeader>
                      <DialogTitle>{editingId ? "Edit Transaction" : "Add New Transaction"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      {/* Form inputs... */}
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="desc" className="text-right">Description</Label>
                        <Input
                          id="desc"
                          className="col-span-3"
                          placeholder="Groceries, Rent, etc."
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="amount" className="text-right">Amount (₹)</Label>
                        <Input
                          id="amount"
                          type="number"
                          className="col-span-3"
                          placeholder="0.00"
                          value={formData.amount}
                          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="type" className="text-right">Type</Label>
                        <Select
                          value={formData.type}
                          onValueChange={(val) => setFormData({ ...formData, type: val })}
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="income">Income</SelectItem>
                            <SelectItem value="expense">Expense</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="cat" className="text-right">Category</Label>
                        <Select
                          value={formData.category}
                          onValueChange={(val) => setFormData({ ...formData, category: val })}
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {dbCategories
                              .filter(c => formData.type === 'both' || c.type === 'both' || c.type === formData.type)
                              .map(cat => (
                                <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                              ))
                            }
                            {dbCategories.length === 0 && (
                              <>
                                <SelectItem value="salary">Salary & Income</SelectItem>
                                <SelectItem value="food">Food & Dining</SelectItem>
                                <SelectItem value="shopping">Shopping</SelectItem>
                                <SelectItem value="transport">Transportation</SelectItem>
                                <SelectItem value="rent">Rent & Housing</SelectItem>
                                <SelectItem value="misc">Miscellaneous</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="payment" className="text-right">Payment</Label>
                        <Select
                          value={formData.paymentMethod}
                          onValueChange={(val) => setFormData({ ...formData, paymentMethod: val })}
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bank">Bank</SelectItem>
                            <SelectItem value="credit">Credit Card</SelectItem>
                            <SelectItem value="cash">Cash</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="account" className="text-right">Account</Label>
                        <Select
                          disabled={formData.paymentMethod === 'cash'}
                          value={formData.ledgerId}
                          onValueChange={(val) => setFormData({ ...formData, ledgerId: val })}
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select account" />
                          </SelectTrigger>
                          <SelectContent>
                            {ledgers
                              .filter(ledger => {
                                if (formData.paymentMethod === 'bank') return ledger.accountType === 'bank';
                                if (formData.paymentMethod === 'credit') return ledger.accountType === 'credit';
                                return true;
                              })
                              .map((ledger) => (
                                <SelectItem key={ledger.id} value={ledger.id?.toString() || ""}>
                                  {ledger.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : "Save Transaction"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 items-center bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-indigo-100/50 shadow-sm dark:bg-gray-900/50 dark:border-gray-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            aria-label="Search transactions"
            className="pl-10 bg-white border-indigo-100 focus:border-indigo-300 focus:ring-indigo-100 transition-all dark:bg-gray-950 dark:border-gray-800"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={`gap-2 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 transition-colors ${filterType !== 'all' || filterPayment !== 'all' || filterCategory !== 'all' || filterLedger !== 'all' ? 'bg-indigo-50 text-indigo-700 border-indigo-300' : ''}`}>
              <Filter className="h-4 w-4" />
              Filters
              {(filterType !== 'all' || filterPayment !== 'all' || filterCategory !== 'all' || filterLedger !== 'all') && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] text-white animate-in zoom-in">
                  {(filterType !== 'all' ? 1 : 0) + (filterPayment !== 'all' ? 1 : 0) + (filterCategory !== 'all' ? 1 : 0) + (filterLedger !== 'all' ? 1 : 0)}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-5" align="end">
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold leading-none">Filters</h4>
                <Button variant="ghost" size="sm" className="h-auto p-0 text-indigo-600 hover:text-indigo-800 hover:bg-transparent" onClick={clearFilters}>
                  Clear all
                </Button>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="filter-type" className="text-xs font-medium text-muted-foreground uppercase">Type</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger id="filter-type" className="h-9">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="filter-payment" className="text-xs font-medium text-muted-foreground uppercase">Payment Method</Label>
                <Select value={filterPayment} onValueChange={setFilterPayment}>
                  <SelectTrigger id="filter-payment" className="h-9">
                    <SelectValue placeholder="All Methods" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    <SelectItem value="bank">Bank</SelectItem>
                    <SelectItem value="credit">Credit Card</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="filter-category" className="text-xs font-medium text-muted-foreground uppercase">Category</Label>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger id="filter-category" className="h-9">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {dbCategories.map(cat => (
                      <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                    ))}
                    {dbCategories.length === 0 && (uniqueCategories as string[]).map((cat: string) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="filter-ledger" className="text-xs font-medium text-muted-foreground uppercase">Account / Ledger</Label>
                <Select value={filterLedger} onValueChange={setFilterLedger}>
                  <SelectTrigger id="filter-ledger" className="h-9">
                    <SelectValue placeholder="All Accounts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Accounts</SelectItem>
                    {ledgers.map(l => (
                      <SelectItem key={l.id} value={l.id?.toString() || ""}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-md ring-1 ring-gray-100 dark:bg-gray-900/80 dark:ring-gray-800 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm sticky top-0 z-10">
              <TableRow className="hover:bg-transparent border-b border-gray-100 dark:border-gray-800">
                <TableHead className="w-[120px] font-semibold text-gray-900 dark:text-gray-100">Date</TableHead>
                <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Description</TableHead>
                <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Category</TableHead>
                <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Method</TableHead>
                <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Account</TableHead>
                <TableHead className="text-right font-semibold text-gray-900 dark:text-gray-100">Debit (Dr)</TableHead>
                <TableHead className="text-right font-semibold text-gray-900 dark:text-gray-100">Credit (Cr)</TableHead>
                <TableHead className="text-right font-semibold text-gray-900 dark:text-gray-100">Balance</TableHead>
                <TableHead className="text-center font-semibold text-gray-900 dark:text-gray-100">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-64 text-center">
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col justify-center items-center gap-3 text-muted-foreground"
                      >
                        <div className="relative">
                          <div className="h-12 w-12 rounded-full border-4 border-indigo-100 border-t-indigo-500 animate-spin"></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-4 w-4 rounded-full bg-indigo-50"></div>
                          </div>
                        </div>
                        <p className="animate-pulse">Loading transactions...</p>
                      </motion.div>
                    </TableCell>
                  </TableRow>
                ) : transactionsWithBalance.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-64 text-center text-muted-foreground">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col items-center justify-center"
                      >
                        <Search className="h-12 w-12 text-gray-300 mb-2" />
                        <p>No transactions found matching your criteria.</p>
                        <Button variant="link" onClick={clearFilters} className="text-indigo-600 mt-2">Clear all filters</Button>
                      </motion.div>
                    </TableCell>
                  </TableRow>
                ) : (
                  transactionsWithBalance.map((tx: any, index: number) => (
                    <motion.tr
                      key={tx.id || index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ delay: index * 0.05, duration: 0.2 }}
                      className="group hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors border-b border-gray-50 dark:border-gray-800/50"
                    >
                      <TableCell className="font-medium text-gray-700 dark:text-gray-300">
                        {tx.date ? new Date(tx.date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                      </TableCell>
                      <TableCell className="font-semibold text-gray-900 dark:text-gray-100">{tx.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal bg-white dark:bg-gray-800 border-indigo-100 dark:border-gray-700 text-gray-600 dark:text-gray-400 group-hover:border-indigo-200 transition-colors">
                          {tx.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {tx.paymentMethod === 'bank' && <Wallet className="h-3 w-3 text-blue-500" />}
                          {tx.paymentMethod === 'credit' && <CreditCard className="h-3 w-3 text-emerald-500" />}
                          {tx.paymentMethod === 'cash' && <Banknote className="h-3 w-3 text-green-500" />}
                          <span className="capitalize text-sm">{tx.paymentMethod}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {ledgers.find(l => l.id?.toString() === tx.ledgerId?.toString())?.name || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {tx.type === 'expense' ? (
                          <span className="font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                            <ArrowDownRight className="h-3 w-3" />
                            ₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {tx.type === 'income' ? (
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                            <ArrowUpRight className="h-3 w-3" />
                            ₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-bold text-gray-900 dark:text-gray-100">
                        ₹{tx.runningBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => tx.id && handlePdfDownload(tx.id)}>
                              <FileText className="mr-2 h-4 w-4" />
                              <span>Download PDF</span>
                            </DropdownMenuItem>
                            {canEdit("CORE", "TRANSACTIONS") && (
                              <DropdownMenuItem onClick={() => handleEdit(tx)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                <span>Edit</span>
                              </DropdownMenuItem>
                            )}
                            {canDelete("CORE", "TRANSACTIONS") && (
                              <DropdownMenuItem onClick={() => tx.id && handleDelete(tx.id)} className="text-red-600 focus:text-red-700">
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Delete</span>
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </TableBody>
            {!isLoading && transactionsWithBalance.length > 0 && (
              <tfoot className="bg-gray-50/80 dark:bg-gray-800/80 border-t border-gray-200 dark:border-gray-700 font-semibold sticky bottom-0 z-10">
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5} className="text-right text-gray-900 dark:text-gray-100 pr-4">
                    <div className="flex flex-col items-end">
                      <span>Grand Total</span>
                      {startingBalance !== 0 && (
                        <span className="text-xs text-muted-foreground font-normal translate-y-1">
                          (Calculated with ₹{startingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })} Opening Balance)
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-red-600 dark:text-red-400">
                    ₹{totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right text-emerald-600 dark:text-emerald-400">
                    ₹{totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className={`text-right font-bold text-lg ${finalBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    ₹{finalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </tfoot>
            )}
          </Table>
        </CardContent>
      </Card>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-gray-100 dark:bg-gray-900/50 dark:border-gray-800 shadow-sm">
        <div className="text-sm text-muted-foreground font-medium">
          Showing <span className="text-gray-900 dark:text-gray-100 font-bold">{filteredTransactions.length}</span> results
          {totalPages > 1 && <span> across {totalPages} pages</span>}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl h-9 px-4 border-gray-200"
            disabled={currentPage === 1 || isLoading}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          >
            Previous
          </Button>
          <div className="flex items-center gap-1 mx-2">
            {[...Array(totalPages)].map((_, i) => {
               const p = i + 1;
               if (totalPages > 5 && p > 2 && p < totalPages - 1 && Math.abs(p - currentPage) > 1) {
                 if (p === currentPage - 2 || p === currentPage + 2) return <span key={p} className="px-1 text-gray-300">...</span>;
                 return null;
               }
               return (
                <Button
                  key={p}
                  variant={p === currentPage ? "default" : "ghost"}
                  size="sm"
                  className={`h-9 w-9 rounded-xl p-0 ${p === currentPage ? 'bg-indigo-600 shadow-lg shadow-indigo-200' : ''}`}
                  onClick={() => setCurrentPage(p)}
                  disabled={isLoading}
                >
                  {p}
                </Button>
               );
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl h-9 px-4 border-gray-200"
            disabled={currentPage === totalPages || isLoading}
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          >
            Next
          </Button>
        </div>
      </div>
    </motion.div >
  )
}

