// RevenueCat Configuration
// Replace these with your actual RevenueCat API key and product IDs

export const REVENUECAT_CONFIG = {
  // RevenueCat API Key - Get this from RevenueCat dashboard
  API_KEY: 'your_revenuecat_api_key_here',
  
  // Product IDs for subscriptions
  PRODUCT_IDS: {
    // Weekly subscription - $0.99/week
    WEEKLY: {
      ios: 'weekly_premium_099_ios',
      android: 'weekly_premium_099_android',
    },
    
    // Monthly subscription - $4.99/month
    MONTHLY: {
      ios: 'monthly_premium_499_ios',
      android: 'monthly_premium_499_android',
    },
  },
  
  // Entitlement ID (configured in RevenueCat dashboard)
  ENTITLEMENT_ID: 'premium',
  
  // Offerings ID (configured in RevenueCat dashboard)
  OFFERINGS_ID: 'default',
  
  // Trial configuration
  TRIAL: {
    DURATION_DAYS: 3,
    ENABLED: true,
  },
};

// Subscription Plans Configuration
export const SUBSCRIPTION_PLANS = [
  {
    id: 'weekly',
    title: 'Weekly Premium',
    description: 'Remove ads and unlock premium features',
    price: '$0.99',
    period: 'week',
    productId: {
      ios: 'weekly_premium_099_ios',
      android: 'weekly_premium_099_android',
    },
    features: [
      'No advertisements',
      'Premium prayer features',
      'Advanced statistics',
      'Cloud sync',
      'Priority support',
    ],
    trialDays: 3,
    trialEnabled: true,
  },
  {
    id: 'monthly',
    title: 'Monthly Premium',
    description: 'Remove ads and unlock premium features',
    price: '$4.99',
    period: 'month',
    productId: {
      ios: 'monthly_premium_499_ios',
      android: 'monthly_premium_499_android',
    },
    features: [
      'No advertisements',
      'Premium prayer features',
      'Advanced statistics',
      'Cloud sync',
      'Priority support',
    ],
    trialDays: 3,
    trialEnabled: true,
  },
];

// Premium Features Configuration
export const PREMIUM_FEATURES = {
  // Features that require premium subscription
  NO_ADS: 'no_ads',
  ADVANCED_STATISTICS: 'advanced_statistics',
  CLOUD_SYNC: 'cloud_sync',
  PREMIUM_PRAYER_FEATURES: 'premium_prayer_features',
  PRIORITY_SUPPORT: 'priority_support',
  EXPORT_DATA: 'export_data',
  CUSTOM_THEMES: 'custom_themes',
};

// Subscription Status
export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
  PENDING: 'pending',
  UNKNOWN: 'unknown',
};
