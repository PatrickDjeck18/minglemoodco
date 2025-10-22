import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

interface BibleReadingTimerProps {
  onTimerUpdate: (timeSpent: number) => void;
  onSessionComplete: (sessionData: ReadingSession) => void;
  initialTime?: number;
  isActive?: boolean;
  goalMinutes?: number;
  showGoalSetting?: boolean;
}

export interface ReadingSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in minutes
  chapter?: string;
  verses?: string;
  notes?: string;
  completed: boolean;
}

const BibleReadingTimer: React.FC<BibleReadingTimerProps> = ({
  onTimerUpdate,
  onSessionComplete,
  initialTime = 0,
  isActive = false,
  goalMinutes = 30,
  showGoalSetting = true,
}) => {
  const { colors } = useTheme();
  const [timeSpent, setTimeSpent] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(isActive);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [currentChapter, setCurrentChapter] = useState('');
  const [currentVerses, setCurrentVerses] = useState('');
  const [notes, setNotes] = useState('');
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeSpent(prev => {
          const newTime = prev + 1;
          onTimerUpdate(newTime);
          return newTime;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, onTimerUpdate]);

  useEffect(() => {
    if (isRunning) {
      // Pulse animation for active timer
      Animated.loop(
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
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRunning, pulseAnim]);

  const handleStart = () => {
    setIsRunning(true);
    setSessionStartTime(new Date());
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handlePause = () => {
    setIsRunning(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleStop = () => {
    setIsRunning(false);
    if (sessionStartTime) {
      const sessionData: ReadingSession = {
        id: Date.now().toString(),
        startTime: sessionStartTime,
        endTime: new Date(),
        duration: Math.floor(timeSpent / 60), // Convert to minutes
        chapter: currentChapter,
        verses: currentVerses,
        notes: notes,
        completed: true,
      };
      onSessionComplete(sessionData);
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeSpent(0);
    setSessionStartTime(null);
    setCurrentChapter('');
    setCurrentVerses('');
    setNotes('');
    onTimerUpdate(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = (): number => {
    // Calculate progress based on time spent
    const currentMinutes = timeSpent / 60;
    return Math.min((currentMinutes / goalMinutes) * 100, 100);
  };

  const getTimeOfDay = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    return 'Evening';
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.timerCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.timerHeader}>
          <Ionicons name="book" size={24} color="#FFFFFF" />
          <Text style={styles.timerTitle}>Bible Reading Timer</Text>
          <View style={styles.timeOfDayBadge}>
            <Text style={styles.timeOfDayText}>{getTimeOfDay()}</Text>
          </View>
        </View>

        <Animated.View
          style={[
            styles.timerDisplay,
            { transform: [{ scale: pulseAnim }] }
          ]}
        >
          <Text style={styles.timerText}>{formatTime(timeSpent)}</Text>
          <Text style={styles.timerLabel}>
            {isRunning ? 'Reading in Progress' : 'Timer Stopped'}
          </Text>
          {showGoalSetting && (
            <Text style={styles.goalText}>
              Goal: {goalMinutes} minutes
            </Text>
          )}
        </Animated.View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${getProgressPercentage()}%` }
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round(getProgressPercentage())}% of daily goal
          </Text>
        </View>

        <View style={styles.controls}>
          {!isRunning ? (
            <TouchableOpacity
              style={[styles.controlButton, styles.startButton]}
              onPress={handleStart}
            >
              <Ionicons name="play" size={24} color="#FFFFFF" />
              <Text style={styles.controlButtonText}>Start Reading</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.activeControls}>
              <TouchableOpacity
                style={[styles.controlButton, styles.pauseButton]}
                onPress={handlePause}
              >
                <Ionicons name="pause" size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.controlButton, styles.stopButton]}
                onPress={handleStop}
              >
                <Ionicons name="stop" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}
          
          <TouchableOpacity
            style={[styles.controlButton, styles.resetButton]}
            onPress={handleReset}
          >
            <Ionicons name="refresh" size={20} color={colors.primary} />
            <Text style={[styles.controlButtonText, { color: colors.primary }]}>
              Reset
            </Text>
          </TouchableOpacity>
        </View>

        {/* Reading Details */}
        <View style={styles.detailsContainer}>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Chapter:</Text>
            <Text style={styles.inputValue}>{currentChapter || 'Not specified'}</Text>
          </View>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Verses:</Text>
            <Text style={styles.inputValue}>{currentVerses || 'Not specified'}</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginVertical: 10,
  },
  timerCard: {
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  timerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  timerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  timerDisplay: {
    alignItems: 'center',
    marginBottom: 20,
  },
  timerText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  timerLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 8,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  activeControls: {
    flexDirection: 'row',
    gap: 12,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 100,
    justifyContent: 'center',
  },
  startButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  pauseButton: {
    backgroundColor: 'rgba(255,193,7,0.8)',
  },
  stopButton: {
    backgroundColor: 'rgba(220,53,69,0.8)',
  },
  resetButton: {
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  controlButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  detailsContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  inputValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  timeOfDayBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timeOfDayText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  goalText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
});

export default BibleReadingTimer;
