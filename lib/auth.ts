import * as Crypto from 'expo-crypto';

export async function hashPassword(password: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}::${password}`);
}

export function generateSalt(): string {
  return Crypto.randomUUID();
}
