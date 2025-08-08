import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { lightTheme, darkTheme } from '../theme';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  const getButtonStyle = () => {
    const baseStyle = [
      styles.button,
      styles[size],
      { borderRadius: theme.borderRadius.md },
    ];

    if (disabled) {
      return [...baseStyle, styles.disabled];
    }

    switch (variant) {
      case 'outline':
        return [
          ...baseStyle,
          {
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: theme.colors.primary,
          },
        ];
      case 'ghost':
        return [
          ...baseStyle,
          {
            backgroundColor: 'transparent',
          },
        ];
      case 'secondary':
        return [
          ...baseStyle,
          {
            backgroundColor: theme.colors.secondary,
          },
        ];
      default:
        return baseStyle;
    }
  };

  const getTextStyle = () => {
    const baseStyle = [
      styles.text,
      styles[`${size}Text`],
      { color: theme.colors.surface },
    ];

    if (variant === 'outline' || variant === 'ghost') {
      return [
        ...baseStyle,
        { color: theme.colors.primary },
      ];
    }

    return baseStyle;
  };

  const renderContent = () => (
    <>
      {loading && (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? theme.colors.primary : theme.colors.surface}
          style={styles.loader}
        />
      )}
      {icon && !loading && icon}
      <Text style={[getTextStyle(), textStyle]}>
        {title}
      </Text>
    </>
  );

  if (variant === 'primary' && !disabled) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        style={[getButtonStyle(), style]}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={theme.gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            StyleSheet.absoluteFillObject,
            { borderRadius: theme.borderRadius.md },
          ]}
        />
        <Text style={[getTextStyle(), textStyle, { zIndex: 1 }]}>
          {renderContent()}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[getButtonStyle(), style]}
      activeOpacity={0.8}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  small: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 36,
  },
  medium: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  large: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 56,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
  disabled: {
    opacity: 0.5,
  },
  loader: {
    marginRight: 8,
  },
});