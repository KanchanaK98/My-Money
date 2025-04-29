import { View, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { Text, TextInput, Button, SegmentedButtons, useTheme, Snackbar } from 'react-native-paper';
import { useState } from 'react';
import { router } from 'expo-router';
import { addTransaction } from '../../../services/transactionService';
import { TransactionType } from '../../../types/transaction';
import { supabase } from '../../../lib/supabase';

export default function AddTransactionScreen() {
  const theme = useTheme();
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  const handleSubmit = async () => {
    if (!amount || !category) {
      setError('Please fill in all required fields');
      setVisible(true);
      return;
    }

    try {
      setLoading(true);
      
      // Check Supabase connection and auth
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Auth error:', authError);
        setError('Authentication error. Please try logging in again.');
        setVisible(true);
        return;
      }

      if (!user) {
        setError('No authenticated user found');
        setVisible(true);
        return;
      }

      // Try to add transaction
      await addTransaction(
        parseFloat(amount),
        type,
        category,
        description
      );
      
      router.back();
    } catch (error) {
      console.error('Detailed error:', error);
      setError('Failed to add transaction. Please try again.');
      setVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.container}>
        <View style={styles.form}>
          <Text variant="headlineMedium" style={styles.title}>
            Add Transaction
          </Text>

          <SegmentedButtons
            value={type}
            onValueChange={(value) => setType(value as TransactionType)}
            buttons={[
              { value: 'expense', label: 'Expense' },
              { value: 'income', label: 'Income' },
            ]}
            style={styles.segmentedButtons}
          />

          <TextInput
            label="Amount"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            mode="outlined"
            style={styles.input}
            placeholder="0.00"
          />

          <TextInput
            label="Category"
            value={category}
            onChangeText={setCategory}
            mode="outlined"
            style={styles.input}
            placeholder="e.g., Food, Transport, etc."
          />

          <TextInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
            placeholder="Add a description (optional)"
          />

          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.button}
            loading={loading}
            disabled={loading || !amount || !category}
          >
            Add Transaction
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
      >
        {error}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  form: {
    padding: 16,
    gap: 16,
  },
  title: {
    marginBottom: 8,
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'transparent',
  },
  button: {
    marginTop: 8,
  },
}); 