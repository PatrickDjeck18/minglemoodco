import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  TextInput,
  Alert,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { SupabaseManager, supabase } from '../utils/supabase';
import GlassCard from '../components/GlassCard';
import CustomButton from '../components/CustomButton';
import ProgressRing from '../components/ProgressRing';
import ModernBackButton from '../components/ModernBackButton';

const ChristianHabitsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('habits');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCreator, setShowCreator] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  // Form states
  const [habitName, setHabitName] = useState('');
  const [habitDescription, setHabitDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedFrequency, setSelectedFrequency] = useState('daily');
  const [targetDuration, setTargetDuration] = useState('');
  const [reminderTime, setReminderTime] = useState('');

  const [habits, setHabits] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHabitOptions, setShowHabitOptions] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [completedToday, setCompletedToday] = useState<Set<string>>(new Set());
  const [animatingHabits, setAnimatingHabits] = useState<Set<string>>(new Set());

  const habitCategories = [
    { id: 'prayer', name: 'Prayer', icon: 'home' as keyof typeof Ionicons.glyphMap, color: '#5E72E4' },
    { id: 'study', name: 'Bible Study', icon: 'book' as keyof typeof Ionicons.glyphMap, color: '#2DCE89' },
    { id: 'worship', name: 'Worship', icon: 'musical-notes' as keyof typeof Ionicons.glyphMap, color: '#825EE4' },
    { id: 'service', name: 'Service', icon: 'heart' as keyof typeof Ionicons.glyphMap, color: '#FF6B6B' },
    { id: 'fellowship', name: 'Fellowship', icon: 'people' as keyof typeof Ionicons.glyphMap, color: '#4ECDC4' },
    { id: 'discipline', name: 'Discipline', icon: 'fitness' as keyof typeof Ionicons.glyphMap, color: '#FFD93D' },
  ];

  const frequencies = [
    { id: 'daily', name: 'Daily', icon: 'sunny' as keyof typeof Ionicons.glyphMap },
    { id: 'weekly', name: 'Weekly', icon: 'calendar' as keyof typeof Ionicons.glyphMap },
    { id: 'monthly', name: 'Monthly', icon: 'time' as keyof typeof Ionicons.glyphMap },
  ];

  // Load data
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const [habitsData, templatesData] = await Promise.all([
          SupabaseManager.getChristianHabits(user.id),
          SupabaseManager.getHabitTemplates()
        ]);
        
        setHabits(habitsData);
        setTemplates(templatesData);
        
        // Check which habits were completed today
        await checkTodaysCompletions(habitsData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Check which habits were completed today
  const checkTodaysCompletions = async (habitsData: any[]) => {
    if (!user) return;
    
    const today = new Date().toISOString().split('T')[0];
    const completedSet = new Set<string>();
    
    for (const habit of habitsData) {
      try {
        const completions = await SupabaseManager.getHabitCompletions(habit.id);
        const completedToday = completions.some(completion => 
          completion.completion_date === today
        );
        
        if (completedToday) {
          completedSet.add(habit.id);
        }
      } catch (error) {
        console.error('Error checking completions for habit:', habit.id, error);
      }
    }
    
    setCompletedToday(completedSet);
  };

  const handleCreateHabit = async () => {
    if (!habitName.trim() || !selectedCategory) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      if (user) {
        if (isEditing && selectedHabit) {
          // Update existing habit
          await SupabaseManager.updateChristianHabit(selectedHabit.id, {
            name: habitName.trim(),
            description: habitDescription.trim(),
            category: selectedCategory,
            frequency: selectedFrequency,
            target_duration: targetDuration ? parseInt(targetDuration) : undefined,
            reminder_time: reminderTime || undefined,
          });
        } else {
          // Create new habit
          await SupabaseManager.saveChristianHabit(user.id, {
            name: habitName.trim(),
            description: habitDescription.trim(),
            category: selectedCategory,
            frequency: selectedFrequency,
            target_duration: targetDuration ? parseInt(targetDuration) : undefined,
            reminder_time: reminderTime || undefined,
          });
        }
        
        // Refresh habits
        const updatedHabits = await SupabaseManager.getChristianHabits(user.id);
        setHabits(updatedHabits);
        
        // Reset form
        setHabitName('');
        setHabitDescription('');
        setSelectedCategory('');
        setTargetDuration('');
        setReminderTime('');
        setShowCreator(false);
        setIsEditing(false);
        setSelectedHabit(null);
        
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error saving habit:', error);
      Alert.alert('Error', 'Failed to save habit');
    }
  };

  const handleCompleteHabit = async (habitId: string) => {
    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    // Check if already completed today
    if (completedToday.has(habitId)) {
      Alert.alert(
        'Already Completed',
        'This habit has already been completed today. Come back tomorrow!',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    // Add to animating set
    setAnimatingHabits(prev => new Set(prev).add(habitId));

    try {
      await SupabaseManager.completeChristianHabit(habitId, user.id, {
        // No additional completion data for now, just mark as complete
      });
      
      // Add to completed today set
      setCompletedToday(prev => new Set(prev).add(habitId));
      
      // Refresh habits
      const updatedHabits = await SupabaseManager.getChristianHabits(user.id);
      setHabits(updatedHabits);
      
      // Success feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Show success message
      Alert.alert(
        'Great Job! 🙌',
        'Habit completed successfully! Keep up the good work.',
        [{ text: 'Continue', style: 'default' }]
      );
      
    } catch (error) {
      console.error('Error completing habit:', error);
      Alert.alert('Error', 'Failed to complete habit');
    } finally {
      // Remove from animating set after animation
      setTimeout(() => {
        setAnimatingHabits(prev => {
          const newSet = new Set(prev);
          newSet.delete(habitId);
          return newSet;
        });
      }, 1000);
    }
  };

  const handleUseTemplate = (template: any) => {
    setSelectedTemplate(template);
    setHabitName(template.name);
    setHabitDescription(template.description || '');
    setSelectedCategory(template.category);
    setSelectedFrequency(template.frequency);
    setTargetDuration(template.suggested_duration?.toString() || '');
    setShowTemplateModal(false);
    setShowCreator(true);
  };

  const handleHabitOptions = (habit: any) => {
    setSelectedHabit(habit);
    setShowHabitOptions(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleEditHabit = () => {
    if (selectedHabit) {
      setHabitName(selectedHabit.name);
      setHabitDescription(selectedHabit.description || '');
      setSelectedCategory(selectedHabit.category);
      setSelectedFrequency(selectedHabit.frequency);
      setTargetDuration(selectedHabit.target_duration?.toString() || '');
      setReminderTime(selectedHabit.reminder_time || '');
      setIsEditing(true);
      setShowHabitOptions(false);
      setShowCreator(true);
    }
  };

  const handleDeleteHabit = async () => {
    if (!selectedHabit || !selectedHabit.id) {
      Alert.alert('Error', 'No habit selected for deletion');
      return;
    }
    
    try {
      // Delete completions first
      const { error: deleteCompletionsError } = await supabase
        .from('christian_habit_completions')
        .delete()
        .eq('habit_id', selectedHabit.id);
      
      if (deleteCompletionsError) {
        Alert.alert('Error', `Failed to delete completions: ${deleteCompletionsError.message}`);
        return;
      }
      
      // Delete the habit
      const { error: deleteHabitError, count: deletedHabits } = await supabase
        .from('christian_habits')
        .delete()
        .eq('id', selectedHabit.id)
        .select('*', { count: 'exact' });
      
      if (deleteHabitError) {
        Alert.alert('Error', `Failed to delete habit: ${deleteHabitError.message}`);
        return;
      }
      
      if (deletedHabits === 0) {
        Alert.alert('Error', 'No habits were deleted');
        return;
      }
      
      // Refresh habits list
      const updatedHabits = await SupabaseManager.getChristianHabits(user?.id || '');
      setHabits(updatedHabits);
      
      // Update completed today set
      setCompletedToday(prev => {
        const newSet = new Set(prev);
        newSet.delete(selectedHabit.id);
        return newSet;
      });
      
      setShowHabitOptions(false);
      setSelectedHabit(null);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Habit deleted successfully!');
      
    } catch (error) {
      Alert.alert('Error', `Delete failed: ${error.message || 'Unknown error'}`);
    }
  };

  const handleViewProgress = () => {
    if (!selectedHabit) return;
    
    setShowHabitOptions(false);
    
    // Show habit progress information
    const progressInfo = `
Habit: ${selectedHabit.name}
Current Streak: ${selectedHabit.current_streak} days
Longest Streak: ${selectedHabit.longest_streak} days
Total Completions: ${selectedHabit.total_completions}
Completion Rate: ${selectedHabit.completion_rate || 0}%
Frequency: ${selectedHabit.frequency}
Last Completed: ${selectedHabit.last_completed ? new Date(selectedHabit.last_completed).toLocaleDateString() : 'Never'}
    `.trim();
    
    Alert.alert('Habit Progress', progressInfo, [
      { text: 'OK', style: 'default' }
    ]);
  };

  // Animated Complete Button Component
  const AnimatedCompleteButton = ({ habit, onPress }: { habit: any, onPress: () => void }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const isCompleted = completedToday.has(habit.id);
    const isAnimating = animatingHabits.has(habit.id);

    const handlePress = () => {
      // Animation sequence
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 0.95,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      onPress();
    };

    const rotate = rotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <Animated.View
        style={[
          styles.animatedButtonContainer,
          {
            transform: [
              { scale: scaleAnim },
              { rotate: rotate },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.completeButtonModern,
            {
              backgroundColor: isCompleted ? '#4CAF50' : isAnimating ? '#FF9800' : '#4CAF50',
              opacity: isCompleted ? 0.7 : 1,
            },
          ]}
          onPress={handlePress}
          disabled={isCompleted}
        >
          <Ionicons 
            name={isCompleted ? "checkmark-circle" : isAnimating ? "hourglass" : "checkmark"} 
            size={20} 
            color="white" 
          />
          <Text style={styles.completeButtonText}>
            {isCompleted ? 'Completed' : isAnimating ? 'Processing...' : 'Complete'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderHabits = () => (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.habitsContainer}>
      {habits.map((habit) => (
        <View key={habit.id} style={[
          styles.modernHabitCard, 
          { 
            backgroundColor: colors.background,
            opacity: completedToday.has(habit.id) ? 0.8 : 1,
          }
        ]}>
          {/* Completion Badge */}
          {completedToday.has(habit.id) && (
            <View style={styles.completionBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
            </View>
          )}
          
          {/* Habit Header */}
          <View style={styles.habitCardHeader}>
            <View style={styles.habitMainInfo}>
              <View style={[
                styles.habitIconContainer, 
                { backgroundColor: habitCategories.find(c => c.id === habit.category)?.color + '15' }
              ]}>
                <Ionicons 
                  name={habitCategories.find(c => c.id === habit.category)?.icon || 'star'} 
                  size={24} 
                  color={habitCategories.find(c => c.id === habit.category)?.color || colors.primary} 
                />
              </View>
              <View style={styles.habitTextInfo}>
                <Text style={[styles.modernHabitName, { color: colors.text }]}>
                  {habit.name}
                </Text>
                <View style={styles.habitMetaRow}>
                  <View style={styles.habitMetaItem}>
                    <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                    <Text style={[styles.habitMetaText, { color: colors.textSecondary }]}>
                      {habit.frequency}
                    </Text>
                  </View>
                  <View style={styles.habitMetaItem}>
                    <Ionicons name="flame-outline" size={14} color="#FF6B35" />
                    <Text style={[styles.habitMetaText, { color: '#FF6B35' }]}>
                      {habit.current_streak} days
                    </Text>
                  </View>
                </View>
                {habit.description && (
                  <Text style={[styles.modernHabitDescription, { color: colors.textSecondary }]}>
                    {habit.description}
                  </Text>
                )}
              </View>
            </View>
            
            {/* Streak Badge */}
            <View style={[styles.streakBadge, { backgroundColor: '#FF6B35' }]}>
              <Text style={styles.streakNumber}>{habit.current_streak}</Text>
              <Text style={styles.streakLabel}>days</Text>
            </View>
          </View>

          {/* Progress Section */}
          <View style={styles.habitProgressSection}>
            <View style={styles.progressInfo}>
              <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>Progress</Text>
              <View style={styles.progressStats}>
                <Text style={[styles.progressStat, { color: colors.text }]}>
                  {habit.total_completions} completions
                </Text>
                <Text style={[styles.progressStat, { color: colors.textSecondary }]}>
                  Best: {habit.longest_streak} days
                </Text>
              </View>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      backgroundColor: habitCategories.find(c => c.id === habit.category)?.color || colors.primary,
                      width: `${Math.min((habit.current_streak / Math.max(habit.target_duration || 30, 1)) * 100, 100)}%`
                    }
                  ]} 
                />
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.modernHabitActions}>
            <AnimatedCompleteButton
              habit={habit}
              onPress={() => handleCompleteHabit(habit.id)}
            />
            
            <TouchableOpacity
              style={[styles.optionsButtonModern, { backgroundColor: colors.card }]}
              onPress={() => handleHabitOptions(habit)}
            >
              <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      ))}

    </ScrollView>
  );

  const renderCalendar = () => {
    const today = new Date();
    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();
    
    // Get first day of month and number of days
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Helper function to check if a habit was completed on a specific date
    const isHabitCompletedOnDate = (habitId: string, date: Date) => {
      const dateString = date.toISOString().split('T')[0];
      
      // Check if this habit was completed today (for demo purposes)
      // In a real implementation, you would check the database for completion records
      const today = new Date().toISOString().split('T')[0];
      if (dateString === today) {
        return completedToday.has(habitId);
      }
      
      // For other dates, we'll use a simple pattern for demo
      // In production, you'd fetch actual completion data from the database
      const dayOfWeek = date.getDay();
      const dayOfMonth = date.getDate();
      
      // Demo pattern: complete habits on certain days
      if (dayOfWeek === 0 || dayOfWeek === 6) return false; // No completions on weekends for demo
      if (dayOfMonth % 3 === 0) return true; // Complete every 3rd day
      if (dayOfMonth % 7 === 0) return true; // Complete every 7th day
      
      return false;
    };
    
    // Helper function to get completion count for a specific date
    const getCompletionCountForDate = (date: Date) => {
      let completedCount = 0;
      habits.forEach(habit => {
        if (isHabitCompletedOnDate(habit.id, date)) {
          completedCount++;
        }
      });
      return completedCount;
    };
    
    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Calendar Header */}
        <View style={styles.calendarHeader}>
          <TouchableOpacity
            style={styles.calendarNavButton}
            onPress={() => setSelectedDate(new Date(currentYear, currentMonth - 1, 1))}
          >
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </TouchableOpacity>
          
          <Text style={[styles.calendarTitle, { color: colors.text }]}>
            {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
          
          <TouchableOpacity
            style={styles.calendarNavButton}
            onPress={() => setSelectedDate(new Date(currentYear, currentMonth + 1, 1))}
          >
            <Ionicons name="chevron-forward" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
        
        {/* Week Days Header */}
        <View style={styles.weekDaysContainer}>
          {weekDays.map((day) => (
            <Text key={day} style={[styles.weekDayText, { color: colors.textSecondary }]}>
              {day}
            </Text>
          ))}
        </View>
        
        {/* Calendar Grid */}
        <View style={styles.calendarGrid}>
          {days.map((day, index) => {
            if (day === null) {
              return <View key={index} style={styles.calendarDay} />;
            }
            
            const isToday = day === today.getDate() && 
                          currentMonth === today.getMonth() && 
                          currentYear === today.getFullYear();
            
            const isSelected = day === selectedDate.getDate() && 
                             currentMonth === selectedDate.getMonth() && 
                             currentYear === selectedDate.getFullYear();
            
            // Create date object for this day
            const dayDate = new Date(currentYear, currentMonth, day);
            const completionCount = getCompletionCountForDate(dayDate);
            const totalHabits = habits.length;
            const completionPercentage = totalHabits > 0 ? (completionCount / totalHabits) * 100 : 0;
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.calendarDay,
                  isToday && styles.todayDay,
                  isSelected && styles.selectedDay
                ]}
                onPress={() => setSelectedDate(new Date(currentYear, currentMonth, day))}
              >
                <Text style={[
                  styles.calendarDayText,
                  { color: colors.text },
                  isToday && styles.todayDayText,
                  isSelected && styles.selectedDayText
                ]}>
                  {day}
                </Text>
                
                {/* Completion indicators */}
                {completionCount > 0 && (
                  <View style={styles.completionIndicators}>
                    {/* Completion dots */}
                    <View style={styles.completionDots}>
                      {Array.from({ length: Math.min(completionCount, 3) }).map((_, dotIndex) => (
                        <View
                          key={dotIndex}
                          style={[
                            styles.completionDot,
                            { 
                              backgroundColor: completionPercentage >= 100 ? '#4CAF50' : 
                                             completionPercentage >= 50 ? '#FF9800' : '#FF6B6B'
                            }
                          ]}
                        />
                      ))}
                      {completionCount > 3 && (
                        <Text style={styles.moreCompletionsText}>+{completionCount - 3}</Text>
                      )}
                    </View>
                    
                    {/* Completion streak indicator */}
                    {completionPercentage >= 100 && (
                      <View style={styles.perfectDayIndicator}>
                        <Ionicons name="checkmark-circle" size={12} color="#4CAF50" />
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
        
        {/* Selected Date Habits */}
        <View style={styles.selectedDateHabits}>
          <Text style={[styles.selectedDateTitle, { color: colors.text }]}>
            Habits for {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
          
          {habits.map((habit) => (
            <View key={habit.id} style={[styles.calendarHabitCard, { backgroundColor: colors.background }]}>
              <View style={styles.calendarHabitInfo}>
                <View style={[
                  styles.calendarHabitIcon,
                  { backgroundColor: habitCategories.find(c => c.id === habit.category)?.color + '15' }
                ]}>
                  <Ionicons 
                    name={habitCategories.find(c => c.id === habit.category)?.icon || 'star'} 
                    size={20} 
                    color={habitCategories.find(c => c.id === habit.category)?.color || colors.primary} 
                  />
                </View>
                <View style={styles.calendarHabitDetails}>
                  <Text style={[styles.calendarHabitName, { color: colors.text }]}>
                    {habit.name}
                  </Text>
                  <Text style={[styles.calendarHabitFrequency, { color: colors.textSecondary }]}>
                    {habit.frequency} • {habit.current_streak} day streak
                  </Text>
                </View>
              </View>
              
              <AnimatedCompleteButton
                habit={habit}
                onPress={() => handleCompleteHabit(habit.id)}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderTemplates = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Choose from Templates
      </Text>
      <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
        Start with proven Christian habits
      </Text>
      
      {templates.map((template) => (
        <GlassCard key={template.id} style={styles.templateCard}>
          <View style={styles.templateHeader}>
            <View style={[styles.templateIcon, { backgroundColor: template.color + '20' }]}>
              <Ionicons 
                name={habitCategories.find(c => c.id === template.category)?.icon || 'star'} 
                size={20} 
                color={habitCategories.find(c => c.id === template.category)?.color || colors.primary} 
              />
            </View>
            <View style={styles.templateInfo}>
              <Text style={[styles.templateName, { color: colors.text }]}>
                {template.name}
              </Text>
              <Text style={[styles.templateDescription, { color: colors.textSecondary }]}>
                {template.description}
              </Text>
              <View style={styles.templateMeta}>
                <Text style={[styles.templateFrequency, { color: colors.primary }]}>
                  {template.frequency}
                </Text>
                <Text style={[styles.templateDuration, { color: colors.textSecondary }]}>
                  {template.suggested_duration} min
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.templateBenefits}>
            <Text style={[styles.benefitsTitle, { color: colors.text }]}>Benefits:</Text>
            {template.benefits?.map((benefit: string, index: number) => (
              <Text key={index} style={[styles.benefitItem, { color: colors.textSecondary }]}>
                • {benefit}
              </Text>
            ))}
          </View>
          
          <View style={styles.templateActions}>
            <Text style={[styles.scriptureRef, { color: colors.primary }]}>
              {template.scripture_reference}
            </Text>
            <CustomButton
              title="Use Template"
              onPress={() => handleUseTemplate(template)}
              size="small"
              style={styles.useTemplateButton}
            />
          </View>
        </GlassCard>
      ))}
    </ScrollView>
  );

  const renderCreator = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <GlassCard style={styles.creatorCard}>
        <Text style={[styles.creatorTitle, { color: colors.text }]}>
          Create Custom Habit
        </Text>

        <View style={styles.inputSection}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Habit Name *</Text>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            value={habitName}
            onChangeText={setHabitName}
            placeholder="Enter habit name"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.inputSection}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Description</Text>
          <TextInput
            style={[
              styles.textInput,
              styles.textArea,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            value={habitDescription}
            onChangeText={setHabitDescription}
            placeholder="Describe your habit"
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.inputSection}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Category *</Text>
          <View style={styles.categoryGrid}>
            {habitCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  {
                    backgroundColor: selectedCategory === category.id 
                      ? category.color + '20' 
                      : colors.card,
                    borderColor: selectedCategory === category.id 
                      ? category.color 
                      : colors.border,
                  },
                ]}
                onPress={() => {
                  setSelectedCategory(category.id);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Ionicons name={category.icon} size={20} color={category.color} />
                <Text style={[styles.categoryName, { color: colors.text }]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputSection}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Frequency</Text>
          <View style={styles.frequencyGrid}>
            {frequencies.map((freq) => (
              <TouchableOpacity
                key={freq.id}
                style={[
                  styles.frequencyButton,
                  {
                    backgroundColor: selectedFrequency === freq.id 
                      ? colors.primary + '20' 
                      : colors.card,
                    borderColor: selectedFrequency === freq.id 
                      ? colors.primary 
                      : colors.border,
                  },
                ]}
                onPress={() => {
                  setSelectedFrequency(freq.id);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Ionicons name={freq.icon} size={16} color={colors.primary} />
                <Text style={[styles.frequencyName, { color: colors.text }]}>
                  {freq.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputSection}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Target Duration (minutes)</Text>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            value={targetDuration}
            onChangeText={setTargetDuration}
            placeholder="e.g., 15"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputSection}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Reminder Time</Text>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            value={reminderTime}
            onChangeText={setReminderTime}
            placeholder="e.g., 07:00"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <CustomButton
          title={isEditing ? "Update Habit" : "Create Habit"}
          onPress={handleCreateHabit}
          size="large"
          style={styles.createButton}
        />
      </GlassCard>
    </ScrollView>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={styles.headerContent}>
          <ModernBackButton onPress={() => navigation.goBack()} />
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: colors.text }]}>Christian Habits</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Build spiritual disciplines
            </Text>
          </View>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        {[
          { id: 'habits', label: 'My Habits' },
          { id: 'calendar', label: 'Calendar' },
          { id: 'templates', label: 'Templates' },
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
        {activeTab === 'habits' && renderHabits()}
        {activeTab === 'calendar' && renderCalendar()}
        {activeTab === 'templates' && renderTemplates()}
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => {
          setShowCreator(true);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>

      {/* Creator Modal */}
      <Modal
        visible={showCreator}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowCreator(false);
          setIsEditing(false);
          setSelectedHabit(null);
        }}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity
              onPress={() => {
                setShowCreator(false);
                setIsEditing(false);
                setSelectedHabit(null);
              }}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {isEditing ? 'Edit Habit' : 'Create New Habit'}
            </Text>
            <View style={styles.modalSpacer} />
          </View>
          
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {renderCreator()}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Habit Options Modal */}
      <Modal
        visible={showHabitOptions}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowHabitOptions(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowHabitOptions(false)}
        >
          <View style={[styles.optionsModal, { backgroundColor: colors.card }]}>
            <Text style={[styles.optionsTitle, { color: colors.text }]}>
              {selectedHabit?.name}
            </Text>
            
            <TouchableOpacity
              style={styles.optionButton}
              onPress={handleEditHabit}
            >
              <Ionicons name="create-outline" size={20} color={colors.primary} />
              <Text style={[styles.optionText, { color: colors.text }]}>Edit Habit</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.optionButton}
              onPress={handleViewProgress}
            >
              <Ionicons name="trending-up-outline" size={20} color={colors.primary} />
              <Text style={[styles.optionText, { color: colors.text }]}>View Progress</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.optionButton}
              onPress={handleDeleteHabit}
            >
              <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
              <Text style={[styles.optionText, { color: '#FF6B6B' }]}>Delete Habit</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    marginLeft: 16,
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
  habitsContainer: {
    flex: 1,
  },
  // Modern Habit Card Styles
  modernHabitCard: {
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  habitCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  habitMainInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  habitIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  habitTextInfo: {
    flex: 1,
  },
  modernHabitName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  habitMetaRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  habitMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  habitMetaText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  modernHabitDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  streakBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 60,
  },
  streakNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  streakLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: 'white',
    opacity: 0.9,
  },
  habitProgressSection: {
    marginBottom: 16,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressStats: {
    flexDirection: 'row',
  },
  progressStat: {
    fontSize: 12,
    marginLeft: 12,
  },
  progressBarContainer: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  modernHabitActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  animatedButtonContainer: {
    flex: 1,
    marginRight: 12,
  },
  completeButtonModern: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  completeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  optionsButtonModern: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Modern Add Habit Card
  modernAddHabitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  addHabitIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  addHabitTextContainer: {
    flex: 1,
  },
  addHabitTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  addHabitSubtitle: {
    fontSize: 14,
  },
  // Calendar Styles
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 4,
  },
  calendarNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  calendarTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  weekDaysContainer: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 4,
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    position: 'relative',
  },
  todayDay: {
    backgroundColor: '#4CAF50',
    borderRadius: 20,
  },
  selectedDay: {
    backgroundColor: '#FF6B35',
    borderRadius: 20,
  },
  calendarDayText: {
    fontSize: 16,
    fontWeight: '500',
  },
  todayDayText: {
    color: 'white',
    fontWeight: '700',
  },
  selectedDayText: {
    color: 'white',
    fontWeight: '700',
  },
  habitIndicators: {
    position: 'absolute',
    bottom: 2,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  habitIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 1,
  },
  completionIndicators: {
    position: 'absolute',
    bottom: 2,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  completionDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  completionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 1,
    marginVertical: 1,
  },
  moreCompletionsText: {
    fontSize: 8,
    fontWeight: '600',
    color: '#4CAF50',
    marginLeft: 2,
  },
  perfectDayIndicator: {
    position: 'absolute',
    top: -8,
    right: -2,
  },
  selectedDateHabits: {
    marginTop: 24,
  },
  selectedDateTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  calendarHabitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  calendarHabitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  calendarHabitIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  calendarHabitDetails: {
    flex: 1,
  },
  calendarHabitName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  calendarHabitFrequency: {
    fontSize: 12,
  },
  calendarCompleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completionBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E8F5E8',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  templateCard: {
    padding: 16,
    marginBottom: 12,
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  templateIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  templateMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  templateFrequency: {
    fontSize: 12,
    fontWeight: '600',
    marginRight: 12,
  },
  templateDuration: {
    fontSize: 12,
  },
  templateBenefits: {
    marginBottom: 12,
  },
  benefitsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  benefitItem: {
    fontSize: 12,
    marginLeft: 8,
  },
  templateActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scriptureRef: {
    fontSize: 12,
    fontStyle: 'italic',
    flex: 1,
  },
  useTemplateButton: {
    marginLeft: 12,
  },
  creatorCard: {
    padding: 20,
  },
  creatorTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputSection: {
    marginBottom: 20,
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryButton: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
  frequencyGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  frequencyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  frequencyName: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  createButton: {
    marginTop: 20,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  modalCloseButton: {
    padding: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginRight: 29, // Compensate for close button width
  },
  modalSpacer: {
    width: 29, // Same as close button width for centering
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsModal: {
    width: '80%',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  optionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
});

export default ChristianHabitsScreen;
