# FileLink Website to Desktop Exact Parity Feature Matrix

**Generated Date**: 2026-10-04  
**Project**: FileLink Unified Ecosystem  
**Target Desktop Framework**: WPF (.NET 8.0 Windows 10/11)  
**Status**: Comprehensive Mapping & Parity Audit

---

## 1. Feature Parity Matrix Overview

| Module / Feature Area | Website Component(s) | Planned WPF Desktop View | Underlying C# Service(s) | Implementation Status | Plan Gate / Tier |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Authentication & Session** | `AccountLogin.tsx`, `PasswordDialog.tsx` | `LoginView.xaml` | `AuthenticationService.cs`, `SupabaseClient.cs` | **Implemented** | Free / All Tiers |
| **File Manager & Explorer** | `FileBrowser.tsx`, `FileExplorerTab.tsx` | `FilesPage.xaml` | `FileService.cs` | **Implemented** | Free / Pro / Extended |
| **Task & Process Management** | `TasksTab.tsx` | `TasksPage.xaml` | `TaskService.cs` | **Planned** | Free (View) / Pro (Kill) / Extended (Sub-items) |
| **Remote Terminal & Shells** | `Terminal.tsx` | `TerminalPage.xaml` | `PowerService.cs`, `SystemInfoService.cs` | **Planned** | Free (CMD) / Pro (Admin) / Extended (Multi-shell) |
| **Control Center & Power** | `ControlTab.tsx`, `PowerModal.tsx` | `ControlCenterPage.xaml` | `PowerService.cs` | **Planned** | Free (Instant) / Pro (Schedule) |
| **AI Assistant & Tool Execution** | `AITab.tsx`, `AIChat.tsx`, `AIExecutionCard.tsx` | `ConversationalAI.cs` | `AiToolRegistry.cs`, `WebSearchService.cs` | **Planned** | Free (Standard) / Pro (Advanced AI) |
| **Device Lifecycle & Info** | `DevicesTab.tsx`, `DevicePicker.tsx`, `PcInfoTab.tsx` | `DeviceOverviewPage.xaml`, `PCInformationPage.xaml` | `DeviceIdentityService.cs`, `DeviceLifecycleManager.cs`, `SystemInfoService.cs` | **Planned** | Free (30 devices) / Pro (100 devices) / Extended (Unlimited) |
| **Clipboard Sync & History** | `ClipboardPanel.tsx` | `ClipboardPage.xaml` | `ClipboardService.cs` | **Planned** | Free / Pro |
| **Remote Cursor & Input** | `CursorTab.tsx` | `RemoteCursorPage.xaml` | `InputService.cs` | **Planned** | Pro / Extended |
| **Display Hub & Capture** | `DisplayHub.tsx` | `DisplayPage.xaml` | `GraphicsCaptureService.cs`, `ScreenService.cs`, `WindowsMediaCapture.cs` | **Planned** | Pro / Extended |
| **Audit Trail & Logging** | `AuditTrail.tsx` | `ActivityPage.xaml` | `AuditLogger.cs` | **Ready / Unwired** | Free (View local) / Pro (Export CSV/JSON) |
| **Alerts & Dialogs** | `AlertTab.tsx` | `ToolApprovalDialog.xaml` | `SecurityManager.cs` | **Ready** | Free / All Tiers |
| **Transfer Management** | `TransferManager.tsx`, `TransfersDialog.tsx`, `UploadSheet.tsx` | `BinaryTransferManager.cs` | `BinaryTransferManager.cs`, `ConnectionManager.cs` | **Planned** | Free (Standard) / Pro (Binary Streaming) |
| **Background Agent & Service** | `BackgroundAgentDownload.tsx`, `PcActionBar.tsx` | `InstallerService.cs` | `InstallerManager.cs`, `ConfigService.cs` | **Implemented** | Free / All Tiers |
| **App Settings & Config** | N/A | `SettingsPage.xaml`, `AboutPage.xaml` | `ConfigService.cs` | **Planned** | Free / All Tiers |

