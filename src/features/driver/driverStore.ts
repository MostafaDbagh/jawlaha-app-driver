// Driver feature store — orders job board, active deliveries, history, earnings,
// and the online/offline toggle. Talks to the driver repository.
import { Alert } from 'react-native';
import { create } from 'zustand';
import { driverRepo } from '@/data/repository';
import type { BoxPurchaseEntry } from '@/data/repository/driver';
import { DriverOrder, DriverOffer, DriverStats } from '@/types/order';
import { showSnack } from '@/lib/snack';
import { t } from '@/i18n';
import { requestLocationPermission, getCurrentCoords } from '@/lib/location';

function ordersOf(object: any): DriverOrder[] {
  return (object?.orders as DriverOrder[]) ?? [];
}

function offersOf(object: any): DriverOffer[] {
  return (object?.offers as DriverOffer[]) ?? [];
}

// availability returns `{ is_online }` (inside the envelope's `data`); pull the
// authoritative value out rather than trusting the optimistic toggle.
function onlineFromResponse(object: any, fallback: boolean): boolean {
  const v = object?.data?.is_online ?? object?.is_online;
  return typeof v === 'boolean' ? v : fallback;
}

// Native confirm dialog (mirrors the logout confirm in profile.tsx), promisified
// so the store can `await` the driver's decision before flipping availability.
function confirmAsync(title: string, message: string, confirmLabel: string): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: t('cancel'), style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}

/**
 * Outcome of saving Box purchases. `ok` carries the server-updated order (with
 * the recomputed total + box). `over_cap` means the purchases exceed the budget
 * cap — the screen should confirm with the driver and resend with approval. The
 * 409 payload's `data` (budget_cap + purchases_total) rides along for the prompt.
 */
type BoxPurchasesResult =
  | { kind: 'ok'; order: DriverOrder }
  | { kind: 'over_cap'; data?: any }
  | { kind: 'error' };

interface DriverState {
  isOnline: boolean;
  /** Raw /driver/me payload (vehicle, rating, is_online, …). */
  me: any | null;
  available: DriverOrder[];
  active: DriverOrder[];
  history: DriverOrder[];
  stats: DriverStats | null;
  offers: DriverOffer[]; // live exclusive offers addressed to this driver

  loadingAvailable: boolean;
  loadingActive: boolean;
  loadingHistory: boolean;
  busyOrderId: string | null; // order currently being accepted/advanced
  offerBusyId: string | null; // offer currently being accepted/declined
  offerBusyAction: 'accept' | 'decline' | null;

  loadMe: () => Promise<void>;
  toggleOnline: () => Promise<void>;
  /** Push a fresh GPS fix to dispatch while online (no-op when offline). */
  sendLocationHeartbeat: () => Promise<void>;
  loadAvailable: () => Promise<void>;
  loadActive: () => Promise<void>;
  loadHistory: () => Promise<void>;
  loadStats: () => Promise<void>;
  accept: (orderId: string) => Promise<boolean>;
  advance: (orderId: string, status: 'on_the_way' | 'delivered') => Promise<boolean>;
  /** Log a Box errand's purchased prices (and not-found flags); see BoxPurchasesResult. */
  submitBoxPurchases: (
    orderId: string,
    items: BoxPurchaseEntry[],
    overCapApproved?: boolean,
  ) => Promise<BoxPurchasesResult>;
  loadOffers: () => Promise<void>;
  acceptOffer: (offerId: string) => Promise<boolean>;
  declineOffer: (offerId: string) => Promise<boolean>;
  expireOffer: (offerId: string) => void;
  reset: () => void;
}

