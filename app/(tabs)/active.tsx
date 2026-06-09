// Active deliveries — orders this driver has claimed and is delivering.
import React, { useCallback } from 'react';
import { View, FlatList, RefreshControl, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';

import { AppColors, w, h, sp } from '@/theme';
import { t } from '@/i18n';
import { BaseText, OrderCard } from '@/components';
import { navArgs } from '@/store/navArgs';
import { useDriverStore } from '@/features/driver/driverStore';
import { DriverOrder } from '@/types/order';

export default function ActiveScreen() {
  const router = useRouter();
  const active = useDriverStore((s) => s.active);
  const loading = useDriverStore((s) => s.loadingActive);
  const loadActive = useDriverStore((s) => s.loadActive);

  useFocusEffect(
    useCallback(() => {
      loadActive();
    }, [loadActive]),
  );

  const openDetail = (order: DriverOrder) => {
    navArgs.set({ order });
    router.push('/delivery');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <BaseText title={t('active_deliveries')} size={sp(20)} fontWeight="700" color={AppColors.textColorTheme} />
      </View>
      <FlatList
        data={active}
        keyExtractor={(o) => o.order_id}
        renderItem={({ item }) => <OrderCard order={item} onPress={() => openDetail(item)} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={AppColors.primaryColorTheme} style={{ marginTop: h(40) }} />
          ) : (
            <View style={styles.empty}>
              <Ionicons name="navigate-outline" size={sp(44)} color={AppColors.semiGrey} />
              <View style={{ height: h(10) }} />
              <BaseText title={t('no_active_deliveries')} size={sp(14)} color={AppColors.hintColor} textAlign="center" />
            </View>
          )
        }
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadActive} tintColor={AppColors.primaryColorTheme} />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.backgroundColor },
  header: { paddingHorizontal: w(16), paddingTop: h(8), paddingBottom: h(4) },
  listContent: { paddingHorizontal: w(16), paddingBottom: h(24), flexGrow: 1 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: h(60) },
});
