# HydroFind

HydroFind is an Expo and React Native app for ordering water deliveries and tracking rider progress. Customer and rider accounts authenticate with Firebase Authentication; order data is served by the Express API backed by Cloud Firestore.

## App setup

1. Install dependencies with `npm ci`.
2. Copy `.env.example` to `.env` and fill in the Firebase client configuration and API URL.
3. Start the app with `npm run start`.

For Android Emulator, the app rewrites `localhost` to `10.0.2.2`. For a physical device, set `EXPO_PUBLIC_API_URL` to the development machine's LAN address, such as `http://192.168.1.10:3000`.

## API setup

1. Place a Firebase Admin service-account JSON file at `server/serviceAccountKey.json`. Do not commit this file.
2. In `server/`, run `npm ci`.
3. Set `PORT` (optional) and `RIDER_SIGNUP_CODE` in the server environment.
4. Start the API from `server/` with `npm run dev`.

The API listens on port `3000` by default. Deploy the Firestore indexes from `firestore.indexes.json` before using order history, assignment, or tracking queries.

## Checks

- `npm run lint` — lint the Expo app
- `npx tsc --noEmit` — typecheck the app
- `npm test` — run the repository tests
- From `server/`, run `npm run typecheck` — typecheck the API
