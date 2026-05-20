import { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, withSequence, Easing, runOnJS } from 'react-native-reanimated';

const { width: W, height: H } = Dimensions.get('window');

type Props = { visible: boolean; onComplete?: () => void };

const LEAF_COUNT = 14;

export function Confetti({ visible, onComplete }: Props) {
  if (!visible) return null;

  return (
    <View pointerEvents="none" style={styles.wrap}>
      {Array.from({ length: LEAF_COUNT }).map((_, i) => (
        <Leaf key={i} index={i} onComplete={i === 0 ? onComplete : undefined} />
      ))}
    </View>
  );
}

function Leaf({ index, onComplete }: { index: number; onComplete?: () => void }) {
  const x = ((index / LEAF_COUNT) * W + Math.random() * 40 - 20) % W;
  const startX = x;
  const drift = (Math.random() - 0.5) * 60;
  const startDelay = Math.random() * 400;
  const fallDuration = 2200 + Math.random() * 800;
  const rotateAmount = (Math.random() - 0.5) * 720;

  const ty = useSharedValue(-40);
  const tx = useSharedValue(0);
  const rot = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(startDelay, withSequence(withTiming(1, { duration: 200 }), withDelay(fallDuration - 600, withTiming(0, { duration: 400 }, (finished) => {
      if (finished && onComplete) runOnJS(onComplete)();
    }))));
    ty.value = withDelay(startDelay, withTiming(H + 80, { duration: fallDuration, easing: Easing.bezier(0.4, 0, 0.6, 1) }));
    tx.value = withDelay(startDelay, withTiming(drift, { duration: fallDuration, easing: Easing.inOut(Easing.sin) }));
    rot.value = withDelay(startDelay, withTiming(rotateAmount, { duration: fallDuration, easing: Easing.linear }));
  }, [drift, fallDuration, onComplete, opacity, rot, rotateAmount, startDelay, ty, tx]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { rotate: `${rot.value}deg` }],
  }));

  const palette = ['#4A7C59', '#7BA05B', '#E8A04C', '#D4842B', '#6B9476'];
  const color = palette[index % palette.length];
  const size = 14 + Math.random() * 10;

  return (
    <Animated.View
      style={[
        styles.leaf,
        { left: startX, width: size, height: size * 1.5, backgroundColor: color },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  wrap: { ...StyleSheet.absoluteFillObject, zIndex: 1000 },
  leaf: { position: 'absolute', top: 0, borderRadius: 8 },
});
