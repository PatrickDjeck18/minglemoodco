import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSubscription } from '../context/SubscriptionContext';
import { colors } from '../constants/colors';

interface TrialBannerProps {
  onPress?: () => void;
}

const TrialBanner: React.FC<TrialBannerProps> = ({ onPress }) => {
  const { isInTrial, trialDaysRemaining, isSubscribed } = useSubscription();

  // Don't show banner if user is subscribed or not in trial
  if (isSubscribed || !isInTrial) {
    return null;
  }

  const getTrialMessage = () => {
    if (trialDaysRemaining === 1) {
      return 'Last day of your free trial!';
    } else if (trialDaysRemaining === 0) {
      return 'Your free trial has ended';
    } else {
      return `${trialDaysRemaining} days left in your free trial`;
    }
  };

  const getBannerColor = () => {
    if (trialDaysRemaining === 0) {
      return [colors.error, colors.errorLight];
    } else if (trialDaysRemaining === 1) {
      return [colors.warning, colors.warningLight];
    } else {
      return [colors.accent, colors.accentLight];
    }
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <LinearGradient
        colors={getBannerColor()}
        style={styles.banner}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.bannerContent}>
          <Ionicons 
            name={trialDaysRemaining === 0 ? "alert-circle" : "time"} 
            size={20} 
            color={colors.white} 
          />
          <Text style={styles.bannerText}>{getTrialMessage()}</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.white} />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  bannerText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
    flex: 1,
  },
});

export default TrialBanner;
