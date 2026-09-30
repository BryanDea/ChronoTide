# Verification

## ChronoTide portability and GitHub preparation — September 30, 2026

- Typecheck, lint and all eight unit tests passed with the preserved avatar-initials fix and ChronoTide branding.
- A separate clean source copy, without `.env.local`, local runtime state or `.openai/hosting.json`, passed `npm run install:ci` (715 packages) and `npm run build` on Node 24.19.0. Vinext emitted the existing non-fatal route-classification notice. This verifies install/build portability, not authenticated database access.
- Supabase 2.117.0 CLI help confirmed local initialization, startup and migration commands. `supabase init` succeeded in the disposable copy. Container startup and local migrations remain unverified: Docker is unavailable on this workstation.
- The clean copy launched successfully and its desktop connection screen was inspected in-browser (ChronoTide title and missing-configuration guidance). Mobile/theme and signed-in UI checks were not repeated.
- Local Markdown links and `git diff --check` passed.
- Publication review scanned all original Git blob versions and current publishable files for common key/token/JWT/private-key/database-password patterns, and compared against actual local environment values without printing them. No matches were found. This is a targeted check, not a guarantee against every possible secret format.
- Only `main` existed locally; no Git remote was configured. Pending code consisted of the avatar fix plus documentation/maintenance instructions; these are consolidated with the portability changes. No independent local branch required a merge.
- Local environment files and the existing hosting identity remain on disk and ignored. Historical commits contain non-secret project/deployment identifiers; no real timesheet exports or database dumps are included in the current source tree. No production database or hosted deployment was changed.
- Arbitrary database adapters, full signed-in browser flows and local container persistence were not tested or implemented in this change.

## Earlier verification — September 20, 2026


## Automated checks

- `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build` passed on September 20.
- Eight tests cover duration parsing/rejection, individual-entry preservation, calendar arithmetic, cross-month totals, stable entry IDs/revisions, CSV escaping/formula protection, and a nonempty multipage PDF with long descriptions.
- Production client/server builds succeeded. Vinext reported a non-fatal route-classification notice.

## Hosted Supabase checks (September 19)

- Applied versioned migration `20260919215941_timesheet_core` to the selected PegaSupport Timesheets project.
- Ran `supabase/tests/isolation.sql` against hosted PostgreSQL inside a rolled-back transaction. Assertions passed for anonymous denial, two-user read/write isolation, owner spoofing rejection, cross-owner project rejection, duplicate request retry, stale revisions, and immutable sent snapshots after source edits.
- Tests left no test accounts or records behind.
- Supabase security advisor returned no findings.

## UI evidence

The approved UI draft was inspected at desktop 1280×720 and mobile 390×844 in light/dark modes. Mobile used day editing with no horizontal overflow. Editing separate records in weekly and daily views preserved sibling descriptions and produced matching daily, weekly and monthly totals. Invalid duration input remained visible. A simulated missing-connection failure preserved draft values. The connected sign-in screen was subsequently inspected.

## Limits

- Draft UI evidence is not proof of a completed signed-in Supabase browser save. Database behavior was tested separately as above; live account login/save, password-reset email delivery, and cross-device sessions still need end-to-end account testing.
- User reported local Auth redirect settings updated; hosted Auth redirect settings have not been independently verified.
- Failed-save input is retained in the current tab. Closing/reloading can lose unsaved drafts; the app warns before leaving.
- PDF generation is tested, but generated PDFs have not yet received visual inspection.
- Weekly cells open a keyboard-accessible detailed editor; direct spreadsheet-style inline typing is not implemented.
- Manual UI checks are not a full accessibility audit.
