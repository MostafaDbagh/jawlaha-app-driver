// Prominent, time-boxed card for an EXCLUSIVE delivery offer (dispatch routes a
// ready order to one driver at a time). Shows pickup/dropoff, earnings, a live
// countdown, and Accept / Decline actions. When the countdown hits zero it calls
// onExpire so the parent can drop it and resync (the backend cascades the order
// to the next driver / open board).
import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppColors, w, h, r, sp } from '@/theme';
import { t, rowDirection } from '@/i18n';
import { formatPrice } from '@/lib/currency';
import { DriverOffer, itemCount } from '@/types/order';
import { BaseText } from './BaseText';
import { LoadingButton } from './LoadingButton';

interface OfferCardProps {
  offer: DriverOffer;
  onAccept: () => void;
  onDecline: () => void;
  onExpire: () => void;
  accepting?: boolean;
  declining?: boolean;
  /** True while the other action is in flight (disables both buttons). */
  disabled?: boolean;
}

function InfoRow({ icon, color, label, value }: { icon: any; color: string; label: string; value?: string | null }) {
  return (
    <View style={[styles.infoRow, { flexDirection: rowDirection() }]}>
      <Ionicons name={icon} size={sp(16)} color={color} style={{ marginTop: h(2) }} />
      <View style={{ flex: 1, marginHorizontal: w(8) }}>
        <BaseText title={label} size={sp(11)} color={AppColors.hintColor} />
        <BaseText title={value || '—'} size={sp(13)} color={AppColors.textColorTheme} fontWeight="600" numberOfLines={2} />
      </View>
    </View>
  );
}

export function OfferCard({
  offer,
  onAccept,
  onDecline,
  onExpire,
  accepting = false,
  declining = false,
  disabled = false,
}: OfferCardProps) {
  // Local countdown that re-syncs to the server value on every re-poll.
  const [secs, setSecs] = useState(Math.max(0, Math.round(offer.seconds_remaining)));
  const expired = useRef(false);

  useEffect(() => {
    expired.current = false;
    setSecs(Math.max(0, Math.round(offer.seconds_remaining)));
  }, [offer.offer_id, offer.seconds_remaining]);

  useEffect(() => {
    const id = setInterval(() => {
      setSecs((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          if (!expired.current) {
            expired.current = true;
            onExpire();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [offer.offer_id, onExpire]);

  const count = itemCount(offer);
  const countLabel = count === 1 ? t('one_item') : t('items_count', { count });
  const urgent = secs <= 15;
  const countColor = urgent ? AppColors.red : AppColors.primaryColorTheme;
  const busy = accepting || declining || disabled;

  return (
    <View style={styles.card}>
      <View style={[styles.headerRow, { flexDirection: rowDirection() }]}>
        <View style={[styles.titleWrap, { flexDirection: rowDirection() }]}>
          <Ionicons name="flash" size={sp(18)} color={AppColors.primaryColorTheme} />
          <View style={{ width: w(6) }} />
          <BaseText title={t('new_offer')} size={sp(15)} fontWeight="700" color={AppColors.primaryColorTheme} />
        </View>
        <View style={[styles.timer, { borderColor: countColor }]}>
          <Ionicons name="time-outline" size={sp(14)} color={countColor} />
          <BaseText title={` ${secs}${t('seconds_unit')}`} size={sp(13)} fontWeight="700" color={countColor} />
        </View>
      </View>

      <BaseText title={t('offer_respond_hint')} size={sp(11)} color={AppColors.hintColor} />

      <View style={{ height: h(10) }} />
      <InfoRow icon="storefront" color={AppColors.primaryColorTheme} label={t('pickup_from')} value={offer.pickup?.name || offer.vendor_name} />
      <View style={styles.connector} />
      <InfoRow icon="location" color={AppColors.secondMainColor} label={t('deliver_to')} value={offer.delivery_address} />

      <View style={styles.divider} />
      <View style={[styles.metaRow, { flexDirection: rowDirection() }]}>
        <View style={[styles.metaItem, { flexDirection: rowDirection() }]}>
          <Ionicons name="cube-outline" size={sp(15)} color={AppColors.hintColor} />
          <BaseText title={` ${countLabel}`} size={sp(12)} color={AppColors.textColor3} />
        </View>
        <View style={[styles.metaItem, { flexDirection: rowDirection() }]}>
          <Ionicons name="cash-outline" size={sp(15)} color={AppColors.green} />
          <BaseText title={` ${formatPrice(offer.total)}`} size={sp(13)} fontWeight="700" color={AppColors.textColorTheme} />
        </View>
      </View>

      <View style={[styles.actions, { flexDirection: rowDirection() }]}>
        <LoadingButton
          onPress={busy ? undefined : onDecline}
          loading={false}
          color={AppColors.gray}
          height={h(46)}
          style={{ flex: 1, opacity: disabled || accepting ? 0.6 : 1 }}
        >
          {declining ? (
            <ActivityIndicator color={AppColors.textColorTheme} />
          ) : (
            <BaseText title={t('decline')} size={sp(15)} fontWeight="700" color={AppColors.textColorTheme} />
          )}
        </LoadingButton>
        <View style={{ width: w(12) }} />
        <LoadingButton
          onPress={busy ? undefined : onAccept}
          loading={accepting}
          color={AppColors.green}
          height={h(46)}
          style={{ flex: 1, opacity: disabled || declining ? 0.6 : 1 }}
        >
          <BaseText title={t('accept')} size={sp(15)} fontWeight="700" color={AppColors.white} />
        </LoadingButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.white,
    borderRadius: r(16),
    padding: w(16),
    marginBottom: h(12),
    borderWidth: 1.5,
    borderColor: AppColors.primaryColorTheme,
    shadowColor: AppColors.shadowColor,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  headerRow: { alignItems: 'center', justifyContent: 'space-between', marginBottom: h(2) },
  titleWrap: { alignItems: 'center' },
  timer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: r(20),
    paddingHorizontal: w(10),
    paddingVertical: h(3),
  },
  infoRow: { alignItems: 'flex-start' },
  connector: { width: 1, height: h(10), backgroundColor: AppColors.dividerColor, marginLeft: w(8), marginVertical: h(2) },
  divider: { height: 1, backgroundColor: AppColors.dividerColor, marginVertical: h(12) },
  metaRow: { alignItems: 'center', justifyContent: 'space-between' },
  metaItem: { alignItems: 'center' },
  actions: { alignItems: 'center', marginTop: h(14) },
});

export default OfferCard;
