import React, { useState } from 'react';
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
import { FirebaseManager } from '../utils/firebase';
import GlassCard from '../components/GlassCard';
import CustomButton from '../components/CustomButton';
import ProgressRing from '../components/ProgressRing';

const { width } = Dimensions.get('window');

const StatisticsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [selectedChart, setSelectedChart] = useState('prayer');
  const [userStats, setUserStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Load user statistics on component mount
  useEffect(() => {
    const loadUserStatistics = async () => {
      if (user) {
        try {
          setLoading(true);
          const stats = await FirebaseManager.getUserStatistics(user.uid);
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
    totalDaysActive: userStats.prayerSessions.length + userStats.readingSessions.length,
    currentPrayerStreak: 12, // This would need to be calculated from actual data
    bibleReadingPercentage: Math.round((userStats.totalReadingTime / 60) / 30 * 100), // Assuming 30 minutes per day target
    versesMemorized: userStats.masteredVerses,
  } : {
    totalDaysActive: 45,
    currentPrayerStreak: 12,
    bibleReadingPercentage: 78,
    versesMemorized: 8,
  };

  const prayerData = {
    week: [20, 25, 15, 30, 35, 40, 25], // minutes per day
    month: [120, 140, 160, 180, 200, 220, 240, 260, 280, 300, 320, 340, 360, 380, 400, 420, 440, 460, 480, 500, 520, 540, 560, 580, 600, 620, 640, 660, 680, 700],
  };

  const readingData = {
    week: [true, true, false, true, true, true, true],
    month: Array.from({ length: 30 }, (_, i) => Math.random() > 0.3),
  };

  const achievements = [
    {
      id: 1,
      title: 'First Steps',
      description: 'Complete your first prayer session',
      icon: '🎯',
      unlocked: true,
      date: new Date(Date.now() - 86400000 * 7),
    },
    {
      id: 2,
      title: 'Week Warrior',
      description: 'Pray for 7 consecutive days',
      icon: '🔥',
      unlocked: true,
      date: new Date(Date.now() - 86400000 * 3),
    },
    {
      id: 3,
      title: 'Bible Scholar',
      description: 'Read for 30 consecutive days',
      icon: '📚',
      unlocked: false,
      date: null,
    },
    {
      id: 4,
      title: 'Memory Master',
      description: 'Memorize 10 verses',
      icon: '🧠',
      unlocked: false,
      date: null,
    },
  ];

  const timePeriods = [
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' },
    { id: 'year', label: 'Year' },
  ];

  const chartTypes = [
    { id: 'prayer', label: 'Prayer Time' },
    { id: 'reading', label: 'Reading' },
    { id: 'practices', label: 'Practices' },
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
          {overviewStats.bibleReadingPercentage}%
        </Text>
        <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>
          Reading Progress
        </Text>
      </GlassCard>

      <GlassCard style={styles.overviewCard}>
        <Text style={[styles.overviewNumber, { color: colors.secondary }]}>
          {overviewStats.versesMemorized}
        </Text>
        <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>
          Verses Memorized
        </Text>
      </GlassCard>
    </View>
  );

  const renderPrayerChart = () => {
    const data = selectedPeriod === 'week' ? prayerData.week : prayerData.month.slice(-7);
    const maxValue = Math.max(...data);
    
    return (
      <GlassCard style={styles.chartCard}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>
          Prayer Time ({selectedPeriod === 'week' ? 'Last 7 Days' : 'Last 30 Days'})
        </Text>
        <View style={styles.chartContainer}>
          <View style={styles.chartBars}>
            {data.map((value, index) => (
              <View key={index} style={styles.chartBarContainer}>
                <View
                  style={[
                    styles.chartBar,
                    {
                      height: (value / maxValue) * 100,
                      backgroundColor: colors.primary,
                    },
                  ]}
                />
                <Text style={[styles.chartBarLabel, { color: colors.textSecondary }]}>
                  {selectedPeriod === 'week' ? ['S', 'M', 'T', 'W', 'T', 'F', 'S'][index] : index + 1}
                </Text>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.chartLegend}>
          <Text style={[styles.chartLegendText, { color: colors.textSecondary }]}>
            Average: {Math.round(data.reduce((a, b) => a + b, 0) / data.length)} minutes/day
          </Text>
        </View>
      </GlassCard>
    );
  };

  const renderReadingChart = () => {
    const data = selectedPeriod === 'week' ? readingData.week : readingData.month.slice(-7);
    
    return (
      <GlassCard style={styles.chartCard}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>
          Reading Consistency ({selectedPeriod === 'week' ? 'Last 7 Days' : 'Last 30 Days'})
        </Text>
        <View style={styles.heatmapContainer}>
          <View style={styles.heatmapGrid}>
            {data.map((completed, index) => (
              <View
                key={index}
                style={[
                  styles.heatmapDay,
                  {
                    backgroundColor: completed ? colors.success : colors.border,
                  },
                ]}
              />
            ))}
          </View>
        </View>
        <View style={styles.chartLegend}>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
            <Text style={[styles.chartLegendText, { color: colors.textSecondary }]}>
              Completed
            </Text>
            <View style={[styles.legendDot, { backgroundColor: colors.border }]} />
            <Text style={[styles.chartLegendText, { color: colors.textSecondary }]}>
              Missed
            </Text>
          </View>
        </View>
      </GlassCard>
    );
  };

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

  const renderDetailedStats = () => (
    <GlassCard style={styles.detailedStatsCard}>
      <Text style={[styles.detailedStatsTitle, { color: colors.text }]}>
        Detailed Statistics
      </Text>
      
      <View style={styles.statSection}>
        <Text style={[styles.statSectionTitle, { color: colors.text }]}>
          Prayer Statistics
        </Text>
        <View style={styles.statRows}>
          <View style={styles.statRow}>
            <Text style={[styles.statRowLabel, { color: colors.textSecondary }]}>
              Total Prayer Time
            </Text>
            <Text style={[styles.statRowValue, { color: colors.text }]}>
              24 hours
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={[styles.statRowLabel, { color: colors.textSecondary }]}>
              Average Session
            </Text>
            <Text style={[styles.statRowValue, { color: colors.text }]}>
              15 minutes
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={[styles.statRowLabel, { color: colors.textSecondary }]}>
              Longest Streak
            </Text>
            <Text style={[styles.statRowValue, { color: colors.text }]}>
              12 days
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.statSection}>
        <Text style={[styles.statSectionTitle, { color: colors.text }]}>
          Reading Statistics
        </Text>
        <View style={styles.statRows}>
          <View style={styles.statRow}>
            <Text style={[styles.statRowLabel, { color: colors.textSecondary }]}>
              Books Completed
            </Text>
            <Text style={[styles.statRowValue, { color: colors.text }]}>
              3
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={[styles.statRowLabel, { color: colors.textSecondary }]}>
              Chapters Read
            </Text>
            <Text style={[styles.statRowValue, { color: colors.text }]}>
              45
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={[styles.statRowLabel, { color: colors.textSecondary }]}>
              Reading Streak
            </Text>
            <Text style={[styles.statRowValue, { color: colors.text }]}>
              8 days
            </Text>
          </View>
        </View>
      </View>
    </GlassCard>
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
          <Text style={[styles.title, { color: colors.text }]}>Statistics</Text>
          <View style={styles.headerSpacer} />
        </View>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Track your spiritual growth
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Overview Cards */}
        {renderOverviewCards()}

        {/* Time Period Selector */}
        <View style={styles.periodSelector}>
          {timePeriods.map((period) => (
            <TouchableOpacity
              key={period.id}
              style={[
                styles.periodButton,
                {
                  backgroundColor: selectedPeriod === period.id ? colors.primary : 'transparent',
                },
              ]}
              onPress={() => {
                setSelectedPeriod(period.id);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  {
                    color: selectedPeriod === period.id ? '#FFFFFF' : colors.textSecondary,
                  },
                ]}
              >
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

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
        {selectedChart === 'prayer' && renderPrayerChart()}
        {selectedChart === 'reading' && renderReadingChart()}
        {selectedChart === 'practices' && renderReadingChart()}

        {/* Achievements */}
        {renderAchievements()}

        {/* Detailed Stats */}
        {renderDetailedStats()}

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
  periodSelector: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  periodButtonText: {
    fontSize: 16,
    fontWeight: '600',
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
  detailedStatsCard: {
    padding: 20,
    marginBottom: 20,
  },
  detailedStatsTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
  },
  statSection: {
    marginBottom: 24,
  },
  statSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  statRows: {
    gap: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statRowLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  statRowValue: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default StatisticsScreen;
