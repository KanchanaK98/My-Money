import { View, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { Text, TextInput, Button, useTheme, Menu } from 'react-native-paper';
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
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleAddBudget = async () => {
    if (!category || !amount) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      setLoading(true);
      await addBudget(category, amountNum);
      Alert.alert('Success', 'Budget added successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error adding budget:', error);
      Alert.alert('Error', 'Failed to add budget');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text variant="headlineMedium" style={styles.title}>
          Add New Budget
        </Text>

        <View style={styles.form}>
          <Menu
            visible={showMenu}
            onDismiss={() => setShowMenu(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setShowMenu(true)}
                style={styles.categoryButton}
              >
                {category || 'Select Category'}
              </Button>
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
              />
            ))}
          </Menu>

          <TextInput
            label="Amount"
            value={amount}
            onChangeText={setAmount}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
          />

          <Button
            mode="contained"
            onPress={handleAddBudget}
            loading={loading}
            disabled={loading}
            style={styles.button}
          >
            Add Budget
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    marginBottom: 24,
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: '#fff',
  },
  categoryButton: {
    backgroundColor: '#fff',
  },
  button: {
    marginTop: 16,
  },
}); 