# HydroFind: Historical Implementation Plan

> **Superseded reference:** this plan describes the codebase before the current navigation, Firestore-backed API, shared map, and order flows were implemented. Do not execute its phase instructions against the current repository. Use [README.md](./README.md) for setup and inspect the current source as the source of truth.

The remaining sections are retained as historical implementation notes and may describe files or behavior that no longer exist.

This plan was written from the actual code in the project (not from `HydroFind_Express_Integration_Notes.md`, which is partly out of date, see section 1).

---

## 0. Prompt to paste into the assistant

> Read `HydroFind_Screens_Location_Firestore_Plan.md` fully. Execute it one phase at a time. Before writing any Expo, expo-location, or React Navigation code, read the versioned docs as `AGENTS.md` requires. After each phase run the checkpoint, summarize what changed, and wait for my "continue". Follow the Guardrails section. If the code differs from what this plan expects, stop and report instead of guessing.

---

## 1. What the code looks like today (verified)

Stack: Expo SDK ~57, React Native 0.86, TypeScript, Firebase **Auth** in the app, Express 5 + Firebase Admin in `server/`, entry `index.ts` -> `App.tsx` -> `AuthProvider` -> `RootNavigator`.

| Area | Current state |
|---|---|
| Navigation | **No navigation library is installed.** `RootNavigator` only switches between `CustomerAuth`, a profile-error view, `HomeScreen` (customer) and `DriverDashboard` (rider). |
| Dead buttons | `HomeScreen` and `Driver-Dashboard` call `navigation?.navigate('PlaceOrder' / 'ViewOrders' / 'MapView' / 'History' / 'OrderDetails', {id})`, but `navigation` is never passed, so every button does nothing. **Keep these route names.** |
| Missing screens | Place Order, Order List, Order Details, History, customer Map View, Edit/Update status. Only `HomeScreen`, `Driver-Dashboard`, `Driver-MapScreen`, and the auth screen exist. |
| Mock data | `HomeScreen` uses `MOCK_OVERVIEW`; `Driver-Dashboard` defaults to `MOCK_ORDERS`; `Driver-MapScreen` takes an `order` prop (no data source). |
| Two Order types | `src/types/index.ts` = API shape (`status: 'pending' \| 'on_the_way' ...`, `location: {latitude, longitude}`). `src/screens/Types/Orders.ts` = UI shape (`'Pending' \| 'On the Way' \| 'Delivered'`, `address`, `preferredTime`, `progress`, `latitude`, `longitude`). **Nothing converts between them.** |
| Missing order fields | The server never stores `address` or `preferredTime`, but the UI and README need both. |
| Status gap | UI type has no `Cancelled`; API has `cancelled`. |
| `OrderCard` bug | Width is `${order.progress * 100}%` but progress values are 0-100, so the bar always overflows to full. |
| Map | `Driver-MapScreen` = Leaflet in a `WebView`, hard-coded `STATION`, **straight dashed line** (not a road route), distance/ETA computed on the client (haversine, 20 km/h). No live rider marker. |
| Location (client) | `expo-location` is installed but **unused**. Android manifest already has FINE/COARSE permissions. `app.json` has no `expo-location` plugin entry. |
| Location (server) | `orders.location` is stored at create time. **There is no rider live-location endpoint, no tracking endpoint, no way to change a pin.** |
| Rider order lists | Server has `/orders/pending` and `/orders/mine` (customer only). **A rider cannot list the orders they accepted**, and there is no history endpoint. |
| Firestore files | `firebase.json` points at `firestore.rules` and `firestore.indexes.json`, but **neither file exists** in the project. The `/pending` and `/mine` queries need composite indexes. |
| Timestamps | `serialize()` returns raw Firestore `Timestamp` objects, which become `{_seconds,_nanoseconds}` in JSON. Type says `createdAt: any`. |

### Server security problems to fix (Phase 1)

1. `POST /users/me` trusts `role` from the request body and uses `set()` (overwrites). **Any logged-in customer can call it again with `role: 'rider'` and become a rider.**
2. `POST /orders` has no validation. `unitPrice` comes from the client; `gallons` can be negative or huge; `location` is unchecked.
3. `GET /orders/:id` lets **any** authenticated user read **any pending order** (name, phone, location).
4. `PATCH /:id/cancel` does not check status, so a delivered order can be cancelled.
5. No global error handler (Express 5 forwards async errors, but the response is HTML).

### Notes file vs. repo (trust the repo)

`HydroFind_Express_Integration_Notes.md` says `AuthContext.tsx`, `src/screens/customer/`, `src/screens/rider/`, `server/.env.example`, and a root `.env.example` exist. In the repo they are `authContext.tsx`, `src/screens/Driver/`, and **none of the `.env.example` files**. `AGENTS.md` says "use Expo Router (`src/app/`)" but that directory does not exist, the app boots through `index.ts`/`App.tsx`, and README says React Navigation. See Decision D2.

---

## 2. Decisions (defaults are used unless I say otherwise)

Ask me about these at CHECKPOINT 0. If I don't answer, use the default.

