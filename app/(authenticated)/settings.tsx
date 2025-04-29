import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Button, List, Switch, useTheme } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { router } from 'expo-router';
import { useState } from 'react';

export default function SettingsScreen() {
  const theme = useTheme();
  const { user, signOut } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium">Settings</Text>
      </View>

      <Card style={styles.section}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Profile
          </Text>
          <List.Item
            title={user?.email}
            description="Email"
            left={(props) => <List.Icon {...props} icon="email" />}
          />
          <List.Item
            title="Edit Profile"
            left={(props) => <List.Icon {...props} icon="account-edit" />}
            onPress={() => router.push('/settings/profile')}
          />
        </Card.Content>
      </Card>

      <Card style={styles.section}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Preferences
          </Text>
          <List.Item
            title="Notifications"
            description="Receive app notifications"
            left={(props) => <List.Icon {...props} icon="bell" />}
            right={() => (
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                color={theme.colors.primary}
              />
            )}
          />
          <List.Item
            title="Dark Mode"
            description="Use dark theme"
            left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
            right={() => (
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                color={theme.colors.primary}
              />
            )}
          />
        </Card.Content>
      </Card>

      <Card style={styles.section}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Data & Sync
          </Text>
          <List.Item
            title="Export Data"
            description="Download your transaction history"
            left={(props) => <List.Icon {...props} icon="export" />}
            onPress={() => {}}
          />
          <List.Item
            title="Sync Settings"
            description="Manage cloud sync preferences"
            left={(props) => <List.Icon {...props} icon="cloud-sync" />}
            onPress={() => router.push('/settings/sync')}
          />
        </Card.Content>
      </Card>

      <Button
        mode="outlined"
        onPress={handleSignOut}
        style={styles.signOutButton}
        textColor={theme.colors.error}
      >
        Sign Out
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  signOutButton: {
    marginTop: 16,
    marginBottom: 32,
  },
}); 