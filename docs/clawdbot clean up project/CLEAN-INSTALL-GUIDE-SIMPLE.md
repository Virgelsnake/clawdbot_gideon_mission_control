# OpenClaw Clean Install Guide — Simple Version

**For:** Non-technical team members  
**Date:** 4 February 2026  
**Time needed:** About 1 hour

---

## What This Guide Does

This guide helps you:
1. **Save** all the current Gideon files safely
2. **Remove** the old broken installation completely
3. **Install** a fresh, clean version
4. **Set up** Gideon to work with Telegram again

Think of it like moving house — we're packing up everything valuable, demolishing the old house, and building a new one from scratch.

---

## Before You Start

You'll need:
- [ ] About 1 hour of uninterrupted time
- [ ] The computer's admin password
- [ ] Fresh API keys (ask Steve for these)
- [ ] Access to the Terminal app

### How to Open Terminal
1. Press `Command + Space` (opens Spotlight)
2. Type `Terminal`
3. Press Enter

---

## Part 1: Stop Gideon

**What we're doing:** Turning off all the running parts of Gideon so we can work safely.

Open Terminal and type these commands **one at a time**, pressing Enter after each:

```
launchctl stop com.clawdbot.gateway
```
*This tells macOS to stop running Gideon automatically.*

```
pkill -9 clawdbot
```
*This force-stops any Gideon processes.*

```
pkill -9 node
```
*This stops the programming language Gideon runs on.*

**How to know it worked:** Type `ps aux | grep clawdbot` — you should see almost nothing (just one line mentioning "grep").

---

## Part 2: Save Your Files

**What we're doing:** Making a backup copy of everything before we delete it.

```
mkdir -p /Users/gideon/Archives/gideon-clawdbot-archive-20260204
```
*Creates a folder to store the backup.*

```
cp -R ~/.clawdbot /Users/gideon/Archives/gideon-clawdbot-archive-20260204/clawdbot-config
```
*Copies all settings and configuration.*

```
cp -R /Users/gideon/clawd /Users/gideon/Archives/gideon-clawdbot-archive-20260204/clawd-workspace
```
*Copies all workspace files including SOUL.md and MEMORY.md.*

**How to know it worked:** Type `ls /Users/gideon/Archives/gideon-clawdbot-archive-20260204/` — you should see "clawdbot-config" and "clawd-workspace".

---

## Part 3: Remove the Old Installation

**⚠️ WARNING:** Only do this AFTER Part 2 is complete!

**What we're doing:** Completely removing the old, broken installation.

```
launchctl unload ~/Library/LaunchAgents/com.clawdbot.gateway.plist
```
*Removes Gideon from auto-start.*

```
rm -f ~/Library/LaunchAgents/com.clawdbot.gateway.plist
```
*Deletes the auto-start file.*

```
npm uninstall -g clawdbot
```
*Removes the Gideon software.*

```
rm -rf ~/.clawdbot
```
*Deletes all settings and config.*

```
rm -rf /Users/gideon/clawd
```
*Deletes the workspace folder.*

```
rm -rf /tmp/clawdbot
```
*Deletes temporary files.*

**How to know it worked:** Type `ls ~/.clawdbot` — you should see "No such file or directory".

---

## Part 4: Install Fresh

**What we're doing:** Installing a brand new copy of OpenClaw (the new name for ClawdBot).

```
npm install -g openclaw
```
*Downloads and installs the software.*

If that doesn't work, try:
```
npm install -g https://github.com/openclaw/openclaw.git
```

**How to know it worked:** Type `openclaw --version` or `clawdbot --version` — you should see a version number.

---

## Part 5: Set Up

**What we're doing:** Configuring Gideon with your API keys and settings.

### Create workspace folder
```
mkdir -p /Users/gideon/clawd
```

### Run setup wizard
```
openclaw setup
```
*Follow the on-screen prompts.*

### Add your API keys

**Ask Steve for the fresh API keys**, then:

```
nano ~/.clawdbot/.env
```

Type in (replacing with real keys):
```
ANTHROPIC_API_KEY=paste-key-here
OPENAI_API_KEY=paste-key-here
OPENROUTER_API_KEY=paste-key-here
MOONSHOT_API_KEY=paste-key-here
BRAVE_API_KEY=paste-key-here
```

To save: Press `Ctrl+O`, then `Enter`, then `Ctrl+X`

---

## Part 6: Restore Important Files

**What we're doing:** Copying back the personality and memory files.

```
cp /Users/gideon/Archives/gideon-clawdbot-archive-20260204/clawd-workspace/SOUL.md /Users/gideon/clawd/
```

```
cp /Users/gideon/Archives/gideon-clawdbot-archive-20260204/clawd-workspace/MEMORY.md /Users/gideon/clawd/
```

---

## Part 7: Test It

**What we're doing:** Making sure everything works.

### Start Gideon manually
```
openclaw gateway
```
*Leave this terminal window open — it will show what Gideon is doing.*

### Test Telegram
1. Open Telegram on your phone
2. Find @gideonclawdbot
3. Send: `hello`
4. Wait up to 30 seconds for a reply

### If it works, install as a service
Open a **new** Terminal window and type:
```
openclaw gateway install
openclaw gateway start
```

Now Gideon will start automatically when the computer starts.

---

## Something Went Wrong?

### Gideon won't start
- Check the Terminal window for red error messages
- Make sure all API keys are entered correctly
- Ask Steve or check TROUBLESHOOTING.md

### No Telegram response
- Look at the Terminal window for errors
- Check if the bot token is correct
- Make sure Telegram is enabled in the config

### Need to undo everything
- Ask a technical team member
- The backup is safe in `/Users/gideon/Archives/`

---

## Glossary

| Term | Meaning |
|------|---------|
| Terminal | The app where you type commands |
| npm | A tool for installing software |
| API key | A password that lets Gideon talk to AI services |
| LaunchAgent | macOS feature that auto-starts apps |
| Gateway | The part of Gideon that runs all the time |

---

## Need Help?

1. Check TROUBLESHOOTING.md
2. Ask Steve
3. Check the archive folder for reference files

---

**Document created:** 4 February 2026
