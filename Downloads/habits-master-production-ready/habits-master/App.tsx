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
import BibleTrackerScreen from './src/screens/BibleTrackerScreen';
import PracticesScreen from './src/screens/PracticesScreen';
import PrayerRequestsScreen from './src/screens/PrayerRequestsScreen';
import ScriptureMemoryScreen from './src/screens/ScriptureMemoryScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import StatisticsScreen from './src/screens/StatisticsScreen';

// Import components
import CustomTabBar from './src/components/CustomTabBar';
import AuthWrapper from './src/components/AuthWrapper';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';

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
        name="Bible" 
        component={BibleTrackerScreen}
        options={{
        }}
      />
      <Tab.Screen 
        name="Practices" 
        component={PracticesScreen}
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
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = unknown, true = authenticated, false = not authenticated
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

  if (!isReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <AuthWrapper onAuthStateChange={(isAuth) => {
              console.log('App: Auth state changed to:', isAuth);
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
                      name="ScriptureMemory"
                      component={ScriptureMemoryScreen}
                      options={{ presentation: 'modal' }}
                    />
                    <Stack.Screen
                      name="Statistics"
                      component={StatisticsScreen}
                      options={{ presentation: 'modal' }}
                    />
                  </Stack.Navigator>
                )}
              </NavigationContainer>
            </AuthWrapper>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
