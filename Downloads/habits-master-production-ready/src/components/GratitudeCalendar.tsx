import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { useTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface GratitudeCalendarProps {
  gratitudeEntries: any[];
  onDateSelect: (date: Date) => void;
}

const GratitudeCalendar: React.FC<GratitudeCalendarProps> = ({
  gratitudeEntries,
  onDateSelect,
}) => {
  const { colors, isDark } = useTheme();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get the first day of the month to calculate offset
  const firstDayOfMonth = monthStart.getDay();
  const daysInPreviousMonth = firstDayOfMonth;

  // Create array of days to display (including empty cells for alignment)
  const calendarDays = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < daysInPreviousMonth; i++) {
    calendarDays.push(null);
  }
  
  // Add days of the current month
  daysInMonth.forEach(day => {
    calendarDays.push(day);
  });

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentMonth(subMonths(currentMonth, 1));
    } else {
      setCurrentMonth(addMonths(currentMonth, 1));
    }
  };

  const hasGratitudeEntry = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return gratitudeEntries.some(entry => {
      const entryDate = entry.date;
      let entryDateStr = '';
      if (typeof entryDate === 'string') {
        entryDateStr = entryDate.split('T')[0];
      } else if (entryDate instanceof Date) {
        entryDateStr = entryDate.toISOString().split('T')[0];
      }
      return entryDateStr === dateString;
    });
  };

  const isToday = (date: Date) => {
    return isSameDay(date, new Date());
  };

  const isSelected = (date: Date) => {
    return selectedDate && isSameDay(date, selectedDate);
  };

  const handleDatePress = (date: Date) => {
    setSelectedDate(date);
    onDateSelect(date);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      {/* Modern Header with Gradient */}
      <LinearGradient
        colors={[colors.primary + '10', colors.primary + '05']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.navButton, { backgroundColor: colors.primary + '20' }]}
            onPress={() => navigateMonth('prev')}
          >
            <Ionicons name="chevron-back" size={20} color={colors.primary} />
          </TouchableOpacity>
          
          <View style={styles.monthContainer}>
            <Text style={[styles.monthTitle, { color: colors.text }]}>
              {format(currentMonth, 'MMMM')}
            </Text>
            <Text style={[styles.yearTitle, { color: colors.textSecondary }]}>
              {format(currentMonth, 'yyyy')}
            </Text>
          </View>
          
          <TouchableOpacity
            style={[styles.navButton, { backgroundColor: colors.primary + '20' }]}
            onPress={() => navigateMonth('next')}
          >
            <Ionicons name="chevron-forward" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Modern Days of week header */}
      <View style={[styles.weekHeader, { backgroundColor: colors.background }]}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
          <View key={day} style={styles.weekDayContainer}>
            <Text style={[styles.weekDay, { color: colors.textSecondary }]}>
              {day}
            </Text>
          </View>
        ))}
      </View>

      {/* Modern Calendar grid */}
      <View style={styles.calendarGrid}>
        {calendarDays.map((day, index) => {
          if (!day) {
            return <View key={index} style={styles.dayCell} />;
          }

          const hasEntry = hasGratitudeEntry(day);
          const isCurrentDay = isToday(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelectedDay = isSelected(day);

          return (
            <TouchableOpacity
              key={day.toISOString()}
              style={[
                styles.dayCell,
                isSelectedDay && {
                  backgroundColor: colors.primary + '20',
                  borderWidth: 2,
                  borderColor: colors.primary,
                },
              ]}
              onPress={() => handleDatePress(day)}
              activeOpacity={0.7}
            >
              {isCurrentDay && (
                <LinearGradient
                  colors={[colors.primary, colors.primary + 'CC']}
                  style={styles.todayGradient}
                />
              )}
              
              <Text
                style={[
                  styles.dayText,
                  {
                    color: isCurrentMonth
                      ? isCurrentDay
                        ? '#FFFFFF'
                        : isSelectedDay
                        ? colors.primary
                        : colors.text
                      : colors.textSecondary,
                    fontWeight: isCurrentDay ? '700' : isSelectedDay ? '600' : '500',
                  },
                ]}
              >
                {format(day, 'd')}
              </Text>
              
              {hasEntry && (
                <View style={styles.entryIndicatorContainer}>
                  <View
                    style={[
                      styles.entryIndicator,
                      {
                        backgroundColor: isCurrentDay 
                          ? '#FFFFFF' 
                          : isSelectedDay 
                          ? colors.primary 
                          : colors.primary + '80',
                      },
                    ]}
                  />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>
            Has gratitude entry
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthContainer: {
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  yearTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  weekHeader: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  weekDayContainer: {
    flex: 1,
    alignItems: 'center',
  },
  weekDay: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    paddingBottom: 16,
  },
  dayCell: {
    width: (width - 80) / 7,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderRadius: 12,
    marginVertical: 2,
  },
  todayGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
  },
  dayText: {
    fontSize: 16,
    zIndex: 1,
  },
  entryIndicatorContainer: {
    position: 'absolute',
    bottom: 6,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  entryIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default GratitudeCalendar;
