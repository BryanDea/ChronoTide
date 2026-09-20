# Approved timesheet implementation plan

Approved in conversation. The UI draft was approved and the Supabase implementation is now connected to PegaSupport Timesheets in Ryan’s Org. See VERIFICATION.md for completed checks and remaining limitations.

## Product
Personal timesheets for independent work. PegaSupport is the initial/default client. Support multiple clients and projects, creating/editing/archiving both. Preserve all historical entries on archive. No team approvals or invoicing.

Navigation: This Week (home with daily editing), Projects, Clients, Reports, Settings. Select the only active client automatically; otherwise use the preferred client. Working days are Monday–Friday; Saturday and Sunday remain available.

## Visual direction
A refined work ledger: crisp typography, cool neutral surfaces, slate text, restrained indigo accents, rounded cards, subtle shadows, and generous spacing. Use tabular numerals, clear alignment, sticky grid headers/project labels, quieter weekends, and highlighted totals. Provide light/dark themes, accessible contrast, visible focus, reduced-motion support, and thoughtful loading/empty/error/unsaved/saved states. Weekly, monthly, and billable summary cards and a compact project breakdown support the grid. Mobile uses day-by-day editing rather than a compressed grid. Keep frequent actions immediately accessible.

## Architecture
React + TypeScript + Tailwind CSS + shadcn/ui using the Sites starter. Supabase Auth and Postgres provide real authentication and persistence. Reuse established components. UI is separate from shared data access and domain logic (duration parsing, calendar-date operations, aggregation, report formatting). No separate weekly-hours table. Browser storage is not the authoritative record store; temporary drafts/preferences may be local. Database functions provide atomic saves and report creation.

## Schema
- profiles: user ID, personal reporting name, preferred client, timezone.
- clients: ID, owner ID, name, archive timestamp.
- projects: ID, owner ID, client ID, name, archive timestamp.
- time_entries: stable ID, owner ID, project ID, work date, description, integer duration_minutes, billable, revision, timestamps.
- report_snapshots: owner, period, filters, frozen personal/client/project names, full detailed entries, totals, sent timestamp, format version.
- save_requests: owner, unique request ID, payload fingerprint, saved result for safe retries.

Use positive integer minutes; Postgres DATE and YYYY-MM-DD strings for work dates. Never convert work dates through UTC. Timestamps describe actions, not attribution of hours. Apply RLS to every user-owned table and ownership constraints to all relationships. Archive hides records from new-entry choices but leaves history visible. Prevent changes to sent snapshots in the database, including changes caused by source record deletion/rename.

## Entry behavior
Daily entries have date, project, description, duration, and billable status. Allow multiple entries per project/day. Accept 2:30, 2h 30m, and decimal hours such as 2.5 as 150 minutes. Bare numbers mean hours. Validate whole-minute precision and display the parsed duration.

Weekly grid: project/description/billable rows and Monday–Sunday columns. Empty cells create one entry. Single-entry cells update that record. Multi-entry cells show total/count and open individual records for explicit editing; never merge descriptions or redistribute aggregate hours. Every cell has a detail editor. Tab/Enter support rapid entry. Confirm deletions, including clearing existing time.

Save week submits all drafts in one transaction. Daily saves use the same mutation logic and records. Stable UUIDs and request IDs prevent retry duplication; revisions detect concurrent changes. Failed saves preserve input and offer retry/conflict resolution. Successful saves refresh dependent views and totals. Refetch remote data on return without overwriting unsaved drafts.

## Reports
Select month/client and optional project. Filter by work_date >= month start and < next month start, regardless of week boundaries. Aggregate integer minutes before formatting. Include personal name, client, period, dates, projects, descriptions, billable status, project totals, billable/non-billable totals, and monthly total. PDF and CSV use identical source data.

Filename/title: <Client>_MMyyyy_Timesheets, initially PegaSupport_092026_Timesheets. Personal reporting name is a separate setting. Mark as sent atomically freezes a complete immutable snapshot; future edits/deletions/renames must not affect it. Allow reopening/exporting snapshots. Mark as sent does not send email.

## Supabase setup
Supply project URL and publishable (or legacy anon) key through ignored local environment and deployment settings. Environment examples contain placeholders only. Never put service-role keys, secrets, database passwords, or access tokens into frontend code or chat. Plugin configuration is separate from application configuration. Migrations are versioned SQL; apply via connected tooling, authenticated local CLI, or dashboard as appropriate. Document auth redirects, sign-in/password recovery, setup, and usage. No custom skill is currently justified.

## Verification and completion criteria
Record actual tooling commands in AGENTS.md after establishment. Check parsing, integer totals, daily/weekly synchronization, multiple-entry preservation, duplicate retries, failed-save recovery, concurrent updates, month/year boundaries, timezone safety, archive history, immutable snapshots, PDF/CSV consistency, anonymous restrictions, and two-user isolation (including writes/relationships). Inspect desktop/mobile, keyboard flows, and both themes. Report actual results and explicitly identify blocked checks. Never describe preview fixtures as saved online or claim unrun checks passed.

## Delivery stages
1. Consolidated instructions and interactive UI draft, with sample data clearly identified.
2. Supabase project configuration, versioned schema, RLS, auth, and real data layer.
3. Complete management, time entry, reporting/export, and snapshot flows.
4. Verification, setup/usage documentation, and deployment.
