import { View, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { Text, Card, Button, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { getDashboardSummary } from '../../services/transactionService';
import { useFocusEffect } from '@react-navigation/native';

export default function DashboardScreen() {
  const theme = useTheme();
  const [summary, setSummary] = useState({
    totalBalance: 0,
    totalIncome: 0,
    totalExpense: 0,
    categories: {} as Record<string, { amount: number; percentage: number }>
  });

  const loadData = useCallback(async () => {
    try {
      const data = await getDashboardSummary();
      setSummary(data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  }, []);

  // Load data when screen mounts
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
      return () => {}; // Cleanup function
    }, [loadData])
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text variant="headlineMedium">Dashboard</Text>
          <Link href="/transactions/add" asChild>
            <Button
              mode="contained"
              icon={() => <MaterialCommunityIcons name="plus" size={20} color="white" />}
            >
              Add Transaction
            </Button>
          </Link>
        </View>

        <View style={styles.summaryCards}>
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium">Total Balance</Text>
              <Text variant="headlineMedium" style={styles.amount}>
                ${summary.totalBalance.toFixed(2)}
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium">Income</Text>
              <Text variant="headlineMedium" style={[styles.amount, { color: theme.colors.primary }]}>
                ${summary.totalIncome.toFixed(2)}
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium">Expenses</Text>
              <Text variant="headlineMedium" style={[styles.amount, { color: theme.colors.error }]}>
                ${summary.totalExpense.toFixed(2)}
              </Text>
            </Card.Content>
          </Card>
        </View>

        <View style={styles.section}>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Expense Categories
          </Text>
          <View style={styles.categories}>
            {Object.entries(summary.categories).map(([category, data]) => (
              <Card key={category} style={styles.categoryCard}>
                <Card.Content style={styles.categoryContent}>
                  <MaterialCommunityIcons
                    name={getCategoryIcon(category)}
                    size={24}
                    color={theme.colors.primary}
                  />
                  <View style={styles.categoryInfo}>
                    <Text variant="titleMedium">{category}</Text>
                    <Text variant="bodyMedium">${data.amount.toFixed(2)}</Text>
                  </View>
                  <Text variant="bodyMedium">{data.percentage.toFixed(1)}%</Text>
                </Card.Content>
              </Card>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getCategoryIcon = (category: string): keyof typeof MaterialCommunityIcons.glyphMap => {
  const icons: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
    'Food': 'food',
    'Transport': 'car',
    'Shopping': 'shopping',
    'Entertainment': 'movie',
    'Bills': 'file-document',
    'Healthcare': 'medical-bag',
    'Education': 'school',
    'Other': 'dots-horizontal'
  };
  return icons[category] || 'dots-horizontal';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryCards: {
    gap: 16,
    marginBottom: 24,
  },
  card: {
    marginBottom: 8,
  },
  amount: {
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  categories: {
    gap: 12,
  },
  categoryCard: {
    marginBottom: 8,
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  categoryInfo: {
    flex: 1,
  },
}); 