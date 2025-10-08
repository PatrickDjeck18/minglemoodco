import { supabase } from './supabase';

export const signInWithSupabase = async (email: string, password: string) => {
  try {
    console.log('🔐 Attempting Supabase auth for:', email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('❌ Supabase auth error:', error);
      return { success: false, error: 'Nieprawidłowy email lub hasło' };
    }
    
    if (data.user) {
      console.log('✅ Supabase auth successful for user:', data.user.id);
      return { success: true, user: data.user };
    }

    console.error('❌ No user returned from auth');
    return { success: false, error: 'Login failed' };
  } catch (error) {
    console.error('Auth error:', error);
    return { success: false, error: 'Connection failed' };
  }
};

export const signOutFromSupabase = async () => {
  try {
    await supabase.auth.signOut();
    return { success: true };
  } catch (error) {
    console.error('Sign out error:', error);
    return { success: false, error: 'Sign out failed' };
  }
};

export const getCurrentUser = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}