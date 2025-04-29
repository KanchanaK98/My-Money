import { View, ScrollView, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { Text, Card, ProgressBar, useTheme, Button, Portal, Dialog } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { getBudgets, getTotalBudget, addBudget } from '../../services/budgetService';
import { BudgetWithSpent } from '../../types/budget';
import { Link } from 'expo-router';

export default function BudgetScreen() {
  const theme = useTheme();
  const [budgets, setBudgets] = useState<BudgetWithSpent[]>([]);
  const [total, setTotal] = useState({
    total: 0,
    spent: 0,
    remaining: 0,
    percentage: 0,
  });
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [budgetsData, totalData] = await Promise.all([
        getBudgets(),
        getTotalBudget(),
      ]);
      setBudgets(budgetsData);
      setTotal(totalData);

      // Check for exceeded budgets
      budgetsData.forEach(budget => {
        if (budget.percentage >= 100) {
          Alert.alert(
            'Budget Exceeded',
            `You have exceeded your budget for ${budget.category}!`,
            [{ text: 'OK' }]
          );
        }
      });
    } catch (error) {
      console.error('Error loading budget data:', error);
      Alert.alert('Error', 'Failed to load budget data');
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
      return () => {}; // Cleanup function
    }, [loadData])
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text variant="headlineMedium">Budget</Text>
          <Link href="/add-budget" asChild>
            <Button
              mode="contained"
              icon={() => <MaterialCommunityIcons name="plus" size={20} color="white" />}
            >
              Add Budget
            </Button>
          </Link>
        </View>

        <View style={styles.summaryCard}>
          <Card>
            <Card.Content>
              <Text variant="titleMedium">Monthly Budget</Text>
              <Text variant="headlineMedium" style={styles.amount}>
                ${total.total.toFixed(2)}
              </Text>
              <Text variant="bodyMedium" style={styles.remaining}>
                ${total.remaining.toFixed(2)} remaining
              </Text>
              <ProgressBar
                progress={total.percentage / 100}
                color={getProgressColor(total.percentage, theme)}
                style={styles.progressBar}
              />
            </Card.Content>
          </Card>
        </View>

        <View style={styles.section}>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Categories
          </Text>
          <View style={styles.categories}>
            {budgets.map((budget) => (
              <Card key={budget.id} style={styles.categoryCard}>
                <Card.Content style={styles.categoryContent}>
                  <MaterialCommunityIcons
                    name={getCategoryIcon(budget.category)}
                    size={24}
                    color={theme.colors.primary}
                  />
                  <View style={styles.categoryInfo}>
                    <Text variant="titleMedium">{budget.category}</Text>
                    <Text variant="bodyMedium">
                      ${budget.spent.toFixed(2)} / ${budget.amount.toFixed(2)}
                    </Text>
                    <ProgressBar
                      progress={budget.percentage / 100}
                      color={getProgressColor(budget.percentage, theme)}
                      style={styles.categoryProgress}
                    />
                  </View>
                </Card.Content>
              </Card>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getProgressColor = (percentage: number, theme: any) => {
  if (percentage >= 100) return theme.colors.error;
  if (percentage >= 80) return theme.colors.warning;
  return theme.colors.primary;
};

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
  summaryCard: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  amount: {
    fontWeight: 'bold',
    marginVertical: 8,
  },
  remaining: {
    color: '#666',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
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
  categoryProgress: {
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
}); 