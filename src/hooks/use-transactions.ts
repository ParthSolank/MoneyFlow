"use client";

import useSWR from 'swr';
import { transactionApi, Transaction } from '@/lib/supabase-client';
 
const EMPTY_ARRAY: Transaction[] = [];

/**
 * Custom hook for fetching and caching transactions using SWR
 */
export function useTransactions(startDate?: string, endDate?: string, page: number = 1, pageSize: number = 50) {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('start', startDate);
    if (endDate) queryParams.append('end', endDate);
    queryParams.append('page', page.toString());
    queryParams.append('pageSize', pageSize.toString());

    const cacheKey = `supabase/transactions${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

    const { data, error, isLoading, mutate } = useSWR(
        cacheKey,
        async () => {
            if (startDate && endDate) {
                return await transactionApi.getByDateRange(startDate, endDate);
            }
            // For pagination, we get all and slice in-memory (can be optimized with Supabase range)
            const all = await transactionApi.getAll();
            const from = (page - 1) * pageSize;
            const to = from + pageSize;
            return {
                items: all.slice(from, to),
                totalCount: all.length,
                totalPages: Math.ceil(all.length / pageSize),
            };
        },
        {
            revalidateOnFocus: false,
            dedupingInterval: 60000,
        }
    );

    const transactionsList = data ? (Array.isArray(data) ? data : (data as any).items || []) : EMPTY_ARRAY;
    const totalCount = data && !Array.isArray(data) ? (data as any).totalCount : transactionsList.length;
    const totalPages = data && !Array.isArray(data) ? (data as any).totalPages : 1;

    return {
        transactions: transactionsList,
        totalCount,
        totalPages,
        isLoading,
        isError: error,
        mutate
    };
}
