# HydroFind

HydroFind is a mobile ordering and delivery app for water refill services. Customers can place refill requests, share their location, and track delivery progress. Riders and staff can accept, route, and complete orders from a mobile dashboard.

## Stack

- Frontend: Expo + React Native + TypeScript
- Navigation: React Navigation with native stack + bottom tabs
- Auth: Firebase Authentication
- Backend: Express API in `server/`
- Database: Firebase Firestore via Firebase Admin SDK
- Location: Expo Location + Leaflet map view

## Core features

- Customer signup/login and rider signup with a shared rider code
- Place orders with address and preferred delivery time
- View pending, assigned, and historical orders
- Rider accept/deliver/cancel flows
- Map and tracking data from the station to the customer and live rider position
- Server-side validation and Firestore access through Express

## Route map

Customer app:
- Home
- PlaceOrder
- ViewOrders
- MapView
- History
- OrderDetails

Rider app:
- Home
- ViewOrders
- MapView
- History
- OrderDetails

## API overview

The app talks to the Express API at `/api` with Firebase ID tokens attached. Main flows include:

- `POST /api/users/me` — create or fetch the signed-in profile
- `GET /api/orders/mine` — customer order list
- `GET /api/orders/pending` — pending rider-visible orders
- `GET /api/orders/assigned` — rider-assigned order list
- `GET /api/orders/history` — delivery history
- `POST /api/orders` — create an order
- `PATCH /api/orders/:id/accept` — rider accepts an order
- `PATCH /api/orders/:id/deliver` — rider marks it delivered
- `PATCH /api/orders/:id/cancel` — cancel while pending
- `GET /api/orders/:id/tracking` — live tracking payload
- `PATCH /api/orders/:id/location` — customer updates order location
- `PUT /api/orders/:id/rider-location` — rider pushes live GPS position

## Environment setup

Create a root `.env` file from the example and add your app config values:

```bash
cp .env.example .env
```

The app expects Firebase values such as:

- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`
- `EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID`
- `EXPO_PUBLIC_API_URL=http://<your-lan-ip>:3000`

The server also uses `server/.env` for backend-only values, including `RIDER_SIGNUP_CODE`.

## Running locally

1. Copy the server env example if needed:
   ```bash
   cp server/.env.example server/.env
   ```
2. Start the API server:
   ```bash
   cd server
   npm run dev
   ```
3. Start the Expo app:
   ```bash
   npx expo start -c
   ```
4. On a device or emulator, use the local LAN IP configured in `EXPO_PUBLIC_API_URL`.

## Notes

- Do not commit `.env` files or Firebase service account keys.
- The project uses Firestore via the Express server rather than direct client-side Firestore access.
- `HydroFind_Express_Integration_Notes.md` was updated to match the real repo state rather than the earlier planning assumptions.
