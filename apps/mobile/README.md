# Gymbo mobile

Expo (SDK 57) app targeting **Expo Go**. There is no native build cycle in this
scope: start the dev server and open the app in Expo Go on a device or simulator.

```bash
bun run dev   # expo start
```

The app runs against the development Principal on the linked Convex deployment
(`EXPO_PUBLIC_CONVEX_URL` in `.env.local`), so no sign-in is required.

## Dependency notes

- Package versions are reconciled to the SDK with `bunx expo install --fix`.
  Expo Go ships fixed native modules for its SDK, so JavaScript version drift
  produces confusing runtime failures rather than tolerable warnings — keep
  versions matched and verify with `bunx expo-doctor`.
- `expo-auth-session` is a direct dependency because `@clerk/clerk-expo`
  requires it as a peer. The auth provider is dormant in this scope, but the
  library is already in the module graph, so its peer must be present.
- `expo-dev-client` is deliberately **not** installed. Its presence switches the
  dev server out of Expo Go mode, which would fight the chosen workflow on
  every launch.
- The monorepo installs with bun's hoisted linker (`linker = "hoisted"` in the
  root `bunfig.toml`). Bun 1.3's default isolated linker materializes one copy
  of a package per peer-dependency set, which expo-doctor reports as duplicate
  native modules and Metro would bundle more than once.

## Native build profiles (eas.json) — unbuildable, on purpose

The profiles in `eas.json` are left exactly as written and are **not currently
buildable**:

- The `development` profile sets `developmentClient: true`, but `expo-dev-client`
  is intentionally absent (see above), so the build has nothing to launch.
- The `production` profile declares no `EXPO_PUBLIC_CONVEX_URL`, so a production
  build would have no backend to talk to.

They are documented rather than edited because no native build is being
produced in this scope; fixing a profile for a build that is never run would
only have to be reverted. They become relevant when the authenticated scope
(Clerk provider, real deployment configuration) is taken on.

## Known gap: background rest timer is unvalidated

The rest timer schedules a local notification for rest-end and reconciles from
timestamps when the app returns to the foreground. All `expo-notifications`
calls are written defensively and degrade to no-ops, so Expo Go's reduced
notification support cannot crash the app — but a silently no-op scheduler is
indistinguishable from a working one until the app is actually backgrounded on
a device. This path has **not** been validated in this round; the foreground
timestamp reconciliation is the behavior that is relied upon. Accepted as a
known gap, not solved.
