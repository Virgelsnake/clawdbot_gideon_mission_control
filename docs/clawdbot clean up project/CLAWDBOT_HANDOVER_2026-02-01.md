# ClawdBot Model Configuration Handover Document

**Date:** 1 February 2026  
**Author:** Claude (Opus 4.5)  
**Owner:** Steve (Digital Technology Partner Ltd)  
**Status:** Gideon online on Claude Haiku 4.5

---

## Executive Summary

Gideon (ClawdBot instance) experienced multiple issues today:
1. **Runtime crash** — caused by corrupted npm dependencies from global package operations
2. **Token limit lockout** — OpenAI Codex model hit usage limits, blocking all responses
3. **OpenRouter/Kimi K2 integration failure** — model returned "401 No cookie auth credentials found" instead of actual responses

Gideon is now running on `anthropic/claude-haiku-4-5-20251001` and responding normally via Telegram.

---

## Current Configuration

### Active Model
```
Default: anthropic/claude-haiku-4-5-20251001
```

### Authenticated Providers
| Provider | Auth Method | Status |
|----------|-------------|--------|
| Anthropic | API Token | ✅ Working |
| OpenAI | API Key (env) | ✅ Available |
| OpenAI Codex | OAuth | ⚠️ Rate limited (5h 99% left) |
| OpenRouter | API Key (env) | ❓ Configured but Kimi K2 returning errors |

### Key Files
- Config: `~/.clawdbot/clawdbot.json`
- Auth profiles: `~/.clawdbot/agents/main/agent/auth-profiles.json`
- Logs: `/tmp/clawdbot/clawdbot-YYYY-MM-DD.log`
- Gateway logs: `~/.clawdbot/logs/gateway.log`

### Gateway
- Port: 18789
- Bind: loopback (127.0.0.1)
- Service: LaunchAgent (`com.clawdbot.gateway`)

---

## Top 5 Theories on OpenRouter/Kimi K2 Failure

### Theory 1: OpenRouter API Key Format Issue
**Likelihood:** High

**Observation:** The `clawdbot models status` output showed:
```
openrouter effective=env:Ysk-or-v...5089c2b2
```

Note the leading `Y` — OpenRouter keys typically start with `sk-or-`. This suggests either:
- A typo when entering the key
- An extra character was added
- The key was corrupted during JSON editing

**Solution:**
1. Verify your OpenRouter API key at https://openrouter.ai/keys
2. Re-enter the key carefully:
```bash
nano ~/.clawdbot/clawdbot.json
```
3. Ensure the key format is exactly: `sk-or-v1-xxxxx...`
4. Restart gateway after changes

---

### Theory 2: OpenRouter Account/Credit Issue
**Likelihood:** Medium-High

**Observation:** The "401 No cookie auth credentials found" message is unusual — it sounds like an authentication error being passed through as a model response rather than a proper error.

**Possible causes:**
- OpenRouter account has no credits
- API key is disabled or revoked
- Account requires email verification
- Free tier limits exceeded

**Solution:**
1. Log in to https://openrouter.ai/
2. Check account status and credits
3. Verify API key is active
4. Try generating a new API key if needed

---

### Theory 3: Model-Specific Routing Issue on OpenRouter
**Likelihood:** Medium

**Observation:** `openrouter/moonshotai/kimi-k2` may have specific requirements or may be temporarily unavailable.

**Possible causes:**
- Kimi K2 requires specific OpenRouter tier
- Model temporarily offline on OpenRouter
- Model requires additional authentication

**Solution:**
1. Test with a different OpenRouter model first:
```bash
clawdbot models set openrouter/anthropic/claude-3.5-haiku
```
2. If that works, the issue is Kimi-specific
3. Check OpenRouter status page for model availability

---

### Theory 4: ClawdBot System Prompt Incompatibility
**Likelihood:** Medium

**Observation:** Kimi K2 may not handle ClawdBot's system prompt/tool definitions the same way as Claude or GPT models.

**Possible causes:**
- Kimi K2 doesn't support the tool format ClawdBot uses
- System prompt structure confuses the model
- Model returns error strings instead of proper responses

**Solution:**
1. Check if ClawdBot has model-specific configurations
2. Try Kimi K2 with a minimal test:
```bash
clawdbot agent --model openrouter/moonshotai/kimi-k2 --message "Hello, respond with just 'OK'" --no-tools
```
3. If this works, the issue is tool/system prompt related

---

### Theory 5: JSON Configuration Corruption
**Likelihood:** Low-Medium

**Observation:** Earlier we had a JSON syntax error (`invalid character '\"' at 10:1`) after editing the config file.

**Possible causes:**
- Invisible characters introduced during editing
- Encoding issues
- Partial/corrupted save

**Solution:**
1. Validate the JSON:
```bash
python3 -c "import json; json.load(open('$HOME/.clawdbot/clawdbot.json'))"
```
2. If errors, examine the file carefully or regenerate from backup
3. Use `clawdbot doctor` to validate configuration

---

## Learnings, Mantraps & Gotchas

### 🔴 Critical Learnings

#### 1. Never Run Global npm Operations While ClawdBot is Running
**What happened:** Gideon ran `npm install -g clawdbot` / `npm uninstall -g clawdbot` which corrupted the `tslog` module in his own runtime.

**Prevention:** The WORKSPACE_RULES v1.3 document now prohibits:
- `npm install -g`, `npm uninstall -g`, `npm update -g`
- Any modifications to `/usr/local/Cellar/**` or `/usr/local/lib/node_modules/**`

