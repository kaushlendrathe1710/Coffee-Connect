import React from 'react';
import { StyleSheet, View, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
  interpolate,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Spacing } from '@/constants/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  interactive?: boolean;
}

const springConfig: WithSpringConfig = {
  damping: 15,
  mass: 0.5,
  stiffness: 200,
  overshootClamping: false,
};

export function GlassCard({
  children,
  style,
  intensity = 40,
  tint = 'light',
  interactive = false,
}: GlassCardProps) {
  const { theme, isDark } = useTheme();
  const scale = useSharedValue(1);
  const rotateX = useSharedValue(0);
  const rotateY = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { perspective: 1000 },
      { rotateX: `${rotateX.value}deg` },
      { rotateY: `${rotateY.value}deg` },
    ],
  }));

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (!interactive) return;
      rotateY.value = interpolate(event.translationX, [-100, 100], [-5, 5]);
      rotateX.value = interpolate(event.translationY, [-100, 100], [5, -5]);
    })
    .onEnd(() => {
      rotateX.value = withSpring(0, springConfig);
      rotateY.value = withSpring(0, springConfig);
    });

  const tapGesture = Gesture.Tap()
    .onBegin(() => {
      scale.value = withSpring(0.98, springConfig);
    })
    .onEnd(() => {
      scale.value = withSpring(1, springConfig);
    });

  const composedGesture = Gesture.Simultaneous(panGesture, tapGesture);

  const glassBackground = isDark
    ? 'rgba(60, 50, 40, 0.6)'
    : 'rgba(255, 248, 240, 0.7)';
  
  const borderColor = isDark
    ? 'rgba(255, 255, 255, 0.1)'
    : 'rgba(255, 255, 255, 0.6)';

  const content = (
    <Animated.View
      style={[
        styles.container,
        {
          borderColor,
        },
        animatedStyle,
        style,
      ]}
    >
      {Platform.OS === 'ios' ? (
        <BlurView
          intensity={intensity}
          tint={isDark ? 'dark' : tint}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: glassBackground },
          ]}
        />
      )}
      <View style={styles.content}>{children}</View>
    </Animated.View>
  );

  if (interactive) {
    return <GestureDetector gesture={composedGesture}>{content}</GestureDetector>;
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  content: {
    padding: Spacing.lg,
  },
});
