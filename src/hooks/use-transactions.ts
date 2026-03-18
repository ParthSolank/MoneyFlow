"use client";

import useSWR from 'swr';
import { transactionApi, Transaction } from '@/lib/api-client';
import { api } from '@/lib/api';
 
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

    // Use a properly serialized cache key string instead of object literal
    const cacheKey = `api/transactions_${startDate || 'all'}_${endDate || 'all'}_${page}_${pageSize}`;

    const { data, error, isLoading, mutate } = useSWR(
        cacheKey,
        () => {
            if (startDate && endDate) {
                // Currently getByDateRange doesn't use pagination in the backend, but we pass it anyway for consistency
                return transactionApi.getByDateRange(startDate, endDate);
            }
            // For standard getAll, we should pass pagination if we update the API client,
            // but for now the SWR key change will force re-fetch and the API uses query params
            return api.get(`/Transactions?page=${page}&pageSize=${pageSize}`);
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
