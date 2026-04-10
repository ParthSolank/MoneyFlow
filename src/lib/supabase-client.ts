/**
 * Supabase API Client for MoneyFlow Pro
 * Replaces .NET API backend with Supabase queries
 */

import { supabase } from './supabase';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface Transaction {
    id?: string;
    description: string;
    amount: number;
    date: string;
    type: 'income' | 'expense';
    category: string;
    paymentMethod: 'bank' | 'credit' | 'cash';
    ledgerId?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface Ledger {
    id?: string;
    name: string;
    description: string;
    balance: number;
    initialBalance?: number;
    icon: string;
    accountType: 'bank' | 'credit';
    createdAt?: string;
    updatedAt?: string;
    transactions?: Transaction[];
}

export interface TransactionStats {
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    totalBalance?: number;
}

export interface LedgerStats {
    totalBalance: number;
    bankBalance: number;
    creditBalance: number;
}

export interface Category {
    id: string;
    name: string;
    type: 'income' | 'expense' | 'both';
    icon: string;
    color: string;
    keywords?: string;
    parentId?: string;
    subCategories?: Category[];
}

export interface Budget {
    id: string;
    categoryId: string;
    category?: Category;
    amount: number;
    month: number;
    year: number;
}

export interface BudgetStatus {
    id: string;
    categoryName: string;
    amount: number;
    spent: number;
    remaining: number;
    percentUsed: number;
}

export interface User {
    id: string;
    username: string;
    email: string;
    role: string;
    rights?: string[];
    status?: string;
    joined?: string;
}

export interface AuditLog {
    id: string;
    userId: string;
    username: string;
    action: string;
    module: string;
    details: string;
    timestamp: string;
}

export interface Company {
    id?: string;
    name: string;
    description: string;
    panNumber: string;
    gstNumber: string;
    address: string;
    contactEmail: string;
    contactPhone: string;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface FinancialYear {
    id?: string;
    name: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
    description: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface Goal {
    id: string;
    name: string;
    title?: string; // Compatibility alias
    targetAmount: number;
    currentAmount: number;
    deadline?: string;
    description?: string;
    category?: string; // Added category
    icon?: string;
    color?: string;
    ledgerId?: number | string;
    createdAt?: string;
    updatedAt?: string;
}

export interface GoalContribution {
    id: string;
    goalId: string;
    amount: number;
    date: string;
    contributionDate?: string; // Compatibility alias
    note?: string;
    notes?: string; // Compatibility alias
    ledger?: { name: string };
    createdAt?: string;
}

export interface RecurringTransaction {
    id?: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    paymentMethod: 'bank' | 'credit' | 'cash';
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    nextDate: string;
    ledgerId?: string;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

let activeAuthPromise: Promise<string | null> | null = null;

const getMaybeUserId = async (): Promise<string | null> => {
    if (activeAuthPromise) return activeAuthPromise;

    activeAuthPromise = (async () => {
        try {
            // 1. FAST PATH: Check local session first (no network request)
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) return session.user.id;

            // 2. SLOW PATH: Verify with server if local session is missing
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Auth Timeout')), 2000)
            );

            const userPromise = supabase.auth.getUser();
            
            try {
                const result: any = await Promise.race([userPromise, timeoutPromise]);
                return result.data?.user?.id || null;
            } catch (e) {
                console.warn("[Auth] getUser failed or timed out, returning null session");
                return null;
            }
        } catch (error) {
            console.error("[Auth] getMaybeUserId error:", error);
            return null;
        } finally {
            // Clear current promise after a short delay to allow batching
            // but ensuring subsequent separate user interactions get fresh state
            setTimeout(() => { activeAuthPromise = null; }, 100);
        }
    })();

    return activeAuthPromise;
};

const getCurrentUserId = async (): Promise<string> => {
    const userId = await getMaybeUserId();
    if (!userId) throw new Error('User not authenticated');
    return userId;
};

const mapTransactionFromDb = (tx: any): Transaction => ({
    id: tx.id,
    description: tx.description,
    amount: parseFloat(tx.amount),
    date: tx.date,
    type: tx.type,
    category: tx.category,
    paymentMethod: tx.payment_method,
    ledgerId: tx.ledger_id,
    createdAt: tx.created_at,
    updatedAt: tx.updated_at,
});

const mapLedgerFromDb = (ledger: any): Ledger => ({
    id: ledger.id,
    name: ledger.name,
    description: ledger.description || '',
    balance: parseFloat(ledger.balance),
    initialBalance: parseFloat(ledger.initial_balance || 0),
    icon: ledger.icon,
    accountType: ledger.account_type,
    createdAt: ledger.created_at,
    updatedAt: ledger.updated_at,
});

// ============================================
// TRANSACTION API
// ============================================

export const transactionApi = {
    // Get all transactions
    getAll: async (): Promise<Transaction[]> => {
        const userId = await getMaybeUserId();
        if (!userId) return [];

        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false });

        if (error) throw new Error(error.message);
        return (data || []).map(mapTransactionFromDb);
    },

    // Get transaction by ID
    getById: async (id: string): Promise<Transaction> => {
        const userId = await getCurrentUserId();
        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (error) throw new Error(error.message);
        return mapTransactionFromDb(data);
    },

    // Get transactions by type
    getByType: async (type: 'income' | 'expense'): Promise<Transaction[]> => {
        const userId = await getMaybeUserId();
        if (!userId) return [];

        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .eq('type', type)
            .order('date', { ascending: false });

        if (error) throw new Error(error.message);
        return (data || []).map(mapTransactionFromDb);
    },

    // Get transactions by payment method
    getByPaymentMethod: async (method: 'bank' | 'credit' | 'cash'): Promise<Transaction[]> => {
        const userId = await getMaybeUserId();
        if (!userId) return [];

        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .eq('payment_method', method)
            .order('date', { ascending: false });

        if (error) throw new Error(error.message);
        return (data || []).map(mapTransactionFromDb);
    },

    // Get transactions by category
    getByCategory: async (category: string): Promise<Transaction[]> => {
        const userId = await getMaybeUserId();
        if (!userId) return [];

        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .eq('category', category)
            .order('date', { ascending: false });

        if (error) throw new Error(error.message);
        return (data || []).map(mapTransactionFromDb);
    },

    // Get all categories
    getCategories: async (): Promise<string[]> => {
        const userId = await getCurrentUserId();
        const { data, error } = await supabase
            .from('transactions')
            .select('category')
            .eq('user_id', userId);

        if (error) throw new Error(error.message);
        const categories = [...new Set((data || []).map(t => t.category))];
        return categories;
    },

    // Get transactions by ledger ID
    getByLedgerId: async (ledgerId: string, page: number = 1, pageSize: number = 50): Promise<{ items: Transaction[], totalCount: number }> => {
        const userId = await getCurrentUserId();
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data, error, count } = await supabase
            .from('transactions')
            .select('*', { count: 'exact' })
            .eq('user_id', userId)
            .eq('ledger_id', ledgerId)
            .order('date', { ascending: false })
            .range(from, to);

        if (error) throw new Error(error.message);
        return {
            items: (data || []).map(mapTransactionFromDb),
            totalCount: count || 0,
        };
    },

    // Get transactions by date range
    getByDateRange: async (startDate: string, endDate: string): Promise<Transaction[]> => {
        const userId = await getMaybeUserId();
        if (!userId) return [];

        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date', { ascending: false });

        if (error) throw new Error(error.message);
        return (data || []).map(mapTransactionFromDb);
    },

    // Get transaction statistics
    getStats: async (startDate?: string, endDate?: string): Promise<TransactionStats> => {
        const userId = await getCurrentUserId();
        let query = supabase
            .from('transactions')
            .select('type, amount')
            .eq('user_id', userId);

        if (startDate) query = query.gte('date', startDate);
        if (endDate) query = query.lte('date', endDate);

        const { data, error } = await query;
        if (error) throw new Error(error.message);

        const totalIncome = (data || [])
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);

        const totalExpenses = (data || [])
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);

        return {
            totalIncome,
            totalExpenses,
            balance: totalIncome - totalExpenses,
            totalBalance: totalIncome - totalExpenses,
        };
    },

    // Get category breakdown
    getCategoryBreakdown: async (type: 'income' | 'expense' = 'expense'): Promise<any[]> => {
        const userId = await getCurrentUserId();
        const { data, error } = await supabase
            .from('transactions')
            .select('category, amount')
            .eq('user_id', userId)
            .eq('type', type);

        if (error) throw new Error(error.message);

        const breakdown: Record<string, { category: string, amount: number, count: number }> = {};
        (data || []).forEach(tx => {
            if (!breakdown[tx.category]) {
                breakdown[tx.category] = { category: tx.category, amount: 0, count: 0 };
            }
            breakdown[tx.category].amount += parseFloat(tx.amount);
            breakdown[tx.category].count += 1;
        });

        return Object.values(breakdown).sort((a, b) => b.amount - a.amount);
    },

    // Get monthly trends
    getMonthlyTrends: async (): Promise<any[]> => {
        const userId = await getCurrentUserId();
        const { data, error } = await supabase
            .from('transactions')
            .select('date, type, amount')
            .eq('user_id', userId)
            .order('date', { ascending: true });

        if (error) throw new Error(error.message);

        const trends: Record<string, { month: string, income: number, expense: number, savings: number }> = {};
        (data || []).forEach(tx => {
            const date = new Date(tx.date);
            const month = date.toLocaleString('default', { month: 'short', year: '2-digit' });
            
            if (!trends[month]) {
                trends[month] = { month, income: 0, expense: 0, savings: 0 };
            }
            
            const amount = parseFloat(tx.amount);
            if (tx.type === 'income') {
                trends[month].income += amount;
            } else {
                trends[month].expense += amount;
            }
            trends[month].savings = trends[month].income - trends[month].expense;
        });

        return Object.values(trends);
    },

    // Create transaction
    create: async (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> => {
        const userId = await getCurrentUserId();
        
        // Validate amount
        if (transaction.amount <= 0) {
            throw new Error('Amount must be greater than zero');
        }

        const { data, error } = await supabase
            .from('transactions')
            .insert({
                user_id: userId,
                description: transaction.description,
                amount: transaction.amount,
                date: transaction.date,
                type: transaction.type,
                category: transaction.category,
                payment_method: transaction.paymentMethod,
                ledger_id: transaction.ledgerId || null,
            })
            .select()
            .single();

        if (error) throw new Error(error.message);
        return mapTransactionFromDb(data);
    },

    // Update transaction
    update: async (id: string, transaction: Partial<Transaction>): Promise<void> => {
        const userId = await getCurrentUserId();

        // Validate amount if provided
        if (transaction.amount !== undefined && transaction.amount <= 0) {
            throw new Error('Amount must be greater than zero');
        }

        const updateData: any = {};
        if (transaction.description) updateData.description = transaction.description;
        if (transaction.amount) updateData.amount = transaction.amount;
        if (transaction.date) updateData.date = transaction.date;
        if (transaction.type) updateData.type = transaction.type;
        if (transaction.category) updateData.category = transaction.category;
        if (transaction.paymentMethod) updateData.payment_method = transaction.paymentMethod;
        if (transaction.ledgerId !== undefined) updateData.ledger_id = transaction.ledgerId;

        const { error } = await supabase
            .from('transactions')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw new Error(error.message);
    },

    // Delete transaction
    delete: async (id: string): Promise<void> => {
        const userId = await getCurrentUserId();
        const { error } = await supabase
            .from('transactions')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw new Error(error.message);
    },

    // Import file (not implemented - would need backend processing)
    importFile: async (file: File, ledgerId?: string): Promise<void> => {
        throw new Error('Import feature requires backend processing - not yet implemented with Supabase');
    },

    // Generate PDF (not implemented - would need backend processing)
    generatePdf: async (id: string): Promise<Blob> => {
        throw new Error('PDF generation requires backend processing - not yet implemented with Supabase');
    },
};

