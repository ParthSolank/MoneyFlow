
"use client"

import { use, useEffect, useState, useMemo } from "react"
import { ledgerApi, transactionApi, categoryApi, Ledger, Transaction, Category } from "@/lib/supabase-client"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Wallet, ReceiptText, TrendingUp, PiggyBank, CreditCard, Banknote, Trash2 } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { useAuth } from "@/context/auth-context"

const iconMap: Record<string, any> = {
  Wallet,
  PiggyBank,
  TrendingUp,
  CreditCard,
  Banknote
}

export default function LedgerDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin";
  const { id } = use(params)
  const [ledger, setLedger] = useState<Ledger | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [error, setError] = useState(false)
  const { toast } = useToast()

  const handleCategoryChange = async (txId: string | undefined, newCategory: string, originalTx: any) => {
    if (!txId || !originalTx) return;
    try {
      // Remove any navigation properties like 'ledger' or 'runningBalance' that could break the API
      const payload = {
        id: originalTx.id,
        description: originalTx.description,
        amount: originalTx.amount,
        date: originalTx.date,
        type: originalTx.type,
        category: newCategory,
        paymentMethod: originalTx.paymentMethod,
        ledgerId: originalTx.ledgerId
      };

      await transactionApi.update(txId, payload);
      toast({ title: "Category Updated", description: "The transaction category was updated successfully." });
      setLedger((prev: Ledger | null) => {
        if (!prev) return prev;
        return {
          ...prev,
          transactions: prev.transactions?.map(t => t.id === txId ? { ...t, category: newCategory } : t)
        }
      });
    } catch (e: any) {
      console.error(e);
      toast({ variant: "destructive", title: "Update Failed", description: e.message || "An error occurred while updating the transaction." })
    }
  }

  const handleDelete = async (txId: string | undefined) => {
    if (!txId) return;
    if (!window.confirm("Are you sure you want to delete this transaction?")) return;
    try {
      await transactionApi.delete(txId);
      toast({ title: "Deleted", description: "Transaction removed." });
      setLedger((prev: Ledger | null) => {
        if (!prev) return prev;
        return {
          ...prev,
          transactions: prev.transactions?.filter((t: Transaction) => t.id !== txId)
        }
      });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: "Could not delete transaction." });
    }
  }

  const [transactions, setTransactions] = useState<Transaction[]>([])

  useEffect(() => {
    const fetchLedger = async () => {
      try {
        setIsLoading(true)
        const data = await ledgerApi.getById(id)
        setLedger(data)
        
        // If the ledger has transactions included, use them, otherwise fetch separately
        if (data.transactions && data.transactions.length > 0) {
          setTransactions(data.transactions)
        } else {
          try {
            const txData = await transactionApi.getByLedgerId(id)
            setTransactions(txData.items || [])
          } catch (txErr) {
            console.error("Failed to fetch transactions separately:", txErr)
            setTransactions([])
          }
        }
      } catch (err) {
        setError(true)
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      fetchLedger()
    }
    
    // Fetch all categories
    const fetchCategories = async () => {
      try {
        const data = await categoryApi.getAll()
        setCategories(data)
      } catch (err) {
        console.error("Failed to fetch categories:", err)
      }
    }
    fetchCategories()
  }, [id])

  const ledgerTransactions = transactions;
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
      </div>
    )
  }

  if (error || !ledger) {
    return notFound()
  }

  const IconComp = iconMap[ledger.icon] || Wallet
  const displayBalance = ledger.balance;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500 pb-24">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/ledgers">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{ledger.name}</h1>
          <p className="text-muted-foreground">{ledger.description}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="glass-card md:col-span-1">
          <CardHeader className="pb-2">
            <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
              <IconComp className="h-6 w-6" />
            </div>
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${displayBalance < 0 ? 'text-destructive' : ''}`}>
              ₹{displayBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="flex flex-col mt-1">
              <span className="text-sm font-medium text-secondary">
                {displayBalance < 0 ? 'Outstanding Dues' : 'Available Balance'}
              </span>
              <span className="text-xs text-muted-foreground mt-1">
                (Includes Initial Balance: ₹{(ledger.initialBalance ?? ledger.balance).toLocaleString('en-IN')})
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ReceiptText className="h-5 w-5 text-primary" />
              Transactions for this Ledger
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  {isAdmin && <TableHead className="text-right w-[60px]">Action</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledgerTransactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-xs">
                      {tx.date ? new Date(tx.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                    </TableCell>
                    <TableCell className="font-medium text-xs">
                      {tx.description}
                    </TableCell>
                     <TableCell>
                      <Select value={tx.category} onValueChange={(val) => handleCategoryChange(tx.id, val, tx)}>
                        <SelectTrigger className="h-7 text-[10px] w-[140px] bg-white dark:bg-gray-800 border-indigo-100 dark:border-gray-700">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <div className="max-h-[300px] overflow-y-auto">
                            {categories.length > 0 ? (
                              categories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.name} className="text-xs">
                                  {cat.name}
                                </SelectItem>
                              ))
                            ) : (
                              <>
                                <SelectItem value="salary">Salary & Income</SelectItem>
                                <SelectItem value="food">Food & Dining</SelectItem>
                                <SelectItem value="shopping">Shopping</SelectItem>
                                <SelectItem value="transport">Transportation</SelectItem>
                                <SelectItem value="rent">Rent & Housing</SelectItem>
                                <SelectItem value="utilities">Utilities & Bills</SelectItem>
                                <SelectItem value="health">Healthcare</SelectItem>
                                <SelectItem value="entertainment">Entertainment</SelectItem>
                                <SelectItem value="education">Education</SelectItem>
                                <SelectItem value="travel">Travel</SelectItem>
                                <SelectItem value="investment">Investments</SelectItem>
                                <SelectItem value="misc">Miscellaneous</SelectItem>
                              </>
                            )}
                          </div>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className={`text-right font-bold text-xs ${tx.type === 'income' ? 'text-secondary' : 'text-foreground'}`}>
                      {tx.type === 'income' ? '+' : ''}₹{tx.amount.toLocaleString('en-IN')}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(tx.id)} className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {ledgerTransactions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 5 : 4} className="text-center py-8 text-muted-foreground">
                      No transactions found for this ledger.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
