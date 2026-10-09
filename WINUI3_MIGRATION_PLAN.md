# FileLink WinUI 3 Native Application — Implementation Plan

## Project Status
**Start Date:** 2026-10-02
**Current Phase:** Architecture Audit + Foundation

---

## Phase 1: Audit & Planning (IN PROGRESS)

### Audit Tasks
- [ ] Website project structure (link.server.ts, AI system, RPC methods, Supabase schema)
- [ ] Current C# agent services (if any reusable code exists)
- [ ] PowerShell bottleneck analysis
- [ ] Existing enrollment/authentication flow
- [ ] Device identity model
- [ ] Transfer infrastructure
- [ ] Session/token management

### Deliverables
- Architecture audit report
- Service reuse checklist
- PowerShell replacement roadmap
- Integration point mapping

---

## Phase 2: WinUI 3 Foundation (NEXT)

### Create New C# Project
```
FileLink.Desktop/
├── FileLink.Desktop.csproj           (WinUI 3 + Windows App SDK)
├── App.xaml + App.xaml.cs
├── MainWindow.xaml + MainWindow.xaml.cs
├── src/
│   ├── Services/
│   │   ├── ConnectionManager.cs
│   │   ├── AuthenticationService.cs
│   │   ├── EnrollmentService.cs
│   │   ├── DeviceIdentityService.cs
│   │   └── [other core services]
│   ├── Models/
│   │   ├── Device.cs
│   │   ├── Room.cs
│   │   ├── Session.cs
│   │   └── [RPC/message models]
│   ├── UI/
│   │   ├── Pages/
│   │   ├── Controls/
│   │   └── Resources/
│   ├── Utilities/
│   ├── RPC/
│   └── Installer/
└── Properties/
```

### .NET Setup
- .NET 10 (latest stable)
- Windows App SDK 2.5.1+
- x64 primary
- Self-contained deployment capable
- Windows 10/11 target

### Critical First Week
1. Create blank WinUI 3 project
2. Wire Supabase client (no service-role in EXE)
3. Build enrollment flow (token → identity save)
4. Build authentication (persistent device identity)
5. Build connection manager (WebSocket to server)
6. Test heartbeat/presence on website
7. Create splash screen with FileLink logo
8. Create Home page structure

---

## Phase 3: Core Services Migration (Week 2-3)

### Reuse/Port from Website & Old Agent
```
FROM website (src/lib/):
- RPC method registry (ai.tools.ts structure)
- Error codes + structured errors (link.server.ts ApiError)
- Supabase schema understanding
- Anthropic AI integration patterns

FROM old C# agent (if exists):
- ConnectionManager patterns
- DeviceIdentityService
- FileService
- TaskService
- InputService
- ClipboardService
- ScreenService
- CameraService
- PowerService
- TerminalService
- RPC/command models
```

### Replace PowerShell Implementations
| Feature | Old Path | New Path |
|---------|----------|----------|
| Mouse Move | PowerShell → user32.dll | Direct Win32 API |
| Mouse Click | PowerShell → SendInput | Direct SendInput |
| Clipboard | PowerShell file + Set-Clipboard | Native clipboard API |
| Screenshot | PowerShell + System.Drawing | Graphics Capture |
| Camera | PowerShell + WinRT MediaCapture | Native MediaCapture |
| Tasks | PowerShell Get-Process | System.Diagnostics.Process |
| System Info | PowerShell WMI | WMI.NET / Win32 APIs |
| Power | PowerShell shutdown cmd | native shutdown API |
| Terminal | N/A (new) | ConPTY persistent |

---

## Phase 4: Enrollment & Authentication (Week 3-4)

### Flow A: This PC
1. App starts → check for saved device identity
2. If none → show setup page
3. Sign in with existing account
4. Request capabilities/permissions
5. Save device identity securely
6. Connect to server
7. Show Home dashboard

