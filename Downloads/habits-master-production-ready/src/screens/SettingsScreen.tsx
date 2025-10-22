import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  Alert,
  Image,
  ActivityIndicator,
  TextInput,
  Modal,
  Platform,
  AccessibilityInfo,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { SupabaseManager as FirebaseManager } from '../utils/supabase';
import GlassCard from '../components/GlassCard';
import CustomButton from '../components/CustomButton';

interface SettingsData {
  notificationsEnabled: boolean;
  dailyReminderTime: string;
  fontSize: string;
  language: string;
  prayerReminders: boolean;
  readingReminders: boolean;
  devotionReminders: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  // Spiritual Goals
  dailyPrayerGoal: number; // minutes
  readingStreakGoal: number; // days
  memoryVersesPerWeek: number;
}

const SettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, isDark, theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  
  // State management
  const [settings, setSettings] = useState<SettingsData>({
    notificationsEnabled: true,
    dailyReminderTime: '08:00',
    fontSize: 'medium',
    language: 'English',
    prayerReminders: true,
    readingReminders: true,
    devotionReminders: true,
    soundEnabled: true,
    vibrationEnabled: true,
    // Spiritual Goals
    dailyPrayerGoal: 15,
    readingStreakGoal: 30,
    memoryVersesPerWeek: 3,
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempTime, setTempTime] = useState('08:00');
  const [showTranslationPicker, setShowTranslationPicker] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [showFontSizePicker, setShowFontSizePicker] = useState(false);
  const [showSpiritualGoalsPicker, setShowSpiritualGoalsPicker] = useState(false);
  const [currentGoalType, setCurrentGoalType] = useState<string>('');
  const [tempGoalValue, setTempGoalValue] = useState<number>(0);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [showNotificationHistory, setShowNotificationHistory] = useState(false);
  const [notificationHistory, setNotificationHistory] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);

  const userProfile = {
    name: user?.user_metadata?.full_name || user?.email || 'User',
    email: user?.email || 'user@example.com',
    avatar: null, // In a real app, this would be a user's profile image
  };

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
    loadNotificationData();
  }, []);

  const loadNotificationData = async () => {
    if (user) {
      try {
        // Load notification history
        const history = await FirebaseManager.getNotificationHistory(user.id, 10);
        setNotificationHistory(history);
        
        // Try to load reminders, but don't fail if the table doesn't exist
        try {
          const userReminders = await FirebaseManager.getUserReminders(user.id);
          setReminders(userReminders);
        } catch (reminderError) {
          setReminders([]); // Set empty array as fallback
        }
      } catch (error) {
        // Set empty arrays as fallback
        setNotificationHistory([]);
        setReminders([]);
      }
    }
  };


  const loadSettings = async () => {
    try {
      setLoading(true);
      const savedSettings = await AsyncStorage.getItem('user_settings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsedSettings }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load settings. Using defaults.');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: Partial<SettingsData>) => {
    try {
      setSaving(true);
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      
      await AsyncStorage.setItem('user_settings', JSON.stringify(updatedSettings));
      
      // Sync with Firebase if user is authenticated
      if (user) {
        await FirebaseManager.syncUserData(user.id, { settings: updatedSettings });
        
        // Save notification settings separately for better tracking
        if (newSettings.notificationsEnabled !== undefined || 
            newSettings.dailyReminderTime || 
            newSettings.prayerReminders !== undefined ||
            newSettings.readingReminders !== undefined ||
            newSettings.devotionReminders !== undefined) {
          await FirebaseManager.saveNotificationSettings(user.id, {
            notificationsEnabled: updatedSettings.notificationsEnabled,
            dailyReminderTime: updatedSettings.dailyReminderTime,
            prayerReminders: updatedSettings.prayerReminders,
            readingReminders: updatedSettings.readingReminders,
            devotionReminders: updatedSettings.devotionReminders,
            soundEnabled: updatedSettings.soundEnabled,
            vibrationEnabled: updatedSettings.vibrationEnabled,
            lastUpdated: new Date().toISOString()
          });
        }
      }
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Show success feedback for important settings
      if (newSettings.fontSize || newSettings.language) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const translations = [
    { id: 'NIV', name: 'New International Version' },
    { id: 'ESV', name: 'English Standard Version' },
    { id: 'KJV', name: 'King James Version' },
    { id: 'NLT', name: 'New Living Translation' },
  ];

  const languages = [
    { id: 'English', name: 'English' },
    { id: 'Spanish', name: 'Español' },
    { id: 'French', name: 'Français' },
    { id: 'Portuguese', name: 'Português' },
    { id: 'German', name: 'Deutsch' },
    { id: 'Italian', name: 'Italiano' },
    { id: 'Chinese', name: '中文' },
    { id: 'Korean', name: '한국어' },
  ];

  const fontSizes = [
    { id: 'small', name: 'Small', size: 14 },
    { id: 'medium', name: 'Medium', size: 16 },
    { id: 'large', name: 'Large', size: 18 },
    { id: 'extra-large', name: 'Extra Large', size: 20 },
  ];



  const handleThemeChange = (newTheme: 'light' | 'dark' | 'auto') => {
    setTheme(newTheme);
    saveSettings({});
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleExportData = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Show loading alert
      Alert.alert(
        'Export Data',
        'Your data will be exported as a JSON file. This may take a few moments.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Export', 
            onPress: async () => {
              try {
                setSaving(true);
                
                // Collect all user data
                const userData = {
                  settings,
                  userProfile,
                  exportDate: new Date().toISOString(),
                  version: '1.0.0'
                };
                
                // Create file
                const fileName = `faithhabits_backup_${new Date().toISOString().split('T')[0]}.json`;
                const fileUri = FileSystem.documentDirectory + fileName;
                
                await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(userData, null, 2));
                
                // Share the file
                if (await Sharing.isAvailableAsync()) {
                  await Sharing.shareAsync(fileUri);
                } else {
                  Alert.alert('Success', 'Data exported successfully!');
                }
                
              } catch (error) {
                Alert.alert('Error', 'Failed to export data. Please try again.');
              } finally {
                setSaving(false);
              }
            }
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to export data. Please try again.');
    }
  };

  const handleSignOut = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      await signOut();
      
      // Fallback: Force navigation after a short delay if auth state doesn't change
      setTimeout(() => {
        if (user) {
          signOut();
        }
      }, 1000);
      
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
    
    // Uncomment below and comment above for confirmation dialog
    /*
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          }
        },
      ]
    );
    */
  };

  const handleNotificationToggle = async (type: keyof SettingsData, value: boolean) => {
    try {
      await saveSettings({ [type]: value });
      
      if (type === 'notificationsEnabled') {
        if (value) {
          const { status } = await Notifications.requestPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert(
              'Permission Required',
              'Please enable notifications in your device settings to receive reminders.',
              [{ text: 'OK' }]
            );
            await saveSettings({ [type]: false });
          }
        } else {
          // Cancel all scheduled notifications
          await Notifications.cancelAllScheduledNotificationsAsync();
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update notification setting.');
    }
  };

  const handleTimeChange = async (newTime: string) => {
    try {
      await saveSettings({ dailyReminderTime: newTime });
      setShowTimePicker(false);
      
      // Reschedule notifications with new time
      if (settings.notificationsEnabled) {
        await scheduleDailyReminder(newTime);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update reminder time.');
    }
  };

  const scheduleDailyReminder = async (time: string) => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      
      const [hours, minutes] = time.split(':').map(Number);
      const trigger = {
        hour: hours,
        minute: minutes,
        repeats: true,
      } as any;
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Daily Faith Reminder',
          body: 'Time for your daily prayer and devotion!',
          sound: settings.soundEnabled,
        },
        trigger,
      });
    } catch (error) {
    }
  };



  const renderAccountSection = () => (
    <GlassCard style={styles.sectionCard}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>
      
      <View style={styles.profileRow}>
        <View style={[styles.avatarContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>
            {userProfile.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={[styles.profileName, { color: colors.text }]}>
            {userProfile.name}
          </Text>
          <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
            {userProfile.email}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.editButton, { backgroundColor: colors.card }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            Alert.alert('Edit Profile', 'Profile editing will be available in a future update.');
          }}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.settingRow}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          Alert.alert('Backup & Sync', 'Cloud backup is automatically enabled when you sign in.');
        }}
      >
        <Text style={[styles.settingLabel, { color: colors.text }]}>
          Backup & Sync
        </Text>
        <View style={styles.settingRight}>
          <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
            {user ? 'Enabled' : 'Disabled'}
          </Text>
          <Text style={styles.settingChevron}>›</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.settingRow}
        onPress={handleExportData}
        disabled={saving}
      >
        <Text style={[styles.settingLabel, { color: colors.text }]}>
          Export Data
        </Text>
        <View style={styles.settingRight}>
          {saving && <ActivityIndicator size="small" color={colors.primary} />}
          <Text style={styles.settingChevron}>›</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.settingRow}
        onPress={handleSignOut}
        activeOpacity={0.7}
      >
        <Text style={[styles.settingLabel, { color: '#FF6B6B' }]}>
          Sign Out
        </Text>
        <Text style={[styles.settingChevron, { color: '#FF6B6B' }]}>›</Text>
      </TouchableOpacity>
    </GlassCard>
  );

  const renderPreferencesSection = () => (
    <GlassCard style={styles.sectionCard}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Preferences</Text>
      
      {/* Notifications */}
      <View style={styles.settingRow}>
        <Text style={[styles.settingLabel, { color: colors.text }]}>
          Notifications
        </Text>
        <Switch
          value={settings.notificationsEnabled}
          onValueChange={(value) => handleNotificationToggle('notificationsEnabled', value)}
          trackColor={{ false: colors.border, true: colors.primary + '40' }}
          thumbColor={settings.notificationsEnabled ? colors.primary : colors.textSecondary}
        />
      </View>

      {/* Daily Reminder Time */}
      {settings.notificationsEnabled && (
        <TouchableOpacity
          style={styles.settingRow}
          onPress={() => {
            setTempTime(settings.dailyReminderTime);
            setShowTimePicker(true);
          }}
        >
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            Daily Reminder
          </Text>
          <View style={styles.settingRight}>
            <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
              {settings.dailyReminderTime}
            </Text>
            <Text style={styles.settingChevron}>›</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Prayer Reminders */}
      {settings.notificationsEnabled && (
        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            Prayer Reminders
          </Text>
          <Switch
            value={settings.prayerReminders}
            onValueChange={(value) => handleNotificationToggle('prayerReminders', value)}
            trackColor={{ false: colors.border, true: colors.primary + '40' }}
            thumbColor={settings.prayerReminders ? colors.primary : colors.textSecondary}
          />
        </View>
      )}

      {/* Reading Reminders */}
      {settings.notificationsEnabled && (
        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            Reading Reminders
          </Text>
          <Switch
            value={settings.readingReminders}
            onValueChange={(value) => handleNotificationToggle('readingReminders', value)}
            trackColor={{ false: colors.border, true: colors.primary + '40' }}
            thumbColor={settings.readingReminders ? colors.primary : colors.textSecondary}
          />
        </View>
      )}

      {/* Devotion Reminders */}
      {settings.notificationsEnabled && (
        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            Devotion Reminders
          </Text>
          <Switch
            value={settings.devotionReminders}
            onValueChange={(value) => handleNotificationToggle('devotionReminders', value)}
            trackColor={{ false: colors.border, true: colors.primary + '40' }}
            thumbColor={settings.devotionReminders ? colors.primary : colors.textSecondary}
          />
        </View>
      )}

      {/* Sound */}
      <View style={styles.settingRow}>
        <Text style={[styles.settingLabel, { color: colors.text }]}>
          Sound
        </Text>
        <Switch
          value={settings.soundEnabled}
          onValueChange={(value) => saveSettings({ soundEnabled: value })}
          trackColor={{ false: colors.border, true: colors.primary + '40' }}
          thumbColor={settings.soundEnabled ? colors.primary : colors.textSecondary}
        />
      </View>

      {/* Vibration */}
      <View style={styles.settingRow}>
        <Text style={[styles.settingLabel, { color: colors.text }]}>
          Vibration
        </Text>
        <Switch
          value={settings.vibrationEnabled}
          onValueChange={(value) => saveSettings({ vibrationEnabled: value })}
          trackColor={{ false: colors.border, true: colors.primary + '40' }}
          thumbColor={settings.vibrationEnabled ? colors.primary : colors.textSecondary}
        />
      </View>
      


      <View style={styles.settingRow}>
        <Text style={[styles.settingLabel, { color: colors.text }]}>
          Theme
        </Text>
        <View style={styles.themeOptions}>
          {[
            { id: 'light', label: 'Light' },
            { id: 'dark', label: 'Dark' },
            { id: 'auto', label: 'Auto' },
          ].map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.themeOption,
                {
                  backgroundColor: theme === option.id ? colors.primary : colors.card,
                  borderColor: theme === option.id ? colors.primary : colors.border,
                },
              ]}
              onPress={() => handleThemeChange(option.id as 'light' | 'dark' | 'auto')}
            >
              <Text
                style={[
                  styles.themeOptionText,
                  {
                    color: theme === option.id ? '#FFFFFF' : colors.text,
                  },
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.settingRow}>
        <Text style={[styles.settingLabel, { color: colors.text }]}>
          Font Size
        </Text>
        <TouchableOpacity
          style={styles.settingValue}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowFontSizePicker(true);
          }}
        >
          <Text style={[styles.settingValueText, { color: colors.primary }]}>
            {fontSizes.find(f => f.id === settings.fontSize)?.name || 'Medium'}
          </Text>
          <Text style={styles.settingChevron}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.settingRow}>
        <Text style={[styles.settingLabel, { color: colors.text }]}>
          Language
        </Text>
        <TouchableOpacity
          style={styles.settingValue}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowLanguagePicker(true);
          }}
        >
          <Text style={[styles.settingValueText, { color: colors.primary }]}>
            {languages.find(l => l.id === settings.language)?.name || 'English'}
          </Text>
          <Text style={styles.settingChevron}>›</Text>
        </TouchableOpacity>
      </View>
    </GlassCard>
  );


  const renderNotificationSection = () => (
    <GlassCard style={styles.sectionCard}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Notifications & Reminders</Text>
      
      <TouchableOpacity
        style={styles.settingRow}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setShowNotificationHistory(true);
        }}
      >
        <Text style={[styles.settingLabel, { color: colors.text }]}>
          Notification History
        </Text>
        <View style={styles.settingRight}>
          <Text style={[styles.settingValueText, { color: colors.textSecondary }]}>
            {notificationHistory.length} recent
          </Text>
          <Text style={styles.settingChevron}>›</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.settingRow}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          // Navigate to reminders management
          Alert.alert('Reminders', 'Reminder management will be available in a future update.');
        }}
      >
        <Text style={[styles.settingLabel, { color: colors.text }]}>
          Manage Reminders
        </Text>
        <View style={styles.settingRight}>
          <Text style={[styles.settingValueText, { color: colors.textSecondary }]}>
            {reminders.length} active
          </Text>
          <Text style={styles.settingChevron}>›</Text>
        </View>
      </TouchableOpacity>


    </GlassCard>
  );


  const renderSpiritualGoalsSection = () => (
    <GlassCard style={styles.sectionCard}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Spiritual Goals</Text>
      
      <View style={styles.goalRow}>
        <Text style={[styles.goalLabel, { color: colors.text }]}>
          Daily Prayer Goal
        </Text>
        <TouchableOpacity
          style={styles.goalValue}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setCurrentGoalType('prayer');
            setTempGoalValue(settings.dailyPrayerGoal);
            setShowSpiritualGoalsPicker(true);
          }}
        >
          <Text style={[styles.goalValueText, { color: colors.primary }]}>
            {settings.dailyPrayerGoal} minutes
          </Text>
          <Text style={styles.settingChevron}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.goalRow}>
        <Text style={[styles.goalLabel, { color: colors.text }]}>
          Reading Streak Goal
        </Text>
        <TouchableOpacity
          style={styles.goalValue}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setCurrentGoalType('reading');
            setTempGoalValue(settings.readingStreakGoal);
            setShowSpiritualGoalsPicker(true);
          }}
        >
          <Text style={[styles.goalValueText, { color: colors.primary }]}>
            {settings.readingStreakGoal} days
          </Text>
          <Text style={styles.settingChevron}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.goalRow}>
        <Text style={[styles.goalLabel, { color: colors.text }]}>
          Memory Verses per Week
        </Text>
        <TouchableOpacity
          style={styles.goalValue}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setCurrentGoalType('verses');
            setTempGoalValue(settings.memoryVersesPerWeek);
            setShowSpiritualGoalsPicker(true);
          }}
        >
          <Text style={[styles.goalValueText, { color: colors.primary }]}>
            {settings.memoryVersesPerWeek} verses
          </Text>
          <Text style={styles.settingChevron}>›</Text>
        </TouchableOpacity>
      </View>
    </GlassCard>
  );

  const renderPrivacySection = () => (
    <GlassCard style={styles.sectionCard}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Privacy</Text>
      
      <TouchableOpacity
        style={styles.settingRow}
        onPress={() => navigation.navigate('PrivacyPolicy')}
      >
        <Text style={[styles.settingLabel, { color: colors.text }]}>
          Privacy Policy
        </Text>
        <Text style={styles.settingChevron}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.settingRow}
        onPress={() => navigation.navigate('TermsOfService')}
      >
        <Text style={[styles.settingLabel, { color: colors.text }]}>
          Terms of Service
        </Text>
        <Text style={styles.settingChevron}>›</Text>
      </TouchableOpacity>
      
    </GlassCard>
  );

  const renderAboutSection = () => (
    <GlassCard style={styles.sectionCard}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
      
      <View style={styles.settingRow}>
        <Text style={[styles.settingLabel, { color: colors.text }]}>
          Version
        </Text>
        <Text style={[styles.settingValueText, { color: colors.textSecondary }]}>
          1.0.0
        </Text>
      </View>
    </GlassCard>
  );

  const renderContactSection = () => (
    <GlassCard style={styles.sectionCard}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact Support</Text>
      
      <View style={styles.settingRow}>
        <Text style={[styles.settingLabel, { color: colors.text }]}>
          📧 Email
        </Text>
        <Text style={[styles.settingValueText, { color: colors.textSecondary }]}>
          support@dailyfaith.com
        </Text>
      </View>

      <View style={styles.settingRow}>
        <Text style={[styles.settingLabel, { color: colors.text }]}>
          🌐 Website
        </Text>
        <Text style={[styles.settingValueText, { color: colors.textSecondary }]}>
          www.dailyfaith.me
        </Text>
      </View>

      <View style={styles.settingRow}>
        <Text style={[styles.settingLabel, { color: colors.text }]}>
          📞 Phone
        </Text>
        <Text style={[styles.settingValueText, { color: colors.textSecondary }]}>
          +13239168235
        </Text>
      </View>
    </GlassCard>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.primary + '10', colors.secondary + '05', 'transparent']}
        style={styles.gradient}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
            <View style={styles.headerTop}>
              <TouchableOpacity
                style={[styles.backButton, { backgroundColor: colors.card }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  navigation.goBack();
                }}
                activeOpacity={0.7}
                accessibilityLabel="Go back"
                accessibilityRole="button"
                accessibilityHint="Returns to the previous screen"
              >
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </TouchableOpacity>
              <View style={styles.headerContent}>
                <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  Customize your spiritual journey
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.content}>
          {renderAccountSection()}
          {renderPreferencesSection()}
          {renderSpiritualGoalsSection()}
          {renderNotificationSection()}
          {renderPrivacySection()}
          {renderAboutSection()}
          {renderContactSection()}
        </View>

          {/* Bottom padding for tab bar */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Time Picker Modal */}
        <Modal
          visible={showTimePicker}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Set Reminder Time
              </Text>
              
              <View style={styles.timeInputContainer}>
                <TextInput
                  style={[styles.timeInput, { 
                    color: colors.text, 
                    borderColor: colors.border,
                    backgroundColor: colors.background 
                  }]}
                  value={tempTime}
                  onChangeText={setTempTime}
                  placeholder="HH:MM"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.border }]}
                  onPress={() => setShowTimePicker(false)}
                >
                  <Text style={[styles.modalButtonText, { color: colors.text }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.primary }]}
                  onPress={() => handleTimeChange(tempTime)}
                >
                  <Text style={[styles.modalButtonText, { color: 'white' }]}>
                    Save
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Font Size Picker Modal */}
        <Modal
          visible={showFontSizePicker}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Choose Font Size
              </Text>
              
              <ScrollView style={styles.pickerContainer}>
                {fontSizes.map((font) => (
                  <TouchableOpacity
                    key={font.id}
                    style={[
                      styles.pickerOption,
                      {
                        backgroundColor: settings.fontSize === font.id ? colors.primary + '20' : 'transparent',
                        borderColor: settings.fontSize === font.id ? colors.primary : colors.border,
                      }
                    ]}
                    onPress={() => {
                      saveSettings({ fontSize: font.id });
                      setShowFontSizePicker(false);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Text style={[
                      styles.pickerOptionText,
                      { 
                        color: settings.fontSize === font.id ? colors.primary : colors.text,
                        fontSize: font.size 
                      }
                    ]}>
                      {font.name}
                    </Text>
                    {settings.fontSize === font.id && (
                      <Ionicons name="checkmark" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.border }]}
                onPress={() => setShowFontSizePicker(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Language Picker Modal */}
        <Modal
          visible={showLanguagePicker}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Choose Language
              </Text>
              
              <ScrollView style={styles.pickerContainer}>
                {languages.map((language) => (
                  <TouchableOpacity
                    key={language.id}
                    style={[
                      styles.pickerOption,
                      {
                        backgroundColor: settings.language === language.id ? colors.primary + '20' : 'transparent',
                        borderColor: settings.language === language.id ? colors.primary : colors.border,
                      }
                    ]}
                    onPress={() => {
                      saveSettings({ language: language.id });
                      setShowLanguagePicker(false);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Text style={[
                      styles.pickerOptionText,
                      { color: settings.language === language.id ? colors.primary : colors.text }
                    ]}>
                      {language.name}
                    </Text>
                    {settings.language === language.id && (
                      <Ionicons name="checkmark" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.border }]}
                onPress={() => setShowLanguagePicker(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>


        {/* Spiritual Goals Picker Modal */}
        <Modal
          visible={showSpiritualGoalsPicker}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Set {currentGoalType === 'prayer' ? 'Daily Prayer Goal' : 
                     currentGoalType === 'reading' ? 'Reading Streak Goal' : 
                     'Memory Verses per Week'}
              </Text>
              
              <View style={styles.goalInputContainer}>
                <TextInput
                  style={[styles.goalInput, { 
                    color: colors.text, 
                    borderColor: colors.border,
                    backgroundColor: colors.background 
                  }]}
                  value={tempGoalValue.toString()}
                  onChangeText={(text) => setTempGoalValue(parseInt(text) || 0)}
                  keyboardType="numeric"
                  placeholder="Enter value"
                  placeholderTextColor={colors.textSecondary}
                />
                <Text style={[styles.goalUnit, { color: colors.textSecondary }]}>
                  {currentGoalType === 'prayer' ? 'minutes' : 
                   currentGoalType === 'reading' ? 'days' : 'verses'}
                </Text>
              </View>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.border }]}
                  onPress={() => setShowSpiritualGoalsPicker(false)}
                >
                  <Text style={[styles.modalButtonText, { color: colors.text }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    const goalKey = currentGoalType === 'prayer' ? 'dailyPrayerGoal' :
                                  currentGoalType === 'reading' ? 'readingStreakGoal' : 'memoryVersesPerWeek';
                    saveSettings({ [goalKey]: tempGoalValue });
                    setShowSpiritualGoalsPicker(false);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Text style={[styles.modalButtonText, { color: 'white' }]}>
                    Save
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Notification History Modal */}
        <Modal
          visible={showNotificationHistory}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Notification History
              </Text>
              
              <ScrollView style={styles.pickerContainer}>
                {notificationHistory.length > 0 ? (
                  notificationHistory.map((notification, index) => (
                    <View
                      key={index}
                      style={[
                        styles.notificationItem,
                        { borderBottomColor: colors.border }
                      ]}
                    >
                      <Text style={[styles.notificationTitle, { color: colors.text }]}>
                        {notification.title}
                      </Text>
                      <Text style={[styles.notificationBody, { color: colors.textSecondary }]}>
                        {notification.body}
                      </Text>
                      <Text style={[styles.notificationTime, { color: colors.textSecondary }]}>
                        {new Date(notification.sentAt).toLocaleString()}
                      </Text>
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                      No notifications sent yet
                    </Text>
                  </View>
                )}
              </ScrollView>
              
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.border }]}
                onPress={() => setShowNotificationHistory(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </LinearGradient>
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
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flex: 1,
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
  content: {
    paddingHorizontal: 20,
  },
  sectionCard: {
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    fontWeight: '400',
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5E72E4',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  settingValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValueText: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 8,
  },
  settingChevron: {
    fontSize: 18,
    fontWeight: '600',
    color: '#C7C7CC',
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  themeOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  themeOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  goalLabel: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  goalValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalValueText: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
  },
  gradient: {
    flex: 1,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
  },
  timeInputContainer: {
    width: '100%',
    marginBottom: 24,
  },
  timeInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  pickerContainer: {
    maxHeight: 300,
    width: '100%',
    marginBottom: 20,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  pickerOptionText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  goalInputContainer: {
    width: '100%',
    marginBottom: 24,
    alignItems: 'center',
  },
  goalInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    textAlign: 'center',
    width: 120,
    marginBottom: 8,
  },
  goalUnit: {
    fontSize: 14,
    fontWeight: '500',
  },
  notificationItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  notificationBody: {
    fontSize: 14,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default SettingsScreen;
