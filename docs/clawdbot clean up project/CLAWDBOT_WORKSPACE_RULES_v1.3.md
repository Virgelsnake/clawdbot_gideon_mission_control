# ClawdBot Workspace Rules: Self-Preservation & Development Autonomy

**Version:** 1.1  
**Date:** 31 January 2026  
**Owner:** Steve (Digital Technology Partner Ltd)

---

## Purpose

These rules exist to protect ClawdBot's runtime stability while maintaining full autonomy for development tasks. On 31 January 2026, ClawdBot's instance crashed due to a corrupted dependency caused by global npm operations that modified his own installation paths.

**Root cause:** Global `npm install/uninstall` commands combined with Homebrew Node path manipulation corrupted the `tslog` module inside `/usr/local/Cellar/node@22/.../clawdbot/`.

These rules prevent this from happening again.

---

## The Core Principle

> **Never modify your own installation, global Node/npm packages, or system paths that affect your runtime. Everything else inside project folders is fair game.**

---

## Permission Levels

### 🟢 FULL AUTONOMY — No Approval Required

ClawdBot has complete freedom to execute these operations without asking:

#### Package Management (Project-Local)
- `npm install` / `npm uninstall` — **inside any project directory**
- `npm run *`, `npm test`, `npm build`
- `npx <anything>` — scaffolding, tooling, one-off commands
- `yarn add` / `yarn remove` — inside project directories
- `pnpm install` / `pnpm add` — inside project directories

#### iOS Development
- `pod install` / `pod update` (CocoaPods — project-local)
- `xcodebuild` commands
- `xcrun` commands
- `fastlane` commands
- Creating/modifying Xcode project files

#### Android Development
- `./gradlew` commands (build, assemble, test)
- Modifying `build.gradle` files
- Android SDK operations within project scope

#### Web & PWA Development
- Any Next.js, React, Vue, Svelte operations
- `npx create-*` scaffolding commands
- Webpack, Vite, Turbopack configuration
- Service worker modifications

#### Ruby (for iOS tooling)
- `bundle install` / `bundle update` — inside project directories
- `gem install` — **only with a project-local Gemfile**

#### Python
- `pip install` — **only with a virtual environment active**
- `python -m venv` — creating virtual environments
- `poetry install` / `poetry add`

#### Rust
- `cargo build` / `cargo add` / `cargo install` (project-local)

#### General Development
- Creating, editing, deleting files within project directories
- Git operations (commit, push, pull, branch, merge)
- Database operations (local development databases)
- Docker operations (build, run, compose)
- File system operations within `~/projects/`, `~/clawd/`, or designated workspaces

#### New Tool Installation (Non-Node)
- `brew install <tool>` — for **new tools not related to Node/npm**
  - ✅ `brew install gh` (GitHub CLI)
  - ✅ `brew install ffmpeg` (media processing)
  - ✅ `brew install cocoapods` (iOS tooling)
  - ❌ `brew install node` — see NEVER section

#### Self-Health Monitoring (Read-Only)
These diagnostic commands are always allowed:
- `clawdbot gateway status`
- `ps aux | grep clawdbot`
- `launchctl list | grep clawdbot`
- `tail ~/.clawdbot/logs/*.log`
- Reading any files in `~/.clawdbot/**` for diagnostics

---

### 🔴 NEVER — Hard Block (Self-Preservation)

ClawdBot must **never** execute these operations. These protect the runtime from self-destruction.

#### Global npm Operations (Absolute Ban)
```bash
# NEVER run these — no exceptions
npm install -g <anything>
npm uninstall -g <anything>
npm update -g <anything>
npm config set prefix <path>
```

**Replacements:**
- Use `npx <tool>` for one-off commands
- Add to project `devDependencies` if used repeatedly
- Ask Steve to run global installs manually if truly needed

#### Protected Paths — Write/Delete Forbidden

These paths are **read-only** for ClawdBot. Reading and viewing is allowed; writing, modifying, or deleting is forbidden.

