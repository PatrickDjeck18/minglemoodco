# AdMob and RevenueCat Setup Guide

This guide will help you configure AdMob ads and RevenueCat subscriptions for your React Native app.

## AdMob Setup

### 1. Create AdMob Account
1. Go to [AdMob Console](https://apps.admob.com/)
2. Sign in with your Google account
3. Create a new app for both iOS and Android

### 2. Get App IDs and Ad Unit IDs
1. In AdMob Console, go to your app
2. Note down the **App ID** for both platforms
3. Create ad units:
   - Banner ad unit
   - Interstitial ad unit
4. Note down the **Ad Unit IDs**

### 3. Update Configuration
Update `src/config/admob.ts` with your actual IDs:

```typescript
export const ADMOB_CONFIG = {
  APP_ID: {
    ios: 'ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX', // Your iOS App ID
    android: 'ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX', // Your Android App ID
  },
  BANNER_AD_UNIT_ID: {
    ios: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX', // Your iOS Banner Ad Unit ID
    android: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX', // Your Android Banner Ad Unit ID
  },
  INTERSTITIAL_AD_UNIT_ID: {
    ios: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX', // Your iOS Interstitial Ad Unit ID
    android: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX', // Your Android Interstitial Ad Unit ID
  },
};
```

### 4. iOS Configuration
Add to `ios/YourApp/Info.plist`:

```xml
<key>GADApplicationIdentifier</key>
<string>ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX</string>
```

### 5. Android Configuration
Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<application>
    <meta-data
        android:name="com.google.android.gms.ads.APPLICATION_ID"
        android:value="ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX"/>
</application>
```

## RevenueCat Setup

### 1. Create RevenueCat Account
1. Go to [RevenueCat Dashboard](https://app.revenuecat.com/)
2. Sign up for an account
3. Create a new project

### 2. Configure Products
1. In RevenueCat Dashboard, go to Products
2. Create products for your subscriptions:
   - Weekly Premium
   - Monthly Premium
3. Note down the product IDs

### 3. Configure App Store Connect / Google Play Console
1. **iOS**: Create subscriptions in App Store Connect
2. **Android**: Create subscriptions in Google Play Console
3. Link the products to RevenueCat

### 4. Update Configuration
Update `src/config/revenuecat.ts` with your actual values:

```typescript
export const REVENUECAT_CONFIG = {
  API_KEY: 'your_actual_revenuecat_api_key',
  PRODUCT_IDS: {
    WEEKLY: {
      ios: 'your_weekly_ios_product_id',
      android: 'your_weekly_android_product_id',
    },
    MONTHLY: {
      ios: 'your_monthly_ios_product_id',
      android: 'your_monthly_android_product_id',
    },
  },
  ENTITLEMENT_ID: 'premium',
  OFFERINGS_ID: 'default',
};
```

### 5. Install RevenueCat SDK
```bash
npm install react-native-purchases
```

### 6. Initialize RevenueCat
Update `src/services/RevenueCatService.ts` to use the actual RevenueCat SDK:

```typescript
import Purchases from 'react-native-purchases';

// Initialize RevenueCat
await Purchases.configure({
  apiKey: REVENUECAT_CONFIG.API_KEY,
});
```

## Testing

### AdMob Testing
1. Use test ad unit IDs during development
2. Test on real devices for accurate results
3. Check ad placement and user experience

### RevenueCat Testing
1. Use sandbox environment for testing
2. Test purchase flow end-to-end
3. Test restore purchases functionality

## Production Deployment

### 1. Replace Test IDs
- Replace all test ad unit IDs with production IDs
- Replace test product IDs with production IDs

### 2. App Store Review
- Ensure ads don't interfere with app functionality
- Test subscription flow thoroughly
- Follow platform guidelines for ads and subscriptions

### 3. Monitor Performance
- Track ad revenue in AdMob Console
- Monitor subscription metrics in RevenueCat Dashboard
- Analyze user behavior and conversion rates

## Important Notes

1. **GDPR Compliance**: The app requests non-personalized ads by default
2. **User Experience**: Ads are only shown to non-subscribed users
3. **Testing**: Always test on real devices before production
4. **Revenue Optimization**: Monitor and optimize ad placement for better revenue

## Troubleshooting

### Common Issues
1. **Ads not showing**: Check ad unit IDs and network connectivity
2. **Purchase failures**: Verify product IDs and store configuration
3. **Subscription not recognized**: Check entitlement configuration

### Debug Mode
Enable debug logging in development:

```typescript
// AdMob
mobileAds().setRequestConfiguration({
  testDeviceIdentifiers: ['YOUR_TEST_DEVICE_ID'],
});

// RevenueCat
Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
```

## Support

For issues with:
- **AdMob**: Check [AdMob Help Center](https://support.google.com/admob/)
- **RevenueCat**: Check [RevenueCat Documentation](https://docs.revenuecat.com/)
- **React Native**: Check [React Native Documentation](https://reactnative.dev/)