---

## 2. Detailed Component Breakdown & Mapping

### 2.1 Authentication & Session
* **Website Components**: `AccountLogin.tsx`, `PasswordDialog.tsx`, `PricingDialog.tsx`
* **Desktop Counterparts**: `LoginView.xaml`, `LoginView.xaml.cs`, `AuthenticationService.cs`
* **Features**:
  * Supabase JWT email/password sign-in and sign-up.
  * Local encrypted credential storage via `%APPDATA%\FileLink\device.config`.
  * Passcode protection for sensitive admin commands.
  * Pricing tier selection and plan limit enforcement.

### 2.2 File Browser & Explorer
* **Website Components**: `FileBrowser.tsx`, `FileExplorerTab.tsx`, `DestinationDialog.tsx`, `OpenFileLinkTab.tsx`
* **Desktop Counterparts**: `FilesPage.xaml`, `FilesPage.xaml.cs`, `FileService.cs`
* **Features**:
  * Tree and grid view modes with breadcrumb navigation.
  * Extension-based icon mapping (image, video, audio, archive, code, doc, spreadsheet).
  * Copy, move, rename, delete, download, and zip bundling operations.
  * Live PC path browsing (`@device/path`) vs Room cloud storage (`/room/...`).
  * Destination selector dialog for cross-device copy/move operations.

### 2.3 Process & Task Management
* **Website Components**: `TasksTab.tsx`
* **Desktop Counterparts**: `TasksPage.xaml`, `TasksPage.xaml.cs`, `TaskService.cs`
* **Features**:
  * Remote tasklist process enumeration with CPU/RAM metrics.
  * Process filtering (App processes vs Background system processes).
  * Single process termination (`taskkill /PID`) and bulk termination.
  * System process protection filter (prevent accidental kill of `csrss.exe`, `lsass.exe`, `svchost.exe`).

### 2.4 Remote Terminal & Multi-Shell
* **Website Components**: `Terminal.tsx`
* **Desktop Counterparts**: `TerminalPage.xaml`, `TerminalPage.xaml.cs`, `PowerService.cs`
* **Features**:
  * Built-in client shell commands (`ls`, `cd`, `mkdir`, `send`, `get`, `devices`, `tasks`, `pwd`, `clear`, `help`).
  * Native admin shell execution over persistent WebSocket / RPC.
  * Shell switcher: CMD (Free), PowerShell (Pro), Node.js (Extended), Python (Extended).
  * Cloud deletion safeguard blocking room wiping via shell commands.

### 2.5 Control Center & Power Operations
* **Website Components**: `ControlTab.tsx`, `control/PowerModal.tsx`, `control/PowerModal.css`
* **Desktop Counterparts**: `ControlCenterPage.xaml`, `ControlCenterPage.xaml.cs`, `PowerService.cs`
* **Features**:
  * Instant power actions: Sleep, Log Out, Lock.
  * Scheduled power actions: Shutdown, Restart (immediate or scheduled timestamp).
  * Background Agent management: Restart Agent, Stop Agent.
  * Integrated sub-tab navigation for Power, Agent, Clipboard, Open/Link, Alert, Cursor, Display, Audit.

### 2.6 AI Assistant & Tool Execution System
* **Website Components**: `AITab.tsx`, `AIChat.tsx`, `AIDeviceSelector.tsx`, `AIExecutionCard.tsx`, `AIChat.module.css`
* **Desktop Counterparts**: `ConversationalAI.cs`, `AiToolRegistry.cs`, `WebSearchService.cs`
* **Features**:
  * Multi-mode query auto-detection: Q&A (General), Web Search (Live web data), PC Action (Device tool invocation).
  * Target device multi-selector for batch tool execution across connected PCs.
  * SSE stream handling for real-time thinking text, tool step execution, and final content generation.
  * Tool call approval workflow requiring user verification for destructive actions.

