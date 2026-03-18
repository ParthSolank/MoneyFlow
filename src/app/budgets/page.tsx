"use client";

import { useState, useEffect } from "react";
import { Plus, PieChart, Pencil, Trash2, Loader2, Save, Search, TrendingUp, AlertCircle, CheckCircle2, Calendar, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { budgetApi, categoryApi, Category, BudgetStatus } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/use-permissions";
import { BASE_URL } from "@/lib/api";

export default function BudgetsPage() {
    const { toast } = useToast();
    const { canCreate, canDelete } = usePermissions();
    // ...
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownloadStatement = async () => {
        try {
            setIsDownloading(true);
            const res = await fetch(`${BASE_URL}/api/Reports/monthly-statement?month=${month}&year=${year}`, {
                credentials: 'include' // Include HttpOnly cookies for authentication
            });

            if (!res.ok) throw new Error("Failed to download");

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Statement_${year}_${month.toString().padStart(2, '0')}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            toast({ title: "Success", description: "Statement downloaded successfully" });
        } catch (error) {
            toast({ title: "Error", description: "Could not generate statement", variant: "destructive" });
        } finally {
            setIsDownloading(false);
        }
    };
    const [budgetStats, setBudgetStats] = useState<BudgetStatus[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        categoryId: 0,
        amount: 0,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
    });

    useEffect(() => {
        setMounted(true);
        fetchData();
    }, [month, year]);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [stats, cats] = await Promise.all([
                budgetApi.getStatus(month, year),
                categoryApi.getAll()
            ]);
            setBudgetStats(stats);
            setCategories(cats.filter(c => c.type === 'expense' || c.type === 'both'));
        } catch (error) {
            toast({ title: "Error", description: "Failed to load budget data", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.categoryId === 0) {
            toast({ title: "Error", description: "Please select a category", variant: "destructive" });
            return;
        }
        setIsSubmitting(true);
        try {
            await budgetApi.create(formData);
            toast({ title: "Success", description: "Budget set successfully" });
            setIsDialogOpen(false);
            fetchData();
        } catch (error) {
            toast({ title: "Error", description: "Failed to save budget", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Remove this budget?")) return;
        try {
            await budgetApi.delete(id);
            toast({ title: "Success", description: "Budget removed" });
            fetchData();
        } catch (error) {
            toast({ title: "Error", description: "Failed to remove budget", variant: "destructive" });
        }
    };

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const currentYear = new Date().getFullYear();
    const years = [currentYear - 1, currentYear, currentYear + 1];

    if (!mounted) return null;

    return (
        <div className="container mx-auto py-8 px-4 max-w-6xl space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-3">
                        <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-2xl text-rose-600">
                            <PieChart className="h-8 w-8" />
                        </div>
                        Budget Planning
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        Define spending limits for your categories and stay on track.
                    </p>
                </motion.div>

                <div className="flex items-center gap-4">
                    <Select value={month.toString()} onValueChange={(v) => setMonth(parseInt(v))}>
                        <SelectTrigger className="w-36 h-12 rounded-xl bg-white shadow-sm">
                            <Calendar className="mr-2 h-4 w-4 text-indigo-500" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {months.map((m, i) => (
                                <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
                        <SelectTrigger className="w-28 h-12 rounded-xl bg-white shadow-sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map(y => (
                                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button 
                        variant="outline" 
                        onClick={handleDownloadStatement}
                        disabled={isDownloading}
                        className="h-12 border-indigo-100 text-indigo-600 hover:bg-indigo-50 rounded-xl"
                    >
                        {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        Generate Statement
                    </Button>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            {canCreate("CORE", "BUDGETS") && (
                                <Button className="bg-indigo-600 hover:bg-indigo-700 h-12 px-6 rounded-xl shadow-lg shadow-indigo-200">
                                    <Plus className="mr-2 h-5 w-5" /> Set Budget
                                </Button>
                            )}
                        </DialogTrigger>
                        <DialogContent className="rounded-2xl shadow-2xl bg-white/95 backdrop-blur-xl">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold">New Monthly Budget</DialogTitle>
                                <DialogDescription>
                                    Set a spending limit for {months[month - 1]} {year}.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700">Category</label>
                                        <Select onValueChange={(v) => setFormData({ ...formData, categoryId: parseInt(v) })}>
                                            <SelectTrigger className="h-12 rounded-xl">
                                                <SelectValue placeholder="Choose category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categories.map(cat => (
                                                    <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700">Monthly Limit (Amount)</label>
                                        <Input
                                            type="number"
                                            value={formData.amount}
                                            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                                            placeholder="₹ 0.00"
                                            className="h-12 rounded-xl text-lg font-bold"
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit" disabled={isSubmitting} className="w-full h-12 bg-indigo-600 rounded-xl">
                                        {isSubmitting ? <Loader2 className="animate-spin" /> : "Set Budget Limit"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
                        <p className="font-medium text-muted-foreground">Calculating utilization...</p>
                    </div>
                ) : budgetStats.length === 0 ? (
                    <div className="col-span-full border-2 border-dashed border-gray-200 rounded-3xl py-20 text-center bg-white/30 backdrop-blur-sm">
                        <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-600">No budgets defined for this month</h3>
                        <p className="text-gray-400 mt-2">Start budget planning to keep your spending in check.</p>
                    </div>
                ) : (
                    budgetStats.map((stat, idx) => {
                        const isOverBudget = stat.spent > stat.amount;
                        const isClose = !isOverBudget && stat.percentUsed > 80;

                        return (
                            <motion.div
                                key={stat.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                            >
                                <Card className={`border-0 shadow-xl rounded-3xl overflow-hidden ring-1 shadow-gray-200 group relative ${isOverBudget ? 'ring-rose-200 bg-rose-50/20' : isClose ? 'ring-amber-200 bg-amber-50/20' : 'ring-gray-100 bg-white'}`}>
                                    <CardHeader className="p-6 pb-2">
                                             <div className="flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <CardTitle className="text-xl font-bold">{stat.categoryName}</CardTitle>
                                                    <CardDescription className="font-medium">
                                                        Budget: ₹{stat.amount.toLocaleString()}
                                                    </CardDescription>
                                                </div>
                                                {canDelete("CORE", "BUDGETS") && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDelete(stat.id)}
                                                        className="h-8 w-8 text-gray-300 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all rounded-full"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                    </CardHeader>
                                    <CardContent className="p-6 pt-2">
                                        <div className="mt-4 space-y-4">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground font-medium">Spent: ₹{stat.spent.toLocaleString()}</span>
                                                <span className={`font-bold ${isOverBudget ? 'text-rose-600' : isClose ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                    {stat.percentUsed.toFixed(1)}%
                                                </span>
                                            </div>
                                            <Progress
                                                value={Math.min(stat.percentUsed, 100)}
                                                className="h-3 rounded-full bg-gray-100"
                                            // Correctly applying colors is handled via CSS or shadcn props
                                            />
                                            <div className="flex items-center gap-2 pt-2">
                                                {isOverBudget ? (
                                                    <div className="flex items-center gap-2 text-rose-600 text-xs font-bold bg-rose-100 px-3 py-1.5 rounded-full ring-1 ring-rose-200">
                                                        <AlertCircle className="h-3 w-3" /> Over budget by ₹{(stat.spent - stat.amount).toLocaleString()}
                                                    </div>
                                                ) : isClose ? (
                                                    <div className="flex items-center gap-2 text-amber-600 text-xs font-bold bg-amber-100 px-3 py-1.5 rounded-full ring-1 ring-amber-200">
                                                        <AlertCircle className="h-3 w-3" /> Approaching limit
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold bg-emerald-100 px-3 py-1.5 rounded-full ring-1 ring-emerald-200">
                                                        <CheckCircle2 className="h-3 w-3" /> Within budget
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                    {isOverBudget && (
                                        <div className="absolute top-0 right-0 p-4">
                                            <div className="animate-ping h-2 w-2 rounded-full bg-rose-500"></div>
                                        </div>
                                    )}
                                </Card>
                            </motion.div>
                        );
                    })
                )}
            </div>


        </div>
    );
}

/* aria-label */
