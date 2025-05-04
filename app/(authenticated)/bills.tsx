import { View, StyleSheet, ScrollView, Image, Alert, Platform, SafeAreaView, TouchableOpacity, Modal } from 'react-native';
import { Text, Card, useTheme, IconButton, Button, Menu, Divider, TextInput, Portal, HelperText } from 'react-native-paper';
import { useState, useEffect, useCallback } from 'react';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useFocusEffect } from '@react-navigation/native';

interface Bill {
  id: string;
  amount: number;
  description: string;
  due_date: string;
  bill_date: string;
  image_url: string | null;
  imageUrl?: string | null;
  status: 'pending' | 'paid' | 'overdue';
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const isDateAfter = (date1: Date, date2: Date) => {
  return date1.getTime() > date2.getTime();
};

const isDateBefore = (date1: Date, date2: Date) => {
  return date1.getTime() < date2.getTime();
};

const getDateDaysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

export default function BillsScreen() {
  const theme = useTheme();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);

  useFocusEffect(
    useCallback(() => {
      console.log('Bills screen focused, reloading bills...');
      loadBills();
    }, [])
  );

  useEffect(() => {
    checkOverdueBills();
  }, [bills]);

  useEffect(() => {
    const subscription = supabase
      .channel('bills-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bills' }, () => {
        console.log('Bills table changed, reloading...');
        loadBills();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const getImageUrl = async (imageUrl: string) => {
    try {
      if (!imageUrl) {
        console.log('No image URL provided');
        return null;
      }

      console.log('Generating signed URL for:', imageUrl);
      const { data, error } = await supabase.storage
        .from('bill-attachments')
        .createSignedUrl(imageUrl, 3600);

      if (error) {
        console.error('Error generating signed URL:', error);
        return null;
      }

      if (!data?.signedUrl) {
        console.error('No signed URL returned');
        return null;
      }

      console.log('Generated signed URL successfully');
      return data.signedUrl;
    } catch (error) {
      console.error('Error in getImageUrl:', error);
      return null;
    }
  };

  const loadBills = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      console.log('Loading bills for user:', user.id);
      const { data, error } = await supabase
        .from('bills')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date', { ascending: true });

      if (error) {
        console.error('Error fetching bills:', error);
        throw error;
      }

      console.log('Fetched bills:', data);
      const billsWithUrls = await Promise.all(data?.map(async bill => {
        if (bill.image_url) {
          try {
            const signedUrl = await getImageUrl(bill.image_url);
            if (!signedUrl) {
              console.error('Failed to generate signed URL for bill:', bill.id);
            }
            return { ...bill, imageUrl: signedUrl };
          } catch (err) {
            console.error('Error processing image URL for bill:', bill.id, err);
            return { ...bill, imageUrl: null };
          }
        }
        return bill;
      }));

      console.log('Processed bills with URLs:', billsWithUrls);
      setBills(billsWithUrls || []);
    } catch (err) {
      console.error('Error loading bills:', err);
      Alert.alert('Error', 'Failed to load bills. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const checkOverdueBills = async () => {
    const today = new Date();
    const overdueBills = bills.filter(bill => 
      bill.status === 'pending' && 
      isDateBefore(new Date(bill.due_date), today)
    );

    if (overdueBills.length > 0) {
      for (const bill of overdueBills) {
        const { error } = await supabase
          .from('bills')
          .update({ status: 'overdue' })
          .eq('id', bill.id);

        if (error) {
          console.error('Error updating bill status:', error);
        }
      }
      loadBills(); // Reload to reflect status changes
    }
  };

  const handleDelete = async (bill: Bill) => {
    Alert.alert(
      'Delete Bill',
      'Are you sure you want to delete this bill?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('bills')
                .delete()
                .eq('id', bill.id);

              if (error) throw error;

              if (bill.image_url) {
                await supabase.storage
                  .from('bill-attachments')
                  .remove([bill.image_url]);
              }

              loadBills();
            } catch (err) {
              console.error('Error deleting bill:', err);
              Alert.alert('Error', 'Failed to delete bill');
            }
          },
        },
      ]
    );
  };

  const handleMarkAsPaid = async (bill: Bill) => {
    try {
      const { error } = await supabase
        .from('bills')
        .update({ status: 'paid' })
        .eq('id', bill.id);

      if (error) throw error;

      loadBills();
    } catch (err) {
      console.error('Error updating bill status:', err);
      Alert.alert('Error', 'Failed to update bill status');
    }
  };

  const handleViewImage = async (imageUrl: string) => {
    try {
      if (!imageUrl) {
        Alert.alert('Error', 'No image URL provided');
        return;
      }

      console.log('Viewing image with URL:', imageUrl);
      const signedUrl = await getImageUrl(imageUrl);
      if (!signedUrl) {
        Alert.alert('Error', 'Failed to generate image URL');
        return;
      }

      console.log('Generated signed URL for viewing:', signedUrl);
      setSelectedImage(signedUrl);
      setShowImageModal(true);
    } catch (error) {
      console.error('Error viewing image:', error);
      Alert.alert('Error', 'Failed to load the image. Please try again.');
    }
  };

  const handleDownloadImage = async (imageUrl: string) => {
    try {
      const { data: { publicUrl } } = supabase.storage
        .from('bill-attachments')
        .getPublicUrl(imageUrl);

      const downloadPath = `${FileSystem.documentDirectory}${Date.now()}.jpg`;
      
      const downloadResult = await FileSystem.downloadAsync(
        publicUrl,
        downloadPath
      );

      if (Platform.OS === 'ios') {
        await Sharing.shareAsync(downloadResult.uri);
      } else {
        await Sharing.shareAsync(downloadResult.uri, {
          mimeType: 'image/jpeg',
          dialogTitle: 'Download Bill Attachment',
        });
      }
    } catch (error) {
      console.error('Error downloading image:', error);
      Alert.alert('Error', 'Failed to download the image. Please try again.');
    }
  };

  const filteredBills = bills.filter(bill => {
    console.log('Filtering bill:', bill, 'with filter:', filter);
    if (filter === 'all') return true;
    return bill.status === filter;
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onSurface }]}>
          Bills ({filteredBills.length} of {bills.length})
        </Text>
        <View style={styles.headerActions}>
          <Menu
            visible={showFilterMenu}
            onDismiss={() => setShowFilterMenu(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setShowFilterMenu(true)}
                icon="filter"
              >
                Filter
              </Button>
            }
          >
            <Menu.Item
              onPress={() => {
                setFilter('all');
                setShowFilterMenu(false);
              }}
              title="All"
            />
            <Menu.Item
              onPress={() => {
                setFilter('pending');
                setShowFilterMenu(false);
              }}
              title="Pending"
            />
            <Menu.Item
              onPress={() => {
                setFilter('paid');
                setShowFilterMenu(false);
              }}
              title="Paid"
            />
            <Menu.Item
              onPress={() => {
                setFilter('overdue');
                setShowFilterMenu(false);
              }}
              title="Overdue"
            />
          </Menu>
          <Button
            mode="contained"
            onPress={() => router.push('/add-bill')}
            style={styles.addButton}
          >
            Add Bill
          </Button>
        </View>
      </View>

      <Portal>
        <Modal
          visible={showImageModal}
          onDismiss={() => setShowImageModal(false)}
          style={styles.modalContent}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text variant="titleMedium" style={{ color: 'white' }}>Bill Attachment</Text>
              <IconButton
                icon="close"
                iconColor="white"
                onPress={() => setShowImageModal(false)}
              />
            </View>
            {selectedImage ? (
              <Image
                source={{ uri: selectedImage }}
                style={styles.fullScreenImage}
                resizeMode="contain"
                onError={(e) => {
                  console.error('Modal image loading error:', e.nativeEvent.error);
                  console.error('Failed URL:', selectedImage);
                  Alert.alert('Error', 'Failed to load the image. Please try again.');
                }}
              />
            ) : (
              <View style={styles.loadingContainer}>
                <Text style={{ color: 'white' }}>Loading image...</Text>
              </View>
            )}
            <View style={styles.modalActions}>
              <Button
                mode="contained"
                onPress={() => selectedImage && handleDownloadImage(selectedImage)}
                icon="download"
              >
                Download
              </Button>
            </View>
          </SafeAreaView>
        </Modal>
      </Portal>

      <ScrollView style={styles.content}>
        {loading ? (
          <Text style={styles.loadingText}>Loading bills...</Text>
        ) : filteredBills.length === 0 ? (
          <Text style={styles.emptyText}>No bills found</Text>
        ) : (
          filteredBills.map((bill) => (
            <Card key={bill.id} style={[styles.card, { backgroundColor: theme.colors.surface }]}>
              <Card.Content>
                <View style={styles.cardHeader}>
                  <View>
                    <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                      ${bill.amount.toFixed(2)}
                    </Text>
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                      {bill.description}
                    </Text>
                  </View>
                  <View style={styles.cardActions}>
                    {bill.status === 'pending' && (
                      <IconButton
                        icon="check"
                        size={20}
                        onPress={() => handleMarkAsPaid(bill)}
                      />
                    )}
                    <IconButton
                      icon="delete"
                      size={20}
                      onPress={() => handleDelete(bill)}
                    />
                  </View>
                </View>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Due: {new Date(bill.due_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Bill Date: {new Date(bill.bill_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </Text>
                <View style={styles.statusContainer}>
                  <Text
                    variant="bodyMedium"
                    style={[
                      styles.status,
                      {
                        color:
                          bill.status === 'paid'
                            ? theme.colors.primary
                            : bill.status === 'overdue'
                            ? theme.colors.error
                            : theme.colors.onSurfaceVariant,
                      },
                    ]}
                  >
                    {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                  </Text>
                </View>
                {bill.image_url && (
                  <View style={styles.imageContainer}>
                    <TouchableOpacity 
                      onPress={() => handleViewImage(bill.image_url!)}
                      style={styles.imageTouchable}
                    >
                      <Image
                        source={{ 
                          uri: bill.imageUrl || ''
                        }}
                        style={styles.image}
                        resizeMode="cover"
                        onError={(e) => {
                          console.error('Image loading error:', e.nativeEvent.error);
                          console.error('Failed URL:', bill.imageUrl);
                          Alert.alert('Error', 'Failed to load the image. Please try again.');
                        }}
                      />
                    </TouchableOpacity>
                    <Button
                      mode="text"
                      onPress={() => handleViewImage(bill.image_url!)}
                      icon="image"
                    >
                      View Attachment
                    </Button>
                  </View>
                )}
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: Platform.OS === 'android' ? 16 : 0,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addButton: {
    marginLeft: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardActions: {
    flexDirection: 'row',
  },
  statusContainer: {
    marginTop: 8,
  },
  status: {
    fontWeight: 'bold',
  },
  imageContainer: {
    marginTop: 16,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  imageTouchable: {
    width: '100%',
    height: 200,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
  modalContent: {
    flex: 1,
    margin: 0,
    backgroundColor: 'black',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  fullScreenImage: {
    flex: 1,
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalActions: {
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
}); 