| ID | Question | Default |
|---|---|---|
| D1 | How do riders sign up? | Server requires a shared code (`RIDER_SIGNUP_CODE` in `server/.env`) when `role` is `rider`. The signup screen shows an extra "Rider code" field only in driver mode. |
| D2 | Navigation library | **React Navigation** (native stack + bottom tabs), matching README and the current `App.tsx` entry. Update the "Navigation & Routing" section of `AGENTS.md` to say so. |
| D3 | Who can cancel? | Customer, own order, **only while `pending`**. |
| D4 | Missing screens | Create **navigable, data-bound placeholders** (plain layout, existing theme/components, real actions). Not final UI. Each file starts with a `// PLACEHOLDER: replace with final design` comment so I can swap them out later. |

Pre-approved new dependencies (install only with `npx expo install`): `@react-navigation/native`, `@react-navigation/native-stack`, `@react-navigation/bottom-tabs`, `react-native-screens`. (`react-native-safe-area-context` and `expo-location` are already installed.) Ask before adding anything else.

---

## 3. Guardrails (always follow)

1. New branch from current HEAD: `git checkout -b feat/screens-location`. Commit after every phase.
2. **Never read, print, edit, or commit** `.env`, `server/.env`, or `server/serviceAccountKey.json`. Never ask me to paste secrets into chat. When a step needs a secret value, tell me to set it myself.
3. Do not delete files other than those named here. Ask first if something looks unused (for example `expo-maps` / `react-native-maps` are installed but the map uses Leaflet; **leave them**).
4. Do not change business logic, UI, or styling unless a phase says so. Presentational screens keep their current look.
5. Only the pre-approved dependencies above.
6. If a file does not exist or differs from what the plan expects, stop and report.
7. Commands are PowerShell. No `&&`; run commands separately.
8. Layering stays: Screen -> hook -> service -> `api.ts` -> Express -> Firestore. Nothing outside `services/firebase.ts`, `services/authService.ts`, `services/api.ts` imports `firebase/*`. Nothing in the app imports `firebase/firestore`.
9. UI uses `'driver'`, the database uses `'rider'`. Convert only at the boundary (already done in `authService.register`).
10. Run `npx tsc --noEmit` (root) and `npx tsc --noEmit` inside `server/` before declaring a phase done. Run `npx expo lint` if it is configured.

---

## 4. Target architecture

```
Customer app                              Express API (server/)                 Firestore
-----------------------------------       ----------------------------------    ----------------
useCurrentLocation (GPS + address) -----> POST  /orders             (create) --> orders/{id}
                                          PATCH /orders/:id/location (pin)  -->   .location, .address
Rider app
useRiderLocationBroadcast (watch GPS) --> PUT   /orders/:id/rider-location --->   .riderLocation
Both
useOrderTracking (poll every 5s) <------ GET   /orders/:id/tracking <---------   reads + ETA
```

Firestore is only touched by the server (Admin SDK). Rules are deny-all.

### Order document (additions in **bold**)

| Field | Type | Notes |
|---|---|---|
| customerId, customerName, contactNumber | string | existing |
| riderId, riderName | string \| null | existing |
| stationId, productName, unitPrice, gallons, totalAmount | mixed | existing; `totalAmount = unitPrice * gallons` |
| location | `{latitude, longitude}` | customer delivery pin (validated) |
| **address** | string | human-readable, from reverse geocode or typed |
| **preferredTime** | string | e.g. `"10:00 AM"` |
| **riderLocation** | `{latitude, longitude, heading, speed, updatedAt} \| null` | written only while `on_the_way`; cleared on deliver |
| status | `pending \| on_the_way \| delivered \| cancelled` | existing |
| paymentMethod, paymentStatus | string | existing |
| createdAt, acceptedAt, deliveredAt | Timestamp \| null | returned to the client as ISO strings |

### Endpoints (all under `/api`)

