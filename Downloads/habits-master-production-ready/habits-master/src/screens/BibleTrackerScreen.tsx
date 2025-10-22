import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Modal,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format, addDays, isToday, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/GlassCard';
import CustomButton from '../components/CustomButton';
import ProgressRing from '../components/ProgressRing';
import BibleReadingTimer, { ReadingSession } from '../components/BibleReadingTimer';
import { StorageManager } from '../utils/storage';
import { FirebaseManager } from '../utils/firebase';

const { width } = Dimensions.get('window');

const BibleTrackerScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('plans');
  const [selectedPlan, setSelectedPlan] = useState('bible-in-year');
  const [showPlanBuilder, setShowPlanBuilder] = useState(false);
  const [customPlanName, setCustomPlanName] = useState('');
  const [customPlanDescription, setCustomPlanDescription] = useState('');
  const [customPlanDuration, setCustomPlanDuration] = useState(30);
  const [customPlanIcon, setCustomPlanIcon] = useState('book');
  const [readingProgress, setReadingProgress] = useState(0.35);
  const [currentStreak, setCurrentStreak] = useState(12);
  const [totalDays, setTotalDays] = useState(45);
  const [userPlans, setUserPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Timer-related state
  const [showTimer, setShowTimer] = useState(false);
  const [totalReadingTime, setTotalReadingTime] = useState(0); // in seconds
  const [readingSessions, setReadingSessions] = useState<ReadingSession[]>([]);
  const [todayReadingTime, setTodayReadingTime] = useState(0);

  const iconOptions = [
    { id: 'book', name: 'Book', icon: 'book' as keyof typeof Ionicons.glyphMap, color: '#5E72E4' },
    { id: 'heart', name: 'Heart', icon: 'heart' as keyof typeof Ionicons.glyphMap, color: '#FF6B6B' },
    { id: 'star', name: 'Star', icon: 'star' as keyof typeof Ionicons.glyphMap, color: '#FFD93D' },
    { id: 'flame', name: 'Flame', icon: 'flame' as keyof typeof Ionicons.glyphMap, color: '#FF8C42' },
    { id: 'leaf', name: 'Leaf', icon: 'leaf' as keyof typeof Ionicons.glyphMap, color: '#2DCE89' },
    { id: 'diamond', name: 'Diamond', icon: 'diamond' as keyof typeof Ionicons.glyphMap, color: '#825EE4' },
    { id: 'sun', name: 'Sun', icon: 'sunny' as keyof typeof Ionicons.glyphMap, color: '#FFD93D' },
    { id: 'moon', name: 'Moon', icon: 'moon' as keyof typeof Ionicons.glyphMap, color: '#4ECDC4' },
  ];

  const readingPlans = [
    {
      id: 'bible-in-year',
      title: 'One Year Bible',
      description: 'Daily OT + NT + Psalms + Proverbs',
      duration: 365,
      progress: 0.35,
      color: colors.primary,
      icon: 'book' as keyof typeof Ionicons.glyphMap,
      isCustom: false,
      category: 'Complete Bible',
      estimatedTime: '15-20 min/day',
      difficulty: 'Beginner',
    },
    {
      id: '90-day-challenge',
      title: '90 Day Bible Challenge',
      description: 'Read through the entire Bible in 90 days',
      duration: 90,
      progress: 0.0,
      color: colors.success,
      icon: 'flame' as keyof typeof Ionicons.glyphMap,
      isCustom: false,
      category: 'Complete Bible',
      estimatedTime: '45-60 min/day',
      difficulty: 'Advanced',
    },
    {
      id: 'new-testament-30',
      title: 'New Testament in 30 Days',
      description: 'Focus on the New Testament',
      duration: 30,
      progress: 0.0,
      color: colors.warning,
      icon: 'heart' as keyof typeof Ionicons.glyphMap,
      isCustom: false,
      category: 'New Testament',
      estimatedTime: '30-40 min/day',
      difficulty: 'Intermediate',
    },
    {
      id: 'chronological-bible',
      title: 'Chronological Bible',
      description: 'Read the Bible in chronological order',
      duration: 365,
      progress: 0.0,
      color: '#825EE4',
      icon: 'time' as keyof typeof Ionicons.glyphMap,
      isCustom: false,
      category: 'Complete Bible',
      estimatedTime: '20-25 min/day',
      difficulty: 'Intermediate',
    },
    {
      id: 'gospels-plan',
      title: 'Gospels Study',
      description: 'Deep dive into the four Gospels',
      duration: 60,
      progress: 0.0,
      color: '#4ECDC4',
      icon: 'library' as keyof typeof Ionicons.glyphMap,
      isCustom: false,
      category: 'Gospels',
      estimatedTime: '25-30 min/day',
      difficulty: 'Beginner',
    },
    {
      id: 'wisdom-literature',
      title: 'Wisdom Literature',
      description: 'Psalms, Proverbs, Ecclesiastes, Song of Songs',
      duration: 90,
      progress: 0.0,
      color: '#FF6B6B',
      icon: 'bulb' as keyof typeof Ionicons.glyphMap,
      isCustom: false,
      category: 'Wisdom',
      estimatedTime: '15-20 min/day',
      difficulty: 'Beginner',
    },
    {
      id: 'psalms-proverbs',
      title: 'Psalms & Proverbs Monthly',
      description: 'Read through Psalms and Proverbs',
      duration: 30,
      progress: 0.12,
      color: colors.warning,
      icon: 'musical-notes' as keyof typeof Ionicons.glyphMap,
      isCustom: false,
      category: 'Wisdom',
      estimatedTime: '10-15 min/day',
      difficulty: 'Beginner',
    },
  ];

  const todaysReading = {
    book: 'John',
    chapter: 3,
    verses: '1-21',
    title: 'Jesus Teaches Nicodemus',
    text: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
    completed: false,
  };

  const recentReadings = [
    { book: 'John', chapter: 2, date: 'Yesterday', completed: true },
    { book: 'John', chapter: 1, date: '2 days ago', completed: true },
    { book: 'Luke', chapter: 24, date: '3 days ago', completed: true },
  ];

  // Enhanced calendar data with reading intensity
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarData, setCalendarData] = useState<any[]>([]);
  
  const generateCalendarData = (month: Date) => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const days = eachDayOfInterval({ start, end });
    
    return days.map(date => {
      const isToday = isSameDay(date, new Date());
      const completed = Math.random() > 0.3;
      const readingTime = completed ? Math.floor(Math.random() * 60) + 5 : 0; // 5-65 minutes
      
      return {
        date,
        completed,
        isToday,
        readingTime,
        intensity: readingTime > 30 ? 'high' : readingTime > 15 ? 'medium' : 'low',
      };
    });
  };

  useEffect(() => {
    setCalendarData(generateCalendarData(currentMonth));
  }, [currentMonth]);

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleReadingComplete = () => {
    setReadingProgress(prev => Math.min(prev + 0.01, 1));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleCreateCustomPlan = async () => {
    if (customPlanName.trim() && customPlanDescription.trim()) {
      try {
        setLoading(true);
        
        const newPlan = {
          id: `custom-${Date.now()}`,
          title: customPlanName.trim(),
          description: customPlanDescription.trim(),
          duration: customPlanDuration,
          progress: 0,
          color: iconOptions.find(icon => icon.id === customPlanIcon)?.color || colors.primary,
          icon: iconOptions.find(icon => icon.id === customPlanIcon)?.icon || 'book',
          isCustom: true,
          createdAt: new Date(),
          completedDays: 0,
        };

        // Save to Firebase if user is authenticated
        let firestoreId = newPlan.id;
        if (user) {
          try {
            firestoreId = await FirebaseManager.saveReadingPlan(user.uid, newPlan);
            console.log('Custom plan saved to Firebase with ID:', firestoreId);
          } catch (error) {
            console.error('Failed to save to Firebase, using local ID:', error);
            // Continue with local ID if Firebase fails
            firestoreId = newPlan.id;
          }
        }

        // Add to local state with the actual Firestore document ID
        const planWithFirestoreId = { ...newPlan, firestoreId };
        setUserPlans(prev => [...prev, planWithFirestoreId]);
        
        setShowPlanBuilder(false);
        setCustomPlanName('');
        setCustomPlanDescription('');
        setCustomPlanDuration(30);
        setCustomPlanIcon('book');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (error) {
        console.error('Error creating custom plan:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleMarkProgress = async (planId: string, completed: boolean) => {
    try {
      // Find the plan to get the correct Firestore document ID
      const allPlans = [...readingPlans, ...userPlans];
      const plan = allPlans.find(p => p.id === planId);
      
      if (user && plan && plan.firestoreId) {
        try {
          await FirebaseManager.updateReadingProgress(user.uid, plan.firestoreId, completed);
          console.log('Reading progress updated in Firebase');
        } catch (error) {
          console.error('Failed to update Firebase progress:', error);
          // Continue with local update even if Firebase fails
        }
      }
      
      // Update local state
      setUserPlans(prev => 
        prev.map(plan => 
          plan.id === planId 
            ? { 
                ...plan, 
                completedDays: completed ? (plan.completedDays || 0) + 1 : Math.max(0, (plan.completedDays || 0) - 1),
                progress: completed ? Math.min(1, plan.progress + (1 / plan.duration)) : Math.max(0, plan.progress - (1 / plan.duration))
              }
            : plan
        )
      );
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Error updating reading progress:', error);
    }
  };

  // Timer handlers
  const handleTimerUpdate = (timeSpent: number) => {
    setTotalReadingTime(timeSpent);
  };

  const handleSessionComplete = async (sessionData: ReadingSession) => {
    try {
      // Add session to local state
      setReadingSessions(prev => [...prev, sessionData]);
      
      // Update today's reading time
      const today = new Date().toDateString();
      const todaySessions = readingSessions.filter(session => 
        new Date(session.startTime).toDateString() === today
      );
      const todayTime = todaySessions.reduce((total, session) => total + session.duration, 0);
      setTodayReadingTime(todayTime + sessionData.duration);
      
      // Save to local storage
      await StorageManager.setItem('reading_sessions', [...readingSessions, sessionData]);
      await StorageManager.setItem('total_reading_time', totalReadingTime + sessionData.duration * 60);
      
      // Save to Firebase if user is authenticated
      if (user) {
        await FirebaseManager.saveReadingSession(user.uid, sessionData);
        console.log('Reading session saved to Firebase');
      }
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      console.log('Reading session completed and saved:', sessionData);
    } catch (error) {
      console.error('Error saving reading session:', error);
    }
  };

  const toggleTimer = () => {
    setShowTimer(!showTimer);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Load reading data on component mount and when user changes
  useEffect(() => {
    const loadReadingData = async () => {
      try {
        // Load from local storage first
        const localSessions = await StorageManager.getItem<ReadingSession[]>('reading_sessions') || [];
        const localTotalTime = await StorageManager.getItem<number>('total_reading_time') || 0;
        
        // Try to load from Firebase if user is authenticated
        let firebaseSessions = [];
        if (user) {
          firebaseSessions = await FirebaseManager.getReadingSessions(user.uid);
        }
        
        // Merge local and Firebase data (Firebase takes precedence)
        const allSessions = firebaseSessions.length > 0 ? firebaseSessions : localSessions;
        
        setReadingSessions(allSessions);
        setTotalReadingTime(localTotalTime);
        
        // Calculate today's reading time
        const today = new Date().toDateString();
        const todaySessions = allSessions.filter(session => 
          new Date(session.startTime).toDateString() === today
        );
        const todayTime = todaySessions.reduce((total, session) => total + session.duration, 0);
        setTodayReadingTime(todayTime);
        
        console.log('Loaded reading data:', { sessions: allSessions.length, totalTime: localTotalTime });
      } catch (error) {
        console.error('Error loading reading data:', error);
      }
    };

    loadReadingData();
  }, [user]);

  // Load user's custom reading plans
  useEffect(() => {
    const loadUserPlans = async () => {
      if (user) {
        try {
          const plans = await FirebaseManager.getReadingPlans(user.uid);
          setUserPlans(plans);
          console.log('Loaded user plans:', plans.length);
        } catch (error) {
          console.error('Error loading user plans:', error);
          // Continue with empty array if Firebase fails
          setUserPlans([]);
        }
      }
    };

    loadUserPlans();
  }, [user]);

  const renderReadingPlans = () => {
    const allPlans = [...readingPlans, ...userPlans];
    
    return (
      <View style={styles.tabContent}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Plan Categories */}
          <View style={styles.categoriesContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Reading Plans</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              Choose a plan that fits your schedule and goals
            </Text>
          </View>

          {allPlans.map((plan) => (
            <View
              key={plan.id}
              style={[
                styles.planCard,
                {
                  backgroundColor: colors.card,
                  borderColor: selectedPlan === plan.id ? plan.color : colors.border,
                  borderWidth: selectedPlan === plan.id ? 2 : 1,
                },
              ]}
            >
              <TouchableOpacity
                style={styles.planHeader}
                onPress={() => handlePlanSelect(plan.id)}
              >
                <View style={[styles.planIconContainer, { backgroundColor: plan.color + '20' }]}>
                  <Ionicons name={plan.icon} size={24} color={plan.color} />
                </View>
                <View style={styles.planInfo}>
                  <View style={styles.planTitleRow}>
                    <Text style={[styles.planTitle, { color: colors.text }]}>
                      {plan.title}
                    </Text>
                    {plan.isCustom && (
                      <View style={[styles.customBadge, { backgroundColor: colors.primary + '20' }]}>
                        <Text style={[styles.customBadgeText, { color: colors.primary }]}>
                          Custom
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.planDescription, { color: colors.textSecondary }]}>
                    {plan.description}
                  </Text>
                  <View style={styles.planMeta}>
                    <View style={styles.planMetaItem}>
                      <Ionicons name="time" size={14} color={colors.textSecondary} />
                      <Text style={[styles.planMetaText, { color: colors.textSecondary }]}>
                        {plan.estimatedTime}
                      </Text>
                    </View>
                    <View style={styles.planMetaItem}>
                      <Ionicons name="trending-up" size={14} color={colors.textSecondary} />
                      <Text style={[styles.planMetaText, { color: colors.textSecondary }]}>
                        {plan.difficulty}
                      </Text>
                    </View>
                    <View style={styles.planMetaItem}>
                      <Ionicons name="folder" size={14} color={colors.textSecondary} />
                      <Text style={[styles.planMetaText, { color: colors.textSecondary }]}>
                        {plan.category}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.planProgress}>
                  <ProgressRing
                    progress={plan.progress}
                    size={60}
                    color={plan.color}
                    strokeWidth={4}
                  />
                  <Text style={[styles.progressText, { color: colors.text }]}>
                    {Math.round(plan.progress * 100)}%
                  </Text>
                </View>
              </TouchableOpacity>
              
              <View style={styles.planStats}>
                <View style={styles.planStatItem}>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Duration
                  </Text>
                  <Text style={[styles.planStatValue, { color: colors.text }]}>
                    {plan.duration} days
                  </Text>
                </View>
                <View style={styles.planStatItem}>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Progress
                  </Text>
                  <Text style={[styles.planStatValue, { color: colors.text }]}>
                    {plan.completedDays || Math.round(plan.progress * plan.duration)} / {plan.duration}
                  </Text>
                </View>
                <View style={styles.planStatItem}>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Remaining
                  </Text>
                  <Text style={[styles.planStatValue, { color: colors.text }]}>
                    {plan.duration - (plan.completedDays || Math.round(plan.progress * plan.duration))} days
                  </Text>
                </View>
              </View>

              {/* Progress Actions */}
              <View style={styles.progressActions}>
                <TouchableOpacity
                  style={[
                    styles.progressButton,
                    { backgroundColor: colors.success + '20', borderColor: colors.success }
                  ]}
                  onPress={() => handleMarkProgress(plan.id, true)}
                >
                  <Ionicons name="checkmark" size={16} color={colors.success} />
                  <Text style={[styles.progressButtonText, { color: colors.success }]}>
                    Mark Complete
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.progressButton,
                    { backgroundColor: colors.warning + '20', borderColor: colors.warning }
                  ]}
                  onPress={() => handleMarkProgress(plan.id, false)}
                >
                  <Ionicons name="remove" size={16} color={colors.warning} />
                  <Text style={[styles.progressButtonText, { color: colors.warning }]}>
                    Undo
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.progressButton,
                    { backgroundColor: colors.primary + '20', borderColor: colors.primary }
                  ]}
                  onPress={() => setShowTimer(true)}
                >
                  <Ionicons name="timer" size={16} color={colors.primary} />
                  <Text style={[styles.progressButtonText, { color: colors.primary }]}>
                    Start Timer
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <TouchableOpacity
            style={[styles.createPlanCard, { backgroundColor: colors.card }]}
            onPress={() => setShowPlanBuilder(true)}
          >
            <View style={styles.createPlanContent}>
              <View style={[styles.createPlanIconContainer, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="add" size={24} color={colors.primary} />
              </View>
              <View style={styles.createPlanTextContainer}>
                <Text style={[styles.createPlanTitle, { color: colors.text }]}>
                  Create Custom Plan
                </Text>
                <Text style={[styles.createPlanSubtitle, { color: colors.textSecondary }]}>
                  Design your own reading schedule
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  };

  const renderTodaysReading = () => (
    <View style={styles.tabContent}>
      <GlassCard style={styles.readingCard}>
        <View style={styles.readingHeader}>
          <Text style={[styles.readingReference, { color: colors.primary }]}>
            {todaysReading.book} {todaysReading.chapter}:{todaysReading.verses}
          </Text>
          <Text style={[styles.readingTitle, { color: colors.text }]}>
            {todaysReading.title}
          </Text>
        </View>

        <View style={styles.readingContent}>
          <Text style={[styles.readingText, { color: colors.text }]}>
            "{todaysReading.text}"
          </Text>
        </View>

        <View style={styles.readingActions}>
          <CustomButton
            title={todaysReading.completed ? 'Completed' : 'Mark as Complete'}
            onPress={handleReadingComplete}
            variant={todaysReading.completed ? 'outline' : 'primary'}
            size="medium"
            style={styles.completeButton}
          />
          <CustomButton
            title="Add Notes"
            onPress={() => {}}
            variant="ghost"
            size="medium"
          />
        </View>
      </GlassCard>

      <View style={styles.recentSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Readings</Text>
        {recentReadings.map((reading, index) => (
          <View key={index} style={[styles.recentItem, { backgroundColor: colors.card }]}>
            <View style={styles.recentInfo}>
              <Text style={[styles.recentReference, { color: colors.text }]}>
                {reading.book} {reading.chapter}
              </Text>
              <Text style={[styles.recentDate, { color: colors.textSecondary }]}>
                {reading.date}
              </Text>
            </View>
            <View style={[styles.recentStatus, { backgroundColor: colors.success }]}>
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderProgress = () => {
    const totalReadingTime = readingSessions.reduce((total, session) => total + session.duration, 0);
    const thisWeekSessions = readingSessions.filter(session => {
      const sessionDate = new Date(session.startTime);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return sessionDate >= weekAgo;
    });
    const thisWeekTime = thisWeekSessions.reduce((total, session) => total + session.duration, 0);

    return (
      <View style={styles.tabContent}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Enhanced Statistics */}
          <GlassCard style={styles.statsCard}>
            <Text style={[styles.statsTitle, { color: colors.text }]}>Reading Statistics</Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <ProgressRing
                  progress={readingProgress}
                  size={80}
                  color={colors.primary}
                  strokeWidth={6}
                />
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Overall Progress
                </Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {Math.round(readingProgress * 100)}%
                </Text>
              </View>

              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.success }]}>
                  {currentStreak}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Day Streak
                </Text>
              </View>

              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.primary }]}>
                  {totalDays}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Total Days
                </Text>
              </View>
            </View>

            {/* Additional Stats */}
            <View style={styles.additionalStats}>
              <View style={styles.additionalStatItem}>
                <Ionicons name="time" size={20} color={colors.primary} />
                <Text style={[styles.additionalStatValue, { color: colors.text }]}>
                  {Math.floor(totalReadingTime)} min
                </Text>
                <Text style={[styles.additionalStatLabel, { color: colors.textSecondary }]}>
                  Total Reading Time
                </Text>
              </View>
              <View style={styles.additionalStatItem}>
                <Ionicons name="calendar" size={20} color={colors.success} />
                <Text style={[styles.additionalStatValue, { color: colors.text }]}>
                  {thisWeekTime} min
                </Text>
                <Text style={[styles.additionalStatLabel, { color: colors.textSecondary }]}>
                  This Week
                </Text>
              </View>
              <View style={styles.additionalStatItem}>
                <Ionicons name="book" size={20} color={colors.warning} />
                <Text style={[styles.additionalStatValue, { color: colors.text }]}>
                  {readingSessions.length}
                </Text>
                <Text style={[styles.additionalStatLabel, { color: colors.textSecondary }]}>
                  Sessions
                </Text>
              </View>
            </View>
          </GlassCard>

          {/* Enhanced Calendar */}
          <GlassCard style={styles.calendarCard}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity
                onPress={() => setCurrentMonth(addDays(currentMonth, -30))}
                style={styles.calendarNavButton}
              >
                <Ionicons name="chevron-back" size={20} color={colors.primary} />
              </TouchableOpacity>
              
              <Text style={[styles.calendarTitle, { color: colors.text }]}>
                {format(currentMonth, 'MMMM yyyy')}
              </Text>
              
              <TouchableOpacity
                onPress={() => setCurrentMonth(addDays(currentMonth, 30))}
                style={styles.calendarNavButton}
              >
                <Ionicons name="chevron-forward" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Calendar Grid */}
            <View style={styles.calendarGrid}>
              {calendarData.map((day, index) => {
                const getDayColor = () => {
                  if (day.isToday) return colors.primary;
                  if (!day.completed) return colors.border;
                  
                  // Intensity-based colors
                  switch (day.intensity) {
                    case 'high': return '#2DCE89'; // Dark green
                    case 'medium': return '#4ECDC4'; // Medium green
                    case 'low': return '#82E0AA'; // Light green
                    default: return colors.success;
                  }
                };

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.calendarDay,
                      {
                        backgroundColor: getDayColor(),
                        borderColor: day.isToday ? colors.primary : 'transparent',
                        borderWidth: day.isToday ? 2 : 0,
                      },
                    ]}
                  >
                    <Text style={[
                      styles.calendarDayText,
                      { 
                        color: day.completed || day.isToday ? '#FFFFFF' : colors.textSecondary,
                        fontWeight: day.isToday ? '600' : '400'
                      }
                    ]}>
                      {format(day.date, 'd')}
                    </Text>
                    {day.completed && day.readingTime > 0 && (
                      <Text style={styles.calendarDayTime}>
                        {day.readingTime}m
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Enhanced Legend */}
            <View style={styles.calendarLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#2DCE89' }]} />
                <Text style={[styles.legendText, { color: colors.textSecondary }]}>High Intensity</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#4ECDC4' }]} />
                <Text style={[styles.legendText, { color: colors.textSecondary }]}>Medium</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#82E0AA' }]} />
                <Text style={[styles.legendText, { color: colors.textSecondary }]}>Low</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.border }]} />
                <Text style={[styles.legendText, { color: colors.textSecondary }]}>Missed</Text>
              </View>
            </View>
          </GlassCard>
        </ScrollView>
      </View>
    );
  };

  const renderTimer = () => (
    <View style={styles.tabContent}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Reading Statistics */}
        <GlassCard style={styles.statsCard}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Reading Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {Math.floor(todayReadingTime)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Minutes Today
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.success }]}>
                {Math.floor(totalReadingTime / 60)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Total Minutes
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.warning }]}>
                {readingSessions.length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Sessions
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* Bible Reading Timer */}
        <BibleReadingTimer
          onTimerUpdate={handleTimerUpdate}
          onSessionComplete={handleSessionComplete}
          initialTime={totalReadingTime}
          isActive={showTimer}
          goalMinutes={30}
          showGoalSetting={true}
        />

        {/* Recent Sessions */}
        {readingSessions.length > 0 && (
          <GlassCard style={styles.sessionsCard}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Recent Sessions</Text>
            {readingSessions.slice(-5).reverse().map((session) => (
              <View key={session.id} style={styles.sessionItem}>
                <View style={styles.sessionInfo}>
                  <Text style={[styles.sessionDate, { color: colors.text }]}>
                    {format(new Date(session.startTime), 'MMM d, h:mm a')}
                  </Text>
                  <Text style={[styles.sessionDuration, { color: colors.textSecondary }]}>
                    {session.duration} minutes
                  </Text>
                </View>
                {session.chapter && (
                  <Text style={[styles.sessionChapter, { color: colors.textSecondary }]}>
                    {session.chapter} {session.verses}
                  </Text>
                )}
              </View>
            ))}
          </GlassCard>
        )}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Text style={[styles.title, { color: colors.text }]}>Bible Reading</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Track your journey through Scripture
        </Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        {[
          { id: 'plans', label: 'Plans' },
          { id: 'reading', label: "Today's Reading" },
          { id: 'timer', label: 'Timer' },
          { id: 'progress', label: 'Progress' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tabButton,
              {
                backgroundColor: activeTab === tab.id ? colors.primary : 'transparent',
              },
            ]}
            onPress={() => {
              setActiveTab(tab.id);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Text
              style={[
                styles.tabButtonText,
                {
                  color: activeTab === tab.id ? '#FFFFFF' : colors.textSecondary,
                },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <View style={styles.content}>
        {activeTab === 'plans' && renderReadingPlans()}
        {activeTab === 'reading' && renderTodaysReading()}
        {activeTab === 'timer' && renderTimer()}
        {activeTab === 'progress' && renderProgress()}
      </View>

      {/* Custom Plan Builder Modal */}
      <Modal
        visible={showPlanBuilder}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowPlanBuilder(false)}>
              <Text style={[styles.modalCancel, { color: colors.primary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Create Plan</Text>
            <TouchableOpacity onPress={handleCreateCustomPlan} disabled={loading}>
              {loading ? (
                <Text style={[styles.modalSave, { color: colors.textSecondary }]}>Saving...</Text>
              ) : (
                <Text style={[styles.modalSave, { color: colors.primary }]}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Plan Name */}
            <View style={styles.inputSection}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Plan Name</Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                value={customPlanName}
                onChangeText={setCustomPlanName}
                placeholder="Enter plan name"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            {/* Plan Description */}
            <View style={styles.inputSection}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Description</Text>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                value={customPlanDescription}
                onChangeText={setCustomPlanDescription}
                placeholder="Enter plan description"
                placeholderTextColor={colors.textSecondary}
                multiline
                textAlignVertical="top"
              />
            </View>

            {/* Duration */}
            <View style={styles.inputSection}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Duration (days)</Text>
              <View style={styles.durationContainer}>
                <TouchableOpacity
                  style={[styles.durationButton, { backgroundColor: colors.card }]}
                  onPress={() => setCustomPlanDuration(Math.max(1, customPlanDuration - 1))}
                >
                  <Text style={[styles.durationButtonText, { color: colors.text }]}>-</Text>
                </TouchableOpacity>
                <Text style={[styles.durationText, { color: colors.text }]}>
                  {customPlanDuration} days
                </Text>
                <TouchableOpacity
                  style={[styles.durationButton, { backgroundColor: colors.card }]}
                  onPress={() => setCustomPlanDuration(Math.min(365, customPlanDuration + 1))}
                >
                  <Text style={[styles.durationButtonText, { color: colors.text }]}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Icon Selection */}
            <View style={styles.inputSection}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Choose Icon</Text>
              <View style={styles.iconGrid}>
                {iconOptions.map((icon) => (
                  <TouchableOpacity
                    key={icon.id}
                    style={[
                      styles.iconOption,
                      {
                        backgroundColor: customPlanIcon === icon.id ? icon.color + '20' : colors.card,
                        borderColor: customPlanIcon === icon.id ? icon.color : colors.border,
                      },
                    ]}
                    onPress={() => setCustomPlanIcon(icon.id)}
                  >
                    <Ionicons 
                      name={icon.icon} 
                      size={24} 
                      color={customPlanIcon === icon.id ? icon.color : colors.textSecondary} 
                    />
                    <Text style={[
                      styles.iconOptionText, 
                      { color: customPlanIcon === icon.id ? icon.color : colors.textSecondary }
                    ]}>
                      {icon.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
  },
  tabNavigation: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  tabContent: {
    flex: 1,
  },
  planCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  planIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(94, 114, 228, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  planIcon: {
    fontSize: 20,
  },
  planInfo: {
    flex: 1,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 14,
    fontWeight: '400',
  },
  planProgress: {
    alignItems: 'center',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  planStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  createPlanCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(94, 114, 228, 0.3)',
    borderStyle: 'dashed',
  },
  createPlanIcon: {
    fontSize: 32,
    fontWeight: '300',
    marginBottom: 8,
  },
  createPlanText: {
    fontSize: 16,
    fontWeight: '600',
  },
  readingCard: {
    padding: 20,
    marginBottom: 20,
  },
  readingHeader: {
    marginBottom: 16,
  },
  readingReference: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  readingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  readingContent: {
    marginBottom: 20,
  },
  readingText: {
    fontSize: 16,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  readingActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  completeButton: {
    flex: 0.6,
  },
  recentSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  recentInfo: {
    flex: 1,
  },
  recentReference: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  recentDate: {
    fontSize: 14,
    fontWeight: '400',
  },
  recentStatus: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentStatusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statsCard: {
    padding: 20,
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  calendarCard: {
    padding: 20,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  calendarDay: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    borderWidth: 2,
  },
  calendarDayText: {
    fontSize: 12,
    fontWeight: '600',
  },
  calendarLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalCancel: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalSave: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  // Timer-related styles
  timerStatsCard: {
    marginBottom: 20,
    padding: 20,
  },
  timerStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  timerStatItem: {
    alignItems: 'center',
  },
  timerStatValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  timerStatLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  sessionsCard: {
    marginBottom: 20,
    padding: 20,
  },
  sessionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionDate: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  sessionDuration: {
    fontSize: 12,
    fontWeight: '500',
  },
  sessionChapter: {
    fontSize: 12,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  // New styles for enhanced features
  customBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  customBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  progressActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 8,
  },
  progressButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  progressButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inputSection: {
    marginBottom: 20,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 80,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  durationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  durationButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  durationText: {
    fontSize: 18,
    fontWeight: '600',
    minWidth: 80,
    textAlign: 'center',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  iconOption: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginBottom: 8,
  },
  iconOptionText: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  // Enhanced styles for new features
  categoriesContainer: {
    marginBottom: 20,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    marginTop: 4,
  },
  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  planMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 12,
  },
  planMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  planMetaText: {
    fontSize: 12,
    fontWeight: '500',
  },
  planStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  planStatValue: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  createPlanContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  createPlanIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  createPlanTextContainer: {
    flex: 1,
  },
  createPlanTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  createPlanSubtitle: {
    fontSize: 14,
    fontWeight: '400',
  },
  additionalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  additionalStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  additionalStatValue: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 2,
  },
  additionalStatLabel: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  calendarNavButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  calendarDayTime: {
    fontSize: 8,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
});

export default BibleTrackerScreen;
