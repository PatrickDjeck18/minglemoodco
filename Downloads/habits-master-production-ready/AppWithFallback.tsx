import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Simple fallback component
function FallbackApp() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎉 FaithHabits App</Text>
      <Text style={styles.subtitle}>Fallback Mode</Text>
      <Text style={styles.description}>
        The app is running in fallback mode. This means there was an issue with the main app components.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 20,
    color: '#007AFF',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
});

// Try to load the main app, but fallback to simple version if it fails
let MainApp;
try {
  MainApp = require('./App').default;
} catch (error) {
  console.error('Failed to load main app:', error);
  MainApp = FallbackApp;
}

export default function AppWithFallback() {
  try {
    return <MainApp />;
  } catch (error) {
    console.error('Error rendering main app:', error);
    return <FallbackApp />;
  }
}
