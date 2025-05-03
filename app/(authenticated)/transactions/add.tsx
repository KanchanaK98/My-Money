import { View, ScrollView, StyleSheet, SafeAreaView, Image } from 'react-native';
import { Text, TextInput, Button, SegmentedButtons, useTheme, Snackbar, Menu, IconButton } from 'react-native-paper';
import { useState } from 'react';
import { router } from 'expo-router';
import { addTransaction } from '../../../services/transactionService';
import { TransactionType } from '../../../types/transaction';
import { supabase } from '../../../lib/supabase';
import * as ImagePicker from 'expo-image-picker';

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

export default function AddTransactionScreen() {
  const theme = useTheme();
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [image, setImage] = useState<string | null>(null);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setError('Sorry, we need camera roll permissions to make this work!');
      setVisible(true);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const removeImage = () => {
    setImage(null);
  };

  const handleSubmit = async () => {
    if (!amount || !category) {
      setError('Please fill in all required fields');
      setVisible(true);
      return;
    }

    try {
      setLoading(true);
      
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

      let imageUrl = null;
      if (image) {
        const fileName = `${user.id}-${Date.now()}.jpg`;
        const formData = new FormData();
        formData.append('file', {
          uri: image,
          type: 'image/jpeg',
          name: fileName,
        } as any);

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('transaction-proofs')
          .upload(fileName, formData);

        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          setError('Failed to upload image. Please try again.');
          setVisible(true);
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('transaction-proofs')
          .getPublicUrl(fileName);
        
        imageUrl = publicUrl;
      }

      await addTransaction(
        parseFloat(amount),
        type,
        category,
        description,
        imageUrl || undefined
      );
      
      setAmount('');
      setCategory('');
      setDescription('');
      setType('expense');
      setImage(null);
      
      setError('Transaction added successfully!');
      setVisible(true);
      
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error) {
      console.error('Detailed error:', error);
      setError('Failed to add transaction. Please try again.');
      setVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.container}>
        <View style={styles.form}>
          <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onSurface }]}>
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

          <TextInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
            theme={{
              colors: {
                primary: theme.colors.primary,
                background: theme.colors.surface,
                text: theme.colors.onSurface,
                placeholder: theme.colors.onSurfaceVariant,
              },
            }}
          />

          {image && (
            <View style={styles.imageContainer}>
              <Image source={{ uri: image }} style={styles.image} />
              <IconButton
                icon="close"
                size={20}
                onPress={removeImage}
                style={styles.removeImageButton}
              />
            </View>
          )}

          <Button
            mode="outlined"
            onPress={pickImage}
            style={styles.imageButton}
            textColor={theme.colors.primary}
          >
            {image ? 'Change Image' : 'Add Image'}
          </Button>

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
  segmentedButtons: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  categoryButton: {
    marginBottom: 16,
    height: 56,
    justifyContent: 'center',
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  imageButton: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
}); 