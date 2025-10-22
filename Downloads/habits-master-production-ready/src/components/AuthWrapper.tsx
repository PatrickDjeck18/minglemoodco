import React, { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/colors';

interface AuthWrapperProps {
  children: React.ReactNode;
  onAuthStateChange: (isAuthenticated: boolean) => void;
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({ children, onAuthStateChange }) => {
  const { user, loading } = useAuth();
  const hasCompletedInitialCheck = useRef(false);

  useEffect(() => {
    console.log('AuthWrapper state - Loading:', loading, 'User:', user ? 'Present' : 'None');
    if (!loading) {
      hasCompletedInitialCheck.current = true;
      const isAuthenticated = !!user;
      console.log('AuthWrapper - Calling onAuthStateChange with:', isAuthenticated);
      onAuthStateChange(isAuthenticated);
    }
  }, [user, loading, onAuthStateChange]);

  // Only block UI during the very first auth check
  if (!hasCompletedInitialCheck.current && loading) {
    console.log('AuthWrapper - Showing initial loading spinner');
    return (
      <View style={[styles.loadingContainer, { backgroundColor: Colors.light.background }]}> 
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={{ color: Colors.light.text, marginTop: 10 }}>Auth Loading...</Text>
      </View>
    );
  }

  console.log('AuthWrapper - Rendering children');
  return <>{children}</>;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AuthWrapper;
