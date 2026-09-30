# Architecture

ChronoTide is this repository's personal timesheet application. It runs locally; hosting is optional. Supabase supplies authentication and PostgreSQL storage through a hosted project or a local stack. A Supabase dashboard account does not substitute for an application account.

## Runtime and source map

React with TypeScript, Tailwind CSS and shadcn/ui runs on the retained Vinext/Vite Sites starter. The browser uses `@supabase/supabase-js` with a public project URL and publishable key. No service-role key is required by the app.

| Responsibility | Source |
| --- | --- |
| Navigation, weekly/day views, shared draft | `app/page.tsx` |
| Theme and responsive layout | `app/globals.css`, `app/providers.tsx` |
| Signup, signin, password recovery | `components/timesheets/auth-gate.tsx` |
| Clients, projects, profile preferences | `components/timesheets/management.tsx` |
| Reports and sent snapshot selection | `components/timesheets/reports.tsx` |
| Supabase client | `lib/supabase/client.ts` |
| Loading, saving, retries, metadata writes | `lib/timesheets/use-workspace.ts` |
| Duration/date calculations and changes | `lib/timesheets/domain.ts`, `changes.ts` |
| Data types and database mapping | `lib/timesheets/models.ts` |
| PDF and CSV generation | `lib/timesheets/reports.ts` |
| Database contract | `supabase/migrations/` |

Unused D1/example scaffolding comes from the starter; it is not the timesheet database. Named sample fixtures in the domain module are test data, not production workspace data.

## Entry lifecycle

1. Authentication opens a user-owned workspace. `ensure_workspace` creates a profile and preferred PegaSupport client on first use.
2. The data hook loads records, with paginated table reads. A shared in-memory entry draft backs both Week and Day.
3. Weekly rows group entries by project, description and billable status. Cells aggregate the records for a date. Opening a cell preserves individual entries; it never replaces several descriptions with an aggregate record.
4. Saving computes only changes relative to the loaded base. Each entry has a stable UUID and expected revision. The client retains the same request UUID and payload after an uncertain failure.
5. `save_time_entries` applies the batch transactionally. Replaying an identical request returns its original result; a stale entry revision rejects the transaction.
6. Successful results become the new base. Failed saves leave input in the tab. Further editing is blocked while a request needs retry or explicit reload/discard.

No separate weekly totals table exists. Saved data reloads on initial load and window focus when no draft or pending save exists. A generation counter prevents older reads from overwriting newer local edits. This is not a realtime collaborative editor or an offline-first application. Unsaved input is not durable across tab closure.

## Dates, durations and reports

Durations use integer minutes. Calendar dates remain `YYYY-MM-DD` strings in the client and PostgreSQL `date` values in storage. The profile timezone determines the current day; it does not reinterpret existing work dates. Monday starts the week, with Saturday and Sunday available.

Monthly attribution uses each work date, independent of the displayed week. The live report derives from loaded entries. Snapshot creation instead reads saved database records and freezes names, descriptions, dates and minutes in JSON. PDF/CSV exports use either the live report or the selected saved snapshot. See [the database contract](DATABASE.md).

## Boundaries and current limitations

The project targets one independent professional per account: no team approval, invoicing or email delivery. “Mark as sent” records a snapshot, not an outgoing message. Weekly editing currently uses cell dialogs rather than direct inline spreadsheet typing. Project summary grouping currently uses project names, so use distinct project names within a client to avoid combined summary lines. Individual report entries retain project IDs.

See [verification evidence](../VERIFICATION.md) for checks actually performed, not just intended behavior.
