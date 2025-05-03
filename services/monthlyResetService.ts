import { supabase } from '../lib/supabase';
import { getBudgets } from './budgetService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_RESET_MONTH_KEY = 'lastResetMonth';

export async function checkAndResetMonthlyBudgets(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No authenticated user');

  // Get current month and year
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Get last reset month from storage
  const lastResetMonth = await AsyncStorage.getItem(LAST_RESET_MONTH_KEY);
  const lastResetDate = lastResetMonth ? new Date(lastResetMonth) : null;

  // Check if we need to reset (new month or first time)
  if (!lastResetDate || lastResetDate.getMonth() !== currentMonth || lastResetDate.getFullYear() !== currentYear) {
    // Get current budgets
    const budgets = await getBudgets();

    // For each budget, create a new one with remaining balance
    for (const budget of budgets) {
      const remainingAmount = budget.amount - budget.spent;
      if (remainingAmount > 0) {
        // Add remaining amount to new month's budget
        const { error } = await supabase
          .from('budgets')
          .insert([
            {
              user_id: user.id,
              amount: remainingAmount,
              category: budget.category,
              time_frame: 'monthly',
              created_at: new Date().toISOString(),
            },
          ]);

        if (error) throw error;
      }
    }

    // Update last reset date
    await AsyncStorage.setItem(LAST_RESET_MONTH_KEY, currentDate.toISOString());
  }
} 