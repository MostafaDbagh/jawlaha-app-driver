// Summary card for a driver order — used on the job board, active deliveries,
// and history lists. Shows pickup, dropoff, item count, total, and a status pill.
import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppColors, w, h, r, sp } from '@/theme';
import { t, rowDirection } from '@/i18n';
import { formatPrice } from '@/lib/currency';
import { statusLabel, statusColor, shortOrderId } from '@/lib/orderUi';
import { DriverOrder, itemCount } from '@/types/order';
import { BaseText } from './BaseText';

interface OrderCardProps {
  order: DriverOrder;
  onPress?: () => void;
  /** Optional footer (e.g. an action button) rendered inside the card. */
  footer?: React.ReactNode;
  showStatus?: boolean;
}

function LocationRow({ icon, color, label, value }: { icon: any; color: string; label: string; value?: string | null }) {
  return (
    <View style={[styles.locRow, { flexDirection: rowDirection() }]}>
      <Ionicons name={icon} size={sp(16)} color={color} style={{ marginTop: h(2) }} />
      <View style={{ flex: 1, marginHorizontal: w(8) }}>
        <BaseText title={label} size={sp(11)} color={AppColors.hintColor} />
        <BaseText title={value || '—'} size={sp(13)} color={AppColors.textColorTheme} fontWeight="500" numberOfLines={2} />
      </View>
    </View>
  );
}

export function OrderCard({ order, onPress, footer, showStatus = true }: OrderCardProps) {
  const count = itemCount(order);
  const countLabel = count === 1 ? t('one_item') : t('items_count', { count });

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && onPress ? { opacity: 0.9 } : null]}
    >
      <View style={[styles.headerRow, { flexDirection: rowDirection() }]}>
        <BaseText title={shortOrderId(order.order_id)} size={sp(13)} color={AppColors.hintColor} fontWeight="600" />
        {showStatus && (
          <View style={[styles.pill, { backgroundColor: statusColor(order.status) + '22' }]}>
            <BaseText title={statusLabel(order.status)} size={sp(11)} color={statusColor(order.status)} fontWeight="600" />
          </View>
        )}
      </View>

      <View style={{ height: h(10) }} />
      <LocationRow icon="storefront" color={AppColors.primaryColorTheme} label={t('pickup_from')} value={order.pickup?.name || order.vendor_name} />
      <View style={styles.connector} />
      <LocationRow icon="location" color={AppColors.secondMainColor} label={t('deliver_to')} value={order.delivery_address} />

      <View style={styles.divider} />
      <View style={[styles.footerRow, { flexDirection: rowDirection() }]}>
        <View style={[styles.metaItem, { flexDirection: rowDirection() }]}>
          <Ionicons name="cube-outline" size={sp(15)} color={AppColors.hintColor} />
          <BaseText title={` ${countLabel}`} size={sp(12)} color={AppColors.textColor3} />
        </View>
        <View style={[styles.metaItem, { flexDirection: rowDirection() }]}>
          <Ionicons name="cash-outline" size={sp(15)} color={AppColors.green} />
          <BaseText title={` ${formatPrice(order.total)}`} size={sp(13)} color={AppColors.textColorTheme} fontWeight="700" />
        </View>
      </View>

      {footer ? <View style={{ marginTop: h(12) }}>{footer}</View> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.white,
    borderRadius: r(14),
    padding: w(14),
    marginBottom: h(12),
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  headerRow: { alignItems: 'center', justifyContent: 'space-between' },
  pill: { paddingHorizontal: w(10), paddingVertical: h(4), borderRadius: r(20) },
  locRow: { alignItems: 'flex-start' },
  connector: {
    width: 1,
    height: h(10),
    backgroundColor: AppColors.dividerColor,
    marginLeft: w(8),
    marginVertical: h(2),
  },
  divider: { height: 1, backgroundColor: AppColors.dividerColor, marginVertical: h(12) },
  footerRow: { alignItems: 'center', justifyContent: 'space-between' },
  metaItem: { alignItems: 'center' },
});

export default OrderCard;