// ============================================
// LEDGER API
// ============================================

export const ledgerApi = {
    // Get all ledgers
    getAll: async (): Promise<Ledger[]> => {
        const userId = await getMaybeUserId();
        if (!userId) return [];

        const { data, error } = await supabase
            .from('ledgers')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        return (data || []).map(mapLedgerFromDb);
    },

    // Get ledger by ID
    getById: async (id: string): Promise<Ledger> => {
        const userId = await getCurrentUserId();
        const { data, error } = await supabase
            .from('ledgers')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (error) throw new Error(error.message);
        return mapLedgerFromDb(data);
    },

    // Get ledgers by account type
    getByType: async (type: 'bank' | 'credit'): Promise<Ledger[]> => {
        const userId = await getCurrentUserId();
        const { data, error } = await supabase
            .from('ledgers')
            .select('*')
            .eq('user_id', userId)
            .eq('account_type', type)
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        return (data || []).map(mapLedgerFromDb);
    },

    // Get ledger statistics
    getStats: async (): Promise<LedgerStats> => {
        const userId = await getCurrentUserId();
        const { data, error } = await supabase
            .from('ledgers')
            .select('balance, account_type')
            .eq('user_id', userId);

        if (error) throw new Error(error.message);

        const totalBalance = (data || []).reduce((sum, l) => sum + parseFloat(l.balance), 0);
        const bankBalance = (data || [])
            .filter(l => l.account_type === 'bank')
            .reduce((sum, l) => sum + parseFloat(l.balance), 0);
        const creditBalance = (data || [])
            .filter(l => l.account_type === 'credit')
            .reduce((sum, l) => sum + parseFloat(l.balance), 0);

        return { totalBalance, bankBalance, creditBalance };
    },

    // Create ledger
    create: async (ledger: Omit<Ledger, 'id' | 'createdAt' | 'updatedAt'>): Promise<Ledger> => {
        const userId = await getCurrentUserId();
        const { data, error } = await supabase
            .from('ledgers')
            .insert({
                user_id: userId,
                name: ledger.name,
                description: ledger.description || '',
                balance: ledger.initialBalance || 0,
                initial_balance: ledger.initialBalance || 0,
                icon: ledger.icon,
                account_type: ledger.accountType,
            })
            .select()
            .single();

        if (error) throw new Error(error.message);
        return mapLedgerFromDb(data);
    },

    // Update ledger
    update: async (id: string, ledger: Partial<Ledger>): Promise<void> => {
        const userId = await getCurrentUserId();
        const updateData: any = {};
        if (ledger.name) updateData.name = ledger.name;
        if (ledger.description !== undefined) updateData.description = ledger.description;
        if (ledger.balance !== undefined) updateData.balance = ledger.balance;
        if (ledger.initialBalance !== undefined) updateData.initial_balance = ledger.initialBalance;
        if (ledger.icon) updateData.icon = ledger.icon;
        if (ledger.accountType) updateData.account_type = ledger.accountType;

        const { error } = await supabase
            .from('ledgers')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw new Error(error.message);
    },

    // Update ledger balance only
    updateBalance: async (id: string, balance: number): Promise<void> => {
        const userId = await getCurrentUserId();
        const { error } = await supabase
            .from('ledgers')
            .update({ balance })
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw new Error(error.message);
    },

    // Delete ledger
    delete: async (id: string): Promise<void> => {
        const userId = await getCurrentUserId();
        const { error } = await supabase
            .from('ledgers')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw new Error(error.message);
    },
};

