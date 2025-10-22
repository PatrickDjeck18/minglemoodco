import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSubscription } from '../context/SubscriptionContext';

// Conditionally import AdMob components only on mobile platforms
let BannerAd: any = null;
let BannerAdSize: any = null;

if (Platform.OS !== 'web') {
  try {
    const AdMobModule = require('react-native-google-mobile-ads');
    BannerAd = AdMobModule.BannerAd;
    BannerAdSize = AdMobModule.BannerAdSize;
  } catch (error) {
    console.warn('AdMob not available:', error);
  }
}

interface ConditionalAdBannerProps {
  position?: 'top' | 'bottom';
  showAboveTabBar?: boolean;
}

const ConditionalAdBanner: React.FC<ConditionalAdBannerProps> = ({ 
  position = 'bottom', 
  showAboveTabBar = false 
}) => {
  const { isSubscribed } = useSubscription();
  const insets = useSafeAreaInsets();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Only show ads if user is not subscribed
    if (!isSubscribed) {
      // Add a small delay to ensure everything is loaded
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else {
      setIsReady(false);
    }
  }, [isSubscribed]);

  // Don't render if user is subscribed, not ready, or on web platform
  if (isSubscribed || !isReady || Platform.OS === 'web' || !BannerAd || !BannerAdSize) {
    return null;
  }

  const getAdUnitId = () => {
    if (Platform.OS === 'ios') {
      return 'ca-app-pub-2813380177518944/6777152213'; // Production banner for iOS
    } else {
      return 'ca-app-pub-3940256099942544/6300978111'; // Test banner for Android
    }
  };

  const bannerStyle = {
    ...styles.banner,
    ...(position === 'bottom' && showAboveTabBar ? {
      position: 'absolute' as const,
      bottom: 60 + insets.bottom, // Above tab bar
      left: 0,
      right: 0,
    } : position === 'bottom' ? {
      position: 'absolute' as const,
      bottom: insets.bottom,
      left: 0,
      right: 0,
    } : {
      position: 'absolute' as const,
      top: insets.top,
      left: 0,
      right: 0,
    }),
  };

  return (
    <View style={bannerStyle}>
      <BannerAd
        unitId={getAdUnitId()}
        size={BannerAdSize.ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdLoaded={() => {
          console.log('ConditionalAdBanner: Ad loaded successfully');
        }}
        onAdFailedToLoad={(error) => {
          console.error('ConditionalAdBanner: Ad failed to load:', error);
        }}
        onAdOpened={() => {
          console.log('ConditionalAdBanner: Ad opened');
        }}
        onAdClosed={() => {
          console.log('ConditionalAdBanner: Ad closed');
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    zIndex: 1000,
    minHeight: 50,
    width: '100%',
  },
});

export default ConditionalAdBanner;