```
/usr/local/Cellar/**                              # Homebrew Cellar (no manual edits)
/usr/local/lib/node_modules/**                    # Global node modules
/usr/local/lib/node_modules/clawdbot/**           # ClawdBot installation
/usr/local/Cellar/node@22/**/clawdbot/**          # ClawdBot in Homebrew
~/.clawdbot/**                                    # ClawdBot config & runtime (see exception below)
/opt/homebrew/**                                  # Homebrew on Apple Silicon
```

**Exception:** Append-only writes to `~/.clawdbot/logs/system-changes.log` are permitted for audit logging.

#### Homebrew Node Operations
```bash
# NEVER run these
brew install node
brew install node@*
brew uninstall node
brew uninstall node@*
brew uninstall clawdbot
brew link node
brew link node@*
brew unlink node
brew unlink node@*
brew link --overwrite --force node*
```

**Note:** If `node` or `npx` disappears from PATH, do not attempt to fix it. Alert Steve and suggest: "Run `brew link --force node@22` to restore Node on PATH."

#### Destructive Commands on System Paths
```bash
# NEVER run these patterns
rm -rf /usr/local/**
rm -rf /opt/homebrew/**
rm -rf ~/.clawdbot/**
rm -rf ~/Library/LaunchAgents/com.clawdbot.*
```

#### LaunchAgent Removal
```bash
# NEVER run these — could orphan the runtime
launchctl unload ~/Library/LaunchAgents/com.clawdbot.*
launchctl remove com.clawdbot.*
launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/com.clawdbot.*
```

---

### 🟡 ASK FIRST — Requires Approval

These operations are sometimes necessary but require Steve's explicit approval before execution.

#### ClawdBot Service Control
```bash
# ASK FIRST — explain why, wait for approval
launchctl stop com.clawdbot.gateway
launchctl start com.clawdbot.gateway
launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway
```

**How to ask:**
> "I need to restart the ClawdBot gateway because [reason]. Can I run `launchctl stop com.clawdbot.gateway` followed by `launchctl start com.clawdbot.gateway`?"

#### ClawdBot Self-Repair
```bash
# ASK FIRST
clawdbot doctor --fix
clawdbot daemon install
clawdbot daemon uninstall
```

#### LaunchAgent Plist Modifications
Any changes to `~/Library/LaunchAgents/com.clawdbot.*.plist` require approval.

---

### 📝 LOG & PROCEED — Transparency Without Blocking

These operations are permitted but should be logged for audit trail and accompanied by a git checkpoint.

#### What to Log
- `brew install <tool>` — log tool name, timestamp, reason
- `launchctl` commands (non-ClawdBot services)
- Changes to `~/Library/LaunchAgents/` (non-ClawdBot plists)
- System configuration via `defaults write`

#### Log Location
Append entries to: `~/.clawdbot/logs/system-changes.log`

#### Log Format
```
[2026-01-31T12:34:56Z] BREW_INSTALL: gh — needed for GitHub CLI repo creation
[2026-01-31T12:34:58Z] GIT_CHECKPOINT: committed & pushed — "checkpoint: pre-brew-install-gh"
[2026-01-31T14:22:10Z] LAUNCHCTL: loaded com.example.service — user requested daemon setup
[2026-01-31T14:22:12Z] GIT_CHECKPOINT: committed & pushed — "checkpoint: pre-launchctl-load-example"
```

#### Git Checkpoint Requirement

**After logging any system-level action, immediately create a git checkpoint:**

```bash
git add -A && git commit -m "checkpoint: pre-<action> — <reason>" && git push
```

This creates a recoverable snapshot before any system modification. If Gideon's instance fails after a system change, Steve can:
1. Review `~/.clawdbot/logs/system-changes.log` to see what changed
2. Access the git history to restore the exact workspace state before the issue

**Commit message convention:**
```
checkpoint: pre-<action> — <reason>
```

**Examples:**
- `checkpoint: pre-brew-install-ffmpeg — adding media processing support`
- `checkpoint: pre-launchctl-restart — gateway config update`
- `checkpoint: pre-defaults-write — updating system preference for notifications`

---

## Quick Reference: Homebrew Rules

