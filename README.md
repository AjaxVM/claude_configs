# claude_configs

Personal global config for [Claude Code](https://code.claude.com), shared across machines (macOS, Windows, Linux). Everything here is **user-level** — it applies to every project on a machine, not just one repo.

## What's in here

| File | Installs to | Purpose |
|---|---|---|
| `CLAUDE.md` | `~/.claude/CLAUDE.md` | Global behavioral norms — lockdown/ask-first posture, lock-file handling, git-access notes, destructive-command/database/credential-file/compound-command rules. Loaded into every session's context. |
| `settings.json` | `~/.claude/settings.json` | Permission rules — git gating, destructive-command and DB-client gating (mirrored across both the `Bash` and `PowerShell` tools), credential-file read/edit/grep denies — plus `defaultMode`, `statusLine` wiring, enabled plugins. |
| `statusline.js` | `~/.claude/statusline.js` | Node script that renders the terminal status line (model/effort, context usage, 5h/weekly rate-limit usage + reset times, current dir, a best-effort session description). |

`~/.claude/` is the same relative path on every OS — it's just `$HOME/.claude` (macOS/Linux) or `%USERPROFILE%\.claude` (Windows, e.g. `C:\Users\<you>\.claude`). Claude Code creates this directory itself on first run.

## Install on a new machine

Requires **Node.js on PATH** (`node --version`) — the status line script needs it. Everything else here is plain JSON/Markdown, no other dependencies.

```bash
# macOS / Linux
cp CLAUDE.md ~/.claude/CLAUDE.md
cp statusline.js ~/.claude/statusline.js

# Windows (PowerShell)
Copy-Item CLAUDE.md ~/.claude/CLAUDE.md
Copy-Item statusline.js ~/.claude/statusline.js
```

`settings.json` is **not** a blind copy — merge it into whatever's already at `~/.claude/settings.json` on that machine (it may have machine-local values like `theme`, or plugins you haven't set up there yet). The keys that matter from this file:

- `defaultMode` — keep as `"default"` (interactive/manual). Don't set this to `"acceptEdits"` or `"bypassPermissions"` unless you mean to loosen things everywhere.
- `statusLine` — points at `node ~/.claude/statusline.js`. Deliberately uses `~` and forward slashes (not a hardcoded absolute path) so it resolves the same way via bash/zsh on macOS/Linux and via Git Bash on Windows, and keeps working if Node gets reinstalled somewhere else.
- `permissions.allow` / `permissions.ask` — the git gating rules (see below). Merge these arrays in rather than overwriting an existing `permissions` block, or you'll drop whatever's already configured there.
- `enabledPlugins` — declares desired plugin state, but does **not** install anything by itself. On a new machine, install separately, e.g.:
  ```
  claude plugin install frontend-design@claude-plugins-official
  ```
  (`claude-plugins-official` is Anthropic's default marketplace and should already be configured; run `claude plugin marketplace list` to check.)

Restart Claude Code (or start a fresh session) after installing — `CLAUDE.md`, `settings.json`, and `statusLine` are all read at session start, not hot-reloaded mid-session.

## Why the permission rules are shaped this way

Claude Code evaluates permission rules as **deny → ask → allow → defaultMode fallback**, in that fixed order, *regardless of how specific a rule is*. Concretely: if a command matches both an `ask` rule and a more-specific `allow` rule, `ask` still wins; and if it matches both a `deny` and a narrower `allow`, `deny` wins unconditionally — **there is no negation and no allowlist carve-out inside a deny/ask rule, for Bash command rules or Read/Edit/Grep path rules alike.** That's why `settings.json` here never has an `allow` and `ask` rule with overlapping prefixes (e.g. no blanket `Bash(git:*)` anywhere) — the read-only git allowlist and the mutating-git ask-list are built from disjoint literal command prefixes on purpose. If you extend either list, keep them disjoint or the more restrictive rule will silently win.

Also worth knowing: `Bash(git branch:*)`-style trailing wildcards match on a word-boundary, not just a prefix — `git branch:*` would match both `git branch` (safe) and `git branch -D foo` (not safe). That's why `branch`/`remote`/`stash`/`tag` use exact forms in the allowlist instead of a wildcarded subcommand.

**Don't trust the `defaultMode` fallback as your only line of defense.** Early on, this config relied on "default mode prompts for anything outside a tiny hardcoded read-only safelist" to gate non-git destructive commands like `rm` — and in practice `rm` ran with zero prompt anyway (root cause never fully pinned down; possibly a different effective permission mode in a given host/UI). The fix, and the standing rule for this file: anything you actually want gated needs an **explicit `ask` or `deny` rule**, never an assumption about fallback behavior. That's why `permissions.ask` now explicitly enumerates destructive commands (`rm`, `mv`, `cp`, `dd`, `chmod`, `kill`, etc.) and direct DB CLI clients (`psql`, `mysql`, `sqlite3`, `mongosh`, `redis-cli`, `sqlcmd`, …) rather than leaning on the fallback.

**`PowerShell` is a separate permission namespace from `Bash`, not an alias.** A rule written as `Bash(rm:*)` does **not** cover the same command run through the `PowerShell` tool — it needs its own `PowerShell(Remove-Item:*)`-style rule. This config mirrors every Bash rule (git gating, destructive commands, DB clients) into an equivalent `PowerShell(...)` rule, including common PowerShell aliases (`ri`/`del`/`erase`/`rd` for `Remove-Item`, `mv`/`cp`/`kill` etc.) — those aliases are literal command text as far as the permission matcher is concerned, so each one needs its own rule; alias resolution isn't automatic.

**Credential files are blocked at the `Read`/`Edit`/`Grep` tool level**, using gitignore-style path rules (`Read(.env)` matches `.env` at any depth — no `**/` prefix needed for a bare filename). Because deny rules can't carve out exceptions, the credential deny-list uses **explicit non-wildcarded filenames** (`.env`, `.env.local`, `credentials.json`, `id_rsa`, …) rather than a wildcard like `Read(.env.*)` — a wildcard broad enough to catch every real secret variant would also catch `.env.example`, and there's no way to exempt it once denied. This means the list is necessarily a curated set, not exhaustive coverage of every possible credential filename — `CLAUDE.md`'s "Credential files" section covers the rest behaviorally (treat anything credential-shaped as off-limits on sight, even if unlisted).

Non-git, non-destructive, non-DB Bash/PowerShell commands still aren't given explicit rules — Claude Code's own hardcoded read-only safelist (`ls`, `cat`, `grep`, `find`, `pwd`, etc., plus read-only git forms) covers the common case, and `defaultMode: "default"` is the fallback for everything else *not* already covered by an explicit rule above.

## Verifying it worked

- `/memory` inside a session should list the global `CLAUDE.md`.
- `git status` / `git log` / `git diff` should run without a prompt (Bash **and** PowerShell); `git commit` / `git push` / `git branch <name>` should prompt (Bash **and** PowerShell).
- `rm somefile` (Bash) and `Remove-Item somefile` / `rm somefile` (PowerShell) should prompt. `psql`, `mysql`, `sqlite3`, etc. should prompt in both tools too.
- Ask Claude to read a file named `.env` (or `.env.local`, `credentials.json`, etc.) in a test directory — it should be unable to, while a same-named file with `example` in it (`.env.example`) reads fine.
- The status line should render after your first message in a session, in the form:
  `./<dir> | "<session description>" | usage: <5h>% current (<time>), <7d>% weekly (<day> <time>) | <model> (<effort>) | <tokens used>/<tokens total> (<pct>)`

## Bringing in the work-machine version

The work-machine `CLAUDE.md` has more refined guardrails than this starting point — when copying it over, drop it in here (replacing this repo's `CLAUDE.md`) rather than just onto the work machine, so it becomes the shared baseline for every machine going forward.
