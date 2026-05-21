import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withDelay, Easing } from 'react-native-reanimated';

import { colors } from '@/theme/colors';

const BARS = 25;

type Props = { active: boolean };

export function RecordWaveform({ active }: Props) {
  return (
    <View style={styles.row}>
      {Array.from({ length: BARS }).map((_, i) => (
        <Bar key={i} index={i} active={active} />
      ))}
    </View>
  );
}

function Bar({ index, active }: { index: number; active: boolean }) {
  const baseHeight = 0.3 + Math.abs(Math.sin(index * 0.7)) * 0.5 + Math.abs(Math.sin(index * 1.3)) * 0.3;
  const scale = useSharedValue(0.3);
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    const dur = active ? 700 + (index % 4) * 100 : 1400 + (index % 5) * 150;
    const peak = active ? 1 : 0.55;
    const minScale = active ? 0.3 : 0.2;
    scale.value = withDelay(
      index * (active ? 50 : 80),
      withRepeat(
        withTiming(peak, { duration: dur, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      )
    );
    opacity.value = withTiming(active ? 0.9 : 0.45, { duration: 300 });
  }, [active, index, scale, opacity]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scaleY: Math.max(0.2, scale.value * baseHeight) }],
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.bar, style]} />;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    height: 80,
    paddingHorizontal: 24,
  },
  bar: {
    width: 3,
    height: 60,
    backgroundColor: colors.manga,
    borderRadius: 2,
  },
});
