import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// Mirrors Constant storage keys (core/constant.dart)
export const StorageKeys = {
  ACCESS_TOKEN: 'ACCESS_TOKEN',
  APP_LANGUAGE: 'APP_LANGUAGE',
  FIRST_OPEN: 'FIRST_OPEN',
  USER_ID: 'USER_ID',
  PAYMENT_CARD_ID: 'PAYMENT_CARD_ID',
  SAVED_ADDRESS_ID: 'SAVED_ADDRESS_ID',
  SAVED_ADDRESS_TITLE: 'SAVED_ADDRESS_TITLE',
  APP_THEME: 'APP_THEME',
  APP_NAME: 'app_name',
  APP_LOGO: 'app_logo',
} as const;

// Namespaced like GetStorage("MyPref")
const NS = 'MyPref:';
const k = (key: string) => NS + key;

// Generic typed AsyncStorage wrapper (mirrors GetStorage box read/write).
export const storage = {
  async getString(key: string): Promise<string | null> {
    return AsyncStorage.getItem(k(key));
  },
  async setString(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(k(key), value);
  },
  async getJSON<T>(key: string): Promise<T | null> {
    const raw = await AsyncStorage.getItem(k(key));
    if (raw == null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  async setJSON(key: string, value: unknown): Promise<void> {
    await AsyncStorage.setItem(k(key), JSON.stringify(value));
  },
  async getBool(key: string): Promise<boolean> {
    return (await AsyncStorage.getItem(k(key))) === 'true';
  },
  async setBool(key: string, value: boolean): Promise<void> {
    await AsyncStorage.setItem(k(key), value ? 'true' : 'false');
  },
  async getInt(key: string): Promise<number> {
    const raw = await AsyncStorage.getItem(k(key));
    const n = raw != null ? parseInt(raw, 10) : 0;
    return Number.isNaN(n) ? 0 : n;
  },
  async setInt(key: string, value: number): Promise<void> {
    await AsyncStorage.setItem(k(key), String(value));
  },
  async remove(key: string): Promise<void> {
    await AsyncStorage.removeItem(k(key));
  },
};

// Secure token storage (mirrors SecureStorageHelper).
const TOKEN_KEY = 'secure_access_token';
const REFRESH_TOKEN_KEY = 'secure_refresh_token';
// Saved sign-in credentials for silent auto-login. After the user registers /
// logs in once, these let the app transparently re-authenticate on every launch
// — even after the access + refresh tokens expire — so it never asks again.
const CREDENTIALS_KEY = 'secure_login_credentials';

export interface SavedCredentials {
  phone?: string;
  email?: string;
  password: string;
}

export const secureStorage = {
  async saveToken(token: string): Promise<void> {
    if (!token) {
      await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
      // keep mirror in AsyncStorage for sync-style getToken() backward compat
      await storage.setString(StorageKeys.ACCESS_TOKEN, '');
      return;
    }
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await storage.setString(StorageKeys.ACCESS_TOKEN, token);
  },
  async getToken(): Promise<string> {
    const secure = await SecureStore.getItemAsync(TOKEN_KEY).catch(() => null);
    if (secure) return secure;
    return (await storage.getString(StorageKeys.ACCESS_TOKEN)) ?? '';
  },
  async saveRefreshToken(token: string): Promise<void> {
    if (!token) {
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY).catch(() => {});
      return;
    }
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
  },
  async getRefreshToken(): Promise<string> {
    return (await SecureStore.getItemAsync(REFRESH_TOKEN_KEY).catch(() => null)) ?? '';
  },
  async clearToken(): Promise<void> {
    await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY).catch(() => {});
    await storage.setString(StorageKeys.ACCESS_TOKEN, '');
  },
  // Persist the credentials used for silent auto-login (stored in the OS
  // keychain/keystore via SecureStore). Saved on successful login/registration.
  async saveCredentials(creds: SavedCredentials): Promise<void> {
    await SecureStore.setItemAsync(CREDENTIALS_KEY, JSON.stringify(creds)).catch(() => {});
  },
  async getCredentials(): Promise<SavedCredentials | null> {
    const raw = await SecureStore.getItemAsync(CREDENTIALS_KEY).catch(() => null);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as SavedCredentials;
      return parsed?.password ? parsed : null;
    } catch {
      return null;
    }
  },
  async clearCredentials(): Promise<void> {
    await SecureStore.deleteItemAsync(CREDENTIALS_KEY).catch(() => {});
  },
  async clearAllData(): Promise<void> {
    await this.clearToken();
    // Drop saved credentials too, otherwise an explicit logout would be
    // immediately undone by the silent auto-login on next launch.
    await this.clearCredentials();
  },
};

// Convenience helpers mirroring GetStorageHelper named methods.
export const prefs = {
  saveToken: (token: string) => secureStorage.saveToken(token),
  getToken: () => secureStorage.getToken(),
  setAppLanguage: (v: string) => storage.setString(StorageKeys.APP_LANGUAGE, v),
  getAppLanguage: () => storage.getString(StorageKeys.APP_LANGUAGE),
  setIsFirstOpen: (v: boolean) => storage.setBool(StorageKeys.FIRST_OPEN, v),
  getIsFirstOpen: () => storage.getBool(StorageKeys.FIRST_OPEN),
  getPaymentCardId: () => storage.getInt(StorageKeys.PAYMENT_CARD_ID),
  savedPaymentCardId: (id: number) => storage.setInt(StorageKeys.PAYMENT_CARD_ID, id),
  getAddressId: () => storage.getInt(StorageKeys.SAVED_ADDRESS_ID),
  savedAddressId: (id: number) => storage.setInt(StorageKeys.SAVED_ADDRESS_ID, id),
  getAddressTitle: () => storage.getString(StorageKeys.SAVED_ADDRESS_TITLE),
  savedAddressTitle: (title: string) =>
    storage.setString(StorageKeys.SAVED_ADDRESS_TITLE, title),
  saveAppName: (appName: string) => storage.setString(StorageKeys.APP_NAME, appName),
  getAppName: () => storage.getString(StorageKeys.APP_NAME),
  saveAppLogo: (url: string) => storage.setString(StorageKeys.APP_LOGO, url),
  getAppLogo: () => storage.getString(StorageKeys.APP_LOGO),
};
