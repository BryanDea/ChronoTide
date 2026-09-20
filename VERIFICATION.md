# Verification — September 20, 2026

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
