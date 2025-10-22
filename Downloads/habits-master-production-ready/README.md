# FaithHabits - Spiritual Growth App

A modern React Native app built with Expo for iOS, designed to help users build and maintain spiritual habits through prayer, Bible reading, devotions, and spiritual practices.

## Features

### 🏠 **Dashboard/Home Screen**
- Personalized greeting with current date
- Today's overview with prayer streak and reading progress
- Quick action buttons for easy navigation
- Recent activities timeline
- Daily verse with sharing capability
- Glassmorphism design with blur effects

### 🙏 **Prayer Timer**
- Circular timer with animated progress ring
- Background audio support with ambient sounds
- Time presets (5, 10, 15, 30 minutes)
- Prayer prompts and focus topics
- Audio controls with volume adjustment
- Background playback support

### 📖 **Bible Reading Tracker**
- Multiple reading plans (Bible in a Year, New Testament in 90 days, etc.)
- Progress visualization with completion rings
- Calendar heat map for reading consistency
- Custom plan builder
- Reading statistics and streaks
- Today's reading with notes

### 📚 **Daily Devotions**
- Curated daily devotions with reflection questions
- Push notification reminders
- Personal notes and bookmarking
- Archive of past devotions
- Share functionality
- Reading progress tracking

### ⭐ **Spiritual Practices Builder**
- Custom practice creation with categories
- Practice tracking with streaks and goals
- Calendar view of practice completion
- Achievement system
- Statistics and progress monitoring
- Practice reminders

### 💝 **Prayer Requests**
- Add and manage prayer requests
- Category organization (Health, Family, Work, etc.)
- Prayer count tracking
- Answered prayers with testimonies
- Search and filter functionality
- Privacy settings

### 🧠 **Scripture Memory Tool**
- Spaced repetition algorithm
- Multiple practice modes (recall, first letters, fill blanks)
- Difficulty rating system
- Progress tracking and mastery levels
- Achievement badges
- Custom verse addition

### ⚙️ **Settings**
- Theme selection (Light/Dark/Auto)
- Notification preferences
- Bible translation settings
- Spiritual goals configuration
- Data export/import
- Privacy controls

### 📊 **Statistics Dashboard**
- Overview cards with key metrics
- Interactive charts for prayer time and reading
- Achievement system with unlockable badges
- Detailed statistics by category
- Time period comparisons
- Progress visualization

## Technical Features

### 🎨 **Design System**
- iOS 17+ design language
- SF Symbols for consistent iconography
- Glassmorphism effects with blur views
- Smooth 60fps animations
- Haptic feedback on interactions
- Light/dark mode support
- Custom color palette

### 🔧 **Technical Stack**
- **React Native** with Expo
- **TypeScript** for type safety
- **React Navigation** for navigation
- **React Native Reanimated** for animations
- **React Native Gesture Handler** for gestures
- **React Native Safe Area Context** for safe areas
- **AsyncStorage** for local data persistence
- **Expo AV** for background audio
- **Expo Notifications** for push notifications
- **Date-fns** for date handling
- **React Native Linear Gradient** for gradients
- **React Native Haptic Feedback** for haptics

### 📱 **iOS-Specific Features**
- Native iOS design patterns
- SF Symbols integration
- iOS-style navigation and modals
- Control center integration for audio
- Background app refresh
- Push notification support
- Haptic feedback throughout

## Project Structure

```
FaithHabits/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── CustomTabBar.tsx
│   │   ├── GlassCard.tsx
│   │   ├── CustomButton.tsx
│   │   └── ProgressRing.tsx
│   ├── screens/            # App screens
│   │   ├── OnboardingScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── PrayerTimerScreen.tsx
│   │   ├── BibleTrackerScreen.tsx
│   │   ├── DevotionsScreen.tsx
│   │   ├── PracticesScreen.tsx
│   │   ├── PrayerRequestsScreen.tsx
│   │   ├── ScriptureMemoryScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   └── StatisticsScreen.tsx
│   ├── context/           # React Context providers
│   │   └── ThemeContext.tsx
│   ├── constants/         # App constants
│   │   └── colors.ts
│   ├── utils/            # Utility functions
│   │   ├── storage.ts
│   │   └── firebase.ts
│   ├── types/            # TypeScript type definitions
│   └── hooks/            # Custom React hooks
├── App.tsx               # Main app component
├── app.json              # Expo configuration
└── package.json          # Dependencies
```

## Getting Started

### Prerequisites
- Node.js (v16 or later)
- Expo CLI
- iOS Simulator or physical iOS device
- Xcode (for iOS development)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd FaithHabits
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npx expo start
   ```

4. **Run on iOS**
   ```bash
   npx expo start --ios
   ```

### Configuration

1. **Firebase Setup** (Optional)
   - Create a Firebase project
   - Update the configuration in `src/utils/firebase.ts`
   - Install Firebase SDK: `npm install @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore`

2. **Push Notifications**
   - Configure notification settings in `app.json`
   - Set up notification icons and sounds

## Key Features Implementation

### 🎨 **Glassmorphism Design**
- Blur effects using `expo-blur`
- Semi-transparent cards with backdrop blur
- Layered design with depth
- iOS-style glass morphism

### 🔄 **Animations**
- Smooth transitions using React Native Reanimated
- Haptic feedback integration
- 60fps performance optimization
- Gesture-based interactions

### 📊 **Data Management**
- Local-first approach with AsyncStorage
- Offline functionality
- Data export/import capabilities
- Firebase sync (optional)

### 🔔 **Notifications**
- Daily devotion reminders
- Prayer time notifications
- Practice reminders
- Customizable notification settings

## Color Palette

```typescript
const Colors = {
  light: {
    primary: '#5E72E4',      // Royal blue
    secondary: '#825EE4',    // Purple
    success: '#2DCE89',     // Green
    warning: '#FB6340',     // Orange
    background: '#F7F8FC',   // Light gray
    card: 'rgba(255,255,255,0.9)', // Semi-transparent white
  },
  dark: {
    primary: '#5E72E4',      // Royal blue
    secondary: '#825EE4',    // Purple
    success: '#2DCE89',     // Green
    warning: '#FB6340',     // Orange
    background: '#1E1E2E',   // Dark gray
    card: 'rgba(255,255,255,0.1)', // Semi-transparent white
  }
}
```

## Development Guidelines

### Code Style
- TypeScript for type safety
- Functional components with hooks
- Consistent naming conventions
- Proper error handling
- Performance optimization

### Component Architecture
- Reusable components in `/components`
- Screen-specific components in `/screens`
- Context providers for global state
- Utility functions in `/utils`

### Testing
- Component testing with React Native Testing Library
- Integration testing for user flows
- Performance testing for animations
- Accessibility testing

## Future Enhancements

- [ ] Social features and community
- [ ] Advanced analytics and insights
- [ ] Custom themes and personalization
- [ ] Offline Bible content
- [ ] Audio devotions and podcasts
- [ ] Group prayer sessions
- [ ] Advanced memory techniques
- [ ] Integration with external Bible APIs
- [ ] Apple Watch companion app
- [ ] Siri Shortcuts integration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please open an issue in the repository or contact the development team.

---

**FaithHabits** - Building spiritual habits, one day at a time. 🙏
