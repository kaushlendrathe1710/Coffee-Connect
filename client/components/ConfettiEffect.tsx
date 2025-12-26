import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

import { Colors } from '@/constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ConfettiPieceProps {
  delay: number;
  startX: number;
  color: string;
  size: number;
  rotation: number;
}

function ConfettiPiece({ delay, startX, color, size, rotation }: ConfettiPieceProps) {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(startX);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0);

  useEffect(() => {
    const horizontalDrift = (Math.random() - 0.5) * 100;
    
    scale.value = withDelay(delay, withTiming(1, { duration: 200 }));
    translateY.value = withDelay(
      delay,
      withTiming(SCREEN_HEIGHT + 100, {
        duration: 2500 + Math.random() * 1000,
        easing: Easing.out(Easing.quad),
      })
    );
    translateX.value = withDelay(
      delay,
      withTiming(startX + horizontalDrift, {
        duration: 2500,
        easing: Easing.inOut(Easing.sin),
      })
    );
    rotate.value = withDelay(
      delay,
      withTiming(rotation + 720 * (Math.random() > 0.5 ? 1 : -1), {
        duration: 2500,
        easing: Easing.linear,
      })
    );
    opacity.value = withDelay(
      delay + 2000,
      withTiming(0, { duration: 500 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.confettiPiece,
        {
          width: size,
          height: size * 0.6,
          backgroundColor: color,
          borderRadius: size * 0.1,
        },
        animatedStyle,
      ]}
    />
  );
}

interface ConfettiEffectProps {
  isActive: boolean;
  onComplete?: () => void;
}

const CONFETTI_COLORS = [
  Colors.light.primary,
  Colors.light.success,
  '#FFD700',
  '#FF69B4',
  '#87CEEB',
  Colors.light.secondary,
];

export function ConfettiEffect({ isActive, onComplete }: ConfettiEffectProps) {
  const [pieces, setPieces] = React.useState<ConfettiPieceProps[]>([]);

  useEffect(() => {
    if (isActive) {
      const newPieces: ConfettiPieceProps[] = [];
      for (let i = 0; i < 50; i++) {
        newPieces.push({
          delay: Math.random() * 500,
          startX: Math.random() * SCREEN_WIDTH,
          color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
          size: 8 + Math.random() * 8,
          rotation: Math.random() * 360,
        });
      }
      setPieces(newPieces);

      const timer = setTimeout(() => {
        setPieces([]);
        onComplete?.();
      }, 3500);

      return () => clearTimeout(timer);
    } else {
      setPieces([]);
    }
  }, [isActive]);

  if (!isActive && pieces.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {pieces.map((piece, index) => (
        <ConfettiPiece key={index} {...piece} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  confettiPiece: {
    position: 'absolute',
  },
});
