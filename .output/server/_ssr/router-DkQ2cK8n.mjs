import { r as __toESM } from "../_runtime.mjs";
import { n as __exportAll } from "./server-GPLj6CT1.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { O as redirect, c as HeadContent, d as Outlet, f as lazyRouteComponent, g as useRouter, h as Link, m as createRootRouteWithContext, p as createFileRoute, s as Scripts, u as createRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as json$1 } from "../_libs/@tanstack/router-core+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { t as QueryClientProvider } from "../_libs/tanstack__react-query.mjs";
import processModule from "node:process";
import { Buffer } from "node:buffer";
//#region node_modules/.nitro/vite/services/ssr/assets/router-DkQ2cK8n.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var TIER_LIMITS = {
	free: {
		maxRooms: 3,
		maxDevicesPerRoom: 30,
		maxStorageBytesPerRoom: 1 * 1024 ** 3,
		maxFileBytes: 500 * 1024 ** 2,
		auditRetentionDays: 0
	},
	pro: {
		maxRooms: 30,
		maxDevicesPerRoom: 100,
		maxStorageBytesPerRoom: 50 * 1024 ** 3,
		maxFileBytes: 5 * 1024 ** 3,
		auditRetentionDays: 7
	},
	extended: {
		maxRooms: Infinity,
		maxDevicesPerRoom: Infinity,
		maxStorageBytesPerRoom: 500 * 1024 ** 3,
		maxFileBytes: 20 * 1024 ** 3,
		auditRetentionDays: null
	}
};
/** Control Center commands (the `control` rpc method's `params.command`) that
* are blocked entirely below a tier. Free only gets Agent connect +
* clipboard; power/alert/DNS/cursor are not in that list at all. */
var FREE_BLOCKED_CONTROL_COMMANDS = /* @__PURE__ */ new Set([
	"shutdown",
	"restart",
	"sleep",
	"logout",
	"lock",
	"screenLock",
	"cancelShutdown",
	"alert",
	"flushDns",
	"getDns",
	"setDns",
	"resetDns",
	"stopAgent",
	"removeAgent",
	"restartAgent"
]);
/** Cursor/screen remote-control and raw keyboard injection — "UI
* automation" — is Extended-only. */
var EXTENDED_ONLY_CONTROL_COMMANDS = /* @__PURE__ */ new Set([
	"cursorInfo",
	"cursorMove",
	"cursorClick",
	"cursorScroll",
	"keyboardType",
	"keyboardShortcut"
]);
function controlCommandAllowed(tier, command) {
	if (tier === "free" && FREE_BLOCKED_CONTROL_COMMANDS.has(command)) return {
		allowed: false,
		reason: "Upgrade to Pro to use power actions and alerts"
	};
	if (tier !== "extended" && EXTENDED_ONLY_CONTROL_COMMANDS.has(command)) return {
		allowed: false,
		reason: "Upgrade to Extended for cursor & screen control"
	};
	return { allowed: true };
}
function displayHubCapability(tier) {
	if (tier === "free") return "none";
	if (tier === "pro") return "preview";
	return "recording";
}
/** Task Manager: Free can only look; ending a task needs Pro+. */
function canEndTask(tier) {
	return tier !== "free";
}
/** Device Browsing: Free is view-only; Pro+ can copy/send/bundle; Extended
* additionally allows destructive ops (delete/cut/rename). */
function canEditFiles(tier) {
	return tier !== "free";
}
function canDeleteOrRenameFiles(tier) {
	return tier === "extended";
}
/** Pick the "answerable" payloads — the ones that pause the AI and wait. */
function isQuestionPayload(p) {
	return p.kind === "choices" || p.kind === "confirm";
}
/** Replace heavy fields so a payload is safe to store in the database. */
function stripForStorage(p) {
	if (p.kind === "image") return {
		...p,
		src: void 0
	};
	if (p.kind === "tasks") return {
		...p,
		processes: p.processes.map((proc) => ({
			...proc,
			icon: void 0
		}))
	};
	return p;
}
/** Windows paths use "\", the PC agent's shared-folder paths use "/".
* Normalise just enough to join and compare. */
function joinPath(dir, name) {
	if (!dir || dir === "/") return `/${name}`;
	const sep = dir.includes("\\") && !dir.includes("/") ? "\\" : "/";
	return dir.endsWith(sep) ? `${dir}${name}` : `${dir}${sep}${name}`;
}
/** Prefix of the message the Approve button sends back. The server treats a
* user turn that starts with this as approval for ONE risky action. */
var APPROVAL_PREFIX = "✅ Approved";
var CANCEL_PREFIX = "❌ Cancelled";
var SECRET_PATTERNS = [
	/sk-[a-zA-Z0-9]{20,}/g,
	/sk-ant-[a-zA-Z0-9_-]{20,}/g,
	/ghp_[a-zA-Z0-9]{36}/g,
	/gho_[a-zA-Z0-9]{36}/g,
	/glpat-[a-zA-Z0-9_-]{20,}/g,
	/bearer\s+[a-zA-Z0-9_\-.]{20,}/gi,
	/password\s*[:=]\s*["']?[^"'\s]{6,}["']?/gi,
	/secret\s*[:=]\s*["']?[^"'\s]{6,}["']?/gi,
	/api[_-]?key\s*[:=]\s*["']?[^"'\s]{8,}["']?/gi,
	/-----BEGIN\s+.*PRIVATE\s+KEY-----[\s\S]*?-----END\s+.*PRIVATE\s+KEY-----/g
];
/**
* Redact secrets from text before sending to AI or displaying in UI
*/
function redactSecrets(text) {
	let result = text;
	for (const pattern of SECRET_PATTERNS) result = result.replace(pattern, "[REDACTED_SECRET]");
	return result;
}
/**
* Determine risk level for a command
*/
function assessCommandRisk(command) {
	const lower = command.toLowerCase().trim();
	if (/format\s+[a-z]:/i.test(lower) || /rm\s+-rf\s+[/\\]/i.test(lower) || /del\s+\/s\s+\/q\s+[c-z]:\\/i.test(lower) || /drop\s+database/i.test(lower) || /mkfs\./i.test(lower) || /dd\s+if=/i.test(lower)) return "critical";
	if (/shutdown/i.test(lower) || /reboot|restart-computer/i.test(lower) || /netsh\s+firewall/i.test(lower) || /reg\s+(add|delete)/i.test(lower) || /npm\s+install\s+-g/i.test(lower) || /pip\s+install/i.test(lower) || /apt-get\s+install/i.test(lower) || /choco\s+install/i.test(lower) || /winget\s+install/i.test(lower) || /sc\s+(create|delete|config)/i.test(lower)) return "high";
	if (/npm\s+(install|i|add)/i.test(lower) || /git\s+(checkout|reset|clean|rebase)/i.test(lower) || /taskkill/i.test(lower) || /kill\s+-9/i.test(lower) || /del\s+/i.test(lower) || /rm\s+/i.test(lower)) return "medium";
	if (/mkdir|md\s+/i.test(lower) || /npm\s+(run|test|build)/i.test(lower) || /git\s+(status|diff|log|branch)/i.test(lower) || /tsc/i.test(lower) || /vite\s+build/i.test(lower)) return "low";
	if (/dir|ls|type|cat|echo|where|which|node\s+-v|npm\s+-v|git\s+--version/i.test(lower)) return "safe";
	return "medium";
}
/**
* Check if path is safe to access (not system-critical)
*/
function isPathSafe(filePath) {
	const normalized = filePath.replace(/\\/g, "/").toLowerCase();
	for (const blocked of [
		"c:/windows/system32",
		"c:/windows/syswow64",
		"/etc/shadow",
		"/etc/passwd",
		"/dev/",
		"/proc/",
		"/sys/"
	]) if (normalized.startsWith(blocked)) return false;
	return true;
}
/**
* Limits for safe operations
*/
var SAFETY_LIMITS = {
	MAX_FILE_READ_BYTES: 102400,
	MAX_COMMAND_TIMEOUT_MS: 3e5,
	MAX_AUTO_RETRIES: 3,
	MAX_CONCURRENT_TASKS: 5
};
/**
* Server-side approval gate. Returns a human-readable reason when a tool
* call must be approved by the person first, or null when it can just run.
*
* The system prompt already tells the model to ask before risky actions,
* but a prompt is a request, not a guarantee — so the same rule is enforced
* here in code: a gated call never executes until the person has pressed
* Approve on a confirmation card.
*/
function confirmationNeeded(toolName, input) {
	const device = String(input.device ?? "");
	const base = device ? { Device: device } : {};
	if (toolName === "power_action") {
		const action = String(input.action ?? "");
		if (action === "cancelShutdown" || action === "lock") return null;
		return {
			reason: `${action[0]?.toUpperCase() ?? ""}${action.slice(1)} ${device || "the device"}?`,
			risk: "high",
			details: {
				...base,
				Action: action
			}
		};
	}
	if (toolName === "run_command") {
		const command = String(input.command ?? "");
		const lower = command.toLowerCase();
		const destructive = /(^|[\s;&|])(del|erase|rd|rmdir|rm|remove-item|ri|taskkill|stop-process|kill|format|diskpart|shutdown|restart-computer|stop-computer)(\s|$)/i.test(lower);
		const risk = assessCommandRisk(command);
		if (destructive || risk === "high" || risk === "critical") return {
			reason: "Run this command?",
			risk: risk === "critical" ? "critical" : destructive ? "high" : risk,
			details: {
				...base,
				Command: command
			}
		};
	}
	return null;
}
var ONLINE_WINDOW_MS = 45e3;
var BUCKET = "shares";
var uploadBuffers = /* @__PURE__ */ new Map();
var MIME_BY_EXT = {
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
	zip: "application/zip"
};
function guessMime(fileName) {
	return MIME_BY_EXT[fileName.split(".").pop()?.toLowerCase() ?? ""] ?? "application/octet-stream";
}
async function admin() {
	const { supabaseAdmin } = await import("./client.server-KzwUIAkW.mjs");
	return supabaseAdmin;
}
var ApiError = class extends Error {
	status;
	code;
	retryable;
	constructor(message, status = 400, code = "UNKNOWN", retryable = false) {
		super(message);
		this.status = status;
		this.code = code;
		this.retryable = retryable;
	}
	toJSON() {
		return {
			ok: false,
			code: this.code,
			message: this.message,
			retryable: this.retryable
		};
	}
};
function randomCode(len = 6) {
	const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
	let out = "";
	const bytes = crypto.getRandomValues(new Uint8Array(len));
	for (let i = 0; i < len; i++) out += alphabet[bytes[i] % 32];
	return out;
}
function randomToken() {
	const bytes = crypto.getRandomValues(/* @__PURE__ */ new Uint8Array(24));
	return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function isOnline(lastSeen) {
	if (!lastSeen) return false;
	return Date.now() - new Date(lastSeen).getTime() < ONLINE_WINDOW_MS;
}
function normalizePath(input) {
	let p = typeof input === "string" && input.trim() ? input.trim() : "/";
	p = p.replace(/\\/g, "/").replace(/\/+/g, "/");
	if (!p.startsWith("/")) p = "/" + p;
	if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
	if (p.includes("..")) throw new ApiError("Invalid path");
	return p;
}
function safeName(input, label = "name") {
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
async function ensureFolderPath(roomId, deviceId, path) {
	const full = normalizePath(path);
	if (full === "/") return full;
	const db = await admin();
	const segments = full.split("/").filter(Boolean);
	let parent = "/";
	for (const raw of segments) {
		const name = safeName(raw, "folder name");
		const here = parent === "/" ? `/${name}` : `${parent}/${name}`;
		const { data: existing } = await db.from("folders").select("id").eq("room_id", roomId).eq("path", here).maybeSingle();
		if (!existing) {
			const { error } = await db.from("folders").insert({
				room_id: roomId,
				path: here,
				parent_path: parent,
				name,
				created_by: deviceId
			});
			if (error && !/duplicate|unique/i.test(error.message)) throw new ApiError(error.message, 500);
		}
		parent = here;
	}
	return full;
}
async function authDevice(body) {
	const deviceId = String(body.deviceId ?? "");
	const deviceToken = String(body.deviceToken ?? "");
	if (!deviceId || !deviceToken) throw new ApiError("Not connected", 401, "AUTH_REQUIRED");
	const db = await admin();
	const { data, error } = await db.from("devices").select("id, room_id, name, token, last_seen, agent, admin, mode, os_info").eq("id", deviceId).maybeSingle();
	if (error) throw new ApiError(error.message, 500);
	const device = data;
	if (!device || device.token !== deviceToken) throw new ApiError("Invalid device token", 401, "AUTH_REQUIRED");
	await db.from("devices").update({ last_seen: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", device.id);
	return device;
}
async function listDevices(roomId) {
	const { data } = await (await admin()).from("devices").select("id, name, platform, last_seen, agent, admin, mode, os_info, client_kind").eq("room_id", roomId).order("name");
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
		clientKind: d.client_kind
	}));
}
/** Writes one row to the server-persisted audit log. Fire-and-forget by
* design — a logging failure should never break the action it's logging,
* so this swallows its own errors rather than throwing. */
async function logAudit(roomId, deviceName, category, details, status = "SUCCESS") {
	try {
		await (await admin()).from("audit_events").insert({
			room_id: roomId,
			device_name: deviceName,
			category,
			details,
			status
		});
	} catch {}
}
async function resolveTarget(roomId, target) {
	if (!target) return null;
	const value = String(target).trim();
	if (!value || value.toLowerCase() === "all") return null;
	const devices = await listDevices(roomId);
	const found = devices.find((d) => d.id === value) || devices.find((d) => d.name.toLowerCase() === value.toLowerCase());
	if (!found) throw new ApiError(`No device named "${value}" in this room`);
	return found;
}
async function hashPassword(password, salt) {
	const useSalt = salt ?? crypto.randomUUID().replace(/-/g, "");
	const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${useSalt}:${password}`));
	return `${useSalt}:${Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("")}`;
}
async function verifyPassword(password, stored) {
	const salt = stored.split(":")[0];
	if (!salt) return false;
	return await hashPassword(password, salt) === stored;
}
var TIER_LABEL = {
	free: "Free",
	pro: "Pro",
	extended: "Extended"
};
function userTierInfo(row) {
	const expired = row.tier_expires_at ? new Date(row.tier_expires_at).getTime() < Date.now() : false;
	const tier = expired ? "free" : row.tier;
	return {
		tier,
		tierLabel: TIER_LABEL[tier] ?? "Free",
		tierExpiresAt: expired ? null : row.tier_expires_at
	};
}
async function authUser(body) {
	const userId = String(body.userId ?? "");
	const userToken = String(body.userToken ?? "");
	if (!userId || !userToken) throw new ApiError("Not logged in", 401);
	const { data } = await (await admin()).from("app_users").select("id, username, token, tier, tier_expires_at").eq("id", userId).maybeSingle();
	if (!data || data.token !== userToken) throw new ApiError("Invalid session — please log in again", 401);
	return data;
}
async function roomTier(roomId) {
	const db = await admin();
	const { data: room } = await db.from("rooms").select("owner_user_id").eq("id", roomId).maybeSingle();
	if (!room?.owner_user_id) return "extended";
	const { data: owner } = await db.from("app_users").select("tier, tier_expires_at").eq("id", room.owner_user_id).maybeSingle();
	if (!owner) return "extended";
	return userTierInfo(owner).tier;
}
async function handleAction(action, body) {
	const db = await admin();
	switch (action) {
		case "signup": {
			const username = String(body.username ?? "").trim().toLowerCase();
			const password = String(body.password ?? "");
			if (!/^[a-z0-9_.-]{3,32}$/.test(username)) throw new ApiError("Username must be 3-32 characters (letters, numbers, _ . -)");
			if (password.length < 6) throw new ApiError("Password must be at least 6 characters");
			const { data: existing } = await db.from("app_users").select("id").ilike("username", username).maybeSingle();
			if (existing) throw new ApiError("That username is already taken");
			const passwordHash = await hashPassword(password);
			const token = crypto.randomUUID();
			const { data, error } = await db.from("app_users").insert({
				username,
				password_hash: passwordHash,
				token,
				tier: "free"
			}).select("id, username, tier, tier_expires_at").single();
			if (error) throw new ApiError(error.message, 500);
			return {
				userId: data.id,
				userToken: token,
				username: data.username,
				...userTierInfo(data)
			};
		}
		case "userLogin": {
			const username = String(body.username ?? "").trim().toLowerCase();
			const password = String(body.password ?? "");
			const { data } = await db.from("app_users").select("id, username, password_hash, tier, tier_expires_at").ilike("username", username).maybeSingle();
			if (!data || !await verifyPassword(password, data.password_hash)) throw new ApiError("Wrong username or password", 401);
			const token = crypto.randomUUID();
			await db.from("app_users").update({ token }).eq("id", data.id);
			return {
				userId: data.id,
				userToken: token,
				username: data.username,
				...userTierInfo(data)
			};
		}
		case "userMe": {
			const user = await authUser(body);
			return {
				userId: user.id,
				username: user.username,
				...userTierInfo(user)
			};
		}
		case "setTier": {
			const user = await authUser(body);
			const tier = String(body.tier ?? "");
			const months = Math.max(1, Math.min(24, Number(body.months) || 1));
			if (![
				"free",
				"pro",
				"extended"
			].includes(tier)) throw new ApiError("Invalid tier");
			const expiresAt = tier === "free" ? null : new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1e3).toISOString();
			const { data, error } = await db.from("app_users").update({
				tier,
				tier_expires_at: expiresAt
			}).eq("id", user.id).select("id, username, tier, tier_expires_at").single();
			if (error) throw new ApiError(error.message, 500);
			return {
				userId: data.id,
				username: data.username,
				...userTierInfo(data)
			};
		}
		case "createRoom": {
			const name = String(body.name ?? "").trim() || "Shared drive";
			let code = randomCode();
			for (let i = 0; i < 5; i++) {
				const { data: existing } = await db.from("rooms").select("id").eq("code", code).maybeSingle();
				if (!existing) break;
				code = randomCode();
			}
			let ownerUserId = null;
			if (body.userId && body.userToken) try {
				ownerUserId = (await authUser(body)).id;
			} catch {}
			if (ownerUserId) {
				const { data: owner } = await db.from("app_users").select("tier, tier_expires_at").eq("id", ownerUserId).maybeSingle();
				const tier = owner ? userTierInfo(owner).tier : "free";
				const limit = TIER_LIMITS[tier].maxRooms;
				if (Number.isFinite(limit)) {
					const { count } = await db.from("rooms").select("id", {
						count: "exact",
						head: true
					}).eq("owner_user_id", ownerUserId);
					if ((count ?? 0) >= limit) throw new ApiError(`Your ${tier} plan allows up to ${limit} rooms — upgrade to create more`, 402, "PERMISSION_DENIED");
				}
			}
			const { data, error } = await db.from("rooms").insert({
				code,
				name: name.slice(0, 80),
				owner_user_id: ownerUserId
			}).select("id, code, name").single();
			if (error) throw new ApiError(error.message, 500);
			return { room: data };
		}
		case "installPing": {
			const code = String(body.code ?? "").trim().toUpperCase();
			if (!code) throw new ApiError("Missing room code");
			const { data: room } = await db.from("rooms").select("id").eq("code", code).maybeSingle();
			if (!room) throw new ApiError("Room not found", 404);
			const deviceName = safeName(body.deviceName ?? "device", "device name");
			const stage = String(body.stage ?? "");
			if (![
				"approved",
				"installing",
				"starting"
			].includes(stage)) throw new ApiError("Invalid stage");
			const { error } = await db.from("agent_installs").upsert({
				room_id: room.id,
				device_name: deviceName,
				stage,
				updated_at: (/* @__PURE__ */ new Date()).toISOString()
			}, { onConflict: "room_id,device_name" });
			if (error) throw new ApiError(error.message, 500);
			return { ok: true };
		}
		case "installStatus": {
			const device = await authDevice(body);
			const deviceName = safeName(body.deviceName ?? "device", "device name");
			const { data } = await db.from("agent_installs").select("stage, updated_at").eq("room_id", device.room_id).eq("device_name", deviceName).maybeSingle();
			return { install: data ?? null };
		}
		case "register": {
			const code = String(body.code ?? "").trim().toUpperCase();
			if (!code) throw new ApiError("Missing room code");
			const { data: room } = await db.from("rooms").select("id, code, name").eq("code", code).maybeSingle();
			if (!room) throw new ApiError("Room not found — check the link or code", 404);
			const name = safeName(body.deviceName ?? "device", "device name");
			const token = randomToken();
			const platform = String(body.platform ?? "").slice(0, 60) || null;
			const agent = Boolean(body.agent);
			const mode = agent ? "background" : String(body.mode ?? "active").slice(0, 20);
			const osInfo = String(body.osInfo ?? "").slice(0, 200) || null;
			const allowedKinds = [
				"web",
				"cli",
				"agent",
				"desktop-app"
			];
			const requestedKind = String(body.clientKind ?? "");
			const clientKind = allowedKinds.includes(requestedKind) ? requestedKind : agent ? "agent" : "cli";
			const { data: existingRows } = await db.from("devices").select("id, admin, last_seen").eq("room_id", room.id).eq("name", name);
			const existing = (existingRows ?? []).find((d) => !isOnline(d.last_seen ?? null));
			const nameTaken = (existingRows ?? []).some((d) => isOnline(d.last_seen ?? null));
			if (!existing) {
				const tier = await roomTier(room.id);
				const limit = TIER_LIMITS[tier].maxDevicesPerRoom;
				if (Number.isFinite(limit)) {
					const { count } = await db.from("devices").select("id", {
						count: "exact",
						head: true
					}).eq("room_id", room.id);
					if ((count ?? 0) >= limit) throw new ApiError(`This room's ${tier} plan allows up to ${limit} devices — upgrade to add more`, 402, "PERMISSION_DENIED");
				}
			}
			if (nameTaken && !existing) throw new ApiError(`Invalid device — "${name}" is already connected from another session`, 409);
			const { data: device, error } = await (existing ? db.from("devices").update({
				token,
				platform,
				last_seen: (/* @__PURE__ */ new Date()).toISOString(),
				agent,
				admin: agent || Boolean(existing.admin),
				mode,
				os_info: osInfo,
				client_kind: clientKind
			}).eq("id", existing.id) : db.from("devices").insert({
				room_id: room.id,
				name,
				token,
				platform,
				agent,
				admin: agent,
				mode,
				os_info: osInfo,
				client_kind: clientKind
			})).select("id, name, agent, admin, mode, os_info, client_kind").single();
			if (error) throw new ApiError(error.message, 500);
			return {
				room,
				device: {
					id: device.id,
					name: device.name,
					token,
					agent: device.agent,
					admin: device.admin,
					mode: device.mode,
					osInfo: device.os_info,
					clientKind: device.client_kind
				},
				devices: await listDevices(room.id)
			};
		}
		case "heartbeat": {
			const device = await authDevice(body);
			const { data: room } = await db.from("rooms").select("id, code, name").eq("id", device.room_id).maybeSingle();
			const { data: inbox } = await db.from("transfers").select("id, file_name, size_bytes, folder_path, from_name, created_at").eq("to_device", device.id).eq("status", "pending").order("created_at");
			return {
				room,
				me: {
					id: device.id,
					name: device.name,
					agent: device.agent,
					admin: device.admin,
					mode: device.mode,
					osInfo: device.os_info
				},
				devices: await listDevices(device.room_id),
				inbox: inbox ?? []
			};
		}
		case "deleteDevice": {
			const device = await authDevice(body);
			const targetId = String(body.targetId ?? "");
			const { data: target } = await db.from("devices").select("id, room_id, name, last_seen").eq("id", targetId).maybeSingle();
			if (!target || target.room_id !== device.room_id) throw new ApiError("Device not found", 404);
			if (isOnline(target.last_seen ?? null)) {
				await db.from("device_rpc").insert({
					room_id: device.room_id,
					from_device: device.id,
					target_device: targetId,
					method: "control",
					params: { command: "removeAgent" }
				});
				await new Promise((r) => setTimeout(r, 1500));
			}
			const { error } = await db.from("devices").delete().eq("id", targetId);
			if (error) throw new ApiError(error.message, 500);
			return {
				ok: true,
				devices: await listDevices(device.room_id)
			};
		}
		case "updateDevice": {
			const device = await authDevice(body);
			const targetId = String(body.targetId ?? "");
			const newName = safeName(body.name ?? "", "device name");
			const { data: target } = await db.from("devices").select("id, room_id, last_seen").eq("id", targetId).maybeSingle();
			if (!target || target.room_id !== device.room_id) throw new ApiError("Device not found", 404);
			const { error } = await db.from("devices").update({ name: newName }).eq("id", targetId);
			if (error) throw new ApiError(error.message, 500);
			if (isOnline(target.last_seen ?? null)) await db.from("device_rpc").insert({
				room_id: device.room_id,
				from_device: device.id,
				target_device: targetId,
				method: "control",
				params: {
					command: "rename",
					name: newName
				}
			});
			return {
				id: targetId,
				name: newName,
				devices: await listDevices(device.room_id)
			};
		}
		case "devices": return { devices: await listDevices((await authDevice(body)).room_id) };
		case "ls": {
			const device = await authDevice(body);
			const path = normalizePath(body.path);
			const { data: folders } = await db.from("folders").select("name, path, created_at").eq("room_id", device.room_id).eq("parent_path", path).order("name");
			const { data: files } = await db.from("transfers").select("id, file_name, size_bytes, from_name, to_name, status, created_at").eq("room_id", device.room_id).eq("folder_path", path).neq("status", "uploading").order("created_at");
			return {
				path,
				folders: folders ?? [],
				files: files ?? []
			};
		}
		case "mkdir": {
			const device = await authDevice(body);
			if (!canEditFiles(await roomTier(device.room_id))) throw new ApiError("Upgrade to Pro to create folders", 402, "PERMISSION_DENIED");
			const parent = normalizePath(body.path);
			const rest = String(body.name ?? "").replace(/\\/g, "/").split("/").filter(Boolean);
			if (!rest.length) throw new ApiError("Missing folder name");
			const target = normalizePath(`${parent === "/" ? "" : parent}/${rest.join("/")}`);
			const path = await ensureFolderPath(device.room_id, device.id, target);
			logAudit(device.room_id, device.name, "File/Link", `Created folder: ${path}`, "SUCCESS");
			return { path };
		}
		case "rename": {
			const device = await authDevice(body);
			if (!canDeleteOrRenameFiles(await roomTier(device.room_id))) throw new ApiError("Upgrade to Extended to rename files/folders", 402, "PERMISSION_DENIED");
			const item = body.item ?? {};
			const raw = String(body.name ?? "").trim();
			if (!raw) throw new ApiError("Missing new name");
			if (/[\\/]/.test(raw)) throw new ApiError("A name cannot contain / or \\");
			logAudit(device.room_id, device.name, "File/Link", `Renamed "${item.name ?? ""}" to "${raw}"`, "SUCCESS");
			if (item.kind === "folder") {
				const from = normalizePath(item.path);
				if (from === "/") throw new ApiError("Cannot rename the top folder");
				const parent = from.split("/").slice(0, -1).join("/") || "/";
				const to = normalizePath(`${parent === "/" ? "" : parent}/${raw}`);
				if (to === from) return { path: from };
				const { data: clash } = await db.from("folders").select("id").eq("room_id", device.room_id).eq("path", to).maybeSingle();
				if (clash) throw new ApiError(`"${raw}" already exists here`);
				const { data: subs } = await db.from("folders").select("id, path, parent_path").eq("room_id", device.room_id).or(`path.eq.${from},path.like.${from}/%`);
				for (const s of subs ?? []) await db.from("folders").update({
					path: to + s.path.slice(from.length),
					parent_path: s.path === from ? parent : to + s.parent_path.slice(from.length),
					...s.path === from ? { name: raw } : {}
				}).eq("id", s.id);
				const { data: files } = await db.from("transfers").select("id, folder_path").eq("room_id", device.room_id).or(`folder_path.eq.${from},folder_path.like.${from}/%`);
				for (const f of files ?? []) await db.from("transfers").update({ folder_path: to + f.folder_path.slice(from.length) }).eq("id", f.id);
				return { path: to };
			}
			const id = String(item.id ?? "");
			const { data: t } = await db.from("transfers").select("id, room_id").eq("id", id).maybeSingle();
			if (!t || t.room_id !== device.room_id) throw new ApiError("File not found", 404);
			await db.from("transfers").update({ file_name: raw }).eq("id", t.id);
			return { name: raw };
		}
		case "cd": {
			const device = await authDevice(body);
			const path = normalizePath(body.path);
			if (path === "/") return { path };
			const { data } = await db.from("folders").select("path").eq("room_id", device.room_id).eq("path", path).maybeSingle();
			if (!data) throw new ApiError(`No such folder: ${path}`, 404);
			return { path };
		}
		case "uploadInit": {
			const device = await authDevice(body);
			const folderPath = await ensureFolderPath(device.room_id, device.id, normalizePath(body.folderPath));
			const fileName = safeName(body.fileName, "file name");
			const size = Number(body.size ?? 0);
			const tier = await roomTier(device.room_id);
			const maxFile = TIER_LIMITS[tier].maxFileBytes;
			if (Number.isFinite(size) && size > maxFile) throw new ApiError(`This file is over your ${tier} plan's ${Math.round(maxFile / 1024 ** 2)} MB per-file limit — upgrade for larger transfers`, 402, "PERMISSION_DENIED");
			const maxStorage = TIER_LIMITS[tier].maxStorageBytesPerRoom;
			if (Number.isFinite(maxStorage)) {
				const { data: existingTransfers } = await db.from("transfers").select("size_bytes").eq("room_id", device.room_id).neq("status", "uploading");
				if ((existingTransfers ?? []).reduce((n, r) => n + (Number(r.size_bytes) || 0), 0) + (Number.isFinite(size) ? size : 0) > maxStorage) throw new ApiError(`This room is at its ${tier} plan's ${Math.round(maxStorage / 1024 ** 3)} GB storage limit — upgrade or free up space`, 402, "PERMISSION_DENIED");
			}
			const target = await resolveTarget(device.room_id, body.to);
			const storagePath = `${device.room_id}/${crypto.randomUUID()}/${fileName}`;
			const { data: transfer, error } = await db.from("transfers").insert({
				room_id: device.room_id,
				folder_path: folderPath,
				file_name: fileName,
				size_bytes: Number.isFinite(size) ? Math.max(0, Math.floor(size)) : 0,
				storage_path: storagePath,
				from_device: device.id,
				from_name: device.name,
				to_device: target?.id ?? null,
				to_name: target?.name ?? null,
				status: "uploading"
			}).select("id").single();
			if (error) throw new ApiError(error.message, 500);
			return { transferId: transfer.id };
		}
		case "uploadChunk": {
			const device = await authDevice(body);
			const id = String(body.transferId ?? "");
			const chunk = String(body.chunk ?? "");
			if (!id || body.chunk === void 0 || body.chunk === null) throw new ApiError("Missing transferId or chunk");
			const { data: transfer } = await db.from("transfers").select("id, room_id, from_device").eq("id", id).maybeSingle();
			if (!transfer || transfer.room_id !== device.room_id) throw new ApiError("Transfer not found", 404);
			if (transfer.from_device !== device.id) throw new ApiError("Not your transfer", 403);
			const buf = Buffer.from(chunk, "base64");
			if (body.first || !uploadBuffers.has(id)) uploadBuffers.set(id, []);
			uploadBuffers.get(id).push(buf);
			return {
				ok: true,
				bytes: buf.length
			};
		}
		case "uploadDone": {
			const device = await authDevice(body);
			const id = String(body.transferId ?? "");
			const { data: transfer } = await db.from("transfers").select("id, room_id, to_device, from_device, file_name, storage_path").eq("id", id).maybeSingle();
			if (!transfer || transfer.room_id !== device.room_id) throw new ApiError("Transfer not found", 404);
			if (transfer.from_device !== device.id) throw new ApiError("Not your transfer", 403);
			const chunks = uploadBuffers.get(id);
			if (!chunks || !chunks.length) throw new ApiError("No uploaded bytes received — the upload never reached the server");
			const bytes = Buffer.concat(chunks);
			uploadBuffers.delete(id);
			const contentType = String(body.contentType ?? "") || guessMime(transfer.file_name);
			const { error: storageErr } = await db.storage.from(BUCKET).upload(transfer.storage_path, bytes, {
				contentType,
				upsert: true
			});
			if (storageErr) {
				await db.from("transfers").update({ status: "failed" }).eq("id", id);
				throw new ApiError(`Could not save the file to storage: ${storageErr.message}`, 500);
			}
			let direct = false;
			if (transfer.to_device) {
				const { data: target } = await db.from("devices").select("last_seen").eq("id", transfer.to_device).maybeSingle();
				direct = isOnline(target?.last_seen ?? null);
			}
			const status = transfer.to_device ? "pending" : "shared";
			await db.from("transfers").update({
				status,
				direct,
				ready_at: (/* @__PURE__ */ new Date()).toISOString()
			}).eq("id", id);
			return {
				status,
				direct
			};
		}
		case "inbox": {
			const device = await authDevice(body);
			const { data } = await db.from("transfers").select("id, file_name, size_bytes, folder_path, from_name, created_at").eq("to_device", device.id).eq("status", "pending").order("created_at");
			return { inbox: data ?? [] };
		}
		case "download": {
			const device = await authDevice(body);
			const id = String(body.transferId ?? "");
			const { data: transfer } = await db.from("transfers").select("id, room_id, storage_path, file_name").eq("id", id).maybeSingle();
			if (!transfer || transfer.room_id !== device.room_id) throw new ApiError("File not found", 404);
			const { data: signed, error } = await db.storage.from(BUCKET).createSignedUrl(transfer.storage_path, 3600, { download: transfer.file_name });
			if (error || !signed) throw new ApiError(error?.message ?? "Could not create link", 500);
			return {
				url: signed.signedUrl,
				fileName: transfer.file_name
			};
		}
		case "ack": {
			const device = await authDevice(body);
			const id = String(body.transferId ?? "");
			const { data: transfer } = await db.from("transfers").select("id, to_device, room_id").eq("id", id).maybeSingle();
			if (!transfer || transfer.room_id !== device.room_id) throw new ApiError("Transfer not found", 404);
			if (transfer.to_device !== device.id) throw new ApiError("Not addressed to you", 403);
			await db.from("transfers").update({
				status: "received",
				delivered_at: (/* @__PURE__ */ new Date()).toISOString()
			}).eq("id", id);
			return { ok: true };
		}
		case "tasks": {
			const device = await authDevice(body);
			const { data: sent } = await db.from("transfers").select("id, file_name, size_bytes, folder_path, to_name, status, direct, created_at, delivered_at").eq("from_device", device.id).neq("status", "uploading").order("created_at", { ascending: false }).limit(60);
			const { data: received } = await db.from("transfers").select("id, file_name, size_bytes, folder_path, from_name, status, direct, created_at, delivered_at").eq("to_device", device.id).neq("status", "uploading").order("created_at", { ascending: false }).limit(60);
			return {
				sent: sent ?? [],
				received: received ?? []
			};
		}
		case "share": {
			const device = await authDevice(body);
			const localUrl = String(body.localUrl ?? "").slice(0, 200) || null;
			const sharedRoot = String(body.sharedRoot ?? "").slice(0, 400) || null;
			await db.from("devices").update({
				local_url: localUrl,
				shared_root: sharedRoot
			}).eq("id", device.id);
			return {
				localUrl,
				sharedRoot
			};
		}
		case "rpc": {
			const device = await authDevice(body);
			const target = await resolveTarget(device.room_id, body.target);
			if (!target) throw new ApiError("Which device? e.g. cd @Office PC");
			if (!target.online) throw new ApiError(`${target.name} is offline right now`, 503, "DEVICE_OFFLINE");
			const method = String(body.method ?? "");
			if (![
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
				"write_text",
				"read_text",
				"edit_file",
				"create_file",
				"sysinfo",
				"tasklist",
				"clipboardHistory",
				"clipboardWrite",
				"clipboardRead",
				"screenshot",
				"control",
				"appAction"
			].includes(method)) throw new ApiError("Unknown request", 400);
			const tier = await roomTier(device.room_id);
			if (method === "screenshot" && displayHubCapability(tier) === "none") throw new ApiError("Upgrade to Pro to use the Display Hub (screenshot/camera)", 402, "PERMISSION_DENIED");
			if (method === "control") {
				const command = String(body.params?.command ?? "");
				const check = controlCommandAllowed(tier, command);
				if (!check.allowed) throw new ApiError(check.reason ?? "Not available on your plan", 402, "PERMISSION_DENIED");
				const isPower = [
					"shutdown",
					"restart",
					"sleep",
					"logout",
					"lock",
					"screenLock",
					"cancelShutdown"
				].includes(command);
				logAudit(device.room_id, target.name, isPower ? "Power" : "System", `${command} sent`, "INFO");
			}
			if (method === "screenshot") logAudit(device.room_id, target.name, "Display", "Screenshot captured", "SUCCESS");
			if (method === "clipboardWrite" || method === "clipboardRead" || method === "clipboardHistory") logAudit(device.room_id, target.name, "Clipboard", `${method} on ${target.name}`, "INFO");
			if (method === "appAction") {
				if (target.clientKind !== "desktop-app") throw new ApiError(`${target.name} isn't running the desktop app`, 400);
				const appActionName = String(body.params?.action ?? "");
				const powerActions = [
					"shutdown",
					"restart",
					"sleep",
					"logout",
					"lock",
					"screenLock",
					"cancelShutdown"
				];
				const cursorActions = [
					"cursorMove",
					"cursorClick",
					"cursorScroll",
					"keyboardType",
					"keyboardShortcut"
				];
				if (powerActions.includes(appActionName)) {
					const check = controlCommandAllowed(tier, appActionName);
					if (!check.allowed) throw new ApiError(check.reason ?? "Not available on your plan", 402, "PERMISSION_DENIED");
					logAudit(device.room_id, target.name, "Power", `${appActionName} sent (native app)`, "INFO");
				} else if (cursorActions.includes(appActionName)) {
					const check = controlCommandAllowed(tier, appActionName);
					if (!check.allowed) throw new ApiError(check.reason ?? "Not available on your plan", 402, "PERMISSION_DENIED");
				} else if (appActionName === "screenshot" || appActionName === "cameraCapture" || appActionName === "screenRecording") {
					const cap = displayHubCapability(tier);
					if (cap === "none") throw new ApiError("Upgrade to Pro to use the Display Hub (screenshot/camera)", 402, "PERMISSION_DENIED");
					if ((appActionName === "screenRecording" || appActionName === "cameraCapture") && cap !== "recording") throw new ApiError("Upgrade to Extended to record (Pro includes preview only)", 402, "PERMISSION_DENIED");
					logAudit(device.room_id, target.name, "Display", `${appActionName} (native app)`, "SUCCESS");
				}
			}
			const { data: call, error } = await db.from("device_rpc").insert({
				room_id: device.room_id,
				from_device: device.id,
				target_device: target.id,
				method,
				params: body.params ?? {}
			}).select("id").single();
			if (error) throw new ApiError(error.message, 500);
			const deadline = Date.now() + 2e4;
			while (Date.now() < deadline) {
				await new Promise((r) => setTimeout(r, 350));
				const { data: row } = await db.from("device_rpc").select("status, result, error").eq("id", call.id).maybeSingle();
				if (row && row.status === "done") {
					if (row.error) throw new ApiError(row.error);
					return {
						device: target.name,
						result: row.result
					};
				}
			}
			await db.from("device_rpc").update({ status: "timeout" }).eq("id", call.id);
			throw new ApiError(`${target.name} did not answer in time`, 504, "TIMEOUT", true);
		}
		case "rpcExec": {
			const device = await authDevice(body);
			const target = await resolveTarget(device.room_id, body.target);
			if (!target) throw new ApiError("Which device? e.g. exec Office PC dir");
			if (!target.online) throw new ApiError(`${target.name} is offline right now`, 503, "DEVICE_OFFLINE");
			const method = String(body.method ?? "");
			if (!["exec"].includes(method)) throw new ApiError("Unknown streamed request");
			const tier = await roomTier(device.room_id);
			if (tier === "free") {
				const risk = assessCommandRisk(String(body.params?.command ?? ""));
				if (risk === "high" || risk === "critical") throw new ApiError("Upgrade to Pro to run admin-level commands", 402, "PERMISSION_DENIED");
			}
			if (/taskkill/i.test(String(body.params?.command ?? "")) && !canEndTask(tier)) throw new ApiError("Upgrade to Pro to end tasks", 402, "PERMISSION_DENIED");
			logAudit(device.room_id, target.name, "Command", `Ran: ${String(body.params?.command ?? "").slice(0, 200)}`, "INFO");
			const { data: call, error } = await db.from("device_rpc").insert({
				room_id: device.room_id,
				from_device: device.id,
				target_device: target.id,
				method,
				params: body.params ?? {}
			}).select("id").single();
			if (error) throw new ApiError(error.message, 500);
			return {
				callId: call.id,
				device: target.name
			};
		}
		case "rpcChunk": {
			const device = await authDevice(body);
			const id = String(body.callId ?? "");
			const { data: call } = await db.from("device_rpc").select("id, target_device").eq("id", id).maybeSingle();
			if (!call || call.target_device !== device.id) throw new ApiError("Request not found", 404);
			const chunk = String(body.chunk ?? "").slice(0, 4e3);
			const { data: row } = await db.from("device_rpc").select("chunks").eq("id", id).single();
			const next = [...Array.isArray(row?.chunks) ? row.chunks : [], chunk];
			await db.from("device_rpc").update({ chunks: next }).eq("id", id);
			return { ok: true };
		}
		case "rpcStatus": {
			const device = await authDevice(body);
			const id = String(body.callId ?? "");
			const { data: call } = await db.from("device_rpc").select("id, room_id, from_device, status, result, error, chunks").eq("id", id).maybeSingle();
			if (!call || call.room_id !== device.room_id || call.from_device !== device.id) throw new ApiError("Request not found", 404);
			return {
				status: call.status,
				chunks: Array.isArray(call.chunks) ? call.chunks : [],
				result: call.result,
				error: call.error
			};
		}
		case "rpcPoll": {
			const device = await authDevice(body);
			const { data } = await db.from("device_rpc").select("id, method, params, created_at").eq("target_device", device.id).eq("status", "pending").order("created_at").limit(5);
			const fresh = (data ?? []).filter((c) => Date.now() - new Date(c.created_at).getTime() < 25e3);
			if (fresh.length) await db.from("device_rpc").update({ status: "running" }).in("id", fresh.map((c) => c.id));
			return { calls: fresh };
		}
		case "rpcRespond": {
			const device = await authDevice(body);
			const id = String(body.callId ?? "");
			const { data: call } = await db.from("device_rpc").select("id, target_device").eq("id", id).maybeSingle();
			if (!call || call.target_device !== device.id) throw new ApiError("Request not found", 404);
			await db.from("device_rpc").update({
				status: "done",
				result: body.result ?? null,
				error: body.error ? String(body.error).slice(0, 300) : null,
				answered_at: (/* @__PURE__ */ new Date()).toISOString()
			}).eq("id", id);
			return { ok: true };
		}
		case "usage": {
			const device = await authDevice(body);
			const tier = await roomTier(device.room_id);
			const { data } = await db.from("transfers").select("size_bytes").eq("room_id", device.room_id).neq("status", "uploading");
			return {
				used: (data ?? []).reduce((n, r) => n + (Number(r.size_bytes) || 0), 0),
				files: (data ?? []).length,
				quota: TIER_LIMITS[tier].maxStorageBytesPerRoom
			};
		}
		case "rm": {
			const device = await authDevice(body);
			if (!canDeleteOrRenameFiles(await roomTier(device.room_id))) throw new ApiError("Upgrade to Extended to delete files/folders", 402, "PERMISSION_DENIED");
			const items = Array.isArray(body.items) ? body.items : [];
			if (!items.length) throw new ApiError("Nothing selected");
			logAudit(device.room_id, device.name, "File/Link", `Deleted ${items.length} item${items.length === 1 ? "" : "s"}`, "WARN");
			let removed = 0;
			for (const item of items) if (item.kind === "folder") {
				const path = normalizePath(item.path);
				if (path === "/") throw new ApiError("Cannot delete the top folder");
				const { data: files } = await db.from("transfers").select("id, storage_path").eq("room_id", device.room_id).or(`folder_path.eq.${path},folder_path.like.${path}/%`);
				const paths = (files ?? []).map((f) => f.storage_path).filter(Boolean);
				if (paths.length) await db.storage.from(BUCKET).remove(paths);
				if (files?.length) await db.from("transfers").delete().in("id", files.map((f) => f.id));
				await db.from("folders").delete().eq("room_id", device.room_id).or(`path.eq.${path},path.like.${path}/%`);
				removed++;
			} else {
				const id = String(item.id ?? "");
				const { data: t } = await db.from("transfers").select("id, room_id, storage_path").eq("id", id).maybeSingle();
				if (!t || t.room_id !== device.room_id) continue;
				if (t.storage_path) await db.storage.from(BUCKET).remove([t.storage_path]);
				await db.from("transfers").delete().eq("id", t.id);
				removed++;
			}
			return { removed };
		}
		case "cpmv": {
			const device = await authDevice(body);
			const mode = body.mode === "copy" ? "copy" : "move";
			const tier = await roomTier(device.room_id);
			if (mode === "copy" && !canEditFiles(tier)) throw new ApiError("Upgrade to Pro to copy files/folders", 402, "PERMISSION_DENIED");
			if (mode === "move" && !canDeleteOrRenameFiles(tier)) throw new ApiError("Upgrade to Extended to move (cut) files/folders", 402, "PERMISSION_DENIED");
			const dest = await ensureFolderPath(device.room_id, device.id, normalizePath(body.dest));
			const items = Array.isArray(body.items) ? body.items : [];
			if (!items.length) throw new ApiError("Nothing selected");
			logAudit(device.room_id, device.name, "File/Link", `${mode === "copy" ? "Copied" : "Moved"} ${items.length} item${items.length === 1 ? "" : "s"} to ${dest}`, "SUCCESS");
			let moved = 0;
			for (const item of items) if (item.kind === "folder") {
				const from = normalizePath(item.path);
				if (dest === from || dest.startsWith(from + "/")) throw new ApiError("Cannot put a folder inside itself");
				const name = from.split("/").filter(Boolean).pop();
				const to = dest === "/" ? `/${name}` : `${dest}/${name}`;
				if (mode === "move") {
					const { data: subs } = await db.from("folders").select("id, path, parent_path").eq("room_id", device.room_id).or(`path.eq.${from},path.like.${from}/%`);
					for (const s of subs ?? []) await db.from("folders").update({
						path: to + s.path.slice(from.length),
						parent_path: s.path === from ? dest : to + s.parent_path.slice(from.length),
						...s.path === from ? { name } : {}
					}).eq("id", s.id);
					const { data: files } = await db.from("transfers").select("id, folder_path").eq("room_id", device.room_id).or(`folder_path.eq.${from},folder_path.like.${from}/%`);
					for (const f of files ?? []) await db.from("transfers").update({ folder_path: to + f.folder_path.slice(from.length) }).eq("id", f.id);
					moved++;
				} else throw new ApiError("Copying whole folders in the room isn't supported yet — copy the files");
			} else {
				const id = String(item.id ?? "");
				const { data: t } = await db.from("transfers").select("*").eq("id", id).maybeSingle();
				if (!t || t.room_id !== device.room_id) continue;
				if (mode === "move") await db.from("transfers").update({ folder_path: dest }).eq("id", t.id);
				else {
					const storagePath = `${device.room_id}/${crypto.randomUUID()}/${t.file_name}`;
					const { error: copyErr } = await db.storage.from(BUCKET).copy(t.storage_path, storagePath);
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
						ready_at: (/* @__PURE__ */ new Date()).toISOString()
					});
				}
				moved++;
			}
			return {
				moved,
				mode,
				dest
			};
		}
		case "tree": {
			const device = await authDevice(body);
			const { data } = await db.from("folders").select("path, parent_path, name").eq("room_id", device.room_id).order("path");
			return { folders: data ?? [] };
		}
		case "control": {
			const device = await authDevice(body);
			const target = await resolveTarget(device.room_id, body.target);
			if (!target) throw new ApiError("Which device?");
			if (!target.online) throw new ApiError(`${target.name} is offline right now`, 503, "DEVICE_OFFLINE");
			const command = String(body.command ?? "");
			if (![
				"shutdown",
				"restart",
				"sleep",
				"lock",
				"logout",
				"screenLock",
				"cancelShutdown",
				"restartAgent",
				"stopAgent",
				"removeAgent",
				"flushDns",
				"getDns",
				"setDns",
				"resetDns",
				"alert",
				"rename",
				"cursorInfo",
				"cursorMove",
				"cursorClick",
				"cursorScroll",
				"keyboardType",
				"keyboardShortcut",
				"keyDown",
				"keyUp",
				"terminalCreate",
				"terminalWrite",
				"terminalRead",
				"terminalInterrupt",
				"terminalClose",
				"terminalList"
			].includes(command)) throw new ApiError("Unknown control command", 400);
			const { data: call, error } = await db.from("device_rpc").insert({
				room_id: device.room_id,
				from_device: device.id,
				target_device: target.id,
				method: "control",
				params: {
					command,
					...body.interface ? { interface: body.interface } : {},
					...body.servers ? { servers: body.servers } : {},
					...body.seconds !== void 0 ? { seconds: Number(body.seconds) || 0 } : {},
					...body.title ? { title: String(body.title).slice(0, 120) } : {},
					...body.content ? { content: String(body.content).slice(0, 2e3) } : {},
					...body.name ? { name: String(body.name).slice(0, 160) } : {},
					...body.x !== void 0 ? { x: Number(body.x) || 0 } : {},
					...body.y !== void 0 ? { y: Number(body.y) || 0 } : {},
					...body.button ? { button: String(body.button).slice(0, 10) } : {},
					...body.amount !== void 0 ? { amount: Number(body.amount) || 0 } : {},
					...body.horizontal !== void 0 ? { horizontal: Boolean(body.horizontal) } : {}
				}
			}).select("id").single();
			if (error) throw new ApiError(error.message, 500);
			const deadline = Date.now() + 2e4;
			while (Date.now() < deadline) {
				await new Promise((r) => setTimeout(r, 350));
				const { data: row } = await db.from("device_rpc").select("status, result, error").eq("id", call.id).maybeSingle();
				if (row && row.status === "done") {
					if (row.error) throw new ApiError(row.error);
					return {
						ok: true,
						result: row.result
					};
				}
			}
			await db.from("device_rpc").update({ status: "timeout" }).eq("id", call.id);
			throw new ApiError(`${target.name} did not answer in time`, 504, "TIMEOUT", true);
		}
		case "schedulePower": {
			const device = await authDevice(body);
			const target = await resolveTarget(device.room_id, body.target);
			if (!target) throw new ApiError("Which device?");
			const powerAction = String(body.powerAction ?? "");
			if (!["shutdown", "restart"].includes(powerAction)) throw new ApiError("Unsupported schedule action");
			const fireAt = String(body.fireAt ?? "");
			if (!fireAt || Number.isNaN(Date.parse(fireAt))) throw new ApiError("Missing or invalid fireAt");
			await db.from("power_schedules").update({
				status: "cancelled",
				cancelled_at: (/* @__PURE__ */ new Date()).toISOString()
			}).eq("room_id", device.room_id).eq("device_id", target.id).eq("status", "pending");
			const { data, error } = await db.from("power_schedules").insert({
				room_id: device.room_id,
				device_id: target.id,
				device_name: target.name,
				action: powerAction,
				fire_at: fireAt,
				created_by: device.id
			}).select("id, device_id, device_name, action, fire_at, status, created_at").single();
			if (error) throw new ApiError(error.message, 500);
			return { schedule: data };
		}
		case "listSchedules": {
			const device = await authDevice(body);
			const { data, error } = await db.from("power_schedules").select("id, device_id, device_name, action, fire_at, status, created_at").eq("room_id", device.room_id).eq("status", "pending").order("fire_at");
			if (error) throw new ApiError(error.message, 500);
			return { schedules: data ?? [] };
		}
		case "cancelSchedule": {
			const device = await authDevice(body);
			const id = String(body.scheduleId ?? "");
			if (!id) throw new ApiError("Missing scheduleId");
			const { error } = await db.from("power_schedules").update({
				status: "cancelled",
				cancelled_at: (/* @__PURE__ */ new Date()).toISOString()
			}).eq("id", id).eq("room_id", device.room_id);
			if (error) throw new ApiError(error.message, 500);
			return { ok: true };
		}
		case "auditList": {
			const device = await authDevice(body);
			const retentionDays = TIER_LIMITS[await roomTier(device.room_id)].auditRetentionDays;
			if (retentionDays === 0) return {
				events: [],
				upsell: "Upgrade to Pro to keep an audit trail across your devices"
			};
			let query = db.from("audit_events").select("id, device_name, category, details, status, created_at").eq("room_id", device.room_id).order("created_at", { ascending: false }).limit(500);
			if (retentionDays !== null) {
				const since = (/* @__PURE__ */ new Date(Date.now() - retentionDays * 864e5)).toISOString();
				query = query.gte("created_at", since);
			}
			const { data, error } = await query;
			if (error) throw new ApiError(error.message, 500);
			return { events: data ?? [] };
		}
		case "chatList": {
			const device = await authDevice(body);
			const { data, error } = await db.from("ai_chats").select("id, title, message_count, updated_at").eq("room_id", device.room_id).order("updated_at", { ascending: false }).limit(50);
			if (error) throw new ApiError(error.message, 500);
			return { chats: data ?? [] };
		}
		case "chatGet": {
			const device = await authDevice(body);
			const id = String(body.chatId ?? "");
			const { data, error } = await db.from("ai_chats").select("id, title, messages, updated_at").eq("id", id).eq("room_id", device.room_id).maybeSingle();
			if (error) throw new ApiError(error.message, 500);
			if (!data) throw new ApiError("Chat not found", 404);
			return { chat: data };
		}
		case "chatSave": {
			const device = await authDevice(body);
			const messages = Array.isArray(body.messages) ? body.messages.slice(-200) : [];
			if (JSON.stringify(messages).length > 15e5) throw new ApiError("This chat is too large to save", 413);
			const title = String(body.title ?? "New chat").replace(/\s+/g, " ").trim().slice(0, 80) || "New chat";
			const chatId = body.chatId ? String(body.chatId) : "";
			if (chatId) {
				const { data, error } = await db.from("ai_chats").update({
					title,
					messages,
					message_count: messages.length,
					updated_at: (/* @__PURE__ */ new Date()).toISOString()
				}).eq("id", chatId).eq("room_id", device.room_id).select("id").maybeSingle();
				if (error) throw new ApiError(error.message, 500);
				if (!data) throw new ApiError("Chat not found", 404);
				return { chatId: data.id };
			}
			const { data, error } = await db.from("ai_chats").insert({
				room_id: device.room_id,
				created_by: device.id,
				title,
				messages,
				message_count: messages.length
			}).select("id").single();
			if (error) throw new ApiError(error.message, 500);
			return { chatId: data.id };
		}
		case "chatDelete": {
			const device = await authDevice(body);
			const id = String(body.chatId ?? "");
			const { error } = await db.from("ai_chats").delete().eq("id", id).eq("room_id", device.room_id);
			if (error) throw new ApiError(error.message, 500);
			return { ok: true };
		}
		default: throw new ApiError(`Unknown action: ${action}`, 404);
	}
}
var styles_default = "/assets/styles-CbMn_FEa.css";
function reportLovableError(error, context = {}) {
	if (typeof window === "undefined") return;
	window.__lovableEvents?.captureException?.(error, {
		source: "react_error_boundary",
		route: window.location.pathname,
		...context
	}, {
		mechanism: "react_error_boundary",
		handled: false,
		severity: "error"
	});
	const message = error instanceof Response ? `Response ${error.status}${error.url ? ` at ${error.url}` : ""}` : error instanceof Error ? error.message : String(error);
	window.__lovableReportRuntimeError?.({
		message,
		stack: error instanceof Error ? error.stack : void 0,
		filename: window.location.pathname
	});
}
function NotFoundComponent() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-7xl font-bold text-foreground",
					children: "404"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-4 text-xl font-semibold text-foreground",
					children: "Page not found"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "The page you're looking for doesn't exist or has been moved."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Go home"
					})
				})
			]
		})
	});
}
function ErrorComponent({ error, reset }) {
	console.error(error);
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		reportLovableError(error, { boundary: "tanstack_root_error_component" });
	}, [error]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-semibold tracking-tight text-foreground",
					children: "This page didn't load"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "Something went wrong on our end. You can try refreshing or head back home."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex flex-wrap justify-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							router.invalidate();
							reset();
						},
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Try again"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/",
						className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
						children: "Go home"
					})]
				})
			]
		})
	});
}
var Route$5 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "FileLink — Send files PC to PC from the command prompt" },
			{
				name: "description",
				content: "Connect two PCs with one link, then send and receive files from the command prompt. Online devices get files instantly, offline devices get them from the cloud."
			},
			{
				property: "og:title",
				content: "FileLink — Send files PC to PC from the command prompt"
			},
			{
				property: "og:description",
				content: "Connect two PCs with one link, then send and receive files from the command prompt. Online devices get files instantly, offline devices get them from the cloud."
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				name: "twitter:card",
				content: "summary_large_image"
			},
			{
				name: "twitter:title",
				content: "FileLink — Send files PC to PC from the command prompt"
			},
			{
				name: "twitter:description",
				content: "Connect two PCs with one link, then send and receive files from the command prompt. Online devices get files instantly, offline devices get them from the cloud."
			},
			{
				property: "og:image",
				content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/32fba846-1a0f-45fe-a4c2-f4daf604ab06/id-preview-40fa3766--cd0040e2-f0bd-4205-8581-f0e8aec07541.lovable.app-1785434049573.png"
			},
			{
				name: "twitter:image",
				content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/32fba846-1a0f-45fe-a4c2-f4daf604ab06/id-preview-40fa3766--cd0040e2-f0bd-4205-8581-f0e8aec07541.lovable.app-1785434049573.png"
			}
		],
		links: [
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&family=Roboto+Mono:wght@400;500&display=swap"
			},
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "icon",
				href: "/favicon.ico",
				type: "image/x-icon"
			}
		]
	}),
	shellComponent: RootShell,
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent
});
function RootShell({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})] })]
	});
}
function RootComponent() {
	const { queryClient } = Route$5.useRouteContext();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryClientProvider, {
		client: queryClient,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {})
	});
}
var $$splitComponentImporter = () => import("./routes-YJlYJiVo.mjs");
var Route$4 = createFileRoute("/")({
	head: () => ({ meta: [
		{ title: "FileLink — Send files PC to PC from the command prompt" },
		{
			name: "description",
			content: "Connect two PCs with one link, then send and receive files from the command prompt. Online devices get files instantly, offline devices get them from the cloud."
		},
		{
			property: "og:title",
			content: "FileLink — Send files PC to PC from the command prompt"
		},
		{
			property: "og:description",
			content: "Connect two PCs with one link, then send and receive files from the command prompt. Online devices get files instantly, offline devices get them from the cloud."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
var AI_TOOLS = [
	{
		name: "web_search",
		description: "Search the web for information. Returns a list of results with title, URL, snippet, and date. Use this when the user asks you to look something up or find recent information.",
		input_schema: {
			type: "object",
			properties: {
				query: {
					type: "string",
					description: "The search query"
				},
				numResults: {
					type: "number",
					description: "Number of results to return (default: 8, max: 20)"
				}
			},
			required: ["query"]
		}
	},
	{
		name: "fetch_url",
		description: "Fetch and read the content of a web page URL. Use after web_search when the user selects a result to analyze.",
		input_schema: {
			type: "object",
			properties: {
				url: {
					type: "string",
					description: "The URL to fetch"
				},
				maxChars: {
					type: "number",
					description: "Maximum characters to return (default: 8000). Larger pages are truncated."
				}
			},
			required: ["url"]
		}
	},
	{
		name: "get_devices",
		description: "List all devices in the room with their online/offline status, platform, and capabilities",
		input_schema: {
			type: "object",
			properties: {},
			required: []
		}
	},
	{
		name: "get_device_info",
		description: "Get detailed system information from a specific device (OS, CPU, RAM, disk, network, uptime). Call at most ONCE per conversation — skip if already in context.",
		input_schema: {
			type: "object",
			properties: { device: {
				type: "string",
				description: "Device name or ID"
			} },
			required: ["device"]
		}
	},
	{
		name: "get_processes",
		description: "Get list of running processes on a device with CPU/memory usage",
		input_schema: {
			type: "object",
			properties: { device: {
				type: "string",
				description: "Device name or ID"
			} },
			required: ["device"]
		}
	},
	{
		name: "get_disk_usage",
		description: "Get disk/drive usage information from a device",
		input_schema: {
			type: "object",
			properties: { device: {
				type: "string",
				description: "Device name or ID"
			} },
			required: ["device"]
		}
	},
	{
		name: "list_files",
		description: "List files and directories on a device at a specific path",
		input_schema: {
			type: "object",
			properties: {
				device: {
					type: "string",
					description: "Device name or ID"
				},
				path: {
					type: "string",
					description: "Directory path to list"
				}
			},
			required: ["device", "path"]
		}
	},
	{
		name: "search_files",
		description: "Search for files by name pattern on a device",
		input_schema: {
			type: "object",
			properties: {
				device: {
					type: "string",
					description: "Device name or ID"
				},
				path: {
					type: "string",
					description: "Starting directory path"
				},
				pattern: {
					type: "string",
					description: "File name pattern to search for"
				}
			},
			required: [
				"device",
				"path",
				"pattern"
			]
		}
	},
	{
		name: "read_text",
		description: "Read a file as UTF-8 text from a device. Use to inspect source code, configs, logs, etc. Returns text content directly. Secrets are automatically redacted.",
		input_schema: {
			type: "object",
			properties: {
				device: {
					type: "string",
					description: "Device name or ID"
				},
				path: {
					type: "string",
					description: "File path to read"
				},
				maxBytes: {
					type: "number",
					description: "Maximum bytes to read (default: 100000)"
				}
			},
			required: ["device", "path"]
		}
	},
	{
		name: "write_text",
		description: "Write UTF-8 text content to a file on a device. Creates or overwrites the file.",
		input_schema: {
			type: "object",
			properties: {
				device: {
					type: "string",
					description: "Device name or ID"
				},
				path: {
					type: "string",
					description: "File path relative to device root"
				},
				content: {
					type: "string",
					description: "UTF-8 text content to write"
				},
				reason: {
					type: "string",
					description: "Why this file is being written"
				}
			},
			required: [
				"device",
				"path",
				"content",
				"reason"
			]
		}
	},
	{
		name: "edit_file",
		description: "Find and replace a specific piece of text in a file on a device. Precise surgical edits.",
		input_schema: {
			type: "object",
			properties: {
				device: {
					type: "string",
					description: "Device name or ID"
				},
				path: {
					type: "string",
					description: "File path to edit"
				},
				old_text: {
					type: "string",
					description: "Exact text to find and replace"
				},
				new_text: {
					type: "string",
					description: "Text to replace it with"
				}
			},
			required: [
				"device",
				"path",
				"old_text",
				"new_text"
			]
		}
	},
	{
		name: "create_file",
		description: "Create a new file with text content on a device. Creates parent directories automatically.",
		input_schema: {
			type: "object",
			properties: {
				device: {
					type: "string",
					description: "Device name or ID"
				},
				path: {
					type: "string",
					description: "File path to create"
				},
				content: {
					type: "string",
					description: "UTF-8 text content for the new file"
				}
			},
			required: [
				"device",
				"path",
				"content"
			]
		}
	},
	{
		name: "create_directory",
		description: "Create a directory on a device (like mkdir -p)",
		input_schema: {
			type: "object",
			properties: {
				device: {
					type: "string",
					description: "Device name or ID"
				},
				path: {
					type: "string",
					description: "Directory path to create"
				}
			},
			required: ["device", "path"]
		}
	},
	{
		name: "run_command",
		description: "Execute a shell command on a device. Streams live output. Requires admin tier for admin commands.",
		input_schema: {
			type: "object",
			properties: {
				device: {
					type: "string",
					description: "Device name or ID"
				},
				command: {
					type: "string",
					description: "Command to execute"
				},
				workingDirectory: {
					type: "string",
					description: "Working directory for the command"
				},
				timeout: {
					type: "number",
					description: "Timeout in milliseconds (default: 120000)"
				},
				reason: {
					type: "string",
					description: "Why this command is being run"
				},
				riskLevel: {
					type: "string",
					enum: [
						"safe",
						"low",
						"medium",
						"high",
						"critical"
					],
					description: "Risk level of this command"
				}
			},
			required: [
				"device",
				"command",
				"reason",
				"riskLevel"
			]
		}
	},
	{
		name: "terminal_create",
		description: "Create a named background terminal session on a device (PowerShell, CMD, etc.)",
		input_schema: {
			type: "object",
			properties: {
				device: {
					type: "string",
					description: "Device name or ID"
				},
				shell: {
					type: "string",
					enum: [
						"powershell",
						"cmd",
						"bash"
					],
					description: "Shell type (default: powershell on Windows)"
				},
				name: {
					type: "string",
					description: "Human-readable terminal name"
				}
			},
			required: ["device"]
		}
	},
	{
		name: "terminal_write",
		description: "Send input to an existing terminal session",
		input_schema: {
			type: "object",
			properties: {
				device: {
					type: "string",
					description: "Device name or ID"
				},
				terminalId: {
					type: "string",
					description: "Terminal session ID"
				},
				input: {
					type: "string",
					description: "Input text to send"
				}
			},
			required: [
				"device",
				"terminalId",
				"input"
			]
		}
	},
	{
		name: "terminal_read",
		description: "Read pending output from a terminal session",
		input_schema: {
			type: "object",
			properties: {
				device: {
					type: "string",
					description: "Device name or ID"
				},
				terminalId: {
					type: "string",
					description: "Terminal session ID"
				}
			},
			required: ["device", "terminalId"]
		}
	},
	{
		name: "take_screenshot",
		description: "Capture a screenshot from a device's screen. Returns base64 JPEG.",
		input_schema: {
			type: "object",
			properties: {
				device: {
					type: "string",
					description: "Device name or ID"
				},
				monitor: {
					type: "number",
					description: "Monitor index (0 = primary, default: 0)"
				}
			},
			required: ["device"]
		}
	},
	{
		name: "clipboard_read",
		description: "Read the current clipboard content from a device",
		input_schema: {
			type: "object",
			properties: { device: {
				type: "string",
				description: "Device name or ID"
			} },
			required: ["device"]
		}
	},
	{
		name: "clipboard_write",
		description: "Write text to the clipboard on a device",
		input_schema: {
			type: "object",
			properties: {
				device: {
					type: "string",
					description: "Device name or ID"
				},
				text: {
					type: "string",
					description: "Text to write to clipboard"
				},
				reason: {
					type: "string",
					description: "Why the clipboard is being set"
				}
			},
			required: [
				"device",
				"text",
				"reason"
			]
		}
	},
	{
		name: "input_mouse",
		description: "Move the mouse cursor or click on a device. All coordinates are in virtual desktop pixels.",
		input_schema: {
			type: "object",
			properties: {
				device: {
					type: "string",
					description: "Device name or ID"
				},
				action: {
					type: "string",
					enum: [
						"move",
						"click",
						"double_click",
						"right_click",
						"scroll"
					],
					description: "Mouse action to perform"
				},
				x: {
					type: "number",
					description: "X coordinate"
				},
				y: {
					type: "number",
					description: "Y coordinate"
				},
				button: {
					type: "string",
					enum: [
						"left",
						"right",
						"middle"
					],
					description: "Mouse button (default: left)"
				},
				amount: {
					type: "number",
					description: "Scroll amount (positive = down, negative = up)"
				}
			},
			required: [
				"device",
				"action",
				"x",
				"y"
			]
		}
	},
	{
		name: "input_keyboard",
		description: "Type text or send key combinations on a device. Use for keyboard shortcuts or text input.",
		input_schema: {
			type: "object",
			properties: {
				device: {
					type: "string",
					description: "Device name or ID"
				},
				action: {
					type: "string",
					enum: [
						"type",
						"shortcut",
						"keydown",
						"keyup"
					],
					description: "Keyboard action: 'type' sends text, 'shortcut' sends key combination like 'ctrl+c'"
				},
				text: {
					type: "string",
					description: "Text to type or key combination (e.g. 'ctrl+c', 'win+d')"
				}
			},
			required: [
				"device",
				"action",
				"text"
			]
		}
	},
	{
		name: "power_action",
		description: "Perform a power management action on a device (shutdown, restart, sleep, lock, logout). Always requires confirmation.",
		input_schema: {
			type: "object",
			properties: {
				device: {
					type: "string",
					description: "Device name or ID"
				},
				action: {
					type: "string",
					enum: [
						"shutdown",
						"restart",
						"sleep",
						"lock",
						"logout",
						"cancelShutdown"
					],
					description: "Power action to perform"
				},
				delaySeconds: {
					type: "number",
					description: "Delay before action in seconds (default: 0)"
				}
			},
			required: ["device", "action"]
		}
	},
	{
		name: "show_alert",
		description: "Pop up a message box on a device's screen (a notification). kind picks the icon: info, warning or error. Does not wait for an answer.",
		input_schema: {
			type: "object",
			properties: {
				device: {
					type: "string",
					description: "Device name or ID"
				},
				title: {
					type: "string",
					description: "Box title"
				},
				content: {
					type: "string",
					description: "Message text"
				},
				kind: {
					type: "string",
					enum: [
						"info",
						"warning",
						"error"
					],
					description: "Icon (default info)"
				}
			},
			required: ["device", "content"]
		}
	},
	{
		name: "transfer_file",
		description: "Transfer a file from one device to another through FileLink",
		input_schema: {
			type: "object",
			properties: {
				fromDevice: {
					type: "string",
					description: "Source device name or ID"
				},
				toDevice: {
					type: "string",
					description: "Target device name or ID"
				},
				sourcePath: {
					type: "string",
					description: "Source file path"
				},
				destinationPath: {
					type: "string",
					description: "Destination directory path"
				}
			},
			required: [
				"fromDevice",
				"toDevice",
				"sourcePath",
				"destinationPath"
			]
		}
	},
	{
		name: "ask_user",
		description: "Ask the user to choose between options and WAIT for their answer. Use it whenever a request is ambiguous instead of guessing — e.g. several files match the name they gave, several devices could be meant, or they didn't say which folder. Each option's `value` is sent back to you verbatim when picked, so put the exact thing you need there (a full file path, a device name). When names collide, put the full path in `description` so the user can tell them apart. Do not call any other tool in the same turn.",
		input_schema: {
			type: "object",
			properties: {
				question: {
					type: "string",
					description: "Short question shown above the options, e.g. 'Which report.docx do you mean?'"
				},
				options: {
					type: "array",
					description: "2 to 12 options to choose from",
					items: {
						type: "object",
						properties: {
							label: {
								type: "string",
								description: "Main text, e.g. the file name"
							},
							description: {
								type: "string",
								description: "Second line, e.g. the full path or device name"
							},
							value: {
								type: "string",
								description: "Exact text returned to you when picked (defaults to label)"
							},
							kind: {
								type: "string",
								enum: [
									"file",
									"folder",
									"device",
									"generic"
								],
								description: "Icon to show"
							}
						},
						required: ["label"]
					}
				},
				multi: {
					type: "boolean",
					description: "Allow picking several options (default false)"
				},
				allowOther: {
					type: "boolean",
					description: "Also show a free-text box for an answer that isn't listed"
				}
			},
			required: ["question", "options"]
		}
	},
	{
		name: "request_confirmation",
		description: "Ask the user to approve a risky or irreversible action and WAIT for Approve/Cancel. Call this before power actions, deleting files, killing processes, or system-level changes. Describe exactly what will happen in `question` and put device/path/command in `details`. Do not call any other tool in the same turn; the user's answer arrives as their next message.",
		input_schema: {
			type: "object",
			properties: {
				question: {
					type: "string",
					description: "Clear question to ask the user"
				},
				riskLevel: {
					type: "string",
					enum: [
						"safe",
						"low",
						"medium",
						"high",
						"critical"
					],
					description: "Risk level of the action"
				},
				details: {
					type: "object",
					description: "Additional details about the action (device, file, command, etc.)"
				}
			},
			required: ["question", "riskLevel"]
		}
	},
	{
		name: "queue_offline_task",
		description: "Queue a task to run when an offline device comes online",
		input_schema: {
			type: "object",
			properties: {
				device: {
					type: "string",
					description: "Offline device name or ID"
				},
				action: {
					type: "string",
					description: "Description of the action to perform"
				},
				requiresConfirmation: {
					type: "boolean",
					description: "Whether to ask for confirmation when the device comes online"
				}
			},
			required: ["device", "action"]
		}
	}
];
var FILELINK_AI_SYSTEM_PROMPT = `You are FileLink AI, an intelligent device-management assistant built into the FileLink remote management platform.

## THREE OPERATING MODES

### MODE A — Normal Q&A
Answer the user's question directly from your knowledge. No device access needed.
Use this for: how-to questions, explanations, general help, advice.

### MODE B — Web Research
When the user asks you to search the web, look something up, or find recent information:
1. Call web_search with the query
2. Show the results list (title, domain, snippet, date)
3. Explain what was found
4. If the user selects a result or asks for more detail, call fetch_url on that result
5. Analyze the content and answer with source attribution

### MODE C — PC Action
When the user wants to do something on a connected device:
1. Use ONLY the device(s) currently selected by the user
2. Call ONE tool at a time — never chain tools without responding first
3. After EVERY tool result, provide a text response before calling another tool
4. For risky/destructive/irreversible actions: call request_confirmation first
5. Maximum 10 tool calls per task

## ASKING THE USER (never guess)
You have two tools that pause and wait for the person: ask_user and request_confirmation.
- AMBIGUOUS FILE / DEVICE / FOLDER: if the user names a file ("delete report.docx") run search_files or list_files FIRST. If MORE THAN ONE result shares that name, or nothing is clearly the right one, call ask_user: one option per result, label = file name, description = the FULL PATH (so same-named files in different folders can be told apart), value = the full path, kind = "file". Never pick one yourself.
- MISSING INFORMATION: if you don't know which device, folder, or setting they mean, call ask_user instead of assuming.
- If you do not know how to do something on this PC, say so or ask — never invent commands or paths.
- RISKY ACTIONS (deleting files, killing processes, power, system changes): call request_confirmation, describing exactly what will happen (device, full path/command). The person approves with a button; their answer arrives as their next message starting with "✅ Approved". Only after that message, make the action's tool call. Anything risky you try without approval is blocked by the system anyway.
- When you call ask_user or request_confirmation, call NO other tool in that turn and keep your text to one short line.
- When the user answers an ask_user card, their message is the option's value (e.g. a full path) — use it exactly.

## WHAT THE USER ALREADY SEES
File lists, the task table (grouped Apps / Browsers / Windows / Background, with icons) and screenshots are shown to the person in rich cards automatically when you call list_files, search_files, get_processes and take_screenshot. Do NOT repeat the whole list or table in your reply — give a short summary or answer the question. You cannot see screenshot pixels; never describe a screenshot's contents.

## EXECUTION RULES (MODE C)

CORRECT PATTERN:
  User asks → call one tool → receive result → respond with text → (if more needed) call next tool

WRONG PATTERN (NEVER DO):
  User asks → call tool → receive result → immediately call another tool [NO TEXT RESPONSE]

TOOL SELECTION:
- system info / OS / hardware → get_device_info (call ONCE, skip if already in conversation)
- running processes → get_processes
- file listing → list_files
- file content → read_text
- shell command → run_command
- create/overwrite file → write_text or create_file
- surgical file edit → edit_file
- screenshot → take_screenshot
- disk usage → get_disk_usage
- clipboard read/write → clipboard_read / clipboard_write
- mouse/keyboard → input_mouse / input_keyboard
- power control → power_action (requires confirmation)
- show a pop-up message on a PC → show_alert (kind: info / warning / error)
- terminal session → terminal_create / terminal_write / terminal_read

CRITICAL RULES:
- Never fabricate command output, file contents, or device status
- Never call the same tool twice with the same inputs unless it failed
- Never log or expose passwords, tokens, API keys from device output
- Never execute destructive commands (rm -rf, format, delete system files) without explicit confirmation
- Redact any credentials or secrets that appear in output: replace with [REDACTED]
- Camera/microphone access must be explicitly requested by the user, never initiated automatically

## TOOL RESULT PROTOCOL
After receiving ANY tool result:
1. Read and analyze it
2. Write a concise text response to the user answering their question
3. If task is done: STOP (do not call more tools just to "verify")
4. If more steps genuinely needed: explain what you found, then call the next tool

## ERROR HANDLING
When a command fails:
1. Read the error carefully
2. Diagnose the root cause
3. Attempt a fix (at most 3 retries with different approaches)
4. If unresolvable: report to user with clear explanation and ask for guidance

## RESPONSE FORMAT
- Be concise and technical
- Use ✓ for success, ✗ for failure, ℹ for information
- Bold important values with **value**
- Code blocks for output/commands/paths
- Never say "I'll now..." without actually doing it
`;
function formatMessagesForAnthropic(messages) {
	const formatted = [];
	const toolUseIdMap = /* @__PURE__ */ new Map();
	for (const m of messages) if (m.role === "assistant") {
		const toolCall = m.tool_call;
		if (toolCall?.id && toolCall.name) {
			toolUseIdMap.set(m.id, toolCall.id);
			const blocks = [];
			if (m.content) blocks.push({
				type: "text",
				text: m.content
			});
			blocks.push({
				type: "tool_use",
				id: toolCall.id,
				name: toolCall.name,
				input: toolCall.input ?? {}
			});
			formatted.push({
				role: "assistant",
				content: blocks
			});
		} else formatted.push({
			role: "assistant",
			content: m.content || ""
		});
	} else if (m.role === "tool") {
		const toolUseId = m.tool_call?.id || m.tool_name || "tool_call";
		formatted.push({
			role: "user",
			content: [{
				type: "tool_result",
				tool_use_id: toolUseId,
				content: m.content
			}]
		});
	} else formatted.push({
		role: "user",
		content: m.content
	});
	const merged = [];
	for (const msg of formatted) {
		const prev = merged[merged.length - 1];
		if (prev && prev.role === msg.role) {
			if (typeof prev.content === "string" && typeof msg.content === "string") prev.content = prev.content + "\n" + msg.content;
			else {
				const prevArr = Array.isArray(prev.content) ? prev.content : [{
					type: "text",
					text: prev.content
				}];
				const msgArr = Array.isArray(msg.content) ? msg.content : [{
					type: "text",
					text: msg.content
				}];
				prev.content = [...prevArr, ...msgArr];
			}
		} else merged.push({ ...msg });
	}
	return merged;
}
async function callAnthropic(config, messages, tools, systemPrompt = FILELINK_AI_SYSTEM_PROMPT) {
	const model = config.model || processModule.env.AI_MODEL || processModule.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";
	const formattedMessages = formatMessagesForAnthropic(messages);
	const formattedTools = tools.map((t) => ({
		name: t.name,
		description: t.description,
		input_schema: t.input_schema
	}));
	const payload = {
		model,
		max_tokens: config.maxTokens || 8192,
		system: systemPrompt,
		messages: formattedMessages
	};
	if (formattedTools.length > 0) payload.tools = formattedTools;
	const baseUrl = processModule.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com";
	const authToken = processModule.env.ANTHROPIC_AUTH_TOKEN;
	const headers = {
		"Content-Type": "application/json",
		"anthropic-version": "2023-06-01"
	};
	if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
	else headers["x-api-key"] = config.apiKey;
	const fullUrl = `${baseUrl}/v1/messages`;
	console.log("[Anthropic] Making request to:", fullUrl, "model:", model);
	const res = await fetch(fullUrl, {
		method: "POST",
		headers,
		body: JSON.stringify(payload)
	});
	if (!res.ok) {
		const errorText = await res.text();
		throw new Error(`Anthropic API error (${res.status}): ${errorText}`);
	}
	return await res.json();
}
async function callOpenAI(config, messages, tools, systemPrompt = FILELINK_AI_SYSTEM_PROMPT) {
	const model = config.model || processModule.env.AI_MODEL || processModule.env.OPENAI_MODEL || "gpt-4o";
	const formattedMessages = [{
		role: "system",
		content: systemPrompt
	}, ...messages.map((m) => ({
		role: m.role === "tool" ? "assistant" : m.role,
		content: m.content,
		...m.tool_call ? { tool_calls: [m.tool_call] } : {}
	}))];
	const formattedTools = tools.map((t) => ({
		type: "function",
		function: {
			name: t.name,
			description: t.description,
			parameters: t.input_schema
		}
	}));
	const payload = {
		model,
		max_tokens: config.maxTokens || 4096,
		messages: formattedMessages
	};
	if (formattedTools.length > 0) {
		payload.tools = formattedTools;
		payload.tool_choice = "auto";
	}
	const res = await fetch("https://api.openai.com/v1/chat/completions", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${config.apiKey}`
		},
		body: JSON.stringify(payload)
	});
	if (!res.ok) {
		const errorText = await res.text();
		throw new Error(`OpenAI API error (${res.status}): ${errorText}`);
	}
	return await res.json();
}
var taskCaches = /* @__PURE__ */ new Map();
var CACHE_TTL = 3e5;
/**
* Get cached device info if available and not expired
*/
function getCachedDeviceInfo(taskId, device) {
	const taskCache = taskCaches.get(taskId);
	if (!taskCache) return null;
	const cached = taskCache.get(device);
	if (!cached) return null;
	if (Date.now() > cached.expiresAt) {
		taskCache.delete(device);
		return null;
	}
	console.log(`[AI Cache] HIT for device ${device} in task ${taskId}`);
	return cached.info;
}
/**
* Store device info in cache
*/
function setCachedDeviceInfo(taskId, device, info) {
	let taskCache = taskCaches.get(taskId);
	if (!taskCache) {
		taskCache = /* @__PURE__ */ new Map();
		taskCaches.set(taskId, taskCache);
	}
	const now = Date.now();
	taskCache.set(device, {
		device,
		info,
		timestamp: now,
		expiresAt: now + CACHE_TTL
	});
	console.log(`[AI Cache] STORED device ${device} in task ${taskId}`);
}
/**
* Build device context string from cache
* This is injected into the system prompt so the AI doesn't need to call get_device_info again
*/
function buildDeviceContext(taskId, devices) {
	const taskCache = taskCaches.get(taskId);
	if (!taskCache || taskCache.size === 0) return "";
	const cachedDevices = [];
	for (const device of devices) {
		const cached = getCachedDeviceInfo(taskId, device);
		if (cached) cachedDevices.push(`## Device: ${device}\n${JSON.stringify(cached, null, 2)}`);
	}
	if (cachedDevices.length === 0) return "";
	return `\n\n---\nDEVICE INFORMATION CACHE (already fetched, do not call get_device_info again):\n${cachedDevices.join("\n\n")}\n---\n`;
}
/**
* Clear cache for a task (call when task completes)
*/
function clearTaskCache(taskId) {
	taskCaches.delete(taskId);
	console.log(`[AI Cache] CLEARED task ${taskId}`);
}
/**
* Clear all expired caches (periodic cleanup)
*/
function cleanupExpiredCaches() {
	const now = Date.now();
	let cleared = 0;
	for (const [taskId, taskCache] of taskCaches.entries()) {
		for (const [device, cached] of taskCache.entries()) if (now > cached.expiresAt) {
			taskCache.delete(device);
			cleared++;
		}
		if (taskCache.size === 0) taskCaches.delete(taskId);
	}
	if (cleared > 0) console.log(`[AI Cache] Cleaned up ${cleared} expired entries`);
}
setInterval(cleanupExpiredCaches, 6e4);
/** Get AI provider configuration from environment */
function getAIConfig() {
	const provider = processModule.env.AI_PROVIDER || "anthropic";
	if (provider === "anthropic") {
		const apiKey = processModule.env.ANTHROPIC_API_KEY || "";
		const authToken = processModule.env.ANTHROPIC_AUTH_TOKEN;
		if (!apiKey && !authToken) throw new Error("Missing API key for anthropic. Set ANTHROPIC_API_KEY or ANTHROPIC_AUTH_TOKEN (for Omniroute).");
		return {
			provider,
			apiKey
		};
	} else {
		const apiKey = processModule.env.OPENAI_API_KEY;
		if (!apiKey) throw new Error("Missing API key for openai. Set OPENAI_API_KEY.");
		return {
			provider,
			apiKey
		};
	}
}
/** Execute a single AI inference with optional tool calling support */
async function runAIInference(messages, availableTools = AI_TOOLS, systemPrompt = FILELINK_AI_SYSTEM_PROMPT) {
	const { provider, apiKey } = getAIConfig();
	console.log("[AI Orchestrator] Running inference:", {
		provider,
		model: processModule.env.ANTHROPIC_MODEL || processModule.env.AI_MODEL || "claude-sonnet-5-5",
		messagesCount: messages.length,
		toolsCount: availableTools.length
	});
	try {
		if (provider === "anthropic") {
			const result = await callAnthropic({ apiKey }, messages, availableTools, systemPrompt);
			console.log("[AI Orchestrator] Anthropic response:", {
				contentBlocks: result.content?.length,
				stopReason: result.stop_reason
			});
			const content = result.content.filter((c) => c.type === "text").map((c) => c.text).join("\n");
			const toolCalls = result.content.filter((c) => c.type === "tool_use").map((c) => ({
				id: c.id,
				name: c.name,
				input: c.input
			}));
			return {
				role: "assistant",
				content: redactSecrets(content),
				toolCalls: toolCalls.length > 0 ? toolCalls : void 0
			};
		} else {
			const message = (await callOpenAI({ apiKey }, messages, availableTools, systemPrompt)).choices[0]?.message;
			if (!message) throw new Error("No response from OpenAI");
			const toolCalls = message.tool_calls?.map((tc) => ({
				id: tc.id,
				name: tc.function.name,
				input: JSON.parse(tc.function.arguments)
			}));
			return {
				role: "assistant",
				content: redactSecrets(message.content || ""),
				toolCalls
			};
		}
	} catch (error) {
		throw new Error(`AI inference failed: ${error instanceof Error ? error.message : String(error)}`);
	}
}
/** Turn a stored UI card into one line of text the model can read, so that
* on the next turn it knows what the person was shown / what they picked from. */
function describeUiForModel(ui) {
	if (!ui?.length) return "";
	const lines = [];
	for (const p of ui) if (p.kind === "choices") lines.push(`[Options shown to the user for "${p.question}": ` + p.options.map((o, i) => `${i + 1}) ${o.label}${o.description ? ` (${o.description})` : ""} -> ${o.value}`).join("; ") + "]");
	else if (p.kind === "confirm") {
		const d = p.details ? " " + Object.entries(p.details).map(([k, v]) => `${k}: ${v}`).join("; ") : "";
		lines.push(`[Awaiting the user's approval: ${p.question}${d}]`);
	}
	return lines.join("\n");
}
/** What the model sees: message text plus a note about any question cards. */
function toModelMessages(messages) {
	return messages.map((m) => {
		if (m.role !== "assistant" || !m.ui?.length) return m;
		const note = describeUiForModel(m.ui);
		if (!note) return m;
		return {
			...m,
			content: m.content ? `${m.content}\n${note}` : note
		};
	});
}
function normaliseRisk(v) {
	const r = String(v ?? "medium");
	return [
		"safe",
		"low",
		"medium",
		"high",
		"critical"
	].includes(r) ? r : "medium";
}
/** Build a validated choices card from the model's ask_user input. */
function buildChoices(input) {
	const options = (Array.isArray(input.options) ? input.options : []).filter((o) => o && typeof o.label === "string" && String(o.label).trim()).slice(0, 12).map((o, i) => {
		const label = String(o.label).trim();
		const kind = String(o.kind ?? "generic");
		return {
			id: `opt-${i}`,
			label,
			description: o.description ? String(o.description) : void 0,
			value: o.value ? String(o.value) : label,
			kind: [
				"file",
				"folder",
				"device",
				"generic"
			].includes(kind) ? kind : "generic"
		};
	});
	if (options.length === 0) return null;
	return {
		kind: "choices",
		question: String(input.question ?? "Which one?"),
		options,
		multi: Boolean(input.multi),
		allowOther: Boolean(input.allowOther)
	};
}
/**
* Main AI conversation loop with tool execution.
* Called by the API route; coordinates the full AI conversation flow.
*
* Rules enforced here:
* - max 10 tool calls per task
* - no duplicate tool calls (same name + same input, across all iterations)
* - ONE tool call per model turn (keeps tool_use / tool_result pairs valid)
* - ask_user / request_confirmation END the turn with a card; the person's
*   answer arrives as their next message
* - risky tool calls (deletes, process kills, power, high-risk commands) are
*   never executed until the person has pressed Approve — enforced here,
*   not just requested in the prompt
*/
async function executeAITask(context, userMessage, onToolCall, deviceContext) {
	const messages = [...context.conversationHistory, {
		id: crypto.randomUUID(),
		task_id: context.taskId,
		role: "user",
		content: userMessage,
		tool_name: null,
		tool_call: null,
		created_at: (/* @__PURE__ */ new Date()).toISOString()
	}];
	const devicesInConversation = extractDevicesFromHistory(messages);
	const cachedDeviceContext = buildDeviceContext(context.taskId, devicesInConversation);
	const systemPrompt = FILELINK_AI_SYSTEM_PROMPT + (deviceContext || "") + cachedDeviceContext;
	let approvalAvailable = userMessage.startsWith(APPROVAL_PREFIX);
	const executedToolSigs = /* @__PURE__ */ new Set();
	let toolExecutionCount = 0;
	const MAX_TOOL_CALLS = 10;
	const MAX_ITERATIONS = 12;
	const endTurnWithCard = (assistantMsg, card, fallbackText) => {
		assistantMsg.tool_call = null;
		assistantMsg.content = assistantMsg.content || fallbackText;
		assistantMsg.ui = [...assistantMsg.ui ?? [], card];
	};
	for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
		const response = await runAIInference(toModelMessages(messages), AI_TOOLS, systemPrompt);
		const assistantMsg = {
			id: crypto.randomUUID(),
			task_id: context.taskId,
			role: "assistant",
			content: response.content,
			tool_name: null,
			tool_call: null,
			created_at: (/* @__PURE__ */ new Date()).toISOString()
		};
		messages.push(assistantMsg);
		if (!response.toolCalls || response.toolCalls.length === 0) {
			console.log("[AI Orchestrator] No tool calls, conversation complete");
			clearTaskCache(context.taskId);
			break;
		}
		console.log(`[AI Orchestrator] Iteration ${iteration + 1}: ${response.toolCalls.length} tool call(s):`, response.toolCalls.map((tc) => tc.name));
		const uniqueToolCalls = response.toolCalls.filter((tc) => {
			const sig = JSON.stringify({
				name: tc.name,
				input: tc.input
			});
			if (executedToolSigs.has(sig)) {
				console.log(`[AI Orchestrator] Skipping duplicate: ${tc.name}`);
				return false;
			}
			executedToolSigs.add(sig);
			return true;
		});
		if (uniqueToolCalls.length === 0) {
			console.log("[AI Orchestrator] All tool calls were duplicates, stopping");
			break;
		}
		if (toolExecutionCount >= MAX_TOOL_CALLS) {
			console.log("[AI Orchestrator] Tool call limit reached, stopping");
			messages.push({
				id: crypto.randomUUID(),
				task_id: context.taskId,
				role: "assistant",
				content: "I've reached the maximum number of actions for this task. Please start a new message if more work is needed.",
				tool_name: null,
				tool_call: null,
				created_at: (/* @__PURE__ */ new Date()).toISOString()
			});
			break;
		}
		const toolCall = uniqueToolCalls[0];
		if (toolCall.name === "ask_user") {
			const card = buildChoices(toolCall.input);
			if (card) {
				endTurnWithCard(assistantMsg, card, "");
				clearTaskCache(context.taskId);
				break;
			}
			messages.pop();
			messages.push({
				...assistantMsg,
				tool_call: {
					id: toolCall.id,
					name: toolCall.name,
					input: toolCall.input
				}
			});
			messages.push({
				id: crypto.randomUUID(),
				task_id: context.taskId,
				role: "tool",
				content: "Error: ask_user needs a question and at least one option with a label.",
				tool_name: toolCall.name,
				tool_call: { id: toolCall.id },
				created_at: (/* @__PURE__ */ new Date()).toISOString()
			});
			continue;
		}
		if (toolCall.name === "request_confirmation") {
			const details = {};
			const rawDetails = toolCall.input.details;
			if (rawDetails && typeof rawDetails === "object") for (const [k, v] of Object.entries(rawDetails)) details[k] = typeof v === "string" ? v : JSON.stringify(v);
			endTurnWithCard(assistantMsg, {
				kind: "confirm",
				question: String(toolCall.input.question ?? "Do you want to proceed?"),
				risk: normaliseRisk(toolCall.input.riskLevel),
				details: Object.keys(details).length ? details : void 0
			}, "");
			clearTaskCache(context.taskId);
			break;
		}
		const gate = confirmationNeeded(toolCall.name, toolCall.input);
		if (gate) {
			if (approvalAvailable) approvalAvailable = false;
			else {
				endTurnWithCard(assistantMsg, {
					kind: "confirm",
					question: gate.reason,
					risk: gate.risk,
					details: gate.details
				}, "This needs your approval before I run it.");
				clearTaskCache(context.taskId);
				break;
			}
		}
		if (!onToolCall) throw new Error("Tool call handler not provided");
		assistantMsg.tool_call = {
			id: toolCall.id,
			name: toolCall.name,
			input: toolCall.input
		};
		let result;
		try {
			result = await onToolCall(toolCall.name, toolCall.id, toolCall.input);
			toolExecutionCount++;
			console.log(`[AI Orchestrator] Tool ${toolCall.name} completed (${toolExecutionCount}/${MAX_TOOL_CALLS})`);
		} catch (error) {
			result = `Error: ${error instanceof Error ? error.message : String(error)}`;
			console.log(`[AI Orchestrator] Tool ${toolCall.name} failed:`, error);
		}
		messages.push({
			id: crypto.randomUUID(),
			task_id: context.taskId,
			role: "tool",
			content: result,
			tool_name: toolCall.name,
			tool_call: { id: toolCall.id },
			created_at: (/* @__PURE__ */ new Date()).toISOString()
		});
	}
	return messages;
}
/** Extract device names/IDs referenced in previous tool calls */
function extractDevicesFromHistory(messages) {
	const devices = /* @__PURE__ */ new Set();
	for (const msg of messages) if (msg.tool_call && typeof msg.tool_call === "object") {
		const tc = msg.tool_call;
		if (tc.input?.device) devices.add(tc.input.device);
	}
	return Array.from(devices);
}
/** RPC replies arrive wrapped as { device, result }. Unwrap defensively. */
function unwrap(reply) {
	const r = reply;
	return (r && typeof r === "object" && "result" in r ? r.result : reply) ?? {};
}
var MAX_FILES_IN_MODEL_TEXT = 200;
var MAX_PROCESSES_IN_MODEL_TEXT = 40;
/** Simple web fetcher — strips HTML to readable text */
async function fetchWebPage(url, maxChars = 8e3) {
	try {
		const res = await fetch(url, {
			headers: {
				"User-Agent": "FileLink-AI/1.0",
				Accept: "text/html,application/json"
			},
			signal: AbortSignal.timeout(1e4)
		});
		if (!res.ok) return `HTTP ${res.status}: ${res.statusText}`;
		const contentType = res.headers.get("content-type") ?? "";
		const text = await res.text();
		if (contentType.includes("json")) return text.slice(0, maxChars);
		return text.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, maxChars);
	} catch (err) {
		return `Failed to fetch ${url}: ${err instanceof Error ? err.message : String(err)}`;
	}
}
/** Lightweight web search via DuckDuckGo Instant Answer API (no key required) */
async function webSearch(query, numResults = 8) {
	try {
		const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1&no_html=1&skip_disambig=1`;
		const res = await fetch(url, {
			headers: { "User-Agent": "FileLink-AI/1.0" },
			signal: AbortSignal.timeout(1e4)
		});
		if (!res.ok) return `Search failed: HTTP ${res.status}`;
		const data = await res.json();
		const results = [];
		if (data.AbstractText && data.AbstractURL) results.push({
			title: "Featured answer",
			url: data.AbstractURL,
			snippet: data.AbstractText.slice(0, 300)
		});
		for (const t of data.RelatedTopics ?? []) {
			if (results.length >= numResults) break;
			if (t.Text && t.FirstURL) results.push({
				title: t.Name ?? t.FirstURL,
				url: t.FirstURL,
				snippet: t.Text.slice(0, 200)
			});
		}
		for (const r of data.Results ?? []) {
			if (results.length >= numResults) break;
			if (r.Text && r.FirstURL) results.push({
				title: r.FirstURL,
				url: r.FirstURL,
				snippet: r.Text.slice(0, 200)
			});
		}
		if (results.length === 0) return `No results found for: "${query}". Try a more specific search.`;
		return JSON.stringify({
			query,
			results
		}, null, 2);
	} catch (err) {
		return `Search error: ${err instanceof Error ? err.message : String(err)}`;
	}
}
/**
* Execute an AI tool call by mapping it to FileLink RPC operations or web APIs.
* toolId is the Anthropic tool_use_id — passed through for logging but not needed at execution.
*/
/** Looks up how a device actually connected (`web`/`cli`/`agent`/
* `desktop-app`) so tool calls that have a native-app equivalent can use
* it instead of shelling a command out through cmd.exe. Cheap — one
* lightweight list call, not a new round trip per tool invocation beyond
* that. Returns "unknown" (never blocks) if the lookup fails for any
* reason — the CLI/agent exec path always still works as a fallback. */
async function resolveClientKind(baseAuth, deviceName) {
	try {
		return (await handleAction("devices", baseAuth)).devices.find((d) => d.name.toLowerCase() === deviceName.toLowerCase())?.clientKind ?? "unknown";
	} catch {
		return "unknown";
	}
}
async function executeAITool(toolName, input, context, callbacks) {
	const baseAuth = {
		deviceId: context.deviceId,
		deviceToken: context.deviceToken
	};
	try {
		switch (toolName) {
			case "web_search": {
				const query = String(input.query ?? "");
				const numResults = Math.min(20, Number(input.numResults) || 8);
				callbacks?.onProgress?.(`Searching the web for "${query}"...`);
				return await webSearch(query, numResults);
			}
			case "fetch_url": {
				const url = String(input.url ?? "");
				const maxChars = Math.min(2e4, Number(input.maxChars) || 8e3);
				if (!url.startsWith("http://") && !url.startsWith("https://")) return "Error: Only http:// and https:// URLs are supported.";
				callbacks?.onProgress?.(`Fetching ${url}...`);
				return await fetchWebPage(url, maxChars);
			}
			case "get_devices": {
				callbacks?.onProgress?.("Fetching connected devices...");
				const result = await handleAction("devices", baseAuth);
				return JSON.stringify(result.devices, null, 2);
			}
			case "get_device_info": {
				const device = String(input.device ?? "");
				if (context.taskId) {
					const cached = getCachedDeviceInfo(context.taskId, device);
					if (cached) {
						callbacks?.onProgress?.(`Using cached info for ${device}...`);
						return redactSecrets(JSON.stringify(cached, null, 2));
					}
				}
				callbacks?.onProgress?.(`Getting system info from ${device}...`);
				const result = await handleAction("rpc", {
					...baseAuth,
					target: device,
					method: "sysinfo",
					params: {}
				});
				if (context.taskId && result) setCachedDeviceInfo(context.taskId, device, result);
				return redactSecrets(JSON.stringify(result, null, 2));
			}
			case "get_processes": {
				const device = String(input.device ?? "");
				callbacks?.onProgress?.("Fetching running processes...");
				const processes = unwrap(await handleAction("rpc", {
					...baseAuth,
					target: device,
					method: "tasklist",
					params: {}
				})).processes ?? [];
				callbacks?.onUi?.({
					kind: "tasks",
					device,
					processes
				});
				const top = [...processes].sort((a, b) => (b.ram ?? 0) - (a.ram ?? 0)).slice(0, MAX_PROCESSES_IN_MODEL_TEXT).map((p) => ({
					pid: p.pid,
					name: p.name,
					ramMB: Math.round((p.ram ?? 0) / 1048576),
					cpu: p.cpu,
					window: p.windowTitle || void 0
				}));
				return JSON.stringify({
					note: "The full task table (grouped Apps / Browsers / Windows / Background, with icons) is already displayed to the user. Summarise briefly; don't repeat the table.",
					totalProcesses: processes.length,
					topByMemory: top
				}, null, 2);
			}
			case "get_disk_usage": {
				const device = String(input.device ?? "");
				callbacks?.onProgress?.("Checking disk usage...");
				const result = await handleAction("rpc", {
					...baseAuth,
					target: device,
					method: "disk",
					params: {}
				});
				return JSON.stringify(result, null, 2);
			}
			case "list_files": {
				const device = String(input.device ?? "");
				const path = String(input.path ?? "");
				callbacks?.onProgress?.(`Listing ${path}...`);
				const r = unwrap(await handleAction("rpc", {
					...baseAuth,
					target: device,
					method: "list",
					params: { path }
				}));
				const dir = r.path ?? path;
				const folders = (r.folders ?? []).map((f) => ({
					name: f.name,
					path: joinPath(dir, f.name)
				}));
				const files = (r.files ?? []).map((f) => ({
					name: f.name,
					path: joinPath(dir, f.name),
					size: f.size
				}));
				callbacks?.onUi?.({
					kind: "files",
					device,
					path: dir,
					mode: "list",
					folders,
					files,
					truncated: folders.length + files.length > 500
				});
				return JSON.stringify({
					note: "The file list (with icons) is already displayed to the user.",
					path: dir,
					folders: folders.slice(0, MAX_FILES_IN_MODEL_TEXT).map((f) => f.name),
					files: files.slice(0, MAX_FILES_IN_MODEL_TEXT).map((f) => ({
						name: f.name,
						size: f.size
					})),
					totalFolders: folders.length,
					totalFiles: files.length
				}, null, 2);
			}
			case "search_files": {
				const device = String(input.device ?? "");
				const path = String(input.path ?? "");
				const pattern = String(input.pattern ?? "");
				callbacks?.onProgress?.(`Searching for "${pattern}" in ${path}...`);
				const matches = unwrap(await handleAction("rpc", {
					...baseAuth,
					target: device,
					method: "search",
					params: {
						path,
						query: pattern,
						pattern
					}
				})).matches ?? [];
				const baseName = (p) => p.split(/[\\/]/).filter(Boolean).pop() ?? p;
				callbacks?.onUi?.({
					kind: "files",
					device,
					path,
					mode: "search",
					query: pattern,
					folders: matches.filter((m) => m.dir).map((m) => ({
						name: baseName(m.path),
						path: m.path
					})),
					files: matches.filter((m) => !m.dir).map((m) => ({
						name: baseName(m.path),
						path: m.path
					})),
					truncated: matches.length >= 80
				});
				return JSON.stringify({
					note: "Results are displayed to the user. If several results share a file name, call ask_user with each full path in `description` and the full path as `value`.",
					query: pattern,
					matches: matches.slice(0, MAX_FILES_IN_MODEL_TEXT),
					total: matches.length
				}, null, 2);
			}
			case "read_text": {
				const device = String(input.device ?? "");
				const filePath = String(input.path ?? "");
				const maxBytes = Number(input.maxBytes) || SAFETY_LIMITS.MAX_FILE_READ_BYTES;
				if (!isPathSafe(filePath)) return "Error: Access to this system path is not allowed.";
				callbacks?.onProgress?.(`Reading ${filePath}...`);
				const result = await handleAction("rpc", {
					...baseAuth,
					target: device,
					method: "read_text",
					params: {
						path: filePath,
						maxBytes
					}
				});
				return redactSecrets(JSON.stringify(result, null, 2));
			}
			case "write_text": {
				const device = String(input.device ?? "");
				const filePath = String(input.path ?? "");
				const content = String(input.content ?? "");
				const reason = String(input.reason ?? "");
				if (!isPathSafe(filePath)) return "Error: Cannot write to this system path.";
				callbacks?.onProgress?.(`Writing to ${filePath}...`);
				const result = await handleAction("rpc", {
					...baseAuth,
					target: device,
					method: "write_text",
					params: {
						path: filePath,
						content
					}
				});
				return `File written: ${filePath}\nReason: ${reason}\n${JSON.stringify(result)}`;
			}
			case "edit_file": {
				const device = String(input.device ?? "");
				const filePath = String(input.path ?? "");
				const oldText = String(input.old_text ?? "");
				const newText = String(input.new_text ?? "");
				callbacks?.onProgress?.(`Editing ${filePath}...`);
				const result = await handleAction("rpc", {
					...baseAuth,
					target: device,
					method: "edit_file",
					params: {
						path: filePath,
						old_text: oldText,
						new_text: newText
					}
				});
				return JSON.stringify(result);
			}
			case "create_file": {
				const device = String(input.device ?? "");
				const filePath = String(input.path ?? "");
				const content = String(input.content ?? "");
				callbacks?.onProgress?.(`Creating ${filePath}...`);
				const result = await handleAction("rpc", {
					...baseAuth,
					target: device,
					method: "create_file",
					params: {
						path: filePath,
						content
					}
				});
				return JSON.stringify(result);
			}
			case "create_directory": {
				const device = String(input.device ?? "");
				const path = String(input.path ?? "");
				callbacks?.onProgress?.(`Creating directory ${path}...`);
				const result = await handleAction("rpc", {
					...baseAuth,
					target: device,
					method: "mkdir",
					params: { path }
				});
				return `Directory created: ${path}\n${JSON.stringify(result)}`;
			}
			case "run_command": {
				const device = String(input.device ?? "");
				const command = String(input.command ?? "");
				const workingDirectory = String(input.workingDirectory ?? "");
				const timeout = Number(input.timeout) || 12e4;
				const riskLevel = String(input.riskLevel ?? "medium");
				if (assessCommandRisk(command) === "critical" && riskLevel !== "critical") return `Error: This command is classified as CRITICAL risk. Use request_confirmation first. Command: ${command}`;
				callbacks?.onProgress?.(`Executing: ${command}`);
				const callId = (await handleAction("rpcExec", {
					...baseAuth,
					target: device,
					method: "exec",
					params: {
						command,
						cwd: workingDirectory,
						timeout
					}
				})).callId;
				const maxAttempts = Math.ceil(timeout / 500);
				const allChunks = [];
				let lastChunkCount = 0;
				for (let attempts = 0; attempts < maxAttempts; attempts++) {
					await new Promise((r) => setTimeout(r, 500));
					const status = await handleAction("rpcStatus", {
						...baseAuth,
						callId
					});
					const currentStatus = status.status;
					const chunks = status.chunks || [];
					const error = status.error;
					if (chunks.length > lastChunkCount) {
						const newChunks = chunks.slice(lastChunkCount);
						for (const chunk of newChunks) {
							callbacks?.onChunk?.(chunk);
							allChunks.push(chunk);
						}
						lastChunkCount = chunks.length;
					}
					if (currentStatus === "done") {
						if (error) return `Command failed:\n${error}`;
						return redactSecrets(allChunks.join(""));
					}
				}
				return `Command timed out after ${timeout}ms. Partial output:\n${redactSecrets(allChunks.join(""))}`;
			}
			case "terminal_create": {
				const device = String(input.device ?? "");
				const shell = String(input.shell ?? "powershell");
				const name = String(input.name ?? shell);
				callbacks?.onProgress?.(`Creating ${shell} terminal on ${device}...`);
				const result = await handleAction("rpc", {
					...baseAuth,
					target: device,
					method: "control",
					params: {
						command: "terminalCreate",
						shell,
						name
					}
				});
				return JSON.stringify(result, null, 2);
			}
			case "terminal_write": {
				const device = String(input.device ?? "");
				const terminalId = String(input.terminalId ?? "");
				const input_ = String(input.input ?? "");
				callbacks?.onProgress?.(`Sending input to terminal ${terminalId}...`);
				const result = await handleAction("rpc", {
					...baseAuth,
					target: device,
					method: "control",
					params: {
						command: "terminalWrite",
						terminalId,
						input: input_
					}
				});
				return JSON.stringify(result, null, 2);
			}
			case "terminal_read": {
				const device = String(input.device ?? "");
				const terminalId = String(input.terminalId ?? "");
				callbacks?.onProgress?.(`Reading from terminal ${terminalId}...`);
				const result = await handleAction("rpc", {
					...baseAuth,
					target: device,
					method: "control",
					params: {
						command: "terminalRead",
						terminalId
					}
				});
				return redactSecrets(JSON.stringify(result, null, 2));
			}
			case "take_screenshot": {
				const device = String(input.device ?? "");
				const monitor = Number(input.monitor ?? 0);
				callbacks?.onProgress?.("Capturing screenshot...");
				const clientKind = await resolveClientKind(baseAuth, device);
				const r = unwrap(await handleAction("rpc", {
					...baseAuth,
					target: device,
					method: clientKind === "desktop-app" ? "appAction" : "screenshot",
					params: clientKind === "desktop-app" ? {
						action: "screenshot",
						monitor
					} : { monitor }
				}));
				const b64 = r.image ?? r.imageBase64 ?? r.data;
				if (!b64) return `Error: ${device} returned no image${r.error ? ` (${r.error})` : ""}.`;
				const mime = r.mime || "image/jpeg";
				callbacks?.onUi?.({
					kind: "image",
					device,
					src: b64.startsWith("data:") ? b64 : `data:${mime};base64,${b64}`,
					mime,
					caption: `Screenshot of ${device}${monitor ? ` (monitor ${monitor})` : ""}`,
					takenAt: r.at ?? Date.now()
				});
				return `Screenshot captured from ${device} (monitor ${monitor}) and displayed to the user in an image viewer. You cannot see the image itself; do not claim to describe its contents.`;
			}
			case "clipboard_read": {
				const device = String(input.device ?? "");
				callbacks?.onProgress?.("Reading clipboard...");
				const result = await handleAction("rpc", {
					...baseAuth,
					target: device,
					method: "clipboardRead",
					params: {}
				});
				return redactSecrets(JSON.stringify(result, null, 2));
			}
			case "clipboard_write": {
				const device = String(input.device ?? "");
				const text = String(input.text ?? "");
				const reason = String(input.reason ?? "");
				callbacks?.onProgress?.("Writing to clipboard...");
				const result = await handleAction("rpc", {
					...baseAuth,
					target: device,
					method: "clipboardWrite",
					params: { text }
				});
				return `Clipboard set.\nReason: ${reason}\n${JSON.stringify(result)}`;
			}
			case "input_mouse": {
				const device = String(input.device ?? "");
				const action = String(input.action ?? "move");
				const x = Number(input.x ?? 0);
				const y = Number(input.y ?? 0);
				const button = String(input.button ?? "left");
				const amount = Number(input.amount ?? 0);
				callbacks?.onProgress?.(`Mouse ${action} at (${x}, ${y})...`);
				const command = action === "move" ? "cursorMove" : action === "scroll" ? "cursorScroll" : "cursorClick";
				const clientKind = await resolveClientKind(baseAuth, device);
				const result = await handleAction("rpc", {
					...baseAuth,
					target: device,
					method: clientKind === "desktop-app" ? "appAction" : "control",
					params: clientKind === "desktop-app" ? {
						action: command,
						x,
						y,
						button,
						amount
					} : {
						command,
						x,
						y,
						button,
						amount
					}
				});
				return JSON.stringify(result, null, 2);
			}
			case "input_keyboard": {
				const device = String(input.device ?? "");
				const action = String(input.action ?? "type");
				const text = String(input.text ?? "");
				callbacks?.onProgress?.(`Keyboard ${action}: ${text.slice(0, 30)}...`);
				const command = action === "type" ? "keyboardType" : "keyboardShortcut";
				const clientKind = await resolveClientKind(baseAuth, device);
				const result = await handleAction("rpc", {
					...baseAuth,
					target: device,
					method: clientKind === "desktop-app" ? "appAction" : "control",
					params: clientKind === "desktop-app" ? {
						action: command,
						text
					} : {
						command,
						text
					}
				});
				return JSON.stringify(result, null, 2);
			}
			case "power_action": {
				const device = String(input.device ?? "");
				const action = String(input.action ?? "");
				const delaySeconds = Number(input.delaySeconds ?? 0);
				callbacks?.onProgress?.(`Sending ${action} to ${device}...`);
				const result = await handleAction("rpc", {
					...baseAuth,
					target: device,
					method: "control",
					params: {
						command: action,
						seconds: delaySeconds
					}
				});
				return JSON.stringify(result, null, 2);
			}
			case "show_alert": {
				const device = String(input.device ?? "");
				const kind = [
					"info",
					"warning",
					"error"
				].includes(String(input.kind)) ? String(input.kind) : "info";
				callbacks?.onProgress?.(`Showing a ${kind} message on ${device}...`);
				await handleAction("rpc", {
					...baseAuth,
					target: device,
					method: "control",
					params: {
						command: "alert",
						title: String(input.title ?? "Message").slice(0, 120),
						content: String(input.content ?? "").slice(0, 2e3),
						kind
					}
				});
				return `Message shown on ${device}.`;
			}
			case "request_confirmation": {
				const question = String(input.question ?? "");
				const riskLevel = String(input.riskLevel ?? "medium");
				const details = input.details;
				return JSON.stringify({
					type: "confirmation_required",
					approved: false,
					question,
					riskLevel,
					details
				});
			}
			case "queue_offline_task": return `Task queued for ${String(input.device ?? "")}. Action: ${String(input.action ?? "")}. Requires confirmation: ${Boolean(input.requiresConfirmation)}. Task will execute when the device comes online.`;
			case "transfer_file": return "File transfer tool is coming soon. Use run_command with robocopy/rsync for now.";
			default: return `Unknown tool: ${toolName}`;
		}
	} catch (error) {
		return `❌ Error executing ${toolName}: ${error instanceof Error ? error.message : String(error)}`;
	}
}
var Route$3 = createFileRoute("/api/ai")({ server: { handlers: { POST: async ({ request }) => {
	try {
		const { action, taskId, message, session, conversationHistory, selectedDevices } = await request.json();
		if (!session?.deviceId || !session?.deviceToken) return json$1({ error: "Unauthorized" }, { status: 401 });
		const heartbeat = await handleAction("heartbeat", {
			deviceId: session.deviceId,
			deviceToken: session.deviceToken
		});
		const roomId = heartbeat.room.id;
		const deviceId = heartbeat.me.id;
		switch (action) {
			case "chat": {
				if (!message) return json$1({ error: "Missing message" }, { status: 400 });
				console.log("[AI API] Received chat request:", {
					message: message.substring(0, 80),
					deviceId,
					roomId,
					historyLength: conversationHistory?.length ?? 0,
					selectedDevices: selectedDevices ?? []
				});
				const executionSteps = [];
				const messages = await executeAITask({
					taskId: taskId || crypto.randomUUID(),
					roomId,
					deviceId,
					conversationHistory: conversationHistory ?? []
				}, message, async (toolName, _toolId, toolInput) => {
					const stepIndex = executionSteps.length;
					executionSteps.push({
						tool: toolName,
						status: "running",
						chunks: []
					});
					try {
						const result = await executeAITool(toolName, toolInput, {
							roomId,
							deviceId,
							deviceToken: session.deviceToken,
							taskId: taskId || void 0
						}, {
							onChunk: (chunk) => {
								executionSteps[stepIndex].chunks ??= [];
								executionSteps[stepIndex].chunks.push(chunk);
							},
							onProgress: (status) => {
								console.log(`[${toolName}] ${status}`);
							}
						});
						executionSteps[stepIndex].status = "completed";
						executionSteps[stepIndex].output = result;
						return result;
					} catch (error) {
						executionSteps[stepIndex].status = "failed";
						executionSteps[stepIndex].error = error instanceof Error ? error.message : String(error);
						return `Error: ${executionSteps[stepIndex].error}`;
					}
				});
				return json$1({
					messages,
					executionSteps
				});
			}
			case "status": return json$1({ status: "idle" });
			default: return json$1({ error: `Unknown action: ${action}` }, { status: 400 });
		}
	} catch (error) {
		console.error("[AI API Error]", error);
		return json$1({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
	}
} } } });
function jsonResponse(body, status) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json" }
	});
}
/**
* The browser sends back the chat it is showing. Treat it as untrusted:
* keep only plain user/assistant text, drop anything that could confuse the
* model's tool protocol (tool results, fabricated tool_use), and keep only
* the question cards (so the model knows what the person was asked).
*/
function sanitizeHistory(raw) {
	if (!Array.isArray(raw)) return [];
	const out = [];
	for (const item of raw.slice(-40)) {
		if (!item || typeof item !== "object") continue;
		const m = item;
		if (m.role !== "user" && m.role !== "assistant") continue;
		if (typeof m.content !== "string") continue;
		const ui = Array.isArray(m.ui) ? m.ui.filter((p) => p && typeof p === "object" && isQuestionPayload(p)) : void 0;
		out.push({
			id: typeof m.id === "string" ? m.id : crypto.randomUUID(),
			task_id: "",
			role: m.role,
			content: m.content.slice(0, 2e4),
			tool_name: null,
			tool_call: null,
			created_at: typeof m.created_at === "string" ? m.created_at : (/* @__PURE__ */ new Date()).toISOString(),
			...ui && ui.length ? { ui } : {}
		});
	}
	return out;
}
async function streamResponse(params) {
	const { message, deviceId: rawDeviceId, deviceToken, selectedDevices } = params;
	if (!rawDeviceId || !deviceToken) return jsonResponse({ error: "Unauthorized" }, 401);
	if (!message || !message.trim()) return jsonResponse({ error: "Missing message" }, 400);
	const conversationHistory = sanitizeHistory(params.conversationHistory);
	try {
		const heartbeat = await handleAction("heartbeat", {
			deviceId: rawDeviceId,
			deviceToken
		});
		const roomId = heartbeat.room.id;
		const authedDeviceId = heartbeat.me.id;
		const allDevices = (await handleAction("devices", {
			deviceId: rawDeviceId,
			deviceToken
		})).devices;
		const selectedDeviceDetails = selectedDevices.map((id) => allDevices.find((d) => d.id === id || d.name === id)).filter((d) => Boolean(d));
		const deviceContext = selectedDeviceDetails.length > 0 ? `\n\nTARGET DEVICE(S) PRE-SELECTED BY USER:\n${selectedDeviceDetails.map((d) => `- ${d.name} (ID: ${d.id}, ${d.online ? "ONLINE" : "OFFLINE"})`).join("\n")}\n\nWhen executing tools that require a "device" parameter, use the device name or ID from this list. Do NOT call get_devices — the user already chose them.` : "";
		const encoder = new TextEncoder();
		const stream = new ReadableStream({ async start(controller) {
			let closed = false;
			const send = (event, data) => {
				if (closed) return;
				try {
					controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
				} catch {
					closed = true;
				}
			};
			const keepAlive = setInterval(() => {
				if (closed) return;
				try {
					controller.enqueue(encoder.encode(`: keep-alive\n\n`));
				} catch {
					closed = true;
				}
			}, 15e3);
			try {
				send("thinking", { message: "Understanding your request..." });
				const taskId = crypto.randomUUID();
				const turnUi = [];
				const messages = await executeAITask({
					taskId,
					roomId,
					deviceId: authedDeviceId,
					conversationHistory
				}, message, async (toolName, _toolId, toolInput) => {
					send("tool_start", {
						tool: toolName,
						input: toolInput,
						timestamp: (/* @__PURE__ */ new Date()).toISOString()
					});
					try {
						const result = await executeAITool(toolName, toolInput, {
							roomId,
							deviceId: authedDeviceId,
							deviceToken,
							taskId
						}, {
							onChunk: (chunk) => {
								send("tool_chunk", {
									tool: toolName,
									chunk,
									timestamp: (/* @__PURE__ */ new Date()).toISOString()
								});
							},
							onProgress: (status) => {
								send("tool_progress", {
									tool: toolName,
									status,
									timestamp: (/* @__PURE__ */ new Date()).toISOString()
								});
							},
							onUi: (payload) => {
								turnUi.push(payload);
								send("tool_ui", {
									tool: toolName,
									ui: payload
								});
							}
						});
						send("tool_result", {
							tool: toolName,
							result: result.length > 4e3 ? `${result.slice(0, 4e3)}…` : result,
							timestamp: (/* @__PURE__ */ new Date()).toISOString()
						});
						return result;
					} catch (error) {
						const errorMsg = error instanceof Error ? error.message : String(error);
						send("tool_error", {
							tool: toolName,
							error: errorMsg,
							timestamp: (/* @__PURE__ */ new Date()).toISOString()
						});
						return `Error: ${errorMsg}`;
					}
				}, deviceContext);
				if (turnUi.length) {
					for (let i = messages.length - 1; i >= 0; i--) if (messages[i].role === "assistant") {
						messages[i].ui = [...turnUi, ...messages[i].ui ?? []];
						break;
					}
				}
				send("complete", { messages: messages.filter((m) => m.role !== "tool") });
			} catch (error) {
				send("error", { message: error instanceof Error ? error.message : "Unknown error" });
			} finally {
				clearInterval(keepAlive);
				if (!closed) {
					closed = true;
					try {
						controller.close();
					} catch {}
				}
			}
		} });
		return new Response(stream, { headers: {
			"Content-Type": "text/event-stream",
			"Cache-Control": "no-cache, no-transform",
			Connection: "keep-alive",
			"X-Accel-Buffering": "no"
		} });
	} catch (error) {
		return jsonResponse({ error: error instanceof Error ? error.message : "Internal Server Error" }, 500);
	}
}
var Route$2 = createFileRoute("/api/ai-stream")({ server: { handlers: {
	POST: async ({ request }) => {
		let body;
		try {
			body = await request.json();
		} catch {
			return jsonResponse({ error: "Invalid JSON body" }, 400);
		}
		return streamResponse({
			message: typeof body.message === "string" ? body.message : null,
			deviceId: typeof body.deviceId === "string" ? body.deviceId : null,
			deviceToken: typeof body.deviceToken === "string" ? body.deviceToken : null,
			selectedDevices: Array.isArray(body.selectedDevices) ? body.selectedDevices.filter((d) => typeof d === "string") : [],
			conversationHistory: body.conversationHistory
		});
	},
	GET: async ({ request }) => {
		const url = new URL(request.url);
		let selectedDevices = [];
		let conversationHistory = [];
		try {
			selectedDevices = JSON.parse(url.searchParams.get("selectedDevices") || "[]");
			conversationHistory = JSON.parse(url.searchParams.get("conversationHistory") || "[]");
		} catch {
			return jsonResponse({ error: "Bad request" }, 400);
		}
		return streamResponse({
			message: url.searchParams.get("message"),
			deviceId: url.searchParams.get("deviceId"),
			deviceToken: url.searchParams.get("deviceToken"),
			selectedDevices: Array.isArray(selectedDevices) ? selectedDevices : [],
			conversationHistory
		});
	}
} } });
var Route$1 = createFileRoute("/j/$code")({ beforeLoad: ({ params }) => {
	throw redirect({
		to: "/",
		search: { code: params.code.toUpperCase() }
	});
} });
var CORS = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers": "content-type",
	"Access-Control-Allow-Methods": "POST, OPTIONS"
};
function json(payload, status = 200) {
	return new Response(JSON.stringify(payload), {
		status,
		headers: {
			"content-type": "application/json",
			...CORS
		}
	});
}
var Route = createFileRoute("/api/public/link")({ server: { handlers: {
	OPTIONS: async () => new Response(null, {
		status: 204,
		headers: CORS
	}),
	POST: async ({ request }) => {
		let body;
		try {
			body = await request.json();
		} catch {
			return json({ error: "Invalid JSON body" }, 400);
		}
		const action = String(body.action ?? "");
		if (!action) return json({ error: "Missing action" }, 400);
		const { handleAction, ApiError } = await import("./link.server-CZrjd_xm.mjs");
		try {
			return json({
				ok: true,
				...await handleAction(action, body)
			});
		} catch (err) {
			if (err instanceof ApiError) return json({ error: err.message }, err.status);
			console.error("[link api]", err);
			return json({ error: "Something went wrong" }, 500);
		}
	}
} } });
var rootRouteChildren = {
	IndexRoute: Route$4.update({
		id: "/",
		path: "/",
		getParentRoute: () => Route$5
	}),
	ApiAiRoute: Route$3.update({
		id: "/api/ai",
		path: "/api/ai",
		getParentRoute: () => Route$5
	}),
	ApiAiStreamRoute: Route$2.update({
		id: "/api/ai-stream",
		path: "/api/ai-stream",
		getParentRoute: () => Route$5
	}),
	JCodeRoute: Route$1.update({
		id: "/j/$code",
		path: "/j/$code",
		getParentRoute: () => Route$5
	}),
	ApiPublicLinkRoute: Route.update({
		id: "/api/public/link",
		path: "/api/public/link",
		getParentRoute: () => Route$5
	})
};
var routeTree = Route$5._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
var getRouter = () => {
	const queryClient = new QueryClient();
	return createRouter({
		routeTree,
		context: { queryClient },
		scrollRestoration: true,
		defaultPreloadStaleTime: 0
	});
};
//#endregion
export { APPROVAL_PREFIX as a, stripForStorage as c, ApiError as n, CANCEL_PREFIX as o, handleAction as r, isQuestionPayload as s, router_exports as t };
