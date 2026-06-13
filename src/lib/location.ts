// Guarded wrapper around expo-location for the driver app.
//
// Live driver location feeds dispatch (nearest-driver routing). We only ever ask
// for FOREGROUND permission and read a single fix at a time (on going online +
// on a heartbeat while the Jobs/active screens are focused) — no background
// tracking. Everything degrades gracefully: a denied permission or a simulator
// without GPS resolves to `null` instead of throwing, so location never blocks
// the driver from going online.
import * as Location from 'expo-location';

export interface Coords {
  lat: number;
  lng: number;
}

/**
 * Ask for foreground location permission. Returns true if granted. Never throws
 * (a thrown permission call on an unsupported platform resolves to false).
 */
export async function requestLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/** Whether foreground location permission is already granted (no prompt). */
export async function hasLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/**
 * Read a single current fix, or null when permission is missing / GPS is
 * unavailable (e.g. a simulator with no location set). Balanced accuracy is
 * plenty for dispatch and keeps the radio cost low for a periodic heartbeat.
 */
export async function getCurrentCoords(): Promise<Coords | null> {
  try {
    if (!(await hasLocationPermission())) return null;
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const { latitude, longitude } = pos.coords;
    if (typeof latitude !== 'number' || typeof longitude !== 'number') return null;
    return { lat: latitude, lng: longitude };
  } catch {
    return null;
  }
}
