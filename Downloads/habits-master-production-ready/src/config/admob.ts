// AdMob Configuration
// Replace these with your actual AdMob App IDs and Ad Unit IDs

export const ADMOB_CONFIG = {
  // App IDs - Production for both platforms
  APP_ID: {
    ios: 'ca-app-pub-2813380177518944~6924878918', // Production App ID for iOS
    android: 'ca-app-pub-2813380177518944~6924278918', // Production App ID for Android
  },
  
  // Banner Ad Unit IDs
  BANNER_AD_UNIT_ID: {
    ios: 'ca-app-pub-2813380177518944/6777152213', // Production Banner Ad Unit ID for iOS
    android: 'ca-app-pub-3940256099942544/6300978111', // Test Banner Ad Unit ID for Android
  },
  
  // Interstitial Ad Unit IDs
  INTERSTITIAL_AD_UNIT_ID: {
    ios: 'ca-app-pub-2813380177518944/3851605973', // Production Interstitial Ad Unit ID for iOS
    android: 'ca-app-pub-3940256099942544/1033173712', // Test Interstitial Ad Unit ID for Android
  },
  
  // Rewarded Ad Unit IDs (for future use)
  REWARDED_AD_UNIT_ID: {
    ios: 'ca-app-pub-3940256099942544/1712485313', // Test Rewarded Ad Unit ID for iOS
    android: 'ca-app-pub-3940256099942544/5224354917', // Test Rewarded Ad Unit ID for Android
  },
};

// Banner Ad Sizes for iOS
export const BANNER_SIZES = {
  // Standard banner sizes
  BANNER: 'BANNER',
  LARGE_BANNER: 'LARGE_BANNER',
  MEDIUM_RECTANGLE: 'MEDIUM_RECTANGLE',
  
  // Adaptive banner sizes (recommended)
  ADAPTIVE_BANNER: 'ADAPTIVE_BANNER',
  
  // Smart banner sizes
  SMART_BANNER_PORTRAIT: 'SMART_BANNER_PORTRAIT',
  SMART_BANNER_LANDSCAPE: 'SMART_BANNER_LANDSCAPE',
};

// Ad Request Configuration
export const AD_REQUEST_CONFIG = {
  // Request non-personalized ads for GDPR compliance
  requestNonPersonalizedAdsOnly: true,
  
  // Additional request parameters
  keywords: ['spiritual', 'prayer', 'christian', 'faith', 'meditation'],
  
  // Test device IDs (for development)
  testDeviceIds: [
    // Add your test device IDs here
    // 'TEST_DEVICE_ID_1',
    // 'TEST_DEVICE_ID_2',
  ],
};
