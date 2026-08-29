#!/usr/bin/env node
/**
 * FileLink CLI — share and receive files between PCs from the command prompt.
 *
 *   node filelink.mjs connect https://your-app.lovable.app/j/ABC123 [device-name]
 *
 * Requires Node.js 18 or newer. Files are relayed through the cloud:
 * if the target PC is online it arrives immediately, if it is offline the
 * file waits in the cloud until that PC comes back.
 *
 * Nothing can ever be deleted — this tool only creates, sends and receives.
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import readline from "node:readline";
import { spawn, execSync } from "node:child_process";
import crypto from "node:crypto";


const STATE_FILE = path.join(os.homedir(), ".filelink.json");
const INBOX = path.resolve(process.cwd(), "filelink-inbox");

const c = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  green: "\x1b[32m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
};
const say = (m = "") => console.log(m);
const err = (m) => console.log(`${c.red}! ${m}${c.reset}`);
const ok = (m) => console.log(`${c.green}${m}${c.reset}`);
const info = (m) => console.log(`${c.dim}${m}${c.reset}`);

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  } catch {
    return null;
  }
}
function saveState(s) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(s, null, 2));
}

function humanSize(n) {
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let v = Number(n) || 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)}${units[i]}`;
}

let state = null;
let shellEnabled = false;
let adminMode = false;
let agentMode = false;
const ADMIN_PASSCODE = "hube1848@";

/* ------------------------------------------------- clipboard history */

const clipboardHistory = [];
let lastClipboard = "";

function readClipboard() {
  if (process.platform === "win32") {
    try {
      return runSync('powershell -NoProfile -Command "Get-Clipboard"', 3000);
    } catch {}
    try {
      return runSync('powershell -NoProfile -Command "[System.Windows.Forms.Clipboard]::GetText()"', 3000);
    } catch {}
  } else if (process.platform === "darwin") {
    try {
      return runSync("pbpaste");
    } catch {}
  } else {
    try {
      return runSync("xclip -selection clipboard -o");
    } catch {}
    try {
      return runSync("xsel -b -o");
    } catch {}
  }
  return "";
}

function writeClipboard(text) {
  if (process.platform === "win32") {
    // Interpolating text directly into a -Command string gets parsed by
    // BOTH cmd.exe and PowerShell — anything with &, %, ^, quotes, or a
    // newline silently breaks it. Writing to a temp file and having
    // PowerShell read that avoids command-line escaping entirely.
    const tmp = path.join(os.tmpdir(), `filelink-clip-${Date.now()}-${Math.random().toString(36).slice(2)}.txt`);
    try {
      fs.writeFileSync(tmp, text, "utf8");
      execSync(
        `powershell -NoProfile -Command "Set-Clipboard -Value (Get-Content -Raw -Encoding UTF8 -LiteralPath '${tmp}')"`,
        { encoding: "utf8", timeout: 5000 },
      );
      return true;
    } catch {
      return false;
    } finally {
      try { fs.unlinkSync(tmp); } catch {}
    }
  } else if (process.platform === "darwin") {
    try {
      runSync(`echo ${shellQuote(text)} | pbcopy`);
      return true;
    } catch {
      return false;
    }
  } else {
    try {
      runSync(`echo ${shellQuote(text)} | xclip -selection clipboard`);
      return true;
    } catch {
      try {
        runSync(`echo ${shellQuote(text)} | xsel -b -i`);
        return true;
      } catch {
        return false;
      }
    }
  }
}

function shellQuote(text) {
  return `'${text.replace(/'/g, "'\\''")}'`;
}

function pushClipboard(text, source = "device") {
  if (!text || text === lastClipboard) return;
  lastClipboard = text;
  clipboardHistory.push({ ts: Date.now(), text: text.slice(0, 2000), source });
  while (clipboardHistory.length > 30) clipboardHistory.shift();
}

function startClipboardMonitor() {
  setInterval(() => {
    try {
      const value = readClipboard();
      if (value && value !== lastClipboard) {
        pushClipboard(value, "device");
      }
    } catch {}
  }, 4000);
}



async function api(action, payload = {}) {

  const res = await fetch(`${state.origin}/api/public/link`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      action,
      deviceId: state.deviceId,
      deviceToken: state.deviceToken,
      ...payload,
    }),
  });
  const data = await res.json().catch(() => ({ error: "Bad response from server" }));
  if (!res.ok || data.error) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

function parseLink(link) {
  const raw = String(link || "").trim();
  if (!raw) throw new Error("Missing link or code");
  if (/^https?:\/\//i.test(raw)) {
    const url = new URL(raw);
    const code = url.searchParams.get("code") || url.pathname.split("/").filter(Boolean).pop();
    if (!code) throw new Error("That link has no room code in it");
    return { origin: url.origin, code: code.toUpperCase() };
  }
  const saved = loadState();
  if (!saved?.origin) throw new Error("Use the full link the website gave you the first time");
  return { origin: saved.origin, code: raw.toUpperCase() };
}

function resolvePath(cwd, target) {
  if (!target || target === ".") return cwd;
  let p = target.replace(/\\/g, "/");
  if (p === "..") {
    const parts = cwd.split("/").filter(Boolean);
    parts.pop();
    return "/" + parts.join("/");
  }
  if (!p.startsWith("/")) p = (cwd === "/" ? "" : cwd) + "/" + p;
  p = "/" + p.split("/").filter(Boolean).join("/");
  return p;
}

function parseCdAt(arg) {
  const rest = arg.slice(1).trim();
  if (!rest) return { target: "", quoted: false };
  if (rest.startsWith('"')) {
    const end = rest.indexOf('"', 1);
    if (end === -1) return { target: rest.slice(1), quoted: true };
    return { target: rest.slice(1, end), quoted: true };
  }
  return { target: rest, quoted: false };
}

function askPassword() {
  return new Promise((resolve) => {
    if (process.stdin.isTTY) process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");
    let pass = "";
    const onData = (data) => {
      const str = String(data);
      for (const ch of str) {
        if (ch === "\r" || ch === "\n") {
          process.stdin.removeListener("data", onData);
          if (process.stdin.isTTY) process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdout.write("\n");
          resolve(pass);
          return;
        }
        if (ch === "\u0003") {
          process.stdin.removeListener("data", onData);
          if (process.stdin.isTTY) process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdout.write("\n");
          resolve(null);
          return;
        }
        if (ch === "\u007f" || ch === "\b") {
          if (pass.length) {
            pass = pass.slice(0, -1);
            process.stdout.write("\b \b");
          }
        } else {
          pass += ch;
          process.stdout.write("*");
        }
      }
    };
    process.stdin.on("data", onData);
  });
}

