"use client";

import useSWR from 'swr';
import { ledgerApi } from '@/lib/api-client';
 
const EMPTY_ARRAY: any[] = [];

/**
 * Custom hook to fetch and cache ledgers using SWR
 */
export function useLedgers() {
    const { data, error, isLoading, mutate } = useSWR(
        'api/ledgers',
        () => ledgerApi.getAll(),
        {
            revalidateOnFocus: false,
            dedupingInterval: 60000, // Cache for 1 minute
        }
    );

    return {
        ledgers: data || EMPTY_ARRAY,
        isLoading,
        isError: error,
        mutate
    };
}
