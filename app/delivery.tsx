// Delivery detail — pickup, dropoff, items, totals, and the contextual action
// (accept → mark picked up → mark delivered) for a single order.
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';

import { AppColors, w, h, r, sp } from '@/theme';
import { t, rowDirection } from '@/i18n';
import { AppBar, BaseText, LoadingButton, AppImage } from '@/components';
import { goBack } from '@/lib/nav';
import { showSnack } from '@/lib/snack';
import { formatPrice } from '@/lib/currency';
import { statusLabel, statusColor, shortOrderId } from '@/lib/orderUi';
import { useNavArgs } from '@/store/navArgs';
import { useAuthStore } from '@/store/authStore';
import { useDriverStore } from '@/features/driver/driverStore';
import { DriverOrder, OrderItem } from '@/types/order';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <BaseText title={title} size={sp(12)} color={AppColors.hintColor} fontWeight="600" />
      <View style={{ height: h(6) }} />
      {children}
    </View>
  );
}

function MoneyRow({ label, value, bold, accent }: { label: string; value: string; bold?: boolean; accent?: string }) {
  return (
    <View style={[styles.moneyRow, { flexDirection: rowDirection() }]}>
      <BaseText title={label} size={sp(13)} color={AppColors.textColor3} fontWeight={bold ? '700' : '400'} />
      <BaseText title={value} size={sp(13)} color={accent ?? AppColors.textColorTheme} fontWeight={bold ? '700' : '500'} />
    </View>
  );
}

