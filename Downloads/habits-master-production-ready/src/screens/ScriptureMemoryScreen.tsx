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
  Animated,
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
import ProgressRing from '../components/ProgressRing';

const ScriptureMemoryScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('practice');
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showFirstLetters, setShowFirstLetters] = useState(false);
  const [practiceMode, setPracticeMode] = useState('recall'); // recall, first-letters, fill-blanks
  const [userInput, setUserInput] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const memoryVerses = [
    {
      id: 1,
      reference: 'John 3:16',
      text: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
      category: 'salvation',
      difficulty: 'easy',
      mastery: 'learning', // learning, review, mastered
      lastReviewed: new Date(),
      reviewCount: 3,
      correctCount: 2,
    },
    {
      id: 2,
      reference: 'Philippians 4:13',
      text: 'I can do all this through him who gives me strength.',
      category: 'strength',
      difficulty: 'medium',
      mastery: 'review',
      lastReviewed: new Date(Date.now() - 86400000),
      reviewCount: 8,
      correctCount: 6,
    },
    {
      id: 3,
      reference: 'Jeremiah 29:11',
      text: 'For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, to give you hope and a future.',
      category: 'hope',
      difficulty: 'hard',
      mastery: 'mastered',
      lastReviewed: new Date(Date.now() - 172800000),
      reviewCount: 15,
      correctCount: 12,
    },
  ];

  const currentVerse = memoryVerses[currentVerseIndex];
  const flipAnim = new Animated.Value(0);

  const categories = [
    { id: 'salvation', name: 'Salvation', color: '#5E72E4', icon: 'heart' as keyof typeof Ionicons.glyphMap },
    { id: 'strength', name: 'Strength', color: '#2DCE89', icon: 'flash' as keyof typeof Ionicons.glyphMap },
    { id: 'hope', name: 'Hope', color: '#FFD93D', icon: 'sunny' as keyof typeof Ionicons.glyphMap },
    { id: 'peace', name: 'Peace', color: '#4ECDC4', icon: 'leaf' as keyof typeof Ionicons.glyphMap },
    { id: 'love', name: 'Love', color: '#FF6B6B', icon: 'heart-circle' as keyof typeof Ionicons.glyphMap },
    { id: 'wisdom', name: 'Wisdom', color: '#825EE4', icon: 'bulb' as keyof typeof Ionicons.glyphMap },
  ];

  const getCategoryInfo = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId) || categories[0];
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleNext = () => {
    setCurrentVerseIndex((prev) => (prev + 1) % memoryVerses.length);
    setIsFlipped(false);
    setUserInput('');
    setIsCorrect(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePrevious = () => {
    setCurrentVerseIndex((prev) => (prev - 1 + memoryVerses.length) % memoryVerses.length);
    setIsFlipped(false);
    setUserInput('');
    setIsCorrect(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleCheckAnswer = async () => {
    const isAnswerCorrect = userInput.toLowerCase().trim() === currentVerse.text.toLowerCase().trim();
    setIsCorrect(isAnswerCorrect);
    
    // Update progress in Firebase
    if (user && currentVerse.id) {
      try {
        await FirebaseManager.updateVerseProgress(currentVerse.id.toString(), isAnswerCorrect);
        console.log('Verse progress updated in Firebase');
      } catch (error) {
        console.error('Error updating verse progress:', error);
      }
    }
    
    if (isAnswerCorrect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleDifficultyRating = (rating: 'easy' | 'medium' | 'hard') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // In a real app, update the verse difficulty and schedule next review
    console.log('Difficulty rating:', rating);
  };

  const getFirstLetters = (text: string) => {
    return text.split(' ').map(word => word.charAt(0)).join(' ');
  };

  const renderPracticeMode = () => (
    <View style={styles.practiceContainer}>
      <GlassCard style={styles.verseCard}>
        <View style={styles.verseHeader}>
          <Text style={[styles.verseReference, { color: colors.primary }]}>
            {currentVerse.reference}
          </Text>
          <View style={styles.verseActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.card }]}
              onPress={() => setShowFirstLetters(!showFirstLetters)}
            >
              <Text style={styles.actionButtonText}>
                {showFirstLetters ? 'Show Text' : 'First Letters'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.card }]}
              onPress={handleFlip}
            >
              <Text style={styles.actionButtonText}>
                {isFlipped ? 'Hide' : 'Show'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.verseContent}>
          {isFlipped ? (
            <Text style={[styles.verseText, { color: colors.text }]}>
              "{currentVerse.text}"
            </Text>
          ) : showFirstLetters ? (
            <Text style={[styles.verseText, { color: colors.text }]}>
              {getFirstLetters(currentVerse.text)}
            </Text>
          ) : (
            <Text style={[styles.verseText, { color: colors.textSecondary }]}>
              Tap to reveal the verse
            </Text>
          )}
        </View>

        {practiceMode === 'recall' && (
          <View style={styles.recallSection}>
            <TextInput
              style={[
                styles.recallInput,
                {
                  backgroundColor: colors.card,
                  borderColor: isCorrect === null ? colors.border : 
                    isCorrect ? colors.success : colors.warning,
                  color: colors.text,
                },
              ]}
              value={userInput}
              onChangeText={setUserInput}
              placeholder="Type the verse from memory..."
              placeholderTextColor={colors.textSecondary}
              multiline
              textAlignVertical="top"
            />
            <CustomButton
              title="Check Answer"
              onPress={handleCheckAnswer}
              size="medium"
              style={styles.checkButton}
            />
            {isCorrect !== null && (
              <View style={[
                styles.resultIndicator,
                { backgroundColor: isCorrect ? colors.success + '20' : colors.warning + '20' }
              ]}>
                <Text style={[
                  styles.resultText,
                  { color: isCorrect ? colors.success : colors.warning }
                ]}>
                  {isCorrect ? '✓ Correct!' : '✗ Try again'}
                </Text>
              </View>
            )}
          </View>
        )}
      </GlassCard>

      <View style={styles.navigationControls}>
        <CustomButton
          title="Previous"
          onPress={handlePrevious}
          variant="outline"
          size="medium"
        />
        <CustomButton
          title="Next"
          onPress={handleNext}
          size="medium"
        />
      </View>

      <GlassCard style={styles.progressCard}>
        <Text style={[styles.progressTitle, { color: colors.text }]}>
          Progress
        </Text>
        <View style={styles.progressStats}>
          <View style={styles.progressItem}>
            <Text style={[styles.progressNumber, { color: colors.primary }]}>
              {currentVerseIndex + 1}
            </Text>
            <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
              of {memoryVerses.length}
            </Text>
          </View>
          <View style={styles.progressItem}>
            <Text style={[styles.progressNumber, { color: colors.success }]}>
              {currentVerse.correctCount}
            </Text>
            <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
              Correct
            </Text>
          </View>
          <View style={styles.progressItem}>
            <Text style={[styles.progressNumber, { color: colors.warning }]}>
              {currentVerse.reviewCount}
            </Text>
            <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
              Reviews
            </Text>
          </View>
        </View>
      </GlassCard>
    </View>
  );

  const renderVerseList = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {memoryVerses.map((verse) => {
        const categoryInfo = getCategoryInfo(verse.category);
        return (
          <TouchableOpacity
            key={verse.id}
            style={[styles.verseListItem, { backgroundColor: colors.card }]}
            onPress={() => {
              setCurrentVerseIndex(verse.id - 1);
              setActiveTab('practice');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <View style={styles.verseListContent}>
              <View style={styles.verseListHeader}>
                <Text style={[styles.verseListReference, { color: colors.text }]}>
                  {verse.reference}
                </Text>
                <View style={[
                  styles.masteryBadge,
                  {
                    backgroundColor: verse.mastery === 'mastered' ? colors.success :
                      verse.mastery === 'review' ? colors.warning : colors.primary
                  }
                ]}>
                  <Text style={styles.masteryText}>
                    {verse.mastery === 'mastered' ? '✓' :
                     verse.mastery === 'review' ? '↻' : '●'}
                  </Text>
                </View>
              </View>
              <Text style={[styles.verseListText, { color: colors.textSecondary }]}>
                {verse.text.substring(0, 80)}...
              </Text>
              <View style={styles.verseListMeta}>
                <View style={[styles.categoryTag, { backgroundColor: categoryInfo.color + '20' }]}>
                  <Text style={styles.categoryIcon}>{categoryInfo.icon}</Text>
                  <Text style={[styles.categoryName, { color: categoryInfo.color }]}>
                    {categoryInfo.name}
                  </Text>
                </View>
                <Text style={[styles.lastReviewed, { color: colors.textSecondary }]}>
                  Last reviewed: {format(verse.lastReviewed, 'MMM d')}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity
        style={[styles.addVerseCard, { backgroundColor: colors.card }]}
        onPress={() => setShowAddModal(true)}
      >
        <Text style={styles.addVerseIcon}>+</Text>
        <Text style={[styles.addVerseText, { color: colors.primary }]}>
          Add New Verse
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderStats = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <GlassCard style={styles.statsCard}>
        <Text style={[styles.statsTitle, { color: colors.text }]}>
          Memory Statistics
        </Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>
              {memoryVerses.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Total Verses
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.success }]}>
              {memoryVerses.filter(v => v.mastery === 'mastered').length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Mastered
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.warning }]}>
              {memoryVerses.reduce((sum, v) => sum + v.reviewCount, 0)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Total Reviews
            </Text>
          </View>
        </View>
      </GlassCard>

      <GlassCard style={styles.achievementsCard}>
        <Text style={[styles.achievementsTitle, { color: colors.text }]}>
          Achievements
        </Text>
        <View style={styles.achievementsList}>
          <View style={styles.achievementItem}>
            <Text style={styles.achievementIcon}>🏆</Text>
            <View style={styles.achievementInfo}>
              <Text style={[styles.achievementName, { color: colors.text }]}>
                First Verse Mastered
              </Text>
              <Text style={[styles.achievementDescription, { color: colors.textSecondary }]}>
                Master your first memory verse
              </Text>
            </View>
            <Text style={styles.achievementStatus}>✓</Text>
          </View>
          <View style={styles.achievementItem}>
            <Text style={styles.achievementIcon}>🔥</Text>
            <View style={styles.achievementInfo}>
              <Text style={[styles.achievementName, { color: colors.text }]}>
                7-Day Streak
              </Text>
              <Text style={[styles.achievementDescription, { color: colors.textSecondary }]}>
                Practice for 7 consecutive days
              </Text>
            </View>
            <Text style={styles.achievementStatus}>○</Text>
          </View>
        </View>
      </GlassCard>
    </ScrollView>
  );

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
          <Text style={[styles.title, { color: colors.text }]}>Scripture Memory</Text>
          <View style={styles.headerSpacer} />
        </View>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Memorize and meditate on God's Word
        </Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        {[
          { id: 'practice', label: 'Practice' },
          { id: 'verses', label: 'Verses' },
          { id: 'stats', label: 'Stats' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tabButton,
              {
                backgroundColor: activeTab === tab.id ? colors.primary : 'transparent',
              },
            ]}
            onPress={() => {
              setActiveTab(tab.id);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Text
              style={[
                styles.tabButtonText,
                {
                  color: activeTab === tab.id ? '#FFFFFF' : colors.textSecondary,
                },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <View style={styles.content}>
        {activeTab === 'practice' && renderPracticeMode()}
        {activeTab === 'verses' && renderVerseList()}
        {activeTab === 'stats' && renderStats()}
      </View>

      {/* Add Verse Modal */}
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
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Verse</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={[styles.modalSave, { color: colors.primary }]}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputSection}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Scripture Reference</Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="e.g., John 3:16"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputSection}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Verse Text</Text>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="Enter the full verse text..."
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
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Text style={styles.categoryButtonIcon}>{category.icon}</Text>
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
  headerSpacer: {
    width: 40,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
  },
  tabNavigation: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  practiceContainer: {
    flex: 1,
  },
  verseCard: {
    padding: 20,
    marginBottom: 20,
  },
  verseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  verseReference: {
    fontSize: 20,
    fontWeight: '600',
  },
  verseActions: {
    flexDirection: 'row',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 8,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  verseContent: {
    marginBottom: 20,
    minHeight: 100,
    justifyContent: 'center',
  },
  verseText: {
    fontSize: 18,
    lineHeight: 28,
    textAlign: 'center',
  },
  recallSection: {
    marginTop: 20,
  },
  recallInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
    marginBottom: 12,
  },
  checkButton: {
    marginBottom: 12,
  },
  resultIndicator: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  resultText: {
    fontSize: 16,
    fontWeight: '600',
  },
  navigationControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  progressCard: {
    padding: 16,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  progressItem: {
    alignItems: 'center',
  },
  progressNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  verseListItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  verseListContent: {
    flex: 1,
  },
  verseListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  verseListReference: {
    fontSize: 18,
    fontWeight: '600',
  },
  masteryBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  masteryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  verseListText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  verseListMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
  },
  lastReviewed: {
    fontSize: 12,
    fontWeight: '400',
  },
  addVerseCard: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(94, 114, 228, 0.3)',
    borderStyle: 'dashed',
  },
  addVerseIcon: {
    fontSize: 32,
    fontWeight: '300',
    marginBottom: 8,
  },
  addVerseText: {
    fontSize: 16,
    fontWeight: '600',
  },
  statsCard: {
    padding: 20,
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  achievementsCard: {
    padding: 20,
  },
  achievementsTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  achievementsList: {
    gap: 16,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  achievementIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  achievementDescription: {
    fontSize: 14,
    fontWeight: '400',
  },
  achievementStatus: {
    fontSize: 20,
    fontWeight: '600',
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
  categoryButtonIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  categoryButtonName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default ScriptureMemoryScreen;