### Flow B: Another PC
1. Website: Add Device → create enrollment token
2. Other PC: Download installer
3. Installer: run with UAC if needed
4. Setup page: show device info (name, Windows version, user)
5. Confirm account/room/device name
6. Enroll with token
7. Save identity
8. Auto-start agent
9. Website shows online

### Supabase Integration (No service-role in EXE)
- Store device identity securely (encrypted hash)
- Fetch device metadata
- Update presence/heartbeat
- Audit/activity logging
- Transfer metadata

---

## Phase 5: Connection Layer (Week 4-5)

### WebSocket Control Channel
```
FileLink Agent
     ↓
Persistent WebSocket
     ↓
FileLink Server
     ↓
Heartbeat + commands
```

### Message Format
```json
{
  "id": "request-id",
  "type": "rpc.request",
  "method": "device.status",
  "params": {}
}
```

### State Machine
```
starting → initializing → authenticating → connecting → connected
                                                          ↓
                                                    (heartbeat/reconnect)
disconnected ← revoked ← (error)
```

### Implement
- Request/response correlation
- Timeout handling
- Reconnection with backoff
- Ping/pong
- RTT measurement
- Duplicate detection
- Capability negotiation

---

## Phase 6: Fast File Transfer (Week 5-6)

### Transfer Store (Supabase-backed metadata)
```csharp
CreateTransfer(size, name, hash)
OpenWrite()
WriteRange(offset, data)
OpenRead(offset)
ReadRange(size)
GetStatus()
Finalize()
Cancel()
Resume()
```

### Streaming Not Buffering
- No `Buffer.concat()` for entire files
- Temp file → verify → rename
- SHA-256 incremental
- Resume from offset
- Backpressure support

### Transport Hierarchy
1. Direct P2P (LAN same subnet)
2. WebRTC DataChannel (encrypted, peer-to-peer)
3. Binary server relay (fallback)

### Resumable
```
transferId
size
bytesReceived
status (created/transferring/paused/completed)
hash
timestamps
```

---

## Phase 7: Input/Clipboard/Media (Week 6-7)

### Input (Low-Latency)
- Mouse move (coalesce stale events)
- Mouse click (left/right/middle/double)
- Mouse scroll
- Keyboard (keydown/keyup/type)
- Direct Win32 SendInput API
- No PowerShell

### Clipboard
- Read/write native Windows clipboard
- History if appropriate
- Sync events
- No temp files

### Screen Capture
- One-shot: Graphics Capture → encode → binary
- Live: Graphics Capture → Direct3D → encoder → WebRTC

### Camera
- MediaCapture enumeration
- Snapshot: encode → binary
- Live: MediaFrameReader → encoder → WebRTC
- Privacy indicator

---

## Phase 8: Tasks / Files / Terminal (Week 7-8)

### Tasks
- System.Diagnostics.Process enumeration
- CPU/RAM sampling
- Icon extraction (cached)
- Window title
- End Task where permitted
- No PowerShell per task

### Files
- Browse/search/tree
- Upload/download streaming
- Mkdir/rename/move/delete safe paths
- Disk usage
- Default: `%USERPROFILE%\FileLink\Shared`
- Path boundary validation

### Terminal
- ConPTY persistent sessions
- CMD/PowerShell/custom shells
- Multiple sessions
- Input/output streaming
- Reconnect support

---

## Phase 9: Native UI (Week 8-9)

### WinUI Pages
```
Home
  Device overview
  Quick actions
  Recent activity
  Connection status

Device Info
  Computer name, user, OS, CPU, RAM, drives
  Uptime, network, agent version

Files
  Browser/tree view
  Search, filter, sort
  Transfer queue
  Shared folder indicator

Tasks
  Process list
  CPU/RAM usage
  Window info
  End task button

Display
  Monitor selection
  Screenshot
  Live screen (WebRTC)
  FPS/bitrate/RTT

Camera
  Camera enumeration
  Snapshot
  Live feed (WebRTC)
  Recording toggle

Remote Cursor
  Mouse move visualization
  Click indicator
  Coalesced events

Keyboard
  Virtual keyboard or keyboard input

Clipboard
  Read/write interface
  History

Control Center
  Power buttons
  Network tools
  Restart agent

Terminal
  Session management
  Input/output streaming
  Multiple tabs/sessions

Activity
  Audit log
  Connection events
  Transfer history
  File operations

Settings
  Device name
  Permissions
  Account
  Advanced options
```

