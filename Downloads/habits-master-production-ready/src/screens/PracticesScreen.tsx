import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  TextInput,
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
import ProgressRing from '../components/ProgressRing';
import ModernBackButton from '../components/ModernBackButton';

const PracticesScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('active');
  const [showCreator, setShowCreator] = useState(false);
  const [newPracticeName, setNewPracticeName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const practiceCategories = [
    { id: 'fasting', name: 'Fasting', icon: 'leaf' as keyof typeof Ionicons.glyphMap, color: '#2DCE89' },
    { id: 'meditation', name: 'Meditation', icon: 'bulb' as keyof typeof Ionicons.glyphMap, color: '#5E72E4' },
    { id: 'worship', name: 'Worship', icon: 'musical-notes' as keyof typeof Ionicons.glyphMap, color: '#825EE4' },
    { id: 'solitude', name: 'Solitude', icon: 'moon' as keyof typeof Ionicons.glyphMap, color: '#4ECDC4' },
    { id: 'service', name: 'Service', icon: 'heart' as keyof typeof Ionicons.glyphMap, color: '#FF6B6B' },
    { id: 'gratitude', name: 'Gratitude', icon: 'sunny' as keyof typeof Ionicons.glyphMap, color: '#FFD93D' },
    { id: 'custom', name: 'Custom', icon: 'add-circle' as keyof typeof Ionicons.glyphMap, color: '#9CA3AF' },
  ];

  const [activePractices, setActivePractices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load practices from Supabase
  useEffect(() => {
    const loadPractices = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const practices = await SupabaseManager.getPractices(user.id);
        setActivePractices(practices);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    loadPractices();
  }, [user]);

  const practiceHistory = [
    { date: new Date(), practices: ['Morning Prayer', 'Gratitude Journal'] },
    { date: new Date(Date.now() - 86400000), practices: ['Morning Prayer'] },
    { date: new Date(Date.now() - 172800000), practices: ['Morning Prayer', 'Weekly Fasting'] },
  ];

  const handlePracticeCheckIn = async (practiceId: number) => {
    try {
      if (user) {
        await SupabaseManager.updatePracticeCompletion(practiceId.toString(), true);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
    }
  };

  const handleCreatePractice = async () => {
    if (newPracticeName.trim() && selectedCategory) {
      try {
        if (user) {
          await SupabaseManager.savePractice(user.id, {
            name: newPracticeName.trim(),
            category: selectedCategory,
            frequency: 'daily',
            goal: 30,
          });
        }
        setShowCreator(false);
        setNewPracticeName('');
        setSelectedCategory('');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (error) {
      }
    }
  };

  const renderActivePractices = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {activePractices.map((practice) => (
        <GlassCard key={practice.id} style={styles.practiceCard}>
          <View style={styles.practiceHeader}>
            <View style={styles.practiceInfo}>
              <View style={[styles.practiceIcon, { backgroundColor: practice.color + '20' }]}>
                <Text style={styles.practiceIconText}>{practice.icon}</Text>
              </View>
              <View style={styles.practiceDetails}>
                <Text style={[styles.practiceName, { color: colors.text }]}>
                  {practice.name}
                </Text>
                <Text style={[styles.practiceFrequency, { color: colors.textSecondary }]}>
                  {practice.frequency} • {practice.streak} day streak
                </Text>
              </View>
            </View>
            <View style={styles.practiceProgress}>
              <ProgressRing
                progress={practice.streak / practice.goal}
                size={50}
                color={practice.color}
                strokeWidth={4}
              />
              <Text style={[styles.progressText, { color: colors.text }]}>
                {practice.streak}/{practice.goal}
              </Text>
            </View>
          </View>

          <View style={styles.practiceActions}>
            <CustomButton
              title="Check In"
              onPress={() => handlePracticeCheckIn(practice.id)}
              size="small"
              style={styles.checkInButton}
            />
            <TouchableOpacity
              style={[styles.moreButton, { backgroundColor: colors.card }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                // Show practice options
              }}
            >
              <Text style={styles.moreButtonText}>⋯</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>
      ))}

      <TouchableOpacity
        style={[styles.addPracticeCard, { backgroundColor: colors.card }]}
        onPress={() => setShowCreator(true)}
      >
        <Text style={styles.addPracticeIcon}>+</Text>
        <Text style={[styles.addPracticeText, { color: colors.primary }]}>
          Add New Practice
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderCalendar = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <GlassCard style={styles.calendarCard}>
        <Text style={[styles.calendarTitle, { color: colors.text }]}>
          Practice Calendar
        </Text>
        <View style={styles.calendarGrid}>
          {Array.from({ length: 30 }, (_, i) => {
            const date = new Date(Date.now() - (29 - i) * 86400000);
            const dayPractices = practiceHistory.find(
              h => format(h.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
            );
            return (
              <View key={i} style={styles.calendarDay}>
                <Text style={[styles.calendarDayNumber, { color: colors.textSecondary }]}>
                  {format(date, 'd')}
                </Text>
                <View style={styles.calendarDayDots}>
                  {dayPractices?.practices.slice(0, 3).map((_, dotIndex) => (
                    <View
                      key={dotIndex}
                      style={[styles.calendarDot, { backgroundColor: colors.primary }]}
                    />
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      </GlassCard>

      <GlassCard style={styles.statsCard}>
        <Text style={[styles.statsTitle, { color: colors.text }]}>
          Practice Statistics
        </Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>12</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Active Practices
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.success }]}>85%</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Completion Rate
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.warning }]}>45</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Total Days
            </Text>
          </View>
        </View>
      </GlassCard>
    </ScrollView>
  );

  const renderCreator = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <GlassCard style={styles.creatorCard}>
        <Text style={[styles.creatorTitle, { color: colors.text }]}>
          Create New Practice
        </Text>

        <View style={styles.inputSection}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Practice Name</Text>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            value={newPracticeName}
            onChangeText={setNewPracticeName}
            placeholder="Enter practice name"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.inputSection}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Category</Text>
          <View style={styles.categoryGrid}>
            {practiceCategories.map((category) => (
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
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text style={[styles.categoryName, { color: colors.text }]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <CustomButton
          title="Create Practice"
          onPress={handleCreatePractice}
          size="large"
          style={styles.createButton}
        />
      </GlassCard>
    </ScrollView>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={styles.headerContent}>
          <ModernBackButton onPress={() => navigation.goBack()} />
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: colors.text }]}>Spiritual Practices</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Build meaningful spiritual habits
            </Text>
          </View>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        {[
          { id: 'active', label: 'Active' },
          { id: 'calendar', label: 'Calendar' },
          { id: 'create', label: 'Create' },
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
        {activeTab === 'active' && renderActivePractices()}
        {activeTab === 'calendar' && renderCalendar()}
        {activeTab === 'create' && renderCreator()}
      </View>
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
  practiceCard: {
    padding: 16,
    marginBottom: 12,
  },
  practiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  practiceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  practiceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  practiceIconText: {
    fontSize: 20,
  },
  practiceDetails: {
    flex: 1,
  },
  practiceName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  practiceFrequency: {
    fontSize: 14,
    fontWeight: '400',
  },
  practiceProgress: {
    alignItems: 'center',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  practiceActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkInButton: {
    flex: 1,
    marginRight: 12,
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  addPracticeCard: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(94, 114, 228, 0.3)',
    borderStyle: 'dashed',
  },
  addPracticeIcon: {
    fontSize: 32,
    fontWeight: '300',
    marginBottom: 8,
  },
  addPracticeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  calendarCard: {
    padding: 20,
    marginBottom: 20,
  },
  calendarTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  calendarDay: {
    width: 30,
    height: 40,
    alignItems: 'center',
    marginBottom: 8,
  },
  calendarDayNumber: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  calendarDayDots: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  calendarDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 1,
  },
  statsCard: {
    padding: 20,
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
  creatorCard: {
    padding: 20,
  },
  creatorTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
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
  categoryIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  createButton: {
    marginTop: 20,
  },
});

export default PracticesScreen;
