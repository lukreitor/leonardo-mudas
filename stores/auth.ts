import { create } from 'zustand';
import { authService } from '../services/auth';

type Session = { userId: number; email: string };

type AuthState = {
  session: Session | null;
  hydrated: boolean;
  bioVerified: boolean;
  hydrate: () => Promise<void>;
  setSession: (session: Session | null) => void;
  setBioVerified: (v: boolean) => void;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  hydrated: false,
  bioVerified: false,
  hydrate: async () => {
    const session = await authService.getSession();
    set({ session, hydrated: true, bioVerified: false });
  },
  setSession: (session) => set({ session }),
  setBioVerified: (v) => set({ bioVerified: v }),
  signOut: async () => {
    await authService.logout();
    set({ session: null, bioVerified: false });
  },
}));
