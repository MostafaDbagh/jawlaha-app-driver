// Mirrors Constant (core/constant.dart)
import Constants from 'expo-constants';
import { Platform } from 'react-native';

/** Local jawlahapp backend port (see jawlahapp/.env -> PORT). */
const BACKEND_PORT = 5000;

/** Derive the dev machine's LAN host from the Expo dev server (hostUri). */
function deriveHostFromExpo(): string | null {
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri || typeof hostUri !== 'string') return null;
  const host = hostUri.split('/')[0].split(':')[0];
  return host || null;
}

/**
 * Resolve the backend origin for local development.
 * Priority:
 *  1. EXPO_PUBLIC_API_URL (set in .env to force a host, no /api/v1 suffix).
 *  2. Derive the LAN IP from the Expo dev server (physical devices / simulators).
 *  3. Per-platform fallback (Android emulator -> 10.0.2.2, else localhost).
 * Always returned WITH a trailing slash (apiUrl appends `${apiVersion}/...`).
 */
function resolveBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return `${fromEnv.replace(/\/+$/, '')}/`;

  if (Platform.OS === 'web') return `http://localhost:${BACKEND_PORT}/`;

  const lanHost = deriveHostFromExpo();
  if (Platform.OS === 'android' && !lanHost) return `http://10.0.2.2:${BACKEND_PORT}/`;
  if (lanHost) return `http://${lanHost}:${BACKEND_PORT}/`;
  return `http://localhost:${BACKEND_PORT}/`;
}

const baseUrl = resolveBaseUrl();

export const API = {
  baseUrl,
  /** Media host (no trailing slash) for resolving relative image paths. */
  mediaUrl: baseUrl.replace(/\/+$/, ''),
  apiVersion: 'api/v1',
  userAgent: 'Mobile',
  googleMapsBase: 'https://maps.googleapis.com/maps/api/',
} as const;

export const apiUrl = (subUrl: string) =>
  `${API.baseUrl}${API.apiVersion}/${subUrl}`;

/** Resolve a possibly-relative media path against the media host. */
export const mediaUrl = (path?: string | null): string | undefined => {
  if (!path) return undefined;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API.mediaUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};

export const AppCurrency = 'SYP';