#### 2. Model Token Limits Can Lock Out the Agent Completely
**What happened:** The OpenAI Codex model hit its daily limit, making Gideon unresponsive with no automatic fallback.

**Prevention:**
- Configure fallback models: `clawdbot models fallbacks add anthropic/claude-haiku-4-5-20251001`
- Monitor usage: `clawdbot models status`
- Keep at least one pay-as-you-go model configured (Anthropic API, OpenAI API)

#### 3. Manual JSON Editing is Error-Prone
**What happened:** Adding the OpenRouter key introduced a syntax error (missing comma).

**Prevention:**
- Use `clawdbot config set` commands where available
- Always validate after editing: `python3 -c "import json; json.load(open('$HOME/.clawdbot/clawdbot.json'))"`
- Keep a backup before editing: `cp ~/.clawdbot/clawdbot.json ~/.clawdbot/clawdbot.json.bak`

---

### 🟡 Gotchas & Quirks

#### 1. Shell Compatibility (zsh vs bash)
**Issue:** Gideon provided a command using `read -sp` which works in bash but fails in zsh.

**zsh equivalent:**
```bash
# bash: read -sp "Prompt: " VAR
# zsh:  echo -n "Prompt: " && read -s VAR
```

#### 2. Two ClawdBot Installations Can Exist
**Issue:** ClawdBot can be installed in both:
- `/usr/local/lib/node_modules/clawdbot/` (npm global)
- `/usr/local/Cellar/node@22/.../lib/node_modules/clawdbot/` (Homebrew node path)

These can conflict. The symlink at `/usr/local/bin/clawdbot` determines which is used.

**Check with:**
```bash
ls -la /usr/local/bin/clawdbot
```

#### 3. Gateway Must Be Restarted After Config Changes
**Issue:** Changes to `~/.clawdbot/clawdbot.json` don't take effect until restart.

**Standard restart:**
```bash
launchctl stop com.clawdbot.gateway && launchctl start com.clawdbot.gateway
```

#### 4. API Keys in Config Are Visible
**Issue:** The `clawdbot.json` file contains API keys in plaintext in the `env.vars` section.

**Caution:**
- Don't share this file
- Rotate keys if accidentally exposed
- Keys shared in this conversation should be rotated

#### 5. npx Can Download Different Versions
**Issue:** Running `npx clawdbot start` may prompt to download a different version than installed.

**Prevention:**
- Run directly: `node /usr/local/lib/node_modules/clawdbot/dist/entry.js start`
- Or ensure npm global bin is in PATH: `export PATH="$PATH:/usr/local/lib/node_modules/.bin"`

---

### 🟢 Useful Commands Reference

| Task | Command |
|------|---------|
| Check gateway status | `clawdbot gateway status` |
| Check all status | `clawdbot status` |
| Check current model | `clawdbot models status` |
| List available models | `clawdbot models list --all` |
| Set model | `clawdbot models set <provider/model>` |
| Restart gateway | `launchctl stop com.clawdbot.gateway && launchctl start com.clawdbot.gateway` |
| View logs | `tail -f /tmp/clawdbot/clawdbot-$(date +%Y-%m-%d).log` |
| Search logs for errors | `grep -i "error\|fail\|401" /tmp/clawdbot/clawdbot-*.log` |
| Validate config JSON | `python3 -c "import json; json.load(open('$HOME/.clawdbot/clawdbot.json'))"` |
| Backup config | `cp ~/.clawdbot/clawdbot.json ~/.clawdbot/clawdbot.json.bak` |

---

## Recovery Procedure

If Gideon becomes unresponsive:

### Step 1: Check if gateway is running
```bash
clawdbot gateway status
```

### Step 2: If not running, check for zombie processes
```bash
ps aux | grep clawdbot
pkill -f clawdbot  # Kill if needed
```

### Step 3: Check config is valid
```bash
python3 -c "import json; json.load(open('$HOME/.clawdbot/clawdbot.json'))"
```

### Step 4: Switch to a known-working model
```bash
clawdbot models set anthropic/claude-haiku-4-5-20251001
```

### Step 5: Restart gateway
```bash
launchctl stop com.clawdbot.gateway && launchctl start com.clawdbot.gateway
```

### Step 6: Test via Telegram
Send a simple message and check logs:
```bash
tail -20 /tmp/clawdbot/clawdbot-$(date +%Y-%m-%d).log
```

---

## Next Steps (When Ready)

### To Fix OpenRouter/Kimi K2:

1. **Verify OpenRouter API key** — check for typo (the `Y` prefix is suspicious)
2. **Check OpenRouter account** — ensure credits available
3. **Test with different OpenRouter model** — isolate if issue is Kimi-specific
4. **Consider direct Moonshot integration** — may require custom endpoint config

### To Add Model Fallbacks:
```bash
clawdbot models fallbacks add anthropic/claude-haiku-4-5-20251001
clawdbot models fallbacks add anthropic/claude-sonnet-4-5-20250929
```

### To Rotate Exposed API Keys:
- OpenAI: https://platform.openai.com/api-keys
- Anthropic: https://console.anthropic.com/
- OpenRouter: https://openrouter.ai/keys
- Brave: https://brave.com/search/api/

---

## Document References

- **CLAWDBOT_WORKSPACE_RULES_v1.3.md** — Self-preservation rules for Gideon
- **ClawdBot Docs** — https://docs.clawd.bot/
- **ClawdBot Troubleshooting** — https://docs.clawd.bot/troubleshooting

---

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 1 Feb 2026 | Claude (Opus 4.5) | Initial handover document |
