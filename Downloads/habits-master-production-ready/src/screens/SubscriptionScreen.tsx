import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
// Temporarily disable subscription context to fix blank screen
// import { useSubscription } from '../context/SubscriptionContext';
import { colors } from '../constants/colors';

interface SubscriptionPlan {
  id: string;
  title: string;
  description: string;
  price: string;
  period: string;
  features: string[];
  package?: any;
  trialDays?: number;
  trialEnabled?: boolean;
}

const SubscriptionScreen: React.FC = () => {
  // Mock subscription data to prevent crashes
  const isSubscribed = false;
  const isLoading = false;
  const isInTrial = false;
  const trialDaysRemaining = 0;
  
  const purchaseSubscription = async (packageToPurchase: any): Promise<boolean> => {
    Alert.alert('Demo Mode', 'Subscription feature is in demo mode. Configure RevenueCat to enable purchases.');
    return false;
  };
  
  const restorePurchases = async (): Promise<boolean> => {
    Alert.alert('Demo Mode', 'Restore purchases is in demo mode. Configure RevenueCat to enable this feature.');
    return false;
  };
  
  const getAvailableProducts = async () => {
    return [
      {
        id: 'weekly',
        title: 'Weekly Premium',
        description: 'Remove ads and unlock premium features',
        price: '$0.99',
        period: 'week',
        features: ['No advertisements', 'Premium prayer features', 'Advanced statistics', 'Cloud sync', 'Priority support'],
        trialDays: 3,
        trialEnabled: true,
      },
      {
        id: 'monthly',
        title: 'Monthly Premium',
        description: 'Remove ads and unlock premium features',
        price: '$4.99',
        period: 'month',
        features: ['No advertisements', 'Premium prayer features', 'Advanced statistics', 'Cloud sync', 'Priority support', 'Best value'],
        trialDays: 3,
        trialEnabled: true,
      },
    ];
  };

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const products = await getAvailableProducts();
      setPlans(products);
      if (products.length > 0) {
        // Select monthly plan by default
        const monthlyPlan = products.find(p => p.period === 'MONTHLY' || p.period === 'month');
        if (monthlyPlan) {
          setSelectedPlan(monthlyPlan.id);
        }
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const handlePurchase = async () => {
    if (!selectedPlan) {
      Alert.alert('Error', 'Please select a subscription plan');
      return;
    }

    const plan = plans.find(p => p.id === selectedPlan);
    if (!plan || !plan.package) {
      Alert.alert('Error', 'Selected plan is not available');
      return;
    }

    setIsPurchasing(true);
    try {
      const success = await purchaseSubscription(plan.package);
      if (success) {
        Alert.alert(
          'Success!',
          'Your subscription has been activated. Enjoy premium features!',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', 'Failed to purchase subscription. Please try again.');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert('Error', 'An error occurred during purchase. Please try again.');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      const success = await restorePurchases();
      if (success) {
        Alert.alert('Success!', 'Your purchases have been restored.');
      } else {
        Alert.alert('No Purchases', 'No previous purchases found to restore.');
      }
    } catch (error) {
      console.error('Restore error:', error);
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
    } finally {
      setIsRestoring(false);
    }
  };

  const renderFeature = (feature: string, index: number) => (
    <View key={index} style={styles.featureItem}>
      <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
      <Text style={styles.featureText}>{feature}</Text>
    </View>
  );

  const renderPlan = (plan: SubscriptionPlan) => {
    const isSelected = selectedPlan === plan.id;
    const isPopular = plan.period === 'MONTHLY' || plan.period === 'month';

    return (
      <TouchableOpacity
        key={plan.id}
        style={[
          styles.planCard,
          isSelected && styles.selectedPlan,
          isPopular && styles.popularPlan,
        ]}
        onPress={() => setSelectedPlan(plan.id)}
      >
        {isPopular && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularText}>Most Popular</Text>
          </View>
        )}
        
        <View style={styles.planHeader}>
          <Text style={styles.planTitle}>{plan.title}</Text>
          <Text style={styles.planPrice}>{plan.price}</Text>
          <Text style={styles.planPeriod}>per {plan.period.toLowerCase()}</Text>
        </View>

        {plan.trialEnabled && plan.trialDays && (
          <View style={styles.trialInfo}>
            <Text style={styles.trialText}>
              {plan.trialDays}-day free trial
            </Text>
          </View>
        )}

        <View style={styles.featuresContainer}>
          {plan.features.map((feature, index) => renderFeature(feature, index))}
        </View>

        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading subscription options...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Unlock Premium Features</Text>
        <Text style={styles.headerSubtitle}>
          Get the most out of your spiritual journey
        </Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.benefitsSection}>
          <Text style={styles.sectionTitle}>What you'll get:</Text>
          {renderFeature('Remove all advertisements', 0)}
          {renderFeature('Advanced prayer tracking', 1)}
          {renderFeature('Detailed spiritual statistics', 2)}
          {renderFeature('Cloud sync across devices', 3)}
          {renderFeature('Priority customer support', 4)}
          {renderFeature('Exclusive premium content', 5)}
        </View>

        <View style={styles.plansSection}>
          <Text style={styles.sectionTitle}>Choose your plan:</Text>
          {plans.map(renderPlan)}
        </View>

        {isInTrial && trialDaysRemaining > 0 && (
          <View style={styles.trialBanner}>
            <Ionicons name="time" size={20} color={colors.white} />
            <Text style={styles.trialBannerText}>
              {trialDaysRemaining} days left in your free trial
            </Text>
          </View>
        )}

        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.purchaseButton, isPurchasing && styles.disabledButton]}
            onPress={handlePurchase}
            disabled={isPurchasing || !selectedPlan}
          >
            {isPurchasing ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.purchaseButtonText}>
                Start Free Trial
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestore}
            disabled={isRestoring}
          >
            {isRestoring ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={styles.restoreButtonText}>Restore Purchases</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.termsContainer}>
          <Text style={styles.termsText}>
            By subscribing, you agree to our Terms of Service and Privacy Policy.
            Subscription automatically renews unless auto-renew is turned off at least
            24 hours before the end of the current period.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text,
  },
  header: {
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.white,
    textAlign: 'center',
    opacity: 0.9,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  benefitsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
    flex: 1,
  },
  plansSection: {
    marginBottom: 24,
  },
  planCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  selectedPlan: {
    borderColor: colors.primary,
  },
  popularPlan: {
    borderColor: colors.accent,
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: 20,
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  planHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  planTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
  },
  planPeriod: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  trialInfo: {
    backgroundColor: colors.primaryLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  trialText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  featuresContainer: {
    marginBottom: 16,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  trialBanner: {
    backgroundColor: colors.accent,
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  trialBannerText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  buttonsContainer: {
    marginBottom: 24,
  },
  purchaseButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  disabledButton: {
    opacity: 0.6,
  },
  purchaseButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  restoreButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  restoreButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  termsContainer: {
    padding: 16,
    backgroundColor: colors.lightGray,
    borderRadius: 8,
  },
  termsText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    textAlign: 'center',
  },
});

export default SubscriptionScreen;