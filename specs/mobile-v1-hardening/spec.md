# 015 — Mobile v1 hardening: completion integrity, fail-safe identity, and verification gates

**Status:** Spec (2026-07-18) — follow-up to plan 014, scoped to a single-user Expo Go build

## Problem Statement

I finished a workout on my phone and the last set I logged was missing from my history.

When I tap "Finish workout" immediately after entering a set, the app dispatches the save
and the completion at the same time without ordering them. A Workout is immutable once
completed, so the save can arrive too late and be rejected. I see a "Sync error" alert, but
the app navigates me back to the routine screen anyway, so it looks like the workout ended
normally. The set is gone and nothing tells me which one, or that the Workout is in fact
still ongoing.

Separately, the backend currently treats a missing identity configuration as permission to
fall back to a single shared Principal. That is intentional for local development, but it
fails in the wrong direction: a deployment provisioned without the variable comes up looking
healthy while attributing everyone's data to one user. Nothing in the test suite can catch
this, because cross-user isolation tests pass trivially when every caller is the same user.

Finally, the mobile app cannot be verified. It has no tests, its lint command has no
configuration, and the repo-wide lint gate fails outright because two packages declare lint
scripts they cannot run.

## Solution

Finishing a Workout waits for every in-flight write to settle before completing it. If any
of those writes fails, the Workout does not complete, the app stays on the workout screen,
and the existing error alert explains why — so the state you see always matches the state
that was saved.

Identity configuration becomes fail-closed. A deployment must state which Principal adapter
it uses; one that says nothing refuses to serve rather than silently sharing an identity.

The mobile app runs in Expo Go against the development Principal, with its dependency
versions reconciled to the SDK so runtime failures stop being mysterious, and the repo-wide
lint and test gates go green on work that is actually checked.

## User Stories

### Workout completion integrity

1. As a lifter, I want the set I just logged to be saved before my workout is marked
   finished, so that my training history is complete.
2. As a lifter, I want to tap "Finish workout" immediately after typing a set without
   waiting or guessing, so that I do not have to pause at the end of a session.
3. As a lifter, I want a Workout that failed to finish to remain ongoing, so that I can
   retry rather than lose the session.
4. As a lifter, I want to stay on the workout screen when finishing fails, so that I can see
   my logged sets and try again.
5. As a lifter, I want the error alert I already receive to correspond to what actually
   happened, so that I can trust the app's feedback.
6. As a lifter, I want a set I added or removed just before finishing to be preserved, so
   that structural edits are as safe as value edits.
7. As a lifter, I want the exercise I was last viewing to be recorded before the Workout
   completes, so that a resumed or reviewed session opens where I left off.
8. As a lifter, I want to finish a Workout from the joint-pain check-in flow with the same
   guarantees as the main finish button, so that the safe path does not depend on which
   route I took.
9. As a lifter, I want a Workout that completed successfully to navigate me back as it does
   today, so that the fix costs me nothing in the normal case.
10. As a lifter with a slow connection, I want finishing to wait for my writes rather than
    race them, so that poor network degrades speed rather than correctness.

### Identity and deployment safety

11. As a maintainer, I want a deployment with no identity configuration to refuse requests,
    so that misconfiguration is loud rather than silent.
12. As a maintainer, I want to state the Principal adapter explicitly per deployment, so
    that the identity model of any environment is readable from its configuration.
13. As a maintainer, I want a typo in the identity configuration to fail rather than fall
    back, so that near-miss values cannot open up a deployment.
14. As a maintainer, I want local development and seed scripts to keep working without
    tokens, so that the development Principal remains usable day to day.
15. As a maintainer, I want the backend function tests to run without external credentials,
    so that the test suite stays hermetic.
16. As a maintainer, I want the reasoning behind fail-closed identity recorded as a
    decision, so that a future reader does not "simplify" it back to a default.
17. As a maintainer, I want the example environment file to list the identity variable, so
    that a new deployment is configured correctly the first time.

### Mobile development environment

18. As a developer, I want the mobile app to run in Expo Go, so that I can iterate without a
    native build cycle.
19. As a developer, I want dependency versions reconciled with the SDK, so that runtime
    failures are caused by my code rather than version drift.
