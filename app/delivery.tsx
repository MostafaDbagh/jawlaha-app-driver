// Delivery detail — pickup, dropoff, items, totals, and the contextual action
// (accept → mark picked up → mark delivered) for a single order. Jawlaha Box
// errands render a shopping-checklist layout instead of the restaurant items.
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Linking, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';

import { AppColors, w, h, r, sp } from '@/theme';
import { t, rowDirection } from '@/i18n';
import { AppBar, BaseText, LoadingButton, AppImage, AppTextField } from '@/components';
import { goBack } from '@/lib/nav';
import { showSnack } from '@/lib/snack';
import { formatPrice } from '@/lib/currency';
import { statusLabel, statusColor, shortOrderId } from '@/lib/orderUi';
import { useNavArgs } from '@/store/navArgs';
import { useAuthStore } from '@/store/authStore';
import { useDriverStore } from '@/features/driver/driverStore';
import type { BoxPurchaseEntry } from '@/data/repository/driver';
import { DriverOrder, OrderItem, BoxItem, isBoxOrder } from '@/types/order';

/** Localized label for a Box item category code (falls back to the raw value). */
function categoryLabel(category?: string | null): string | null {
  if (!category) return null;
  const key = `box_cat_${category}`;
  const label = t(key);
  return label === key ? category : label;
}

/**
 * Open a destination pin in the device maps app (Apple Maps on iOS, the geo:
 * chooser on Android, Google Maps web fallback). Shared by the dropoff pin and
 * each Box pickup stop.
 */
