import { StorageManager } from '../utils/storage';
import { SupabaseManager } from '../utils/supabase';

export interface DailyVerse {
  text: string;
  reference: string;
  version?: string;
  date: string;
  likesCount?: number;
  isLiked?: boolean;
}

export interface BibleApiResponse {
  reference: string;
  verses: Array<{
    book_id: string;
    book_name: string;
    chapter: number;
    verse: number;
    text: string;
  }>;
  translation_name: string;
  translation_id: string;
}


class BibleApiService {
  private static instance: BibleApiService;
  private readonly API_BASE_URL = 'https://bible-api.com';
  private readonly CACHE_KEY = 'daily_verse_cache';
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds


  private constructor() {}

  static getInstance(): BibleApiService {
    if (!BibleApiService.instance) {
      BibleApiService.instance = new BibleApiService();
    }
    return BibleApiService.instance;
  }

  /**
   * Get today's daily verse with caching
   */
  async getDailyVerse(): Promise<DailyVerse> {
    try {
      // Check cache first
      const cachedVerse = await this.getCachedVerse();
      if (cachedVerse && this.isCacheValid(cachedVerse.date)) {
        return cachedVerse;
      }

      // Fetch new verse from API
      const newVerse = await this.fetchDailyVerse();
      
      // Validate the verse data
      if (!this.isValidVerse(newVerse)) {
        throw new Error('Invalid verse data received from API');
      }
      
      // Cache the new verse
      await this.cacheVerse(newVerse);
      
      return newVerse;
    } catch (error) {
      console.error('Error fetching daily verse:', error);
      // Return fallback verse if API fails
      return this.getFallbackVerse();
    }
  }

  /**
   * Get today's daily verse with likes information
   */
  async getDailyVerseWithLikes(userId?: string): Promise<DailyVerse> {
    try {
      console.log('BibleApiService: Getting daily verse with likes for user:', userId);
      const verse = await this.getDailyVerse();
      console.log('BibleApiService: Got verse:', verse);
      
      // If user is authenticated, get likes info
      if (userId) {
        try {
          console.log('BibleApiService: Getting likes info for user');
          const likesInfo = await SupabaseManager.getDailyVerseLikesInfo(
            userId,
            verse.reference,
            verse.date
          );
          console.log('BibleApiService: Got likes info:', likesInfo);
          return {
            ...verse,
            isLiked: likesInfo.isLiked,
            likesCount: likesInfo.likesCount,
          };
        } catch (error) {
          console.error('BibleApiService: Error getting likes info:', error);
          // Return verse without likes info if there's an error
          return verse;
        }
      }
      
      return verse;
    } catch (error) {
      console.error('Error fetching daily verse with likes:', error);
      return this.getFallbackVerse();
    }
  }

  /**
   * Fetch daily verse from Bible API
   */
  private async fetchDailyVerse(): Promise<DailyVerse> {
    // Popular verses for daily inspiration
    const popularVerses = [
      'Jeremiah 29:11',
      'Philippians 4:13',
      'Romans 8:28',
      'Proverbs 3:5-6',
      'Isaiah 40:31',
      'Matthew 11:28',
      'John 3:16',
      'Psalm 23:1',
      '1 Corinthians 13:4-7',
      'Galatians 5:22-23',
      'Ephesians 2:8-9',
      'Hebrews 11:1',
      'James 1:2-3',
      '1 Peter 5:7',
      'Revelation 21:4'
    ];

    // Select verse based on day of year for consistency
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const verseIndex = dayOfYear % popularVerses.length;
    const selectedReference = popularVerses[verseIndex];

    try {
      const response = await fetch(`${this.API_BASE_URL}/${encodeURIComponent(selectedReference)}`);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data: BibleApiResponse = await response.json();
      
      // Validate response structure
      if (!data.verses || !Array.isArray(data.verses) || data.verses.length === 0) {
        throw new Error('Invalid API response: no verses found');
      }
      
      // Extract text from verses array
      const verseText = data.verses.map(verse => verse.text).join(' ');
      
      if (!verseText || verseText.trim().length === 0) {
        throw new Error('Invalid API response: empty verse text');
      }
      
      return {
        text: verseText,
        reference: data.reference,
        version: data.translation_name,
        date: new Date().toISOString().split('T')[0] // YYYY-MM-DD format
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get cached verse from local storage
   */
  private async getCachedVerse(): Promise<DailyVerse | null> {
    try {
      const cached = await StorageManager.getItem<DailyVerse>(this.CACHE_KEY);
      return cached;
    } catch (error) {
      console.error('Error getting cached verse:', error);
      return null;
    }
  }

  /**
   * Cache verse to local storage
   */
  private async cacheVerse(verse: DailyVerse): Promise<void> {
    try {
      await StorageManager.setItem(this.CACHE_KEY, verse);
    } catch (error) {
      console.error('Error caching verse:', error);
    }
  }

  /**
   * Check if cached verse is still valid (same day)
   */
  private isCacheValid(cachedDate: string): boolean {
    const today = new Date().toISOString().split('T')[0];
    return cachedDate === today;
  }

  /**
   * Validate verse data
   */
  private isValidVerse(verse: DailyVerse): boolean {
    return !!(
      verse &&
      verse.text &&
      verse.reference &&
      verse.text.trim().length > 0 &&
      verse.reference.trim().length > 0 &&
      verse.text.length < 1000 && // Reasonable length limit
      verse.reference.length < 100 // Reasonable reference length
    );
  }

  /**
   * Get fallback verse when API fails
   */
  private getFallbackVerse(): DailyVerse {
    const fallbackVerses = [
      {
        text: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, to give you hope and a future.",
        reference: "Jeremiah 29:11"
      },
      {
        text: "I can do all things through him who strengthens me.",
        reference: "Philippians 4:13"
      },
      {
        text: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose.",
        reference: "Romans 8:28"
      }
    ];

    // Select fallback based on day
    const dayOfMonth = new Date().getDate();
    const fallbackIndex = dayOfMonth % fallbackVerses.length;
    
    return {
      ...fallbackVerses[fallbackIndex],
      date: new Date().toISOString().split('T')[0]
    };
  }

  /**
   * Share verse functionality
   */
  async shareVerse(verse: DailyVerse): Promise<void> {
    try {
      const shareText = `"${verse.text}"\n\n— ${verse.reference}\n\nShared from FaithHabits App`;
      
      // This would integrate with React Native's Share API
      // For now, we'll just log it
      console.log('Sharing verse:', shareText);
      
      // In a real implementation, you would use:
      // import { Share } from 'react-native';
      // await Share.share({ message: shareText });
    } catch (error) {
      console.error('Error sharing verse:', error);
      throw error;
    }
  }

  /**
   * Get verse by reference
   */
  async getVerseByReference(reference: string): Promise<DailyVerse> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/${encodeURIComponent(reference)}`);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data: BibleApiResponse = await response.json();
      
      // Validate response structure
      if (!data.verses || !Array.isArray(data.verses) || data.verses.length === 0) {
        throw new Error('Invalid API response: no verses found');
      }
      
      // Extract text from verses array
      const verseText = data.verses.map(verse => verse.text).join(' ');
      
      if (!verseText || verseText.trim().length === 0) {
        throw new Error('Invalid API response: empty verse text');
      }
      
      return {
        text: verseText,
        reference: data.reference,
        version: data.translation_name,
        date: new Date().toISOString().split('T')[0]
      };
    } catch (error) {
      console.error('Error fetching verse by reference:', error);
      throw error;
    }
  }

}

export default BibleApiService;
