export type Session = {
  roomCode: string;
  roomName: string;
  deviceId: string;
  deviceToken: string;
  deviceName: string;
};

export type DeviceInfo = {
  id: string;
  name: string;
  platform: string | null;
  online: boolean;
  lastSeen: string;
  agent: boolean;
  admin: boolean;
  mode: string;
  osInfo: string | null;
};

export type FileRow = {
  id: string;
  file_name: string;
  size_bytes: number;
  folder_path?: string;
  from_name?: string;
  to_name?: string | null;
  status: string;
  direct?: boolean;
  created_at: string;
};

const KEY = "filelink.session";

export function loadSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "null");
  } catch {
    return null;
  }
}

export function saveSession(session: Session | null) {
  if (typeof window === "undefined") return;
  if (session) window.localStorage.setItem(KEY, JSON.stringify(session));
  else window.localStorage.removeItem(KEY);
}

export async function api<T = Record<string, any>>(
  action: string,
  payload: Record<string, unknown> = {},
  session?: Session | null,
): Promise<T> {
  const res = await fetch("/api/public/link", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      action,
      ...(session ? { deviceId: session.deviceId, deviceToken: session.deviceToken } : {}),
      ...payload,
    }),
  });
  const data = await res.json().catch(() => ({ error: "Bad response from server" }));
  if (!res.ok || data.error) throw new Error(data.error ?? `Request failed (${res.status})`);
  return data as T;
}

