# /routines design brief

Product register: gym app UI aligned with `/routines/$id`.

## Layout
- Standalone shell: sidebar (programs + routines) + main detail/edit panel
- Mobile: routine list in main column header area; detail below
- Desktop: persistent sidebar nav, detail in main inset

## Visual language
- Reuse card pattern: `rounded-xl border border-border/50 bg-card shadow-sm`
- Sidebar density matches routine exercise sidebar (`text-[13px]`, compact rows)
- Restrained palette: existing design tokens only

## States
- Empty: no routines, none selected
- List: single-line rows (name + exercise count + optional "In progress" badge)
- Detail: aggregate summary (exercise/set counts + truncated name preview, first 3 names +N more); full exercise list only in Edit
- Edit: inline form on md+, same card container
- Disabled edit when workout ongoing (tooltip)

## Copy
- Header: "Routines" / "Browse, edit, and start workouts"
- CTAs: Start workout, Resume workout, Edit, Save, Cancel
- Edit block message: "Finish or leave the workout before editing."
