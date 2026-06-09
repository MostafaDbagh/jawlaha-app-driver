// Drives the device side of FCM for the driver app:
//   1. once signed in, asks permission, fetches the FCM token, and registers it
//      with the backend (plus re-registers on token rotation);
//   2. shows foreground messages in the in-app snackbar and refreshes the job
//      boards so a new offer/assignment appears without manual pull-to-refresh;
//   3. routes notification taps (from background or a cold start) to the right
//      tab.
// Everything is a no-op when push isn't supported (Expo Go / web), so this hook
// is always safe to mount.
import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';

import { useAuthStore } from '@/store/authStore';
import { useDriverStore } from '@/features/driver/driverStore';
import { showSnack } from '@/lib/snack';
import { pushRepo } from '@/data/repository/push';
import { collectDeviceInfo } from '@/lib/push/deviceInfo';
import {
  isPushSupported,
  requestPushPermission,
  getFcmToken,
  onTokenRefresh,
  onForegroundMessage,
  onNotificationOpened,
  getInitialNotification,
} from '@/lib/push/messaging';

type Router = ReturnType<typeof useRouter>;

// A driver_offer notification is about claiming a new delivery (jobs tab);
// everything else (assigned / status) concerns the in-progress delivery.
function routeForData(router: Router, data: Record<string, any> | undefined) {
  const target = data?.kind === 'driver_offer' ? '/(tabs)' : '/(tabs)/active';
  router.navigate(target as any);
}

function refreshBoards() {
  const ds = useDriverStore.getState();
  ds.loadAvailable();
  ds.loadActive();
  ds.loadOffers();
}

export function usePushRegistration() {
  const router = useRouter();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const lastToken = useRef<string | null>(null);

  // (1) Register the token whenever there's an active session.
  useEffect(() => {
    if (!isLoggedIn || !isPushSupported()) return;
    let cancelled = false;

    (async () => {
      const granted = await requestPushPermission();
      if (cancelled || !granted) return;
      const token = await getFcmToken();
      if (cancelled || !token) return;
      lastToken.current = token;
      await pushRepo.saveFcmToken(token, collectDeviceInfo());
    })();

    const unsubscribe = onTokenRefresh(async (token) => {
      if (!token || token === lastToken.current) return;
      lastToken.current = token;
      await pushRepo.saveFcmToken(token, collectDeviceInfo());
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [isLoggedIn]);

  // (2) Foreground messages → snackbar + refresh.
  useEffect(() => {
    if (!isPushSupported()) return;
    return onForegroundMessage((msg) => {
      const n = msg?.notification;
      const text = [n?.title, n?.body].filter(Boolean).join(' — ');
      if (text) showSnack(text, 'info');
      refreshBoards();
    });
  }, []);

  // (3) Notification taps (background tap + cold-start) → navigate.
  useEffect(() => {
    if (!isPushSupported()) return;
    const unsubscribe = onNotificationOpened((msg) => {
      routeForData(router, msg?.data);
      refreshBoards();
    });
    (async () => {
      const initial = await getInitialNotification();
      if (initial) {
        routeForData(router, initial.data);
        refreshBoards();
      }
    })();
    return unsubscribe;
  }, [router]);
}
