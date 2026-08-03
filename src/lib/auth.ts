import { db } from './db';

const SESSION_KEY = 'jy_workstation_session';
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface Session {
  token: string;
  expiresAt: number;
}

export const AuthService = {
  async setup(passphrase: string): Promise<void> {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(32));

    const keyMaterial = await crypto.subtle.importKey(
      'raw', encoder.encode(passphrase), 'PBKDF2', false, ['deriveKey']
    );

    const derivedKey = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 600_000, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    const verifyData = encoder.encode('JY_WORKSTATION_VERIFY');
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      derivedKey,
      verifyData
    );

    await db.auth.put({
      id: 'master',
      salt: Array.from(salt),
      verifyIv: Array.from(iv),
      verifyCipher: Array.from(new Uint8Array(encrypted)),
    });

    AuthService.createSession();
  },

  async login(passphrase: string): Promise<boolean> {
    const auth = await db.auth.get('master');
    if (!auth) return false;

    const encoder = new TextEncoder();
    const salt = new Uint8Array(auth.salt);

    const keyMaterial = await crypto.subtle.importKey(
      'raw', encoder.encode(passphrase), 'PBKDF2', false, ['deriveKey']
    );

    const derivedKey = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 600_000, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    try {
      await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: new Uint8Array(auth.verifyIv) },
        derivedKey,
        new Uint8Array(auth.verifyCipher)
      );
      AuthService.createSession();
      return true;
    } catch {
      return false;
    }
  },

  isSessionValid(): boolean {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    try {
      const session: Session = JSON.parse(raw);
      return session.expiresAt > Date.now();
    } catch {
      return false;
    }
  },

  createSession(): void {
    const session: Session = {
      token: crypto.randomUUID(),
      expiresAt: Date.now() + SESSION_DURATION_MS,
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  },

  lock(): void {
    sessionStorage.removeItem(SESSION_KEY);
  },

  async isSetup(): Promise<boolean> {
    const count = await db.auth.count();
    return count > 0;
  },

  async changePassphrase(oldPassphrase: string, newPassphrase: string): Promise<boolean> {
    const valid = await AuthService.login(oldPassphrase);
    if (!valid) return false;
    // Delete old auth record and set up new one
    await db.auth.delete('master');
    await AuthService.setup(newPassphrase);
    return true;
  },
};