| Method | Path | Role | Status |
|---|---|---|---|
| POST | `/users/me` | any | **changed**: create-only, rider code check |
| GET | `/users/me` | any | unchanged |
| POST | `/orders` | customer | **changed**: validation, `address`, `preferredTime` |
| GET | `/orders/pending` | rider | unchanged |
| GET | `/orders/mine` | customer | unchanged |
| GET | `/orders/assigned` | rider | **new** (rider's `on_the_way` orders) |
| GET | `/orders/history` | any | **new** (customer: delivered+cancelled; rider: delivered) |
| GET | `/orders/:id` | owner / assigned rider / any rider if pending | **changed** |
| PATCH | `/orders/:id/accept` | rider | unchanged |
| PATCH | `/orders/:id/deliver` | rider | **changed**: clears `riderLocation` |
| PATCH | `/orders/:id/cancel` | customer | **changed**: pending only |
| DELETE | `/orders/:id` | customer | unchanged |
| PATCH | `/orders/:id/location` | customer | **new**: move the pin while pending |
| PUT | `/orders/:id/rider-location` | rider | **new**: live position push |
| GET | `/orders/:id/tracking` | owner / assigned rider | **new**: locations + distance + ETA |

Route order in `orders.ts` matters: `/pending`, `/mine`, `/assigned`, `/history` **before** `/:id`.

### Screen / route map (names must match existing `navigate()` calls)

| Route | Customer | Rider |
|---|---|---|
| Tab `Home` | `HomeScreen` | `Driver-Dashboard` |
| Tab `ViewOrders` | placeholder list of `mine` | placeholder list of `pending` + `assigned`, with Accept |
| Tab `MapView` | `Driver-MapScreen` reused (read-only tracking) | `Driver-MapScreen` |
| Tab `History` | placeholder (`history`) | placeholder (`history`) |
| Stack `PlaceOrder` | placeholder (location capture + submit) | n/a |
| Stack `OrderDetails` `{id}` | placeholder (+ Cancel, + Track) | placeholder (+ Accept / Deliver) |
| Dev only (`__DEV__`) tab `DevLocation` | location test harness | location test harness |

---

## Phase 0: Audit (no changes)

1. Create branch `feat/screens-location`.
2. Run `npx tsc --noEmit` in the root and in `server/`. Record the baseline.
3. Run `npx expo-doctor`. Record warnings (do not fix yet).
4. Read the docs required by `AGENTS.md` for the `expo` major in `package.json`: `expo-location` (permissions, `watchPositionAsync`, `reverseGeocodeAsync`, config plugin options) and the React Navigation version compatible with this SDK.
5. Confirm each finding in section 1 against the code. Report any that are wrong.
6. Run `git log --all --oneline -- server/serviceAccountKey.json` and report whether the key was ever committed. (Do not open the file.)
7. List every file you plan to create or modify in Phases 1-5.

**CHECKPOINT 0:** Report the baseline, the doc versions you will follow, the git-history result, the file list, and ask me D1-D4. Wait for my reply.

---

## Phase 1: Server hardening + Firestore foundation

### 1.1 `server/src/firebase.ts`
Add `export const Timestamp = admin.firestore.Timestamp;`.

### 1.2 `server/src/config.ts` (new)
```ts
// Keep STATION in sync with the placeholder in Driver-MapScreen until the app reads it from /tracking.
export const STATION = { latitude: 14.5878, longitude: 121.0614 };
export const AVG_SPEED_KMH = 20;
export const MIN_PUSH_INTERVAL_MS = 2000;
```

### 1.3 `server/src/utils/geo.ts` (new)
```ts
export type Coord = { latitude: number; longitude: number };

export const isCoord = (c: any): c is Coord =>
  !!c &&
  typeof c.latitude === 'number' && typeof c.longitude === 'number' &&
  Number.isFinite(c.latitude) && Number.isFinite(c.longitude) &&
  Math.abs(c.latitude) <= 90 && Math.abs(c.longitude) <= 180;

export function distanceKm(a: Coord, b: Coord): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export const etaMinutes = (km: number, speedKmh: number) =>
  Math.max(1, Math.round((km / speedKmh) * 60));
```

### 1.4 `server/src/routes/users.ts`: `POST /me`
- Validate `fullName` and `contactNumber` (non-empty strings, sensible max length).
- Role: default `customer`. If `role === 'rider'`, require `req.body.riderCode === process.env.RIDER_SIGNUP_CODE` (and the env var must be set), otherwise `403 { error: 'Invalid rider code' }`.
- Replace `.set(...)` with `.create(...)`; on Firestore error code `6` (ALREADY_EXISTS) return `409 { error: 'Profile already exists' }`.
- Create `server/.env.example` (no secrets): `PORT=3000`, `RIDER_SIGNUP_CODE=change-me`. Tell **me** to add the real `RIDER_SIGNUP_CODE` to `server/.env`.

### 1.5 `server/src/routes/orders.ts`
1. Timestamp-safe `serialize`:
```ts
import { db, FieldValue, Timestamp } from '../firebase';
const toJson = (v: any): any => {
  if (v instanceof Timestamp) return v.toDate().toISOString();
  if (Array.isArray(v)) return v.map(toJson);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, toJson(x)]));
  return v;
};
const serialize = (d: FirebaseFirestore.DocumentSnapshot) => ({ id: d.id, ...toJson(d.data()) });
```
2. `POST /` validation (return `400 { error }` on failure):
   - `stationId`, `productName`, `paymentMethod`: non-empty strings.
   - `unitPrice`: number > 0. `gallons`: integer 1-50.
   - `location`: `isCoord`. `address`: non-empty string (trim, max 200). `preferredTime`: string (max 30).
   - Store `address`, `preferredTime`, and `riderLocation: null`. Store only `{latitude, longitude}` from `location`.
3. `GET /:id` visibility: allow if caller is the customer, the assigned rider, **or** (`req.role === 'rider'` and `status === 'pending'`); otherwise `403`.
4. `PATCH /:id/cancel`: `403` if not the owner, `409` if status is not `pending` (per D3).
5. `PATCH /:id/deliver`: also set `riderLocation: null`.
6. New routes (above `/:id`):
```ts
r.get('/assigned', requireRole('rider'), async (req: AuthedRequest, res) => {
  const snap = await col
    .where('riderId', '==', req.uid).where('status', '==', 'on_the_way')
    .orderBy('acceptedAt', 'desc').get();
  res.json(snap.docs.map(serialize));
});

r.get('/history', async (req: AuthedRequest, res) => {
  const q = req.role === 'rider'
    ? col.where('riderId', '==', req.uid).where('status', '==', 'delivered').orderBy('deliveredAt', 'desc')
    : col.where('customerId', '==', req.uid).where('status', 'in', ['delivered', 'cancelled']).orderBy('createdAt', 'desc');
  const snap = await q.limit(50).get();
  res.json(snap.docs.map(serialize));
});
```

### 1.6 `server/src/index.ts`
After the routers add a JSON 404 and an error handler:
```ts
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});
```

### 1.7 Firestore files (project root)
`firestore.rules` (deny-all; the Admin SDK bypasses rules):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} { allow read, write: if false; }
  }
}
```
`firestore.indexes.json`:
```json
{
  "indexes": [
    { "collectionGroup": "orders", "queryScope": "COLLECTION", "fields": [
      { "fieldPath": "status", "order": "ASCENDING" }, { "fieldPath": "createdAt", "order": "DESCENDING" } ] },
    { "collectionGroup": "orders", "queryScope": "COLLECTION", "fields": [
      { "fieldPath": "customerId", "order": "ASCENDING" }, { "fieldPath": "createdAt", "order": "DESCENDING" } ] },
    { "collectionGroup": "orders", "queryScope": "COLLECTION", "fields": [
      { "fieldPath": "customerId", "order": "ASCENDING" }, { "fieldPath": "status", "order": "ASCENDING" }, { "fieldPath": "createdAt", "order": "DESCENDING" } ] },
    { "collectionGroup": "orders", "queryScope": "COLLECTION", "fields": [
      { "fieldPath": "riderId", "order": "ASCENDING" }, { "fieldPath": "status", "order": "ASCENDING" }, { "fieldPath": "acceptedAt", "order": "DESCENDING" } ] },
    { "collectionGroup": "orders", "queryScope": "COLLECTION", "fields": [
      { "fieldPath": "riderId", "order": "ASCENDING" }, { "fieldPath": "status", "order": "ASCENDING" }, { "fieldPath": "deliveredAt", "order": "DESCENDING" } ] }
  ],
  "fieldOverrides": []
}
```

### 1.8 `scripts/Get-IdToken.ps1` (new, for testing only)
```powershell
param([Parameter(Mandatory)][string]$Email, [Parameter(Mandatory)][string]$Password)
if (-not $env:FIREBASE_WEB_API_KEY) { throw 'Set $env:FIREBASE_WEB_API_KEY in this PowerShell session first.' }
$body = @{ email = $Email; password = $Password; returnSecureToken = $true } | ConvertTo-Json
$r = Invoke-RestMethod -Method Post -ContentType 'application/json' -Body $body `
  -Uri "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=$($env:FIREBASE_WEB_API_KEY)"
$r.idToken
```

