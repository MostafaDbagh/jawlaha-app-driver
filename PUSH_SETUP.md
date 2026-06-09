# Driver app — FCM push notifications setup

The driver app uses **@react-native-firebase/messaging** (true FCM tokens) and the
backend sends via **firebase-admin**. The JS side is already wired; what remains is
the Firebase project + a **dev build** (this CANNOT run in Expo Go).

## App identifiers (must match the Firebase apps you register)

- Android package: `com.mostafadbagh.jawlahdriver`
- iOS bundle ID:   `com.mostafadbagh.jawlahdriver`

(Change both in `app.json` if you prefer different IDs — keep them in sync with Firebase.)

## 1. Firebase project

1. Use the same Firebase project as the backend (or create one at
   https://console.firebase.google.com).
2. **Add an Android app** with package name `com.mostafadbagh.jawlahdriver`.
   Download **`google-services.json`** → place it at `jawlah_driver/google-services.json`.
3. *(iOS only)* **Add an iOS app** with bundle ID `com.mostafadbagh.jawlahdriver`.
   Download **`GoogleService-Info.plist`** → place it at
   `jawlah_driver/GoogleService-Info.plist`.
   Then in Firebase → Project settings → **Cloud Messaging**, upload your **APNs
   auth key** (.p8 from the Apple Developer portal). iOS push does not work without this.
4. The backend needs its **service-account key** (separate from the files above) —
   see `jawlahapp/.env.example` (`FIREBASE_SERVICE_ACCOUNT_PATH`).

> Both `google-services.json` and `GoogleService-Info.plist` are git-ignored
> (see `.gitignore`). Until they exist, `app.json` shows a harmless
> "file not found" warning and prebuild will refuse to run.

## 2. Build a dev client (required — not Expo Go)

```bash
cd jawlah_driver

# Local builds (need Android Studio / Xcode):
npx expo prebuild --clean
npx expo run:android      # or: npx expo run:ios

# …or with EAS (cloud build):
#   npx eas-cli build --profile development --platform android
```

After the first dev build is installed, `npx expo start --dev-client` runs JS as usual.

## 3. What happens at runtime

- On login, the app asks notification permission, gets the FCM token, and POSTs it
  to `POST /api/v1/users/fcm-token` (stored on `User.fcm_token`). Token rotation
  re-registers automatically.
- Foreground messages show in the in-app snackbar and refresh the job boards.
- Tapping a notification (background or cold start) opens the Jobs tab for a new
  delivery offer, or the Active tab for an assigned/status update.
- In Expo Go / web the native module is absent, so all of the above is a safe no-op
  and the app runs normally.

## Exclusive offers (implemented)

The dispatch engine routes each ready order to one driver at a time as a timed
**exclusive offer**. The Jobs tab now shows an `OfferCard` with a live countdown
and **Accept / Decline** buttons, backed by `/driver/offers/pending|accept|decline`:

- The screen polls `pending` every 10s while focused; a `driver_offer` push also
  refreshes it instantly.
- Accept → claims the order and jumps to the Active tab. Decline → the backend
  cascades it to the next driver. Countdown expiry drops it and resyncs (the
  order cascades / falls back to the open board automatically).
