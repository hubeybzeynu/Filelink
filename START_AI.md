# Starting FileLink AI Assistant

## ✅ What's Been Done

1. **AI Chat with Claude-style animations:**
   - Thinking animation with bouncing dots (like Claude website)
   - Word-by-word streaming responses
   - Live command execution display
   - Real-time tool execution cards
   - Cancel button during execution
   - Detailed error messages with troubleshooting

2. **Omniroute Integration:**
   - Support for local Claude proxy via Omniroute
   - Bearer token authentication
   - Custom model names ("Filelink")

3. **Deployed:**
   - GitHub: `93c1127` - Latest commit pushed
   - Vercel: Production deployment ready
   - Supabase: AI database tables created

---

## 🚀 How to Start Using AI

### Step 1: Start Omniroute Proxy

You need to start the Omniroute proxy that routes requests to your local Claude instance:

```powershell
# In PowerShell, set environment variables and start the proxy
$env:CLAUDE_CONFIG_DIR="$HOME\.claude-omniroute"
$env:ANTHROPIC_BASE_URL="http://localhost:20128"
$env:ANTHROPIC_AUTH_TOKEN="sk-349f10a8a4c70547-e7001a-84b3c82f"

# Start Omniroute (adjust command based on how you installed it)
# Option 1: If installed globally
claude-omniroute serve

# Option 2: If using npm
npx claude-omniroute serve

# Option 3: If using a specific binary
.\path\to\claude-omniroute.exe serve
```

**Verify it's running:**
- Open http://localhost:20128 in your browser
- You should see an API endpoint or status page

---

### Step 2: Start FileLink Dev Server

In a **new terminal** (keep Omniroute running):

```bash
cd C:\Users\user\Downloads\filelink-fly-easy-main
npm run dev
```

The dev server will start on http://localhost:8081 (or another port if 8081 is busy)

---

### Step 3: Test the AI

1. Open http://localhost:8081 in your browser
2. Navigate to the **AI Assistant** tab (Sparkles icon ✨)
3. Select a device from the dropdown
4. Try one of these commands:
   - "Check the PC OS system"
   - "Show running processes"
   - "List files in C:\Users\user\Desktop"
   - "Run 'node --version' on my PC"

---

## 🎬 What You'll See (Like Claude)

1. **Thinking animation:** Bouncing dots while AI processes your request
2. **Streaming response:** Words appear one by one
3. **Tool execution:** Live cards showing commands being executed
4. **Real-time output:** Command results appear as they complete
5. **Error handling:** If a command fails, AI explains why and suggests fixes

---

## ❌ Troubleshooting

### "Cannot connect to AI service"

**Problem:** Omniroute proxy is not running on port 20128

**Solution:**
1. Check if something is using port 20128: `netstat -ano | findstr 20128`
2. Start Omniroute proxy as shown in Step 1
3. Verify with: `curl http://localhost:20128`

---

### "Missing API credentials"

**Problem:** `.env` file missing or incorrect

**Solution:**
1. Check `.env` file exists in project root
2. Verify it contains:
   ```bash
   AI_PROVIDER=anthropic
   ANTHROPIC_BASE_URL=http://localhost:20128
   ANTHROPIC_AUTH_TOKEN=sk-349f10a8a4c70547-e7001a-84b3c82f
   ANTHROPIC_MODEL=Filelink
   ```
3. Restart dev server after changing `.env`

---

### "Please select at least one target device"

**Problem:** No device selected in the AI tab

**Solution:**
1. Make sure at least one PC is running the FileLink agent (`filelink.mjs`)
2. In the AI tab, use the device dropdown to select a device
3. You can select "ALL DEVICES" to run commands on all connected PCs

---

### Empty responses or "(empty response)"

**Problem:** AI is working but returning empty content

**Possible causes:**
1. Omniroute proxy issue - check the Omniroute terminal for errors
2. Model name mismatch - verify `ANTHROPIC_MODEL=Filelink` matches your Omniroute config
3. API rate limiting - wait a moment and try again

**Solution:**
1. Check Omniroute logs for errors
2. Try a simple test: "hello" 
3. If still failing, use direct Anthropic API:
   ```bash
   AI_PROVIDER=anthropic
   ANTHROPIC_API_KEY=sk-ant-api03-XXXXXXXXXXXX
   AI_MODEL=claude-3-7-sonnet-20250219
   # Remove or comment out ANTHROPIC_BASE_URL and ANTHROPIC_AUTH_TOKEN
   ```

---

## 📝 Example Session

```
You: Check the PC OS system

[Thinking...] Understanding your request...

[Executing...] Running get_device_info...

AI: I've checked your PC's OS system. Here's what I found:

- OS: Windows 10 Pro (10.0.19045)
- CPU: Intel Core i7-9700K @ 3.60GHz (8 cores)
- RAM: 16 GB
- Disk: 512 GB SSD (345 GB free)
- Network: Connected via Wi-Fi

Would you like me to run any diagnostics or check for updates?
```

---

## 🎯 Next Steps

Once working, try these advanced features:

1. **Multi-device commands:**
   - Select "ALL DEVICES" and run "check system info"
   - AI will execute on all PCs independently

2. **Error fixing:**
   - "Run 'npm install' and fix any errors"
   - AI will detect errors and automatically retry with fixes

3. **File operations:**
   - "Create a file called test.txt on the desktop"
   - "Find all .log files larger than 100MB"

4. **Process management:**
   - "Show me processes using more than 500MB RAM"
   - "Kill process named 'node.exe'"

---

## 🔧 Production Deployment

To deploy to Vercel with AI enabled:

1. Add environment variables in Vercel Dashboard:
   - `AI_PROVIDER=anthropic`
   - `ANTHROPIC_API_KEY=sk-ant-api03-XXXXXXXXXXXX` (your real API key)
   - `AI_MODEL=claude-3-7-sonnet-20250219`

2. Deploy:
   ```bash
   vercel --prod
   ```

**Note:** Omniroute is for local development only. Production uses direct Anthropic API.

---

Enjoy your Claude-powered FileLink AI! 🚀
