// Order shapes returned by the jawlahapp driver endpoints (/api/v1/driver/*).
// The backend speaks snake_case; screens read these fields directly.

export type OrderStatus =
  | 'pending'
  | 'preparing'
  | 'ready'
  | 'on_the_way'
  | 'delivered'
  | 'cancelled';

export interface OrderItem {
  product_id?: string | null;
  variation_id?: string | null;
  name: string;
  image?: string | null;
  unit_price: number;
  qty: number;
  options?: any;
}

/** Pickup branch attached to available/active orders by the backend. */
export interface Pickup {
  name: string;
  address: string;
  city?: string;
  lat?: number;
  lng?: number;
  image?: string | null;
}

/** Public driver snapshot stored on the order once claimed. */
export interface DriverSnapshot {
  name?: string;
  vehicle?: string;
  rating?: number;
  avatar?: string | null;
  phone?: string;
}

export interface DriverOrder {
  order_id: string;
  user_id?: string;
  branch_id?: string | null;
  vendor_name?: string | null;
  items: OrderItem[];
  subtotal: number;
  delivery_fee: number;
  discount?: number;
  total: number;
  currency: string;
  status: OrderStatus;
  delivery_address?: string | null;
  /** Precise drop-off pin from the customer app's map picker (if set). */
  delivery_lat?: number | null;
  delivery_lng?: number | null;
  delivery_note?: string | null;
  driver_user_id?: string | null;
  driver?: DriverSnapshot | null;
  pickup?: Pickup | null;
  /** Customer contact — attached to active (claimed) orders only. */
  customer?: { name?: string; phone?: string } | null;
  eta_minutes?: number | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * An exclusive delivery offer made to this driver (from /driver/offers/pending).
 * It's a DriverOrder plus the offer id and a server-computed countdown.
 */
export interface DriverOffer extends DriverOrder {
  offer_id: string;
  seconds_remaining: number;
}

export interface DriverStats {
  total_deliveries: number;
  total_earnings: number;
  today_deliveries: number;
  today_earnings: number;
  currency: string;
}

/** Count of real line items (sum of quantities). */
export function itemCount(order: DriverOrder): number {
  return (order.items ?? []).reduce((s, it) => s + (Number(it.qty) || 0), 0);
}
