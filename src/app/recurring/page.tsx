"use client";

import { useState } from "react";
import { Plus, Clock, Pencil, Trash2, Loader2, Calendar, Wallet, ArrowUpCircle, ArrowDownCircle, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { useRecurring, RecurringTransaction } from "@/hooks/use-recurring";
import { useLedgers } from "@/hooks/use-ledgers";
import { useCategoryBreakdown } from "@/hooks/use-stats";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/use-permissions";

export default function RecurringPage() {
    const { toast } = useToast();
    const { canCreate, canEdit, canDelete } = usePermissions();
    const { recurring, isLoading, create, update, remove } = useRecurring();
    const { ledgers } = useLedgers();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState<Partial<RecurringTransaction>>({
        description: "",
        amount: 0,
        type: "expense",
        category: "Subscription",
        paymentMethod: "bank",
        interval: "monthly",
        dayOfInterval: 1,
        isActive: true
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await create(formData);
            toast({ title: "Success", description: "Recurring transaction scheduled" });
            setIsDialogOpen(false);
            setFormData({
                description: "",
                amount: 0,
                type: "expense",
                category: "Subscription",
                paymentMethod: "bank",
                interval: "monthly",
                dayOfInterval: 1,
                isActive: true
            });
        } catch (error) {
            toast({ title: "Error", description: "Failed to save schedule", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleStatus = async (rt: RecurringTransaction) => {
        try {
            await update(rt.id, { isActive: !rt.isActive });
            toast({ title: "Updated", description: `Schedule ${rt.isActive ? 'paused' : 'activated'}` });
        } catch (error) {
            toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
        }
    };

    return (
        <div className="container mx-auto py-8 px-4 max-w-6xl space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl text-indigo-600">
                            <Clock className="h-8 w-8" />
                        </div>
                        Automated Finances
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        Manage your recurring bills, subscriptions, and regular income.
                    </p>
                </motion.div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        {canCreate("CORE", "RECURRING") && (
                            <Button className="bg-indigo-600 hover:bg-indigo-700 h-12 px-6 rounded-xl shadow-lg shadow-indigo-200">
                                <Plus className="mr-2 h-5 w-5" /> Add Schedule
                            </Button>
                        )}
                    </DialogTrigger>
                    <DialogContent className="rounded-2xl shadow-2xl bg-white/95 backdrop-blur-xl max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold">New Recurring Transaction</DialogTitle>
                            <DialogDescription>
                                Set up a transaction that repeats automatically.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Description</label>
                                    <Input
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="e.g. Netflix Subscription"
                                        className="h-11 rounded-xl"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Amount</label>
                                    <Input
                                        type="number"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                                        placeholder="₹ 0.00"
                                        className="h-11 rounded-xl font-bold"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Type</label>
                                    <Select value={formData.type} onValueChange={(v: any) => setFormData({ ...formData, type: v })}>
                                        <SelectTrigger className="h-11 rounded-xl">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="expense">Expense</SelectItem>
                                            <SelectItem value="income">Income</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Frequency</label>
                                    <Select value={formData.interval} onValueChange={(v: any) => setFormData({ ...formData, interval: v })}>
                                        <SelectTrigger className="h-11 rounded-xl">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="daily">Daily</SelectItem>
                                            <SelectItem value="weekly">Weekly</SelectItem>
                                            <SelectItem value="monthly">Monthly</SelectItem>
                                            <SelectItem value="yearly">Yearly</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Day (of Month/Week)</label>
                                    <Input
                                        type="number"
                                        value={formData.dayOfInterval}
                                        onChange={(e) => setFormData({ ...formData, dayOfInterval: parseInt(e.target.value) })}
                                        placeholder="1"
                                        min={1}
                                        max={31}
                                        className="h-11 rounded-xl"
                                        required
                                    />
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Ledger (Source/Dest)</label>
                                    <Select value={formData.ledgerId?.toString()} onValueChange={(v) => setFormData({ ...formData, ledgerId: parseInt(v) })}>
                                        <SelectTrigger className="h-11 rounded-xl">
                                            <SelectValue placeholder="Select account" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ledgers.map(l => (
                                                <SelectItem key={l.id} value={l.id.toString()}>{l.name} (₹{l.balance.toLocaleString()})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter className="pt-4">
                                <Button type="submit" disabled={isSubmitting} className="w-full h-12 bg-indigo-600 rounded-xl shadow-lg ring-1 ring-indigo-500 shadow-indigo-100">
                                    {isSubmitting ? <Loader2 className="animate-spin" /> : "Schedule Transaction"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
                        <p className="font-medium text-muted-foreground italic">Syncing schedules...</p>
                    </div>
                ) : recurring.length === 0 ? (
                    <div className="col-span-full border-2 border-dashed border-indigo-100 rounded-[2.5rem] py-24 text-center bg-white/40 backdrop-blur-md">
                        <Activity className="h-16 w-16 text-indigo-200 mx-auto mb-6" />
                        <h3 className="text-2xl font-bold text-gray-700">No automated transactions yet</h3>
                        <p className="text-gray-400 mt-2 max-w-md mx-auto mb-8">
                            Setup recurring transactions for your subscriptions or salary to keep your ledger up to date automatically.
                        </p>
                        {canCreate("CORE", "RECURRING") && (
                            <Button 
                                onClick={() => setIsDialogOpen(true)}
                                className="bg-indigo-600 hover:bg-indigo-700 h-12 px-8 rounded-xl shadow-lg shadow-indigo-200"
                            >
                                <Plus className="mr-2 h-5 w-5" /> Schedule Your First Automation
                            </Button>
                        )}
                    </div>
                ) : (
                    <AnimatePresence>
                        {recurring.map((item, idx) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: idx * 0.05 }}
                            >
                                <Card className={`group border-0 shadow-xl rounded-[2rem] overflow-hidden ring-1 transition-all hover:shadow-2xl hover:-translate-y-1 ${item.isActive ? 'ring-indigo-100 bg-white' : 'ring-gray-100 bg-gray-50/50'}`}>
                                    <CardHeader className="p-6 pb-2">
                                        <div className="flex justify-between items-start">
                                            <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                                {item.type === 'income' ? <ArrowUpCircle className="h-6 w-6 text-emerald-500" /> : <ArrowDownCircle className="h-6 w-6 text-rose-500" />}
                                            </div>
                                            <div className="flex gap-2">
                                                <Badge variant={item.isActive ? "default" : "secondary"} className={`rounded-full px-3 ${item.isActive ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-gray-200'}`}>
                                                    {item.isActive ? 'Active' : 'Paused'}
                                                </Badge>
                                                {canDelete("CORE", "RECURRING") && (
                                                    <Button variant="ghost" size="icon" onClick={() => remove(item.id)} className="h-7 w-7 rounded-full text-gray-300 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="mt-4">
                                            <CardTitle className="text-xl font-bold truncate">{item.description}</CardTitle>
                                            <CardDescription className="flex items-center gap-1 mt-1">
                                                <Calendar className="h-3 w-3" /> {item.interval.charAt(0).toUpperCase() + item.interval.slice(1)} on day {item.dayOfInterval}
                                            </CardDescription>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6 pt-4">
                                        <div className="flex items-end justify-between">
                                            <div className="space-y-1">
                                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-tighter">Next Run</span>
                                                <p className="text-sm font-bold text-gray-700">{new Date(item.nextRunDate).toLocaleDateString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className={`text-2xl font-black ${item.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                    {item.type === 'income' ? '+' : '-'}₹{item.amount.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="mt-6">
                                            <Button 
                                                variant="outline" 
                                                onClick={() => toggleStatus(item)}
                                                className={`w-full rounded-2xl border-indigo-100 font-bold transition-all ${item.isActive ? 'hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100' : 'hover:bg-indigo-50 hover:text-indigo-600'}`}
                                            >
                                                {item.isActive ? 'Pause Automation' : 'Resume Automation'}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}
