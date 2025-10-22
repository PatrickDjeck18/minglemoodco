import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { SupabaseManager } from '../utils/supabase';
import GlassCard from '../components/GlassCard';
import CustomButton from '../components/CustomButton';
// import ConditionalAdBanner from '../components/ConditionalAdBanner';
// import { useInterstitialAd } from '../hooks/useInterstitialAd';

const { width } = Dimensions.get('window');

const PrayerTimerScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  // const { isSubscribed } = useSubscription();
  const isSubscribed = false; // Temporarily set to false
  // const { showInterstitialAd } = useInterstitialAd();
  const showInterstitialAd = () => {}; // Temporarily disabled
  const insets = useSafeAreaInsets();
  
  // Timer states
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [totalTime, setTotalTime] = useState(0); // in seconds
  const [customMinutes, setCustomMinutes] = useState('15');
  const [sessionNotes, setSessionNotes] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  
  // Session history
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  // Timer intervals
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const presetTimes = [
    { label: '5 min', value: 5, icon: 'time-outline' },
    { label: '10 min', value: 10, icon: 'time-outline' },
    { label: '15 min', value: 15, icon: 'time-outline' },
    { label: '30 min', value: 30, icon: 'time-outline' },
    { label: '45 min', value: 45, icon: 'time-outline' },
    { label: '1 hr', value: 60, icon: 'time' },
    { label: '2 hrs', value: 120, icon: 'time' },
    { label: '3 hrs', value: 180, icon: 'time' },
  ];

  useEffect(() => {
    loadPrayerSessions();
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isRunning && !isPaused) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, isPaused]);

  // Pulse animation for running timer
  useEffect(() => {
    if (isRunning && !isPaused) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRunning, isPaused]);

  // Progress animation
  useEffect(() => {
    if (totalTime > 0) {
      const progress = ((totalTime - timeLeft) / totalTime) * 100;
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    }
  }, [timeLeft, totalTime]);

  const loadPrayerSessions = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const sessions = await SupabaseManager.getPrayerSessions(user.id);
      setSessions(sessions);
    } catch (error) {
      console.error('Error loading prayer sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTimer = (minutes: number) => {
    const seconds = minutes * 60;
    setTimeLeft(seconds);
    setTotalTime(seconds);
    setIsRunning(true);
    setIsPaused(false);
    setSessionNotes('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleCustomStart = () => {
    const minutes = parseInt(customMinutes);
    if (isNaN(minutes) || minutes <= 0 || minutes > 300) {
      Alert.alert('Invalid Time', 'Please enter a time between 1 and 300 minutes (5 hours).');
      return;
    }
    handleStartTimer(minutes);
    setShowCustomInput(false);
  };

  const handlePauseResume = () => {
    if (isPaused) {
      setIsPaused(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      setIsPaused(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleStop = () => {
    setIsRunning(false);
    setIsPaused(false);
    setTimeLeft(0);
    setTotalTime(0);
    setSessionNotes('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleTimerComplete = async () => {
    setIsRunning(false);
    setIsPaused(false);
    
    // Save the session
    if (user && totalTime > 0) {
      try {
        await SupabaseManager.savePrayerSession(user.id, {
          duration: totalTime,
          notes: sessionNotes,
          completed_at: new Date().toISOString(),
        });
        await loadPrayerSessions();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Show interstitial ad after successful session completion
        setTimeout(() => {
          showInterstitialAd();
        }, 2000);
      } catch (error) {
        console.error('Error saving prayer session:', error);
        Alert.alert('Error', 'Failed to save prayer session');
      }
    }
    
    setTimeLeft(0);
    setTotalTime(0);
    setSessionNotes('');
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
  };

  const getProgressPercentage = () => {
    if (totalTime === 0) return 0;
    return ((totalTime - timeLeft) / totalTime) * 100;
  };

  const renderTimerDisplay = () => {
    const progress = getProgressPercentage();
    const isTimerActive = isRunning && timeLeft > 0;
    
    return (
      <View style={styles.timerContainer}>
        <Animated.View 
          style={[
            styles.timerCircle,
            { 
              borderColor: isTimerActive ? colors.primary : colors.border,
              backgroundColor: isTimerActive ? colors.primary + '10' : 'transparent',
              transform: [{ scale: pulseAnim }]
            }
          ]}
        >
          <View style={styles.timerInner}>
            <Text style={[
              styles.timerText, 
              { 
                color: isTimerActive ? colors.primary : colors.text,
                fontSize: timeLeft >= 3600 ? 28 : 36
              }
            ]}>
              {formatTime(timeLeft)}
            </Text>
            <Text style={[styles.timerLabel, { color: colors.textSecondary }]}>
              {isRunning ? (isPaused ? 'Paused' : 'Praying') : 'Set Time'}
            </Text>
            {isTimerActive && (
              <Text style={[styles.progressText, { color: colors.primary }]}>
                {Math.round(progress)}% Complete
              </Text>
            )}
          </View>
          
          {/* Modern Progress Ring */}
          <View style={[styles.progressRing, { borderColor: colors.border + '30' }]}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  borderColor: colors.primary,
                  opacity: isTimerActive ? 1 : 0.3,
                  transform: [{
                    rotate: progressAnim.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0deg', '360deg'],
                    })
                  }]
                }
              ]}
            />
          </View>
        </Animated.View>
        
        {/* Time breakdown for longer sessions */}
        {timeLeft >= 3600 && (
          <View style={styles.timeBreakdown}>
            <View style={styles.timeSegment}>
              <Text style={[styles.timeSegmentValue, { color: colors.primary }]}>
                {Math.floor(timeLeft / 3600)}
              </Text>
              <Text style={[styles.timeSegmentLabel, { color: colors.textSecondary }]}>
                Hours
              </Text>
            </View>
            <View style={styles.timeSegment}>
              <Text style={[styles.timeSegmentValue, { color: colors.primary }]}>
                {Math.floor((timeLeft % 3600) / 60)}
              </Text>
              <Text style={[styles.timeSegmentLabel, { color: colors.textSecondary }]}>
                Minutes
              </Text>
            </View>
            <View style={styles.timeSegment}>
              <Text style={[styles.timeSegmentValue, { color: colors.primary }]}>
                {timeLeft % 60}
              </Text>
              <Text style={[styles.timeSegmentLabel, { color: colors.textSecondary }]}>
                Seconds
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderControls = () => {
    if (isRunning) {
      return (
        <View style={styles.controlButtons}>
          <TouchableOpacity
            style={[
              styles.controlButton, 
              styles.primaryControlButton,
              { backgroundColor: colors.primary }
            ]}
            onPress={handlePauseResume}
            activeOpacity={0.8}
          >
            <Ionicons 
              name={isPaused ? "play" : "pause"} 
              size={24} 
              color="#FFFFFF" 
            />
            <Text style={[styles.controlButtonText, { color: '#FFFFFF' }]}>
              {isPaused ? 'Resume' : 'Pause'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.controlButton, 
              styles.secondaryControlButton,
              { backgroundColor: '#FF3B30' }
            ]}
            onPress={handleStop}
            activeOpacity={0.8}
          >
            <Ionicons name="stop" size={24} color="#FFFFFF" />
            <Text style={[styles.controlButtonText, { color: '#FFFFFF' }]}>
              Stop
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.presetContainer}>
        <Text style={[styles.presetTitle, { color: colors.text }]}>
          Quick Start
        </Text>
        <View style={styles.presetGrid}>
          {presetTimes.map((preset) => (
            <TouchableOpacity
              key={preset.value}
              style={[
                styles.presetButton,
                { 
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderWidth: 1
                }
              ]}
              onPress={() => handleStartTimer(preset.value)}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={preset.icon as any} 
                size={20} 
                color={colors.primary} 
                style={styles.presetIcon}
              />
              <Text style={[styles.presetText, { color: colors.text }]}>
                {preset.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <TouchableOpacity
          style={[styles.customButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowCustomInput(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="time" size={20} color="#FFFFFF" />
          <Text style={styles.customButtonText}>Custom Time</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderSessionHistory = () => {
    if (sessions.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No Prayer Sessions Yet
          </Text>
          <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
            Start your first prayer session to begin tracking your spiritual journey.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.historyContainer}>
        <Text style={[styles.historyTitle, { color: colors.text }]}>
          Recent Sessions
        </Text>
        {sessions.slice(0, 5).map((session) => (
          <GlassCard key={session.id} style={styles.sessionCard}>
            <View style={styles.sessionHeader}>
              <View style={styles.sessionInfo}>
                <Text style={[styles.sessionDuration, { color: colors.primary }]}>
                  {formatTime(session.duration)}
                </Text>
                <Text style={[styles.sessionDate, { color: colors.textSecondary }]}>
                  {format(new Date(session.completed_at), 'MMM d, h:mm a')}
                </Text>
              </View>
              <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
            </View>
            {session.notes && (
              <Text style={[styles.sessionNotes, { color: colors.text }]}>
                "{session.notes}"
              </Text>
            )}
          </GlassCard>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.primary + '08', 'transparent']}
        style={styles.headerGradient}
      >
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: colors.card }]}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={20} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={[styles.title, { color: colors.text }]}>Prayer Timer</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Set your prayer time and track your sessions
              </Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Timer Display */}
        {renderTimerDisplay()}

        {/* Controls */}
        {renderControls()}

        {/* Notes Input (when timer is running) */}
        {isRunning && (
          <View style={styles.notesContainer}>
            <Text style={[styles.notesLabel, { color: colors.text }]}>
              Prayer Notes (Optional)
            </Text>
            <TextInput
              style={[
                styles.notesInput,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.text,
                }
              ]}
              value={sessionNotes}
              onChangeText={setSessionNotes}
              placeholder="Add notes about your prayer time..."
              placeholderTextColor={colors.textSecondary}
              multiline
              textAlignVertical="top"
            />
          </View>
        )}

        {/* Session History */}
        {!isRunning && renderSessionHistory()}
      </ScrollView>

      {/* Custom Time Modal */}
      {showCustomInput && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Set Custom Time
            </Text>
            <TextInput
              style={[
                styles.customInput,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                }
              ]}
              value={customMinutes}
              onChangeText={setCustomMinutes}
              placeholder="Enter minutes (1-300)"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.border }]}
                onPress={() => setShowCustomInput(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleCustomStart}
              >
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                  Start
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      
      {/* Banner Ad - only show if not subscribed */}
      {/* <ConditionalAdBanner position="bottom" showAboveTabBar={true} /> */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 12,
  },
  headerSpacer: {
    width: 44,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '400',
    textAlign: 'center',
    opacity: 0.7,
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  timerContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  timerCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  timerInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 36,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 1,
  },
  timerLabel: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  progressText: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '600',
  },
  timeBreakdown: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    gap: 20,
  },
  timeSegment: {
    alignItems: 'center',
    minWidth: 60,
  },
  timeSegmentValue: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  timeSegmentLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500',
    opacity: 0.8,
  },
  progressRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 8,
    borderColor: 'transparent',
  },
  progressFill: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 8,
    borderColor: 'transparent',
    borderTopColor: 'currentColor',
    borderRightColor: 'currentColor',
  },
  controlButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginVertical: 30,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryControlButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  secondaryControlButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  controlButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  presetContainer: {
    marginVertical: 20,
  },
  presetTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  presetButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    minWidth: 80,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  presetIcon: {
    marginBottom: 4,
  },
  presetText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  customButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  customButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  notesContainer: {
    marginVertical: 20,
  },
  notesLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 80,
  },
  historyContainer: {
    marginTop: 40,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  sessionCard: {
    padding: 16,
    marginBottom: 12,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionDuration: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  sessionDate: {
    fontSize: 14,
  },
  sessionNotes: {
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 8,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 40,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContainer: {
    width: width * 0.8,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  customInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PrayerTimerScreen;