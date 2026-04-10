import { 
    transactionApi, 
    ledgerApi, 
    categoryApi, 
    budgetApi, 
    goalApi, 
    recurringTransactionApi,
    companyApi,
    financialYearApi,
    auditApi,
    userApi
} from './supabase-client';

/**
 * Compatibility Bridge for legacy API calls
 * Maps old .NET backend routes to new Supabase client functions
 */
export const api = {
    get: async <T>(url: string): Promise<T> => {
        // Stats
        if (url.includes('/Stats/summary')) {
            const searchParams = url.includes('?') ? new URLSearchParams(url.split('?')[1]) : new URLSearchParams();
            return await transactionApi.getStats(
                searchParams.get('startDate') || undefined,
                searchParams.get('endDate') || undefined
            ) as unknown as T;
        }
        if (url.includes('/Stats/category-breakdown')) {
            const searchParams = url.includes('?') ? new URLSearchParams(url.split('?')[1]) : new URLSearchParams();
            return await (transactionApi as any).getCategoryBreakdown(
                (searchParams.get('type') as 'income' | 'expense') || 'expense'
            ) as unknown as T;
        }
        if (url.includes('/Stats/wealth-distribution')) {
            return await ledgerApi.getStats() as unknown as T;
        }
        if (url.includes('/Stats/monthly-trends')) {
            return await (transactionApi as any).getMonthlyTrends() as unknown as T;
        }

        // Transactions
        if (url === '/Transactions' || url.startsWith('/Transactions?')) return await transactionApi.getAll() as unknown as T;
        if (url.startsWith('/Transactions/')) {
            const id = url.split('/').pop()!;
            return await transactionApi.getById(id) as unknown as T;
        }

        // Ledgers
        if (url === '/Ledgers' || url.startsWith('/Ledgers?')) return await ledgerApi.getAll() as unknown as T;
        if (url.startsWith('/Ledgers/')) {
            const id = url.split('/').pop()!;
            return await ledgerApi.getById(id) as unknown as T;
        }

        // Categories
        if (url === '/Categories' || url.startsWith('/Categories?')) return await categoryApi.getAll() as unknown as T;

        // Budgets
        if (url.includes('/Budgets/status')) {
            const searchParams = url.includes('?') ? new URLSearchParams(url.split('?')[1]) : new URLSearchParams();
            return await budgetApi.getStatus(
                parseInt(searchParams.get('month') || '0'),
                parseInt(searchParams.get('year') || '0')
            ) as unknown as T;
        }

        // Goals
        if (url === '/Goals' || url.startsWith('/Goals?')) return await goalApi.getAll() as unknown as T;

        throw new Error(`Unhandled API GET route: ${url}`);
    },

    post: async <T>(url: string, data: any): Promise<T> => {
        if (url === '/Transactions') return await transactionApi.create(data) as unknown as T;
        if (url === '/Ledgers') return await ledgerApi.create(data) as unknown as T;
        if (url === '/Categories') return await categoryApi.create(data) as unknown as T;
        if (url.startsWith('/Goals/')) {
           const goalId = url.split('/')[2];
           if (url.endsWith('/contribute')) {
               return await goalApi.addContribution({ goalId, ...data }) as unknown as T;
           }
        }
        
        throw new Error(`Unhandled API POST route: ${url}`);
    },

    put: async (url: string, data: any): Promise<void> => {
        if (url.startsWith('/Transactions/')) {
            const id = url.split('/').pop()!;
            return await transactionApi.update(id, data);
        }
        if (url.startsWith('/Ledgers/')) {
            const id = url.split('/').pop()!;
            return await ledgerApi.update(id, data);
        }
        
        throw new Error(`Unhandled API PUT route: ${url}`);
    },

    delete: async (url: string): Promise<void> => {
        if (url.startsWith('/Transactions/')) {
            const id = url.split('/').pop()!;
            return await transactionApi.delete(id);
        }
        if (url.startsWith('/Ledgers/')) {
            const id = url.split('/').pop()!;
            return await ledgerApi.delete(id);
        }
        
        throw new Error(`Unhandled API DELETE route: ${url}`);
    }
};
