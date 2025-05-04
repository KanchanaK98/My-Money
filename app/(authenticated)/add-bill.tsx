import React from 'react';
import { View, StyleSheet, ScrollView, Platform, SafeAreaView, Image, Alert, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, useTheme, Portal, Modal, HelperText, SegmentedButtons } from 'react-native-paper';
import { useState } from 'react';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import * as ImagePicker from 'expo-image-picker';

export default function AddBillScreen() {
  const theme = useTheme();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [billDate, setBillDate] = useState(new Date());
  const [image, setImage] = useState<string | null>(null);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [showBillDatePicker, setShowBillDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(dueDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(dueDate.getFullYear());
  const [selectedDay, setSelectedDay] = useState(dueDate.getDate());

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const updateDate = (month: number, day: number, year: number) => {
    const newDate = new Date(year, month, day);
    if (showDueDatePicker) {
      setDueDate(newDate);
    } else {
      setBillDate(newDate);
    }
  };

  const renderDatePicker = () => (
    <View style={styles.datePickerContainer}>
      <Text variant="titleMedium" style={styles.modalTitle}>
        {showDueDatePicker ? 'Select Due Date' : 'Select Bill Date'}
      </Text>
      
      <View style={styles.pickerContainer}>
        <View style={styles.pickerColumn}>
          <Text variant="bodyLarge" style={styles.pickerLabel}>Month</Text>
          <ScrollView style={styles.scrollView}>
            {months.map((month, index) => (
              <TouchableOpacity
                key={month}
                style={[
                  styles.pickerItem,
                  selectedMonth === index && styles.selectedItem
                ]}
                onPress={() => {
                  setSelectedMonth(index);
                  updateDate(index, selectedDay, selectedYear);
                }}
              >
                <Text
                  style={[
                    styles.pickerItemText,
                    selectedMonth === index && styles.selectedItemText
                  ]}
                >
                  {month}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.pickerColumn}>
          <Text variant="bodyLarge" style={styles.pickerLabel}>Day</Text>
          <ScrollView style={styles.scrollView}>
            {days.map(day => (
              <TouchableOpacity
                key={day}
                style={[
                  styles.pickerItem,
                  selectedDay === day && styles.selectedItem
                ]}
                onPress={() => {
                  setSelectedDay(day);
                  updateDate(selectedMonth, day, selectedYear);
                }}
              >
                <Text
                  style={[
                    styles.pickerItemText,
                    selectedDay === day && styles.selectedItemText
                  ]}
                >
                  {day}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.pickerColumn}>
          <Text variant="bodyLarge" style={styles.pickerLabel}>Year</Text>
          <ScrollView style={styles.scrollView}>
            {years.map(year => (
              <TouchableOpacity
                key={year}
                style={[
                  styles.pickerItem,
                  selectedYear === year && styles.selectedItem
                ]}
                onPress={() => {
                  setSelectedYear(year);
                  updateDate(selectedMonth, selectedDay, year);
                }}
              >
                <Text
                  style={[
                    styles.pickerItemText,
                    selectedYear === year && styles.selectedItemText
                  ]}
                >
                  {year}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      <Button
        mode="contained"
        onPress={() => {
          if (showDueDatePicker) {
            setShowDueDatePicker(false);
          } else {
            setShowBillDatePicker(false);
          }
        }}
        style={styles.doneButton}
      >
        Done
      </Button>
    </View>
  );

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to make this work!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        console.log('Selected image:', result.assets[0]);
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const resetForm = () => {
    setAmount('');
    setDescription('');
    const today = new Date();
    setDueDate(today);
    setBillDate(today);
    setImage(null);
    setSelectedMonth(today.getMonth());
    setSelectedYear(today.getFullYear());
    setSelectedDay(today.getDate());
    setError('');
  };

  const handleSave = async () => {
    if (!amount) {
      setError('Amount is required');
      return;
    }

    if (!description) {
      setError('Description is required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      let imageUrl = null;
      if (image) {
        try {
          console.log('Starting image upload:', image);
          const fileName = `${user.id}/${Date.now()}.jpg`;
          
          // Convert image URI to blob
          const response = await fetch(image);
          if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status}`);
          }
          
          const blob = await response.blob();
          console.log('Image blob size:', blob.size);
          
          if (blob.size === 0) {
            throw new Error('Image blob is empty');
          }

          // Create a new FormData object
          const formData = new FormData();
          formData.append('file', {
            uri: image,
            type: 'image/jpeg',
            name: fileName,
          } as any);

          console.log('Uploading form data...');
          const { data, error: uploadError } = await supabase.storage
            .from('bill-attachments')
            .upload(fileName, formData, {
              contentType: 'image/jpeg',
              upsert: false,
              cacheControl: '3600'
            });

          if (uploadError) {
            console.error('Upload error:', uploadError);
            throw uploadError;
          }

          if (!data?.path) {
            throw new Error('No path returned from upload');
          }

          console.log('Upload successful:', data);
          imageUrl = data.path;
        } catch (err) {
          console.error('Error uploading image:', err);
          setError('Failed to upload image. Please try again.');
          return;
        }
      }

      const { error: insertError } = await supabase
        .from('bills')
        .insert({
          user_id: user.id,
          amount: parseFloat(amount),
          description: description,
          due_date: dueDate.toISOString(),
          bill_date: billDate.toISOString(),
          image_url: imageUrl,
          status: 'pending',
        })
        .select();

      if (insertError) throw insertError;

      console.log('Bill saved successfully');
      resetForm();
      router.back();
    } catch (err) {
      console.error('Error saving bill:', err);
      setError('Failed to save bill. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.content}>
        <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onSurface }]}>
          Add New Bill
        </Text>

        <TextInput
          label="Amount"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          mode="outlined"
          style={styles.input}
        />

        <TextInput
          label="Description"
          value={description}
          onChangeText={setDescription}
          mode="outlined"
          style={styles.input}
          multiline
          numberOfLines={3}
          placeholder="Enter bill description (e.g., Electricity bill, Rent payment, etc.)"
        />

        <View style={styles.dateContainer}>
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
            Due Date: {dueDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
          </Text>
          <Button onPress={() => setShowDueDatePicker(true)}>
            Change Due Date
          </Button>
        </View>

        <View style={styles.dateContainer}>
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
            Bill Date: {billDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
          </Text>
          <Button onPress={() => setShowBillDatePicker(true)}>
            Change Bill Date
          </Button>
        </View>

        <Button
          mode="outlined"
          onPress={pickImage}
          style={styles.button}
        >
          {image ? 'Change Bill Image' : 'Add Bill Image'}
        </Button>

        {image && (
          <View style={styles.imagePreview}>
            <Image
              source={{ uri: image }}
              style={styles.previewImage}
              resizeMode="cover"
            />
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, marginTop: 8 }}>
              Image selected
            </Text>
          </View>
        )}

        {error ? (
          <HelperText type="error" visible={!!error}>
            {error}
          </HelperText>
        ) : null}

        <Button
          mode="contained"
          onPress={handleSave}
          loading={loading}
          disabled={loading}
          style={styles.button}
        >
          Save Bill
        </Button>
      </ScrollView>

      <Portal>
        <Modal
          visible={showDueDatePicker || showBillDatePicker}
          onDismiss={() => {
            setShowDueDatePicker(false);
            setShowBillDatePicker(false);
          }}
          contentContainerStyle={styles.modalContent}
        >
          {renderDatePicker()}
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingTop: Platform.OS === 'android' ? 16 : 0,
  },
  title: {
    marginBottom: 24,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 16,
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
  },
  imagePreview: {
    marginTop: 16,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  previewImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  datePickerContainer: {
    alignItems: 'center',
  },
  modalTitle: {
    marginBottom: 24,
    textAlign: 'center',
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    height: 300,
  },
  pickerColumn: {
    flex: 1,
    marginHorizontal: 8,
  },
  scrollView: {
    flex: 1,
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 4,
  },
  selectedItem: {
    backgroundColor: '#e3f2fd',
  },
  pickerItemText: {
    fontSize: 16,
  },
  selectedItemText: {
    color: '#1976d2',
    fontWeight: 'bold',
  },
  pickerLabel: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  doneButton: {
    marginTop: 16,
    width: '100%',
  },
}); 