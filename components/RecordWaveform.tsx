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
  const scale = useSharedValue(0.4);

  useEffect(() => {
    if (active) {
      scale.value = withDelay(
        index * 50,
        withRepeat(
          withTiming(1, { duration: 700 + (index % 4) * 100, easing: Easing.inOut(Easing.sin) }),
          -1,
          true
        )
      );
    } else {
      scale.value = withTiming(0.4, { duration: 400 });
    }
  }, [active, index, scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scaleY: scale.value * baseHeight + 0.1 }],
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
    opacity: 0.85,
  },
});
