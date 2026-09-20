# 🚀 FileLink AI - Quick Start Guide

## ✨ What You Have Now

1. **Beautiful CMD Chat Interface** - Like Claude CLI with colors and live streaming
2. **Real-time Command Execution** - See output as it happens
3. **Token Counting** - Track your usage
4. **Device Selection** - Choose which PC to control
5. **Easy Startup Scripts** - One-click to start everything

---

## 🎯 Three Ways to Use FileLink AI

### Option 1: Beautiful CMD Chat (Recommended)
```cmd
1. Double-click: start-all.cmd
   (Starts Omniroute + Dev Server)

2. Open new terminal and run: ai-chat.cmd
   (Opens beautiful CLI chat)

3. Select your device and chat!
```

### Option 2: Browser Interface
```cmd
1. Double-click: start-all.cmd
2. Open: http://localhost:8081
3. Click AI tab (✨ Sparkles icon)
4. Select device and chat
```

### Option 3: Manual Startup
```cmd
Terminal 1: start-omniroute.cmd
Terminal 2: npm run dev
Terminal 3: node ai-cli.mjs  (for CLI) OR open browser
```

---

## 🎬 CMD Chat Interface Features

```
╔════════════════════════════════════════════════════════════╗
║            ✨ FileLink AI Assistant ✨                      ║
╚════════════════════════════════════════════════════════════╝
  Powered by Claude • Real-time command execution

Connected Devices:
  1. DESKTOP-HGFVUCO (win32 cli) ● Online

Select device number: 1

  Tokens used: 245 • Session: 4 messages

You: Check the PC OS system

┌─ Executing: get_device_info ────────────────────────────┐
│ Status: ✅ Completed
│ {
│   "os": "Windows 10 Pro",
│   "cpu": "Intel Core i7",
│   "ram": "16 GB"
│ }
└──────────────────────────────────────────────────────────┘

AI: I've checked your PC's OS system. Here's what I found:

- OS: Windows 10 Pro (10.0.19045)
- CPU: Intel Core i7-9700K @ 3.60GHz
- RAM: 16 GB
```

---

## 🔧 Files Created

### Startup Scripts
- **`start-all.cmd`** - Starts both Omniroute and dev server (ONE CLICK)
- **`start-omniroute.cmd`** - Starts only Omniroute proxy
- **`ai-chat.cmd`** - Launches beautiful CMD chat interface

### AI Files
- **`ai-cli.mjs`** - Beautiful terminal chat with colors, tokens, permissions
- **`START_AI.md`** - Complete documentation

---

## 🐛 Debug Empty Responses

Now with debug logging! Check the terminal for:

```
[AI Orchestrator] Running inference with:
  provider: 'anthropic'
  model: 'Filelink'
  baseUrl: 'http://localhost:20128'
  messagesCount: 2
  toolsCount: 15

[AI Orchestrator] Anthropic response:
  contentBlocks: 2
  stopReason: 'end_turn'

[AI Orchestrator] Extracted:
  contentLength: 245
  toolCallsCount: 1
```

If you see `contentLength: 0`, the issue is with Omniroute/Claude connection.

---

## ✅ Checklist Before Starting

1. ☐ Omniroute installed and configured
2. ☐ `.env` file has correct settings:
   ```
   ANTHROPIC_BASE_URL=http://localhost:20128
   ANTHROPIC_AUTH_TOKEN=sk-349f10a8a4c70547-e7001a-84b3c82f
   ANTHROPIC_MODEL=Filelink
   ```
3. ☐ At least one device online (run `node filelink.mjs` on target PC)
4. ☐ Node.js installed

---

## 🎮 Example Commands to Try

### Device Info
- "Check the PC OS system"
- "Show me system information"
- "What's the CPU and RAM?"

### File Operations
- "List files in C:\Users\user\Desktop"
- "Find all .txt files on the desktop"
- "Create a file called test.txt with 'Hello World'"

### Process Management
- "Show running processes"
- "Which processes are using the most memory?"
- "Show me all node.exe processes"

### Command Execution
- "Run 'node --version' on my PC"
- "Run 'npm install' and fix any errors"
- "Check disk space"

### Multi-Device (Select ALL DEVICES)
- "Check OS on all devices"
- "Get system info from all connected PCs"

---

## 🔥 CMD Chat Commands

While chatting:
- Type your message and press Enter
- `clear` - Clear the screen
- `exit` or `quit` - Exit the chat
- Ctrl+C - Force quit

---

## 📊 What The Logs Mean

### Good Response:
```
[AI API] Received chat request: { message: 'Check...', deviceId: '...', ... }
[AI Orchestrator] Running inference with: { provider: 'anthropic', ... }
[AI Orchestrator] Anthropic response: { contentBlocks: 2, ... }
[AI Orchestrator] Extracted: { contentLength: 245, toolCallsCount: 1 }
```

### Empty Response (Omniroute Issue):
```
[AI Orchestrator] Anthropic response: { contentBlocks: 0, ... }
[AI Orchestrator] Extracted: { contentLength: 0, toolCallsCount: 0 }
```
**Fix:** Check if Omniroute is running on port 20128

### Connection Error:
```
Error: fetch failed
```
**Fix:** Make sure dev server is running (`npm run dev`)

---

## 🎉 You're All Set!

**Just run:** `start-all.cmd`

Then choose:
- **CMD chat:** Run `ai-chat.cmd` in a new terminal
- **Browser:** Open http://localhost:8081

**Everything is now pushed to GitHub (commit `f5f0e36`)!**

Enjoy your Claude-powered FileLink AI! 🚀✨
