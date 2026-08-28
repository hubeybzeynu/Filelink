// Server-only core logic for the device link / file relay.
// Never import this from browser code.

const ONLINE_WINDOW_MS = 45_000;
const BUCKET = "shares";

// In-memory chunk accumulator for room uploads (uploadChunk -> uploadDone).
// Deliberately not filesystem-based: this server may run on an edge/
// serverless target with no writable local disk, so keeping bytes in
// memory for the short life of one upload is the portable choice.
const uploadBuffers = new Map<string, Buffer[]>();

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  pdf: "application/pdf",
  txt: "text/plain",
  json: "application/json",
  webm: "video/webm",
  mp4: "video/mp4",
  mp3: "audio/mpeg",
  zip: "application/zip",
};
function guessMime(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return MIME_BY_EXT[ext] ?? "application/octet-stream";
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function randomCode(len = 6) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  for (let i = 0; i < len; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function isOnline(lastSeen: string | null) {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < ONLINE_WINDOW_MS;
}

function normalizePath(input: unknown): string {
  let p = typeof input === "string" && input.trim() ? input.trim() : "/";
  p = p.replace(/\\/g, "/").replace(/\/+/g, "/");
  if (!p.startsWith("/")) p = "/" + p;
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  if (p.includes("..")) throw new ApiError("Invalid path");
  return p;
}

function safeName(input: unknown, label = "name"): string {
  const n = String(input ?? "").trim();
  if (!n) throw new ApiError(`Missing ${label}`);
  if (n.length > 160) throw new ApiError(`${label} is too long`);
  if (/[\\/:*?"<>|]/.test(n) || n === "." || n === "..") throw new ApiError(`Invalid ${label}`);
  return n;
}

/**
 * Make sure every segment of `path` exists as a folder in the room, creating
 * whatever is missing (like `mkdir -p`). Returns the normalized path.
 */
async function ensureFolderPath(roomId: string, deviceId: string, path: string) {
  const full = normalizePath(path);
  if (full === "/") return full;
  const db = await admin();
  const segments = full.split("/").filter(Boolean);
  let parent = "/";
  for (const raw of segments) {
    const name = safeName(raw, "folder name");
    const here = parent === "/" ? `/${name}` : `${parent}/${name}`;
    const { data: existing } = await db
      .from("folders")
      .select("id")
      .eq("room_id", roomId)
      .eq("path", here)
      .maybeSingle();
    if (!existing) {
      const { error } = await db
        .from("folders")
        .insert({ room_id: roomId, path: here, parent_path: parent, name, created_by: deviceId });
      // A racing device may have just created it — ignore duplicates.
      if (error && !/duplicate|unique/i.test(error.message)) throw new ApiError(error.message, 500);
    }
    parent = here;
  }
  return full;
}


type DeviceRow = {
  id: string;
  room_id: string;
  name: string;
  token: string;
  last_seen: string;
  agent: boolean;
  admin: boolean;
  mode: string;
  os_info: string | null;
};

async function authDevice(body: Record<string, unknown>) {
  const deviceId = String(body.deviceId ?? "");
  const deviceToken = String(body.deviceToken ?? "");
  if (!deviceId || !deviceToken) throw new ApiError("Not connected", 401);
  const db = await admin();
  const { data, error } = await db
    .from("devices")
    .select("id, room_id, name, token, last_seen, agent, admin, mode, os_info")
    .eq("id", deviceId)
    .maybeSingle();
  if (error) throw new ApiError(error.message, 500);
  const device = data as DeviceRow | null;
  if (!device || device.token !== deviceToken) throw new ApiError("Invalid device token", 401);
  await db.from("devices").update({ last_seen: new Date().toISOString() }).eq("id", device.id);
  return device;
}

async function listDevices(roomId: string) {
  const db = await admin();
  const { data } = await db
    .from("devices")
    .select("id, name, platform, last_seen, agent, admin, mode, os_info")
    .eq("room_id", roomId)
    .order("name");
  return (data ?? []).map((d) => ({
    id: d.id,
    name: d.name,
    platform: d.platform,
    online: isOnline(d.last_seen),
    lastSeen: d.last_seen,
    agent: d.agent,
    admin: d.admin,
    mode: d.mode,
    osInfo: d.os_info,
  }));
}

async function resolveTarget(roomId: string, target: unknown) {
  if (!target) return null;
  const value = String(target).trim();
  if (!value || value.toLowerCase() === "all") return null;
  const devices = await listDevices(roomId);
  const found =
    devices.find((d) => d.id === value) ||
    devices.find((d) => d.name.toLowerCase() === value.toLowerCase());
  if (!found) throw new ApiError(`No device named "${value}" in this room`);
  return found;
}

export async function handleAction(action: string, body: Record<string, unknown>) {
  const db = await admin();

  switch (action) {
    case "createRoom": {
      const name = String(body.name ?? "").trim() || "Shared drive";
      let code = randomCode();
      for (let i = 0; i < 5; i++) {
        const { data: existing } = await db.from("rooms").select("id").eq("code", code).maybeSingle();
        if (!existing) break;
        code = randomCode();
      }
      const { data, error } = await db
        .from("rooms")
        .insert({ code, name: name.slice(0, 80) })
        .select("id, code, name")
        .single();
      if (error) throw new ApiError(error.message, 500);
      return { room: data };
    }

    // Pinged directly by the installer .cmd/PowerShell as it runs on the
    // target PC — before that device has any auth token, so this is looked
    // up by room code only (like "register"). Lets the browser show real
    // progress instead of guessing from silence.
    case "installPing": {
      const code = String(body.code ?? "").trim().toUpperCase();
      if (!code) throw new ApiError("Missing room code");
      const { data: room } = await db.from("rooms").select("id").eq("code", code).maybeSingle();
      if (!room) throw new ApiError("Room not found", 404);
      const deviceName = safeName(body.deviceName ?? "device", "device name");
      const stage = String(body.stage ?? "");
      if (!["approved", "installing", "starting"].includes(stage)) throw new ApiError("Invalid stage");
      const { error } = await db
        .from("agent_installs")
        .upsert(
          { room_id: room.id, device_name: deviceName, stage, updated_at: new Date().toISOString() },
          { onConflict: "room_id,device_name" },
        );
      if (error) throw new ApiError(error.message, 500);
      return { ok: true };
    }

    case "installStatus": {
      const device = await authDevice(body);
      const deviceName = safeName(body.deviceName ?? "device", "device name");
      const { data } = await db
        .from("agent_installs")
        .select("stage, updated_at")
        .eq("room_id", device.room_id)
        .eq("device_name", deviceName)
        .maybeSingle();
      return { install: data ?? null };
    }

    case "register": {
      const code = String(body.code ?? "")
        .trim()
        .toUpperCase();
      if (!code) throw new ApiError("Missing room code");
      const { data: room } = await db
        .from("rooms")
        .select("id, code, name")
        .eq("code", code)
        .maybeSingle();
      if (!room) throw new ApiError("Room not found — check the link or code", 404);

      const name = safeName(body.deviceName ?? "device", "device name");
      const token = randomToken();
      const platform = String(body.platform ?? "").slice(0, 60) || null;
      const agent = Boolean(body.agent);
      const mode = agent ? "background" : String(body.mode ?? "active").slice(0, 20);
      const osInfo = String(body.osInfo ?? "").slice(0, 200) || null;

      // Reconnecting a PC with the same name reuses its device row instead of
      // creating a duplicate, so history and pending transfers stay attached.
      // But if a device under that name is CURRENTLY online, this is a
      // second, separate, concurrent session (e.g. the same PC's name used
      // by both a browser tab and a CMD session) — reusing the row would
      // silently steal the still-active session's token, making it start
      // failing with "Invalid device token" for no reason visible to it.
      // Only reuse the row when the existing one has actually gone stale.
      const { data: existingRows } = await db
        .from("devices")
        .select("id, admin, last_seen")
        .eq("room_id", room.id)
        .eq("name", name);

      const existing = (existingRows ?? []).find((d) => !isOnline(d.last_seen ?? null));
      const nameTaken = (existingRows ?? []).some((d) => isOnline(d.last_seen ?? null));

      // If that name is currently in use by another active session, reject
      // the connection outright rather than silently registering under a
      // different, auto-suffixed name — the person should pick a name that
      // isn't already taken, not end up connected as something else without
      // realizing it.
      if (nameTaken && !existing) {
        throw new ApiError(`Invalid device — "${name}" is already connected from another session`, 409);
      }

      const query = existing
        ? db
            .from("devices")
            .update({
              token,
              platform,
              last_seen: new Date().toISOString(),
              agent,
              admin: agent || Boolean(existing.admin),
              mode,
              os_info: osInfo,
            })
            .eq("id", existing.id)
        : db.from("devices").insert({
            room_id: room.id,
            name,
            token,
            platform,
            agent,
            admin: agent,
            mode,
            os_info: osInfo,
          });

      const { data: device, error } = await query.select("id, name, agent, admin, mode, os_info").single();
      if (error) throw new ApiError(error.message, 500);
      return {
        room,
        device: { id: device.id, name: device.name, token, agent: device.agent, admin: device.admin, mode: device.mode, osInfo: device.os_info },
        devices: await listDevices(room.id),
      };
    }

    case "heartbeat": {
      const device = await authDevice(body);
      const { data: room } = await db
        .from("rooms")
        .select("id, code, name")
        .eq("id", device.room_id)
        .maybeSingle();
      const { data: inbox } = await db
        .from("transfers")
        .select("id, file_name, size_bytes, folder_path, from_name, created_at")
        .eq("to_device", device.id)
        .eq("status", "pending")
        .order("created_at");
      return {
        room,
        me: { id: device.id, name: device.name, agent: device.agent, admin: device.admin, mode: device.mode, osInfo: device.os_info },
        devices: await listDevices(device.room_id),
        inbox: inbox ?? [],
      };
    }

    case "deleteDevice": {
      const device = await authDevice(body);
      const targetId = String(body.targetId ?? "");
      const { data: target } = await db
        .from("devices")
        .select("id, room_id, name, last_seen")
        .eq("id", targetId)
        .maybeSingle();
      if (!target || target.room_id !== device.room_id) throw new ApiError("Device not found", 404);

      // If it's actually online right now, tell it to uninstall itself
      // first (kills the process, removes the startup shortcut, deletes
      // %APPDATA%\FileLinkAgent) before removing it from the room — a
      // clean removal, not just deleting the row and leaving the agent
      // running orphaned on that PC forever.
      if (isOnline(target.last_seen ?? null)) {
        await db.from("device_rpc").insert({
          room_id: device.room_id,
          from_device: device.id,
          target_device: targetId,
          method: "control",
          params: { command: "removeAgent" } as never,
        });
        // Brief pause so the uninstall command has a moment to be picked up
        // before the row (and thus its auth) disappears out from under it.
        await new Promise((r) => setTimeout(r, 1500));
      }

      const { error } = await db.from("devices").delete().eq("id", targetId);
      if (error) throw new ApiError(error.message, 500);
      return { ok: true, devices: await listDevices(device.room_id) };
    }

    case "updateDevice": {
      const device = await authDevice(body);
      const targetId = String(body.targetId ?? "");
      const newName = safeName(body.name ?? "", "device name");
      const { data: target } = await db
        .from("devices")
        .select("id, room_id, last_seen")
        .eq("id", targetId)
        .maybeSingle();
      if (!target || target.room_id !== device.room_id) throw new ApiError("Device not found", 404);
      const { error } = await db.from("devices").update({ name: newName }).eq("id", targetId);
      if (error) throw new ApiError(error.message, 500);
      // Nudge the live agent (if it's actually running right now) to update
      // its own internal identity too, so a future restart/reconnect uses
      // the new name instead of quietly re-registering under the old one.
      // Fire-and-forget — the dashboard's own listing is already correct
      // from the update above regardless of whether the agent is online.
      if (isOnline(target.last_seen ?? null)) {
        await db.from("device_rpc").insert({
          room_id: device.room_id,
          from_device: device.id,
          target_device: targetId,
          method: "control",
          params: { command: "rename", name: newName } as never,
        });
      }
      return { id: targetId, name: newName, devices: await listDevices(device.room_id) };
    }

    case "devices": {
      const device = await authDevice(body);
      return { devices: await listDevices(device.room_id) };
    }

    case "ls": {
      const device = await authDevice(body);
      const path = normalizePath(body.path);
      const { data: folders } = await db
        .from("folders")
        .select("name, path, created_at")
        .eq("room_id", device.room_id)
        .eq("parent_path", path)
        .order("name");
      const { data: files } = await db
        .from("transfers")
        .select("id, file_name, size_bytes, from_name, to_name, status, created_at")
        .eq("room_id", device.room_id)
        .eq("folder_path", path)
        .neq("status", "uploading")
        .order("created_at");
      return { path, folders: folders ?? [], files: files ?? [] };
    }

    case "mkdir": {
      const device = await authDevice(body);
      const parent = normalizePath(body.path);
      // `name` may itself be a nested path like "grade 9/homework".
      const rest = String(body.name ?? "")
        .replace(/\\/g, "/")
        .split("/")
        .filter(Boolean);
      if (!rest.length) throw new ApiError("Missing folder name");
      const target = normalizePath(`${parent === "/" ? "" : parent}/${rest.join("/")}`);
      const path = await ensureFolderPath(device.room_id, device.id, target);
      return { path };
    }

    // Rename a room folder or a room file in place.
    case "rename": {
      const device = await authDevice(body);
      const item = (body.item ?? {}) as Record<string, unknown>;
      const raw = String(body.name ?? "").trim();
      if (!raw) throw new ApiError("Missing new name");
      if (/[\\/]/.test(raw)) throw new ApiError("A name cannot contain / or \\");

      if (item.kind === "folder") {
        const from = normalizePath(item.path);
        if (from === "/") throw new ApiError("Cannot rename the top folder");
        const parent = from.split("/").slice(0, -1).join("/") || "/";
        const to = normalizePath(`${parent === "/" ? "" : parent}/${raw}`);
        if (to === from) return { path: from };

        const { data: clash } = await db
          .from("folders")
          .select("id")
          .eq("room_id", device.room_id)
          .eq("path", to)
          .maybeSingle();
        if (clash) throw new ApiError(`"${raw}" already exists here`);

        const { data: subs } = await db
          .from("folders")
          .select("id, path, parent_path")
          .eq("room_id", device.room_id)
          .or(`path.eq.${from},path.like.${from}/%`);
        for (const s of subs ?? []) {
          await db
            .from("folders")
            .update({
              path: to + s.path.slice(from.length),
              parent_path: s.path === from ? parent : to + s.parent_path.slice(from.length),
              ...(s.path === from ? { name: raw } : {}),
            })
            .eq("id", s.id);
        }
        const { data: files } = await db
          .from("transfers")
          .select("id, folder_path")
          .eq("room_id", device.room_id)
          .or(`folder_path.eq.${from},folder_path.like.${from}/%`);
        for (const f of files ?? [])
          await db
            .from("transfers")
            .update({ folder_path: to + f.folder_path.slice(from.length) })
            .eq("id", f.id);
        return { path: to };
      }

      const id = String(item.id ?? "");
      const { data: t } = await db
        .from("transfers")
        .select("id, room_id")
        .eq("id", id)
        .maybeSingle();
      if (!t || t.room_id !== device.room_id) throw new ApiError("File not found", 404);
      await db.from("transfers").update({ file_name: raw }).eq("id", t.id);
      return { name: raw };
    }




    case "cd": {
      const device = await authDevice(body);
      const path = normalizePath(body.path);
      if (path === "/") return { path };
      const { data } = await db
        .from("folders")
        .select("path")
        .eq("room_id", device.room_id)
        .eq("path", path)
        .maybeSingle();
      if (!data) throw new ApiError(`No such folder: ${path}`, 404);
      return { path };
    }

    case "uploadInit": {
      const device = await authDevice(body);
      // Any missing folders in the destination path are created automatically.
      const folderPath = await ensureFolderPath(
        device.room_id,
        device.id,
        normalizePath(body.folderPath),
      );

      const fileName = safeName(body.fileName, "file name");
      const size = Number(body.size ?? 0);
      const target = await resolveTarget(device.room_id, body.to);
      const storagePath = `${device.room_id}/${crypto.randomUUID()}/${fileName}`;

      const { data: transfer, error } = await db
        .from("transfers")
        .insert({
          room_id: device.room_id,
          folder_path: folderPath,
          file_name: fileName,
          size_bytes: Number.isFinite(size) ? Math.max(0, Math.floor(size)) : 0,
          storage_path: storagePath,
          from_device: device.id,
          from_name: device.name,
          to_device: target?.id ?? null,
          to_name: target?.name ?? null,
          status: "uploading",
        })
        .select("id")
        .single();
      if (error) throw new ApiError(error.message, 500);

      // Bytes are sent in chunks through uploadChunk below and assembled
      // here on the server, then written to Storage in one shot on
      // uploadDone. A direct browser -> Storage PUT via a signed URL is a
      // well-documented source of failures (CORS, missing x-upsert/auth
      // headers, format mismatches) — routing through our own already-
      // authenticated endpoint sidesteps all of that, same as how a
      // device-targeted upload already works reliably.
      return { transferId: transfer.id };
    }

    case "uploadChunk": {
      const device = await authDevice(body);
      const id = String(body.transferId ?? "");
      const chunk = String(body.chunk ?? "");
      // An empty string is a valid chunk for a genuinely 0-byte file —
      // only actually missing values (undefined/null, never sent) should
      // be rejected here.
      if (!id || body.chunk === undefined || body.chunk === null) {
        throw new ApiError("Missing transferId or chunk");
      }
      const { data: transfer } = await db
        .from("transfers")
        .select("id, room_id, from_device")
        .eq("id", id)
        .maybeSingle();
      if (!transfer || transfer.room_id !== device.room_id) throw new ApiError("Transfer not found", 404);
      if (transfer.from_device !== device.id) throw new ApiError("Not your transfer", 403);

      const buf = Buffer.from(chunk, "base64");
      if (body.first || !uploadBuffers.has(id)) uploadBuffers.set(id, []);
      uploadBuffers.get(id)!.push(buf);
      return { ok: true, bytes: buf.length };
    }

    case "uploadDone": {
      const device = await authDevice(body);
      const id = String(body.transferId ?? "");
      const { data: transfer } = await db
        .from("transfers")
        .select("id, room_id, to_device, from_device, file_name, storage_path")
        .eq("id", id)
        .maybeSingle();
      if (!transfer || transfer.room_id !== device.room_id) throw new ApiError("Transfer not found", 404);
      if (transfer.from_device !== device.id) throw new ApiError("Not your transfer", 403);

      const chunks = uploadBuffers.get(id);
      if (!chunks || !chunks.length) {
        throw new ApiError("No uploaded bytes received — the upload never reached the server");
      }
      const bytes = Buffer.concat(chunks);
      uploadBuffers.delete(id);

      const contentType = String(body.contentType ?? "") || guessMime(transfer.file_name);
      const { error: storageErr } = await db.storage
        .from(BUCKET)
        .upload(transfer.storage_path, bytes, { contentType, upsert: true });
      if (storageErr) {
        await db.from("transfers").update({ status: "failed" }).eq("id", id);
        throw new ApiError(`Could not save the file to storage: ${storageErr.message}`, 500);
      }

      let direct = false;
      if (transfer.to_device) {
        const { data: target } = await db
          .from("devices")
          .select("last_seen")
          .eq("id", transfer.to_device)
          .maybeSingle();
        direct = isOnline(target?.last_seen ?? null);
      }
      const status = transfer.to_device ? "pending" : "shared";
      await db
        .from("transfers")
        .update({ status, direct, ready_at: new Date().toISOString() })
        .eq("id", id);
      return { status, direct };
    }

    case "inbox": {
      const device = await authDevice(body);
      const { data } = await db
        .from("transfers")
        .select("id, file_name, size_bytes, folder_path, from_name, created_at")
        .eq("to_device", device.id)
        .eq("status", "pending")
        .order("created_at");
      return { inbox: data ?? [] };
    }

    case "download": {
      const device = await authDevice(body);
      const id = String(body.transferId ?? "");
      const { data: transfer } = await db
        .from("transfers")
        .select("id, room_id, storage_path, file_name")
        .eq("id", id)
        .maybeSingle();
      if (!transfer || transfer.room_id !== device.room_id) throw new ApiError("File not found", 404);
      const { data: signed, error } = await db.storage
        .from(BUCKET)
        .createSignedUrl(transfer.storage_path, 3600, { download: transfer.file_name });
      if (error || !signed) throw new ApiError(error?.message ?? "Could not create link", 500);
      return { url: signed.signedUrl, fileName: transfer.file_name };
    }

    case "ack": {
      const device = await authDevice(body);
      const id = String(body.transferId ?? "");
      const { data: transfer } = await db
        .from("transfers")
        .select("id, to_device, room_id")
        .eq("id", id)
        .maybeSingle();
      if (!transfer || transfer.room_id !== device.room_id) throw new ApiError("Transfer not found", 404);
      if (transfer.to_device !== device.id) throw new ApiError("Not addressed to you", 403);
      await db
        .from("transfers")
        .update({ status: "received", delivered_at: new Date().toISOString() })
        .eq("id", id);
      return { ok: true };
    }

    case "tasks": {
      const device = await authDevice(body);
      const { data: sent } = await db
        .from("transfers")
        .select("id, file_name, size_bytes, folder_path, to_name, status, direct, created_at, delivered_at")
        .eq("from_device", device.id)
        .neq("status", "uploading")
        .order("created_at", { ascending: false })
        .limit(60);
      const { data: received } = await db
        .from("transfers")
        .select("id, file_name, size_bytes, folder_path, from_name, status, direct, created_at, delivered_at")
        .eq("to_device", device.id)
        .neq("status", "uploading")
        .order("created_at", { ascending: false })
        .limit(60);
      return { sent: sent ?? [], received: received ?? [] };
    }

    /* ---------------- live device browsing (no cloud copy) ---------------- */

    // A device tells the room where it can be reached on the local network and
    // which folder it is sharing live.
    case "share": {
      const device = await authDevice(body);
      const localUrl = String(body.localUrl ?? "").slice(0, 200) || null;
      const sharedRoot = String(body.sharedRoot ?? "").slice(0, 400) || null;
      await db.from("devices").update({ local_url: localUrl, shared_root: sharedRoot }).eq("id", device.id);
      return { localUrl, sharedRoot };
    }

    // Ask another online device for a live answer (list / search / read).
    // The answer travels straight through this request — nothing is stored.
    case "rpc": {
      const device = await authDevice(body);
      const target = await resolveTarget(device.room_id, body.target);
      if (!target) throw new ApiError("Which device? e.g. cd @Office PC");
      if (!target.online) throw new ApiError(`${target.name} is offline right now`);

      const method = String(body.method ?? "");
      if (
        ![
          "list",
          "search",
          "read",
          "write",
          "mkdir",
          "info",
          "disk",
          "bundle",
          "exit",
          "tree",
          "sysinfo",
          "tasklist",
          "control",
          "screenshot",
          "clipboardHistory",
          "clipboardWrite",
          "clipboardRead",
        ].includes(method)
      )
        throw new ApiError("Unknown request");

      const { data: call, error } = await db
        .from("device_rpc")
        .insert({
          room_id: device.room_id,
          from_device: device.id,
          target_device: target.id,
          method,
          params: (body.params ?? {}) as never,
        })
        .select("id")
        .single();
      if (error) throw new ApiError(error.message, 500);

      const deadline = Date.now() + 20_000;
      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 350));
        const { data: row } = await db
          .from("device_rpc")
          .select("status, result, error")
          .eq("id", call.id)
          .maybeSingle();
        if (row && row.status === "done") {
          if (row.error) throw new ApiError(row.error);
          return { device: target.name, result: row.result };
        }
      }
      await db.from("device_rpc").update({ status: "timeout" }).eq("id", call.id);
      throw new ApiError(`${target.name} did not answer in time`, 504);
    }

    // Start a long-running streamed request (e.g. remote shell command).
    // The caller polls rpcStatus for live chunks and the final result.
    case "rpcExec": {
      const device = await authDevice(body);
      const target = await resolveTarget(device.room_id, body.target);
      if (!target) throw new ApiError("Which device? e.g. exec Office PC dir");
      if (!target.online) throw new ApiError(`${target.name} is offline right now`);
      const method = String(body.method ?? "");
      if (!["exec"].includes(method)) throw new ApiError("Unknown streamed request");

      const { data: call, error } = await db
        .from("device_rpc")
        .insert({
          room_id: device.room_id,
          from_device: device.id,
          target_device: target.id,
          method,
          params: (body.params ?? {}) as never,
        })
        .select("id")
        .single();
      if (error) throw new ApiError(error.message, 500);
      return { callId: call.id, device: target.name };
    }

    // Append a live output chunk from the executing device.
    case "rpcChunk": {
      const device = await authDevice(body);
      const id = String(body.callId ?? "");
      const { data: call } = await db
        .from("device_rpc")
        .select("id, target_device")
        .eq("id", id)
        .maybeSingle();
      if (!call || call.target_device !== device.id) throw new ApiError("Request not found", 404);
      const chunk = String(body.chunk ?? "").slice(0, 4000);
      const { data: row } = await db.from("device_rpc").select("chunks").eq("id", id).single();
      const next = [...(Array.isArray(row?.chunks) ? row.chunks : []), chunk];
      await db.from("device_rpc").update({ chunks: next }).eq("id", id);
      return { ok: true };

    }

    // Poll status + accumulated chunks for a streamed request.
    case "rpcStatus": {
      const device = await authDevice(body);
      const id = String(body.callId ?? "");
      const { data: call } = await db
        .from("device_rpc")
        .select("id, room_id, from_device, status, result, error, chunks")
        .eq("id", id)
        .maybeSingle();
      if (!call || call.room_id !== device.room_id || call.from_device !== device.id)
        throw new ApiError("Request not found", 404);
      return {
        status: call.status,
        chunks: Array.isArray(call.chunks) ? call.chunks : [],
        result: call.result,
        error: call.error,
      };
    }


    // The shared device picks up requests addressed to it.
    case "rpcPoll": {
      const device = await authDevice(body);
      const { data } = await db
        .from("device_rpc")
        .select("id, method, params, created_at")
        .eq("target_device", device.id)
        .eq("status", "pending")
        .order("created_at")
        .limit(5);
      const fresh = (data ?? []).filter(
        (c) => Date.now() - new Date(c.created_at).getTime() < 25_000,
      );
      // Mark these as claimed immediately, in the same request that hands
      // them to the agent. Without this, a command that takes longer than
      // one poll interval (2s) to finish stayed "pending" the whole time,
      // so the NEXT poll picked up and re-ran the exact same command —
      // every ~2 seconds, for as long as it kept running. This is why any
      // command with real output/runtime ran multiple times.
      if (fresh.length) {
        await db
          .from("device_rpc")
          .update({ status: "running" })
          .in(
            "id",
            fresh.map((c) => c.id),
          );
      }
      return { calls: fresh };
    }

    // ...and sends its answer back.
    case "rpcRespond": {
      const device = await authDevice(body);
      const id = String(body.callId ?? "");
      const { data: call } = await db
        .from("device_rpc")
        .select("id, target_device")
        .eq("id", id)
        .maybeSingle();
      if (!call || call.target_device !== device.id) throw new ApiError("Request not found", 404);
      await db
        .from("device_rpc")
        .update({
          status: "done",
          result: (body.result ?? null) as never,
          error: body.error ? String(body.error).slice(0, 300) : null,
          answered_at: new Date().toISOString(),
        })
        .eq("id", id);
      return { ok: true };
    }

    /* ---------------- room storage management (cloud only) ---------------- */

    // How much this room is holding in the cloud.
    case "usage": {
      const device = await authDevice(body);
      const { data } = await db
        .from("transfers")
        .select("size_bytes")
        .eq("room_id", device.room_id)
        .neq("status", "uploading");
      const used = (data ?? []).reduce((n, r) => n + (Number(r.size_bytes) || 0), 0);
      return { used, files: (data ?? []).length, quota: 5 * 1024 * 1024 * 1024 };
    }

    // Delete is allowed for room/cloud files only — never for files that live
    // on somebody's PC.
    case "rm": {
      const device = await authDevice(body);
      const items = Array.isArray(body.items) ? (body.items as Record<string, unknown>[]) : [];
      if (!items.length) throw new ApiError("Nothing selected");
      let removed = 0;
      for (const item of items) {
        if (item.kind === "folder") {
          const path = normalizePath(item.path);
          if (path === "/") throw new ApiError("Cannot delete the top folder");
          const { data: files } = await db
            .from("transfers")
            .select("id, storage_path")
            .eq("room_id", device.room_id)
            .or(`folder_path.eq.${path},folder_path.like.${path}/%`);
          const paths = (files ?? []).map((f) => f.storage_path).filter(Boolean) as string[];
          if (paths.length) await db.storage.from(BUCKET).remove(paths);
          if (files?.length)
            await db
              .from("transfers")
              .delete()
              .in("id", files.map((f) => f.id));
          await db
            .from("folders")
            .delete()
            .eq("room_id", device.room_id)
            .or(`path.eq.${path},path.like.${path}/%`);
          removed++;
        } else {
          const id = String(item.id ?? "");
          const { data: t } = await db
            .from("transfers")
            .select("id, room_id, storage_path")
            .eq("id", id)
            .maybeSingle();
          if (!t || t.room_id !== device.room_id) continue;
          if (t.storage_path) await db.storage.from(BUCKET).remove([t.storage_path]);
          await db.from("transfers").delete().eq("id", t.id);
          removed++;
        }
      }
      return { removed };
    }

    // Copy or move room items into another room folder.
    case "cpmv": {
      const device = await authDevice(body);
      const mode = body.mode === "copy" ? "copy" : "move";
      const dest = await ensureFolderPath(device.room_id, device.id, normalizePath(body.dest));

      const items = Array.isArray(body.items) ? (body.items as Record<string, unknown>[]) : [];
      if (!items.length) throw new ApiError("Nothing selected");
      let moved = 0;

      for (const item of items) {
        if (item.kind === "folder") {
          const from = normalizePath(item.path);
          if (dest === from || dest.startsWith(from + "/"))
            throw new ApiError("Cannot put a folder inside itself");
          const name = from.split("/").filter(Boolean).pop()!;
          const to = dest === "/" ? `/${name}` : `${dest}/${name}`;
          if (mode === "move") {
            const { data: subs } = await db
              .from("folders")
              .select("id, path, parent_path")
              .eq("room_id", device.room_id)
              .or(`path.eq.${from},path.like.${from}/%`);
            for (const s of subs ?? []) {
              await db
                .from("folders")
                .update({
                  path: to + s.path.slice(from.length),
                  parent_path:
                    s.path === from ? dest : to + s.parent_path.slice(from.length),
                  ...(s.path === from ? { name } : {}),
                })
                .eq("id", s.id);
            }
            const { data: files } = await db
              .from("transfers")
              .select("id, folder_path")
              .eq("room_id", device.room_id)
              .or(`folder_path.eq.${from},folder_path.like.${from}/%`);
            for (const f of files ?? [])
              await db
                .from("transfers")
                .update({ folder_path: to + f.folder_path.slice(from.length) })
                .eq("id", f.id);
            moved++;
          } else {
            throw new ApiError("Copying whole folders in the room isn't supported yet — copy the files");
          }
        } else {
          const id = String(item.id ?? "");
          const { data: t } = await db
            .from("transfers")
            .select("*")
            .eq("id", id)
            .maybeSingle();
          if (!t || t.room_id !== device.room_id) continue;
          if (mode === "move") {
            await db.from("transfers").update({ folder_path: dest }).eq("id", t.id);
          } else {
            const storagePath = `${device.room_id}/${crypto.randomUUID()}/${t.file_name}`;
            const { error: copyErr } = await db.storage
              .from(BUCKET)
              .copy(t.storage_path, storagePath);
            if (copyErr) throw new ApiError(copyErr.message, 500);
            await db.from("transfers").insert({
              room_id: device.room_id,
              folder_path: dest,
              file_name: t.file_name,
              size_bytes: t.size_bytes,
              storage_path: storagePath,
              from_device: device.id,
              from_name: device.name,
              to_device: null,
              to_name: null,
              status: "shared",
              ready_at: new Date().toISOString(),
            });
          }
          moved++;
        }
      }
      return { moved, mode, dest };
    }

    // Every folder in the room, so pickers can show the whole tree at once.
    case "tree": {
      const device = await authDevice(body);
      const { data } = await db
        .from("folders")
        .select("path, parent_path, name")
        .eq("room_id", device.room_id)
        .order("path");
      return { folders: data ?? [] };
    }

    case "control": {
      const device = await authDevice(body);
      const target = await resolveTarget(device.room_id, body.target);
      if (!target) throw new ApiError("Which device?");
      if (!target.online) throw new ApiError(`${target.name} is offline right now`);
      const command = String(body.command ?? "");
      const allowed = ["shutdown", "restart", "sleep", "lock", "logout", "screenLock", "restartAgent", "stopAgent", "removeAgent", "flushDns", "getDns", "setDns", "resetDns", "cancelShutdown", "alert", "rename", "cursorInfo", "cursorMove", "cursorClick", "cursorScroll"];
      if (!allowed.includes(command)) throw new ApiError("Unknown control command");
      const { data: call, error } = await db
        .from("device_rpc")
        .insert({
          room_id: device.room_id,
          from_device: device.id,
          target_device: target.id,
          method: "control",
          params: {
            command,
            ...(body.interface ? { interface: body.interface } : {}),
            ...(body.servers ? { servers: body.servers } : {}),
            ...(body.seconds !== undefined ? { seconds: Number(body.seconds) || 0 } : {}),
            ...(body.title ? { title: String(body.title).slice(0, 120) } : {}),
            ...(body.content ? { content: String(body.content).slice(0, 2000) } : {}),
            ...(body.name ? { name: String(body.name).slice(0, 160) } : {}),
            ...(body.x !== undefined ? { x: Number(body.x) || 0 } : {}),
            ...(body.y !== undefined ? { y: Number(body.y) || 0 } : {}),
            ...(body.button ? { button: String(body.button).slice(0, 10) } : {}),
            ...(body.amount !== undefined ? { amount: Number(body.amount) || 0 } : {}),
            ...(body.horizontal !== undefined ? { horizontal: Boolean(body.horizontal) } : {}),
          } as never,
        })
        .select("id")
        .single();
      if (error) throw new ApiError(error.message, 500);

      const deadline = Date.now() + 20_000;
      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 350));
        const { data: row } = await db
          .from("device_rpc")
          .select("status, result, error")
          .eq("id", call.id)
          .maybeSingle();
        if (row && row.status === "done") {
          if (row.error) throw new ApiError(row.error);
          return { ok: true, result: row.result };
        }
      }
      await db.from("device_rpc").update({ status: "timeout" }).eq("id", call.id);
      throw new ApiError(`${target.name} did not answer in time`, 504);
    }

    // Records a pending shutdown/restart in the database so it survives a
    // page refresh, a closed tab, or a different browser/device viewing the
    // same room. The actual timer runs on the target PC itself (via
    // `shutdown /t <seconds>`, sent through the "control" action above) —
    // this table only tracks "what's currently scheduled" for the UI.
    case "schedulePower": {
      const device = await authDevice(body);
      const target = await resolveTarget(device.room_id, body.target);
      if (!target) throw new ApiError("Which device?");
      const powerAction = String(body.powerAction ?? "");
      if (!["shutdown", "restart"].includes(powerAction)) {
        throw new ApiError("Unsupported schedule action");
      }
      const fireAt = String(body.fireAt ?? "");
      if (!fireAt || Number.isNaN(Date.parse(fireAt))) throw new ApiError("Missing or invalid fireAt");

      // Only one active schedule per device at a time — replace any
      // existing pending one instead of stacking duplicates.
      await db
        .from("power_schedules")
        .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
        .eq("room_id", device.room_id)
        .eq("device_id", target.id)
        .eq("status", "pending");

      const { data, error } = await db
        .from("power_schedules")
        .insert({
          room_id: device.room_id,
          device_id: target.id,
          device_name: target.name,
          action: powerAction,
          fire_at: fireAt,
          created_by: device.id,
        })
        .select("id, device_id, device_name, action, fire_at, status, created_at")
        .single();
      if (error) throw new ApiError(error.message, 500);
      return { schedule: data };
    }

    case "listSchedules": {
      const device = await authDevice(body);
      const { data, error } = await db
        .from("power_schedules")
        .select("id, device_id, device_name, action, fire_at, status, created_at")
        .eq("room_id", device.room_id)
        .eq("status", "pending")
        .order("fire_at");
      if (error) throw new ApiError(error.message, 500);
      return { schedules: data ?? [] };
    }

    case "cancelSchedule": {
      const device = await authDevice(body);
      const id = String(body.scheduleId ?? "");
      if (!id) throw new ApiError("Missing scheduleId");
      const { error } = await db
        .from("power_schedules")
        .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
        .eq("id", id)
        .eq("room_id", device.room_id);
      if (error) throw new ApiError(error.message, 500);
      return { ok: true };
    }

    default:
      throw new ApiError(`Unknown action: ${action}`, 404);
  }
}

