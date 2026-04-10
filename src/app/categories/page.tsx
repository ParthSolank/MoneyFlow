"use client";

import { useState, useEffect } from "react";
import { Plus, Tag, Pencil, Trash2, Loader2, Save, X, Search, Filter, ShieldAlert } from "lucide-react";
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
import { categoryApi, Category } from "@/lib/supabase-client";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/use-permissions";
import { useAuth } from "@/context/auth-context";

export default function CategoriesPage() {
    const { toast } = useToast();
    const { canCreate, canEdit, canDelete } = usePermissions();
    const { user } = useAuth();
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState<string>("all");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    // Form state
    const [formData, setFormData] = useState<{
        name: string;
        type: 'income' | 'expense' | 'both';
        icon: string;
        color: string;
        keywords: string;
        parentId: string | null;
    }>({
        name: "",
        type: "expense",
        icon: "Tag",
        color: "#6366f1",
        keywords: "",
        parentId: null
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setIsLoading(true);
            const data = await categoryApi.getAll();
            setCategories(data);
        } catch (error) {
            toast({ title: "Error", description: "Failed to load categories", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenDialog = (category: Category | null = null) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                name: category.name,
                type: category.type as any,
                icon: category.icon,
                color: category.color,
                keywords: category.keywords || "",
                parentId: category.parentId?.toString() || null
            });
        } else {
            setEditingCategory(null);
            setFormData({
                name: "",
                type: "expense",
                icon: "Tag",
                color: "#6366f1",
                keywords: "",
                parentId: null
            });
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingCategory) {
                await categoryApi.update(editingCategory.id, {
                    ...formData,
                    parentId: (formData.parentId === "none" || !formData.parentId) ? undefined : formData.parentId
                });
                toast({ title: "Success", description: "Category updated successfully" });
            } else {
                await categoryApi.create({
                    ...formData,
                    parentId: (formData.parentId === "none" || !formData.parentId) ? undefined : formData.parentId
                });
                toast({ title: "Success", description: "Category created successfully" });
            }
            setIsDialogOpen(false);
            fetchCategories();
        } catch (error) {
            toast({ title: "Error", description: "Failed to save category", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        setIsSubmitting(true);
        if (!confirm("Are you sure you want to delete this category? All sub-categories will be unlinked.")) return;
        try {
            await categoryApi.delete(id);
            toast({ title: "Success", description: "Category deleted" });
            fetchCategories();
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete category", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSeed = async () => {
        try {
            setIsSubmitting(true);
            await categoryApi.seed();
            toast({ title: "Success", description: "Default categories seeded!" });
            fetchCategories();
        } catch (error) {
            toast({ title: "Error", description: "Failed to seed categories" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredCategories = categories.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === "all" || c.type === filterType;
        return matchesSearch && matchesType;
    });

    return (
        <div className="container mx-auto py-8 px-4 max-w-6xl space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-3">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-2xl text-amber-600">
                            <Tag className="h-8 w-8" />
                        </div>
                        Category Master
                        <Badge variant="secondary" className="ml-3 h-6 px-3 rounded-full bg-amber-50 text-amber-600 border-amber-100 font-bold animate-in fade-in zoom-in duration-500">
                            {categories.length} Total
                        </Badge>
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        Manage your expense and income categories for better financial clarity.
                    </p>
                </motion.div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={handleSeed}
                            disabled={isSubmitting}
                            variant="outline"
                            className="border-amber-200 text-amber-600 hover:bg-amber-50 h-12 px-6 rounded-xl font-bold"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : "Smart Setup"}
                        </Button>
                        <DialogTrigger asChild>
                            {canCreate("CORE", "CATEGORIES") && (
                                <Button
                                    onClick={() => handleOpenDialog()}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-none h-12 px-6 rounded-xl transition-all hover:scale-105 active:scale-95"
                                >
                                    <Plus className="mr-2 h-5 w-5" /> Add Category
                                </Button>
                            )}
                        </DialogTrigger>
                    </div>
                    <DialogContent className="sm:max-w-[425px] rounded-2xl border-0 shadow-2xl backdrop-blur-xl bg-white/90 dark:bg-gray-900/90">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                                {editingCategory ? "Update Category" : "New Category"}
                            </DialogTitle>
                            <DialogDescription>
                                Create a unified category for your financial transactions.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Category Name</label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g., Groceries, Salary, Rent"
                                        required
                                        className="h-12 rounded-xl border-gray-200 focus:ring-indigo-500"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Type</label>
                                        <Select
                                            value={formData.type}
                                            onValueChange={(v) => setFormData({ ...formData, type: v as any })}
                                        >
                                            <SelectTrigger className="h-12 rounded-xl border-gray-200">
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-gray-200">
                                                <SelectItem value="expense">Expense</SelectItem>
                                                <SelectItem value="income">Income</SelectItem>
                                                <SelectItem value="both">Both</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Parent Category</label>
                                        <Select
                                            value={formData.parentId || "none"}
                                            onValueChange={(v) => setFormData({ ...formData, parentId: v === "none" ? null : v })}
                                        >
                                            <SelectTrigger className="h-12 rounded-xl border-gray-200">
                                                <SelectValue placeholder="None" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-gray-200">
                                                <SelectItem value="none">None (Root)</SelectItem>
                                                {categories.filter(c => c.id !== editingCategory?.id && !c.parentId).map(c => (
                                                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Color</label>
                                        <Input
                                            type="color"
                                            value={formData.color}
                                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                            className="h-12 w-full rounded-xl border-gray-200 p-1 cursor-pointer"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Icon (Name)</label>
                                        <Input
                                            value={formData.icon}
                                            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                            placeholder="Lucide Icon Name"
                                            className="h-12 rounded-xl border-gray-200"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1 flex items-center gap-2">
                                        Auto-Categorization Keywords
                                        <Badge variant="outline" className="text-[10px] uppercase font-black px-1.5 py-0">Smart</Badge>
                                    </label>
                                    <textarea
                                        value={formData.keywords}
                                        onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                                        placeholder="e.g., Zomato, Amazon, Uber, Petrol (comma separated)"
                                        className="w-full min-h-[80px] p-3 rounded-xl border border-gray-200 bg-white/50 focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                                    />
                                    <p className="text-[10px] text-muted-foreground ml-1">
                                        Imported transactions containing these words will be grouped here automatically.
                                    </p>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold shadow-lg shadow-indigo-100"
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : editingCategory ? <Save className="mr-2" /> : <Plus className="mr-2" />}
                                    {editingCategory ? "Update Category" : "Create Category"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="border-0 shadow-xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-md overflow-hidden ring-1 ring-gray-200/50">
                <CardHeader className="border-b border-gray-100 dark:border-gray-800 p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md group">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                            <Input
                                placeholder="Search categories..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 h-11 border-gray-200 bg-white/50 dark:bg-gray-800/50 rounded-xl focus:ring-indigo-500"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <Filter className="h-5 w-5 text-gray-400" />
                            <Select value={filterType} onValueChange={setFilterType}>
                                <SelectTrigger className="w-40 h-11 border-gray-200 bg-white/50 dark:bg-gray-800/50 rounded-xl">
                                    <SelectValue placeholder="All types" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-gray-200">
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="expense">Expenses Only</SelectItem>
                                    <SelectItem value="income">Income Only</SelectItem>
                                    <SelectItem value="both">Universal</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                            <p className="text-muted-foreground font-medium animate-pulse">Organizing categories...</p>
                        </div>
                    ) : filteredCategories.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                            <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-full mb-6">
                                <Search className="h-10 w-10 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">No categories found</h3>
                            <p className="text-muted-foreground mt-2 max-w-sm">
                                Try adjusting your search or filters, or create a new category to get started.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border-collapse">
                            <AnimatePresence mode="popLayout">
                                {filteredCategories.map((category, idx) => (
                                    <motion.div
                                        key={category.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.2, delay: idx * 0.03 }}
                                        className="p-6 border-b border-r border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-all group"
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <div
                                                className="h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300"
                                                style={{ backgroundColor: `${category.color}20`, color: category.color }}
                                            >
                                                <Tag className="h-7 w-7" />
                                            </div>
                                             <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {canEdit("CORE", "CATEGORIES") && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleOpenDialog(category)}
                                                        className="h-9 w-9 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                {canDelete("CORE", "CATEGORIES") && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={(e) => handleDelete(e, category.id)}
                                                        className="h-9 w-9 rounded-lg text-gray-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-bold text-xl text-gray-900 dark:text-gray-100">{category.name}</h3>
                                                <Badge
                                                    variant="outline"
                                                    className={`
                                                        capitalize font-medium px-2 py-0.5 rounded-lg border-0
                                                        ${category.type === 'income' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20' :
                                                            category.type === 'expense' ? 'bg-rose-50 text-rose-700 dark:bg-rose-900/20' :
                                                                'bg-blue-50 text-blue-700 dark:bg-blue-900/20'}
                                                    `}
                                                >
                                                    {category.type}
                                                </Badge>
                                            </div>
                                            
                                            {category.subCategories && category.subCategories.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-4">
                                                    {category.subCategories.map(sub => (
                                                        <Badge 
                                                            key={sub.id} 
                                                            variant="secondary" 
                                                            className="bg-indigo-50/50 text-indigo-600 border-0 text-[10px] font-bold px-2 py-1 rounded-lg"
                                                        >
                                                            {sub.name}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}

                                            {category.keywords && (
                                                <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-gray-50 dark:border-gray-800">
                                                    {category.keywords.split(',').slice(0, 3).map((kw, i) => (
                                                        <Badge key={i} variant="secondary" className="text-[9px] font-bold px-2 py-0 h-4 bg-gray-100/50 text-gray-500 rounded-sm">
                                                            {kw.trim()}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="flex items-center justify-center gap-2 text-sm text-gray-400 font-medium">
                <ShieldAlert className="h-4 w-4" />
                These categories will be available in the transaction entry dropdown.
            </div>
        </div>
    );
}


