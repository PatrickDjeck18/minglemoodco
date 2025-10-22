import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, Animated, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import * as Haptics from 'expo-haptics';

interface TabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

const CustomTabBar: React.FC<TabBarProps> = ({ state, descriptors, navigation }) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const focusedAnim = useRef(new Animated.Value(0)).current; // Animation for the indicator

  useEffect(() => {
    Animated.timing(focusedAnim, {
      toValue: state.index,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [state.index]);

  const tabIcons = {
    Home: 'home' as keyof typeof Ionicons.glyphMap,
    Prayer: 'hourglass' as keyof typeof Ionicons.glyphMap,
    Bible: 'book' as keyof typeof Ionicons.glyphMap,
    Practices: 'star' as keyof typeof Ionicons.glyphMap,
    Profile: 'person' as keyof typeof Ionicons.glyphMap,
  };

  const handlePress = (route: any, index: number) => {
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!event.defaultPrevented) {
      navigation.navigate(route.name);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const tabWidth = 100 / state.routes.length; // Assuming equal width for tabs

  const translateX = focusedAnim.interpolate({
    inputRange: state.routes.map((_: any, i: number) => i),
    outputRange: state.routes.map((_: any, i: number) => i * tabWidth),
  });

  return (
    <View
      style={[
        styles.tabBarContainer,
        { paddingBottom: insets.bottom, backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)' },
      ]}
    >
      <BlurView
        intensity={85}
        tint={isDark ? 'dark' : 'light'}
        style={[
          styles.blurBackground,
          { borderTopColor: colors.border },
        ]}
      >
        {/* Animated indicator for the focused tab */}
        <Animated.View
          style={[
            styles.indicator,
            { 
              width: `${tabWidth}%`,
              backgroundColor: colors.primary,
              transform: [{ translateX }],
            },
          ]}
        />
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const iconName = tabIcons[route.name as keyof typeof tabIcons];

          return (
            <TouchableOpacity
              key={route.key}
              onPress={() => handlePress(route, index)}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              style={styles.tabItem}
            >
              <Ionicons
                name={isFocused ? iconName : (iconName + '-outline' as keyof typeof Ionicons.glyphMap)}
                size={24}
                color={isFocused ? colors.text : colors.textSecondary}
              />
              {/* Optionally add text label below icon */}
              {/* <Text style={{ color: isFocused ? colors.primary : colors.textSecondary, fontSize: 12 }}>
                {options.tabBarLabel !== undefined
                  ? options.tabBarLabel
                  : options.title !== undefined
                  ? options.title
                  : route.name}
              </Text> */}
            </TouchableOpacity>
          );
        })}
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 0,
    backgroundColor: 'transparent',
  },
  blurBackground: {
    flexDirection: 'row',
    height: 60,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    position: 'relative',
    overflow: 'hidden',
  },
  indicator: {
    position: 'absolute',
    height: 3,
    top: 0,
    left: 0,
    borderRadius: 1.5,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
});

export default CustomTabBar;
