import { View, ScrollView, StyleSheet, SafeAreaView, Image, Alert, TouchableOpacity, Modal as RNModal, Platform, KeyboardAvoidingView } from 'react-native';
import { Text, Card, useTheme, IconButton, Portal, Modal, Button, TextInput, Menu, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState, useCallback } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useFocusEffect } from '@react-navigation/native';

interface Transaction {
  id: string;
  amount: number;
  description: string;
  created_at: string;
  image_url?: string;
}

type FilterType = 'all' | 'date' | 'amount';
type SortType = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';

export default function CategoryDetailsScreen() {
  const theme = useTheme();
  const { category } = useLocalSearchParams<{ category: string }>();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editAmount, setEditAmount] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortType, setSortType] = useState<SortType>('date-desc');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'start' | 'end'>('start');
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const loadTransactions = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('transactions')
        .select('id, amount, description, created_at, image_url')
        .eq('user_id', user.id)
        .eq('category', category)
        .eq('type', 'expense')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTransactions(data || []);
      const total = data?.reduce((sum, t) => sum + t.amount, 0) || 0;
      setTotalAmount(total);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  }, [category]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
      return () => {};
    }, [loadTransactions])
  );

  useEffect(() => {
    applyFiltersAndSort();
  }, [transactions, filterType, sortType, startDate, endDate, minAmount, maxAmount]);

  const applyFiltersAndSort = () => {
    let filtered = [...transactions];

    // Apply filters
    if (filterType === 'date') {
      filtered = filtered.filter(t => {
        const date = new Date(t.created_at);
        return date >= startDate && date <= endDate;
      });
    } else if (filterType === 'amount') {
      const min = parseFloat(minAmount) || 0;
      const max = parseFloat(maxAmount) || Infinity;
      filtered = filtered.filter(t => t.amount >= min && t.amount <= max);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortType) {
        case 'date-desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'date-asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'amount-desc':
          return b.amount - a.amount;
        case 'amount-asc':
          return a.amount - b.amount;
        default:
          return 0;
      }
    });

    setFilteredTransactions(filtered);
  };

  const handleDateSelect = (mode: 'start' | 'end') => {
    setDatePickerMode(mode);
    setShowDatePicker(true);
  };

  const handleEdit = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setEditAmount(transaction.amount.toString());
    setEditDescription(transaction.description || '');
    setEditModalVisible(true);
  };

  const handleDelete = async (transaction: Transaction) => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const { error } = await supabase
                .from('transactions')
                .delete()
                .eq('id', transaction.id);

              if (error) throw error;

              if (transaction.image_url) {
                const fileName = transaction.image_url.split('/').pop();
                if (fileName) {
                  await supabase.storage
                    .from('transaction-proofs')
                    .remove([fileName]);
                }
              }

              await loadTransactions();
            } catch (error) {
              console.error('Error deleting transaction:', error);
              Alert.alert('Error', 'Failed to delete transaction');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleSaveEdit = async () => {
    if (!selectedTransaction) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('transactions')
        .update({
          amount: parseFloat(editAmount),
          description: editDescription,
        })
        .eq('id', selectedTransaction.id);

      if (error) throw error;

      await loadTransactions();
      setEditModalVisible(false);
    } catch (error) {
      console.error('Error updating transaction:', error);
      Alert.alert('Error', 'Failed to update transaction');
    } finally {
      setLoading(false);
    }
  };

  const showImage = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setImageModalVisible(true);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <MaterialCommunityIcons
            name={getCategoryIcon(category)}
            size={32}
            color={theme.colors.primary}
          />
          <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onSurface }]}>
            {category}
          </Text>
          <Text variant="titleLarge" style={[styles.total, { color: theme.colors.error }]}>
            Total: ${totalAmount.toFixed(2)}
          </Text>
        </View>

        <View style={styles.filterSection}>
          <Menu
            visible={showFilterMenu}
            onDismiss={() => setShowFilterMenu(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setShowFilterMenu(true)}
                icon="filter"
                style={styles.filterButton}
              >
                Filter
              </Button>
            }
          >
            <Menu.Item
              onPress={() => {
                setFilterType('all');
                setShowFilterMenu(false);
              }}
              title="All"
            />
            <Menu.Item
              onPress={() => {
                setFilterType('date');
                setShowFilterMenu(false);
              }}
              title="By Date"
            />
            <Menu.Item
              onPress={() => {
                setFilterType('amount');
                setShowFilterMenu(false);
              }}
              title="By Amount"
            />
          </Menu>

          <Menu
            visible={showSortMenu}
            onDismiss={() => setShowSortMenu(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setShowSortMenu(true)}
                icon="sort"
                style={styles.filterButton}
              >
                Sort
              </Button>
            }
          >
            <Menu.Item
              onPress={() => {
                setSortType('date-desc');
                setShowSortMenu(false);
              }}
              title="Date (Newest)"
            />
            <Menu.Item
              onPress={() => {
                setSortType('date-asc');
                setShowSortMenu(false);
              }}
              title="Date (Oldest)"
            />
            <Menu.Item
              onPress={() => {
                setSortType('amount-desc');
                setShowSortMenu(false);
              }}
              title="Amount (High to Low)"
            />
            <Menu.Item
              onPress={() => {
                setSortType('amount-asc');
                setShowSortMenu(false);
              }}
              title="Amount (Low to High)"
            />
          </Menu>
        </View>

        {filterType === 'date' && (
          <View style={styles.dateFilter}>
            <Button
              mode="outlined"
              onPress={() => handleDateSelect('start')}
              style={styles.dateButton}
            >
              Start: {startDate.toLocaleDateString()}
            </Button>
            <Button
              mode="outlined"
              onPress={() => handleDateSelect('end')}
              style={styles.dateButton}
            >
              End: {endDate.toLocaleDateString()}
            </Button>
          </View>
        )}

        {filterType === 'amount' && (
          <View style={styles.amountFilter}>
            <TextInput
              label="Min Amount"
              value={minAmount}
              onChangeText={setMinAmount}
              keyboardType="decimal-pad"
              mode="outlined"
              style={styles.amountInput}
            />
            <TextInput
              label="Max Amount"
              value={maxAmount}
              onChangeText={setMaxAmount}
              keyboardType="decimal-pad"
              mode="outlined"
              style={styles.amountInput}
            />
          </View>
        )}

        <View style={styles.transactions}>
          {filteredTransactions.map((transaction) => (
            <Card key={transaction.id} style={[styles.transactionCard, { backgroundColor: theme.colors.surface }]}>
              <Card.Content>
                <View style={styles.transactionHeader}>
                  <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                    ${transaction.amount.toFixed(2)}
                  </Text>
                  <View style={styles.transactionActions}>
                    <IconButton
                      icon="pencil"
                      size={20}
                      onPress={() => handleEdit(transaction)}
                    />
                    <IconButton
                      icon="delete"
                      size={20}
                      onPress={() => handleDelete(transaction)}
                    />
                  </View>
                </View>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {new Date(transaction.created_at).toLocaleDateString()}
                </Text>
                {transaction.description && (
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
                    {transaction.description}
                  </Text>
                )}
                {transaction.image_url && (
                  <TouchableOpacity
                    onPress={() => showImage(transaction.image_url!)}
                    style={styles.imageContainer}
                  >
                    <Image
                      source={{ uri: transaction.image_url }}
                      style={styles.image}
                    />
                  </TouchableOpacity>
                )}
              </Card.Content>
            </Card>
          ))}
        </View>
      </ScrollView>

      <Portal>
        <Modal
          visible={editModalVisible}
          onDismiss={() => setEditModalVisible(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.background }]}
        >
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContent}
            keyboardVerticalOffset={Platform.OS === 'ios' ? -100 : 0}
          >
            <Text variant="headlineSmall" style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
              Edit Transaction
            </Text>
            <TextInput
              label="Amount"
              value={editAmount}
              onChangeText={setEditAmount}
              keyboardType="decimal-pad"
              mode="outlined"
              style={styles.modalInput}
            />
            <TextInput
              label="Description"
              value={editDescription}
              onChangeText={setEditDescription}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.modalInput}
            />
            <View style={styles.modalButtons}>
              <Button
                mode="outlined"
                onPress={() => setEditModalVisible(false)}
                style={styles.modalButton}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSaveEdit}
                loading={loading}
                disabled={loading || !editAmount}
                style={styles.modalButton}
              >
                Save
              </Button>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        <RNModal
          visible={imageModalVisible}
          transparent={true}
          onRequestClose={() => setImageModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.imageModal}
            activeOpacity={1}
            onPress={() => setImageModalVisible(false)}
          >
            <Image
              source={{ uri: selectedImage! }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </RNModal>
      </Portal>

      {showDatePicker && (
        <Modal
          visible={showDatePicker}
          onDismiss={() => setShowDatePicker(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.background }]}
        >
          <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginBottom: 16 }}>
            Select {datePickerMode === 'start' ? 'Start' : 'End'} Date
          </Text>
          <View style={styles.datePickerContainer}>
            <Button
              mode="outlined"
              onPress={() => {
                const date = new Date();
                if (datePickerMode === 'start') {
                  setStartDate(date);
                } else {
                  setEndDate(date);
                }
                setShowDatePicker(false);
              }}
            >
              Today
            </Button>
            <Button
              mode="outlined"
              onPress={() => {
                const date = new Date();
                date.setDate(date.getDate() - 7);
                if (datePickerMode === 'start') {
                  setStartDate(date);
                } else {
                  setEndDate(date);
                }
                setShowDatePicker(false);
              }}
            >
              Last Week
            </Button>
            <Button
              mode="outlined"
              onPress={() => {
                const date = new Date();
                date.setMonth(date.getMonth() - 1);
                if (datePickerMode === 'start') {
                  setStartDate(date);
                } else {
                  setEndDate(date);
                }
                setShowDatePicker(false);
              }}
            >
              Last Month
            </Button>
            <Button
              mode="outlined"
              onPress={() => {
                const date = new Date();
                date.setMonth(date.getMonth() - 3);
                if (datePickerMode === 'start') {
                  setStartDate(date);
                } else {
                  setEndDate(date);
                }
                setShowDatePicker(false);
              }}
            >
              Last 3 Months
            </Button>
          </View>
          <Button
            mode="contained"
            onPress={() => setShowDatePicker(false)}
            style={{ marginTop: 16 }}
          >
            Done
          </Button>
        </Modal>
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
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontWeight: 'bold',
  },
  total: {
    fontWeight: 'bold',
  },
  filterSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  filterButton: {
    flex: 1,
  },
  dateFilter: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  dateButton: {
    flex: 1,
  },
  amountFilter: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  amountInput: {
    flex: 1,
  },
  transactions: {
    padding: 16,
    gap: 12,
  },
  transactionCard: {
    marginBottom: 8,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionActions: {
    flexDirection: 'row',
  },
  imageContainer: {
    marginTop: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 200,
  },
  modal: {
    padding: 20,
    margin: 20,
    marginTop: -100,
    borderRadius: 8,
  },
  modalContent: {
    width: '100%',
  },
  modalTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  modalInput: {
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  modalButton: {
    minWidth: 100,
  },
  imageModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  datePickerContainer: {
    gap: 8,
  },
}); 