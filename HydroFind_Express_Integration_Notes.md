# HydroFind Express Integration Notes

## Summary

This document explains the implementation work completed from Phase 1 through Phase 5 of the HydroFind plan. The work was executed in order, with each phase building on the previous one and preserving the repository's actual state instead of outdated assumptions.

The final architecture now follows the intended product flow:

- Expo + React Native app handles the mobile UI
- Firebase Authentication manages sign-in/sign-up
- Express in `server/` handles business logic and Firestore access
- Firestore is used only through the server-side Admin SDK
- Location tracking, mapping, and order status updates are exposed through API routes and app services/hooks
- React Navigation is used to route app screens by role and task

---

## Phase 1: Server hardening and Firestore setup

### Purpose

Phase 1 focused on the highest-risk backend issues and corrected the server-side security model before adding any location or navigation features.

### Main changes

#### 1. Rider signup code enforcement

The server now enforces a shared rider sign-up gate. In `server/src/routes/users.ts`, rider profile creation checks for `RIDER_SIGNUP_CODE` before accepting a rider account. If the code is missing or incorrect, the request is rejected with a 403 response.

This prevents arbitrary users from self-registering as riders without server-side permission.

#### 2. Profile creation no longer overwrites existing profiles

The app originally created user profiles using a write pattern that could overwrite data. The endpoint for `POST /api/users/me` was changed to create records instead of replacing them, preventing a logged-in customer from simply reusing the endpoint to escalate role access.

This addresses the core privilege escalation issue where a customer could call the route with `role: 'rider'` and become a rider in Firestore.

#### 3. Order validation tightened

The order creation route in `server/src/routes/orders.ts` now validates input before accepting a new order. This includes checks for:

- required order data
- valid location structure
- valid or bounded gallons quantity
- address and preferred time values
- consistent pricing values

These checks stop malformed or malicious client payloads from being stored.

#### 4. Restricted access to order details and cancellations

The server now restricts visibility and actions based on the authenticated user and current order state.

Examples:

- A user can only read their order or an assigned rider order when allowed
- Pending orders are not broadly visible to any authenticated user
- Cancellation is only allowed for pending customer-owned orders
- Delivered or completed orders cannot be canceled

These rules keep order information private and prevent invalid lifecycle operations.

#### 5. Added assigned/history endpoints

The order API now includes functionality to list assigned rider tasks and order history. This is critical for role-based screens and workflow continuity.

#### 6. Firestore rules and indexes were added

The repo includes:

- `firestore.rules`
- `firestore.indexes.json`

The rules were set to deny-all as a defensive baseline because the backend uses the Admin SDK and bypasses Firestore client rules in normal operation. The indexes cover the key order queries such as status and ownership filtering.

#### 7. Helper script and environment example

The project added:

- `server/.env.example`
- `scripts/Get-IdToken.ps1`

These help developers configure the backend environment and generate Firebase ID tokens for local API testing without hardcoding secrets in the repo.

#### 8. Validation

The server TypeScript validation was run with:

```bash
cd server
npx tsc --noEmit
```

This passed after the hardening changes.

---

## Phase 2: Express location-tracking API

### Purpose

Phase 2 added the live-tracking routes required for rider location updates, order pin movement, and ETA/distance calculations.

### Main changes

#### 1. Geo utility helpers were added

Files created/updated:

- `server/src/config.ts`
- `server/src/utils/geo.ts`

These define the station location, default movement assumptions, and the distance/ETA helpers used by the tracking API.

The tracking API continues to calculate its distance and ETA estimates as straight-line values. The shared customer and rider map uses OSRM road routes and selects the shortest-distance candidate it receives. Before a rider accepts an order, the route runs from the HydroFind station to the customer; once accepted, it runs from the rider's live location to the customer and is refreshed as the rider moves.

#### 2. Customer order-location update route

The API adds a route for changing a pending order location:

- `PATCH /api/orders/:id/location`

This allows the customer to update the delivery pin while the order still has a pending status. The route validates the coordinate payload and ensures the location change is only allowed for the correct order owner.

#### 3. Rider live-location push route

The API adds:

- `PUT /api/orders/:id/rider-location`

This lets the assigned rider send a live GPS update. The route validates the coordinate payload, checks that the rider owns the order, and enforces the correct order lifecycle state (`on_the_way`). It also includes a minimum push interval so the rider does not spam location updates.

