// Firebase Notification Service for Prayer Request Interactions
// Handles notifications for praying, liking, commenting, and replying

import { FirebaseManager } from './firebase';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export interface PrayerNotificationData {
  type: 'prayer' | 'like' | 'comment' | 'reply';
  prayerRequestId: string;
  prayerRequestTitle: string;
  actorUserId: string;
  actorName: string;
  targetUserId: string;
  commentId?: string;
  parentCommentId?: string;
  message?: string;
}

export interface NotificationSettings {
  prayerNotifications: boolean;
  likeNotifications: boolean;
  commentNotifications: boolean;
  replyNotifications: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string;   // HH:MM format
  };
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export class FirebaseNotificationService {
  private static instance: FirebaseNotificationService;
  private notificationSettings: NotificationSettings = {
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
  };

  private constructor() {
    this.initializeNotificationHandlers();
  }

  public static getInstance(): FirebaseNotificationService {
    if (!FirebaseNotificationService.instance) {
      FirebaseNotificationService.instance = new FirebaseNotificationService();
    }
    return FirebaseNotificationService.instance;
  }

  private async initializeNotificationHandlers() {
    // Configure notification behavior
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: this.notificationSettings.soundEnabled,
        shouldSetBadge: true,
      }),
    });
  }

  // Load notification settings from Firebase
  public async loadNotificationSettings(userId: string): Promise<void> {
    try {
      const settings = await FirebaseManager.getNotificationSettings(userId);
      if (settings) {
        this.notificationSettings = {
          prayerNotifications: settings.prayerNotifications ?? true,
          likeNotifications: settings.likeNotifications ?? true,
          commentNotifications: settings.commentNotifications ?? true,
          replyNotifications: settings.replyNotifications ?? true,
          quietHours: settings.quietHours ?? {
            enabled: false,
            start: '22:00',
            end: '07:00'
          },
          soundEnabled: settings.soundEnabled ?? true,
          vibrationEnabled: settings.vibrationEnabled ?? true
        };
      }
    } catch (error) {
    }
  }

  // Save notification settings to Firebase
  public async saveNotificationSettings(userId: string, settings: Partial<NotificationSettings>): Promise<void> {
    try {
      this.notificationSettings = { ...this.notificationSettings, ...settings };
      await FirebaseManager.saveNotificationSettings(userId, this.notificationSettings);
    } catch (error) {
      throw error;
    }
  }

  // Check if notifications should be sent based on settings and quiet hours
  private shouldSendNotification(): boolean {
    if (!this.isWithinQuietHours()) {
      return true;
    }
    return false;
  }

  // Check if current time is within quiet hours
  private isWithinQuietHours(): boolean {
    if (!this.notificationSettings.quietHours.enabled) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const startTime = this.parseTime(this.notificationSettings.quietHours.start);
    const endTime = this.parseTime(this.notificationSettings.quietHours.end);

    if (startTime <= endTime) {
      // Same day quiet hours (e.g., 22:00 to 07:00)
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Overnight quiet hours (e.g., 22:00 to 07:00)
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  private parseTime(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // Send notification for prayer request interaction
  public async sendPrayerNotification(notificationData: PrayerNotificationData): Promise<void> {
    try {
      // Check if notifications are enabled for this type
      if (!this.isNotificationTypeEnabled(notificationData.type)) {
        return;
      }

      // Check quiet hours
      if (!this.shouldSendNotification()) {
        return;
      }

      // Don't send notification to the actor themselves
      if (notificationData.actorUserId === notificationData.targetUserId) {
        return;
      }

      const notificationContent = this.buildNotificationContent(notificationData);
      
      // Schedule the notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notificationContent.title,
          body: notificationContent.body,
          data: {
            type: notificationData.type,
            prayerRequestId: notificationData.prayerRequestId,
            actorUserId: notificationData.actorUserId,
            targetUserId: notificationData.targetUserId,
            commentId: notificationData.commentId,
            parentCommentId: notificationData.parentCommentId
          },
          sound: this.notificationSettings.soundEnabled,
        },
        trigger: null, // Send immediately
      });

      // Log the notification in Firebase
      await this.logNotificationSent(notificationData);

    } catch (error) {
      // Silent error handling
    }
  }

  // Check if notification type is enabled
  private isNotificationTypeEnabled(type: PrayerNotificationData['type']): boolean {
    switch (type) {
      case 'prayer':
        return this.notificationSettings.prayerNotifications;
      case 'like':
        return this.notificationSettings.likeNotifications;
      case 'comment':
        return this.notificationSettings.commentNotifications;
      case 'reply':
        return this.notificationSettings.replyNotifications;
      default:
        return false;
    }
  }

  // Build notification content based on interaction type
  private buildNotificationContent(data: PrayerNotificationData) {
    const actorName = data.actorName || 'Anonymous';
    const requestTitle = data.prayerRequestTitle.length > 50 
      ? data.prayerRequestTitle.substring(0, 50) + '...' 
      : data.prayerRequestTitle;

    switch (data.type) {
      case 'prayer':
        return {
          title: '🙏 Anonymous prayed for your request',
          body: `${actorName} prayed for "${requestTitle}"`
        };
      
      case 'like':
        return {
          title: '❤️ Your prayer request was liked',
          body: `${actorName} liked "${requestTitle}"`
        };
      
      case 'comment':
        return {
          title: '💬 New comment on your prayer request',
          body: `${actorName} commented on "${requestTitle}"`
        };
      
      case 'reply':
        return {
          title: '↩️ Reply to your comment',
          body: `${actorName} replied to your comment on "${requestTitle}"`
        };
      
      default:
        return {
          title: 'Prayer Request Update',
          body: `New activity on "${requestTitle}"`
        };
    }
  }

  // Log notification in Firebase for analytics
  private async logNotificationSent(data: PrayerNotificationData): Promise<void> {
    try {
      await FirebaseManager.logNotificationSent(data.targetUserId, {
        type: `prayer_${data.type}`,
        title: this.buildNotificationContent(data).title,
        body: this.buildNotificationContent(data).body,
        sentAt: new Date().toISOString(),
        userId: data.targetUserId,
        prayerRequestId: data.prayerRequestId,
        actorUserId: data.actorUserId,
        actorName: data.actorName
      });
    } catch (error) {
    }
  }

  // Get user's notification settings
  public getNotificationSettings(): NotificationSettings {
    return { ...this.notificationSettings };
  }

  // Update notification settings
  public updateNotificationSettings(settings: Partial<NotificationSettings>): void {
    this.notificationSettings = { ...this.notificationSettings, ...settings };
  }

  // Request notification permissions
  public async requestNotificationPermissions(): Promise<boolean> {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      return false;
    }
  }

  // Get notification history for a user
  public async getNotificationHistory(userId: string, limit: number = 50): Promise<any[]> {
    try {
      return await FirebaseManager.getNotificationHistory(userId, limit);
    } catch (error) {
      return [];
    }
  }

  // Clear all notifications
  public async clearAllNotifications(): Promise<void> {
    try {
      await Notifications.dismissAllNotificationsAsync();
    } catch (error) {
    }
  }

  // Test notification (for testing purposes)
  public async sendTestNotification(): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🧪 Test Notification',
          body: 'This is a test notification from the prayer app',
          data: { type: 'test' },
          sound: true,
        },
        trigger: null,
      });
    } catch (error) {
    }
  }
}

// Export singleton instance
export const firebaseNotificationService = FirebaseNotificationService.getInstance();

// Export helper functions for easy use
export const sendPrayerNotification = async (data: PrayerNotificationData) => {
  return firebaseNotificationService.sendPrayerNotification(data);
};

export const loadNotificationSettings = async (userId: string) => {
  return firebaseNotificationService.loadNotificationSettings(userId);
};

export const saveNotificationSettings = async (userId: string, settings: Partial<NotificationSettings>) => {
  return firebaseNotificationService.saveNotificationSettings(userId, settings);
};

export const requestNotificationPermissions = async () => {
  return firebaseNotificationService.requestNotificationPermissions();
};
