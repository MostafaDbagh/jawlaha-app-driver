// Earnings + delivery history. Driver keeps the delivery fee per completed order.
import React, { useCallback } from 'react';
import { View, FlatList, RefreshControl, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

import { AppColors, w, h, r, sp } from '@/theme';
import { t, rowDirection } from '@/i18n';
import { BaseText, OrderCard } from '@/components';
import { formatPrice } from '@/lib/currency';
import { useDriverStore } from '@/features/driver/driverStore';
import { DriverStats } from '@/types/order';

function StatCard({ icon, label, value, accent }: { icon: any; label: string; value: string; accent: string }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: accent + '22' }]}>
        <Ionicons name={icon} size={sp(18)} color={accent} />
      </View>
      <View style={{ height: h(8) }} />
      <BaseText title={value} size={sp(16)} fontWeight="700" color={AppColors.textColorTheme} numberOfLines={1} />
      <BaseText title={label} size={sp(11)} color={AppColors.hintColor} />
    </View>
  );
}

function Header({ stats }: { stats: DriverStats | null }) {
  const cur = stats?.currency ?? 'SYP';
  void cur;
  return (
    <View style={{ marginBottom: h(8) }}>
      <View style={[styles.statsRow, { flexDirection: rowDirection() }]}>
        <StatCard icon="cash-outline" label={t('todays_earnings')} value={formatPrice(stats?.today_earnings ?? 0)} accent={AppColors.green} />
        <View style={{ width: w(12) }} />
        <StatCard icon="wallet-outline" label={t('total_earnings')} value={formatPrice(stats?.total_earnings ?? 0)} accent={AppColors.primaryColorTheme} />
      </View>
      <View style={{ height: h(12) }} />
      <View style={[styles.statsRow, { flexDirection: rowDirection() }]}>
        <StatCard icon="bicycle-outline" label={t('todays_deliveries')} value={String(stats?.today_deliveries ?? 0)} accent={AppColors.blue} />
        <View style={{ width: w(12) }} />
        <StatCard icon="checkmark-done-outline" label={t('total_deliveries')} value={String(stats?.total_deliveries ?? 0)} accent={AppColors.orange} />
      </View>
      <View style={{ height: h(8) }} />
      <View style={[styles.note, { flexDirection: rowDirection() }]}>
        <Ionicons name="information-circle-outline" size={sp(15)} color={AppColors.hintColor} />
        <BaseText title={` ${t('earnings_note')}`} size={sp(11)} color={AppColors.hintColor} style={{ flex: 1 }} />
      </View>
      <View style={{ height: h(16) }} />
      <BaseText title={t('delivery_history')} size={sp(15)} fontWeight="600" color={AppColors.textColorTheme} />
    </View>
  );
}

export default function EarningsScreen() {
  const history = useDriverStore((s) => s.history);
  const stats = useDriverStore((s) => s.stats);
  const loading = useDriverStore((s) => s.loadingHistory);
  const loadHistory = useDriverStore((s) => s.loadHistory);
  const loadStats = useDriverStore((s) => s.loadStats);

  const refresh = useCallback(() => {
    loadStats();
    loadHistory();
  }, [loadStats, loadHistory]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <BaseText title={t('earnings')} size={sp(20)} fontWeight="700" color={AppColors.textColorTheme} />
      </View>
      <FlatList
        data={history}
        keyExtractor={(o) => o.order_id}
        renderItem={({ item }) => <OrderCard order={item} showStatus />}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={<Header stats={stats} />}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={AppColors.primaryColorTheme} style={{ marginTop: h(20) }} />
          ) : (
            <View style={styles.empty}>
              <BaseText title={t('no_history')} size={sp(13)} color={AppColors.hintColor} textAlign="center" />
            </View>
          )
        }
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={AppColors.primaryColorTheme} />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.backgroundColor },
  header: { paddingHorizontal: w(16), paddingTop: h(8), paddingBottom: h(4) },
  listContent: { paddingHorizontal: w(16), paddingBottom: h(24), flexGrow: 1 },
  statsRow: { },
  statCard: {
    flex: 1,
    backgroundColor: AppColors.white,
    borderRadius: r(14),
    padding: w(14),
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
  },
  statIcon: { width: r(34), height: r(34), borderRadius: r(10), alignItems: 'center', justifyContent: 'center' },
  note: { alignItems: 'flex-start', paddingHorizontal: w(2) },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: h(30) },
});
