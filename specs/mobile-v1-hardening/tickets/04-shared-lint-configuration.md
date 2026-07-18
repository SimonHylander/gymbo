# 04 — One shared lint configuration, and a green repo-wide lint gate

**What to build:** A developer running the repo-wide lint command gets a meaningful pass or
fail across every TypeScript package, including the two newest ones and the mobile app. A rule
change is made in one place rather than seven.

The lint gate currently fails outright: two packages declare lint scripts with no
configuration to run against, and the mobile app's lint command has no configuration either.
The four packages that do lint carry byte-identical configurations.

**Blocked by:** 03 — Make the mobile app run cleanly in Expo Go. Both tickets modify the
mobile package manifest, and the React Native lint preset must be installed at a version that
matches the reconciled SDK.

**Status:** ready-for-agent

- [ ] A shared configuration package exposes two variants: a base for TypeScript packages and
      a React Native variant for the mobile app
- [ ] The React Native variant carries the platform and hooks rules, not the TypeScript base
- [ ] All seven consumers migrate onto it — web, UI, core, AI, backend, domain, and mobile
- [ ] No package retains its own inline lint configuration
- [ ] The repo-wide lint command passes
- [ ] The lint gate genuinely covers the backend and domain packages, rather than passing
      because their scripts were removed
- [ ] Shared TypeScript configuration is explicitly NOT included — per-package compiler
      differences are real and reconciling them is separate work
