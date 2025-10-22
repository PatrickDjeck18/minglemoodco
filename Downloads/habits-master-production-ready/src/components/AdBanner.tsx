import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Conditionally import AdMob components only on mobile platforms
let BannerAd: any = null;
let BannerAdSize: any = null;
let AdMobService: any = null;

if (Platform.OS !== 'web') {
  try {
    const AdMobModule = require('react-native-google-mobile-ads');
    BannerAd = AdMobModule.BannerAd;
    BannerAdSize = AdMobModule.BannerAdSize;
    AdMobService = require('../services/AdMobService').default;
  } catch (error) {
    console.warn('AdMob not available:', error);
  }
}

const { width } = Dimensions.get('window');

interface AdBannerProps {
  position?: 'top' | 'bottom';
  showAboveTabBar?: boolean;
}

const AdBanner: React.FC<AdBannerProps> = ({ 
  position = 'bottom', 
  showAboveTabBar = false 
}) => {
  const [adUnitId, setAdUnitId] = useState<string>('');
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const initializeAd = async () => {
      try {
        await AdMobService.initialize();
        const unitId = AdMobService.getBannerAdUnitId();
        setAdUnitId(unitId);
        console.log('AdBanner: Initialized with unit ID:', unitId);
      } catch (error) {
        console.error('AdBanner: Failed to initialize:', error);
        setAdError('Failed to initialize ads');
      }
    };
    
    initializeAd();
  }, []);

  // Don't render if no ad unit ID, if there's an error, or on web platform
  if (!adUnitId || adError || Platform.OS === 'web' || !BannerAd || !BannerAdSize || !AdMobService) {
    return null;
  }

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
        unitId={adUnitId}
        size={BannerAdSize.ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdLoaded={() => {
          console.log('Banner ad loaded successfully');
          setAdLoaded(true);
          setAdError(null);
        }}
        onAdFailedToLoad={(error) => {
          console.error('Banner ad failed to load:', error);
          setAdError('Failed to load ad');
          setAdLoaded(false);
        }}
        onAdOpened={() => {
          console.log('Banner ad opened');
        }}
        onAdClosed={() => {
          console.log('Banner ad closed');
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
    minHeight: 50, // Ensure minimum height for banner
    width: '100%',
  },
});

export default AdBanner;
