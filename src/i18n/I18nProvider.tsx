import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { I18nManager } from 'react-native';
import { en } from './en';
import { ar } from './ar';
import { storage, StorageKeys } from '../lib/storage';

export type LangCode = 'en' | 'ar';

const TABLES: Record<LangCode, Record<string, string>> = { en, ar };

// Module-level mirror of the current language so a plain `t()` (no hook) works
// the same way GetX's `'key'.tr` works from anywhere.
let currentLang: LangCode = 'en';

export const getCurrentLang = (): LangCode => currentLang;
export const isRTL = (): boolean => currentLang === 'ar';

/**
 * flexDirection for a horizontal row that should read in the app's language
 * direction. This is a manual-RTL app: the native layout is pinned to LTR at
 * startup (see I18nProvider — allowRTL(false)/forceRTL(false)) so React Native
 * never auto-mirrors `row`. Direction is therefore driven purely from the app
 * language here: LTR rows render in source order, RTL rows reverse them.
 */
export function rowDirection(appRTL: boolean = currentLang === 'ar'): 'row' | 'row-reverse' {
  return appRTL ? 'row-reverse' : 'row';
}

/**
 * Translate a key. Mirrors GetX `'key'.tr`.
 * Falls back to the English table, then to the raw key (like GetX does).
 * Supports `@name` style params via the optional `params` map.
 */
export function t(key: string, params?: Record<string, string | number>): string {
  let value = TABLES[currentLang]?.[key] ?? en[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      value = value.replace(new RegExp(`@${k}`, 'g'), String(v));
    }
  }
  return value;
}

interface I18nContextValue {
  lang: LangCode;
  isRTL: boolean;
  t: (key: string, params?: Record<string, string | number>) => string;
  setLang: (lang: LangCode) => Promise<void>;
  ready: boolean;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<LangCode>('en');
  const [ready, setReady] = useState(false);

  // Initialise from storage / device on mount.
  useEffect(() => {
    (async () => {
      const stored = (await storage.getString(StorageKeys.APP_LANGUAGE)) as LangCode | null;
      const initial: LangCode = stored === 'ar' || stored === 'en' ? stored : 'en';
      currentLang = initial;
      setLangState(initial);
      // Manual RTL: direction is driven from the app language in JS (rowDirection
      // + per-component isRTL checks), so pin the native layout to LTR and never
      // let it auto-mirror `row`. Otherwise an Arabic device locale flips our
      // English rows. (forceRTL change may need a full app restart to take hold.)
      I18nManager.allowRTL(false);
      if (I18nManager.isRTL) I18nManager.forceRTL(false);
      setReady(true);
    })();
  }, []);

  const setLang = useCallback(async (next: LangCode) => {
    currentLang = next;
    setLangState(next);
    await storage.setString(StorageKeys.APP_LANGUAGE, next);
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      lang,
      isRTL: lang === 'ar',
      t: (key, params) => t(key, params),
      setLang,
      ready,
    }),
    [lang, setLang, ready],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

/** Convenience hook returning just the translate fn (re-renders on lang change). */
export function useT() {
  return useI18n().t;
}
