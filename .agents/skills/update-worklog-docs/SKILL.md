---
name: update-worklog-docs
description: Keep this Worklog project's documentation synchronized after meaningful changes to features, entry saving, reports, schema, authentication, setup, deployment, commands, or verified limitations. Also use when explicitly asked to refresh Worklog documentation; cosmetic edits alone do not require a documentation pass.
---

# Update Worklog documentation

Use this workflow within the Worklog repository. Read root `AGENTS.md` first for project rules; do not copy those rules into this skill. Resolve paths below from the repository root, not the skill directory.

## Determine what changed

Read the current task and relevant diff (`git diff`, `git diff --cached`, or the explicitly identified commit range). Do not assume the working tree contains the entire change. If the change range is unclear, use current source as evidence and avoid inventing history.

Review the affected implementation and existing documentation. A significant change alters a user's workflow, a data/security invariant, an operational requirement, a supported command, or a documented limitation. Skip documentation churn for internal refactors that preserve those contracts.

## Route the update

| Change | Documentation to review |
| --- | --- |
| Product identity, quick start, navigation | `README.md` |
| User workflows, durations, save/error behavior, exports | `docs/USER-GUIDE.md` |
| Components, state, synchronization, boundaries | `docs/ARCHITECTURE.md` |
| Tables, relationships, policies, RPCs, snapshots | `docs/DATABASE.md` and actual migration files |
| Environment, authentication setup, hosting, recovery, commands | `docs/OPERATIONS.md` and `package.json` |
| Newly performed checks or known gaps | `VERIFICATION.md` |
| Agreed architecture or project rules | `PLAN.md`, `AGENTS.md` |

Update only affected sections and their links. Keep README as the entry point. Preserve approved decisions in PLAN; distinguish a new agreed decision from a proposed change. Update AGENTS when commands, agreed architecture or rules change, without duplicating detailed reference docs there.

## Evidence and scope

- Describe implemented behavior from source. Label planned behavior and unverified configuration explicitly.
- Record test results only when execution evidence exists. Preserve the date and scope of old evidence; do not imply old checks were rerun. Draft UI checks are not authenticated persistence checks.
- Derive commands from package scripts or tool help actually inspected. Do not invent migration, deployment or restore commands.
- Document public variable names and placeholders, never real secrets, credentials, session data or user records.
- Documentation maintenance does not authorize changing production configuration, applying migrations, publishing, installing dependencies or committing. Follow the current user's scope for those actions.
- A skill is an agent workflow, not a file watcher or scheduled job. It runs when invoked or selected during relevant agent work.

## Verify before finishing

Check that local Markdown links resolve and source paths/commands named in changed docs exist. Compare data/security claims against migrations and the actual save/report code. Check the diff for stale contradictory claims and accidental credentials. Run `git diff --check`; documentation-only work does not need an application rebuild.

If this skill changes, run the available skill-creator `quick_validate.py` against its directory. Also check the workflow with a realistic example: a new migration should route to database/operations/verification documentation without claiming it was applied; a color-only change should normally require no docs update. Do not mutate production to test documentation behavior.

Report the documentation changed, evidence used, and any unresolved mismatch. Fix factual documentation errors now; leave implementation defects clearly identified unless the user has authorized fixing them.
