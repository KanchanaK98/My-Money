import { View, StyleSheet, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { Button, Text, TextInput, useTheme, Switch } from 'react-native-paper';
import { Link } from 'expo-router';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getStoredCredentials, storeCredentials } from '../utils/storage';

export default function SignInScreen() {
  const theme = useTheme();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const loadStoredCredentials = async () => {
      const credentials = await getStoredCredentials();
      if (credentials) {
        setEmail(credentials.email);
        setRememberMe(credentials.rememberMe);
      }
    };
    loadStoredCredentials();
  }, []);

  const handleSignIn = async () => {
    try {
      setLoading(true);
      setError('');
      await signIn(email, password);
      await storeCredentials(email, rememberMe);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <Text variant="headlineMedium" style={styles.title}>
          Welcome Back
        </Text>
        <View style={styles.form}>
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />
          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry
            style={styles.input}
          />
          <View style={styles.rememberMe}>
            <Text>Remember me</Text>
            <Switch
              value={rememberMe}
              onValueChange={setRememberMe}
              color={theme.colors.primary}
            />
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button
            mode="contained"
            onPress={handleSignIn}
            loading={loading}
            disabled={loading}
            style={styles.button}
          >
            Sign In
          </Button>
          <View style={styles.footer}>
            <Text>Don't have an account? </Text>
            <Link href="/sign-up" asChild>
              <Text style={styles.link}>Sign Up</Text>
            </Link>
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    marginTop: 40,
    marginBottom: 20,
    fontWeight: 'bold',
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: 'transparent',
  },
  button: {
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  link: {
    color: '#1976D2',
    fontWeight: 'bold',
  },
  error: {
    color: '#B00020',
    textAlign: 'center',
  },
  rememberMe: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
}); 