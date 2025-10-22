import { useSubscription as useSubscriptionContext } from '../context/SubscriptionContext';

export const useSubscription = () => {
  const subscription = useSubscriptionContext();
  
  // Helper functions for common subscription checks
  const isPremiumFeature = (feature: string): boolean => {
    // Define which features require premium
    const premiumFeatures = [
      'no_ads',
      'advanced_statistics',
      'cloud_sync',
      'premium_prayer_features',
      'priority_support',
      'export_data',
      'custom_themes',
    ];
    
    return premiumFeatures.includes(feature);
  };

  const shouldShowAds = (): boolean => {
    return !subscription.isSubscribed && !subscription.isInTrial;
  };

  const canAccessFeature = (feature: string): boolean => {
    if (!isPremiumFeature(feature)) {
      return true; // Free feature
    }
    
    return subscription.isSubscribed || subscription.isInTrial;
  };

  const getTrialStatus = () => {
    if (subscription.isInTrial) {
      return {
        isInTrial: true,
        daysRemaining: subscription.trialDaysRemaining,
        message: subscription.trialDaysRemaining === 1 
          ? 'Last day of your free trial!' 
          : `${subscription.trialDaysRemaining} days left in your free trial`,
      };
    }
    
    return {
      isInTrial: false,
      daysRemaining: 0,
      message: null,
    };
  };

  return {
    ...subscription,
    isPremiumFeature,
    shouldShowAds,
    canAccessFeature,
    getTrialStatus,
  };
};
