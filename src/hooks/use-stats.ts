import useSWR from "swr";
import { api } from "@/lib/api";

export interface CategoryStat {
    category: string;
    amount: number;
    count: number;
}

export interface WealthDistribution {
    type: string;
    balance: number;
}

export function useCategoryBreakdown(type: "income" | "expense" = "expense") {
    const { data, error, isLoading } = useSWR<CategoryStat[]>(`/Stats/category-breakdown?type=${type}`, (url: string) => api.get<CategoryStat[]>(url));

    return {
        breakdown: data || [],
        isLoading,
        isError: error
    };
}

export function useWealthDistribution() {
    const { data, error, isLoading } = useSWR<WealthDistribution[]>("/Stats/wealth-distribution", (url: string) => api.get<WealthDistribution[]>(url));

    return {
        distribution: data || [],
        isLoading,
        isError: error
    };
}

export function useStats(startDate?: string, endDate?: string) {
    const query = startDate && endDate ? `?startDate=${startDate}&endDate=${endDate}` : "";
    const { data, error, isLoading } = useSWR(`/Stats/summary${query}`, (url: string) => api.get<any>(url));

    return {
        summary: data || { totalBalance: 0, balance: 0, totalIncome: 0, totalExpenses: 0 },
        isLoading,
        isError: error
    };
}
