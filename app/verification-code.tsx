// OTP verification. Verifies the code, then gates entry to DRIVER accounts only.
import React, { useEffect, useRef, useState } from 'react';
import { View, ScrollView, StyleSheet, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { AppColors, w, h, TextStyles } from '@/theme';
import { QuicksandFamily } from '@/theme/typography';
import { Responsive } from '@/theme/responsive';
import { t } from '@/i18n';
import { BaseText, TextButton, LoadingButton, AppBar } from '@/components';
import { showSnack } from '@/lib/snack';
import { useNavArgs } from '@/store/navArgs';
import { useAuthStore } from '@/store/authStore';
import { useAuthControllerStore } from '@/features/auth/authStore';

const PIN_LENGTH = 6;

export default function VerificationCodeScreen() {
  const router = useRouter();

  const navArguments = useNavArgs((s) => s.args);
  const phone: string = (navArguments?.phone as string) ?? '';

  const isLoading = useAuthControllerStore((s) => s.isLoading);
  const lastDevOtp = useAuthControllerStore((s) => s.lastDevOtp);

  const inputRefs = useRef<Array<TextInput | null>>([]);
  const [digits, setDigits] = useState<string[]>(Array(PIN_LENGTH).fill(''));

  // Dev convenience: prefill the OTP returned by the backend (no real SMS).
  useEffect(() => {
    if (lastDevOtp && lastDevOtp.length === PIN_LENGTH) setDigits(lastDevOtp.split(''));
  }, [lastDevOtp]);

  const handleChange = (text: string, index: number) => {
    const value = text.replace(/[^0-9]/g, '').slice(-1);
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    if (value && index < PIN_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !digits[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const onConfirm = async () => {
    const code = digits.join('');
    if (code.length !== PIN_LENGTH) {
      showSnack(t('plz_enter_valid_phone_number'), 'error');
      return;
    }
    const ok = await useAuthControllerStore.getState().verifyOtpLogin(phone, code);
    if (!ok) return;

    // Gate: only DRIVER accounts may use this app.
    const user = useAuthStore.getState().user;
    const isDriver = (user?.accountType ?? '').toUpperCase() === 'DRIVER';
    if (!isDriver) {
      showSnack(t('not_a_driver_account'), 'error');
      await useAuthStore.getState().logout();
      router.replace('/login');
      return;
    }
    router.replace('/(tabs)');
  };

  const onResend = async () => {
    const ok = await useAuthControllerStore.getState().requestOtpLogin(phone);
    if (ok) showSnack(t('resend_code'), 'success');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <AppBar title={t('verification_code')} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={[styles.container, Responsive.getResponsivePadding()]}>
          <BaseText
            title={t('verify_phone_dsc')}
            style={[TextStyles.bodyMedium, { color: AppColors.darkGray }]}
            textAlign="center"
          />
          {!!phone && (
            <>
              <View style={{ height: h(6) }} />
              <BaseText
                title={phone}
                style={[TextStyles.headlineMedium, { color: AppColors.primaryColorTheme }]}
                textAlign="center"
              />
            </>
          )}

          <View style={{ height: Responsive.gapLarge }} />

          <View style={styles.pinRow}>
            {digits.map((d, i) => (
              <TextInput
                key={i}
                ref={(el) => {
                  inputRefs.current[i] = el;
                }}
                value={d}
                onChangeText={(text) => handleChange(text, i)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                keyboardType="number-pad"
                maxLength={1}
                style={styles.pinField}
              />
            ))}
          </View>

          {__DEV__ && (
            <>
              <View style={{ height: h(10) }} />
              <BaseText
                title={t('dev_use_code').replace('@code', '000000')}
                style={[TextStyles.bodySmall, { color: AppColors.greyTextColorV3 }]}
                textAlign="center"
              />
            </>
          )}

          <View style={{ height: Responsive.gapLarge }} />

          <LoadingButton loading={isLoading} onPress={onConfirm}>
            <BaseText title={t('confirm')} style={[TextStyles.headlineMedium, { color: AppColors.white }]} />
          </LoadingButton>

          <View style={{ height: Responsive.gapLarge }} />

          <Pressable onPress={onResend}>
            <View style={styles.resendRow}>
              <TextButton
                title={t('resend_code')}
                textStyle={[TextStyles.bodyMedium, { color: AppColors.lightBlue }]}
              />
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.backgroundColor },
  scroll: { flexGrow: 1, justifyContent: 'center' },
  container: { alignItems: 'center', justifyContent: 'center', paddingVertical: h(24) },
  pinRow: { flexDirection: 'row', justifyContent: 'center', gap: w(10) },
  pinField: {
    width: w(46),
    height: w(54),
    borderWidth: 1,
    borderColor: AppColors.darkGray,
    borderRadius: 10,
    backgroundColor: AppColors.white,
    textAlign: 'center',
    fontSize: 22,
    fontFamily: QuicksandFamily.medium,
    color: AppColors.textColorTheme,
  },
  resendRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: w(6) },
});
