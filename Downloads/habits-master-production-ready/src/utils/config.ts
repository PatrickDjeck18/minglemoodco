export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Supabase configuration
export const supabaseConfig = {
  url: 'https://pcnuwnafchustporkxgn.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjbnV3bmFmY2h1c3Rwb3JreGduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MTU2MDIsImV4cCI6MjA3NjE5MTYwMn0.yr-ChbrZyNpDkMotFq-j3cGWFemOVQ0MUYQekCvF01k',
  serviceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjbnV3bmFmY2h1c3Rwb3JreGduIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDYxNTYwMiwiZXhwIjoyMDc2MTkxNjAyfQ.WdRxYbKkfDojwtnvj4SOrZ3mrc5G1m6WVvw0FLwUW7A',
  jwtSecret: 'LZyRKPgzc2WhAsv+2xQmIdZQD9fkJEkO3CpyoK9IKn5ZXh0I9DB32ohdgbp0jFYMn2DGoWVZ4Zqe+fxvSM7vmA=='
};
