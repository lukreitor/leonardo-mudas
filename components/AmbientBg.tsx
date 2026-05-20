import { StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';

import { colors } from '@/theme/colors';

type Props = { variant?: 'light' | 'soft' };

export function AmbientBg({ variant = 'light' }: Props) {
  if (variant === 'soft') {
    return (
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Svg style={StyleSheet.absoluteFill}>
          <Defs>
            <RadialGradient id="ambientTop" cx="80%" cy="0%" rx="50%" ry="40%">
              <Stop offset="0" stopColor={colors.broto} stopOpacity="0.08" />
              <Stop offset="1" stopColor={colors.broto} stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="ambientBottom" cx="20%" cy="100%" rx="50%" ry="40%">
              <Stop offset="0" stopColor={colors.manga} stopOpacity="0.06" />
              <Stop offset="1" stopColor={colors.manga} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#ambientTop)" />
          <Rect width="100%" height="100%" fill="url(#ambientBottom)" />
        </Svg>
      </View>
    );
  }
  return null;
}