20. As a developer, I want duplicate native modules resolved, so that the bundler does not
    load two copies of the same module.
21. As a developer, I want the authentication library's peer dependency present, so that the
    module graph is complete even while the provider is dormant.
22. As a developer, I want the mobile app to keep running against the development Principal,
    so that no sign-in is required for a single-user build.
23. As a developer, I want the unbuildable native build profile documented rather than
    silently edited, so that its state is honest until it is actually needed.

### Verification and repo hygiene

24. As a developer, I want a test that fails against the current completion behavior, so
    that the regression is genuinely pinned rather than assumed.
25. As a developer, I want the test for finishing to assert ordering rather than mere
    invocation, so that it cannot pass while the defect is live.
26. As a developer, I want a test covering a failed completion, so that the outcome contract
    the mobile screen depends on is guaranteed.
27. As a developer, I want the repo-wide lint command to pass, so that its output is a
    signal rather than noise.
28. As a developer, I want every TypeScript package to be linted, so that the newest code is
    not the only unchecked code.
29. As a developer, I want one shared lint configuration, so that a rule change is made once.
30. As a developer, I want the mobile app linted with React Native rules, so that
    platform-specific mistakes are caught.
31. As a developer, I want the backend package to expose only its intended public surface, so
    that server-only modules cannot be imported into a client bundle.
32. As a developer, I want the obsolete generated directory left over from the backend
    extraction removed, so that stale types cannot be imported by accident.

### Shared vocabulary

33. As a contributor, I want the workout vocabulary written down, so that reviews argue about
    behavior rather than terminology.
34. As a contributor, I want the word for unacknowledged writes to be distinct from the two
    existing meanings of "pending", so that the ambiguity that hid this defect does not recur.
35. As a contributor, I want the immutability rule for a completed Workout stated explicitly,
    so that it is understood as an invariant rather than an incidental check.

## Implementation Decisions

### Vocabulary

The glossary gains the workout terms, which are used throughout this spec and should be used
in code and review:

- **Program** — an ordered collection of Routines.
- **Routine** — a reusable template: a named, ordered list of exercises with targets. Not a
  record of anything that happened.
- **Workout** — a single execution of a Routine by one user. Moves pending → ongoing →
  completed, and is immutable once completed.
- **Exercise Log** — the record of one exercise within a Workout: its Sets plus a completed
  flag.
- **Set** — one entry in an Exercise Log: weight, unit, reps, and a status.
- **Principal** — the user identity a backend function attributes data to. Resolved
  server-side only, never from client arguments.
- **In-flight write** — a mutation dispatched to the backend whose result has not yet been
  received. Deliberately not called "pending."
- **Drain** — waiting for all in-flight writes to settle. Completing a Workout drains first,
  because a completed Workout is immutable.

The existing `pending` values in the schema — one meaning a Workout that has not started, one
meaning a Set that has not been logged — are **not** renamed. Renaming would be a migration
across two tables to fix a readability problem. Both meanings are documented instead, and
"in-flight" is reserved for the new concept so the collision stops growing.

### Completion ordering

The workout session sync module tracks its in-flight writes and exposes a drain. Completing a
Workout drains before issuing the completion, and abandons completion if any drained write
rejected. The decision-relevant shape:

```ts
// flushAllLogs becomes awaitable; stopWorkout reports an outcome
flushAllLogs: () => Promise<void>   // resolves when in-flight writes settle
stopWorkout: () => Promise<boolean> // false when the Workout did not complete
```

Tracking covers **every** mutation the sync module issues — log updates, active-exercise
updates, set additions, set removals, and applying a previous Set — not only log updates. The
audit reported this as a defect in one call path; it is a property of the module's
fire-and-forget dispatch style and is fixed as such.

Rejected alternatives, recorded because they are the obvious questions a reader will ask:

- **Relaxing the server-side guard** to accept writes against a recently completed Workout.
  Rejected: a completed Workout's immutability is a genuine invariant and the thing currently
  protecting history from late-arriving writes. Trading it to paper over client ordering is
  the wrong direction, and it would leave the same race live for structural set edits.