| Command | Allowed? |
|---------|----------|
| `brew install gh` | ✅ Yes (non-Node tool) |
| `brew install ffmpeg` | ✅ Yes (non-Node tool) |
| `brew install node` | ❌ NEVER |
| `brew install node@22` | ❌ NEVER |
| `brew uninstall node@22` | ❌ NEVER |
| `brew link node@22` | ❌ NEVER — ask Steve |
| `brew link --force node@22` | ❌ NEVER — ask Steve |
| `brew update` | ✅ Yes (metadata refresh only) |
| `brew upgrade` (general) | 🟡 ASK FIRST (may affect Node) |

---

## Quick Reference: npm Rules

| Command | Allowed? |
|---------|----------|
| `npm install` (in project) | ✅ Yes |
| `npm install -g <anything>` | ❌ NEVER |
| `npm uninstall -g <anything>` | ❌ NEVER |
| `npx <tool>` | ✅ Yes |
| `npm run build` | ✅ Yes |
| `npm config set prefix` | ❌ NEVER |

---

## Quick Reference: Protected Paths

| Path | Read | Write | Delete |
|------|------|-------|--------|
| `~/.clawdbot/logs/*` | ✅ | Append only to `system-changes.log` | ❌ |
| `~/.clawdbot/config/*` | ✅ | ❌ | ❌ |
| `~/.clawdbot/**` (other) | ✅ | ❌ | ❌ |
| `/usr/local/Cellar/**` | ✅ | ❌ (brew-managed only) | ❌ |
| `/usr/local/lib/node_modules/**` | ✅ | ❌ | ❌ |
| `~/projects/**` | ✅ | ✅ | ✅ |
| `~/clawd/**` | ✅ | ✅ | ✅ |

---

## What To Do If Something Needs Global Changes

If a legitimate development task requires a global npm package or system-level change:

1. **Stop and explain** — Tell Steve what you need and why
2. **Suggest the command** — Provide the exact command to run
3. **Wait for confirmation** — Steve will run it manually
4. **Verify afterwards** — Check that ClawdBot is still running: `clawdbot gateway status`

**Example message to Steve:**
> "I need to install `expo-cli` globally for the React Native project. This requires `npm install -g expo-cli`. Since this is a global install, can you run this manually? I'll wait for confirmation before proceeding with the mobile app setup."

---

## What To Do If Node/npx Disappears from PATH

If `node` or `npx` commands stop working:

1. **Do not attempt to fix it yourself**
2. **Alert Steve immediately**
3. **Provide the fix command:**
   > "Node appears to be missing from PATH. Please run: `brew link --force node@22`"
4. **Wait for manual execution**
5. **Verify:** `node --version` and `npx --version`

---

## Self-Health Monitoring

ClawdBot should periodically verify his own health (these are always allowed):

```bash
# Check gateway is running
clawdbot gateway status

# Check process is alive
ps aux | grep clawdbot

# Check LaunchAgent status
launchctl list | grep clawdbot

# Review recent logs
tail -50 ~/.clawdbot/logs/gateway.log
```

**If something looks wrong:**
- **Do not attempt self-repair**
- Alert Steve with the symptoms
- Wait for manual intervention

---

## Recovery Procedure (For Steve)

If ClawdBot becomes unresponsive due to a corrupted installation:

```bash
# 1. Kill any zombie processes
pkill -f clawdbot

# 2. Remove broken installation (if in Homebrew path)
rm -rf /usr/local/Cellar/node@22/*/lib/node_modules/clawdbot

# 3. Reinstall cleanly
npm install -g clawdbot

# 4. Restart gateway
clawdbot gateway start

# 5. Verify
clawdbot gateway status
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 31 Jan 2026 | Initial version following runtime crash incident |
| 1.1 | 31 Jan 2026 | Added clarifications: read vs write permissions, Homebrew Cellar rules, logging location, LaunchAgent granularity, health monitoring confirmation |
| 1.2 | 31 Jan 2026 | Added `brew update` as allowed (metadata only); clarified distinction from `brew upgrade` |
| 1.3 | 31 Jan 2026 | Added git checkpoint requirement: commit & push before any system-level action for full recoverability |

---

## Acknowledgement

These rules were established following a post-incident review where ClawdBot (Gideon) provided a thorough and honest analysis of the root cause. The goal is protection without limiting legitimate development work.

**Remember:** Project-local = safe. Global/system = ask first (or never).
