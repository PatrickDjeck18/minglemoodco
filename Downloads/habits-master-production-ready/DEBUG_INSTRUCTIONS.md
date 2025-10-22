# Debugging Blank Screen Issue

## What I Changed

I added extensive console logging to track the app's initialization flow:

1. **App.tsx** - Logs app initialization, onboarding status, and authentication state
2. **AuthContext.tsx** - Logs session loading and auth state changes  
3. **AuthWrapper.tsx** - Logs auth wrapper state transitions

## How to Debug

### Step 1: Clear App Data
```bash
npx expo start --clear
```

### Step 2: Watch the Console Logs

You should see these logs in order:

```
=== APP INITIALIZATION START ===
Onboarding complete: null (or 'true')
Notification permission: granted/denied
=== APP INITIALIZATION COMPLETE ===
Rendering app - Onboarding: false Auth: null
=== AUTH CONTEXT INITIALIZING ===
Initial session loaded: No user
AuthWrapper state - Loading: true User: None
AuthWrapper state - Loading: false User: None
AuthWrapper - Calling onAuthStateChange with: false
Rendering app - Onboarding: false Auth: false
```

### Step 3: Identify the Issue

**If you see:**
- ❌ Logs stop after "APP INITIALIZATION START" → AsyncStorage or Notifications issue
- ❌ Logs stop after "AUTH CONTEXT INITIALIZING" → Supabase connection issue
- ❌ "AuthWrapper - Showing loading spinner" repeats forever → Auth state not resolving
- ❌ No logs at all → Build/compilation error

### Step 4: Quick Fixes

#### Fix 1: Reset Onboarding (if stuck)
```bash
# In your app, you can manually clear onboarding
# Or run: npx expo start --clear
```

#### Fix 2: Test Supabase Connection
The Supabase credentials in `src/utils/config.ts` look correct. Test by opening Metro bundler console and checking for network errors.

#### Fix 3: Bypass Auth Temporarily
If auth is hanging, you can temporarily test by modifying App.tsx line 148:
```typescript
} : isAuthenticated === null ? (
  // Change this to show login instead of loading
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
```

### Step 5: Common Solutions

1. **Clear Cache & Restart**
   ```bash
   npx expo start --clear
   ```

2. **Check for Missing Modules**
   ```bash
   npm install
   ```

3. **Verify Expo SDK Version**
   ```bash
   npx expo-doctor
   ```

4. **Reset AsyncStorage** (if onboarding is stuck)
   - Open DevTools in your browser or React Native Debugger
   - Run: `AsyncStorage.clear()`
   - Reload the app

## Next Steps

1. Run `npx expo start --clear`
2. Open the app in Expo Go or simulator
3. Check the Metro bundler terminal for the console logs
4. Share the console output with me if the issue persists

The logs will tell us exactly where the app is getting stuck!