export function humanSize(n: number) {
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let v = Number(n) || 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

export function resolvePath(cwd: string, target: string) {
  if (!target || target === ".") return cwd;
  let p = target.replace(/\\/g, "/");
  if (p === "..") {
    const parts = cwd.split("/").filter(Boolean);
    parts.pop();
    return "/" + parts.join("/");
  }
  if (!p.startsWith("/")) p = (cwd === "/" ? "" : cwd) + "/" + p;
  return "/" + p.split("/").filter(Boolean).join("/");
}

/* ---- live progress jobs (shared by the Send / Receive windows) ---- */

export type Job = {
  id: string;
  name: string;
  kind: "send" | "receive";
  loaded: number;
  total: number;
  startedAt: number;
  bps: number;
  status: "queued" | "active" | "done" | "error";
  note?: string;
  /** Groups jobs from the same multi-file action so the UI can show real
   * "X of Y" counts instead of guessing from how many happen to be active
   * at any one instant (uploads run one at a time, so only one was ever
   * "active" even when 5 files were queued). */
  batchId?: string;
  batchTotal?: number;
};

let jobs: Job[] = [];
const listeners = new Set<() => void>();

function emit() {
  jobs = [...jobs];
  listeners.forEach((l) => l());
}

export function subscribeJobs(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getJobs() {
  return jobs;
}

export function clearFinishedJobs() {
  jobs = jobs.filter((j) => j.status === "active");
  emit();
}

export function startJob(
  name: string,
  kind: "send" | "receive",
  total = 0,
  note?: string,
  batch?: { id: string; total: number },
) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const job: Job = {
    id,
    name,
    kind,
    loaded: 0,
    total,
    startedAt: Date.now(),
    bps: 0,
    status: "active",
    note,
    batchId: batch?.id,
    batchTotal: batch?.total,
  };
  jobs = [job, ...jobs].slice(0, 60);

  emit();
  return {
    progress(loaded: number, total?: number) {
      const j = jobs.find((x) => x.id === id);
      if (!j) return;
      j.loaded = loaded;
      if (total) j.total = total;
      const secs = (Date.now() - j.startedAt) / 1000;
      j.bps = secs > 0 ? loaded / secs : 0;
      emit();
    },
    setNote(text: string) {
      const j = jobs.find((x) => x.id === id);
      if (!j) return;
      j.note = text;
      emit();
    },
    done() {
      const j = jobs.find((x) => x.id === id);
      if (!j) return;
      j.status = "done";
      if (j.total) j.loaded = j.total;
      emit();
    },
    fail(message: string) {
      const j = jobs.find((x) => x.id === id);
      if (!j) return;
      j.status = "error";
      j.note = message;
      emit();
    },
  };
}

export function humanSpeed(bps: number) {
  return `${humanSize(bps)}/s`;
}

export async function uploadFile(
  session: Session,
  file: File,
  folderPath: string,
  to?: string | null,
  batch?: { id: string; total: number },
) {
  const job = startJob(file.name, "send", file.size, "uploading…", batch);
  try {
    const init = await api<{ transferId: string }>(
      "uploadInit",
      { folderPath, fileName: file.name, size: file.size, to: to ?? null },
      session,
    );

    // Sent through our own already-authenticated endpoint in chunks, same
    // reliable pattern remoteUploadFile already uses for device targets —
    // not a direct browser-to-storage PUT via a signed URL, which is a
    // well-documented source of silent failures (CORS, missing headers).
    const CHUNK = 196608; // 192 KB of raw bytes per request
    const buf = new Uint8Array(await file.arrayBuffer());
    let offset = 0;
    let first = true;
    do {
      const slice = buf.subarray(offset, offset + CHUNK);
      let binary = "";
      for (let i = 0; i < slice.length; i++) binary += String.fromCharCode(slice[i]);
      await api("uploadChunk", { transferId: init.transferId, chunk: btoa(binary), first }, session);
      offset += slice.length;
      first = false;
      job.progress(offset, buf.length || 1);
    } while (offset < buf.length);

    // Bytes are all up — now the server is writing them to storage and
    // handing off to the target device (or the room). Distinct phase from
    // the upload itself, worth showing separately rather than leaving the
    // bar sitting at 100% with no explanation while that finishes.
    job.setNote(to ? `sending to ${to}…` : "finishing…");

    const res = await api<{ status: string; direct: boolean }>(
      "uploadDone",
      { transferId: init.transferId, contentType: file.type || undefined },
      session,
    );
    job.done();
    return res;
  } catch (e) {
    job.fail((e as Error).message);
    throw e;
  }
}

/**
 * Upload a file straight into a folder that lives on an online device
 * (the shared root of the agent), streaming it as base64 chunks.
 */
export async function remoteUploadFile(
  session: Session,
  device: string,
  dirPath: string,
  file: File,
  batch?: { id: string; total: number },
) {
  const CHUNK = 196608; // 192 KB of raw bytes per RPC
  const dir = dirPath === "/" ? "" : dirPath.replace(/\/+$/, "");
  const target = `${dir}/${file.name}`;
  const job = startJob(file.name, "send", file.size, `to ${device}`, batch);
  try {
    const buf = new Uint8Array(await file.arrayBuffer());
    let offset = 0;
    let first = true;
    do {
      const slice = buf.subarray(offset, offset + CHUNK);
      let binary = "";
      for (let i = 0; i < slice.length; i++) binary += String.fromCharCode(slice[i]);
      await remoteCall(session, device, "write", {
        path: target,
        chunk: btoa(binary),
        first,
      });
      offset += slice.length;
      first = false;
      job.progress(offset, buf.length);
    } while (offset < buf.length);
    job.done();
    return { path: target };
  } catch (e) {
    job.fail((e as Error).message);
    throw e;
  }
}



export async function downloadTransfer(session: Session, transferId: string) {
  const { url, fileName } = await api<{ url: string; fileName: string }>(
    "download",
    { transferId },
    session,
  );
  const job = startJob(fileName, "receive", 0, "from the room");
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Download failed (${res.status})`);
    const total = Number(res.headers.get("content-length") ?? 0);
    const reader = res.body?.getReader();
    const parts: Uint8Array[] = [];
    let loaded = 0;
    if (reader) {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        parts.push(value);
        loaded += value.length;
        job.progress(loaded, total || loaded);
      }
    } else {
      parts.push(new Uint8Array(await res.arrayBuffer()));
    }
    const blobUrl = URL.createObjectURL(new Blob(parts as BlobPart[]));
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10_000);
    job.done();
    return fileName;
  } catch (e) {
    job.fail((e as Error).message);
    throw e;
  }
}


/* ---- live browsing of another PC (streamed on demand, no cloud copy) ---- */

export type RemoteMode = { name: string; path: string };

export async function remoteCall<T = any>(
  session: Session,
  device: string,
  method: "info" | "list" | "search" | "read" | "write" | "mkdir" | "disk" | "bundle" | "exit" | "tree" | "sysinfo" | "tasklist" | "control" | "screenshot" | "clipboardHistory" | "clipboardWrite" | "clipboardRead",
  params: Record<string, unknown> = {},
): Promise<T> {

  const r = await api<{ result: T }>("rpc", { target: device, method, params }, session);
  return r.result;
}

export async function remoteExecStart(
  session: Session,
  device: string,
  command: string,
): Promise<{ callId: string; device: string }> {
  return api<{ callId: string; device: string }>(
    "rpcExec",
    { target: device, method: "exec", params: { command } },
    session,
  );
}

export async function remoteExecStatus(
  session: Session,
  callId: string,
): Promise<{
  status: string;
  chunks: string[];
  result: Record<string, unknown> | null;
  error: string | null;
}> {
  return api("rpcStatus", { callId }, session);
}


export async function remoteDownload(
  session: Session,
  device: string,
  filePath: string,
  onProgress?: (loaded: number, total: number) => void,
) {
  const CHUNK = 262144;
  const parts: Uint8Array[] = [];
  const name0 = filePath.split("/").filter(Boolean).pop() || "file";
  const job = startJob(name0, "receive", 0, `from ${device}`);
  let offset = 0;
  try {
    for (;;) {
      const r = await remoteCall<{ chunk: string; size: number; eof: boolean }>(
        session,
        device,
        "read",
        { path: filePath, offset, length: CHUNK },
      );
      const bin = atob(r.chunk || "");
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      parts.push(bytes);
      offset += bytes.length;
      job.progress(offset, r.size);
      onProgress?.(offset, r.size);
      if (r.eof || !bytes.length) break;
    }
  } catch (e) {
    job.fail((e as Error).message);
    throw e;
  }
  job.done();

  const name = filePath.split("/").filter(Boolean).pop() || "file";
  const url = URL.createObjectURL(new Blob(parts as BlobPart[]));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return name;
}

/* ---- offline snapshots: browse a device's folders even when it is off ---- */

export type CachedItem = { kind: "folder" | "file"; name: string; size: number };
export type Snapshot = { at: number; items: CachedItem[] };

const SNAP = "filelink.snapshots";

function allSnapshots(): Record<string, Snapshot> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(SNAP) ?? "{}");
  } catch {
    return {};
  }
}

export function readSnapshot(room: string, device: string, path: string): Snapshot | null {
  return allSnapshots()[`${room}|${device}|${path}`] ?? null;
}

export function writeSnapshot(room: string, device: string, path: string, items: CachedItem[]) {
  if (typeof window === "undefined") return;
  const all = allSnapshots();
  all[`${room}|${device}|${path}`] = { at: Date.now(), items };
  try {
    window.localStorage.setItem(SNAP, JSON.stringify(all));
  } catch {
    /* storage full — snapshots are a nicety, not a requirement */
  }
}

export function snapshotPaths(room: string, device: string) {
  const prefix = `${room}|${device}|`;
  return Object.keys(allSnapshots())
    .filter((k) => k.startsWith(prefix))
    .map((k) => k.slice(prefix.length));
}

/* ---- room storage actions ---- */

export type PickItem = { kind: "folder" | "file"; name: string; id?: string; path?: string };

export function removeItems(session: Session, items: PickItem[]) {
  return api<{ removed: number }>("rm", { items }, session);
}

export function renameItem(session: Session, item: PickItem, name: string) {
  return api<{ path?: string; name?: string }>("rename", { item, name }, session);
}


export function copyMoveItems(
  session: Session,
  items: PickItem[],
  dest: string,
  mode: "copy" | "move",
) {
  return api<{ moved: number }>("cpmv", { items, dest, mode }, session);
}

export function roomUsage(session: Session) {
  return api<{ used: number; files: number; quota: number }>("usage", {}, session);
}

export function roomTree(session: Session) {
  return api<{ folders: { path: string; parent_path: string; name: string }[] }>(
    "tree",
    {},
    session,
  );
}

/** Pull a whole file out of a PC into memory (used to relay it onward). */
export async function remoteFetchBytes(
  session: Session,
  device: string,
  filePath: string,
  onProgress?: (loaded: number, total: number) => void,
) {
  const CHUNK = 262144;
  const parts: Uint8Array[] = [];
  let offset = 0;
  for (;;) {
    const r = await remoteCall<{ chunk: string; size: number; eof: boolean }>(
      session,
      device,
      "read",
      { path: filePath, offset, length: CHUNK },
    );
    const bin = atob(r.chunk || "");
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    parts.push(bytes);
    offset += bytes.length;
    onProgress?.(offset, r.size);
    if (r.eof || !bytes.length) break;
  }
  return new Blob(parts as BlobPart[]);
}

export function updateDevice(session: Session, targetId: string, name: string) {
  return api<{ id: string; name: string; devices: DeviceInfo[] }>(
    "updateDevice",
    { targetId, name },
    session,
  );
}

export function deleteDevice(session: Session, targetId: string) {
  return api<{ ok: boolean; devices: DeviceInfo[] }>("deleteDevice", { targetId }, session);
}

export function sendControl(session: Session, target: string, command: string, extra?: Record<string, unknown>) {
  return api<{ ok: boolean; result?: unknown }>("control", { target, command, ...(extra ?? {}) }, session);
}

/* ---- power schedules (cloud-persisted, survive refresh/close) ---- */

export type PowerSchedule = {
  id: string;
  device_id: string;
  device_name: string;
  action: "shutdown" | "restart";
  fire_at: string;
  status: string;
  created_at: string;
};

export function schedulePower(
  session: Session,
  target: string,
  powerAction: "shutdown" | "restart",
  fireAt: string,
) {
  return api<{ schedule: PowerSchedule }>("schedulePower", { target, powerAction, fireAt }, session);
}

export function listSchedules(session: Session) {
  return api<{ schedules: PowerSchedule[] }>("listSchedules", {}, session);
}

export function cancelSchedule(session: Session, scheduleId: string) {
  return api<{ ok: boolean }>("cancelSchedule", { scheduleId }, session);
}

/* ---- live install progress (reported by the .cmd script itself) ---- */

export type InstallStatus = { stage: "approved" | "installing" | "starting"; updated_at: string } | null;

export function getInstallStatus(session: Session, deviceName: string) {
  return api<{ install: InstallStatus }>("installStatus", { deviceName }, session);
}


export function remoteSysInfo(session: Session, device: string) {
  return remoteCall<{
    hostname: string;
    os: string;
    osVersion: string;
    cpu: string;
    ramTotal: number;
    ramUsed: number;
    uptime: string;
    drives: { letter: string; free: number; total: number }[];
    network: { name: string; ip: string; mac: string }[];
  }>(session, device, "sysinfo");
}

export function remoteTasklist(
  session: Session,
  device: string,
) {
  return remoteCall<{
    processes: {
      pid: string;
      name: string;
      ram: number;
      cpu: number;
      disk?: number;
      network?: number;
      gpu?: number;
      status?: string;
      icon?: string;
    }[];
  }>(session, device, "tasklist");
}

