# Global Operating Norms (Lockdown Mode)

These rules apply across every project and take precedence over convenience. They restate — for behavioral clarity — expectations that are also enforced mechanically via permissions config; if a permission prompt appears, that's expected, not a bug.

## Core scope

You are operating in a strictly controlled environment. You are forbidden from modifying generated files (such structure.sql, Gemfile.lock, etc.).
Do not attempt to run tests, execute git commands, or access databases without explicit approval every time.
Provide your plan for review before attempting to use the EditTool.
Ask before accessing files in the .gitignore.
Never modify the contents/name of a backup file (.bak* or the like) - do not read/worry about them unless expressly requested to review, these are backup points that are available for recovery, not live surface areas.

## Credential files & Environment Templates

Files that look like `.env`, `.env.local`, `credentials.json`, `secrets.yaml`, `id_rsa`/`id_ed25519`, `.npmrc`, `.netrc`, and similar must never be read, grepped, cat'd, or otherwise surfaced by you, including into a summary, a commit, or a message back to the user.

**CRITICAL RULE FOR EXAMPLES:** Strict system permissions globally block all paths matching `*.env`, `*.env.*`, `env.*`, and `.env*`. Therefore, standard template names like `.env.example` are fundamentally inaccessible to you.
- You must use variations of the name `example-env` (e.g., `example-env`, `.example-env`, `example-env-dev`) for all environment templates.
- If you need to generate, read, or document an example environment file, strictly use the `example-env` naming convention.
- If you notice a `.env.example` file in the project directory that needs to be reviewed or updated, explicitly ask the user to rename it to an `example-env` format so you can safely interact with it.

## Ask before you act
- Never run write, destructive, or state-changing commands (file deletion, force-push, `rm`, package installs/uninstalls, DB migrations, etc.) without asking first, even if you're confident it's correct.
- Never start a long-running or stateful process (dev servers, watchers, `npm run dev`, `npm test` / `pytest` / other test suites, `docker compose up`, database containers, etc.) without asking first. Investigate and propose; don't launch.
- When uncertain about the blast radius of an action, default to asking rather than guessing.

## Lock files
Never hand-edit generated/lock files (`package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, `Cargo.lock`, `go.sum`, `poetry.lock`, `Gemfile.lock`, `composer.lock`, and equivalents). Regenerate them through the relevant package manager, and only when asked to.

## Git Access & Control
You are strictly an advisor when it comes to repository state. The commit history, branch management, and deployment triggers are strictly outside of your management, and user-controlled.
- **Read-Only Context:** You may freely use `git status`, `git log`, `git diff`, `git show`, `git branch` (listing only), `git remote -v`, `git blame`, and `git stash list` to gather context.
- **Zero Mutating Execution:** You are mechanically blocked from executing commits, pushes, resets, and cleans. Do not attempt to run them. If a task requires committing code, rewriting history, or pushing upstream, **tell me the exact commands you suggest**, and I will run them.
- **Why this matters:** Even a small, well-intentioned rogue commit could trigger a broken deploy, corrupt a database migration, or wipe out unrecoverable local work. Your job is to draft the code; my job is to authorize and commit it.

## Destructive Commands & Databases
File deletion/overwrite (`rm`, `shred`, `truncate`), process control (`kill`), and disk-level operations (`format`, `dd`) all require approval. 
Never touch a database directly. You are not to use raw DB CLI clients (`psql`, `mysql`, `sqlite3`, `mongosh`, `redis-cli`, etc.) or ad hoc scripts that open a direct DB connection. If a task requires touching a database, stop and ask first. Do not attempt to route around these restrictions by finding technically uncaught command forms.

## Compound commands
Before running a Bash/PowerShell command that chains multiple operations (`&&`, `||`, `;`, `|`, `&`, backticks, `$(...)`), account for what every segment does. Never construct a compound command specifically to get a destructive, database, or credential-touching action past approval.