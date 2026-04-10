import useSWR from 'swr';
import { goalApi, Goal, GoalContribution } from '@/lib/supabase-client';

export function useGoals() {
  const { data, error, mutate } = useSWR<Goal[]>(
    'supabase/goals', 
    async () => await goalApi.getAll()
  );

  const createGoal = async (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => {
    const response = await goalApi.create(goal);
    mutate();
    return response;
  };

  const updateGoal = async (id: string, goal: Partial<Goal>) => {
    await goalApi.update(id, goal);
    mutate();
  };

  const deleteGoal = async (id: string) => {
    await goalApi.delete(id);
    mutate();
  };

  const addContribution = async (goalId: string, data: { amount: number; date: string; note?: string }) => {
    const response = await goalApi.addContribution({
      goalId,
      amount: data.amount,
      date: data.date,
      note: data.note,
    });
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

export function useGoalHistory(goalId?: string) {
  const { data, error, mutate } = useSWR<GoalContribution[]>(
    goalId ? `supabase/goals/${goalId}/history` : null, 
    async () => goalId ? await goalApi.getContributions(goalId) : []
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

// Smart Insights - TODO: Implement with Supabase Edge Function or client-side logic
export function useSmartInsights() {
  // Placeholder - needs implementation with Supabase
  return {
    insights: [] as SmartInsight[],
    isLoading: false,
    isError: false,
    mutate: () => {}
  };
}
