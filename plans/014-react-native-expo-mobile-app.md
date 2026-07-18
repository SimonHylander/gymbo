# 014 — React Native + Expo mobile app (`apps/mobile`) sharing the Convex backend

**Status:** Research / proposal (2026-07-05; revised 2026-07-06 — auth reframed as a
principal seam, `Id` coupling decision added, AI chat cut from mobile v1)

## TL;DR

The port is very feasible because the domain logic is already cleanly layered (pure
`domain/` modules + zustand stores + thin Convex adapters), and Convex's React client
works unchanged in React Native. Three obstacles were identified; the first two are
prerequisites regardless of mobile, the third is resolved by cutting chat from v1:

1. **The Convex backend lives inside `apps/web/convex`** — a second app can't import
   it. It needs to be promoted to `packages/backend` (which already exists as an empty
   scaffold).
2. **There is no real auth.** Every Convex function attributes data to a hardcoded
   `"dev"` user via `getDevUserId()` (`apps/web/convex/lib/auth.ts`). A mobile app for
   real users can't ship on that.
3. **The AI chat doesn't run on Convex at all** — it's a Nitro server route
   (`apps/web/server/api/chat.post.ts`) plus an external HTTP backend for chat
   persistence (`/api/history`, `/api/messages`, etc. behind `VITE_API_BASE_URL`).
   **Decision (2026-07-06): mobile v1 ships without AI chat**, so this does not block
   the port. See "Out of scope" below.

Ecosystem state (mid-2026): Expo SDK 56/57 with the New Architecture (mandatory) and
expo-router has first-class Bun-workspace monorepo support with zero manual Metro
config; Convex publishes an official Turborepo + Expo + Next.js monorepo template
proving the shared-`convex/`-package pattern.

## Current-state findings

### Repo layout

- Turbo + Bun workspaces (`apps/*`, `packages/*`), single app `apps/web`
  (TanStack Start + Vite + React 19).
- **7 of 10 `packages/*` dirs are empty scaffolds** (`backend`, `config`, `env`,
  `integrations`, `kk`, `mcp`, `native-ui`). Real packages: `@workspace/ai`
  (Effect-based AI tool registry, portable), `@workspace/core` (integrations toolkit,
  portable, currently unconsumed), `@workspace/ui` (web-only shadcn/Tailwind
  components).

### Convex

- Deployment dir: `apps/web/convex/` — no `convex.json`; pinned via `CONVEX_DEPLOYMENT`
  in `.env.local`.
- Web imports codegen via deep relative paths
  (`import { api } from "../../../../convex/_generated/api"`), e.g.
  `src/features/routines/adapters/query-keys.ts`,
  `src/lib/ai/routine/convex-routine-service.ts`. No tsconfig alias.
- Schema (`convex/schema.ts`), 8 tables: `exercises`, `routines`, `programs`,
  `programRoutines`, `routineExercises`, `workouts`, `workoutExercises`,
  `exerciseBiofeedback`. Already multi-user-shaped: `userId` + `by_user` /
  `by_external_id` indexes throughout. Shared validators in `convex/validators.ts`.

### Data access patterns in the web app

- Route loaders: `queryClient.ensureQueryData(convexQuery(...))` via
  `@convex-dev/react-query` (`src/features/routine/adapters/load-routine.ts`).
- Component reads: TanStack Query `useQuery` over `convexQuery` options, centralized in
  `src/features/routines/adapters/query-keys.ts`.
- Writes: plain `convex/react` `useMutation`, bundled into a `createWorkoutSync`
  adapter (`src/features/routine/adapters/sync-workout.ts`) driven by the zustand
  session store.
- Client setup in `src/router.tsx`: `ConvexQueryClient(VITE_CONVEX_URL)` +
  `ConvexProvider` + SSR query integration.

### Auth

- Mocked end to end: `src/lib/mock-auth.ts` (`MOCK_USER`, id `"dev"`) on the client;
  `convex/lib/auth.ts` → `getDevUserId()` → `DEV_USER_ID = "dev"` on the backend.
- No `auth.config.ts`, no `ctx.auth.getUserIdentity()`, no Clerk/Convex Auth anywhere.

### AI chat

- Client: AI SDK `useChat` (`@ai-sdk/react`) in `src/hooks/use-active-chat.tsx` with
  `DefaultChatTransport` → `/api/chat`; history/votes/documents via SWR against the
  external backend (`VITE_API_BASE_URL`); types shadowed in `src/lib/db/schema.ts`.
