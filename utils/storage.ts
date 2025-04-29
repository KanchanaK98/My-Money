import AsyncStorage from '@react-native-async-storage/async-storage';

const CREDENTIALS_KEY = '@moneywise:credentials';

export interface StoredCredentials {
  email: string;
  rememberMe: boolean;
}

export const storeCredentials = async (email: string, rememberMe: boolean) => {
  try {
    if (rememberMe) {
      await AsyncStorage.setItem(CREDENTIALS_KEY, JSON.stringify({ email, rememberMe }));
    } else {
      await AsyncStorage.removeItem(CREDENTIALS_KEY);
    }
  } catch (error) {
    console.error('Error storing credentials:', error);
  }
};

export const getStoredCredentials = async (): Promise<StoredCredentials | null> => {
  try {
    const credentials = await AsyncStorage.getItem(CREDENTIALS_KEY);
    return credentials ? JSON.parse(credentials) : null;
  } catch (error) {
    console.error('Error getting stored credentials:', error);
    return null;
  }
}; 