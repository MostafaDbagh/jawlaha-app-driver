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

/** What kind of order this is — a normal restaurant order or a Jawlaha Box errand. */
export type OrderType = 'restaurant' | 'box';

/** A pickup place on a Box errand (a NON-restaurant shop / address). */
export interface BoxStop {
  place_name: string;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  note?: string | null;
}

export type BoxItemStatus = 'pending' | 'bought' | 'not_found';

/** A free-text thing the driver must buy/pick up, with the real price they paid. */
export interface BoxItem {
  description: string;
  qty: number;
  category?: string | null;
  note?: string | null;
  /** Index into box.stops this item is bought from (when set). */
  stop_index?: number | null;
  status: BoxItemStatus;
  /** The real price the driver paid; filled in while shopping. */
  actual_price?: number | null;
}

/** The Box sub-document carried on a `order_type === 'box'` order. */
export interface OrderBox {
  stops: BoxStop[];
  items: BoxItem[];
  /** Customer's max spend on purchases — the driver can't exceed it without approval. */
  budget_cap: number;
  /** Platform fee (server-computed); the driver keeps nothing of the purchases. */
  service_fee: number;
  /** Sum of actual_price across bought items (server-recomputed on save). */
  purchases_total: number;
  instructions?: string | null;
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
  /** Restaurant order (default) or a Jawlaha Box errand. */
  order_type?: OrderType;
  /** Errand details — present only on Box orders. */
  box?: OrderBox | null;
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
  /** Why the order was cancelled (set by merchant/admin); shown on history. */
  cancel_reason?: string | null;
  created_at?: string;
  updated_at?: string;
  /** When the order was delivered (drives earnings bucketing server-side). */
  delivered_at?: string | null;
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

/** True when this is a Jawlaha Box errand (free-text shopping, no restaurant). */
export function isBoxOrder(order: DriverOrder): boolean {
  return order.order_type === 'box';
}

/** Count of real line items (sum of quantities). Box errands count their box items. */
export function itemCount(order: DriverOrder): number {
  if (isBoxOrder(order)) {
    return (order.box?.items ?? []).reduce((s, it) => s + (Number(it.qty) || 0), 0);
  }
  return (order.items ?? []).reduce((s, it) => s + (Number(it.qty) || 0), 0);
}
