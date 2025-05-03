import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { useEffect } from 'react';
import { setupNotifications } from '../services/notificationService';
import { checkAndResetMonthlyBudgets } from '../services/monthlyResetService';

export default function RootLayout() {
  useEffect(() => {
    setupNotifications();
    checkAndResetMonthlyBudgets();
  }, []);

  return (
    <PaperProvider>
      <AuthProvider>
        <ThemeProvider>
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          />
        </ThemeProvider>
      </AuthProvider>
    </PaperProvider>
  );
} 