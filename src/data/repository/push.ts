// Push repository — registers this device's FCM token with jawlahapp.
// The backend stores it on User.fcm_token (POST /api/v1/users/fcm-token) and
// also records the optional device fields under metadata.last_push_device.
import { apiClient, CustomResponse } from '@/lib/api';

export interface PushDeviceInfo {
  device_type?: string;
  device_name?: string;
  device_model?: string;
  device_manufacturer?: string;
  platform_version?: string;
  app_version?: string;
  app_language?: string;
}

export async function saveFcmToken(
  token: string,
  device: PushDeviceInfo = {},
): Promise<CustomResponse> {
  return await apiClient.postV2({
    subUrl: 'users/fcm-token',
    needToken: true,
    data: { fcm_token: token, ...device },
  });
}

export const pushRepo = { saveFcmToken };