// ============================================
// CATEGORY API
// ============================================

export const categoryApi = {
    getAll: async (): Promise<Category[]> => {
        const userId = await getMaybeUserId();
        if (!userId) return [];

        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('user_id', userId)
            .order('name');

        if (error) throw new Error(error.message);
        return (data || []).map(cat => ({
            id: cat.id,
            name: cat.name,
            type: cat.type,
            icon: cat.icon,
            color: cat.color,
            keywords: cat.keywords,
            parentId: cat.parent_id,
        }));
    },

    create: async (category: Omit<Category, 'id'>): Promise<Category> => {
        const userId = await getCurrentUserId();
        const { data, error } = await supabase
            .from('categories')
            .insert({
                user_id: userId,
                name: category.name,
                type: category.type,
                icon: category.icon,
                color: category.color,
                keywords: category.keywords,
                parent_id: category.parentId || null,
            })
            .select()
            .single();

        if (error) throw new Error(error.message);
        return {
            id: data.id,
            name: data.name,
            type: data.type,
            icon: data.icon,
            color: data.color,
            keywords: data.keywords,
            parentId: data.parent_id,
        };
    },

    update: async (id: string, category: Partial<Category>): Promise<void> => {
        const userId = await getCurrentUserId();
        const updateData: any = {};
        if (category.name) updateData.name = category.name;
        if (category.type) updateData.type = category.type;
        if (category.icon) updateData.icon = category.icon;
        if (category.color) updateData.color = category.color;
        if (category.keywords !== undefined) updateData.keywords = category.keywords;
        if (category.parentId !== undefined) updateData.parent_id = category.parentId;

        const { error } = await supabase
            .from('categories')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw new Error(error.message);
    },

    delete: async (id: string): Promise<void> => {
        const userId = await getCurrentUserId();
        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw new Error(error.message);
    },

    seed: async (): Promise<void> => {
        // Default categories can be seeded here
        const userId = await getCurrentUserId();
        const defaultCategories = [
            { name: 'Salary', type: 'income', icon: 'Wallet', color: '#10B981' },
            { name: 'Food & Dining', type: 'expense', icon: 'Utensils', color: '#EF4444' },
            { name: 'Transportation', type: 'expense', icon: 'Car', color: '#F59E0B' },
            { name: 'Shopping', type: 'expense', icon: 'ShoppingBag', color: '#8B5CF6' },
            { name: 'Bills & Utilities', type: 'expense', icon: 'FileText', color: '#3B82F6' },
        ];

        for (const cat of defaultCategories) {
            await supabase.from('categories').insert({
                user_id: userId,
                ...cat,
            });
        }
    },
};

