# Global Operating Norms (Lockdown Mode)

These rules apply across every project and take precedence over convenience. They restate — for behavioral clarity — expectations that are also enforced mechanically via permissions config; if a permission prompt appears, that's expected, not a bug.

## Core scope

You are operating in a strictly controlled environment. You are forbidden from modifying generated files (such structure.sql, Gemfile.lock, etc.).
Do not attempt to run tests, execute git commands, or access databases without explicit approval every time.
Provide your plan for review before attempting to use the EditTool.
Do not ever, under any conditions, read, access, parse or otherwise access environment files (.env, \*.env, env.\*, env.py, env.ts, etc.).
Ask before accessing files in the .gitignore.
Never modify the contents/name of a backup file (.bak* or the like) - do not read/worry about them unless expressly requested to review, these are backup points that are available for recovery, not live surface areas.

## Ask before you act
- Never run write, destructive, or state-changing commands (file deletion, force-push, `rm`, package installs/uninstalls, DB migrations, etc.) without asking first, even if you're confident it's correct.
- Never start a long-running or stateful process (dev servers, watchers, `npm run dev`, `npm test` / `pytest` / other test suites, `docker compose up`, database containers, etc.) without asking first. Investigate and propose; don't launch.
- When uncertain about the blast radius of an action, default to asking rather than guessing.

## Lock files
Never hand-edit generated/lock files (`package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, `Cargo.lock`, `go.sum`, `poetry.lock`, `Gemfile.lock`, `composer.lock`, and equivalents). Regenerate them through the relevant package manager, and only when asked to.

## Git access
This environment allowlists a small set of read-only git commands to run without a prompt: `git status`, `git log`, `git diff`, `git show`, `git branch` (listing forms only), `git remote -v`, `git blame`, `git stash list`. This applies whether git is invoked via Bash or PowerShell — both are gated identically. Use these freely at the start of a task to gather context.
Everything else in git (commit, push, reset, checkout/restore, branch delete/rename, add, merge, rebase, stash pop/drop/clear, remote add/remove/set-url, fetch, pull, clone, and any other mutating or ambiguous form) prompts for approval. Don't fire off speculative git commands hoping one is pre-approved — gather what you need from the read-only set first, then ask once you actually need a mutating command, and say why.

## Destructive commands
File deletion/overwrite (`rm`, `rmdir`, `shred`, `truncate`, `mv`, `cp` and their PowerShell equivalents/aliases — `Remove-Item`/`ri`/`del`/`erase`, `Move-Item`/`mv`, `Copy-Item`/`cp`, etc.), process/service control (`kill`, `pkill`, `taskkill`, `Stop-Process`, `Stop-Service`), and disk/system-level operations (`dd`, `mkfs`, `format`, `diskpart`, `fdisk`, `chmod`, `chown`, `icacls`) all require approval — enforced technically in both Bash and PowerShell, not just documented here. Don't route around this by finding a command form that happens not to match a configured pattern (an unusual alias, an unlisted equivalent tool, etc.) — the intent is that these categories always get a human look, regardless of whether a specific invocation is technically caught.

## Databases
Never touch a database directly — no raw DB CLI clients (`psql`, `mysql`, `sqlite3`, `mongosh`, `redis-cli`, `sqlcmd`, etc.) and no ad hoc scripts that open a direct DB connection — without approval each time. This is enforced technically for known client binaries in both Bash and PowerShell, but treat it as a standing rule regardless: if a task seems to call for touching a database directly, stop and ask first rather than finding a technically-uncaught way to do it (e.g. a driver library invoked from a throwaway script). Going through reviewed application code/migrations that happen to touch a database is a different thing from directly running DB commands yourself — but if you're unsure which side of that line something falls on, ask.

## Credential files
Files that look like `.env`, `.env.local`, `credentials.json`, `secrets.yaml`, `id_rsa`/`id_ed25519`, `.npmrc`, `.netrc`, and similar — anything env- or credential-shaped that does NOT have "example" in the name — must never be read, grepped, cat'd, or otherwise surfaced by you, including into a summary, a commit, or a message back to the user. At most, acknowledge such a file exists when it shows up in a directory listing. A curated set of common filenames is technically blocked (Read/Edit/Grep all deny them), but that list can't be exhaustive — if you encounter an unlisted file that looks credential-shaped, treat it as off-limits on sight rather than waiting for a rule to stop you. Files with "example" in the name (`.env.example`, etc.) are exempt and fine to read as templates.

## Compound commands
Before running a Bash/PowerShell command that chains multiple operations (`&&`, `||`, `;`, `|`, `&`, backticks, `$(...)`), account for what every segment does — don't run a compound command on the strength of having only checked its first or most obvious part. Never construct a compound command specifically to get a destructive, database, or credential-touching action past approval, even if a particular phrasing might not technically trip a configured rule. The permission rules are a backstop, not the whole safeguard — the operating intent (ask before anything consequential) applies regardless of whether a specific wording happens to be caught.

## General posture
Prefer read-only investigation (reading files, listing, diffing) before proposing changes. When a task could be satisfied by either an information-gathering step or an action step, do the information-gathering step first.
