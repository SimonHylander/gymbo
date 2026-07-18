# 02 — Restrict the backend package to an explicit public surface

**What to build:** A developer importing from the backend package can reach the generated API,
the generated data model, and the shared validators — and nothing else. Attempting to import
a server-only backend internal fails at the import, rather than succeeding and then breaking
at runtime inside a client bundle.

The backend package currently declares no export surface at all, so any consumer can reach
any file inside it. Only two subpaths are actually imported anywhere in the repo today, so
the allowlist codifies existing usage rather than changing it.

This also removes the obsolete generated directory left behind inside the web app by the
backend extraction. It is untracked, referenced by nothing in source or configuration, and
contains permissively typed duplicates of the real generated types.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] The backend package exposes exactly three entry points: the generated API, the
      generated data model, and the shared validators
- [ ] No other module in the backend package is importable by a consumer
- [ ] The generated data model resolves for type imports; note in the ticket work that it has
      no runtime counterpart, so a value import cannot resolve
- [ ] The validators resolve as raw TypeScript, consistent with how the domain package
      exports its sources
- [ ] Both currently-used import paths across web and mobile continue to resolve unchanged
- [ ] The obsolete generated directory inside the web app is deleted
- [ ] Typecheck passes across all packages
