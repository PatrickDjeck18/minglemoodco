# App Tracking Transparency (ATT) Setup Guide

This guide explains how to integrate App Tracking Transparency framework into your React Native app for iOS compliance.

## What's Been Added

### 1. iOS Configuration (`app.json`)
- Added `NSUserTrackingUsageDescription` to the iOS infoPlist
- This description will be shown to users when requesting tracking permission

### 2. Dependencies
- Installed `react-native-tracking-transparency` package

### 3. Services and Hooks
- `src/services/TrackingService.ts` - Core tracking service
- `src/hooks/useTracking.ts` - React hook for tracking functionality
- `src/components/TrackingPermissionModal.tsx` - UI component for permission request
- `src/components/TrackingWrapper.tsx` - Wrapper component for easy integration
- `src/utils/trackingIntegration.ts` - Integration examples

## How to Integrate

### Option 1: Using TrackingWrapper (Recommended)
Wrap your main app component with the TrackingWrapper:

```tsx
import TrackingWrapper from './src/components/TrackingWrapper';

export default function App() {
  return (
    <TrackingWrapper onTrackingStatusChange={(canTrack) => {
      console.log('Tracking allowed:', canTrack);
      // Initialize your tracking services here
    }}>
      {/* Your existing app content */}
    </TrackingWrapper>
  );
}
```

### Option 2: Manual Integration
Use the tracking service directly in your components:

```tsx
import { useTracking } from './src/hooks/useTracking';

function MyComponent() {
  const { trackingStatus, requestTrackingPermission } = useTracking();

  const handleRequestPermission = async () => {
    const result = await requestTrackingPermission();
    if (result.canTrack) {
      // Initialize tracking services
    }
  };

  return (
    // Your component JSX
  );
}
```

## Important Notes

### When to Request Permission
- Request tracking permission **before** collecting any data that could be used for tracking
- This includes before initializing ad networks, analytics, or any third-party SDKs
- The permission request should appear early in the user journey

### Privacy Compliance
- The `NSUserTrackingUsageDescription` explains why you need tracking permission
- Users can change their decision in iOS Settings > Privacy & Security > Tracking
- Always respect the user's choice and provide a good experience regardless

### Testing
- Test on a real iOS device (simulator doesn't show the permission dialog)
- Reset tracking permissions in Settings to test the flow multiple times
- Test both "Allow" and "Ask App Not to Track" scenarios

## App Store Review
- Make sure the permission request appears before any tracking data is collected
- The description should clearly explain the benefits to the user
- If you don't actually track users, update your App Store Connect privacy information

## Troubleshooting
- If the permission dialog doesn't appear, check that you're testing on a real device
- Ensure the `NSUserTrackingUsageDescription` is properly set in app.json
- Make sure you're calling the permission request before any tracking code runs

## Next Steps
1. Test the implementation on a real iOS device
2. Integrate the TrackingWrapper into your main App component
3. Update your ad configuration to respect tracking permissions
4. Submit your app for review with the ATT implementation
