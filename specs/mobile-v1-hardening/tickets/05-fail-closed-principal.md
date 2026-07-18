# 05 — Make Principal resolution fail closed

**What to build:** A deployment that does not state which Principal adapter it uses refuses to
serve requests, rather than quietly falling back to a single shared identity. A maintainer
provisioning a new deployment and forgetting the configuration finds out immediately, before
any data is written, instead of discovering months later that every user's Workouts were
attributed to one Principal.

Resolution currently treats one exact string as "authenticated" and everything else —
including unset, and including a typo — as permission to use the development Principal. That
fails in the direction of data leakage, and no test can catch it, because cross-user isolation
tests pass trivially when every caller is the same user.

The development Principal remains the local default, but by explicit declaration rather than
by omission. Nothing about the two adapters themselves changes.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] The identity configuration must be explicitly one of the two known adapter values
- [ ] Any other value, including unset and including near-miss typos, raises rather than
      falling back
- [ ] The development Principal still resolves without tokens once declared, so local
      development, seed scripts, and function tests keep working
- [ ] The backend test setup declares the development adapter explicitly, since function tests
      run with an empty environment
- [ ] The backend package's example environment file documents the variable
- [ ] Local environment files for both clients are updated
- [ ] The variable is set on the currently linked deployment — WITHOUT THIS the app starts
      failing every request the moment this ticket deploys, which is expected and is the whole
      point of the change
- [ ] Existing cross-user isolation tests still pass
- [ ] New coverage asserts that an absent or unrecognised configuration raises
- [ ] The decision is recorded in the architecture document that already owns identity,
      extending the section that superseded the original dev-identity decision — not as a new
      numbered document, since this repo records decisions as prose sections
- [ ] The record states the trade-off: developer convenience against fail-safe defaults, and
      why the silent-fallback failure mode was judged worse
