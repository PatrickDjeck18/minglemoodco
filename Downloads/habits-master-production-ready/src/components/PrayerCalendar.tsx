import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import GlassCard from './GlassCard';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');

interface PrayerDay {
  date: Date;
  hasPrayer: boolean;
  prayerDuration?: number; // in minutes
  prayerType?: 'morning' | 'evening' | 'both';
  intensity?: 'low' | 'medium' | 'high';
  completed?: boolean; // whether the prayer session was completed
}

interface PrayerCalendarProps {
  prayerDays: PrayerDay[];
  onDayPress?: (date: Date) => void;
  onMonthChange?: (date: Date) => void;
}

const PrayerCalendar: React.FC<PrayerCalendarProps> = ({
  prayerDays,
  onDayPress,
  onMonthChange,
}) => {
  const { colors, isDark } = useTheme();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isTransitioning, setIsTransitioning] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const navigateMonth = async (direction: 'prev' | 'next') => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Animate out
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Change month
      const newMonth = direction === 'next' 
        ? addMonths(currentMonth, 1) 
        : subMonths(currentMonth, 1);
      
      setCurrentMonth(newMonth);
      onMonthChange?.(newMonth);
      
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsTransitioning(false);
      });
    });
  };

  const getPrayerDayData = (date: Date) => {
    return prayerDays.find(day => isSameDay(day.date, date));
  };

  const getPrayerStatusColor = (date: Date) => {
    const prayerData = getPrayerDayData(date);
    if (!prayerData?.hasPrayer) return 'transparent';
    
    switch (prayerData.intensity) {
      case 'high':
        return isDark ? '#4CAF50' : '#8BC34A';
      case 'medium':
        return isDark ? '#2196F3' : '#1976D2';
      case 'low':
        return isDark ? '#FF9800' : '#F57C00';
      default:
        return isDark ? '#9C27B0' : '#E91E63';
    }
  };

  const getPrayerGradientColors = (date: Date): [string, string] => {
    const prayerData = getPrayerDayData(date);
    if (!prayerData?.hasPrayer) return ['transparent', 'transparent'];
    
    switch (prayerData.intensity) {
      case 'high':
        return isDark ? ['#4CAF50', '#8BC34A'] : ['#8BC34A', '#689F38'];
      case 'medium':
        return isDark ? ['#2196F3', '#1976D2'] : ['#1976D2', '#1565C0'];
      case 'low':
        return isDark ? ['#FF9800', '#F57C00'] : ['#F57C00', '#E65100'];
      default:
        return isDark ? ['#9C27B0', '#E91E63'] : ['#E91E63', '#C2185B'];
    }
  };

  const getPrayerStatusIcon = (date: Date) => {
    const prayerData = getPrayerDayData(date);
    if (!prayerData?.hasPrayer) return '';
    
    switch (prayerData.prayerType) {
      case 'morning':
        return '🌅';
      case 'evening':
        return '🌙';
      case 'both':
        return '⛪';
      default:
        return '🙏';
    }
  };

  const getPrayerDurationText = (date: Date) => {
    const prayerData = getPrayerDayData(date);
    if (!prayerData?.prayerDuration) return '';
    
    const duration = prayerData.prayerDuration;
    if (duration < 60) {
      return `${duration}m`;
    } else {
      const hours = Math.floor(duration / 60);
      const minutes = duration % 60;
      return minutes > 0 ? `${hours}h${minutes}m` : `${hours}h`;
    }
  };

  const getCompletionMark = (date: Date) => {
    const prayerData = getPrayerDayData(date);
    if (!prayerData?.hasPrayer || !prayerData?.completed) return null;
    
    return (
      <View style={styles.completionMark}>
        <Text style={styles.completionCheckmark}>✓</Text>
      </View>
    );
  };

  const handleDayPress = (date: Date) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDayPress?.(date);
  };

  const renderDay = (date: Date) => {
    const isCurrentMonth = isSameMonth(date, currentMonth);
    const isToday = isSameDay(date, new Date());
    const prayerData = getPrayerDayData(date);
    const prayerColor = getPrayerStatusColor(date);
    const prayerGradientColors = getPrayerGradientColors(date);
    const prayerIcon = getPrayerStatusIcon(date);
    const durationText = getPrayerDurationText(date);

    return (
      <TouchableOpacity
        key={date.toISOString()}
        style={[
          styles.dayContainer,
          {
            backgroundColor: isToday ? colors.primary + '20' : 'transparent',
            borderColor: isToday ? colors.primary : 'transparent',
          },
        ]}
        onPress={() => handleDayPress(date)}
        activeOpacity={0.6}
      >
        {prayerData?.hasPrayer ? (
          <LinearGradient
            colors={prayerGradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.prayerGradient}
          >
            <View style={styles.dayContent}>
              <Text
                style={[
                  styles.dayText,
                  {
                    color: '#FFFFFF',
                    fontWeight: isToday ? '700' : '600',
                    textShadowColor: 'rgba(0,0,0,0.3)',
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 2,
                  },
                ]}
              >
                {format(date, 'd')}
              </Text>
              
              <View style={styles.prayerIndicator}>
                <View
                  style={[
                    styles.prayerDot,
                    { backgroundColor: '#FFFFFF' },
                  ]}
                />
                {prayerIcon && (
                  <Text style={[styles.prayerIcon, { color: '#FFFFFF' }]}>
                    {prayerIcon}
                  </Text>
                )}
                {durationText && (
                  <Text style={[styles.durationText, { color: '#FFFFFF' }]}>
                    {durationText}
                  </Text>
                )}
              </View>
            </View>
            {getCompletionMark(date)}
          </LinearGradient>
        ) : (
          <View style={styles.dayContent}>
            <Text
              style={[
                styles.dayText,
                {
                  color: isCurrentMonth ? colors.text : colors.textSecondary,
                  fontWeight: isToday ? '700' : '500',
                },
              ]}
            >
              {format(date, 'd')}
            </Text>
            {getCompletionMark(date)}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderWeekHeader = () => {
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <View style={styles.weekHeader}>
        {weekDays.map((day) => (
          <Text
            key={day}
            style={[
              styles.weekDayText, 
              { 
                color: colors.textSecondary,
                fontWeight: '600',
                letterSpacing: 0.5,
              }
            ]}
          >
            {day}
          </Text>
        ))}
      </View>
    );
  };

  const renderMonthHeader = () => (
    <View style={styles.monthHeader}>
      <TouchableOpacity
        style={[styles.navButton, { backgroundColor: colors.card }]}
        onPress={() => navigateMonth('prev')}
        activeOpacity={0.6}
        disabled={isTransitioning}
      >
        <LinearGradient
          colors={[colors.primary + '20', colors.primary + '10']}
          style={styles.navButtonGradient}
        >
          <Text style={[styles.navButtonText, { color: colors.text }]}>‹</Text>
        </LinearGradient>
      </TouchableOpacity>
      
      <Animated.View 
        style={[
          styles.monthTitleContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Text style={[styles.monthTitle, { color: colors.text }]}>
          {format(currentMonth, 'MMMM yyyy')}
        </Text>
      </Animated.View>
      
      <TouchableOpacity
        style={[styles.navButton, { backgroundColor: colors.card }]}
        onPress={() => navigateMonth('next')}
        activeOpacity={0.6}
        disabled={isTransitioning}
      >
        <LinearGradient
          colors={[colors.primary + '20', colors.primary + '10']}
          style={styles.navButtonGradient}
        >
          <Text style={[styles.navButtonText, { color: colors.text }]}>›</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderLegend = () => (
    <View style={styles.legend}>
      <Text style={[styles.legendTitle, { color: colors.text }]}>
        Prayer Intensity
      </Text>
      <View style={styles.legendItems}>
        <View style={styles.legendItem}>
          <LinearGradient
            colors={isDark ? ['#4CAF50', '#8BC34A'] as [string, string] : ['#8BC34A', '#689F38'] as [string, string]}
            style={styles.legendGradient}
          />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>
            High
          </Text>
        </View>
        <View style={styles.legendItem}>
          <LinearGradient
            colors={isDark ? ['#2196F3', '#1976D2'] as [string, string] : ['#1976D2', '#1565C0'] as [string, string]}
            style={styles.legendGradient}
          />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>
            Medium
          </Text>
        </View>
        <View style={styles.legendItem}>
          <LinearGradient
            colors={isDark ? ['#FF9800', '#F57C00'] as [string, string] : ['#F57C00', '#E65100'] as [string, string]}
            style={styles.legendGradient}
          />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>
            Low
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <GlassCard style={styles.calendarCard}>
      {renderMonthHeader()}
      {renderWeekHeader()}
      
      <Animated.View 
        style={[
          styles.calendarGrid,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {days.map((date) => renderDay(date))}
      </Animated.View>
      
      {renderLegend()}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  calendarCard: {
    padding: 24,
    marginBottom: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  navButtonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  navButtonText: {
    fontSize: 22,
    fontWeight: '700',
  },
  monthTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    paddingVertical: 10,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  dayContainer: {
    width: (width - 100) / 7,
    aspectRatio: 1,
    borderWidth: 1,
    borderRadius: 12,
    margin: 3,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dayContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    width: '100%',
  },
  prayerGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  dayText: {
    fontSize: 16,
    marginBottom: 2,
    fontWeight: '600',
  },
  prayerIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  prayerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  prayerIcon: {
    fontSize: 12,
    fontWeight: '600',
  },
  durationText: {
    fontSize: 8,
    fontWeight: '600',
    marginTop: 1,
  },
  legend: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 20,
    marginTop: 8,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  legendItems: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  legendGradient: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  completionMark: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  completionCheckmark: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});

export default PrayerCalendar;
