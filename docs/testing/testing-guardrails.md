---
description: "Testing guardrails: 6-layer test pyramid awareness, can-I-change-this-test decision tree, assertive pushback templates. Auto-attaches on test files, shared test helpers, snapshots, the L6 live-regression suite."
alwaysApply: false
globs:
    - "tests/shared/**"
    - "packages/*/**/*.test.ts"
    - "packages/*/**/*.test.tsx"
    - "tests/fixtures/recorded/**"
    - "e2e/regression/**"
    - "**/__snapshots__/**"
    - "**/*.snap"
---

# Testing Guardrails

