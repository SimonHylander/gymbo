---
name: Gymbo
description: Focused AI workout companion — equal-weight coaching chat and frictionless set logging.
colors:
  signal-teal: "oklch(70.4% 0.14 182.503)"
  celebration-magenta: "oklch(0.6175 0.1494 353.08)"
  floor-charcoal: "oklch(0.195 0 0)"
  surface-raised: "oklch(0.225 0 0)"
  surface-sunken: "oklch(0.165 0 0)"
  sidebar-slate: "oklch(0.175 0 0)"
  ink-primary: "oklch(0.94 0 0)"
  ink-muted: "oklch(0.6 0 0)"
  border-quiet: "oklch(0.27 0 0)"
  canvas-light: "oklch(0.985 0 0)"
  ink-light: "oklch(0.12 0 0)"
  destructive-warm: "oklch(0.7 0.15 25)"
typography:
  display:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "clamp(1.5rem, 4vw, 1.875rem)"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  title:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  body:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
  mono:
    fontFamily: "'SF Mono', 'Cascadia Code', 'Fira Code', 'JetBrains Mono', ui-monospace, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  sm: "calc(0.625rem - 4px)"
  md: "0.625rem"
  lg: "calc(0.625rem + 4px)"
  pill: "9999px"
spacing:
  xs: "0.5rem"
  sm: "0.75rem"
  md: "1rem"
  lg: "1.5rem"
components:
  button-primary:
    backgroundColor: "{colors.signal-teal}"
    textColor: "{colors.floor-charcoal}"
    rounded: "{rounded.md}"
    padding: "0 0.75rem"
    height: "2.25rem"
  button-primary-hover:
    backgroundColor: "{colors.signal-teal}"
    textColor: "{colors.floor-charcoal}"
    rounded: "{rounded.md}"
    padding: "0 0.75rem"
    height: "2.25rem"
  button-outline:
    backgroundColor: "{colors.surface-sunken}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.md}"
    padding: "0 0.75rem"
    height: "2.25rem"
  input-field:
    backgroundColor: "{colors.surface-sunken}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.pill}"
    padding: "0 0.75rem"
    height: "2rem"
---

# Design System: Gymbo

## Overview

**Creative North Star: "The Coach Desk"**

Gymbo looks like one disciplined workspace where a calm coach and a precise logbook sit side by side. Density follows Linear and Raycast: tight type, clear hierarchy, no decorative chrome. The lifter is on the gym floor between sets; the UI stays legible in dim light, responds one-handed, and never competes with the rep.

The system rejects SaaS dashboard clichés, spreadsheet grids, bro-gym neon, and default AI chatbot styling. Surfaces are tonal, not theatrical. Signal Teal appears only where action or progress demands attention.

**Key Characteristics:**

- Dark-first gym-floor canvas with stepped neutral surfaces, not gradient heroes
- Signal Teal accent used sparingly (actions, timers, PR moments)
- System sans with negative tracking on headings; mono only for code blocks
- Flat-by-default elevation; depth from surface lightness, not drop shadows
- Set row as the signature component: grid-aligned, thumb-friendly, no modal detours
- Chat and routine shells share sidebar vocabulary and motion restraint

## Colors

A restrained product palette: tinted neutrals carry most of the UI; Signal Teal and Celebration Magenta appear only on purpose.

### Primary

- **Signal Teal** (oklch(70.4% 0.14 182.503)): Primary actions in dark mode, active timer states, completion affordances, and rare positive emphasis. Never fills large backgrounds.

### Secondary

- **Celebration Magenta** (oklch(0.6175 0.1494 353.08)): PR badges, streak highlights, and coach praise moments only. Paired with teal, never as a second primary button color on the same control.

### Neutral

- **Floor Charcoal** (oklch(0.195 0 0)): Default app background in dark mode; the gym-floor base.
- **Surface Raised** (oklch(0.225 0 0)): Cards, exercise panels, popovers on the floor.
- **Surface Sunken** (oklch(0.165 0 0)): Muted wells, input backgrounds, inset set cells.
- **Sidebar Slate** (oklch(0.175 0 0)): Chat and routine navigation rails.
- **Ink Primary** (oklch(0.94 0 0)): Body and heading text on dark surfaces.
- **Ink Muted** (oklch(0.6 0 0)): Secondary labels, placeholders, disabled copy.
- **Border Quiet** (oklch(0.27 0 0)): Dividers and input strokes; low contrast, structural only.
- **Canvas Light** (oklch(0.985 0 0)): Light-mode background when system theme is light.
- **Ink Light** (oklch(0.12 0 0)): Light-mode text and primary buttons (near-black, not pure black).

### Named Rules

**The Signal Rule.** Signal Teal occupies ≤10% of any screen. Its rarity is the point; if teal is everywhere, nothing is urgent.

**The One Accent Rule.** On a given control or row, use either teal or magenta, never both as competing fills.

## Typography

**Display Font:** System UI sans (platform stack)
**Body Font:** System UI sans (platform stack)
**Label/Mono Font:** SF Mono / JetBrains Mono stack for code and editor surfaces only

**Character:** Neutral, fast, and slightly compressed on headings. No display serif or marketing display face. OpenType features (`ss01`, `ss02`, `cv01`) enabled on body for refined numerals in set logs.

### Hierarchy

