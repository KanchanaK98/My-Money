import { supabase } from '../lib/supabase';
import { Budget, BudgetWithSpent, BudgetSummary, BudgetTimeFrame } from '../types/budget';

export async function addBudget(amount: number, category: string, timeFrame: BudgetTimeFrame = 'monthly'): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No authenticated user');

  // Ensure amount is a number
  const numericAmount = Number(amount);
  if (isNaN(numericAmount)) {
    throw new Error('Invalid amount: must be a number');
  }

  const { error } = await supabase
    .from('budgets')
    .insert([
      {
        user_id: user.id,
        amount: numericAmount,
        category,
        time_frame: timeFrame,
        created_at: new Date().toISOString(),
      },
    ]);

  if (error) throw error;
}

export async function deleteBudget(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No authenticated user');

  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
}

export async function getBudgets(timeFrame: BudgetTimeFrame = 'monthly'): Promise<BudgetWithSpent[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No authenticated user');

  // Get current period's transactions for each budget category
  const currentDate = new Date();
  let startDate: Date;
  let endDate: Date;

  switch (timeFrame) {
    case 'daily':
      startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
      endDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1);
      break;
    case 'monthly':
      startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      break;
    case 'yearly':
      startDate = new Date(currentDate.getFullYear(), 0, 1);
      endDate = new Date(currentDate.getFullYear(), 11, 31);
      break;
  }

  const { data: transactions, error: transactionsError } = await supabase
    .from('transactions')
    .select('category, amount')
    .eq('user_id', user.id)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .eq('type', 'expense');

  if (transactionsError) throw transactionsError;

  // Calculate spent amount for each category
  const categorySpent: Record<string, number> = {};
  transactions?.forEach(transaction => {
    categorySpent[transaction.category] = (categorySpent[transaction.category] || 0) + transaction.amount;
  });

  // Get budgets
  const { data: budgets, error: budgetsError } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', user.id)
    .eq('time_frame', timeFrame)
    .order('created_at', { ascending: false });

  if (budgetsError) throw budgetsError;

  // Merge budgets with the same category
  const mergedBudgets = budgets.reduce((acc: Budget[], budget: Budget) => {
    const existingBudget = acc.find(b => b.category === budget.category);
    if (existingBudget) {
      // Update the existing budget with the sum of amounts
      existingBudget.amount += budget.amount;
      // Keep the most recent created_at date
      if (new Date(budget.created_at) > new Date(existingBudget.created_at)) {
        existingBudget.created_at = budget.created_at;
      }
    } else {
      acc.push(budget);
    }
    return acc;
  }, []);

  // Combine budgets with spent amounts
  return mergedBudgets.map((budget: Budget) => {
    const spent = categorySpent[budget.category] || 0;
    const percentage = (spent / budget.amount) * 100;
    return {
      ...budget,
      spent,
      percentage,
    };
  });
}

export async function getBudgetSummary(): Promise<BudgetSummary> {
  const budgets = await getBudgets();
  
  const total = budgets.reduce((sum, budget) => sum + budget.amount, 0);
  const spent = budgets.reduce((sum, budget) => sum + budget.spent, 0);
  const remaining = total - spent;
  const percentage = total === 0 ? 0 : (spent / total) * 100;

  return {
    monthly: {
      total,
      spent,
      remaining,
      percentage,
    },
  };
} 