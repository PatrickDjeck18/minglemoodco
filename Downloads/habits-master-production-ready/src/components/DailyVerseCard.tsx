import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Share,
  Alert,
  Clipboard,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { DailyVerse } from '../services/BibleApiService';
import { SupabaseManager } from '../utils/supabase';

interface DailyVerseCardProps {
  verse: DailyVerse;
  loading?: boolean;
  onRefresh?: () => void;
  style?: any;
}

const { width } = Dimensions.get('window');

const DailyVerseCard: React.FC<DailyVerseCardProps> = ({
  verse,
  loading = false,
  onRefresh,
  style,
}) => {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  
  
  // Validate verse data
  if (!verse || !verse.text || !verse.reference) {
    console.error('DailyVerseCard - Invalid verse data:', verse);
    return (
      <View style={[styles.container, style, { backgroundColor: '#f0f0f0', padding: 20, margin: 20, borderRadius: 12 }]}>
        <Text style={{ fontSize: 16, textAlign: 'center', color: '#666' }}>
          Daily Verse
        </Text>
        <Text style={{ fontSize: 14, textAlign: 'center', color: '#999', marginTop: 8 }}>
          Loading today's inspiration...
        </Text>
      </View>
    );
  }
  
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [isLiked, setIsLiked] = useState(verse.isLiked || false);
  const [likesCount, setLikesCount] = useState(verse.likesCount || 0);
  const [isLiking, setIsLiking] = useState(false);
  
  // Animation values - Start visible to prevent invisible rendering
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const actionsAnim = useRef(new Animated.Value(0)).current;
  const likeAnim = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    // Entrance animation - start from visible state
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Load likes info when component mounts or user changes
  useEffect(() => {
    const loadLikesInfo = async () => {
      if (user?.id) {
        try {
          const likesInfo = await SupabaseManager.getDailyVerseLikesInfo(
            user.id,
            verse.reference,
            verse.date
          );
          setIsLiked(likesInfo.isLiked);
          setLikesCount(likesInfo.likesCount);
        } catch (error) {
        }
      }
    };

    loadLikesInfo();
  }, [user?.id, verse.reference, verse.date]);

  const toggleBookmark = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setIsBookmarked(!isBookmarked);
    } catch (error) {
      // Fallback if haptics not available
      setIsBookmarked(!isBookmarked);
    }
  };

  const toggleLike = async () => {
    if (!user?.id || isLiking) return;

    try {
      setIsLiking(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Optimistic update
      const newIsLiked = !isLiked;
      const newLikesCount = newIsLiked ? likesCount + 1 : Math.max(0, likesCount - 1);
      
      setIsLiked(newIsLiked);
      setLikesCount(newLikesCount);

      // Like animation
      Animated.sequence([
        Animated.timing(likeAnim, {
          toValue: 1.2,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(likeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();

      // Update in database
      const result = await SupabaseManager.likeDailyVerse(
        user.id,
        verse.reference,
        verse.text,
        verse.date
      );

      // Update with actual result
      setIsLiked(result.isLiked);
      setLikesCount(result.likesCount);
    } catch (error) {
      // Revert optimistic update on error
      setIsLiked(!isLiked);
      setLikesCount(likesCount);
    } finally {
      setIsLiking(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await Clipboard.setString(`"${verse.text}"\n\n— ${verse.reference}`);
      Alert.alert('Copied!', 'Verse copied to clipboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy verse');
    }
  };

  const shareVerse = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await Share.share({
        message: `"${verse.text}"\n\n— ${verse.reference}\n\nShared from FaithHabits App`,
        title: 'Daily Verse',
        url: 'https://faithhabits.app', // Replace with your app URL
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share verse');
    }
  };

  const toggleActions = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      // Fallback if haptics not available
    }
    
    const toValue = showActions ? 0 : 1;
    setShowActions(!showActions);
    
    Animated.timing(actionsAnim, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleRefresh = async () => {
    if (onRefresh) {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (error) {
        // Fallback if haptics not available
      }
      
      // Add refresh animation
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
      
      onRefresh();
    }
  };

  if (loading) {
    console.log('DailyVerseCard - Rendering loading state');
    return (
      <Animated.View
        style={[
          styles.container,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
          style,
        ]}
      >
        <View style={[styles.blurContainer, { backgroundColor: colors.background + '90' }]}>
          <View style={styles.loadingContainer}>
            <Animated.View style={styles.loadingDots}>
              <View style={[styles.dot, { backgroundColor: colors.primary }]} />
              <View style={[styles.dot, { backgroundColor: colors.primary }]} />
              <View style={[styles.dot, { backgroundColor: colors.primary }]} />
            </Animated.View>
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading today's verse...
            </Text>
          </View>
        </View>
      </Animated.View>
    );
  }

  
  
  return (
    <Animated.View
      style={[
        styles.container,
        { 
          opacity: fadeAnim, 
          transform: [
            { scale: scaleAnim },
            { translateY: slideAnim }
          ] 
        },
        style,
      ]}
    >
      <View style={[styles.blurContainer, { backgroundColor: colors.background + '90' }]}>
        
        {/* Header with actions */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Daily Verse</Text>
            <Text style={[styles.dateText, { color: colors.textSecondary }]}>
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.border + '20' }]}
              onPress={toggleBookmark}
              accessibilityLabel={isBookmarked ? 'Remove bookmark' : 'Bookmark verse'}
              accessibilityRole="button"
              accessibilityHint="Tap to bookmark or remove bookmark from this verse"
            >
              <Ionicons 
                name={isBookmarked ? 'bookmark' : 'bookmark-outline'} 
                size={20} 
                color={isBookmarked ? colors.primary : colors.textSecondary} 
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.border + '20' }]}
              onPress={handleRefresh}
              accessibilityLabel="Refresh daily verse"
              accessibilityRole="button"
              accessibilityHint="Tap to refresh and get a new daily verse"
            >
              <Ionicons name="refresh" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.border + '20' }]}
              onPress={toggleActions}
              accessibilityLabel={showActions ? 'Hide actions' : 'Show actions'}
              accessibilityRole="button"
              accessibilityHint="Tap to show or hide additional actions for this verse"
            >
              <Ionicons 
                name={showActions ? 'chevron-up' : 'chevron-down'} 
                size={20} 
                color={colors.textSecondary} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Verse content */}
        <View style={styles.verseContainer}>
          <LinearGradient
            colors={[colors.primary + '10', colors.primary + '05']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.verseGradient}
          >
            <Text style={[styles.verseText, { color: colors.text }]}>
              "{verse.text}"
            </Text>
            <View style={styles.verseReferenceContainer}>
              <View style={[styles.referenceLine, { backgroundColor: colors.primary }]} />
              <Text style={[styles.verseReference, { color: colors.primary }]}>
                {verse.reference}
              </Text>
            </View>
            
            {/* Like button positioned at bottom right */}
            <View style={styles.likeButtonContainer}>
              <TouchableOpacity
                style={[styles.likeButton, { backgroundColor: colors.background + '80' }]}
                onPress={toggleLike}
                disabled={!user?.id || isLiking}
                accessibilityLabel={isLiked ? 'Unlike verse' : 'Like verse'}
                accessibilityRole="button"
                accessibilityHint="Tap to like or unlike this verse"
              >
                <Animated.View style={{ transform: [{ scale: likeAnim }] }}>
                  <Ionicons 
                    name={isLiked ? 'heart' : 'heart-outline'} 
                    size={18} 
                    color={isLiked ? '#ff4757' : colors.textSecondary} 
                  />
                </Animated.View>
                {likesCount > 0 && (
                  <Text style={[styles.likeCount, { color: colors.textSecondary }]}>
                    {likesCount}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Action buttons */}
        <Animated.View
          style={[
            styles.actionsContainer,
            {
              opacity: actionsAnim,
              transform: [
                {
                  translateY: actionsAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.actionButtonLarge, { backgroundColor: colors.primary + '15' }]}
            onPress={copyToClipboard}
            accessibilityLabel="Copy verse to clipboard"
            accessibilityRole="button"
            accessibilityHint="Tap to copy this verse to your clipboard"
          >
            <Ionicons name="copy-outline" size={18} color={colors.primary} />
            <Text style={[styles.actionButtonText, { color: colors.primary }]}>Copy</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButtonLarge, { backgroundColor: colors.success + '15' }]}
            onPress={shareVerse}
            accessibilityLabel="Share verse"
            accessibilityRole="button"
            accessibilityHint="Tap to share this verse with others"
          >
            <Ionicons name="share-outline" size={18} color={colors.success} />
            <Text style={[styles.actionButtonText, { color: colors.success }]}>Share</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 3,
    borderColor: '#4CAF50', // Green border
  },
  blurContainer: {
    borderRadius: 24,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verseContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  verseGradient: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(94, 114, 228, 0.1)',
    position: 'relative',
  },
  verseText: {
    fontSize: 18,
    lineHeight: 28,
    fontStyle: 'italic',
    marginBottom: 16,
    fontWeight: '500',
  },
  verseReferenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  referenceLine: {
    width: 24,
    height: 2,
    borderRadius: 1,
    marginRight: 12,
  },
  verseReference: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  likeButtonContainer: {
    position: 'absolute',
    bottom: 12,
    right: 12,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  likeCount: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 2,
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  actionButtonLarge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  loadingDots: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FED7D7',
  },
  errorText: {
    color: '#E53E3E',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default DailyVerseCard;
