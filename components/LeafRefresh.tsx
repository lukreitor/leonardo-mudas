import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { colors } from '@/theme/colors';

type Props = { active: boolean };

export function LeafRefresh({ active }: Props) {
  const sway = useSharedValue(0);

  useEffect(() => {
    if (active) {
      sway.value = withRepeat(
        withSequence(
          withTiming(-10, { duration: 600, easing: Easing.inOut(Easing.sin) }),
          withTiming(10, { duration: 600, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      );
    } else {
      sway.value = withTiming(0);
    }
  }, [active, sway]);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sway.value}deg` }],
  }));

  return (
    <View style={styles.wrap}>
      <Animated.View style={style}>
        <Svg width={28} height={28} viewBox="0 0 24 24">
          <Path
            d="M12 2 Q4 8 4 14 Q4 18 12 22 Q20 18 20 14 Q20 8 12 2 Z"
            fill={colors.broto}
          />
          <Path d="M12 4 L12 20" stroke={colors.mata} strokeWidth={1} opacity={0.4} />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', padding: 12 },
});
