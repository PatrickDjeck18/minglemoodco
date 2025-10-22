import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform, Dimensions, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

const { width } = Dimensions.get('window');

interface DebugAdBannerProps {
  position?: 'top' | 'bottom';
  showAboveTabBar?: boolean;
}

const DebugAdBanner: React.FC<DebugAdBannerProps> = ({ 
  position = 'bottom', 
  showAboveTabBar = false 
}) => {
  const insets = useSafeAreaInsets();
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState<string | null>(null);

  // Ad unit IDs - Production for iOS, Test for Android
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

  // Don't render on web platform or if AdMob components are not available
  if (Platform.OS === 'web' || !BannerAd || !BannerAdSize) {
    return (
      <View style={bannerStyle}>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>AdMob not available on web</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={bannerStyle}>
      {adError ? (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Ad Placeholder</Text>
          <Text style={styles.errorText}>{adError}</Text>
        </View>
      ) : (
        <BannerAd
          unitId={getAdUnitId()}
          size={BannerAdSize.ADAPTIVE_BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true,
          }}
          onAdLoaded={() => {
            console.log('DebugAdBanner: Ad loaded successfully');
            setAdLoaded(true);
            setAdError(null);
          }}
          onAdFailedToLoad={(error) => {
            console.error('DebugAdBanner: Ad failed to load:', error);
            setAdError('Failed to load ad');
            setAdLoaded(false);
          }}
          onAdOpened={() => {
            console.log('DebugAdBanner: Ad opened');
          }}
          onAdClosed={() => {
            console.log('DebugAdBanner: Ad closed');
          }}
        />
      )}
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
  placeholder: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  placeholderText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  errorText: {
    fontSize: 12,
    color: '#ff0000',
    marginTop: 4,
  },
});

export default DebugAdBanner;
