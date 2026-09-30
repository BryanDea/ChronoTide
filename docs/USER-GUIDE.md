# Using ChronoTide

ChronoTide is your custom personal timesheet app. Open the private hosted app from [the setup guide](OPERATIONS.md), create an application account if needed, confirm your email and sign in. Your Supabase dashboard login is a different account context.

## First use

PegaSupport is created automatically as the first preferred client. In Settings, enter your personal reporting name and choose your timezone. Under Projects, create at least one project for the client. Clients and projects can be edited, archived and restored; archiving preserves historical entries. A project's client cannot be changed after creation.

## Entering time

This Week is the home screen. Select a client and navigate between Monday–Sunday weeks. Open a cell to add or edit work, or use quick entry. Each entry has a date, project, description, duration and billable status. Multiple entries may share a project and date; a cell with multiple entries lets you edit them separately.

Use `2:30`, `2h 30m` or `2.5` for two hours and thirty minutes. The stored value is 150 minutes. Zero, negative and fractional-minute durations are rejected. Delete requires confirmation.

Week and Day edit the same records. Mobile shows day-by-day editing. Summary cards show current-week/month totals; the grid shows the selected week's totals. Saturday and Sunday are available even though Monday–Friday are the normal working days.

Press Save changes to persist pending edits, including edits made while navigating between weeks. Confirm the saved state before closing the tab. Failed saves keep input in the current tab; retry after resolving the error. Unsaved drafts are not an offline backup and may be lost on reload. Another device's changes appear when the workspace reloads or regains focus without local pending edits.

## Monthly reporting

Choose Reports, the reporting month and client, and optionally a project. Entries are included by their own dates: a week spanning September and October contributes separately to each month. Review detailed work, project summaries and the total.

Save pending entries before exporting the live report. Export PDF or CSV. Filenames follow `PegaSupport_092026_Timesheets` for September 2026. Your personal reporting name appears inside the report.

Mark as sent creates a permanent snapshot of the saved report. It does not send email. Later time corrections or project/client renames do not rewrite the saved snapshot. Select a previously sent report to view/export the original; choose Back to live report to see current data.

Use distinct project names within a client: current project summary lines combine matching names. For current testing limits, see [VERIFICATION.md](../VERIFICATION.md).
