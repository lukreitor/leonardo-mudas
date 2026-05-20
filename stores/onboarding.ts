import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const KEY = 'lm.onboardingDone';

type OnboardingState = {
  done: boolean;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  markDone: () => Promise<void>;
};

export const useOnboarding = create<OnboardingState>((set) => ({
  done: false,
  hydrated: false,
  hydrate: async () => {
    const v = await SecureStore.getItemAsync(KEY);
    set({ done: v === '1', hydrated: true });
  },
  markDone: async () => {
    await SecureStore.setItemAsync(KEY, '1');
    set({ done: true });
  },
}));