function isCloudDeletionCommand(line) {
  const lower = line.toLowerCase();
  if (!/\b(del|rm|rmdir|rd|erase)\b/.test(lower)) return false;
  if (/\b[A-Z0-9]{6}\b:/.test(line)) return true;
  if (/\b(shares|filelink-inbox|cloud|room)\b/i.test(line)) return true;
  if (/\b(del|erase)\b.+\s\/[sSqQfF]/.test(lower)) return true;
  return false;
}

function detectOS() {
  if (process.platform !== "win32") return `${process.platform} ${os.release()}`;
  try {
    const out = execSync('powershell -command "(Get-CimInstance Win32_OperatingSystem).Caption"', {
      encoding: "utf8",
      timeout: 8000,
    }).trim();
    if (out) return out;
  } catch {}
  try {
    const out = execSync("wmic os get Caption /value", { encoding: "utf8", timeout: 8000 });
    const m = out.match(/Caption=(.+)/);
    if (m?.[1]) return m[1].trim();
  } catch {}
  return "Windows";
}

function runSync(command, timeout = 5000) {
  try {
    return execSync(command, { encoding: "utf8", timeout }).trim();
  } catch {
    return "";
  }
}

function parseWmicCsv(text) {
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];
  const header = lines[0].split(",").map((h) => h.replace(/^"|"$/g, "").trim());
  return lines.slice(1).map((line) => {
    const cols = line.split(",").map((c) => c.replace(/^"|"$/g, "").trim());
    const row = {};
    header.forEach((h, i) => (row[h] = cols[i]));
    return row;
  });
}

function getSysInfo() {
  const hostname = os.hostname();
  const osCaption = detectOS();
  let cpu = "";
  let ramTotal = 0;
  let ramUsed = 0;
  let uptime = "";
  try {
    cpu = runSync('powershell -command "(Get-CimInstance Win32_Processor).Name"');
  } catch {}
  if (!cpu) {
    try {
      const rows = parseWmicCsv(runSync("wmic cpu get Name /format:csv"));
      cpu = rows.find((r) => r.Name)?.Name || "";
    } catch {}
  }
  try {
    const total = Number(runSync('powershell -command "(Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory"'));
    const free = Number(runSync('powershell -command "(Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory"')) * 1024;
    if (total) ramTotal = total;
    if (free) ramUsed = total - free;
  } catch {}
  try {
    const up = runSync('powershell -command "(Get-Date) - (Get-CimInstance Win32_OperatingSystem).LastBootUpTime | Select-Object Days,Hours,Minutes | ConvertTo-Csv -NoTypeInformation"');
    const rows = parseWmicCsv(up);
    const r = rows[0] || {};
    const parts = [r.Days && `${r.Days}d`, r.Hours && `${r.Hours}h`, r.Minutes && `${r.Minutes}m`].filter(Boolean);
    uptime = parts.join(" ") || "";
  } catch {}

  const drives = [];
  try {
    const out = runSync('powershell -command "Get-CimInstance Win32_LogicalDisk | Where-Object {$_.DriveType -eq 3} | Select-Object DeviceID,FreeSpace,Size | ConvertTo-Csv -NoTypeInformation"');
    parseWmicCsv(out).forEach((r) => {
      const total = Number(r.Size);
      const free = Number(r.FreeSpace);
      if (total) drives.push({ letter: r.DeviceID, free: free || 0, total });
    });
  } catch {}

  const network = [];
  try {
    const nics = os.networkInterfaces();
    for (const [name, addrs] of Object.entries(nics)) {
      for (const a of addrs || []) {
        if (a.family === "IPv4" && !a.internal) {
          network.push({ name, ip: a.address, mac: a.mac });
        }
      }
    }
  } catch {}

  return { hostname, os: osCaption, osVersion: osCaption, cpu, ramTotal, ramUsed, uptime, drives, network };
}

