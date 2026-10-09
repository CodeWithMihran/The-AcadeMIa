# Mobile environment and native sign-in setup

## API addresses

Copy the appropriate example into an ignored local file:

- Android emulator: copy `.env.example` to `.env`.
- iOS Simulator: copy `.env.ios.example` to `.env.ios`.
- Release builds: copy `.env.production.example` to `.env.production` and set the real HTTPS API URL ending in `/api`.

The Android emulator uses `10.0.2.2`; the iOS Simulator uses `localhost`. A physical phone needs the development computer's LAN address. Never commit `.env`, `.env.ios`, or `.env.production`. The mobile client rejects invalid production schemes, an empty production URL, and known example hosts when making API requests.

`react-native-config` 1.7.2 autolinks with React Native 0.87. Android loads `.env` for debug and `.env.production` for release from the app module's `build.gradle`. iOS selects `.env.ios` for Debug and `.env.production` for Release through the Podfile. After changing native dependencies or the Podfile, run `cd app/ios; pod install` on macOS before building iOS.

Android debug builds explicitly allow local HTTP; Android release builds disallow cleartext traffic. Production APIs must use HTTPS.
Android release assembly is guarded and fails until `.env.production` contains a valid deployed HTTPS API URL. iOS release configuration reads the same file; the app's API client fails closed if it is blank or invalid, so do not archive until it is set.

## Google sign-in

The app uses the system browser for the existing Google OAuth provider (it does not embed the website login or ship a separate Google SDK). It returns through the `theacademia://auth/callback` deep link. The URL carries only a short-lived, single-use code protected by PKCE; the app exchanges it for its bearer token over the API and stores the token in secure storage. Cancelled or denied sign-in and invalid or expired exchanges return the user to sign-in with an error.

Configure these server variables:

- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` for the existing Passport Google OAuth client.
- `GOOGLE_MOBILE_CALLBACK_URL`, the absolute callback URL `/auth/google/mobile/callback` on the API host.

Add the mobile callback URL to the Google OAuth client's authorized redirect URIs. The existing `GOOGLE_CALLBACK_URL` for website sign-in remains configured separately. The mobile callback, server API host, and app deep-link scheme must match the deployed environment.

For local development, set `GOOGLE_MOBILE_CALLBACK_URL` to a callback route reachable by Google and the device/emulator. Use HTTPS outside local development. Restart the server after changing its OAuth environment values.

## File uploads

The app-native picker supports PDF, JPEG, and PNG files up to 8 MB on Android and iOS. The selected file is copied to temporary app storage on iOS before upload; the server independently checks MIME type, file signature, and size.