export const useDriverStore = create<DriverState>((set, get) => ({
  isOnline: false,
  me: null,
  available: [],
  active: [],
  history: [],
  stats: null,
  offers: [],
  loadingAvailable: false,
  loadingActive: false,
  loadingHistory: false,
  busyOrderId: null,
  offerBusyId: null,
  offerBusyAction: null,

  async loadMe() {
    const res = await driverRepo.getMe();
    if (res.success) set({ me: res.object, isOnline: !!(res.object as any)?.is_online });
  },

  async toggleOnline() {
    const wasOnline = get().isOnline;
    const next = !wasOnline;

    // Going offline while still holding deliveries strands those customers —
    // confirm first (the driver must still finish what they've claimed).
    if (!next && get().active.length > 0) {
      const ok = await confirmAsync(
        t('go_offline_with_active_title'),
        t('go_offline_with_active_msg'),
        t('go_offline'),
      );
      if (!ok) return;
    }

    // When going online, capture a location fix so dispatch can route nearby
    // orders. Permission denial is non-blocking — we still go online, just
    // without a pin, and nudge the driver to enable it.
    let coords = null;
    if (next) {
      const granted = await requestLocationPermission();
      if (granted) coords = await getCurrentCoords();
      else showSnack(t('location_permission_hint'), 'info');
    }

    set({ isOnline: next }); // optimistic
    const res = await driverRepo.setAvailability(next, coords);
    if (!res.success) {
      set({ isOnline: wasOnline }); // revert
      showSnack(res.msg || t('no_data'), 'error');
      return;
    }
    // Trust the server's authoritative flag over the optimistic value.
    set({ isOnline: onlineFromResponse(res.object, next) });
  },

  async sendLocationHeartbeat() {
    if (!get().isOnline) return;
    const coords = await getCurrentCoords();
    if (!coords) return; // no permission / no fix — skip this beat silently
    await driverRepo.setAvailability(true, coords);
  },

  async loadAvailable() {
    set({ loadingAvailable: true });
    try {
      const res = await driverRepo.getAvailableOrders();
      if (res.success) set({ available: ordersOf(res.object) });
    } finally {
      set({ loadingAvailable: false });
    }
  },

  async loadActive() {
    set({ loadingActive: true });
    try {
      const res = await driverRepo.getActiveOrders();
      if (res.success) set({ active: ordersOf(res.object) });
    } finally {
      set({ loadingActive: false });
    }
  },

  async loadHistory() {
    set({ loadingHistory: true });
    try {
      const res = await driverRepo.getHistory();
      if (res.success) set({ history: ordersOf(res.object) });
    } finally {
      set({ loadingHistory: false });
    }
  },

  async loadStats() {
    const res = await driverRepo.getStats();
    if (res.success) set({ stats: res.object as DriverStats });
  },

  async accept(orderId) {
    set({ busyOrderId: orderId });
    try {
      const res = await driverRepo.acceptOrder(orderId);
      if (res.success) {
        showSnack(t('order_accepted'), 'success');
        await Promise.all([get().loadAvailable(), get().loadActive()]);
        return true;
      }
      showSnack(res.msg || t('no_data'), 'error');
      // Someone else may have claimed it — refresh the board.
      await get().loadAvailable();
      return false;
    } finally {
      set({ busyOrderId: null });
    }
  },

  async advance(orderId, status) {
    set({ busyOrderId: orderId });
    try {
      const res = await driverRepo.updateStatus(orderId, status);
      if (res.success) {
        if (status === 'delivered') {
          showSnack(t('delivery_completed'), 'success');
          await Promise.all([get().loadActive(), get().loadHistory(), get().loadStats()]);
        } else {
          await get().loadActive();
        }
        return true;
      }
      showSnack(res.msg || t('no_data'), 'error');
      return false;
    } finally {
      set({ busyOrderId: null });
    }
  },

  async submitBoxPurchases(orderId, items, overCapApproved) {
    set({ busyOrderId: orderId });
    try {
      const res = await driverRepo.submitBoxPurchases(orderId, items, overCapApproved);
      if (res.success) {
        // The backend returns the updated order (recomputed total + box) in `data`.
        const order = (res.object?.data ?? res.object) as DriverOrder;
        // Reflect the new total/box on the active list too.
        await get().loadActive();
        return { kind: 'ok', order } as const;
      }
      // 409 = purchases exceed the budget cap and need customer approval. The
      // payload's `data` carries budget_cap + purchases_total for the prompt.
      if (res.statusCode === 409) {
        return { kind: 'over_cap', data: res.object?.data } as const;
      }
      showSnack(res.msg || t('no_data'), 'error');
      return { kind: 'error' } as const;
    } finally {
      set({ busyOrderId: null });
    }
  },

  async loadOffers() {
    const res = await driverRepo.getPendingOffers();
    if (res.success) set({ offers: offersOf(res.object) });
  },

  async acceptOffer(offerId) {
    set({ offerBusyId: offerId, offerBusyAction: 'accept' });
    try {
      const res = await driverRepo.acceptOffer(offerId);
      if (res.success) {
        showSnack(t('order_accepted'), 'success');
        set({ offers: get().offers.filter((o) => o.offer_id !== offerId) });
        await Promise.all([get().loadActive(), get().loadAvailable()]);
        return true;
      }
      // Expired or cascaded to another driver — drop it and resync.
      showSnack(res.msg || t('offer_no_longer_available'), 'error');
      await get().loadOffers();
      return false;
    } finally {
      set({ offerBusyId: null, offerBusyAction: null });
    }
  },

  async declineOffer(offerId) {
    set({ offerBusyId: offerId, offerBusyAction: 'decline' });
    // Drop it immediately so the UI feels responsive; the backend cascades it.
    set({ offers: get().offers.filter((o) => o.offer_id !== offerId) });
    try {
      const res = await driverRepo.declineOffer(offerId);
      if (res.success) showSnack(t('offer_declined'), 'info');
      else showSnack(res.msg || t('no_data'), 'error');
      return res.success;
    } finally {
      set({ offerBusyId: null, offerBusyAction: null });
    }
  },

  expireOffer(offerId) {
    set({ offers: get().offers.filter((o) => o.offer_id !== offerId) });
    // The order has cascaded or fallen back to the open board — resync both.
    get().loadOffers();
    get().loadAvailable();
  },

  reset() {
    set({
      available: [],
      active: [],
      history: [],
      stats: null,
      offers: [],
      busyOrderId: null,
      offerBusyId: null,
      offerBusyAction: null,
    });
  },
}));
