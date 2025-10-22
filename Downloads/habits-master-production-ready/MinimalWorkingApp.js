import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MinimalWorkingApp() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎉 SUCCESS!</Text>
      <Text style={styles.subtitle}>FaithHabits App</Text>
      <Text style={styles.description}>
        This is a minimal working version without any external dependencies.
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
