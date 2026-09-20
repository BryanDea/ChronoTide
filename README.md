# Worklog — PegaSupport timesheets

Personal timesheets built with React, TypeScript, Tailwind CSS and shadcn/ui. Supabase provides authentication and persistent PostgreSQL storage. There are no sample records in the connected application.

## Local setup

Use Node.js 22.13+ and npm:

```sh
npm run install:ci
cp .env.example .env.local
# Fill in your Supabase project URL and publishable key in .env.local.
npm run dev
```

The local app runs at http://localhost:5173. Never use a service-role key, secret key, database password or access token in frontend configuration. `.env.local` is ignored; `.env.example` contains placeholders only.

The selected Supabase project is PegaSupport Timesheets in Ryan’s Org. Migration `supabase/migrations/20260919215941_timesheet_core.sql` has already been applied there. For a new project, apply that versioned SQL migration using Supabase's SQL editor or your authenticated migration workflow before opening the app. Do not reapply it to the existing project.

In Supabase Authentication → URL Configuration, set Site URL to your app's deployed origin and allow that origin's `/**` redirect pattern. For local development also allow `http://localhost:5173/**`. Register using your own email/password and confirm your email. Passwords belong in the app, never in chat or source files. The app account is separate from your Supabase dashboard login.

Sites hosting uses the same two `NEXT_PUBLIC_SUPABASE_*` variables through its environment settings. Changing these public build values requires rebuilding the app. The retained Vinext/Vite starter supplies deployment tooling; unused D1 scaffolding is not used for timesheet storage.

## Usage

1. Sign in. PegaSupport is automatically created as your first client.
2. Set your personal reporting name, timezone and preferred client in Settings.
3. Create projects under Projects. Create additional clients when needed.
4. Enter work in This Week. Click a cell to add or edit entries; a cell containing several entries lists each description separately. Week and Day share exactly the same records. Weekends remain available. Mobile uses the day layout.
5. Use `2:30`, `2h 30m` or `2.5` for 150 minutes. Save changes to persist all pending edits. Failed saves retain the draft in the current tab; retry the same request. Avoid closing/reloading a tab with unsaved work. Conflicts require reviewing the latest online records before trying again.
6. Reports filters by month, client and optionally project. Save pending entries first. Export PDF or CSV, or mark the report as sent to retain an immutable snapshot. This records the sent status; it does not send email. Select a saved report to export its original contents later.

Reports use filenames such as `PegaSupport_092026_Timesheets`. Monthly totals use each entry's calendar date. Archiving clients/projects preserves history. Deletion requires confirmation.

## Commands

```sh
npm run install:ci
npm run dev
npm run build
npm run typecheck
npm run lint
npm run test
```

## Architecture and checks

- `app/page.tsx`: workspace views and shared entry draft.
- `lib/timesheets/use-workspace.ts`: authenticated persistence, revision checks and retry-safe saves.
- `lib/timesheets/domain.ts`, `changes.ts`, `reports.ts`: duration/date calculations, changes and exports. Named sample fixtures are used only by tests.
- `components/timesheets/`: authentication, management, preferences and reports.
- `supabase/migrations/`: versioned schema, ownership constraints, RLS and transactional functions.
- `supabase/tests/isolation.sql`: rollback-only database assertions for isolation, retries, conflicts and snapshots; run with a privileged SQL test connection against the intended test database.
- `AGENTS.md`, `PLAN.md`, `VERIFICATION.md`: project rules, approved architecture and verification evidence.

Saved records synchronize on load and on window focus when no draft is pending. Concurrent saves use revisions to prevent overwriting newer work. This is not a live collaborative editor.
