import { createClient } from '@supabase/supabase-js';
import { supabaseConfig } from './config';

// Create Supabase client
export const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);

// Supabase collections (tables)
export const TABLES = {
  USERS: 'users',
  USER_PROFILES: 'user_profiles',
  PRAYER_REQUESTS: 'prayer_requests',
  PRACTICE_LOGS: 'practice_logs',
  STATISTICS: 'statistics',
  PRAYER_SESSIONS: 'prayer_sessions',
  PRACTICES: 'practices',
  // Christian Habits Tables
  DAILY_DEVOTIONS: 'daily_devotions',
  FASTING_RECORDS: 'fasting_records',
  WORSHIP_SESSIONS: 'worship_sessions',
  GRATITUDE_ENTRIES: 'gratitude_entries',
  SERVICE_RECORDS: 'service_records',
  CHRISTIAN_BOOKS: 'christian_books',
  CHRISTIAN_HABIT_TEMPLATES: 'christian_habit_templates',
  CHRISTIAN_HABITS: 'christian_habits',
  CHRISTIAN_HABIT_COMPLETIONS: 'christian_habit_completions',
  SPIRITUAL_MILESTONES: 'spiritual_milestones',
} as const;

// Supabase utility functions
export class SupabaseManager {
  // User data operations
  static async syncUserData(userId: string, data: any): Promise<void> {
    try {
      // Handle both Firebase (uid) and Supabase (id) user ID formats
      const actualUserId = userId;
      const { error } = await supabase
        .from(TABLES.USER_PROFILES)
        .upsert({ id: actualUserId, ...data, updated_at: new Date().toISOString() });
      
      if (error) throw error;
    } catch (error) {
      throw error;
    }
  }

