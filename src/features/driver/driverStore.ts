// Driver feature store — orders job board, active deliveries, history, earnings,
// and the online/offline toggle. Talks to the driver repository.
import { create } from 'zustand';
import { driverRepo } from '@/data/repository';
import { DriverOrder, DriverOffer, DriverStats } from '@/types/order';
import { showSnack } from '@/lib/snack';
import { t } from '@/i18n';

function ordersOf(object: any): DriverOrder[] {
  return (object?.orders as DriverOrder[]) ?? [];
}

function offersOf(object: any): DriverOffer[] {
  return (object?.offers as DriverOffer[]) ?? [];
}

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
  loadAvailable: () => Promise<void>;
  loadActive: () => Promise<void>;
  loadHistory: () => Promise<void>;
  loadStats: () => Promise<void>;
  accept: (orderId: string) => Promise<boolean>;
  advance: (orderId: string, status: 'on_the_way' | 'delivered') => Promise<boolean>;
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
    const next = !get().isOnline;
    set({ isOnline: next }); // optimistic
    const res = await driverRepo.setAvailability(next);
    if (!res.success) {
      set({ isOnline: !next }); // revert
      showSnack(res.msg || t('no_data'), 'error');
    }
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
