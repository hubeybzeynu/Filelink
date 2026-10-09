# 🧪 FileLink Desktop - Complete Test Plan

**Target**: Verify device registration, heartbeat, and online status on website

---

## Pre-Test Checklist

### Environment Setup
- [ ] Website running: https://filelinkhub.vercel.app/
- [ ] Room exists with code: `HUBPROMAN`
- [ ] Supabase project connected: https://ytkylwpbitocnhkyropm.supabase.co
- [ ] Browser dev tools open (F12) to monitor network requests
- [ ] Supabase dashboard open in separate browser tab

### App Build
- [ ] Desktop app built successfully (Release configuration)
- [ ] No compilation errors
- [ ] Executable ready: `FileLink.Desktop/bin/Release/net8.0-windows10.0.22621.0/FileLink.exe`

---

## Test Suite 1: Configuration Loading

### Test 1.1: App Startup
**Objective**: Verify ConfigService correctly initializes website URL

**Steps**:
1. Close any existing FileLink apps
2. Open PowerShell in project directory
3. Set website URL: 
   ```powershell
   $env:FILELINK_SERVER_URL = "https://filelinkhub.vercel.app"
   ```
4. Launch app:
   ```powershell
   .\FileLink.Desktop\bin\Release\net8.0-windows10.0.22621.0\FileLink.exe
   ```
5. Observe splash screen for 3.5 seconds
6. Main window opens

**Expected Results**:
- ✅ Splash screen appears with FileLink logo
- ✅ Main window appears after 3.5 seconds
- ✅ Connection status shows "● Disconnected" (red)
- ✅ "Add Agent" button is enabled
- ✅ App doesn't crash with config errors

**Debug Output**:
- Check Output window (Ctrl+Alt+O in Visual Studio) for log messages:
  ```
  [ConfigService] Fetching config from: https://filelinkhub.vercel.app/api/public/config
  [ConfigService] Configuration loaded successfully
  OR
  [ConfigService] Config endpoint failed: ...
  [ConfigService] Using fallback Supabase configuration
  ```

---

## Test Suite 2: Device Registration

### Test 2.1: Join Room Dialog
**Objective**: Verify room join dialog accepts input

**Steps**:
1. App is open and showing "● Disconnected"
2. Click "Add Agent" button
3. JoinRoomDialog appears
4. Room Code field shows text: `ABC123` (placeholder)
5. Device Name field auto-filled with computer name
6. Both fields are editable

