import { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence, withDelay, runOnJS } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';

type Props = {
  message: string;
  visible: boolean;
  onUndo: () => void;
  onDismiss: () => void;
  durationMs?: number;
};

export function UndoToast({ message, visible, onUndo, onDismiss, durationMs = 4500 }: Props) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(60);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 220 });
      translateY.value = withTiming(0, { duration: 280 });
      opacity.value = withSequence(
        withTiming(1, { duration: 220 }),
        withDelay(
          durationMs - 220,
          withTiming(0, { duration: 280 }, (finished) => {
            if (finished) runOnJS(onDismiss)();
          })
        )
      );
    } else {
      opacity.value = withTiming(0, { duration: 220 });
      translateY.value = withTiming(60, { duration: 280 });
    }
  }, [visible, durationMs, opacity, translateY, onDismiss]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View pointerEvents="box-none" style={[styles.wrap, style]}>
      <View style={styles.toast}>
        <Ionicons name="information-circle" size={18} color={colors.mangaSoft} />
        <Text style={styles.text}>{message}</Text>
        <Pressable onPress={onUndo} style={styles.undoBtn}>
          <Text style={styles.undoText}>Desfazer</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    bottom: 110,
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 100,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.mata,
    borderRadius: 999,
    shadowColor: colors.noite,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 8,
  },
  text: { color: 'white', fontFamily: fonts.uiMedium, fontSize: 13, flexShrink: 1 },
  undoBtn: { paddingHorizontal: 10, paddingVertical: 4 },
  undoText: { color: colors.mangaSoft, fontFamily: fonts.uiBold, fontSize: 13 },
});
