import { useColorScheme } from 'react-native';
import { useSettings } from '../stores/settings';
import { colors, farmColors } from './colors';
import { darkColors } from './dark';

export function useThemeColors() {
  const mode = useSettings((s) => s.darkMode);
  const system = useColorScheme();
  const effective: 'light' | 'dark' =
    mode === 'system' ? (system === 'dark' ? 'dark' : 'light') : mode;
  return {
    colors: effective === 'dark' ? darkColors : colors,
    farmColors,
    mode: effective,
  };
}