**Expected Results**:
- ✅ Dialog appears modally (blocks main window)
- ✅ Title: "Join FileLink Room"
- ✅ Instructions visible
- ✅ iOS dark theme colors applied (#0F0F0F background, #3A3A3F cards, etc.)
- ✅ "Join Room" and "Cancel" buttons visible

### Test 2.2: Room Code Input
**Objective**: Verify validation works

**Steps**:
1. Dialog is open
2. Clear Room Code field (Ctrl+A, Delete)
3. Click "Join Room"
4. Error dialog appears: "Please enter a room code"
5. Click OK
6. Dialog reappears with Room Code focused
7. Enter: `HUBPROMAN`
8. Device Name: `TestDevice`
9. Click "Join Room"

**Expected Results**:
- ✅ Validation prevents empty room code
- ✅ No API call made with empty code
- ✅ Focus returns to input field
- ✅ Dialog accepts uppercase room code

### Test 2.3: API Registration Call
**Objective**: Verify device registers with website API

**Steps**:
1. Dialog has: Room Code = `HUBPROMAN`, Device Name = `TestDevice`
2. Click "Join Room"
3. If not running as admin:
   - UAC prompt appears (Windows security dialog)
   - Click "Yes" to allow admin elevation
   - Admin window opens (may be behind main window)
   - App relaunches with elevated privileges
4. If running as admin:
   - "Registering device with FileLink..." message
   - Wait 2-3 seconds for API call
5. Success dialog appears:
   ```
   ✓ Device Registered!
   
   Device: TestDevice
   Status: Connected
   Room: HUBPROMAN
   
   Your device is now visible on FileLink.app
   ```

**Expected Results**:
- ✅ Registration succeeds
- ✅ Device ID is generated (format: `dev_...`)
- ✅ App shows "● Connected" (green) in status bar
- ✅ No errors in dialog
- ✅ Success message displays device info

**Network Tab (Dev Tools)**:
- ✅ POST request to: `https://filelinkhub.vercel.app/api/public/link`
- ✅ Request body:
  ```json
  {
    "action": "register",
    "code": "HUBPROMAN",
    "deviceName": "TestDevice",
    "platform": "windows",
    "agent": true,
    "mode": "background",
    "osInfo": "Windows 10 Build 19045"
  }
  ```
- ✅ Response status: 200 OK
- ✅ Response body contains:
  ```json
  {
    "device": {
      "id": "dev_...",
      "token": "48-char-hex-token",
      "name": "TestDevice",
      "admin": false,
      "agent": true,
      "mode": "background"
    }
  }
  ```

---

## Test Suite 3: Heartbeat & Status Updates

### Test 3.1: Heartbeat Starts Automatically
**Objective**: Verify heartbeat sends every 30 seconds

**Steps**:
1. Device successfully registered
2. App shows "● Connected" (green)
3. Keep app running
4. Watch Network tab in browser dev tools
5. Count API requests over 2 minutes

**Expected Results**:
- ✅ First heartbeat within 5 seconds of registration
- ✅ Subsequent heartbeats every ~30 seconds
- ✅ In 2 minutes: ~4 heartbeat requests (at 0s, 30s, 60s, 90s)
- ✅ No heartbeat requests before registration

**Network Tab**:
- ✅ POST requests to: `https://filelinkhub.vercel.app/api/public/link`
- ✅ Request body:
  ```json
  {
    "action": "heartbeat",
    "deviceId": "dev_...",
    "deviceToken": "48-char-hex-token"
  }
  ```
- ✅ Response status: 200 OK
- ✅ Response includes: `devices`, `room`, `inbox` arrays

### Test 3.2: Device Appears on Website
**Objective**: Verify device shows connected on website

**Steps**:
1. App has registered and is sending heartbeats
2. Open website in browser: https://filelinkhub.vercel.app/j/HUBPROMAN
3. Look for Devices section
4. Find device "TestDevice"
5. Check its status indicator

**Expected Results**:
- ✅ Device "TestDevice" appears in device list
- ✅ Status shows green dot (online/connected)
- ✅ Device info visible: name, ID, platform
- ✅ `last_seen` timestamp visible

### Test 3.3: Last Seen Updates in Real-Time
**Objective**: Verify website updates `last_seen` on each heartbeat

**Steps**:
1. Device is registered and showing on website
2. Note the current `last_seen` timestamp
3. Wait 30-35 seconds
4. Refresh website (F5)
5. Check `last_seen` timestamp again

**Expected Results**:
- ✅ `last_seen` timestamp advances by ~30 seconds
- ✅ Timestamp format is human-readable (e.g., "2 minutes ago")
- ✅ Device stays green (online)
- ✅ Clicking device shows full details

### Test 3.4: Device Goes Offline After 45 Seconds
**Objective**: Verify device marks offline if heartbeat stops

**Steps**:
1. Device is registered and connected
2. Close the app (kill FileLink.exe process)
3. Don't reopen it
4. Wait 45 seconds
5. Refresh website
6. Check device status

**Expected Results**:
- ✅ After ~45 seconds: device status changes to offline (grey dot)
- ✅ `last_seen` stops updating
- ✅ Device name still visible (not deleted)
- ✅ Can re-register device with same name

---

## Test Suite 4: Supabase Data Verification

### Test 4.1: Device Record in Supabase
**Objective**: Verify device data is stored correctly

**Steps**:
1. Device is registered and connected
2. Open Supabase dashboard: https://app.supabase.com
3. Select project: `ytkylwpbitocnhkyropm`
4. Go to "Devices" table
5. Look for record with `name = "TestDevice"`

**Expected Results**:
- ✅ Device record exists in `devices` table
- ✅ Fields populated:
  - `id`: UUID (matches device ID shown on website)
  - `name`: "TestDevice"
  - `online`: true (boolean)
  - `last_seen`: current timestamp (updates every 30 seconds)
  - `room_id`: UUID (matches room ID)
  - `token`: 48-character hex string
  - `platform`: "windows"
  - `agent`: true
  - `admin`: false
  - `mode`: "background"
  - `os_info`: "Windows 10 Build 19045"

### Test 4.2: Token is Secure
**Objective**: Verify token format and security

**Steps**:
1. Device record is open in Supabase
2. Check `token` field value
3. Copy token value

**Expected Results**:
- ✅ Token is 48 characters (hex: 0-9, a-f)
- ✅ Token is NOT visible in browser network requests (sent as body, not URL)
- ✅ Token is NOT logged to console
- ✅ Token changes if device re-registers

---

## Test Suite 5: App Features Verification

### Test 5.1: Status Tab Shows Connected
**Objective**: Verify app UI reflects connection status

**Steps**:
1. Device is registered
2. Click "Status" tab in app
3. Check displayed information

**Expected Results**:
- ✅ "Device Status" content area appears
- ✅ Shows: Device name, Status (Connected), Device ID, etc.
- ✅ Status shows "Connected" (not "Disconnected")
- ✅ Last sync time visible

### Test 5.2: System Info Tab Shows Data
**Objective**: Verify system information is displayed

**Steps**:
1. Click "System" tab
2. Check content

**Expected Results**:
- ✅ Shows: Computer name, OS version, processor count, RAM, user, framework
- ✅ All fields populated with actual system data
- ✅ No blank values

### Test 5.3: Other Tabs Display Placeholders
**Objective**: Verify incomplete tabs show friendly messages

**Steps**:
1. Click "Files" tab
2. Check message
3. Repeat for other tabs: Processes, Terminal, Control, AI

**Expected Results**:
- ✅ Each tab shows descriptive text explaining feature
- ✅ No errors or crashes
- ✅ Tabs are clickable and responsive

---

## Test Suite 6: Error Handling

### Test 6.1: Invalid Room Code
**Objective**: Verify API validation works

**Steps**:
1. Click "Add Agent"
2. Enter: Room Code = `INVALID`, Device Name = `Test`
3. Click "Join Room"
4. Wait for response

**Expected Results**:
- ✅ Error message appears after 5-10 seconds
- ✅ Message indicates room not found
- ✅ Device is NOT created in Supabase
- ✅ App stays open (no crash)

### Test 6.2: Network Timeout
**Objective**: Verify timeout handling works

**Steps**:
1. Disconnect internet (unplug network cable or disable wifi)
2. Click "Add Agent"
3. Try to register
4. Wait 10 seconds

**Expected Results**:
- ✅ Timeout error after ~10 seconds
- ✅ Error message: "API request timeout" or similar
- ✅ App stays responsive (no freeze)
- ✅ Can click "Cancel" to close dialog

### Test 6.3: App Uses Cached Config if Offline
**Objective**: Verify fallback config works

**Steps**:
1. Register device (while online)
2. Disconnect internet
3. Close app
4. Reopen app
5. Check if app starts without errors

**Expected Results**:
- ✅ App starts successfully (doesn't crash)
- ✅ Uses cached Supabase config
- ✅ Status shows "Disconnected" (red)
- ✅ "Add Agent" button is greyed out or shows offline message

---

## Test Suite 7: Performance & Stability

### Test 7.1: App Memory Usage
**Objective**: Verify app doesn't leak memory

**Steps**:
1. Open Task Manager (Ctrl+Shift+Esc)
2. Find FileLink.exe process
3. Note Memory usage (MB)
4. Leave app running for 10 minutes
5. Check memory again

**Expected Results**:
- ✅ Initial memory: 50-150 MB
- ✅ After 10 minutes: no significant increase
- ✅ Memory should stay roughly constant
- ✅ CPU usage under 5% when idle

### Test 7.2: Heartbeat Reliability
**Objective**: Verify heartbeat doesn't fail

**Steps**:
1. Device is registered and connected
2. Watch network requests for 5 minutes
3. Count total heartbeat requests
4. Check for any failed requests (4xx, 5xx status)

**Expected Results**:
- ✅ ~10 heartbeat requests in 5 minutes (every 30 seconds)
- ✅ All requests return 200 OK
- ✅ Zero failed requests
- ✅ No network errors in console

### Test 7.3: Window Resizing (Future Feature)
**Objective**: Verify window can be resized (once implemented)

**Steps**:
1. App is open
2. Try to drag window edges to resize
3. Try to maximize/minimize window

**Expected Results** (Current Phase):
- ⚠️ Window is fixed size (by design in Phase 1)
- ⚠️ Maximize/minimize buttons not implemented yet
- ℹ️ This will be fixed in Phase 3

---

## Success Criteria - All Green ✅

For Phase 2 to be complete, ALL tests must pass:

- [ ] Test 1.1: App starts with correct website URL
- [ ] Test 2.1: Join Room dialog appears
- [ ] Test 2.2: Input validation works
- [ ] Test 2.3: API registration succeeds
- [ ] Test 3.1: Heartbeat sends every 30 seconds
- [ ] Test 3.2: Device appears on website as green
- [ ] Test 3.3: `last_seen` updates in real-time
- [ ] Test 3.4: Device goes offline after 45 seconds
- [ ] Test 4.1: Device record in Supabase is correct
- [ ] Test 4.2: Token format is secure
- [ ] Test 5.1: Status tab shows "Connected"
- [ ] Test 5.2: System info displays correctly
- [ ] Test 5.3: Other tabs show friendly messages
- [ ] Test 6.1: Invalid room code handled gracefully
- [ ] Test 6.2: Network timeout handled gracefully
- [ ] Test 6.3: Cached config works offline
- [ ] Test 7.1: Memory usage is stable
- [ ] Test 7.2: All heartbeats succeed
- [ ] Test 7.3: App is stable and responsive

---

## Test Results Template

**Test Date**: ___________  
**Tester**: ___________  
**App Version**: ___________  
**Website**: filelinkhub.vercel.app  
**Test Room**: HUBPROMAN

### Passed Tests
- [ ] Test 1.1
- [ ] Test 2.1
- [ ] Test 2.2
- [ ] Test 2.3
- [ ] ...

### Failed Tests
- [ ] Test X.X - Reason: _____________________
- [ ] Test Y.Y - Reason: _____________________

### Notes
_________________________________________________________________

### Overall Result
- [ ] PASS - Ready for Phase 3
- [ ] FAIL - See failed tests above
- [ ] PARTIAL - Some features working

---

**Next Phase After Tests Pass**: Phase 3 - Terminal, File Manager, Process Manager, Remote Control
