import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import * as Haptics from 'expo-haptics';

interface ModernBackButtonProps {
  onPress: () => void;
  style?: ViewStyle;
  size?: number;
  color?: string;
}

const ModernBackButton: React.FC<ModernBackButtonProps> = ({ 
  onPress, 
  style, 
  size = 24,
  color 
}) => {
  const { colors } = useTheme();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <TouchableOpacity
      style={[
        styles.backButton,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
        style,
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Ionicons
        name="chevron-back"
        size={size}
        color={color || colors.text}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default ModernBackButton;
