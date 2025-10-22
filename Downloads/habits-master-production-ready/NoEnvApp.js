import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';

export default function NoEnvApp() {
  const showAlert = () => {
    Alert.alert('Test', 'Button works!');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🚀 FaithHabits</Text>
      <Text style={styles.subtitle}>No Environment Variables</Text>
      <Text style={styles.description}>
        This version doesn't use any environment variables or complex dependencies.
      </Text>
      <TouchableOpacity style={styles.button} onPress={showAlert}>
        <Text style={styles.buttonText}>Test Button</Text>
      </TouchableOpacity>
      <Text style={styles.status}>✅ App is running!</Text>
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
    fontSize: 36,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666666',
    marginBottom: 20,
  },
  description: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  status: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
});
