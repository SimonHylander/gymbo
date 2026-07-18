# 01 — Record the workout vocabulary in the shared glossary

**What to build:** A contributor reading the project glossary can find every core workout
term defined, so that reviews argue about behaviour rather than terminology. In particular,
the word used for a write that has been dispatched but not yet acknowledged is distinct from
the two existing meanings of "pending" already in the schema — the ambiguity that let the
completion defect hide in plain sight.

The glossary currently defines only the AI tool vocabulary. None of the workout domain is
written down.

**Blocked by:** None — can start immediately. Nothing else in this spec is technically gated
on it, but doing it first means the remaining tickets can use the agreed names in code,
tests, and commit messages rather than retrofitting them.

**Status:** ready-for-agent

- [ ] Program is defined as an ordered collection of Routines
- [ ] Routine is defined as a reusable template — a named, ordered list of exercises with
      targets, and explicitly not a record of anything that happened
- [ ] Workout is defined as a single execution of a Routine by one user, moving pending →
      ongoing → completed
- [ ] The glossary states that a completed Workout is immutable, as an invariant rather than
      an incidental implementation check
- [ ] Exercise Log is defined as the record of one exercise within a Workout — its Sets plus
      a completed flag
- [ ] Set is defined as one entry in an Exercise Log
- [ ] Principal is defined as the user identity a backend function attributes data to,
      resolved server-side only and never from client arguments
- [ ] In-flight write is defined as a dispatched mutation whose result has not been received,
      and the glossary notes it is deliberately not called "pending"
- [ ] Drain is defined as waiting for in-flight writes to settle, and notes that completing a
      Workout drains first because a completed Workout is immutable
- [ ] Both existing meanings of "pending" in the schema are documented — a Workout that has
      not started, and a Set that has not been logged
- [ ] The schema's `pending` values are NOT renamed
- [ ] The glossary remains a glossary — no implementation detail, no decisions, no spec
