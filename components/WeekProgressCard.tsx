import { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { useSharedValue, useAnimatedProps, withTiming, Easing } from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, RadialGradient, Stop, Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const RADIUS = 54;
const STROKE = 8;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

type Props = {
  visited: number;
  total: number;
  weekNumber: number;
  pendingCount: number;
  weekLabel?: string;
  onPrev?: () => void;
  onNext?: () => void;
};

export function WeekProgressCard({ visited, total, weekNumber, pendingCount, weekLabel, onPrev, onNext }: Props) {
  const progress = total === 0 ? 0 : visited / total;
  const pct = Math.round(progress * 100);

  const offset = useSharedValue(CIRCUMFERENCE);

  useEffect(() => {
    offset.value = withTiming(CIRCUMFERENCE * (1 - progress), {
      duration: 1800,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    });
  }, [progress, offset]);

  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: offset.value }));

  return (
    <LinearGradient
      colors={[colors.mata, '#234737', '#2D5A47']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}>

      {/* Radial orange glow circle — bottom right (mockup ::before) */}
      <Svg pointerEvents="none" style={[StyleSheet.absoluteFill]}>
        <Defs>
          <RadialGradient id="orangeGlow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <Stop offset="0" stopColor="#E8A04C" stopOpacity="0.25" />
            <Stop offset="0.7" stopColor="#E8A04C" stopOpacity="0" />
            <Stop offset="1" stopColor="#E8A04C" stopOpacity="0" />
          </RadialGradient>
        </Defs>
      </Svg>
      <View pointerEvents="none" style={styles.orangeGlowWrap}>
        <Svg width={280} height={280}>
          <Defs>
            <RadialGradient id="og2" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor="#E8A04C" stopOpacity="0.25" />
              <Stop offset="0.7" stopColor="#E8A04C" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={140} cy={140} r={140} fill="url(#og2)" />
        </Svg>
      </View>

      {/* Leaf decorative bottom-right */}
      <View pointerEvents="none" style={styles.leafBg}>
        <Svg viewBox="0 0 200 200" width={180} height={180}>
          <Path
            d="M100 20 Q40 60 30 140 Q50 180 100 180 Q150 180 170 140 Q160 60 100 20 Z"
            fill="rgba(255,255,255,0.1)"
          />
          <Path d="M100 30 L100 170" stroke="rgba(0,0,0,0.22)" strokeWidth={2} />
          <Path
            d="M100 60 Q70 70 50 100 M100 90 Q70 100 55 130 M100 120 Q70 130 60 155 M100 60 Q130 70 150 100 M100 90 Q130 100 145 130 M100 120 Q130 130 140 155"
            stroke="rgba(0,0,0,0.18)"
            strokeWidth={1.5}
            fill="none"
          />
        </Svg>
      </View>

      <View style={styles.topRow}>
        <Text style={styles.label}>Esta semana</Text>
        <View style={styles.weekNav}>
          {onPrev ? (
            <Pressable onPress={onPrev} style={styles.weekArrow} hitSlop={8}>
              <Ionicons name="chevron-back" size={12} color={colors.mangaSoft} />
            </Pressable>
          ) : null}
          <Text style={styles.weekBadge}>{weekLabel ?? `Semana ${weekNumber}`}</Text>
          {onNext ? (
            <Pressable onPress={onNext} style={styles.weekArrow} hitSlop={8}>
              <Ionicons name="chevron-forward" size={12} color={colors.mangaSoft} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.ringWrap}>
          <Svg width={120} height={120} viewBox="0 0 120 120">
            <Defs>
              <SvgLinearGradient id="mangaRing" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={colors.mangaSoft} />
                <Stop offset="1" stopColor={colors.manga} />
              </SvgLinearGradient>
            </Defs>
            <Circle cx={60} cy={60} r={RADIUS} stroke="rgba(255,255,255,0.08)" strokeWidth={STROKE} fill="none" />
            <AnimatedCircle
              cx={60}
              cy={60}
              r={RADIUS}
              stroke="url(#mangaRing)"
              strokeWidth={STROKE}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={CIRCUMFERENCE}
              animatedProps={animatedProps}
              transform="rotate(-90 60 60)"
            />
          </Svg>
          <View style={styles.ringCenter}>
            <Text style={styles.ringNumber}>
              {visited}
              <Text style={styles.ringDenom}>/{total}</Text>
            </Text>
          </View>
        </View>

        <View style={styles.info}>
          <Text style={styles.pct}>{pct}%</Text>
          <Text style={styles.msg}>
            {pendingCount === 0
              ? 'tudo certo essa semana 🌱'
              : `faltam ${pendingCount} ${pendingCount === 1 ? 'fazenda' : 'fazendas'} pra fechar`}
          </Text>
          {pendingCount > 0 ? (
            <View style={styles.ctaWrap}>
              <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
              <View style={styles.ctaInner}>
                <Ionicons name="arrow-forward" size={12} color="white" />
                <Text style={styles.ctaText}>ver pendentes</Text>
              </View>
            </View>
          ) : null}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 28,
    padding: 28,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: colors.mata,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 48,
    elevation: 12,
  },
  orangeGlowWrap: {
    position: 'absolute',
    width: 280,
    height: 280,
    right: -80,
    bottom: -100,
  },
  leafBg: {
    position: 'absolute',
    right: -10,
    bottom: -20,
    opacity: 0.18,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    position: 'relative',
    zIndex: 2,
  },
  label: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: fonts.uiSemibold,
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  weekNav: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  weekArrow: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  weekBadge: {
    color: colors.mangaSoft,
    fontFamily: fonts.uiMedium,
    fontSize: 11,
    minWidth: 80,
    textAlign: 'center',
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 22,
    marginTop: 22,
    position: 'relative',
    zIndex: 2,
  },
  ringWrap: { width: 120, height: 120, position: 'relative' },
  ringCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringNumber: {
    color: 'white',
    fontFamily: fonts.display,
    fontSize: 38,
    letterSpacing: -1.2,
  },
  ringDenom: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 20,
    fontFamily: fonts.display,
  },
  info: { flex: 1 },
  pct: {
    color: colors.mangaSoft,
    fontFamily: fonts.display,
    fontSize: 32,
    letterSpacing: -1,
  },
  msg: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  ctaWrap: {
    marginTop: 14,
    alignSelf: 'flex-start',
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  ctaInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  ctaText: {
    color: 'white',
    fontFamily: fonts.uiSemibold,
    fontSize: 12,
  },
});