- **Display** (600, clamp(1.5rem, 4vw, 1.875rem), 1.2): Session titles, chat greeting when present. One per viewport region.
- **Title** (600, 0.875rem / 14px, 1.2): Exercise names, sidebar section labels, card headers.
- **Body** (400, 0.875rem / 14px, 1.6): Instructions, coach messages, helper copy. Cap prose blocks at 65–75ch.
- **Label** (500, 0.75rem / 12px, 1.4): Set numbers, unit hints, metadata chips.
- **Mono** (400, 0.8125rem / 13px, 1.6): Code artifacts and editor content only.

### Named Rules

**The Gym Floor Rule.** Minimum 14px for anything the lifter must read between sets. 12px is for labels and badges, not primary actions.

## Elevation

Depth is tonal, not shadow-driven. Dark mode steps surfaces by lightness: sunken (0.165) → floor (0.195) → sidebar (0.175) → raised card (0.225). Shadows exist in tokens but are reserved for floating composers and rare overlays, not routine cards.

### Shadow Vocabulary

- **Card** (`--shadow-card`): Subtle inset highlight + 1–2px drop for dark cards when elevation is unavoidable.
- **Float** (`--shadow-float`): Modals, suggestion popovers, artifact panels.
- **Composer** (`--shadow-composer` / `--shadow-composer-focus`): Chat input bar at rest and focused.

### Named Rules

**The Flat-By-Default Rule.** Exercise cards and set rows stay flat. Shadows appear only on float states (composer, dialogs, suggestions), never as default card decoration.

## Components

### Buttons

- **Shape:** Gently rounded (10px / `rounded-lg`), not pills except dedicated icon controls.
- **Primary:** Signal Teal fill, Floor Charcoal text, h-9 (36px), `text-sm` medium weight. Active state: 1px downward translate (`active:translate-y-px`).
- **Hover / Focus:** Primary dims to 80% opacity; outline variant lifts border contrast. Focus uses ring on inputs; buttons suppress default outline in favor of state color shifts.
- **Outline / Ghost:** Muted or transparent fills for destructive-adjacent actions (delete set, secondary nav). Destructive uses tinted red background, not solid fill.

### Chips

- **Style:** `Badge` on muted background; uppercase avoided. Used for rest timer, exercise index, PR tags.
- **State:** Magenta tint for celebration; default muted for structural labels.

### Cards / Containers

- **Corner Style:** 10px radius (`rounded-xl` on welcome blocks, `rounded-lg` on dense rows).
- **Background:** Surface Raised on Floor Charcoal.
- **Shadow Strategy:** None at rest (Flat-By-Default). Border at 50% opacity (`border-border/50`) instead of lift.
- **Border:** 1px quiet border; never left-stripe accent borders.
- **Internal Padding:** 16px (`p-4`) on instructional cards; 8px grid gaps on set rows.

### Inputs / Fields

- **Style:** Pill-shaped (`rounded-4xl`), sunken `bg-input/30`, 32px height in set logger (`h-8`), centered numerals for weight/reps.
- **Focus:** 3px ring at 50% ring color; border shifts to ring token.
- **Error / Disabled:** Destructive ring tint; completed sets at 60% row opacity.

### Navigation

- **Style:** Sidebar Slate background, muted foreground for inactive items, Ink Primary for active. Icon + label from Lucide, 16px icons.
- **Routine shell:** Collapsible sidebar via shadcn sidebar; inset main column full viewport height (`h-dvh`).
- **Chat shell:** Width transition when artifact panel opens (40% / 100%); ease `cubic-bezier(0.32, 0.72, 0, 1)`.

### Set Logger Row

- **Shape:** Six-column grid (`1.75rem` controls + three flexible data columns). Set number in circular muted badge.
- **Previous set:** Tappable muted cell; hover border only when data exists.
- **Complete:** Checkbox at row end; completed rows fade, inputs lock.
- **Philosophy:** The atomic workout unit. Optimized for thumb reach and glanceability, not spreadsheet density.

## Do's and Don'ts

### Do:

- **Do** treat Signal Teal as a scarce signal: primary buttons, timer progress, and confirmed actions only.
- **Do** keep chat and routine shells at equal visual weight: shared sidebar tokens, same type scale, same border language.
- **Do** use tonal surface steps for depth in dark mode before reaching for shadow tokens.
- **Do** size touch targets to at least 28–36px on set controls (icon buttons `size-7`, inputs `h-8`).
- **Do** respect `prefers-reduced-motion` for framer-motion entrances; keep easing exponential ease-out, never bounce.

### Don't:

- **Don't** build generic SaaS dashboards: hero metrics, identical card grids, gradient accents, or decorative stats that restate the obvious.
- **Don't** use spreadsheet or admin-table aesthetics: dense grid-first layouts that treat logging like data entry instead of workout rhythm.
- **Don't** adopt bro-gym styling: neon, aggressive display type, stock-photo motivation, loud visual noise on the floor.
- **Don't** use default AI chatbot chrome: purple gradients, glassmorphism, or empty-state copy like "What can I help with?" that competes with the workout.
- **Don't** add colored left-stripe borders on cards or list items.
- **Don't** use gradient text (`background-clip: text`) for emphasis.
- **Don't** nest cards inside cards; one surface per hierarchy level.