// ============================================
// BUDGET API
// ============================================

export const budgetApi = {
    getAll: async (month?: number, year?: number): Promise<Budget[]> => {
        const userId = await getCurrentUserId();
        let query = supabase
            .from('budgets')
            .select('*, category:categories(*)')
            .eq('user_id', userId);

        if (month) query = query.eq('month', month);
        if (year) query = query.eq('year', year);

        const { data, error } = await query.order('month', { ascending: false });
        if (error) throw new Error(error.message);

        return (data || []).map(b => ({
            id: b.id,
            categoryId: b.category_id,
            amount: parseFloat(b.amount),
            month: b.month,
            year: b.year,
            category: b.category ? {
                id: b.category.id,
                name: b.category.name,
                type: b.category.type,
                icon: b.category.icon,
                color: b.category.color,
                keywords: b.category.keywords,
                parentId: b.category.parent_id,
            } : undefined,
        }));
    },

    getStatus: async (month: number, year: number): Promise<BudgetStatus[]> => {
        const userId = await getCurrentUserId();
        
        // Get budgets for the month
        const { data: budgets, error: budgetError } = await supabase
            .from('budgets')
            .select('*, category:categories(name)')
            .eq('user_id', userId)
            .eq('month', month)
            .eq('year', year);

        if (budgetError) throw new Error(budgetError.message);

        // Get transactions for the month
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = new Date(year, month, 0).toISOString().split('T')[0];

        const { data: transactions, error: txError } = await supabase
            .from('transactions')
            .select('category, amount')
            .eq('user_id', userId)
            .eq('type', 'expense')
            .gte('date', startDate)
            .lte('date', endDate);

        if (txError) throw new Error(txError.message);

        // Calculate spent per category
        const spentByCategory: Record<string, number> = {};
        (transactions || []).forEach(tx => {
            spentByCategory[tx.category] = (spentByCategory[tx.category] || 0) + parseFloat(tx.amount);
        });

        // Build status
        return (budgets || []).map(b => {
            const categoryName = b.category?.name || 'Unknown';
            const spent = spentByCategory[categoryName] || 0;
            const amount = parseFloat(b.amount);
            const remaining = amount - spent;
            const percentUsed = (spent / amount) * 100;

            return {
                id: b.id,
                categoryName,
                amount,
                spent,
                remaining,
                percentUsed,
            };
        });
    },

    create: async (budget: Omit<Budget, 'id'>): Promise<Budget> => {
        const userId = await getCurrentUserId();
        const { data, error } = await supabase
            .from('budgets')
            .insert({
                user_id: userId,
                category_id: budget.categoryId,
                amount: budget.amount,
                month: budget.month,
                year: budget.year,
            })
            .select()
            .single();

        if (error) throw new Error(error.message);
        return {
            id: data.id,
            categoryId: data.category_id,
            amount: parseFloat(data.amount),
            month: data.month,
            year: data.year,
        };
    },

    update: async (id: string, budget: Partial<Budget>): Promise<void> => {
        const userId = await getCurrentUserId();
        const updateData: any = {};
        if (budget.categoryId) updateData.category_id = budget.categoryId;
        if (budget.amount !== undefined) updateData.amount = budget.amount;
        if (budget.month) updateData.month = budget.month;
        if (budget.year) updateData.year = budget.year;

        const { error } = await supabase
            .from('budgets')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw new Error(error.message);
    },

    delete: async (id: string): Promise<void> => {
        const userId = await getCurrentUserId();
        const { error } = await supabase
            .from('budgets')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw new Error(error.message);
    },
};

