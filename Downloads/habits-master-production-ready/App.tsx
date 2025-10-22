import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useColorScheme, ActivityIndicator, View, StyleSheet, Text } from 'react-native';
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
import ChristianHabitsScreen from './src/screens/ChristianHabitsScreen';
import FastingTrackerScreen from './src/screens/FastingTrackerScreen';
import GratitudeJournalScreen from './src/screens/GratitudeJournalScreen';
import PrayerRequestsScreen from './src/screens/PrayerRequestsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import StatisticsScreen from './src/screens/StatisticsScreen';
import PrivacyPolicyScreen from './src/screens/PrivacyPolicyScreen';
import TermsOfServiceScreen from './src/screens/TermsOfServiceScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ResetPasswordCodeScreen from './src/screens/ResetPasswordCodeScreen';

// Import components
import CustomTabBar from './src/components/CustomTabBar';
import AuthWrapper from './src/components/AuthWrapper';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import { SubscriptionProvider } from './src/context/SubscriptionContext';
import AdMobService from './src/services/AdMobService';

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
  console.log('TabNavigator: Rendering with HomeScreen');
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
        name="FastingTracker" 
        component={FastingTrackerScreen}
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
        console.log('Onboarding complete status (initial check):', onboardingComplete);

        // Request notification permissions
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          console.log('Notification permission not granted');
        }

        // Initialize AdMob
        await AdMobService.initialize();

        // Pre-load any necessary resources
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        console.warn(e);
      } finally {
        setIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  // Listen for onboarding completion
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      const onboardingComplete = await AsyncStorage.getItem('onboarding_complete');
      if (onboardingComplete === 'true' && !hasCompletedOnboarding) {
        console.log('Onboarding completed - updating state');
        setHasCompletedOnboarding(true);
      }
    };

    // Check every 500ms for onboarding completion
    const interval = setInterval(checkOnboardingStatus, 500);
    
    return () => clearInterval(interval);
  }, [hasCompletedOnboarding]);

  if (!isReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <SubscriptionProvider>
            <AuthProvider>
              <AuthWrapper onAuthStateChange={(isAuth) => {
                console.log('App: Auth state changed to:', isAuth);
                console.log('App: hasCompletedOnboarding:', hasCompletedOnboarding);
                console.log('App: isAuthenticated will be set to:', isAuth);
                console.log('App: Current isAuthenticated state before change:', isAuthenticated);
                setIsAuthenticated(isAuth);
                console.log('App: isAuthenticated state after change:', isAuth);
              }}>
              <NavigationContainer>
                <StatusBar style="auto" />
              {!hasCompletedOnboarding ? (
                (() => {
                  console.log('App: Rendering Onboarding screen - hasCompletedOnboarding:', hasCompletedOnboarding);
                  return (
                    <Stack.Navigator screenOptions={{ headerShown: false }}>
                      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                    </Stack.Navigator>
                  );
                })()
              ) : isAuthenticated === null ? (
                (() => {
                  console.log('App: Rendering loading screen - isAuthenticated is null');
                  return (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                      <ActivityIndicator size="large" color={Colors.light.primary} />
                      <Text style={{ marginTop: 10, color: Colors.light.text }}>Loading...</Text>
                    </View>
                  );
                })()
              ) : !isAuthenticated ? (
                (() => {
                  console.log('App: Rendering Login screen - isAuthenticated:', isAuthenticated);
                  return (
                    <Stack.Navigator screenOptions={{ headerShown: false }}>
                      <Stack.Screen name="Login" component={LoginScreen} />
                      <Stack.Screen name="Signup" component={SignupScreen} />
                      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                      <Stack.Screen name="ResetPasswordCode" component={ResetPasswordCodeScreen} />
                      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
                      <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
                    </Stack.Navigator>
                  );
                })()
              ) : (
                (() => {
                  console.log('App: Rendering Main app with TabNavigator - isAuthenticated:', isAuthenticated);
                  return (
                    <Stack.Navigator screenOptions={{ headerShown: false }}>
                      <Stack.Screen name="Main" component={TabNavigator} />
                      <Stack.Screen
                        name="PrayerRequests"
                        component={PrayerRequestsScreen}
                        options={{ presentation: 'modal' }}
                      />
                      <Stack.Screen
                        name="GratitudeJournal"
                        component={GratitudeJournalScreen}
                        options={{ presentation: 'modal' }}
                      />
                      <Stack.Screen
                        name="Statistics"
                        component={StatisticsScreen}
                        options={{ presentation: 'modal' }}
                      />
                      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
                      <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
                    </Stack.Navigator>
                  );
                })()
              )}
              </NavigationContainer>
              </AuthWrapper>
            </AuthProvider>
          </SubscriptionProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}