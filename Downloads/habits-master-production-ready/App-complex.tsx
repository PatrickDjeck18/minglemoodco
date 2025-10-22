import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useColorScheme, ActivityIndicator, View, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from './src/constants/colors';

// Import screens
import OnboardingScreen from './src/screens/OnboardingScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import HomeScreen from './src/screens/HomeScreen';
import PrayerTimerScreen from './src/screens/PrayerTimerScreen';
import PracticesScreen from './src/screens/PracticesScreen';
import PrayerRequestsScreen from './src/screens/PrayerRequestsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import StatisticsScreen from './src/screens/StatisticsScreen';
// Christian Habits Screens
import ChristianHabitsScreen from './src/screens/ChristianHabitsScreen';
import GratitudeJournalScreen from './src/screens/GratitudeJournalScreen';
import FastingTrackerScreen from './src/screens/FastingTrackerScreen';
// Privacy and Terms Screens
import PrivacyPolicyScreen from './src/screens/PrivacyPolicyScreen';
import TermsOfServiceScreen from './src/screens/TermsOfServiceScreen';
import SubscriptionScreen from './src/screens/SubscriptionScreen';

// Import components
import CustomTabBar from './src/components/CustomTabBar';
import AuthWrapper from './src/components/AuthWrapper';
import ErrorBoundary from './src/components/ErrorBoundary';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
// Temporarily disable SubscriptionProvider to fix blank screen
// import { SubscriptionProvider } from './src/context/SubscriptionContext';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: false,
    shouldShowList: false,
  }),
});

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function TabNavigator() {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopWidth: 0,
          elevation: 0,
        },
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
        }}
      />
      <Tab.Screen 
        name="Prayer" 
        component={PrayerTimerScreen}
        options={{
        }}
      />
      <Tab.Screen 
        name="ChristianHabits" 
        component={ChristianHabitsScreen}
        options={{
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={SettingsScreen}
        options={{
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null); // null = unknown, true = authenticated, false = not authenticated
  const colorScheme = useColorScheme();

  useEffect(() => {
    async function prepare() {
      try {
        // Check if user has completed onboarding
        const onboardingComplete = await AsyncStorage.getItem('onboarding_complete');
        setHasCompletedOnboarding(onboardingComplete === 'true');

        // Request notification permissions
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
        }

        // Pre-load any necessary resources
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        console.error('App initialization error:', e);
      } finally {
        setIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ThemeProvider>
            <AuthProvider>
              {/* Temporarily disable SubscriptionProvider to fix blank screen */}
              <AuthWrapper onAuthStateChange={(isAuth) => {
                setIsAuthenticated(isAuth);
              }}>
                <NavigationContainer>
                  <StatusBar style="auto" />
                  {!hasCompletedOnboarding ? (
                    <Stack.Navigator screenOptions={{ headerShown: false }}>
                      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                    </Stack.Navigator>
                  ) : isAuthenticated === null ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                      <ActivityIndicator size="large" color={Colors.light.primary} />
                    </View>
                  ) : !isAuthenticated ? (
                    <Stack.Navigator screenOptions={{ headerShown: false }}>
                      <Stack.Screen name="Login" component={LoginScreen} />
                      <Stack.Screen name="Signup" component={SignupScreen} />
                      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
                      <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
                    </Stack.Navigator>
                  ) : (
                    <Stack.Navigator screenOptions={{ headerShown: false }}>
                      <Stack.Screen name="Main" component={TabNavigator} />
                      <Stack.Screen
                        name="PrayerRequests"
                        component={PrayerRequestsScreen}
                        options={{ presentation: 'modal' }}
                      />
                      <Stack.Screen
                        name="Statistics"
                        component={StatisticsScreen}
                        options={{ presentation: 'modal' }}
                      />
                      {/* Christian Habits Screens */}
                      <Stack.Screen
                        name="ChristianHabits"
                        component={ChristianHabitsScreen}
                        options={{ presentation: 'modal' }}
                      />
                      <Stack.Screen
                        name="GratitudeJournal"
                        component={GratitudeJournalScreen}
                        options={{ presentation: 'modal' }}
                      />
                      <Stack.Screen
                        name="FastingTracker"
                        component={FastingTrackerScreen}
                        options={{ presentation: 'modal' }}
                      />
                      {/* Privacy and Terms Screens */}
                      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
                      <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
                      <Stack.Screen name="Subscription" component={SubscriptionScreen} />
                    </Stack.Navigator>
                  )}
                </NavigationContainer>
              </AuthWrapper>
            </AuthProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
