import React from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { Text, Card, ProgressBar, useTheme, Button, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { getDashboardSummary } from '../../services/transactionService';
import { Link, router } from 'expo-router';

export default function DashboardScreen() {
  const theme = useTheme();
  const [summary, setSummary] = useState({
    totalBalance: 0,
    totalIncome: 0,
    totalExpense: 0,
    categories: {} as Record<string, { amount: number; percentage: number }>
  });
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getDashboardSummary();
      setSummary(data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
      return () => {};
    }, [loadData])
  );

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={{ color: theme.colors.onSurface }}>
            Dashboard
          </Text>
          <View style={styles.actionButtons}>
            <Button
              mode="contained"
              onPress={() => router.push('/transaction-summary')}
              icon="chart-bar"
              style={styles.actionButton}
            >
              View Summary
            </Button>
            <Button
              mode="contained"
              onPress={() => router.push('/transactions/add')}
              icon="plus"
              style={styles.actionButton}
            >
              Add Transaction
            </Button>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <>
            <Card style={[styles.balanceCard, { backgroundColor: theme.colors.surface }]}>
              <Card.Content>
                <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                  Total Balance
                </Text>
                <Text variant="headlineMedium" style={[styles.balance, { color: theme.colors.onSurface }]}>
                  {formatAmount(summary.totalBalance)}
                </Text>
                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <Text variant="titleSmall" style={{ color: theme.colors.primary }}>
                      Income
                    </Text>
                    <Text variant="titleMedium" style={{ color: theme.colors.primary }}>
                      {formatAmount(summary.totalIncome)}
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text variant="titleSmall" style={{ color: theme.colors.error }}>
                      Expenses
                    </Text>
                    <Text variant="titleMedium" style={{ color: theme.colors.error }}>
                      {formatAmount(summary.totalExpense)}
                    </Text>
                  </View>
                </View>
              </Card.Content>
            </Card>

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
                            {formatAmount(data.amount)}
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
          </>
        )}
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
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  balanceCard: {
    margin: 16,
    marginTop: 0,
  },
  balance: {
    fontWeight: 'bold',
    marginVertical: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  statItem: {
    alignItems: 'center',
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
    minWidth: 60,
    textAlign: 'right',
  },
}); 