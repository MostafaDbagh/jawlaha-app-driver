// Collect lightweight device metadata to send alongside the FCM token, so the
// backend can tell which device a token belongs to. All fields are optional —
// the backend ignores blanks — so this is safe on simulators/web where some
// values are null.
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { getCurrentLang } from '@/i18n';
import type { PushDeviceInfo } from '@/data/repository/push';

export function collectDeviceInfo(): PushDeviceInfo {
  return {
    device_type: Platform.OS,
    device_name: Device.deviceName ?? undefined,
    device_model: Device.modelName ?? undefined,
    device_manufacturer:
      Device.manufacturer ?? (Platform.OS === 'ios' ? 'Apple' : undefined),
    platform_version: Device.osVersion ?? String(Platform.Version),
    app_version: Constants.expoConfig?.version ?? undefined,
    app_language: getCurrentLang(),
  };
}
