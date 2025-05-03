import { View, ScrollView, StyleSheet, SafeAreaView, Alert, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { Text, TextInput, Button, useTheme, Snackbar, Menu } from 'react-native-paper';
import { useState } from 'react';
import { router } from 'expo-router';
import { addBudget } from '../../services/budgetService';

const CATEGORIES = [
  'Food',
  'Transport',
  'Shopping',
  'Entertainment',
  'Bills',
  'Healthcare',
  'Education',
  'Other'
];

export default function AddBudgetScreen() {
  const theme = useTheme();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleAddBudget = async () => {
    if (!amount || !category) {
      setError('Please fill in all required fields');
      setVisible(true);
      return;
    }

    try {
      setLoading(true);
      await addBudget(parseFloat(amount), category);
      setAmount('');
      setCategory('');
      setError('Budget added successfully!');
      setVisible(true);
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error) {
      console.error('Error adding budget:', error);
      setError('Failed to add budget. Please try again.');
      setVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <ScrollView style={styles.container}>
          <View style={styles.form}>
            <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onSurface }]}>
              Add Budget
            </Text>

            <TextInput
              label="Amount"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              mode="outlined"
              style={styles.input}
              placeholder="0.00"
              theme={{
                colors: {
                  primary: theme.colors.primary,
                  background: theme.colors.surface,
                  text: theme.colors.onSurface,
                  placeholder: theme.colors.onSurfaceVariant,
                },
              }}
            />

            <Menu
              visible={showMenu}
              onDismiss={() => setShowMenu(false)}
              anchor={
                <TextInput
                  label="Category"
                  value={category}
                  mode="outlined"
                  style={styles.input}
                  editable={false}
                  right={
                    <TextInput.Icon
                      icon="chevron-down"
                      onPress={() => setShowMenu(true)}
                    />
                  }
                  theme={{
                    colors: {
                      primary: theme.colors.primary,
                      background: theme.colors.surface,
                      text: theme.colors.onSurface,
                      placeholder: theme.colors.onSurfaceVariant,
                    },
                  }}
                />
              }
            >
              {CATEGORIES.map((cat) => (
                <Menu.Item
                  key={cat}
                  onPress={() => {
                    setCategory(cat);
                    setShowMenu(false);
                  }}
                  title={cat}
                  titleStyle={{ color: theme.colors.onSurface }}
                />
              ))}
            </Menu>

            <Button
              mode="contained"
              onPress={handleAddBudget}
              style={styles.button}
              loading={loading}
              disabled={loading || !amount || !category}
            >
              Add Budget
            </Button>
          </View>
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
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  title: {
    marginBottom: 24,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
}); 