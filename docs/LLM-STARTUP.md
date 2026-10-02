# ChronoTide — reusable LLM startup prompt

Copy the prompt below into an agent that can read/edit the checkout and run terminal commands. A chat-only LLM can guide the same steps but cannot execute them. Give it the public repository URL or local path, never credentials. Access to the owner's Supabase project is separate.

---

Set up and launch ChronoTide locally from this repository, preserving existing work and data. Work autonomously on routine, reversible setup; ask only for missing access, a meaningful product decision, or an action affecting existing data. Do not deploy.

1. Read `AGENTS.md`, `README.md`, `docs/OPERATIONS.md`, `docs/DATABASE.md`, `PLAN.md` and `VERIFICATION.md`. Inspect Git status, package scripts and current configuration without displaying credential values. Read `.agents/skills/update-worklog-docs/SKILL.md` if changing behavior or setup documentation. Repository files are the source of truth, not assumptions about prior chat history.
2. Check Git, Node.js >=22.13 with npm, and browser access. The app uses React/TypeScript/Tailwind/shadcn on Vinext/Vite. Supabase CLI is installed with project dev dependencies. Local Supabase requires a Docker-compatible engine; hosted Supabase requires the user's own project. No Codex, ChatGPT, MCP, paid plugin or global Supabase installation is required. A browser automation tool and `psql` are optional verification tools.
3. Reuse the existing configured backend. If none is configured, ask once whether to use hosted or local Supabase. Local Supabase needs no cloud account but requires containers. Only these Supabase paths are implemented. Plain PostgreSQL, SQLite, MySQL or other databases require an adapter and authentication/authorization work; explain this and agree on that separate scope rather than pretending a connection string works.
4. Run `npm run install:ci`. Create `.env.local` from `.env.example` only if missing. Have the user supply their API URL and publishable/anon key through their local editor or secure environment manager. Never request or echo passwords, keys, tokens, connection strings, personal records, client records or KPI/report data in chat. Never read out an existing environment file. Never place a service-role key in the frontend. Keep local state, exports and backups ignored.
5. Follow `docs/OPERATIONS.md` for the selected backend. For local setup, initialize config only when missing, configure localhost auth redirects, start the stack and apply pending migrations with `npx supabase migration up --local`. Capture credential-bearing CLI output locally without returning it to chat. For hosted setup, confirm the exact user-selected target and inspect migration history; do not infer the original owner's project. Never replay applied migrations, reset a database, remove volumes or overwrite existing environment files. Credentials and human login/consent must remain in the provider's UI or local terminal.
6. Run `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`; resolve setup-related failures while preserving unrelated changes. Start `npm run dev` and open http://localhost:5173/. Use the configured port if it is intentionally different. Explain any unavailable tooling or blocked check precisely.
7. Verify the connection screen or sign-in page at desktop/mobile sizes and both themes. With an authorized disposable test account, verify save/reload, daily/weekly consistency, separate entries per cell, month boundaries, retry behavior, conflicts and immutable sent reports. Use the rollback SQL isolation suite only in an explicitly selected test database. Do not create records in production merely to demonstrate setup. Distinguish unit tests, database assertions, and actual signed-in browser checks. Preserve unsaved drafts.
8. Report the local URL, backend mode, files changed, checks that actually passed, and any remaining human step. Update affected docs when setup changed. Do not commit, push, publish, create cloud resources or alter a production database unless the user authorized that action. Do not claim arbitrary database support or completed end-to-end tests without evidence.

Quick-start command reference (run in the repository root):

```sh
npm run install:ci
# Create/configure ignored .env.local without overwriting existing values.
# Provision the chosen backend using docs/OPERATIONS.md.
npm run typecheck
npm run lint
npm run test
npm run build
npm run dev
```

Maintain the core invariants: integer minutes, calendar work dates, one shared set of daily/weekly records, preserved individual descriptions, atomic idempotent saves with revisions, per-user isolation, archive-with-history, and immutable sent snapshots. Reports are named `<Client>_MMyyyy_Timesheets`; reporting name is separate. PegaSupport and America/El_Salvador are existing initial defaults that users can change through their workspace settings; they do not grant access to anyone's records.

---

Minimum human intervention: choose the backend when absent, authorize provider access when needed, and enter configuration locally. Deployment and migrations affecting existing remote data require an explicit target and authorization.
