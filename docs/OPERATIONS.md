# Setup and operations

## GitHub repository access

The source repository is public at https://github.com/BryanDea/ChronoTide. Anyone can read or fork it and propose a pull request. The owner has not added collaborators; public visibility does not give visitors push access or access to the owner's Supabase project or timesheet records.

The `main` branch requires a pull request, including for the owner. Force pushes and deletion are disabled. Create a branch for each change, push it, open a pull request and merge it after review. GitHub Free does not require an approving review here, so the owner can merge their own pull request. Repository administrators can still change protection settings; protect the GitHub account and review authorized apps, tokens and collaborators periodically.

GitHub secret-scanning alerts and push protection are enabled for this public repository. They supplement code review and local secret checks; they cannot detect every credential format or prevent secrets from being disclosed outside GitHub.

Do not commit `.env.local`, credentials, database exports or personal timesheet data. Public Git history is visible even if a later commit deletes a file. Review content and history before publishing any new sensitive material.

## Requirements

- Git, Node.js 22.13+ with npm, and a browser.
- Your own hosted Supabase project, or a Docker-compatible container engine for local Supabase.
- Supabase CLI is pinned in the project dependencies; use `npx supabase` after installing. No global CLI or LLM-specific integration is required.
- Optional: `psql` for the SQL isolation suite; GitHub CLI for repository maintenance.

## Install and configure

From the cloned repository root:

```sh
npm run install:ci
```

If `.env.local` does not exist, copy `.env.example` to `.env.local`. Preserve any existing environment. Set `NEXT_PUBLIC_SUPABASE_URL` to your backend's API URL and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to its publishable key (legacy anon key is supported). Never use a database connection string as the API URL.

These two values reach the browser. Row-level security and authenticated ownership checks protect data; frontend variables cannot hold privileged secrets. Keep all actual keys, tokens, passwords and connection strings out of Git, prompts, screenshots and logs. Enter values through a local editor or secure environment manager. Restart after local changes; rebuild for deployment.

## Hosted Supabase

1. Create or select your own Supabase project in the dashboard. An application user account is separate from a dashboard login. Enable MFA on the dashboard owner account and review organization members and access tokens regularly.
2. For a **new, empty project**, apply `supabase/migrations/20260919215941_timesheet_core.sql` in the SQL editor. For existing installations, inspect schema and migration history first; do not replay initial table-creation SQL. Keep later migrations versioned and apply in order. Dashboard execution does not populate CLI migration history automatically; reconcile history before switching workflows.
3. In project API settings, obtain the API URL and publishable key and set them locally as described above.
4. In Authentication → URL Configuration, use `http://localhost:5173` as Site URL for a local-only app and allow `http://localhost:5173/**`. For deployment use your actual HTTPS origin and its allowed redirects. Configure email delivery/confirmation as required.
5. Launch, register your own account and confirm email if enabled. Create a project and test saving a harmless entry in your own workspace.

CLI users can authenticate in their own terminal, link their chosen project, inspect migration history, and use `npx supabase db push --dry-run` before applying pending migrations. Discover login/link/history options through `--help`; never pass passwords or tokens in copied command examples. Do not apply changes to an inferred or previously linked production database.

## Local Supabase (local PostgreSQL)

Run a Docker-compatible engine. The initial startup downloads container images and requires network access and disk space. No hosted Supabase account is needed for this path.

```sh
# Only if supabase/config.toml is absent:
npx supabase init
# Start the stack, then apply any pending local migrations:
npx supabase start
npx supabase migration up --local
```

Before startup, set `[auth]` in `supabase/config.toml` to `site_url = "http://localhost:5173"` and `additional_redirect_urls = ["http://localhost:5173/**"]`. Keep local configuration private. Never use `init --force` over existing configuration. These commands were checked against the installed CLI help; container startup has not been verified on this workstation.

Use the local API URL and publishable (or anon) key shown by the CLI in `.env.local`. CLI status/start output includes credentials: view it locally and do not paste it into an LLM, issue or documentation. Use local Studio to inspect schema and the local mail viewer for confirmation/reset messages; use the addresses reported by your installed CLI.

`npx supabase stop` stops the stack while retaining data. Do not use `db reset`, delete volumes, or use `stop --no-backup` on data you need. Local storage is not a backup. Avoid committing seeds containing real records.

Local Supabase provides PostgreSQL **and** the Auth/API services the app needs. Plain PostgreSQL, SQLite, MySQL and D1 require a new backend adapter; see [database portability](DATABASE.md#database-portability).

Official reference: [Supabase local development](https://supabase.com/docs/guides/local-development/cli/getting-started).

## Launch and verify

```sh
npm run typecheck
npm run lint
npm run test
npm run build
npm run dev
```

Open http://localhost:5173/. Verify signup/signin, profile settings, project creation, daily/weekly synchronization, save/reload, failed-save draft retention, monthly reports and frozen sent snapshots. Use two disposable users in a test backend for isolation testing. Run `supabase/tests/isolation.sql` with a privileged SQL connection **only against an explicitly selected test database**. It rolls back its synthetic test records. Do not copy real data into tests.

See [VERIFICATION.md](../VERIFICATION.md) for completed checks and limits. The browser app needs its backend available; it is not offline-first.

## Deployment is separate

Building does not publish. Choose your hosting provider and configure only browser-safe application values there. The retained Sites starter is optional; a checkout-local `.openai/hosting.json`, if present, identifies that checkout's deployment and must not be reused by another user. Do not publish automatically during startup. Confirm the intended target/audience and follow that provider's supported deployment workflow. No existing production deployment is changed by the GitHub move.

## Troubleshooting and recovery

| Symptom | Action |
| --- | --- |
| Missing configuration screen | Check variable names and API URL; restart/rebuild |
| App asks for login despite dashboard login | Create/sign into an application account |
| Email/reset redirect fails | Check Site URL, redirect allowlist and email provider/local mail viewer |
| Tables/RPCs missing | Verify selected backend and migration state |
| Local startup fails | Check container engine, port conflicts and available disk; preserve volumes |
| Save fails | Keep tab open, restore backend connectivity, retry the same request |
| Revision conflict | Preserve unsaved work before reload; review latest records and reapply intended edits |
| Empty projects | Create a project for the client; archived projects cannot receive new work |
| Mark as sent unavailable | Set reporting name, select a client and save pending changes |

CSV/PDF exports are reports, not database backups. No automated backup/restore procedure is configured or tested. Snapshots live in the same database; plan backups separately. Moving to a different backend does not migrate users or records automatically.
