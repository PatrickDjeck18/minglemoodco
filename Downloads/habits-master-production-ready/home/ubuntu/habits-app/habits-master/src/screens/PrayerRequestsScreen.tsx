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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { FirebaseManager } from '../utils/firebase';
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
  const [prayerRequests, setPrayerRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
      const requests = await FirebaseManager.getPrayerRequests(user.uid);
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
      (activeSegment === 'active' && !request.isAnswered) ||
      (activeSegment === 'answered' && request.isAnswered);
    
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
        await FirebaseManager.savePrayerRequest(user.uid, {
          title: newRequestTitle.trim(),
          description: newRequestDescription.trim(),
          category: selectedCategory,
          isPrivate: false, // You can add a toggle for this later
        });

        // Reload prayer requests to show the new one
        await loadPrayerRequests();

        setShowAddModal(false);
        setNewRequestTitle('');
        setNewRequestDescription('');
        setSelectedCategory('');
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
    try {
      await FirebaseManager.incrementPrayerCount(requestId);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Update local state to reflect the change immediately
      setPrayerRequests(prev =>
        prev.map(request =>
          request.id === requestId
            ? { ...request, prayerCount: request.prayerCount + 1 }
            : request
        )
      );
    } catch (error) {
      console.error('Error incrementing prayer count:', error);
      Alert.alert('Error', 'Failed to record prayer');
    }
  };

  const handleMarkAnswered = (requestId: number) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // In a real app, mark as answered
  };

  const getCategoryInfo = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId) || categories[categories.length - 1];
  };

  const renderRequestCard = (request: any) => {
    const categoryInfo = getCategoryInfo(request.category);
    
    return (
      <GlassCard key={request.id} style={styles.requestCard}>
        <View style={styles.requestHeader}>
          <View style={styles.requestInfo}>
            <View style={styles.requestMeta}>
              <View style={[styles.categoryTag, { backgroundColor: categoryInfo.color + '20' }]}>
                <Ionicons name={categoryInfo.icon} size={12} color={categoryInfo.color} style={styles.categoryIcon} />
                <Text style={[styles.categoryName, { color: categoryInfo.color }]}>
                  {categoryInfo.name}
                </Text>
              </View>
              <Text style={[styles.requestDate, { color: colors.textSecondary }]}>
                {format(request.dateAdded, 'MMM d, yyyy')}
              </Text>
            </View>
            <Text style={[styles.requestTitle, { color: colors.text }]}>
              {request.title}
            </Text>
            <Text style={[styles.requestDescription, { color: colors.textSecondary }]}>
              {request.description}
            </Text>
          </View>
          {request.isPrivate && (
            <View style={styles.privateIndicator}>
              <Text style={styles.privateIcon}>🔒</Text>
            </View>
          )}
        </View>

        {request.isAnswered && (
          <View style={[styles.answeredSection, { backgroundColor: colors.success + '20' }]}>
            <Text style={[styles.answeredLabel, { color: colors.success }]}>
              ✓ Answered on {format(request.answeredDate, 'MMM d, yyyy')}
            </Text>
            {request.testimony && (
              <Text style={[styles.testimonyText, { color: colors.text }]}>
                "{request.testimony}"
              </Text>
            )}
          </View>
        )}

        <View style={styles.requestActions}>
          <View style={styles.prayerCount}>
            <Text style={styles.prayerIcon}>🙏</Text>
            <Text style={[styles.prayerCountText, { color: colors.textSecondary }]}>
              {request.prayerCount} prayers
            </Text>
          </View>
          <View style={styles.actionButtons}>
            {!request.isAnswered && (
              <TouchableOpacity
                style={[styles.prayButton, { backgroundColor: colors.primary }]}
                onPress={() => handlePrayForRequest(request.id)}
              >
                <Text style={styles.prayButtonText}>Pray</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.moreButton, { backgroundColor: colors.card }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                // Show more options
              }}
            >
              <Text style={styles.moreButtonText}>⋯</Text>
            </TouchableOpacity>
          </View>
        </View>
      </GlassCard>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Prayer Requests</Text>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowAddModal(true)}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Share your prayer needs and pray for others
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search prayer requests..."
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      {/* Segment Control */}
      <View style={styles.segmentContainer}>
        {[
          { id: 'active', label: 'Active' },
          { id: 'answered', label: 'Answered' },
          { id: 'all', label: 'All' },
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
          >
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
          </ScrollView>
        </SafeAreaView>
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
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 20,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  segmentContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  segmentButtonText: {
    fontSize: 16,
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
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  requestInfo: {
    flex: 1,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreButtonText: {
    fontSize: 16,
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
});

export default PrayerRequestsScreen;