- **Making completion atomic on the server** by having it accept the final Exercise Logs and
  write them in the same transaction as the status change. This is the more robust option and
  is self-healing when earlier writes were lost. Rejected for this scope because it makes the
  client's local state authoritative over the server's at completion time — a larger semantic
  commitment than a single-user build warrants. Revisit if offline support is taken on.
- **A serial command queue** for all session mutations. Rejected: most of its benefit is
  captured by tracking all mutations for the drain, at a fraction of the cost, and
  serialization would remove the concurrency that makes multi-exercise logging feel instant.

### Completion failure reporting

The session store's finish action returns whether the Workout completed. The mobile workout
screen navigates back only on success. The error message itself is already surfaced through
the store's sync-error callback into a native alert — that wiring is correct and unchanged.
What was missing was the *outcome*, not the message; the stale comment claiming otherwise is
corrected.

The joint-pain lifecycle flow, which also finishes Workouts, consumes the same outcome. The
store deliberately does not throw: the lifecycle module is pure domain code with no error
vocabulary, and introducing exception handling there to fix a navigation defect would be
disproportionate.

Navigation remains promise-driven rather than driven by observed Workout status. Status-driven
navigation is more robust and is the right choice at larger scope, but it requires a
navigation effect on a screen that has none, with its own re-entrancy hazards.

### Principal resolution

The Principal switch becomes fail-closed. The identity variable must be explicitly `dev` or
`clerk`; any other value, including unset, raises an error at resolution. The two adapters and
their behavior are otherwise unchanged, and the development Principal remains the local
default by explicit declaration rather than by omission.

This requires the variable to be set on the linked development deployment, in the backend
package's example environment file, in local environment files for both clients, and in the
backend test setup, since function tests run with an empty environment.

This decision is recorded in the existing architecture document that already owns identity,
extending the section that superseded the original dev-identity decision. It is not a new
document: this repo records decisions as prose sections in its architecture docs, and a
parallel numbered-ADR convention would fragment the record.

### Package boundaries

The backend package declares an explicit export allowlist: the generated API, the generated
data model, and the shared validators. Nothing else is importable. This matters more after the
identity change than before — the principal module now reads deployment configuration and
raises when it is absent, so an accidental import of backend internals into a client bundle
would fail at module load in an environment where that configuration will never exist. An
allowlist makes that import impossible to write rather than merely unwise. A wildcard export
was rejected for re-exposing exactly the internals worth hiding.

Two properties worth knowing: the generated data model is types-only with no runtime file, so
only type imports resolve; and the validators are raw TypeScript with no build step, exported
the same way the domain package exports its sources.

The obsolete generated directory left inside the web app by the backend extraction is deleted.
It is untracked and referenced by nothing in source or configuration.

### Shared lint configuration

A shared configuration package exposes two variants: a base for TypeScript packages and a
React Native variant for the mobile app. All seven consumers migrate onto it — web, UI, core,
AI, backend, domain, and mobile.

The four existing configurations are currently byte-identical re-exports of an external
preset, so migration is mechanical. The React Native variant is what justifies the package
existing: without genuine divergence a shared wrapper is pure indirection, and the mobile
app's platform rules are the first real divergence.

Shared TypeScript configuration is explicitly **not** included. Each package's compiler
configuration differs for real reasons — platform libraries, JSX transform, backend runtime —
and reconciling them is a separate exercise that should not ride along with a lint fix.

### Mobile runtime target

The mobile app targets Expo Go rather than a native development build for this scope. The
development client dependency is deliberately **not** added, because its presence switches the
dev server out of Expo Go mode and would fight the chosen workflow on every launch.

Because Expo Go ships fixed native modules for its SDK, matching JavaScript package versions
matters more here than in a native build: drift produces confusing runtime failures rather
than tolerable warnings. Versions are reconciled to the SDK, duplicate native modules resolved,
and the authentication library's peer dependency added despite the provider being dormant,
since it is already in the module graph.

The native build profiles are left exactly as written and documented as unbuildable until the
authenticated scope is taken on. Editing a profile to match a build that is not being produced
would only have to be reverted.