// ============================================
// USER API (For admin features)
// ============================================

export const userApi = {
    getAll: async (): Promise<User[]> => {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('*');

        if (error) throw new Error(error.message);
        return (data || []).map(u => ({
            id: u.id,
            username: u.username,
            email: '', // Email is in auth.users, not exposed via RLS
            role: u.role,
            rights: u.rights,
            status: u.is_active ? 'Active' : 'Inactive',
            joined: u.created_at,
        }));
    },

    create: async (user: Partial<User> & { password?: string }): Promise<User> => {
        throw new Error('User creation via Supabase Auth requires admin SDK - use Supabase dashboard');
    },

    update: async (id: string, user: Partial<User>): Promise<void> => {
        const updateData: any = {};
        if (user.username) updateData.username = user.username;
        if (user.role) updateData.role = user.role;
        if (user.rights) updateData.rights = user.rights;

        const { error } = await supabase
            .from('user_profiles')
            .update(updateData)
            .eq('id', id);

        if (error) throw new Error(error.message);
    },

    resetPassword: async (id: string, newPassword: string): Promise<void> => {
        throw new Error('Password reset requires admin SDK - use Supabase dashboard');
    },

    delete: async (id: string): Promise<void> => {
        throw new Error('User deletion requires admin SDK - use Supabase dashboard');
    },
};

