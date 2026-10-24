# Project Fix Log

Date: 2026-10-25

## Changes

- Restored the Expo registration entry point in `index.ts`; the previous file contained unrelated Node agent code and imported a missing `./promisify` module.
- Restored Expo and server TypeScript configurations. The mobile app now uses Expo's base config, and the server explicitly includes Node types.
- Reworked shared map route state so it resets based on the active order without setting React state synchronously inside an effect.
- Converted the navigation parity checks to Node's built-in test runner, added the `npm test` script, and excluded the test folder from the mobile app's TypeScript build.
- Added the missing SDK 57-compatible `expo-font` dependency and Expo config plugin.
- Replaced the duplicated app-module script in `android/build.gradle` with the Expo SDK 57 root Gradle configuration and declared the Google Services plugin used by the app module.
- Updated the rider-code comparison buffers to satisfy the server's Node type definitions while retaining `timingSafeEqual`.
- Restored ignores for Expo state, dependencies, build output, local environment files, service-account credentials, and IDE files.
- Removed trailing whitespace reported in `src/navigation/types.ts`.

## Validation

- `npm run lint` - passed.
- `npx tsc --noEmit` - passed.
- `npm --prefix server run typecheck` - passed.
- `npm test` - passed (3 navigation parity checks).
- `npx expo config --type public` - passed.
- Expo asset path checks - passed (6 configured file paths).
- Android Gradle configuration (`gradlew.bat -p android help --no-daemon`) - passed.
- `git diff --check` - passed.

## Remaining notices

- Expo Doctor reports that the existing `android/` project may not be synchronized with `app.json` unless the build pipeline runs Prebuild. The native project was not regenerated because that could overwrite local Android work.
- Gradle reports deprecated features that may become incompatible with Gradle 10.
- The Expo dependency install reported 9 high-severity npm advisories; dependency auditing/fixes were not part of this pathing and syntax repair.

## Server startup repair (2026-10-25)

- Reproduced the server startup failure and found the installed `server/node_modules/jwks-rsa` package was incomplete: `src/index.js` required `src/wrappers/request.js`, which was absent.
- Reinstalled the server dependencies from the existing lockfile with `npm ci`. No server package manifest or lockfile changes were needed.
- Verified `jwks-rsa` and `firebase-admin` load, the server typecheck passes, and `npm run dev` starts and serves its API.
- The server dependency install reports 9 npm advisories (8 moderate, 1 high); no audit fix was applied as part of repairing the incomplete install.
