# FileLink Complete Product Implementation Strategy

**Date**: 2026-10-02  
**Status**: STARTING COMPREHENSIVE BUILD  
**Target**: Unified desktop + website + CLI product

---

## Phase 0: Audit & Architecture (Current)

### Exploration In Progress
- Website component inventory (30+ feature files)
- Backend API contract mapping
- Supabase schema audit
- Desktop current state assessment

### Expected Output
Feature matrix showing:
```
Feature → Website Component → API Action → DB Table → Desktop Status → Plan Gate
```

---

## Phase 1: Real Account & Authentication System

### Goal
Desktop app authenticates using same backend as website (no separate user database)

### Implementation
1. **Authentication Service** (Desktop)
   - Read: website's login flow (`AccountLogin.tsx`)
   - Implement: Real Supabase auth (email/password)
   - Store: Secure local session token
   - Persist: Windows credential storage or encrypted file

2. **Login UI** (WPF)
   - Email input
   - Password input
   - Create Account option
   - Remember Me checkbox
   - Error handling

3. **Backend** (Verify existing)
   - POST `/api/public/auth/signup` - already exists?
   - POST `/api/public/auth/login` - already exists?
   - GET `/api/public/auth/me` - verify session
   - POST `/api/public/auth/logout` - clear session

### Files to Create
- `FileLink.Desktop/Services/AuthenticationService.cs`
- `FileLink.Desktop/Views/LoginView.xaml`
- `FileLink.Desktop/Views/LoginView.xaml.cs`

### Dependencies
- None (uses existing auth backend)

### Definition of Done
- User can log in with email/password
- Session persists across app restart
- Same account works on website and desktop
- 401 logout when token expires

---

## Phase 2: Plan & Entitlement System

### Goal
Enforce plan limits server-side; both web and desktop read same capability model

### Implementation
1. **Plan Definitions** (Backend)
   - FREE: 3 rooms, 30 devices, 1GB storage
   - PRO: 30 rooms, 100 devices, 50GB storage
   - EXTENDED: unlimited

2. **Capability Service** (Backend)
   ```sql
   CREATE TABLE capabilities (
     id uuid primary key,
     capability_id text unique (rooms.create, files.copy, terminal.admin, etc),
     free boolean,
     pro boolean,
     extended boolean
   );
   ```

3. **Account Tier Check** (Backend)
   - Every API call checks: `user.tier + capability → allowed?`
   - Server-side enforcement only

4. **UI Permission Service** (Desktop)
   ```csharp
   public class PermissionService
   {
     public bool CanCreateRoom() => account.tier >= Tier.Pro;
     public bool CanTerminalAdmin() => account.tier >= Tier.Pro;
     public bool CanUseAI() => account.tier >= Tier.Free;
     // ...
   }
   ```

### Files to Create/Modify
- `supabase/migrations/xx_add_capabilities.sql`
- `src/lib/capabilities.ts` (backend)
- `FileLink.Desktop/Services/PermissionService.cs`
- Desktop UI updates to hide/disable features per plan

### Definition of Done
- Free user cannot see Pro features
- Pro user cannot use Extended features
- Server rejects if capability missing
- Desktop UI reflects current plan

---

## Phase 3: Real Device Lifecycle & Session Management

### Goal
Replace simple registration + heartbeat with full device session lifecycle

### Current State
- Device registers once
- Sends heartbeat every 30 seconds
- No persistent session management

### Target State
Device states: Enrolling → Online → Offline (45s) → Revoked

### Implementation

1. **Device Session Model**
   ```sql
   CREATE TABLE device_sessions (
     id uuid primary key,
     device_id uuid references devices(id),
     account_id uuid references app_users(id),
     room_id uuid references rooms(id),
     session_token text unique,
     created_at timestamp,
     last_heartbeat timestamp,
     expires_at timestamp,
     revoked_at timestamp,
     disconnect_reason text
   );
   ```

2. **Device Enrollment Flow** (Desktop)
   - User enters room code + device name
   - Admin approval (Windows UAC)
   - POST `/api/public/link` with `action: "enroll"`
   - Receive: device_id + session_token (48-char hex)
   - Store: persistent device identity in secure storage
   - Start WebSocket with session token

3. **WebSocket Connection** (Desktop)
   - URL: `wss://filelinkhub.vercel.app/ws`
   - Payload: `{ action: "connect", deviceId, sessionToken }`
   - Server validates token + device ownership
   - Persistent connection stays open
   - Server pushes events (no polling)
   - Desktop sends commands through WebSocket

4. **Heartbeat** (WebSocket, not HTTP)
   - Send: `{ action: "heartbeat" }` every 30 seconds
   - Server updates: `last_heartbeat = now()`, `online = true`
   - Server cleanup: if `now() - last_heartbeat > 45s` → `online = false`