// ============================================
// AUDIT API
// ============================================

export const auditApi = {
    getAll: async (): Promise<AuditLog[]> => {
        const userId = await getCurrentUserId();
        const { data, error } = await supabase
            .from('audit_logs')
            .select('*')
            .eq('user_id', userId)
            .order('timestamp', { ascending: false });

        if (error) throw new Error(error.message);
        return (data || []).map(log => ({
            id: log.id,
            userId: log.user_id,
            username: log.username,
            action: log.action,
            module: log.module,
            details: log.details,
            timestamp: log.timestamp,
        }));
    },
};

// ============================================
// COMPANY API
// ============================================

export const companyApi = {
    getAll: async (): Promise<Company[]> => {
        const userId = await getMaybeUserId();
        if (!userId) return [];
        
        const { data, error } = await supabase
            .from('companies')
            .select('*')
            .eq('user_id', userId);

        if (error) throw new Error(error.message);
        return (data || []).map(c => ({
            id: c.id,
            name: c.name,
            description: c.description,
            panNumber: c.pan_number,
            gstNumber: c.gst_number,
            address: c.address,
            contactEmail: c.contact_email,
            contactPhone: c.contact_phone,
            isActive: c.is_active,
            createdAt: c.created_at,
            updatedAt: c.updated_at,
        }));
    },

    getById: async (id: string): Promise<Company> => {
        const userId = await getCurrentUserId();
        const { data, error } = await supabase
            .from('companies')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (error) throw new Error(error.message);
        return {
            id: data.id,
            name: data.name,
            description: data.description,
            panNumber: data.pan_number,
            gstNumber: data.gst_number,
            address: data.address,
            contactEmail: data.contact_email,
            contactPhone: data.contact_phone,
            isActive: data.is_active,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
        };
    },

    create: async (company: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>): Promise<Company> => {
        const userId = await getCurrentUserId();
        const { data, error } = await supabase
            .from('companies')
            .insert({
                user_id: userId,
                name: company.name,
                description: company.description,
                pan_number: company.panNumber,
                gst_number: company.gstNumber,
                address: company.address,
                contact_email: company.contactEmail,
                contact_phone: company.contactPhone,
                is_active: company.isActive,
            })
            .select()
            .single();

        if (error) throw new Error(error.message);
        return {
            id: data.id,
            name: data.name,
            description: data.description,
            panNumber: data.pan_number,
            gstNumber: data.gst_number,
            address: data.address,
            contactEmail: data.contact_email,
            contactPhone: data.contact_phone,
            isActive: data.is_active,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
        };
    },

    update: async (id: string, company: Partial<Company>): Promise<void> => {
        const userId = await getCurrentUserId();
        const updateData: any = {};
        if (company.name) updateData.name = company.name;
        if (company.description !== undefined) updateData.description = company.description;
        if (company.panNumber) updateData.pan_number = company.panNumber;
        if (company.gstNumber) updateData.gst_number = company.gstNumber;
        if (company.address) updateData.address = company.address;
        if (company.contactEmail) updateData.contact_email = company.contactEmail;
        if (company.contactPhone) updateData.contact_phone = company.contactPhone;
        if (company.isActive !== undefined) updateData.is_active = company.isActive;

        const { error } = await supabase
            .from('companies')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw new Error(error.message);
    },

    delete: async (id: string): Promise<void> => {
        const userId = await getCurrentUserId();
        const { error } = await supabase
            .from('companies')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw new Error(error.message);
    },
};

// ============================================
// FINANCIAL YEAR API
// ============================================

