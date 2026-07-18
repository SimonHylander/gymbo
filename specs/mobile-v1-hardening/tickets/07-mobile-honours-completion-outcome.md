# 07 — The mobile workout screen honours the completion outcome

**What to build:** A lifter whose Workout fails to finish stays on the workout screen with
their logged Sets in front of them, sees the error alert explaining why, and can retry. A
lifter whose Workout finishes successfully is returned to the routine screen exactly as
before.

Today the screen navigates back unconditionally, so a failed finish produces an error alert
and a bounce to the routine screen at the same time — the Workout is still ongoing, but it
looks like it ended normally.

The joint-pain check-in flow also finishes Workouts and must honour the same outcome, so the
guarantee does not depend on which route the lifter took to finish.

Navigation stays promise-driven rather than driven by observed Workout status. Status-driven
navigation is more robust and is the right choice at larger scope, but it needs a navigation
effect on a screen that has none, with its own re-entrancy hazards.

**Blocked by:** 06 — Finishing a Workout drains in-flight writes before completing it. The
outcome this ticket consumes does not exist until then.

**Status:** ready-for-agent

- [ ] The workout screen navigates back only when the Workout actually completed
- [ ] A failed finish leaves the lifter on the workout screen with logged Sets intact
- [ ] The existing error alert still fires on failure — its wiring is correct and unchanged
- [ ] A successful finish navigates back as it does today, so the normal path is unaffected
- [ ] The joint-pain lifecycle flow consumes the same outcome
- [ ] No React Native test harness is built — standing one up means resolving transform
      configuration disagreements between the RN toolchain and the test runner, to cover a
      single conditional whose contract is already pinned at the store seam in ticket 06
- [ ] Verified by hand in Expo Go: finish a Workout successfully, and finish one with the
      network disabled to confirm the screen holds and the alert appears
