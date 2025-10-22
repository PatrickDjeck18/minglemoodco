import { Platform } from 'react-native';
import { ADMOB_CONFIG, AD_REQUEST_CONFIG } from '../config/admob';

// Conditionally import AdMob components only on mobile platforms
let mobileAds: any = null;
let MaxAdContentRating: any = null;
let InterstitialAd: any = null;
let AdEventType: any = null;

if (Platform.OS !== 'web') {
  try {
    const AdMobModule = require('react-native-google-mobile-ads');
    mobileAds = AdMobModule.default;
    MaxAdContentRating = AdMobModule.MaxAdContentRating;
    InterstitialAd = AdMobModule.InterstitialAd;
    AdEventType = AdMobModule.AdEventType;
  } catch (error) {
    console.warn('AdMob not available:', error);
  }
}

class AdMobService {
  private isInitialized = false;
  private interstitialAd: any = null;

  async initialize() {
    if (this.isInitialized) return;

    // Skip initialization on web platform or if AdMob is not available
    if (Platform.OS === 'web' || !mobileAds) {
      console.log('AdMob not available on this platform');
      return;
    }

    try {
      await mobileAds().initialize();
      this.isInitialized = true;
      console.log('AdMob initialized successfully');
    } catch (error) {
      console.error('AdMob initialization failed:', error);
      // Don't throw error, just log it so the app doesn't crash
    }
  }

  getBannerAdUnitId(): string {
    return Platform.OS === 'ios' ? ADMOB_CONFIG.BANNER_AD_UNIT_ID.ios : ADMOB_CONFIG.BANNER_AD_UNIT_ID.android;
  }

  getInterstitialAdUnitId(): string {
    return Platform.OS === 'ios' ? ADMOB_CONFIG.INTERSTITIAL_AD_UNIT_ID.ios : ADMOB_CONFIG.INTERSTITIAL_AD_UNIT_ID.android;
  }

  async loadInterstitialAd() {
    try {
      if (!InterstitialAd || !AdEventType) {
        console.warn('AdMob components not available');
        return;
      }
      
      this.interstitialAd = InterstitialAd.createForAdRequest(
        this.getInterstitialAdUnitId(),
        AD_REQUEST_CONFIG
      );

      this.interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
        console.log('Interstitial ad loaded');
      });

      this.interstitialAd.addAdEventListener(AdEventType.ERROR, (error: any) => {
        console.error('Interstitial ad error:', error);
      });

      await this.interstitialAd.load();
    } catch (error) {
      console.error('Failed to load interstitial ad:', error);
    }
  }

  async showInterstitialAd(): Promise<boolean> {
    try {
      if (this.interstitialAd && this.interstitialAd.loaded) {
        await this.interstitialAd.show();
        return true;
      } else {
        console.log('Interstitial ad not loaded');
        return false;
      }
    } catch (error) {
      console.error('Failed to show interstitial ad:', error);
      return false;
    }
  }

  async preloadAndShowInterstitialAd() {
    await this.loadInterstitialAd();
    // Wait a bit for the ad to load
    setTimeout(async () => {
      await this.showInterstitialAd();
    }, 1000);
  }
}

export default new AdMobService();
