import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
export const STORAGE_KEYS = {
  ONBOARDING_COMPLETE: 'onboarding_complete',
  USER_PREFERENCES: 'user_preferences',
  PRAYER_REQUESTS: 'prayer_requests',
  READING_PROGRESS: 'reading_progress',
  MEMORY_VERSES: 'memory_verses',
  PRACTICE_LOGS: 'practice_logs',
  STATISTICS_CACHE: 'statistics_cache',
  DEVOTION_NOTES: 'devotion_notes',
  SPIRITUAL_GOALS: 'spiritual_goals',
} as const;

// Data interfaces
export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  notifications: boolean;
  reminderTime: string;
  bibleTranslation: string;
  fontSize: 'small' | 'medium' | 'large';
  language: string;
}

export interface PrayerRequest {
  id: string;
  title: string;
  description: string;
  category: string;
  dateAdded: Date;
  prayerCount: number;
  isAnswered: boolean;
  isPrivate: boolean;
  answeredDate?: Date;
  testimony?: string;
}

export interface ReadingProgress {
  planId: string;
  currentChapter: number;
  currentVerse: number;
  completedChapters: number[];
  lastReadDate: Date;
  streak: number;
  totalTimeSpent: number; // in minutes
}

export interface MemoryVerse {
  id: string;
  reference: string;
  text: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  mastery: 'learning' | 'review' | 'mastered';
  lastReviewed: Date;
  reviewCount: number;
  correctCount: number;
}

export interface PracticeLog {
  id: string;
  practiceId: string;
  date: Date;
  duration: number; // in minutes
  notes?: string;
  completed: boolean;
}

export interface StatisticsCache {
  totalDaysActive: number;
  currentPrayerStreak: number;
  bibleReadingPercentage: number;
  versesMemorized: number;
  lastUpdated: Date;
}

