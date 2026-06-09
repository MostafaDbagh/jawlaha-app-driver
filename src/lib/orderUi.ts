// Status → label + colour helpers for the driver order UI.
import { AppColors } from '@/theme';
import { t } from '@/i18n';
import { OrderStatus } from '@/types/order';

export function statusLabel(status: OrderStatus): string {
  switch (status) {
    case 'ready':
      return t('status_ready');
    case 'on_the_way':
      return t('status_on_the_way');
    case 'delivered':
      return t('status_delivered');
    case 'cancelled':
      return t('status_cancelled');
    default:
      return status;
  }
}

export function statusColor(status: OrderStatus): string {
  switch (status) {
    case 'ready':
      return AppColors.lightYellow;
    case 'on_the_way':
      return AppColors.blue;
    case 'delivered':
      return AppColors.green;
    case 'cancelled':
      return AppColors.red;
    default:
      return AppColors.hintColor;
  }
}

/** Short order reference, e.g. "#cd35bdb1". */
export function shortOrderId(orderId: string): string {
  return `#${(orderId ?? '').slice(0, 8)}`;
}
