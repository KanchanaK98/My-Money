export type BudgetTimeFrame = 'daily' | 'monthly' | 'yearly';

export interface Budget {
  id: string;
  user_id: string;
  category: string;
  amount: number;
  time_frame: BudgetTimeFrame;
  created_at: string;
  updated_at: string;
}

export interface BudgetWithSpent extends Budget {
  spent: number;
  percentage: number;
}

export interface BudgetSummary {
  monthly: {
    total: number;
    spent: number;
    remaining: number;
    percentage: number;
  };
} 