function getTasklist() {
  const processes = [];

  // Get memory and basic info via tasklist.
  const ramMap = new Map();
  try {
    const out = runSync("tasklist /fo csv /nh");
    out.split("\n").forEach((line) => {
      const cols = line.split('","').map((c) => c.replace(/^"|"$/g, ""));
      const name = cols[0];
      const pid = cols[1];
      const ram = cols[4]?.replace(/[^0-9]/g, "");
      if (name && pid) ramMap.set(pid, { name, ram: Number(ram) * 1024 || 0 });
    });
  } catch {}

  // Get CPU per process.
  const cpuMap = new Map();
  try {
    const out = runSync("wmic path Win32_PerfFormattedData_PerfProc_Process get Name,IDProcess,PercentProcessorTime /format:csv");
    parseWmicCsv(out).forEach((r) => {
      const pid = r.IDProcess || r.idProcess;
      const cpu = Number(r.PercentProcessorTime);
      if (pid) cpuMap.set(pid, cpu || 0);
    });
  } catch {}

  // Get executable paths and icons for top processes (up to 60). Icons are
  // cached to disk keyed by exe path so a given app's icon is only ever
  // extracted once — before this, every single tasklist refresh re-spawned
  // PowerShell + GDI+ for every visible process, every few seconds.
  const iconMap = new Map();
  const pidToPath = new Map();
  try {
    const cacheDir = path.join(os.tmpdir(), "filelink-icon-cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    const listPs = "Get-Process | Where-Object { $_.Path } | Select-Object -First 60 Id, Path | ForEach-Object { \"$($_.Id)|$($_.Path)\" }";
    const listOut = runSync(`powershell -NoProfile -Command "${listPs}"`, 8000);
    listOut.split("\n").forEach((line) => {
      const idx = line.indexOf("|");
      if (idx === -1) return;
      const pid = line.slice(0, idx).trim();
      const exePath = line.slice(idx + 1).trim();
      if (pid && exePath) pidToPath.set(pid, exePath);
    });

    const uncachedPaths = [];
    for (const exePath of new Set(pidToPath.values())) {
      const cacheFile = path.join(cacheDir, `${crypto.createHash("md5").update(exePath).digest("hex")}.png`);
      if (fs.existsSync(cacheFile)) {
        const b64 = fs.readFileSync(cacheFile).toString("base64");
        iconMap.set(exePath, `data:image/png;base64,${b64}`);
      } else {
        uncachedPaths.push(exePath);
      }
    }

    if (uncachedPaths.length) {
      const pathsLiteral = uncachedPaths.map((p) => `'${p.replace(/'/g, "''")}'`).join(",");
      const ps = [
        `@(${pathsLiteral}) | ForEach-Object {`,
        "  $exePath = $_;",
        "  try {",
        "    $ico = [System.Drawing.Icon]::ExtractAssociatedIcon($exePath);",
        "    if ($ico) {",
        "      $bmp = New-Object System.Drawing.Bitmap(32,32);",
        "      $g = [System.Drawing.Graphics]::FromImage($bmp);",
        "      $g.DrawIcon($ico, 0, 0, 32, 32);",
        "      $ms = New-Object System.IO.MemoryStream;",
        "      $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png);",
        "      $b64 = [Convert]::ToBase64String($ms.ToArray());",
        "      Write-Output \"$exePath|$b64\";",
        "      $ico.Dispose(); $bmp.Dispose(); $g.Dispose(); $ms.Dispose();",
        "    }",
        "  } catch {}",
        "}",
      ].join(" ");
      const out = runSync(`powershell -NoProfile -Command "${ps.replace(/"/g, '\\"')}"`, 15000);
      out.split("\n").forEach((line) => {
        const idx = line.indexOf("|");
        if (idx === -1) return;
        const exePath = line.slice(0, idx).trim();
        const b64 = line.slice(idx + 1).trim();
        if (!exePath || !b64) return;
        iconMap.set(exePath, `data:image/png;base64,${b64}`);
        try {
          const cacheFile = path.join(cacheDir, `${crypto.createHash("md5").update(exePath).digest("hex")}.png`);
          fs.writeFileSync(cacheFile, Buffer.from(b64, "base64"));
        } catch {}
      });
    }
  } catch {}

  for (const [pid, { name, ram }] of ramMap) {
    processes.push({
      pid,
      name,
      ram,
      cpu: cpuMap.get(pid) ?? 0,
      disk: 0,
      network: 0,
      gpu: 0,
      icon: iconMap.get(pidToPath.get(pid)) || undefined,
    });
  }

  return { processes };
}


function handleControl(params) {
  const { command } = params || {};
  switch (command) {
    case "rename": {
      const newName = String(params?.name ?? "").trim().slice(0, 160);
      if (newName && state) {
        state.deviceName = newName;
        info(`renamed to "${newName}"`);
      }
      return { ok: true, name: state?.deviceName };
    }
    case "cursorInfo": {
      const ps =
        "Add-Type -AssemblyName System.Windows.Forms; $b = [System.Windows.Forms.SystemInformation]::VirtualScreen; Write-Output \"$($b.Width),$($b.Height)\"";
      const out = runSync(`powershell -NoProfile -Command "${ps.replace(/"/g, '\\"')}"`, 5000);
      const [w, h] = out.trim().split(",").map(Number);
      return { width: w || 1920, height: h || 1080 };
    }
    case "cursorMove":
    case "cursorClick":
    case "cursorScroll": {
      // Fire-and-forget, same reasoning as "alert" — these run instantly
      // (no MessageBox to wait on) but a fresh powershell.exe process still
      // takes ~100-300ms to start, which is the real floor on how "live"
      // this can feel over exec-per-action. Not truly 1:1 mouse tracking —
      // more like tap-to-move-and-click.
      const x = Math.round(Number(params?.x ?? 0));
      const y = Math.round(Number(params?.y ?? 0));
      const mouseOpsType =
        'public class FLMouse { [System.Runtime.InteropServices.DllImport("user32.dll")] public static extern void mouse_event(uint f, uint dx, uint dy, int data, uint extra); [System.Runtime.InteropServices.DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y); }';
      let action = "";
      if (command === "cursorMove") {
        action = `[FLMouse]::SetCursorPos(${x}, ${y})`;
      } else if (command === "cursorClick") {
        const button = String(params?.button ?? "left");
        const down = button === "right" ? "0x0008" : button === "middle" ? "0x0020" : "0x0002";
        const up = button === "right" ? "0x0010" : button === "middle" ? "0x0040" : "0x0004";
        action = `[FLMouse]::SetCursorPos(${x}, ${y}); [FLMouse]::mouse_event(${down},0,0,0,0); [FLMouse]::mouse_event(${up},0,0,0,0)`;
      } else {
        const amount = Math.round(Number(params?.amount ?? 0));
        const horizontal = Boolean(params?.horizontal);
        action = horizontal
          ? `[FLMouse]::mouse_event(0x1000,0,0,${amount},0)`
          : `[FLMouse]::mouse_event(0x0800,0,0,${amount},0)`;
      }
      const ps = `Add-Type -TypeDefinition '${mouseOpsType}'; ${action}`;
      runSync(`powershell -NoProfile -Command "${ps.replace(/"/g, '\\"')}"`, 3000);
      return { ok: true };
    }
    case "alert": {
      const title = String(params?.title ?? "Message").replace(/'/g, "''").slice(0, 120);
      const content = String(params?.content ?? "").replace(/'/g, "''").slice(0, 2000);
      const ps = `Add-Type -AssemblyName PresentationFramework; [System.Windows.MessageBox]::Show('${content}', '${title}', 'OK', 'Information')`;
      // Spawned detached and unref'd — a MessageBox blocks until someone
      // clicks OK on that PC, so this must never be awaited/execSync'd or
      // it would hang this RPC (and every request after it) until then.
      const child = spawn("powershell", ["-NoProfile", "-Command", ps], {
        detached: true,
        stdio: "ignore",
        windowsHide: false,
      });
      child.unref();
      return { ok: true };
    }
    case "shutdown": {
      const secs = Math.max(0, Math.floor(Number(params?.seconds ?? 0))) || 0;
      // Windows' own scheduler runs this — it keeps counting even if the
      // browser/tab that requested it is closed or refreshed.
      runSync(`shutdown /s /t ${secs}`);
      return { ok: true };
    }
    case "restart": {
      const secs = Math.max(0, Math.floor(Number(params?.seconds ?? 0))) || 0;
      runSync(`shutdown /r /t ${secs}`);
      return { ok: true };
    }
    case "sleep":
      runSync(
        `powershell -Command "Add-Type -Assembly System.Windows.Forms; [System.Windows.Forms.Application]::SetSuspendState([System.Windows.Forms.PowerState]::Suspend, $false, $false)"`,
      );
      return { ok: true };
    case "logout":
      runSync("shutdown /l");
      return { ok: true };
    case "lock":
      // Per user: "lock like shutdown but keep data" => hibernate (S4)
      runSync("shutdown /h");
      return { ok: true };
    case "screenLock":
      runSync("rundll32.exe user32.dll,LockWorkStation");
      return { ok: true };
    case "cancelShutdown":
      runSync("shutdown /a");
      return { ok: true };
    case "flushDns":
      runSync("ipconfig /flushdns");
      return { ok: true };
    case "getDns": {
      try {
        const out = runSync(
          `powershell -Command "Get-DnsClientServerAddress -AddressFamily IPv4 | Select-Object -Property InterfaceAlias,ServerAddresses | ConvertTo-Json"`,
        );
        return { ok: true, dns: out };
      } catch (e) {
        return { ok: false, error: String(e) };
      }
    }
    case "setDns": {
      const iface = String((params && params.interface) || "");
      const servers = Array.isArray(params && params.servers) ? params.servers : [];
      if (!iface || servers.length === 0) throw new Error("Missing interface or servers");
      const list = servers.map((s) => `'${String(s).replace(/'/g, "")}'`).join(",");
      runSync(
        `powershell -Command "Set-DnsClientServerAddress -InterfaceAlias '${iface.replace(/'/g, "")}' -ServerAddresses (${list})"`,
      );
      return { ok: true };
    }
    case "resetDns": {
      const iface = String((params && params.interface) || "");
      if (!iface) throw new Error("Missing interface");
      runSync(
        `powershell -Command "Set-DnsClientServerAddress -InterfaceAlias '${iface.replace(/'/g, "")}' -ResetServerAddresses"`,
      );
      return { ok: true };
    }
    case "stopAgent":
      setTimeout(() => process.exit(0), 200);
      return { ok: true };
    case "removeAgent": {
      // Complete cleanup: kill node/wscript, delete startup shortcut, remove data dir.
      const cleanup = [
        "@echo off",
        "timeout /t 1 /nobreak >nul",
        "taskkill /f /im wscript.exe >nul 2>&1",
        `del /f /q "%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\Startup\\FileLinkAgent.lnk" >nul 2>&1`,
        `rmdir /s /q "%APPDATA%\\FileLinkAgent" >nul 2>&1`,
        "taskkill /f /im node.exe >nul 2>&1",
      ].join("\r\n");
      const script = path.join(os.tmpdir(), `filelink-uninstall-${Date.now()}.cmd`);
      try {
        fs.writeFileSync(script, cleanup);
        spawn("cmd", ["/c", script], { detached: true, windowsHide: true });
      } catch {}
      setTimeout(() => process.exit(0), 300);
      return { ok: true };
    }
    case "restartAgent": {
      const script = path.join(os.homedir(), ".filelink-restart.cmd");
      try {
        fs.writeFileSync(
          script,
          `@echo off\ntimeout /t 1 /nobreak >nul\n"${process.argv[0]}" "${process.argv[1]}" connect ${state.origin}/j/${state.code} "${state.deviceName}" --shell --agent\n`,
        );
        spawn("cmd", ["/c", script], { detached: true, windowsHide: true });
      } catch {}
      setTimeout(() => process.exit(0), 300);
      return { ok: true };
    }
    default:
      throw new Error("Unknown control command");
  }
}


// Grab the current screen and hand it back as a base64 JPEG so the dashboard
// can mirror what is happening on this PC while commands run.
function getScreenshot(preview = false) {
  const out = path.join(os.tmpdir(), `filelink-screen-${process.pid}.jpg`);
  if (process.platform === "win32") {
    // The .NET default JPEG encoder has no explicit quality set, which
    // falls back to a low, blocky default — that's the actual cause of a
    // blurry screen share, not resolution. Setting Encoder.Quality
    // explicitly (95) fixes it without materially increasing file size.
    //
    // "preview" mode (used by live-refreshing views like Display's Live
    // toggle and the Cursor tab's screen preview) instead scales down and
    // drops quality on purpose — those refresh every couple seconds, so a
    // full-resolution 95%-quality frame is wasted bandwidth and makes each
    // refresh noticeably slower to arrive for no visible benefit at that
    // size. A one-off "Capture Screen" save still gets the full-quality path.
    const scale = preview ? "0.5" : "1.0";
    const quality = preview ? "55L" : "95L";
    const ps = [
      "Add-Type -AssemblyName System.Windows.Forms,System.Drawing;",
      "$b=[System.Windows.Forms.SystemInformation]::VirtualScreen;",
      "$full=New-Object System.Drawing.Bitmap $b.Width,$b.Height;",
      "$g=[System.Drawing.Graphics]::FromImage($full);",
      "$g.CopyFromScreen($b.Location,[System.Drawing.Point]::Empty,$full.Size);",
      `$scale=${scale};`,
      "$bmp=New-Object System.Drawing.Bitmap([int]($b.Width*$scale),[int]($b.Height*$scale));",
      "$g2=[System.Drawing.Graphics]::FromImage($bmp);",
      "$g2.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBilinear;",
      "$g2.DrawImage($full,0,0,$bmp.Width,$bmp.Height);",
      "$enc=[System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' };",
      "$params=New-Object System.Drawing.Imaging.EncoderParameters(1);",
      `$params.Param[0]=New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, ${quality});`,
      `$bmp.Save('${out.replace(/\\/g, "\\\\")}',$enc,$params);`,
    ].join(" ");
    runSync(`powershell -NoProfile -Command "${ps.replace(/"/g, '\\"')}"`, preview ? 4000 : 8000);
  } else if (process.platform === "darwin") {
    runSync(`screencapture -x -t jpg "${out}"`);
  } else {
    try {
      runSync(`import -window root "${out}"`);
    } catch {
      runSync(`scrot -o "${out}"`);
    }
  }
  if (!fs.existsSync(out)) throw new Error("Screen capture is not available on this PC");
  const data = fs.readFileSync(out);
  try {
    fs.unlinkSync(out);
  } catch {}
  return { image: data.toString("base64"), mime: "image/jpeg", at: Date.now() };
}





/* ------------------------------------------------- live sharing (no cloud) */

// The folder this PC exposes live to the room. Other devices can browse and
// pull straight from here — files are streamed on demand and never stored
// in the cloud.
let sharedRoot = process.cwd();

function safeJoin(root, rel) {
  const clean = String(rel || "/").replace(/\\/g, "/");
  const abs = path.resolve(root, "." + (clean.startsWith("/") ? clean : "/" + clean));
  const rootAbs = path.resolve(root);
  if (abs !== rootAbs && !abs.startsWith(rootAbs + path.sep)) throw new Error("Outside the shared folder");
  return abs;
}

function localList(rel) {
  const abs = safeJoin(sharedRoot, rel);
  const entries = fs.readdirSync(abs, { withFileTypes: true });
  const folders = [];
  const files = [];
  for (const e of entries) {
    if (e.name.startsWith(".")) continue;
    try {
      if (e.isDirectory()) folders.push({ name: e.name });
      else if (e.isFile()) files.push({ name: e.name, size: fs.statSync(path.join(abs, e.name)).size });
    } catch { /* unreadable entry */ }
  }
  return { path: rel || "/", folders, files };
}

function localTree(rel, limit = 200) {
  const out = [];
  const walk = (relDir, depth) => {
    if (out.length >= limit || depth > 8) return;
    let entries = [];
    try {
      entries = fs.readdirSync(safeJoin(sharedRoot, relDir), { withFileTypes: true });
    } catch { return; }
    for (const e of entries) {
      if (out.length >= limit) return;
      if (e.name.startsWith(".")) continue;
      const childRel = (relDir === "/" ? "" : relDir) + "/" + e.name;
      out.push({ path: childRel, dir: e.isDirectory() });
      if (e.isDirectory()) walk(childRel, depth + 1);
    }
  };
  walk(rel || "/", 0);
  return { entries: out };
}

function localSearch(rel, query, limit = 80) {

  const q = String(query || "").toLowerCase();
  const out = [];
  const walk = (relDir, depth) => {
    if (out.length >= limit || depth > 6) return;
    let entries = [];
    try {
      entries = fs.readdirSync(safeJoin(sharedRoot, relDir), { withFileTypes: true });
    } catch { return; }
    for (const e of entries) {
      if (out.length >= limit) return;
      if (e.name.startsWith(".")) continue;
      const childRel = (relDir === "/" ? "" : relDir) + "/" + e.name;
      if (e.name.toLowerCase().includes(q)) out.push({ path: childRel, dir: e.isDirectory() });
      if (e.isDirectory()) walk(childRel, depth + 1);
    }
  };
  walk(rel || "/", 0);
  return { matches: out };
}

function localRead({ path: rel, offset = 0, length = 262144 }) {
  const abs = safeJoin(sharedRoot, rel);
  const stat = fs.statSync(abs);
  if (!stat.isFile()) throw new Error("Not a file");
  const fd = fs.openSync(abs, "r");
  const buf = Buffer.alloc(Math.min(length, Math.max(0, stat.size - offset)));
  if (buf.length) fs.readSync(fd, buf, 0, buf.length, offset);
  fs.closeSync(fd);
  return { size: stat.size, offset, chunk: buf.toString("base64"), eof: offset + buf.length >= stat.size };
}

// Write a base64 chunk from the dashboard into the shared folder.
// first=true truncates (or creates) the file, otherwise the chunk is appended.
function localWrite({ path: rel, chunk = "", first = false }) {
  const abs = safeJoin(sharedRoot, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  const buf = Buffer.from(String(chunk), "base64");
  if (first) fs.writeFileSync(abs, buf);
  else fs.appendFileSync(abs, buf);
  const size = fs.existsSync(abs) ? fs.statSync(abs).size : 0;
  return { ok: true, path: rel, size };
}

function localMkdir({ path: rel }) {
  const abs = safeJoin(sharedRoot, rel);
  fs.mkdirSync(abs, { recursive: true });
  return { ok: true, path: rel };
}



function handleRpc(call) {
  const p = call.params || {};
  switch (call.method) {
    case "info":
      return { root: sharedRoot, name: state.deviceName };
    case "list":
      return localList(p.path);
    case "search":
      return localSearch(p.path, p.query);
    case "read":
      return localRead(p);
    case "write":
      return localWrite(p);
    case "mkdir":
      return localMkdir(p);

    case "tree":
      return localTree(p.path || "/");
    case "disk": {
      try {
        const st = fs.statfsSync(sharedRoot);
        return { free: st.bfree * st.bsize, total: st.blocks * st.bsize, root: sharedRoot };
      } catch {
        return { free: null, total: null, root: sharedRoot };
      }
    }
    case "sysinfo":
      return getSysInfo();
    case "tasklist":
      return getTasklist();
    case "control":
      return handleControl(p);
    case "screenshot":
      return getScreenshot(Boolean(p?.preview));
    case "clipboardHistory":
      return { entries: clipboardHistory.slice().reverse() };
    case "clipboardWrite": {
      if (!p.text) throw new Error("Missing text");
      const ok = writeClipboard(p.text);
      if (!ok) throw new Error("Could not write to the clipboard on this PC");
      pushClipboard(p.text, "dashboard");
      return { ok: true };
    }
    case "clipboardRead": {
      const text = readClipboard();
      pushClipboard(text, "device");
      return { text };
    }
    case "exit": {

      setTimeout(() => {
        say("");
        info("session ended from the dashboard — goodbye");
        process.exit(0);
      }, 250);
      return { ok: true };
    }
    case "exec": {
      if (!shellEnabled) throw new Error("Remote shell not enabled on this PC. Start the CLI with --shell.");
      // Streaming is handled in serveRequests so output can arrive live.
      return { ok: true };
    }
    default:
      throw new Error("Unsupported request");
  }
}


async function runExecRpc(call) {
  const command = call.params?.command;
  if (!command) {
    await api("rpcRespond", { callId: call.id, error: "Missing command" }).catch(() => {});
    return;
  }
  await runLocalCommand(command, call.id);
}

function runLocalCommand(command, callId = null) {
  return new Promise((resolve) => {
    if (!shellEnabled) {
      err("Remote shell not enabled on this PC. Start the CLI with --shell.");
      if (callId) api("rpcRespond", { callId, error: "Remote shell not enabled on this PC. Start the CLI with --shell." }).catch(() => {});
      resolve();
      return;
    }
    const child = spawn(command, { shell: true, cwd: process.cwd(), env: process.env });
    child.stdout.on("data", (data) => {
      process.stdout.write(data);
      if (callId) api("rpcChunk", { callId, chunk: data.toString() }).catch(() => {});
    });
    child.stderr.on("data", (data) => {
      process.stderr.write(data);
      if (callId) api("rpcChunk", { callId, chunk: data.toString() }).catch(() => {});
    });
    child.on("error", (e) => {
      err(e.message);
      if (callId) api("rpcRespond", { callId, error: e.message }).catch(() => {});
      resolve();
    });
    child.on("close", (code) => {
      if (code !== 0) info(`exit code ${code}`);
      if (callId) api("rpcRespond", { callId, result: { code: code ?? 0, done: true } }).catch(() => {});
      resolve();
    });
  });
}


async function serveRequests() {
  const { calls } = await api("rpcPoll");
  for (const call of calls) {
    if (call.method === "exec") {
      void runExecRpc(call);
      continue;
    }
    try {
      await api("rpcRespond", { callId: call.id, result: handleRpc(call) });
    } catch (e) {
      await api("rpcRespond", { callId: call.id, error: e.message }).catch(() => {});
    }
  }
}


async function remoteCall(device, method, params = {}) {
  const r = await api("rpc", { target: device, method, params });
  return r.result;
}

async function cmdRemoteLs(remote) {
  const r = await remoteCall(remote.name, "list", { path: remote.path });
  if (!r.folders.length && !r.files.length) return info("(empty)");
  for (const f of r.folders) say(`${c.cyan}${f.name}/${c.reset}`);
  for (const f of r.files) say(`${f.name}  ${c.dim}${humanSize(f.size)}${c.reset}`);
}

async function cmdRemoteSearch(remote, query) {
  if (!query) return err("Usage: search <text>");
  const r = await remoteCall(remote.name, "search", { path: remote.path, query });
  if (!r.matches.length) return info("no matches");
  for (const m of r.matches) say(`${m.dir ? c.cyan + m.path + "/" : m.path}${c.reset}`);
}

async function cmdRemoteGet(remote, name) {
  if (!name) return err("Usage: get <file name>");
  const rel = name.startsWith("/") ? name : (remote.path === "/" ? "" : remote.path) + "/" + name;
  fs.mkdirSync(INBOX, { recursive: true });
  let dest = path.join(INBOX, path.basename(rel));
  let n = 1;
  while (fs.existsSync(dest)) {
    const ext = path.extname(dest);
    dest = path.join(INBOX, `${path.basename(rel, path.extname(rel))} (${n++})${ext}`);
  }
  const CHUNK = 262144;
  let offset = 0;
  const parts = [];
  for (;;) {
    const r = await remoteCall(remote.name, "read", { path: rel, offset, length: CHUNK });
    parts.push(Buffer.from(r.chunk, "base64"));
    offset += Buffer.from(r.chunk, "base64").length;
    info(`  ${humanSize(offset)} / ${humanSize(r.size)}`);
    if (r.eof || !r.chunk) break;
  }
  fs.writeFileSync(dest, Buffer.concat(parts));
  ok(`pulled straight from ${remote.name} — ${dest}`);
}

/* ---------------------------------------------------------------- commands */

async function cmdLs(cwd) {
  const { folders, files } = await api("ls", { path: cwd });
  if (!folders.length && !files.length) return info("(empty)");
  for (const f of folders) say(`${c.cyan}${f.name}/${c.reset}`);
  for (const f of files) {
    const to = f.to_name ? ` -> ${f.to_name}` : " (everyone)";
    say(
      `${f.file_name}  ${c.dim}${humanSize(f.size_bytes)}  from ${f.from_name}${to}  [${f.status}]${c.reset}`,
    );
  }
}

async function cmdDevices() {
  const { devices } = await api("devices");
  for (const d of devices) {
    const dot = d.online ? `${c.green}● online ${c.reset}` : `${c.dim}○ offline${c.reset}`;
    say(`${dot} ${d.name}${c.dim}${d.platform ? "  " + d.platform : ""}${c.reset}`);
  }
}

async function cmdSend(cwd, args) {
  // Accepted shapes:
  //   send report.pdf
  //   send report.pdf to Office PC
  //   send report.pdf to Office PC in /homework
  //   send "my file.pdf" --to Office PC --in homework
  let rest = args.join(" ").trim();
  let to = null;
  let folder = cwd;

  const inMatch = rest.match(/\s(?:--in|in)\s+("[^"]+"|\S.*)$/i);
  if (inMatch) {
    folder = inMatch[1].replace(/^"|"$/g, "").trim();
    rest = rest.slice(0, inMatch.index).trim();
  }
  const toMatch = rest.match(/\s(?:--to|to)\s+("[^"]+"|\S.*)$/i);
  if (toMatch) {
    to = toMatch[1].replace(/^"|"$/g, "").trim() || null;
    rest = rest.slice(0, toMatch.index).trim();
  }
  const file = rest.replace(/^"|"$/g, "").trim();
  if (!file)
    return err('Usage: send <file> [to <device>] [in <folder>]   e.g. send notes.pdf to Laptop in /homework');
  if (!folder.startsWith("/")) folder = resolvePath(cwd, folder);

  const abs = path.resolve(process.cwd(), file);
  if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) return err(`No such file: ${abs}`);

  if (folder !== "/") {
    // Make sure every part of the destination exists before uploading.
    const parts = folder.split("/").filter(Boolean);
    let walk = "/";
    for (const part of parts) {
      await api("mkdir", { path: walk, name: part }).catch(() => {});
      walk = walk === "/" ? `/${part}` : `${walk}/${part}`;
    }
  }

  const size = fs.statSync(abs).size;
  const init = await api("uploadInit", {
    folderPath: folder,
    fileName: path.basename(abs),
    size,
    to,
  });
  info(`uploading ${path.basename(abs)} (${humanSize(size)}) to ${folder} ...`);
  const startedAt = Date.now();
  const put = await fetch(init.uploadUrl, {
    method: "PUT",
    headers: { "content-type": "application/octet-stream" },
    body: fs.readFileSync(abs),
  });
  if (!put.ok) return err(`Upload failed (${put.status})`);
  const done = await api("uploadDone", { transferId: init.transferId });
  const secs = Math.max(0.001, (Date.now() - startedAt) / 1000);
  info(`${humanSize(size)} in ${secs.toFixed(1)}s — ${humanSize(size / secs)}/s`);
  if (!to) ok(`shared in ${folder} — anyone in the room can get it`);
  else if (done.direct) ok(`delivered to ${to}, filed under ${folder}`);
  else ok(`${to} is offline — saved in ${folder}, it will arrive when they connect`);

}

async function cmdGet(cwd, args) {
  const name = args.join(" ").trim();
  if (!name) return err("Usage: get <file name>");
  const { files } = await api("ls", { path: cwd });
  const match = files.find((f) => f.file_name.toLowerCase() === name.toLowerCase());
  if (!match) return err(`No file named "${name}" in ${cwd}`);
  await downloadTransfer(match.id, match.file_name);
}

async function downloadTransfer(id, fileName, folderPath) {
  const { url } = await api("download", { transferId: id });
  const res = await fetch(url);
  if (!res.ok) return err(`Download failed (${res.status})`);

  // Honor the destination folder the sender chose; fall back to the inbox.
  let baseDir = INBOX;
  if (folderPath) {
    const candidate = path.resolve(sharedRoot, "." + folderPath.replace(/\\/g, "/"));
    if (candidate.startsWith(path.resolve(sharedRoot) + path.sep) || candidate === path.resolve(sharedRoot)) {
      baseDir = candidate;
    }
  }
  fs.mkdirSync(baseDir, { recursive: true });

  let dest = path.join(baseDir, fileName);
  let n = 1;
  while (fs.existsSync(dest)) {
    const ext = path.extname(fileName);
    dest = path.join(baseDir, `${path.basename(fileName, ext)} (${n++})${ext}`);
  }
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  ok(`received ${path.basename(dest)}  ${c.dim}${dest}${c.reset}`);
  return dest;
}


async function cmdTasks() {
  const { sent, received } = await api("tasks");
  say(`${c.bold}Sent${c.reset}`);
  if (!sent.length) info("  nothing sent yet");
  for (const t of sent) {
    const label =
      t.status === "received"
        ? `${c.green}received${c.reset}`
        : t.status === "pending"
          ? `${c.yellow}waiting for device${c.reset}`
          : `${c.cyan}shared${c.reset}`;
    say(`  ${t.file_name} ${c.dim}${humanSize(t.size_bytes)} -> ${t.to_name ?? "everyone"}${c.reset}  ${label}`);
  }
  say(`${c.bold}Received${c.reset}`);
  if (!received.length) info("  nothing received yet");
  for (const t of received) {
    say(
      `  ${t.file_name} ${c.dim}${humanSize(t.size_bytes)} from ${t.from_name}${c.reset}  ${
        t.status === "received" ? `${c.green}done${c.reset}` : `${c.yellow}queued${c.reset}`
      }`,
    );
  }
}

function help() {
  say(`
${c.bold}Commands${c.reset}
  ${c.cyan}ls${c.reset}                       list folders and files here
  ${c.cyan}cd <folder>${c.reset}              enter a folder      (cd grade 9, cd .., cd /)
  ${c.cyan}mkdir <name>${c.reset}             create a folder for everyone
  ${c.cyan}send <file> to <device> in <folder>${c.reset}
                            send a file to one PC, filed in a folder
  ${c.cyan}send <file>${c.reset}              share a file with the whole room
  ${c.cyan}get <file>${c.reset}               download a file into ./filelink-inbox
  ${c.cyan}devices${c.reset}                  who is online / offline
  ${c.cyan}tasks${c.reset}                    everything you sent and received
  ${c.cyan}pwd${c.reset}   ${c.cyan}help${c.reset}   ${c.cyan}exit${c.reset}

${c.bold}Live device browsing (no cloud copy)${c.reset}
  ${c.cyan}cd @<device>${c.reset}             open another PC's shared folder live
  ${c.cyan}cd @"<device name>"${c.reset}      same, but name can contain spaces
  ${c.cyan}cd @${c.reset}                     go back to the room
  ${c.cyan}search <text>${c.reset}            find files/folders on that PC
  ${c.cyan}get <file>${c.reset}               stream it straight from that PC
  ${c.cyan}share <folder>${c.reset}           change what this PC shares live

${c.bold}Admin shell on a remote PC${c.reset}
  ${c.cyan}admin${c.reset}                    type the passcode to unlock admin mode
  ${c.cyan}tasklist, dir, systeminfo${c.reset} run native commands directly (no exec prefix)
  ${c.cyan}exit${c.reset}                     leave admin mode

${c.bold}Remote shell${c.reset}
  Start with ${c.cyan}--shell${c.reset} to let the dashboard run commands on this PC.
  The dashboard asks for a passcode before each command.
${c.dim}Files can never be deleted from a room.${c.reset}
`);
}



/* ------------------------------------------------------------------- repl  */

async function main() {
  const argv = process.argv.slice(2);
  shellEnabled = argv.includes("--shell");
  agentMode = argv.includes("--agent");
  if (agentMode) shellEnabled = true;
  const [cmd, link, ...rest] = argv.filter((a) => a !== "--shell" && a !== "--agent");
  if (cmd !== "connect") {
    say(
      `${c.bold}FileLink${c.reset}\n\nUsage:\n  node filelink.mjs connect <link> [device name] [--shell] [--agent]\n`,
    );
    process.exit(0);
  }

  const { origin, code } = parseLink(link);
  const deviceName = rest.join(" ").trim() || os.hostname();

  const res = await fetch(`${origin}/api/public/link`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      action: "register",
      code,
      deviceName,
      platform: `${os.platform()} ${agentMode ? "agent" : "cli"}`,
      agent: agentMode,
      osInfo: detectOS(),
    }),
  });
  const data = await res.json().catch(() => ({ error: "Bad response" }));
  if (!res.ok || data.error) {
    err(data.error || "Could not connect");
    process.exit(1);
  }

  state = {
    origin,
    code,
    roomName: data.room.name,
    deviceId: data.device.id,
    deviceToken: data.device.token,
    deviceName: data.device.name,
  };
  saveState(state);

  say("");
  ok(`connected to "${data.room.name}" as ${state.deviceName}`);
  info(`room code ${code} · ${data.devices.filter((d) => d.online).length} device(s) online`);
  if (agentMode) info("background agent mode — admin shell enabled, no passcode required");
  else if (shellEnabled) info("remote shell enabled — the dashboard can run commands on this PC");
  help();


  let cwd = "/";
  let remote = null; // { name, path } when browsing another PC live
  const seen = new Set();

  await api("share", { sharedRoot }).catch(() => {});
  info(`sharing this folder live: ${sharedRoot}`);

  startClipboardMonitor();

  const rpcLoop = setInterval(() => {

    serveRequests().catch(() => {});
  }, 2000);

  const poll = setInterval(async () => {
    try {
      const { inbox } = await api("heartbeat");
      for (const item of inbox) {
        if (seen.has(item.id)) continue;
        seen.add(item.id);
        say("");
        info(`incoming: ${item.file_name} from ${item.from_name} → ${item.folder_path || "inbox"}`);
        await downloadTransfer(item.id, item.file_name, item.folder_path);
        await api("ack", { transferId: item.id });
        rl.prompt();
      }
    } catch {
      /* keep trying */
    }
  }, 6000);


  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const prompt = () => {
    let prefix;
    if (remote && adminMode) {
      prefix = `${c.red}@${remote.name}(admin)${c.reset}:${c.cyan}${remote.path}${c.reset}> `;
    } else if (remote) {
      prefix = `${c.yellow}@${remote.name}${c.reset}:${c.cyan}${remote.path}${c.reset}> `;
    } else {
      prefix = `${c.green}${state.code}${c.reset}:${c.cyan}${cwd}${c.reset}> `;
    }
    rl.setPrompt(prefix);
    rl.prompt();
  };

  prompt();

  // Commands run one at a time, even when input is piped in.
  let queue = Promise.resolve();
  rl.on("line", (input) => {
    queue = queue.then(() => handleLine(input));
  });

  async function handleLine(line) {
    const [name, ...args] = line.trim().split(/\s+/);
    const lower = (name || "").toLowerCase();
    try {
      // Live browsing of another PC — nothing goes through the cloud store.
      const arg = args.join(" ").trim();
      if (lower === "cd" && arg.startsWith("@")) {
        const parsed = parseCdAt(arg);
        if (!parsed) {
          err("Usage: cd @<device> or cd @\"<device name>\"");
          prompt();
          return;
        }
        const target = parsed.target;
        adminMode = false;
        if (!target) {
          remote = null;
          info("back in the room");
        } else {
          const r = await remoteCall(target, "info");
          remote = { name: target, path: "/" };
          ok(`browsing ${target} live — ${r.root}`);
        }
        prompt();
        return;
      }

      if (lower === "share" && !remote) {
        const dir = path.resolve(process.cwd(), arg || ".");
        if (!fs.existsSync(dir)) throw new Error(`No such folder: ${dir}`);
        sharedRoot = dir;
        await api("share", { sharedRoot });
        ok(`now sharing ${dir} live`);
        prompt();
        return;
      }
      if (remote) {
        // Admin shell pass-through: unknown commands become native commands.
        if (adminMode && lower !== "" && lower !== "exit" && lower !== "quit" && lower !== "help" && lower !== "pwd" && lower !== "admin") {
          if (isCloudDeletionCommand(line)) {
            err("Blocked: deletion commands targeting room cloud storage are not allowed.");
          } else {
            await runLocalCommand(line);
          }
          prompt();
          return;
        }
        switch (lower) {
          case "":
            break;
          case "ls":
          case "dir":
            await cmdRemoteLs(remote);
            break;
          case "cd":
            remote.path = resolvePath(remote.path, arg);
            await remoteCall(remote.name, "list", { path: remote.path });
            break;
          case "pwd":
            say(`@${remote.name}:${remote.path}`);
            break;
          case "search":
            await cmdRemoteSearch(remote, arg);
            break;
          case "get":
            await cmdRemoteGet(remote, arg);
            break;
          case "devices":
            await cmdDevices();
            break;
          case "admin": {
            process.stdout.write("Type the admin password: ");
            const pass = await askPassword();
            if (pass === ADMIN_PASSCODE) {
              adminMode = true;
              ok(`[Success] Admin mode activated on ${remote.name}.`);
              info("You can now run native commands directly. Type exit to leave admin mode.");
            } else {
              err("Wrong passcode.");
            }
            break;
          }
          case "help":
            help();
            break;
          case "exit":
          case "quit":
            if (adminMode) {
              adminMode = false;
              info("left admin mode");
            } else {
              remote = null;
              info("back in the room");
            }
            break;
          default:
            err(`${lower} is not available while browsing ${remote.name} — use ls, cd, search, get, admin, cd @`);
        }
        prompt();
        return;
      }

      switch (lower) {
        case "":
          break;
        case "ls":
        case "dir":
          await cmdLs(cwd);
          break;
        case "cd": {
          const target = resolvePath(cwd, args.join(" "));
          const r = await api("cd", { path: target });
          cwd = r.path;
          break;
        }
        case "pwd":
          say(cwd);
          break;
        case "mkdir":
          await api("mkdir", { path: cwd, name: args.join(" ") });
          ok(`created ${args.join(" ")}/`);
          break;
        case "send":
          await cmdSend(cwd, args);
          break;
        case "get":
          await cmdGet(cwd, args);
          break;
        case "devices":
          await cmdDevices();
          break;
        case "tasks":
          await cmdTasks();
          break;
        case "help":
          help();
          break;
        case "exit":
        case "quit":
          clearInterval(poll);
          clearInterval(rpcLoop);
          rl.close();
          return;
        default:
          err(`Unknown command: ${name} — type help`);
      }
    } catch (e) {
      err(e.message);
    }
    prompt();
  }


  rl.on("close", () => {
    // Let any queued commands (e.g. piped input) finish before quitting.
    queue.then(() => {
      clearInterval(poll);
      clearInterval(rpcLoop);
      say("bye");
      process.exit(0);
    });
  });
}

main().catch((e) => {
  err(e.message);
  process.exit(1);
});
