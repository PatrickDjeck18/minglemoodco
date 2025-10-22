# DailyVerseCard Component

A modern, production-ready React Native component for displaying daily Bible verses with enhanced UI/UX, animations, and interactive features.

## Features

### 🎨 Modern Design
- **Glass morphism effect** with blur background
- **Gradient overlays** for visual appeal
- **Smooth animations** and transitions
- **Responsive design** that adapts to different screen sizes
- **Dark/Light theme support**

### 🚀 Interactive Features
- **Bookmark functionality** with haptic feedback
- **Copy to clipboard** with confirmation
- **Advanced sharing** with custom message formatting
- **Refresh functionality** with loading states
- **Expandable actions** panel

### ♿ Accessibility
- **Screen reader support** with proper labels
- **Keyboard navigation** support
- **High contrast** mode compatibility
- **VoiceOver/TalkBack** optimized

### 🛡️ Production Ready
- **Error boundary** for graceful error handling
- **Loading states** with skeleton animations
- **Haptic feedback** for better user experience
- **TypeScript support** with full type safety
- **Performance optimized** with native driver animations

## Usage

```tsx
import DailyVerseCard from '../components/DailyVerseCard';
import DailyVerseCardErrorBoundary from '../components/DailyVerseCardErrorBoundary';

// Basic usage
<DailyVerseCardErrorBoundary>
  <DailyVerseCard
    verse={dailyVerse}
    loading={verseLoading}
    onRefresh={handleRefresh}
  />
</DailyVerseCardErrorBoundary>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `verse` | `DailyVerse` | ✅ | The verse data object |
| `loading` | `boolean` | ❌ | Loading state indicator |
| `onRefresh` | `() => void` | ❌ | Callback for refresh action |
| `style` | `StyleProp<ViewStyle>` | ❌ | Additional styles |

## DailyVerse Interface

```typescript
interface DailyVerse {
  text: string;
  reference: string;
  date: string;
}
```

## Styling

The component uses a modern design system with:
- **Rounded corners** (24px border radius)
- **Subtle shadows** for depth
- **Gradient backgrounds** for visual interest
- **Consistent spacing** following 8px grid
- **Typography scale** for readability

## Animations

- **Entrance animation**: Fade in with scale and slide effects
- **Refresh animation**: Scale bounce effect
- **Action panel**: Smooth slide and fade transitions
- **Loading state**: Animated dots with staggered timing

## Error Handling

The component includes a dedicated error boundary that:
- Catches and displays errors gracefully
- Provides retry functionality
- Maintains app stability
- Shows user-friendly error messages

## Performance

- Uses `useNativeDriver: true` for smooth 60fps animations
- Optimized re-renders with proper dependency arrays
- Lazy loading of heavy components
- Efficient state management

## Dependencies

- `expo-blur` - Glass morphism effect
- `expo-linear-gradient` - Gradient backgrounds
- `expo-haptics` - Haptic feedback
- `@expo/vector-icons` - Icon system
- `react-native` - Core components

## Browser Support

- iOS 11+
- Android API 21+
- React Native 0.60+

## Contributing

When modifying this component:
1. Maintain accessibility standards
2. Test on both iOS and Android
3. Ensure animations are smooth
4. Update TypeScript types
5. Add proper error handling
6. Test with screen readers

## License

Part of the FaithHabits app - All rights reserved.
