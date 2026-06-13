// Auth for the driver app. Drivers are provisioned by an admin and sign in
// with phone + password — no OTP / phone verification.
import { router } from 'expo-router';
import {
  apiClient,
  CustomResponse,
  API,
  setTokenRefresher,
  setSessionExpiredHandler,
  resetSessionExpired,
} from '@/lib/api';
import { AuthModel, parseAuthModel, ProfileModel, parseProfileModel } from '@/types/auth';
import { useAuthStore } from '@/store/authStore';
import { secureStorage } from '@/lib/storage';
import { showSnack } from '@/lib/snack';
import { t } from '@/i18n';

// `require` is provided by the Metro runtime; declare it for the TS compiler
// (used for a lazy, cycle-free driver-store reset on session expiry).
declare const require: (moduleName: string) => any;

// Persist both tokens + user from an auth response.
async function persistAuth(authModel: AuthModel): Promise<void> {
  useAuthStore.getState().setUser(authModel.user ?? null);
  await useAuthStore.getState().setToken(authModel.token as string);
  if (authModel.refreshToken) {
    await useAuthStore.getState().setRefreshToken(authModel.refreshToken);
  }
  // Fresh session — re-arm the "session expired" latch so a future 401 can
  // bounce to login again.
  resetSessionExpired();
}

// Sign in with phone + password. On success, persist the session + load the
// profile. (`password_hash` is the field the backend reads for the plaintext
// password — it bcrypt-compares it server-side.)
export async function login(phone: string, password: string): Promise<CustomResponse> {
  const data = await apiClient.postV2<AuthModel>({
    subUrl: 'auth/login',
    data: { phone, password_hash: password },
    needToken: false,
    fromJson: parseAuthModel,
  });
  if (data.success) {
    const authModel = data.object as AuthModel;
    if (authModel.token != null && authModel.token.length > 0) {
      await persistAuth(authModel);
      await getProfile();
    }
  }
  return data;
}

export async function getProfile(): Promise<CustomResponse> {
  const data = await apiClient.getV2<ProfileModel>({
    subUrl: 'auth/profile',
    needToken: true,
    fromJson: parseProfileModel,
  });
  if (data.success) {
    const profileModel = data.object as ProfileModel;
    if (profileModel.user != null) {
      useAuthStore.getState().setUser(profileModel.user);
    }
  }
  return data;
}

export async function updateProfile(data: Record<string, any>): Promise<CustomResponse> {
  return await apiClient.put({ subUrl: 'auth/profile', data, needToken: true });
}

export async function refreshToken(): Promise<CustomResponse> {
  const stored =
    useAuthStore.getState().refreshToken || (await secureStorage.getRefreshToken());
  const data = await apiClient.postV2<AuthModel>({
    subUrl: 'auth/refresh-token',
    needToken: false,
    data: { refreshToken: stored },
    fromJson: parseAuthModel,
  });
  if (data.success) {
    const authModel = data.object as AuthModel;
    if (authModel.token != null && authModel.token.length > 0) {
      await useAuthStore.getState().setToken(authModel.token);
      if (authModel.refreshToken) {
        await useAuthStore.getState().setRefreshToken(authModel.refreshToken);
      }
    }
  }
  return data;
}

export async function logout(): Promise<CustomResponse> {
  await apiClient.postV2({ subUrl: 'auth/logout', needToken: true });
  await useAuthStore.getState().logout();
  return new CustomResponse(200, null, 'Logged out successfully', true);
}

export async function healthCheck(): Promise<CustomResponse> {
  return await apiClient.getV2({ subUrl: 'health', url: API.baseUrl, needToken: false });
}

// Let the API client transparently refresh an expired access token on a 401.
setTokenRefresher(async () => {
  const hasRefresh =
    !!useAuthStore.getState().refreshToken || !!(await secureStorage.getRefreshToken());
  if (!hasRefresh) return false;
  const res = await refreshToken();
  return res.success && !!useAuthStore.getState().token;
});

// When a 401 can't be recovered (no refresh token / refresh itself failed), the
// session is dead — clear it and bounce to login so the driver isn't stranded on
// a logged-in-looking app that only returns empty data. Fired at most once per
// session (the client latches it); re-armed on the next successful login.
setSessionExpiredHandler(() => {
  // Only act on a live-looking session; ignore stray 401s after logout.
  if (!useAuthStore.getState().isLoggedIn) return;
  showSnack(t('session_expired'), 'error');
  useAuthStore.getState().logout();
  // Reset the driver feature state via a lazy require to avoid an import cycle
  // (driverStore → repository → this module).
  try {
    require('@/features/driver/driverStore').useDriverStore.getState().reset();
  } catch {
    /* store not loaded yet — nothing to reset */
  }
  router.replace('/login');
});

export const authRepo = {
  login,
  getProfile,
  updateProfile,
  refreshToken,
  logout,
  healthCheck,
};