#### 4. Tracking endpoint

The API adds:

- `GET /api/orders/:id/tracking`

This returns:

- current order status
- customer address and location
- rider location and movement metadata
- station location
- estimated distance in kilometers
- ETA in minutes
- server timestamp

This endpoint is designed for front-end polling and is used by the app tracking hooks. Map tracking polls once per second; the rider location watcher samples at that cadence and the server enforces a one-second minimum between accepted location writes.

#### 5. Route ordering was fixed

The order routes were carefully ordered so the more specific routes:

- `/pending`
- `/mine`
- `/assigned`
- `/history`

remain above the generic dynamic route `/:id`.

This prevents route shadowing and keeps the intended endpoint resolution consistent with Express routing behavior.

#### 6. Validation

The server TypeScript check was run again after the new route additions:

```bash
cd server
npx tsc --noEmit
```

and it passed.

---

## Phase 3: Client service and hook layer for location and tracking

### Purpose

This phase focused on making tracking usable before final UI wiring was complete. It created the app-side foundation for location access, API error handling, order mapping, and polling hooks.

### Main changes

#### 1. Location permission config was added

The Expo app config in `app.json` includes the location permission plugin so the app can request foreground location access when the user uses the order or tracking features.

This keeps permission handling in the app layer instead of storing it in a separate native file.

#### 2. Typed API error handling

`src/services/api.ts` was improved to throw a typed `ApiError` when the server responds with a non-OK HTTP status. This allows callers to respond differently to errors like 404, 409, or 429.

This also enforces a consistent pattern: app code receives a proper error object with an HTTP status rather than an untyped JSON or generic failure.

#### 3. Shared order types extended

`src/types/index.ts` was expanded to include:

- `Coord`
- tracking objects and payload structures
- rider location metadata
- status fields aligned with the server’s strings like `pending`, `on_the_way`, `delivered`, and `cancelled`
- address and preferred time fields on the order model

This aligned the API data model with the app’s screen and service layer.

#### 4. Order service additions

`src/services/orderService.ts` was extended with additional order endpoints, including:

- assigned orders
- history
- tracking lookups
- order status operations

This created the client service layer the screens and containers rely on later.

#### 5. New tracking and location service modules

Created:

- `src/services/trackingService.ts`
- `src/services/locationService.ts`

These modules wrap location permission access, GPS retrieval, reverse geocoding, and tracking API calls. They centralize the location logic so the rest of the app can remain presentation-focused.

#### 6. New hooks for tracking and GPS

Created:

- `src/hooks/useCurrentLocation.ts`
- `src/hooks/useOrderTracking.ts`
- `src/hooks/useRiderLocationBroadcast.ts`

These hooks expose app state for:

- current device coordinates
- reverse-geocoded address text
- current tracking payload
- rider location pushes

They also handle refresh and polling cycles in a simple, reusable way.

#### 7. UI order mapping was added

A new mapper was added at:

- `src/utils/orderMapper.ts`

This converts server order data into the UI-friendly order shape used by cards and screens. It also resolves the mismatch between API statuses and the UI status labels.

#### 8. UI status gap resolved

The UI definitions were updated to include `Cancelled` in the screen-level status enum and badge styling. The order card progress bar was corrected to use the proper width value.

#### 9. Rider signup code support in the app

The registration flow was updated so the app sends `riderCode` from the signup screen when the user chooses a driver profile. This matches the server’s `RIDER_SIGNUP_CODE` enforcement.

#### 10. Validation

The root TypeScript check was run:

```bash
npx tsc --noEmit
```

and it passed.

---

## Phase 4: Navigation and screen wiring

### Purpose

Phase 4 replaced the placeholder app flow with actual navigation and connected the screens to real functions and route names.

### Main changes

#### 1. React Navigation was installed

The following packages were installed via Expo:

- `@react-navigation/native`
- `@react-navigation/native-stack`
- `@react-navigation/bottom-tabs`
- `react-native-screens`

This matches the project’s actual architecture and the route names already used in the app, rather than trying to force a different stack or screen pattern.

#### 2. App root navigation was changed

`src/navigation/RootNavigator.tsx` now does the following:

- keeps the existing loading screen flow
- keeps the not-signed-in and profile-error handling intact
- wraps the app in `NavigationContainer`
- renders a customer or driver navigator depending on the user profile role
- keeps the logout bar below the navigator as required

