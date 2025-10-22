// Web-compatible AdMob service - no native modules
import { Platform } from 'react-native';
import { ADMOB_CONFIG, AD_REQUEST_CONFIG } from '../config/admob';

class AdMobService {
  private isInitialized = false;
  private interstitialAd: any = null;

  async initialize() {
    if (this.isInitialized) return;
    
    console.log('AdMob not available on web platform');
    this.isInitialized = true;
  }

  getBannerAdUnitId(): string {
    return Platform.OS === 'ios' ? ADMOB_CONFIG.BANNER_AD_UNIT_ID.ios : ADMOB_CONFIG.BANNER_AD_UNIT_ID.android;
  }

  getInterstitialAdUnitId(): string {
    return Platform.OS === 'ios' ? ADMOB_CONFIG.INTERSTITIAL_AD_UNIT_ID.ios : ADMOB_CONFIG.INTERSTITIAL_AD_UNIT_ID.android;
  }

  async loadInterstitialAd() {
    console.log('AdMob not available on web platform');
  }

  async showInterstitialAd(): Promise<boolean> {
    console.log('AdMob not available on web platform');
    return false;
  }

  async preloadAndShowInterstitialAd() {
    console.log('AdMob not available on web platform');
  }
}

export default new AdMobService();
