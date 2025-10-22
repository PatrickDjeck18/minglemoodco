import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { FirebaseManager } from '../utils/firebase';

// Platform-specific auth imports
let auth: any;
let FirebaseAuthTypes: any;

if (Platform.OS === 'web') {
  const { getAuth, onAuthStateChanged, signInAnonymously, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } = require('firebase/auth');
  auth = { onAuthStateChanged, signInAnonymously, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail };
  FirebaseAuthTypes = { User: Object };
} else {
  const authModule = require('@react-native-firebase/auth');
  auth = authModule.default;
  FirebaseAuthTypes = authModule.FirebaseAuthTypes;
}

interface AuthContextType {
  user: FirebaseAuthTypes.User | null;
  loading: boolean;
  signInAnonymously: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: any;
    
    if (Platform.OS === 'web') {
      const { getAuth } = require('firebase/auth');
      const authInstance = getAuth();
      unsubscribe = auth.onAuthStateChanged(authInstance, (user: any) => {
        setUser(user);
        setLoading(false);
      });
    } else {
      unsubscribe = auth().onAuthStateChanged((user: any) => {
        setUser(user);
        setLoading(false);
      });
    }

    return unsubscribe;
  }, []);

  const signInAnonymously = async () => {
    try {
      setLoading(true);
      if (Platform.OS === 'web') {
        const { getAuth } = require('firebase/auth');
        const authInstance = getAuth();
        await auth.signInAnonymously(authInstance);
      } else {
        await auth().signInAnonymously();
      }
    } catch (error) {
      console.error('Error signing in anonymously:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      if (Platform.OS === 'web') {
        const { getAuth } = require('firebase/auth');
        const authInstance = getAuth();
        await auth.signInWithEmailAndPassword(authInstance, email, password);
      } else {
        await auth().signInWithEmailAndPassword(email, password);
      }
    } catch (error) {
      console.error('Error signing in with email:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      setLoading(true);
      if (Platform.OS === 'web') {
        const { getAuth } = require('firebase/auth');
        const authInstance = getAuth();
        const userCredential = await auth.createUserWithEmailAndPassword(authInstance, email, password);
        
        // Update user profile
        if (userCredential.user) {
          await userCredential.user.updateProfile({
            displayName: `${firstName} ${lastName}`
          });
        }
      } else {
        const userCredential = await auth().createUserWithEmailAndPassword(email, password);
        
        // Update user profile
        if (userCredential.user) {
          await userCredential.user.updateProfile({
            displayName: `${firstName} ${lastName}`
          });
        }
      }
    } catch (error) {
      console.error('Error signing up with email:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      console.log('AuthContext: Starting sign out...');
      setLoading(true);
      if (Platform.OS === 'web') {
        const { getAuth } = require('firebase/auth');
        const authInstance = getAuth();
        await auth.signOut(authInstance);
        console.log('AuthContext: Web sign out completed');
      } else {
        await auth().signOut();
        console.log('AuthContext: Mobile sign out completed');
      }
    } catch (error) {
      console.error('AuthContext: Error signing out:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      if (Platform.OS === 'web') {
        const { getAuth } = require('firebase/auth');
        const authInstance = getAuth();
        await auth.sendPasswordResetEmail(authInstance, email);
      } else {
        await auth().sendPasswordResetEmail(email);
      }
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    signInAnonymously,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};