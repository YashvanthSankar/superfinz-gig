# SuperFinz Expo migration

The Next.js app remains the web application and API backend at the repository root. The native Expo app lives in `apps/mobile`, while browser- and device-safe contracts and calculations live in `packages/shared`.

## Local setup

1. Install Node.js 22.13 or newer, then run `npm install` from the repository root.
2. Copy `.env.example` to `.env` and configure PostgreSQL, NextAuth, and Google OAuth. Set `MOBILE_JWT_SECRET` to a separate long random value.
3. Apply the additive session migration with `npx prisma migrate deploy`, then run `npx prisma generate`.
4. Start the API with `npm run dev`. A physical phone cannot use `localhost`; use a trusted HTTPS tunnel or the computer's LAN URL.
5. Copy `apps/mobile/.env.example` to `apps/mobile/.env` and set `EXPO_PUBLIC_API_URL` to that reachable backend URL. Never put a client secret in an `EXPO_PUBLIC_` variable.

## Google native sign-in

Native Google sign-in uses a development build and does not run in Expo Go.

1. In the same Google Cloud project as the web login, keep the Web OAuth client. Its client ID must be both `GOOGLE_CLIENT_ID` on the backend and `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` in the mobile app; the backend verifies this audience.
2. Create Android OAuth credentials for package `com.superfinz.app` and add the SHA-1 fingerprints for local and EAS signing keys.
3. Create iOS OAuth credentials for bundle ID `com.superfinz.app`.
4. Either download `google-services.json` and `GoogleService-Info.plist` into `apps/mobile`, or set `GOOGLE_IOS_URL_SCHEME` to the iOS reversed client ID. The credential files are gitignored.
5. The Google config plugin is intentionally enabled only when those environment values exist. This keeps configuration checks usable before credentials are issued, but a sign-in-capable development build must include them.

## Development and verification

```bash
npm run dev
npm run mobile
npm run typecheck
npm run lint
npm test
cd apps/mobile && npx expo install --check
```

After native OAuth values are configured, create and install a development client:

```bash
cd apps/mobile
npx eas-cli login
npx eas-cli init
npx eas-cli build --profile development --platform android
npx eas-cli build --profile development --platform ios
```

Then start Metro with `npm run mobile` and open the installed development build.

## Vercel and EAS preview

Deploy the repository root to Vercel without changing the root directory. Add all values from `.env.example`, use the pooled `DATABASE_URL` at runtime, and apply migrations using the direct `DIRECT_URL`. Set `NEXTAUTH_URL` to the final HTTPS URL and add its `/api/auth/callback/google` URI to the Web OAuth client.

Set `EXPO_PUBLIC_API_URL` in the EAS `preview` and `production` environments to that stable Vercel HTTPS URL. Replace the placeholder EAS project ID by running `eas init`; do not commit signing keys. Internal previews are configured in `apps/mobile/eas.json`:

```bash
cd apps/mobile
npx eas-cli build --profile preview --platform all
```

Apple signing requires an Apple Developer account. Android builds require an Expo account and signing credentials; EAS can generate and hold the Android keystore.

## Authentication design

The web app continues to use its NextAuth HTTP-only cookie. Native clients exchange a verified Google ID token for a 15-minute bearer access token and a rotating 30-day opaque refresh token. Only a SHA-256 hash of each refresh token is stored in `mobile_sessions`; the device tokens are stored with Expo SecureStore. Logout revokes the server session. Protected handlers authorize bearer tokens at the route before data access, while the proxy continues to enforce web-cookie access.