**CHECKPOINT 1:** `npx tsc --noEmit` in `server/` must pass. Then **tell me** to: add `RIDER_SIGNUP_CODE` to `server/.env`, run `firebase deploy --only firestore:rules,firestore:indexes` (I will run it myself; `npx firebase-tools ...` if the CLI isn't installed), restart `npm run dev`, and confirm `/health` returns `{"ok":true}`. Commit: `feat(server): harden API, add assigned/history, rules and indexes`.

---

## Phase 2: Express location-tracking API

Add to `server/src/routes/orders.ts` (imports: `isCoord`, `distanceKm`, `etaMinutes` from `../utils/geo`; `STATION`, `AVG_SPEED_KMH`, `MIN_PUSH_INTERVAL_MS` from `../config`). Place **above** `GET /:id`.

```ts
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

// Customer moves the delivery pin while the order is still pending
r.patch('/:id/location', requireRole('customer'), async (req: AuthedRequest, res) => {
  const { location, address } = req.body;
  if (!isCoord(location)) return res.status(400).json({ error: 'Invalid location' });
  const ref = col.doc(String(req.params.id));
  const s = await ref.get();
  if (!s.exists || s.data()!.customerId !== req.uid) return res.status(404).json({ error: 'Not found' });
  if (s.data()!.status !== 'pending')
    return res.status(409).json({ error: 'Location can only change while the order is pending' });
  const update: Record<string, unknown> = {
    location: { latitude: location.latitude, longitude: location.longitude },
  };
  if (typeof address === 'string' && address.trim()) update.address = address.trim().slice(0, 200);
  await ref.update(update);
  res.json({ ok: true });
});

// Assigned rider pushes live position
r.put('/:id/rider-location', requireRole('rider'), async (req: AuthedRequest, res) => {
  const { latitude, longitude, heading, speed } = req.body;
  if (!isCoord({ latitude, longitude })) return res.status(400).json({ error: 'Invalid location' });
  const ref = col.doc(String(req.params.id));
  const s = await ref.get();
  if (!s.exists || s.data()!.riderId !== req.uid) return res.status(404).json({ error: 'Not found' });
  const o = s.data()!;
  if (o.status !== 'on_the_way') return res.status(409).json({ error: 'Order is not on the way' });
  const last: number | undefined = o.riderLocation?.updatedAt?.toMillis?.();
  if (last && Date.now() - last < MIN_PUSH_INTERVAL_MS)
    return res.status(429).json({ error: 'Too many updates', retryAfterMs: MIN_PUSH_INTERVAL_MS - (Date.now() - last) });
  await ref.update({
    riderLocation: { latitude, longitude, heading: num(heading), speed: num(speed), updatedAt: FieldValue.serverTimestamp() },
  });
  res.json({ ok: true });
});

// Customer (owner) or assigned rider reads tracking info
r.get('/:id/tracking', async (req: AuthedRequest, res) => {
  const s = await col.doc(String(req.params.id)).get();
  if (!s.exists) return res.status(404).json({ error: 'Not found' });
  const o = s.data()!;
  if (o.customerId !== req.uid && o.riderId !== req.uid) return res.status(403).json({ error: 'Forbidden' });

  const live = o.status === 'on_the_way' && o.riderLocation ? o.riderLocation : null;
  const done = o.status === 'delivered' || o.status === 'cancelled';
  const km = distanceKm(live ?? STATION, o.location);
  res.json({
    orderId: s.id,
    status: o.status,
    address: o.address ?? null,
    customerLocation: o.location,
    riderLocation: live && {
      latitude: live.latitude, longitude: live.longitude, heading: live.heading ?? null,
      speed: live.speed ?? null, updatedAt: live.updatedAt?.toMillis?.() ?? null,
    },
    station: STATION,
    distanceKm: Math.round(km * 10) / 10,
    etaMinutes: done ? null : etaMinutes(km, AVG_SPEED_KMH),
    serverTime: Date.now(),
  });
});
```
Notes for the agent:
- `distanceKm`/`etaMinutes` are **straight-line estimates** (same method as the current map screen), not road routing. Say so in a code comment.
- The `PATCH /:id/location` read-then-write has a small race with `accept`. Acceptable for this project; if you prefer, wrap it in `db.runTransaction`.

**CHECKPOINT 2:** `npx tsc --noEmit` in `server/`. List the final route order in `orders.ts` and confirm `/pending`, `/mine`, `/assigned`, `/history` precede `/:id`. Commit: `feat(server): location tracking endpoints`.

---

## Phase 3: Client service and hook layer for location (no screens yet)

This is what makes tracking usable **before any customer screen exists**.

### 3.1 `app.json`
Add to `plugins`: `["expo-location", { "locationWhenInUsePermission": "HydroFind uses your location to set your delivery address and show your rider's progress." }]`. Verify the option name in the SDK docs first. Do **not** run `expo prebuild` yourself (the `android/` folder is generated and gitignored; the manifest already has the Android permissions). Tell me to run it only if I build for iOS.

### 3.2 `src/services/api.ts`
- Throw a typed error so callers can react to HTTP codes:
  `export class ApiError extends Error { constructor(message: string, public status: number) { super(message); } }` and use it for non-OK responses.
- Wrap the per-request `console.log` in `if (__DEV__)`.
- Nothing else changes.

### 3.3 `src/types/index.ts`
Add `Coord`, `address: string`, `preferredTime: string`, `riderLocation`, change `createdAt/acceptedAt/deliveredAt` to `string | null`, and:
```ts
export type Coord = { latitude: number; longitude: number };
export type Tracking = {
  orderId: string;
  status: OrderStatus;
  address: string | null;
  customerLocation: Coord;
  riderLocation: (Coord & { heading: number | null; speed: number | null; updatedAt: number | null }) | null;
  station: Coord;
  distanceKm: number;
  etaMinutes: number | null;
  serverTime: number;
};
```

### 3.4 `src/services/orderService.ts`
Add: `getAssignedOrders = () => api('/orders/assigned')`, `getHistory = () => api('/orders/history')`.

### 3.5 `src/services/trackingService.ts` (new)
```ts
import { api } from './api';
import type { Coord, Tracking } from '../types';

export const getTracking = (orderId: string) => api<Tracking>(`/orders/${orderId}/tracking`);

export const pushRiderLocation = (
  orderId: string,
  p: Coord & { heading?: number | null; speed?: number | null }
) => api(`/orders/${orderId}/rider-location`, { method: 'PUT', body: JSON.stringify(p) });

export const updateOrderLocation = (orderId: string, body: { location: Coord; address?: string }) =>
  api(`/orders/${orderId}/location`, { method: 'PATCH', body: JSON.stringify(body) });
```

### 3.6 `src/services/locationService.ts` (new; adjust to the SDK 57 docs if names differ)
```ts
import * as Location from 'expo-location';
import type { Coord } from '../types';

export async function ensureForegroundPermission(): Promise<boolean> {
  const cur = await Location.getForegroundPermissionsAsync();
  if (cur.granted) return true;
  if (!cur.canAskAgain) return false;
  return (await Location.requestForegroundPermissionsAsync()).granted;
}

export async function getCurrentCoords(): Promise<Coord> {
  if (!(await ensureForegroundPermission())) throw new Error('Location permission denied');
  const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  return { latitude: p.coords.latitude, longitude: p.coords.longitude };
}

export async function reverseGeocode(c: Coord): Promise<string | null> {
  try {
    const [a] = await Location.reverseGeocodeAsync(c);
    if (!a) return null;
    return [a.name, a.street, a.district ?? a.subregion, a.city, a.region].filter(Boolean).join(', ') || null;
  } catch {
    return null;
  }
}
```

### 3.7 Hooks (new)
`src/hooks/useCurrentLocation.ts`: state `{ coords, address, loading, error }` and `refresh()` that calls `getCurrentCoords()` then `reverseGeocode()`; `refresh` returns the coords (or `null` on error).

`src/hooks/useOrderTracking.ts`:
```ts
import { useEffect, useState } from 'react';
import { getTracking } from '../services/trackingService';
import type { Tracking } from '../types';

export function useOrderTracking(orderId: string | null, intervalMs = 5000) {
  const [tracking, setTracking] = useState<Tracking | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) { setTracking(null); return; }
    let stopped = false;
    const tick = async () => {
      try {
        const t = await getTracking(orderId);
        if (stopped) return;
        setTracking(t);
        setError(null);
        if (t.status === 'delivered' || t.status === 'cancelled') clearInterval(id);
      } catch (e: any) {
        if (!stopped) setError(e.message);
      }
    };
    const id = setInterval(tick, intervalMs);
    tick();
    return () => { stopped = true; clearInterval(id); };
  }, [orderId, intervalMs]);

  return { tracking, error };
}
```
(Once navigation exists, also pause polling when the screen is not focused.)

`src/hooks/useRiderLocationBroadcast.ts`: `useRiderLocationBroadcast(orderId: string | null, enabled: boolean)`:
- When `orderId && enabled`: `ensureForegroundPermission()`, then `Location.watchPositionAsync({ accuracy: Balanced, timeInterval: 5000, distanceInterval: 10 }, cb)`.
- `cb` calls `pushRiderLocation(orderId, { latitude, longitude, heading, speed })`; on `ApiError` status `429` ignore; on `404`/`409` stop the subscription and set an error; on other errors set `error` and keep going.
- Cleanup removes the subscription (also handle unmount before the subscription resolves).
- Returns `{ error, lastSentAt }`.
- **Foreground only.** Background tracking is out of scope.

### 3.8 `src/utils/orderMapper.ts` (new) and UI type fixes
```ts
import type { Order as ApiOrder } from '../types';
import type { Order as UiOrder, OrderStatus as UiStatus } from '../screens/Types/Orders';

const STATUS: Record<ApiOrder['status'], UiStatus> = {
  pending: 'Pending', on_the_way: 'On the Way', delivered: 'Delivered', cancelled: 'Cancelled',
};
const PROGRESS: Record<ApiOrder['status'], number> = { pending: 10, on_the_way: 60, delivered: 100, cancelled: 0 };

export const toUiOrder = (o: ApiOrder): UiOrder => ({
  id: o.id,
  customerName: o.customerName,
  gallons: o.gallons,
  preferredTime: o.preferredTime ?? '',
  address: o.address ?? '',
  status: STATUS[o.status],
  progress: PROGRESS[o.status],
  latitude: o.location?.latitude,
  longitude: o.location?.longitude,
});
```
- `src/screens/Types/Orders.ts`: add `'Cancelled'` to `OrderStatus`.
- `src/screens/Components/StatusBadge.tsx`: add a `Cancelled` entry (use `colors.border` background and `colors.textMuted` text).
- `src/screens/Components/OrderCard.tsx`: change width to `` `${order.progress}%` `` (the only change to that file).

### 3.9 Signup: rider code (D1)
- `authService.register(email, password, fullName, contactNumber, role, riderCode?)` sends `riderCode` in the body.
- `useRegister.signUp` forwards it.
- `Customer-Driver-Login-Signup.tsx`: when `isSignUp && userRole === 'driver'`, show one extra `AuthInput` "Rider Code". No other UI change.

**CHECKPOINT 3:** `npx tsc --noEmit` (root). Search the repo: `firebase/firestore` must return nothing. Confirm that `expo-location` is imported only in `locationService.ts` and the broadcast hook. Commit: `feat(app): location services, hooks, order mapper`.

---

## Phase 4: Install navigation and connect every screen

### 4.1 Install
Run each separately:
```
npx expo install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs react-native-screens
```
Then update the "Navigation & Routing" section of `AGENTS.md` to say React Navigation is used (D2).

### 4.2 Navigation files (follow the React Navigation docs for the installed major version)
- `src/navigation/types.ts`: param lists. `OrderDetails: { id: string }`, `MapView: { id?: string } | undefined`, the rest `undefined`.
- `src/navigation/CustomerNavigator.tsx`: bottom tabs `Home`, `ViewOrders`, `MapView`, `History`, wrapped in a native stack that also holds `PlaceOrder` and `OrderDetails`.
- `src/navigation/DriverNavigator.tsx`: same shape without `PlaceOrder`. **This is where the rider broadcast runs:** call `useAssigned` (below) and `useRiderLocationBroadcast(activeOrderId, !!activeOrderId)` here so tracking continues across tabs.
- `src/navigation/RootNavigator.tsx`: keep the existing loading / not-signed-in / profile-error states exactly as they are. For a signed-in user render `<NavigationContainer>` with `CustomerNavigator` or `DriverNavigator` by `profile.role`. Keep the existing "Log out" bar below the navigator (moving it is out of scope).
- Tab names must be exactly the existing quick-action keys so `navigation.navigate('ViewOrders')` etc. just work. React Navigation passes `navigation` and `route` to screen components automatically.

### 4.3 Containers (data-bound wrappers; presentational screens keep their markup)
Create under `src/navigation/containers/`:

- `CustomerHomeContainer`: `useOrders(getMyOrders)` -> counts for Pending / On the Way / Delivered -> pass as a new optional `overview` prop on `HomeScreen` (default stays `MOCK_OVERVIEW`, so nothing breaks).
- `DriverHomeContainer`: `useOrders(getPendingOrders)`, `useOrders(getAssignedOrders)`, `useOrders(getHistory, 30000)` -> `toUiOrder` -> `<DriverDashboard role="driver" orders={...} navigation={navigation} />`.
- `MapContainer`: `id = route.params?.id ?? firstAssignedOrderId`. Use `useOrderTracking(id)` plus `getOrder(id)` to build the `order` prop with `toUiOrder`. Pass `riderLocation={tracking?.riderLocation}`.
- `useAssigned` helper hook: `useOrders(getAssignedOrders, 7000)` returning the list and `activeOrderId` (first `on_the_way`).

### 4.4 `Driver-MapScreen.tsx` (minimal, additive changes only)
- New optional prop `riderLocation?: Coord | null`.
- In the Leaflet script add `window.setRider = function (lat, lng) {...}` that creates/moves a third marker (distinct colour, e.g. green `.pin-rider`) and, when a customer pin exists, draws a dashed polyline rider -> customer (replacing the station -> customer line while tracking).
- `useEffect` on `riderLocation` -> `webRef.current?.injectJavaScript('window.setRider(lat, lng); true;')`. Do **not** rebuild the HTML when the rider moves (the existing `useMemo` must keep depending only on order id/coords).
- Prefer `tracking.station`/`distanceKm`/`etaMinutes` when provided; otherwise keep the current client-side calculation. Keep the `STATION` constant as fallback.
- Show "Last updated Ns ago" in the details card only if a stale timestamp helps; otherwise skip (UI change must stay minimal).

### 4.5 Placeholder screens (D4) in `src/screens/Customer/` and `src/screens/Driver/`
Each starts with `// PLACEHOLDER: replace with final design`. Use `colors`, `OrderCard`, `StatusBadge`. Plain layout.

| File | Behaviour |
|---|---|
| `Customer/PlaceOrderScreen.tsx` | `useCurrentLocation()` on mount; shows captured address/coords with a "Use my location" button; inputs for gallons and preferred time; submit -> `createOrder({...})` with `stationId`, `productName`, `unitPrice` from a small `src/config/catalog.ts` placeholder constant, `paymentMethod: 'cash'`; on success navigate to `OrderDetails`. |
| `Shared/OrdersListScreen.tsx` | Customer: `getMyOrders`. Rider: `getPendingOrders` + `getAssignedOrders` with an Accept button per pending row. Uses `OrderCard` + `toUiOrder`; tap -> `OrderDetails {id}`. |
| `Shared/OrderDetailsScreen.tsx` | `getOrder(id)` (poll with `useOrders`-style hook or refresh on focus). Shows all fields. Customer: Cancel (pending only), Delete (pending only), "Track on map" (when `on_the_way`) -> `MapView {id}`. Rider: Accept (pending), Deliver (`on_the_way`, assigned to me), "Open map". Show server error messages (409 etc.) in an `Alert`. |
| `Shared/HistoryScreen.tsx` | `getHistory` -> `OrderCard` list. |
| `Shared/DevLocationTestScreen.tsx` (`__DEV__` only, tab `DevLocation`) | Customer mode: capture GPS, enter an order id, call `updateOrderLocation`. Rider mode: enter an order id, toggle `useRiderLocationBroadcast`, show `lastSentAt`/error. Both: show the raw `useOrderTracking` JSON. **Remove before release.** |

### 4.6 Remove mock fallbacks from real paths
`MOCK_ORDERS`/`MOCK_OVERVIEW` stay only as default prop values; no container may use them. Do not delete `MockOrders.ts`.

**CHECKPOINT 4:** `npx tsc --noEmit` (root), `npx expo lint`. Start the app and confirm: every Quick Action button navigates to a real screen; `OrderDetails` opens from the dashboard cards and from the map's "View Order Details". Report any `navigate()` target that still has no route. Commit: `feat(app): navigation, containers, placeholder screens, live rider marker`.

---

## Phase 5: Security cleanup and docs

1. `.gitignore`: remove the stray lines `# local env filesgit` and the `D:\Projects\...\.env` path line; remove `.env.example` from the ignore list (examples must be committable); make sure `.env`, `server/.env`, `server/serviceAccountKey.json`, `server/node_modules` stay ignored. Add `server/.env.example` and a root `.env.example` (variable **names only**: the `EXPO_PUBLIC_FIREBASE_*` keys and `EXPO_PUBLIC_API_URL=http://<your-lan-ip>:3000`).
2. `git status` must show no `.env` or `serviceAccountKey.json`. If Phase 0 step 6 found the key in history, **stop and tell me** (do not rewrite history on your own).
3. Search for leftover Data Connect artifacts (`dataconnect`, `@dataconnect/generated`, `getDataConnect`, `.gql`). List and ask before deleting.
4. `README.md`: it still says SQLite, JavaScript, and "authentication not included". Update to Firestore (via Express), TypeScript, Firebase Auth included, and add the final route map, endpoint list (section 4), the `RIDER_SIGNUP_CODE` setup, and the "Running locally" steps.
5. Update `HydroFind_Express_Integration_Notes.md` to match the real file names (or tell me it is stale).

**CHECKPOINT 5:** Report `git status` and the final changed-file list. Commit: `chore: gitignore, env examples, docs`.

---

## Phase 6: Manual test script (I run these; guide me and state expected results)

Prerequisites: server running, indexes deployed, `$env:FIREBASE_WEB_API_KEY` set by me in this PowerShell session, two Auth users (one `customer`, one `rider` created with the rider code).

```powershell
$base = 'http://localhost:3000/api'
function Call($Method, $Path, $Headers, $Body) {
  $p = @{ Method = $Method; Uri = "$base$Path"; Headers = $Headers; ContentType = 'application/json' }
  if ($Body) { $p.Body = ($Body | ConvertTo-Json -Depth 5) }
  try { Invoke-RestMethod @p } catch { "HTTP " + [int]$_.Exception.Response.StatusCode }
}
$ch = @{ Authorization = "Bearer $(.\scripts\Get-IdToken.ps1 -Email customer@test.com -Password '<pw>')" }
$rh = @{ Authorization = "Bearer $(.\scripts\Get-IdToken.ps1 -Email rider@test.com -Password '<pw>')" }
```
(Tokens expire after about an hour; re-run these two lines.)

| # | Action | Expected |
|---|---|---|
| 1 | Customer `POST /orders` with `gallons=2`, `unitPrice=35`, `address`, `preferredTime`, `location` | `201 {id}`; Firestore doc has `status: pending`, `totalAmount: 70`, `riderLocation: null` |
| 2 | Customer `POST /orders` with `gallons=-1`, then with a bad `location` | `HTTP 400` each |
| 3 | Customer calls `POST /users/me` again with `role: rider` | `HTTP 409` (or `403`), role unchanged |
| 4 | Customer `PATCH /orders/{id}/location` with a new pin | `ok`; doc updated |
| 5 | Rider `GET /orders/pending` | list contains the order; `createdAt` is an ISO string |
| 6 | Rider `PUT /orders/{id}/rider-location` **before** accepting | `HTTP 404` |
| 7 | Rider `PATCH /orders/{id}/accept` | `ok`; `status: on_the_way` |
| 8 | Customer `PATCH /orders/{id}/location` now | `HTTP 409` |
| 9 | Rider `PUT /orders/{id}/rider-location` `{latitude, longitude}` | `ok`; `riderLocation.updatedAt` set |
| 10 | Rider repeats step 9 immediately | `HTTP 429` |
| 11 | Customer `GET /orders/{id}/tracking` | `riderLocation`, `customerLocation`, `distanceKm`, `etaMinutes` present |
| 12 | A second customer `GET /orders/{id}/tracking` and `GET /orders/{id}` | `HTTP 403` both |
| 13 | A second rider `PUT .../rider-location` | `HTTP 404` |
| 14 | Rider `GET /orders/assigned` | contains the order |
| 15 | Rider `PATCH /orders/{id}/deliver` | `ok`; `riderLocation: null`, `status: delivered` |
| 16 | Rider `PUT .../rider-location` after delivery | `HTTP 409` |
| 17 | Customer `PATCH /orders/{id}/cancel` on the delivered order | `HTTP 409` |
| 18 | Customer and rider `GET /orders/history` | delivered order appears for both |
| 19 | If the server logs "requires an index", open the link in the log, create it, wait about a minute, retry | resolves |

App tests (device or emulator; Android emulator reaches the PC at `10.0.2.2`, handled in `api.ts`; set the emulator's location near the station via Extended controls > Location):

1. Customer signs up -> lands on `HomeScreen` with real counts. Place an order from `PlaceOrder`; the address is auto-filled from GPS.
2. Rider signs up with the rider code -> sees the order in `ViewOrders`; Accept.
3. Rider app stays open: `DevLocation` (or the map) shows broadcasts succeeding (`lastSentAt` changes about every 5 s while moving or changing the emulator location).
4. Customer opens `OrderDetails` -> "Track on map": the rider marker moves and distance/ETA update.
5. Rider taps Deliver -> customer tracking stops updating; order shows in `History`.
6. Deny location permission once: the app shows an error message and does not crash.

---

## Out of scope for this plan

- Final UI for the missing customer screens (placeholders only).
- Background location (needs `expo-task-manager`, background permission, a dev build, and Play Store disclosure).
- Real road routing / traffic (the current distance and ETA are straight-line estimates at 20 km/h). A routing provider can replace `distanceKm`/`etaMinutes` server-side later without changing the client contract.
- Server-side price lookup (`unitPrice` is still sent by the client; move it to a `stations/{id}/products` read later).
- Deploying the server, push notifications, real payments, `onSnapshot` real-time reads, an admin endpoint for promoting riders, multi-station support.
- Moving the logout bar into a profile tab.

## Definition of done

- `npx tsc --noEmit` passes in the root and in `server/`; no `firebase/firestore` imports in the app.
- Every existing `navigation.navigate(...)` target resolves to a screen.
- Phase 6 server table passes (all 19 rows) and the six app tests pass.
- Rules are deny-all and the indexes are deployed.
- No secrets in git (current tree and, if applicable, history).