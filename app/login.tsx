// Driver sign-in — phone entry. Requests an OTP, then routes to the code screen.
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { AppColors, w, h, r, sp, TextStyles } from '@/theme';
import { Responsive } from '@/theme/responsive';
import { t, useI18n } from '@/i18n';
import { BaseText, LoadingButton, AppTextField } from '@/components';
import { Validator } from '@/lib/validators';
import { navArgs } from '@/store/navArgs';
import { useAuthControllerStore } from '@/features/auth/authStore';

export default function LoginScreen() {
  const router = useRouter();
  const { isRTL } = useI18n();

  // Dev convenience: prefill the seeded demo driver's number (national part, no
  // leading 0) so the OTP flow can be exercised in one tap. [[jawlaha-driver-app]]
  const [phoneNumber, setPhoneNumber] = useState(__DEV__ ? '955555555' : '');
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const isLoading = useAuthControllerStore((s) => s.isLoading);
  const countryCode = useAuthControllerStore((s) => s.countryCode);

  async function onContinue() {
    const phoneErr = Validator.phoneNumberValid(phoneNumber);
    setPhoneError(phoneErr);
    if (phoneErr) return;

    // The backend stores Syrian numbers in the leading-0 form ('0XXXXXXXXX') and
    // matches on the last 10 digits, so the international string must keep the 0:
    // +963 + 0XXXXXXXXX. The validator yields the 9-digit national part (no leading
    // 0), so re-insert it here. (Syria-only app — the dial code is always +963.)
    const national = phoneNumber.trim().replace(/^0+/, '');
    const fullPhone = `+${countryCode.phoneCode}0${national}`;
    const ok = await useAuthControllerStore.getState().requestOtpLogin(fullPhone);
    if (ok) {
      navArgs.set({ phone: fullPhone });
      router.push('/verification-code');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, Responsive.getResponsivePadding()]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logo}>
          <Ionicons name="bicycle" size={sp(40)} color={AppColors.white} />
        </View>
        <View style={{ height: h(20) }} />
        <BaseText title={t('welcome_driver')} style={TextStyles.titleLarge} textAlign="center" />
        <View style={{ height: h(8) }} />
        <BaseText
          title={t('login_phone_dsc')}
          style={[TextStyles.bodyMedium, { color: AppColors.greyTextColorV3 }]}
          textAlign="center"
        />
        <View style={{ height: h(36) }} />

        <View style={{ alignSelf: 'stretch' }}>
          <AppTextField
            label={`${t('phone_number')} *`}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            borderStyleType="outlineInput"
            keyboardType="phone-pad"
            hintText="9xxxxxxxx"
            validator={(value) => Validator.phoneNumberValid(value)}
            errorText={phoneError}
            prefixIcon={
              <View
                style={[
                  styles.dialCode,
                  isRTL
                    ? { borderRightWidth: 0, borderLeftWidth: 1, borderLeftColor: AppColors.dividerColor }
                    : null,
                ]}
              >
                <BaseText title={`+${countryCode.phoneCode}`} style={TextStyles.bodyMedium} />
              </View>
            }
          />
        </View>

        <View style={{ height: h(24) }} />
        <View style={{ alignSelf: 'stretch' }}>
          <LoadingButton loading={isLoading} onPress={onContinue}>
            <BaseText
              title={t('continue_label')}
              style={[TextStyles.headlineMedium, { color: AppColors.white }]}
            />
          </LoadingButton>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.backgroundColor },
  scroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: h(24) },
  logo: {
    width: r(80),
    height: r(80),
    borderRadius: r(24),
    backgroundColor: AppColors.primaryColorTheme,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialCode: {
    minWidth: w(64),
    paddingHorizontal: w(10),
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: AppColors.dividerColor,
  },
});
