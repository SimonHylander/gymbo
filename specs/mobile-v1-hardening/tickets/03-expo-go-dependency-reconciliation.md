# 03 — Make the mobile app run cleanly in Expo Go

**What to build:** A developer can start the mobile app in Expo Go and have it run against the
development Principal, with dependency versions that match the SDK — so that a runtime failure
means a bug in the app rather than version drift.

Because Expo Go ships fixed native modules for its SDK, mismatched JavaScript package versions
fail at runtime in confusing ways. This matters more here than it would in a native build,
where the toolchain compiles whatever is declared.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] All Expo packages below the SDK's expected versions are reconciled to the SDK
- [ ] Duplicate native modules reported by the Expo doctor check are resolved
- [ ] The authentication library's session peer dependency is added as a direct dependency,
      despite the provider being dormant, because it is already in the module graph
- [ ] The development client dependency is deliberately NOT added — it would switch the dev
      server out of Expo Go mode and fight the chosen workflow on every launch
- [ ] The Expo doctor check passes, or each remaining failure is documented with why it is
      accepted
- [ ] The native build profiles are left exactly as written, and documented as unbuildable
      until the authenticated scope is taken on
- [ ] The unvalidated background rest-timer path is documented as a known, accepted gap: the
      notification calls already degrade to no-ops, so Expo Go cannot crash on them, but a
      silently no-op scheduler is indistinguishable from a working one
- [ ] The app launches in Expo Go and the Routines list renders against the linked deployment