5. **Revocation** (Website or admin)
   - User deletes device on website
   - Server sets: `revoked_at = now()`
   - Desktop detects revocation
   - Desktop stops reconnecting
   - User must re-enroll

### Files to Create
- `FileLink.Desktop/Services/WebSocketService.cs`
- `FileLink.Desktop/Services/DeviceSessionService.cs`
- Backend: WebSocket signaling handler
- Supabase migration for `device_sessions` table

### Definition of Done
- Device uses persistent session token
- WebSocket connects immediately after login
- Device shows online/offline on website
- Device goes offline if heartbeat stops
- Device cannot reconnect if revoked

---

## Phase 4: File Transfer (Binary Streaming)

### Goal
Replace base64 JSON with real binary streaming for large files

### Current Website Implementation
- Upload: `uploadInit` → `uploadChunk` (base64) → `uploadDone`
- Download: Generate signed URL to Supabase Storage

### Desktop Implementation
1. **Upload Protocol**
   - POST `/api/link/upload/init` → receive transferId
   - WebSocket binary frames: `UPLOAD_CHUNK { transferId, chunk }`
   - POST `/api/link/upload/done` → finalize

2. **Download Protocol**
   - GET signed URL from `/api/link/download/{fileId}`
   - HTTP GET with Range headers (resume support)
   - Stream to disk

3. **Transfer Service**
   ```csharp
   public class TransferService
   {
     public async Task UploadFileAsync(string filePath, string deviceId, IProgress<double> progress)
     {
       // Stream file in 1MB chunks
       // Send via WebSocket
       // Track progress
       // Support cancellation
     }

     public async Task DownloadFileAsync(string fileId, string savePath, IProgress<double> progress)
     {
       // Stream from signed URL
       // Resume support
       // Integrity check
     }
   }
   ```

### Files to Create
- `FileLink.Desktop/Services/TransferService.cs`
- Backend: Binary upload handler

### Definition of Done
- 100MB+ files transfer without memory issues
- Progress updates in real-time
- Resume works after disconnect
- File integrity verified

---

## Phase 5: Core Features Implementation

### 5.1 File Manager
**Website source**: `FileBrowser.tsx` + `FileExplorerTab.tsx`

**Desktop equivalent**:
```csharp
// Views/FilesView.xaml - tree + grid
// Services/FileService.cs - list, search, read, write, mkdir, etc
```

**Features**:
- [x] List room files
- [x] List device files (live PC)
- [x] Breadcrumb navigation
- [ ] Search
- [ ] Preview (image, text, PDF)
- [ ] Upload/Download
- [ ] Copy/Send/Bundle
- [ ] Create folder
- [ ] Delete (when authorized)

### 5.2 Tasks / Processes
**Website source**: `TasksTab.tsx`

**Desktop features**:
- [ ] List processes
- [ ] Search
- [ ] End task (Pro+)
- [ ] Sub-items (Extended)

### 5.3 Terminal
**Website source**: `Terminal.tsx`

**Desktop features**:
- [ ] CMD shell (Free)
- [ ] Admin mode (Pro)
- [ ] Shell switcher (Extended: PowerShell, Node, Python)
- [ ] Persistent ConPTY session
- [ ] Command history

### 5.4 Control Center
**Website source**: `ControlTab.tsx` + submodules

**Desktop modules**:
- [ ] Power (Shutdown, Restart, Sleep)
- [ ] Agent (Status, Restart, Stop)
- [ ] Clipboard (Get, Set, History)
- [ ] Open/Link (Open URL, Run path)
- [ ] Alert (Show dialog)
- [ ] Cursor (Remote mouse)
- [ ] Display (Screenshot)
- [ ] Audit (Event log)

### 5.5 AI Assistant
**Website source**: `AITab.tsx` + `AIChat.tsx` + backend

**Desktop features**:
- [ ] Real provider connection (Anthropic/OpenAI via server)
- [ ] Device tool execution
- [ ] File tools
- [ ] Process inspection
- [ ] Approval + audit
- [ ] Web search (when needed)
- [ ] Multi-device execution

### 5.6 Devices Tab
**Website source**: `DevicesTab.tsx`

**Desktop features**:
- [ ] List devices
- [ ] Online/offline status
- [ ] Rename device
- [ ] Delete device (when authorized)
- [ ] Device selection

---

## Phase 6: Windows Installer & FileLink CLI

### Desktop Installer
**Tool**: MSIX or Inno Setup

**Package**:
- FileLink.Desktop.exe (main app)
- FileLink.Agent.exe (background service)
- filelink.exe (CLI)
- Shortcuts + Start Menu
- Uninstall support
- Update support

