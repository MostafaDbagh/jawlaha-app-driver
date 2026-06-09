// Driver auth controller — a trimmed port of the customer app's AuthController.
// Drivers authenticate with phone + OTP only.
import { create } from 'zustand';
import { repository } from '@/data/repository';
import { showSnack } from '@/lib/snack';
import { useAuthStore as useGlobalAuthStore } from '@/store/authStore';
import { secureStorage } from '@/lib/storage';

// Plain country shape (Jawlah targets Syria → +963 by default).
export interface Country {
  phoneCode: string;
  name: string;
  iso3Code: string;
  isoCode: string;
}

export function initCountry(num: string): Country {
  return { phoneCode: num, name: 'Syria', iso3Code: 'SYR', isoCode: 'SY' };
}

function showServerMessages(messages: string[]) {
  for (const m of messages) showSnack(m, 'error');
}

// Pull the dev OTP out of a token-less request-otp response envelope.
function extractDevOtp(object: unknown): string | null {
  const obj = object as { devOtp?: string; data?: { devOtp?: string } } | null;
  return obj?.data?.devOtp ?? obj?.devOtp ?? null;
}

interface AuthControllerState {
  countryCode: Country;
  isLoading: boolean;
  lastDevOtp: string | null;

  setCountryCode: (c: Country) => void;
  setIsLoading: (v: boolean) => void;

  requestOtpLogin: (phone: string) => Promise<boolean>;
  verifyOtpLogin: (phone: string, otp: string) => Promise<boolean>;
  getProfile: () => Promise<boolean>;
  initSettings: () => Promise<void>;
  updateProfile: (data: Record<string, any>) => Promise<boolean>;
  logout: () => Promise<void>;
}

export const useAuthControllerStore = create<AuthControllerState>((set, get) => ({
  countryCode: initCountry('963'),
  isLoading: false,
  lastDevOtp: null,

  setCountryCode: (c) => set({ countryCode: c }),
  setIsLoading: (v) => set({ isLoading: v }),

  async requestOtpLogin(phone) {
    try {
      set({ isLoading: true });
      const res = await repository.requestOtpLogin(phone);
      if (res.success) {
        set({ lastDevOtp: extractDevOtp(res.object) });
        return true;
      }
      showServerMessages([res.msg]);
    } catch (e) {
      showServerMessages([String(e)]);
    } finally {
      set({ isLoading: false });
    }
    return false;
  },

  async verifyOtpLogin(phone, otp) {
    try {
      set({ isLoading: true });
      const res = await repository.verifyOtpLogin(phone, otp);
      if (res.success) return true;
      showServerMessages([res.msg]);
    } catch (e) {
      showServerMessages([String(e)]);
    } finally {
      set({ isLoading: false });
    }
    return false;
  },

  async getProfile() {
    try {
      const res = await repository.getProfile();
      return res.success;
    } catch (e) {
      return false;
    }
  },

  // On launch: if a token is stored, validate it (self-heals an expired access
  // token via the refresh flow inside getProfile). No saved-credential fallback
  // since OTP login stores no password.
  async initSettings() {
    try {
      const token = await secureStorage.getToken();
      if (token && token.length > 0) {
        await useGlobalAuthStore.getState().setToken(token);
        await get().getProfile();
      }
    } catch (e) {
      // fall through — the splash router decides where to go.
    }
  },

  async updateProfile(data) {
    try {
      set({ isLoading: true });
      const res = await repository.updateProfile(data);
      if (res.success) {
        await get().getProfile();
        return true;
      }
      showServerMessages([res.msg]);
    } catch (e) {
      showServerMessages([String(e)]);
    } finally {
      set({ isLoading: false });
    }
    return false;
  },

  async logout() {
    try {
      set({ isLoading: true });
      await repository.logout();
    } catch (e) {
      await useGlobalAuthStore.getState().logout();
    } finally {
      set({ isLoading: false });
    }
  },
}));