### Design
- Fluent Design principles
- Mica material where appropriate
- Responsive layout
- FileLink logo (exact vector + gradient)
- Splash screen
- Polished transitions

---

## Phase 10: AI Integration (Week 9-10)

### Connect to Existing Web AI
- Web AI calls agent tools through RPC
- Structured tool definitions (same as web)
- Agent executes tool
- Returns structured result
- AI analyzes and responds

### Tool Categories
```
device.*          (status, rename, capabilities)
system.*          (info, processes, network)
files.*           (list, read, write, download, upload)
tasks.*           (list, end, tree)
input.*           (mouse, keyboard)
screen.*          (screenshot, live)
camera.*          (snapshot, live)
clipboard.*       (read, write, history)
terminal.*        (create, write, read, close)
power.*           (shutdown, restart, sleep, lock)
transfer.*        (status, pause, resume)
```

### Approval System
- Read-only tools: auto-execute
- File operations: require approval
- Input/control: require approval
- Power/destruction: require explicit confirmation + explanation
- UAC elevation when needed

---

## Phase 11: Security & Deployment (Week 10-11)

### Security Checklist
- [ ] No Supabase service-role in EXE
- [ ] Device identity encrypted/hashed
- [ ] Enrollment token one-time use
- [ ] TLS for all network traffic
- [ ] Session revocation support
- [ ] Command whitelist validation
- [ ] Path boundary checks
- [ ] Safe process termination
- [ ] Audit logging (no secrets)
- [ ] UAC elevation models

### Installer
- MSIX or standalone exe + batch setup
- UAC elevation when needed
- Install to `%APPDATA%\FileLink`
- Startup shortcut
- Enrollment flow
- Device identity save
- First run: show setup

### Deployment
- Self-contained (bundled runtime)
- x64 primary
- Windows 10/11 support
- Download from website
- Installer signing (eventual)
- Update mechanism (future)

---

## Phase 12: Testing & Integration (Week 11-12)

### This PC
1. Start FileLink.exe on current PC
2. Authenticate
3. Enroll device
4. Verify online on website
5. Test all features locally
6. Test website ↔ agent communication
7. Test AI tool execution
8. Verify fast file transfer

### Another PC
1. Website: Add Device
2. Download installer
3. Run on fresh Windows PC
4. Complete setup
5. Verify online on website
6. Test remote control from first PC
7. Test file transfer between PCs
8. Test screen sharing
9. Test AI commands

### Final Verification
- [ ] filelink.mjs NOT required
- [ ] Node.js NOT required
- [ ] No PowerShell spawning for mouse/clipboard/etc.
- [ ] Fast transfer (MB/s measurement)
- [ ] Live screen (60 FPS capable)
- [ ] Live camera (smooth)
- [ ] AI tool execution
- [ ] Device revocation
- [ ] Activity audit

---

## File Structure (Final)

