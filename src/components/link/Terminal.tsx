import { useEffect, useRef, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import {
  api,
  downloadTransfer,
  humanSize,
  remoteCall,
  remoteDownload,
  remoteExecStart,
  remoteExecStatus,
  resolvePath,
  uploadFile,
  type DeviceInfo,
  type FileRow,
  type RemoteMode,
  type Session,
} from "@/lib/linkClient";


import { PasswordDialog } from "@/components/link/PasswordDialog";

type Line = { kind: "in" | "out" | "ok" | "err" | "dim" | "warn"; text: string };
type ShellKind = "cmd" | "powershell" | "node" | "python";

const SHELLS: { key: ShellKind; label: string; probe: string }[] = [
  { key: "cmd", label: "CMD", probe: "" }, // always available — it's what's running the checks
  { key: "powershell", label: "PowerShell", probe: "powershell" },
  { key: "node", label: "Node", probe: "node" },
  { key: "python", label: "Python", probe: "python" },
];

/** Wraps one admin command line for the chosen shell. */
function wrapForShell(shellKind: ShellKind, cwd: string | null, line: string): string {
  switch (shellKind) {
    case "powershell": {
      const prefix = cwd ? `Set-Location -LiteralPath '${cwd.replace(/'/g, "''")}'; ` : "";
      return `powershell -NoProfile -Command "${(prefix + line).replace(/"/g, '\\"')}"`;
    }
    case "node":
      return `node -e "${line.replace(/"/g, '\\"')}"`;
    case "python":
      return `python -c "${line.replace(/"/g, '\\"')}"`;
    case "cmd":
    default:
      return cwd ? `cd /d "${cwd}" && ${line}` : line;
  }
}

const HELP = `Commands
  ls                        list folders and files here
  cd <folder>               enter a folder   (cd grade 9, cd .., cd /)
  mkdir <name>              create a folder for every device
  send --to <device>        pick a file and send it to one PC
  send                      pick a file and share it with the room
  get <file>                download a file
  devices                   who is online / offline
  tasks                     everything sent and received
  pwd    clear    help

Live device browsing (nothing is stored in the cloud)
  cd @<device>              open that PC's shared folder live
  cd @"<device>"            same, but device name can contain spaces
  cd @                      go back to the room
  search <text>             find files/folders on that PC
  get <file>                stream it straight from that PC

Admin shell on a remote PC
  admin                     type the passcode to unlock admin mode
  cd @<device>              agent devices auto-enable admin mode
  tasklist, dir, systeminfo run native commands directly (no exec prefix)
  exit                      leave admin mode
  cd @                      go back to the room

Remote shell (legacy)
  exec <device> <command>   run a command on another PC, e.g. exec Office PC dir
Files can never be deleted from a room.`;

const ADMIN_PASSCODE = "hube1848@";

function parseCdAt(arg: string): { target: string; quoted: boolean } | null {
  const rest = arg.slice(1).trim();
  if (!rest) return { target: "", quoted: false };
  if (rest.startsWith('"')) {
    const end = rest.indexOf('"', 1);
    if (end === -1) return { target: rest.slice(1), quoted: true };
    return { target: rest.slice(1, end), quoted: true };
  }
  return { target: rest, quoted: false };
}

function isCloudDeletionCommand(line: string): boolean {
  const lower = line.toLowerCase();
  // Block del / rm / rmdir / rd when they mention room/cloud paths or look like mass deletes.
  if (!/\b(del|rm|rmdir|rd|erase)\b/.test(lower)) return false;
  // Explicit room code pattern or cloud-looking paths.
  if (/\b[A-Z0-9]{6}\b:/.test(line)) return true;
  if (/\b(shares|filelink-inbox|cloud|room)\b/i.test(line)) return true;
  // Any del / rm / rd with a path that starts with a remote room code or looks absolute on the relay.
  if (/\b(del|erase)\b.+\s\/[sSqQfF]/.test(lower)) return true;
  return false;
}

export function Terminal({
  session,
  cwd,
  setCwd,
  onChanged,
}: {
  session: Session;
  cwd: string;
  setCwd: (p: string) => void;
  onChanged: () => void;
}) {
  const [lines, setLines] = useState<Line[]>([
    { kind: "ok", text: `connected to "${session.roomName}" as ${session.deviceName}` },
    { kind: "dim", text: `room code ${session.roomCode} — type help` },
  ]);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pendingTarget = useRef<string | null>(null);
  const pendingExec = useRef<{ device: string; command: string } | null>(null);
  const [remote, setRemote] = useState<RemoteMode | null>(null);
  const [adminDevice, setAdminDevice] = useState<string | null>(null);
  const [adminCwd, setAdminCwd] = useState<string | null>(null);
  const [passwordMode, setPasswordMode] = useState(false);
  const [lockReason, setLockReason] = useState<string | null>(null);
  const [shell, setShell] = useState<ShellKind>("cmd");
  const [shellMenuOpen, setShellMenuOpen] = useState(false);
  const [shellAvailability, setShellAvailability] = useState<Record<string, boolean | null>>({});

  const push = (kind: Line["kind"], text: string) =>
    setLines((prev) => [...prev, { kind, text }]);

  function guarded(reason: string) {
    setLockReason(reason);
  }


  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [lines]);

  async function pickAndSend(to: string | null) {
    pendingTarget.current = to;
    fileRef.current?.click();
  }

  async function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const to = pendingTarget.current;
    setBusy(true);
    push("dim", `uploading ${file.name} (${humanSize(file.size)}) ...`);
    try {
      const res = await uploadFile(session, file, cwd, to);
      if (!to) push("ok", `shared in ${cwd} — anyone in the room can get it`);
      else if (res.direct) push("ok", `delivered to ${to} (online now)`);
      else push("ok", `${to} is offline — saved in the cloud, it will arrive when they connect`);
      onChanged();
    } catch (error) {
      push("err", (error as Error).message);
    }
    setBusy(false);
  }

  async function runExec(raw: string) {
    const targets = (await api<{ devices: DeviceInfo[] }>("devices", {}, session)).devices;
    const rest = raw.slice(4).trim();
    let device = "";
    let command = "";
    const names = targets.map((d) => d.name).sort((a, b) => b.length - a.length);
    for (const name of names) {
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (new RegExp(`^${escaped}(?:\\s|$)`).test(rest)) {
        device = name;
        command = rest.slice(name.length).trim();
        break;
      }
    }
    if (!device || !command) {
      throw new Error("Usage: exec <device> <command>   e.g. exec Office PC dir");
    }
    if (!targets.find((d) => d.name === device)?.online) {
      throw new Error(`${device} is offline`);
    }

    push("warn", `SECURITY: running a command on ${device}. The PC owner must have started the CLI with --shell.`);
    const { callId } = await remoteExecStart(session, device, command);
    push("dim", `started on ${device}: ${command}`);

    let seen = 0;
    let status = "pending";
    while (status === "pending" || status === "running") {
      await new Promise((r) => setTimeout(r, 400));
      const st = await remoteExecStatus(session, callId);
      status = st.status;
      for (let i = seen; i < st.chunks.length; i++) push("out", st.chunks[i]);
      seen = st.chunks.length;
    }

    const final = await remoteExecStatus(session, callId);
    for (let i = seen; i < final.chunks.length; i++) push("out", final.chunks[i]);
    if (final.error) throw new Error(final.error);
    const result = final.result as { code?: number } | null;
    push("dim", `finished with exit code ${result?.code ?? "?"}`);
  }

  /** Resolves a Windows-style path change against a known current directory. */
  function resolveWinPath(base: string | null, arg: string): string {
    const trimmed = arg.trim();
    if (!trimmed || trimmed === ".") return base ?? "";
    if (/^[a-zA-Z]:[\\/]/.test(trimmed) || trimmed.startsWith("\\\\")) {
      return trimmed.replace(/\//g, "\\").replace(/\\+$/, "") || trimmed;
    }
    if (trimmed === "..") {
      if (!base) return base ?? "";
      const parts = base.split("\\").filter(Boolean);
      if (parts.length <= 1) return base; // already at a drive root
      parts.pop();
      return parts.join("\\");
    }
    const clean = trimmed.replace(/^\\+/, "").replace(/\//g, "\\");
    return base ? `${base.replace(/\\+$/, "")}\\${clean}` : clean;
  }

  /** Checks which shells/runtimes actually exist on this PC, so the picker
   * only offers ones that will really work instead of just listing options
   * blindly. */
  async function checkShellAvailability(deviceName: string) {
    setShellAvailability({ cmd: true, powershell: null, node: null, python: null });
    await Promise.all(
      SHELLS.filter((s) => s.probe).map(async (s) => {
        try {
          const { callId } = await remoteExecStart(session, deviceName, `where ${s.probe}`);
          let status = "pending";
          let chunks: string[] = [];
          const deadline = Date.now() + 5000;
          while ((status === "pending" || status === "running") && Date.now() < deadline) {
            await new Promise((r) => setTimeout(r, 300));
            const st = await remoteExecStatus(session, callId);
            status = st.status;
            chunks = st.chunks;
          }
          const found = chunks.join("").trim().length > 0;
          setShellAvailability((prev) => ({ ...prev, [s.key]: found }));
        } catch {
          setShellAvailability((prev) => ({ ...prev, [s.key]: false }));
        }
      }),
    );
  }

  /** Learns the real starting directory on the target PC when admin mode turns on. */
  async function bootstrapAdminCwd(deviceName: string) {    try {
      const { callId } = await remoteExecStart(session, deviceName, "cd");
      let status = "pending";
      let chunks: string[] = [];
      const deadline = Date.now() + 5000;
      while ((status === "pending" || status === "running") && Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 300));
        const st = await remoteExecStatus(session, callId);
        status = st.status;
        chunks = st.chunks;
      }
      const dir = chunks.join("").trim();
      if (dir) setAdminCwd(dir);
    } catch {
      /* not fatal — commands will just run from the agent's default cwd */
    }
  }

  /** Checks a folder actually exists on the target PC before navigating
   * into it, instead of trusting the typed path blindly. */
  async function remoteDirExists(deviceName: string, dirPath: string): Promise<boolean> {
    const { callId } = await remoteExecStart(
      session,
      deviceName,
      `if exist "${dirPath}\\" (echo __FL_DIR_OK__) else (echo __FL_DIR_MISSING__)`,
    );
    let status = "pending";
    let chunks: string[] = [];
    const deadline = Date.now() + 6000;
    while ((status === "pending" || status === "running") && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 300));
      const st = await remoteExecStatus(session, callId);
      status = st.status;
      chunks = st.chunks;
    }
    return chunks.join("").includes("__FL_DIR_OK__");
  }

  async function runAdminPassThrough(line: string) {
    if (!adminDevice || !remote) return;
    const targets = (await api<{ devices: DeviceInfo[] }>("devices", {}, session)).devices;
    if (!targets.find((d) => d.name === adminDevice)?.online) {
      throw new Error(`${adminDevice} is offline`);
    }
    if (isCloudDeletionCommand(line)) {
      throw new Error("Blocked: deletion commands targeting room cloud storage are not allowed.");
    }

    // `cd` alone is just navigation — handle it as a real, persistent
    // working directory instead of firing off a one-shot remote process
    // (which can't "stay" anywhere) and printing a confusing "finished"
    // line for something that isn't really a command execution.
    const [word, ...rest] = line.trim().split(/\s+/);
    if (word?.toLowerCase() === "cd") {
      const arg = rest.join(" ");
      if (!arg) {
        push("out", adminCwd ?? "(unknown — run a command to establish one)");
        return;
      }
      const next = resolveWinPath(adminCwd, arg);
      // Verify the folder actually exists on that PC before committing to
      // it — previously this just accepted any typed path blindly, so you
      // could "cd" into a folder that isn't there and every command after
      // would silently run from the wrong (nonexistent) place.
      const exists = await remoteDirExists(adminDevice, next);
      if (!exists) {
        throw new Error(`The system cannot find the path specified: ${next}`);
      }
      setAdminCwd(next);
      push("out", next);
      return;
    }

    push("warn", `SECURITY: admin command on ${adminDevice}.`);
    const fullLine = wrapForShell(shell, adminCwd, line);
    const { callId } = await remoteExecStart(session, adminDevice, fullLine);
    let seen = 0;
    let status = "pending";
    while (status === "pending" || status === "running") {
      await new Promise((r) => setTimeout(r, 400));
      const st = await remoteExecStatus(session, callId);
      status = st.status;
      for (let i = seen; i < st.chunks.length; i++) push("out", st.chunks[i]);
      seen = st.chunks.length;
    }
    const final = await remoteExecStatus(session, callId);
    for (let i = seen; i < final.chunks.length; i++) push("out", final.chunks[i]);
    if (final.error) throw new Error(final.error);
    // No "finished with exit code" line here on purpose — that's reserved
    // for the standalone `exec <device> <command>` room command. This is a
    // persistent admin session, not a series of one-shot executions.
  }

  function promptText() {
    if (passwordMode) return "password:";
    if (adminDevice && remote) return `@${remote.name}(admin):${adminCwd ?? remote.path}>`;
    if (remote) return `@${remote.name}:${remote.path}>`;
    return `${session.roomCode}:${cwd}>`;
  }

  async function run(raw: string) {
    const line = raw.trim();
    if (passwordMode) {
      if (line === ADMIN_PASSCODE) {
        if (!remote) {
          push("err", "admin mode only works while browsing a device. Use cd @<device> first.");
          setPasswordMode(false);
          setValue("");
          return;
        }
        setAdminDevice(remote.name);
        setPasswordMode(false);
        setValue("");
        push("ok", `[Success] Admin mode activated on ${remote.name}.`);
        push("dim", "You can now run native commands directly. Type exit to leave admin mode.");
        void bootstrapAdminCwd(remote.name);
        void checkShellAvailability(remote.name);
        setShell("cmd");
      } else {
        push("err", "Wrong passcode.");
        setPasswordMode(false);
        setValue("");
      }
      return;
    }

    push("in", `${promptText().replace(/> $/, "")}> ${line}`);
    if (!line) return;
    const [name, ...args] = line.split(/\s+/);
    const cmd = name.toLowerCase();
    const arg = args.join(" ").trim();
    setBusy(true);
    try {
      // Live browsing another PC: answers stream from that machine, the cloud
      // only passes them along — no copy is kept.
      if (cmd === "cd" && arg.startsWith("@")) {
        const parsed = parseCdAt(arg);
        if (!parsed) {
          push("err", "Usage: cd @<device> or cd @\"<device name>\"");
          setBusy(false);
          return;
        }
        const target = parsed.target;
        setAdminDevice(null);
        setAdminCwd(null);
        setShell("cmd");
        setShellAvailability({});
        if (!target) {
          setRemote(null);
          push("dim", "back in the room");
        } else {
          const r = await remoteCall<{ root: string }>(session, target, "info");
          const targets = (await api<{ devices: DeviceInfo[] }>("devices", {}, session)).devices;
          const dev = targets.find((d) => d.name.toLowerCase() === target.toLowerCase());
          // The match above is case-insensitive, but later online checks
          // (runAdminPassThrough) do an EXACT match against the real device
          // list. Storing whatever the person typed instead of the real
          // registered name meant that check always failed against a real,
          // online device — always reporting "offline" incorrectly. Always
          // store the canonical name instead.
          const canonicalName = dev?.name ?? target;
          setRemote({ name: canonicalName, path: "/" });
          if (dev?.admin || dev?.agent) {
            setAdminDevice(canonicalName);
            push("ok", `browsing ${canonicalName} live — ${r.root} (admin mode auto-enabled)`);
            void bootstrapAdminCwd(canonicalName);
            void checkShellAvailability(canonicalName);
            setShell("cmd");
          } else {
            push("ok", `browsing ${canonicalName} live — ${r.root}`);
          }
        }
        setBusy(false);
        return;
      }

      // Admin shell pass-through: when admin mode is active, unknown commands
      // are sent straight to the remote PC as native shell commands.
      if (adminDevice && remote && cmd !== "exit" && cmd !== "quit" && cmd !== "help" && cmd !== "clear" && cmd !== "pwd") {
        if (cmd === "admin") {
          push("dim", "Already in admin mode. Type exit to leave.");
          setBusy(false);
          return;
        }
        await runAdminPassThrough(line);
        setBusy(false);
        return;
      }

      if (remote) {
        switch (cmd) {
          case "help":
            push("out", HELP);
            break;
          case "clear":
            setLines([]);
            break;
          case "pwd":
            push("out", `@${remote.name}:${remote.path}`);
            break;
          case "admin":
            setPasswordMode(true);
            push("dim", "Type the admin password:");
            break;
          case "ls":
          case "dir": {
            const r = await remoteCall<{
              folders: { name: string }[];
              files: { name: string; size: number }[];
            }>(session, remote.name, "list", { path: remote.path });
            if (!r.folders.length && !r.files.length) push("dim", "(empty)");
            r.folders.forEach((f) => push("out", `${f.name}/`));
            r.files.forEach((f) => push("out", `${f.name}   ${humanSize(f.size)}`));
            break;
          }
          case "cd": {
            const next = resolvePath(remote.path, arg);
            await remoteCall(session, remote.name, "list", { path: next });
            setRemote({ ...remote, path: next });
            break;
          }
          case "search": {
            if (!arg) throw new Error("Usage: search <text>");
            const r = await remoteCall<{ matches: { path: string; dir: boolean }[] }>(
              session,
              remote.name,
              "search",
              { path: remote.path, query: arg },
            );
            if (!r.matches.length) push("dim", "no matches");
            r.matches.forEach((m) => push("out", m.dir ? `${m.path}/` : m.path));
            break;
          }
          case "get": {
            if (!arg) throw new Error("Usage: get <file name>");
            const rel = arg.startsWith("/")
              ? arg
              : `${remote.path === "/" ? "" : remote.path}/${arg}`;
            push("dim", `pulling ${rel} straight from ${remote.name}…`);
            const fileName = await remoteDownload(session, remote.name, rel);
            push("ok", `${fileName} downloaded direct from ${remote.name}`);
            break;
          }
          case "devices": {
            const r = await api<{ devices: { name: string; online: boolean }[] }>(
              "devices",
              {},
              session,
            );
            r.devices.forEach((d) => push("out", `${d.online ? "● online " : "○ offline"}  ${d.name}`));
            break;
          }
          case "exit":
          case "quit":
            if (adminDevice) {
              setAdminDevice(null);
              setAdminCwd(null);
              setShell("cmd");
              setShellAvailability({});
              push("dim", "left admin mode");
            } else {
              setRemote(null);
              push("dim", "back in the room");
            }
            break;
          default:
            push("err", `${cmd} is not available while browsing ${remote.name} — use ls, cd, search, get, admin, cd @`);
        }
        setBusy(false);
        return;
      }
      switch (cmd) {
        case "help":
          push("out", HELP);
          break;
        case "clear":
          setLines([]);
          break;
        case "pwd":
          push("out", cwd);
          break;
        case "ls":
        case "dir": {
          const r = await api<{ folders: { name: string }[]; files: FileRow[] }>(
            "ls",
            { path: cwd },
            session,
          );
          if (!r.folders.length && !r.files.length) push("dim", "(empty)");
          r.folders.forEach((f) => push("out", `${f.name}/`));
          r.files.forEach((f) =>
            push(
              "out",
              `${f.file_name}   ${humanSize(f.size_bytes)}  from ${f.from_name}${
                f.to_name ? ` → ${f.to_name}` : " (everyone)"
              }  [${f.status}]`,
            ),
          );
          break;
        }
        case "cd": {
          const target = resolvePath(cwd, args.join(" "));
          const r = await api<{ path: string }>("cd", { path: target }, session);
          setCwd(r.path);
          break;
        }
        case "mkdir": {
          await api("mkdir", { path: cwd, name: args.join(" ") }, session);
          push("ok", `created ${args.join(" ")}/`);
          onChanged();
          break;
        }
        case "send": {
          const i = args.findIndex((a) => a === "--to" || a === "to");
          const to = i >= 0 ? args.slice(i + 1).join(" ") : null;
          await pickAndSend(to);
          push("dim", "choose a file in the picker…");
          break;
        }
        case "get": {
          const wanted = args.join(" ").toLowerCase();
          const r = await api<{ files: FileRow[] }>("ls", { path: cwd }, session);
          const match = r.files.find((f) => f.file_name.toLowerCase() === wanted);
          if (!match) throw new Error(`No file named "${args.join(" ")}" in ${cwd}`);
          await downloadTransfer(session, match.id);
          push("ok", `downloading ${match.file_name}`);
          break;
        }
        case "devices": {
          const r = await api<{ devices: { name: string; online: boolean; platform: string | null }[] }>(
            "devices",
            {},
            session,
          );
          r.devices.forEach((d) =>
            push("out", `${d.online ? "● online " : "○ offline"}  ${d.name}${d.platform ? `  ${d.platform}` : ""}`),
          );
          break;
        }
        case "tasks": {
          const r = await api<{ sent: FileRow[]; received: FileRow[] }>("tasks", {}, session);
          push("out", "Sent");
          if (!r.sent.length) push("dim", "  nothing sent yet");
          r.sent.forEach((t) =>
            push("out", `  ${t.file_name} → ${t.to_name ?? "everyone"}  [${t.status}]`),
          );
          push("out", "Received");
          if (!r.received.length) push("dim", "  nothing received yet");
          r.received.forEach((t) => push("out", `  ${t.file_name} from ${t.from_name}  [${t.status}]`));
          break;
        }
        case "exec": {
          if (!args.length) {
            push("err", "Usage: exec <device> <command>   e.g. exec Office PC dir");
            break;
          }
          const raw = line;
          pendingExec.current = { device: "", command: raw };
          guarded("Enter the passcode to run a command on another PC.");
          break;
        }

        default:
          push("err", `Unknown command: ${cmd} — type help`);
      }
    } catch (error) {
      push("err", (error as Error).message);
    }
    setBusy(false);
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-terminal">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-destructive/70" />
        <span className="size-2.5 rounded-full bg-warning/70" />
        <span className="size-2.5 rounded-full bg-primary/70" />
        <span className="ml-2 font-mono text-xs text-muted-foreground">filelink — {session.roomCode}</span>
        {adminDevice && (
          <div className="relative ml-auto">
            <button
              onClick={() => setShellMenuOpen((v) => !v)}
              className="ios-btn flex items-center gap-1.5 rounded-lg border border-border bg-cardhover px-2.5 py-1 font-mono text-[11px] font-semibold text-foreground hover:border-primary"
            >
              {SHELLS.find((s) => s.key === shell)?.label}
              <ChevronDown className="size-3" />
            </button>
            {shellMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShellMenuOpen(false)} />
                <div className="absolute right-0 top-full z-50 mt-1 w-40 rounded-xl border border-border bg-card p-1 shadow-2xl">
                  {SHELLS.map((s) => {
                    const avail = shellAvailability[s.key];
                    const disabled = avail === false;
                    return (
                      <button
                        key={s.key}
                        disabled={disabled}
                        onClick={() => {
                          setShell(s.key);
                          setShellMenuOpen(false);
                          push("dim", `switched to ${s.label}`);
                        }}
                        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left font-mono text-[11px] ${
                          shell === s.key
                            ? "bg-primary text-primary-foreground"
                            : disabled
                              ? "cursor-not-allowed text-muted-foreground/40"
                              : "text-foreground hover:bg-cardhover"
                        }`}
                      >
                        {s.label}
                        {avail === null && <Loader2 className="size-3 animate-spin" />}
                        {avail === false && <span className="text-[9px]">not found</span>}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 font-mono text-[13px] leading-relaxed">
        {lines.map((l, i) => (
          <pre
            key={i}
            className={
              "whitespace-pre-wrap break-words " +
              (l.kind === "in"
                ? "text-muted-foreground"
                : l.kind === "ok"
                  ? "text-primary"
                  : l.kind === "err"
                    ? "text-destructive"
                    : l.kind === "warn"
                      ? "text-warning"
                      : l.kind === "dim"
                        ? "text-muted-foreground/70"
                        : "text-foreground")
            }
          >
            {l.text}
          </pre>
        ))}
        <div ref={endRef} />
      </div>

      <form
        className="flex items-center gap-2 border-t border-border px-4 py-3 font-mono text-[13px]"
        onSubmit={(e) => {
          e.preventDefault();
          const v = value;
          setValue("");
          void run(v);
        }}
      >
        <span className={remote ? (adminDevice ? "text-destructive" : "text-warning") : "text-primary"}>
          {promptText()}
        </span>
        <input
          autoFocus
          value={value}
          disabled={busy}
          onChange={(e) => setValue(e.target.value)}
          spellCheck={false}
          type={passwordMode ? "password" : "text"}
          className="flex-1 bg-transparent text-foreground caret-primary outline-none placeholder:text-muted-foreground/50"
          placeholder={busy ? "working…" : passwordMode ? "type passcode" : "type a command, e.g. ls"}
        />
      </form>

      <input ref={fileRef} type="file" className="hidden" onChange={onFilePicked} />

      <PasswordDialog
        open={lockReason !== null}
        reason={lockReason ?? ""}
        onOpenChange={(v) => {
          if (!v) setLockReason(null);
        }}
        onUnlocked={() => {
          if (pendingExec.current) {
            const cmdLine = pendingExec.current.command;
            pendingExec.current = null;
            void runExec(cmdLine);
          }
        }}
      />
    </div>
  );
}
