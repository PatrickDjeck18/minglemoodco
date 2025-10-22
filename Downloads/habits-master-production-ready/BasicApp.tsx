import React from 'react';
import { View, Text } from 'react-native';

export default function BasicApp() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
      <Text style={{ fontSize: 24, color: 'black' }}>Hello World!</Text>
      <Text style={{ fontSize: 16, color: 'blue', marginTop: 10 }}>FaithHabits App</Text>
    </View>
  );
}