**Known gap accepted by this decision:** the background rest-timer path is not validated in
this round. The timer schedules a local notification at rest-end and reconciles from
timestamps on foreground. All notification calls are already written defensively and degrade
to no-ops, so Expo Go's reduced notification support cannot crash the app — but a silently
no-op scheduler is indistinguishable from a working one until the app is backgrounded. This is
accepted, not solved.

## Testing Decisions

A good test here asserts behavior an external caller can observe — that finishing a Workout
does not complete it until in-flight writes have settled, and that a failed completion reports
failure. It does not assert how the sync module tracks its writes, how many promises it holds,
or in what internal order it clears its debounce timers. Those are implementation details and
pinning them would make the module hard to change without making it more correct.

**One seam, already present.** The session store factory accepts its mutations through an
injected reference, so a test can construct a store with a fake mutations object whose promises
resolve on command, drive it through store actions, and observe outcomes. This is the highest
point that covers both changes — the drain ordering and the returned outcome — and it requires
no new seam. New coverage is written here.

The tests to add:

- Logging a Set and finishing before its write resolves must not complete the Workout until
  that write resolves. This must fail against current behavior; a test using immediately
  resolving mocks cannot detect the defect, which is precisely why the existing test passes
  while the defect is live.
- A rejected in-flight write must leave the Workout ongoing and report failure from the finish
  action.
- A successful finish must complete the Workout and report success, so the normal path is
  pinned against over-correction.
- Structural set edits dispatched immediately before finishing must be drained on the same
  terms as log writes.

Prior art: the existing sync-module tests establish the fake-mutations pattern, the session
snapshot builders, and fake timer handling for the debounce; the lifecycle tests establish
store-level action driving. The existing sync tests are retained as-is rather than rewritten —
they cover behavior that has not changed — but new coverage prefers the store seam. Their
stale header comment, which references the pre-extraction path, is corrected.

Backend identity keeps its existing function-test seam: the principal tests already exercise
adapter selection with injected identities. They gain coverage that an absent or unrecognized
configuration raises rather than falling back, and their setup declares the development
Principal explicitly.

**Not built:** a React Native test harness for the mobile app. Standing one up means resolving
transform configuration disagreements between the RN toolchain and the test runner, and what
it would buy is coverage of a single conditional whose contract is already pinned at the store
seam. The mobile app therefore ships this round with no tests — a deliberate scope decision,
not an oversight.

## Out of Scope

- **Authenticated deployment.** Provisioning the identity provider, populating client keys,
  and switching the deployment to the authenticated adapter. The fail-closed switch is built
  and recorded here; flipping it is a separate round.
- **Unauthenticated route handling.** The home screen calls a protected query immediately with
  no loading gate or sign-in redirect. This is only reachable with the authenticated adapter
  enabled, so it is deferred with it, and it is a genuine blocker for that round.
- **The Routine template editor.** Plan 014 called for a detail and template editor; mobile
  renders details and directs editing to the web app. Deferred as an acceptable constraint for
  a single-user build.
- **Native build profiles.** Including the missing production environment configuration and
  the development profile's unbuildable state.
- **Background rest-timer validation.** See the known gap above.
- **Renaming the schema's overloaded status values.**
- **Shared TypeScript configuration.**
- **Atomic server-side completion**, and offline support generally.
- **AI chat on mobile**, unchanged from plan 014.

## Further Notes

The audit that produced this spec reported completion errors as "swallowed." They are not: the
error path is fully wired from the sync module through the store's callback into a native
alert. The defect is narrower and more interesting — the failure is surfaced as a *message*
but not as an *outcome*, so the caller navigates away on top of the alert. Worth knowing,
because "wire up the error handling" would have been the wrong fix.

The audit also listed the superseding of the original dev-identity decision as outstanding. It
was in fact completed: the architecture document carries the superseded marker and a
supersedes note. Only the operational configuration remained, which is what this spec
addresses.

Two related defects were found during this session that the audit did not report. Both are
consequences of the same fire-and-forget dispatch style, and both are covered by tracking all
mutations for the drain: structural set edits race completion exactly as log writes do, and
the mutations that return an authoritative Exercise Log have their results discarded by the
client, which keeps its own optimistic copy instead. The second is not a correctness problem
today because the client is the source of truth during a session, but it is the reason atomic
server-side completion would be a larger change than it first appears.
