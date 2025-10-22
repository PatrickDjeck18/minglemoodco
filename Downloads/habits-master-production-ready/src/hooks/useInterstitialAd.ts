import { useEffect } from 'react';
import AdMobService from '../services/AdMobService';
import { useSubscription } from '../context/SubscriptionContext';

export const useInterstitialAd = () => {
  const { isSubscribed } = useSubscription();

  useEffect(() => {
    // Preload interstitial ad on app start if user is not subscribed
    if (!isSubscribed) {
      AdMobService.loadInterstitialAd();
    }
  }, [isSubscribed]);

  const showInterstitialAd = async () => {
    if (!isSubscribed) {
      await AdMobService.showInterstitialAd();
    }
  };

  const preloadAndShowInterstitialAd = async () => {
    if (!isSubscribed) {
      await AdMobService.preloadAndShowInterstitialAd();
    }
  };

  return {
    showInterstitialAd,
    preloadAndShowInterstitialAd,
  };
};