This means the app now runs through valid role-based navigation rather than a single static screen.

#### 3. Customer and driver navigators were created

New files:

- `src/navigation/CustomerNavigator.tsx`
- `src/navigation/DriverNavigator.tsx`

These navigators define the bottom tabs used by the app:

- Home
- ViewOrders
- MapView
- History

They also expose stack screens such as `PlaceOrder`, `OrderDetails`, and the map-related routes expected by the app’s existing button handlers.

#### 4. Route parameter types were added

`src/navigation/types.ts` declares the route param lists for both customer and driver flows. This makes navigation type-safe and matches the route names the app already uses.

#### 5. Container wrappers were added

Created under `src/navigation/containers/`:

- `CustomerHomeContainer.tsx`
- `DriverHomeContainer.tsx`
- `MapContainer.tsx`
- `useAssigned.ts`

These connect the screens to API-backed data sources, while keeping the presentational screens themselves simple and reusable.

#### 6. Placeholder screens were created

The project now has actual screen files for the missing app features, including:

- `src/screens/Customer/PlaceOrderScreen.tsx`
- `src/screens/Shared/OrdersListScreen.tsx`
- `src/screens/Shared/OrderDetailsScreen.tsx`
- `src/screens/Shared/HistoryScreen.tsx`
- `src/screens/Shared/DevLocationTestScreen.tsx`

These are intentionally straightforward placeholders, but they are connected to real API actions such as create order, accept order, cancel order, deliver order, and fetch history.

#### 7. Map screen updated for live rider marker support

`src/screens/Driver/Driver-MapScreen.tsx` was updated to support an optional rider location and a moving rider marker in the Leaflet map. The line between rider and customer can replace the station-to-customer route while tracking is active.

This is the visual hook for the live-tracking feature introduced in Phase 2.

#### 8. Home screen route independence improved

`src/screens/HomeScreen.tsx` was updated so that it accepts a real `overview` prop while still keeping mocked data as a fallback default. This makes the customer home screen usable in both static and API-backed contexts.

#### 9. Validation

The implementation was validated with:

```bash
npx tsc --noEmit
npx expo lint
```

Both passed after the navigation work was finished.

---

## Phase 5: Security cleanup and documentation

### Purpose

The final phase cleaned up repository configuration and aligned the documentation with the actual project implementation.

### Main changes

#### 1. `.gitignore` corrected

The repository ignore file was cleaned so it properly preserves:

- `.env`
- `server/.env`
- `server/serviceAccountKey.json`
- `server/node_modules`

It also ensures that `.env.example` files remain trackable while the secret variants stay ignored.

#### 2. Root env example was added

A new file was created:

- `.env.example`

This includes the app-level Expo Firebase values and `EXPO_PUBLIC_API_URL` without storing any actual secret or deployment token.

#### 3. Server env example remains in place

`server/.env.example` is the backend config template for server-only values such as `RIDER_SIGNUP_CODE`.

#### 4. README updated to match the live app

The project README was rewritten from an older, stale description that referenced SQLite and old assumptions to the actual implemented stack:

- Expo + React Native
- Firebase Auth
- Express + Firestore backend
- React Navigation
- API route overview
- environment setup instructions
- local running steps

This makes the repository easier to understand for anyone onboarding to the project.

#### 5. Integration notes refreshed

`HydroFind_Express_Integration_Notes.md` was rewritten so it reflects the real codebase rather than the original template notes. It now describes the actual migration and the phases that were executed.

---

## Final validation summary

The project was validated at the end of the implementation phases using the following checks:

- root TypeScript check: `npx tsc --noEmit`
- root Expo lint: `npx expo lint`
- server TypeScript check: `cd server && npx tsc --noEmit`

All of these passed or were resolved with the project’s current automation setup.

---

## Final result

By the end of Phase 5, the project had the following working shape:

- secure Express backend with enforcement around rider sign-up and order lifecycle
- Firestore rules/indexes and env templates in place
- customer and rider location tracking endpoints implemented
- app-side service and hook layers for permissions, tracking, and API access
- React Navigation flow for the main app screens
- placeholder but functional screens and containers connected to real app actions
- current documentation aligned with the actual repo state

This brings the project from a partially wired prototype to a consistent Express + Firebase + React Native architecture that is ready for further screen polish and manual QA testing.
