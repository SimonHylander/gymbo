# AI Web Boundary

Date: 2026-06-15

## Retired Chatbot Boundary

No `.gitmodules` entry, cloned chatbot repository, or replacement chat server package should be
introduced for this work.

## Identity And Principal (superseded 2026-07-07)

> **Supersedes** the "Dev Identity And Principal" decision of 2026-06-15, which mandated a
> server-owned hardcoded dev identity and forbade `ctx.auth.getUserIdentity()`. That decision's
> stated rationale — "production login is out of scope for this plan sequence" — expired when plan
> 014 introduced a second client (`apps/mobile`) for real users. What survives from the old
> contract: identity is still never client-supplied, and the `"dev"` principal still exists so
> local dev, seed scripts, and function tests run without tokens.

The principal seam is `requireUser(ctx)` in `packages/backend/convex/lib/principal.ts`. Every
Convex function resolves its user id through it; `userId` function args are forbidden. Two
adapters, selected by the deployment env var `AUTH_PROVIDER` (a server-owned switch, never client
input):

- **Clerk adapter** (`AUTH_PROVIDER=clerk`): `ctx.auth.getUserIdentity()` against the Clerk issuer
  configured in `packages/backend/convex/auth.config.ts` (`CLERK_JWT_ISSUER_DOMAIN` deployment env
  var, JWT template named `convex`). Unauthenticated calls are rejected. Use on deployments
  serving real users.
- **Dev adapter** (`AUTH_PROVIDER=dev`): honors a verified or test-injected identity when
  present, otherwise falls back to `DEV_USER_ID` (`"dev"`) from
  `packages/backend/convex/lib/devIdentity.ts`. This preserves what the old ADR protected — no
  Clerk tokens needed to run locally, seed, or test.

**Fail-closed since 2026-07-18** (spec 015): `AUTH_PROVIDER` must be explicitly `dev` or `clerk`;
any other value — unset included, near-miss typos included — raises at resolution instead of
falling back to the dev adapter. The trade-off is developer convenience against fail-safe
defaults. The old default-open switch let a deployment provisioned without the variable come up
looking healthy while attributing every caller's data to the single `"dev"` principal, and no
test could catch it: cross-user isolation tests pass trivially when every caller resolves to the
same user. A refused request is loud, immediate, and cheap to fix; a silently shared identity is
quiet, compounding, and discovered only after data has been misattributed — which is why the
silent-fallback failure mode was judged worse. The dev principal remains the local default by
explicit declaration rather than by omission: the linked dev deployment carries
`AUTH_PROVIDER=dev` (`bunx convex env set AUTH_PROVIDER dev` from `packages/backend`), the
backend vitest config declares it for function tests (which run with an empty environment), and
the example environment files document the variable.

All reads and writes are scoped per-principal through the `by_user` / `by_user_and_external_id` /
`by_user_and_status` indexes; foreign rows resolve as `NOT_FOUND`/`null`, asserted by the
cross-user isolation tests in `packages/backend/convex/principal.test.ts`.

Clients: web wraps the router in `ClerkProvider` + `ConvexProviderWithClerk` when
`VITE_CLERK_PUBLISHABLE_KEY` is set (falling back to plain `ConvexProvider` + `MOCK_USER`
otherwise, matching the dev adapter); mobile uses `@clerk/clerk-expo` with the same Convex
deployment.

Known gap: `apps/web/server/api/chat.post.ts` reads Convex via an unauthenticated
`ConvexHttpClient`, which resolves to the dev principal. Before any deployment sets
`AUTH_PROVIDER=clerk`, that route must forward the caller's Clerk token to Convex
(`client.setAuth(...)`) — plan this alongside the plans 007–009 chat reshape.

## API Route Convention

The web app uses TanStack Start with the Nitro Vite plugin in `apps/web/vite.config.ts`. The planned
same-origin streaming chat route file is:

`apps/web/server/api/chat.post.ts`

That route should own the `POST /api/chat` request once Plan 008 runs. It must establish the
server-side dev principal before constructing request-scoped services, binding the registry, or
adapting tools.

`apps/web/vite.config.ts` still proxies `/api` to `http://localhost:3001`. That proxy points at the
retired chatbot boundary and should be removed by Plan 008 only after the required in-app chat route
exists and the feature no longer needs that proxy.

## Existing Chat API Consumers

In scope for the routine-tool feature:

- `POST /api/chat`, called from `apps/web/src/hooks/use-active-chat.tsx`
- additional chat delete calls to `/api/chat` can remain deferred unless Plan 008 explicitly handles
  chat persistence

Deferred endpoints during the routine-tool migration:

- `/api/history`
- `/api/document`
- `/api/suggestions`
- `/api/vote`
- `/api/messages`
- `/api/files/upload`
- `/api/models`

While deferred, these endpoints remain current chat-product integration gaps. Plan 008 should change
only the chat POST path needed for routine tool execution unless a later decision expands scope.

## AI Runtime Ownership

Web-owned Gymbo AI modules live under:

- `apps/web/src/lib/ai/routine/*` for routine tool schemas, service, registry, and live Layers
- `apps/web/server/api/chat.post.ts` for request binding once Plan 008 runs

`packages/ai` remains provider-neutral and owns only reusable tool registry, adapter, validation,
execution policy, and testing primitives. Gymbo routine schemas, ports, registries, and live Layers
must not move into `packages/ai`.

Each `/api/chat` request must create fresh Vercel AI adapter policy state by calling
`createVercelAIAdapter().adapt(...)` once for that request. Request-scoped runtime and Convex
resources must be disposed by the route or naturally scoped to the request lifecycle.

## Verification Commands

- `git grep -n 'API_BASE}/api\\|/api/' -- apps/web/src`
- `bun run --filter=web test -- src/lib/ai/routine`
- `bun run --filter=web test`
- `bun run typecheck --filter=web`
- `bun run lint --filter=web`
- `bun run --filter=@workspace/ai test`
- `bun run typecheck`
