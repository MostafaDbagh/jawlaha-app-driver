// Driver repository — talks to the jawlahapp driver endpoints (/api/v1/driver/*).
// Every route requires a logged-in DRIVER account (Bearer token).
import { apiClient, CustomResponse } from '@/lib/api';

const identity = (x: any) => x;

// ----------------------------- Profile -----------------------------
export async function getMe(): Promise<CustomResponse> {
  return await apiClient.getV2({ subUrl: 'driver/me', needToken: true, fromJson: identity });
}

export async function setAvailability(isOnline: boolean): Promise<CustomResponse> {
  return await apiClient.patch({
    subUrl: 'driver/me/availability',
    data: { is_online: isOnline },
    needToken: true,
  });
}

export async function getStats(): Promise<CustomResponse> {
  return await apiClient.getV2({ subUrl: 'driver/me/stats', needToken: true, fromJson: identity });
}

// ----------------------------- Orders -----------------------------
export async function getAvailableOrders(): Promise<CustomResponse> {
  return await apiClient.getV2({
    subUrl: 'driver/orders/available',
    needToken: true,
    fromJson: identity,
  });
}

export async function getActiveOrders(): Promise<CustomResponse> {
  return await apiClient.getV2({
    subUrl: 'driver/orders/active',
    needToken: true,
    fromJson: identity,
  });
}

export async function getHistory(): Promise<CustomResponse> {
  return await apiClient.getV2({
    subUrl: 'driver/orders/history',
    needToken: true,
    fromJson: identity,
  });
}

export async function acceptOrder(orderId: string): Promise<CustomResponse> {
  return await apiClient.post({
    subUrl: `driver/orders/${orderId}/accept`,
    needToken: true,
  });
}

export async function updateStatus(
  orderId: string,
  status: 'on_the_way' | 'delivered',
): Promise<CustomResponse> {
  return await apiClient.patch({
    subUrl: `driver/orders/${orderId}/status`,
    data: { status },
    needToken: true,
  });
}

// ----------------------- Exclusive offers -----------------------
// The dispatch engine routes a ready order to one driver at a time via a timed
// exclusive offer; these endpoints fetch and resolve it.
export async function getPendingOffers(): Promise<CustomResponse> {
  return await apiClient.getV2({
    subUrl: 'driver/offers/pending',
    needToken: true,
    fromJson: identity,
  });
}

export async function acceptOffer(offerId: string): Promise<CustomResponse> {
  return await apiClient.post({
    subUrl: `driver/offers/${offerId}/accept`,
    needToken: true,
  });
}

export async function declineOffer(offerId: string): Promise<CustomResponse> {
  return await apiClient.post({
    subUrl: `driver/offers/${offerId}/decline`,
    needToken: true,
  });
}

export const driverRepo = {
  getMe,
  setAvailability,
  getStats,
  getAvailableOrders,
  getActiveOrders,
  getHistory,
  acceptOrder,
  updateStatus,
  getPendingOffers,
  acceptOffer,
  declineOffer,
};
