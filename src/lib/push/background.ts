// Side-effect module: registers the FCM background/quit message handler as early
// as possible (imported from app/_layout.tsx). Notifications sent with a
// `notification` block are displayed by the OS automatically while the app is
// backgrounded, so this handler is mainly a hook for data-only messages and
// logging. It is a guarded no-op in Expo Go / on web.
import { setBackgroundHandler } from './messaging';

setBackgroundHandler(async (msg) => {
  // Keep this minimal and fast — the OS already shows notification payloads.
  if (__DEV__) console.log('[push] background message', msg?.messageId);
});
