# Project instructions

## Product scope
- ChronoTide: personal timesheet app for an independent professional.
- Start with PegaSupport; support multiple clients and projects.
- Daily entry and weekly bulk editing share the same records.
- Support monthly PDF/CSV reports and immutable sent snapshots.
- Use <Client>_MMyyyy_Timesheets for report filenames; personal reporting name is separate.
- Emphasize Monday–Friday while allowing weekend entries.
- Exclude team approvals and invoicing from the initial scope.

## Technology
- Use React, TypeScript, Tailwind CSS, and shadcn/ui.
- Use Supabase Auth and persistent Postgres storage.
- Follow the approved architecture in PLAN.md and reuse existing components.
- Separate time calculations, date handling, and reporting from UI.

## Design standards
- Treat premium visual design as a core requirement.
- Maintain consistent typography, spacing, colors, and states.
- Support light/dark themes, accessible contrast, keyboard navigation, and visible focus indicators.
- Use a desktop weekly grid with sticky headers and mobile day-by-day editing.
- Keep frequent actions accessible; respect reduced-motion preferences.
- Provide loading, empty, error, unsaved, and saved states.
- Preserve input after failed saves.

## Data rules
- Store durations as integer minutes and work dates as calendar dates.
- Never duplicate hours between daily and weekly views.
- Preserve individual entries and descriptions in weekly cells; explicitly edit multiple records.
- Attribute monthly hours using each entry's work date.
- Archive clients/projects without deleting history.
- Keep sent snapshots unchanged by later edits, deletions, or renames.
- Prevent duplicate saves and detect conflicting updates.

## Supabase practices
- Use versioned migrations and RLS for user-owned data.
- Enforce ownership across records and their relationships.
- Never commit credentials or expose secret/service-role keys in frontend code.
- Keep environment examples limited to placeholders.
- Use real persistence; explicitly identify mocks and test fixtures.

## Commands and verification
- Record actual install, development, build, type-check, lint, and test commands once tooling is established. Do not invent them.
- Verify duration parsing, daily/weekly synchronization, individual entry preservation, month boundaries, duplicate-save prevention, failed-save recovery, and snapshot stability.
- Verify anonymous restrictions and user data isolation.
- Inspect the running UI at desktop and mobile sizes.
- Report completed checks and checks that could not run.

## Skills
- Review available skills and reuse relevant ones.
- Start with AGENTS.md unless a reusable workflow benefits from a skill.
- Do not install plugins or create skills merely for React or Supabase.
- Explain the purpose of any proposed custom skill.
- Put approved custom skills in .agents/skills/<skill-name>/SKILL.md with valid name/description frontmatter, usage triggers, concrete steps, and verification criteria.
- Do not duplicate AGENTS.md inside skills.
- Skills provide instructions; they do not configure Supabase access or install application dependencies.

## Maintenance
- Preserve existing applicable instructions.
- Update this file when architecture, commands, or project rules change.
- After meaningful behavior, schema, setup, or operational changes, use `.agents/skills/update-worklog-docs/SKILL.md` to update affected documentation. README is the documentation entry point; keep verification claims tied to actual evidence.

## Established commands and current stage
- Node.js >=22.13 and npm: `npm run install:ci`, `npm run dev`, `npm run build`, `npm run typecheck`, `npm run lint`, `npm run test`.
- Development uses the retained Sites starter's Vinext/Vite tooling at http://localhost:5173/.
- Supabase authentication and persistence are implemented. Each installation supplies its own hosted or local Supabase configuration; never assume access to the original owner’s backend.
- Migration 20260919215941_timesheet_core defines the initial schema. Check migration history on the chosen backend before applying changes. Keep future schema changes versioned.
- Saves are atomic deltas with stable request IDs and expected revisions; sent reports store immutable JSON snapshots.
- See README.md for setup/usage and VERIFICATION.md for actual checks and limitations.
