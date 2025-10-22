import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GlassCard from './GlassCard';

interface GratitudeDateModalProps {
  visible: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  gratitudeEntry: any | null;
}

const GratitudeDateModal: React.FC<GratitudeDateModalProps> = ({
  visible,
  onClose,
  selectedDate,
  gratitudeEntry,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  if (!selectedDate) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: colors.text }]}>
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Gratitude Journal
              </Text>
            </View>
          </View>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {gratitudeEntry ? (
            <GlassCard style={styles.entryCard}>
              <View style={styles.entryHeader}>
                <View style={styles.dateInfo}>
                  <Ionicons name="calendar" size={20} color={colors.primary} />
                  <Text style={[styles.dateText, { color: colors.primary }]}>
                    {format(selectedDate, 'MMM d, yyyy')}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: colors.success + '20' }]}>
                  <Text style={[styles.statusText, { color: colors.success }]}>
                    Entry Found
                  </Text>
                </View>
              </View>

              {/* Gratitude Items */}
              <View style={styles.gratitudeSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  What I'm Grateful For:
                </Text>
                {gratitudeEntry.entries.map((item: string, index: number) => (
                  <View key={index} style={styles.gratitudeItem}>
                    <Text style={[styles.gratitudeNumber, { color: colors.primary }]}>
                      {index + 1}.
                    </Text>
                    <Text style={[styles.gratitudeText, { color: colors.text }]}>
                      {item}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Prayer of Thanksgiving */}
              {gratitudeEntry.prayer_of_thanksgiving && (
                <View style={styles.prayerSection}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Prayer of Thanksgiving:
                  </Text>
                  <View style={[styles.prayerContainer, { backgroundColor: colors.card }]}>
                    <Text style={[styles.prayerText, { color: colors.textSecondary }]}>
                      {gratitudeEntry.prayer_of_thanksgiving}
                    </Text>
                  </View>
                </View>
              )}

              {/* Entry Stats */}
              <View style={styles.statsSection}>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: colors.primary }]}>
                    {gratitudeEntry.entries.length}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Gratitude Items
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: colors.warning }]}>
                    {gratitudeEntry.prayer_of_thanksgiving ? '1' : '0'}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Prayers
                  </Text>
                </View>
              </View>
            </GlassCard>
          ) : (
            <GlassCard style={styles.emptyCard}>
              <Ionicons name="journal-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No Entry Found
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                No gratitude entry was found for {format(selectedDate, 'MMMM d, yyyy')}
              </Text>
            </GlassCard>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
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
  closeButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerText: {
    flex: 1,
    marginLeft: 16,
  },
  title: {
    fontSize: 24,
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
  entryCard: {
    padding: 20,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  gratitudeSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  gratitudeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  gratitudeNumber: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 12,
    marginTop: 2,
  },
  gratitudeText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
  },
  prayerSection: {
    marginBottom: 24,
  },
  prayerContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  prayerText: {
    fontSize: 16,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
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
  },
  emptyCard: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default GratitudeDateModal;
