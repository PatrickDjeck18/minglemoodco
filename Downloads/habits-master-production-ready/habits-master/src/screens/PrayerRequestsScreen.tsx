import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { SupabaseManager } from '../utils/supabase';
import GlassCard from '../components/GlassCard';
import CustomButton from '../components/CustomButton';

const PrayerRequestsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [activeSegment, setActiveSegment] = useState('active');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRequestTitle, setNewRequestTitle] = useState('');
  const [newRequestDescription, setNewRequestDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [prayerRequests, setPrayerRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [showComments, setShowComments] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [comments, setComments] = useState<{[key: string]: any[]}>({});
  const [userPrayedFor, setUserPrayedFor] = useState<Set<string>>(new Set());
  const [userLiked, setUserLiked] = useState<Set<string>>(new Set());
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedActionRequestId, setSelectedActionRequestId] = useState<string | null>(null);
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [selectedLikesRequestId, setSelectedLikesRequestId] = useState<string | null>(null);
  const [likesData, setLikesData] = useState<{[key: string]: any[]}>({});
  const [userLikedComments, setUserLikedComments] = useState<Set<string>>(new Set());
  const [commentLikesData, setCommentLikesData] = useState<{[key: string]: any[]}>({});

  useEffect(() => {
    if (user) {
      loadPrayerRequests();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadPrayerRequests = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const requests = await SupabaseManager.getPrayerRequests(user.id);
      setPrayerRequests(requests);
    } catch (error) {
      console.error('Error loading prayer requests:', error);
      Alert.alert('Error', 'Failed to load prayer requests');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'health', name: 'Health', color: '#FF6B6B', icon: 'heart' as keyof typeof Ionicons.glyphMap },
    { id: 'family', name: 'Family', color: '#4ECDC4', icon: 'home' as keyof typeof Ionicons.glyphMap },
    { id: 'work', name: 'Work', color: '#45B7D1', icon: 'briefcase' as keyof typeof Ionicons.glyphMap },
    { id: 'finance', name: 'Finance', color: '#F39C12', icon: 'card' as keyof typeof Ionicons.glyphMap },
    { id: 'spiritual', name: 'Spiritual', color: '#96CEB4', icon: 'book' as keyof typeof Ionicons.glyphMap },
    { id: 'relationships', name: 'Relationships', color: '#FFEAA7', icon: 'people' as keyof typeof Ionicons.glyphMap },
    { id: 'other', name: 'Other', color: '#DDA0DD', icon: 'ellipsis-horizontal-circle' as keyof typeof Ionicons.glyphMap },
  ];

  const filteredRequests = prayerRequests.filter(request => {
    const matchesSegment = activeSegment === 'all' || 
      (activeSegment === 'active' && !request.is_answered) ||
      (activeSegment === 'answered' && request.is_answered);
    
    const matchesSearch = request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSegment && matchesSearch;
  });

  const handleAddRequest = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to add prayer requests');
      return;
    }

    if (newRequestTitle.trim() && selectedCategory) {
      try {
        setSaving(true);
        await SupabaseManager.savePrayerRequest(user.id, {
          title: newRequestTitle.trim(),
          description: newRequestDescription.trim(),
          category: selectedCategory,
          is_private: false,
          is_anonymous: isAnonymous,
        });

        // Reload prayer requests to show the new one
        await loadPrayerRequests();

        setShowAddModal(false);
        setNewRequestTitle('');
        setNewRequestDescription('');
        setSelectedCategory('');
        setIsAnonymous(false);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (error) {
        console.error('Error saving prayer request:', error);
        Alert.alert('Error', 'Failed to save prayer request');
      } finally {
        setSaving(false);
      }
    } else {
      Alert.alert('Missing Information', 'Please fill in the title and select a category.');
    }
  };

  const handlePrayForRequest = async (requestId: string) => {
    // Check if user has already prayed for this request
    if (userPrayedFor.has(requestId)) {
      console.log('User has already prayed for this request');
      return;
    }

    try {
      console.log('Praying for request:', requestId);
      await SupabaseManager.incrementPrayerCount(requestId);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Update local state to reflect the change immediately
      setPrayerRequests(prev =>
        prev.map(request =>
          request.id === requestId
            ? { ...request, prayer_count: (request.prayer_count || 0) + 1 }
            : request
        )
      );

      // Mark that user has prayed for this request
      setUserPrayedFor(prev => new Set([...prev, requestId]));
      
      console.log('Prayer count updated successfully');
    } catch (error) {
      console.error('Error incrementing prayer count:', error);
      Alert.alert('Error', 'Failed to record prayer');
    }
  };

  const handleMarkAnswered = async (requestId: string) => {
    try {
      await SupabaseManager.markPrayerAsAnswered(requestId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Update local state
      setPrayerRequests(prev =>
        prev.map(request =>
          request.id === requestId
            ? { ...request, is_answered: true, answered_date: new Date().toISOString() }
            : request
        )
      );
    } catch (error) {
      console.error('Error marking prayer as answered:', error);
      Alert.alert('Error', 'Failed to mark prayer as answered');
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    Alert.alert(
      'Delete Prayer Request',
      'Are you sure you want to delete this prayer request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await SupabaseManager.deletePrayerRequest(requestId);
              setPrayerRequests(prev => prev.filter(request => request.id !== requestId));
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            } catch (error) {
              console.error('Error deleting prayer request:', error);
              Alert.alert('Error', 'Failed to delete prayer request');
            }
          }
        }
      ]
    );
  };

  const showActionMenu = (requestId: string) => {
    const request = prayerRequests.find(r => r.id === requestId);
    if (!request) return;

    console.log('showActionMenu called for request:', requestId, 'request:', request);
    
    setSelectedActionRequestId(requestId);
    setShowActionModal(true);
  };

  const handleActionMenuClose = () => {
    setShowActionModal(false);
    setSelectedActionRequestId(null);
  };

  const handleActionMenuAction = (action: string) => {
    if (!selectedActionRequestId) return;
    
    switch (action) {
      case 'delete':
        handleDeleteRequest(selectedActionRequestId);
        break;
      case 'markAnswered':
        handleMarkAnswered(selectedActionRequestId);
        break;
    }
    
    handleActionMenuClose();
  };

  // Social media functions
  const handleLike = async (requestId: string) => {
    if (!user) return;
    
    // Check if user has already liked this request
    if (userLiked.has(requestId)) {
      console.log('User has already liked this request');
      return;
    }
    
    try {
      await SupabaseManager.likePrayerRequest(user.id, requestId);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Update local state
      setPrayerRequests(prev =>
        prev.map(request =>
          request.id === requestId
            ? { 
                ...request, 
                likes_count: (request.likes_count || 0) + 1,
                isLiked: true
              }
            : request
        )
      );

      // Mark that user has liked this request
      setUserLiked(prev => new Set([...prev, requestId]));
    } catch (error) {
      console.error('Error liking prayer request:', error);
    }
  };

  const handleShare = async (requestId: string) => {
    if (!user) return;
    
    try {
      await SupabaseManager.sharePrayerRequest(user.id, requestId);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert('Shared!', 'Prayer request has been shared');
    } catch (error) {
      console.error('Error sharing prayer request:', error);
    }
  };

  const handleComment = async (requestId: string) => {
    if (!user) return;
    
    if (newComment.trim()) {
      try {
        await SupabaseManager.addComment(user.id, requestId, newComment.trim(), replyingTo || undefined);
        setNewComment('');
        setReplyingTo(null);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        
        // Reload comments
        loadComments(requestId);
        
        // Update comments count
        setPrayerRequests(prev =>
          prev.map(request =>
            request.id === requestId
              ? { ...request, comments_count: request.comments_count + 1 }
              : request
          )
        );
      } catch (error: any) {
        console.error('Error adding comment:', error);
        if (error.message?.includes('Comments feature not available')) {
          alert('Comments feature is not available yet. Please contact support to enable social features.');
        }
      }
    }
  };

  const handleReply = async (requestId: string, commentId: string) => {
    if (!user || !newComment.trim()) return;

    try {
      await SupabaseManager.addComment(user.id, requestId, newComment.trim(), commentId);
      setNewComment('');
      setReplyingTo(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Reload comments to show the reply
      loadComments(requestId);
    } catch (error: any) {
      console.error('Error adding reply:', error);
      if (error.message?.includes('Comments feature not available')) {
        alert('Comments feature is not available yet. Please contact support to enable social features.');
      }
    }
  };

  const loadComments = async (requestId: string) => {
    try {
      const commentsData = await SupabaseManager.getComments(requestId);
      setComments(prev => ({ ...prev, [requestId]: commentsData }));
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const loadLikes = async (requestId: string) => {
    try {
      const likesData = await SupabaseManager.getLikes(requestId);
      setLikesData(prev => ({ ...prev, [requestId]: likesData }));
    } catch (error) {
      console.error('Error loading likes:', error);
    }
  };

  const showLikesList = (requestId: string) => {
    setSelectedLikesRequestId(requestId);
    setShowLikesModal(true);
    loadLikes(requestId);
  };

  const handleCommentLike = async (commentId: string) => {
    if (!user) return;
    
    // Check if user has already liked this comment
    if (userLikedComments.has(commentId)) {
      console.log('User has already liked this comment');
      return;
    }
    
    try {
      await SupabaseManager.likeComment(user.id, commentId);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Mark that user has liked this comment
      setUserLikedComments(prev => new Set([...prev, commentId]));
      
      // Update local comment data
      setComments(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(requestId => {
          updated[requestId] = updated[requestId].map(comment => {
            if (comment.id === commentId) {
              return { ...comment, likes_count: (comment.likes_count || 0) + 1 };
            }
            // Also check replies
            if (comment.replies) {
              comment.replies = comment.replies.map(reply => {
                if (reply.id === commentId) {
                  return { ...reply, likes_count: (reply.likes_count || 0) + 1 };
                }
                return reply;
              });
            }
            return comment;
          });
        });
        return updated;
      });
      
      console.log('Comment liked successfully');
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const toggleComments = (requestId: string) => {
    if (showComments === requestId) {
      setShowComments(null);
    } else {
      setShowComments(requestId);
      if (!comments[requestId]) {
        loadComments(requestId);
      }
    }
  };

  const getCategoryInfo = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId) || categories[categories.length - 1];
  };

  const renderRequestCard = (request: any) => {
    const categoryInfo = getCategoryInfo(request.category);
    
    return (
      <GlassCard key={request.id} style={styles.socialCard}>
        {/* Header with user info and actions */}
        <View style={styles.socialHeader}>
          <View style={styles.userInfo}>
            <View style={[styles.avatar, { backgroundColor: categoryInfo.color }]}>
              <Text style={styles.avatarText}>
                {request.is_anonymous 
                  ? '?' 
                  : (request.users?.first_name?.[0] || request.user?.first_name?.[0] || 'U')
                }
              </Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={[styles.userName, { color: colors.text }]}>
                {request.is_anonymous 
                  ? 'Anonymous' 
                  : `${request.users?.first_name || request.user?.first_name || 'User'} ${request.users?.last_name || request.user?.last_name || ''}`
                }
              </Text>
              <Text style={[styles.postTime, { color: colors.textSecondary }]}>
                {format(new Date(request.created_at), 'MMM d, h:mm a')}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.moreButton, { backgroundColor: colors.card }]}
            onPress={() => {
              console.log('Three dots button pressed for request:', request.id);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              showActionMenu(request.id);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.moreButtonText}>⋯</Text>
          </TouchableOpacity>
        </View>

        {/* Category tag */}
        <View style={styles.categoryRow}>
          <View style={[styles.categoryTag, { backgroundColor: categoryInfo.color + '20' }]}>
            <Ionicons name={categoryInfo.icon} size={12} color={categoryInfo.color} style={styles.categoryIcon} />
            <Text style={[styles.categoryName, { color: categoryInfo.color }]}>
              {categoryInfo.name}
            </Text>
          </View>
          {request.is_private && (
            <View style={styles.privateIndicator}>
              <Ionicons name="lock-closed" size={12} color={colors.textSecondary} />
            </View>
          )}
        </View>

        {/* Post content */}
        <View style={styles.postContent}>
          <Text style={[styles.postTitle, { color: colors.text }]}>
            {request.title}
          </Text>
          <Text style={[styles.postDescription, { color: colors.textSecondary }]}>
            {request.description}
          </Text>
        </View>

        {/* Answered status */}
        {request.is_answered && (
          <View style={[styles.answeredSection, { backgroundColor: colors.success + '20' }]}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={[styles.answeredLabel, { color: colors.success }]}>
              Answered on {format(new Date(request.answered_date), 'MMM d, yyyy')}
            </Text>
          </View>
        )}

        {/* Social actions */}
        <View style={styles.socialActions}>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                if (userLiked.has(request.id)) {
                  showLikesList(request.id);
                } else {
                  handleLike(request.id);
                }
              }}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={userLiked.has(request.id) ? "heart" : "heart-outline"} 
                size={20} 
                color={userLiked.has(request.id) ? "#FF6B6B" : colors.textSecondary} 
              />
              <Text style={[styles.actionText, { color: colors.textSecondary }]}>
                {request.likes_count || 0}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => toggleComments(request.id)}
              activeOpacity={0.7}
            >
              <Ionicons name="chatbubble-outline" size={20} color={colors.textSecondary} />
              <Text style={[styles.actionText, { color: colors.textSecondary }]}>
                {request.comments_count || 0}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleShare(request.id)}
              activeOpacity={0.7}
            >
              <Ionicons name="share-outline" size={20} color={colors.textSecondary} />
              <Text style={[styles.actionText, { color: colors.textSecondary }]}>
                Share
              </Text>
            </TouchableOpacity>

            {!request.is_answered && (
              <TouchableOpacity
                style={[
                  styles.prayButton, 
                  { 
                    backgroundColor: userPrayedFor.has(request.id) ? colors.textSecondary : colors.primary,
                    opacity: userPrayedFor.has(request.id) ? 0.6 : 1
                  }
                ]}
                onPress={() => {
                  console.log('Pray button pressed for request:', request.id);
                  handlePrayForRequest(request.id);
                }}
                activeOpacity={0.7}
                disabled={userPrayedFor.has(request.id)}
              >
                <Ionicons name="heart" size={16} color="#FFFFFF" />
                <Text style={styles.prayButtonText}>
                  {userPrayedFor.has(request.id) ? 'Prayed' : 'Pray'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Prayer count */}
          <View style={styles.prayerCount}>
            <Text style={styles.prayerIcon}>🙏</Text>
            <Text style={[styles.prayerCountText, { color: colors.textSecondary }]}>
              {request.prayer_count} praying
            </Text>
          </View>
        </View>

        {/* Comments section */}
        {showComments === request.id && (
          <View style={styles.commentsSection}>
            <View style={styles.commentsHeader}>
              <Text style={[styles.commentsTitle, { color: colors.text }]}>
                Comments ({request.comments_count || 0})
              </Text>
            </View>
            
            {/* Comments list */}
            {comments[request.id]?.map((comment) => (
              <View key={comment.id} style={styles.commentItem}>
                <View style={[styles.commentAvatar, { backgroundColor: colors.primary }]}>
                  <Text style={styles.commentAvatarText}>
                    {comment.users?.first_name?.[0] || comment.user?.first_name?.[0] || 'U'}
                  </Text>
                </View>
                <View style={styles.commentContent}>
                  <Text style={[styles.commentAuthor, { color: colors.text }]}>
                    {comment.users?.first_name || comment.user?.first_name || 'Anonymous'}
                  </Text>
                  <Text style={[styles.commentText, { color: colors.textSecondary }]}>
                    {comment.content}
                  </Text>
                  <View style={styles.commentActions}>
                    <View style={styles.commentLeftActions}>
                      <Text style={[styles.commentTime, { color: colors.textSecondary }]}>
                        {format(new Date(comment.created_at), 'MMM d, h:mm a')}
                      </Text>
                      <TouchableOpacity
                        style={styles.commentLikeButton}
                        onPress={() => handleCommentLike(comment.id)}
                        disabled={userLikedComments.has(comment.id)}
                      >
                        <Ionicons 
                          name={userLikedComments.has(comment.id) ? "heart" : "heart-outline"} 
                          size={16} 
                          color={userLikedComments.has(comment.id) ? "#FF6B6B" : colors.textSecondary} 
                        />
                        <Text style={[styles.commentLikeText, { color: colors.textSecondary }]}>
                          {comment.likes_count || 0}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                      style={styles.replyButton}
                      onPress={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                    >
                      <Text style={[styles.replyButtonText, { color: colors.primary }]}>
                        {replyingTo === comment.id ? 'Cancel' : 'Reply'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  {/* Reply input */}
                  {replyingTo === comment.id && (
                    <View style={styles.replyInputSection}>
                      <TextInput
                        style={[
                          styles.replyInput,
                          {
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                            color: colors.text,
                          },
                        ]}
                        value={newComment}
                        onChangeText={setNewComment}
                        placeholder="Write a reply..."
                        placeholderTextColor={colors.textSecondary}
                        multiline
                      />
                      <View style={styles.replyActions}>
                        <TouchableOpacity
                          style={[styles.replyCancelButton, { borderColor: colors.border }]}
                          onPress={() => setReplyingTo(null)}
                        >
                          <Text style={[styles.replyCancelText, { color: colors.textSecondary }]}>
                            Cancel
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.replySendButton, { backgroundColor: colors.primary }]}
                          onPress={() => handleReply(request.id, comment.id)}
                        >
                          <Text style={styles.replySendText}>Reply</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* Display replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <View style={styles.repliesContainer}>
                      {comment.replies.map((reply) => (
                        <View key={reply.id} style={styles.replyItem}>
                          <View style={[styles.replyAvatar, { backgroundColor: colors.primary }]}>
                            <Text style={styles.replyAvatarText}>
                              {reply.users?.first_name?.[0] || reply.user?.first_name?.[0] || 'U'}
                            </Text>
                          </View>
                          <View style={styles.replyContent}>
                            <Text style={[styles.replyAuthor, { color: colors.text }]}>
                              {reply.users?.first_name || reply.user?.first_name || 'Anonymous'}
                            </Text>
                            <Text style={[styles.replyText, { color: colors.textSecondary }]}>
                              {reply.content}
                            </Text>
                            <View style={styles.replyActions}>
                              <Text style={[styles.replyTime, { color: colors.textSecondary }]}>
                                {format(new Date(reply.created_at), 'MMM d, h:mm a')}
                              </Text>
                              <TouchableOpacity
                                style={styles.replyLikeButton}
                                onPress={() => handleCommentLike(reply.id)}
                                disabled={userLikedComments.has(reply.id)}
                              >
                                <Ionicons 
                                  name={userLikedComments.has(reply.id) ? "heart" : "heart-outline"} 
                                  size={14} 
                                  color={userLikedComments.has(reply.id) ? "#FF6B6B" : colors.textSecondary} 
                                />
                                <Text style={[styles.replyLikeText, { color: colors.textSecondary }]}>
                                  {reply.likes_count || 0}
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            ))}

            {/* Add comment */}
            <View style={styles.addCommentSection}>
              <TextInput
                style={[
                  styles.commentInput,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                value={newComment}
                onChangeText={setNewComment}
                placeholder="Add a comment..."
                placeholderTextColor={colors.textSecondary}
                multiline
              />
              <TouchableOpacity
                style={[styles.sendButton, { backgroundColor: colors.primary }]}
                onPress={() => handleComment(request.id)}
                disabled={!newComment.trim()}
              >
                <Ionicons name="send" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </GlassCard>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.card }]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.title, { color: colors.text }]}>Prayer Requests</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Share your prayers with the community
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowAddModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchInputContainer, { backgroundColor: colors.card }]}>
          <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search prayer requests..."
            placeholderTextColor={colors.textSecondary}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearSearchButton}
              onPress={() => setSearchQuery('')}
            >
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Segment Control */}
      <View style={[styles.segmentContainer, { backgroundColor: colors.card }]}>
        {[
          { id: 'active', label: 'Active', icon: 'time-outline' },
          { id: 'answered', label: 'Answered', icon: 'checkmark-circle-outline' },
          { id: 'all', label: 'All', icon: 'grid-outline' },
        ].map((segment) => (
          <TouchableOpacity
            key={segment.id}
            style={[
              styles.segmentButton,
              {
                backgroundColor: activeSegment === segment.id ? colors.primary : 'transparent',
              },
            ]}
            onPress={() => {
              setActiveSegment(segment.id);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={segment.icon as any} 
              size={16} 
              color={activeSegment === segment.id ? '#FFFFFF' : colors.textSecondary} 
              style={styles.segmentIcon}
            />
            <Text
              style={[
                styles.segmentButtonText,
                {
                  color: activeSegment === segment.id ? '#FFFFFF' : colors.textSecondary,
                },
              ]}
            >
              {segment.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Prayer Requests List */}
      {loading ? (
        <View style={[styles.content, styles.centered]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading prayer requests...
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {filteredRequests.length > 0 ? (
            filteredRequests.map(renderRequestCard)
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🙏</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No prayer requests found
              </Text>
              <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
                {searchQuery ? 'Try adjusting your search' : 'Add your first prayer request'}
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Add Request Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={[styles.modalCancel, { color: colors.primary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Prayer Request</Text>
            <TouchableOpacity onPress={handleAddRequest} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={[styles.modalSave, { color: colors.primary }]}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputSection}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Title</Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                value={newRequestTitle}
                onChangeText={setNewRequestTitle}
                placeholder="Brief title for your prayer request"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputSection}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Description</Text>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                value={newRequestDescription}
                onChangeText={setNewRequestDescription}
                placeholder="Share more details about your prayer request..."
                placeholderTextColor={colors.textSecondary}
                multiline
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputSection}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Category</Text>
              <View style={styles.categoryGrid}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryButton,
                      {
                        backgroundColor: selectedCategory === category.id 
                          ? category.color + '20' 
                          : colors.card,
                        borderColor: selectedCategory === category.id 
                          ? category.color 
                          : colors.border,
                      },
                    ]}
                    onPress={() => {
                      setSelectedCategory(category.id);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Ionicons name={category.icon} size={20} color={selectedCategory === category.id ? category.color : colors.textSecondary} />
                    <Text style={[styles.categoryButtonName, { color: colors.text }]}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Anonymous Toggle */}
            <View style={styles.inputSection}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Privacy</Text>
              <View style={[styles.anonymousContainer, { backgroundColor: colors.card }]}>
                <View style={styles.anonymousInfo}>
                  <Ionicons 
                    name={isAnonymous ? "eye-off" : "eye"} 
                    size={20} 
                    color={isAnonymous ? colors.textSecondary : colors.primary} 
                  />
                  <View style={styles.anonymousTextContainer}>
                    <Text style={[styles.anonymousTitle, { color: colors.text }]}>
                      {isAnonymous ? 'Post Anonymously' : 'Show Your Name'}
                    </Text>
                    <Text style={[styles.anonymousDescription, { color: colors.textSecondary }]}>
                      {isAnonymous 
                        ? 'Your prayer will be shared without your name' 
                        : 'Your name will be visible to other users'
                      }
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[
                    styles.anonymousToggle,
                    {
                      backgroundColor: isAnonymous ? colors.primary : colors.border,
                    }
                  ]}
                  onPress={() => {
                    setIsAnonymous(!isAnonymous);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.anonymousToggleThumb,
                      {
                        transform: [{ translateX: isAnonymous ? 20 : 2 }],
                      }
                    ]}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Action Menu Modal */}
      <Modal
        visible={showActionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleActionMenuClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.actionMenuContainer}>
            <Text style={[styles.actionMenuTitle, { color: colors.text }]}>
              Prayer Request Options
            </Text>
            
            {selectedActionRequestId && (
              <>
                {!prayerRequests.find(r => r.id === selectedActionRequestId)?.is_answered && (
                  <TouchableOpacity
                    style={[styles.actionMenuItem, { borderBottomColor: colors.border }]}
                    onPress={() => handleActionMenuAction('markAnswered')}
                  >
                    <Ionicons name="checkmark-circle-outline" size={24} color={colors.primary} />
                    <Text style={[styles.actionMenuText, { color: colors.text }]}>
                      Mark as Answered
                    </Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity
                  style={styles.actionMenuItem}
                  onPress={() => handleActionMenuAction('delete')}
                >
                  <Ionicons name="trash-outline" size={24} color="#FF6B6B" />
                  <Text style={[styles.actionMenuText, { color: '#FF6B6B' }]}>
                    Delete
                  </Text>
                </TouchableOpacity>
              </>
            )}
            
            <TouchableOpacity
              style={[styles.actionMenuItem, styles.actionMenuCancel]}
              onPress={handleActionMenuClose}
            >
              <Text style={[styles.actionMenuText, { color: colors.textSecondary }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Likes Modal */}
      <Modal
        visible={showLikesModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLikesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.likesModalContainer}>
            <Text style={[styles.likesModalTitle, { color: colors.text }]}>
              Who Liked This Prayer
            </Text>
            
            {selectedLikesRequestId && likesData[selectedLikesRequestId]?.length > 0 ? (
              <ScrollView style={styles.likesList} showsVerticalScrollIndicator={false}>
                {likesData[selectedLikesRequestId].map((like, index) => (
                  <View key={like.id || index} style={styles.likeItem}>
                    <View style={[styles.likeAvatar, { backgroundColor: colors.primary }]}>
                      <Text style={styles.likeAvatarText}>
                        {like.users?.first_name?.[0] || like.user?.first_name?.[0] || 'U'}
                      </Text>
                    </View>
                    <View style={styles.likeContent}>
                      <Text style={[styles.likeName, { color: colors.text }]}>
                        {like.users?.first_name || like.user?.first_name || 'Anonymous'} {like.users?.last_name || like.user?.last_name || ''}
                      </Text>
                      <Text style={[styles.likeTime, { color: colors.textSecondary }]}>
                        {format(new Date(like.created_at), 'MMM d, h:mm a')}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.noLikesContainer}>
                <Text style={[styles.noLikesText, { color: colors.textSecondary }]}>
                  No likes yet
                </Text>
              </View>
            )}
            
            <TouchableOpacity
              style={[styles.likesCloseButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowLikesModal(false)}
            >
              <Text style={styles.likesCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '400',
    textAlign: 'center',
    opacity: 0.7,
    marginTop: 2,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  clearSearchButton: {
    padding: 4,
  },
  segmentContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentIcon: {
    marginRight: 4,
  },
  segmentButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  requestCard: {
    padding: 16,
    marginBottom: 12,
  },
  socialCard: {
    padding: 0,
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  socialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  postTime: {
    fontSize: 12,
    opacity: 0.7,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  postContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 24,
  },
  postDescription: {
    fontSize: 15,
    lineHeight: 22,
  },
  socialActions: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  commentsSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    paddingTop: 16,
  },
  commentsHeader: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  commentItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  commentAvatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  commentContent: {
    flex: 1,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  commentTime: {
    fontSize: 12,
    opacity: 0.7,
  },
  addCommentSection: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  requestInfo: {
    flex: 1,
    marginRight: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  requestMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  categoryIcon: {
    marginRight: 4,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
  },
  requestDate: {
    fontSize: 12,
    fontWeight: '400',
  },
  requestTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  requestDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  privateIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  privateIcon: {
    fontSize: 16,
  },
  answeredSection: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  answeredLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  testimonyText: {
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  requestActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prayerCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prayerIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  prayerCountText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  prayButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  moreButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalCancel: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalSave: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 100,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryButton: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
  },
  categoryButtonName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionMenuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    minWidth: 280,
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  actionMenuTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  actionMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  actionMenuCancel: {
    borderBottomWidth: 0,
    justifyContent: 'center',
  },
  actionMenuText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  commentActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  replyButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  replyButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  replyInputSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  replyInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    marginBottom: 8,
    minHeight: 40,
  },
  replyActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  replyCancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  replyCancelText: {
    fontSize: 14,
    fontWeight: '500',
  },
  replySendButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  replySendText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  likesModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    minWidth: 320,
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  likesModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  likesList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  likeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  likeAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  likeAvatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  likeContent: {
    flex: 1,
  },
  likeName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  likeTime: {
    fontSize: 12,
  },
  noLikesContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  noLikesText: {
    fontSize: 16,
  },
  likesCloseButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  likesCloseText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  repliesContainer: {
    marginTop: 12,
    marginLeft: 20,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#E5E5E5',
  },
  replyItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  replyAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  replyAvatarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  replyContent: {
    flex: 1,
  },
  replyAuthor: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  replyText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  replyTime: {
    fontSize: 12,
  },
  commentLeftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  commentLikeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  commentLikeText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  replyActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  replyLikeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  replyLikeText: {
    fontSize: 11,
    fontWeight: '500',
    marginLeft: 3,
  },
  // Anonymous toggle styles
  anonymousContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  anonymousInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  anonymousTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  anonymousTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  anonymousDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  anonymousToggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  anonymousToggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});

export default PrayerRequestsScreen;
