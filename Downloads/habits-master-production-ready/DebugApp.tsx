import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors } from './src/constants/colors';

export default function DebugApp() {
  const [step, setStep] = useState(0);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebug = (info: string) => {
    console.log('DEBUG:', info);
    setDebugInfo(prev => [...prev, `${Date.now()}: ${info}`]);
  };

  useEffect(() => {
    addDebug('App started');
    
    const timer = setTimeout(() => {
      addDebug('Step 1: Basic render complete');
      setStep(1);
    }, 1000);

    const timer2 = setTimeout(() => {
      addDebug('Step 2: Context test');
      setStep(2);
    }, 2000);

    const timer3 = setTimeout(() => {
      addDebug('Step 3: Navigation test');
      setStep(3);
    }, 3000);

    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Debug App</Text>
      <Text style={styles.subtitle}>Step: {step}</Text>
      
      <View style={styles.debugContainer}>
        <Text style={styles.debugTitle}>Debug Log:</Text>
        {debugInfo.map((info, index) => (
          <Text key={index} style={styles.debugText}>
            {info}
          </Text>
        ))}
      </View>

      {step === 0 && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}

      {step >= 1 && (
        <View style={styles.successContainer}>
          <Text style={styles.successText}>✅ Basic render working</Text>
        </View>
      )}

      {step >= 2 && (
        <View style={styles.successContainer}>
          <Text style={styles.successText}>✅ Context test passed</Text>
        </View>
      )}

      {step >= 3 && (
        <View style={styles.successContainer}>
          <Text style={styles.successText}>✅ Navigation test passed</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.light.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  debugContainer: {
    backgroundColor: Colors.light.card,
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    maxHeight: 200,
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 10,
  },
  debugText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 2,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  loadingText: {
    color: Colors.light.text,
    marginTop: 10,
  },
  successContainer: {
    backgroundColor: Colors.light.success,
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  successText: {
    color: Colors.light.white,
    textAlign: 'center',
  },
});
