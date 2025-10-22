import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { SupabaseManager } from '../utils/supabase';
import GlassCard from '../components/GlassCard';
import ModernBackButton from '../components/ModernBackButton';
import CustomButton from '../components/CustomButton';
import GratitudeCalendar from '../components/GratitudeCalendar';
import GratitudeDateModal from '../components/GratitudeDateModal';

const GratitudeJournalScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('today');
  
  // Form states
  const [gratitudeEntries, setGratitudeEntries] = useState<string[]>(['']);
  const [prayerOfThanksgiving, setPrayerOfThanksgiving] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Data states
  const [todayEntry, setTodayEntry] = useState<any>(null);
  const [pastEntries, setPastEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Calendar and modal states
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);

  // Load today's entry and past entries
  const loadData = async () => {
    if (!user) {
      console.log('No user found, cannot load gratitude data');
      return;
    }
    
    try {
      setLoading(true);
      
      const entries = await SupabaseManager.getGratitudeEntries(user.id);
      
      // Find today's entry - use more robust date comparison
      const today = new Date().toISOString().split('T')[0];
      const todayDate = new Date();
      const todayString = todayDate.toISOString().split('T')[0];
      
      
      // Check if entries is null or undefined
      if (!entries) {
        console.log('ERROR: entries is null or undefined');
        setTodayEntry(null);
        setPastEntries([]);
        return;
      }
      
      
      // Simplified and more reliable date comparison
      const todayEntry = entries.find(entry => {
        const entryDate = entry.date;
        
        // Convert entry date to string format for comparison
        let entryDateStr = '';
        if (typeof entryDate === 'string') {
          entryDateStr = entryDate.split('T')[0]; // Remove time part if present
        } else if (entryDate instanceof Date) {
          entryDateStr = entryDate.toISOString().split('T')[0];
        } else {
          return false;
        }
        
        const isToday = entryDateStr === today;
        return isToday;
      });
      
      const pastEntries = entries.filter(entry => {
        const entryDate = entry.date;
        
        // Convert entry date to string format for comparison
        let entryDateStr = '';
        if (typeof entryDate === 'string') {
          entryDateStr = entryDate.split('T')[0]; // Remove time part if present
        } else if (entryDate instanceof Date) {
          entryDateStr = entryDate.toISOString().split('T')[0];
        } else {
          return true; // Include if we can't determine the date
        }
        
        const isNotToday = entryDateStr !== today;
        return isNotToday;
      });
      
      
      // Enhanced fallback logic to ensure entries are properly categorized
      if (!todayEntry && entries.length > 0) {
        const mostRecentEntry = entries[0]; // Already ordered by date desc
        const today = new Date().toISOString().split('T')[0];
        const entryDate = mostRecentEntry.date;
        
        // Check if the most recent entry is from today
        let isFromToday = false;
        if (typeof entryDate === 'string') {
          const entryDateStr = entryDate.split('T')[0];
          isFromToday = entryDateStr === today;
        } else if (entryDate instanceof Date) {
          isFromToday = entryDate.toISOString().split('T')[0] === today;
        }
        
        
        if (isFromToday) {
          setTodayEntry(mostRecentEntry);
          setPastEntries(entries.slice(1));
        } else {
          setTodayEntry(null);
          setPastEntries(entries);
        }
      } else {
        setTodayEntry(todayEntry);
        setPastEntries(pastEntries);
      }
      
      // Final safety check: if we still have no past entries but we have entries, 
      // force all entries except today's to be past entries
      if (pastEntries.length === 0 && entries.length > 0 && todayEntry) {
        const allPastEntries = entries.filter(entry => entry.id !== todayEntry.id);
        setPastEntries(allPastEntries);
      }
      
      // If today's entry exists, populate the form
      if (todayEntry) {
        setGratitudeEntries(todayEntry.entries || ['']);
        setPrayerOfThanksgiving(todayEntry.prayer_of_thanksgiving || '');
      }
    } catch (error) {
      console.error('Error loading gratitude entries:', error);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadData();
  }, [user]);

  const addGratitudeEntry = () => {
    setGratitudeEntries([...gratitudeEntries, '']);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const removeGratitudeEntry = (index: number) => {
    if (gratitudeEntries.length > 1) {
      const newEntries = gratitudeEntries.filter((_, i) => i !== index);
      setGratitudeEntries(newEntries);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const updateGratitudeEntry = (index: number, text: string) => {
    const newEntries = [...gratitudeEntries];
    newEntries[index] = text;
    setGratitudeEntries(newEntries);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    
    // Find entry for the selected date
    const allEntries = [...pastEntries];
    if (todayEntry) {
      allEntries.unshift(todayEntry);
    }
    
    const entryForDate = allEntries.find(entry => {
      const entryDate = entry.date;
      let entryDateStr = '';
      if (typeof entryDate === 'string') {
        entryDateStr = entryDate.split('T')[0];
      } else if (entryDate instanceof Date) {
        entryDateStr = entryDate.toISOString().split('T')[0];
      }
      const selectedDateStr = date.toISOString().split('T')[0];
      return entryDateStr === selectedDateStr;
    });
    
    setSelectedEntry(entryForDate || null);
    setModalVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSaveEntry = async () => {
    const validEntries = gratitudeEntries.filter(entry => entry.trim() !== '');

    if (validEntries.length === 0) {
      Alert.alert('Error', 'Please add at least one thing you are grateful for');
      return;
    }

    try {
      setIsSubmitting(true);

      if (user) {
        try {
          const result = await SupabaseManager.saveGratitudeEntry(user.id, {
            entries: validEntries,
            prayer_of_thanksgiving: prayerOfThanksgiving.trim() || undefined,
            date: new Date().toISOString().split('T')[0]
          });

          // Refresh data with a small delay to ensure data is committed
          setTimeout(async () => {
            await loadData();
          }, 500);

          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert('Success', 'Gratitude entry saved!');
        } catch (error) {
          console.error('Error saving gratitude entry:', error);
          Alert.alert('Error', 'Failed to save gratitude entry. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error saving gratitude entry:', error);
      Alert.alert('Error', 'Failed to save gratitude entry');
    } finally {
      setIsSubmitting(false);
    }
  };


  const renderTodayForm = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <GlassCard style={styles.formCard}>
        <Text style={[styles.formTitle, { color: colors.text }]}>
          Today's Gratitude
        </Text>
        <Text style={[styles.formSubtitle, { color: colors.textSecondary }]}>
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </Text>

        <View style={styles.entriesSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            What are you grateful for today?
          </Text>
          
          {gratitudeEntries.map((entry, index) => (
            <View key={index} style={styles.entryRow}>
              <Text style={[styles.entryNumber, { color: colors.primary }]}>
                {index + 1}.
              </Text>
              <TextInput
                style={[
                  styles.entryInput,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                value={entry}
                onChangeText={(text) => updateGratitudeEntry(index, text)}
                placeholder="I am grateful for..."
                placeholderTextColor={colors.textSecondary}
                multiline
              />
              {gratitudeEntries.length > 1 && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeGratitudeEntry(index)}
                >
                  <Ionicons name="close-circle" size={20} color="#FF3B30" />
                </TouchableOpacity>
              )}
            </View>
          ))}
          
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary + '20' }]}
            onPress={addGratitudeEntry}
          >
            <Ionicons name="add" size={20} color={colors.primary} />
            <Text style={[styles.addButtonText, { color: colors.primary }]}>
              Add Another
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.prayerSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Prayer of Thanksgiving
          </Text>
          <TextInput
            style={[
              styles.prayerInput,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            value={prayerOfThanksgiving}
            onChangeText={setPrayerOfThanksgiving}
            placeholder="Thank you, Lord, for..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
          />
        </View>

        <CustomButton
          title={todayEntry ? "Update Entry" : "Save Entry"}
          onPress={handleSaveEntry}
          size="large"
          style={styles.saveButton}
          loading={isSubmitting}
        />
        
      </GlassCard>
    </ScrollView>
  );

  const renderPastEntries = () => {
    const allEntries = [...pastEntries];
    if (todayEntry) {
      allEntries.unshift(todayEntry);
    }

    return (
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadData}
            tintColor={colors.primary}
          />
        }
      >
        {/* Calendar */}
        <GratitudeCalendar
          gratitudeEntries={allEntries}
          onDateSelect={handleDateSelect}
        />

        {/* Past Entries List */}
        {pastEntries.length === 0 ? (
          <GlassCard style={styles.emptyCard}>
            <Ionicons name="journal-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Past Entries
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Start writing your gratitude journal to see your entries here
            </Text>
          </GlassCard>
        ) : (
          pastEntries.map((entry, index) => (
            <GlassCard key={entry.id} style={styles.entryCard}>
              <View style={styles.entryHeader}>
                <Text style={[styles.entryDate, { color: colors.primary }]}>
                  {format(new Date(entry.date), 'MMM d, yyyy')}
                </Text>
                <Text style={[styles.entryDay, { color: colors.textSecondary }]}>
                  {format(new Date(entry.date), 'EEEE')}
                </Text>
              </View>
              
              <View style={styles.entryContent}>
                {entry.entries.map((gratitudeItem: string, itemIndex: number) => (
                  <View key={itemIndex} style={styles.gratitudeItem}>
                    <Text style={[styles.gratitudeNumber, { color: colors.primary }]}>
                      {itemIndex + 1}.
                    </Text>
                    <Text style={[styles.gratitudeText, { color: colors.text }]}>
                      {gratitudeItem}
                    </Text>
                  </View>
                ))}
              </View>
              
              {entry.prayer_of_thanksgiving && (
                <View style={styles.prayerDisplaySection}>
                  <Text style={[styles.prayerLabel, { color: colors.text }]}>
                    Prayer of Thanksgiving:
                  </Text>
                  <Text style={[styles.prayerText, { color: colors.textSecondary }]}>
                    {entry.prayer_of_thanksgiving}
                  </Text>
                </View>
              )}
            </GlassCard>
          ))
        )}
      </ScrollView>
    );
  };

  const renderStatistics = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <GlassCard style={styles.statsCard}>
        <Text style={[styles.statsTitle, { color: colors.text }]}>
          Gratitude Statistics
        </Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>
              {pastEntries.length + (todayEntry ? 1 : 0)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Total Entries
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.success }]}>
              {pastEntries.reduce((total, entry) => total + entry.entries.length, 0) + 
               (todayEntry ? todayEntry.entries.length : 0)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Gratitude Items
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.warning }]}>
              {pastEntries.filter(entry => entry.prayer_of_thanksgiving).length + 
               (todayEntry?.prayer_of_thanksgiving ? 1 : 0)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Prayers Written
            </Text>
          </View>
        </View>
      </GlassCard>

      <GlassCard style={styles.insightsCard}>
        <Text style={[styles.insightsTitle, { color: colors.text }]}>
          Gratitude Insights
        </Text>
        <Text style={[styles.insightsText, { color: colors.textSecondary }]}>
          "Give thanks in all circumstances; for this is God's will for you in Christ Jesus."
        </Text>
        <Text style={[styles.insightsReference, { color: colors.primary }]}>
          — 1 Thessalonians 5:18
        </Text>
      </GlassCard>
    </ScrollView>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={styles.headerContent}>
          <ModernBackButton onPress={() => navigation.goBack()} />
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: colors.text }]}>Gratitude Journal</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Count your blessings
            </Text>
          </View>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        {[
          { id: 'today', label: 'Today' },
          { id: 'past', label: 'History' },
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
              // Refresh data when switching to history tab
              if (tab.id === 'past') {
                loadData();
              }
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
        {activeTab === 'today' && renderTodayForm()}
        {activeTab === 'past' && renderPastEntries()}
        {activeTab === 'stats' && renderStatistics()}
      </View>

      {/* Date Modal */}
      <GratitudeDateModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        selectedDate={selectedDate}
        gratitudeEntry={selectedEntry}
      />
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
  formCard: {
    padding: 20,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 16,
    marginBottom: 24,
  },
  entriesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  entryNumber: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
    marginTop: 12,
  },
  entryInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 50,
  },
  removeButton: {
    marginLeft: 8,
    marginTop: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(94, 114, 228, 0.3)',
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  prayerSection: {
    marginBottom: 24,
  },
  prayerInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  saveButton: {
    marginTop: 8,
  },
  debugButton: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  debugButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
  entryCard: {
    padding: 16,
    marginBottom: 12,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  entryDate: {
    fontSize: 16,
    fontWeight: '600',
  },
  entryDay: {
    fontSize: 14,
  },
  entryContent: {
    marginBottom: 16,
  },
  gratitudeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  gratitudeNumber: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
    marginTop: 2,
  },
  gratitudeText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  prayerDisplaySection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  prayerLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  prayerText: {
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
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
  insightsCard: {
    padding: 20,
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  insightsText: {
    fontSize: 16,
    lineHeight: 24,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  insightsReference: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default GratitudeJournalScreen;
