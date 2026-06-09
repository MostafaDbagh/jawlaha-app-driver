// Driver account — identity, vehicle, online status, language, logout.
import React, { useCallback } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';

import { AppColors, w, h, r, sp } from '@/theme';
import { t, useI18n, rowDirection } from '@/i18n';
import { BaseText } from '@/components';
import { useAuthStore } from '@/store/authStore';
import { useAuthControllerStore } from '@/features/auth/authStore';
import { useDriverStore } from '@/features/driver/driverStore';

function Row({ icon, label, value, onPress, danger }: { icon: any; label: string; value?: string; onPress?: () => void; danger?: boolean }) {
  const color = danger ? AppColors.red : AppColors.textColorTheme;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, { flexDirection: rowDirection() }, pressed && onPress ? { opacity: 0.6 } : null]}>
      <Ionicons name={icon} size={sp(20)} color={danger ? AppColors.red : AppColors.primaryColorTheme} />
      <BaseText title={label} size={sp(14)} color={color} style={{ flex: 1, marginHorizontal: w(12) }} />
      {value ? <BaseText title={value} size={sp(13)} color={AppColors.hintColor} /> : null}
      {onPress && !value ? <Ionicons name="chevron-forward" size={sp(18)} color={AppColors.semiGrey} /> : null}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { lang, setLang } = useI18n();
  const user = useAuthStore((s) => s.user);
  const isOnline = useDriverStore((s) => s.isOnline);
  const me = useDriverStore((s) => s.me);
  const loadMe = useDriverStore((s) => s.loadMe);

  useFocusEffect(
    useCallback(() => {
      loadMe();
    }, [loadMe]),
  );

  const vehicle = me?.vehicle ?? 'Motorbike';
  const rating = typeof me?.rating === 'number' ? me.rating : 5;

  const onLogout = () => {
    Alert.alert(t('logout'), t('logout_confirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('logout'),
        style: 'destructive',
        onPress: async () => {
          await useAuthControllerStore.getState().logout();
          useDriverStore.getState().reset();
          router.replace('/login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Identity */}
        <View style={styles.identity}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={sp(34)} color={AppColors.white} />
          </View>
          <View style={{ height: h(10) }} />
          <BaseText title={user?.fullName ?? user?.username ?? '—'} size={sp(18)} fontWeight="700" color={AppColors.textColorTheme} />
          <BaseText
            title={user?.countryCode && user?.phoneNumber ? `${user.countryCode}${user.phoneNumber}` : ''}
            size={sp(13)}
            color={AppColors.hintColor}
          />
          <View style={{ height: h(8) }} />
          <View style={[styles.onlinePill, { backgroundColor: (isOnline ? AppColors.green : AppColors.semiGrey) + '22' }]}>
            <BaseText title={isOnline ? t('online') : t('offline')} size={sp(12)} fontWeight="600" color={isOnline ? AppColors.green : AppColors.fourthMainColor} />
          </View>
        </View>

        <View style={{ height: h(20) }} />

        <View style={styles.card}>
          <Row icon="bicycle-outline" label={t('vehicle')} value={vehicle} />
          <View style={styles.divider} />
          <Row icon="star-outline" label={t('rating')} value={`${rating}`} />
          <View style={styles.divider} />
          <Row
            icon="language-outline"
            label={t('language')}
            value={lang === 'ar' ? 'العربية' : 'English'}
            onPress={() => setLang(lang === 'ar' ? 'en' : 'ar')}
          />
        </View>

        <View style={{ height: h(16) }} />

        <View style={styles.card}>
          <Row icon="log-out-outline" label={t('logout')} onPress={onLogout} danger />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.backgroundColor },
  content: { padding: w(16), paddingBottom: h(32) },
  identity: { alignItems: 'center', paddingTop: h(12) },
  avatar: {
    width: r(72),
    height: r(72),
    borderRadius: r(36),
    backgroundColor: AppColors.primaryColorTheme,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlinePill: { paddingHorizontal: w(12), paddingVertical: h(4), borderRadius: r(20) },
  card: {
    backgroundColor: AppColors.white,
    borderRadius: r(14),
    borderWidth: 1,
    borderColor: AppColors.dividerColor,
    paddingHorizontal: w(14),
  },
  row: { alignItems: 'center', paddingVertical: h(14) },
  divider: { height: 1, backgroundColor: AppColors.dividerColor },
});
