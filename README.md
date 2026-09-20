# 🚀 FileLink AI Assistant

> **Claude-powered AI that controls your connected PCs in real-time**

Control multiple devices, execute commands, diagnose errors, and manage files across all your computers with natural language - powered by Claude AI.

---

## ✨ Features

- 🤖 **Natural Language Control** - "Check the PC OS system", "Find large files", "Run npm install and fix errors"
- ⚡ **Real-Time Execution** - See command output stream live as it executes
- 🎯 **Multi-Device Support** - Control single device, multiple devices, or ALL devices at once
- 💬 **Two Interfaces** - Beautiful CMD chat or modern browser UI
- 🔄 **Auto-Retry** - AI detects errors and automatically suggests fixes
- 🔐 **Permission System** - Confirms risky operations before executing
- 📊 **Token Tracking** - Real-time usage monitoring in CLI
- 🎨 **Claude-Style UX** - Thinking animation, live streaming, professional formatting

---

## 🎬 Quick Demo

**CMD Interface:**
```
╔════════════════════════════════════════════════════════════╗
║            ✨ FileLink AI Assistant ✨                      ║
╚════════════════════════════════════════════════════════════╝

You: Check the PC OS system

┌─ Executing: get_device_info ────────────────────────────┐
│ Status: ✅ Completed                                     │
│ {                                                        │
│   "os": "Windows 10 Pro",                              │
│   "cpu": "Intel Core i7-9700K @ 3.60GHz",            │
│   "ram": "16 GB"                                       │
│ }                                                        │
└──────────────────────────────────────────────────────────┘

AI: I've checked your PC's OS system. You're running Windows 10 Pro
with an Intel Core i7-9700K processor and 16GB of RAM. Everything
looks good!

  Tokens used: 245 • Session: 2 messages
```

---

## 🚀 Getting Started (2 Minutes)

### Prerequisites
- Node.js 18+ installed
- Omniroute proxy configured
- At least one device running `filelink.mjs`

### Quick Start

**1. Start Everything:**
```cmd
start-all.cmd
```

**2. Choose Interface:**

**Option A - CMD Chat (Recommended):**
```cmd
ai-chat.cmd
```

**Option B - Browser:**
```
Open http://localhost:8081
Click AI Assistant tab (✨ icon)
```

**3. Start Chatting!**

---

## 📁 Project Structure

```
filelink-fly-easy-main/
├── ai-cli.mjs              # Beautiful terminal chat interface
├── ai-chat.cmd             # Launch CMD chat
├── start-all.cmd           # Start Omniroute + dev server
├── start-omniroute.cmd     # Start just Omniroute proxy
├── diagnose.cmd            # System diagnostic tool
│
├── src/
│   ├── lib/ai/
│   │   ├── ai.types.ts           # TypeScript types
│   │   ├── ai.tools.ts           # 15 structured tools
│   │   ├── ai-security.ts        # Secret redaction, risk assessment
│   │   ├── ai.orchestrator.ts    # Multi-turn inference loop
│   │   ├── ai.server.ts          # Tool execution with streaming
│   │   ├── ai-prompts.ts         # System prompts
│   │   └── providers/
│   │       ├── anthropic.server.ts   # Claude integration
│   │       └── openai.server.ts      # GPT integration
│   │
│   ├── components/link/
│   │   ├── AIChat.tsx            # Browser chat UI
│   │   ├── AITab.tsx             # AI tab container
│   │   ├── AIDeviceSelector.tsx  # Device picker
│   │   └── AIExecutionCard.tsx   # Execution step cards
│   │
│   └── routes/api/
│       ├── ai.ts                 # Main API endpoint
│       └── ai-stream.ts          # SSE streaming endpoint
│
├── public/
│   └── filelink.mjs          # Device agent (runs on PCs)
│
├── supabase/
│   └── migrations/
│       └── 20260920000000_ai_tasks.sql   # AI database schema
│
├── .env                      # Your configuration (not committed)
├── .env.example              # Configuration template
├── QUICK_START.md            # 2-minute guide
├── START_AI.md               # Complete setup guide
└── AI_IMPLEMENTATION.md      # Technical documentation
```

---

## 🔧 Configuration

### `.env` File (Required)

```bash
# Supabase Configuration
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_PUBLISHABLE_KEY="sb_publishable_..."
SUPABASE_SERVICE_ROLE_KEY="sb_secret_..."

# AI Configuration - Omniroute (Local Development)
AI_PROVIDER=anthropic
ANTHROPIC_BASE_URL=http://localhost:20128
ANTHROPIC_AUTH_TOKEN=sk-349f10a8a4c70547-e7001a-84b3c82f
ANTHROPIC_MODEL=Filelink

# AI Configuration - Direct API (Production)
# AI_PROVIDER=anthropic
# ANTHROPIC_API_KEY=sk-ant-api03-...
# AI_MODEL=claude-3-7-sonnet-20250219
```

