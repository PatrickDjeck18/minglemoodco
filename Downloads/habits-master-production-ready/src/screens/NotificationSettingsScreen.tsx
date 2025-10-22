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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { firebaseNotificationService, NotificationSettings } from '../utils/firebaseNotifications';
import GlassCard from '../components/GlassCard';
import ModernBackButton from '../components/ModernBackButton';

const NotificationSettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState<NotificationSettings>({
    prayerNotifications: true,
    likeNotifications: true,
    commentNotifications: true,
    replyNotifications: true,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '07:00'
    },
    soundEnabled: true,
    vibrationEnabled: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadNotificationSettings();
    }
  }, [user]);

  const loadNotificationSettings = async () => {
    try {
      setLoading(true);
      await firebaseNotificationService.loadNotificationSettings(user?.id || '');
      const currentSettings = firebaseNotificationService.getNotificationSettings();
      setSettings(currentSettings);
    } catch (error) {
      console.error('Error loading notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: Partial<NotificationSettings>) => {
    if (!user) return;

    try {
      setSaving(true);
      await firebaseNotificationService.saveNotificationSettings(user.id, newSettings);
      setSettings(prev => ({ ...prev, ...newSettings }));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Error saving notification settings:', error);
      Alert.alert('Error', 'Failed to save notification settings');
    } finally {
      setSaving(false);
    }
  };

  const toggleSetting = (key: keyof NotificationSettings, value: boolean) => {
    saveSettings({ [key]: value });
  };

  const toggleQuietHours = () => {
    saveSettings({
      quietHours: {
        ...settings.quietHours,
        enabled: !settings.quietHours.enabled
      }
    });
  };

  const testNotification = async () => {
    try {
      await firebaseNotificationService.sendTestNotification();
      Alert.alert('Test Sent', 'A test notification has been sent to your device');
    } catch (error) {
      console.error('Error sending test notification:', error);
      Alert.alert('Error', 'Failed to send test notification');
    }
  };

  const requestPermissions = async () => {
    try {
      const granted = await firebaseNotificationService.requestNotificationPermissions();
      if (granted) {
        Alert.alert('Success', 'Notification permissions granted');
      } else {
        Alert.alert('Permission Denied', 'Please enable notifications in your device settings');
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      Alert.alert('Error', 'Failed to request notification permissions');
    }
  };

  const renderSettingRow = (
    title: string,
    description: string,
    value: boolean,
    onToggle: () => void,
    icon: keyof typeof Ionicons.glyphMap
  ) => (
    <View style={styles.settingRow}>
      <View style={styles.settingInfo}>
        <View style={styles.settingHeader}>
          <Ionicons name={icon} size={20} color={colors.primary} style={styles.settingIcon} />
          <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
        </View>
        <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
          {description}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.border, true: colors.primary + '40' }}
        thumbColor={value ? colors.primary : colors.textSecondary}
      />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <View style={styles.headerContent}>
            <ModernBackButton onPress={() => navigation.goBack()} />
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: colors.text }]}>Notification Settings</Text>
            </View>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading settings...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={styles.headerContent}>
          <ModernBackButton onPress={() => navigation.goBack()} />
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: colors.text }]}>Notification Settings</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Manage your notification preferences
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Prayer Request Notifications */}
        <GlassCard style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Prayer Request Notifications
          </Text>
          
          {renderSettingRow(
            'Prayer Notifications',
            'Get notified when someone prays for your requests',
            settings.prayerNotifications,
            () => toggleSetting('prayerNotifications', !settings.prayerNotifications),
            'heart'
          )}
          
          {renderSettingRow(
            'Like Notifications',
            'Get notified when someone likes your prayer requests',
            settings.likeNotifications,
            () => toggleSetting('likeNotifications', !settings.likeNotifications),
            'thumbs-up'
          )}
          
          {renderSettingRow(
            'Comment Notifications',
            'Get notified when someone comments on your prayer requests',
            settings.commentNotifications,
            () => toggleSetting('commentNotifications', !settings.commentNotifications),
            'chatbubble'
          )}
          
          {renderSettingRow(
            'Reply Notifications',
            'Get notified when someone replies to your comments',
            settings.replyNotifications,
            () => toggleSetting('replyNotifications', !settings.replyNotifications),
            'arrow-undo'
          )}
        </GlassCard>

        {/* General Settings */}
        <GlassCard style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            General Settings
          </Text>
          
          {renderSettingRow(
            'Sound',
            'Play sound for notifications',
            settings.soundEnabled,
            () => toggleSetting('soundEnabled', !settings.soundEnabled),
            'volume-high'
          )}
          
          {renderSettingRow(
            'Vibration',
            'Vibrate for notifications',
            settings.vibrationEnabled,
            () => toggleSetting('vibrationEnabled', !settings.vibrationEnabled),
            'phone-portrait'
          )}
        </GlassCard>

        {/* Quiet Hours */}
        <GlassCard style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Quiet Hours
          </Text>
          
          {renderSettingRow(
            'Enable Quiet Hours',
            'Pause notifications during specified hours',
            settings.quietHours.enabled,
            toggleQuietHours,
            'moon'
          )}
          
          {settings.quietHours.enabled && (
            <View style={styles.quietHoursInfo}>
              <Text style={[styles.quietHoursText, { color: colors.textSecondary }]}>
                Notifications will be paused from {settings.quietHours.start} to {settings.quietHours.end}
              </Text>
            </View>
          )}
        </GlassCard>

        {/* Test & Permissions */}
        <GlassCard style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Test & Permissions
          </Text>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={testNotification}
          >
            <Ionicons name="notifications" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Send Test Notification</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.accent }]}
            onPress={requestPermissions}
          >
            <Ionicons name="shield-checkmark" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Request Permissions</Text>
          </TouchableOpacity>
        </GlassCard>

        {/* Bottom padding */}
        <View style={{ height: 100 }} />
      </ScrollView>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
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
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  settingIcon: {
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  settingDescription: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  quietHoursInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
  quietHoursText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default NotificationSettingsScreen;
