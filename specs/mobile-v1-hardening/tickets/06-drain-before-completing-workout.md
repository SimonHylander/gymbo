# 06 — Finishing a Workout drains in-flight writes before completing it

**What to build:** A lifter who taps "Finish workout" immediately after logging a Set gets
that Set saved. Finishing waits for every in-flight write to settle before completing the
Workout, and if any of those writes failed, the Workout is left ongoing and finishing reports
failure rather than success.

Today the session sync module dispatches its writes without awaiting them and then awaits
only the completion. A completed Workout is immutable, so a write that lands after the status
change is rejected by the backend and the logged Set is lost.

This is a property of the module's fire-and-forget dispatch style, not of one call path. The
drain must therefore cover **every** mutation the module issues — log updates, active-exercise
updates, Set additions, Set removals, and applying a previous Set — because structural Set
edits race completion in exactly the same way.

The decision-relevant shape:

```ts
flushAllLogs: () => Promise<void>   // resolves when in-flight writes settle
stopWorkout: () => Promise<boolean> // false when the Workout did not complete
```

**Blocked by:** None — can start immediately. Ticket 01 gives this work its vocabulary
("drain", "in-flight write") but does not gate it.

**Status:** ready-for-agent

- [ ] Completing a Workout does not issue the completion until in-flight writes have settled
- [ ] A rejected in-flight write leaves the Workout ongoing and does not complete it
- [ ] The tracking covers all five mutations the sync module issues, not only log updates
- [ ] The session store's finish action reports whether the Workout actually completed
- [ ] The store does NOT throw — the lifecycle module is pure domain code with no error
      vocabulary, and adding exception handling there to fix a navigation defect would be
      disproportionate
- [ ] The server-side immutability guard is unchanged — relaxing it was explicitly rejected
- [ ] Completion is NOT made transactional on the server — that was considered and rejected
      for this scope, as it would make client state authoritative at completion time
- [ ] The stale comment claiming the error is surfaced elsewhere is corrected: the message IS
      surfaced through the sync-error callback, it was the outcome that was missing
- [ ] Tests are written at the session store seam, which already accepts injected mutations —
      no new seam is introduced
- [ ] A test asserts that finishing does not complete until a deferred write resolves, and it
      FAILS against current behaviour; a test using immediately-resolving mocks cannot detect
      this defect, which is why the existing test passes while the defect is live
- [ ] A test asserts that a rejected write leaves the Workout ongoing and reports failure
- [ ] A test asserts the successful path still completes and reports success
- [ ] A test asserts structural Set edits are drained on the same terms as log writes
- [ ] Tests assert observable behaviour — what was saved, what was reported — not internal
      promise bookkeeping
- [ ] The existing sync-module tests are retained rather than rewritten; their stale header
      comment referencing the pre-extraction path is corrected
