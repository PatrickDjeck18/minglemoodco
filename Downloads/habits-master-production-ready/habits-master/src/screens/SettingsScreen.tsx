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
import { FirebaseManager } from '../utils/firebase';
import GlassCard from '../components/GlassCard';
import CustomButton from '../components/CustomButton';

interface SettingsData {
  notificationsEnabled: boolean;
  dailyReminderTime: string;
  bibleTranslation: string;
  fontSize: string;
  language: string;
  prayerReminders: boolean;
  readingReminders: boolean;
  devotionReminders: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

const SettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, isDark, theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  
  // State management
  const [settings, setSettings] = useState<SettingsData>({
    notificationsEnabled: true,
    dailyReminderTime: '08:00',
    bibleTranslation: 'NIV',
    fontSize: 'medium',
    language: 'English',
    prayerReminders: true,
    readingReminders: true,
    devotionReminders: true,
    soundEnabled: true,
    vibrationEnabled: true,
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempTime, setTempTime] = useState('08:00');
  const [showTranslationPicker, setShowTranslationPicker] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [showFontSizePicker, setShowFontSizePicker] = useState(false);

  const userProfile = {
    name: user?.displayName || 'User',
    email: user?.email || 'user@example.com',
    avatar: null, // In a real app, this would be a user's profile image
  };

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const savedSettings = await AsyncStorage.getItem('user_settings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsedSettings }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
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
        await FirebaseManager.syncUserData(user.uid, { settings: updatedSettings });
      }
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Error saving settings:', error);
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
                console.error('Export error:', error);
                Alert.alert('Error', 'Failed to export data. Please try again.');
              } finally {
                setSaving(false);
              }
            }
          },
        ]
      );
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export data. Please try again.');
    }
  };

  const handleSignOut = async () => {
    console.log('Sign out button pressed');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      console.log('Starting direct sign out process...');
      await signOut();
      console.log('Sign out completed successfully');
      
      // Fallback: Force navigation after a short delay if auth state doesn't change
      setTimeout(() => {
        console.log('Fallback: Checking if still authenticated...');
        if (user) {
          console.log('Still authenticated, forcing sign out again...');
          signOut();
        }
      }, 1000);
      
    } catch (error) {
      console.error('Sign out error:', error);
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
              console.log('Starting sign out process...');
              await signOut();
              console.log('Sign out completed successfully');
            } catch (error) {
              console.error('Sign out error:', error);
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
      console.error('Error updating notification setting:', error);
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
      console.error('Error updating reminder time:', error);
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
      };
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Daily Faith Reminder',
          body: 'Time for your daily prayer and devotion!',
          sound: settings.soundEnabled,
        },
        trigger,
      });
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  };

  const handleClearData = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your data including prayer requests, reading progress, and settings. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true);
              
              // Clear AsyncStorage
              await AsyncStorage.clear();
              
              // Cancel all notifications
              await Notifications.cancelAllScheduledNotificationsAsync();
              
              // Reset settings to defaults
              setSettings({
                notificationsEnabled: true,
                dailyReminderTime: '08:00',
                bibleTranslation: 'NIV',
                fontSize: 'medium',
                language: 'English',
                prayerReminders: true,
                readingReminders: true,
                devotionReminders: true,
                soundEnabled: true,
                vibrationEnabled: true,
              });
              
              Alert.alert('Success', 'All data has been cleared.');
            } catch (error) {
              console.error('Error clearing data:', error);
              Alert.alert('Error', 'Failed to clear data. Please try again.');
            } finally {
              setSaving(false);
            }
          }
        },
      ]
    );
  };

  const handleRateApp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // In a real app, open the app store rating
    Alert.alert('Rate App', 'Thank you for your feedback!');
  };

  const handleShareApp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // In a real app, share the app
    Alert.alert('Share App', 'App shared successfully!');
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
          Bible Translation
        </Text>
        <TouchableOpacity
          style={styles.settingValue}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            // Show translation picker
          }}
        >
          <Text style={[styles.settingValueText, { color: colors.primary }]}>
            {settings.bibleTranslation}
          </Text>
          <Text style={styles.settingChevron}>›</Text>
        </TouchableOpacity>
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
            // Show font size picker
          }}
        >
          <Text style={[styles.settingValueText, { color: colors.primary }]}>
            {settings.fontSize}
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
            // Show language picker
          }}
        >
          <Text style={[styles.settingValueText, { color: colors.primary }]}>
            {settings.language}
          </Text>
          <Text style={styles.settingChevron}>›</Text>
        </TouchableOpacity>
      </View>
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
            // Show time picker
          }}
        >
          <Text style={[styles.goalValueText, { color: colors.primary }]}>
            15 minutes
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
            // Show number picker
          }}
        >
          <Text style={[styles.goalValueText, { color: colors.primary }]}>
            30 days
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
            // Show number picker
          }}
        >
          <Text style={[styles.goalValueText, { color: colors.primary }]}>
            3 verses
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
        onPress={handleClearData}
      >
        <Text style={[styles.settingLabel, { color: colors.warning }]}>
          Clear All Data
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

      <TouchableOpacity
        style={styles.settingRow}
        onPress={handleRateApp}
      >
        <Text style={[styles.settingLabel, { color: colors.text }]}>
          Rate App
        </Text>
        <Text style={styles.settingChevron}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.settingRow}
        onPress={handleShareApp}
      >
        <Text style={[styles.settingLabel, { color: colors.text }]}>
          Share App
        </Text>
        <Text style={styles.settingChevron}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.settingRow}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          // Navigate to feedback
        }}
      >
        <Text style={[styles.settingLabel, { color: colors.text }]}>
          Send Feedback
        </Text>
        <Text style={styles.settingChevron}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.settingRow}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          // Navigate to privacy policy
        }}
      >
        <Text style={[styles.settingLabel, { color: colors.text }]}>
          Privacy Policy
        </Text>
        <Text style={styles.settingChevron}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.settingRow}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          // Navigate to terms of service
        }}
      >
        <Text style={[styles.settingLabel, { color: colors.text }]}>
          Terms of Service
        </Text>
        <Text style={styles.settingChevron}>›</Text>
      </TouchableOpacity>
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
            <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Customize your spiritual journey
            </Text>
          </View>

          <View style={styles.content}>
          {renderAccountSection()}
          {renderPreferencesSection()}
          {renderSpiritualGoalsSection()}
          {renderPrivacySection()}
          {renderAboutSection()}
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
  settingValue: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 8,
    color: '#5E72E4',
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
});

export default SettingsScreen;