---

## 🛠️ Available Commands

### System Information
- "Check the PC OS system"
- "Show me system information"
- "What's the CPU and RAM?"
- "Get disk usage"

### File Operations
- "List files in C:\Users\user\Desktop"
- "Find all .txt files on the desktop"
- "Create a file called test.txt"
- "Read the package.json file"
- "Search for *.log files"

### Process Management
- "Show running processes"
- "Which processes are using the most memory?"
- "List all node.exe processes"

### Command Execution
- "Run 'node --version'"
- "Run 'npm install' and fix any errors"
- "Execute 'git status'"
- "Run 'dir' in C:\Projects"

### Multi-Device Operations
Select "ALL DEVICES" then:
- "Check OS on all devices"
- "Get system info from all PCs"
- "List running processes on all devices"

---

## 🐛 Troubleshooting

### Empty Responses

**Run diagnostic:**
```cmd
diagnose.cmd
```

**Common Issues:**

1. **Omniroute not running**
   - Fix: `start-omniroute.cmd`
   - Verify: Check port 20128 is listening

2. **Dev server not running**
   - Fix: `npm run dev`
   - Verify: Open http://localhost:8081

3. **Wrong model name**
   - Check `.env` has `ANTHROPIC_MODEL=Filelink`
   - Must match your Omniroute configuration

4. **No devices online**
   - Start device agent: `node filelink.mjs` on target PC
   - Check device appears in web UI

### Debug Logging

Check terminal output for:
```
[AI Orchestrator] Running inference with: { provider: 'anthropic', model: 'Filelink' }
[AI Orchestrator] Anthropic response: { contentBlocks: 2 }
[AI Orchestrator] Extracted: { contentLength: 245, toolCallsCount: 1 }
```

If `contentLength: 0` → Omniroute connection issue

---

## 🎯 Architecture

```
User Input
    ↓
AI Chat UI (Browser/CMD)
    ↓
POST /api/ai
    ↓
AI Orchestrator
    ↓
Claude API (via Omniroute)
    ↓
Tool Execution
    ↓
FileLink RPC
    ↓
Device Agent (filelink.mjs)
    ↓
Actual PC Command
    ↓
Live Streaming Back ↑
```

---

## 🔐 Security

- ✅ **API keys never exposed to client**
- ✅ **Secret redaction** (API keys, tokens, passwords)
- ✅ **Command risk assessment** (safe → critical)
- ✅ **Path safety checks** (prevents system file access)
- ✅ **Permission prompts** for high-risk operations
- ✅ **Server-side execution only**

---

## 📊 AI Tools Available

1. `get_devices` - List connected devices
2. `get_device_info` - System information
3. `list_files` - Browse directories
4. `search_files` - Find files by pattern
5. `read_file` - Read file contents
6. `write_file` - Create/modify files
7. `create_directory` - Make directories
8. `run_command` - Execute shell commands
9. `get_processes` - List running processes
10. `take_screenshot` - Capture screen
11. `get_disk_usage` - Check disk space
12. `transfer_file` - Move files between PCs
13. `create_artifact` - Generate documents
14. `request_confirmation` - Ask for permission
15. `queue_offline_task` - Schedule for offline devices

---

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production (Vercel)
```bash
vercel --prod
```

**Set environment variables in Vercel Dashboard:**
- `AI_PROVIDER=anthropic`
- `ANTHROPIC_API_KEY=sk-ant-api03-...`
- `AI_MODEL=claude-3-7-sonnet-20250219`

---

## 📚 Documentation

- **[QUICK_START.md](QUICK_START.md)** - Get started in 2 minutes
- **[START_AI.md](START_AI.md)** - Complete setup guide
- **[AI_IMPLEMENTATION.md](AI_IMPLEMENTATION.md)** - Technical details

---

## 🤝 Contributing

Built with:
- [TanStack Start](https://tanstack.com/router/latest) - Full-stack React framework
- [Anthropic Claude](https://anthropic.com) - AI inference
- [Supabase](https://supabase.com) - Database and auth
- [Vite](https://vitejs.dev) - Build tool

---

## 📝 License

MIT

---

## 🎉 Credits

Created with [Claude Code](https://claude.com/claude-code)

**Latest Version:** `04d7d82` (2026-09-20)

---

**Ready to control your PCs with AI? Run `start-all.cmd` and start chatting!** 🚀✨
