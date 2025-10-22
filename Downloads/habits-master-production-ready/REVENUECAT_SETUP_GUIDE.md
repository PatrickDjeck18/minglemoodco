# RevenueCat Subscription Setup Guide

This guide will help you configure RevenueCat for your app with the specified pricing and trial requirements.

## Pricing Configuration
- **Weekly Subscription**: $0.99/week
- **Monthly Subscription**: $4.99/month
- **Free Trial**: 3 days for all subscriptions

## Step 1: RevenueCat Dashboard Setup

### 1.1 Create RevenueCat Account
1. Go to [RevenueCat Dashboard](https://app.revenuecat.com/)
2. Sign up for an account
3. Create a new project for your app

### 1.2 Configure Products
1. In RevenueCat Dashboard, go to **Products**
2. Create the following products:

**Weekly Subscription:**
- Product ID: `weekly_premium_099_ios` (iOS)
- Product ID: `weekly_premium_099_android` (Android)
- Price: $0.99
- Period: Weekly
- Trial: 3 days

**Monthly Subscription:**
- Product ID: `monthly_premium_499_ios` (iOS)
- Product ID: `monthly_premium_499_android` (Android)
- Price: $4.99
- Period: Monthly
- Trial: 3 days

### 1.3 Configure Entitlements
1. Go to **Entitlements**
2. Create entitlement: `premium`
3. Attach both products to this entitlement

### 1.4 Configure Offerings
1. Go to **Offerings**
2. Create offering: `default`
3. Add both weekly and monthly packages to this offering

## Step 2: App Store Connect Setup (iOS)

### 2.1 Create App
1. Go to [App Store Connect](https://appstoreconnect.apple.com/)
2. Create your app
3. Note your Bundle ID

### 2.2 Create Subscriptions
1. Go to **Features** > **In-App Purchases**
2. Create **Auto-Renewable Subscriptions**

**Weekly Subscription:**
- Reference Name: Weekly Premium
- Product ID: `weekly_premium_099_ios`
- Price: $0.99
- Subscription Duration: 1 Week
- Free Trial: 3 days

**Monthly Subscription:**
- Reference Name: Monthly Premium
- Product ID: `monthly_premium_499_ios`
- Price: $4.99
- Subscription Duration: 1 Month
- Free Trial: 3 days

### 2.3 Configure Subscription Groups
1. Create a subscription group for your app
2. Add both subscriptions to the group
3. Set the monthly subscription as the primary subscription

## Step 3: Google Play Console Setup (Android)

### 3.1 Create App
1. Go to [Google Play Console](https://play.google.com/console/)
2. Create your app
3. Note your Package Name

### 3.2 Create Subscriptions
1. Go to **Monetization** > **Subscriptions**
2. Create subscription products

**Weekly Subscription:**
- Product ID: `weekly_premium_099_android`
- Name: Weekly Premium
- Price: $0.99
- Billing Period: 1 week
- Free Trial: 3 days

**Monthly Subscription:**
- Product ID: `monthly_premium_499_android`
- Name: Monthly Premium
- Price: $4.99
- Billing Period: 1 month
- Free Trial: 3 days

## Step 4: Update App Configuration

### 4.1 Update RevenueCat Config
Update `src/config/revenuecat.ts` with your actual values:

```typescript
export const REVENUECAT_CONFIG = {
  API_KEY: 'your_actual_revenuecat_api_key_here',
  PRODUCT_IDS: {
    WEEKLY: {
      ios: 'weekly_premium_099_ios',
      android: 'weekly_premium_099_android',
    },
    MONTHLY: {
      ios: 'monthly_premium_499_ios',
      android: 'monthly_premium_499_android',
    },
  },
  ENTITLEMENT_ID: 'premium',
  OFFERINGS_ID: 'default',
  TRIAL: {
    DURATION_DAYS: 3,
    ENABLED: true,
  },
};
```

### 4.2 Get API Key
1. In RevenueCat Dashboard, go to **API Keys**
2. Copy your **Public API Key**
3. Replace `your_actual_revenuecat_api_key_here` in the config

## Step 5: Testing

### 5.1 Sandbox Testing
1. Create sandbox test accounts in App Store Connect and Google Play Console
2. Use test devices for testing
3. Test the complete purchase flow
4. Test trial period functionality
5. Test restore purchases

### 5.2 Test Scenarios
- [ ] New user sees subscription screen
- [ ] User can start 3-day trial
- [ ] Trial countdown works correctly
- [ ] User can purchase subscription
- [ ] User can restore purchases
- [ ] Premium features are unlocked
- [ ] Ads are hidden for subscribers

## Step 6: Production Deployment

### 6.1 Final Configuration
1. Replace sandbox product IDs with production IDs
2. Update API keys to production keys
3. Test on production environment

### 6.2 App Store Review
1. Ensure subscription flow is smooth
2. Test all edge cases
3. Prepare for App Store review
4. Follow platform guidelines for subscriptions

## Troubleshooting

### Common Issues

**Products not loading:**
- Check product IDs match exactly
- Verify products are approved in stores
- Check API key is correct

**Trial not working:**
- Verify trial is configured in both stores
- Check entitlement configuration
- Test with sandbox accounts

**Purchase failures:**
- Check store configuration
- Verify product IDs
- Test with valid payment methods

### Debug Mode
Enable debug logging in development:

```typescript
// In RevenueCatService.ts
if (__DEV__) {
  Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
}
```

## Support

- **RevenueCat Documentation**: https://docs.revenuecat.com/
- **iOS In-App Purchase Guide**: https://developer.apple.com/in-app-purchase/
- **Android Billing Guide**: https://developer.android.com/google/play/billing

## Important Notes

1. **Trial Period**: 3-day trial is configured for both subscriptions
2. **Pricing**: Weekly $0.99, Monthly $4.99
3. **Entitlement**: All premium features are gated behind the 'premium' entitlement
4. **Testing**: Always test with sandbox accounts before production
5. **Compliance**: Follow App Store and Google Play guidelines for subscriptions
