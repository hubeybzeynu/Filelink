// Shared process classification — used by the Tasks tab AND the AI chat's
// task table, so both always group a PC's processes the same way.
//
// Mirrors how Windows Task Manager sorts things:
//   Apps        → has a visible window (and isn't a browser)
//   Browsers    → browser app → browser profile → individual processes
//   Windows     → Windows system processes
//   Background  → everything else without a window
//
// Pure functions only (no React, no I/O) so it's trivially testable.

export type RawProcess = {
  pid: string;
  name: string;
  ram: number;
  cpu: number;
  disk?: number;
  network?: number;
  gpu?: number;
  status?: string;
  icon?: string;
  /** Title of the process's main window — only set when it HAS a window. */
  windowTitle?: string;
  /** Parent process id (lets us tie browser helpers to their main process). */
  ppid?: string;
  /** Browser profile folder name, e.g. "Default" or "Profile 1". */
  profile?: string;
  /** Browser helper role, e.g. "renderer", "gpu-process", "utility". */
  role?: string;
};

export type ProcessCategory = "apps" | "browsers" | "windows" | "background";

export type ProcessGroup = {
  key: string;
  /** Raw executable name (lowercased, with .exe). */
  exe: string;
  /** Friendly display name. */
  label: string;
  icon?: string;
  windowTitle?: string;
  ram: number;
  cpu: number;
  disk: number;
  network: number;
  gpu: number;
  count: number;
  processes: RawProcess[];
};

export type BrowserProfileGroup = {
  key: string;
  name: string;
  windowTitle?: string;
  ram: number;
  cpu: number;
  count: number;
  processes: RawProcess[];
};

export type BrowserAppGroup = {
  key: string;
  exe: string;
  label: string;
  icon?: string;
  ram: number;
  cpu: number;
  count: number;
  profiles: BrowserProfileGroup[];
};

export type ClassifiedProcesses = {
  apps: ProcessGroup[];
  browsers: BrowserAppGroup[];
  windows: ProcessGroup[];
  background: ProcessGroup[];
  total: number;
};

/** Browser executables → friendly names. */
const BROWSERS: Record<string, string> = {
  "chrome.exe": "Google Chrome",
  "msedge.exe": "Microsoft Edge",
  "firefox.exe": "Mozilla Firefox",
  "brave.exe": "Brave",
  "opera.exe": "Opera",
  "opera_gx.exe": "Opera GX",
  "vivaldi.exe": "Vivaldi",
  "chromium.exe": "Chromium",
  "arc.exe": "Arc",
  "iexplore.exe": "Internet Explorer",
  "tor.exe": "Tor Browser",
};

/** Windows system processes (the "Windows processes" group). */
const WINDOWS_PROCESSES = new Set([
  "system",
  "system idle process",
  "registry",
  "memory compression",
  "secure system",
  "smss.exe",
  "csrss.exe",
  "wininit.exe",
  "winlogon.exe",
  "services.exe",
  "lsass.exe",
  "lsaiso.exe",
  "svchost.exe",
  "fontdrvhost.exe",
  "dwm.exe",
  "sihost.exe",
  "taskhostw.exe",
  "ctfmon.exe",
  "conhost.exe",
  "dllhost.exe",
  "wudfhost.exe",
  "spoolsv.exe",
  "searchindexer.exe",
  "searchhost.exe",
  "runtimebroker.exe",
  "audiodg.exe",
  "smartscreen.exe",
  "securityhealthservice.exe",
  "securityhealthsystray.exe",
  "msmpeng.exe",
  "nissrv.exe",
  "startmenuexperiencehost.exe",
  "shellexperiencehost.exe",
  "textinputhost.exe",
  "applicationframehost.exe",
  "backgroundtaskhost.exe",
  "wmiprvse.exe",
  "dashost.exe",
  "unsecapp.exe",
  "lockapp.exe",
  "useroobebroker.exe",
  "gamebar.exe",
]);

/** Friendly names for common apps. Anything not listed is auto-prettified. */
const FRIENDLY: Record<string, string> = {
  "explorer.exe": "Windows Explorer",
  "code.exe": "Visual Studio Code",
  "devenv.exe": "Visual Studio",
  "winword.exe": "Microsoft Word",
  "excel.exe": "Microsoft Excel",
  "powerpnt.exe": "Microsoft PowerPoint",
  "outlook.exe": "Microsoft Outlook",
  "onenote.exe": "Microsoft OneNote",
  "teams.exe": "Microsoft Teams",
  "ms-teams.exe": "Microsoft Teams",
  "notepad.exe": "Notepad",
  "calculatorapp.exe": "Calculator",
  "windowsterminal.exe": "Windows Terminal",
  "cmd.exe": "Command Prompt",
  "powershell.exe": "Windows PowerShell",
  "pwsh.exe": "PowerShell",
  "taskmgr.exe": "Task Manager",
  "mspaint.exe": "Paint",
  "telegram.exe": "Telegram",
  "whatsapp.exe": "WhatsApp",
  "discord.exe": "Discord",
  "spotify.exe": "Spotify",
  "node.exe": "Node.js",
  "vlc.exe": "VLC media player",
  "xampp-control.exe": "XAMPP Control Panel",
};