export default function DeliveryScreen() {
  const router = useRouter();
  const navArguments = useNavArgs((s) => s.args);
  const myId = useAuthStore((s) => s.user?.userId);
  const busyOrderId = useDriverStore((s) => s.busyOrderId);
  const accept = useDriverStore((s) => s.accept);
  const advance = useDriverStore((s) => s.advance);
  const loadAvailable = useDriverStore((s) => s.loadAvailable);
  const loadActive = useDriverStore((s) => s.loadActive);
  const loadOffers = useDriverStore((s) => s.loadOffers);

  const [order, setOrder] = useState<DriverOrder | null>((navArguments?.order as DriverOrder) ?? null);
  // Latch so the "gone" reconciliation bounces back exactly once (focus fires on
  // every return to this screen, and our own navigation re-triggers it).
  const goneRef = useRef(false);

  // The orderId is stable for the life of this screen; capture it for effects.
  const orderId = order?.order_id ?? null;
  const claimedByMe = !!order?.driver_user_id && order?.driver_user_id === myId;

  // On focus, re-sync the lists and reconcile this order against the fresh data.
  // A claimed order that has vanished from the active list was cancelled or
  // reassigned server-side (see backend contract) — surface it and route back
  // instead of stranding the driver on a dead order with a live action button.
  useFocusEffect(
    useCallback(() => {
      if (!orderId) return;
      let cancelled = false;
      (async () => {
        await Promise.all([loadAvailable(), loadActive(), loadOffers()]);
        if (cancelled || goneRef.current) return;
        const st = useDriverStore.getState();
        const fresh =
          st.active.find((o) => o.order_id === orderId) ??
          st.available.find((o) => o.order_id === orderId);
        if (fresh) {
          setOrder(fresh); // reflect the latest status
        } else if (claimedByMe) {
          // Was mine, now gone from active → cancelled / reassigned.
          goneRef.current = true;
          showSnack(t('order_was_cancelled'), 'error');
          goBack(router, '/(tabs)/active');
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [orderId, claimedByMe, loadAvailable, loadActive, loadOffers, router]),
  );

  const action = useMemo(() => {
    if (!order) return null;
    const isMine = !!order.driver_user_id && order.driver_user_id === myId;
    if (order.status === 'ready' && !order.driver_user_id) return 'accept' as const;
    if (order.status === 'ready' && isMine) return 'pickup' as const;
    if (order.status === 'on_the_way' && isMine) return 'deliver' as const;
    return null;
  }, [order, myId]);

  if (!order) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <AppBar title={t('order_number')} onBack={() => goBack(router, '/(tabs)')} />
        <View style={styles.centered}>
          <BaseText title={t('no_data')} size={sp(14)} color={AppColors.hintColor} />
        </View>
      </SafeAreaView>
    );
  }

  const busy = busyOrderId === order.order_id;
  const customerPhone = order.customer?.phone;
  const dropLat = order.delivery_lat;
  const dropLng = order.delivery_lng;
  const hasDropPin = dropLat != null && dropLng != null;

  // Open the customer's pin in the device's maps app for turn-by-turn directions.
  // Apple Maps on iOS, the geo: chooser on Android (any installed maps app), with
  // a Google Maps web URL fallback if no native handler is registered.
  const openNavigation = () => {
    if (!hasDropPin) return;
    const fallback = `https://www.google.com/maps/dir/?api=1&destination=${dropLat},${dropLng}`;
    const url =
      Platform.select({
        ios: `http://maps.apple.com/?daddr=${dropLat},${dropLng}&dirflg=d`,
        android: `geo:${dropLat},${dropLng}?q=${dropLat},${dropLng}`,
        default: fallback,
      }) ?? fallback;
    Linking.openURL(url).catch(() => Linking.openURL(fallback));
  };

  const onAction = async () => {
    if (action === 'accept') {
      const ok = await accept(order.order_id);
      if (ok) {
        setOrder({ ...order, driver_user_id: myId ?? null }); // now mine, still `ready`
      } else {
        // Claimed by someone else / no longer ready — the board was refreshed by
        // the store; bounce back to it rather than leave a dead Accept button.
        goneRef.current = true;
        router.replace('/(tabs)');
      }
    } else if (action === 'pickup') {
      const ok = await advance(order.order_id, 'on_the_way');
      if (ok) setOrder({ ...order, status: 'on_the_way' });
      else {
        // Cancelled / reassigned out from under us — resync and go back.
        goneRef.current = true;
        await loadActive();
        goBack(router, '/(tabs)/active');
      }
    } else if (action === 'deliver') {
      const ok = await advance(order.order_id, 'delivered');
      // Either way we're leaving — latch so a focus re-fire on the way out
      // doesn't mistake the now-completed/gone order for a cancellation.
      goneRef.current = true;
      if (ok) goBack(router, '/(tabs)');
      else {
        await loadActive();
        goBack(router, '/(tabs)/active');
      }
    }
  };

  const actionLabel =
    action === 'accept' ? t('accept_order') : action === 'pickup' ? t('mark_picked_up') : t('mark_delivered');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <AppBar title={`${t('order_number')} ${shortOrderId(order.order_id)}`} onBack={() => goBack(router, '/(tabs)')} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status */}
        <View style={[styles.statusPill, { backgroundColor: statusColor(order.status) + '22', alignSelf: 'flex-start' }]}>
          <BaseText title={statusLabel(order.status)} size={sp(12)} fontWeight="700" color={statusColor(order.status)} />
        </View>

        {/* Cancellation reason (only when cancelled) */}
        {order.status === 'cancelled' && !!order.cancel_reason && (
          <BaseText
            title={`${t('cancel_reason')}: ${order.cancel_reason}`}
            size={sp(12)}
            color={AppColors.red}
            style={{ marginBottom: h(8) }}
          />
        )}

        {/* Pickup */}
        <Section title={t('pickup_from')}>
          <View style={[styles.locCard, { flexDirection: rowDirection() }]}>
            <Ionicons name="storefront" size={sp(20)} color={AppColors.primaryColorTheme} />
            <View style={{ flex: 1, marginHorizontal: w(10) }}>
              <BaseText title={order.pickup?.name || order.vendor_name || '—'} size={sp(14)} fontWeight="600" color={AppColors.textColorTheme} />
              {!!order.pickup?.address && (
                <BaseText title={order.pickup.address} size={sp(12)} color={AppColors.hintColor} numberOfLines={2} />
              )}
            </View>
          </View>
        </Section>

        {/* Dropoff */}
        <Section title={t('deliver_to')}>
          <View style={[styles.locCard, { flexDirection: rowDirection() }]}>
            <Ionicons name="location" size={sp(20)} color={AppColors.secondMainColor} />
            <View style={{ flex: 1, marginHorizontal: w(10) }}>
              <BaseText title={order.delivery_address || '—'} size={sp(14)} fontWeight="600" color={AppColors.textColorTheme} numberOfLines={3} />
              {!!order.delivery_note && (
                <BaseText title={`${t('delivery_note')}: ${order.delivery_note}`} size={sp(12)} color={AppColors.hintColor} numberOfLines={2} />
              )}
            </View>
          </View>
          {hasDropPin && (
            <Pressable onPress={openNavigation} style={[styles.navBtn, { flexDirection: rowDirection() }]}>
              <Ionicons name="navigate" size={sp(16)} color={AppColors.primaryColorTheme} />
              <BaseText title={` ${t('navigate')}`} size={sp(13)} fontWeight="700" color={AppColors.primaryColorTheme} />
            </Pressable>
          )}
          {!!customerPhone && (
            <Pressable onPress={() => Linking.openURL(`tel:${customerPhone}`)} style={[styles.callBtn, { flexDirection: rowDirection() }]}>
              <Ionicons name="call" size={sp(16)} color={AppColors.white} />
              <BaseText title={` ${t('call_customer')}`} size={sp(13)} fontWeight="700" color={AppColors.white} />
            </Pressable>
          )}
        </Section>

        {/* Items */}
        <Section title={`${order.items?.length ?? 0} ${t('order_total')}`}>
          <View style={styles.itemsCard}>
            {(order.items ?? []).map((it: OrderItem, idx: number) => (
              <View key={idx} style={[styles.itemRow, { flexDirection: rowDirection() }, idx > 0 ? styles.itemDivider : null]}>
                {it.image ? (
                  <AppImage source={it.image} style={{ width: r(40), height: r(40), borderRadius: r(8) }} contentFit="cover" />
                ) : (
                  <View style={[styles.itemPlaceholder]}>
                    <Ionicons name="fast-food-outline" size={sp(18)} color={AppColors.semiGrey} />
                  </View>
                )}
                <BaseText title={it.name} size={sp(13)} color={AppColors.textColorTheme} style={{ flex: 1, marginHorizontal: w(10) }} numberOfLines={2} />
                <BaseText title={`x${it.qty}`} size={sp(13)} color={AppColors.textColor3} fontWeight="600" />
              </View>
            ))}
          </View>
        </Section>

        {/* Totals */}
        <Section title={t('order_total')}>
          <View style={styles.itemsCard}>
            <MoneyRow label={t('subtotal')} value={formatPrice(order.subtotal)} />
            <MoneyRow label={t('delivery_fee')} value={formatPrice(order.delivery_fee)} />
            <View style={styles.itemDivider} />
            <MoneyRow label={t('your_earning')} value={formatPrice(order.delivery_fee)} bold accent={AppColors.green} />
          </View>
        </Section>

        <View style={{ height: h(12) }} />
      </ScrollView>

      {/* Contextual action */}
      {action && (
        <View style={styles.actionBar}>
          <LoadingButton loading={busy} onPress={onAction}>
            <BaseText title={actionLabel} size={sp(16)} fontWeight="700" color={AppColors.white} />
          </LoadingButton>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.backgroundColor },
  content: { padding: w(16), paddingBottom: h(24) },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  statusPill: { paddingHorizontal: w(12), paddingVertical: h(5), borderRadius: r(20), marginBottom: h(8) },
  section: { marginTop: h(14) },
  locCard: {
    alignItems: 'center',
    backgroundColor: AppColors.white,
    borderRadius: r(12),
    padding: w(12),
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  callBtn: {
    marginTop: h(10),
    backgroundColor: AppColors.primaryColorTheme,
    borderRadius: r(10),
    paddingVertical: h(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtn: {
    marginTop: h(10),
    backgroundColor: AppColors.white,
    borderWidth: 1.5,
    borderColor: AppColors.primaryColorTheme,
    borderRadius: r(10),
    paddingVertical: h(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemsCard: {
    backgroundColor: AppColors.white,
    borderRadius: r(12),
    padding: w(12),
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  itemRow: { alignItems: 'center', paddingVertical: h(8) },
  itemDivider: { borderTopWidth: 1, borderTopColor: AppColors.dividerColor },
  itemPlaceholder: {
    width: r(40),
    height: r(40),
    borderRadius: r(8),
    backgroundColor: AppColors.lightGrey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moneyRow: { justifyContent: 'space-between', paddingVertical: h(5), alignItems: 'center' },
  actionBar: {
    padding: w(16),
    paddingTop: h(10),
    backgroundColor: AppColors.white,
    borderTopWidth: 1,
    borderTopColor: AppColors.dividerColor,
  },
});
