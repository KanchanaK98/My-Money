import { View, StyleSheet } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { Link } from 'expo-router';

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <Text variant="displayMedium" style={styles.title}>
        My Money
      </Text>
      <Text variant="bodyLarge" style={styles.subtitle}>
        Take control of your finances
      </Text>
      <View style={styles.buttonContainer}>
        <Link href="/sign-in" asChild>
          <Button mode="contained" style={styles.button}>
            Sign In
          </Button>
        </Link>
        <Link href="/sign-up" asChild>
          <Button mode="outlined" style={styles.button}>
            Sign Up
          </Button>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    marginBottom: 10,
    fontWeight: 'bold',
  },
  subtitle: {
    marginBottom: 40,
    color: '#666',
  },
  buttonContainer: {
    width: '100%',
    gap: 10,
  },
  button: {
    width: '100%',
  },
}); 