// Currency formatting. Jawlah targets Syria, so prices are in Syrian Pounds (SYP).
// [[jawlaha-cash-on-delivery-only]]
import { t } from '@/i18n';

/** Localized currency label, e.g. "SYP" / "ل.س". */
export function currencyLabel(): string {
  return t('currency_syp');
}

/**
 * Format a numeric price with thousands separators + the SYP label.
 * e.g. formatPrice(15000) -> "15,000 SYP"
 */
export function formatPrice(value: number | string | null | undefined): string {
  const num = Number(value) || 0;
  const rounded = Math.round(num * 100) / 100;
  const formatted = rounded.toLocaleString('en-US', {
    maximumFractionDigits: 2,
  });
  return `${formatted} ${currencyLabel()}`;
}
