# HydroFind Express Integration Notes

## Status

The project has been migrated to the Express + Firebase Admin architecture described in the implementation plan. The current app setup matches the repo state rather than older notes that described a different structure.

### Current architecture

- Mobile app: Expo + React Native + TypeScript
- Auth: Firebase Authentication in-app
- API: Express server in `server/`
- Database: Firestore via Admin SDK
- App layer: service + hook wrappers; no direct `firebase/firestore` usage in the client app

### Important files

- `server/src/index.ts` — Express entry point and middleware setup
- `server/src/routes/users.ts` — profile creation and rider enforcement
- `server/src/routes/orders.ts` — order lifecycle, access checks, tracking routes
- `src/services/api.ts` — shared API wrapper with typed errors
- `src/services/authService.ts` — auth and profile boundary
- `src/services/orderService.ts` — order operations
- `src/context/authContext.tsx` — app auth/profile state
- `src/navigation/RootNavigator.tsx` — signing-in and role-based navigation

### File naming updates vs. older notes

Older notes referred to a few files/folders that no longer exist in the same form. The current repo uses:

- `src/context/authContext.tsx` instead of `src/context/AuthContext.tsx`
- `src/screens/Driver/` and `src/screens/Customer/` instead of older screen folders
- `src/navigation/` for the route setup
- `server/.env.example` plus the root `.env.example` for configuration references

### Environment handling

The repo intentionally keeps environment values out of source control:

- `.env`
- `server/.env`
- `server/serviceAccountKey.json`

The repository includes `.env.example` files for local setup, but not secrets.

### Validation status

The app and server were validated with the project TypeScript checks after the migration work:

- Root TypeScript check: `npx tsc --noEmit` passed
- Server TypeScript check: `cd server; npx tsc --noEmit` passed

### Result

The implementation now reflects the actual project architecture: Firebase Auth + Express API + Firestore + React Navigation, with location and tracking layers wired into the mobile app flow.
