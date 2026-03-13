import useSWR from "swr";
import { api } from "@/lib/api";

export interface MonthlyTrend {
    month: string;
    income: number;
    expense: number;
    savings: number;
}

export function useMonthlyTrends() {
    const { data, error, isLoading } = useSWR<MonthlyTrend[]>("/Stats/monthly-trends", (url: string) => api.get<MonthlyTrend[]>(url));

    return {
        trends: data || [],
        isLoading,
        isError: error
    };
}
