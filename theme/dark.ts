import { colors } from './colors';

export const darkColors = {
  ...colors,
  papel: colors.noite,
  papelWarm: '#142420',
  neblina: colors.noiteCard,
  ink1: '#F0E8D4',
  ink2: '#B5AC97',
  ink3: '#7D7464',
  ink4: '#4A4438',
  manga: colors.mangaSoft,
  mangaDeep: colors.manga,
  mangaSoft: '#F6CB94',
} as const;

export function getColors(mode: 'light' | 'dark') {
  return mode === 'dark' ? darkColors : colors;
}