### FileLink CLI
**Standalone executable**, not dependent on Claude Code

**Commands**:
```bash
filelink login
filelink logout
filelink devices
filelink rooms
filelink files ls [device] [path]
filelink files get [device] [path]
filelink files send [path] --to [device]
filelink terminal [device]
filelink exec [device] "command"
filelink screenshot [device]
filelink ai "question"
```

**Implementation**:
```csharp
// FileLink.CLI/Program.cs
// Reuses same services as desktop
// Arguments parsing
// Output formatting
```

---

## Phase 7: End-to-End Testing

### Critical Path Test (Must Pass)
1. ✅ Desktop launches
2. ✅ User logs in
3. ✅ User selects plan
4. ✅ User creates/joins room
5. ✅ Device enrolls
6. ✅ Device appears on website (online)
7. ✅ Website can see device
8. ✅ User can browse files on desktop
9. ✅ User can transfer files
10. ✅ User can execute terminal command
11. ✅ AI can inspect device and report
12. ✅ CLI can execute commands
13. ✅ Installer works
14. ✅ Agent runs in background
15. ✅ Device stays online while agent runs

---

## Architecture Decisions

### 1. Transport: WebSocket over HTTP Polling
- **Why**: Low latency, persistent connection, server push
- **Impact**: Fewer round-trips, faster control, real-time events
- **Cost**: Session management complexity

### 2. File Transfer: Binary Streaming
- **Why**: Handle large files efficiently
- **Impact**: No base64 bloat, resume support, progress tracking
- **Cost**: More complex protocol

### 3. Plan Enforcement: Server-First
- **Why**: Prevents cheating, consistent across clients
- **Impact**: Every action validated server-side
- **Cost**: Extra validation calls

### 4. Single Backend Model
- **Why**: Desktop and web use same API, data, permissions
- **Impact**: Synchronized state, easier maintenance
- **Cost**: Backend must support both UI paradigms

### 5. WPF Desktop
- **Why**: Fastest buildable path
- **Impact**: Native Windows experience
- **Cost**: No other platforms without separate implementation

---

## Success Metrics

### Build Success
- [ ] Desktop builds with 0 errors
- [ ] Website builds with 0 errors
- [ ] CLI builds with 0 errors
- [ ] Installer works

### Feature Success
- [ ] Login works (real Supabase auth)
- [ ] Plan selection works
- [ ] Device enrollment works
- [ ] WebSocket persistent connection
- [ ] File transfer (binary)
- [ ] All 8 main tabs functional
- [ ] AI assistant working
- [ ] Terminal sessions working
- [ ] Control Center modules working
- [ ] Plan enforcement working
- [ ] Audit logging working

### Integration Success
- [ ] Desktop and website show same device state
- [ ] Desktop and website use same account
- [ ] Desktop and website enforce same plan limits
- [ ] CLI works independently
- [ ] Agent runs in background
- [ ] Device stays online 24/7 (when agent enabled)

---

## Time Estimation

| Phase | Est. Hours | Status |
|-------|-----------|--------|
| 0. Audit | 1 | IN PROGRESS |
| 1. Authentication | 3 | NOT STARTED |
| 2. Plans & Entitlements | 2 | NOT STARTED |
| 3. Device Lifecycle & WebSocket | 4 | NOT STARTED |
| 4. File Transfer | 2 | NOT STARTED |
| 5. Core Features | 8 | NOT STARTED |
| 6. Installer & CLI | 3 | NOT STARTED |
| 7. Testing & Fixes | 4 | NOT STARTED |
| **TOTAL** | **27** | |

---

## Commit Checkpoints

1. `feat(auth): implement real Supabase authentication`
2. `feat(plans): add server-side entitlements and capability model`
3. `feat(device): complete session lifecycle and device management`
4. `feat(transport): implement persistent WebSocket connection`
5. `feat(files): add binary streaming file transfer`
6. `feat(ui): implement Files, Tasks, Terminal views`
7. `feat(control): implement Control Center modules`
8. `feat(ai): integrate AI with device tools and approval`
9. `feat(cli): add standalone FileLink CLI`
10. `feat(installer): create Windows installer and agent service`
11. `test(e2e): complete end-to-end integration tests`

---

## Next Immediate Action

**Waiting for**: Website feature audit completion
**Then**: Begin Phase 1 (Real Authentication)
**Start with**: Read `AccountLogin.tsx` to understand exact auth flow
**Implement**: Matching auth service in desktop

**Do NOT**:
- Stop for framework debates
- Create fake implementations
- Hardcode production secrets
- Duplicate backend unnecessarily

**DO**:
- Build real working features
- Test immediately
- Fix actual errors
- Commit and continue
