/**
 * API Client for MoneyFlow Pro
 * This module provides functions to interact with the .NET API backend
 */

import { api, API_BASE_URL } from '@/lib/api';

// Transaction Types
export interface Transaction {
    id?: number;
    description: string;
    amount: number;
    date: string;
    type: 'income' | 'expense';
    category: string;
    paymentMethod: 'bank' | 'credit' | 'cash';
    ledgerId?: number;
    createdAt?: string;
    updatedAt?: string;
}

// Ledger Types
export interface Ledger {
    id?: number;
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

// Statistics Types
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

// Category Types
export interface Category {
    id: number;
    name: string;
    type: 'income' | 'expense' | 'both';
    icon: string;
    color: string;
    keywords?: string;
    parentId?: number;
    subCategories?: Category[];
    companyId?: number;
}

// Budget Types
export interface Budget {
    id: number;
    categoryId: number;
    category?: Category;
    amount: number;
    month: number;
    year: number;
}

export interface BudgetStatus {
    id: number;
    categoryName: string;
    amount: number;
    spent: number;
    remaining: number;
    percentUsed: number;
}

// User Types
export interface User {
    id: number;
    username: string;
    email: string;
    role: string;
    rights?: string[];
    status?: string;
    joined?: string;
}

export interface AuditLog {
    id: number;
    userId: number;
    username: string;
    action: string;
    module: string;
    details: string;
    timestamp: string;
}

// Master Types
export interface Company {
    id?: number;
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
    id?: number;
    name: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
    description: string;
    createdAt?: string;
    updatedAt?: string;
}

/**
 * Transaction API
 */
export const transactionApi = {
    // Get all transactions
    getAll: async (): Promise<Transaction[]> => {
        return api.get('/Transactions');
    },

    // Get transaction by ID
    getById: async (id: number): Promise<Transaction> => {
        return api.get(`/Transactions/${id}`);
    },

    // Get transactions by type
    getByType: async (type: 'income' | 'expense'): Promise<Transaction[]> => {
        return api.get(`/Transactions/type/${type}`);
    },

    // Get transactions by payment method
    getByPaymentMethod: async (method: 'bank' | 'credit' | 'cash'): Promise<Transaction[]> => {
        return api.get(`/Transactions/payment-method/${method}`);
    },

    // Get transactions by category
    getByCategory: async (category: string): Promise<Transaction[]> => {
        return api.get(`/Transactions/category/${encodeURIComponent(category)}`);
    },

    // Get all categories
    getCategories: async (): Promise<string[]> => {
        return api.get('/Transactions/categories');
    },

    // Get transactions by ledger ID
    getByLedgerId: async (ledgerId: number, page: number = 1, pageSize: number = 50): Promise<{ items: Transaction[], totalCount: number }> => {
        return api.get(`/Transactions/ledger/${ledgerId}?page=${page}&pageSize=${pageSize}`);
    },

    // Get transactions by date range
    getByDateRange: async (startDate: string, endDate: string): Promise<Transaction[]> => {
        return api.get(
            `/Transactions/date-range?start=${startDate}&end=${endDate}`
        );
    },

    // Get transaction statistics
    getStats: async (startDate?: string, endDate?: string): Promise<TransactionStats> => {
        let url = '/Transactions/stats/summary';
        const params = new URLSearchParams();
        if (startDate) params.append('start', startDate);
        if (endDate) params.append('end', endDate);
        if (params.toString()) url += `?${params.toString()}`;

        return api.get(url);
    },

    // Create transaction
    create: async (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> => {
        return api.post('/Transactions', transaction);
    },

    // Update transaction
    update: async (id: number, transaction: Partial<Transaction>): Promise<void> => {
        return api.put(`/Transactions/${id}`, { id, ...transaction });
    },

    // Delete transaction
    delete: async (id: number): Promise<void> => {
        return api.delete(`/Transactions/${id}`);
    },

    // Import File
    importFile: async (file: File, ledgerId?: number): Promise<void> => {
        const formData = new FormData();
        formData.append('file', file);
        if (ledgerId) {
            formData.append('ledgerId', ledgerId.toString());
        }

        const token = localStorage.getItem('token');
        const companyId = localStorage.getItem('companyId');
        const baseUrl = API_BASE_URL;

        const response = await fetch(`${baseUrl}/Transactions/import`, {
            method: 'POST',
            headers: {
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                ...(companyId ? { 'X-Company-Id': companyId } : {})
            },
            body: formData,
            credentials: 'include', // Support HttpOnly cookies
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to import file');
        }
    },

    // Download PDF
    generatePdf: async (id: number): Promise<Blob> => {
        const token = localStorage.getItem('token');
        const companyId = localStorage.getItem('companyId');
        const baseUrl = API_BASE_URL;

        const response = await fetch(`${baseUrl}/Transactions/${id}/pdf`, {
            method: 'GET',
            headers: {
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                ...(companyId ? { 'X-Company-Id': companyId } : {})
            },
            credentials: 'include', // Support HttpOnly cookies
        });

        if (!response.ok) throw new Error('Failed to generate PDF');
        return response.blob();
    }
};

/**
 * Ledger API
 */
export const ledgerApi = {
    // Get all ledgers
    getAll: async (): Promise<Ledger[]> => {
        return api.get('/Ledgers');
    },

    // Get ledger by ID
    getById: async (id: number): Promise<Ledger> => {
        return api.get(`/Ledgers/${id}`);
    },

    // Get ledgers by account type
    getByType: async (type: 'bank' | 'credit'): Promise<Ledger[]> => {
        return api.get(`/Ledgers/type/${type}`);
    },

    // Get ledger statistics
    getStats: async (): Promise<LedgerStats> => {
        return api.get('/Ledgers/stats/summary');
    },

    // Create ledger
    create: async (ledger: Omit<Ledger, 'id' | 'createdAt' | 'updatedAt'>): Promise<Ledger> => {
        return api.post('/Ledgers', ledger);
    },

    // Update ledger
    update: async (id: number, ledger: Partial<Ledger>): Promise<void> => {
        return api.put(`/Ledgers/${id}`, { id, ...ledger });
    },

    // Update ledger balance only
    updateBalance: async (id: number, balance: number): Promise<void> => {
        return api.patch(`/Ledgers/${id}/balance`, { balance });
    },

    // Delete ledger
    delete: async (id: number): Promise<void> => {
        return api.delete(`/Ledgers/${id}`);
    },
};

/**
 * User API
 */
export const userApi = {
    // Get all users
    getAll: async (): Promise<User[]> => {
        return api.get('/Users');
    },

    // Create user
    create: async (user: Partial<User> & { password?: string }): Promise<User> => {
        return api.post('/Users', user);
    },

    // Update user
    update: async (id: number, user: Partial<User>): Promise<void> => {
        return api.put(`/Users/${id}`, user);
    },

    // Reset password
    resetPassword: async (id: number, newPassword: string): Promise<void> => {
        return api.patch(`/Users/${id}/password`, { newPassword });
    },

    // Delete user
    delete: async (id: number): Promise<void> => {
        return api.delete(`/Users/${id}`);
    },
};

/**
 * Audit API
 */
export const auditApi = {
    // Get all audit logs
    getAll: async (): Promise<AuditLog[]> => {
        return api.get('/Audit');
    }
};

/**
 * Company API
 */
export const companyApi = {
    getAll: async (): Promise<Company[]> => {
        return api.get('/Companies');
    },

    getById: async (id: number): Promise<Company> => {
        return api.get(`/Companies/${id}`);
    },

    create: async (company: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>): Promise<Company> => {
        return api.post('/Companies', company);
    },

    update: async (id: number, company: Partial<Company>): Promise<void> => {
        return api.put(`/Companies/${id}`, company);
    },

    delete: async (id: number): Promise<void> => {
        return api.delete(`/Companies/${id}`);
    }
};

/**
 * Financial Year API
 */
export const financialYearApi = {
    getAll: async (): Promise<FinancialYear[]> => {
        return api.get('/FinancialYears');
    },

    getById: async (id: number): Promise<FinancialYear> => {
        return api.get(`/FinancialYears/${id}`);
    },

    create: async (fy: Omit<FinancialYear, 'id' | 'createdAt' | 'updatedAt'>): Promise<FinancialYear> => {
        return api.post('/FinancialYears', fy);
    },

    update: async (id: number, fy: Partial<FinancialYear>): Promise<void> => {
        return api.put(`/FinancialYears/${id}`, fy);
    },

    delete: async (id: number): Promise<void> => {
        return api.delete(`/FinancialYears/${id}`);
    }
};

// Category API
export const categoryApi = {
    getAll: async (): Promise<Category[]> => {
        return api.get('/Categories');
    },
    create: async (category: Omit<Category, 'id'>): Promise<Category> => {
        return api.post('/Categories', category);
    },
    update: async (id: number, category: Partial<Category>): Promise<void> => {
        return api.put(`/Categories/${id}`, category);
    },
    delete: async (id: number): Promise<void> => {
        return api.delete(`/Categories/${id}`);
    },
    seed: async (): Promise<void> => {
        return api.post('/Categories/seed', {});
    }
};

// Budget API
export const budgetApi = {
    getAll: async (month?: number, year?: number): Promise<Budget[]> => {
        const query = new URLSearchParams();
        if (month) query.append('month', month.toString());
        if (year) query.append('year', year.toString());
        return api.get(`/Budgets?${query.toString()}`);
    },
    getStatus: async (month: number, year: number): Promise<BudgetStatus[]> => {
        return api.get(`/Budgets/status?month=${month}&year=${year}`);
    },
    create: async (budget: Omit<Budget, 'id'>): Promise<Budget> => {
        return api.post('/Budgets', budget);
    },
    update: async (id: number, budget: Partial<Budget>): Promise<void> => {
        return api.put(`/Budgets/${id}`, budget);
    },
    delete: async (id: number): Promise<void> => {
        return api.delete(`/Budgets/${id}`);
    }
};
