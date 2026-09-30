# Database contract

The source of truth is [the versioned migration](../supabase/migrations/20260919215941_timesheet_core.sql). This document summarizes that migration; it does not replace it.

## Tables

| Table | Purpose and important fields |
| --- | --- |
| `profiles` | One per auth user; reporting name, timezone, preferred client |
| `clients` | Owner, name, archive timestamp |
| `projects` | Owner, client, name, color, archive timestamp |
| `time_entries` | Stable UUID, owner, project, work date, description, integer minutes, billable flag, revision, timestamps |
| `save_requests` | Owner/request UUID primary key, original payload and result for idempotent retries |
| `report_snapshots` | Stable UUID, owner, first day of month, client/project filters, frozen report JSON, sent timestamp |

Every table has row-level security. Authenticated access is restricted by `auth.uid() = user_id`. Composite owner/record foreign keys prevent references to another user's clients or projects. Anonymous roles receive no table privileges. The profile's default timezone is America/El_Salvador.

Clients, projects and profiles allow authenticated select/insert/update. Entries additionally allow delete. Request receipts and report snapshots allow select/insert only; authenticated users cannot update or delete existing snapshots. This immutability applies to app users, not privileged database administrators or account deletion: records reference auth users with cascading deletion.

## Functions and triggers

| Operation | Contract |
| --- | --- |
| `ensure_workspace()` | Auth required; per-user transaction lock; creates PegaSupport and profile once |
| `save_time_entries(p_request_id, p_changes)` | Atomic entry deltas, expected-revision checks, request payload consistency, stable replay result |
| `create_report_snapshot(p_id, p_period, p_client, p_project)` | Requires reporting name and valid owner filters; month must start on day one; stable snapshot ID supports retry |
| `guard_entry` | Prevents owner/ID changes, increments revision, requires active client/project for new entries or project reassignment |
| `guard_project` | Prevents changes to owner, ID or client so historical work cannot move clients silently |

Functions use `SECURITY INVOKER` and an empty search path. Public/anonymous function execution is revoked; authenticated execution is granted for the three application RPCs. The application uses the transactional save RPC; direct table writes are still permitted by grants and do not provide the same request-level deduplication contract.

## Snapshot format

Version 1 JSON contains `reporting_name`, `client_name`, `period` (`YYYY-MM`), `entries`, and `total_minutes`. Each entry contains its ID, calendar date, project ID/name, description, minutes and billable flag. Source edits or renames do not update this JSON. The period query is inclusive of the first day and exclusive of the next month's first day.

Archiving uses timestamps and keeps historical records. New work cannot be assigned to an archived project/client. Existing entries can still be corrected without changing their project.

## Schema changes and verification

Keep applied migrations unchanged; introduce a new versioned migration for later changes. Discover the installed CLI's migration commands with `--help` before using them. Review both grants and policies, including cross-owner relationships, before deployment. Apply to an appropriate test environment first and record the actual applied version.

[Isolation assertions](../supabase/tests/isolation.sql) exercise two-user access restrictions, anonymous denial, retry replay, conflicts and snapshot stability inside a rolled-back transaction. They require a privileged test connection; do not turn them into an app endpoint. See [verification evidence](../VERIFICATION.md) for prior execution results.

## Database portability

The implemented backend is Supabase, hosted or local. A local Supabase stack stores data in PostgreSQL on your own machine and provides the Auth and REST services required by the browser. Self-hosted Supabase may satisfy the same contract but has not been tested here.

A connection string to plain PostgreSQL, SQLite, MySQL or D1 is insufficient. The current client calls Supabase Auth, table APIs and three transactional RPCs, and migrations reference `auth.users`, `auth.uid()` and Supabase roles. Never put a direct database password in browser environment variables.

A future adapter must provide server-side authentication/session validation, per-user ownership enforcement, the CRUD operations in `use-workspace.ts`, atomic revision-checked and idempotent saves, and immutable report snapshots. Port migrations and the isolation/retry/conflict tests, then verify daily/weekly consistency and reports against that backend before calling it supported. This adapter is future work, not implemented functionality.