function openMaps(lat: number, lng: number) {
  const fallback = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  const url =
    Platform.select({
      ios: `http://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`,
      android: `geo:${lat},${lng}?q=${lat},${lng}`,
      default: fallback,
    }) ?? fallback;
  Linking.openURL(url).catch(() => Linking.openURL(fallback));
}

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
  const submitBoxPurchases = useDriverStore((s) => s.submitBoxPurchases);
  const loadAvailable = useDriverStore((s) => s.loadAvailable);
  const loadActive = useDriverStore((s) => s.loadActive);
  const loadOffers = useDriverStore((s) => s.loadOffers);

  const [order, setOrder] = useState<DriverOrder | null>((navArguments?.order as DriverOrder) ?? null);
  // Latch so the "gone" reconciliation bounces back exactly once (focus fires on
  // every return to this screen, and our own navigation re-triggers it).
  const goneRef = useRef(false);

  // --- Jawlaha Box shopping state (keyed by item index) ---
  // Raw price text the driver types per item, and which items they flagged as
  // not-found. Seeded from the server's actual_price/status so re-opening an
  // order shows what was already logged.
  const isBox = !!order && isBoxOrder(order);
  const boxItems: BoxItem[] = order?.box?.items ?? [];
  const [priceInputs, setPriceInputs] = useState<Record<number, string>>(() => {
    const seed: Record<number, string> = {};
    boxItems.forEach((it, i) => {
      if (it.actual_price != null) seed[i] = String(it.actual_price);
    });
    return seed;
  });
  const [notFound, setNotFound] = useState<Record<number, boolean>>(() => {
    const seed: Record<number, boolean> = {};
    boxItems.forEach((it, i) => {
      if (it.status === 'not_found') seed[i] = true;
    });
    return seed;
  });

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
  const openNavigation = () => {
    if (hasDropPin) openMaps(dropLat as number, dropLng as number);
  };

  // --- Box: live purchases + cash-to-collect, recomputed from the inputs ---
  const box = order.box ?? null;
  const serviceFee = Number(box?.service_fee) || 0;
  const budgetCap = Number(box?.budget_cap) || 0;
  // Sum the typed prices of items NOT flagged not-found (live, before saving).
  const purchasesTotal = isBox
    ? boxItems.reduce((sum, _it, i) => {
        if (notFound[i]) return sum;
        const p = Number(priceInputs[i]);
        return sum + (Number.isFinite(p) && p > 0 ? p : 0);
      }, 0)
    : 0;
  const cashToCollect = purchasesTotal + serviceFee;
  const overBudget = isBox && budgetCap > 0 && purchasesTotal > budgetCap;
  // The shopping checklist is editable only while this is my live (undelivered) order.
  const canEditBox =
    isBox && claimedByMe && order.status !== 'delivered' && order.status !== 'cancelled';

  // Build the PATCH payload from the current inputs: a price entry per item with
  // a valid price, or a not-found flag. Items with neither are skipped.
  const buildPurchaseEntries = (): BoxPurchaseEntry[] => {
    const entries: BoxPurchaseEntry[] = [];
    boxItems.forEach((_it, i) => {
      if (notFound[i]) {
        entries.push({ index: i, status: 'not_found' });
        return;
      }
      const p = Number(priceInputs[i]);
      if (Number.isFinite(p) && p > 0) entries.push({ index: i, actual_price: p });
    });
    return entries;
  };

  const onSavePurchases = async (overCapApproved?: boolean) => {
    const entries = buildPurchaseEntries();
    if (entries.length === 0) {
      showSnack(t('box_no_prices_entered'), 'info');
      return;
    }
    const res = await submitBoxPurchases(order.order_id, entries, overCapApproved);
    if (res.kind === 'ok') {
      setOrder(res.order);
      showSnack(t('box_purchases_saved'), 'success');
    } else if (res.kind === 'over_cap') {
      // Backend rejected for exceeding the cap — confirm before re-sending with
      // approval (the driver should phone the customer to get the OK first).
      Alert.alert(t('box_over_cap_title'), t('box_over_cap_msg'), [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('box_over_cap_confirm'),
          style: 'destructive',
          onPress: () => onSavePurchases(true),
        },
      ]);
    }
    // 'error' already surfaced a snack in the store.
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

        {/* Jawlaha Box — title + customer instructions */}
        {isBox && (
          <View style={styles.boxHeaderCard}>
            <View style={[styles.boxHeaderRow, { flexDirection: rowDirection() }]}>
              <Ionicons name="cube" size={sp(20)} color={AppColors.secondMainColor} />
              <BaseText title={` ${t('box_order')}`} size={sp(16)} fontWeight="700" color={AppColors.secondMainColor} />
            </View>
            {!!box?.instructions && (
              <View style={{ marginTop: h(8) }}>
                <BaseText title={t('box_instructions')} size={sp(11)} color={AppColors.hintColor} fontWeight="600" />
                <BaseText title={box.instructions} size={sp(13)} color={AppColors.textColorTheme} style={{ marginTop: h(2) }} />
              </View>
            )}
          </View>
        )}

        {/* Pickup — restaurant branch (Box pickup is the stops list below) */}
        {!isBox && (
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
        )}

        {/* Box pickup stops */}
        {isBox && (box?.stops?.length ?? 0) > 0 && (
          <Section title={t('box_pickup_stops')}>
            {box!.stops.map((stop, i) => {
              const hasPin = stop.lat != null && stop.lng != null;
              return (
                <View key={i} style={[styles.stopCard, i > 0 ? { marginTop: h(8) } : null]}>
                  <View style={[styles.boxHeaderRow, { flexDirection: rowDirection() }]}>
                    <View style={styles.stopBadge}>
                      <BaseText title={`${i + 1}`} size={sp(12)} fontWeight="700" color={AppColors.white} />
                    </View>
                    <View style={{ flex: 1, marginHorizontal: w(10) }}>
                      <BaseText title={stop.place_name || `${t('box_stop')} ${i + 1}`} size={sp(14)} fontWeight="600" color={AppColors.textColorTheme} />
                      {!!stop.address && (
                        <BaseText title={stop.address} size={sp(12)} color={AppColors.hintColor} numberOfLines={2} />
                      )}
                      {!!stop.note && (
                        <BaseText title={`${t('box_item_note')}: ${stop.note}`} size={sp(11)} color={AppColors.hintColor} numberOfLines={2} />
                      )}
                    </View>
                  </View>
                  {hasPin && (
                    <Pressable onPress={() => openMaps(stop.lat as number, stop.lng as number)} style={[styles.navBtn, { flexDirection: rowDirection() }]}>
                      <Ionicons name="navigate" size={sp(16)} color={AppColors.primaryColorTheme} />
                      <BaseText title={` ${t('navigate')}`} size={sp(13)} fontWeight="700" color={AppColors.primaryColorTheme} />
                    </Pressable>
                  )}
                </View>
              );
            })}
          </Section>
        )}

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

        {/* Restaurant items */}
        {!isBox && (
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
        )}

        {/* Box shopping checklist — price entry + not-found toggle per item */}
        {isBox && (
          <Section title={t('box_shopping_list')}>
            <View style={styles.itemsCard}>
              {boxItems.map((it, i) => {
                const cat = categoryLabel(it.category);
                const stopName =
                  it.stop_index != null ? box?.stops?.[it.stop_index]?.place_name : null;
                const isNf = !!notFound[i];
                return (
                  <View key={i} style={[styles.boxItem, i > 0 ? styles.itemDivider : null]}>
                    <View style={[styles.boxItemHead, { flexDirection: rowDirection() }]}>
                      <BaseText
                        title={it.description}
                        size={sp(14)}
                        fontWeight="600"
                        color={isNf ? AppColors.hintColor : AppColors.textColorTheme}
                        style={{ flex: 1 }}
                        numberOfLines={2}
                      />
                      <BaseText title={`${t('box_item_qty')} ${it.qty}`} size={sp(12)} color={AppColors.textColor3} fontWeight="600" />
                    </View>
                    {(cat || stopName || it.note) && (
                      <BaseText
                        title={[
                          cat ? `${t('box_item_category')}: ${cat}` : null,
                          stopName ? `${t('box_item_from_stop')}: ${stopName}` : null,
                          it.note ? `${t('box_item_note')}: ${it.note}` : null,
                        ]
                          .filter(Boolean)
                          .join('  •  ')}
                        size={sp(11)}
                        color={AppColors.hintColor}
                        style={{ marginTop: h(2) }}
                      />
                    )}
                    <View style={[styles.boxItemControls, { flexDirection: rowDirection() }]}>
                      <View style={{ flex: 1 }}>
                        <AppTextField
                          value={priceInputs[i] ?? ''}
                          onChangeText={(v) =>
                            setPriceInputs((prev) => ({ ...prev, [i]: v.replace(/[^0-9.]/g, '') }))
                          }
                          hintText={t('box_price_hint')}
                          keyboardType="numeric"
                          borderStyleType="outlineInput"
                          enabled={canEditBox && !isNf}
                          containerStyle={{ opacity: isNf ? 0.5 : 1 }}
                        />
                      </View>
                      <Pressable
                        onPress={
                          canEditBox
                            ? () => setNotFound((prev) => ({ ...prev, [i]: !prev[i] }))
                            : undefined
                        }
                        style={[
                          styles.nfToggle,
                          { flexDirection: rowDirection() },
                          isNf ? styles.nfToggleOn : null,
                        ]}
                      >
                        <Ionicons
                          name={isNf ? 'close-circle' : 'close-circle-outline'}
                          size={sp(16)}
                          color={isNf ? AppColors.white : AppColors.red}
                        />
                        <BaseText
                          title={` ${t('box_not_found')}`}
                          size={sp(12)}
                          fontWeight="700"
                          color={isNf ? AppColors.white : AppColors.red}
                        />
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Save purchases */}
            {canEditBox && (
              <LoadingButton
                loading={busy}
                onPress={() => onSavePurchases()}
                height={h(46)}
                style={{ marginTop: h(12) }}
              >
                <BaseText title={t('box_save_purchases')} size={sp(15)} fontWeight="700" color={AppColors.white} />
              </LoadingButton>
            )}
          </Section>
        )}

        {/* Box totals + cash to collect */}
        {isBox && (
          <Section title={t('order_total')}>
            <View style={styles.itemsCard}>
              <MoneyRow
                label={t('box_purchases_total')}
                value={formatPrice(purchasesTotal)}
                accent={overBudget ? AppColors.red : undefined}
              />
              <MoneyRow
                label={t('box_budget_cap')}
                value={formatPrice(budgetCap)}
                accent={overBudget ? AppColors.red : AppColors.hintColor}
              />
              {overBudget && (
                <View style={[styles.overWarn, { flexDirection: rowDirection() }]}>
                  <Ionicons name="warning" size={sp(14)} color={AppColors.red} />
                  <BaseText title={` ${t('box_over_budget')}`} size={sp(12)} fontWeight="700" color={AppColors.red} />
                </View>
              )}
              <MoneyRow label={t('box_service_fee')} value={formatPrice(serviceFee)} />
            </View>

            {/* Cash to collect (COD) = purchases + service fee */}
            <View style={styles.cashCard}>
              <View style={[styles.boxHeaderRow, { flexDirection: rowDirection() }]}>
                <Ionicons name="cash" size={sp(20)} color={AppColors.white} />
                <View style={{ flex: 1, marginHorizontal: w(10) }}>
                  <BaseText title={t('box_cash_to_collect')} size={sp(12)} fontWeight="600" color={AppColors.white} />
                  <BaseText title={formatPrice(cashToCollect)} size={sp(20)} fontWeight="800" color={AppColors.white} />
                </View>
              </View>
              <BaseText title={t('box_cash_hint')} size={sp(11)} color={AppColors.white} style={{ marginTop: h(6), opacity: 0.9 }} />
            </View>
          </Section>
        )}

        {/* Restaurant totals */}
        {!isBox && (
          <Section title={t('order_total')}>
            <View style={styles.itemsCard}>
              <MoneyRow label={t('subtotal')} value={formatPrice(order.subtotal)} />
              <MoneyRow label={t('delivery_fee')} value={formatPrice(order.delivery_fee)} />
              <View style={styles.itemDivider} />
              <MoneyRow label={t('your_earning')} value={formatPrice(order.delivery_fee)} bold accent={AppColors.green} />
            </View>
          </Section>
        )}

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
  // --- Jawlaha Box ---
  boxHeaderCard: {
    backgroundColor: AppColors.white,
    borderRadius: r(12),
    padding: w(12),
    borderWidth: 1,
    borderColor: AppColors.secondMainColor + '55',
    marginBottom: h(4),
  },
  boxHeaderRow: { alignItems: 'center' },
  stopCard: {
    backgroundColor: AppColors.white,
    borderRadius: r(12),
    padding: w(12),
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  stopBadge: {
    width: r(24),
    height: r(24),
    borderRadius: r(12),
    backgroundColor: AppColors.primaryColorTheme,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxItem: { paddingVertical: h(10) },
  boxItemHead: { alignItems: 'center', justifyContent: 'space-between' },
  boxItemControls: { alignItems: 'center', marginTop: h(8), gap: w(8) },
  nfToggle: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: w(10),
    paddingVertical: h(10),
    borderRadius: r(10),
    borderWidth: 1.5,
    borderColor: AppColors.red,
    backgroundColor: AppColors.white,
  },
  nfToggleOn: { backgroundColor: AppColors.red },
  overWarn: { alignItems: 'center', paddingTop: h(2) },
  cashCard: {
    marginTop: h(10),
    backgroundColor: AppColors.green,
    borderRadius: r(12),
    padding: w(14),
  },
});