  static async getUserData(userId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from(TABLES.USER_PROFILES)
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      return null;
    }
  }


  // Prayer requests operations
  static async savePrayerRequest(userId: string, request: any): Promise<string> {
    try {
      // Prepare the data object, excluding potentially missing columns
      const insertData: any = {
        user_id: userId,
        title: request.title,
        description: request.description,
        created_at: new Date().toISOString(),
        prayer_count: 0,
        is_answered: false,
      };

      // Add optional fields only if they exist in the request
      if (request.category) insertData.category = request.category;
      if (request.is_private !== undefined) insertData.is_private = request.is_private;
      
      // Try to add is_anonymous if it exists in the request
      if (request.is_anonymous !== undefined) {
        insertData.is_anonymous = request.is_anonymous;
      }

      const { data, error } = await supabase
        .from(TABLES.PRAYER_REQUESTS)
        .insert(insertData)
        .select('id')
        .single();
      
      if (error) {
        // If is_anonymous column doesn't exist, try without it
        if (error.code === 'PGRST204' && error.message?.includes('is_anonymous')) {
          delete insertData.is_anonymous;
          
          const { data: retryData, error: retryError } = await supabase
            .from(TABLES.PRAYER_REQUESTS)
            .insert(insertData)
            .select('id')
            .single();
          
          if (retryError) throw retryError;
          return retryData.id;
        }
        throw error;
      }
      return data.id;
    } catch (error) {
      throw error;
    }
  }

  static async getPrayerRequests(userId: string): Promise<any[]> {
    try {
      // First get all prayer requests
      const { data: requests, error: requestsError } = await supabase
        .from(TABLES.PRAYER_REQUESTS)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (requestsError) {
        console.error('Error loading prayer requests:', requestsError);
        throw requestsError;
      }
      
      if (!requests || requests.length === 0) {
        return [];
      }
      
      // Get unique user IDs from the requests
      const userIds = [...new Set(requests.map(r => r.user_id))];
      
      // Fetch user data for all unique user IDs
      const { data: users, error: usersError } = await supabase
        .from(TABLES.USER_PROFILES)
        .select('id, email, first_name, last_name')
        .in('id', userIds);
      
      if (usersError) {
        console.error('Error loading users:', usersError);
        // Continue without user data rather than failing completely
      }
      
      // Create a map of user data for quick lookup
      const userMap = new Map();
      if (users) {
        users.forEach(user => {
          userMap.set(user.id, user);
        });
      }
      
      // Combine prayer requests with user data
      const requestsWithUsers = requests.map(request => ({
        ...request,
        users: userMap.get(request.user_id) || null
      }));
      
      // Debug: Log the data to see what we're getting
      console.log('Prayer requests loaded with user data:', requestsWithUsers?.map(r => ({ 
        id: r.id, 
        title: r.title, 
        user_id: r.user_id,
        users: r.users,
        comments_count: r.comments_count,
        likes_count: r.likes_count 
      })));
      
      return requestsWithUsers;
    } catch (error) {
      console.error('Error loading prayer requests:', error);
      return [];
    }
  }

  static async incrementPrayerCount(requestId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('increment_prayer_count', {
        request_id: requestId
      });
      
      if (error) throw error;
    } catch (error) {
      throw error;
    }
  }

  static async markPrayerAsAnswered(requestId: string, testimony?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(TABLES.PRAYER_REQUESTS)
        .update({
          is_answered: true,
          answered_date: new Date().toISOString(),
          ...(testimony && { testimony })
        })
        .eq('id', requestId);
      
      if (error) throw error;
    } catch (error) {
      throw error;
    }
  }

  static async deletePrayerRequest(requestId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(TABLES.PRAYER_REQUESTS)
        .delete()
        .eq('id', requestId);
      
      if (error) throw error;
    } catch (error) {
      throw error;
    }
  }

  // Social features for prayer requests
  static async likePrayerRequest(userId: string, requestId: string): Promise<void> {
    try {
      // Check if already liked
      const { data: existingLike, error: checkError } = await supabase
        .from('prayer_likes')
        .select('id')
        .eq('prayer_request_id', requestId)
        .eq('user_id', userId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // If table doesn't exist, log warning and return
        if (checkError.code === 'PGRST205' || checkError.message?.includes('prayer_likes')) {
          return;
        }
        throw checkError;
      }

      if (existingLike) {
        // Unlike
        const { error: deleteError } = await supabase
          .from('prayer_likes')
          .delete()
          .eq('prayer_request_id', requestId)
          .eq('user_id', userId);
        
        if (deleteError) throw deleteError;
        
        // Update likes count manually
        const { data: currentRequest } = await supabase
          .from('prayer_requests')
          .select('likes_count')
          .eq('id', requestId)
          .single();
        
        if (currentRequest) {
          await supabase
            .from('prayer_requests')
            .update({ likes_count: Math.max(0, (currentRequest.likes_count || 0) - 1) })
            .eq('id', requestId);
        }
      } else {
        // Like
        const { error: insertError } = await supabase
          .from('prayer_likes')
          .insert({
            prayer_request_id: requestId,
            user_id: userId
          });
        
        if (insertError) throw insertError;
        
        // Update likes count manually
        const { data: currentRequest } = await supabase
          .from('prayer_requests')
          .select('likes_count')
          .eq('id', requestId)
          .single();
        
        if (currentRequest) {
          await supabase
            .from('prayer_requests')
            .update({ likes_count: (currentRequest.likes_count || 0) + 1 })
            .eq('id', requestId);
        }
      }
    } catch (error) {
      // Don't throw error to prevent app crashes
    }
  }

  static async sharePrayerRequest(userId: string, requestId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('prayer_shares')
        .insert({
          prayer_request_id: requestId,
          user_id: userId
        });
      
      if (error) {
        // If table doesn't exist, log warning and return
        if (error.code === 'PGRST205' || error.message?.includes('prayer_shares')) {
          return;
        }
        throw error;
      }
    } catch (error) {
      // Don't throw error to prevent app crashes
    }
  }

  // Social features for daily verses
  static async likeDailyVerse(
    userId: string, 
    verseReference: string, 
    verseText: string, 
    verseDate: string
  ): Promise<{ isLiked: boolean; likesCount: number }> {
    try {
      // Check if already liked
      const { data: existingLike, error: checkError } = await supabase
        .from('daily_verse_likes')
        .select('id')
        .eq('verse_reference', verseReference)
        .eq('verse_date', verseDate)
        .eq('user_id', userId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // If table doesn't exist, log warning and return default values
        if (checkError.code === 'PGRST205' || checkError.message?.includes('daily_verse_likes')) {
          return { isLiked: false, likesCount: 0 };
        }
        throw checkError;
      }

      if (existingLike) {
        // Unlike
        const { error: deleteError } = await supabase
          .from('daily_verse_likes')
          .delete()
          .eq('verse_reference', verseReference)
          .eq('verse_date', verseDate)
          .eq('user_id', userId);
        
        if (deleteError) throw deleteError;
        
        // Get updated likes count
        const { data: likesCount } = await supabase
          .rpc('get_daily_verse_likes_count', {
            p_verse_reference: verseReference,
            p_verse_date: verseDate
          });
        
        return { isLiked: false, likesCount: likesCount || 0 };
      } else {
        // Like
        const { error: insertError } = await supabase
          .from('daily_verse_likes')
          .insert({
            verse_reference: verseReference,
            verse_text: verseText,
            verse_date: verseDate,
            user_id: userId
          });
        
        if (insertError) throw insertError;
        
        // Get updated likes count
        const { data: likesCount } = await supabase
          .rpc('get_daily_verse_likes_count', {
            p_verse_reference: verseReference,
            p_verse_date: verseDate
          });
        
        return { isLiked: true, likesCount: likesCount || 0 };
      }
    } catch (error) {
      // Don't throw error to prevent app crashes
      return { isLiked: false, likesCount: 0 };
    }
  }

  static async getDailyVerseLikesInfo(
    userId: string,
    verseReference: string,
    verseDate: string
  ): Promise<{ isLiked: boolean; likesCount: number }> {
    try {
      // Check if user has liked this verse
      const { data: isLiked } = await supabase
        .rpc('has_user_liked_daily_verse', {
          p_user_id: userId,
          p_verse_reference: verseReference,
          p_verse_date: verseDate
        });

      // Get likes count
      const { data: likesCount } = await supabase
        .rpc('get_daily_verse_likes_count', {
          p_verse_reference: verseReference,
          p_verse_date: verseDate
        });

      return { 
        isLiked: isLiked || false, 
        likesCount: likesCount || 0 
      };
    } catch (error) {
      // Don't throw error to prevent app crashes
      return { isLiked: false, likesCount: 0 };
    }
  }

  static async addComment(userId: string, requestId: string, content: string, parentCommentId?: string): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('prayer_comments')
        .insert({
          prayer_request_id: requestId,
          user_id: userId,
          content,
          parent_comment_id: parentCommentId || null
        })
        .select('id')
        .single();
      
      if (error) {
        if (error.code === 'PGRST205') {
          throw new Error('Comments feature not available. Please contact support to enable social features. Email: support@dailyfaith.com, Website: www.dailyfaith.me, Phone: +13239168235');
        }
        throw error;
      }
      
      console.log('Comment added successfully:', data.id);
      
      // Increment comments count
      try {
        const { error: rpcError } = await supabase.rpc('increment_comments_count', { prayer_id: requestId });
        if (rpcError) {
          console.error('RPC increment_comments_count error:', rpcError);
          // Try manual update as fallback - get current count first
          const { data: currentRequest, error: fetchError } = await supabase
            .from('prayer_requests')
            .select('comments_count')
            .eq('id', requestId)
            .single();
          
          if (!fetchError && currentRequest) {
            const { error: updateError } = await supabase
              .from('prayer_requests')
              .update({ comments_count: (currentRequest.comments_count || 0) + 1 })
              .eq('id', requestId);
            
            if (updateError) {
              console.error('Manual comments count update error:', updateError);
            } else {
              console.log('Manual comments count update successful');
            }
          }
        } else {
          console.log('RPC increment_comments_count successful');
        }
      } catch (rpcError) {
        console.error('Error calling increment_comments_count:', rpcError);
      }
      
      return data.id;
    } catch (error) {
      throw error;
    }
  }

  static async getComments(requestId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('prayer_comments')
        .select('*')
        .eq('prayer_request_id', requestId)
        .is('parent_comment_id', null)
        .order('created_at', { ascending: true });
      
      if (error) {
        if (error.code === 'PGRST205') {
          return [];
        }
        throw error;
      }
      
      // Get user data for each comment and their replies
      const commentsWithUsers = await Promise.all((data || []).map(async (comment) => {
        const { data: userData } = await supabase
          .from(TABLES.USER_PROFILES)
          .select('id, email, first_name, last_name')
          .eq('id', comment.user_id)
          .single();
        
        // Get replies for this comment
        const { data: repliesData } = await supabase
          .from('prayer_comments')
          .select('*')
          .eq('parent_comment_id', comment.id)
          .order('created_at', { ascending: true });
        
        // Get user data for replies
        const repliesWithUsers = await Promise.all((repliesData || []).map(async (reply) => {
          const { data: replyUserData } = await supabase
            .from(TABLES.USER_PROFILES)
            .select('id, email, first_name, last_name')
            .eq('id', reply.user_id)
            .single();
          
          return {
            ...reply,
            users: replyUserData
          };
        }));
        
        return {
          ...comment,
          users: userData,
          replies: repliesWithUsers
        };
      }));
      
      return commentsWithUsers;
    } catch (error) {
      return [];
    }
  }

  // Method to manually count and update comments count
  static async updateCommentsCount(requestId: string): Promise<void> {
    try {
      // Count all comments (including replies)
      const { data: comments, error: countError } = await supabase
        .from('prayer_comments')
        .select('id')
        .eq('prayer_request_id', requestId);
      
      if (countError) {
        console.error('Error counting comments:', countError);
        return;
      }
      
      const totalComments = comments?.length || 0;
      
      // Update the comments count
      const { error: updateError } = await supabase
        .from('prayer_requests')
        .update({ comments_count: totalComments })
        .eq('id', requestId);
      
      if (updateError) {
        console.error('Error updating comments count:', updateError);
      } else {
        console.log(`Updated comments count for request ${requestId} to ${totalComments}`);
      }
    } catch (error) {
      console.error('Error in updateCommentsCount:', error);
    }
  }

  static async getReplies(commentId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('prayer_comments')
        .select('*')
        .eq('parent_comment_id', commentId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      // Get user data for each reply
      const repliesWithUsers = await Promise.all((data || []).map(async (reply) => {
        const { data: userData } = await supabase
          .from(TABLES.USER_PROFILES)
          .select('id, email, first_name, last_name')
          .eq('id', reply.user_id)
          .single();
        
        return {
          ...reply,
          users: userData
        };
      }));
      
      return repliesWithUsers;
    } catch (error) {
      return [];
    }
  }

  static async likeComment(userId: string, commentId: string): Promise<void> {
    try {
      // Check if already liked
      const { data: existingLike, error: checkError } = await supabase
        .from('comment_likes')
        .select('id')
        .eq('comment_id', commentId)
        .eq('user_id', userId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // If table doesn't exist, log warning and return
        if (checkError.code === 'PGRST205' || checkError.message?.includes('comment_likes')) {
          return;
        }
        throw checkError;
      }

      if (existingLike) {
        // Unlike
        const { error: deleteError } = await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', userId);
        
        if (deleteError) throw deleteError;
        
        // Update likes count manually
        const { data: currentComment } = await supabase
          .from('prayer_comments')
          .select('likes_count')
          .eq('id', commentId)
          .single();
        
        if (currentComment) {
          await supabase
            .from('prayer_comments')
            .update({ likes_count: Math.max(0, (currentComment.likes_count || 0) - 1) })
            .eq('id', commentId);
        }
      } else {
        // Like
        const { error: insertError } = await supabase
          .from('comment_likes')
          .insert({
            comment_id: commentId,
            user_id: userId
          });
        
        if (insertError) throw insertError;
        
        // Update likes count manually
        const { data: currentComment } = await supabase
          .from('prayer_comments')
          .select('likes_count')
          .eq('id', commentId)
          .single();
        
        if (currentComment) {
          await supabase
            .from('prayer_comments')
            .update({ likes_count: (currentComment.likes_count || 0) + 1 })
            .eq('id', commentId);
        }
      }
    } catch (error) {
      // Don't throw error to prevent app crashes
    }
  }


  // Prayer sessions operations
  static async savePrayerSession(userId: string, sessionData: any): Promise<void> {
    try {
      const { error } = await supabase
        .from(TABLES.PRAYER_SESSIONS)
        .insert({
          user_id: userId,
          ...sessionData,
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;
    } catch (error) {
      throw error;
    }
  }

  static async getPrayerSessions(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.PRAYER_SESSIONS)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      return [];
    }
  }

  // Practices operations
  static async savePractice(userId: string, practiceData: any): Promise<void> {
    try {
      const { error } = await supabase
        .from(TABLES.PRACTICES)
        .insert({
          user_id: userId,
          ...practiceData,
          created_at: new Date().toISOString(),
          is_active: true,
          streak: 0,
          last_completed: null
        });
      
      if (error) throw error;
    } catch (error) {
      throw error;
    }
  }

  static async getPractices(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.PRACTICES)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      return [];
    }
  }

  static async updatePracticeCompletion(practiceId: string, completed: boolean): Promise<void> {
    try {
      const { error } = await supabase
        .from(TABLES.PRACTICES)
        .update({
          last_completed: new Date().toISOString(),
          streak: completed ? 1 : 0
        })
        .eq('id', practiceId);
      
      if (error) throw error;
    } catch (error) {
      throw error;
    }
  }

  // Memory verses operations
  static async getMemoryVerses(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('memory_verses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      return [];
    }
  }

  // Practice logs operations
  static async getPracticeLogs(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.PRACTICE_LOGS)
        .select(`
          *,
          practices!inner(user_id)
        `)
        .eq('practices.user_id', userId)
        .order('completed', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      return [];
    }
  }



  // Statistics operations
  static async getUserStatistics(userId: string): Promise<any> {
    try {
      const [
        prayerSessions,
        practices,
        readingProgress,
        memoryVerses,
        practiceLogs,
        dailyDevotions,
        gratitudeEntries
      ] = await Promise.all([
        this.getPrayerSessions(userId).catch(() => []),
        this.getPractices(userId).catch(() => []),
        this.getReadingProgress(userId).catch(() => []),
        this.getMemoryVerses(userId).catch(() => []),
        this.getPracticeLogs(userId).catch(() => []),
        this.getDailyDevotions(userId).catch(() => []),
        this.getGratitudeEntries(userId).catch(() => [])
      ]);

      // Ensure all data is arrays
      const safePrayerSessions = Array.isArray(prayerSessions) ? prayerSessions : [];
      const safePractices = Array.isArray(practices) ? practices : [];
      const safeReadingProgress = Array.isArray(readingProgress) ? readingProgress : [];
      const safeMemoryVerses = Array.isArray(memoryVerses) ? memoryVerses : [];
      const safePracticeLogs = Array.isArray(practiceLogs) ? practiceLogs : [];
      const safeDailyDevotions = Array.isArray(dailyDevotions) ? dailyDevotions : [];
      const safeGratitudeEntries = Array.isArray(gratitudeEntries) ? gratitudeEntries : [];

      // Calculate prayer statistics
      const totalPrayerTime = safePrayerSessions.reduce((total: number, session: any) => total + (session.duration || 0), 0);
      const averagePrayerTime = safePrayerSessions.length > 0 ? totalPrayerTime / safePrayerSessions.length : 0;
      const prayerStreak = this.calculatePrayerStreak(safePrayerSessions);
      
      // Calculate reading statistics
      const totalReadingDays = safeReadingProgress.length;
      const readingStreak = this.calculateReadingStreak(safeReadingProgress);
      
      // Calculate practice statistics
      const activePractices = safePractices.filter((p: any) => p.is_active).length;
      const completedPractices = safePracticeLogs.filter((log: any) => log.completed).length;
      
      // Calculate memory verse statistics
      const memorizedVerses = safeMemoryVerses.filter((v: any) => v.is_memorized).length;
      
      // Calculate devotion statistics
      const completedDevotions = safeDailyDevotions.filter((d: any) => d.is_completed).length;
      const devotionStreak = this.calculateDevotionStreak(safeDailyDevotions);
      
      // Calculate gratitude statistics
      const totalGratitudeEntries = safeGratitudeEntries.length;
      
      // Calculate weekly and monthly data for charts
      const prayerData = this.calculatePrayerChartData(safePrayerSessions);
      const readingData = this.calculateReadingChartData(safeReadingProgress);
      const practiceData = this.calculatePracticeChartData(safePracticeLogs);
      
      // Calculate achievements
      const achievements = this.calculateAchievements({
        prayerSessions: safePrayerSessions,
        readingProgress: safeReadingProgress,
        memoryVerses: safeMemoryVerses,
        practiceLogs: safePracticeLogs,
        dailyDevotions: safeDailyDevotions,
        gratitudeEntries: safeGratitudeEntries
      });

      return {
        prayerSessions: safePrayerSessions,
        practices: safePractices,
        readingProgress: safeReadingProgress,
        memoryVerses: safeMemoryVerses,
        practiceLogs: safePracticeLogs,
        dailyDevotions: safeDailyDevotions,
        gratitudeEntries: safeGratitudeEntries,
        
        // Overview stats
        totalDaysActive: Math.max(safePrayerSessions.length, totalReadingDays, completedDevotions),
        currentPrayerStreak: prayerStreak,
        currentReadingStreak: readingStreak,
        currentDevotionStreak: devotionStreak,
        
        // Prayer stats
        totalPrayerTime,
        averagePrayerTime,
        longestPrayerSession: safePrayerSessions.length > 0 ? Math.max(...safePrayerSessions.map((s: any) => s.duration || 0), 0) : 0,
        
        // Reading stats
        totalReadingDays,
        booksCompleted: this.getUniqueBooks(safeReadingProgress).length,
        chaptersRead: this.getUniqueChapters(safeReadingProgress).length,
        
        // Practice stats
        activePractices,
        completedPractices,
        
        // Memory stats
        memorizedVerses,
        totalVerses: memoryVerses.length,
        
        // Devotion stats
        completedDevotions,
        totalDevotions: dailyDevotions.length,
        
        // Gratitude stats
        totalGratitudeEntries,
        
        // Chart data
        prayerData,
        readingData,
        practiceData,
        
        // Achievements
        achievements
      };
    } catch (error) {
      throw error;
    }
  }

  // Helper methods for statistics calculations
  private static calculatePrayerStreak(prayerSessions: any[]): number {
    if (prayerSessions.length === 0) return 0;
    
    const sortedSessions = prayerSessions
      .map(s => new Date(s.created_at))
      .sort((a, b) => b.getTime() - a.getTime());
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < sortedSessions.length; i++) {
      const sessionDate = new Date(sortedSessions[i]);
      sessionDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((today.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === streak) {
        streak++;
      } else if (daysDiff > streak) {
        break;
      }
    }
    
    return streak;
  }

  private static calculateReadingStreak(readingProgress: any[]): number {
    try {
      // Ensure readingProgress is an array
      if (!Array.isArray(readingProgress) || readingProgress.length === 0) {
        return 0;
      }
      
      const sortedProgress = readingProgress
        .filter(r => r && r.date_read) // Filter out invalid entries
        .map(r => new Date(r.date_read))
        .filter(date => !isNaN(date.getTime())) // Filter out invalid dates
        .sort((a, b) => b.getTime() - a.getTime());
      
      if (sortedProgress.length === 0) return 0;
      
      let streak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      for (let i = 0; i < sortedProgress.length; i++) {
        const progressDate = new Date(sortedProgress[i]);
        progressDate.setHours(0, 0, 0, 0);
        
        const daysDiff = Math.floor((today.getTime() - progressDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === streak) {
          streak++;
        } else if (daysDiff > streak) {
          break;
        }
      }
      
      return streak;
    } catch (error) {
      return 0;
    }
  }

  private static calculateDevotionStreak(dailyDevotions: any[]): number {
    if (dailyDevotions.length === 0) return 0;
    
    const completedDevotions = dailyDevotions
      .filter(d => d.is_completed)
      .map(d => new Date(d.date))
      .sort((a, b) => b.getTime() - a.getTime());
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < completedDevotions.length; i++) {
      const devotionDate = new Date(completedDevotions[i]);
      devotionDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((today.getTime() - devotionDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === streak) {
        streak++;
      } else if (daysDiff > streak) {
        break;
      }
    }
    
    return streak;
  }

  private static calculatePrayerChartData(prayerSessions: any[]): any {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Weekly data (last 7 days)
    const weekData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      
      const daySessions = prayerSessions.filter(session => {
        const sessionDate = new Date(session.created_at);
        return sessionDate >= dayStart && sessionDate <= dayEnd;
      });
      
      const totalMinutes = daySessions.reduce((total, session) => total + (session.duration || 0), 0) / 60;
      weekData.push(Math.round(totalMinutes));
    }
    
    // Monthly data (last 30 days)
    const monthData = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      
      const daySessions = prayerSessions.filter(session => {
        const sessionDate = new Date(session.created_at);
        return sessionDate >= dayStart && sessionDate <= dayEnd;
      });
      
      const totalMinutes = daySessions.reduce((total, session) => total + (session.duration || 0), 0) / 60;
      monthData.push(Math.round(totalMinutes));
    }
    
    return { week: weekData, month: monthData };
  }

  private static calculateReadingChartData(readingProgress: any[]): any {
    const now = new Date();
    
    // Weekly data (last 7 days)
    const weekData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      
      const hasReading = readingProgress.some(progress => {
        const progressDate = new Date(progress.date_read);
        return progressDate >= dayStart && progressDate <= dayEnd;
      });
      
      weekData.push(hasReading);
    }
    
    // Monthly data (last 30 days)
    const monthData = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      
      const hasReading = readingProgress.some(progress => {
        const progressDate = new Date(progress.date_read);
        return progressDate >= dayStart && progressDate <= dayEnd;
      });
      
      monthData.push(hasReading);
    }
    
    return { week: weekData, month: monthData };
  }

  private static calculatePracticeChartData(practiceLogs: any[]): any {
    const now = new Date();
    
    // Weekly data (last 7 days)
    const weekData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      
      const dayLogs = practiceLogs.filter(log => {
        const logDate = new Date(log.completed_at);
        return logDate >= dayStart && logDate <= dayEnd && log.completed;
      });
      
      weekData.push(dayLogs.length);
    }
    
    // Monthly data (last 30 days)
    const monthData = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      
      const dayLogs = practiceLogs.filter(log => {
        const logDate = new Date(log.completed_at);
        return logDate >= dayStart && logDate <= dayEnd && log.completed;
      });
      
      monthData.push(dayLogs.length);
    }
    
    return { week: weekData, month: monthData };
  }

  private static getUniqueBooks(readingProgress: any[]): string[] {
    return [...new Set(readingProgress.map(r => r.book))];
  }

  private static getUniqueChapters(readingProgress: any[]): string[] {
    return [...new Set(readingProgress.map(r => `${r.book} ${r.chapter}`))];
  }

  private static calculateAchievements(data: any): any[] {
    const achievements = [];
    
    // First Steps - Complete first prayer session
    if (data.prayerSessions.length > 0) {
      achievements.push({
        id: 1,
        title: 'First Steps',
        description: 'Complete your first prayer session',
        icon: '🎯',
        unlocked: true,
        date: new Date(data.prayerSessions[0].created_at)
      });
    }
    
    // Week Warrior - Pray for 7 consecutive days
    const prayerStreak = this.calculatePrayerStreak(data.prayerSessions);
    if (prayerStreak >= 7) {
      achievements.push({
        id: 2,
        title: 'Week Warrior',
        description: 'Pray for 7 consecutive days',
        icon: '🔥',
        unlocked: true,
        date: new Date()
      });
    }
    
    // Memory Master - Memorize 10 verses
    const memorizedVerses = data.memoryVerses.filter((v: any) => v.is_memorized).length;
    if (memorizedVerses >= 10) {
      achievements.push({
        id: 3,
        title: 'Memory Master',
        description: 'Memorize 10 verses',
        icon: '🧠',
        unlocked: true,
        date: new Date()
      });
    }
    
    // Reading Champion - Read for 30 days
    const readingStreak = this.calculateReadingStreak(data.readingProgress);
    if (readingStreak >= 30) {
      achievements.push({
        id: 4,
        title: 'Reading Champion',
        description: 'Read for 30 consecutive days',
        icon: '📚',
        unlocked: true,
        date: new Date()
      });
    }
    
    // Gratitude Guru - Write 50 gratitude entries
    if (data.gratitudeEntries.length >= 50) {
      achievements.push({
        id: 5,
        title: 'Gratitude Guru',
        description: 'Write 50 gratitude entries',
        icon: '🙏',
        unlocked: true,
        date: new Date()
      });
    }
    
    return achievements;
  }

  // Backup and restore operations
  static async backupData(userId: string, data: any): Promise<void> {
    try {
      const { error } = await supabase
        .from(TABLES.USER_PROFILES)
        .upsert({
          id: userId,
          ...data,
          last_backup: new Date().toISOString()
        });
      
      if (error) throw error;
    } catch (error) {
      throw error;
    }
  }

  static async restoreData(userId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from(TABLES.USER_PROFILES)
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      return null;
    }
  }

  static async getLikes(requestId: string): Promise<any[]> {
    try {
      // First get all likes for the request
      const { data: likes, error: likesError } = await supabase
        .from('prayer_likes')
        .select('*')
        .eq('prayer_request_id', requestId)
        .order('created_at', { ascending: false });
      
      if (likesError) {
        // If table doesn't exist or relationship is missing
        if (likesError.code === 'PGRST205' || likesError.code === 'PGRST200' || likesError.message?.includes('prayer_likes')) {
          return [];
        }
        throw likesError;
      }
      
      if (!likes || likes.length === 0) {
        return [];
      }
      
      // Get unique user IDs from the likes
      const userIds = [...new Set(likes.map(l => l.user_id))];
      
      // Fetch user data for all unique user IDs
      const { data: users, error: usersError } = await supabase
        .from(TABLES.USER_PROFILES)
        .select('id, email, first_name, last_name')
        .in('id', userIds);
      
      if (usersError) {
        console.error('Error loading users for likes:', usersError);
        // Continue without user data rather than failing completely
      }
      
      // Create a map of user data for quick lookup
      const userMap = new Map();
      if (users) {
        users.forEach(user => {
          userMap.set(user.id, user);
        });
      }
      
      // Combine likes with user data
      const likesWithUsers = likes.map(like => ({
        ...like,
        users: userMap.get(like.user_id) || null
      }));
      
      return likesWithUsers;
    } catch (error) {
      console.error('Error loading likes:', error);
      return [];
    }
  }

  static async hasUserLikedPrayerRequest(userId: string, requestId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('prayer_likes')
        .select('id')
        .eq('prayer_request_id', requestId)
        .eq('user_id', userId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          return false; // No like found
        }
        if (error.code === 'PGRST205' || error.message?.includes('prayer_likes')) {
          return false; // Table doesn't exist
        }
        throw error;
      }
      
      return !!data;
    } catch (error) {
      return false;
    }
  }

  static async hasUserLikedComment(userId: string, commentId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('comment_likes')
        .select('id')
        .eq('comment_id', commentId)
        .eq('user_id', userId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          return false; // No like found
        }
        if (error.code === 'PGRST205' || error.message?.includes('comment_likes')) {
          return false; // Table doesn't exist
        }
        throw error;
      }
      
      return !!data;
    } catch (error) {
      return false;
    }
  }

  // Fasting Records

  static async getPrayerSessionStats(userId: string): Promise<{
    totalSessions: number;
    totalTime: number;
    averageTime: number;
    thisWeekSessions: number;
    thisWeekTime: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('prayer_sessions')
        .select('duration, completed_at')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false });
      
      if (error) throw error;
      
      const sessions = data || [];
      const totalSessions = sessions.length;
      const totalTime = sessions.reduce((sum, session) => sum + session.duration, 0);
      const averageTime = totalSessions > 0 ? totalTime / totalSessions : 0;
      
      // Calculate this week's sessions
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const thisWeekSessions = sessions.filter(session => 
        new Date(session.completed_at) >= oneWeekAgo
      );
      const thisWeekTime = thisWeekSessions.reduce((sum, session) => sum + session.duration, 0);
      
      return {
        totalSessions,
        totalTime,
        averageTime,
        thisWeekSessions: thisWeekSessions.length,
        thisWeekTime
      };
    } catch (error) {
      return {
        totalSessions: 0,
        totalTime: 0,
        averageTime: 0,
        thisWeekSessions: 0,
        thisWeekTime: 0
      };
    }
  }



  // ===== CHRISTIAN HABITS METHODS =====

  // Daily Devotions
  static async saveDailyDevotion(userId: string, devotionData: {
    title: string;
    scripture_reference?: string;
    scripture_text?: string;
    devotion_text: string;
    reflection_questions?: string[];
    prayer_points?: string[];
    date?: string;
    notes?: string;
  }): Promise<string> {
    try {
      const { data, error } = await supabase
        .from(TABLES.DAILY_DEVOTIONS)
        .insert({
          user_id: userId,
          ...devotionData,
          date: devotionData.date || new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();
      
      if (error) throw error;
      return data.id;
    } catch (error) {
      throw error;
    }
  }

  static async getDailyDevotions(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.DAILY_DEVOTIONS)
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      return [];
    }
  }

  static async markDevotionComplete(userId: string): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Check if devotion already exists for today
      const { data: existingDevotion } = await supabase
        .from(TABLES.DAILY_DEVOTIONS)
        .select('id')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

      if (existingDevotion) {
        // Update existing devotion
        const { error } = await supabase
          .from(TABLES.DAILY_DEVOTIONS)
          .update({ is_completed: true, completed_at: new Date().toISOString() })
          .eq('id', existingDevotion.id);
        
        if (error) throw error;
      } else {
        // Create new devotion record
        const { error } = await supabase
          .from(TABLES.DAILY_DEVOTIONS)
          .insert({
            user_id: userId,
            date: today,
            is_completed: true,
            completed_at: new Date().toISOString(),
            created_at: new Date().toISOString()
          });
        
        if (error) throw error;
      }
    } catch (error) {
      throw error;
    }
  }

  static async markDevotionIncomplete(userId: string): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { error } = await supabase
        .from(TABLES.DAILY_DEVOTIONS)
        .update({ is_completed: false, completed_at: null })
        .eq('user_id', userId)
        .eq('date', today);
      
      if (error) throw error;
    } catch (error) {
      throw error;
    }
  }

  static async getTodayDevotion(userId: string): Promise<any> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from(TABLES.DAILY_DEVOTIONS)
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .eq('is_completed', true)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        return null;
      }
      return data;
    } catch (error) {
      return null;
    }
  }

  static async getReadingProgress(userId: string): Promise<any[]> {
    try {
      // For now, return empty array since we don't have a dedicated reading sessions table
      // This should be replaced with actual reading data when the table is created
      return [];
    } catch (error) {
      return [];
    }
  }

  // Fasting Records
  static async saveFastingRecord(userId: string, fastingData: {
    type: string;
    description?: string;
    start_time: string;
    end_time?: string;
    duration_minutes?: number;
    purpose?: string;
    prayer_focus?: string;
    notes?: string;
  }): Promise<string> {
    try {
      // First, ensure the user exists in the users table
      await this.ensureUserExists(userId);
      
      const { data, error } = await supabase
        .from(TABLES.FASTING_RECORDS)
        .insert({
          user_id: userId,
          ...fastingData,
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();
      
      if (error) throw error;
      return data.id;
    } catch (error) {
      throw error;
    }
  }

  // Update existing fasting record (for ending fasts)
  static async updateFastingRecord(recordId: string, updateData: {
    end_time?: string;
    duration_minutes?: number;
    notes?: string;
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from(TABLES.FASTING_RECORDS)
        .update(updateData)
        .eq('id', recordId);
      
      if (error) {
        throw error;
      }
    } catch (error) {
      throw error;
    }
  }

  static async getFastingRecords(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.FASTING_RECORDS)
        .select('*')
        .eq('user_id', userId)
        .order('start_time', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      return [];
    }
  }

  // Delete fasting record
  static async deleteFastingRecord(recordId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(TABLES.FASTING_RECORDS)
        .delete()
        .eq('id', recordId);
      
      if (error) {
        throw error;
      }
    } catch (error) {
      throw error;
    }
  }

  // Worship Sessions
  static async saveWorshipSession(userId: string, sessionData: {
    type: string;
    duration_minutes: number;
    songs?: string[];
    scripture_focus?: string;
    notes?: string;
    location?: string;
  }): Promise<string> {
    try {
      const { data, error } = await supabase
        .from(TABLES.WORSHIP_SESSIONS)
        .insert({
          user_id: userId,
          ...sessionData,
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();
      
      if (error) throw error;
      return data.id;
    } catch (error) {
      throw error;
    }
  }

  static async getWorshipSessions(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.WORSHIP_SESSIONS)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      return [];
    }
  }

  // Gratitude Entries
  static async saveGratitudeEntry(userId: string, entryData: {
    entries: string[];
    prayer_of_thanksgiving?: string;
    date?: string;
  }): Promise<string> {
    try {
      const date = entryData.date || new Date().toISOString().split('T')[0];
      
      
      // First, ensure the user exists in the users table
      await this.ensureUserExists(userId);
      
      // Try to save the gratitude entry
      const { data, error } = await supabase
        .from(TABLES.GRATITUDE_ENTRIES)
        .upsert({
          user_id: userId,
          entries: entryData.entries,
          prayer_of_thanksgiving: entryData.prayer_of_thanksgiving || null,
          date: date,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,date'
        })
        .select('id')
        .single();
      
      
      if (error) {
        // If it's a foreign key constraint error, try to create the user first
        if (error.code === '23503') {
          await this.createUserRecord(userId);
          
          // Try again after creating user
          const { data: retryData, error: retryError } = await supabase
            .from(TABLES.GRATITUDE_ENTRIES)
            .upsert({
              user_id: userId,
              entries: entryData.entries,
              prayer_of_thanksgiving: entryData.prayer_of_thanksgiving || null,
              date: date,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'user_id,date'
            })
            .select('id')
            .single();
          
          if (retryError) {
            throw retryError;
          }
          
          return retryData.id;
        }
        
        throw error;
      }
      
      return data.id;
    } catch (error) {
      // Return a fallback ID for now to prevent app crashes
      return 'temp-id-' + Date.now();
    }
  }

  // Helper method to ensure user exists in users table
  static async ensureUserExists(userId: string): Promise<void> {
    try {
      // Check if user exists
      const { data: existingUser, error: checkError } = await supabase
        .from(TABLES.USERS)
        .select('id')
        .eq('id', userId)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }
      
      // If user doesn't exist, create them
      if (!existingUser) {
        await this.createUserRecord(userId);
      }
    } catch (error) {
      // Don't throw here, let the calling function handle it
    }
  }

  // Helper method to create user record
  static async createUserRecord(userId: string): Promise<void> {
    try {
      const { error: insertError } = await supabase
        .from(TABLES.USERS)
        .insert({
          id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (insertError) {
        throw insertError;
      }
    } catch (error) {
      throw error;
    }
  }

  static async getGratitudeEntries(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.GRATITUDE_ENTRIES)
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      return [];
    }
  }

  // Service Records
  static async saveServiceRecord(userId: string, serviceData: {
    type: string;
    organization?: string;
    activity: string;
    duration_hours: number;
    date: string;
    description?: string;
    impact_notes?: string;
  }): Promise<string> {
    try {
      const { data, error } = await supabase
        .from(TABLES.SERVICE_RECORDS)
        .insert({
          user_id: userId,
          ...serviceData,
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();
      
      if (error) throw error;
      return data.id;
    } catch (error) {
      throw error;
    }
  }

  static async getServiceRecords(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.SERVICE_RECORDS)
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      return [];
    }
  }

  // Christian Books
  static async saveChristianBook(userId: string, bookData: {
    title: string;
    author?: string;
    category?: string;
    current_page?: number;
    total_pages?: number;
    status?: string;
    start_date?: string;
    completion_date?: string;
    rating?: number;
    notes?: string;
  }): Promise<string> {
    try {
      const { data, error } = await supabase
        .from(TABLES.CHRISTIAN_BOOKS)
        .insert({
          user_id: userId,
          ...bookData,
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();
      
      if (error) throw error;
      return data.id;
    } catch (error) {
      throw error;
    }
  }

  static async getChristianBooks(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.CHRISTIAN_BOOKS)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      return [];
    }
  }

  static async updateBookProgress(bookId: string, currentPage: number): Promise<void> {
    try {
      const { error } = await supabase
        .from(TABLES.CHRISTIAN_BOOKS)
        .update({ 
          current_page: currentPage,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookId);
      
      if (error) throw error;
    } catch (error) {
      throw error;
    }
  }

  // Christian Habit Templates
  static async getHabitTemplates(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.CHRISTIAN_HABIT_TEMPLATES)
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      
      // If no templates exist, insert default ones
      if (!data || data.length === 0) {
        await this.insertDefaultTemplates();
        // Fetch again after inserting defaults
        const { data: newData, error: newError } = await supabase
          .from(TABLES.CHRISTIAN_HABIT_TEMPLATES)
          .select('*')
          .order('name', { ascending: true });
        
        if (newError) throw newError;
        return newData || [];
      }
      
      return data || [];
    } catch (error) {
      return [];
    }
  }

  // Insert default habit templates
  static async insertDefaultTemplates(): Promise<void> {
    try {
      const defaultTemplates = [
        {
          name: 'Morning Prayer',
          description: 'Start each day with prayer and thanksgiving',
          category: 'prayer',
          frequency: 'daily',
          suggested_duration: 15,
          scripture_reference: 'Psalm 5:3',
          benefits: ['Peaceful start to day', 'Better focus', 'Spiritual strength', 'Divine guidance'],
          difficulty_level: 1,
          is_default: true
        },
        {
          name: 'Bible Study',
          description: 'Daily scripture reading and meditation',
          category: 'study',
          frequency: 'daily',
          suggested_duration: 30,
          scripture_reference: 'Psalm 119:105',
          benefits: ['Spiritual growth', 'Wisdom', 'Guidance', 'Understanding'],
          difficulty_level: 2,
          is_default: true
        },
        {
          name: 'Evening Reflection',
          description: 'End day with gratitude and prayer',
          category: 'prayer',
          frequency: 'daily',
          suggested_duration: 10,
          scripture_reference: 'Psalm 4:8',
          benefits: ['Better sleep', 'Gratitude', 'Peace', 'Rest'],
          difficulty_level: 1,
          is_default: true
        },
        {
          name: 'Worship Time',
          description: 'Personal worship and praise',
          category: 'worship',
          frequency: 'daily',
          suggested_duration: 20,
          scripture_reference: 'Psalm 100:2',
          benefits: ['Joy', 'Connection with God', 'Spiritual renewal', 'Praise'],
          difficulty_level: 1,
          is_default: true
        },
        {
          name: 'Gratitude Journal',
          description: 'Daily gratitude practice',
          category: 'prayer',
          frequency: 'daily',
          suggested_duration: 5,
          scripture_reference: '1 Thessalonians 5:18',
          benefits: ['Positive mindset', 'Thankfulness', 'Joy', 'Contentment'],
          difficulty_level: 1,
          is_default: true
        },
        {
          name: 'Scripture Memory',
          description: 'Memorize and meditate on verses',
          category: 'study',
          frequency: 'daily',
          suggested_duration: 15,
          scripture_reference: 'Psalm 119:11',
          benefits: ['Spiritual armor', 'Wisdom', 'Comfort', 'Guidance'],
          difficulty_level: 2,
          is_default: true
        },
        {
          name: 'Service/Volunteer',
          description: 'Regular service to others',
          category: 'service',
          frequency: 'weekly',
          suggested_duration: 120,
          scripture_reference: 'Matthew 25:40',
          benefits: ['Purpose', 'Love in action', 'Community', 'Humility'],
          difficulty_level: 2,
          is_default: true
        },
        {
          name: 'Fellowship',
          description: 'Connect with other believers',
          category: 'fellowship',
          frequency: 'weekly',
          suggested_duration: 60,
          scripture_reference: 'Hebrews 10:25',
          benefits: ['Encouragement', 'Accountability', 'Community', 'Growth'],
          difficulty_level: 1,
          is_default: true
        }
      ];

      const { error } = await supabase
        .from(TABLES.CHRISTIAN_HABIT_TEMPLATES)
        .insert(defaultTemplates);

      if (error) throw error;
    } catch (error) {
    }
  }

  // Christian Habits
  static async saveChristianHabit(userId: string, habitData: {
    template_id?: string;
    name: string;
    description?: string;
    category: string;
    frequency: string;
    target_duration?: number;
    reminder_time?: string;
    reminder_days?: number[];
  }): Promise<string> {
    try {
      const { data, error } = await supabase
        .from(TABLES.CHRISTIAN_HABITS)
        .insert({
          user_id: userId,
          ...habitData,
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();
      
      if (error) throw error;
      return data.id;
    } catch (error) {
      throw error;
    }
  }

  static async getChristianHabits(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.CHRISTIAN_HABITS)
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      return [];
    }
  }

  static async completeChristianHabit(habitId: string, userId: string, completionData: {
    duration_minutes?: number;
    notes?: string;
    scripture_reference?: string;
    prayer_focus?: string;
  }): Promise<void> {
    try {
      // Insert completion record directly
      const { error: insertError } = await supabase
        .from(TABLES.CHRISTIAN_HABIT_COMPLETIONS)
        .insert({
          habit_id: habitId,
          user_id: userId,
          completion_date: new Date().toISOString().split('T')[0],
          duration_minutes: completionData.duration_minutes || null,
          notes: completionData.notes || null,
          scripture_reference: completionData.scripture_reference || null,
          prayer_focus: completionData.prayer_focus || null
        });

      if (insertError) {
        throw insertError;
      }

      // Update habit streak manually (bypassing the problematic function)
      // First get the current values
      const { data: currentHabit, error: fetchError } = await supabase
        .from(TABLES.CHRISTIAN_HABITS)
        .select('current_streak, longest_streak, total_completions')
        .eq('id', habitId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      const newStreak = (currentHabit.current_streak || 0) + 1;
      const newLongestStreak = Math.max(currentHabit.longest_streak || 0, newStreak);
      const newTotalCompletions = (currentHabit.total_completions || 0) + 1;

      const { error: updateError } = await supabase
        .from(TABLES.CHRISTIAN_HABITS)
        .update({
          current_streak: newStreak,
          longest_streak: newLongestStreak,
          total_completions: newTotalCompletions,
          last_completed: new Date().toISOString()
        })
        .eq('id', habitId);

      if (updateError) {
        throw updateError;
      }
    } catch (error) {
      throw error;
    }
  }

  static async getHabitCompletions(habitId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.CHRISTIAN_HABIT_COMPLETIONS)
        .select('*')
        .eq('habit_id', habitId)
        .order('completion_date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      return [];
    }
  }

  static async updateChristianHabit(habitId: string, habitData: {
    name?: string;
    description?: string;
    category?: string;
    frequency?: string;
    target_duration?: number;
    reminder_time?: string;
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from(TABLES.CHRISTIAN_HABITS)
        .update({
          ...habitData,
          updated_at: new Date().toISOString()
        })
        .eq('id', habitId);
      
      if (error) throw error;
    } catch (error) {
      throw error;
    }
  }

  static async deleteChristianHabit(habitId: string): Promise<void> {
    try {
      // First, let's check if the habit exists and get its details
      const { data: habitData, error: fetchError } = await supabase
        .from(TABLES.CHRISTIAN_HABITS)
        .select('*')
        .eq('id', habitId)
        .single();
      
      if (fetchError) {
        throw new Error(`Habit not found: ${fetchError.message}`);
      }
      // Delete all related completions first
      const { error: completionsError } = await supabase
        .from(TABLES.CHRISTIAN_HABIT_COMPLETIONS)
        .delete()
        .eq('habit_id', habitId);
      
      if (completionsError) {
        throw new Error(`Failed to delete completions: ${completionsError.message}`);
      }
      // Now delete the habit itself
      const { error: habitError } = await supabase
        .from(TABLES.CHRISTIAN_HABITS)
        .delete()
        .eq('id', habitId);
      
      if (habitError) {
        throw new Error(`Failed to delete habit: ${habitError.message}`);
      }
    } catch (error) {
      throw error;
    }
  }

  // Spiritual Milestones
  static async saveSpiritualMilestone(userId: string, milestoneData: {
    title: string;
    description?: string;
    type: string;
    date_achieved: string;
    scripture_reference?: string;
    testimony?: string;
    is_public?: boolean;
  }): Promise<string> {
    try {
      const { data, error } = await supabase
        .from(TABLES.SPIRITUAL_MILESTONES)
        .insert({
          user_id: userId,
          ...milestoneData,
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();
      
      if (error) throw error;
      return data.id;
    } catch (error) {
      throw error;
    }
  }

  static async getSpiritualMilestones(userId: string, includePublic: boolean = false): Promise<any[]> {
    try {
      let query = supabase
        .from(TABLES.SPIRITUAL_MILESTONES)
        .select('*')
        .eq('user_id', userId);

      if (includePublic) {
        query = supabase
          .from(TABLES.SPIRITUAL_MILESTONES)
          .select('*')
          .or(`user_id.eq.${userId},is_public.eq.true`);
      }

      const { data, error } = await query.order('date_achieved', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      return [];
    }
  }

  // Enhanced Statistics for Christian Habits
  static async getChristianHabitsStatistics(userId: string): Promise<any> {
    try {
      const [
        habits,
        completions,
        devotions,
        fastingRecords,
        worshipSessions,
        gratitudeEntries,
        serviceRecords,
        books,
        milestones
      ] = await Promise.all([
        this.getChristianHabits(userId),
        this.getHabitCompletions(''), // This would need to be modified to get all completions
        this.getDailyDevotions(userId),
        this.getFastingRecords(userId),
        this.getWorshipSessions(userId),
        this.getGratitudeEntries(userId),
        this.getServiceRecords(userId),
        this.getChristianBooks(userId),
        this.getSpiritualMilestones(userId)
      ]);

      return {
        habits,
        totalHabits: habits.length,
        activeHabits: habits.filter(h => h.is_active).length,
        totalCompletions: completions.length,
        devotions,
        fastingRecords,
        worshipSessions,
        gratitudeEntries,
        serviceRecords,
        books,
        milestones,
        // Calculate streaks and other metrics
        averageStreak: habits.length > 0 ? habits.reduce((sum, h) => sum + h.current_streak, 0) / habits.length : 0,
        longestStreak: Math.max(...habits.map(h => h.longest_streak), 0)
      };
    } catch (error) {
      return {
        habits: [],
        totalHabits: 0,
        activeHabits: 0,
        totalCompletions: 0,
        devotions: [],
        fastingRecords: [],
        worshipSessions: [],
        gratitudeEntries: [],
        serviceRecords: [],
        books: [],
        milestones: [],
        averageStreak: 0,
        longestStreak: 0
      };
    }
  }

  // Notification and reminder operations
  static async saveNotificationSettings(userId: string, settings: any): Promise<void> {
    try {
      const { error } = await supabase
        .from(TABLES.USER_PROFILES)
        .upsert({
          id: userId,
          notification_settings: settings,
          updated_at: new Date().toISOString()
        });
      
      if (error) {
        // If table doesn't exist, log warning and return
        if (error.code === 'PGRST205' || error.message?.includes('user_profiles')) {
          return;
        }
        throw error;
      }
    } catch (error) {
      // Don't throw error to prevent app crashes
    }
  }

  static async getNotificationSettings(userId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from(TABLES.USER_PROFILES)
        .select('notification_settings')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        // If table doesn't exist, return default settings
        if (error.code === 'PGRST205' || error.message?.includes('user_profiles')) {
          return this.getDefaultNotificationSettings();
        }
        throw error;
      }
      
      // If no profile exists, return default settings
      if (!data) {
        return this.getDefaultNotificationSettings();
      }
      
      return data.notification_settings || this.getDefaultNotificationSettings();
    } catch (error) {
      // Return default settings instead of throwing error
      return this.getDefaultNotificationSettings();
    }
  }

  static getDefaultNotificationSettings() {
    return {
      prayerNotifications: true,
      likeNotifications: true,
      commentNotifications: true,
      replyNotifications: true,
      quietHours: {
        enabled: false,
        start: "22:00",
        end: "07:00"
      },
      soundEnabled: true,
      vibrationEnabled: true
    };
  }

  static async scheduleReminder(userId: string, reminderData: any): Promise<string> {
    try {
      // Map the data to match database schema
      const insertData = {
        user_id: userId,
        title: reminderData.title,
        body: reminderData.body,
        type: reminderData.type,
        scheduled_time: reminderData.scheduledTime,
        is_recurring: reminderData.isRecurring || false,
        is_active: true,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('reminders')
        .insert(insertData)
        .select('id')
        .single();
      
      if (error) {
        // If the table doesn't exist, return a mock ID
        if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
          return '00000000-0000-0000-0000-000000000001';
        }
        throw error;
      }
      return data.id;
    } catch (error) {
      // Return a mock ID instead of throwing to prevent app crashes
      return '00000000-0000-0000-0000-000000000001';
    }
  }

  static async updateReminder(reminderId: string, reminderData: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('reminders')
        .update({
          ...reminderData,
          updated_at: new Date().toISOString()
        })
        .eq('id', reminderId);
      
      if (error) {
        // If the table doesn't exist, just log and return
        if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
          return;
        }
        throw error;
      }
    } catch (error) {
      // Don't throw to prevent app crashes
    }
  }

  static async deleteReminder(reminderId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('reminders')
        .update({
          is_active: false,
          deleted_at: new Date().toISOString()
        })
        .eq('id', reminderId);
      
      if (error) {
        // If the table doesn't exist, just log and return
        if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
          return;
        }
        throw error;
      }
    } catch (error) {
      // Don't throw to prevent app crashes
    }
  }

  static async getUserReminders(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) {
        // If the table doesn't exist, return empty array instead of throwing
        if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
          return [];
        }
        throw error;
      }
      return data || [];
    } catch (error) {
      // Return empty array instead of throwing to prevent app crashes
      return [];
    }
  }

  static async logNotificationSent(userId: string, notificationData: any): Promise<void> {
    try {
      // Map the data to match database schema
      const insertData = {
        user_id: userId,
        type: notificationData.type,
        title: notificationData.title,
        body: notificationData.body,
        sent_at: notificationData.sentAt || new Date().toISOString(),
        prayer_request_id: notificationData.prayerRequestId,
        actor_user_id: notificationData.actorUserId,
        actor_name: notificationData.actorName,
        notification_id: notificationData.notificationId,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('notification_history')
        .insert(insertData);
      
      if (error) {
        // If the table doesn't exist, log warning and return
        if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
          return;
        }
        throw error;
      }
    } catch (error) {
      // Don't throw to prevent app crashes
    }
  }

  static async getNotificationHistory(userId: string, limit: number = 50): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('notification_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        // If the table doesn't exist, return empty array
        if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
          return [];
        }
        throw error;
      }
      return data || [];
    } catch (error) {
      // Return empty array instead of throwing to prevent app crashes
      return [];
    }
  }

  static async updateNotificationPreferences(userId: string, preferences: any): Promise<void> {
    try {
      // Use the upsert function instead of direct upsert
      const { data, error } = await supabase
        .rpc('upsert_user_profile', {
          p_user_id: userId,
          p_notification_preferences: preferences
        });
      
      if (error) {
        // If the function doesn't exist, try direct upsert as fallback
        if (error.code === '42883' || error.message?.includes('function does not exist')) {
          const { error: upsertError } = await supabase
            .from(TABLES.USER_PROFILES)
            .upsert({
              id: userId,
              notification_preferences: preferences,
              updated_at: new Date().toISOString()
            });
          
          if (upsertError) {
            return;
          }
        }
        return;
      }
    } catch (error) {
      // Don't throw to prevent app crashes
    }
  }


}
