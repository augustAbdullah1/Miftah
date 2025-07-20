import React from 'react';
import {
  View,
  ViewStyle,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { lightTheme, darkTheme, glassMorphismStyle, darkGlassMorphismStyle } from '../theme';

interface GlassContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  blurType?: 'light' | 'dark' | 'prominent';
}

export const GlassContainer: React.FC<GlassContainerProps> = ({
  children,
  style,
  intensity = 20,
  tint = 'default',
  blurType = 'light',
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? darkTheme : lightTheme;
  
  const glassStyle = isDark ? darkGlassMorphismStyle : glassMorphismStyle;
  
  const blurTint = tint === 'default' 
    ? (isDark ? 'dark' : 'light')
    : tint;

  return (
    <View style={[styles.container, glassStyle, style]}>
      <BlurView
        intensity={intensity}
        tint={blurTint}
        style={styles.blurView}
      >
        <View style={styles.content}>
          {children}
        </View>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  blurView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
});