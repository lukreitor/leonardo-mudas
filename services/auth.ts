import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { eq, asc } from 'drizzle-orm';

import { db } from '../db/client';
import { users } from '../db/schema';
import { hashPassword, generateSalt } from '../lib/auth';

const SESSION_KEY = 'lm.session';
const SALT_KEY = 'lm.salt';
const BIOMETRIC_KEY = 'lm.bio';

type Session = { userId: number; email: string };

export const authService = {
  async hasAnyUser(): Promise<boolean> {
    const result = await db.select().from(users).limit(1);
    return result.length > 0;
  },

  async register(email: string, password: string): Promise<Session> {
    const salt = generateSalt();
    const hash = await hashPassword(password, salt);
    const [created] = await db
      .insert(users)
      .values({ email, passwordHash: hash, biometricEnabled: false })
      .returning();
    await SecureStore.setItemAsync(SALT_KEY, salt);
    const session = { userId: created.id, email: created.email };
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
    return session;
  },

  async login(email: string, password: string): Promise<Session | null> {
    const found = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!found[0]) return null;
    const salt = await SecureStore.getItemAsync(SALT_KEY);
    if (!salt) return null;
    const hash = await hashPassword(password, salt);
    if (hash !== found[0].passwordHash) return null;
    const session = { userId: found[0].id, email: found[0].email };
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
    return session;
  },

  async getSession(): Promise<Session | null> {
    const raw = await SecureStore.getItemAsync(SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Session;
    } catch {
      return null;
    }
  },

  async logout(): Promise<void> {
    await SecureStore.deleteItemAsync(SESSION_KEY);
  },

  async isBiometricSupported(): Promise<boolean> {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) return false;
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return enrolled;
  },

  async getBiometricEnabled(): Promise<boolean> {
    return (await SecureStore.getItemAsync(BIOMETRIC_KEY)) === '1';
  },

  async setBiometricEnabled(enabled: boolean): Promise<void> {
    if (enabled) await SecureStore.setItemAsync(BIOMETRIC_KEY, '1');
    else await SecureStore.deleteItemAsync(BIOMETRIC_KEY);
  },

  async promptBiometric(reason = 'Desbloquear Leonardo Consultoria'): Promise<boolean> {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      cancelLabel: 'Cancelar',
      disableDeviceFallback: false,
    });
    return result.success;
  },

  async loginViaBiometric(): Promise<Session | null> {
    const ok = await this.promptBiometric('Entrar com biometria');
    if (!ok) return null;

    const cached = await this.getSession();
    if (cached) return cached;

    const found = await db.select().from(users).orderBy(asc(users.id)).limit(1);
    if (!found[0]) return null;
    const session = { userId: found[0].id, email: found[0].email };
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
    return session;
  },

  async resetPasswordViaBiometric(newPassword: string): Promise<boolean> {
    if (newPassword.length < 4) return false;
    const found = await db.select().from(users).orderBy(asc(users.id)).limit(1);
    if (!found[0]) return false;
    let salt = await SecureStore.getItemAsync(SALT_KEY);
    if (!salt) {
      salt = generateSalt();
      await SecureStore.setItemAsync(SALT_KEY, salt);
    }
    const hash = await hashPassword(newPassword, salt);
    await db.update(users).set({ passwordHash: hash }).where(eq(users.id, found[0].id));
    const session = { userId: found[0].id, email: found[0].email };
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
    return true;
  },
};