export const financialYearApi = {
    getAll: async (): Promise<FinancialYear[]> => {
        const userId = await getCurrentUserId();
        const { data, error } = await supabase
            .from('financial_years')
            .select('*')
            .eq('user_id', userId)
            .order('start_date', { ascending: false });

        if (error) throw new Error(error.message);
        return (data || []).map(fy => ({
            id: fy.id,
            name: fy.name,
            startDate: fy.start_date,
            endDate: fy.end_date,
            isActive: fy.is_active,
            description: fy.description,
            createdAt: fy.created_at,
            updatedAt: fy.updated_at,
        }));
    },

    getById: async (id: string): Promise<FinancialYear> => {
        const userId = await getCurrentUserId();
        const { data, error } = await supabase
            .from('financial_years')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (error) throw new Error(error.message);
        return {
            id: data.id,
            name: data.name,
            startDate: data.start_date,
            endDate: data.end_date,
            isActive: data.is_active,
            description: data.description,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
        };
    },

    create: async (fy: Omit<FinancialYear, 'id' | 'createdAt' | 'updatedAt'>): Promise<FinancialYear> => {
        const userId = await getCurrentUserId();
        const { data, error } = await supabase
            .from('financial_years')
            .insert({
                user_id: userId,
                name: fy.name,
                start_date: fy.startDate,
                end_date: fy.endDate,
                is_active: fy.isActive,
                description: fy.description,
            })
            .select()
            .single();

        if (error) throw new Error(error.message);
        return {
            id: data.id,
            name: data.name,
            startDate: data.start_date,
            endDate: data.end_date,
            isActive: data.is_active,
            description: data.description,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
        };
    },

    update: async (id: string, fy: Partial<FinancialYear>): Promise<void> => {
        const userId = await getCurrentUserId();
        const updateData: any = {};
        if (fy.name) updateData.name = fy.name;
        if (fy.startDate) updateData.start_date = fy.startDate;
        if (fy.endDate) updateData.end_date = fy.endDate;
        if (fy.isActive !== undefined) updateData.is_active = fy.isActive;
        if (fy.description !== undefined) updateData.description = fy.description;

        const { error } = await supabase
            .from('financial_years')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw new Error(error.message);
    },

    delete: async (id: string): Promise<void> => {
        const userId = await getCurrentUserId();
        const { error } = await supabase
            .from('financial_years')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw new Error(error.message);
    },
};

// ============================================
// GOAL API
// ============================================

export const goalApi = {
    getAll: async (): Promise<Goal[]> => {
        const userId = await getMaybeUserId();
        if (!userId) return [];

        const { data, error } = await supabase
            .from('goals')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        return (data || []).map(goal => ({
            id: goal.id,
            name: goal.name,
            title: goal.name,
            targetAmount: parseFloat(goal.target_amount),
            currentAmount: parseFloat(goal.current_amount),
            deadline: goal.deadline,
            description: goal.description,
            icon: goal.icon,
            color: goal.color,
            ledgerId: goal.ledger_id,
            createdAt: goal.created_at,
            updatedAt: goal.updated_at,
        }));
    },

    getById: async (id: string): Promise<Goal> => {
        const userId = await getCurrentUserId();
        const { data, error } = await supabase
            .from('goals')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (error) throw new Error(error.message);
        return {
            id: data.id,
            name: data.name,
            title: data.name,
            targetAmount: parseFloat(data.target_amount),
            currentAmount: parseFloat(data.current_amount),
            deadline: data.deadline,
            description: data.description,
            icon: data.icon,
            color: data.color,
            ledgerId: data.ledger_id,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
        };
    },

    create: async (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>): Promise<Goal> => {
        const userId = await getCurrentUserId();
        const { data, error } = await supabase
            .from('goals')
            .insert({
                user_id: userId,
                name: goal.name || (goal as any).title,
                target_amount: goal.targetAmount,
                current_amount: goal.currentAmount || 0,
                deadline: goal.deadline,
                description: goal.description,
                icon: goal.icon || 'Target',
                color: goal.color || '#10B981',
                ledger_id: goal.ledgerId,
            })
            .select()
            .single();

        if (error) throw new Error(error.message);
        return {
            id: data.id,
            name: data.name,
            title: data.name,
            targetAmount: parseFloat(data.target_amount),
            currentAmount: parseFloat(data.current_amount),
            deadline: data.deadline,
            description: data.description,
            icon: data.icon,
            color: data.color,
            ledgerId: data.ledger_id,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
        };
    },

    update: async (id: string, goal: Partial<Goal>): Promise<void> => {
        const userId = await getCurrentUserId();
        const updateData: any = {};
        if (goal.name || (goal as any).title) updateData.name = goal.name || (goal as any).title;
        if (goal.targetAmount !== undefined) updateData.target_amount = goal.targetAmount;
        if (goal.currentAmount !== undefined) updateData.current_amount = goal.currentAmount;
        if (goal.deadline !== undefined) updateData.deadline = goal.deadline;
        if (goal.description !== undefined) updateData.description = goal.description;
        if (goal.icon) updateData.icon = goal.icon;
        if (goal.color) updateData.color = goal.color;
        if (goal.ledgerId !== undefined) updateData.ledger_id = goal.ledgerId;

        const { error } = await supabase
            .from('goals')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw new Error(error.message);
    },

    delete: async (id: string): Promise<void> => {
        const userId = await getCurrentUserId();
        const { error } = await supabase
            .from('goals')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw new Error(error.message);
    },

    // Goal Contributions
    getContributions: async (goalId: string): Promise<GoalContribution[]> => {
        const { data, error } = await supabase
            .from('goal_contributions')
            .select('*')
            .eq('goal_id', goalId)
            .order('date', { ascending: false });

        if (error) throw new Error(error.message);
        return (data || []).map(c => ({
            id: c.id,
            goalId: c.goal_id,
            amount: parseFloat(c.amount),
            date: c.date,
            contributionDate: c.date,
            note: c.note,
            notes: c.note,
            ledger: c.ledgers ? { name: c.ledgers.name } : undefined,
            createdAt: c.created_at,
        }));
    },

    addContribution: async (contribution: Omit<GoalContribution, 'id' | 'createdAt'>): Promise<GoalContribution> => {
        const { data, error } = await supabase
            .from('goal_contributions')
            .insert({
                goal_id: contribution.goalId,
                amount: contribution.amount,
                date: contribution.date,
                note: contribution.note,
            })
            .select()
            .single();

        if (error) throw new Error(error.message);
        return {
            id: data.id,
            goalId: data.goal_id,
            amount: parseFloat(data.amount),
            date: data.date,
            contributionDate: data.date,
            note: data.note,
            notes: data.note,
            createdAt: data.created_at,
        };
    },
};

