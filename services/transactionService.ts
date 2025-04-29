import { supabase } from '../lib/supabase';
import { Transaction, TransactionType } from '../types/transaction';

export const addTransaction = async (
  amount: number,
  type: TransactionType,
  category: string,
  description: string
) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Auth error in addTransaction:', authError);
      throw new Error('Authentication error');
    }

    if (!user) {
      throw new Error('No authenticated user found');
    }

    const { data, error } = await supabase
      .from('transactions')
      .insert([
        {
          amount,
          type,
          category,
          description,
          user_id: user.id,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase error in addTransaction:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in addTransaction:', error);
    throw error;
  }
};

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

  data.forEach(transaction => {
    if (transaction.type === 'income') {
      summary.totalIncome += transaction.amount;
      summary.totalBalance += transaction.amount;
    } else {
      summary.totalExpense += transaction.amount;
      summary.totalBalance -= transaction.amount;
    }
  });

  // Calculate category percentages
  const expenses = data.filter(t => t.type === 'expense');
  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
  
  expenses.forEach(transaction => {
    const percentage = (transaction.amount / totalExpenses) * 100;
    summary.categories[transaction.category] = {
      amount: transaction.amount,
      percentage
    };
  });

  return summary;
}; 