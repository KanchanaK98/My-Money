import { View, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { Text, Card, Button, List, Switch, useTheme, Snackbar } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeContext } from '../../contexts/ThemeContext';
import { useState } from 'react';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getTransactions } from '../../services/transactionService';
import { getBudgets } from '../../services/budgetService';

export default function SettingsScreen() {
  const theme = useTheme();
  const { user, signOut } = useAuth();
  const { isDarkMode, toggleTheme } = useThemeContext();
  const [notifications, setNotifications] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      setError('Failed to sign out. Please try again.');
      setVisible(true);
    }
  };

  const handleExportData = async () => {
    try {
      setExporting(true);
      
      // Get transactions and budgets
      const transactions = await getTransactions();
      const budgets = await getBudgets();

      // Create CSV content
      let csvContent = '';

      // Add transactions
      csvContent += 'Transactions\n';
      csvContent += 'Date,Type,Category,Amount,Description\n';
      transactions.forEach(transaction => {
        const date = new Date(transaction.created_at).toLocaleDateString();
        csvContent += `${date},${transaction.type},${transaction.category},${transaction.amount},${transaction.description || ''}\n`;
      });

      // Add budgets
      csvContent += '\nBudgets\n';
      csvContent += 'Category,Amount,Spent,Percentage\n';
      budgets.forEach(budget => {
        csvContent += `${budget.category},${budget.amount},${budget.spent},${budget.percentage}%\n`;
      });

      // Create file
      const fileName = `MoneyWise_Export_${new Date().toISOString().split('T')[0]}.csv`;
      const filePath = `${FileSystem.cacheDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(filePath, csvContent);
      
      // Share the file
      await Sharing.shareAsync(filePath, {
        mimeType: 'text/csv',
        dialogTitle: 'Export MoneyWise Data',
        UTI: 'public.comma-separated-values-text'
      });

      setError('Data exported successfully!');
      setVisible(true);
    } catch (error) {
      console.error('Error exporting data:', error);
      setError('Failed to export data. Please try again.');
      setVisible(true);
    } finally {
      setExporting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text variant="headlineMedium">Settings</Text>
        </View>

        <Card style={styles.section}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Profile
            </Text>
            <List.Item
              title={user?.email}
              description="Email"
              left={(props) => <List.Icon {...props} icon="email" />}
            />
          </Card.Content>
        </Card>

        <Card style={styles.section}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Preferences
            </Text>
            <List.Item
              title="Dark Mode"
              description="Use dark theme"
              left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
              right={() => (
                <Switch
                  value={isDarkMode}
                  onValueChange={toggleTheme}
                  color={theme.colors.primary}
                />
              )}
            />
            <List.Item
              title="Notifications"
              description="Receive app notifications"
              left={(props) => <List.Icon {...props} icon="bell" />}
              right={() => (
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  color={theme.colors.primary}
                />
              )}
            />
          </Card.Content>
        </Card>

        <Card style={styles.section}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Data
            </Text>
            <List.Item
              title="Export Data"
              description="Download your transaction history and budgets"
              left={(props) => <List.Icon {...props} icon="export" />}
              onPress={handleExportData}
              disabled={exporting}
            />
          </Card.Content>
        </Card>

        <Button
          mode="outlined"
          onPress={handleSignOut}
          style={styles.signOutButton}
          textColor={theme.colors.error}
        >
          Sign Out
        </Button>
      </ScrollView>

      <Snackbar
        visible={visible}
        onDismiss={() => setVisible(false)}
        action={{
          label: 'Dismiss',
          onPress: () => setVisible(false),
        }}
        style={{ 
          backgroundColor: theme.dark ? theme.colors.surfaceVariant : theme.colors.surface,
        }}
        theme={{
          colors: {
            onSurface: theme.dark ? '#FFFFFF' : '#000000',
            surfaceVariant: theme.dark ? theme.colors.surfaceVariant : theme.colors.surface,
          }
        }}
      >
        {error}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  signOutButton: {
    marginTop: 16,
    marginBottom: 32,
  },
}); 