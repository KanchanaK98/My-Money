import { supabase } from '../lib/supabase';
import { Transaction, TransactionType } from '../types/transaction';
import { getBudgets } from './budgetService';

export async function addTransaction(
  amount: number,
  type: TransactionType,
  category: string,
  description?: string,
  imageUrl?: string
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No authenticated user');

  const { error } = await supabase
    .from('transactions')
    .insert([
      {
        user_id: user.id,
        amount,
        type,
        category,
        description,
        image_url: imageUrl,
        created_at: new Date().toISOString(),
      },
    ]);

  if (error) throw error;
}

export const getTransactions = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const getDashboardSummary = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('transactions')
    .select('amount, type, category')
    .eq('user_id', user.id);

  if (error) throw error;

  const summary = {
    totalBalance: 0,
    totalIncome: 0,
    totalExpense: 0,
    categories: {} as Record<string, { amount: number; percentage: number }>
  };

  // Calculate total income and expenses
  data.forEach(transaction => {
    if (transaction.type === 'income') {
      summary.totalIncome += transaction.amount;
      summary.totalBalance += transaction.amount;
    } else {
      summary.totalExpense += transaction.amount;
      summary.totalBalance -= transaction.amount;
    }
  });

  // Calculate category totals and percentages
  const expenses = data.filter(t => t.type === 'expense');
  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
  
  // Initialize category totals
  expenses.forEach(transaction => {
    if (!summary.categories[transaction.category]) {
      summary.categories[transaction.category] = {
        amount: 0,
        percentage: 0
      };
    }
    summary.categories[transaction.category].amount += transaction.amount;
  });

  // Calculate percentages after summing all transactions
  Object.keys(summary.categories).forEach(category => {
    summary.categories[category].percentage = (summary.categories[category].amount / totalExpenses) * 100;
  });

  return summary;
}; 