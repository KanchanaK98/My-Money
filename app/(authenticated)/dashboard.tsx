import { View, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { Text, Card, Button, useTheme, ProgressBar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={{ color: theme.colors.onSurface }}>
            Dashboard
          </Text>
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
          <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                Total Balance
              </Text>
              <Text variant="headlineMedium" style={[styles.amount, { color: theme.colors.onSurface }]}>
                ${summary.totalBalance.toFixed(2)}
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                Income
              </Text>
              <Text variant="headlineMedium" style={[styles.amount, { color: theme.colors.primary }]}>
                ${summary.totalIncome.toFixed(2)}
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                Expenses
              </Text>
              <Text variant="headlineMedium" style={[styles.amount, { color: theme.colors.error }]}>
                ${summary.totalExpense.toFixed(2)}
              </Text>
            </Card.Content>
          </Card>
        </View>

        <View style={styles.section}>
          <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Expense Categories
          </Text>
          <View style={styles.categories}>
            {Object.entries(summary.categories).map(([category, data]) => (
              <TouchableOpacity
                key={category}
                onPress={() => router.push(`/category-details?category=${encodeURIComponent(category)}`)}
              >
                <Card style={[styles.categoryCard, { backgroundColor: theme.colors.surface }]}>
                  <Card.Content style={styles.categoryContent}>
                    <MaterialCommunityIcons
                      name={getCategoryIcon(category)}
                      size={24}
                      color={theme.colors.primary}
                    />
                    <View style={styles.categoryInfo}>
                      <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                        {category}
                      </Text>
                      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                        ${data.amount.toFixed(2)}
                      </Text>
                      <ProgressBar
                        progress={data.percentage / 100}
                        color={theme.colors.primary}
                        style={styles.progressBar}
                      />
                    </View>
                    <Text variant="bodyMedium" style={[styles.percentage, { color: theme.colors.onSurfaceVariant }]}>
                      {data.percentage.toFixed(1)}%
                    </Text>
                  </Card.Content>
                </Card>
              </TouchableOpacity>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 16,
  },
  summaryCards: {
    paddingHorizontal: 16,
    gap: 16,
    marginBottom: 24,
  },
  card: {
    marginBottom: 8,
  },
  amount: {
    fontWeight: 'bold',
    marginVertical: 8,
  },
  section: {
    padding: 16,
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
  progressBar: {
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
  percentage: {
    minWidth: 50,
    textAlign: 'right',
  },
}); 