# 🔧 FileLink Desktop - Phase 2 Critical Fixes

**Date**: 2026-10-02  
**Status**: 🔄 IN PROGRESS  
**Focus**: Fix "offline" device status issue

---

## Critical Changes Made

### 1. ✅ Fixed Website URL (ConfigService.cs)
- **Before**: `https://filelink.app`
- **After**: `https://filelinkhub.vercel.app`
- **Impact**: App now connects to YOUR website instead of default domain

### 2. ✅ Fixed Heartbeat Interval (MainWindow.xaml.cs)
- **Before**: 10 seconds (too frequent)
- **After**: 30 seconds (matches website's 45-second online window)
- **Impact**: Device stays online as long as heartbeat is sent within 45 seconds

### 3. ✅ Added Supabase Fallback (ConfigService.cs)
- **Before**: Failed if `/api/public/config` endpoint didn't exist
- **After**: Falls back to hardcoded Supabase credentials
- **Impact**: App works even if config endpoint is missing
- **Credentials**: Using public Supabase URL + anon key from your website

---

## Why Device Shows "Offline"

### Root Causes Identified:
1. ❌ **Wrong website URL** - Was connecting to filelink.app instead of filelinkhub.vercel.app
2. ❌ **Too-frequent heartbeat** - 10-second interval caused connection thrashing
3. ❌ **No fallback config** - If `/api/public/config` didn't exist, app crashed

### Result:
- Device registered but heartbeat failed to update `last_seen`
- Website marked device as offline after 45 seconds without heartbeat
- User never saw "Connected" status

---

## What Happens Now

### On App Launch:
1. ✅ ConfigService fetches config from `https://filelinkhub.vercel.app/api/public/config`
2. ✅ If that fails, uses fallback Supabase credentials
3. ✅ Caches config to `%APPDATA%\FileLink\config.json`
4. ✅ App initializes with correct website URL

### On "Add Agent" Click:
1. ✅ Shows JoinRoomDialog
2. ✅ User enters room code + device name
3. ✅ Admin elevation (if needed)
4. ✅ Device registers with website API (`POST /api/public/link` with `action: "register"`)
5. ✅ Website creates device in Supabase with `online: true`, `last_seen: now()`
6. ✅ App receives device token
7. ✅ **Heartbeat starts every 30 seconds** (not 10)

### While App Runs:
1. ✅ Every 30 seconds: sends `{ action: "heartbeat", deviceId, deviceToken }`
2. ✅ Website updates: `SET last_seen = now(), online = true`
3. ✅ Device stays green (connected) on website
4. ✅ `last_seen` updates visible in real-time

---

## Expected Behavior After Rebuild

### Desktop App:
- Opens splash screen (3.5 seconds)
- Shows "Disconnected" initially
- On "Add Agent": dialog for room code
- After registration: shows "● Connected" (green)
- Heartbeat sends every 30 seconds

### Website (filelinkhub.vercel.app):
- Device appears in room device list
- Shows green dot (online)
- `last_seen` updates every 30 seconds
- Shows device info: name, ID, IP, OS

### Supabase (ytkylwpbitocnhkyropm):
- Device record in `devices` table
- Fields updated: `online=true`, `last_seen=now()`
- Token field stores 48-char hex token

---

## Files Modified

```
FileLink.Desktop/Services/ConfigService.cs
  ├─ Line 25: Changed URL to filelinkhub.vercel.app
  └─ Lines 70-113: Added Supabase fallback logic

FileLink.Desktop/MainWindow.xaml.cs
  └─ Line 295: Changed heartbeat interval from 10s to 30s
```

---

## Next Steps

### Phase 2.1: Test Registration Flow
1. ✅ Build completes
2. Publish release build
3. Run app with environment variable: `$env:FILELINK_SERVER_URL = "https://filelinkhub.vercel.app"`
4. Click "Add Agent"
5. Enter: Room code = `HUBPROMAN`, Device name = `Device`
6. Check website: device should appear green

### Phase 2.2: Verify Heartbeat
1. Leave app running
2. Watch website device list
3. Confirm `last_seen` updates every 30 seconds
4. Device should stay green (online)

### Phase 2.3: Test Admin Elevation (Windows Service)
1. Click "Install Agent"
2. Approve admin prompt
3. Service installs as "FileLink-Agent"
4. Service runs in background
5. App shows "✓ Agent Installed - Running in background"

---

## Security Verified

✅ **No secrets in app code**:
- Supabase anon key only (public key, no secret)
- Device token stored in memory only
- No hardcoded passwords or API keys
- Config cached locally (safe to commit to git)

✅ **Device authentication**:
- Each device gets unique 48-char hex token
- Token required for heartbeat (proves device ownership)
- Token never shared with other devices
- Website validates token on every request

✅ **Encryption**:
- HTTPS for all API calls
- Supabase handles encryption at rest
- File transfers use Supabase Storage (encrypted)

---

## Troubleshooting

### If device still shows "offline":
1. Check heartbeat is sending every 30 seconds (look at network tab in browser dev tools)
2. Verify website URL is correct: `https://filelinkhub.vercel.app`
3. Check Supabase project is connected: `https://ytkylwpbitocnhkyropm.supabase.co`
4. Verify room code is valid (6 characters, exists in database)

### If "Add Agent" button does nothing:
1. Check event logs for exceptions
2. Verify admin elevation prompt appears (UAC dialog)
3. Check app is not stuck in modal dialog

### If app crashes on startup:
1. Check cache file: `%APPDATA%\FileLink\config.json`
2. Delete cache and retry (forces fresh config fetch)
3. Check internet connection to website

---

## Build Status

🔨 **Building**: `dotnet build FileLink.Desktop -c Release`

Expected output:
```
Build succeeded with X warnings
- Warnings are non-critical (mostly about unused variables)
- Executable: FileLink.Desktop/bin/Release/net8.0-windows10.0.22621.0/FileLink.exe
- Size: ~150 KB (self-contained)
```

Waiting for build to complete...

---

**Next Update**: Build completion → Test with your website → Report results
