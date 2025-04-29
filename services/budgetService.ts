import { supabase } from '../lib/supabase';
import { Budget, BudgetWithSpent } from '../types/budget';

export const addBudget = async (category: string, amount: number) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('User not authenticated');

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const { data, error } = await supabase
    .from('budgets')
    .insert([
      {
        category,
        amount,
        month,
        year,
        user_id: user.id,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getBudgets = async (): Promise<BudgetWithSpent[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('User not authenticated');

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  // Get budgets for current month
  const { data: budgets, error: budgetsError } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', user.id)
    .eq('month', month)
    .eq('year', year);

  if (budgetsError) throw budgetsError;

  // Get transactions for current month
  const { data: transactions, error: transactionsError } = await supabase
    .from('transactions')
    .select('category, amount')
    .eq('user_id', user.id)
    .eq('type', 'expense')
    .gte('created_at', new Date(year, month - 1, 1).toISOString())
    .lt('created_at', new Date(year, month, 1).toISOString());

  if (transactionsError) throw transactionsError;

  // Calculate spent amount for each category
  const spentByCategory = transactions.reduce((acc, transaction) => {
    acc[transaction.category] = (acc[transaction.category] || 0) + transaction.amount;
    return acc;
  }, {} as Record<string, number>);

  // Combine budgets with spent amounts
  return budgets.map(budget => {
    const spent = spentByCategory[budget.category] || 0;
    const remaining = budget.amount - spent;
    const percentage = (spent / budget.amount) * 100;

    return {
      ...budget,
      spent,
      remaining,
      percentage,
    };
  });
};

export const getTotalBudget = async (): Promise<{
  total: number;
  spent: number;
  remaining: number;
  percentage: number;
}> => {
  const budgets = await getBudgets();
  
  const total = budgets.reduce((sum, budget) => sum + budget.amount, 0);
  const spent = budgets.reduce((sum, budget) => sum + budget.spent, 0);
  const remaining = total - spent;
  const percentage = total === 0 ? 0 : (spent / total) * 100;

  return {
    total,
    spent,
    remaining,
    percentage,
  };
}; 