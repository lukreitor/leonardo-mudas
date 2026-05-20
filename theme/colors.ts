export const colors = {
  mata: '#1A3A2E',
  mataSoft: '#234737',
  broto: '#4A7C59',
  brotoSoft: '#6B9476',
  manga: '#E8A04C',
  mangaDeep: '#D4842B',
  mangaSoft: '#F2BA75',
  casca: '#7BA05B',
  papel: '#F5F0E6',
  papelWarm: '#EFE7D6',
  noite: '#0E1B14',
  noiteCard: '#1A2A21',
  neblina: '#FAFAF7',
  ink1: '#1A1814',
  ink2: '#4A4640',
  ink3: '#8A8580',
  ink4: '#C9C3B8',
  danger: '#DC3545',
  dangerSoft: '#FFE6E6',
} as const;

export const farmColors = [
  '#4A7C59', '#C97B5E', '#8B6F47', '#6B8E7F',
  '#D4842B', '#7BA05B', '#A66B3C', '#5C8C7D',
  '#B5915C', '#4F7066', '#9B7449', '#5E8B58',
  '#C49156', '#6F8F4A', '#8D6543', '#547966',
  '#A8794F', '#6A8B5D',
] as const;

export const shadows = {
  sm: {
    shadowColor: colors.mata,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  md: {
    shadowColor: colors.mata,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 4,
  },
  lg: {
    shadowColor: colors.mata,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.1,
    shadowRadius: 48,
    elevation: 12,
  },
  manga: {
    shadowColor: colors.mangaDeep,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;
