import { create } from 'zustand';
import { AuthService } from '../lib/auth';

interface AuthState {
  isLocked: boolean;
  isSetup: boolean;
  isLoading: boolean;
  error: string | null;

  checkAuth: () => Promise<void>;
  setup: (passphrase: string) => Promise<void>;
  login: (passphrase: string) => Promise<boolean>;
  lock: () => void;
  changePassphrase: (oldPw: string, newPw: string) => Promise<boolean>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLocked: true,
  isSetup: false,
  isLoading: true,
  error: null,

  checkAuth: async () => {
    set({ isLoading: true, error: null });
    try {
      const setup = await AuthService.isSetup();
      if (!setup) {
        set({ isSetup: false, isLocked: false, isLoading: false });
        return;
      }
      const valid = AuthService.isSessionValid();
      set({ isSetup: true, isLocked: !valid, isLoading: false });
    } catch (e) {
      set({ isLoading: false, error: 'Failed to check auth status' });
    }
  },

  setup: async (passphrase: string) => {
    if (passphrase.length < 8) {
      set({ error: 'Passphrase must be at least 8 characters' });
      return;
    }
    try {
      await AuthService.setup(passphrase);
      set({ isSetup: true, isLocked: false, error: null });
    } catch (e) {
      set({ error: 'Failed to set up passphrase' });
    }
  },

  login: async (passphrase: string) => {
    set({ error: null, isLoading: true });
    try {
      const success = await AuthService.login(passphrase);
      if (success) {
        set({ isLocked: false, isLoading: false, error: null });
        return true;
      } else {
        set({ isLoading: false, error: 'Incorrect passphrase' });
        return false;
      }
    } catch {
      set({ isLoading: false, error: 'Login failed' });
      return false;
    }
  },

  lock: () => {
    AuthService.lock();
    set({ isLocked: true });
  },

  changePassphrase: async (oldPw: string, newPw: string) => {
    const success = await AuthService.changePassphrase(oldPw, newPw);
    if (!success) {
      set({ error: 'Current passphrase is incorrect' });
    } else {
      set({ error: null });
    }
    return success;
  },

  clearError: () => set({ error: null }),
}));
