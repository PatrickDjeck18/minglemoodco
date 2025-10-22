import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases, { 
  CustomerInfo, 
  PurchasesOffering, 
  PurchasesPackage,
  PURCHASES_ERROR_CODE,
  PurchasesError 
} from 'react-native-purchases';
import { REVENUECAT_CONFIG, SUBSCRIPTION_PLANS } from '../config/revenuecat';

class RevenueCatService {
  private isInitialized = false;
  private customerInfo: CustomerInfo | null = null;
  private offerings: PurchasesOffering[] = [];

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Check if API key is configured
      if (!REVENUECAT_CONFIG.API_KEY || REVENUECAT_CONFIG.API_KEY === 'your_revenuecat_api_key_here') {
        console.log('RevenueCat API key not configured, skipping initialization');
        this.isInitialized = true;
        return;
      }

      // Initialize RevenueCat SDK
      await Purchases.configure({
        apiKey: REVENUECAT_CONFIG.API_KEY,
      });

      // Set up debug logging for development
      if (__DEV__) {
        Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
      }

      // Set user ID if available
      const userId = await AsyncStorage.getItem('user_id');
      if (userId) {
        await Purchases.logIn(userId);
      }

      this.isInitialized = true;
      console.log('RevenueCat initialized successfully');
    } catch (error) {
      console.error('RevenueCat initialization failed:', error);
      // Don't throw error, just log it and continue
      this.isInitialized = true;
    }
  }

  async getCustomerInfo(): Promise<CustomerInfo | null> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      this.customerInfo = await Purchases.getCustomerInfo();
      return this.customerInfo;
    } catch (error) {
      console.error('Failed to get customer info:', error);
      return null;
    }
  }

  async isSubscribed(): Promise<boolean> {
    try {
      const customerInfo = await this.getCustomerInfo();
      if (!customerInfo) return false;
      
      return customerInfo.entitlements.active[REVENUECAT_CONFIG.ENTITLEMENT_ID] !== undefined;
    } catch (error) {
      console.error('Failed to check subscription status:', error);
      return false;
    }
  }

  async isInTrialPeriod(): Promise<boolean> {
    try {
      const customerInfo = await this.getCustomerInfo();
      if (!customerInfo) return false;
      
      const entitlement = customerInfo.entitlements.active[REVENUECAT_CONFIG.ENTITLEMENT_ID];
      return entitlement?.isActive === true && entitlement?.willRenew === true && entitlement?.periodType === 'trial';
    } catch (error) {
      console.error('Failed to check trial status:', error);
      return false;
    }
  }

  async getTrialDaysRemaining(): Promise<number> {
    try {
      const customerInfo = await this.getCustomerInfo();
      if (!customerInfo) return 0;
      
      const entitlement = customerInfo.entitlements.active[REVENUECAT_CONFIG.ENTITLEMENT_ID];
      if (!entitlement || !entitlement.expirationDate) return 0;
      
      const now = new Date();
      const expiration = new Date(entitlement.expirationDate);
      const diffTime = expiration.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return Math.max(0, diffDays);
    } catch (error) {
      console.error('Failed to get trial days remaining:', error);
      return 0;
    }
  }

  async purchaseSubscription(packageToPurchase: PurchasesPackage): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log(`Purchasing subscription: ${packageToPurchase.identifier}`);
      
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      this.customerInfo = customerInfo;
      
      // Store subscription status locally
      const isSubscribed = customerInfo.entitlements.active[REVENUECAT_CONFIG.ENTITLEMENT_ID] !== undefined;
      await AsyncStorage.setItem('is_premium', isSubscribed.toString());
      await AsyncStorage.setItem('premium_product_id', packageToPurchase.identifier);
      
      return isSubscribed;
    } catch (error) {
      console.error('Purchase failed:', error);
      
      // Handle specific error cases
      if (error && typeof error === 'object' && 'code' in error) {
        const purchasesError = error as any;
        if (purchasesError.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
          console.log('Purchase was cancelled by user');
        } else if (purchasesError.code === PURCHASES_ERROR_CODE.PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR) {
          console.log('Product not available for purchase');
        }
      }
      
      return false;
    }
  }

  async restorePurchases(): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log('Restoring purchases...');
      
      const customerInfo = await Purchases.restorePurchases();
      this.customerInfo = customerInfo;
      
      const isSubscribed = customerInfo.entitlements.active[REVENUECAT_CONFIG.ENTITLEMENT_ID] !== undefined;
      await AsyncStorage.setItem('is_premium', isSubscribed.toString());
      
      return isSubscribed;
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      return false;
    }
  }

  async getAvailableProducts() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Get offerings from RevenueCat
      const offerings = await Purchases.getOfferings();
      this.offerings = Object.values(offerings.all);

      // Return available packages
      const defaultOffering = offerings.current;
      if (defaultOffering) {
        return defaultOffering.availablePackages.map(pkg => ({
          id: pkg.identifier,
          title: pkg.product.title,
          description: pkg.product.description,
          price: pkg.product.priceString,
          period: pkg.packageType,
          features: this.getFeaturesForPackage(pkg),
          package: pkg,
          trialDays: REVENUECAT_CONFIG.TRIAL.DURATION_DAYS,
          trialEnabled: REVENUECAT_CONFIG.TRIAL.ENABLED,
        }));
      }

      // Fallback to static configuration
      return SUBSCRIPTION_PLANS.map(plan => ({
        id: Platform.OS === 'ios' ? plan.productId.ios : plan.productId.android,
        title: plan.title,
        description: plan.description,
        price: plan.price,
        period: plan.period,
        features: plan.features,
        trialDays: plan.trialDays,
        trialEnabled: plan.trialEnabled,
      }));
    } catch (error) {
      console.error('Failed to get products:', error);
      return [];
    }
  }

  private getFeaturesForPackage(pkg: PurchasesPackage): string[] {
    // Return features based on package type
    const baseFeatures = [
      'No advertisements',
      'Premium prayer features',
      'Advanced statistics',
      'Cloud sync',
      'Priority support',
    ];

    if (pkg.packageType === 'MONTHLY') {
      return [...baseFeatures, 'Best value'];
    }

    return baseFeatures;
  }

  async getOfferings() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const offerings = await Purchases.getOfferings();
      return offerings;
    } catch (error) {
      console.error('Failed to get offerings:', error);
      return null;
    }
  }
}

export default new RevenueCatService();
