import { create } from 'zustand';
import { authService } from '../services/auth';

type Session = { userId: number; email: string };

type AuthState = {
  session: Session | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setSession: (session: Session | null) => void;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  hydrated: false,
  hydrate: async () => {
    const session = await authService.getSession();
    set({ session, hydrated: true });
  },
  setSession: (session) => set({ session }),
  signOut: async () => {
    await authService.logout();
    set({ session: null });
  },
}));