- Server: Nitro/h3 route `apps/web/server/api/chat.post.ts` — Effect
  `ManagedRuntime`, `streamText` via Vercel AI Gateway (default model
  `moonshotai/kimi-k2.5`), tools from `@workspace/ai`'s `createVercelAIAdapter` over
  the Gymbo tool registry (`src/lib/ai/routine/gymbo-registry.ts`); tools read Convex
  via `ConvexHttpClient` (`api.assistantRoutines.getByExternalId`).
- Convex stores **no** chat data; streaming is server-side HTTP, not Convex.
- Recorded as a finding only — chat is out of scope for mobile v1 (see "Out of
  scope"). Note `src/hooks/use-active-chat.tsx` is a ~307-line hook interleaving nine
  responsibilities (route state, transport, SWR persistence, `useChat`, cookie model
  selection, votes, auto-resume, deep links, toast/error UI) — it is **not** portable
  as-is, which reinforces the cut.

### Web-only surface (won't port)

- Entire artifacts subsystem: `src/artifacts/*`, `src/lib/editor/*` (ProseMirror),
  CodeMirror console, Pyodide script tag in `src/routes/_chat.tsx`, react-data-grid
  sheet editor, diff-match-patch diffview.
- Rendering/UX deps needing RN equivalents: streamdown/shiki/katex (markdown),
  radix/shadcn, framer-motion, sonner, next-themes, cmdk, use-stick-to-bottom, swr.

### Portable surface (ports nearly as-is)

- `src/features/routine/domain/*` (workout lifecycle state machine, rest timer,
  exercise log, selectors, joint pain — with tests).
- `src/features/routine/store/create-routine-session-store.ts` (zustand session store)
  and `store/routine-session-context.tsx` hooks.
- `src/features/routine/sync/workout-session-sync.ts` (debounced Convex sync queue —
  only its DOM flush triggers `pagehide`/`visibilitychange` need abstraction).
- `src/features/routines/domain/*`, `src/lib/rep-target.ts`,
  `src/lib/rest-duration-options.ts`.
- `@workspace/ai` and `@workspace/core` (no DOM, no react-dom).

## Target architecture

```
gymbo/
├── apps/
│   ├── web/                      # unchanged surface, loses its convex/ dir
│   └── mobile/                   # NEW: Expo app (expo-router)
├── packages/
│   ├── backend/                  # NEW CONTENT: Convex deployment (moved from apps/web/convex)
│   │   ├── convex/               #   schema, functions, _generated, auth config
│   │   └── package.json          #   exports ./convex/_generated/api etc.
│   ├── domain/ (or grow core/)   # NEW: portable workout logic extracted from apps/web/src/features
│   ├── ai/                       # existing, already portable
│   ├── core/                     # existing integrations toolkit, portable
│   ├── ui/                       # existing web-only components (stays web-only)
│   └── native-ui/                # populate the empty scaffold with RN components
```

Principle: **one Convex deployment, one generated `api` object, two thin clients.**
No hand-rolled API abstraction over Convex — the generated `api` + validators *is* the
shared, end-to-end-typed API layer. The thing worth sharing above it is domain logic,
not another transport wrapper.

## Workstream 1 — Extract `packages/backend` (prerequisite, small)

Convex-official monorepo pattern
([template](https://github.com/get-convex/turbo-expo-nextjs-clerk-convex-monorepo)).

- Move `apps/web/convex/` → `packages/backend/convex/`, along with `CONVEX_DEPLOYMENT`
  and the `convex dev` responsibility. `package.json` name `@workspace/backend`,
  exporting `./convex/_generated/api`, `./convex/_generated/dataModel`,
  `./convex/validators`.
- Replace all deep relative codegen imports in `apps/web` with
  `import { api } from "@workspace/backend/convex/_generated/api"` (mechanical
  find-and-replace).
- `convex dev` runs in `packages/backend` (turbo `dev` task, `persistent: true`); web
  just runs Vite.
- Add package `typecheck`/`lint` tasks to `turbo.json` so `^build` ordering holds.

## Workstream 2 — A real principal seam (prerequisite)

> **ADR conflict — deliberately reopened.** `docs/architecture/ai-web-boundary.md`
> ("Dev Identity And Principal", 2026-06-15) forbids `ctx.auth.getUserIdentity()` and
> mandates the server-owned dev identity helper. Its rationale — "production login is
> out of scope *for this plan sequence*" — expires the moment a second client for real
> users exists. Executing this workstream **must** supersede that ADR section with a
> new decision (recording why, and what of the old contract survives), not silently
> violate it.

Honest sizing first: the current "auth layer" is cosmetic. `getDevUserId()` has only
5 call sites, **none on the hot read/write path** — e.g. `convex/workouts.ts` queries
by `by_routine_and_status` / `by_external_id` with no user filter at all, and
`convex/exerciseBiofeedback.ts` accepts a **client-supplied** `userId` arg (violating
the existing ADR's own "no client-supplied identity" rule). So this is not "thread a
helper through existing scoping" — per-user scoping of reads and writes is **net-new
work**, even though the schema (`userId` + `by_user` indexes) is ready for it.

Shape: one deep **principal-resolution module** in `packages/backend/convex/lib/`,
interface `requireUser(ctx): UserId`, with **two adapters** (two adapters = the seam
is real, not a rename):

- **Dev identity adapter** — preserves today's `"dev"` principal for local dev, seed
  scripts, and Convex function tests, so nothing requires Clerk tokens to run. This
  keeps what the old ADR was actually protecting.
- **Clerk identity adapter** — `ctx.auth.getUserIdentity()` against the Clerk issuer.
  Provider choice: **Clerk + `ConvexProviderWithClerk`** — the one provider with
  mature SDKs on both clients (`@clerk/tanstack-react-start` for web,
  `@clerk/clerk-expo` with `expo-secure-store` token cache for mobile); it's what
  Convex's monorepo template uses. Convex Auth is the lighter alternative but its RN
  story is less battle-tested.

Work items:

- Add `packages/backend/convex/auth.config.ts` trusting the Clerk issuer.
- Build `requireUser(ctx)` + the two adapters; selection must be a server-owned
  switch (deployment env), never client input.
- **Delete the client-supplied `userId` arg** from `exerciseBiofeedback.ts` (both
  occurrences); identity only ever comes from the seam.
- Scope every read/write through the principal: `workouts.ts`, `routines.ts`,
  `programs.ts`, `exercises.ts`, `workoutExercises.ts`, `exerciseBiofeedback.ts`,
  `assistantRoutines.ts` — switching queries to the `by_user` / `by_user_and_status`
  indexes. One-time migration of existing `"dev"` rows optional.
- The seam is the test surface: add Convex function tests asserting cross-user
  isolation ("user A cannot read user B's workout") against `requireUser` with the
  dev adapter plus a fake identity.
- Web swaps `MOCK_USER` for the real session.
- Rewrite the "Dev Identity And Principal" section of
  `docs/architecture/ai-web-boundary.md` to record the new decision.

## Workstream 3 — Extract shared domain into `packages/`

Aim the reusable layer at **domain logic, not API transport**. Extract into
`packages/domain` (or a `workout` subpath of `packages/core`), depending on
`@workspace/backend` for types only:

- `src/features/routine/domain/*`
- `src/features/routine/store/create-routine-session-store.ts`
- `src/features/routine/sync/workout-session-sync.ts` — extract flush triggers behind
  an injected interface (web: DOM `pagehide`/`visibilitychange`; mobile: RN `AppState`)
- `src/features/routines/domain/*`
- `src/lib/rep-target.ts`, `src/lib/rest-duration-options.ts`

Stays per-app: adapters (`convexQuery`/loader glue on web; plain `convex/react` hooks
on mobile) and all UI. On mobile, **drop `@convex-dev/react-query` entirely** — it
bridges Convex into TanStack SSR/loaders; in Expo, plain `useQuery`/`useMutation` from
`convex/react` are simpler and fully reactive.

### Decision — the `Id` type coupling

The one dependency that travels with every shared module is the **type-only**
`Id<"...">` import from `convex/_generated/dataModel` (present in
`workout-session-sync.ts:7`, the `sync-workout.ts` mutations façade, and the store
factory). This single line decides the domain package's interface:

- **(a) Depend on `@workspace/backend` for types (chosen default).** Simplest and
  end-to-end typed; the coupling is compile-time only, `_generated` is committed, and
  turbo already orders `^build`. Cost: `packages/domain` can never typecheck or test
  without codegen having run.
- **(b) Branded string ids in the domain package.** The mutations façade
  (`createWorkoutSync` — already a thin, deliberately shallow anti-corruption adapter)
  does the cast at the seam. Buys a codegen-free domain: the whole workout engine
  typechecks and tests with no Convex deployment or generated files. Cost: a second id
  vocabulary to maintain, slightly weaker typing.

**Take (a) now; the escape hatch to (b) is already built.** Because every `Id` crosses
through the façade anyway, switching to branded ids later is confined to the façade
plus type aliases — no behavioral change. Revisit if codegen ordering ever bites CI
(plan 006's test gate is the likely trigger).

## Workstream 4 — The Expo app (`apps/mobile`)

- **Expo SDK 57**, New Architecture (mandatory), **expo-router** (SDK 56+ removed
  direct `@react-navigation/*` imports — use expo-router re-exports), strict TS.
- **Monorepo:** `expo/metro-config` auto-detects Bun workspaces — no manual
  `watchFolders`/`nodeModulesPaths`. SDK 54+ supports isolated installs if hoisting
  bites.
- **EAS dev builds** (`expo-dev-client`), not Expo Go — needed for Clerk and native
  modules. Set up `eas.json` (development/preview/production) from day one.
- **Convex wiring:** `ConvexReactClient` with `EXPO_PUBLIC_CONVEX_URL`, wrapped in
  `ConvexProviderWithClerk` in `app/_layout.tsx`. Same deployment, same `api` from
  `@workspace/backend`.
- **Styling:** NativeWind v5 (shares Tailwind tokens + `cn` idiom with web);
  `packages/native-ui` holds RN primitives (buttons, cards, sheets, pickers). Rebuild
  only the ~10 primitives actually needed — radix/shadcn does not port.
- **RN equivalents:** framer-motion → react-native-reanimated; sonner → sonner-native;
  next-themes → `useColorScheme` + context; use-stick-to-bottom → inverted
  FlatList/LegendList patterns.

v1 screens mirror the web routes: routines list, routine detail/template editor, and
the **live workout logging screen** (logic arrives free from `packages/domain`).
Mobile-specific additions:

- `expo-keep-awake` during an active workout.
- **Rest timer in background:** JS timers suspend when backgrounded — schedule a local
  notification (`expo-notifications`) at rest-end and reconcile timer state from
  timestamps on foreground via `AppState`. Verify the rest-timer domain logic is
  timestamp-based, not tick-counting; fix if not.
- `expo-haptics` on set completion / timer end.
- Sync flush on `AppState` background transition (injected interface from
  Workstream 3).

## Out of scope for mobile v1

- **AI chat — cut entirely from the mobile launch (decision 2026-07-06).** The mobile
  app ships as a workout/routines client only. No chat screen, no chat transport, no
  chat persistence work on mobile. When chat is revisited post-launch, note: the AI
  SDK supports Expo (`useChat` via `expo/fetch` streaming), but the web chat surface
  is being reshaped by plans 007–009 first, and `use-active-chat.tsx` needs
  decomposition before anything can be shared — plan that work then, not now.
- **The artifacts subsystem** (text/code/sheet editors, Pyodide console, diffview) —
  deeply web-native, not a mobile-shaped feature.

## Suggested build order

1. **`packages/backend` extraction** — unblocks everything; web keeps working
   identically.
2. **Principal seam** (Workstream 2: `requireUser` + dev/Clerk adapters, per-user
   scoping sweep, ADR supersession) — while there's still only one client to update.
3. **Scaffold `apps/mobile`** — Expo 57 + expo-router + EAS dev build + Convex + Clerk
   sign-in; prove one `useQuery(api.programs.listWithRoutines)` renders on device.
4. **Extract `packages/domain`** from `src/features/*/domain|store|sync` (existing
   tests are the safety net; `Id` policy: option (a) above).
5. **Build the three core screens** with `packages/native-ui`, including keep-awake,
   notification-backed rest timer, AppState sync.

## Sources

- [Expo: Work with monorepos](https://docs.expo.dev/guides/monorepos/)
- [Expo SDK 56 beta changelog](https://expo.dev/changelog/sdk-56-beta)
- [Expo: React Native's New Architecture](https://docs.expo.dev/guides/new-architecture/)
- [Convex React Native quickstart](https://docs.convex.dev/quickstart/react-native)
- [Expo: Using Convex](https://docs.expo.dev/guides/using-convex/)
- [Convex Turborepo + Expo + Next.js + Clerk monorepo template](https://github.com/get-convex/turbo-expo-nextjs-clerk-convex-monorepo)
- [AI SDK: Getting started with Expo](https://ai-sdk.dev/docs/getting-started/expo)
