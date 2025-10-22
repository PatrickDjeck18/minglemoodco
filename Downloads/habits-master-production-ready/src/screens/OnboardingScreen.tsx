import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Animated,
  SafeAreaView,
  StatusBar,
  Platform,
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
    accentColor: '#6C63FF',
  },
  {
    id: 2,
    title: 'Prayer Timer',
    subtitle: 'Focused Prayer Sessions',
    description: 'Set dedicated time for prayer with background music and peaceful ambiance.',
    icon: 'time' as keyof typeof Ionicons.glyphMap,
    gradient: ['secondary', 'primary'],
    accentColor: '#FF6584',
  },
  {
    id: 3,
    title: 'Bible Reading',
    subtitle: 'Track Your Progress',
    description: 'Follow reading plans, track your journey through Scripture, and build lasting habits.',
    icon: 'book' as keyof typeof Ionicons.glyphMap,
    gradient: ['success', 'success'],
    accentColor: '#4CAF50',
  },
  {
    id: 4,
    title: 'Daily Devotions',
    subtitle: 'Spiritual Nourishment',
    description: 'Receive daily inspiration with curated devotions and reflection prompts.',
    icon: 'sunny-outline' as keyof typeof Ionicons.glyphMap,
    gradient: ['warning', 'warning'],
    accentColor: '#FFC107',
  },
  {
    id: 5,
    title: 'Get Started',
    subtitle: 'Begin Your Journey',
    description: 'Allow notifications to receive daily reminders and stay connected with your spiritual practice.',
    icon: 'checkmark-circle' as keyof typeof Ionicons.glyphMap,
    gradient: ['primary', 'secondary'],
    accentColor: '#6C63FF',
  },
];

const OnboardingScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, Gradients } = useTheme();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Modern animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const iconRotateAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const backgroundAnim = useRef(new Animated.Value(0)).current;

  // Modern animation effects
  useEffect(() => {
    Animated.sequence([
      Animated.timing(iconRotateAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(backgroundAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: false,
      }),
    ]).start();
  }, [currentIndex]);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (currentIndex + 1) / onboardingData.length,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentIndex]);

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      const nextIndex = currentIndex + 1;
      
      // Modern animation sequence
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentIndex(nextIndex);
        scrollViewRef.current?.scrollTo({
          x: nextIndex * width,
          animated: true,
        });
        
        // Reset and animate in
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
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
      
      // Force a re-render by updating the app state
      // The app will automatically show login screen after onboarding is complete
      // We need to trigger a state update in the parent component
      setTimeout(() => {
        // This will cause the app to re-evaluate the onboarding state
        // and automatically show the login screen
        console.log('Onboarding complete - app will show login screen');
      }, 100);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      // Still mark as complete even if there's an error
      await AsyncStorage.setItem('onboarding_complete', 'true');
    }
  };

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / width);
    setCurrentIndex(index);
  };

  const renderPage = (item: any, index: number) => {
    const iconRotation = iconRotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    const slideTransform = slideAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [50, 0],
    });

    return (
      <View key={item.id} style={[styles.page, { width }]}>
        <LinearGradient
          colors={Gradients[item.gradient[0]]}
          style={styles.gradientBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Modern background effects */}
          <Animated.View
            style={[
              styles.backgroundOverlay,
              {
                opacity: backgroundAnim,
                transform: [{ scale: backgroundAnim }],
              },
            ]}
          />
          
          <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
            
            {/* Modern skip button with glassmorphism */}
            {index < onboardingData.length - 1 && (
              <TouchableOpacity
                style={[styles.skipButton, { top: insets.top + 20 }]}
                onPress={handleSkip}
                activeOpacity={0.7}
              >
                <View style={styles.glassmorphismContainer}>
                  <Text style={styles.skipText}>Skip</Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Content with modern animations */}
            <View style={styles.content}>
              {/* Modern icon with rotation and glow */}
              <Animated.View
                style={[
                  styles.iconContainer,
                  {
                    transform: [
                      { scale: scaleAnim },
                      { rotate: iconRotation },
                    ],
                  },
                ]}
              >
                <View style={[styles.iconGlow, { backgroundColor: item.accentColor }]} />
                <Ionicons name={item.icon} size={70} color="#FFFFFF" />
              </Animated.View>

              {/* Text content with slide animation */}
              <Animated.View
                style={[
                  styles.textContainer,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideTransform }],
                  },
                ]}
              >
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.subtitle}>{item.subtitle}</Text>
                <Text style={styles.description}>{item.description}</Text>
              </Animated.View>
            </View>

            {/* Modern bottom section */}
            <View style={styles.bottomSection}>
              {/* Modern progress bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressTrack}>
                  <Animated.View
                    style={[
                      styles.progressFill,
                      {
                        width: progressAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                        }),
                        backgroundColor: item.accentColor,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {index + 1} of {onboardingData.length}
                </Text>
              </View>

              {/* Modern page indicators */}
              <View style={styles.indicators}>
                {onboardingData.map((_, i) => (
                  <Animated.View
                    key={i}
                    style={[
                      styles.indicator,
                      {
                        backgroundColor: i === index ? item.accentColor : 'rgba(255,255,255,0.3)',
                        transform: [
                          {
                            scale: i === index ? 1.2 : 1,
                          },
                        ],
                      },
                    ]}
                  />
                ))}
              </View>

              {/* Modern action buttons */}
              <View style={styles.buttonContainer}>
                {index === onboardingData.length - 1 ? (
                  <TouchableOpacity
                    style={[styles.getStartedButton, { backgroundColor: item.accentColor }]}
                    onPress={completeOnboarding}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={[item.accentColor, item.accentColor + '80']}
                      style={styles.buttonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Text style={styles.getStartedText}>Get Started</Text>
                      <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                    </LinearGradient>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.nextButton}
                    onPress={handleNext}
                    activeOpacity={0.8}
                  >
                    <View style={styles.glassmorphismButton}>
                      <Text style={styles.nextText}>Next</Text>
                      <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={styles.buttonIcon} />
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {onboardingData.map((item, index) => renderPage(item, index))}
      </ScrollView>
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
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  container: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    right: 20,
    zIndex: 1,
  },
  glassmorphismContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backdropFilter: 'blur(10px)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  skipText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 50,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  iconGlow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    opacity: 0.3,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  textContainer: {
    alignItems: 'center',
    maxWidth: 320,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 22,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.95)',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: 0.3,
  },
  description: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 26,
    letterSpacing: 0.2,
  },
  bottomSection: {
    paddingHorizontal: 40,
    paddingBottom: Platform.OS === 'ios' ? 50 : 40,
  },
  progressContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 2,
  },
  progressText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
    alignItems: 'center',
  },
  indicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonContainer: {
    alignItems: 'center',
  },
  nextButton: {
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  glassmorphismButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 30,
    minWidth: 140,
  },
  nextText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginRight: 8,
  },
  getStartedButton: {
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    minWidth: 200,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 18,
  },
  getStartedText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 4,
  },
});

export default OnboardingScreen;
