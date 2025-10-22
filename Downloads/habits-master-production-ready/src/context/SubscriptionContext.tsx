import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RevenueCatService from '../services/RevenueCatService';

interface SubscriptionContextType {
  isSubscribed: boolean;
  isLoading: boolean;
  subscriptionType: string | null;
  isInTrial: boolean;
  trialDaysRemaining: number;
  checkSubscription: () => Promise<void>;
  purchaseSubscription: (packageToPurchase: any) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  getAvailableProducts: () => Promise<any[]>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionType, setSubscriptionType] = useState<string | null>(null);
  const [isInTrial, setIsInTrial] = useState(false);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState(0);

  useEffect(() => {
    initializeSubscription();
  }, []);

  const initializeSubscription = async () => {
    try {
      // Only initialize RevenueCat if API key is configured
      const apiKey = 'your_revenuecat_api_key_here';
      if (apiKey && apiKey !== 'your_revenuecat_api_key_here') {
        await RevenueCatService.initialize();
        await checkSubscription();
      } else {
        console.log('RevenueCat not configured, using mock subscription data');
        // Set mock data for development
        setIsSubscribed(false);
        setIsInTrial(false);
        setTrialDaysRemaining(0);
      }
    } catch (error) {
      console.error('Failed to initialize subscription:', error);
      // Set fallback data
      setIsSubscribed(false);
      setIsInTrial(false);
      setTrialDaysRemaining(0);
    } finally {
      setIsLoading(false);
    }
  };

  const checkSubscription = async () => {
    try {
      const isPremium = await AsyncStorage.getItem('is_premium');
      const productId = await AsyncStorage.getItem('premium_product_id');
      
      // Check RevenueCat for real subscription status
      const isSubscribedRC = await RevenueCatService.isSubscribed();
      const isInTrialRC = await RevenueCatService.isInTrialPeriod();
      const trialDays = await RevenueCatService.getTrialDaysRemaining();
      
      setIsSubscribed(isSubscribedRC || isPremium === 'true');
      setSubscriptionType(productId);
      setIsInTrial(isInTrialRC);
      setTrialDaysRemaining(trialDays);
    } catch (error) {
      console.error('Failed to check subscription:', error);
    }
  };

  const purchaseSubscription = async (packageToPurchase: any): Promise<boolean> => {
    try {
      const success = await RevenueCatService.purchaseSubscription(packageToPurchase);
      if (success) {
        await checkSubscription();
      }
      return success;
    } catch (error) {
      console.error('Purchase failed:', error);
      return false;
    }
  };

  const restorePurchases = async (): Promise<boolean> => {
    try {
      const success = await RevenueCatService.restorePurchases();
      if (success) {
        await checkSubscription();
      }
      return success;
    } catch (error) {
      console.error('Restore failed:', error);
      return false;
    }
  };

  const getAvailableProducts = async () => {
    try {
      return await RevenueCatService.getAvailableProducts();
    } catch (error) {
      console.error('Failed to get products:', error);
      return [];
    }
  };

  return (
    <SubscriptionContext.Provider
      value={{
        isSubscribed,
        isLoading,
        subscriptionType,
        isInTrial,
        trialDaysRemaining,
        checkSubscription,
        purchaseSubscription,
        restorePurchases,
        getAvailableProducts,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
