import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { Text, Card, useTheme, Button, ActivityIndicator, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useFocusEffect } from '@react-navigation/native';

interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string | null;
  created_at: string;
}

interface GroupedTransactions {
  [key: string]: Transaction[];
}

export default function TransactionSummaryScreen() {
  const theme = useTheme();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load transactions when component mounts
  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Reload transactions when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadTransactions();
      return () => {};
    }, [loadTransactions])
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getGroupedTransactions = (transactions: Transaction[]): GroupedTransactions => {
    return transactions.reduce((groups, transaction) => {
      const date = new Date(transaction.created_at);
      const key = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(transaction);
      return groups;
    }, {} as GroupedTransactions);
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (filter === 'all') return true;
    return transaction.type === filter;
  });

  const groupedTransactions = getGroupedTransactions(filteredTransactions);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Button
          mode="text"
          onPress={() => router.back()}
          icon="arrow-left"
        >
          Back
        </Button>
        <Text variant="headlineMedium" style={{ color: theme.colors.onSurface }}>
          Transaction Summary
        </Text>
        <View style={styles.filterButtons}>
          <Button
            mode={filter === 'all' ? 'contained' : 'outlined'}
            onPress={() => setFilter('all')}
            style={styles.filterButton}
          >
            All
          </Button>
          <Button
            mode={filter === 'income' ? 'contained' : 'outlined'}
            onPress={() => setFilter('income')}
            style={styles.filterButton}
          >
            Income
          </Button>
          <Button
            mode={filter === 'expense' ? 'contained' : 'outlined'}
            onPress={() => setFilter('expense')}
            style={styles.filterButton}
          >
            Expense
          </Button>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <ScrollView style={styles.container}>
          {Object.entries(groupedTransactions).map(([date, transactions]) => (
            <View key={date} style={styles.dateGroup}>
              <Text variant="titleMedium" style={[styles.dateHeader, { color: theme.colors.primary }]}>
                {date}
              </Text>
              <Divider style={styles.divider} />
              {transactions.map((transaction) => (
                <Card
                  key={transaction.id}
                  style={[styles.transactionCard, { backgroundColor: theme.colors.surface }]}
                >
                  <Card.Content style={styles.transactionContent}>
                    <View style={styles.transactionInfo}>
                      <MaterialCommunityIcons
                        name={getCategoryIcon(transaction.category)}
                        size={24}
                        color={transaction.type === 'income' ? theme.colors.primary : theme.colors.error}
                      />
                      <View style={styles.transactionDetails}>
                        <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                          {transaction.category}
                        </Text>
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                          {formatDate(transaction.created_at)}
                        </Text>
                        {transaction.description && (
                          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                            {transaction.description}
                          </Text>
                        )}
                      </View>
                    </View>
                    <Text
                      variant="titleMedium"
                      style={{
                        color: transaction.type === 'income' ? theme.colors.primary : theme.colors.error
                      }}
                    >
                      {transaction.type === 'income' ? '+' : '-'} {formatAmount(transaction.amount)}
                    </Text>
                  </Card.Content>
                </Card>
              ))}
            </View>
          ))}
        </ScrollView>
      )}
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
  header: {
    padding: 16,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  filterButton: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  dateGroup: {
    marginBottom: 24,
  },
  dateHeader: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  divider: {
    marginBottom: 12,
  },
  transactionCard: {
    marginBottom: 8,
  },
  transactionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  transactionDetails: {
    flex: 1,
  },
}); 