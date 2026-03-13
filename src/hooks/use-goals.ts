import useSWR from 'swr';
import { api } from '@/lib/api';

export interface Goal {
  id: number;
  title: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  category?: string;
  color?: string;
  ledgerId?: number;
  ledger?: {
    id: number;
    name: string;
    accountType: string;
  };
}

export interface GoalContribution {
  id: number;
  goalId: number;
  amount: number;
  contributionDate: string;
  ledgerId?: number;
  ledger?: {
    name: string;
  };
  notes?: string;
}

export function useGoals() {
  const { data, error, mutate } = useSWR<Goal[]>(
    '/goals', 
    async (url: string) => {
      const res = await api.get(url);
      return res as Goal[];
    }
  );

  const createGoal = async (goal: Partial<Goal>) => {
    const response = await api.post('/goals', goal);
    mutate();
    return response;
  };

  const updateGoal = async (id: number, goal: Partial<Goal>) => {
    const response = await api.put(`/goals/${id}`, goal);
    mutate();
    return response;
  };

  const deleteGoal = async (id: number) => {
    const response = await api.delete(`/goals/${id}`);
    mutate();
    return response;
  };

  const addContribution = async (goalId: number, data: { amount: number; ledgerId?: number; notes?: string }) => {
    const response = await api.post(`/goals/${goalId}/contributions`, data);
    mutate();
    return response;
  };

  return {
    goals: data || [],
    isLoading: !error && !data,
    isError: error,
    createGoal,
    updateGoal,
    deleteGoal,
    addContribution,
    mutate
  };
}

export function useGoalHistory(goalId?: number) {
  const { data, error, mutate } = useSWR<GoalContribution[]>(
    goalId ? `/goals/${goalId}/history` : null, 
    async (url: string) => {
      const res = await api.get(url);
      return res as GoalContribution[];
    }
  );

  return {
    history: data || [],
    isLoading: !error && !data,
    isError: error,
    mutate
  };
}

export interface SmartInsight {
  type: 'success' | 'warning' | 'info' | 'goal';
  title: string;
  message: string;
}

export function useSmartInsights() {
  const { data, error, mutate } = useSWR<SmartInsight[]>(
    '/reports/smart-insights', 
    async (url: string) => {
      const res = await api.get(url);
      return res as SmartInsight[];
    }
  );

  return {
    insights: data || [],
    isLoading: !error && !data,
    isError: error,
    mutate
  };
}
