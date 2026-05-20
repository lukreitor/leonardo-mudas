import { useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

const AnimatedPath = Animated.createAnimatedComponent(Path);

import { colors, shadows } from '@/theme/colors';
import { fonts } from '@/theme/typography';
import type { FarmStatus } from '@/lib/contracts';

type Props = {
  farmId: number;
  name: string;
  meta?: string;
  avatarColor: string;
  initials: string;
  status: FarmStatus;
  onTap: () => void;
  onLongPress: () => void;
  onOpen: () => void;
};

const LONG_PRESS_MS = 1500;

export function FarmCard({ name, meta, avatarColor, initials, status, onTap, onLongPress, onOpen }: Props) {
  const scale = useSharedValue(1);
  const tickProgress = useSharedValue(status === 'visited' ? 1 : 0);
  const opacity = useSharedValue(status === 'skipped' ? 0.55 : 1);

  useEffect(() => {
    tickProgress.value = withTiming(status === 'visited' ? 1 : 0, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
    opacity.value = withTiming(status === 'skipped' ? 0.55 : 1, { duration: 220 });
  }, [status, tickProgress, opacity]);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.97, { damping: 15 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSequence(withSpring(1.02, { damping: 18, stiffness: 250 }), withSpring(1, { damping: 18 }));
  }, [scale]);

  const handleTap = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onTap();
  }, [onTap]);

  const handleLongPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onLongPress();
  }, [onLongPress]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const tickStyle = useAnimatedStyle(() => ({
    opacity: tickProgress.value,
    transform: [{ scale: 0.6 + tickProgress.value * 0.4 }],
  }));

  const TICK_PATH_LENGTH = 18;
  const tickPathProps = useAnimatedProps(() => ({
    strokeDashoffset: TICK_PATH_LENGTH * (1 - tickProgress.value),
  }));

  const cardBgStyle = useAnimatedStyle(() => {
    const targetBg = status === 'visited' ? 'rgba(122,160,91,0.06)' : colors.neblina;
    return { backgroundColor: targetBg };
  });

  return (
    <Pressable
      onPress={handleTap}
      onLongPress={handleLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      delayLongPress={LONG_PRESS_MS}
      android_disableSound>
      <Animated.View style={[styles.card, cardBgStyle, status === 'visited' && styles.cardVisited, containerStyle]}>
        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>

        <View style={styles.info}>
          <Text style={styles.name}>{name}</Text>
          {meta ? <Text style={styles.meta}>{meta}</Text> : null}
          {status === 'skipped' ? (
            <View style={styles.skippedBadge}>
              <Ionicons name="moon-outline" size={10} color={colors.ink3} />
              <Text style={styles.skippedBadgeText}>Pulada esta semana</Text>
            </View>
          ) : null}
        </View>

        {status === 'visited' ? (
          <Animated.View style={[styles.tickWrap, tickStyle]}>
            <Svg width={18} height={18} viewBox="0 0 16 16">
              <AnimatedPath
                d="M3 8 L7 12 L13 5"
                stroke="white"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                strokeDasharray={TICK_PATH_LENGTH}
                animatedProps={tickPathProps}
              />
            </Svg>
          </Animated.View>
        ) : status === 'pending' ? (
          <View style={styles.pendingDot} />
        ) : (
          <View style={styles.skippedDot}>
            <Ionicons name="remove" size={14} color={colors.ink3} />
          </View>
        )}

        <Pressable onPress={onOpen} hitSlop={12} style={styles.chevron}>
          <Ionicons name="chevron-forward" size={18} color={colors.ink4} />
        </Pressable>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(26,58,46,0.05)',
    backgroundColor: colors.neblina,
    gap: 14,
    ...shadows.sm,
  },
  cardVisited: {
    borderColor: 'rgba(122,160,91,0.18)',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: 'white',
    fontFamily: fonts.displayBold,
    fontSize: 18,
    letterSpacing: -0.4,
  },
  info: { flex: 1, minWidth: 0 },
  name: { fontFamily: fonts.uiSemibold, fontSize: 15, color: colors.ink1, letterSpacing: -0.2 },
  meta: { fontFamily: fonts.ui, fontSize: 12, color: colors.ink3, marginTop: 2 },
  skippedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(26,58,46,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  skippedBadgeText: {
    fontSize: 10,
    fontFamily: fonts.uiSemibold,
    color: colors.ink3,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  tickWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.broto,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(26,58,46,0.18)',
    borderStyle: 'dashed',
  },
  skippedDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(26,58,46,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: { padding: 4 },
});
