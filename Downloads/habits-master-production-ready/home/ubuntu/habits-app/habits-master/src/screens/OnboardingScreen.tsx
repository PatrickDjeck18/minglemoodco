import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Animated,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import CustomButton from '../components/CustomButton';

const { width } = Dimensions.get('window');

const onboardingData = [
  {
    id: 1,
    title: 'Welcome to FaithHabits',
    subtitle: 'Build Your Spiritual Rhythm',
    description: 'Transform your spiritual journey with guided prayer, Bible reading, and daily devotions.',
    icon: 'heart' as keyof typeof Ionicons.glyphMap,
    gradient: ['primary', 'secondary'],
  },
  {
    id: 2,
    title: 'Prayer Timer',
    subtitle: 'Focused Prayer Sessions',
    description: 'Set dedicated time for prayer with background music and peaceful ambiance.',
    icon: 'time' as keyof typeof Ionicons.glyphMap,
    gradient: ['secondary', 'primary'],
  },
  {
    id: 3,
    title: 'Bible Reading',
    subtitle: 'Track Your Progress',
    description: 'Follow reading plans, track your journey through Scripture, and build lasting habits.',
    icon: 'book' as keyof typeof Ionicons.glyphMap,
    gradient: ['success', 'success'],
  },
  {
    id: 4,
    title: 'Daily Devotions',
    subtitle: 'Spiritual Nourishment',
    description: 'Receive daily inspiration with curated devotions and reflection prompts.',
    icon: 'sunny-outline' as keyof typeof Ionicons.glyphMap,
    gradient: ['warning', 'warning'],
  },
  {
    id: 5,
    title: 'Get Started',
    subtitle: 'Begin Your Journey',
    description: 'Allow notifications to receive daily reminders and stay connected with your spiritual practice.',
    icon: 'checkmark-circle' as keyof typeof Ionicons.glyphMap,
    gradient: ['primary', 'secondary'],
  },
];

const OnboardingScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, Gradients } = useTheme();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      scrollViewRef.current?.scrollTo({
        x: nextIndex * width,
        animated: true,
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    completeOnboarding();
  };

  const completeOnboarding = async () => {
    try {
      console.log('Starting onboarding completion...');
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const { status } = await Notifications.requestPermissionsAsync();
      console.log('Notification permission status:', status);

      await AsyncStorage.setItem('onboarding_complete', 'true');
      console.log('Onboarding marked as complete in AsyncStorage');
      
      setTimeout(() => {
        console.log('Navigating to Main screen...');
        navigation.replace('Main');
      }, 100);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      navigation.replace('Main');
    }
  };

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / width);
    setCurrentIndex(index);
  };

  const renderPage = (item: any, index: number) => (
    <View key={item.id} style={[styles.page, { width }]}>
      <LinearGradient
        colors={Gradients[item.gradient[0]]}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={styles.container}>
          {/* Skip button */}
          {index < onboardingData.length - 1 && (
            <TouchableOpacity
              style={[styles.skipButton, { top: insets.top + 20 }]}
              onPress={handleSkip}
            >
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          )}

          {/* Content */}
          <View style={styles.content}>
            {/* Icon */}
            <Animated.View
              style={[
                styles.iconContainer,
                {
                  transform: [
                    {
                      scale: scaleAnim,
                    },
                  ],
                },
              ]}
            >
              <Ionicons name={item.icon} size={60} color="#FFFFFF" />
            </Animated.View>

            {/* Text content */}
            <Animated.View
              style={[
                styles.textContainer,
                {
                  opacity: fadeAnim,
                },
              ]}
            >
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>{item.subtitle}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </Animated.View>
          </View>

          {/* Bottom section */}
          <View style={styles.bottomSection}>
            {/* Page indicators */}
            <View style={styles.indicators}>
              {onboardingData.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.indicator,
                    {
                      backgroundColor: i === index ? colors.text : 'rgba(255,255,255,0.3)',
                    },
                  ]}
                />
              ))}
            </View>

            {/* Action button */}
            <View style={styles.buttonContainer}>
              {index === onboardingData.length - 1 ? (
                <CustomButton
                  title="Get Started"
                  onPress={completeOnboarding}
                  size="large"
                  style={styles.getStartedButton}
                />
              ) : (
                <CustomButton
                  title="Next"
                  onPress={handleNext}
                  variant="outline"
                  size="large"
                  style={styles.nextButton}
                  textStyle={{ color: colors.text }}
                />
              )}
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    right: 20,
    zIndex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  skipText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomSection: {
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  buttonContainer: {
    alignItems: 'center',
  },
  nextButton: {
    backgroundColor: 'transparent',
    borderColor: '#FFFFFF',
    borderWidth: 2,
    minWidth: 120,
  },
  getStartedButton: {
    minWidth: 200,
  },
});

export default OnboardingScreen;
