import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Track which budgets have already triggered notifications
const notifiedBudgets = new Set<string>();

export async function setupNotifications() {
  // Request permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for push notification!');
    return;
  }

  // Get push token
  const token = (await Notifications.getExpoPushTokenAsync()).data;
  console.log('Push token:', token);
}

export async function checkBudgetExceeded(budgets: Array<{ id: string; category: string; percentage: number }>) {
  for (const budget of budgets) {
    if (budget.percentage >= 100 && !notifiedBudgets.has(budget.id)) {
      // Mark this budget as notified
      notifiedBudgets.add(budget.id);

      // Schedule notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Budget Exceeded!',
          body: `You have exceeded your budget for ${budget.category}`,
          data: { budgetId: budget.id },
        },
        trigger: null, // Show immediately
      });
    }
  }
}

// Reset notifications at the start of each month
export function resetBudgetNotifications() {
  notifiedBudgets.clear();
} 