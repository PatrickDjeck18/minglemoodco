import React, { useRef } from 'react';
import { TouchableOpacity, Text, Animated, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  hapticFeedback?: boolean;
  icon?: React.ReactNode;
}

const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  hapticFeedback = true,
  icon,
}) => {
  const { colors, isDark } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    if (disabled || loading) return;

    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onPress();
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 };
      case 'large':
        return { paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16 };
      default:
        return { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 };
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: colors.secondary,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.primary,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
        };
      default:
        return {};
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'outline':
      case 'ghost':
        return colors.primary;
      default:
        return '#FFFFFF';
    }
  };

  const buttonStyle = [
    getSizeStyles(),
    getVariantStyles(),
    {
      opacity: disabled || loading ? 0.6 : 1,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    },
    style,
  ];

  const textStyleFinal = [
    {
      color: getTextColor(),
      fontWeight: '600',
      fontSize: size === 'small' ? 14 : size === 'large' ? 18 : 16,
      marginLeft: icon ? 8 : 0,
    },
    textStyle,
  ];

  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator size="small" color={getTextColor()} />;
    }
    return (
      <>
        {icon}
        <Text style={textStyleFinal}>{title}</Text>
      </>
    );
  };

  if (variant === 'primary' || variant === 'secondary') {
    const gradientColors = variant === 'primary'
      ? [colors.primary, colors.secondary]
      : [colors.secondary, colors.primary];

    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity onPress={handlePress} disabled={disabled || loading}>
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={buttonStyle}
          >
            {renderContent()}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled || loading}
        style={buttonStyle}
      >
        {renderContent()}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default CustomButton;
