import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MinimalApp() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Hello World!</Text>
      <Text style={styles.text}>FaithHabits App is working!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F7',
  },
  text: {
    fontSize: 20,
    color: '#000',
    marginBottom: 10,
  },
});