export function isBrowserExe(exe: string): boolean {
  return exe.toLowerCase() in BROWSERS;
}

export function isWindowsProcess(exe: string): boolean {
  return WINDOWS_PROCESSES.has(exe.toLowerCase());
}

/** "notepad++.exe" → "Notepad++", "my_app.exe" → "My App". */
export function friendlyName(exe: string): string {
  const lower = exe.toLowerCase();
  if (FRIENDLY[lower]) return FRIENDLY[lower];
  if (BROWSERS[lower]) return BROWSERS[lower];
  const base = exe.replace(/\.exe$/i, "");
  const spaced = base.replace(/[_-]+/g, " ").trim();
  if (!spaced) return exe;
  // Keep existing capitalisation when the name already has any capitals.
  if (/[A-Z]/.test(spaced)) return spaced;
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function num(v: number | undefined): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function sumGroup(exe: string, label: string, procs: RawProcess[]): ProcessGroup {
  let ram = 0;
  let cpu = 0;
  let disk = 0;
  let network = 0;
  let gpu = 0;
  let icon: string | undefined;
  let windowTitle: string | undefined;
  for (const p of procs) {
    ram += num(p.ram);
    cpu += num(p.cpu);
    disk += num(p.disk);
    network += num(p.network);
    gpu += num(p.gpu);
    icon = icon ?? p.icon;
    windowTitle = windowTitle ?? p.windowTitle;
  }
  return {
    key: exe,
    exe,
    label,
    icon,
    windowTitle,
    ram,
    cpu,
    disk,
    network,
    gpu,
    count: procs.length,
    processes: [...procs].sort((a, b) => num(b.ram) - num(a.ram)),
  };
}

/** Old agents don't report window titles — fall back to a usage heuristic
 * so the Apps group still isn't empty. */
function looksLikeApp(p: RawProcess, anyHasWindowInfo: boolean): boolean {
  if (anyHasWindowInfo) return Boolean(p.windowTitle && p.windowTitle.trim());
  return num(p.cpu) >= 0.5 || num(p.ram) >= 10 * 1024 * 1024;
}

export function classifyProcesses(raw: RawProcess[]): ClassifiedProcesses {
  const anyHasWindowInfo = raw.some((p) => p.windowTitle !== undefined);

  const byExe = new Map<string, RawProcess[]>();
  for (const p of raw) {
    const exe = String(p.name || "").toLowerCase();
    if (!exe) continue;
    const list = byExe.get(exe);
    if (list) list.push(p);
    else byExe.set(exe, [p]);
  }

  const apps: ProcessGroup[] = [];
  const windows: ProcessGroup[] = [];
  const background: ProcessGroup[] = [];
  const browsers: BrowserAppGroup[] = [];

  for (const [exe, procs] of byExe) {
    const label = friendlyName(procs[0].name);

    if (isBrowserExe(exe)) {
      // Browser app → profile → processes
      const byProfile = new Map<string, RawProcess[]>();
      const byPid = new Map(procs.map((p) => [p.pid, p]));
      const profileOf = (p: RawProcess, depth = 0): string => {
        if (p.profile) return p.profile;
        if (p.ppid && depth < 4) {
          const parent = byPid.get(p.ppid);
          if (parent) return profileOf(parent, depth + 1);
        }
        return "Default";
      };
      for (const p of procs) {
        const profile = profileOf(p);
        const list = byProfile.get(profile);
        if (list) list.push(p);
        else byProfile.set(profile, [p]);
      }
      const profiles: BrowserProfileGroup[] = Array.from(byProfile, ([name, list]) => {
        const sorted = [...list].sort((a, b) => num(b.ram) - num(a.ram));
        return {
          key: `${exe}:${name}`,
          name,
          windowTitle: sorted.find((p) => p.windowTitle)?.windowTitle,
          ram: sorted.reduce((s, p) => s + num(p.ram), 0),
          cpu: sorted.reduce((s, p) => s + num(p.cpu), 0),
          count: sorted.length,
          processes: sorted,
        };
      }).sort((a, b) => b.ram - a.ram);
      browsers.push({
        key: exe,
        exe,
        label,
        icon: procs.find((p) => p.icon)?.icon,
        ram: profiles.reduce((s, p) => s + p.ram, 0),
        cpu: profiles.reduce((s, p) => s + p.cpu, 0),
        count: procs.length,
        profiles,
      });
      continue;
    }

    const group = sumGroup(exe, label, procs);
    if (isWindowsProcess(exe)) windows.push(group);
    else if (procs.some((p) => looksLikeApp(p, anyHasWindowInfo))) apps.push(group);
    else background.push(group);
  }

  const byRam = (a: { ram: number }, b: { ram: number }) => b.ram - a.ram;
  apps.sort(byRam);
  windows.sort(byRam);
  background.sort(byRam);
  browsers.sort(byRam);

  return { apps, browsers, windows, background, total: raw.length };
}

export const CATEGORY_LABELS: Record<ProcessCategory, string> = {
  apps: "Apps",
  browsers: "Browsers",
  windows: "Windows processes",
  background: "Background processes",
};

/** 1_234_567 → "1.2 MB" */
export function formatBytes(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "0 MB";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let v = n;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v >= 100 || i === 0 ? Math.round(v) : v.toFixed(1)} ${units[i]}`;
}
