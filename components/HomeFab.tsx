import { useEffect } from 'react';
import { StyleSheet, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/theme/colors';

type Props = { onPress: () => void };

export function HomeFab({ onPress }: Props) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.05, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [scale]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable onPress={onPress} style={styles.touch}>
      <Animated.View style={[styles.fab, style]}>
        <LinearGradient
          colors={[colors.manga, colors.mangaDeep]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        <Ionicons name="add" size={26} color="white" />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  touch: { position: 'absolute', bottom: 96, right: 22, zIndex: 30 },
  fab: {
    width: 60, height: 60, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: colors.mangaDeep,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 32,
    elevation: 12,
  },
});
