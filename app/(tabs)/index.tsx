// Jobs board — available orders a restaurant marked `ready`. Driver can go
// online/offline and accept jobs.
import React, { useCallback, useRef } from 'react';
import { View, FlatList, RefreshControl, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';

import { AppColors, w, h, r, sp } from '@/theme';
import { t, rowDirection } from '@/i18n';
import { BaseText, LoadingButton, OrderCard, OfferCard } from '@/components';
import { navArgs } from '@/store/navArgs';
import { useDriverStore } from '@/features/driver/driverStore';
import { DriverOrder } from '@/types/order';

// How often to poll for exclusive offers while the Jobs screen is focused.
// Push wakes the app instantly, but polling is the reliable fallback (and the
// only channel until a Firebase dev build is installed).
const OFFER_POLL_MS = 10000;

// How often to push a fresh GPS fix to dispatch while online + focused.
// Coarser than the offer poll — location only needs to be roughly current.
const LOCATION_HEARTBEAT_MS = 90000;

function OnlineToggle() {
  const isOnline = useDriverStore((s) => s.isOnline);
  const toggleOnline = useDriverStore((s) => s.toggleOnline);
  return (
    <Pressable onPress={toggleOnline} style={[styles.toggle, { flexDirection: rowDirection() }]}>
      <View style={[styles.dot, { backgroundColor: isOnline ? AppColors.green : AppColors.semiGrey }]} />
      <View style={{ flex: 1, marginHorizontal: w(10) }}>
        <BaseText title={isOnline ? t('online') : t('offline')} size={sp(15)} fontWeight="700" color={AppColors.textColorTheme} />
        <BaseText
          title={isOnline ? t('you_are_online') : t('you_are_offline')}
          size={sp(11)}
          color={AppColors.hintColor}
        />
      </View>
      <View style={[styles.switch, { backgroundColor: isOnline ? AppColors.green : AppColors.gray, alignItems: isOnline ? 'flex-end' : 'flex-start' }]}>
        <View style={styles.knob} />
      </View>
    </Pressable>
  );
}

export default function JobsScreen() {
  const router = useRouter();
  const available = useDriverStore((s) => s.available);
  const loading = useDriverStore((s) => s.loadingAvailable);
  const busyOrderId = useDriverStore((s) => s.busyOrderId);
  const loadAvailable = useDriverStore((s) => s.loadAvailable);
  const loadMe = useDriverStore((s) => s.loadMe);
  const accept = useDriverStore((s) => s.accept);
  const offers = useDriverStore((s) => s.offers);
  const offerBusyId = useDriverStore((s) => s.offerBusyId);
  const offerBusyAction = useDriverStore((s) => s.offerBusyAction);
  const loadOffers = useDriverStore((s) => s.loadOffers);
  const acceptOffer = useDriverStore((s) => s.acceptOffer);
  const declineOffer = useDriverStore((s) => s.declineOffer);
  const expireOffer = useDriverStore((s) => s.expireOffer);
  const sendLocationHeartbeat = useDriverStore((s) => s.sendLocationHeartbeat);

  // Poll for offers while focused; refresh the board + profile on focus.
  // Also beat the driver's location to dispatch on a slower cadence (the
  // heartbeat no-ops while offline / without a fix).
  useFocusEffect(
    useCallback(() => {
      loadMe();
      loadAvailable();
      loadOffers();
      sendLocationHeartbeat();
      const offerId = setInterval(loadOffers, OFFER_POLL_MS);
      const locId = setInterval(sendLocationHeartbeat, LOCATION_HEARTBEAT_MS);
      return () => {
        clearInterval(offerId);
        clearInterval(locId);
      };
    }, [loadMe, loadAvailable, loadOffers, sendLocationHeartbeat]),
  );

  const onAcceptOffer = useCallback(
    async (offerId: string) => {
      const ok = await acceptOffer(offerId);
      if (ok) router.navigate('/(tabs)/active' as any);
    },
    [acceptOffer, router],
  );

  const openDetail = (order: DriverOrder) => {
    navArgs.set({ order });
    router.push('/delivery');
  };

  const renderItem = ({ item }: { item: DriverOrder }) => (
    <OrderCard
      order={item}
      onPress={() => openDetail(item)}
      footer={
        <LoadingButton
          loading={busyOrderId === item.order_id}
          onPress={() => accept(item.order_id)}
          height={h(44)}
        >
          <BaseText title={t('accept_order')} size={sp(15)} fontWeight="700" color={AppColors.white} />
        </LoadingButton>
      }
    />
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <BaseText title={t('jobs')} size={sp(20)} fontWeight="700" color={AppColors.textColorTheme} />
      </View>
      <FlatList
        data={available}
        keyExtractor={(o) => o.order_id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={{ marginBottom: h(12) }}>
            <OnlineToggle />
            <View style={{ height: h(16) }} />
            {offers.map((offer) => (
              <OfferCard
                key={offer.offer_id}
                offer={offer}
                onAccept={() => onAcceptOffer(offer.offer_id)}
                onDecline={() => declineOffer(offer.offer_id)}
                onExpire={() => expireOffer(offer.offer_id)}
                accepting={offerBusyId === offer.offer_id && offerBusyAction === 'accept'}
                declining={offerBusyId === offer.offer_id && offerBusyAction === 'decline'}
                disabled={!!offerBusyId && offerBusyId !== offer.offer_id}
              />
            ))}
            <BaseText title={t('available_orders')} size={sp(15)} fontWeight="600" color={AppColors.textColorTheme} />
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={AppColors.primaryColorTheme} style={{ marginTop: h(40) }} />
          ) : (
            <View style={styles.empty}>
              <Ionicons name="cube-outline" size={sp(44)} color={AppColors.semiGrey} />
              <View style={{ height: h(10) }} />
              <BaseText title={t('no_available_orders')} size={sp(14)} color={AppColors.hintColor} textAlign="center" />
            </View>
          )
        }
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadAvailable} tintColor={AppColors.primaryColorTheme} />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.backgroundColor },
  header: { paddingHorizontal: w(16), paddingTop: h(8), paddingBottom: h(4) },
  listContent: { paddingHorizontal: w(16), paddingBottom: h(24), flexGrow: 1 },
  toggle: {
    alignItems: 'center',
    backgroundColor: AppColors.white,
    borderRadius: r(14),
    padding: w(14),
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  dot: { width: r(12), height: r(12), borderRadius: r(6) },
  switch: { width: w(44), height: h(26), borderRadius: r(20), padding: 3, justifyContent: 'center' },
  knob: { width: r(20), height: r(20), borderRadius: r(10), backgroundColor: AppColors.white },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: h(60) },
});
