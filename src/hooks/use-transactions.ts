"use client";

import useSWR from 'swr';
import { transactionApi } from '@/lib/api-client';
 
const EMPTY_ARRAY: any[] = [];

/**
 * Custom hook for fetching and caching transactions using SWR
 */
export function useTransactions(startDate?: string, endDate?: string) {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('start', startDate);
    if (endDate) queryParams.append('end', endDate);

    const cacheKey = `api/transactions${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

    const { data, error, isLoading, mutate } = useSWR(
        cacheKey,
        () => {
            if (startDate && endDate) {
                return transactionApi.getByDateRange(startDate, endDate);
            }
            return transactionApi.getAll();
        },
        {
            revalidateOnFocus: false,
            dedupingInterval: 60000,
        }
    );

    return {
        transactions: data || EMPTY_ARRAY,
        isLoading,
        isError: error,
        mutate
    };
}
