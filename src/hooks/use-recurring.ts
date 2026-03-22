import useSWR from "swr";
import { api } from "@/lib/api";

export interface RecurringTransaction {
    id: number;
    description: string;
    amount: number;
    type: "income" | "expense";
    category: string;
    paymentMethod: string;
    ledgerId?: number;
    interval: "daily" | "weekly" | "monthly" | "yearly";
    dayOfInterval: number;
    nextRunDate: string;
    lastRunDate?: string;
    isActive: boolean;
}

export function useRecurring() {
    const { data, error, isLoading, mutate } = useSWR<RecurringTransaction[]>("/RecurringTransactions", (url: string) => api.get<RecurringTransaction[]>(url));

    const create = async (data: Partial<RecurringTransaction>) => {
        const res = await api.post<RecurringTransaction>("/RecurringTransactions", data);
        mutate();
        return res;
    };

    const update = async (id: number, data: Partial<RecurringTransaction>) => {
        await api.put(`/RecurringTransactions/${id}`, data);
        mutate();
    };

    const remove = async (id: number) => {
        await api.delete(`/RecurringTransactions/${id}`);
        mutate();
    };

    return {
        recurring: data || [],
        isLoading,
        isError: error,
        create,
        update,
        remove,
        mutate
    };
}
