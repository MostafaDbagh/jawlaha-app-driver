// Splash / launch router. Validates any stored session, then routes the driver
// to the tabs (if signed in as a DRIVER) or to the login screen.
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { AppColors, h, r, sp } from '@/theme';
import { BaseText } from '@/components';
import { t } from '@/i18n';
import { useAuthStore } from '@/store/authStore';
import { useAuthControllerStore } from '@/features/auth/authStore';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        await useAuthControllerStore.getState().initSettings();
        const { isLoggedIn, user } = useAuthStore.getState();
        const isDriver = (user?.accountType ?? '').toUpperCase() === 'DRIVER';
        if (isLoggedIn && isDriver) {
          router.replace('/(tabs)');
          return;
        }
        // Logged in but not a driver account → drop the session, send to login.
        if (isLoggedIn && !isDriver) {
          await useAuthStore.getState().logout();
        }
        router.replace('/login');
      } catch {
        router.replace('/login');
      }
    })();
  }, [router]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <View style={styles.logo}>
          <Ionicons name="bicycle" size={sp(54)} color={AppColors.white} />
        </View>
        <View style={{ height: h(16) }} />
        <BaseText title={t('driver_app_name')} size={sp(22)} color={AppColors.primaryColorTheme} fontWeight="700" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.backgroundColor },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logo: {
    width: r(96),
    height: r(96),
    borderRadius: r(28),
    backgroundColor: AppColors.primaryColorTheme,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