// Storage utility functions
export class StorageManager {
  // Generic storage methods
  static async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error(`Error storing ${key}:`, error);
      throw error;
    }
  }

  static async getItem<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error(`Error retrieving ${key}:`, error);
      return null;
    }
  }

  static async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
      throw error;
    }
  }

  static async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  }

  // Specific data methods
  static async getUserPreferences(): Promise<UserPreferences | null> {
    return this.getItem<UserPreferences>(STORAGE_KEYS.USER_PREFERENCES);
  }

  static async setUserPreferences(preferences: UserPreferences): Promise<void> {
    return this.setItem(STORAGE_KEYS.USER_PREFERENCES, preferences);
  }

  static async getPrayerRequests(): Promise<PrayerRequest[]> {
    const requests = await this.getItem<PrayerRequest[]>(STORAGE_KEYS.PRAYER_REQUESTS);
    return requests || [];
  }

  static async setPrayerRequests(requests: PrayerRequest[]): Promise<void> {
    return this.setItem(STORAGE_KEYS.PRAYER_REQUESTS, requests);
  }

  static async addPrayerRequest(request: PrayerRequest): Promise<void> {
    const requests = await this.getPrayerRequests();
    requests.push(request);
    return this.setPrayerRequests(requests);
  }

  static async updatePrayerRequest(id: string, updates: Partial<PrayerRequest>): Promise<void> {
    const requests = await this.getPrayerRequests();
    const index = requests.findIndex(r => r.id === id);
    if (index !== -1) {
      requests[index] = { ...requests[index], ...updates };
      return this.setPrayerRequests(requests);
    }
  }

  static async getReadingProgress(): Promise<ReadingProgress[]> {
    const progress = await this.getItem<ReadingProgress[]>(STORAGE_KEYS.READING_PROGRESS);
    return progress || [];
  }

  static async setReadingProgress(progress: ReadingProgress[]): Promise<void> {
    return this.setItem(STORAGE_KEYS.READING_PROGRESS, progress);
  }

  static async getMemoryVerses(): Promise<MemoryVerse[]> {
    const verses = await this.getItem<MemoryVerse[]>(STORAGE_KEYS.MEMORY_VERSES);
    return verses || [];
  }

  static async setMemoryVerses(verses: MemoryVerse[]): Promise<void> {
    return this.setItem(STORAGE_KEYS.MEMORY_VERSES, verses);
  }

  static async addMemoryVerse(verse: MemoryVerse): Promise<void> {
    const verses = await this.getMemoryVerses();
    verses.push(verse);
    return this.setMemoryVerses(verses);
  }

  static async getPracticeLogs(): Promise<PracticeLog[]> {
    const logs = await this.getItem<PracticeLog[]>(STORAGE_KEYS.PRACTICE_LOGS);
    return logs || [];
  }

  static async setPracticeLogs(logs: PracticeLog[]): Promise<void> {
    return this.setItem(STORAGE_KEYS.PRACTICE_LOGS, logs);
  }

  static async addPracticeLog(log: PracticeLog): Promise<void> {
    const logs = await this.getPracticeLogs();
    logs.push(log);
    return this.setPracticeLogs(logs);
  }

  static async getStatisticsCache(): Promise<StatisticsCache | null> {
    return this.getItem<StatisticsCache>(STORAGE_KEYS.STATISTICS_CACHE);
  }

  static async setStatisticsCache(stats: StatisticsCache): Promise<void> {
    return this.setItem(STORAGE_KEYS.STATISTICS_CACHE, stats);
  }

  // Data export/import
  static async exportData(): Promise<string> {
    try {
      const data = {
        userPreferences: await this.getUserPreferences(),
        prayerRequests: await this.getPrayerRequests(),
        readingProgress: await this.getReadingProgress(),
        memoryVerses: await this.getMemoryVerses(),
        practiceLogs: await this.getPracticeLogs(),
        statisticsCache: await this.getStatisticsCache(),
        exportDate: new Date().toISOString(),
      };
      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  static async importData(jsonData: string): Promise<void> {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.userPreferences) {
        await this.setUserPreferences(data.userPreferences);
      }
      if (data.prayerRequests) {
        await this.setPrayerRequests(data.prayerRequests);
      }
      if (data.readingProgress) {
        await this.setReadingProgress(data.readingProgress);
      }
      if (data.memoryVerses) {
        await this.setMemoryVerses(data.memoryVerses);
      }
      if (data.practiceLogs) {
        await this.setPracticeLogs(data.practiceLogs);
      }
      if (data.statisticsCache) {
        await this.setStatisticsCache(data.statisticsCache);
      }
    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
    }
  }

  // Data validation
  static validatePrayerRequest(request: any): request is PrayerRequest {
    return (
      typeof request.id === 'string' &&
      typeof request.title === 'string' &&
      typeof request.description === 'string' &&
      typeof request.category === 'string' &&
      request.dateAdded instanceof Date &&
      typeof request.prayerCount === 'number' &&
      typeof request.isAnswered === 'boolean' &&
      typeof request.isPrivate === 'boolean'
    );
  }

  static validateMemoryVerse(verse: any): verse is MemoryVerse {
    return (
      typeof verse.id === 'string' &&
      typeof verse.reference === 'string' &&
      typeof verse.text === 'string' &&
      typeof verse.category === 'string' &&
      ['easy', 'medium', 'hard'].includes(verse.difficulty) &&
      ['learning', 'review', 'mastered'].includes(verse.mastery) &&
      verse.lastReviewed instanceof Date &&
      typeof verse.reviewCount === 'number' &&
      typeof verse.correctCount === 'number'
    );
  }
}

// Default data
export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  theme: 'auto',
  notifications: true,
  reminderTime: '08:00',
  bibleTranslation: 'NIV',
  fontSize: 'medium',
  language: 'English',
};

export const DEFAULT_STATISTICS: StatisticsCache = {
  totalDaysActive: 0,
  currentPrayerStreak: 0,
  bibleReadingPercentage: 0,
  versesMemorized: 0,
  lastUpdated: new Date(),
};
