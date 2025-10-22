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
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format, differenceInMinutes, differenceInHours } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { SupabaseManager } from '../utils/supabase';
import GlassCard from '../components/GlassCard';
import CustomButton from '../components/CustomButton';
import ProgressRing from '../components/ProgressRing';
import ModernBackButton from '../components/ModernBackButton';

const FastingTrackerScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('active');
  const [showCreator, setShowCreator] = useState(false);
  
  // Form states
  const [fastingType, setFastingType] = useState('');
  const [description, setDescription] = useState('');
  const [purpose, setPurpose] = useState('');
  const [prayerFocus, setPrayerFocus] = useState('');
  const [notes, setNotes] = useState('');
  
  // Data states
  const [activeFasting, setActiveFasting] = useState<any>(null);
  const [pastFasting, setPastFasting] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fastingTypes = [
    { id: 'water', name: 'Water Only', icon: 'water' as keyof typeof Ionicons.glyphMap, color: '#4ECDC4' },
    { id: 'food', name: 'Food Fast', icon: 'restaurant' as keyof typeof Ionicons.glyphMap, color: '#FF6B6B' },
    { id: 'social_media', name: 'Social Media', icon: 'phone-portrait' as keyof typeof Ionicons.glyphMap, color: '#825EE4' },
    { id: 'entertainment', name: 'Entertainment', icon: 'tv' as keyof typeof Ionicons.glyphMap, color: '#FFD93D' },
    { id: 'custom', name: 'Custom', icon: 'settings' as keyof typeof Ionicons.glyphMap, color: '#9CA3AF' },
  ];

  // Load fasting data
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        console.log('=== LOADING FASTING DATA ===');
        console.log('User ID:', user.id);
        
        const fastingRecords = await SupabaseManager.getFastingRecords(user.id);
        console.log('Fetched fasting records:', fastingRecords);
        console.log('Number of records:', fastingRecords.length);
        
        // Find active fasting (no end_time)
        const active = fastingRecords.find(record => !record.end_time && !record.is_completed);
        console.log('Active fasting:', active);
        setActiveFasting(active);
        
        // Past fasting records
        const past = fastingRecords.filter(record => record.end_time || record.is_completed);
        console.log('Past fasting count:', past.length);
        console.log('Past fasting records:', past);
        setPastFasting(past);
        
        console.log('=== FASTING DATA LOADED ===');
      } catch (error) {
        console.error('Error loading fasting data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const handleStartFasting = async () => {
    if (!fastingType) {
      Alert.alert('Error', 'Please select a fasting type');
      return;
    }

    try {
      if (user) {
        await SupabaseManager.saveFastingRecord(user.id, {
          type: fastingType,
          description: description.trim() || undefined,
          start_time: new Date().toISOString(),
          purpose: purpose.trim() || undefined,
          prayer_focus: prayerFocus.trim() || undefined,
          notes: notes.trim() || undefined,
        });
        
        // Refresh data
        const fastingRecords = await SupabaseManager.getFastingRecords(user.id);
        const active = fastingRecords.find(record => !record.end_time && !record.is_completed);
        setActiveFasting(active);
        
        // Reset form
        setFastingType('');
        setDescription('');
        setPurpose('');
        setPrayerFocus('');
        setNotes('');
        setShowCreator(false);
        
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', 'Fasting started!');
      }
    } catch (error) {
      console.error('Error starting fasting:', error);
      Alert.alert('Error', 'Failed to start fasting');
    }
  };

  const handleEndFasting = async () => {
    if (!activeFasting) return;

    try {
      console.log('Ending fasting for record:', activeFasting.id);
      
      const endTime = new Date().toISOString();
      const duration = differenceInMinutes(new Date(endTime), new Date(activeFasting.start_time));
      
      console.log('End time:', endTime);
      console.log('Duration minutes:', duration);
      
      // Update the existing fasting record
      await SupabaseManager.updateFastingRecord(activeFasting.id, {
        end_time: endTime,
        duration_minutes: duration,
      });
      
      console.log('Fasting record updated successfully');
      
      // Refresh data
      const fastingRecords = await SupabaseManager.getFastingRecords(user?.id || '');
      const active = fastingRecords.find(record => !record.end_time && !record.is_completed);
      setActiveFasting(active);
      const past = fastingRecords.filter(record => record.end_time || record.is_completed);
      setPastFasting(past);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Fasting completed!');
    } catch (error) {
      console.error('Error ending fasting:', error);
      Alert.alert('Error', 'Failed to end fasting');
    }
  };

  const handleDeleteFasting = async (recordId: string) => {
    try {
      console.log('handleDeleteFasting: Starting deletion of record:', recordId);
      
      await SupabaseManager.deleteFastingRecord(recordId);
      console.log('handleDeleteFasting: Record deleted successfully');
      
      // Refresh data
      const fastingRecords = await SupabaseManager.getFastingRecords(user?.id || '');
      const active = fastingRecords.find(record => !record.end_time && !record.is_completed);
      setActiveFasting(active);
      const past = fastingRecords.filter(record => record.end_time || record.is_completed);
      setPastFasting(past);
      
      console.log('handleDeleteFasting: Data refreshed successfully');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Fasting record deleted successfully!');
    } catch (error) {
      console.error('handleDeleteFasting: Error deleting fasting record:', error);
      Alert.alert('Error', 'Failed to delete fasting record');
    }
  };

  const getFastingDuration = () => {
    if (!activeFasting) return { hours: 0, minutes: 0 };
    
    const now = new Date();
    const start = new Date(activeFasting.start_time);
    const totalMinutes = differenceInMinutes(now, start);
    
    return {
      hours: Math.floor(totalMinutes / 60),
      minutes: totalMinutes % 60
    };
  };

  const renderActiveFasting = () => {
    if (!activeFasting) {
      return (
        <GlassCard style={styles.noActiveCard}>
          <Ionicons name="fast-food-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.noActiveTitle, { color: colors.text }]}>
            No Active Fasting
          </Text>
          <Text style={[styles.noActiveSubtitle, { color: colors.textSecondary }]}>
            Start a new fasting period to track your spiritual discipline
          </Text>
          <CustomButton
            title="Start Fasting"
            onPress={() => setShowCreator(true)}
            size="large"
            style={styles.startButton}
          />
        </GlassCard>
      );
    }

    const duration = getFastingDuration();
    const fastingTypeInfo = fastingTypes.find(t => t.id === activeFasting.type);

    return (
      <GlassCard style={styles.activeCard}>
        <View style={styles.activeHeader}>
          <View style={[styles.activeIcon, { backgroundColor: fastingTypeInfo?.color + '20' }]}>
            <Ionicons 
              name={fastingTypeInfo?.icon || 'star'} 
              size={24} 
              color={fastingTypeInfo?.color || colors.primary} 
            />
          </View>
          <View style={styles.activeInfo}>
            <Text style={[styles.activeType, { color: colors.text }]}>
              {fastingTypeInfo?.name || activeFasting.type}
            </Text>
            <Text style={[styles.activeStartTime, { color: colors.textSecondary }]}>
              Started {format(new Date(activeFasting.start_time), 'MMM d, h:mm a')}
            </Text>
          </View>
        </View>

        <View style={styles.durationSection}>
          <Text style={[styles.durationTitle, { color: colors.text }]}>
            Fasting Duration
          </Text>
          <View style={styles.durationDisplay}>
            <View style={styles.durationItem}>
              <Text style={[styles.durationNumber, { color: colors.primary }]}>
                {duration.hours}
              </Text>
              <Text style={[styles.durationLabel, { color: colors.textSecondary }]}>
                Hours
              </Text>
            </View>
            <View style={styles.durationItem}>
              <Text style={[styles.durationNumber, { color: colors.primary }]}>
                {duration.minutes}
              </Text>
              <Text style={[styles.durationLabel, { color: colors.textSecondary }]}>
                Minutes
              </Text>
            </View>
          </View>
        </View>

        {activeFasting.purpose && (
          <View style={styles.purposeSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Purpose</Text>
            <Text style={[styles.purposeText, { color: colors.textSecondary }]}>
              {activeFasting.purpose}
            </Text>
          </View>
        )}

        {activeFasting.prayer_focus && (
          <View style={styles.prayerSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Prayer Focus</Text>
            <Text style={[styles.prayerText, { color: colors.textSecondary }]}>
              {activeFasting.prayer_focus}
            </Text>
          </View>
        )}

        <CustomButton
          title="End Fasting"
          onPress={handleEndFasting}
          size="large"
          style={styles.endButton}
        />
      </GlassCard>
    );
  };

  const renderPastFasting = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {pastFasting.length === 0 ? (
        <GlassCard style={styles.emptyCard}>
          <Ionicons name="time-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No Past Fasting Records
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Complete a fasting period to see your records here
          </Text>
        </GlassCard>
      ) : (
        <>
          {pastFasting.map((record) => {
            const fastingTypeInfo = fastingTypes.find(t => t.id === record.type);
            const duration = record.duration_minutes || 0;
            const hours = Math.floor(duration / 60);
            const minutes = duration % 60;
            
            return (
              <GlassCard key={record.id} style={styles.recordCard}>
              <View style={styles.recordHeader}>
                <View style={[styles.recordIcon, { backgroundColor: fastingTypeInfo?.color + '20' }]}>
                  <Ionicons 
                    name={fastingTypeInfo?.icon || 'star'} 
                    size={20} 
                    color={fastingTypeInfo?.color || colors.primary} 
                  />
                </View>
                <View style={styles.recordInfo}>
                  <Text style={[styles.recordType, { color: colors.text }]}>
                    {fastingTypeInfo?.name || record.type}
                  </Text>
                  <Text style={[styles.recordDate, { color: colors.textSecondary }]}>
                    {format(new Date(record.start_time), 'MMM d, yyyy')}
                  </Text>
                </View>
                <View style={styles.recordDuration}>
                  <Text style={[styles.durationText, { color: colors.primary }]}>
                    {hours}h {minutes}m
                  </Text>
                </View>
              </View>
              
              {record.description && (
                <Text style={[styles.recordDescription, { color: colors.textSecondary }]}>
                  {record.description}
                </Text>
              )}
              
              {record.purpose && (
                <View style={styles.recordSection}>
                  <Text style={[styles.recordLabel, { color: colors.text }]}>Purpose:</Text>
                  <Text style={[styles.recordValue, { color: colors.textSecondary }]}>
                    {record.purpose}
                  </Text>
                </View>
              )}
              
              {record.prayer_focus && (
                <View style={styles.recordSection}>
                  <Text style={[styles.recordLabel, { color: colors.text }]}>Prayer Focus:</Text>
                  <Text style={[styles.recordValue, { color: colors.textSecondary }]}>
                    {record.prayer_focus}
                  </Text>
                </View>
              )}
              
              <View style={styles.recordActions}>
                <TouchableOpacity
                  style={[styles.deleteButton, { backgroundColor: '#FF6B6B' }]}
                  onPress={async () => {
                    try {
                      console.log('Deleting fasting record:', record.id);
                      await SupabaseManager.deleteFastingRecord(record.id);
                      
                      // Refresh data
                      const fastingRecords = await SupabaseManager.getFastingRecords(user?.id || '');
                      const active = fastingRecords.find(r => !r.end_time && !r.is_completed);
                      setActiveFasting(active);
                      const past = fastingRecords.filter(r => r.end_time || r.is_completed);
                      setPastFasting(past);
                      
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      Alert.alert('Success', 'Fasting record deleted successfully!');
                    } catch (error) {
                      console.error('Error deleting fasting record:', error);
                      Alert.alert('Error', 'Failed to delete fasting record');
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="trash-outline" size={16} color="white" />
                  <Text style={[styles.deleteButtonText, { color: 'white' }]}>
                    Delete
                  </Text>
                </TouchableOpacity>
              </View>
              </GlassCard>
            );
          })}
        </>
      )}
    </ScrollView>
  );

  const renderCreator = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <GlassCard style={styles.creatorCard}>
        <Text style={[styles.creatorTitle, { color: colors.text }]}>
          Start New Fasting
        </Text>

        <View style={styles.inputSection}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Fasting Type *</Text>
          <View style={styles.typeGrid}>
            {fastingTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.typeButton,
                  {
                    backgroundColor: fastingType === type.id 
                      ? type.color + '20' 
                      : colors.card,
                    borderColor: fastingType === type.id 
                      ? type.color 
                      : colors.border,
                  },
                ]}
                onPress={() => {
                  setFastingType(type.id);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Ionicons name={type.icon} size={24} color={type.color} />
                <Text style={[styles.typeName, { color: colors.text }]}>
                  {type.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputSection}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Description</Text>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe your fasting plan"
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.inputSection}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Purpose</Text>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            value={purpose}
            onChangeText={setPurpose}
            placeholder="Why are you fasting?"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.inputSection}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Prayer Focus</Text>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            value={prayerFocus}
            onChangeText={setPrayerFocus}
            placeholder="What will you pray about during this fast?"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.inputSection}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Notes</Text>
          <TextInput
            style={[
              styles.textInput,
              styles.textArea,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Additional notes"
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={3}
          />
        </View>

        <CustomButton
          title="Start Fasting"
          onPress={handleStartFasting}
          size="large"
          style={styles.startButton}
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
            <Text style={[styles.title, { color: colors.text }]}>Fasting Tracker</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Spiritual discipline through fasting
            </Text>
          </View>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        {[
          { id: 'active', label: 'Active' },
          { id: 'past', label: 'History' },
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
        {activeTab === 'active' && renderActiveFasting()}
        {activeTab === 'past' && renderPastFasting()}
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => {
          setShowCreator(true);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>

      {/* Creator Modal */}
      <Modal
        visible={showCreator}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreator(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity
              onPress={() => setShowCreator(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Start New Fasting
            </Text>
            <View style={styles.modalSpacer} />
          </View>
          
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {renderCreator()}
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
  noActiveCard: {
    padding: 40,
    alignItems: 'center',
  },
  noActiveTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  noActiveSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  startButton: {
    marginTop: 8,
  },
  activeCard: {
    padding: 20,
  },
  activeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  activeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  activeInfo: {
    flex: 1,
  },
  activeType: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  activeStartTime: {
    fontSize: 14,
  },
  durationSection: {
    marginBottom: 20,
  },
  durationTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  durationDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationItem: {
    alignItems: 'center',
    marginHorizontal: 20,
  },
  durationNumber: {
    fontSize: 32,
    fontWeight: '700',
  },
  durationLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  purposeSection: {
    marginBottom: 16,
  },
  prayerSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  purposeText: {
    fontSize: 14,
    lineHeight: 20,
  },
  prayerText: {
    fontSize: 14,
    lineHeight: 20,
  },
  endButton: {
    marginTop: 8,
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
  recordCard: {
    padding: 16,
    marginBottom: 12,
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  recordIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recordInfo: {
    flex: 1,
  },
  recordType: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  recordDate: {
    fontSize: 12,
  },
  recordDuration: {
    alignItems: 'flex-end',
  },
  durationText: {
    fontSize: 14,
    fontWeight: '600',
  },
  recordDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  recordSection: {
    marginBottom: 8,
  },
  recordLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  recordValue: {
    fontSize: 14,
    lineHeight: 18,
  },
  recordActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
    minHeight: 40,
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  modalCloseButton: {
    padding: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginRight: 29, // Compensate for close button width
  },
  modalSpacer: {
    width: 29, // Same as close button width for centering
  },
  modalContent: {
    flex: 1,
    padding: 20,
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
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  typeButton: {
    width: '48%',
    aspectRatio: 1.2,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
  },
  typeName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
});

export default FastingTrackerScreen;
