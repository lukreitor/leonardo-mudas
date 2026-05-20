import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const DARK_KEY = 'lm.darkMode';
const SOUND_KEY = 'lm.sound';

type Settings = {
  darkMode: 'system' | 'light' | 'dark';
  soundEnabled: boolean;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setDarkMode: (m: 'system' | 'light' | 'dark') => Promise<void>;
  setSoundEnabled: (b: boolean) => Promise<void>;
};

export const useSettings = create<Settings>((set) => ({
  darkMode: 'system',
  soundEnabled: false,
  hydrated: false,
  hydrate: async () => {
    const d = (await SecureStore.getItemAsync(DARK_KEY)) as 'system' | 'light' | 'dark' | null;
    const s = await SecureStore.getItemAsync(SOUND_KEY);
    set({ darkMode: d ?? 'system', soundEnabled: s === '1', hydrated: true });
  },
  setDarkMode: async (m) => {
    await SecureStore.setItemAsync(DARK_KEY, m);
    set({ darkMode: m });
  },
  setSoundEnabled: async (b) => {
    if (b) await SecureStore.setItemAsync(SOUND_KEY, '1');
    else await SecureStore.deleteItemAsync(SOUND_KEY);
    set({ soundEnabled: b });
  },
}));
