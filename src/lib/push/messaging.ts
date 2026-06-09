// Guarded wrapper around @react-native-firebase/messaging (modular API, v22+).
//
// React Native Firebase relies on native code, so it is NOT available in Expo
// Go or on web — only in a custom dev build / production build. Importing the
// package eagerly would crash those environments, so we lazily `require` it
// inside a try/catch (a LITERAL require so Metro can still bundle it) and treat
// push as unavailable when it can't load. Every export below is a safe no-op in
// that case, which lets the rest of the app keep running unchanged.
import { PermissionsAndroid, Platform } from 'react-native';

// `require` is provided by the Metro runtime; declare it for the TS compiler.
declare const require: (moduleName: string) => any;

let messagingModule: any = null;
let loadAttempted = false;

function loadMessaging(): any | null {
  if (loadAttempted) return messagingModule;
  loadAttempted = true;
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') return null;
  try {
    messagingModule = require('@react-native-firebase/messaging');
  } catch {
    messagingModule = null; // Expo Go / native module not linked yet.
  }
  return messagingModule;
}

/** True only in a build where the native Firebase messaging module is present. */
export function isPushSupported(): boolean {
  return !!loadMessaging();
}

// Android 13+ requires the POST_NOTIFICATIONS runtime permission explicitly.
async function ensureAndroidPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  if (typeof Platform.Version === 'number' && Platform.Version < 33) return true;
  try {
    const res = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    return res === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

/** Ask the OS for notification permission. Returns true if granted. */
export async function requestPushPermission(): Promise<boolean> {
  const mod = loadMessaging();
  if (!mod) return false;
  try {
    const messaging = mod.getMessaging();
    // iOS must register for remote messages before a token can be issued.
    if (Platform.OS === 'ios' && mod.registerDeviceForRemoteMessages) {
      await mod.registerDeviceForRemoteMessages(messaging);
    }
    const androidOk = await ensureAndroidPermission();
    const status = await mod.requestPermission(messaging);
    const AS = mod.AuthorizationStatus;
    const iosOk = status === AS.AUTHORIZED || status === AS.PROVISIONAL;
    return Platform.OS === 'android' ? androidOk : iosOk;
  } catch (e) {
    console.warn('[push] permission error', e);
    return false;
  }
}

/** Current FCM registration token, or null if unavailable. */
export async function getFcmToken(): Promise<string | null> {
  const mod = loadMessaging();
  if (!mod) return null;
  try {
    const token = await mod.getToken(mod.getMessaging());
    return token || null;
  } catch (e) {
    console.warn('[push] getToken error', e);
    return null;
  }
}

/** Subscribe to token rotation. Returns an unsubscribe function. */
export function onTokenRefresh(cb: (token: string) => void): () => void {
  const mod = loadMessaging();
  if (!mod) return () => {};
  try {
    return mod.onTokenRefresh(mod.getMessaging(), cb);
  } catch {
    return () => {};
  }
}

/** Foreground messages (the OS does NOT display these automatically). */
export function onForegroundMessage(cb: (msg: any) => void): () => void {
  const mod = loadMessaging();
  if (!mod) return () => {};
  try {
    return mod.onMessage(mod.getMessaging(), cb);
  } catch {
    return () => {};
  }
}

/** Notification tapped while the app was backgrounded. */
export function onNotificationOpened(cb: (msg: any) => void): () => void {
  const mod = loadMessaging();
  if (!mod) return () => {};
  try {
    return mod.onNotificationOpenedApp(mod.getMessaging(), cb);
  } catch {
    return () => {};
  }
}

/** Notification that cold-started the app from a fully-quit state. */
export async function getInitialNotification(): Promise<any | null> {
  const mod = loadMessaging();
  if (!mod) return null;
  try {
    return await mod.getInitialNotification(mod.getMessaging());
  } catch {
    return null;
  }
}

/** Register the background/quit data-message handler (call once, at startup). */
export function setBackgroundHandler(cb: (msg: any) => Promise<void>): void {
  const mod = loadMessaging();
  if (!mod) return;
  try {
    mod.setBackgroundMessageHandler(mod.getMessaging(), cb);
  } catch {
    /* no-op */
  }
}
