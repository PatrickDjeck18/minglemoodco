import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format, subDays, subWeeks, subMonths } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { SupabaseManager } from '../utils/supabase';
import GlassCard from '../components/GlassCard';
import CustomButton from '../components/CustomButton';
import ProgressRing from '../components/ProgressRing';
import ModernBackButton from '../components/ModernBackButton';
import ModernCalendar from '../components/ModernCalendar';
import PrayerCalendar from '../components/PrayerCalendar';

const { width } = Dimensions.get('window');

const StatisticsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [selectedChart, setSelectedChart] = useState('prayer');
  const [userStats, setUserStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Load user statistics on component mount
  useEffect(() => {
    const loadUserStatistics = async () => {
      if (user) {
        try {
          setLoading(true);
          const stats = await SupabaseManager.getUserStatistics(user.id);
          setUserStats(stats);
        } catch (error) {
          console.error('Error loading user statistics:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    loadUserStatistics();
  }, [user]);

  const overviewStats = userStats ? {
    totalDaysActive: userStats.totalDaysActive,
    currentPrayerStreak: userStats.currentPrayerStreak,
    currentFastingStreak: userStats.currentFastingStreak,
    totalFastingDays: userStats.totalFastingDays,
  } : {
    totalDaysActive: 0,
    currentPrayerStreak: 0,
    currentFastingStreak: 0,
    totalFastingDays: 0,
  };




  const fastingData = userStats?.fastingData || {
    week: [false, false, false, false, false, false, false],
    month: Array.from({ length: 30 }, () => false),
  };

  // Mock fasting days for calendar - in real app, this would come from database
  const fastingDays = userStats?.fastingDays || [
    {
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      isFasting: true,
      fastingType: 'water' as const,
      duration: 16,
      completed: true,
    },
    {
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      isFasting: true,
      fastingType: 'food' as const,
      duration: 12,
      completed: true,
    },
    {
      date: new Date(), // today
      isFasting: true,
      fastingType: 'both' as const,
      duration: 8,
      completed: false,
    },
  ];
  
  // Mock prayer days for calendar - in real app, this would come from database
  const prayerDays = userStats?.prayerDays || [
    {
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      hasPrayer: true,
      prayerDuration: 30,
      prayerType: 'morning' as const,
      intensity: 'high' as const,
      completed: true,
    },
    {
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      hasPrayer: true,
      prayerDuration: 45,
      prayerType: 'both' as const,
      intensity: 'medium' as const,
      completed: true,
    },
    {
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      hasPrayer: true,
      prayerDuration: 20,
      prayerType: 'evening' as const,
      intensity: 'low' as const,
      completed: true,
    },
    {
      date: new Date(), // today
      hasPrayer: true,
      prayerDuration: 15,
      prayerType: 'morning' as const,
      intensity: 'medium' as const,
      completed: false,
    },
  ];

  const achievements = userStats?.achievements || [];


  const chartTypes = [
    { id: 'prayer', label: 'Prayer Time' },
    { id: 'fasting', label: 'Fasting' },
  ];

  const renderOverviewCards = () => (
    <View style={styles.overviewGrid}>
      <GlassCard style={styles.overviewCard}>
        <Text style={[styles.overviewNumber, { color: colors.primary }]}>
          {overviewStats.totalDaysActive}
        </Text>
        <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>
          Days Active
        </Text>
      </GlassCard>

      <GlassCard style={styles.overviewCard}>
        <Text style={[styles.overviewNumber, { color: colors.success }]}>
          {overviewStats.currentPrayerStreak}
        </Text>
        <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>
          Prayer Streak
        </Text>
      </GlassCard>

      <GlassCard style={styles.overviewCard}>
        <Text style={[styles.overviewNumber, { color: colors.warning }]}>
          {overviewStats.currentFastingStreak}
        </Text>
        <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>
          Fasting Streak
        </Text>
      </GlassCard>

      <GlassCard style={styles.overviewCard}>
        <Text style={[styles.overviewNumber, { color: colors.accent }]}>
          {overviewStats.totalFastingDays}
        </Text>
        <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>
          Total Fasting Days
        </Text>
      </GlassCard>

    </View>
  );



  const renderAchievements = () => (
    <GlassCard style={styles.achievementsCard}>
      <Text style={[styles.achievementsTitle, { color: colors.text }]}>
        Achievements
      </Text>
      <View style={styles.achievementsList}>
        {achievements.map((achievement) => (
          <View
            key={achievement.id}
            style={[
              styles.achievementItem,
              {
                backgroundColor: achievement.unlocked ? colors.card : colors.border + '20',
                opacity: achievement.unlocked ? 1 : 0.6,
              },
            ]}
          >
            <Text style={styles.achievementIcon}>{achievement.icon}</Text>
            <View style={styles.achievementInfo}>
              <Text style={[styles.achievementTitle, { color: colors.text }]}>
                {achievement.title}
              </Text>
              <Text style={[styles.achievementDescription, { color: colors.textSecondary }]}>
                {achievement.description}
              </Text>
              {achievement.unlocked && achievement.date && (
                <Text style={[styles.achievementDate, { color: colors.primary }]}>
                  Unlocked {format(achievement.date, 'MMM d, yyyy')}
                </Text>
              )}
            </View>
            <View style={styles.achievementStatus}>
              <Text style={styles.achievementStatusIcon}>
                {achievement.unlocked ? '✓' : '○'}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </GlassCard>
  );


  const renderFastingChart = () => {
    const data = fastingData.week;
    
    return (
      <GlassCard style={styles.chartCard}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>
          Fasting Consistency (Last 7 Days)
        </Text>
        <View style={styles.heatmapContainer}>
          <View style={styles.heatmapGrid}>
            {data.map((completed, index) => (
              <View
                key={index}
                style={[
                  styles.heatmapDay,
                  {
                    backgroundColor: completed ? colors.warning : colors.border,
                  },
                ]}
              />
            ))}
          </View>
        </View>
        <View style={styles.chartLegend}>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
            <Text style={[styles.chartLegendText, { color: colors.textSecondary }]}>
              Fasted
            </Text>
            <View style={[styles.legendDot, { backgroundColor: colors.border }]} />
            <Text style={[styles.chartLegendText, { color: colors.textSecondary }]}>
              No Fast
            </Text>
          </View>
        </View>
      </GlassCard>
    );
  };

  const renderPrayerCalendar = () => (
    <View style={styles.calendarSection}>
      <Text style={[styles.calendarSectionTitle, { color: colors.text }]}>
        Prayer Calendar
      </Text>
      <Text style={[styles.calendarSectionSubtitle, { color: colors.textSecondary }]}>
        Track your prayer journey with visual indicators
      </Text>
      <PrayerCalendar
        prayerDays={prayerDays}
        onDayPress={(date) => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          console.log('Prayer day pressed:', date);
          // Handle day press - could open prayer details modal
        }}
        onMonthChange={(date) => {
          console.log('Month changed:', date);
          // Handle month change - could load new prayer data
        }}
      />
    </View>
  );

  const renderFastingCalendar = () => (
    <View style={styles.calendarSection}>
      <Text style={[styles.calendarSectionTitle, { color: colors.text }]}>
        Fasting Calendar
      </Text>
      <Text style={[styles.calendarSectionSubtitle, { color: colors.textSecondary }]}>
        Track your fasting journey with visual indicators
      </Text>
      <ModernCalendar
        fastingDays={fastingDays}
        onDayPress={(date) => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          console.log('Fasting day pressed:', date);
          // Handle day press - could open fasting details modal
        }}
        onMonthChange={(date) => {
          console.log('Month changed:', date);
          // Handle month change - could load new fasting data
        }}
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
              <Text style={[styles.title, { color: colors.text }]}>Statistics</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Track your spiritual growth
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading your statistics...
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
            <Text style={[styles.title, { color: colors.text }]}>Statistics</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Track your spiritual growth
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Overview Cards */}
        {renderOverviewCards()}


        {/* Chart Type Selector */}
        <View style={styles.chartSelector}>
          {chartTypes.map((chart) => (
            <TouchableOpacity
              key={chart.id}
              style={[
                styles.chartButton,
                {
                  backgroundColor: selectedChart === chart.id ? colors.primary : 'transparent',
                },
              ]}
              onPress={() => {
                setSelectedChart(chart.id);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Text
                style={[
                  styles.chartButtonText,
                  {
                    color: selectedChart === chart.id ? '#FFFFFF' : colors.textSecondary,
                  },
                ]}
              >
                {chart.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Charts */}
        {selectedChart === 'fasting' && renderFastingChart()}

        {/* Prayer Calendar */}
        {selectedChart === 'prayer' && renderPrayerCalendar()}

        {/* Fasting Calendar */}
        {selectedChart === 'fasting' && renderFastingCalendar()}

        {/* Achievements */}
        {renderAchievements()}

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
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  overviewCard: {
    width: '48%',
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  overviewNumber: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  overviewLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  chartSelector: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    padding: 4,
  },
  chartButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  chartButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  chartCard: {
    padding: 20,
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  chartContainer: {
    height: 120,
    marginBottom: 16,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 100,
  },
  chartBarContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  chartBar: {
    width: '100%',
    borderRadius: 4,
    marginBottom: 8,
  },
  chartBarLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  chartLegend: {
    alignItems: 'center',
  },
  chartLegendText: {
    fontSize: 14,
    fontWeight: '500',
  },
  heatmapContainer: {
    marginBottom: 16,
  },
  heatmapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  heatmapDay: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginBottom: 2,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  achievementsCard: {
    padding: 20,
    marginBottom: 20,
  },
  achievementsTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  achievementsList: {
    gap: 12,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  achievementIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  achievementDescription: {
    fontSize: 14,
    fontWeight: '400',
    marginBottom: 4,
  },
  achievementDate: {
    fontSize: 12,
    fontWeight: '500',
  },
  achievementStatus: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementStatusIcon: {
    fontSize: 20,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  calendarSection: {
    marginBottom: 20,
  },
  calendarSectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  calendarSectionSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.8,
  },
});

export default StatisticsScreen;
