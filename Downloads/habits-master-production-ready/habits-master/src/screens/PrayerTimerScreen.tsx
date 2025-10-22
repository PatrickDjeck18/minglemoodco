import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Animated,
  Dimensions,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { FirebaseManager } from '../utils/firebase';
import GlassCard from '../components/GlassCard';
import CustomButton from '../components/CustomButton';
import ProgressRing from '../components/ProgressRing';

const { width } = Dimensions.get('window');

const PrayerTimerScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(15); // minutes
  const [prayerTopic, setPrayerTopic] = useState('Gratitude and Thanksgiving');

  // Custom time state
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('15');
  const [customSeconds, setCustomSeconds] = useState('0');
  const [customTimeError, setCustomTimeError] = useState('');
  
  // Audio state
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [selectedAudio, setSelectedAudio] = useState('peaceful-piano');
  
  // Animation refs
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  
  // Timer ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const audioOptions = [
    { id: 'peaceful-piano', name: 'Peaceful Piano', icon: '🎹' },
    { id: 'nature-sounds', name: 'Nature Sounds', icon: '🌿' },
    { id: 'white-noise', name: 'White Noise', icon: '🌊' },
    { id: 'silent', name: 'Silent', icon: '🔇' },
  ];

  const timePresets = [5, 10, 15, 30];

  const prayerPrompts = [
    'Gratitude and Thanksgiving',
    'Prayer for Family and Friends',
    'Seeking Guidance and Wisdom',
    'Prayer for Peace and Healing',
    'Confession and Repentance',
    'Prayer for the World',
  ];

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
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
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  useEffect(() => {
    // Start pulse animation when timer is running
    if (isRunning) {
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
  }, [isRunning]);

  const handleStartPause = async () => {
    if (timeLeft === 0) {
      setTimeLeft(getCurrentDuration());
    }

    setIsRunning(!isRunning);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!isRunning && isAudioEnabled && selectedAudio !== 'silent') {
      await playBackgroundAudio();
    } else if (isRunning) {
      await stopBackgroundAudio();
    }
  };

  const handleReset = async () => {
    setIsRunning(false);
    setTimeLeft(getCurrentDuration());
    await stopBackgroundAudio();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleTimerComplete = async () => {
    setIsRunning(false);
    await stopBackgroundAudio();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Save prayer session to Firebase
    if (user) {
      try {
        await FirebaseManager.savePrayerSession(user.uid, {
          duration: getCurrentDuration(),
          topic: prayerTopic,
          audioEnabled: isAudioEnabled,
          selectedAudio: selectedAudio,
          completedAt: new Date(),
        });
        console.log('Prayer session saved to Firebase');
      } catch (error) {
        console.error('Error saving prayer session:', error);
      }
    }
    
    // Show completion animation
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const playBackgroundAudio = async () => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }
      
      if (selectedAudio === 'silent') return;
      
      // In a real app, you would load actual audio files
      // For now, we'll simulate with a placeholder
      // Note: This will fail with the example URL, but won't crash the app
      try {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: 'https://example.com/audio.mp3' }, // Replace with actual audio file
          { shouldPlay: true, isLooping: true, volume }
        );
        setSound(newSound);
      } catch (audioError) {
        console.log('Audio not available, continuing without background audio');
        // Don't set sound if audio fails to load
      }
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const stopBackgroundAudio = async () => {
    try {
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
      }
    } catch (error) {
      console.error('Error stopping audio:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const validateCustomTime = (minutes: string, seconds: string) => {
    const mins = parseInt(minutes) || 0;
    const secs = parseInt(seconds) || 0;

    if (mins < 0 || secs < 0) {
      return 'Time values cannot be negative';
    }

    if (secs >= 60) {
      return 'Seconds must be less than 60';
    }

    const totalSeconds = mins * 60 + secs;
    if (totalSeconds === 0) {
      return 'Please enter a time greater than 0';
    }

    if (totalSeconds > 10800) { // Max 3 hours
      return 'Maximum time allowed is 3 hours';
    }

    return '';
  };

  const getCurrentDuration = () => {
    if (isCustomMode) {
      const mins = parseInt(customMinutes) || 0;
      const secs = parseInt(customSeconds) || 0;
      return mins * 60 + secs;
    }
    return selectedDuration * 60;
  };

  const handleCustomTimeApply = () => {
    const error = validateCustomTime(customMinutes, customSeconds);
    if (error) {
      setCustomTimeError(error);
      return;
    }

    setCustomTimeError('');
    const totalSeconds = getCurrentDuration();
    setTimeLeft(totalSeconds);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const progress = timeLeft > 0 ? (getCurrentDuration() - timeLeft) / getCurrentDuration() : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={isDark ? ['#1E1E2E', '#2D3748'] : ['#F7F8FC', '#E2E8F0']}
        style={styles.gradientBackground}
      >
        <ScrollView 
          style={[styles.content, { paddingTop: insets.top + 20 }]}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Prayer Timer</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Focused time with God
            </Text>
          </View>

          {/* Main Timer Display */}
          <View style={styles.timerContainer}>
            <Animated.View
              style={[
                styles.timerWrapper,
                {
                  transform: [{ scale: pulseAnim }],
                  opacity: fadeAnim,
                },
              ]}
            >
              <ProgressRing
                progress={progress}
                size={280}
                strokeWidth={8}
                color={colors.primary}
                backgroundColor={colors.border}
                animated={true}
              />
              <View style={styles.timerTextContainer}>
                <Text style={[styles.timerText, { color: colors.text }]}>
                  {formatTime(timeLeft)}
                </Text>
                <Text style={[styles.timerLabel, { color: colors.textSecondary }]}>
                  {isRunning ? 'Praying...' : 'Ready to begin'}
                </Text>
              </View>
            </Animated.View>
          </View>

          {/* Prayer Topic */}
          <GlassCard style={styles.topicCard}>
            <Text style={[styles.topicLabel, { color: colors.textSecondary }]}>
              Prayer Focus
            </Text>
            <Text style={[styles.topicText, { color: colors.text }]}>
              {prayerTopic}
            </Text>
          </GlassCard>

          {/* Controls */}
          <View style={styles.controlsContainer}>
            {/* Time Presets */}
            <View style={styles.presetsContainer}>
              <Text style={[styles.controlsLabel, { color: colors.textSecondary }]}>
                Duration
              </Text>
              <View style={styles.presets}>
                {timePresets.map((preset) => (
                  <TouchableOpacity
                    key={preset}
                    style={[
                      styles.presetButton,
                      {
                        backgroundColor: selectedDuration === preset ? colors.primary : colors.card,
                        borderColor: selectedDuration === preset ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => {
                      setSelectedDuration(preset);
                      if (isCustomMode) {
                        setIsCustomMode(false);
                        setCustomTimeError('');
                      }
                      setTimeLeft(preset * 60);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Text
                      style={[
                        styles.presetText,
                        {
                          color: selectedDuration === preset ? '#FFFFFF' : colors.text,
                        },
                      ]}
                    >
                      {preset}m
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Custom Time Input */}
            <GlassCard style={styles.customTimeCard}>
              <View style={styles.customTimeHeader}>
                <Text style={[styles.controlsLabel, { color: colors.textSecondary }]}>
                  Custom Time
                </Text>
                <TouchableOpacity
                  style={[
                    styles.modeToggle,
                    { backgroundColor: isCustomMode ? colors.primary : colors.border },
                  ]}
                  onPress={() => {
                    setIsCustomMode(!isCustomMode);
                    setCustomTimeError('');
                    if (!isCustomMode) {
                      // When switching to custom mode, set current time as default
                      const currentMins = Math.floor(getCurrentDuration() / 60);
                      const currentSecs = getCurrentDuration() % 60;
                      setCustomMinutes(currentMins.toString());
                      setCustomSeconds(currentSecs.toString());
                    }
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Text style={styles.modeToggleText}>
                    {isCustomMode ? 'CUSTOM' : 'PRESET'}
                  </Text>
                </TouchableOpacity>
              </View>

              {isCustomMode && (
                <View style={styles.customTimeInput}>
                  <View style={styles.timeInputContainer}>
                    <View style={styles.timeInputGroup}>
                      <Text style={[styles.timeInputLabel, { color: colors.textSecondary }]}>
                        Minutes
                      </Text>
                      <TextInput
                        style={[
                          styles.timeInput,
                          {
                            backgroundColor: colors.card,
                            color: colors.text,
                            borderColor: colors.border,
                          },
                        ]}
                        value={customMinutes}
                        onChangeText={(text) => {
                          setCustomMinutes(text.replace(/[^0-9]/g, ''));
                          setCustomTimeError('');
                        }}
                        placeholder="0"
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="numeric"
                        maxLength={2}
                      />
                    </View>

                    <Text style={[styles.timeSeparator, { color: colors.textSecondary }]}>:</Text>

                    <View style={styles.timeInputGroup}>
                      <Text style={[styles.timeInputLabel, { color: colors.textSecondary }]}>
                        Seconds
                      </Text>
                      <TextInput
                        style={[
                          styles.timeInput,
                          {
                            backgroundColor: colors.card,
                            color: colors.text,
                            borderColor: colors.border,
                          },
                        ]}
                        value={customSeconds}
                        onChangeText={(text) => {
                          setCustomSeconds(text.replace(/[^0-9]/g, ''));
                          setCustomTimeError('');
                        }}
                        placeholder="0"
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="numeric"
                        maxLength={2}
                      />
                    </View>
                  </View>

                  {customTimeError ? (
                    <Text style={[styles.errorText, { color: '#FF6B6B' }]}>
                      {customTimeError}
                    </Text>
                  ) : null}

                  <TouchableOpacity
                    style={[
                      styles.applyButton,
                      {
                        backgroundColor: colors.primary,
                        opacity: customTimeError ? 0.5 : 1,
                      },
                    ]}
                    onPress={handleCustomTimeApply}
                    disabled={!!customTimeError}
                  >
                    <Text style={[styles.applyButtonText, { color: '#FFFFFF' }]}>
                      Apply Custom Time
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </GlassCard>

            {/* Main Control Buttons */}
            <View style={styles.mainControls}>
              <CustomButton
                title="Reset"
                onPress={handleReset}
                variant="outline"
                size="medium"
                style={styles.resetButton}
              />
              <CustomButton
                title={isRunning ? 'Pause' : timeLeft === 0 ? 'Start' : 'Resume'}
                onPress={handleStartPause}
                size="large"
                style={styles.startButton}
              />
            </View>

            {/* Audio Controls */}
            <GlassCard style={styles.audioCard}>
              <View style={styles.audioHeader}>
                <Text style={[styles.audioLabel, { color: colors.textSecondary }]}>
                  Background Audio
                </Text>
                <TouchableOpacity
                  style={[
                    styles.audioToggle,
                    { backgroundColor: isAudioEnabled ? colors.primary : colors.border },
                  ]}
                  onPress={() => {
                    setIsAudioEnabled(!isAudioEnabled);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Text style={styles.audioToggleText}>
                    {isAudioEnabled ? 'ON' : 'OFF'}
                  </Text>
                </TouchableOpacity>
              </View>

              {isAudioEnabled && (
                <View style={styles.audioOptions}>
                  {audioOptions.map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.audioOption,
                        {
                          backgroundColor: selectedAudio === option.id ? colors.primary + '20' : 'transparent',
                        },
                      ]}
                      onPress={() => {
                        setSelectedAudio(option.id);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                    >
                      <Text style={styles.audioOptionIcon}>{option.icon}</Text>
                      <Text style={[styles.audioOptionText, { color: colors.text }]}>
                        {option.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </GlassCard>

            {/* Prayer Prompts */}
            <GlassCard style={styles.promptsCard}>
              <Text style={[styles.promptsLabel, { color: colors.textSecondary }]}>
                Prayer Prompts
              </Text>
              <View style={styles.prompts}>
                {prayerPrompts.map((prompt, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.promptButton,
                      {
                        backgroundColor: prayerTopic === prompt ? colors.primary + '20' : 'transparent',
                      },
                    ]}
                    onPress={() => {
                      setPrayerTopic(prompt);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Text style={[styles.promptText, { color: colors.text }]}>
                      {prompt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </GlassCard>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 100, // Extra padding for tab bar
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
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
  timerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  timerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 48,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  timerLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 8,
  },
  topicCard: {
    padding: 16,
    marginBottom: 30,
    alignItems: 'center',
  },
  topicLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  topicText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  controlsContainer: {
    // Removed flex: 1 to allow proper scrolling
  },
  presetsContainer: {
    marginBottom: 24,
  },
  controlsLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  presets: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  presetButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 60,
    alignItems: 'center',
  },
  presetText: {
    fontSize: 16,
    fontWeight: '600',
  },
  mainControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 24,
  },
  resetButton: {
    flex: 0.4,
  },
  startButton: {
    flex: 0.5,
  },
  audioCard: {
    padding: 16,
    marginBottom: 16,
  },
  audioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  audioLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  audioToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  audioToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  audioOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  audioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
    width: '48%',
  },
  audioOptionIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  audioOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  promptsCard: {
    padding: 16,
  },
  promptsLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  prompts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  promptButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  promptText: {
    fontSize: 14,
    fontWeight: '500',
  },
  customTimeCard: {
    padding: 16,
    marginBottom: 16,
  },
  customTimeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modeToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  modeToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  customTimeInput: {
    // Container for custom time inputs
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginBottom: 12,
  },
  timeInputGroup: {
    alignItems: 'center',
    flex: 1,
  },
  timeInputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  timeInput: {
    width: 60,
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
  timeSeparator: {
    fontSize: 24,
    fontWeight: '600',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 12,
  },
  applyButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PrayerTimerScreen;