```
FileLink.Desktop/
├── FileLink.Desktop.csproj
├── App.xaml
├── App.xaml.cs
├── MainWindow.xaml
├── MainWindow.xaml.cs
├── src/
│   ├── Services/
│   │   ├── ConnectionManager.cs
│   │   ├── AuthenticationService.cs
│   │   ├── EnrollmentService.cs
│   │   ├── DeviceIdentityService.cs
│   │   ├── FileService.cs
│   │   ├── TaskService.cs
│   │   ├── InputService.cs
│   │   ├── ClipboardService.cs
│   │   ├── ScreenService.cs
│   │   ├── CameraService.cs
│   │   ├── PowerService.cs
│   │   ├── TerminalService.cs
│   │   ├── SystemInfoService.cs
│   │   ├── RPCExecutor.cs
│   │   └── AIToolRegistry.cs
│   ├── Models/
│   │   ├── Device.cs
│   │   ├── Room.cs
│   │   ├── Session.cs
│   │   ├── Transfer.cs
│   │   ├── Terminal.cs
│   │   ├── RPCMessage.cs
│   │   ├── RPCResult.cs
│   │   ├── AITool.cs
│   │   └── ErrorCodes.cs
│   ├── UI/
│   │   ├── Pages/
│   │   │   ├── HomePage.xaml
│   │   │   ├── DeviceInfoPage.xaml
│   │   │   ├── FilesPage.xaml
│   │   │   ├── TasksPage.xaml
│   │   │   ├── DisplayPage.xaml
│   │   │   ├── CameraPage.xaml
│   │   │   ├── TerminalPage.xaml
│   │   │   ├── ControlCenterPage.xaml
│   │   │   ├── ActivityPage.xaml
│   │   │   └── SettingsPage.xaml
│   │   ├── Controls/
│   │   │   ├── AIApprovalDialog.xaml
│   │   │   ├── TransferProgressBar.xaml
│   │   │   ├── ConnectionStatusBar.xaml
│   │   │   └── [other reusable controls]
│   │   ├── Resources/
│   │   │   ├── Brushes.xaml
│   │   │   ├── Styles.xaml
│   │   │   └── Converters.cs
│   │   └── Splash.xaml
│   ├── RPC/
│   │   ├── RPCClient.cs
│   │   ├── MessageHandler.cs
│   │   └── ResponseMapper.cs
│   ├── Transfer/
│   │   ├── TransferManager.cs
│   │   ├── ChunkHandler.cs
│   │   └── ResumeHandler.cs
│   ├── Utilities/
│   │   ├── PathValidator.cs
│   │   ├── SecurityUtils.cs
│   │   ├── Logger.cs
│   │   ├── IdentityStore.cs
│   │   └── Config.cs
│   ├── Installer/
│   │   ├── SetupWindow.xaml
│   │   ├── SetupWindow.xaml.cs
│   │   └── EnrollmentFlow.cs
│   └── Win32/
│       ├── InputInterop.cs
│       ├── ScreenCaptureInterop.cs
│       ├── CameraInterop.cs
│       └── [other Win32 wrappers]
├── Properties/
├── Assets/
│   ├── FileLink.png
│   ├── FileLink.ico
│   └── [branding assets]
└── README.md
```

---

## Commits (Planned)

1. `feat: Create WinUI 3 project structure and initialization`
2. `feat: Add Supabase authentication without service-role`
3. `feat: Implement enrollment and device identity service`
4. `feat: Add WebSocket connection manager`
5. `feat: Port file service with streaming transfers`
6. `feat: Replace PowerShell input with native Win32 APIs`
7. `feat: Add clipboard, screen, and camera services`
8. `feat: Implement task manager with native APIs`
9. `feat: Add terminal service with ConPTY`
10. `feat: Create WinUI native dashboard UI`
11. `feat: Integrate AI tool registry and approval system`
12. `feat: Add installer and deployment`
13. `feat: Complete testing and final integration`

---

## Success Criteria

- [x] Plan created
- [ ] WinUI 3 project builds and runs
- [ ] Device enrollment works on both PCs
- [ ] Heartbeat reaches server (website shows online)
- [ ] File transfer without base64 encoding
- [ ] Mouse/keyboard input without PowerShell
- [ ] Live screen capture (Graphics Capture)
- [ ] All AI tools registered and callable
- [ ] Approval dialogs work
- [ ] Installer and setup flow
- [ ] Fresh PC can enroll and control
- [ ] filelink.mjs completely removed from agent flow
- [ ] Node.js not required on target PC
- [ ] Website and native agent both functional and integrated

---

**Next Steps:**
1. Wait for audit agent completion
2. Review audit findings
3. Create FileLink.Desktop C# project
4. Set up WinUI 3 baseline
5. Begin Phase 2 implementation
