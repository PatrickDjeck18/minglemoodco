import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useTheme } from '../context/ThemeContext';
import GlassCard from '../components/GlassCard';
import CustomButton from '../components/CustomButton';
import ProgressRing from '../components/ProgressRing';

const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('Friend');
  const [prayerStreak, setPrayerStreak] = useState(7);
  const [readingProgress, setReadingProgress] = useState(0.65);
  const [nextPrayerTime, setNextPrayerTime] = useState('6:00 PM');
  const [devotionComplete, setDevotionComplete] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const quickActions = [
    {
      id: 'prayer',
      title: 'Start Prayer',
      icon: 'home' as keyof typeof Ionicons.glyphMap,
      color: colors.primary,
      onPress: () => navigation.navigate('Prayer'),
    },
    {
      id: 'reading',
      title: "Today's Reading",
      icon: 'book' as keyof typeof Ionicons.glyphMap,
      color: colors.success,
      onPress: () => navigation.navigate('Bible'),
    },
    {
      id: 'requests',
      title: 'Add Prayer Request',
      icon: 'home' as keyof typeof Ionicons.glyphMap,
      color: colors.warning,
      onPress: () => navigation.navigate('PrayerRequests'),
    },
    {
      id: 'memory',
      title: 'Scripture Memory',
      icon: 'library' as keyof typeof Ionicons.glyphMap,
      color: colors.secondary,
      onPress: () => navigation.navigate('ScriptureMemory'),
    },
    {
      id: 'stats',
      title: 'Statistics',
      icon: 'bar-chart' as keyof typeof Ionicons.glyphMap,
      color: '#4ECDC4',
      onPress: () => navigation.navigate('Statistics'),
    },
  ];

  const recentActivities = [
    {
      id: 1,
      title: 'Morning Prayer',
      time: '7:30 AM',
      icon: 'home' as keyof typeof Ionicons.glyphMap,
      completed: true,
    },
    {
      id: 2,
      title: 'Bible Reading - John 3',
      time: '8:15 AM',
      icon: 'book' as keyof typeof Ionicons.glyphMap,
      completed: true,
    },
    {
      id: 3,
      title: 'Daily Devotion',
      time: '9:00 AM',
      icon: 'sunny' as keyof typeof Ionicons.glyphMap,
      completed: false,
    },
  ];

  const dailyVerse = {
    text: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, to give you hope and a future.",
    reference: "Jeremiah 29:11",
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate data refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <View>
            <Text style={[styles.greeting, { color: colors.text }]}>
              {getGreeting()}, {userName}
            </Text>
            <Text style={[styles.date, { color: colors.textSecondary }]}>
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </Text>
          </View>
        </View>

        {/* Daily Verse */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Daily Verse</Text>
          <GlassCard style={styles.verseCard}>
            <Text style={[styles.verseText, { color: colors.text }]}>
              "{dailyVerse.text}"
            </Text>
            <Text style={[styles.verseReference, { color: colors.primary }]}>
              — {dailyVerse.reference}
            </Text>
            <TouchableOpacity style={styles.shareButton}>
              <Text style={styles.shareButtonText}>Share</Text>
            </TouchableOpacity>
          </GlassCard>
        </View>

        {/* Today's Overview Card */}
        <GlassCard style={styles.overviewCard}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Today's Overview</Text>
          
          <View style={styles.overviewContent}>
            <View style={styles.overviewItem}>
              <ProgressRing
                progress={prayerStreak / 30}
                size={60}
                color={colors.primary}
              />
              <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>
                Prayer Streak
              </Text>
              <Text style={[styles.overviewValue, { color: colors.text }]}>
                {prayerStreak} days
              </Text>
            </View>

            <View style={styles.overviewItem}>
              <ProgressRing
                progress={readingProgress}
                size={60}
                color={colors.success}
              />
              <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>
                Reading Progress
              </Text>
              <Text style={[styles.overviewValue, { color: colors.text }]}>
                {Math.round(readingProgress * 100)}%
              </Text>
            </View>

            <View style={styles.overviewItem}>
              <Text style={[styles.nextPrayerLabel, { color: colors.textSecondary }]}>
                Next Prayer
              </Text>
              <Text style={[styles.nextPrayerTime, { color: colors.primary }]}>
                {nextPrayerTime}
              </Text>
            </View>
          </View>

          <View style={styles.devotionStatus}>
            <TouchableOpacity
              style={[
                styles.devotionCheckbox,
                { borderColor: devotionComplete ? colors.success : colors.border }
              ]}
              onPress={() => setDevotionComplete(!devotionComplete)}
            >
              <Text style={[styles.checkboxText, { color: colors.text }]}>
                {devotionComplete ? '✓' : ''}
              </Text>
            </TouchableOpacity>
            <Text style={[styles.devotionText, { color: colors.text }]}>
              Today's Devotion {devotionComplete ? 'Completed' : 'Pending'}
            </Text>
          </View>
        </GlassCard>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={[styles.quickActionCard, { backgroundColor: colors.card }]}
                onPress={action.onPress}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: action.color + '20' }]}>
                  <Ionicons name={action.icon} size={20} color={action.color} />
                </View>
                <Text style={[styles.quickActionTitle, { color: colors.text }]}>
                  {action.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Activities */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activities</Text>
          <GlassCard style={styles.activitiesCard}>
            {recentActivities.map((activity) => (
              <View key={activity.id} style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <Ionicons name={activity.icon} size={16} color={colors.primary} />
                </View>
                <View style={styles.activityContent}>
                  <Text style={[styles.activityTitle, { color: colors.text }]}>
                    {activity.title}
                  </Text>
                  <Text style={[styles.activityTime, { color: colors.textSecondary }]}>
                    {activity.time}
                  </Text>
                </View>
                <View style={[
                  styles.activityStatus,
                  { backgroundColor: activity.completed ? colors.success : colors.border }
                ]}>
                  <Text style={styles.activityStatusText}>
                    {activity.completed ? '✓' : '○'}
                  </Text>
                </View>
              </View>
            ))}
          </GlassCard>
        </View>

        {/* Bottom padding for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
    fontWeight: '400',
  },
  overviewCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  overviewContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  overviewItem: {
    alignItems: 'center',
  },
  overviewLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
    marginBottom: 4,
  },
  overviewValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  nextPrayerLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  nextPrayerTime: {
    fontSize: 18,
    fontWeight: '600',
  },
  devotionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  devotionCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxText: {
    fontSize: 14,
    fontWeight: '600',
  },
  devotionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginHorizontal: 20,
    marginBottom: 12,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionIconText: {
    fontSize: 20,
  },
  quickActionTitle: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  activitiesCard: {
    marginHorizontal: 20,
    padding: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(94, 114, 228, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityIconText: {
    fontSize: 16,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 14,
  },
  activityStatus: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  verseCard: {
    marginHorizontal: 20,
    padding: 20,
  },
  verseText: {
    fontSize: 16,
    lineHeight: 24,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  verseReference: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
  },
  shareButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(94, 114, 228, 0.1)',
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#5E72E4',
  },
});

export default HomeScreen;