### 2.7 Device Lifecycle & PC Information
* **Website Components**: `DevicesTab.tsx`, `DevicePicker.tsx`, `PcInfoTab.tsx`, `PcActionBar.tsx`, `SidePanel.tsx`
* **Desktop Counterparts**: `DeviceOverviewPage.xaml`, `PCInformationPage.xaml`, `DeviceIdentityService.cs`, `DeviceLifecycleManager.cs`, `SystemInfoService.cs`
* **Features**:
  * Real-time online/offline status monitoring with 45s timeout detection.
  * Hardware telemetry display: CPU model/cores, RAM usage, drive space, network adapters (IP/MAC), OS build.
  * Device management: rename device, delete/revoke device enrollment.
  * Quick action bar: Send file, Copy text, Share room link, Upload.

### 2.8 Clipboard Sync & Remote Input
* **Website Components**: `ClipboardPanel.tsx`, `CursorTab.tsx`
* **Desktop Counterparts**: `ClipboardPage.xaml`, `RemoteCursorPage.xaml`, `ClipboardService.cs`, `InputService.cs`
* **Features**:
  * Remote clipboard read/write sync with local history storage.
  * Remote mouse cursor positioning, left/right click, double click, scroll wheel.
  * Screen preview integration with coordinate mapping.

### 2.9 Display Hub & Screen Capture
* **Website Components**: `DisplayHub.tsx`
* **Desktop Counterparts**: `DisplayPage.xaml`, `GraphicsCaptureService.cs`, `ScreenService.cs`, `WindowsMediaCapture.cs`
* **Features**:
  * High-performance screen capture using Windows.Graphics.Capture API.
  * Camera frame capture via MediaCapture API.
  * Live stream preview with frame interval polling.

### 2.10 Audit Trail & Security Dialogs
* **Website Components**: `AuditTrail.tsx`, `AlertTab.tsx`
* **Desktop Counterparts**: `ActivityPage.xaml`, `ToolApprovalDialog.xaml`, `AuditLogger.cs`, `SecurityManager.cs`
* **Features**:
  * Immutable event logging with timestamps, categories, details, status (SUCCESS, INFO, WARN, ERROR), and target device.
  * Export options: CSV and JSON file output.
  * Interactive tool approval popups for user confirmation.

### 2.11 Transfer Management & Binary Streaming
* **Website Components**: `TransferManager.tsx`, `TransfersDialog.tsx`, `UploadSheet.tsx`
* **Desktop Counterparts**: `BinaryTransferManager.cs`, `TransferService.cs`
* **Features**:
  * Binary streaming for large files over WebSocket (chunked 1MB frames).
  * Real-time transfer progress, speed calculations (B/s, KB/s, MB/s), and batch file tracking.
  * Docked floating notification panel for ongoing uploads/downloads.

---

## 3. Plan & Capability Enforcements Matrix

| Feature / Capability | Free Tier | Pro Tier | Extended Tier |
| :--- | :--- | :--- | :--- |
| **Max Connected Devices** | Up to 3 devices | Up to 30 devices | Unlimited |
| **Max Rooms** | Up to 3 rooms | Up to 30 rooms | Unlimited |
| **Room Storage Quota** | 1 GB | 50 GB | Unlimited |
| **Terminal Mode** | CMD Shell (Basic) | Admin Shell (PowerShell) | Multi-Shell (Node.js, Python, CMD, PS) |
| **File Transfer** | Standard HTTP / Base64 | High-Speed Binary Stream | Parallel Binary Stream |
| **Power Control** | Instant Actions | Scheduled Power Operations | Advanced Enterprise Power Policies |
| **AI Assistant Capabilities** | Basic Q&A | Multi-Device PC Tool Execution | Web Search + Autonomous Multi-Step Execution |