// ============================================
// RECURRING TRANSACTION API
// ============================================

export const recurringTransactionApi = {
    getAll: async (): Promise<RecurringTransaction[]> => {
        const userId = await getCurrentUserId();
        const { data, error } = await supabase
            .from('recurring_transactions')
            .select('*')
            .eq('user_id', userId)
            .order('next_date');

        if (error) throw new Error(error.message);
        return (data || []).map(rt => ({
            id: rt.id,
            description: rt.description,
            amount: parseFloat(rt.amount),
            type: rt.type,
            category: rt.category,
            paymentMethod: rt.payment_method,
            frequency: rt.frequency,
            nextDate: rt.next_date,
            ledgerId: rt.ledger_id,
            isActive: rt.is_active,
            createdAt: rt.created_at,
            updatedAt: rt.updated_at,
        }));
    },

    create: async (rt: Omit<RecurringTransaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<RecurringTransaction> => {
        const userId = await getCurrentUserId();
        const { data, error } = await supabase
            .from('recurring_transactions')
            .insert({
                user_id: userId,
                description: rt.description,
                amount: rt.amount,
                type: rt.type,
                category: rt.category,
                payment_method: rt.paymentMethod,
                frequency: rt.frequency,
                next_date: rt.nextDate,
                ledger_id: rt.ledgerId,
                is_active: rt.isActive,
            })
            .select()
            .single();

        if (error) throw new Error(error.message);
        return {
            id: data.id,
            description: data.description,
            amount: parseFloat(data.amount),
            type: data.type,
            category: data.category,
            paymentMethod: data.payment_method,
            frequency: data.frequency,
            nextDate: data.next_date,
            ledgerId: data.ledger_id,
            isActive: data.is_active,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
        };
    },

    update: async (id: string, rt: Partial<RecurringTransaction>): Promise<void> => {
        const userId = await getCurrentUserId();
        const updateData: any = {};
        if (rt.description) updateData.description = rt.description;
        if (rt.amount !== undefined) updateData.amount = rt.amount;
        if (rt.type) updateData.type = rt.type;
        if (rt.category) updateData.category = rt.category;
        if (rt.paymentMethod) updateData.payment_method = rt.paymentMethod;
        if (rt.frequency) updateData.frequency = rt.frequency;
        if (rt.nextDate) updateData.next_date = rt.nextDate;
        if (rt.ledgerId !== undefined) updateData.ledger_id = rt.ledgerId;
        if (rt.isActive !== undefined) updateData.is_active = rt.isActive;

        const { error } = await supabase
            .from('recurring_transactions')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw new Error(error.message);
    },

    delete: async (id: string): Promise<void> => {
        const userId = await getCurrentUserId();
        const { error } = await supabase
            .from('recurring_transactions')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw new Error(error.message);
    },
};
