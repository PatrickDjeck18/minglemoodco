import React from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../context/ThemeContext';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
}

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  intensity = 80,
  tint = 'default'
}) => {
  const { colors, isDark } = useTheme();
  const blurTint = tint === 'default' ? (isDark ? 'dark' : 'light') : tint;

  return (
    <BlurView
      intensity={intensity}
      tint={blurTint}
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: 20, // Slightly increased for a softer, modern look
          borderWidth: 0.5,
          borderColor: colors.border,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 8 }, // Increased height for more depth
          shadowOpacity: 0.15, // Slightly increased for a more noticeable, yet subtle shadow
          shadowRadius: 15, // Increased for a softer, more spread-out shadow
          elevation: 6, // Increased for Android shadow equivalent
        },
        style,
      ]}
    >
      {children}
    </BlurView>
  );
};

export default GlassCard;
