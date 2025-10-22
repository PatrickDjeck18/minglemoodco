// Web-compatible AdBanner - no native modules
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSubscription } from '../context/SubscriptionContext';

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

  // Don't render on web platform
  if (Platform.OS === 'web' || isSubscribed || !isReady) {
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
      <View style={styles.placeholder}>
        {/* Ad placeholder for web - you could add a web-compatible ad here */}
      </View>
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
});

export default ConditionalAdBanner;
