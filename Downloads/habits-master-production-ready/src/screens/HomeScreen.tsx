import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Alert,
  Share,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { SupabaseManager } from '../utils/supabase';
import GlassCard from '../components/GlassCard';
import DailyVerseCard from '../components/DailyVerseCard';
import DailyVerseCardErrorBoundary from '../components/DailyVerseCardErrorBoundary';
// import ConditionalAdBanner from '../components/ConditionalAdBanner';
import BibleApiService, { DailyVerse } from '../services/BibleApiService';
import { DatabaseHealthCheck } from '../utils/DatabaseHealthCheck';

const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  console.log('HomeScreen: Component rendering');
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  // const { isSubscribed } = useSubscription();
  const isSubscribed = false; // Temporarily set to false
  const insets = useSafeAreaInsets();
  
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('Friend');
  const [dailyVerse, setDailyVerse] = useState<DailyVerse>({
    text: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, to give you hope and a future.",
    reference: "Jeremiah 29:11",
    date: new Date().toISOString().split('T')[0],
    isLiked: false,
    likesCount: 0
  });
  const [verseLoading, setVerseLoading] = useState(false);
  const [showDailyVerse, setShowDailyVerse] = useState(true);
  
  
  // Animation refs for Quick Actions
  const quickActionAnimations = useRef(
    Array.from({ length: 6 }, () => new Animated.Value(1))
  ).current;

  // Animation refs for Recent Activities
  const activityAnimations = useRef(
    Array.from({ length: 10 }, () => new Animated.Value(0))
  ).current;
  const [activityAnimationsReady, setActivityAnimationsReady] = useState(false);
  
  // Swipe gesture animations for activities
  const activitySwipeAnimations = useRef(
    Array.from({ length: 10 }, () => new Animated.Value(0))
  ).current;
  const activityTranslateX = useRef(
    Array.from({ length: 10 }, () => new Animated.Value(0))
  ).current;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleQuickActionPress = (action: any, index: number) => {
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Modern press animation with spring effect
    Animated.sequence([
      Animated.timing(quickActionAnimations[index], {
        toValue: 0.96,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(quickActionAnimations[index], {
        toValue: 1,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Navigate after animation
    setTimeout(() => {
      action.onPress();
    }, 120);
  };

  const handleActivitySwipe = (index: number, gestureState: any) => {
    const { translationX, velocityX } = gestureState;
    const swipeThreshold = 100;
    
    if (Math.abs(translationX) > swipeThreshold || Math.abs(velocityX) > 500) {
      // Swipe action triggered
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Animate card out
      Animated.timing(activityTranslateX[index], {
        toValue: translationX > 0 ? 300 : -300,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        // Remove activity from list
        setRecentActivities(prev => prev.filter((_, i) => i !== index));
        // Reset animation
        activityTranslateX[index].setValue(0);
      });
    } else {
      // Snap back to original position
      Animated.spring(activityTranslateX[index], {
        toValue: 0,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleActivityPress = (activity: any, index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Add a subtle scale animation
    Animated.sequence([
      Animated.timing(activitySwipeAnimations[index], {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(activitySwipeAnimations[index], {
        toValue: 1,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Navigate to activity details
    // You can add navigation logic here
  };

  const quickActions = [
    {
      id: 'prayer',
      title: 'Start Prayer',
      icon: 'heart' as keyof typeof Ionicons.glyphMap,
      color: colors.primary,
      onPress: () => navigation.navigate('Prayer'),
    },
    {
      id: 'requests',
      title: 'Prayer Community',
      icon: 'people' as keyof typeof Ionicons.glyphMap,
      color: colors.warning,
      onPress: () => navigation.navigate('PrayerRequests'),
    },
    {
      id: 'gratitude',
      title: 'Gratitude Journal',
      icon: 'journal' as keyof typeof Ionicons.glyphMap,
      color: '#FF9F43',
      onPress: () => navigation.navigate('GratitudeJournal'),
    },
    {
      id: 'fasting',
      title: 'Fasting Tracker',
      icon: 'fast-food' as keyof typeof Ionicons.glyphMap,
      color: '#6C5CE7',
      onPress: () => navigation.navigate('FastingTracker'),
    },
    {
      id: 'habits',
      title: 'Christian Habits',
      icon: 'checkmark-circle' as keyof typeof Ionicons.glyphMap,
      color: '#00B894',
      onPress: () => navigation.navigate('ChristianHabits'),
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: 'settings' as keyof typeof Ionicons.glyphMap,
      color: '#4ECDC4',
      onPress: () => navigation.navigate('Profile'),
    },
  ];

  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  // Sample activities for demonstration
  const getSampleActivities = () => [
    {
      id: 'sample-1',
      title: 'Morning Prayer',
      time: format(new Date(Date.now() - 2 * 60 * 60 * 1000), 'h:mm a'), // 2 hours ago
      icon: 'heart' as keyof typeof Ionicons.glyphMap,
      completed: true,
      type: 'prayer',
      duration: '15 min',
      streak: 3,
    },
    {
      id: 'sample-2',
      title: 'Bible Reading - John 3',
      time: format(new Date(Date.now() - 4 * 60 * 60 * 1000), 'h:mm a'), // 4 hours ago
      icon: 'book' as keyof typeof Ionicons.glyphMap,
      completed: true,
      type: 'reading',
      duration: '8 min',
      streak: 7,
    },
    {
      id: 'sample-3',
      title: 'Gratitude Journal',
      time: format(new Date(Date.now() - 6 * 60 * 60 * 1000), 'h:mm a'), // 6 hours ago
      icon: 'journal' as keyof typeof Ionicons.glyphMap,
      completed: true,
      type: 'gratitude',
      duration: '5 min',
      streak: 2,
    },
  ];

  // Load daily verse
  useEffect(() => {
    const loadDailyVerse = async () => {
      try {
        setVerseLoading(true);
        setShowDailyVerse(true);
        
        if (!user) {
          setDailyVerse({
            text: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, to give you hope and a future.",
            reference: "Jeremiah 29:11",
            date: new Date().toISOString().split('T')[0],
            isLiked: false,
            likesCount: 0
          });
        } else {
          const bibleService = BibleApiService.getInstance();
          const verse = await bibleService.getDailyVerseWithLikes(user.id);
          setDailyVerse(verse);
        }
      } catch (error) {
        console.error('HomeScreen: Error loading daily verse:', error);
        // Always show fallback verse on error
        setDailyVerse({
          text: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, to give you hope and a future.",
          reference: "Jeremiah 29:11",
          date: new Date().toISOString().split('T')[0],
          isLiked: false,
          likesCount: 0
        });
      } finally {
        setVerseLoading(false);
      }
    };

    loadDailyVerse();
  }, [user]);

  // Load user data and activities
  useEffect(() => {
    const loadUserData = async () => {
      setActivitiesLoading(true);
      
      try {
        let activities: any[] = [];
        
        if (user) {
          // Load user profile
          try {
            const userData = await SupabaseManager.getUserData(user.id);
            if (userData?.first_name) {
              setUserName(userData.first_name);
            }
          } catch (error) {
            console.log('Error loading user data:', error);
          }

          // Load recent activities from database
          try {
            const prayerSessions = await SupabaseManager.getPrayerSessions(user.id);
            const dbActivities = prayerSessions.slice(0, 5).map((session: any) => ({
              id: `prayer-${session.id}`,
              title: 'Prayer Session',
              time: format(new Date(session.completed_at), 'h:mm a'),
              icon: 'heart' as keyof typeof Ionicons.glyphMap,
              completed: true,
              type: 'prayer',
              duration: session.duration || '5 min',
              streak: Math.floor(Math.random() * 7) + 1,
            }));
            
            activities = dbActivities;
          } catch (error) {
            console.log('Error loading prayer sessions:', error);
          }
        }
        
        // If no user or no database activities, show sample data
        if (activities.length === 0) {
          activities = getSampleActivities();
        }
        
        console.log('Setting recent activities:', activities);
        setRecentActivities(activities);
        
        // Animate activities in
        setTimeout(() => {
          setActivityAnimationsReady(true);
          activities.forEach((_, index) => {
            Animated.timing(activityAnimations[index], {
              toValue: 1,
              duration: 300,
              delay: index * 100,
              useNativeDriver: true,
            }).start();
          });
        }, 200);
        
      } catch (error) {
        console.log('Error loading activities:', error);
        // Fallback to sample data
        const fallbackActivities = getSampleActivities();
        setRecentActivities(fallbackActivities);
      } finally {
        setActivitiesLoading(false);
      }
    };

    loadUserData();
  }, [user]);




  const onRefresh = async () => {
    setRefreshing(true);
    
    try {
      // Reload daily verse
      const bibleService = BibleApiService.getInstance();
      const verse = await bibleService.getDailyVerse();
      setDailyVerse(verse);
      
      // Reload user data if authenticated
      if (user) {
        try {
          const userData = await SupabaseManager.getUserData(user.id);
          if (userData?.first_name) {
            setUserName(userData.first_name);
          }
        } catch (error) {
        }

        // Load recent activities
        try {
          let activities: any[] = [];
          
          if (user) {
            const prayerSessions = await SupabaseManager.getPrayerSessions(user.id);
            activities = prayerSessions.slice(0, 5).map((session: any) => ({
              id: `prayer-${session.id}`,
              title: 'Prayer Session',
              time: format(new Date(session.completed_at), 'h:mm a'),
              icon: 'heart' as keyof typeof Ionicons.glyphMap,
              completed: true,
              type: 'prayer',
              duration: session.duration || '5 min',
              streak: Math.floor(Math.random() * 7) + 1,
            }));
          }
          
          // If no activities from database, use sample data
          if (activities.length === 0) {
            activities = getSampleActivities();
          }
          
          setRecentActivities(activities);
          
          // Animate activities in
          setTimeout(() => {
            setActivityAnimationsReady(true);
            activities.forEach((_, index) => {
              Animated.timing(activityAnimations[index], {
                toValue: 1,
                duration: 300,
                delay: index * 100,
                useNativeDriver: true,
              }).start();
            });
          }, 200);
        } catch (error) {
          // Fallback to sample data on error
          const fallbackActivities = getSampleActivities();
          setRecentActivities(fallbackActivities);
        }
      }
    } catch (error) {
      Alert.alert('Refresh Error', 'Some data may not be up to date. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <View>
            <Text style={[styles.greeting, { color: colors.text }]}>
              {getGreeting()}, {userName}
            </Text>
            <Text style={[styles.date, { color: colors.textSecondary }]}>
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </Text>
          </View>
        </View>



        {/* Daily Verse */}
        {showDailyVerse && (
          <DailyVerseCardErrorBoundary key={user?.id || 'no-user'}>
            <DailyVerseCard
              verse={dailyVerse}
              loading={verseLoading}
              onRefresh={async () => {
                try {
                  setVerseLoading(true);
                  const bibleService = BibleApiService.getInstance();
                  const verse = await bibleService.getDailyVerseWithLikes(user?.id);
                  setDailyVerse(verse);
                } catch (error) {
                } finally {
                  setVerseLoading(false);
                }
              }}
            />
          </DailyVerseCardErrorBoundary>
        )}


        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
          <View style={styles.quickActionsContainer}>
            {quickActions.map((action, index) => (
              <Animated.View
                key={action.id}
                style={[
                  styles.quickActionWrapper,
                  {
                    transform: [{ scale: quickActionAnimations[index] }],
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.quickActionCard}
                  onPress={() => handleQuickActionPress(action, index)}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={[
                      action.color + '20',
                      action.color + '10',
                      action.color + '05'
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.quickActionGradient}
                  >
                    <View style={styles.quickActionContent}>
                      <View style={[styles.quickActionIconContainer, { backgroundColor: action.color + '30' }]}>
                        <Ionicons name={action.icon} size={28} color={action.color} />
                      </View>
                      <View style={styles.quickActionTextContainer}>
                        <Text style={[styles.quickActionTitle, { color: colors.text }]}>
                          {action.title}
                        </Text>
                        <View style={[styles.quickActionIndicator, { backgroundColor: action.color }]} />
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Modern Recent Activities */}
        <View style={styles.section}>
          <View style={styles.modernSectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Text style={[styles.modernSectionTitle, { color: colors.text }]}>Recent Activities</Text>
              <View style={[styles.sectionIndicator, { backgroundColor: colors.primary }]} />
            </View>
            <TouchableOpacity 
              style={[styles.modernViewAllButton, { backgroundColor: colors.primary + '15' }]}
              onPress={() => navigation.navigate('Statistics')}
            >
              <Text style={[styles.modernViewAllText, { color: colors.primary }]}>View All</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>
          
          {activitiesLoading ? (
            <View style={styles.modernLoadingContainer}>
              {[1, 2, 3].map((_, index) => (
                <View key={index} style={[styles.modernLoadingCard, { backgroundColor: colors.card }]}>
                  <View style={styles.modernLoadingContent}>
                    <View style={[styles.modernLoadingIcon, { backgroundColor: colors.border }]} />
                    <View style={styles.modernLoadingText}>
                      <View style={[styles.modernLoadingLine, { backgroundColor: colors.border }]} />
                      <View style={[styles.modernLoadingLine, styles.modernLoadingLineShort, { backgroundColor: colors.border }]} />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : recentActivities.length > 0 ? (
            <View style={styles.modernActivitiesContainer}>
              {recentActivities.map((activity, index) => (
                <Animated.View
                  key={activity.id}
                  style={[
                    styles.ultraModernCard,
                    {
                      opacity: activityAnimationsReady ? activityAnimations[index] : 0,
                      transform: [
                        {
                          translateY: activityAnimationsReady 
                            ? activityAnimations[index].interpolate({
                                inputRange: [0, 1],
                                outputRange: [30, 0],
                              })
                            : 30,
                        },
                        {
                          scale: activityAnimationsReady 
                            ? activityAnimations[index].interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.9, 1],
                              })
                            : 0.9,
                        },
                      ],
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.modernCardTouchable}
                    activeOpacity={0.8}
                    onPress={() => handleActivityPress(activity, index)}
                  >
                    <View style={[styles.modernCardContainer, { backgroundColor: colors.card }]}>
                      {/* Activity Header */}
                      <View style={styles.modernActivityHeader}>
                        <View style={styles.modernIconSection}>
                          <View style={[
                            styles.modernIconContainer,
                            { 
                              backgroundColor: activity.completed 
                                ? colors.success + '20' 
                                : colors.primary + '20'
                            }
                          ]}>
                            <Ionicons 
                              name={activity.icon} 
                              size={24} 
                              color={activity.completed ? colors.success : colors.primary} 
                            />
                          </View>
                          {activity.streak && activity.streak > 1 && (
                            <View style={[styles.modernStreakBadge, { backgroundColor: colors.warning }]}>
                              <Text style={styles.modernStreakText}>{activity.streak}</Text>
                            </View>
                          )}
                        </View>
                        
                        <View style={styles.modernActivityInfo}>
                          <Text style={[styles.modernActivityTitle, { color: colors.text }]}>
                            {activity.title}
                          </Text>
                          <View style={styles.modernActivityMeta}>
                            <View style={styles.modernTimeContainer}>
                              <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
                              <Text style={[styles.modernActivityTime, { color: colors.textSecondary }]}>
                                {activity.time}
                              </Text>
                            </View>
                            {activity.duration && (
                              <View style={styles.modernDurationContainer}>
                                <Ionicons name="timer-outline" size={12} color={colors.textSecondary} />
                                <Text style={[styles.modernActivityDuration, { color: colors.textSecondary }]}>
                                  {activity.duration}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                        
                        <View style={styles.modernStatusSection}>
                          <View style={[
                            styles.modernStatusIndicator,
                            { 
                              backgroundColor: activity.completed ? colors.success : colors.border,
                              borderColor: activity.completed ? colors.success : colors.border,
                            }
                          ]}>
                            <Ionicons 
                              name={activity.completed ? "checkmark" : "time"} 
                              size={14} 
                              color="#FFFFFF" 
                            />
                          </View>
                        </View>
                      </View>
                      
                      {/* Progress Section */}
                      {activity.completed && (
                        <View style={styles.modernProgressSection}>
                          <View style={styles.modernProgressInfo}>
                            <Text style={[styles.modernProgressLabel, { color: colors.textSecondary }]}>
                              Completed
                            </Text>
                            <Text style={[styles.modernProgressValue, { color: colors.success }]}>
                              100%
                            </Text>
                          </View>
                          <View style={[styles.modernProgressBar, { backgroundColor: colors.border }]}>
                            <View style={[styles.modernProgressFill, { backgroundColor: colors.success }]} />
                          </View>
                        </View>
                      )}
                      
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          ) : (
            <View style={[styles.modernEmptyState, { backgroundColor: colors.card }]}>
              <View style={styles.modernEmptyIcon}>
                <Ionicons name="sparkles" size={48} color={colors.primary} />
              </View>
              <Text style={[styles.modernEmptyTitle, { color: colors.text }]}>
                Start Your Journey
              </Text>
              <Text style={[styles.modernEmptySubtitle, { color: colors.textSecondary }]}>
                Begin your spiritual practice and see your activities here
              </Text>
              <TouchableOpacity 
                style={[styles.modernStartButton, { backgroundColor: colors.primary }]}
                onPress={() => navigation.navigate('Prayer')}
              >
                <Ionicons name="add" size={20} color="#FFFFFF" />
                <Text style={styles.modernStartText}>Start Prayer</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Bottom padding for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
      
      {/* Banner Ad - only show if not subscribed */}
      {/* <ConditionalAdBanner position="bottom" showAboveTabBar={true} /> */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
    fontWeight: '400',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginHorizontal: 20,
    marginBottom: 12,
  },
  quickActionsContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  quickActionWrapper: {
    marginBottom: 4,
  },
  quickActionCard: {
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  quickActionGradient: {
    padding: 20,
  },
  quickActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  quickActionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  quickActionTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
    flex: 1,
  },
  quickActionIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 12,
  },
  quickActionIconText: {
    fontSize: 20,
  },
  // Modern Recent Activities Styles
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(94, 114, 228, 0.1)',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  activitiesContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  modernActivityCard: {
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.15)', // More visible background
  },
  activityCardContent: {
    flex: 1,
  },
  activityGradient: {
    padding: 20,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityIconContainer: {
    marginRight: 16,
  },
  activityIconBackground: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  activityMainContent: {
    flex: 1,
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityTime: {
    fontSize: 14,
    fontWeight: '500',
  },
  activityDuration: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  activityStatusContainer: {
    alignItems: 'center',
    gap: 8,
  },
  modernActivityStatus: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  streakBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  completionIndicator: {
    marginTop: 12,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    width: '100%',
    borderRadius: 2,
  },
  // Empty State Styles
  emptyStateContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 40,
    marginHorizontal: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  emptyStateIcon: {
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  startJourneyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  startJourneyText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  // Ultra Modern Recent Activities Styles
  modernSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modernSectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  sectionIndicator: {
    width: 4,
    height: 24,
    borderRadius: 2,
  },
  modernViewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  modernViewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modernActivitiesContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  ultraModernCard: {
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modernCardTouchable: {
    flex: 1,
  },
  modernCardContainer: {
    padding: 24,
    borderRadius: 24,
  },
  modernActivityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  modernIconSection: {
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
  },
  modernIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  modernStreakBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  modernStreakText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modernActivityInfo: {
    flex: 1,
  },
  modernActivityTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  modernActivityMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  modernTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modernDurationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modernActivityTime: {
    fontSize: 14,
    fontWeight: '500',
  },
  modernActivityDuration: {
    fontSize: 14,
    fontWeight: '500',
  },
  modernStatusSection: {
    alignItems: 'center',
  },
  modernStatusIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  modernProgressSection: {
    marginBottom: 20,
  },
  modernProgressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modernProgressLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  modernProgressValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  modernProgressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  modernProgressFill: {
    height: '100%',
    width: '100%',
    borderRadius: 3,
  },
  // Modern Loading States
  modernLoadingContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  modernLoadingCard: {
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  modernLoadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modernLoadingIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    marginRight: 16,
  },
  modernLoadingText: {
    flex: 1,
    gap: 8,
  },
  modernLoadingLine: {
    height: 16,
    borderRadius: 8,
    width: '80%',
  },
  modernLoadingLineShort: {
    width: '60%',
  },
  // Modern Empty State
  modernEmptyState: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 48,
    marginHorizontal: 20,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  modernEmptyIcon: {
    marginBottom: 20,
  },
  modernEmptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  modernEmptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  modernStartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  modernStartText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default HomeScreen;
