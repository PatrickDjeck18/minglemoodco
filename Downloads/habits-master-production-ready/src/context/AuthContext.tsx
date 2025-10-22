import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import type { User, Session } from '@supabase/supabase-js';
import { supabaseConfig } from '../utils/config';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInAnonymously: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resetPasswordWithCode: (email: string, token: string, newPassword: string) => Promise<void>;
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
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('=== AUTH CONTEXT INITIALIZING ===');
    
    let isMounted = true;
    
    // Get initial session
    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        if (isMounted) {
          console.log('Initial session loaded:', session ? 'User logged in' : 'No user');
          setSession(session);
          setUser(session?.user ?? null);
          // Sync user profile if user exists
          if (session?.user) {
            try {
              await import('../utils/supabase').then(({ SupabaseManager }) => {
                SupabaseManager.syncUserData(session.user.id, session.user.user_metadata);
              });
            } catch (error) {
              console.error('Error syncing user profile:', error);
            }
          }
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error('Error loading session:', error);
        if (isMounted) {
          setLoading(false);
        }
      });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (isMounted) {
        console.log('Auth state changed:', _event, session ? 'User present' : 'No user');
        setSession(session);
        setUser(session?.user ?? null);
        // Sync user profile if user exists
        if (session?.user) {
          try {
            await import('../utils/supabase').then(({ SupabaseManager }) => {
              SupabaseManager.syncUserData(session.user.id, session.user.user_metadata);
            });
          } catch (error) {
            console.error('Error syncing user profile:', error);
          }
        }
        setLoading(false);
      }
    });

    return () => {
      console.log('Auth context unmounting');
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInAnonymously = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        throw new Error(`Authentication failed: ${error.message}`);
      }
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`
          }
        }
      });
      if (error) {
        throw new Error(`Signup failed: ${error.message}`);
      }
      // Sync user profile after signup
      if (data.user) {
        try {
          await import('../utils/supabase').then(({ SupabaseManager }) => {
            SupabaseManager.syncUserData(data.user!.id, data.user!.user_metadata);
          });
        } catch (syncError) {
          console.error('Error syncing user profile after signup:', syncError);
        }
      }
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      // Do not pass redirectTo; rely on code-based flow
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPasswordWithCode = async (email: string, token: string, newPassword: string) => {
    try {
      setLoading(true);
      // Step 1: Verify the recovery code (OTP)
      const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'recovery',
      });
      if (verifyError) throw verifyError;

      // Step 2: Update the user's password (requires a valid session from recovery)
      const { data: updateData, error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) throw updateError;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    session,
    loading,
    signInAnonymously,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    resetPassword,
    resetPasswordWithCode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};