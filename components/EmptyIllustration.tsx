import Svg, { Path, Ellipse, Circle } from 'react-native-svg';

import { colors } from '@/theme/colors';

type Props = { size?: number };

export function EmptyIllustration({ size = 120 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <Ellipse cx={60} cy={100} rx={36} ry={8} fill={colors.papelWarm} opacity={0.6} />
      <Ellipse cx={60} cy={96} rx={32} ry={6} fill="#8B6F47" />
      <Path d="M60 92 L60 50" stroke={colors.broto} strokeWidth={3.5} strokeLinecap="round" />
      <Path
        d="M60 64 Q40 56 28 42 Q36 32 50 38 Q60 48 60 64 Z"
        fill={colors.broto}
      />
      <Path d="M60 64 Q48 58 38 48" stroke={colors.mata} strokeWidth={1} fill="none" opacity={0.4} />
      <Path
        d="M60 56 Q80 50 92 36 Q84 28 70 32 Q60 42 60 56 Z"
        fill={colors.casca}
      />
      <Path d="M60 56 Q72 50 82 40" stroke={colors.mata} strokeWidth={1} fill="none" opacity={0.4} />
      <Circle cx={60} cy={46} r={4.5} fill={colors.manga} />
      <Circle cx={60} cy={46} r={2} fill={colors.mangaDeep} />
    </Svg>
  );
}
