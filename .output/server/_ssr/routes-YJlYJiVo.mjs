import { r as __toESM } from "../_runtime.mjs";
import { a as DialogOverlay$1, i as DialogDescription$1, l as Slot, n as DialogClose, o as DialogPortal$1, r as DialogContent$1, s as DialogTitle$1, t as Dialog$1 } from "../_libs/@radix-ui/react-dialog+[...].mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { a as APPROVAL_PREFIX, c as stripForStorage, o as CANCEL_PREFIX, s as isQuestionPayload } from "./router-DkQ2cK8n.mjs";
import { $ as Image, A as PenLine, At as CircleX, B as MessageSquare, Bt as ArrowUpFromLine, C as Save, Ct as CornerLeftUp, D as Plus, Dt as Clock, E as Power, Et as CodeXml, F as Moon, Ft as ChevronRight, G as Lock, H as Menu, Ht as AppWindow, I as Monitor, It as ChevronLeft, J as Link, K as LoaderCircle, L as MonitorSmartphone, Lt as ChevronDown, M as PanelLeft, Mt as CircleCheck, N as Package, Nt as CircleAlert, O as Play, Ot as Clipboard, P as MousePointer2, Pt as ChevronUp, Q as Inbox, R as MonitorPlay, Rt as Check, S as Scissors, St as Cpu, T as RefreshCw, Tt as Cog, U as Maximize2, Ut as Activity, V as MessageSquareWarning, Vt as ArrowDownToLine, W as LogOut, X as Laptop, Y as LayoutGrid, Z as Info, _ as Server, _t as FileArchive, a as User, at as FolderPlus, b as Search, bt as Download, c as Trash2, ct as FileText, d as Square, dt as FileImage, et as House, f as SquareCheckBig, ft as FileHeadphone, g as Settings, gt as FileBraces, h as ShieldAlert, ht as FileClock, i as Video, it as FolderTree, j as PanelRight, jt as CircleQuestionMark, k as Pencil, kt as ClipboardPaste, l as Terminal, lt as FileSpreadsheet, m as Skull, mt as FileCodeCorner, n as X, nt as Globe, o as Upload, ot as FolderOpen, p as Sparkles, pt as FileCode, q as List, r as WifiOff, rt as Folder, s as TriangleAlert, st as File$1, t as Zap, tt as HardDrive, u as Star, ut as FilePlay, v as Send, vt as Eye, w as RotateCw, wt as Copy, x as ScrollText, xt as Crown, y as SendHorizontal, yt as ExternalLink, z as Minimize2, zt as Camera } from "../_libs/lucide-react.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { n as Root, t as Indicator } from "../_libs/radix-ui__react-progress.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-YJlYJiVo.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var KEY$3 = "filelink.session";
var USER_KEY = "filelink.user";
function loadSession() {
	if (typeof window === "undefined") return null;
	try {
		return JSON.parse(window.localStorage.getItem(KEY$3) ?? "null");
	} catch {
		return null;
	}
}
function saveSession(session) {
	if (typeof window === "undefined") return;
	if (session) window.localStorage.setItem(KEY$3, JSON.stringify(session));
	else window.localStorage.removeItem(KEY$3);
}
function loadUserSession() {
	if (typeof window === "undefined") return null;
	try {
		return JSON.parse(window.localStorage.getItem(USER_KEY) ?? "null");
	} catch {
		return null;
	}
}
function saveUserSession(user) {
	if (typeof window === "undefined") return;
	if (user) window.localStorage.setItem(USER_KEY, JSON.stringify(user));
	else window.localStorage.removeItem(USER_KEY);
}
async function api(action, payload = {}, session) {
	const res = await fetch("/api/public/link", {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({
			action,
			...session ? {
				deviceId: session.deviceId,
				deviceToken: session.deviceToken
			} : {},
			...payload
		})
	});
	const data = await res.json().catch(() => ({ error: "Bad response from server" }));
	if (!res.ok || data.error) throw new Error(data.error ?? `Request failed (${res.status})`);
	return data;
}
async function signup(username, password) {
	return api("signup", {
		username,
		password
	});
}
async function userLogin(username, password) {
	return api("userLogin", {
		username,
		password
	});
}
async function userMe(user) {
	return api("userMe", {
		userId: user.userId,
		userToken: user.userToken
	});
}
async function setTier(user, tier, months) {
	return api("setTier", {
		userId: user.userId,
		userToken: user.userToken,
		tier,
		months
	});
}
function humanSize(n) {
	const units = [
		"B",
		"KB",
		"MB",
		"GB"
	];
	let i = 0;
	let v = Number(n) || 0;
	while (v >= 1024 && i < units.length - 1) {
		v /= 1024;
		i++;
	}
	return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
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
	return "/" + p.split("/").filter(Boolean).join("/");
}
var jobs = [];
var listeners$1 = /* @__PURE__ */ new Set();
function emit() {
	jobs = [...jobs];
	listeners$1.forEach((l) => l());
}
function subscribeJobs(fn) {
	listeners$1.add(fn);
	return () => listeners$1.delete(fn);
}
function getJobs() {
	return jobs;
}
function clearFinishedJobs() {
	jobs = jobs.filter((j) => j.status === "active");
	emit();
}
function startJob(name, kind, total = 0, note, batch) {
	const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
	jobs = [{
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
		batchTotal: batch?.total
	}, ...jobs].slice(0, 60);
	emit();
	return {
		progress(loaded, total) {
			const j = jobs.find((x) => x.id === id);
			if (!j) return;
			j.loaded = loaded;
			if (total) j.total = total;
			const secs = (Date.now() - j.startedAt) / 1e3;
			j.bps = secs > 0 ? loaded / secs : 0;
			emit();
		},
		setNote(text) {
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
		fail(message) {
			const j = jobs.find((x) => x.id === id);
			if (!j) return;
			j.status = "error";
			j.note = message;
			emit();
		}
	};
}
function humanSpeed(bps) {
	return `${humanSize(bps)}/s`;
}
async function uploadFile(session, file, folderPath, to, batch) {
	const job = startJob(file.name, "send", file.size, "uploading…", batch);
	try {
		const init = await api("uploadInit", {
			folderPath,
			fileName: file.name,
			size: file.size,
			to: to ?? null
		}, session);
		const CHUNK = 196608;
		const buf = new Uint8Array(await file.arrayBuffer());
		let offset = 0;
		let first = true;
		do {
			const slice = buf.subarray(offset, offset + CHUNK);
			let binary = "";
			for (let i = 0; i < slice.length; i++) binary += String.fromCharCode(slice[i]);
			await api("uploadChunk", {
				transferId: init.transferId,
				chunk: btoa(binary),
				first
			}, session);
			offset += slice.length;
			first = false;
			job.progress(offset, buf.length || 1);
		} while (offset < buf.length);
		job.setNote(to ? `sending to ${to}…` : "finishing…");
		const res = await api("uploadDone", {
			transferId: init.transferId,
			contentType: file.type || void 0
		}, session);
		job.done();
		return res;
	} catch (e) {
		job.fail(e.message);
		throw e;
	}
}
/**
* Upload a file straight into a folder that lives on an online device
* (the shared root of the agent), streaming it as base64 chunks.
*/
async function remoteUploadFile(session, device, dirPath, file, batch) {
	const CHUNK = 196608;
	const target = `${dirPath === "/" ? "" : dirPath.replace(/\/+$/, "")}/${file.name}`;
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
				first
			});
			offset += slice.length;
			first = false;
			job.progress(offset, buf.length);
		} while (offset < buf.length);
		job.done();
		return { path: target };
	} catch (e) {
		job.fail(e.message);
		throw e;
	}
}
async function downloadTransfer(session, transferId) {
	const { url, fileName } = await api("download", { transferId }, session);
	const job = startJob(fileName, "receive", 0, "from the room");
	try {
		const res = await fetch(url);
		if (!res.ok) throw new Error(`Download failed (${res.status})`);
		const total = Number(res.headers.get("content-length") ?? 0);
		const reader = res.body?.getReader();
		const parts = [];
		let loaded = 0;
		if (reader) for (;;) {
			const { done, value } = await reader.read();
			if (done) break;
			parts.push(value);
			loaded += value.length;
			job.progress(loaded, total || loaded);
		}
		else parts.push(new Uint8Array(await res.arrayBuffer()));
		const blobUrl = URL.createObjectURL(new Blob(parts));
		const a = document.createElement("a");
		a.href = blobUrl;
		a.download = fileName;
		document.body.appendChild(a);
		a.click();
		a.remove();
		setTimeout(() => URL.revokeObjectURL(blobUrl), 1e4);
		job.done();
		return fileName;
	} catch (e) {
		job.fail(e.message);
		throw e;
	}
}
async function remoteCall(session, device, method, params = {}) {
	return (await api("rpc", {
		target: device,
		method,
		params
	}, session)).result;
}
async function remoteExecStart(session, device, command) {
	return api("rpcExec", {
		target: device,
		method: "exec",
		params: { command }
	}, session);
}
async function remoteExecStatus(session, callId) {
	return api("rpcStatus", { callId }, session);
}
async function remoteDownload(session, device, filePath, onProgress) {
	const CHUNK = 262144;
	const parts = [];
	const job = startJob(filePath.split("/").filter(Boolean).pop() || "file", "receive", 0, `from ${device}`);
	let offset = 0;
	try {
		for (;;) {
			const r = await remoteCall(session, device, "read", {
				path: filePath,
				offset,
				length: CHUNK
			});
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
		job.fail(e.message);
		throw e;
	}
	job.done();
	const name = filePath.split("/").filter(Boolean).pop() || "file";
	const url = URL.createObjectURL(new Blob(parts));
	const a = document.createElement("a");
	a.href = url;
	a.download = name;
	document.body.appendChild(a);
	a.click();
	a.remove();
	setTimeout(() => URL.revokeObjectURL(url), 1e4);
	return name;
}
var SNAP = "filelink.snapshots";
function allSnapshots() {
	if (typeof window === "undefined") return {};
	try {
		return JSON.parse(window.localStorage.getItem(SNAP) ?? "{}");
	} catch {
		return {};
	}
}
function readSnapshot(room, device, path) {
	return allSnapshots()[`${room}|${device}|${path}`] ?? null;
}
function writeSnapshot(room, device, path, items) {
	if (typeof window === "undefined") return;
	const all = allSnapshots();
	all[`${room}|${device}|${path}`] = {
		at: Date.now(),
		items
	};
	try {
		window.localStorage.setItem(SNAP, JSON.stringify(all));
	} catch {}
}
function removeItems(session, items) {
	return api("rm", { items }, session);
}
function renameItem(session, item, name) {
	return api("rename", {
		item,
		name
	}, session);
}
function copyMoveItems(session, items, dest, mode) {
	return api("cpmv", {
		items,
		dest,
		mode
	}, session);
}
function roomUsage(session) {
	return api("usage", {}, session);
}
/** Pull a whole file out of a PC into memory (used to relay it onward). */
async function remoteFetchBytes(session, device, filePath, onProgress) {
	const CHUNK = 262144;
	const parts = [];
	let offset = 0;
	for (;;) {
		const r = await remoteCall(session, device, "read", {
			path: filePath,
			offset,
			length: CHUNK
		});
		const bin = atob(r.chunk || "");
		const bytes = new Uint8Array(bin.length);
		for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
		parts.push(bytes);
		offset += bytes.length;
		onProgress?.(offset, r.size);
		if (r.eof || !bytes.length) break;
	}
	return new Blob(parts);
}
function updateDevice(session, targetId, name) {
	return api("updateDevice", {
		targetId,
		name
	}, session);
}
function deleteDevice(session, targetId) {
	return api("deleteDevice", { targetId }, session);
}
function sendControl(session, target, command, extra) {
	return api("control", {
		target,
		command,
		...extra ?? {}
	}, session);
}
function schedulePower(session, target, powerAction, fireAt) {
	return api("schedulePower", {
		target,
		powerAction,
		fireAt
	}, session);
}
function listSchedules(session) {
	return api("listSchedules", {}, session);
}
function cancelSchedule(session, scheduleId) {
	return api("cancelSchedule", { scheduleId }, session);
}
function getServerAudit(session) {
	return api("auditList", {}, session);
}
function getInstallStatus(session, deviceName) {
	return api("installStatus", { deviceName }, session);
}
function remoteSysInfo(session, device) {
	return remoteCall(session, device, "sysinfo");
}
function remoteTasklist(session, device) {
	return remoteCall(session, device, "tasklist");
}
async function chatList(session) {
	return (await api("chatList", {}, session)).chats;
}
async function chatGet(session, chatId) {
	return (await api("chatGet", { chatId }, session)).chat;
}
/** Saves the chat; images and icons are dropped first (see stripForStorage). */
async function chatSave(session, chatId, title, messages) {
	const slim = messages.map((m) => ({
		...m,
		ui: m.ui?.map(stripForStorage)
	}));
	return (await api("chatSave", {
		chatId: chatId ?? void 0,
		title,
		messages: slim
	}, session)).chatId;
}
async function chatDelete(session, chatId) {
	await api("chatDelete", { chatId }, session);
}
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var Dialog = Dialog$1;
var DialogPortal = DialogPortal$1;
var DialogOverlay = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay$1, {
	ref,
	className: cn("fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className),
	...props
}));
DialogOverlay.displayName = DialogOverlay$1.displayName;
var DialogContent = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent$1, {
	ref,
	className: cn("fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg", className),
	...props,
	children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogClose, {
		className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background cursor-pointer transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "sr-only",
			children: "Close"
		})]
	})]
})] }));
DialogContent.displayName = DialogContent$1.displayName;
var DialogHeader = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col space-y-1.5 text-center sm:text-left", className),
	...props
});
DialogHeader.displayName = "DialogHeader";
var DialogFooter = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className),
	...props
});
DialogFooter.displayName = "DialogFooter";
var DialogTitle = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle$1, {
	ref,
	className: cn("text-lg font-semibold leading-none tracking-tight", className),
	...props
}));
DialogTitle.displayName = DialogTitle$1.displayName;
var DialogDescription = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription$1, {
	ref,
	className: cn("text-sm text-muted-foreground", className),
	...props
}));
DialogDescription.displayName = DialogDescription$1.displayName;
/**
* Simple shared-passcode gate for sensitive actions in the browser UI
* (fullscreen mode, deleting, moving). This is a convenience lock for the
* people sharing a room — it is not user authentication.
*/
var PASSCODE = "hube1848@";
var KEY$2 = "filelink.unlocked";
function isUnlocked() {
	if (typeof window === "undefined") return false;
	return sessionStorage.getItem(KEY$2) === "1";
}
function tryUnlock(input) {
	if (input !== PASSCODE) return false;
	sessionStorage.setItem(KEY$2, "1");
	return true;
}
function PasswordDialog({ open, onOpenChange, reason, onUnlocked }) {
	const [value, setValue] = (0, import_react.useState)("");
	const [bad, setBad] = (0, import_react.useState)(false);
	function submit(e) {
		e.preventDefault();
		if (tryUnlock(value)) {
			setValue("");
			setBad(false);
			onOpenChange(false);
			onUnlocked();
		} else setBad(true);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "max-w-sm",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "size-4 text-warning" }), " Passcode needed"]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: reason })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				onSubmit: submit,
				className: "space-y-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						autoFocus: true,
						type: "password",
						value,
						onChange: (e) => {
							setValue(e.target.value);
							setBad(false);
						},
						placeholder: "passcode",
						className: "h-11 w-full rounded-md border border-border bg-background px-3 font-mono text-sm text-foreground outline-none focus:border-primary"
					}),
					bad && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-mono text-xs text-destructive",
						children: "Wrong passcode"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "submit",
						className: "h-11 w-full rounded-md bg-primary text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90",
						children: "Unlock"
					})
				]
			})]
		})
	});
}
var SHELLS = [
	{
		key: "cmd",
		label: "CMD",
		probe: ""
	},
	{
		key: "powershell",
		label: "PowerShell",
		probe: "powershell"
	},
	{
		key: "node",
		label: "Node",
		probe: "node"
	},
	{
		key: "python",
		label: "Python",
		probe: "python"
	}
];
/** Wraps one admin command line for the chosen shell. */
function wrapForShell(shellKind, cwd, line) {
	switch (shellKind) {
		case "powershell": return `powershell -NoProfile -Command "${((cwd ? `Set-Location -LiteralPath '${cwd.replace(/'/g, "''")}'; ` : "") + line).replace(/"/g, "\\\"")}"`;
		case "node": return `node -e "${line.replace(/"/g, "\\\"")}"`;
		case "python": return `python -c "${line.replace(/"/g, "\\\"")}"`;
		default: return cwd ? `cd /d "${cwd}" && ${line}` : line;
	}
}
var HELP = `Commands
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
var ADMIN_PASSCODE = "hube1848@";
function parseCdAt(arg) {
	const rest = arg.slice(1).trim();
	if (!rest) return {
		target: "",
		quoted: false
	};
	if (rest.startsWith("\"")) {
		const end = rest.indexOf("\"", 1);
		if (end === -1) return {
			target: rest.slice(1),
			quoted: true
		};
		return {
			target: rest.slice(1, end),
			quoted: true
		};
	}
	return {
		target: rest,
		quoted: false
	};
}
function isCloudDeletionCommand(line) {
	const lower = line.toLowerCase();
	if (!/\b(del|rm|rmdir|rd|erase)\b/.test(lower)) return false;
	if (/\b[A-Z0-9]{6}\b:/.test(line)) return true;
	if (/\b(shares|filelink-inbox|cloud|room)\b/i.test(line)) return true;
	if (/\b(del|erase)\b.+\s\/[sSqQfF]/.test(lower)) return true;
	return false;
}
function Terminal$1({ session, cwd, setCwd, onChanged }) {
	const [lines, setLines] = (0, import_react.useState)([{
		kind: "ok",
		text: `connected to "${session.roomName}" as ${session.deviceName}`
	}, {
		kind: "dim",
		text: `room code ${session.roomCode} — type help`
	}]);
	const [value, setValue] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const endRef = (0, import_react.useRef)(null);
	const fileRef = (0, import_react.useRef)(null);
	const pendingTarget = (0, import_react.useRef)(null);
	const pendingExec = (0, import_react.useRef)(null);
	const [remote, setRemote] = (0, import_react.useState)(null);
	const [adminDevice, setAdminDevice] = (0, import_react.useState)(null);
	const [adminCwd, setAdminCwd] = (0, import_react.useState)(null);
	const [passwordMode, setPasswordMode] = (0, import_react.useState)(false);
	const [lockReason, setLockReason] = (0, import_react.useState)(null);
	const [shell, setShell] = (0, import_react.useState)("cmd");
	const [shellMenuOpen, setShellMenuOpen] = (0, import_react.useState)(false);
	const [shellAvailability, setShellAvailability] = (0, import_react.useState)({});
	const push = (kind, text) => setLines((prev) => [...prev, {
		kind,
		text
	}]);
	function guarded(reason) {
		setLockReason(reason);
	}
	(0, import_react.useEffect)(() => {
		endRef.current?.scrollIntoView({ block: "end" });
	}, [lines]);
	async function pickAndSend(to) {
		pendingTarget.current = to;
		fileRef.current?.click();
	}
	async function onFilePicked(e) {
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
			push("err", error.message);
		}
		setBusy(false);
	}
	async function runExec(raw) {
		const targets = (await api("devices", {}, session)).devices;
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
		if (!device || !command) throw new Error("Usage: exec <device> <command>   e.g. exec Office PC dir");
		if (!targets.find((d) => d.name === device)?.online) throw new Error(`${device} is offline`);
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
		const result = final.result;
		push("dim", `finished with exit code ${result?.code ?? "?"}`);
	}
	/** Resolves a Windows-style path change against a known current directory. */
	function resolveWinPath(base, arg) {
		const trimmed = arg.trim();
		if (!trimmed || trimmed === ".") return base ?? "";
		if (/^[a-zA-Z]:[\\/]/.test(trimmed) || trimmed.startsWith("\\\\")) return trimmed.replace(/\//g, "\\").replace(/\\+$/, "") || trimmed;
		if (trimmed === "..") {
			if (!base) return base ?? "";
			const parts = base.split("\\").filter(Boolean);
			if (parts.length <= 1) return base;
			parts.pop();
			return parts.join("\\");
		}
		const clean = trimmed.replace(/^\\+/, "").replace(/\//g, "\\");
		return base ? `${base.replace(/\\+$/, "")}\\${clean}` : clean;
	}
	/** Checks which shells/runtimes actually exist on this PC, so the picker
	* only offers ones that will really work instead of just listing options
	* blindly. */
	async function checkShellAvailability(deviceName) {
		setShellAvailability({
			cmd: true,
			powershell: null,
			node: null,
			python: null
		});
		await Promise.all(SHELLS.filter((s) => s.probe).map(async (s) => {
			try {
				const { callId } = await remoteExecStart(session, deviceName, `where ${s.probe}`);
				let status = "pending";
				let chunks = [];
				const deadline = Date.now() + 5e3;
				while ((status === "pending" || status === "running") && Date.now() < deadline) {
					await new Promise((r) => setTimeout(r, 300));
					const st = await remoteExecStatus(session, callId);
					status = st.status;
					chunks = st.chunks;
				}
				const found = chunks.join("").trim().length > 0;
				setShellAvailability((prev) => ({
					...prev,
					[s.key]: found
				}));
			} catch {
				setShellAvailability((prev) => ({
					...prev,
					[s.key]: false
				}));
			}
		}));
	}
	/** Learns the real starting directory on the target PC when admin mode turns on. */
	async function bootstrapAdminCwd(deviceName) {
		try {
			const { callId } = await remoteExecStart(session, deviceName, "cd");
			let status = "pending";
			let chunks = [];
			const deadline = Date.now() + 5e3;
			while ((status === "pending" || status === "running") && Date.now() < deadline) {
				await new Promise((r) => setTimeout(r, 300));
				const st = await remoteExecStatus(session, callId);
				status = st.status;
				chunks = st.chunks;
			}
			const dir = chunks.join("").trim();
			if (dir) setAdminCwd(dir);
		} catch {}
	}
	/** Checks a folder actually exists on the target PC before navigating
	* into it, instead of trusting the typed path blindly. */
	async function remoteDirExists(deviceName, dirPath) {
		const { callId } = await remoteExecStart(session, deviceName, `if exist "${dirPath}\\" (echo __FL_DIR_OK__) else (echo __FL_DIR_MISSING__)`);
		let status = "pending";
		let chunks = [];
		const deadline = Date.now() + 6e3;
		while ((status === "pending" || status === "running") && Date.now() < deadline) {
			await new Promise((r) => setTimeout(r, 300));
			const st = await remoteExecStatus(session, callId);
			status = st.status;
			chunks = st.chunks;
		}
		return chunks.join("").includes("__FL_DIR_OK__");
	}
	async function runAdminPassThrough(line) {
		if (!adminDevice || !remote) return;
		if (!(await api("devices", {}, session)).devices.find((d) => d.name === adminDevice)?.online) throw new Error(`${adminDevice} is offline`);
		if (isCloudDeletionCommand(line)) throw new Error("Blocked: deletion commands targeting room cloud storage are not allowed.");
		const [word, ...rest] = line.trim().split(/\s+/);
		if (word?.toLowerCase() === "cd") {
			const arg = rest.join(" ");
			if (!arg) {
				push("out", adminCwd ?? "(unknown — run a command to establish one)");
				return;
			}
			const next = resolveWinPath(adminCwd, arg);
			if (!await remoteDirExists(adminDevice, next)) throw new Error(`The system cannot find the path specified: ${next}`);
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
	}
	function promptText() {
		if (passwordMode) return "password:";
		if (adminDevice && remote) return `@${remote.name}(admin):${adminCwd ?? remote.path}>`;
		if (remote) return `@${remote.name}:${remote.path}>`;
		return `${session.roomCode}:${cwd}>`;
	}
	async function run(raw) {
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
				bootstrapAdminCwd(remote.name);
				checkShellAvailability(remote.name);
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
					const r = await remoteCall(session, target, "info");
					const dev = (await api("devices", {}, session)).devices.find((d) => d.name.toLowerCase() === target.toLowerCase());
					const canonicalName = dev?.name ?? target;
					setRemote({
						name: canonicalName,
						path: "/"
					});
					if (dev?.admin || dev?.agent) {
						setAdminDevice(canonicalName);
						push("ok", `browsing ${canonicalName} live — ${r.root} (admin mode auto-enabled)`);
						bootstrapAdminCwd(canonicalName);
						checkShellAvailability(canonicalName);
						setShell("cmd");
					} else push("ok", `browsing ${canonicalName} live — ${r.root}`);
				}
				setBusy(false);
				return;
			}
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
						const r = await remoteCall(session, remote.name, "list", { path: remote.path });
						if (!r.folders.length && !r.files.length) push("dim", "(empty)");
						r.folders.forEach((f) => push("out", `${f.name}/`));
						r.files.forEach((f) => push("out", `${f.name}   ${humanSize(f.size)}`));
						break;
					}
					case "cd": {
						const next = resolvePath(remote.path, arg);
						await remoteCall(session, remote.name, "list", { path: next });
						setRemote({
							...remote,
							path: next
						});
						break;
					}
					case "search": {
						if (!arg) throw new Error("Usage: search <text>");
						const r = await remoteCall(session, remote.name, "search", {
							path: remote.path,
							query: arg
						});
						if (!r.matches.length) push("dim", "no matches");
						r.matches.forEach((m) => push("out", m.dir ? `${m.path}/` : m.path));
						break;
					}
					case "get": {
						if (!arg) throw new Error("Usage: get <file name>");
						const rel = arg.startsWith("/") ? arg : `${remote.path === "/" ? "" : remote.path}/${arg}`;
						push("dim", `pulling ${rel} straight from ${remote.name}…`);
						const fileName = await remoteDownload(session, remote.name, rel);
						push("ok", `${fileName} downloaded direct from ${remote.name}`);
						break;
					}
					case "devices":
						(await api("devices", {}, session)).devices.forEach((d) => push("out", `${d.online ? "● online " : "○ offline"}  ${d.name}`));
						break;
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
					default: push("err", `${cmd} is not available while browsing ${remote.name} — use ls, cd, search, get, admin, cd @`);
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
					const r = await api("ls", { path: cwd }, session);
					if (!r.folders.length && !r.files.length) push("dim", "(empty)");
					r.folders.forEach((f) => push("out", `${f.name}/`));
					r.files.forEach((f) => push("out", `${f.file_name}   ${humanSize(f.size_bytes)}  from ${f.from_name}${f.to_name ? ` → ${f.to_name}` : " (everyone)"}  [${f.status}]`));
					break;
				}
				case "cd":
					setCwd((await api("cd", { path: resolvePath(cwd, args.join(" ")) }, session)).path);
					break;
				case "mkdir":
					await api("mkdir", {
						path: cwd,
						name: args.join(" ")
					}, session);
					push("ok", `created ${args.join(" ")}/`);
					onChanged();
					break;
				case "send": {
					const i = args.findIndex((a) => a === "--to" || a === "to");
					await pickAndSend(i >= 0 ? args.slice(i + 1).join(" ") : null);
					push("dim", "choose a file in the picker…");
					break;
				}
				case "get": {
					const wanted = args.join(" ").toLowerCase();
					const match = (await api("ls", { path: cwd }, session)).files.find((f) => f.file_name.toLowerCase() === wanted);
					if (!match) throw new Error(`No file named "${args.join(" ")}" in ${cwd}`);
					await downloadTransfer(session, match.id);
					push("ok", `downloading ${match.file_name}`);
					break;
				}
				case "devices":
					(await api("devices", {}, session)).devices.forEach((d) => push("out", `${d.online ? "● online " : "○ offline"}  ${d.name}${d.platform ? `  ${d.platform}` : ""}`));
					break;
				case "tasks": {
					const r = await api("tasks", {}, session);
					push("out", "Sent");
					if (!r.sent.length) push("dim", "  nothing sent yet");
					r.sent.forEach((t) => push("out", `  ${t.file_name} → ${t.to_name ?? "everyone"}  [${t.status}]`));
					push("out", "Received");
					if (!r.received.length) push("dim", "  nothing received yet");
					r.received.forEach((t) => push("out", `  ${t.file_name} from ${t.from_name}  [${t.status}]`));
					break;
				}
				case "exec":
					if (!args.length) {
						push("err", "Usage: exec <device> <command>   e.g. exec Office PC dir");
						break;
					}
					pendingExec.current = {
						device: "",
						command: line
					};
					guarded("Enter the passcode to run a command on another PC.");
					break;
				default: push("err", `Unknown command: ${cmd} — type help`);
			}
		} catch (error) {
			push("err", error.message);
		}
		setBusy(false);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-terminal",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2 border-b border-border px-4 py-2.5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-2.5 rounded-full bg-destructive/70" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-2.5 rounded-full bg-warning/70" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-2.5 rounded-full bg-primary/70" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "ml-2 font-mono text-xs text-muted-foreground",
						children: ["filelink — ", session.roomCode]
					}),
					adminDevice && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative ml-auto",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => setShellMenuOpen((v) => !v),
							className: "ios-btn flex items-center gap-1.5 rounded-lg border border-border bg-cardhover px-2.5 py-1 font-mono text-[11px] font-semibold text-foreground hover:border-primary",
							children: [SHELLS.find((s) => s.key === shell)?.label, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "size-3" })]
						}), shellMenuOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "fixed inset-0 z-40",
							onClick: () => setShellMenuOpen(false)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "absolute right-0 top-full z-50 mt-1 w-40 rounded-xl border border-border bg-card p-1 shadow-2xl",
							children: SHELLS.map((s) => {
								const avail = shellAvailability[s.key];
								const disabled = avail === false;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									disabled,
									onClick: () => {
										setShell(s.key);
										setShellMenuOpen(false);
										push("dim", `switched to ${s.label}`);
									},
									className: `flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left font-mono text-[11px] ${shell === s.key ? "bg-primary text-primary-foreground" : disabled ? "cursor-not-allowed text-muted-foreground/40" : "text-foreground hover:bg-cardhover"}`,
									children: [
										s.label,
										avail === null && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-3 animate-spin" }),
										avail === false && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[9px]",
											children: "not found"
										})
									]
								}, s.key);
							})
						})] })]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex-1 overflow-y-auto p-4 font-mono text-[13px] leading-relaxed",
				children: [lines.map((l, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
					className: "whitespace-pre-wrap break-words " + (l.kind === "in" ? "text-muted-foreground" : l.kind === "ok" ? "text-primary" : l.kind === "err" ? "text-destructive" : l.kind === "warn" ? "text-warning" : l.kind === "dim" ? "text-muted-foreground/70" : "text-foreground"),
					children: l.text
				}, i)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref: endRef })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "flex items-center gap-2 border-t border-border px-4 py-3 font-mono text-[13px]",
				onSubmit: (e) => {
					e.preventDefault();
					const v = value;
					setValue("");
					run(v);
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: remote ? adminDevice ? "text-destructive" : "text-warning" : "text-primary",
					children: promptText()
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					autoFocus: true,
					value,
					disabled: busy,
					onChange: (e) => setValue(e.target.value),
					spellCheck: false,
					type: passwordMode ? "password" : "text",
					className: "flex-1 bg-transparent text-foreground caret-primary outline-none placeholder:text-muted-foreground/50",
					placeholder: busy ? "working…" : passwordMode ? "type passcode" : "type a command, e.g. ls"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				ref: fileRef,
				type: "file",
				className: "hidden",
				onChange: onFilePicked
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PasswordDialog, {
				open: lockReason !== null,
				reason: lockReason ?? "",
				onOpenChange: (v) => {
					if (!v) setLockReason(null);
				},
				onUnlocked: () => {
					if (pendingExec.current) {
						const cmdLine = pendingExec.current.command;
						pendingExec.current = null;
						runExec(cmdLine);
					}
				}
			})
		]
	});
}
var Progress = import_react.forwardRef(({ className, value, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Root, {
	ref,
	className: cn("relative h-2 w-full overflow-hidden rounded-full bg-primary/20", className),
	...props,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Indicator, {
		className: "h-full w-full flex-1 bg-primary transition-all",
		style: { transform: `translateX(-${100 - (value || 0)}%)` }
	})
}));
Progress.displayName = Root.displayName;
function StatusChip({ status }) {
	const map = {
		received: "bg-primary/15 text-primary",
		shared: "bg-accent/15 text-accent",
		pending: "bg-warning/15 text-warning"
	};
	const label = status === "pending" ? "waiting — device offline" : status === "shared" ? "in room" : status;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: `shrink-0 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide ${map[status] ?? "bg-muted text-muted-foreground"}`,
		children: label
	});
}
function SidePanel({ session, devices, sent, received, onRefresh, onOpenDevice }) {
	const [picked, setPicked] = (0, import_react.useState)([]);
	const [usage, setUsage] = (0, import_react.useState)(null);
	const [note, setNote] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		const t = setInterval(onRefresh, 8e3);
		return () => clearInterval(t);
	}, [onRefresh]);
	(0, import_react.useEffect)(() => {
		roomUsage(session).then(setUsage).catch(() => setUsage(null));
	}, [
		session,
		sent.length,
		received.length
	]);
	async function powerOff() {
		setNote(`ending session on ${picked.length} device(s)…`);
		for (const name of picked) try {
			await api("rpc", {
				target: name,
				method: "exit",
				params: {}
			}, session);
		} catch {}
		setPicked([]);
		setNote(null);
		onRefresh();
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-xl border border-border bg-card p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-xs font-semibold uppercase tracking-widest text-muted-foreground",
							children: "Room storage"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HardDrive, { className: "size-4 shrink-0 text-muted-foreground" })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Progress, {
						value: usage ? Math.min(100, usage.used / usage.quota * 100) : 0,
						className: "h-2"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 font-mono text-[11px] text-muted-foreground",
						children: usage ? `${humanSize(usage.used)} used · ${humanSize(usage.quota - usage.used)} free of ${humanSize(usage.quota)} · ${usage.files} files` : "reading…"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-xl border border-border bg-card p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-xs font-semibold uppercase tracking-widest text-muted-foreground",
							children: "Devices"
						}), picked.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: powerOff,
							className: "flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-destructive/50 px-2.5 text-xs text-destructive transition-colors hover:bg-destructive/10",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Power, { className: "size-3.5" }),
								" End session (",
								picked.length,
								")"
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
						className: "space-y-1",
						children: [devices.map((d) => {
							const me = d.id === session.deviceId;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex items-center gap-2 rounded-md px-1 py-1.5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "checkbox",
										disabled: me,
										checked: picked.includes(d.name),
										onChange: () => setPicked((p) => p.includes(d.name) ? p.filter((n) => n !== d.name) : [...p, d.name]),
										className: "size-4 shrink-0 accent-[var(--primary)] disabled:opacity-30",
										"aria-label": `Select ${d.name}`
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										onClick: () => !me && onOpenDevice(d.name),
										className: "flex min-w-0 flex-1 items-center gap-2 text-left",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Monitor, { className: `size-4 shrink-0 ${d.online ? "text-primary" : "text-muted-foreground/50"}` }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: `truncate text-sm ${me ? "font-medium text-foreground" : "text-foreground/85"}`,
											children: [d.name, me ? " (this one)" : ""]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: `flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] ${d.online ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`,
										children: [!d.online && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WifiOff, { className: "size-3" }), d.online ? "online" : "offline (cached)"]
									})
								]
							}, d.id);
						}), !devices.length && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
							className: "text-sm text-muted-foreground",
							children: "No devices yet"
						})]
					}),
					note && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 font-mono text-[11px] text-muted-foreground",
						children: note
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-xl border border-border bg-card p-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground",
					children: "Sent"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "space-y-2.5",
					children: [sent.slice(0, 6).map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "truncate text-foreground/90",
								children: t.file_name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusChip, { status: t.status })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "font-mono text-[11px] text-muted-foreground",
							children: [
								humanSize(t.size_bytes),
								" → ",
								t.to_name ?? "everyone",
								" · ",
								t.folder_path
							]
						})]
					}, t.id)), !sent.length && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "text-sm text-muted-foreground",
						children: "Nothing sent yet"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-xl border border-border bg-card p-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground",
					children: "Received"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "space-y-2.5",
					children: [received.slice(0, 6).map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "truncate text-foreground/90",
								children: t.file_name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => downloadTransfer(session, t.id),
								className: "h-8 shrink-0 rounded border border-border px-2 font-mono text-[11px] text-foreground/80 transition-colors hover:border-primary hover:text-primary",
								children: "save"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "font-mono text-[11px] text-muted-foreground",
							children: [
								humanSize(t.size_bytes),
								" from ",
								t.from_name,
								" · ",
								t.status
							]
						})]
					}, t.id)), !received.length && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "text-sm text-muted-foreground",
						children: "Nothing received yet"
					})]
				})]
			})
		]
	});
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", {
	variants: {
		variant: {
			default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
			destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
			outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
			secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
			ghost: "hover:bg-accent hover:text-accent-foreground",
			link: "text-primary underline-offset-4 hover:underline"
		},
		size: {
			default: "h-9 px-4 py-2",
			sm: "h-8 rounded-md px-3 text-xs",
			lg: "h-10 rounded-md px-8",
			icon: "h-9 w-9"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
var Button = import_react.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size,
			className
		})),
		ref,
		...props
	});
});
Button.displayName = "Button";
/**
* Browse the room or any online PC and pick a destination folder.
* Used for Copy / Move ("Paste here") and for Send to device.
*/
function DestinationDialog({ open, onOpenChange, session, devices, title, description, confirmLabel, allowDevicePick, onConfirm }) {
	const [device, setDevice] = (0, import_react.useState)("");
	const [path, setPath] = (0, import_react.useState)("/");
	const [extra, setExtra] = (0, import_react.useState)("");
	const [folders, setFolders] = (0, import_react.useState)([]);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const offline = !!device && !devices.find((d) => d.name === device)?.online;
	const load = (0, import_react.useCallback)(async () => {
		if (!open) return;
		if (offline) {
			setFolders([]);
			setError(null);
			setBusy(false);
			return;
		}
		setBusy(true);
		setError(null);
		try {
			if (!device) {
				const r = await api("ls", { path }, session);
				setFolders(r.folders.map((f) => f.name));
			} else {
				const r = await remoteCall(session, device, "list", { path });
				setFolders(r.folders.map((f) => f.name));
			}
		} catch (e) {
			setFolders([]);
			setError(e.message);
		}
		setBusy(false);
	}, [
		open,
		device,
		path,
		session,
		offline
	]);
	(0, import_react.useEffect)(() => {
		load();
	}, [load]);
	(0, import_react.useEffect)(() => {
		if (open) setPath("/");
	}, [open, device]);
	const crumbs = path.split("/").filter(Boolean);
	const targets = devices.filter((d) => d.name !== session.deviceName);
	const clean = extra.replace(/\\/g, "/").split("/").filter(Boolean).join("/");
	const finalPath = clean ? `${path === "/" ? "" : path}/${clean}` : path;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "max-w-lg",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: title }), description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: description })] }),
				allowDevicePick && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => setDevice(""),
						className: `flex min-h-10 items-center gap-2 rounded-md border px-3 text-xs transition-colors ${device === "" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HardDrive, { className: "size-4" }), " Room"]
					}), targets.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => setDevice(d.name),
						className: `flex min-h-10 items-center gap-2 rounded-md border px-3 text-xs transition-colors ${device === d.name ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Monitor, { className: "size-4" }),
							" ",
							d.name,
							!d.online && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[10px] opacity-70",
								children: "offline"
							})
						]
					}, d.id))]
				}),
				offline && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning",
					children: [device, " is offline — the file is saved in the cloud and delivered automatically the moment it comes back online."]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-1 overflow-x-auto rounded-md border border-border bg-background px-3 py-2 font-mono text-xs text-muted-foreground",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setPath("/"),
						className: "shrink-0 hover:text-primary",
						children: device || "room"
					}), crumbs.map((c, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "flex shrink-0 items-center gap-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-3" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setPath("/" + crumbs.slice(0, i + 1).join("/")),
							className: "hover:text-primary",
							children: c
						})]
					}, i))]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "max-h-64 min-h-32 overflow-y-auto rounded-md border border-border",
					children: [
						path !== "/" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => setPath(resolvePath(path, "..")),
							className: "flex min-h-11 w-full items-center gap-2 border-b border-border px-3 text-left text-sm text-muted-foreground hover:bg-muted/40",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CornerLeftUp, { className: "size-4" }), " up one folder"]
						}),
						busy && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "flex items-center gap-2 px-3 py-4 text-sm text-muted-foreground",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }), " loading…"]
						}),
						error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "px-3 py-4 text-sm text-destructive",
							children: error
						}),
						!busy && !error && folders.map((name) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => setPath(resolvePath(path, name)),
							className: "flex min-h-11 w-full items-center gap-2 border-b border-border px-3 text-left text-sm text-foreground last:border-0 hover:bg-muted/40",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Folder, { className: "size-4 text-warning" }),
								" ",
								name
							]
						}, name)),
						!busy && !error && !folders.length && path === "/" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "px-3 py-4 text-sm text-muted-foreground",
							children: "No folders here yet"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
					className: "block text-[11px] uppercase tracking-widest text-muted-foreground",
					children: "Or type a folder — it's created if it doesn't exist"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: extra,
					onChange: (e) => setExtra(e.target.value),
					placeholder: "grade 9/homework",
					className: "mt-2 h-11 w-full rounded-md border border-border bg-background px-3 font-mono text-sm text-foreground outline-none focus:border-primary"
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
					className: "gap-2 sm:justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "min-w-0 truncate font-mono text-xs text-muted-foreground",
						children: [
							device ? `@${device}` : "room",
							":",
							finalPath
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: () => onConfirm({
							device,
							path: finalPath
						}),
						children: confirmLabel
					})]
				})
			]
		})
	});
}
function initials(name) {
	const parts = name.replace(/[^a-zA-Z0-9 ]/g, " ").trim().split(/\s+/);
	if (parts.length === 0) return "PC";
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return (parts[0][0] + parts[1][0]).toUpperCase();
}
function DevicePickerButton({ label, onClick, className = "" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		onClick,
		className: `ios-btn flex h-10 shrink-0 items-center gap-2 rounded-xl border border-border bg-card px-3 text-xs font-medium text-foreground ${className}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Monitor, { className: "size-3.5 text-primary" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "max-w-[8.5rem] truncate",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "size-3 text-muted-foreground" })
		]
	});
}
function DevicePickerDialog({ open, onClose, devices, selected, onSelect, allowRoom = false, roomLabel = "Cloud room", onlineOnly = false, excludeName, multiple = false, selectedNames = [], onToggle, onSelectAll }) {
	const [q, setQ] = (0, import_react.useState)("");
	const list = (0, import_react.useMemo)(() => {
		const term = q.trim().toLowerCase();
		return devices.filter((d) => onlineOnly ? d.online : true).filter((d) => excludeName ? d.name !== excludeName : true).filter((d) => !term || d.name.toLowerCase().includes(term));
	}, [
		devices,
		q,
		onlineOnly,
		excludeName
	]);
	const allSelected = multiple && list.length > 0 && list.every((d) => selectedNames.includes(d.name));
	if (!open) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-[100] grid place-items-center bg-black/70 p-4 backdrop-blur-sm",
		onClick: onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "animate-main-ui flex w-full max-w-md flex-col gap-4 rounded-[28px] border border-border bg-card p-6 shadow-terminal md:p-8",
			onClick: (e) => e.stopPropagation(),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-base font-bold text-foreground md:text-lg",
							children: multiple ? "Select PCs" : "Select Target PC"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-0.5 text-xs text-muted-foreground",
							children: multiple ? "Tap to select one or more" : "Choose from connected endpoints"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex shrink-0 items-center gap-1.5",
						children: [multiple && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: onSelectAll,
							className: "ios-btn rounded-lg border border-border bg-cardhover px-2 py-1 text-[10px] font-semibold text-foreground hover:border-primary hover:text-primary",
							children: allSelected ? "Clear all" : "Select all"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: onClose,
							"aria-label": "Close",
							className: "ios-btn grid size-8 place-items-center rounded-full bg-border/60 text-muted-foreground",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative w-full",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: q,
						onChange: (e) => setQ(e.target.value),
						placeholder: "Search connected PCs by name...",
						className: "w-full rounded-xl border border-border bg-cardhover px-4 py-3 pl-10 text-sm font-medium text-foreground outline-none focus:border-primary"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "no-scrollbar max-h-72 space-y-2 overflow-y-auto pr-1",
					children: [
						allowRoom && !multiple && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => {
								onSelect("");
								onClose();
							},
							className: `ios-card-hover flex w-full items-center justify-between rounded-xl border p-4 text-left ${selected === "" ? "border-primary bg-primary/10" : "border-border/60 bg-cardhover/60"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex min-w-0 items-center gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid size-10 shrink-0 place-items-center rounded-xl bg-primary/20 text-sm font-bold text-primary",
									children: "RM"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "block truncate text-sm font-bold text-foreground",
										children: roomLabel
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-mono text-[11px] text-muted-foreground",
										children: "Files stored in the cloud"
									})]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "shrink-0 font-mono text-xs text-primary",
								children: "Select →"
							})]
						}),
						list.map((d) => {
							const isOn = multiple ? selectedNames.includes(d.name) : selected === d.name;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => {
									if (multiple) onToggle?.(d.name);
									else {
										onSelect(d.name);
										onClose();
									}
								},
								className: `ios-card-hover flex w-full items-center justify-between rounded-xl border p-4 text-left ${isOn ? "border-primary bg-primary/10" : "border-border/60 bg-cardhover/60"}`,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex min-w-0 items-center gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: `grid size-10 shrink-0 place-items-center rounded-xl text-sm font-bold ${d.online ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`,
										children: initials(d.name)
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "min-w-0",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "block truncate text-sm font-bold text-foreground",
											children: d.name
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "font-mono text-[11px] text-muted-foreground",
											children: [
												d.online ? "Connected" : "Offline",
												" · ",
												d.osInfo || d.platform || "PC",
												d.agent ? " · agent" : ""
											]
										})]
									})]
								}), multiple ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: `grid size-6 shrink-0 place-items-center rounded-full border ${isOn ? "border-primary bg-primary text-primary-foreground" : "border-border text-transparent"}`,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-3.5" })
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "shrink-0 font-mono text-xs text-primary",
									children: "Select →"
								})]
							}, d.id);
						}),
						list.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "rounded-xl border border-border/60 bg-cardhover/40 p-6 text-center text-sm text-muted-foreground",
							children: "No matching devices."
						})
					]
				}),
				multiple && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: onClose,
					className: "ios-btn w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground",
					children: ["Done ", selectedNames.length > 0 ? `(${selectedNames.length})` : ""]
				})
			]
		})
	});
}
/** Horizontal strip of available devices, shown once a target is picked. */
function AvailableDevicesBox({ devices, selected, onSelect, allowRoom = false, roomLabel = "Cloud room" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-[20px] border border-border bg-card p-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-2 flex items-center justify-between px-1",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
				className: "text-xs font-semibold text-muted-foreground",
				children: "Available devices"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "font-mono text-[11px] text-muted-foreground",
				children: [devices.filter((d) => d.online).length, " online"]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "no-scrollbar flex items-center gap-2 overflow-x-auto pb-1",
			children: [
				allowRoom && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => onSelect(""),
					className: `ios-btn flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium ${selected === "" ? "border-primary bg-primary/15 text-primary" : "border-border bg-cardhover/60 text-foreground"}`,
					children: roomLabel
				}),
				devices.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => onSelect(d.name),
					className: `ios-btn flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium ${selected === d.name ? "border-primary bg-primary/15 text-primary" : "border-border bg-cardhover/60 text-foreground"}`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `size-1.5 rounded-full ${d.online ? "bg-accent" : "bg-muted-foreground"}` }), d.name]
				}, d.id)),
				devices.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "px-2 py-1 text-xs text-muted-foreground",
					children: "No other devices in this room yet."
				})
			]
		})]
	});
}
function UploadSheet({ open, onClose, onUpload, destination }) {
	const inputRef = (0, import_react.useRef)(null);
	const [files, setFiles] = (0, import_react.useState)([]);
	const [over, setOver] = (0, import_react.useState)(false);
	if (!open) return null;
	function close() {
		setFiles([]);
		onClose();
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-[90] flex items-end justify-center bg-black/60 backdrop-blur-sm md:items-center",
		onClick: close,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "animate-sheet-up flex w-full flex-col rounded-t-[36px] border border-border bg-card p-6 pb-10 shadow-terminal md:max-w-lg md:rounded-[28px] md:p-8",
			onClick: (e) => e.stopPropagation(),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mx-auto mb-5 h-1.5 w-12 rounded-full bg-muted-foreground/30 md:hidden" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-5 flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid size-9 place-items-center rounded-xl bg-primary/20 text-primary",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "size-4" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-base font-semibold text-foreground",
							children: "Upload File"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "font-mono text-[11px] text-muted-foreground",
							children: ["to ", destination]
						})] })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: close,
						"aria-label": "Close",
						className: "ios-btn grid size-8 place-items-center rounded-full bg-border/60 text-muted-foreground",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					onClick: () => inputRef.current?.click(),
					onDragOver: (e) => {
						e.preventDefault();
						setOver(true);
					},
					onDragLeave: () => setOver(false),
					onDrop: (e) => {
						e.preventDefault();
						setOver(false);
						setFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
					},
					className: `ios-card-hover mb-6 cursor-pointer rounded-[20px] border-2 border-dashed p-10 text-center transition-colors ${over ? "border-primary bg-primary/10" : "border-border/80 bg-cardhover/40 hover:border-primary/50"}`,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, {
							className: "mx-auto mb-3 size-10 text-muted-foreground",
							strokeWidth: 1.5
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-medium text-foreground md:text-base",
							children: "Tap to browse files or drop here"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1.5 font-mono text-xs text-muted-foreground",
							children: "Multiple files supported"
						})
					]
				}),
				files.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "no-scrollbar mb-5 max-h-40 space-y-2 overflow-y-auto",
					children: files.map((f, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-cardhover/60 px-3 py-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "min-w-0 truncate font-mono text-xs text-foreground",
							children: f.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex shrink-0 items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono text-[11px] text-muted-foreground",
								children: humanSize(f.size)
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setFiles((prev) => prev.filter((_, j) => j !== i)),
								"aria-label": `Remove ${f.name}`,
								className: "grid size-5 place-items-center rounded-full text-muted-foreground hover:bg-border hover:text-foreground",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-3" })
							})]
						})]
					}, i))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: close,
						className: "ios-btn flex-1 rounded-xl bg-cardhover py-3.5 text-xs font-semibold text-foreground",
						children: "Cancel"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						disabled: files.length === 0,
						onClick: () => {
							onUpload(files);
							setFiles([]);
							onClose();
						},
						className: "ios-btn flex-1 rounded-xl bg-primary py-3.5 text-xs font-semibold text-primary-foreground disabled:opacity-40",
						children: ["Upload", files.length > 0 ? ` (${files.length})` : ""]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					ref: inputRef,
					type: "file",
					multiple: true,
					className: "hidden",
					onChange: (e) => setFiles((prev) => [...prev, ...Array.from(e.target.files ?? [])])
				})
			]
		})
	});
}
var CRC_TABLE = (() => {
	const table = /* @__PURE__ */ new Uint32Array(256);
	for (let i = 0; i < 256; i++) {
		let c = i;
		for (let k = 0; k < 8; k++) c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
		table[i] = c >>> 0;
	}
	return table;
})();
function crc32(bytes) {
	let c = 4294967295;
	for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 255] ^ c >>> 8;
	return (c ^ 4294967295) >>> 0;
}
function makeZip(entries) {
	const encoder = new TextEncoder();
	const chunks = [];
	const central = [];
	let offset = 0;
	for (const entry of entries) {
		const nameBytes = encoder.encode(entry.name);
		const crc = crc32(entry.bytes);
		const size = entry.bytes.length;
		const local = /* @__PURE__ */ new DataView(/* @__PURE__ */ new ArrayBuffer(30));
		local.setUint32(0, 67324752, true);
		local.setUint16(4, 20, true);
		local.setUint16(6, 2048, true);
		local.setUint16(8, 0, true);
		local.setUint16(10, 0, true);
		local.setUint16(12, 0, true);
		local.setUint32(14, crc, true);
		local.setUint32(18, size, true);
		local.setUint32(22, size, true);
		local.setUint16(26, nameBytes.length, true);
		local.setUint16(28, 0, true);
		chunks.push(new Uint8Array(local.buffer), nameBytes, entry.bytes);
		const dir = new Uint8Array(46 + nameBytes.length);
		const dv = new DataView(dir.buffer);
		dv.setUint32(0, 33639248, true);
		dv.setUint16(4, 20, true);
		dv.setUint16(6, 20, true);
		dv.setUint16(8, 2048, true);
		dv.setUint32(16, crc, true);
		dv.setUint32(20, size, true);
		dv.setUint32(24, size, true);
		dv.setUint16(28, nameBytes.length, true);
		dv.setUint32(42, offset, true);
		dir.set(nameBytes, 46);
		central.push(dir);
		offset += 30 + nameBytes.length + size;
	}
	const centralSize = central.reduce((n, c) => n + c.length, 0);
	const end = /* @__PURE__ */ new DataView(/* @__PURE__ */ new ArrayBuffer(22));
	end.setUint32(0, 101010256, true);
	end.setUint16(8, entries.length, true);
	end.setUint16(10, entries.length, true);
	end.setUint32(12, centralSize, true);
	end.setUint32(16, offset, true);
	return new Blob([
		...chunks,
		...central,
		new Uint8Array(end.buffer)
	], { type: "application/zip" });
}
function saveBlob(blob, fileName) {
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = fileName;
	document.body.appendChild(a);
	a.click();
	a.remove();
	setTimeout(() => URL.revokeObjectURL(url), 1e4);
}
var EXT_ICON$1 = [
	{
		test: /\.(png|jpe?g|gif|webp|svg|bmp|heic|avif|ico)$/i,
		icon: FileImage,
		tone: "text-accent"
	},
	{
		test: /\.(mp4|mov|mkv|avi|webm|m4v)$/i,
		icon: FilePlay,
		tone: "text-accent"
	},
	{
		test: /\.(mp3|wav|flac|ogg|m4a)$/i,
		icon: FileHeadphone,
		tone: "text-accent"
	},
	{
		test: /\.(zip|rar|7z|tar|gz|bz2|xz|apk|jar|iso)$/i,
		icon: FileArchive,
		tone: "text-warning"
	},
	{
		test: /\.(pdf|docx?|rtf|odt|txt|md|pages)$/i,
		icon: FileText,
		tone: "text-destructive"
	},
	{
		test: /\.(xlsx?|csv|numbers|ods|pptx?)$/i,
		icon: FileSpreadsheet,
		tone: "text-primary"
	},
	{
		test: /\.(js|mjs|ts|tsx|jsx|py|java|kt|c|h|cpp|cs|go|rs|rb|php|swift|html|css|json|yml|yaml|sh|bat|sql|exe|msi|dmg|app)$/i,
		icon: FileCodeCorner,
		tone: "text-primary"
	}
];
function iconFor(item) {
	if (item.kind === "folder") return {
		Icon: Folder,
		tone: "text-warning"
	};
	const hit = EXT_ICON$1.find((e) => e.test.test(item.name));
	return {
		Icon: hit?.icon ?? File$1,
		tone: hit?.tone ?? "text-muted-foreground"
	};
}
function FileBrowser({ session, devices, source, setSource, onChanged, searchQuery = "" }) {
	const [path, setPath] = (0, import_react.useState)("/");
	const [items, setItems] = (0, import_react.useState)([]);
	const [selected, setSelected] = (0, import_react.useState)([]);
	const [status, setStatus] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)(null);
	const [cached, setCached] = (0, import_react.useState)(null);
	const [disk, setDisk] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [clipboard, setClipboard] = (0, import_react.useState)(null);
	const [pasteOpen, setPasteOpen] = (0, import_react.useState)(false);
	const [sendOpen, setSendOpen] = (0, import_react.useState)(false);
	const [fullscreen, setFullscreen] = (0, import_react.useState)(false);
	const [view, setView] = (0, import_react.useState)("grid");
	const [lockReason, setLockReason] = (0, import_react.useState)(null);
	const pending = (0, import_react.useRef)(null);
	const [preview, setPreview] = (0, import_react.useState)({
		open: false,
		item: null,
		url: null,
		text: null,
		kind: "binary"
	});
	const [deviceModal, setDeviceModal] = (0, import_react.useState)(false);
	const [uploadOpen, setUploadOpen] = (0, import_react.useState)(false);
	const [treeOpen, setTreeOpen] = (0, import_react.useState)(false);
	const [treeEntries, setTreeEntries] = (0, import_react.useState)([]);
	(0, import_react.useEffect)(() => {
		const open = () => setUploadOpen(true);
		window.addEventListener("filelink:upload", open);
		return () => window.removeEventListener("filelink:upload", open);
	}, []);
	const scrollRef = (0, import_react.useRef)(null);
	const pullStart = (0, import_react.useRef)(null);
	const [pull, setPull] = (0, import_react.useState)(0);
	/** Ask for the passcode once per browser session before sensitive actions. */
	function guarded(reason, run) {
		if (isUnlocked()) return run();
		pending.current = run;
		setLockReason(reason);
	}
	const isRoom = !source;
	const deviceOnline = !!devices.find((d) => d.name === source)?.online;
	const load = (0, import_react.useCallback)(async () => {
		setBusy(true);
		setError(null);
		setCached(null);
		try {
			if (!source) {
				const r = await api("ls", { path }, session);
				setItems([...r.folders.map((f) => ({
					kind: "folder",
					name: f.name,
					size: 0
				})), ...r.files.map((f) => ({
					kind: "file",
					name: f.file_name,
					size: f.size_bytes,
					id: f.id,
					meta: `from ${f.from_name}${f.to_name ? ` → ${f.to_name}` : ""}`
				}))]);
				setDisk(null);
			} else {
				const r = await remoteCall(session, source, "list", { path });
				const next = [...r.folders.map((f) => ({
					kind: "folder",
					name: f.name,
					size: 0
				})), ...r.files.map((f) => ({
					kind: "file",
					name: f.name,
					size: f.size
				}))];
				setItems(next);
				writeSnapshot(session.roomCode, source, path, next);
				try {
					const d = await remoteCall(session, source, "disk");
					setDisk(d);
				} catch {
					setDisk(null);
				}
			}
		} catch (e) {
			const snap = source ? readSnapshot(session.roomCode, source, path) : null;
			if (snap) {
				setItems(snap.items);
				setCached(snap.at);
			} else {
				setItems([]);
				setError(e.message);
			}
		}
		setBusy(false);
	}, [
		session,
		source,
		path
	]);
	(0, import_react.useEffect)(() => {
		setSelected([]);
		load();
	}, [load]);
	const wasOnline = (0, import_react.useRef)(deviceOnline);
	(0, import_react.useEffect)(() => {
		if (source && deviceOnline && !wasOnline.current) load();
		wasOnline.current = deviceOnline;
	}, [
		deviceOnline,
		source,
		load
	]);
	const crumbs = (0, import_react.useMemo)(() => path.split("/").filter(Boolean), [path]);
	const shown = (0, import_react.useMemo)(() => searchQuery.trim() ? items.filter((i) => i.name.toLowerCase().includes(searchQuery.trim().toLowerCase())) : items, [items, searchQuery]);
	const picked = items.filter((i) => selected.includes(i.name));
	const pickItems = picked.map((i) => ({
		kind: i.kind,
		name: i.name,
		id: i.id,
		path: i.kind === "folder" ? resolvePath(path, i.name) : void 0
	}));
	function toggle(item) {
		setSelected((s) => s.includes(item.name) ? s.filter((n) => n !== item.name) : [...s, item.name]);
	}
	async function act(label, fn) {
		setBusy(true);
		setError(null);
		setStatus(label);
		try {
			await fn();
		} catch (e) {
			setError(e.message);
		}
		setStatus(null);
		setBusy(false);
	}
	const rel = (name) => `${path === "/" ? "" : path}/${name}`;
	const download = () => act("downloading…", async () => {
		if (picked.some((item) => item.kind === "folder")) {
			await doBundle();
			return;
		}
		for (const item of picked) if (isRoom) await downloadTransfer(session, item.id);
		else await remoteDownload(session, source, rel(item.name));
		onChanged();
	});
	/** One file's bytes, from the room or from a live PC. */
	async function fileBytes(item, dir) {
		if (isRoom) {
			const { url } = await api("download", { transferId: item.id }, session);
			return await (await fetch(url)).blob();
		}
		return await remoteFetchBytes(session, source, `${dir === "/" ? "" : dir}/${item.name}`);
	}
	/** Walk a folder and collect every file inside it, keeping relative paths. */
	async function walkFolder(dir, prefix, out) {
		let folders = [];
		let files = [];
		if (isRoom) {
			const r = await api("ls", { path: dir }, session);
			folders = r.folders ?? [];
			files = (r.files ?? []).map((f) => ({
				name: f.file_name,
				id: f.id
			}));
		} else {
			const r = await remoteCall(session, source, "list", { path: dir });
			folders = r.folders ?? [];
			files = r.files ?? [];
		}
		for (const f of files) {
			const blob = await fileBytes(f, dir);
			out.push({
				name: `${prefix}${f.name}`,
				bytes: new Uint8Array(await blob.arrayBuffer())
			});
		}
		for (const sub of folders) await walkFolder(`${dir === "/" ? "" : dir}/${sub.name}`, `${prefix}${sub.name}/`, out);
	}
	async function doBundle() {
		const entries = [];
		for (const item of picked) {
			if (item.kind === "folder") {
				await walkFolder(resolvePath(path, item.name), `${item.name}/`, entries);
				continue;
			}
			const blob = await fileBytes(item, path);
			entries.push({
				name: item.name,
				bytes: new Uint8Array(await blob.arrayBuffer())
			});
		}
		if (!entries.length) throw new Error("Nothing to bundle — the selection is empty");
		const single = picked.length === 1 && picked[0]?.kind === "folder" ? picked[0].name : null;
		saveBlob(makeZip(entries), `${single ?? `filelink-bundle-${Date.now()}`}.zip`);
	}
	const bundle = () => act("packaging…", doBundle);
	const remove = () => act("deleting…", async () => {
		if (!isRoom) throw new Error("Files on a PC can never be deleted from here");
		await removeItems(session, pickItems);
		setSelected([]);
		onChanged();
		await load();
	});
	const renameSelected = () => {
		const target = pickItems[0];
		if (!target) return;
		const next = window.prompt("New name", target.name);
		if (!next || next.trim() === target.name) return;
		act("renaming…", async () => {
			await renameItem(session, target, next.trim());
			setSelected([]);
			onChanged();
			await load();
		});
	};
	/** Read one clipboard entry as bytes, wherever it currently lives. */
	async function grabBytes(from, base, name, id) {
		if (!from) {
			const { url } = await api("download", { transferId: id }, session);
			return await (await fetch(url)).blob();
		}
		return await remoteFetchBytes(session, from, `${base === "/" ? "" : base}/${name}`);
	}
	const paste = (dest) => act("pasting…", async () => {
		if (!clipboard) return;
		const { items: clip, mode, from, base } = clipboard;
		if (!from && !dest.device) await copyMoveItems(session, clip, dest.path, mode);
		else {
			for (const it of clip) {
				if (it.kind === "folder") continue;
				const blob = await grabBytes(from, base, it.name, it.id);
				await uploadFile(session, new File([blob], it.name), dest.path, dest.device || null);
			}
			if (mode === "move" && !from) await removeItems(session, clip);
		}
		setClipboard(null);
		setPasteOpen(false);
		onChanged();
		await load();
	});
	const sendTo = (dest) => act("sending…", async () => {
		const target = dest.device || null;
		for (const item of picked) {
			if (item.kind === "folder") continue;
			let blob;
			if (isRoom) {
				const { url } = await api("download", { transferId: item.id }, session);
				blob = await (await fetch(url)).blob();
			} else blob = await remoteFetchBytes(session, source, rel(item.name));
			await uploadFile(session, new File([blob], item.name), dest.path, target);
		}
		setSendOpen(false);
		setSelected([]);
		onChanged();
	});
	async function onUpload(files) {
		if (!files.length) return;
		const batch = files.length > 1 ? {
			id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
			total: files.length
		} : void 0;
		await act("uploading…", async () => {
			let i = 0;
			for (const file of files) {
				i++;
				setStatus(files.length > 1 ? `uploading ${i} of ${files.length}: ${file.name}` : `uploading ${file.name}…`);
				if (isRoom) await uploadFile(session, file, path, null, batch);
				else await remoteUploadFile(session, source, path, file, batch);
			}
			onChanged();
			await load();
		});
	}
	async function newFolder() {
		const name = window.prompt("Folder name");
		if (!name) return;
		await act(`creating ${name}…`, async () => {
			if (isRoom) await api("mkdir", {
				path,
				name
			}, session);
			else await remoteCall(session, source, "mkdir", { path: `${path === "/" ? "" : path}/${name}` });
			onChanged();
			await load();
		});
	}
	function isTextFile(name) {
		return /\.(txt|md|json|js|mjs|cjs|ts|tsx|jsx|py|java|kt|c|h|cpp|cs|go|rs|rb|php|swift|html|css|yml|yaml|sh|bat|sql|log|cfg|ini|xml|csv)$/i.test(name);
	}
	function isImageFile(name) {
		return /\.(png|jpe?g|gif|webp|svg|bmp|heic|avif|ico)$/i.test(name);
	}
	async function previewItem(item) {
		if (item.kind === "folder") return;
		await act("opening preview…", async () => {
			let blob;
			if (isRoom) {
				const { url } = await api("download", { transferId: item.id }, session);
				blob = await (await fetch(url)).blob();
			} else blob = await remoteFetchBytes(session, source, rel(item.name));
			if (isImageFile(item.name)) {
				const url = URL.createObjectURL(blob);
				setPreview({
					open: true,
					item,
					url,
					text: null,
					kind: "image"
				});
			} else if (/\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(item.name)) {
				const url = URL.createObjectURL(blob);
				setPreview({
					open: true,
					item,
					url,
					text: null,
					kind: "audio"
				});
			} else if (/\.(mp4|webm|mov|m4v|ogv)$/i.test(item.name)) {
				const url = URL.createObjectURL(blob);
				setPreview({
					open: true,
					item,
					url,
					text: null,
					kind: "video"
				});
			} else if (isTextFile(item.name) || blob.size < 262144) {
				const text = await blob.text();
				setPreview({
					open: true,
					item,
					url: null,
					text,
					kind: "text"
				});
			} else if (/\.pdf$/i.test(item.name)) {
				const url = URL.createObjectURL(blob);
				setPreview({
					open: true,
					item,
					url,
					text: null,
					kind: "pdf"
				});
			} else setPreview({
				open: true,
				item,
				url: null,
				text: null,
				kind: "binary"
			});
		});
	}
	async function showTree() {
		await act("loading tree…", async () => {
			if (isRoom) {
				const r = await api("tree", {}, session);
				setTreeEntries((r.folders ?? []).map((f) => ({
					path: f.path,
					dir: true
				})));
			} else {
				const r = await remoteCall(session, source, "tree", { path });
				setTreeEntries(r.entries ?? []);
			}
			setTreeOpen(true);
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: fullscreen ? "fixed inset-0 z-50 flex min-h-0 flex-col overflow-hidden bg-card" : "flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-2 border-b border-border p-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center justify-between gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex min-w-0 items-center gap-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "hidden shrink-0 items-center gap-1.5 rounded-md border border-border px-2 py-1.5 font-mono text-[11px] whitespace-nowrap text-muted-foreground 2xl:flex",
								children: [isRoom ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HardDrive, { className: "size-3.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Monitor, { className: "size-3.5" }), isRoom ? "cloud room" : deviceOnline ? "live PC" : "cached"]
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex shrink-0 items-center gap-1",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => showTree(),
									className: "grid size-10 place-items-center rounded-md text-muted-foreground transition-colors hover:text-primary",
									"aria-label": "Directory tree",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderTree, { className: "size-4" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => {
										const file = picked.find((i) => i.kind === "file");
										if (file) previewItem(file);
									},
									disabled: !picked.find((i) => i.kind === "file"),
									className: "grid size-10 place-items-center rounded-md text-muted-foreground transition-colors hover:text-primary disabled:opacity-30",
									"aria-label": "Preview selected file",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "size-4" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => setView(view === "grid" ? "list" : "grid"),
									className: "grid size-10 place-items-center rounded-md text-muted-foreground transition-colors hover:text-primary",
									"aria-label": view === "grid" ? "Show as a list" : "Show as a grid",
									children: view === "grid" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(List, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LayoutGrid, { className: "size-4" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => fullscreen ? setFullscreen(false) : guarded("Enter the passcode to open fullscreen mode.", () => setFullscreen(true)),
									className: "grid size-10 place-items-center rounded-md text-muted-foreground transition-colors hover:text-primary",
									"aria-label": fullscreen ? "Leave fullscreen" : "Fullscreen",
									children: fullscreen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minimize2, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Maximize2, { className: "size-4" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DevicePickerButton, {
									label: source || `Room — ${session.roomName}`,
									onClick: () => setDeviceModal(true)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => void load(),
									className: "grid size-10 place-items-center rounded-md text-muted-foreground transition-colors hover:text-primary",
									"aria-label": "Refresh",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: `size-4 ${busy ? "animate-spin" : ""}` })
								}),
								(isRoom || deviceOnline) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: newFolder,
									className: "grid size-10 place-items-center rounded-md text-muted-foreground transition-colors hover:text-primary",
									"aria-label": "New folder",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderPlus, { className: "size-4" })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									onClick: () => setUploadOpen(true),
									className: "flex h-10 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "size-4" }),
										" ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "hidden sm:inline",
											children: "Upload"
										})
									]
								})] })
							]
						})]
					}),
					source && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvailableDevicesBox, {
						devices: devices.filter((d) => d.name !== session.deviceName),
						selected: source,
						onSelect: (name) => {
							setSource(name);
							setPath("/");
						},
						allowRoom: true,
						roomLabel: `Room — ${session.roomName}`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-1 overflow-x-auto",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setPath("/"),
								className: "grid size-8 shrink-0 place-items-center rounded text-muted-foreground hover:text-primary",
								"aria-label": "Top folder",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(House, { className: "size-4" })
							}),
							path !== "/" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setPath(resolvePath(path, "..")),
								className: "grid size-8 shrink-0 place-items-center rounded text-muted-foreground hover:text-primary",
								"aria-label": "Up one folder",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CornerLeftUp, { className: "size-4" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
								className: "flex min-w-0 flex-1 items-center gap-1 overflow-x-auto font-mono text-xs text-muted-foreground",
								children: crumbs.map((c, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "flex shrink-0 items-center gap-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-3" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: () => setPath("/" + crumbs.slice(0, i + 1).join("/")),
										className: "hover:text-primary",
										children: c
									})]
								}, i))
							}),
							disk && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "shrink-0 font-mono text-[11px] text-muted-foreground",
								children: [
									humanSize(disk.free),
									" free / ",
									humanSize(disk.total)
								]
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				ref: scrollRef,
				onTouchStart: (e) => {
					pullStart.current = scrollRef.current?.scrollTop === 0 ? e.touches[0].clientY : null;
				},
				onTouchMove: (e) => {
					if (pullStart.current === null) return;
					setPull(Math.max(0, Math.min(70, e.touches[0].clientY - pullStart.current)));
				},
				onTouchEnd: () => {
					if (pull > 55) load();
					pullStart.current = null;
					setPull(0);
				},
				className: "min-h-0 flex-1 overflow-y-auto p-3 [-webkit-overflow-scrolling:touch]",
				children: [
					pull > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-2 text-center font-mono text-[11px] text-primary",
						style: { height: pull / 2 },
						children: pull > 55 ? "release to refresh" : "pull to refresh"
					}),
					cached && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mb-3 flex items-center gap-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 font-mono text-[11px] text-warning",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WifiOff, { className: "size-3.5" }),
							" ",
							source,
							" is offline — showing the last known files"
						]
					}),
					error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-3 font-mono text-xs text-destructive",
						children: error
					}),
					status && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-3 font-mono text-xs text-muted-foreground",
						children: status
					}),
					!shown.length && !busy && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "py-10 text-center text-sm text-muted-foreground",
						children: "Nothing here"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: view === "grid" ? "grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-[repeat(auto-fill,minmax(124px,1fr))]" : "flex flex-col gap-1",
						children: shown.map((item) => {
							const { Icon, tone } = iconFor(item);
							const active = selected.includes(item.name);
							const open = () => item.kind === "folder" ? setPath(resolvePath(path, item.name)) : toggle(item);
							if (view === "list") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: `grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border px-3 py-2 transition-colors ${active ? "border-primary bg-primary/10" : "border-transparent hover:bg-background"}`,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: () => toggle(item),
										"aria-label": active ? `Unselect ${item.name}` : `Select ${item.name}`,
										className: `grid size-7 shrink-0 place-items-center rounded-md border text-[10px] ${active ? "border-primary bg-primary text-primary-foreground" : "border-border text-transparent"}`,
										children: "✓"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										onClick: open,
										className: "flex min-w-0 items-center gap-2 text-left",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: `size-5 shrink-0 ${tone}` }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "truncate font-mono text-xs text-foreground",
											children: item.name
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "shrink-0 font-mono text-[10px] text-muted-foreground",
										children: item.kind === "folder" ? "folder" : humanSize(item.size)
									})
								]
							}, `${item.kind}-${item.name}`);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: `relative rounded-xl border transition-colors ${active ? "border-primary bg-primary/10" : "border-transparent hover:bg-background"}`,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									onClick: open,
									className: "flex w-full flex-col items-center gap-2 p-3 text-center",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: `size-9 ${tone}` }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "line-clamp-2 w-full break-words font-mono text-[11px] text-foreground",
											children: item.name
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-mono text-[10px] text-muted-foreground",
											children: item.kind === "folder" ? "folder" : humanSize(item.size)
										})
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => toggle(item),
									"aria-label": active ? `Unselect ${item.name}` : `Select ${item.name}`,
									className: `absolute left-1.5 top-1.5 grid size-7 place-items-center rounded-md border text-[10px] ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card/80 text-transparent"}`,
									children: "✓"
								})]
							}, `${item.kind}-${item.name}`);
						})
					})
				]
			}),
			(selected.length > 0 || clipboard) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "border-t border-border bg-card p-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-2 flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground",
							children: clipboard ? `${clipboard.items.length} item(s) ready to ${clipboard.mode}${clipboard.from ? ` from ${clipboard.from}` : ""}` : `${selected.length} selected`
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => {
								setSelected([]);
								setClipboard(null);
							},
							className: "grid size-8 place-items-center rounded text-muted-foreground hover:text-foreground",
							"aria-label": "Clear selection",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-2",
						children: [clipboard && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolButton, {
							onClick: () => setPasteOpen(true),
							icon: ClipboardPaste,
							primary: true,
							children: "Choose target & paste"
						}), selected.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolButton, {
								onClick: download,
								icon: Download,
								disabled: busy,
								children: "Download"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolButton, {
								onClick: () => setSendOpen(true),
								icon: Send,
								disabled: busy,
								children: "Send to device"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolButton, {
								onClick: bundle,
								icon: Package,
								disabled: busy,
								children: "Bundle (.zip)"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolButton, {
								onClick: () => setClipboard({
									mode: "copy",
									items: pickItems,
									from: source,
									base: path
								}),
								icon: Copy,
								disabled: busy,
								children: "Copy"
							}),
							isRoom && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolButton, {
									onClick: () => guarded("Enter the passcode to rename items in the room.", renameSelected),
									icon: PenLine,
									disabled: busy || selected.length !== 1,
									children: "Rename"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolButton, {
									onClick: () => guarded("Enter the passcode to move files out of this folder.", () => setClipboard({
										mode: "move",
										items: pickItems,
										from: "",
										base: path
									})),
									icon: Scissors,
									disabled: busy,
									children: "Move"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolButton, {
									onClick: () => guarded("Enter the passcode to delete from the room.", () => void remove()),
									icon: Trash2,
									disabled: busy,
									danger: true,
									children: "Delete"
								})
							] })
						] })]
					}),
					!isRoom && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 font-mono text-[11px] text-muted-foreground",
						children: [
							"Files on ",
							source,
							" can't be deleted or changed from here — copying them out is fine."
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UploadSheet, {
				open: uploadOpen,
				onClose: () => setUploadOpen(false),
				onUpload: (files) => void onUpload(files),
				destination: isRoom ? `${session.roomName} · ${path}` : `${source} · ${path}`
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DevicePickerDialog, {
				open: deviceModal,
				onClose: () => setDeviceModal(false),
				devices: devices.filter((d) => d.name !== session.deviceName),
				selected: source,
				onSelect: (name) => {
					setSource(name);
					setPath("/");
				},
				allowRoom: true,
				roomLabel: `Room — ${session.roomName}`
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PasswordDialog, {
				open: !!lockReason,
				onOpenChange: (v) => !v && setLockReason(null),
				reason: lockReason ?? "",
				onUnlocked: () => {
					setLockReason(null);
					pending.current?.();
					pending.current = null;
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DestinationDialog, {
				open: pasteOpen,
				onOpenChange: setPasteOpen,
				session,
				devices,
				title: clipboard?.mode === "copy" ? "Copy to…" : "Move to…",
				description: "Pick the room or any device, open the folder, then paste. Missing folders are created for you.",
				confirmLabel: "Paste here",
				allowDevicePick: true,
				onConfirm: paste
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DestinationDialog, {
				open: sendOpen,
				onOpenChange: setSendOpen,
				session,
				devices,
				title: "Send to…",
				description: "Pick the device and the folder it should land in.",
				confirmLabel: "Send here",
				allowDevicePick: true,
				onConfirm: sendTo
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: preview.open,
				onOpenChange: (v) => !v && setPreview((p) => ({
					...p,
					open: false
				})),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "max-w-3xl",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
						className: "truncate",
						children: preview.item?.name ?? "Preview"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: preview.item ? `${humanSize(preview.item.size)} · ${isRoom ? "room" : source}` : "" })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "max-h-[60vh] overflow-auto rounded-md border border-border bg-background p-3",
						children: [
							preview.kind === "image" && preview.url && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: preview.url,
								alt: preview.item?.name ?? "preview",
								className: "mx-auto max-h-full max-w-full"
							}),
							preview.kind === "text" && preview.text !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
								className: "whitespace-pre-wrap break-words font-mono text-xs text-foreground",
								children: preview.text
							}),
							preview.kind === "pdf" && preview.url && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("iframe", {
								src: preview.url,
								title: preview.item?.name ?? "pdf",
								className: "h-[50vh] w-full"
							}),
							preview.kind === "audio" && preview.url && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("audio", {
								src: preview.url,
								controls: true,
								className: "w-full"
							}),
							preview.kind === "video" && preview.url && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
								src: preview.url,
								controls: true,
								className: "mx-auto max-h-[55vh] w-full rounded-lg bg-black"
							}),
							preview.kind === "binary" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-center text-sm text-muted-foreground",
								children: "Preview is not available for this file type. Use Download to open it locally."
							})
						]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: treeOpen,
				onOpenChange: setTreeOpen,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "max-w-lg",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Directory tree" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: isRoom ? "Every folder in the room" : `Shared folders on ${source}` })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "max-h-[60vh] overflow-auto rounded-md border border-border bg-background p-2",
						children: treeEntries.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "p-2 text-xs text-muted-foreground",
							children: "No folders"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TreeView, {
							entries: treeEntries,
							onOpenPath: (p) => {
								setPath(p);
								setTreeOpen(false);
							}
						})
					})]
				})
			})
		]
	});
}
/** Turns a flat {path,dir}[] list into a real collapsible tree, grouped by
* path segments — the folder/room "tree" view used to just print every full
* path as a flat, indented list of raw strings. This actually nests. */
function TreeView({ entries, onOpenPath }) {
	const root = (0, import_react.useMemo)(() => {
		const top = {
			name: "",
			path: "/",
			dir: true,
			children: /* @__PURE__ */ new Map()
		};
		for (const e of entries) {
			const parts = e.path.split("/").filter(Boolean);
			let cursor = top;
			let acc = "";
			parts.forEach((part, i) => {
				acc += `/${part}`;
				const isLast = i === parts.length - 1;
				let next = cursor.children.get(part);
				if (!next) {
					next = {
						name: part,
						path: acc,
						dir: isLast ? e.dir : true,
						children: /* @__PURE__ */ new Map()
					};
					cursor.children.set(part, next);
				}
				cursor = next;
			});
		}
		return top;
	}, [entries]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TreeNode, {
		node: root,
		depth: 0,
		onOpenPath
	});
}
function TreeNode({ node, depth, onOpenPath }) {
	const [open, setOpen] = (0, import_react.useState)(depth < 1);
	const children = Array.from(node.children.values()).sort((a, b) => a.dir === b.dir ? a.name.localeCompare(b.name) : a.dir ? -1 : 1);
	if (depth === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: children.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TreeNode, {
		node: c,
		depth: 1,
		onOpenPath
	}, c.path)) });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		onClick: () => node.dir ? setOpen((o) => !o) : void 0,
		className: "flex w-full items-center gap-1.5 rounded-md py-1 text-left font-mono text-xs hover:bg-cardhover",
		style: { paddingLeft: `${(depth - 1) * 16 + 4}px` },
		children: [
			node.dir ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: `size-3.5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}` }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "inline-block size-3.5 shrink-0" }),
			node.dir ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Folder, { className: "size-3.5 shrink-0 text-primary" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(File$1, { className: "size-3.5 shrink-0 text-muted-foreground" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "truncate text-foreground",
				children: node.name
			}),
			node.dir && node.children.size > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				role: "button",
				onClick: (e) => {
					e.stopPropagation();
					onOpenPath(node.path);
				},
				className: "ml-auto shrink-0 rounded px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-primary",
				children: "open"
			})
		]
	}), node.dir && open && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: children.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TreeNode, {
		node: c,
		depth: depth + 1,
		onOpenPath
	}, c.path)) })] });
}
function ToolButton({ onClick, icon: Icon, children, disabled, danger, primary }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		onClick,
		disabled,
		className: `flex h-10 items-center gap-1.5 rounded-md border px-3 text-xs transition-colors disabled:opacity-40 ${primary ? "border-primary bg-primary text-primary-foreground" : danger ? "border-destructive/50 text-destructive hover:bg-destructive/10" : "border-border text-foreground hover:border-primary hover:text-primary"}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4" }),
			" ",
			children
		]
	});
}
function FileExplorerTab({ session, devices, source, setSource, onChanged }) {
	const [query, setQuery] = (0, import_react.useState)("");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-full flex-col gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				value: query,
				onChange: (e) => setQuery(e.target.value),
				placeholder: "Search files and folders…",
				className: "w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 font-mono text-sm text-foreground outline-none focus:border-primary"
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "min-h-0 flex-1",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileBrowser, {
				session,
				devices,
				source,
				setSource,
				onChanged,
				searchQuery: query
			})
		})]
	});
}
/** Browser executables → friendly names. */
var BROWSERS = {
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
	"tor.exe": "Tor Browser"
};
/** Windows system processes (the "Windows processes" group). */
var WINDOWS_PROCESSES = /* @__PURE__ */ new Set([
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
	"gamebar.exe"
]);
/** Friendly names for common apps. Anything not listed is auto-prettified. */
var FRIENDLY = {
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
	"xampp-control.exe": "XAMPP Control Panel"
};
function isBrowserExe(exe) {
	return exe.toLowerCase() in BROWSERS;
}
function isWindowsProcess(exe) {
	return WINDOWS_PROCESSES.has(exe.toLowerCase());
}
/** "notepad++.exe" → "Notepad++", "my_app.exe" → "My App". */
function friendlyName(exe) {
	const lower = exe.toLowerCase();
	if (FRIENDLY[lower]) return FRIENDLY[lower];
	if (BROWSERS[lower]) return BROWSERS[lower];
	const spaced = exe.replace(/\.exe$/i, "").replace(/[_-]+/g, " ").trim();
	if (!spaced) return exe;
	if (/[A-Z]/.test(spaced)) return spaced;
	return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
function num(v) {
	return typeof v === "number" && Number.isFinite(v) ? v : 0;
}
function sumGroup(exe, label, procs) {
	let ram = 0;
	let cpu = 0;
	let disk = 0;
	let network = 0;
	let gpu = 0;
	let icon;
	let windowTitle;
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
		processes: [...procs].sort((a, b) => num(b.ram) - num(a.ram))
	};
}
/** Old agents don't report window titles — fall back to a usage heuristic
* so the Apps group still isn't empty. */
function looksLikeApp(p, anyHasWindowInfo) {
	if (anyHasWindowInfo) return Boolean(p.windowTitle && p.windowTitle.trim());
	return num(p.cpu) >= .5 || num(p.ram) >= 10485760;
}
function classifyProcesses(raw) {
	const anyHasWindowInfo = raw.some((p) => p.windowTitle !== void 0);
	const byExe = /* @__PURE__ */ new Map();
	for (const p of raw) {
		const exe = String(p.name || "").toLowerCase();
		if (!exe) continue;
		const list = byExe.get(exe);
		if (list) list.push(p);
		else byExe.set(exe, [p]);
	}
	const apps = [];
	const windows = [];
	const background = [];
	const browsers = [];
	for (const [exe, procs] of byExe) {
		const label = friendlyName(procs[0].name);
		if (isBrowserExe(exe)) {
			const byProfile = /* @__PURE__ */ new Map();
			const byPid = new Map(procs.map((p) => [p.pid, p]));
			const profileOf = (p, depth = 0) => {
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
			const profiles = Array.from(byProfile, ([name, list]) => {
				const sorted = [...list].sort((a, b) => num(b.ram) - num(a.ram));
				return {
					key: `${exe}:${name}`,
					name,
					windowTitle: sorted.find((p) => p.windowTitle)?.windowTitle,
					ram: sorted.reduce((s, p) => s + num(p.ram), 0),
					cpu: sorted.reduce((s, p) => s + num(p.cpu), 0),
					count: sorted.length,
					processes: sorted
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
				profiles
			});
			continue;
		}
		const group = sumGroup(exe, label, procs);
		if (isWindowsProcess(exe)) windows.push(group);
		else if (procs.some((p) => looksLikeApp(p, anyHasWindowInfo))) apps.push(group);
		else background.push(group);
	}
	const byRam = (a, b) => b.ram - a.ram;
	apps.sort(byRam);
	windows.sort(byRam);
	background.sort(byRam);
	browsers.sort(byRam);
	return {
		apps,
		browsers,
		windows,
		background,
		total: raw.length
	};
}
var CATEGORY_LABELS = {
	apps: "Apps",
	browsers: "Browsers",
	windows: "Windows processes",
	background: "Background processes"
};
/** 1_234_567 → "1.2 MB" */
function formatBytes(n) {
	if (!Number.isFinite(n) || n <= 0) return "0 MB";
	const units = [
		"B",
		"KB",
		"MB",
		"GB",
		"TB"
	];
	let v = n;
	let i = 0;
	while (v >= 1024 && i < units.length - 1) {
		v /= 1024;
		i++;
	}
	return `${v >= 100 || i === 0 ? Math.round(v) : v.toFixed(1)} ${units[i]}`;
}
function ProcessIcon({ icon }) {
	if (icon) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
		src: icon,
		alt: "",
		className: "size-6 rounded-md object-contain",
		onError: (e) => {
			e.target.style.display = "none";
		}
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid size-6 place-items-center rounded-md border border-border bg-cardhover",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Monitor, { className: "size-3.5 text-muted-foreground" })
	});
}
var sum = (ps, k) => ps.reduce((a, p) => a + (p[k] ?? 0), 0);
function procRow(p, depth, label) {
	return {
		key: `p:${p.pid}`,
		depth,
		name: label ?? p.name,
		sub: `${p.role ? `${p.role} · ` : ""}PID ${p.pid}`,
		icon: p.icon,
		pids: [p.pid],
		cpu: p.cpu ?? 0,
		ram: p.ram ?? 0,
		disk: p.disk ?? 0,
		network: p.network ?? 0,
		gpu: p.gpu ?? 0,
		status: p.status,
		expandable: false
	};
}
function TasksTab({ session, devices }) {
	const [target, setTarget] = (0, import_react.useState)("");
	const [processes, setProcesses] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [lockReason, setLockReason] = (0, import_react.useState)(null);
	const [pendingKill, setPendingKill] = (0, import_react.useState)(null);
	const [filter, setFilter] = (0, import_react.useState)("all");
	const [collapsedSections, setCollapsedSections] = (0, import_react.useState)(/* @__PURE__ */ new Set());
	const [search, setSearch] = (0, import_react.useState)("");
	const [expanded, setExpanded] = (0, import_react.useState)(/* @__PURE__ */ new Set());
	const [addOpen, setAddOpen] = (0, import_react.useState)(false);
	const [dontAskEnd, setDontAskEnd] = (0, import_react.useState)(false);
	const [dontAskEndSession, setDontAskEndSession] = (0, import_react.useState)(false);
	const [selectMode, setSelectMode] = (0, import_react.useState)(false);
	const [picked, setPicked] = (0, import_react.useState)(/* @__PURE__ */ new Set());
	const [bulkConfirm, setBulkConfirm] = (0, import_react.useState)(false);
	const [bulkProgress, setBulkProgress] = (0, import_react.useState)(null);
	const holdTimer = (0, import_react.useRef)(null);
	const held = (0, import_react.useRef)(false);
	const onlineTargets = devices.filter((d) => d.online && d.name !== session.deviceName);
	const selected = devices.find((d) => d.name === target);
	/** Press-and-hold (~450ms) on any row turns on multi-select, iOS style. */
	function holdHandlers(pids) {
		const start = () => {
			held.current = false;
			holdTimer.current = window.setTimeout(() => {
				held.current = true;
				setSelectMode(true);
				setPicked((p) => /* @__PURE__ */ new Set([...p, ...pids]));
				if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(12);
			}, 450);
		};
		const cancel = () => {
			if (holdTimer.current) window.clearTimeout(holdTimer.current);
			holdTimer.current = null;
		};
		return {
			onPointerDown: start,
			onPointerUp: cancel,
			onPointerLeave: cancel,
			onPointerCancel: cancel,
			onContextMenu: (e) => e.preventDefault(),
			onClick: () => {
				if (held.current) {
					held.current = false;
					return;
				}
				if (selectMode) togglePick(pids);
			}
		};
	}
	function togglePick(pids) {
		setPicked((p) => {
			const next = new Set(p);
			const allOn = pids.every((x) => next.has(x));
			for (const x of pids) if (allOn) next.delete(x);
			else next.add(x);
			return next;
		});
	}
	function exitSelectMode() {
		setSelectMode(false);
		setPicked(/* @__PURE__ */ new Set());
	}
	async function killPicked() {
		const pids = Array.from(picked);
		setBulkConfirm(false);
		setBulkProgress({
			done: 0,
			total: pids.length
		});
		try {
			await doKillMany(pids);
		} catch {}
		setBulkProgress(null);
		exitSelectMode();
	}
	const load = (0, import_react.useCallback)(async () => {
		if (!target) return;
		setLoading(true);
		try {
			const r = await remoteTasklist(session, target);
			setProcesses((r.processes ?? []).map((p) => ({
				...p,
				disk: p.disk ?? 0,
				network: p.network ?? 0,
				gpu: p.gpu ?? 0
			})));
		} catch (e) {
			setProcesses([]);
		}
		setLoading(false);
	}, [session, target]);
	(0, import_react.useEffect)(() => {
		load();
	}, [load]);
	async function kill(pids, name) {
		if (!isUnlocked()) {
			setPendingKill({
				pids,
				name
			});
			setLockReason("Enter the passcode to end a process on a remote PC.");
			return;
		}
		if (dontAskEndSession) {
			await doKillMany(pids);
			return;
		}
		setPendingKill({
			pids,
			name
		});
	}
	async function doKillMany(pids) {
		if (!target || pids.length === 0) return;
		const { callId } = await remoteExecStart(session, target, pids.map((pid) => `taskkill /pid ${pid} /f`).join(" & "));
		for (let i = 0; i < 40; i++) {
			const st = await remoteExecStatus(session, callId);
			if (st.status === "done" || st.status === "error") break;
			await new Promise((r) => setTimeout(r, 300));
		}
		await load();
	}
	const rows = (0, import_react.useMemo)(() => {
		const q = search.trim().toLowerCase();
		const c = classifyProcesses(q ? processes.filter((p) => p.name.toLowerCase().includes(q) || (p.windowTitle ?? "").toLowerCase().includes(q)) : processes);
		const out = [];
		const groupRows = (g) => {
			const res = [{
				key: `g:${g.key}`,
				depth: 0,
				name: g.label,
				sub: g.windowTitle,
				icon: g.icon,
				pids: g.processes.map((p) => p.pid),
				cpu: g.cpu,
				ram: g.ram,
				disk: g.disk,
				network: g.network,
				gpu: g.gpu,
				status: g.processes[0]?.status,
				expandable: g.count > 1,
				count: g.count
			}];
			if (g.count > 1 && expanded.has(`g:${g.key}`)) for (const p of g.processes) res.push(procRow(p, 1));
			return res;
		};
		for (const cat of [
			"apps",
			"browsers",
			"windows",
			"background"
		]) {
			if (filter !== "all" && filter !== cat) continue;
			const count = c[cat].length;
			if (count === 0) continue;
			out.push({
				key: `h:${cat}`,
				depth: 0,
				name: CATEGORY_LABELS[cat],
				pids: [],
				cpu: 0,
				ram: 0,
				disk: 0,
				network: 0,
				gpu: 0,
				expandable: false,
				header: cat,
				count
			});
			if (collapsedSections.has(cat)) continue;
			if (cat === "browsers") for (const b of c.browsers) {
				const bKey = `b:${b.key}`;
				const allPids = b.profiles.flatMap((pr) => pr.processes.map((p) => p.pid));
				out.push({
					key: bKey,
					depth: 0,
					name: b.label,
					sub: `${b.profiles.length} profile${b.profiles.length === 1 ? "" : "s"}`,
					icon: b.icon,
					pids: allPids,
					cpu: b.cpu,
					ram: b.ram,
					disk: sum(b.profiles.flatMap((pr) => pr.processes), "disk"),
					network: sum(b.profiles.flatMap((pr) => pr.processes), "network"),
					gpu: sum(b.profiles.flatMap((pr) => pr.processes), "gpu"),
					expandable: true,
					count: b.count
				});
				if (!expanded.has(bKey)) continue;
				for (const pr of b.profiles) {
					const pKey = `bp:${pr.key}`;
					out.push({
						key: pKey,
						depth: 1,
						name: `Profile: ${pr.name}`,
						sub: pr.windowTitle,
						icon: void 0,
						pids: pr.processes.map((p) => p.pid),
						cpu: pr.cpu,
						ram: pr.ram,
						disk: sum(pr.processes, "disk"),
						network: sum(pr.processes, "network"),
						gpu: sum(pr.processes, "gpu"),
						expandable: true,
						count: pr.count
					});
					if (!expanded.has(pKey)) continue;
					for (const p of pr.processes) out.push(procRow(p, 2, b.label));
				}
			}
			else for (const g of c[cat]) out.push(...groupRows(g));
		}
		return out;
	}, [
		processes,
		filter,
		search,
		expanded,
		collapsedSections
	]);
	const allPickable = (0, import_react.useMemo)(() => Array.from(new Set(rows.filter((r) => !r.header).flatMap((r) => r.pids))), [rows]);
	function toggleSection(cat) {
		setCollapsedSections((prev) => {
			const next = new Set(prev);
			if (next.has(cat)) next.delete(cat);
			else next.add(cat);
			return next;
		});
	}
	function toggleExpand(name) {
		setExpanded((prev) => {
			const next = new Set(prev);
			if (next.has(name)) next.delete(name);
			else next.add(name);
			return next;
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-full flex-col gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-[20px] border border-border bg-card p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-base font-bold text-foreground",
							children: "Target PC Processes"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground",
							children: "Select a host to view, search, and manage its running tasks."
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => setAddOpen(true),
							disabled: onlineTargets.length === 0,
							className: "ios-btn flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:brightness-110 disabled:opacity-40",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Monitor, { className: "size-4" }), " Select Device"]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-2.5 sm:flex-row sm:items-center",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: search,
								onChange: (e) => setSearch(e.target.value),
								placeholder: "Search processes by name...",
								className: "w-full rounded-xl border border-border bg-cardhover py-2.5 pl-10 pr-3 text-sm text-foreground outline-none focus:border-primary"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => void load(),
							disabled: !target || loading,
							className: "ios-btn flex w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-border bg-cardhover px-4 py-2.5 text-sm font-semibold text-foreground hover:text-primary disabled:opacity-40 sm:w-auto",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Activity, { className: `size-4 ${loading ? "animate-spin" : ""}` }), " Refresh"]
						})]
					}),
					selected && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: `rounded-full px-2.5 py-1 text-[11px] font-medium ${selected.agent ? "bg-warning/15 text-warning" : "bg-primary/15 text-primary"}`,
							children: selected.agent ? "Background mode" : "In use"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "font-mono text-xs text-muted-foreground",
							children: [
								processes.length,
								" process",
								processes.length !== 1 ? "es" : ""
							]
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "no-scrollbar flex items-center gap-2 overflow-x-auto",
				children: [
					"all",
					"apps",
					"browsers",
					"windows",
					"background"
				].map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => setFilter(f),
					className: `ios-btn rounded-xl px-4 py-2 text-xs font-semibold capitalize ${filter === f ? "bg-primary text-primary-foreground" : "border border-border bg-card text-muted-foreground hover:text-foreground"}`,
					children: f === "all" ? "All" : CATEGORY_LABELS[f]
				}, f))
			}),
			target && !selectMode && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-mono text-[11px] text-muted-foreground",
				children: "Tip: press and hold a row to select several processes at once."
			}),
			selectMode && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center gap-2 rounded-2xl border border-primary/40 bg-primary/10 p-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "min-w-0 flex-1 font-mono text-xs text-foreground",
						children: bulkProgress ? `Ending ${bulkProgress.done} of ${bulkProgress.total}…` : `${picked.size} process${picked.size !== 1 ? "es" : ""} selected`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setPicked(new Set(allPickable)),
						className: "ios-btn rounded-lg border border-border bg-card px-3 py-1.5 text-[11px] font-semibold text-foreground",
						children: "Select all"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						disabled: !picked.size || !!bulkProgress,
						onClick: () => setBulkConfirm(true),
						className: "ios-btn flex items-center gap-1.5 rounded-lg bg-destructive px-3 py-1.5 text-[11px] font-bold text-destructive-foreground disabled:opacity-40",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skull, { className: "size-3.5" }), " End selected"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: exitSelectMode,
						className: "ios-btn grid size-7 place-items-center rounded-full bg-border/60 text-muted-foreground",
						"aria-label": "Exit selection",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-3.5" })
					})
				]
			}),
			!target && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid flex-1 place-items-center rounded-[20px] border border-border bg-card p-6 text-center text-muted-foreground",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Activity, { className: "mx-auto size-8 opacity-50" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm",
					children: "Choose an online device to view its processes."
				})] })
			}),
			target && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "min-h-0 flex-1 overflow-auto rounded-[20px] border border-border bg-card",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full text-left text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
						className: "sticky top-0 z-10 bg-card text-xs uppercase tracking-wider text-muted-foreground",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-4 py-3",
								children: "Process"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-4 py-3",
								children: "Status"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-4 py-3",
								children: "CPU"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-4 py-3",
								children: "Memory"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-4 py-3",
								children: "Disk"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-4 py-3",
								children: "Network"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-4 py-3",
								children: "GPU"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-4 py-3 text-right",
								children: "Action"
							})
						] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", {
						className: "divide-y divide-border font-mono text-xs",
						children: [rows.map((r) => {
							if (r.header) {
								const closed = collapsedSections.has(r.header);
								return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
									onClick: () => toggleSection(r.header),
									className: "cursor-pointer bg-cardhover/60 hover:bg-cardhover",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										colSpan: 8,
										className: "px-4 py-2",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
											children: [
												closed ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-3.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "size-3.5" }),
												r.name,
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "font-normal",
													children: [
														"(",
														r.count,
														")"
													]
												})
											]
										})
									})
								}, r.key);
							}
							const open = expanded.has(r.key);
							const on = r.pids.length > 0 && r.pids.every((x) => picked.has(x));
							const pad = r.depth === 0 ? "" : r.depth === 1 ? "pl-8" : "pl-14";
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								...holdHandlers(r.pids),
								className: `select-none hover:bg-cardhover/50 ${r.depth ? "bg-cardhover/30" : ""} ${on ? "bg-primary/10" : ""}`,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: `px-4 py-2.5 ${pad}`,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-2",
											children: [
												selectMode && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: `grid size-5 shrink-0 place-items-center rounded-md border text-[10px] ${on ? "border-primary bg-primary text-primary-foreground" : "border-border text-transparent"}`,
													children: "✓"
												}),
												r.expandable ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													onClick: (e) => {
														e.stopPropagation();
														toggleExpand(r.key);
													},
													className: "grid size-5 place-items-center rounded-md text-muted-foreground hover:text-foreground",
													children: open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "size-3.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-3.5" })
												}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-5" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProcessIcon, { icon: r.icon }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "min-w-0",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
														className: `truncate ${r.depth === 2 ? "text-muted-foreground" : "text-foreground"}`,
														children: [r.name, r.expandable && r.count ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
															className: "ml-1.5 text-[10px] text-muted-foreground",
															children: [
																"(",
																r.count,
																")"
															]
														}) : null]
													}), r.sub && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "truncate text-[10px] text-muted-foreground",
														children: r.sub
													})]
												})
											]
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-4 py-2.5 text-muted-foreground",
										children: r.status || "Running"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
										className: "px-4 py-2.5",
										children: [r.cpu.toFixed(1), "%"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-4 py-2.5",
										children: humanSize(r.ram)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-4 py-2.5",
										children: r.disk > 0 ? `${r.disk.toFixed(1)} MB/s` : "—"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-4 py-2.5",
										children: r.network > 0 ? `${r.network.toFixed(1)} Mbps` : "—"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-4 py-2.5",
										children: r.gpu > 0 ? `${r.gpu.toFixed(1)}%` : "—"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-4 py-2.5 text-right",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											disabled: selectMode,
											onClick: (e) => {
												e.stopPropagation();
												kill(r.pids, r.name);
											},
											className: "ios-btn inline-flex items-center gap-1 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 px-3 py-1.5 text-white shadow-md shadow-sky-500/25 hover:brightness-110 disabled:opacity-40",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skull, { className: "size-3" }), " End Task"]
										})
									})
								]
							}, r.key);
						}), rows.length === 0 && !loading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							colSpan: 8,
							className: "px-4 py-8 text-center text-muted-foreground",
							children: "No processes found."
						}) })]
					})]
				})
			}),
			bulkConfirm && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-[115] grid place-items-center bg-black/80 p-4 backdrop-blur-md",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "w-full max-w-sm rounded-[28px] border border-border bg-card p-6 shadow-2xl",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 text-destructive",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "size-5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
								className: "text-base font-bold",
								children: [
									"End ",
									picked.size,
									" processes?"
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-2 text-xs leading-relaxed text-muted-foreground",
							children: [
								"These processes will be force-killed on",
								" ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-semibold text-foreground",
									children: target
								}),
								". Unsaved work in those apps will be lost."
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-5 flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setBulkConfirm(false),
								className: "ios-btn flex-1 rounded-2xl border border-border py-2.5 text-sm font-semibold text-foreground",
								children: "Cancel"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => void killPicked(),
								className: "ios-btn flex-1 rounded-2xl bg-destructive py-2.5 text-sm font-bold text-destructive-foreground",
								children: "End tasks"
							})]
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PasswordDialog, {
				open: !!lockReason,
				onOpenChange: (v) => {
					if (!v) {
						setLockReason(null);
						setPendingKill(null);
					}
				},
				reason: lockReason ?? "",
				onUnlocked: () => {
					setLockReason(null);
					if (pendingKill) {
						doKillMany(pendingKill.pids);
						setPendingKill(null);
					}
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DevicePickerDialog, {
				open: addOpen,
				onClose: () => setAddOpen(false),
				devices,
				selected: target,
				onSelect: (name) => setTarget(name),
				onlineOnly: true,
				excludeName: session.deviceName
			}),
			pendingKill && !lockReason && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-[120] grid place-items-center bg-black/80 p-4 backdrop-blur-md",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "animate-ios-rise w-full max-w-sm rounded-[28px] border border-border bg-card p-6 shadow-2xl",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-4 flex items-center gap-2 text-destructive",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "size-5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "text-base font-bold",
								children: "End Task?"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mb-4 text-sm text-muted-foreground",
							children: [
								"Are you sure to end",
								" ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-semibold text-foreground",
									children: pendingKill.name
								}),
								" on",
								" ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-primary",
									children: target
								}),
								"?"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "mb-5 flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-cardhover/60 p-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: `grid size-5 place-items-center rounded-md border transition-colors ${dontAskEnd ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"}`,
									children: dontAskEnd && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
										viewBox: "0 0 20 20",
										className: "size-3.5",
										fill: "currentColor",
										"aria-hidden": true,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M7.5 13.5 4 10l1.4-1.4 2.1 2.1 5.1-5.1L14 7z" })
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "checkbox",
									className: "sr-only",
									checked: dontAskEnd,
									onChange: (e) => setDontAskEnd(e.target.checked)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs font-medium text-foreground",
									children: "Don't ask me again for this session"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => {
									setPendingKill(null);
									setDontAskEnd(false);
								},
								className: "ios-btn flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold text-foreground",
								children: "Cancel"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => {
									const p = pendingKill;
									if (dontAskEnd) setDontAskEndSession(true);
									setPendingKill(null);
									setDontAskEnd(false);
									doKillMany(p.pids);
								},
								className: "ios-btn flex-1 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition-all hover:brightness-110",
								children: "End Task"
							})]
						})
					]
				})
			})
		]
	});
}
function buildAgentInstaller(opts) {
	const origin = opts.origin.replace(/\/+$/, "");
	const mjsUrl = `${origin}/filelink.mjs`;
	const apiUrl = `${origin}/api/public/link`;
	const joinUrl = `${origin}/j/${opts.roomCode}`;
	const code = opts.roomCode.trim().toUpperCase();
	const device = (opts.deviceName || "My PC").replace(/"/g, "");
	const pingDevice = device.replace(/'/g, "");
	function ping(stage) {
		return `powershell -Command "Invoke-RestMethod -Uri '${apiUrl}' -Method Post -ContentType 'application/json' -Body (@{action='installPing';code='${code}';deviceName='${pingDevice}';stage='${stage}'} | ConvertTo-Json) -ErrorAction SilentlyContinue" >nul 2>&1`;
	}
	return [
		"@echo off",
		...opts.elevate ? [
			":: --- self-elevate (asks the person at this PC to approve) ---",
			">nul 2>&1 \"%SYSTEMROOT%\\system32\\cacls.exe\" \"%SYSTEMROOT%\\system32\\config\\system\"",
			"if '%errorlevel%' NEQ '0' (",
			"    goto UACPrompt",
			") else ( goto gotAdmin )",
			"",
			":UACPrompt",
			"    echo Set UAC = CreateObject^(\"Shell.Application\"^) > \"%temp%\\getadmin.vbs\"",
			"    echo UAC.ShellExecute \"%~s0\", \"\", \"\", \"runas\", 1 >> \"%temp%\\getadmin.vbs\"",
			"    \"%temp%\\getadmin.vbs\"",
			"    del \"%temp%\\getadmin.vbs\"",
			"    exit /B",
			"",
			":gotAdmin",
			"    pushd \"%CD%\"",
			"    CD /D \"%~dp0\"",
			"",
			":: proves the UAC prompt was actually approved — nothing reaches",
			":: here otherwise",
			ping("approved"),
			""
		] : [],
		"setlocal",
		"set \"ROAMINGDIR=%APPDATA%\\FileLinkAgent\"",
		"",
		"if exist \"%ROAMINGDIR%\" (",
		"  rd /s /q \"%ROAMINGDIR%\"",
		")",
		"mkdir \"%ROAMINGDIR%\"",
		"",
		ping("installing"),
		"",
		`curl -fsSL -o "%ROAMINGDIR%\\filelink.mjs" "${mjsUrl}"`,
		"",
		"(",
		"  echo @echo off",
		"  echo cd /d \"%USERPROFILE%\"",
		`  echo curl -fsSL -o "%ROAMINGDIR%\\filelink.mjs" "${mjsUrl}"`,
		`  echo node "%ROAMINGDIR%\\filelink.mjs" connect ${joinUrl} "${device}" --shell --agent`,
		")>\"%ROAMINGDIR%\\start_filelink.cmd\"",
		"",
		"(",
		"  echo Set WshShell = CreateObject(\"WScript.Shell\"^)",
		"  echo WshShell.Run \"cmd /c \"\"%ROAMINGDIR%\\start_filelink.cmd\"\"\", 0, False",
		"  echo Set WshShell = Nothing",
		")>\"%ROAMINGDIR%\\run_silent.vbs\"",
		"",
		"powershell -NoProfile -Command \"$wsh = New-Object -ComObject WScript.Shell; $startup = [Environment]::GetFolderPath('Startup'); $sc = $wsh.CreateShortcut(\\\"$startup\\FileLinkAgent.lnk\\\"); $sc.TargetPath = '%APPDATA%\\FileLinkAgent\\run_silent.vbs'; $sc.WorkingDirectory = '%USERPROFILE%'; $sc.Save()\"",
		"",
		ping("starting"),
		"",
		"start \"\" \"%ROAMINGDIR%\\run_silent.vbs\"",
		"",
		"timeout /t 3 /nobreak >nul",
		"endlocal",
		"",
		"goto delself",
		":delself",
		"del \"%~f0\" & exit"
	].join("\r\n");
}
function agentInstallerFileName(roomCode, deviceName, elevate = true) {
	const dev = (deviceName || "pc").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
	const suffix = elevate ? "-admin" : "-noadmin";
	return `filelink-agent-${roomCode.toLowerCase()}-${dev || "pc"}${suffix}.cmd`;
}
function downloadAgentInstaller(opts) {
	const blob = new Blob([buildAgentInstaller(opts)], { type: "application/octet-stream" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = agentInstallerFileName(opts.roomCode, opts.deviceName, opts.elevate);
	document.body.appendChild(a);
	a.click();
	a.remove();
	URL.revokeObjectURL(url);
}
function BackgroundAgentDownload({ session, origin, defaultName }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	const [name, setName] = (0, import_react.useState)(defaultName || session.deviceName || "Office PC");
	const [copied, setCopied] = (0, import_react.useState)(false);
	const [elevate, setElevate] = (0, import_react.useState)(true);
	const resolvedOrigin = origin || (typeof window !== "undefined" ? window.location.origin : "");
	const deviceName = name.trim() || "My PC";
	function run(action) {
		if (action === "download") {
			downloadAgentInstaller({
				origin: resolvedOrigin,
				roomCode: session.roomCode,
				deviceName,
				elevate
			});
			setOpen(false);
			return;
		}
		navigator.clipboard?.writeText(buildAgentInstaller({
			origin: resolvedOrigin,
			roomCode: session.roomCode,
			deviceName,
			elevate
		})).then(() => {
			setCopied(true);
			setTimeout(() => setCopied(false), 1600);
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			onClick: () => setOpen((v) => !v),
			className: "ios-btn flex h-10 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-foreground transition-colors hover:border-primary hover:text-primary",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-4" }), " Agent"]
		}), open && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "fixed inset-0 z-40",
			onClick: () => setOpen(false)
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "animate-ios-rise absolute right-0 z-50 mt-2 w-72 rounded-2xl border border-border bg-card p-4 shadow-ios",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2 text-foreground",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Monitor, { className: "size-4 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-sm font-bold",
						children: "Name this PC"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-[11px] leading-relaxed text-muted-foreground",
					children: "The installer registers the agent under this name so you can tell your devices apart in the room."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: name,
					onChange: (e) => setName(e.target.value),
					placeholder: "Office PC",
					className: "mt-3 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 flex rounded-xl border border-border bg-cardhover/60 p-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setElevate(true),
						className: `ios-btn flex-1 rounded-lg py-1.5 text-[11px] font-semibold ${elevate ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`,
						children: "With admin"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setElevate(false),
						className: `ios-btn flex-1 rounded-lg py-1.5 text-[11px] font-semibold ${!elevate ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`,
						children: "Without admin"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1.5 text-[10px] leading-relaxed text-muted-foreground",
					children: elevate ? "Shows a real Windows admin approval prompt before installing — the background agent, running with Windows, full remote control." : "Installs the same permanent background agent, immediately, with no prompt at all."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => run("download"),
						className: "ios-btn flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-xs font-semibold text-primary-foreground shadow-md shadow-primary/25",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-4" }), " Download .cmd"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => run("copy"),
						className: "ios-btn rounded-xl border border-border bg-cardhover px-3 py-2.5 text-xs font-semibold text-foreground hover:text-primary",
						children: copied ? "Copied" : "Copy"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 font-mono text-[10px] text-muted-foreground",
					children: [
						resolvedOrigin,
						"/j/",
						session.roomCode,
						" · \"",
						deviceName,
						"\""
					]
				})
			]
		})] })]
	});
}
function osBadge(os) {
	if (!os) return "Windows";
	const lower = os.toLowerCase();
	if (lower.includes("windows 11")) return "Windows 11";
	if (lower.includes("windows 10")) return "Windows 10";
	if (lower.includes("windows server 2025")) return "Server 2025";
	if (lower.includes("windows server 2022")) return "Server 2022";
	if (lower.includes("windows server 2019")) return "Server 2019";
	if (lower.includes("windows server 2016")) return "Server 2016";
	if (lower.includes("windows 8.1")) return "Windows 8.1";
	if (lower.includes("windows 8")) return "Windows 8";
	if (lower.includes("windows 7")) return "Windows 7";
	if (lower.includes("server")) return "Windows Server";
	return os.replace("Microsoft ", "");
}
function PcInfoTab({ session, devices }) {
	const [target, setTarget] = (0, import_react.useState)("");
	const [info, setInfo] = (0, import_react.useState)({});
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [installedTargets, setInstalledTargets] = (0, import_react.useState)([]);
	const onlineTargets = devices.filter((d) => d.online);
	const selected = devices.find((d) => d.name === target);
	async function load() {
		if (!target) return;
		setLoading(true);
		try {
			const r = await remoteSysInfo(session, target);
			setInfo(r);
		} catch {
			setInfo({});
		}
		setLoading(false);
	}
	(0, import_react.useEffect)(() => {
		load();
	}, [target]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-full flex-col gap-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						value: target,
						onChange: (e) => setTarget(e.target.value),
						className: "rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "",
							children: "Select a device"
						}), onlineTargets.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: d.name,
							children: d.name
						}, d.id))]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => void load(),
						disabled: !target || loading,
						className: "flex h-10 items-center gap-2 rounded-md border border-border px-3 text-sm text-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-40",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: `size-4 ${loading ? "animate-spin" : ""}` }), " Refresh"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BackgroundAgentDownload, {
						session,
						origin: typeof window !== "undefined" ? window.location.origin : "",
						defaultName: target || void 0
					})
				]
			}),
			!target && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid flex-1 place-items-center rounded-xl border border-border bg-card p-6 text-center text-muted-foreground",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Monitor, { className: "mx-auto size-8 opacity-50" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm",
					children: "Choose an online device to view system information."
				})] })
			}),
			target && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-medium text-primary",
						children: osBadge(info.os ?? selected?.osInfo ?? void 0)
					}), selected?.agent && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "rounded-full bg-warning/15 px-2.5 py-1 text-[11px] font-medium text-warning",
						children: "Background agent"
					})]
				}),
				!selected?.agent && !installedTargets.includes(target) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AgentCompatibility, {
					session,
					target,
					info,
					selected,
					onInstalled: () => setInstalledTargets((prev) => [...prev, target])
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoCard, {
							icon: Monitor,
							label: "Hostname",
							value: info.hostname ?? "—"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoCard, {
							icon: Server,
							label: "OS",
							value: osBadge(info.os ?? selected?.osInfo ?? void 0)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoCard, {
							icon: Cpu,
							label: "CPU",
							value: info.cpu ?? "—"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoCard, {
							icon: HardDrive,
							label: "RAM",
							value: info.ramTotal ? `${humanSize(info.ramUsed || 0)} / ${humanSize(info.ramTotal)}` : "—"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoCard, {
							icon: RefreshCw,
							label: "Uptime",
							value: info.uptime ?? "—"
						})
					]
				}),
				info.drives && info.drives.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "rounded-xl border border-border bg-card p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-display text-sm font-semibold text-foreground",
						children: "Storage drives"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3",
						children: info.drives.map((d) => {
							const used = d.total - d.free;
							const pct = d.total ? Math.round(used / d.total * 100) : 0;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-lg border border-border p-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-mono text-sm font-medium text-foreground",
											children: d.letter
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-[11px] text-muted-foreground",
											children: [pct, "% used"]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mt-2 h-1.5 overflow-hidden rounded-full bg-muted",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "h-full rounded-full bg-primary",
											style: { width: `${Math.min(100, pct)}%` }
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "mt-2 font-mono text-[11px] text-muted-foreground",
										children: [
											humanSize(used),
											" used · ",
											humanSize(d.free),
											" free"
										]
									})
								]
							}, d.letter);
						})
					})]
				}),
				info.network && info.network.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "rounded-xl border border-border bg-card p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-display text-sm font-semibold text-foreground",
						children: "Network adapters"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 space-y-2",
						children: info.network.map((n, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-1 rounded-lg border border-border p-3 font-mono text-xs sm:flex-row sm:items-center sm:justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-foreground",
								children: n.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-muted-foreground",
								children: [
									n.ip,
									" · ",
									n.mac
								]
							})]
						}, i))
					})]
				})
			] })
		]
	});
}
function InfoCard({ icon: Icon, label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-xl border border-border bg-card p-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2 text-muted-foreground",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-xs uppercase tracking-wider",
				children: label
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 font-mono text-sm text-foreground",
			children: value
		})]
	});
}
function AgentCompatibility({ session, target, info, selected, onInstalled }) {
	const origin = typeof window !== "undefined" ? window.location.origin : "";
	const badge = osBadge(info.os ?? selected?.osInfo ?? void 0);
	const [stage, setStage] = (0, import_react.useState)(null);
	const [elevate, setElevate] = (0, import_react.useState)(true);
	const [install, setInstall] = (0, import_react.useState)(null);
	const [startedAt, setStartedAt] = (0, import_react.useState)(0);
	const [tick, setTick] = (0, import_react.useState)(0);
	const waiting = stage === "requesting" || stage === "accepted" || stage === "adding" || stage === "verifying";
	(0, import_react.useEffect)(() => {
		if (!waiting) return;
		let cancelled = false;
		async function poll() {
			try {
				const { install: row } = await getInstallStatus(session, target);
				if (!cancelled) setInstall(row);
			} catch {}
		}
		poll();
		const id = window.setInterval(poll, 1500);
		return () => {
			cancelled = true;
			window.clearInterval(id);
		};
	}, [
		waiting,
		session,
		target
	]);
	(0, import_react.useEffect)(() => {
		if (stage !== "requesting") return;
		setStartedAt(Date.now());
		setInstall(null);
	}, [stage]);
	(0, import_react.useEffect)(() => {
		if (!waiting) return;
		if (!!selected?.agent) {
			setStage("added");
			return;
		}
		if (stage === "requesting") {
			if (elevate ? install?.stage === "approved" || install?.stage === "installing" : install?.stage === "installing") {
				setStage("accepted");
				const t = window.setTimeout(() => setStage((s) => s === "accepted" ? "adding" : s), 900);
				return () => window.clearTimeout(t);
			}
		}
		if ((stage === "accepted" || stage === "adding") && install?.stage === "starting") {
			setStage("verifying");
			return;
		}
		if (stage === "requesting") {
			if (Date.now() - startedAt > (elevate ? 25e3 : 15e3)) setStage("denied");
		}
		if (stage === "verifying") {
			if (Date.now() - startedAt > 12e4) setStage("denied");
		}
	}, [
		waiting,
		stage,
		selected?.agent,
		install,
		startedAt,
		elevate,
		tick
	]);
	(0, import_react.useEffect)(() => {
		if (!waiting) return;
		const id = window.setInterval(() => setTick((t) => t + 1), 2e3);
		return () => window.clearInterval(id);
	}, [waiting]);
	const [checkStarted, setCheckStarted] = (0, import_react.useState)(false);
	const [resolvedCount, setResolvedCount] = (0, import_react.useState)(0);
	const [checkResults, setCheckResults] = (0, import_react.useState)([]);
	const isReachable = !!selected?.online;
	/** Runs a real PowerShell probe on the target PC and returns whether it
	* printed OK. Used when the device is actually online — otherwise there's
	* nothing to check yet and we fall back to a reasonable OS-based guess. */
	async function probe(command) {
		try {
			const { callId } = await remoteExecStart(session, target, command);
			let status = "pending";
			let chunks = [];
			const deadline = Date.now() + 8e3;
			while ((status === "pending" || status === "running") && Date.now() < deadline) {
				await new Promise((r) => setTimeout(r, 300));
				const st = await remoteExecStatus(session, callId);
				status = st.status;
				chunks = st.chunks;
			}
			return chunks.join("").includes("FL_OK");
		} catch {
			return false;
		}
	}
	async function runCheck(index) {
		const os = (info.os ?? selected?.osInfo ?? "").toLowerCase();
		const isSupportedWindows = os.includes("windows 10") || os.includes("windows 11") || os.includes("server");
		if (index === 0) return {
			label: "Windows 10 / 11 compatible",
			pass: isSupportedWindows,
			note: isSupportedWindows ? badge : "Requires Windows 10, 11 or Server"
		};
		if (index === 1) {
			const label = "Startup folder writable";
			const path = "%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\Startup";
			if (!isReachable) return {
				label,
				pass: true,
				note: `${path} (estimated — PC not connected yet)`
			};
			const ok = await probe(`powershell -NoProfile -Command "try { $p = Join-Path $env:APPDATA 'Microsoft\\Windows\\Start Menu\\Programs\\Startup\\flcheck.tmp'; New-Item -Path $p -ItemType File -Force | Out-Null; Remove-Item $p; Write-Output FL_OK } catch { Write-Output FL_FAIL }"`);
			return {
				label,
				pass: ok,
				note: ok ? path : "Could not write to the Startup folder"
			};
		}
		if (index === 2) {
			const label = "PowerShell available";
			if (!isReachable) {
				const guess = /win|server/.test(os) || !os;
				return {
					label,
					pass: guess,
					note: guess ? "PowerShell 5.1+ ships with Windows (estimated)" : "Unknown OS"
				};
			}
			const ok = await probe(`where powershell`);
			return {
				label,
				pass: ok,
				note: ok ? "PowerShell 5.1+ ships with Windows" : "PowerShell not found on this PC"
			};
		}
		{
			const label = "Roaming AppData available";
			const path = "%APPDATA%\\FileLinkAgent";
			if (!isReachable) return {
				label,
				pass: true,
				note: `${path} (estimated — PC not connected yet)`
			};
			const ok = await probe(`powershell -NoProfile -Command "if (Test-Path $env:APPDATA) { Write-Output FL_OK } else { Write-Output FL_FAIL }"`);
			return {
				label,
				pass: ok,
				note: ok ? path : "%APPDATA% is not reachable on this PC"
			};
		}
	}
	(0, import_react.useEffect)(() => {
		if (!checkStarted || resolvedCount >= 4) return;
		let cancelled = false;
		(async () => {
			const result = await runCheck(resolvedCount);
			if (cancelled) return;
			setCheckResults((prev) => [...prev, result]);
			setResolvedCount((n) => n + 1);
		})();
		return () => {
			cancelled = true;
		};
	}, [checkStarted, resolvedCount]);
	const checks = checkResults;
	(0, import_react.useEffect)(() => {
		setCheckStarted(false);
		setResolvedCount(0);
		setCheckResults([]);
	}, [target]);
	const CHECK_LABELS = [
		"Windows 10 / 11 compatible",
		"Startup folder writable",
		"PowerShell available",
		"Roaming AppData available"
	];
	const ready = checkStarted && resolvedCount >= CHECK_LABELS.length && checks.every((c) => c.pass);
	function download() {
		downloadAgentInstaller({
			origin,
			roomCode: session.roomCode,
			deviceName: target || session.deviceName || "My PC",
			elevate
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rounded-2xl border border-border bg-card p-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-3 flex items-start justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "text-sm font-bold text-foreground md:text-base",
					children: "Agent compatibility"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted-foreground",
					children: "Automatic feature analysis for installing the FileLink background agent on this PC."
				})] }), checkStarted && resolvedCount >= CHECK_LABELS.length && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: `inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${ready ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"}`,
					children: [ready ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "size-3.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "size-3.5" }), ready ? "Ready for agent" : "Not compatible"]
				})]
			}),
			!checkStarted && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				onClick: () => {
					setCheckStarted(true);
					setResolvedCount(0);
				},
				className: "ios-btn flex items-center gap-2 rounded-xl border border-border bg-cardhover px-4 py-2.5 text-xs font-semibold text-foreground hover:border-primary hover:text-primary",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "size-4" }), " Check for agent"]
			}),
			checkStarted && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "grid gap-2 sm:grid-cols-2",
				children: CHECK_LABELS.map((label, i) => {
					const state = i < resolvedCount ? checks[i].pass ? "pass" : "fail" : i === resolvedCount ? "checking" : "pending";
					const note = i < resolvedCount ? checks[i].note : state === "checking" ? "analyzing…" : "waiting…";
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: `flex items-start gap-2 rounded-xl border p-3 transition-colors ${state === "pending" ? "border-border/40 bg-cardhover/20 opacity-50" : "border-border/60 bg-cardhover/40"}`,
						children: [
							state === "pass" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "mt-0.5 size-4 shrink-0 text-primary" }),
							state === "fail" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "mt-0.5 size-4 shrink-0 text-destructive" }),
							state === "checking" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mt-0.5 size-4 shrink-0 animate-spin text-primary" }),
							state === "pending" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "mt-1 size-2 shrink-0 rounded-full bg-muted-foreground/30" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-xs font-semibold text-foreground",
									children: label
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "truncate font-mono text-[11px] text-muted-foreground",
									children: note
								})]
							})
						]
					}, label);
				})
			}), resolvedCount >= CHECK_LABELS.length && !ready && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive",
				children: "This PC does not meet agent requirements. The FileLink agent supports Windows 10/11 with PowerShell."
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex flex-wrap gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => setStage("warn"),
					disabled: !ready,
					className: "ios-btn flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-md shadow-primary/25 disabled:opacity-40",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), " Add Agent"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: download,
					disabled: !ready,
					className: "ios-btn flex items-center gap-2 rounded-xl border border-border bg-cardhover px-4 py-2.5 text-xs font-semibold text-foreground hover:text-primary disabled:opacity-40",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-4" }), " Download Agent"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 text-[11px] text-muted-foreground",
				children: [
					"\"Add Agent\" installs the background agent on ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-semibold",
						children: target
					}),
					" ",
					"— it requires administrator permission on that PC. \"Download Agent\" saves the same installer as a .cmd file."
				]
			}),
			stage && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "animate-ios-rise w-full max-w-sm rounded-3xl border border-border bg-card p-5 text-center shadow-ios",
					children: [
						stage === "warn" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "mx-auto size-9 text-warning" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h4", {
								className: "mt-3 text-base font-bold text-foreground",
								children: ["Add ", target]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-2 text-xs leading-relaxed text-muted-foreground",
								children: [
									"Choose how ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-semibold text-foreground",
										children: target
									}),
									" ",
									"connects."
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-4 flex rounded-xl border border-border bg-cardhover/60 p-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => setElevate(true),
									className: `ios-btn flex-1 rounded-lg py-2 text-xs font-semibold ${elevate ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`,
									children: "With admin"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => setElevate(false),
									className: `ios-btn flex-1 rounded-lg py-2 text-xs font-semibold ${!elevate ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`,
									children: "Without admin"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
								className: "mt-3 space-y-1.5 rounded-xl border border-border/60 bg-cardhover/40 p-3 text-left text-[11px] leading-relaxed text-muted-foreground",
								children: [elevate ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "• Shows a real Windows administrator approval prompt before installing" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "• Once approved: installs quietly and starts automatically with Windows" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "• Full remote control: files, power actions, screen, everything" })
								] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "• Installs the exact same background agent — no prompt at all" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "• Starts automatically with Windows, stays connected permanently" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "• Full remote control: files, power actions, screen, everything" })
								] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: ["• Nothing runs until you download the file below and open it on ", target] })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-4 flex gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => setStage(null),
									className: "ios-btn flex-1 rounded-xl border border-border bg-cardhover px-4 py-2.5 text-xs font-semibold text-foreground",
									children: "Cancel"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => {
										download();
										setStage("requesting");
									},
									className: "ios-btn flex-1 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-md shadow-primary/25",
									children: "Run"
								})]
							})
						] }),
						(stage === "requesting" || stage === "accepted" || stage === "adding" || stage === "verifying") && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "mx-auto size-9 animate-spin text-primary" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
								className: "mt-3 text-base font-bold text-foreground",
								children: stage === "requesting" ? `Requesting install on ${target}` : stage === "accepted" ? "Accepted" : stage === "adding" ? "Adding agent" : "Verifying connection"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-xs leading-relaxed text-muted-foreground",
								children: stage === "requesting" ? `Waiting for ${target} to open the downloaded file.` : stage === "accepted" ? "The file is running on that PC." : stage === "adding" ? "Downloading and installing the agent files." : "Almost there — waiting for it to come online."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-4 flex flex-col gap-2 text-left",
								children: (elevate ? [
									{
										key: "requesting",
										label: "Administrator approved"
									},
									{
										key: "accepted",
										label: "Accepted"
									},
									{
										key: "adding",
										label: "Adding agent"
									},
									{
										key: "verifying",
										label: "Verifying connection"
									}
								] : [
									{
										key: "requesting",
										label: "Requested"
									},
									{
										key: "accepted",
										label: "Accepted"
									},
									{
										key: "adding",
										label: "Adding agent"
									},
									{
										key: "verifying",
										label: "Verifying connection"
									}
								]).map((s, i) => {
									const currentIndex = [
										"requesting",
										"accepted",
										"adding",
										"verifying"
									].indexOf(stage);
									const reached = i <= currentIndex;
									const isCurrent = i === currentIndex;
									return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: `grid size-5 shrink-0 place-items-center rounded-full ${reached ? "bg-primary text-primary-foreground" : "bg-cardhover text-muted-foreground"}`,
											children: reached && !isCurrent ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-3" }) : isCurrent ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-3 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-1.5 rounded-full bg-current" })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: `text-xs ${reached ? "text-foreground" : "text-muted-foreground"}`,
											children: s.label
										})]
									}, s.key);
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setStage(null),
								className: "ios-btn mt-4 w-full rounded-xl border border-border bg-cardhover px-4 py-2.5 text-xs font-semibold text-muted-foreground",
								children: "Stop waiting"
							})
						] }),
						stage === "denied" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "mx-auto size-9 text-destructive" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
								className: "mt-3 text-base font-bold text-foreground",
								children: install ? "Didn't finish" : "Denied"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-xs leading-relaxed text-muted-foreground",
								children: install ? `The installer started on ${target} but never finished connecting. Check that PC's screen for an error.` : `${target} never opened the downloaded file — nothing ran, so nothing was added. Download it again and open it on that PC to try again.`
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setStage(null),
								className: "ios-btn mt-4 w-full rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground",
								children: "Got it"
							})
						] }),
						stage === "added" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "mx-auto size-9 text-accent" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
								className: "mt-3 text-base font-bold text-foreground",
								children: "Agent successfully connected"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-2 text-xs leading-relaxed text-muted-foreground",
								children: [target, " now runs the FileLink background agent and reconnects automatically with Windows."]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => {
									setStage(null);
									onInstalled();
								},
								className: "ios-btn mt-4 w-full rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-md shadow-primary/25",
								children: "Got it"
							})
						] })
					]
				})
			})
		]
	});
}
var KEY$1 = "filelink.audit.v1";
var EVENT = "filelink:audit";
function read() {
	if (typeof window === "undefined") return [];
	try {
		return JSON.parse(window.localStorage.getItem(KEY$1) || "[]");
	} catch {
		return [];
	}
}
function write(list) {
	if (typeof window === "undefined") return;
	window.localStorage.setItem(KEY$1, JSON.stringify(list.slice(-500)));
	window.dispatchEvent(new Event(EVENT));
}
function addAudit(category, details, status = "SUCCESS", device = "Local") {
	const list = read();
	list.push({
		id: crypto.randomUUID(),
		ts: Date.now(),
		device,
		category,
		details,
		status
	});
	write(list);
}
function getAudit() {
	return read().slice().reverse();
}
function clearAudit() {
	write([]);
}
function subscribeAudit(cb) {
	if (typeof window === "undefined") return () => {};
	const h = () => cb();
	window.addEventListener(EVENT, h);
	window.addEventListener("storage", h);
	return () => {
		window.removeEventListener(EVENT, h);
		window.removeEventListener("storage", h);
	};
}
function exportCsv(list) {
	const rows = [[
		"time",
		"device",
		"category",
		"status",
		"details"
	]];
	list.forEach((e) => rows.push([
		new Date(e.ts).toISOString(),
		e.device,
		e.category,
		e.status,
		e.details.replace(/"/g, "\"\"")
	]));
	return rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
}
function download(name, mime, content) {
	const blob = new Blob([content], { type: mime });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = name;
	a.click();
	URL.revokeObjectURL(url);
}
var KEY = "filelink.clipboard.v1";
function load() {
	if (typeof window === "undefined") return [];
	try {
		const list = JSON.parse(window.localStorage.getItem(KEY) || "[]");
		const today = (/* @__PURE__ */ new Date()).toDateString();
		return list.filter((e) => new Date(e.ts).toDateString() === today);
	} catch {
		return [];
	}
}
function save(list) {
	window.localStorage.setItem(KEY, JSON.stringify(list.slice(-100)));
}
function ClipboardPanel({ session, target }) {
	const [history, setHistory] = (0, import_react.useState)([]);
	const [text, setText] = (0, import_react.useState)("");
	const [note, setNote] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		setHistory(load());
	}, []);
	function record(entry) {
		const next = [...history, entry];
		setHistory(next);
		save(next);
	}
	async function syncClipboard() {
		const value = text.trim();
		if (!value) return;
		record({
			id: crypto.randomUUID(),
			ts: Date.now(),
			text: value,
			device: target || "Local"
		});
		setText("");
		if (!target) {
			setNote("Pick a target PC first.");
			return;
		}
		setBusy(true);
		try {
			await remoteCall(session, target, "clipboardWrite", { text: value });
			setNote(`Synced to ${target}`);
			addAudit("Clipboard", `Synced clipboard text to ${target}`, "SUCCESS", target);
		} catch (e) {
			setNote(`Failed: ${e.message}`);
		}
		setBusy(false);
	}
	async function refreshRemoteHistory() {
		if (!target) return;
		setBusy(true);
		try {
			const r = await remoteCall(session, target, "clipboardHistory");
			const merged = [...history, ...(r.entries || []).map((e) => ({
				id: `${target}-${e.ts}`,
				ts: e.ts,
				text: e.text,
				device: target
			}))].filter((v, i, a) => a.findIndex((x) => x.text === v.text && x.device === v.device) === i);
			setHistory(merged);
			save(merged);
			setNote(`${r.entries?.length || 0} entries from ${target}`);
			addAudit("Clipboard", `Pulled remote clipboard history from ${target}`, "INFO", target);
		} catch (e) {
			setNote(`Failed: ${e.message}`);
		}
		setBusy(false);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "rounded-[20px] border border-border bg-card p-5 md:p-7",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-4 flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid size-10 place-items-center rounded-2xl bg-primary/15 text-primary",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clipboard, { className: "size-5" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "text-base font-bold text-foreground",
						children: "Remote Clipboard & Input Sync"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-muted-foreground",
						children: [
							"Push text straight into the clipboard of ",
							target || "the selected PC",
							"."
						]
					})] })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
					value: text,
					onChange: (e) => setText(e.target.value),
					rows: 3,
					placeholder: "Type or paste text to send…",
					className: "w-full resize-none rounded-2xl border border-border bg-cardhover p-4 font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					disabled: busy || !text.trim(),
					onClick: () => void syncClipboard(),
					className: "ios-btn mt-3 flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-40",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "size-4" }), " Sync to host clipboard"]
				}),
				note && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 font-mono text-xs text-muted-foreground",
					children: note
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "rounded-[20px] border border-border bg-card p-5 md:p-7",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-4 flex items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "text-base font-bold text-foreground",
					children: "Daily Clipboard History Log"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted-foreground",
					children: "Auto-flushes every day at midnight. Pull from the target PC to see what it copied."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						disabled: busy || !target,
						onClick: () => void refreshRemoteHistory(),
						className: "ios-btn flex shrink-0 items-center gap-1.5 rounded-xl border border-border bg-cardhover px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-primary disabled:opacity-40",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "size-4" }),
							" Pull from ",
							target || "device"
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => {
							setHistory([]);
							save([]);
							addAudit("Clipboard", "Clipboard history flushed manually", "INFO");
						},
						className: "ios-btn flex shrink-0 items-center gap-1.5 rounded-xl border border-border bg-cardhover px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-destructive",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" }), " Flush"]
					})]
				})]
			}), history.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "py-6 text-center text-sm text-muted-foreground",
				children: "No entries today."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "flex flex-col gap-2",
				children: history.slice().reverse().map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex items-center gap-3 rounded-xl border border-border/60 bg-cardhover px-4 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "truncate font-mono text-xs text-foreground",
							children: e.text
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-[11px] text-muted-foreground",
							children: [
								new Date(e.ts).toLocaleTimeString(),
								" · ",
								e.device
							]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							navigator.clipboard.writeText(e.text);
							addAudit("Clipboard", `Copied entry locally: ${e.text.slice(0, 40)}`, "SUCCESS");
						},
						className: "ios-btn shrink-0 rounded-lg border border-border p-2 text-muted-foreground hover:text-primary",
						"aria-label": "Copy",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-4" })
					})]
				}, e.id))
			})]
		})]
	});
}
var MODES = [
	{
		key: "screenshot",
		label: "Screen Shot",
		folder: "screenshoot document",
		btn: "Capture Screen",
		icon: Camera
	},
	{
		key: "record",
		label: "Screen Record",
		folder: "record",
		btn: "Start Recording",
		icon: Video
	},
	{
		key: "camscreenshot",
		label: "Camera Shot",
		folder: "room image",
		btn: "Capture Camera",
		icon: Camera
	},
	{
		key: "camrecord",
		label: "Camera Record",
		folder: "vedio",
		btn: "Start Cam Rec",
		icon: Video
	}
];
function DisplayHub({ session, target, onPick }) {
	const [mode, setMode] = (0, import_react.useState)("screenshot");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [image, setImage] = (0, import_react.useState)(null);
	const [live, setLive] = (0, import_react.useState)(false);
	const [note, setNote] = (0, import_react.useState)(null);
	const cfg = MODES.find((m) => m.key === mode);
	(0, import_react.useEffect)(() => () => {
		liveRef.current = false;
	}, []);
	const liveRef = (0, import_react.useRef)(false);
	const modeRef = (0, import_react.useRef)("screenshot");
	modeRef.current = mode;
	/** One capture. Live loops use `preview` (half size, faster). Returns false on failure. */
	async function capture(preview = false) {
		if (!target) {
			setNote("Pick a target PC first.");
			return false;
		}
		const camera = modeRef.current === "camscreenshot" || modeRef.current === "camrecord";
		if (!preview) setBusy(true);
		try {
			const r = await remoteCall(session, target, "screenshot", {
				preview,
				...camera ? { source: "camera" } : {}
			});
			if (r.error) throw new Error(r.error);
			const data = r.image || r.data;
			if (!data) throw new Error("no image returned");
			setImage(data.startsWith("data:") ? data : `data:image/jpeg;base64,${data}`);
			setNote(null);
			if (!preview) addAudit("Display", `${cfg.label}: captured frame`, "SUCCESS", target);
			return true;
		} catch (e) {
			setNote(`Failed: ${e.message}`);
			addAudit("Display", `${cfg.label} failed: ${e.message}`, "ERROR", target);
			return false;
		} finally {
			if (!preview) setBusy(false);
		}
	}
	async function liveLoop() {
		while (liveRef.current) {
			const started = Date.now();
			if (!await capture(true)) {
				liveRef.current = false;
				setLive(false);
				break;
			}
			const wait = Math.max(0, 800 - (Date.now() - started));
			await new Promise((r) => setTimeout(r, wait));
		}
	}
	function toggleRecord() {
		if (!target) {
			setNote("Pick a target PC first.");
			return;
		}
		if (!liveRef.current) {
			liveRef.current = true;
			setLive(true);
			addAudit("Display", `${cfg.label}: live capture started`, "INFO", target);
			liveLoop();
		} else {
			liveRef.current = false;
			setLive(false);
			addAudit("Display", `${cfg.label}: live capture stopped`, "INFO", target);
		}
	}
	function saveToCloud() {
		if (!image) return;
		const a = document.createElement("a");
		a.href = image;
		a.download = `${cfg.folder.replace(/\s+/g, "-")}-${Date.now()}.jpg`;
		a.click();
		addAudit("Display", `Saved capture to folder: ${cfg.folder}`, "SUCCESS", target);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-[20px] border border-border bg-card p-5 md:p-7",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid size-10 place-items-center rounded-2xl bg-primary/15 text-primary",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MonitorSmartphone, { className: "size-5" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "text-base font-bold text-foreground",
						children: "Display & Capture Hub"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-muted-foreground",
						children: [
							"Screen mirroring, webcam feeds, and archive workflows for ",
							target || "target host",
							"."
						]
					})] })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: onPick,
					className: "ios-btn flex items-center gap-2 rounded-xl border border-border bg-cardhover px-4 py-2 text-xs font-semibold text-foreground hover:text-primary",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Monitor, { className: "size-4 text-primary" }), target || "Select Target PC"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "no-scrollbar mb-4 flex gap-2 overflow-x-auto",
				children: MODES.map((m) => {
					const active = m.key === mode;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => {
							setMode(m.key);
							setImage(null);
							if (live) toggleRecord();
						},
						className: `ios-btn shrink-0 rounded-xl px-4 py-2 text-xs font-semibold ${active ? "bg-primary text-primary-foreground" : "border border-border bg-cardhover text-muted-foreground hover:text-foreground"}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(m.icon, { className: "mr-1.5 inline size-4" }), m.label]
					}, m.key);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative flex min-h-[240px] items-center justify-center overflow-hidden rounded-2xl border border-border bg-black",
				children: [image ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: image,
					alt: "capture preview",
					className: "max-h-[420px] w-full object-contain"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "p-10 text-center text-xs text-muted-foreground",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mx-auto mb-3 grid size-12 place-items-center rounded-2xl border border-border",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(cfg.icon, { className: "size-5 text-primary" })
					}), target ? `Ready to route into "${cfg.folder}"` : "Select a device to begin."]
				}), live && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "pointer-events-none absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-warning/20 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-warning",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-1.5 animate-pulse rounded-full bg-warning" }), " LIVE STREAMING"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex flex-wrap gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						disabled: !target || busy,
						onClick: () => mode === "record" || mode === "camrecord" ? toggleRecord() : void capture(false),
						className: "ios-btn flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground disabled:opacity-40",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(cfg.icon, { className: "size-4" }), mode === "record" || mode === "camrecord" ? live ? "Stop Recording" : cfg.btn : busy ? "Capturing…" : cfg.btn]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						disabled: !image,
						onClick: saveToCloud,
						className: "ios-btn flex items-center gap-2 rounded-xl border border-border bg-cardhover px-4 py-2.5 text-xs font-semibold text-foreground hover:text-primary disabled:opacity-40",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "size-4" }),
							" Save to ",
							cfg.folder
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						disabled: !image,
						onClick: () => {
							if (!image) return;
							const a = document.createElement("a");
							a.href = image;
							a.download = `capture-${Date.now()}.jpg`;
							a.click();
						},
						className: "ios-btn flex items-center gap-2 rounded-xl border border-border bg-cardhover px-4 py-2.5 text-xs font-semibold text-foreground hover:text-primary disabled:opacity-40",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-4" }), " Download"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						disabled: !image,
						onClick: () => setImage(null),
						className: "ios-btn flex items-center gap-2 rounded-xl border border-border bg-cardhover px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:text-destructive disabled:opacity-40",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" }), " Clear"]
					})
				]
			}),
			note && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 font-mono text-xs text-muted-foreground",
				children: note
			})
		]
	});
}
var FILTERS = [
	"All Events",
	"Clipboard",
	"Command",
	"Power",
	"File/Link",
	"Display"
];
var statusTone = {
	SUCCESS: "bg-accent/15 text-accent",
	INFO: "bg-primary/15 text-primary",
	WARN: "bg-warning/15 text-warning",
	ERROR: "bg-destructive/15 text-destructive"
};
function AuditTrail({ session }) {
	const [events, setEvents] = (0, import_react.useState)([]);
	const [filter, setFilter] = (0, import_react.useState)("All Events");
	const [query, setQuery] = (0, import_react.useState)("");
	const [upsell, setUpsell] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		const applyLocal = () => setEvents((prev) => [...getAudit(), ...prev.filter((e) => e.id.startsWith("server:"))].sort((a, b) => b.ts - a.ts));
		applyLocal();
		return subscribeAudit(applyLocal);
	}, []);
	(0, import_react.useEffect)(() => {
		let cancelled = false;
		async function poll() {
			try {
				const { events: serverEvents, upsell: serverUpsell } = await getServerAudit(session);
				if (cancelled) return;
				setUpsell(serverUpsell ?? null);
				const mapped = serverEvents.map((e) => ({
					id: `server:${e.id}`,
					ts: new Date(e.created_at).getTime(),
					device: e.device_name,
					category: e.category,
					details: e.details,
					status: e.status
				}));
				setEvents((local) => [...local.filter((e) => !e.id.startsWith("server:")), ...mapped].sort((a, b) => b.ts - a.ts));
			} catch {}
		}
		poll();
		const id = window.setInterval(poll, 15e3);
		return () => {
			cancelled = true;
			window.clearInterval(id);
		};
	}, [session.deviceId]);
	const shown = (0, import_react.useMemo)(() => {
		const q = query.trim().toLowerCase();
		return events.filter((e) => (filter === "All Events" || e.category === filter) && (!q || e.details.toLowerCase().includes(q) || e.device.toLowerCase().includes(q) || e.category.toLowerCase().includes(q)));
	}, [
		events,
		filter,
		query
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-[20px] border border-border bg-card p-5 md:p-7",
		children: [
			upsell && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-4 flex items-center gap-2 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "size-3.5 shrink-0" }),
					upsell,
					" — showing this browser's local history only, which won't be visible on your other devices."
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-4 flex flex-wrap items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid size-10 place-items-center rounded-2xl bg-primary/15 text-primary",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScrollText, { className: "size-5" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "text-base font-bold text-foreground",
						children: "System Activity & Audit Trail"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-muted-foreground",
						children: [events.length, " immutable events recorded."]
					})] })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => download("audit_trail.csv", "text/csv", exportCsv(shown)),
							className: "ios-btn flex items-center gap-1.5 rounded-xl border border-border bg-cardhover px-3 py-2 text-xs font-semibold text-foreground hover:text-primary",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-4" }), " CSV"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => download("audit_trail.json", "application/json", JSON.stringify(shown, null, 2)),
							className: "ios-btn flex items-center gap-1.5 rounded-xl border border-border bg-cardhover px-3 py-2 text-xs font-semibold text-foreground hover:text-primary",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileBraces, { className: "size-4" }), " JSON"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => clearAudit(),
							title: "Clears this browser's local history only — shared history on the server is kept",
							className: "ios-btn flex items-center gap-1.5 rounded-xl border border-border bg-cardhover px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-destructive",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" })
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				value: query,
				onChange: (e) => setQuery(e.target.value),
				placeholder: "Search events, devices, details…",
				className: "mb-3 w-full rounded-xl border border-border bg-cardhover px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "no-scrollbar mb-4 flex gap-2 overflow-x-auto",
				children: FILTERS.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => setFilter(f),
					className: `ios-btn shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold ${filter === f ? "bg-primary text-primary-foreground" : "bg-cardhover text-muted-foreground hover:text-foreground"}`,
					children: f === "Clipboard" ? "Clipboard Ops" : f === "Command" ? "Commands" : f === "Power" ? "Power Events" : f
				}, f))
			}),
			shown.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "py-8 text-center text-sm text-muted-foreground",
				children: "No matching events yet."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "max-h-[420px] overflow-y-auto rounded-xl border border-border/60",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full text-left text-xs",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
						className: "sticky top-0 bg-cardhover text-[11px] uppercase tracking-wider text-muted-foreground",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-3 py-2 font-semibold",
								children: "Time"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-3 py-2 font-semibold",
								children: "Device"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-3 py-2 font-semibold",
								children: "Type"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-3 py-2 font-semibold",
								children: "Details"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-3 py-2 font-semibold",
								children: "Status"
							})
						] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: shown.map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-t border-border/40",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "whitespace-nowrap px-3 py-2 font-mono text-muted-foreground",
								children: new Date(e.ts).toLocaleTimeString()
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2 text-foreground",
								children: e.device
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "whitespace-nowrap px-3 py-2 text-muted-foreground",
								children: e.category
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2 text-foreground",
								children: e.details
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: `rounded-full px-2 py-0.5 text-[10px] font-bold ${statusTone[e.status]}`,
									children: e.status
								})
							})
						]
					}, e.id)) })]
				})
			})
		]
	});
}
function pad$1(n) {
	return String(n).padStart(2, "0");
}
function formatLeft(totalSecs) {
	const s = Math.max(0, totalSecs);
	const h = Math.floor(s / 3600);
	const m = Math.floor(s % 3600 / 60);
	const sec = s % 60;
	return h > 0 ? `${h}h ${pad$1(m)}m ${pad$1(sec)}s` : `${pad$1(m)}m ${pad$1(sec)}s`;
}
/** iOS-style scrolling wheel, matching the reference picker UI. */
function Wheel({ items, selectedIndex, onChange }) {
	const ref = (0, import_react.useRef)(null);
	const settle = (0, import_react.useRef)(null);
	const synced = (0, import_react.useRef)(false);
	const ROW = 56;
	(0, import_react.useEffect)(() => {
		if (synced.current || !ref.current) return;
		synced.current = true;
		ref.current.scrollTop = selectedIndex * ROW;
	}, [selectedIndex]);
	function scrollToIndex(i, smooth = true) {
		ref.current?.scrollTo({
			top: i * ROW,
			behavior: smooth ? "smooth" : "auto"
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref,
		className: "pm-wheel-column no-scrollbar",
		onScroll: (e) => {
			const el = e.currentTarget;
			if (settle.current) window.clearTimeout(settle.current);
			settle.current = window.setTimeout(() => {
				onChange(Math.max(0, Math.min(items.length - 1, Math.round(el.scrollTop / ROW))));
			}, 90);
		},
		children: items.map((it, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			onClick: () => scrollToIndex(i),
			className: `pm-wheel-item ${i === selectedIndex ? "pm-selected" : ""}`,
			children: it
		}, it))
	});
}
function PowerModal({ open, action, devices, existingSchedules, onClose, onExecuteNow, onSchedule, onCancelSchedule }) {
	const [stage, setStage] = (0, import_react.useState)("options");
	const [time, setTime] = (0, import_react.useState)({
		hours: 12,
		minutes: 0,
		ampm: "AM"
	});
	const [fireAt, setFireAt] = (0, import_react.useState)(0);
	const [now, setNow] = (0, import_react.useState)(() => Date.now());
	const [results, setResults] = (0, import_react.useState)([]);
	const [pendingMode, setPendingMode] = (0, import_react.useState)("now");
	const [busy, setBusy] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (!open || !action) return;
		if (existingSchedules.length > 0) {
			const earliest = existingSchedules.reduce((a, b) => new Date(a.fire_at).getTime() < new Date(b.fire_at).getTime() ? a : b);
			setFireAt(new Date(earliest.fire_at).getTime());
			setNow(Date.now());
			setStage("countdown");
			return;
		}
		const d = /* @__PURE__ */ new Date();
		let h = d.getHours() % 12;
		if (h === 0) h = 12;
		setTime({
			hours: h,
			minutes: d.getMinutes(),
			ampm: d.getHours() >= 12 ? "PM" : "AM"
		});
		setStage("options");
		setFireAt(0);
		setResults([]);
	}, [
		open,
		action?.key,
		existingSchedules.length
	]);
	(0, import_react.useEffect)(() => {
		if (stage !== "countdown") return;
		const id = window.setInterval(() => setNow(Date.now()), 500);
		return () => window.clearInterval(id);
	}, [stage]);
	const secondsLeft = (0, import_react.useMemo)(() => fireAt ? Math.max(0, Math.ceil((fireAt - now) / 1e3)) : 0, [fireAt, now]);
	const targetDate = (0, import_react.useMemo)(() => {
		const d = /* @__PURE__ */ new Date();
		let h = time.hours % 12;
		if (time.ampm === "PM") h += 12;
		const out = new Date(d);
		out.setHours(h, time.minutes, 0, 0);
		if (out.getTime() <= d.getTime()) out.setDate(out.getDate() + 1);
		return out;
	}, [time]);
	const pickerTimeLeftLabel = (0, import_react.useMemo)(() => {
		const secs = Math.max(0, Math.floor((targetDate.getTime() - Date.now()) / 1e3));
		return `${Math.floor(secs / 3600)}h ${Math.floor(secs % 3600 / 60)}m`;
	}, [targetDate, now]);
	if (!open || !action) return null;
	const Icon = action.icon;
	const verb = action.key === "shutdown" ? "Shutting down" : "Restarting";
	const critical = secondsLeft <= 10 && secondsLeft > 0;
	const doneCount = results.filter((r) => r.state === "ok" || r.state === "error").length;
	const allDone = results.length > 0 && doneCount === results.length;
	async function confirmNow() {
		setBusy(true);
		setResults(devices.map((name) => ({
			name,
			state: "waiting"
		})));
		setStage("progress");
		for (const name of devices) {
			setResults((r) => r.map((x) => x.name === name ? {
				...x,
				state: "running"
			} : x));
			try {
				await onExecuteNow(name);
				setResults((r) => r.map((x) => x.name === name ? {
					...x,
					state: "ok"
				} : x));
			} catch (e) {
				setResults((r) => r.map((x) => x.name === name ? {
					...x,
					state: "error",
					note: e.message
				} : x));
			}
		}
		setBusy(false);
	}
	async function confirmSchedule() {
		setBusy(true);
		try {
			await onSchedule(targetDate.toISOString());
			setFireAt(targetDate.getTime());
			setNow(Date.now());
			setStage("countdown");
		} finally {
			setBusy(false);
		}
	}
	async function handleCancelSchedule() {
		setBusy(true);
		try {
			await onCancelSchedule();
		} finally {
			setBusy(false);
			onClose();
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "pm-backdrop fixed inset-0 z-[120] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "pm-card flex w-full max-w-md flex-col gap-5 rounded-[28px] border border-border bg-card p-6 shadow-2xl",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2.5",
						children: [
							stage !== "options" && stage !== "progress" && stage !== "countdown" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setStage(stage === "warning" && pendingMode === "schedule" ? "schedule" : "options"),
								className: "ios-btn grid size-8 place-items-center rounded-full bg-cardhover text-muted-foreground",
								"aria-label": "Back",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "size-4" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid size-10 place-items-center rounded-xl bg-primary/15 text-primary",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-5" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "truncate text-base font-bold text-foreground",
									children: action.label
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "truncate text-xs text-muted-foreground",
									children: [
										devices.length,
										" device",
										devices.length !== 1 ? "s" : "",
										" selected"
									]
								})]
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: onClose,
						className: "ios-btn grid size-8 shrink-0 place-items-center rounded-full bg-cardhover text-muted-foreground",
						"aria-label": "Close",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
					})]
				}),
				stage === "options" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => {
							setPendingMode("now");
							setStage("warning");
						},
						className: "ios-card-hover ios-btn flex w-full items-center justify-between rounded-2xl border border-border bg-cardhover p-4 text-left hover:border-primary/40",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid size-10 place-items-center rounded-xl bg-warning/15 text-warning",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Zap, { className: "size-5" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block text-sm font-bold text-foreground",
								children: "Execute immediately"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-muted-foreground",
								children: "Runs right away, no delay"
							})] })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-5 shrink-0 text-primary" })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => {
							setPendingMode("schedule");
							setStage("schedule");
						},
						className: "ios-card-hover ios-btn flex w-full items-center justify-between rounded-2xl border border-border bg-cardhover p-4 text-left hover:border-primary/40",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid size-10 place-items-center rounded-xl bg-primary/15 text-primary",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "size-5" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block text-sm font-bold text-foreground",
								children: "Schedule timer"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-muted-foreground",
								children: "Set a specific time for execution"
							})] })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-5 shrink-0 text-primary" })]
					})]
				}),
				stage === "schedule" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "pm-fade-in flex flex-col gap-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "pm-picker-container",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pm-picker-selection-bar" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wheel, {
								items: Array.from({ length: 12 }, (_, i) => pad$1(i + 1)),
								selectedIndex: time.hours - 1,
								onChange: (i) => setTime((t) => ({
									...t,
									hours: i + 1
								}))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wheel, {
								items: Array.from({ length: 60 }, (_, i) => pad$1(i)),
								selectedIndex: time.minutes,
								onChange: (i) => setTime((t) => ({
									...t,
									minutes: i
								}))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wheel, {
								items: ["AM", "PM"],
								selectedIndex: time.ampm === "AM" ? 0 : 1,
								onChange: (i) => setTime((t) => ({
									...t,
									ampm: i === 0 ? "AM" : "PM"
								}))
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between border-t border-border/50 pt-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono text-[10px] uppercase tracking-wider text-muted-foreground",
								children: "Time left"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono text-sm font-bold text-primary",
								children: pickerTimeLeftLabel
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setStage("options"),
								className: "ios-btn rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-semibold text-foreground",
								children: "Cancel"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setStage("warning"),
								className: "ios-btn rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-lg shadow-primary/30",
								children: "Apply schedule"
							})]
						})]
					})]
				}),
				stage === "warning" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "pm-fade-in flex flex-col gap-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-3.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "size-[18px] shrink-0 text-warning" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs font-medium leading-relaxed text-warning",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Warning:" }),
									" ",
									action.label,
									" will be sent to ",
									devices.length,
									" device",
									devices.length !== 1 ? "s" : "",
									pendingMode === "schedule" ? ` at ${targetDate.toLocaleTimeString()}` : " immediately",
									". Any unsaved work on those PCs may be lost, and background transfers will stop."
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "max-h-40 space-y-2 overflow-y-auto pr-1",
							children: devices.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-3 rounded-xl border border-border/60 bg-cardhover/60 px-3 py-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Monitor, { className: "size-4 shrink-0 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "truncate text-xs text-foreground",
									children: d
								})]
							}, d))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: onClose,
								className: "ios-btn flex-1 rounded-xl border border-border bg-card py-3 text-sm font-semibold text-foreground",
								children: "Cancel"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								disabled: busy,
								onClick: () => void (pendingMode === "now" ? confirmNow() : confirmSchedule()),
								className: "ios-btn flex-1 rounded-xl bg-warning py-3 text-sm font-bold text-background shadow-lg shadow-warning/30 disabled:opacity-50",
								children: busy ? "Sending…" : "Confirm & execute"
							})]
						})
					]
				}),
				stage === "countdown" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "pm-fade-in flex flex-col items-center gap-4 py-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs uppercase tracking-widest text-muted-foreground",
							children: [action.label, " in"]
						}),
						secondsLeft > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: `font-mono text-5xl font-bold tabular-nums transition-colors duration-300 ${critical ? "animate-pulse text-destructive" : "text-foreground"}`,
							children: formatLeft(secondsLeft)
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "font-mono text-2xl font-bold text-warning",
							children: [verb, " now…"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-center text-xs text-muted-foreground",
							children: [
								"Scheduled for ",
								new Date(fireAt).toLocaleTimeString(),
								" — this runs on the PC itself, so it keeps going even if you close this tab."
							]
						}),
						secondsLeft > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							disabled: busy,
							onClick: () => void handleCancelSchedule(),
							className: "ios-btn w-full rounded-xl border border-warning/40 bg-warning/15 py-3 text-sm font-bold text-warning disabled:opacity-50",
							children: busy ? "Cancelling…" : `Cancel ${action.label.toLowerCase()}`
						})
					]
				}),
				stage === "progress" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "pm-fade-in flex flex-col gap-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm font-bold text-foreground",
								children: allDone ? "Finished" : `${verb}…`
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "font-mono text-xs text-primary",
								children: [
									doneCount,
									" of ",
									results.length
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "h-1.5 overflow-hidden rounded-full bg-border",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "h-full rounded-full bg-primary transition-all duration-300",
								style: { width: `${results.length ? doneCount / results.length * 100 : 0}%` }
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "max-h-56 space-y-2 overflow-y-auto pr-1",
							children: results.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-3 rounded-xl border border-border/60 bg-cardhover/60 px-3 py-2.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "grid size-6 shrink-0 place-items-center",
									children: [
										r.state === "running" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin text-primary" }),
										r.state === "ok" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-4 text-primary" }),
										r.state === "error" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "size-4 text-destructive" }),
										r.state === "waiting" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-2 rounded-full bg-muted-foreground/40" })
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0 flex-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "truncate text-xs font-semibold text-foreground",
										children: [
											verb,
											" ",
											r.name
										]
									}), r.note && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "truncate text-[11px] text-destructive",
										children: r.note
									})]
								})]
							}, r.name))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-center font-mono text-[11px] text-muted-foreground",
							children: [
								doneCount,
								" of ",
								results.length
							]
						}),
						allDone && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: onClose,
							className: "ios-btn w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground",
							children: "Done"
						})
					]
				})
			]
		})
	});
}
function OpenFileLinkTab({ session, target }) {
	const [url, setUrl] = (0, import_react.useState)("");
	const [path, setPath] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [note, setNote] = (0, import_react.useState)(null);
	const fileRef = (0, import_react.useRef)(null);
	async function dispatch(command, label) {
		if (!target) {
			setNote("Pick a target PC first.");
			return;
		}
		setBusy(true);
		setNote(null);
		try {
			await remoteExecStart(session, target, command);
			setNote(`${label} → ${target}`);
			addAudit("File/Link", `${label} on ${target}`, "SUCCESS", target);
		} catch (e) {
			setNote(`Failed: ${e.message}`);
			addAudit("File/Link", `${label} failed on ${target}: ${e.message}`, "ERROR", target);
		}
		setBusy(false);
	}
	async function uploadAndOpen(file) {
		if (!target) {
			setNote("Pick a target PC first.");
			return;
		}
		setBusy(true);
		setNote(null);
		try {
			await remoteUploadFile(session, target, "/", file);
			const { root } = await remoteCall(session, target, "info");
			await remoteExecStart(session, target, `start "" "${`${root.replace(/[\\/]+$/, "")}\\${file.name}`}"`);
			setNote(`Sent and opened ${file.name} on ${target}`);
			addAudit("File/Link", `Uploaded and opened ${file.name} on ${target}`, "SUCCESS", target);
		} catch (e) {
			setNote(`Failed: ${e.message}`);
			addAudit("File/Link", `Upload & open failed on ${target}: ${e.message}`, "ERROR", target);
		}
		setBusy(false);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-[20px] border border-border bg-card p-6 md:p-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "text-lg font-bold text-foreground",
				children: "Open File / Link"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted-foreground",
				children: target ? `Applies to ${target}.` : "Select at least one PC first."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 grid gap-3 sm:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: url,
						onChange: (e) => setUrl(e.target.value),
						placeholder: "https://example.com",
						className: "min-w-0 flex-1 rounded-xl border border-border bg-cardhover px-3 py-2.5 font-mono text-xs text-foreground outline-none focus:border-primary"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						disabled: busy || !url.trim() || !target,
						onClick: () => void dispatch(`start "" "${url.trim()}"`, `Opened URL ${url.trim()}`),
						className: "ios-btn flex shrink-0 items-center gap-1.5 rounded-xl border border-border bg-cardhover px-3 text-xs font-semibold text-foreground hover:text-primary disabled:opacity-40",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Globe, { className: "size-4" }), " Open"]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: path,
						onChange: (e) => setPath(e.target.value),
						placeholder: "C:\\Tools\\app.exe",
						className: "min-w-0 flex-1 rounded-xl border border-border bg-cardhover px-3 py-2.5 font-mono text-xs text-foreground outline-none focus:border-primary"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						disabled: busy || !path.trim() || !target,
						onClick: () => void dispatch(`start "" "${path.trim()}"`, `Executed path ${path.trim()}`),
						className: "ios-btn flex shrink-0 items-center gap-1.5 rounded-xl border border-border bg-cardhover px-3 text-xs font-semibold text-foreground hover:text-primary disabled:opacity-40",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "size-4" }), " Run"]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 rounded-2xl border border-border bg-cardhover/40 p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
						className: "mb-1 text-sm font-bold text-foreground",
						children: "Send a file and open it"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mb-4 text-[11px] text-muted-foreground",
						children: [
							"Uploads a file straight to ",
							target || "the target PC",
							" and opens it with whatever app that PC has for that file type."
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						ref: fileRef,
						type: "file",
						className: "hidden",
						onChange: (e) => {
							const f = e.target.files?.[0];
							if (f) uploadAndOpen(f);
							e.target.value = "";
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						disabled: busy || !target,
						onClick: () => fileRef.current?.click(),
						className: "ios-btn flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-40",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "size-4" }),
							" Upload & open on ",
							target || "device"
						]
					})
				]
			}),
			note && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 font-mono text-xs text-muted-foreground",
				children: note
			})
		]
	});
}
var ICON = {
	info: 64,
	warning: 48,
	error: 16
};
function q(v, max) {
	return v.slice(0, max).replace(/'/g, "''");
}
function encodePs(script) {
	const bytes = new Uint8Array(script.length * 2);
	for (let i = 0; i < script.length; i++) {
		const c = script.charCodeAt(i);
		bytes[i * 2] = c & 255;
		bytes[i * 2 + 1] = c >> 8;
	}
	let bin = "";
	for (const b of bytes) bin += String.fromCharCode(b);
	return btoa(bin);
}
/** Yes/No question with an Info / Warning / Error icon, always on top.
* Prints `RESULT:Yes` or `RESULT:No`; runs `yesCommand` only on Yes. */
function buildQuestionCommand(title, content, kind, yesCommand) {
	const flags = ICON[kind] | 327684;
	return `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -EncodedCommand ${encodePs(`
Add-Type -TypeDefinition 'using System; using System.Runtime.InteropServices; public class FLMsg { [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int MessageBoxW(IntPtr h, string text, string caption, uint type); }'
$r = [FLMsg]::MessageBoxW([IntPtr]::Zero, '${q(content, 2e3)}', '${q(title, 120)}', ${flags})
$ans = if ($r -eq 6) { 'Yes' } elseif ($r -eq 7) { 'No' } else { 'No' }
${yesCommand.trim() ? `if ($ans -eq 'Yes') { Invoke-Expression '${q(yesCommand.trim(), 4e3)}' }` : ""}
Write-Output ('RESULT:' + $ans)
`)}`;
}
function AlertTab({ session, target }) {
	const [mode, setMode] = (0, import_react.useState)("direct");
	const [kind, setKind] = (0, import_react.useState)("info");
	const [title, setTitle] = (0, import_react.useState)("");
	const [content, setContent] = (0, import_react.useState)("");
	const [yesCommand, setYesCommand] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [waiting, setWaiting] = (0, import_react.useState)(false);
	const [result, setResult] = (0, import_react.useState)(null);
	const [note, setNote] = (0, import_react.useState)(null);
	async function sendDirect() {
		if (!target || !content.trim()) return;
		setBusy(true);
		setNote(null);
		try {
			await sendControl(session, target, "alert", {
				title: title.trim() || "Message",
				content: content.trim(),
				kind
			});
			setNote(`Alert sent to ${target}`);
			addAudit("Alert", `Sent "${title.trim() || "Message"}" to ${target}`, "SUCCESS", target);
			setTitle("");
			setContent("");
		} catch (e) {
			setNote(`Failed: ${e.message}`);
		}
		setBusy(false);
	}
	async function sendQuestion() {
		if (!target || !content.trim()) return;
		setBusy(true);
		setWaiting(true);
		setResult(null);
		setNote(null);
		const command = buildQuestionCommand(title.trim() || "Confirmation", content.trim(), kind, yesCommand);
		try {
			const { callId } = await remoteExecStart(session, target, command);
			let status = "pending";
			let chunks = [];
			while (status === "pending" || status === "running") {
				await new Promise((r) => setTimeout(r, 500));
				const st = await remoteExecStatus(session, callId);
				status = st.status;
				chunks = st.chunks;
			}
			const full = chunks.join("");
			const m = full.match(/RESULT:(\w+)/);
			const answer = m ? m[1] : "Unknown";
			const output = full.replace(/RESULT:\w+\s*$/, "").trim();
			setResult({
				answer,
				output
			});
			addAudit("Alert", `Question "${title.trim() || "Confirmation"}" answered ${answer} on ${target}`, "SUCCESS", target);
		} catch (e) {
			setNote(`Failed: ${e.message}`);
			addAudit("Alert", `Question failed on ${target}: ${e.message}`, "ERROR", target);
		}
		setBusy(false);
		setWaiting(false);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-[20px] border border-border bg-card p-6 md:p-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-5 flex items-start justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "text-lg font-bold text-foreground",
					children: "Alert"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted-foreground",
					children: target ? `Applies to ${target}.` : "Select at least one PC first."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex shrink-0 rounded-xl border border-border bg-cardhover p-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => {
							setMode("direct");
							setResult(null);
						},
						className: `ios-btn flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${mode === "direct" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "size-3.5" }), " Notify"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => {
							setMode("question");
							setResult(null);
						},
						className: `ios-btn flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${mode === "question" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleQuestionMark, { className: "size-3.5" }), " Ask Yes/No"]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "mb-1 block text-[11px] uppercase tracking-wider text-muted-foreground",
					children: "Type"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-3 gap-2",
					children: [
						[
							"info",
							"Info",
							Info,
							"text-primary"
						],
						[
							"warning",
							"Warning",
							CircleAlert,
							"text-warning"
						],
						[
							"error",
							"Error",
							CircleX,
							"text-destructive"
						]
					].map(([k, label, Icon, tone]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => setKind(k),
						className: `ios-btn flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold ${kind === k ? "border-primary bg-primary/10 text-foreground" : "border-border bg-cardhover text-muted-foreground"}`,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: `size-4 ${tone}` }),
							" ",
							label
						]
					}, k))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "mb-3 block",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "mb-1 block text-[11px] uppercase tracking-wider text-muted-foreground",
					children: "Title"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: title,
					onChange: (e) => setTitle(e.target.value),
					placeholder: mode === "direct" ? "Message" : "Confirmation",
					className: "w-full rounded-xl border border-border bg-cardhover px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "mb-3 block",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "mb-1 block text-[11px] uppercase tracking-wider text-muted-foreground",
					children: mode === "direct" ? "Content" : "Question"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
					value: content,
					onChange: (e) => setContent(e.target.value),
					rows: 3,
					placeholder: mode === "direct" ? "What do you want them to see?" : "Do you want to proceed?",
					className: "w-full resize-none rounded-xl border border-border bg-cardhover p-3 text-sm text-foreground outline-none focus:border-primary"
				})]
			}),
			mode === "question" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "mb-4 block",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mb-1 block text-[11px] uppercase tracking-wider text-muted-foreground",
						children: "Command to run if they click Yes (optional)"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: yesCommand,
						onChange: (e) => setYesCommand(e.target.value),
						placeholder: "cd C:\\ && dir",
						className: "w-full rounded-xl border border-border bg-cardhover px-3 py-2.5 font-mono text-xs text-foreground outline-none focus:border-primary"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mt-1 block text-[10px] text-muted-foreground",
						children: "Clicking No just closes the dialog — nothing runs."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				disabled: busy || !target || !content.trim(),
				onClick: () => void (mode === "direct" ? sendDirect() : sendQuestion()),
				className: "ios-btn flex items-center gap-2 rounded-xl bg-warning px-5 py-2.5 text-sm font-bold text-background disabled:opacity-40",
				children: [waiting ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "size-4" }), waiting ? `Waiting on ${target}…` : `Send to ${target || "device"}`]
			}),
			result && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: `mt-4 rounded-xl border p-3 text-xs ${result.answer === "Yes" ? "border-primary/30 bg-primary/10 text-primary" : "border-border bg-cardhover text-foreground"}`,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "font-bold",
					children: [
						target,
						" clicked: ",
						result.answer
					]
				}), result.output && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1.5 whitespace-pre-wrap font-mono text-[11px] opacity-80",
					children: result.output
				})]
			}),
			note && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 font-mono text-xs text-muted-foreground",
				children: note
			})
		]
	});
}
/**
* Live remote cursor control over the shared screen. Every action here is
* still one round trip through the device_rpc queue — the agent checks for
* new commands every ~2s, and a fresh powershell.exe takes ~100-300ms to
* start — so dragging feels like directing a cursor with real lag, not
* smooth 1:1 tracking. Move events are throttled specifically so a drag
* doesn't flood that queue with more commands than the agent could ever
* keep up with.
*/
function CursorTab({ session, target }) {
	const [size, setSize] = (0, import_react.useState)(null);
	const [image, setImage] = (0, import_react.useState)(null);
	const [live, setLive] = (0, import_react.useState)(false);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [note, setNote] = (0, import_react.useState)(null);
	const [lastPoint, setLastPoint] = (0, import_react.useState)(null);
	const surfaceRef = (0, import_react.useRef)(null);
	const moveThrottle = (0, import_react.useRef)(0);
	const scrollThrottle = (0, import_react.useRef)(0);
	const dragStart = (0, import_react.useRef)(null);
	const dragMoved = (0, import_react.useRef)(false);
	const screenTimer = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		setSize(null);
		setLastPoint(null);
		setImage(null);
		setLive(false);
		if (screenTimer.current) window.clearInterval(screenTimer.current);
		if (!target) return;
		(async () => {
			try {
				const result = (await sendControl(session, target, "cursorInfo")).result;
				setSize({
					width: result?.width || 1920,
					height: result?.height || 1080
				});
			} catch (e) {
				setNote(`Could not read screen size: ${e.message}`);
			}
		})();
		return () => {
			if (screenTimer.current) window.clearInterval(screenTimer.current);
		};
	}, [target, session]);
	async function captureFrame() {
		if (!target) return;
		try {
			const r = await remoteCall(session, target, "screenshot", { preview: true });
			if (r.error) throw new Error(r.error);
			if (r.image) setImage(r.image.startsWith("data:") ? r.image : `data:image/jpeg;base64,${r.image}`);
		} catch (e) {
			setNote(`Screen preview failed: ${e.message}`);
		}
	}
	function toggleLive() {
		if (!target) {
			setNote("Pick a target PC first.");
			return;
		}
		if (live) {
			setLive(false);
			if (screenTimer.current) window.clearInterval(screenTimer.current);
			return;
		}
		setLive(true);
		captureFrame();
		screenTimer.current = window.setInterval(() => void captureFrame(), 2e3);
	}
	function toRemotePoint(clientX, clientY) {
		const el = surfaceRef.current;
		if (!el || !size) return null;
		const rect = el.getBoundingClientRect();
		const fx = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
		const fy = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
		return {
			x: Math.round(fx * size.width),
			y: Math.round(fy * size.height)
		};
	}
	function sendMove(point, force = false) {
		if (!target) return;
		const now = Date.now();
		if (!force && now - moveThrottle.current < 250) return;
		moveThrottle.current = now;
		setLastPoint(point);
		sendControl(session, target, "cursorMove", {
			x: point.x,
			y: point.y
		}).catch((e) => setNote(`Failed: ${e.message}`));
	}
	async function clickAt(point, button) {
		if (!target) return;
		setLastPoint(point);
		setBusy(true);
		try {
			await sendControl(session, target, "cursorClick", {
				x: point.x,
				y: point.y,
				button
			});
		} catch (e) {
			setNote(`Failed: ${e.message}`);
		}
		setBusy(false);
	}
	async function clickLast(button) {
		if (!lastPoint || !target) return;
		setBusy(true);
		try {
			await sendControl(session, target, "cursorClick", {
				x: lastPoint.x,
				y: lastPoint.y,
				button
			});
		} catch (e) {
			setNote(`Failed: ${e.message}`);
		}
		setBusy(false);
	}
	function onPointerDown(clientX, clientY) {
		const point = toRemotePoint(clientX, clientY);
		if (!point) return;
		dragStart.current = point;
		dragMoved.current = false;
	}
	function onPointerMove(clientX, clientY) {
		if (!dragStart.current) return;
		const point = toRemotePoint(clientX, clientY);
		if (!point) return;
		if (Math.abs(point.x - dragStart.current.x) > 3 || Math.abs(point.y - dragStart.current.y) > 3) dragMoved.current = true;
		sendMove(point);
	}
	function onPointerUp(clientX, clientY) {
		const point = toRemotePoint(clientX, clientY);
		dragStart.current = null;
		if (!point) return;
		if (dragMoved.current) sendMove(point, true);
		else clickAt(point, "left");
	}
	function onWheel(e) {
		if (!target) return;
		const now = Date.now();
		if (now - scrollThrottle.current < 200) return;
		scrollThrottle.current = now;
		sendControl(session, target, "cursorScroll", {
			amount: e.deltaY > 0 ? -120 : 120,
			horizontal: false
		}).catch((err) => setNote(`Failed: ${err.message}`));
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-[20px] border border-border bg-card p-6 md:p-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "text-lg font-bold text-foreground",
					children: "Cursor"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: target ? `Drag to move, tap to click on ${target}.` : "Select one PC first."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: toggleLive,
					disabled: !target,
					className: `ios-btn flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold disabled:opacity-40 ${live ? "border-primary bg-primary/15 text-primary" : "border-border bg-cardhover text-foreground"}`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: `size-3.5 ${live ? "animate-spin" : ""}` }), live ? "Live" : "Show screen"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				ref: surfaceRef,
				onMouseDown: (e) => onPointerDown(e.clientX, e.clientY),
				onMouseMove: (e) => e.buttons === 1 && onPointerMove(e.clientX, e.clientY),
				onMouseUp: (e) => onPointerUp(e.clientX, e.clientY),
				onContextMenu: (e) => {
					e.preventDefault();
					const point = toRemotePoint(e.clientX, e.clientY);
					if (point) clickAt(point, "right");
				},
				onWheel,
				onTouchStart: (e) => {
					const t = e.touches[0];
					if (t) onPointerDown(t.clientX, t.clientY);
				},
				onTouchMove: (e) => {
					const t = e.touches[0];
					if (t) onPointerMove(t.clientX, t.clientY);
				},
				onTouchEnd: (e) => {
					const t = e.changedTouches[0];
					if (t) onPointerUp(t.clientX, t.clientY);
				},
				className: "relative mt-5 flex aspect-video w-full select-none touch-none items-center justify-center overflow-hidden rounded-2xl border-2 border-border bg-cardhover/40 text-muted-foreground",
				children: !target ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs",
					children: "No device selected"
				}) : !size ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-6 animate-spin opacity-40" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [image ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: image,
					alt: "Live screen",
					className: "pointer-events-none h-full w-full object-contain",
					draggable: false
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs",
					children: "Tap \"Show screen\" to see what you're clicking on"
				}), lastPoint && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "pointer-events-none absolute bottom-2 right-3 rounded bg-black/50 px-1.5 py-0.5 font-mono text-[10px] text-white",
					children: [
						lastPoint.x,
						", ",
						lastPoint.y
					]
				})] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 grid grid-cols-2 gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					disabled: busy || !lastPoint,
					onClick: () => void clickLast("left"),
					className: "ios-btn rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-40",
					children: "Left click"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					disabled: busy || !lastPoint,
					onClick: () => void clickLast("right"),
					className: "ios-btn rounded-xl border border-border bg-cardhover py-3 text-sm font-semibold text-foreground disabled:opacity-40",
					children: "Right click"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-center text-[11px] text-muted-foreground",
				children: "Scroll works with your mouse wheel over the box above."
			}),
			note && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 font-mono text-xs text-muted-foreground",
				children: note
			})
		]
	});
}
var POWER_MODAL_ACTIONS = [{
	key: "shutdown",
	label: "Shutdown",
	icon: Power,
	tone: "warning"
}, {
	key: "restart",
	label: "Restart",
	icon: RotateCw,
	tone: "primary"
}];
var POWER_INSTANT_ACTIONS = [
	{
		key: "sleep",
		label: "Sleep",
		icon: Moon,
		tone: "accent"
	},
	{
		key: "logout",
		label: "Log Out",
		icon: LogOut,
		tone: "warning"
	},
	{
		key: "lock",
		label: "Lock",
		icon: Lock,
		tone: "muted"
	}
];
var POWER_ACTIONS = [...POWER_MODAL_ACTIONS, ...POWER_INSTANT_ACTIONS];
var AGENT_ACTIONS = [{
	key: "restartAgent",
	label: "Restart Agent",
	icon: RefreshCw,
	danger: false
}, {
	key: "removeAgent",
	label: "Stop Agent",
	icon: Trash2,
	danger: true
}];
var TABS = [
	"Power",
	"Agent",
	"Copy/Paste",
	"Open/Link",
	"Alert",
	"Cursor",
	"Display",
	"Audit"
];
var TAB_META = {
	Power: {
		label: "Power",
		description: "Shutdown, restart, sleep & schedule",
		Icon: Power
	},
	Agent: {
		label: "Agent",
		description: "Restart, uninstall & DNS settings",
		Icon: RefreshCw
	},
	"Copy/Paste": {
		label: "Copy / Paste",
		description: "Send clipboard to the target PC",
		Icon: Clipboard
	},
	"Open/Link": {
		label: "Open File / Link",
		description: "Open a URL, run a path, send & open a file",
		Icon: Link
	},
	Alert: {
		label: "Alert",
		description: "Pop up a message or a yes/no question",
		Icon: MessageSquareWarning
	},
	Cursor: {
		label: "Cursor",
		description: "Move the mouse and click on the target PC",
		Icon: MousePointer2
	},
	Display: {
		label: "Display",
		description: "Screen capture & camera",
		Icon: MonitorPlay
	},
	Audit: {
		label: "Audit",
		description: "History of remote actions",
		Icon: FileClock
	}
};
var toneRing = {
	warning: "hover:border-warning hover:bg-warning/10",
	primary: "hover:border-primary hover:bg-primary/10",
	accent: "hover:border-accent hover:bg-accent/10",
	muted: "hover:border-foreground hover:bg-cardhover"
};
var toneText = {
	warning: "text-warning",
	primary: "text-primary",
	accent: "text-accent",
	muted: "text-muted-foreground"
};
function pad(n) {
	return String(n).padStart(2, "0");
}
function fmtLeft(secs) {
	const s = Math.max(0, secs);
	const h = Math.floor(s / 3600);
	const m = Math.floor(s % 3600 / 60);
	const sec = s % 60;
	return h > 0 ? `${h}h ${pad(m)}m` : `${pad(m)}:${pad(sec)}`;
}
function ControlTab({ session, devices }) {
	const [targets, setTargets] = (0, import_react.useState)([]);
	const [busy, setBusy] = (0, import_react.useState)(null);
	const [confirm, setConfirm] = (0, import_react.useState)(null);
	const [note, setNote] = (0, import_react.useState)(null);
	const [pickerOpen, setPickerOpen] = (0, import_react.useState)(false);
	const [tab, setTab] = (0, import_react.useState)(null);
	const [powerAction, setPowerAction] = (0, import_react.useState)(null);
	const [schedules, setSchedules] = (0, import_react.useState)([]);
	const [nowTick, setNowTick] = (0, import_react.useState)(() => Date.now());
	const onlineDevices = (0, import_react.useMemo)(() => devices.filter((d) => d.online && d.name !== session.deviceName), [devices, session.deviceName]);
	const target = targets[0] ?? "";
	const selected = devices.find((d) => d.name === target);
	const allSelected = onlineDevices.length > 0 && targets.length === onlineDevices.length;
	(0, import_react.useEffect)(() => {
		if (tab === null && typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches) setTab("Power");
	}, [tab]);
	(0, import_react.useEffect)(() => {
		setTargets((t) => t.filter((n) => onlineDevices.some((d) => d.name === n)));
	}, [onlineDevices]);
	async function refreshSchedules() {
		try {
			const { schedules: rows } = await listSchedules(session);
			setSchedules(rows);
		} catch {}
	}
	(0, import_react.useEffect)(() => {
		refreshSchedules();
		const id = window.setInterval(refreshSchedules, 5e3);
		return () => window.clearInterval(id);
	}, []);
	(0, import_react.useEffect)(() => {
		const id = window.setInterval(() => setNowTick(Date.now()), 1e3);
		return () => window.clearInterval(id);
	}, []);
	function toggleTarget(name) {
		setTargets((t) => t.includes(name) ? t.filter((n) => n !== name) : [...t, name]);
	}
	function toggleSelectAll() {
		setTargets(allSelected ? [] : onlineDevices.map((d) => d.name));
	}
	async function execute(command, deviceName, extra) {
		setBusy(command);
		setNote(null);
		const isPower = POWER_ACTIONS.some((a) => a.key === command) || command === "cancelShutdown";
		try {
			await sendControl(session, deviceName || target, command, extra);
			setNote(`${command} sent to ${deviceName || target}`);
			addAudit(isPower ? "Power" : "System", `${command} sent`, "SUCCESS", deviceName || target);
		} catch (e) {
			setNote(`Failed: ${e.message}`);
			addAudit(isPower ? "Power" : "System", `${command} failed: ${e.message}`, "ERROR", deviceName || target);
			throw e;
		} finally {
			setBusy(null);
		}
	}
	/** Run one command across every selected device, ignoring individual failures. */
	async function executeAll(command, extra) {
		for (const name of targets) try {
			await execute(command, name, extra);
		} catch {}
	}
	const modalExistingSchedules = (0, import_react.useMemo)(() => {
		if (!powerAction) return [];
		return schedules.filter((s) => s.action === powerAction.key && targets.includes(s.device_name));
	}, [
		schedules,
		powerAction,
		targets
	]);
	const firingNow = (0, import_react.useMemo)(() => schedules.filter((s) => {
		const left = new Date(s.fire_at).getTime() - nowTick;
		return left <= 0 && left > -6e4;
	}), [schedules, nowTick]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4 md:gap-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex items-start justify-between gap-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-base font-bold leading-tight text-foreground md:text-2xl",
					children: "Control Center"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-mono text-xs uppercase tracking-widest text-primary",
					children: "Remote Host Management & Power"
				})] })
			}),
			firingNow.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-col gap-2 rounded-2xl border border-warning/30 bg-warning/10 p-3.5",
				children: firingNow.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2 text-xs font-semibold text-warning",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-2 shrink-0 animate-pulse rounded-full bg-warning" }),
						s.action === "shutdown" ? "Shutting down" : "Restarting",
						" ",
						s.device_name,
						"…"
					]
				}, s.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-2xl border border-border bg-card p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center gap-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DevicePickerButton, {
								label: targets.length === 0 ? "Select PCs" : targets.length === 1 ? targets[0] : `${targets.length} PCs selected`,
								onClick: () => setPickerOpen(true)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: toggleSelectAll,
								disabled: !onlineDevices.length,
								className: `ios-btn flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold disabled:opacity-40 ${allSelected ? "bg-primary text-primary-foreground" : "border border-border bg-cardhover text-muted-foreground hover:text-foreground"}`,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SquareCheckBig, { className: "size-3.5" }), allSelected ? "Clear all" : "Select all"]
							}),
							targets.length === 1 && selected && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: `shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${selected.agent ? "bg-warning/15 text-warning" : "bg-primary/15 text-primary"}`,
								children: selected.agent ? "Background agent" : "In use"
							})
						]
					}),
					onlineDevices.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "no-scrollbar mt-3 flex gap-2 overflow-x-auto",
						children: onlineDevices.map((d) => {
							const on = targets.includes(d.name);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => toggleTarget(d.name),
								className: `ios-btn flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold ${on ? "bg-primary text-primary-foreground" : "border border-border bg-cardhover text-muted-foreground hover:text-foreground"}`,
								children: [on && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-3" }), d.name]
							}, d.id);
						})
					}),
					targets.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 font-mono text-[11px] text-muted-foreground",
						children: [
							"Power and agent actions run on all ",
							targets.length,
							" selected PCs. Clipboard and display use ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-foreground",
								children: target
							}),
							"."
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "no-scrollbar hidden items-center gap-2 overflow-x-auto border-b border-border/60 pb-2 md:flex md:gap-3",
				children: TABS.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => setTab(t),
					className: `ios-btn shrink-0 rounded-xl px-5 py-2.5 text-xs font-semibold md:text-sm ${tab === t ? "bg-primary text-primary-foreground" : "border border-border bg-card text-muted-foreground hover:text-foreground"}`,
					children: t
				}, t))
			}),
			tab === null && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-col gap-3 md:hidden",
				children: TABS.map((t) => {
					const meta = TAB_META[t];
					const Icon = meta.Icon;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => setTab(t),
						className: "ios-card-hover ios-btn flex items-center gap-4 rounded-2xl border border-border bg-card p-4 text-left",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid size-11 place-items-center rounded-2xl bg-primary/15 text-primary",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-5" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-sm font-bold text-foreground",
									children: meta.label
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-xs text-muted-foreground",
									children: meta.description
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-5 text-muted-foreground" })
						]
					}, t);
				})
			}),
			tab !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-4 md:gap-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => setTab(null),
						className: "ios-btn flex w-fit items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground md:hidden",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "size-4" }), " Back"]
					}),
					tab === "Power" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid grid-cols-2 gap-4 lg:grid-cols-5",
						children: POWER_ACTIONS.map((a) => {
							const isModal = POWER_MODAL_ACTIONS.some((m) => m.key === a.key);
							const activeSchedule = isModal ? schedules.find((s) => s.action === a.key && targets.includes(s.device_name)) : void 0;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								disabled: !targets.length,
								onClick: () => {
									if (isModal) setPowerAction({
										key: a.key,
										label: a.label,
										icon: a.icon
									});
									else executeAll(a.key);
								},
								className: `ios-card-hover ios-btn relative flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-6 disabled:opacity-40 ${toneRing[a.tone]}`,
								children: [
									activeSchedule && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "absolute right-2 top-2 rounded-full bg-warning/15 px-2 py-0.5 font-mono text-[10px] font-bold text-warning",
										children: fmtLeft(Math.max(0, Math.floor((new Date(activeSchedule.fire_at).getTime() - nowTick) / 1e3)))
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(a.icon, { className: `size-8 ${toneText[a.tone]}` }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-sm font-bold text-foreground md:text-base",
										children: a.label
									})
								]
							}, a.key);
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-[20px] border border-border bg-card p-6",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-sm font-semibold text-foreground md:text-base",
							children: "Time left"
						}), schedules.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 font-mono text-xs text-muted-foreground md:text-sm",
							children: "No shutdown or restart is currently scheduled."
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-3 flex flex-col gap-2",
							children: schedules.map((s) => {
								const secsLeft = Math.max(0, Math.floor((new Date(s.fire_at).getTime() - nowTick) / 1e3));
								const spec = POWER_MODAL_ACTIONS.find((m) => m.key === s.action);
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-3 rounded-xl border border-border/60 bg-cardhover/60 px-3 py-2.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										onClick: () => {
											setTargets([s.device_name]);
											setPowerAction({
												key: spec.key,
												label: spec.label,
												icon: spec.icon
											});
										},
										className: "ios-btn flex flex-1 items-center gap-3 text-left",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(spec.icon, { className: `size-4 shrink-0 ${toneText[spec.tone]}` }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "min-w-0 flex-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "truncate text-xs font-semibold text-foreground",
												children: [
													spec.label,
													" — ",
													s.device_name
												]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "font-mono text-[11px] text-muted-foreground",
												children: secsLeft > 0 ? `${fmtLeft(secsLeft)} left` : "Running now"
											})]
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: async () => {
											try {
												await cancelSchedule(session, s.id);
												await sendControl(session, s.device_name, "cancelShutdown");
												addAudit("Power", `${s.action} schedule cancelled`, "SUCCESS", s.device_name);
											} catch (e) {
												addAudit("Power", `Cancel failed: ${e.message}`, "ERROR", s.device_name);
											} finally {
												refreshSchedules();
											}
										},
										className: "ios-btn grid size-7 shrink-0 place-items-center rounded-full bg-cardhover text-muted-foreground hover:text-destructive",
										"aria-label": "Cancel schedule",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-3.5" })
									})]
								}, s.id);
							})
						})]
					})] }),
					tab === "Agent" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AgentPanel, {
						busy,
						target,
						targetCount: targets.length,
						onRun: (cmd, extra) => executeAll(cmd, extra),
						onConfirmStop: () => setConfirm("removeAgent")
					}),
					tab === "Copy/Paste" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClipboardPanel, {
						session,
						target
					}),
					tab === "Open/Link" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OpenFileLinkTab, {
						session,
						target
					}),
					tab === "Alert" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertTab, {
						session,
						target
					}),
					tab === "Cursor" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CursorTab, {
						session,
						target
					}),
					tab === "Display" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DisplayHub, {
						session,
						target,
						onPick: () => setPickerOpen(true)
					}),
					tab === "Audit" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuditTrail, { session }),
					note && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "rounded-xl border border-border bg-card p-3 font-mono text-xs text-muted-foreground",
						children: note
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DevicePickerDialog, {
				open: pickerOpen,
				onClose: () => setPickerOpen(false),
				devices,
				selected: target,
				onSelect: (name) => setTargets(name ? [name] : []),
				onlineOnly: true,
				excludeName: session.deviceName,
				multiple: tab !== "Display",
				selectedNames: targets,
				onToggle: (name) => toggleTarget(name),
				onSelectAll: () => toggleSelectAll()
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PowerModal, {
				open: !!powerAction,
				action: powerAction,
				devices: targets,
				existingSchedules: modalExistingSchedules,
				onClose: () => setPowerAction(null),
				onExecuteNow: (device) => execute(powerAction.key, device, { seconds: 0 }),
				onSchedule: async (fireAtIso) => {
					const secs = Math.max(0, Math.round((new Date(fireAtIso).getTime() - Date.now()) / 1e3));
					for (const device of targets) {
						await sendControl(session, device, powerAction.key, { seconds: secs });
						await schedulePower(session, device, powerAction.key, fireAtIso);
						addAudit("Power", `${powerAction.key} scheduled at ${new Date(fireAtIso).toLocaleTimeString()}`, "SUCCESS", device);
					}
					await refreshSchedules();
				},
				onCancelSchedule: async () => {
					for (const s of modalExistingSchedules) try {
						await cancelSchedule(session, s.id);
						await sendControl(session, s.device_name, "cancelShutdown");
						addAudit("Power", `${s.action} schedule cancelled`, "SUCCESS", s.device_name);
					} catch (e) {
						addAudit("Power", `Cancel failed: ${e.message}`, "ERROR", s.device_name);
					}
					await refreshSchedules();
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: !!confirm,
				onOpenChange: (v) => !v && setConfirm(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "max-w-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
						className: "flex items-center gap-2 text-destructive",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "size-5" }),
							" Confirm ",
							confirm
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogDescription, { children: [
						"This will terminate the FileLink agent and remove all agent files from",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-medium text-foreground",
							children: targets.length > 1 ? `${targets.length} PCs` : target
						}),
						". They will no longer be reachable until the agent is re-installed."
					] })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setConfirm(null),
							className: "ios-btn flex-1 rounded-xl border border-border py-2 text-sm text-foreground hover:bg-accent/10",
							children: "Cancel"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => {
								const c = confirm;
								setConfirm(null);
								executeAll(c);
							},
							className: "ios-btn flex-1 rounded-xl bg-destructive py-2 text-sm font-medium text-destructive-foreground",
							children: "Confirm"
						})]
					})]
				})
			})
		]
	});
}
function AgentPanel({ target, targetCount, busy, onRun, onConfirmStop }) {
	const [dnsInterface, setDnsInterface] = (0, import_react.useState)("Ethernet");
	const [primaryDns, setPrimaryDns] = (0, import_react.useState)("1.1.1.1");
	const [secondaryDns, setSecondaryDns] = (0, import_react.useState)("1.0.0.1");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-[20px] border border-border bg-card p-6 md:p-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "text-lg font-bold text-foreground",
				children: "Agent Control Module"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 text-sm text-muted-foreground",
				children: [
					"Manage the remote agent runtime, cleanup its files, or reconfigure the network DNS.",
					" ",
					targetCount > 1 ? `Every action below applies to all ${targetCount} selected PCs.` : target ? `Applies to ${target}.` : "Select at least one PC first."
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2",
				children: AGENT_ACTIONS.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					disabled: !target || busy === a.key,
					onClick: () => {
						if (a.danger) onConfirmStop();
						else onRun(a.key);
					},
					className: `ios-card-hover ios-btn flex items-center gap-3 rounded-2xl border border-border p-5 text-left disabled:opacity-40 ${a.danger ? "bg-destructive/10 hover:border-destructive/40" : "bg-cardhover"}`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: `grid size-10 shrink-0 place-items-center rounded-xl ${a.danger ? "bg-destructive/20 text-destructive" : "bg-primary/15 text-primary"}`,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(a.icon, { className: "size-5" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block text-sm font-bold text-foreground",
						children: busy === a.key ? "…" : a.label
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block text-[11px] text-muted-foreground",
						children: a.danger ? "Kill process & remove files" : "Restart filelink.mjs runner"
					})] })]
				}, a.key))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 rounded-2xl border border-border bg-cardhover/40 p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-3 flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid size-9 place-items-center rounded-xl bg-primary/15 text-primary",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Globe, { className: "size-4" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
							className: "text-sm font-bold text-foreground",
							children: "DNS Settings"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[11px] text-muted-foreground",
							children: "View or change the DNS servers on the target PC."
						})] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-1 gap-3 sm:grid-cols-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								label: "Interface",
								value: dnsInterface,
								onChange: setDnsInterface,
								placeholder: "Ethernet"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								label: "Primary DNS",
								value: primaryDns,
								onChange: setPrimaryDns,
								placeholder: "1.1.1.1"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								label: "Secondary DNS",
								value: secondaryDns,
								onChange: setSecondaryDns,
								placeholder: "1.0.0.1"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 flex flex-wrap gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								disabled: !target || busy === "setDns",
								onClick: () => void onRun("setDns", {
									interface: dnsInterface,
									servers: [primaryDns, secondaryDns].filter(Boolean)
								}),
								className: "ios-btn rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-40",
								children: "Apply DNS"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								disabled: !target || busy === "resetDns",
								onClick: () => void onRun("resetDns", { interface: dnsInterface }),
								className: "ios-btn rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:text-primary disabled:opacity-40",
								children: "Reset to DHCP"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								disabled: !target || busy === "flushDns",
								onClick: () => void onRun("flushDns"),
								className: "ios-btn rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:text-primary disabled:opacity-40",
								children: "Flush DNS Cache"
							})
						]
					})
				]
			})
		]
	});
}
function Input({ label, value, onChange, placeholder }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "flex flex-col gap-1",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-[10px] uppercase tracking-wider text-muted-foreground",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			value,
			onChange: (e) => onChange(e.target.value),
			placeholder,
			className: "rounded-xl border border-border bg-background px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-primary"
		})]
	});
}
function pct(status) {
	if (status === "received") return 100;
	if (status === "shared") return 100;
	if (status === "pending") return 70;
	if (status === "uploading") return 25;
	return 10;
}
function label(status, kind) {
	if (status === "uploading") return kind === "sent" ? "uploading…" : "sender is uploading…";
	if (status === "pending") return kind === "sent" ? "sending — waiting for that PC" : "receiving…";
	if (status === "received") return "delivered";
	if (status === "shared") return "in the room";
	return status;
}
function useJobs$1() {
	return (0, import_react.useSyncExternalStore)(subscribeJobs, getJobs, getJobs);
}
/** Same content as TransfersDialog, without the modal wrapper — used to
* render Transfers as a normal section (like File Explorer, Tasks, PC
* Setup, Control Center) instead of a floating box. */
function TransfersPanel({ session, sent, received, defaultView = "received" }) {
	const [view, setView] = (0, import_react.useState)(defaultView);
	const rows = view === "sent" ? sent : received;
	const jobs = useJobs$1().filter((j) => j.kind === (view === "sent" ? "send" : "receive"));
	const live = jobs.filter((j) => j.status === "active");
	const queued = rows.filter((r) => r.status === "pending" || r.status === "uploading");
	const done = rows.filter((r) => r.status !== "pending" && r.status !== "uploading");
	const totalCount = rows.length;
	const doneCount = done.length;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4 md:gap-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-base font-bold leading-tight text-foreground md:text-2xl",
					children: "Transfers"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-mono text-xs uppercase tracking-widest text-primary",
					children: live.length ? `${live.length} moving right now` : queued.length ? `${queued.length} in the queue` : "Nothing in the queue — everything is through"
				})] }), totalCount > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "shrink-0 rounded-full border border-border bg-cardhover px-3 py-1.5 font-mono text-xs font-semibold text-foreground",
					children: [
						Math.min(doneCount + 1, totalCount),
						" of ",
						totalCount
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex w-fit rounded-xl border border-border bg-card p-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => setView("received"),
					className: `ios-btn rounded-lg px-4 py-2 text-xs font-semibold ${view === "received" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`,
					children: "Received"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => setView("sent"),
					className: `ios-btn rounded-lg px-4 py-2 text-xs font-semibold ${view === "sent" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`,
					children: "Sent"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-[20px] border border-border bg-card p-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-2 flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-[11px] font-semibold uppercase tracking-widest text-muted-foreground",
							children: "Right now"
						}), jobs.some((j) => j.status !== "active") && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: clearFinishedJobs,
							className: "font-mono text-[11px] text-muted-foreground hover:text-primary",
							children: "clear finished"
						})]
					}),
					!jobs.length && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: "Nothing moving"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "space-y-3",
						children: jobs.slice(0, 12).map((j) => {
							const p = j.total ? Math.min(100, j.loaded / j.total * 100) : j.status === "done" ? 100 : 8;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "rounded-md border border-border p-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "truncate text-sm text-foreground",
											children: j.name
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "shrink-0 font-mono text-[11px] text-muted-foreground",
											children: [Math.round(p), "%"]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Progress, {
										value: p,
										className: "mt-2 h-1.5"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "mt-1.5 font-mono text-[11px] text-muted-foreground",
										children: [
											humanSize(j.loaded),
											j.total ? ` / ${humanSize(j.total)}` : "",
											" ·",
											" ",
											j.status === "active" ? humanSpeed(j.bps) : j.status === "done" ? "finished" : j.note,
											j.note && j.status !== "error" ? ` · ${j.note}` : ""
										]
									})
								]
							}, j.id);
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "rounded-[20px] border border-border bg-card p-6",
				children: [{
					head: "In the queue",
					list: queued
				}, {
					head: "Completed",
					list: done
				}].map(({ head, list }, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: i > 0 ? "mt-6" : "",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TransferSection, {
						head,
						list,
						kind: view,
						session
					})
				}, head))
			})
		]
	});
}
function TransferSection({ head, list, kind, session }) {
	const [expanded, setExpanded] = (0, import_react.useState)(false);
	const visible = expanded ? list.slice(0, 60) : list.slice(0, 6);
	const remaining = list.length - visible.length;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
			className: "mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground",
			children: head
		}),
		!list.length && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-muted-foreground",
			children: "Nothing here"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "space-y-3",
			children: visible.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "rounded-md border border-border p-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "truncate text-sm text-foreground",
							children: t.file_name
						}), kind === "received" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => downloadTransfer(session, t.id),
							className: "shrink-0 rounded border border-border px-2 py-1 font-mono text-[11px] text-foreground/80 hover:border-primary hover:text-primary",
							children: "save"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Progress, {
						value: pct(t.status),
						className: "mt-2 h-1.5"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1.5 font-mono text-[11px] text-muted-foreground",
						children: [
							humanSize(t.size_bytes),
							" ·",
							" ",
							kind === "sent" ? `to ${t.to_name ?? "everyone"}` : `from ${t.from_name}`,
							" ·",
							" ",
							label(t.status, kind)
						]
					})
				]
			}, t.id))
		}),
		remaining > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			onClick: () => setExpanded(true),
			className: "mt-2 w-full rounded-lg py-1.5 text-center font-mono text-[11px] text-primary hover:bg-cardhover",
			children: [
				"Show ",
				remaining,
				" more"
			]
		})
	] });
}
/** Shows what actually connected: the website itself, the Node CLI, the
* unattended background agent, or the native desktop app — distinct from
* `agent` (which only means "running unattended"). */
function ClientKindBadge({ kind }) {
	if (!kind || kind === "unknown") return null;
	const label = {
		web: "Web",
		cli: "CLI",
		agent: "Agent",
		"desktop-app": "App"
	}[kind];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "shrink-0 rounded-full border border-border bg-cardhover px-2 py-0.5 font-mono text-[10px] text-muted-foreground",
		children: label
	});
}
function DevicesTab({ session, devices, onChanged }) {
	const [editingId, setEditingId] = (0, import_react.useState)(null);
	const [editValue, setEditValue] = (0, import_react.useState)("");
	const [busyId, setBusyId] = (0, import_react.useState)(null);
	const [confirmId, setConfirmId] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)(null);
	async function saveRename(id) {
		const name = editValue.trim();
		if (!name) return;
		setBusyId(id);
		setError(null);
		try {
			onChanged((await updateDevice(session, id, name)).devices);
			setEditingId(null);
		} catch (e) {
			setError(e.message);
		}
		setBusyId(null);
	}
	async function confirmDelete(id) {
		setBusyId(id);
		setError(null);
		try {
			onChanged((await deleteDevice(session, id)).devices);
			setConfirmId(null);
		} catch (e) {
			setError(e.message);
		}
		setBusyId(null);
	}
	const target = devices.find((d) => d.id === confirmId);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4 md:gap-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-base font-bold leading-tight text-foreground md:text-2xl",
				children: "Devices"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "font-mono text-xs uppercase tracking-widest text-primary",
				children: [devices.length, " in this room"]
			})] }),
			error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive",
				children: error
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-2",
				children: [devices.map((d) => {
					const isSelf = d.id === session.deviceId;
					const editing = editingId === d.id;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3 rounded-2xl border border-border bg-card p-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: `grid size-10 shrink-0 place-items-center rounded-xl ${d.online ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Monitor, { className: "size-5" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0 flex-1",
								children: [editing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									autoFocus: true,
									value: editValue,
									onChange: (e) => setEditValue(e.target.value),
									onKeyDown: (e) => {
										if (e.key === "Enter") saveRename(d.id);
										if (e.key === "Escape") setEditingId(null);
									},
									className: "w-full rounded-lg border border-primary bg-cardhover px-2 py-1 text-sm text-foreground outline-none"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "truncate text-sm font-bold text-foreground",
											children: d.name
										}),
										isSelf && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "shrink-0 rounded-full bg-cardhover px-2 py-0.5 text-[10px] text-muted-foreground",
											children: "this one"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClientKindBadge, { kind: d.clientKind })
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "font-mono text-[11px] text-muted-foreground",
									children: [
										d.online ? "Connected" : "Offline",
										" · ",
										d.osInfo || d.platform || "PC",
										d.agent ? " · background agent" : ""
									]
								})]
							}),
							editing ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex shrink-0 gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									disabled: busyId === d.id,
									onClick: () => void saveRename(d.id),
									className: "ios-btn grid size-8 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-40",
									"aria-label": "Save name",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-4" })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => setEditingId(null),
									className: "ios-btn grid size-8 place-items-center rounded-full bg-cardhover text-muted-foreground",
									"aria-label": "Cancel",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
								})]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex shrink-0 gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => {
										setEditingId(d.id);
										setEditValue(d.name);
									},
									className: "ios-btn grid size-8 place-items-center rounded-full bg-cardhover text-muted-foreground hover:text-primary",
									"aria-label": `Rename ${d.name}`,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "size-3.5" })
								}), !isSelf && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => setConfirmId(d.id),
									className: "ios-btn grid size-8 place-items-center rounded-full bg-cardhover text-muted-foreground hover:text-destructive",
									"aria-label": `Delete ${d.name}`,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3.5" })
								})]
							})
						]
					}, d.id);
				}), devices.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "rounded-2xl border border-border/60 bg-cardhover/40 p-8 text-center text-sm text-muted-foreground",
					children: "No devices in this room yet."
				})]
			}),
			target && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-[110] grid place-items-center bg-black/75 p-4 backdrop-blur-md",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "w-full max-w-sm rounded-[28px] border border-border bg-card p-6 shadow-2xl",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "mx-auto size-9 text-destructive" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h4", {
							className: "mt-3 text-center text-base font-bold text-foreground",
							children: [
								"Delete ",
								target.name,
								"?"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-center text-xs leading-relaxed text-muted-foreground",
							children: target.online ? "It's currently online — the agent will be told to uninstall itself (removing filelink.mjs, its startup shortcut, and its data folder) before being removed from this room." : "It's offline right now, so it'll just be removed from this room's device list. If it reconnects later, it'll show up again as a new device."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-5 flex gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setConfirmId(null),
								className: "ios-btn flex-1 rounded-xl border border-border bg-cardhover px-4 py-2.5 text-xs font-semibold text-foreground",
								children: "Cancel"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								disabled: busyId === target.id,
								onClick: () => void confirmDelete(target.id),
								className: "ios-btn flex-1 rounded-xl bg-destructive px-4 py-2.5 text-xs font-bold text-destructive-foreground disabled:opacity-40",
								children: busyId === target.id ? "Removing…" : "Delete"
							})]
						})
					]
				})
			})
		]
	});
}
function useJobs() {
	return (0, import_react.useSyncExternalStore)(subscribeJobs, getJobs, getJobs);
}
/**
* Docked, always-visible transfer manager. It appears by itself as soon as
* anything starts moving and can be collapsed to a single summary bar.
*/
function TransferManager({ hidden, setHidden, collapsed, setCollapsed }) {
	const jobs = useJobs();
	const active = jobs.filter((j) => j.status === "active");
	if (!jobs.length || hidden) return null;
	const totalLoaded = active.reduce((n, j) => n + j.loaded, 0);
	const totalSize = active.reduce((n, j) => n + (j.total || 0), 0);
	const overall = totalSize ? Math.min(100, totalLoaded / totalSize * 100) : active.length ? 8 : 100;
	const speed = active.reduce((n, j) => n + j.bps, 0);
	const latestBatchId = jobs.find((j) => j.batchId)?.batchId;
	const batchJobs = latestBatchId ? jobs.filter((j) => j.batchId === latestBatchId) : [];
	const batchTotal = batchJobs[0]?.batchTotal ?? 0;
	const batchDone = batchJobs.filter((j) => j.status === "done" || j.status === "error").length;
	const inBatchProgress = batchTotal > 0 && batchDone < batchTotal;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "pointer-events-none fixed inset-x-0 bottom-0 z-[95] flex justify-center p-3 sm:justify-end sm:p-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "pointer-events-auto w-full max-w-sm overflow-hidden rounded-[22px] border border-border bg-card/95 shadow-2xl backdrop-blur-xl",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3 px-4 py-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid size-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary",
							children: active.some((j) => j.kind === "receive") ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowDownToLine, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpFromLine, { className: "size-4" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "truncate text-xs font-bold text-foreground",
								children: inBatchProgress ? `${Math.min(batchDone + 1, batchTotal)} of ${batchTotal} files` : active.length ? `${active.length} transfer${active.length !== 1 ? "s" : ""} in progress` : "All transfers finished"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "truncate font-mono text-[11px] text-muted-foreground",
								children: active.length ? `${Math.round(overall)}% · ${humanSpeed(speed)}` : `${jobs.length} in history`
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setCollapsed(!collapsed),
							className: "ios-btn grid size-8 place-items-center rounded-full bg-border/50 text-muted-foreground",
							"aria-label": collapsed ? "Expand transfers" : "Collapse transfers",
							children: collapsed ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronUp, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "size-4" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setHidden(true),
							className: "ios-btn grid size-8 place-items-center rounded-full bg-border/50 text-muted-foreground",
							"aria-label": "Dismiss transfers",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-1 bg-border",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-full bg-primary transition-all duration-300",
						style: { width: `${overall}%` }
					})
				}),
				!collapsed && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TransferJobList, { jobs })
			]
		})
	});
}
function TransferJobList({ jobs }) {
	const [expanded, setExpanded] = (0, import_react.useState)(false);
	const visible = expanded ? jobs.slice(0, 40) : jobs.slice(0, 6);
	const remaining = jobs.length - visible.length;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
		className: "max-h-64 divide-y divide-border/60 overflow-y-auto",
		children: [visible.map((j) => {
			const p = j.total ? Math.min(100, j.loaded / j.total * 100) : j.status === "done" ? 100 : 8;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "px-4 py-2.5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "min-w-0 flex-1 truncate text-xs text-foreground",
							children: j.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: `shrink-0 font-mono text-[10px] ${j.status === "error" ? "text-destructive" : j.status === "done" ? "text-primary" : "text-muted-foreground"}`,
							children: j.status === "error" ? "failed" : `${Math.round(p)}%`
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-1.5 h-1 overflow-hidden rounded-full bg-border",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: `h-full rounded-full transition-all ${j.status === "error" ? "bg-destructive" : "bg-primary"}`,
							style: { width: `${p}%` }
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 truncate font-mono text-[10px] text-muted-foreground",
						children: [
							humanSize(j.loaded),
							j.total ? ` / ${humanSize(j.total)}` : "",
							" ·",
							" ",
							j.status === "active" ? humanSpeed(j.bps) : j.status === "done" ? "finished" : j.note,
							j.note && j.status === "active" ? ` · ${j.note}` : ""
						]
					})
				]
			}, j.id);
		}), remaining > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
			className: "px-4 py-2",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				onClick: () => setExpanded(true),
				className: "w-full rounded-lg py-1.5 text-center font-mono text-[11px] text-primary hover:bg-cardhover",
				children: [
					"Show ",
					remaining,
					" more"
				]
			})
		})]
	});
}
function AIDeviceSelector({ devices, selectedDevices, onSelectionChange }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	const isAllSelected = selectedDevices.includes("all");
	const toggleDevice = (deviceId) => {
		if (isAllSelected) {
			onSelectionChange([deviceId]);
			return;
		}
		if (selectedDevices.includes(deviceId)) onSelectionChange(selectedDevices.filter((id) => id !== deviceId));
		else onSelectionChange([...selectedDevices, deviceId]);
	};
	const selectAll = () => {
		onSelectionChange(["all"]);
	};
	const onlineCount = devices.filter((d) => d.online).length;
	const totalCount = devices.length;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			onClick: () => setOpen(!open),
			className: "ios-btn flex items-center gap-2 rounded-xl border border-border bg-card/60 px-3 py-2 text-xs font-medium backdrop-blur hover:bg-cardhover",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MonitorSmartphone, { className: "size-4 text-primary" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAllSelected ? `All Devices (${totalCount})` : selectedDevices.length === 0 ? "Select Device" : selectedDevices.length === 1 ? devices.find((d) => d.id === selectedDevices[0])?.name || "1 Device" : `${selectedDevices.length} Devices` }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "size-3 text-muted-foreground" })
			]
		}), open && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "fixed inset-0 z-40",
			onClick: () => setOpen(false)
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "absolute left-0 top-full z-50 mt-2 w-72 rounded-2xl border border-border bg-card/95 p-3 shadow-2xl backdrop-blur-xl",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-2 flex items-center justify-between px-2 pb-2 border-b border-border/50 text-xs font-semibold text-muted-foreground",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Target Devices" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-[10px] text-primary",
						children: [
							onlineCount,
							"/",
							totalCount,
							" Online"
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: selectAll,
					className: `ios-btn flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-colors ${isAllSelected ? "bg-primary text-primary-foreground" : "hover:bg-cardhover text-foreground"}`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Laptop, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "All Devices" })]
					}), isAllSelected && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-4" })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "my-2 border-t border-border/30" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "max-h-60 space-y-1 overflow-y-auto no-scrollbar",
					children: devices.map((device) => {
						const isSelected = !isAllSelected && selectedDevices.includes(device.id);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => toggleDevice(device.id),
							className: `ios-btn flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs transition-colors ${isSelected ? "bg-primary/20 text-primary border border-primary/30" : "hover:bg-cardhover text-foreground"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2 min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `size-2 rounded-full shrink-0 ${device.online ? "bg-green-500" : "bg-muted-foreground/40"}` }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-col items-start truncate",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "truncate font-medium",
										children: device.name
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-[10px] text-muted-foreground",
										children: [
											device.online ? "Online" : "Offline",
											" · ",
											device.osInfo || "PC"
										]
									})]
								})]
							}), isSelected && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-4 shrink-0 text-primary" })]
						}, device.id);
					})
				})
			]
		})] })]
	});
}
var state = {
	chatId: null,
	resetNonce: 0,
	recent: [],
	loading: false
};
var listeners = /* @__PURE__ */ new Set();
function set(patch) {
	state = {
		...state,
		...patch
	};
	listeners.forEach((l) => l());
}
function useAIChatStore() {
	return (0, import_react.useSyncExternalStore)((cb) => {
		listeners.add(cb);
		return () => listeners.delete(cb);
	}, () => state, () => state);
}
var aiChatStore = {
	get: () => state,
	openChat: (chatId) => set({ chatId }),
	/** Used by AIChat after the first save gives a new chat its id (no reload). */
	adopt: (chatId) => set({ chatId }),
	newChat: () => set({
		chatId: null,
		resetNonce: state.resetNonce + 1
	}),
	async refresh(session) {
		set({ loading: true });
		try {
			set({
				recent: await chatList(session),
				loading: false
			});
		} catch {
			set({ loading: false });
		}
	},
	async remove(session, chatId) {
		await chatDelete(session, chatId);
		if (state.chatId === chatId) set({
			chatId: null,
			resetNonce: state.resetNonce + 1
		});
		await aiChatStore.refresh(session);
	}
};
function AIExecutionCard({ step, onConfirm }) {
	const [expanded, setExpanded] = (0, import_react.useState)(false);
	const getStatusIcon = () => {
		switch (step.status) {
			case "running": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin text-primary" });
			case "success": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "size-4 text-green-500" });
			case "error": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleX, { className: "size-4 text-destructive" });
			case "needs_confirmation": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "size-4 text-amber-500" });
			default: return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "size-4 text-muted-foreground" });
		}
	};
	const getTypeIcon = () => {
		switch (step.type) {
			case "command": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Terminal, { className: "size-3.5 text-primary" });
			case "file_read":
			case "file_write": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileCode, { className: "size-3.5 text-blue-400" });
			case "artifact_generation": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "size-3.5 text-purple-400" });
			default: return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CodeXml, { className: "size-3.5 text-muted-foreground" });
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-xl border border-border bg-card/60 overflow-hidden shadow-sm backdrop-blur",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			onClick: () => setExpanded(!expanded),
			className: "flex w-full items-center justify-between p-3 text-left hover:bg-cardhover/50 transition-colors",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2.5 min-w-0",
				children: [getStatusIcon(), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-1.5 min-w-0",
					children: [getTypeIcon(), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xs font-medium truncate",
						children: step.title
					})]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2 shrink-0",
				children: [step.device_name && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-mono text-primary",
					children: step.device_name
				}), expanded ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "size-4 text-muted-foreground" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-4 text-muted-foreground" })]
			})]
		}), expanded && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "border-t border-border/50 p-3 space-y-3 bg-background/40",
			children: [
				step.command && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground",
						children: "Command"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
						className: "rounded-lg border border-border bg-card p-2.5 font-mono text-xs text-primary overflow-x-auto",
						children: step.command
					})]
				}),
				step.diff && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground",
						children: "File Changes (Diff)"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
						className: "rounded-lg border border-border bg-card p-2.5 font-mono text-xs overflow-x-auto text-muted-foreground",
						children: step.diff
					})]
				}),
				step.output && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground",
						children: "Output"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
						className: "max-h-48 rounded-lg border border-border bg-card p-2.5 font-mono text-xs overflow-y-auto no-scrollbar text-muted-foreground",
						children: step.output
					})]
				}),
				step.error && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[10px] font-semibold uppercase tracking-wider text-destructive",
						children: "Error"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
						className: "rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 font-mono text-xs text-destructive overflow-x-auto",
						children: step.error
					})]
				}),
				step.status === "needs_confirmation" && onConfirm && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2 pt-2 border-t border-border/50",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => onConfirm(true),
						className: "ios-btn flex-1 rounded-lg bg-primary py-1.5 text-xs font-semibold text-primary-foreground",
						children: "Yes, Proceed"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => onConfirm(false),
						className: "ios-btn flex-1 rounded-lg border border-border py-1.5 text-xs font-semibold hover:bg-cardhover",
						children: "No, Cancel"
					})]
				})
			]
		})]
	});
}
var EXT_ICON = [
	{
		test: /\.(png|jpe?g|gif|webp|svg|bmp|heic|avif|ico)$/i,
		icon: FileImage,
		tone: "text-accent"
	},
	{
		test: /\.(mp4|mov|mkv|avi|webm|m4v)$/i,
		icon: FilePlay,
		tone: "text-accent"
	},
	{
		test: /\.(mp3|wav|flac|ogg|m4a)$/i,
		icon: FileHeadphone,
		tone: "text-accent"
	},
	{
		test: /\.(zip|rar|7z|tar|gz|bz2|xz|apk|jar|iso)$/i,
		icon: FileArchive,
		tone: "text-warning"
	},
	{
		test: /\.(pdf|docx?|rtf|odt|txt|md|pages)$/i,
		icon: FileText,
		tone: "text-destructive"
	},
	{
		test: /\.(xlsx?|csv|numbers|ods|pptx?)$/i,
		icon: FileSpreadsheet,
		tone: "text-primary"
	},
	{
		test: /\.(tsx?|jsx?|mjs|cjs|json|html?|css|scss|py|rb|go|rs|java|cs|cpp|c|h|php|sh|ps1|bat|cmd|sql|ya?ml|toml|xml)$/i,
		icon: FileCodeCorner,
		tone: "text-primary"
	}
];
function iconForName(name, kind = "file") {
	if (kind === "folder") return {
		Icon: Folder,
		tone: "text-warning"
	};
	if (kind === "device") return {
		Icon: Laptop,
		tone: "text-primary"
	};
	const hit = EXT_ICON.find((e) => e.test.test(name));
	return {
		Icon: hit?.icon ?? File$1,
		tone: hit?.tone ?? "text-muted-foreground"
	};
}
function FileTypeIcon({ name, kind = "file", className = "size-5" }) {
	const { Icon, tone } = iconForName(name, kind);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: `${className} shrink-0 ${tone}` });
}
function AIRichResult({ payload, interactive, onAnswer }) {
	switch (payload.kind) {
		case "files": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilesCard, { p: payload });
		case "tasks": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TasksCard, { p: payload });
		case "image": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImageCard, { p: payload });
		case "choices": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChoicesCard, {
			p: payload,
			interactive,
			onAnswer
		});
		case "confirm": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConfirmCard, {
			p: payload,
			interactive,
			onAnswer
		});
		default: return null;
	}
}
function CardShell({ icon, title, subtitle, right, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "w-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2.5 border-b border-border/60 px-3.5 py-2.5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "grid size-7 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary",
					children: icon
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0 flex-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "truncate text-sm font-semibold leading-tight",
						children: title
					}), subtitle && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "truncate font-mono text-[11px] leading-tight text-muted-foreground",
						children: subtitle
					})]
				}),
				right
			]
		}), children]
	});
}
function FilesCard({ p }) {
	const [showAll, setShowAll] = (0, import_react.useState)(false);
	const LIMIT = 40;
	const rows = (0, import_react.useMemo)(() => [...p.folders.map((f) => ({
		...f,
		folder: true
	})), ...p.files.map((f) => ({
		...f,
		folder: false
	}))], [p.folders, p.files]);
	const visible = showAll ? rows : rows.slice(0, LIMIT);
	const dupNames = (0, import_react.useMemo)(() => {
		const seen = /* @__PURE__ */ new Map();
		for (const r of rows) seen.set(r.name.toLowerCase(), (seen.get(r.name.toLowerCase()) ?? 0) + 1);
		return new Set([...seen].filter(([, n]) => n > 1).map(([k]) => k));
	}, [rows]);
	const showPaths = p.mode === "search";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardShell, {
		icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Monitor, { className: "size-4" }),
		title: p.mode === "search" ? `Results for “${p.query ?? ""}”` : p.path || "/",
		subtitle: `${p.device} · ${p.folders.length} folder${p.folders.length === 1 ? "" : "s"}, ${p.files.length} file${p.files.length === 1 ? "" : "s"}`,
		children: [rows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "px-4 py-6 text-center text-xs text-muted-foreground",
			children: p.mode === "search" ? "Nothing matched." : "This folder is empty."
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "max-h-80 divide-y divide-border/40 overflow-y-auto no-scrollbar",
			children: visible.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "flex items-center gap-3 px-3.5 py-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileTypeIcon, {
						name: r.name,
						kind: r.folder ? "folder" : "file",
						className: "size-5"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "truncate text-sm",
							children: r.name
						}), (showPaths || dupNames.has(r.name.toLowerCase())) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "break-all font-mono text-[10px] leading-snug text-muted-foreground",
							children: r.path
						})]
					}),
					!r.folder && r.size !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "shrink-0 font-mono text-[11px] text-muted-foreground",
						children: humanSize(r.size ?? 0)
					})
				]
			}, r.path))
		}), (rows.length > LIMIT || p.truncated) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between border-t border-border/60 px-3.5 py-2 text-[11px] text-muted-foreground",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: p.truncated ? "Showing the first results only" : `${rows.length} items` }), rows.length > LIMIT && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: () => setShowAll((v) => !v),
				className: "font-semibold text-primary hover:underline",
				children: showAll ? "Show less" : `Show all ${rows.length}`
			})]
		})]
	});
}
var CATEGORY_ICON = {
	apps: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppWindow, { className: "size-3.5" }),
	browsers: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Globe, { className: "size-3.5" }),
	windows: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cog, { className: "size-3.5" }),
	background: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "size-3.5" })
};
function ProcIcon({ icon, label }) {
	if (icon) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
		src: icon,
		alt: "",
		className: "size-5 shrink-0 rounded object-contain"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "grid size-5 shrink-0 place-items-center rounded border border-border bg-cardhover text-[9px] font-bold uppercase text-muted-foreground",
		children: label.slice(0, 1)
	});
}
function Stat({ cpu, ram }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
		className: "w-14 px-2 py-1.5 text-right font-mono text-[11px] tabular-nums text-muted-foreground",
		children: cpu >= .1 ? `${cpu.toFixed(cpu >= 10 ? 0 : 1)}%` : "0%"
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
		className: "w-20 px-2 py-1.5 text-right font-mono text-[11px] tabular-nums",
		children: formatBytes(ram)
	})] });
}
function GroupRow({ g }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	const multi = g.count > 1;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
		className: `border-t border-border/30 ${multi ? "cursor-pointer hover:bg-cardhover/60" : ""}`,
		onClick: () => multi && setOpen((v) => !v),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
			className: "px-3 py-1.5",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex min-w-0 items-center gap-2",
				children: [
					multi ? open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "size-3 shrink-0 text-muted-foreground" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-3 shrink-0 text-muted-foreground" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-3 shrink-0" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProcIcon, {
						icon: g.icon,
						label: g.label
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "truncate text-xs font-medium",
							children: [g.label, multi && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "ml-1.5 font-mono text-[10px] font-normal text-muted-foreground",
								children: [
									"(",
									g.count,
									")"
								]
							})]
						}), g.windowTitle && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "truncate text-[10px] text-muted-foreground",
							children: g.windowTitle
						})]
					})
				]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
			cpu: g.cpu,
			ram: g.ram
		})]
	}), open && g.processes.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
		className: "bg-background/40",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
			className: "py-1 pl-12 pr-2",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "truncate font-mono text-[10px] text-muted-foreground",
				children: [
					p.role ? `${p.role} · ` : "",
					"PID ",
					p.pid
				]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
			cpu: p.cpu ?? 0,
			ram: p.ram ?? 0
		})]
	}, p.pid))] });
}
function BrowserRows({ p }) {
	const classified = (0, import_react.useMemo)(() => classifyProcesses(p.processes), [p.processes]);
	const [openApp, setOpenApp] = (0, import_react.useState)(/* @__PURE__ */ new Set());
	const toggle = (k) => setOpenApp((prev) => {
		const next = new Set(prev);
		if (next.has(k)) next.delete(k);
		else next.add(k);
		return next;
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: classified.browsers.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrowserApp, {
		b,
		open: openApp.has(b.key),
		onToggle: () => toggle(b.key)
	}, b.key)) });
}
function BrowserApp({ b, open, onToggle }) {
	const [openProfile, setOpenProfile] = (0, import_react.useState)(/* @__PURE__ */ new Set());
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
		className: "cursor-pointer border-t border-border/30 hover:bg-cardhover/60",
		onClick: onToggle,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
			className: "px-3 py-1.5",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex min-w-0 items-center gap-2",
				children: [
					open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "size-3 shrink-0 text-muted-foreground" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-3 shrink-0 text-muted-foreground" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProcIcon, {
						icon: b.icon,
						label: b.label
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "truncate text-xs font-medium",
						children: [b.label, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "ml-1.5 font-mono text-[10px] font-normal text-muted-foreground",
							children: [
								"(",
								b.profiles.length,
								" profile",
								b.profiles.length === 1 ? "" : "s",
								" · ",
								b.count,
								")"
							]
						})]
					})
				]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
			cpu: b.cpu,
			ram: b.ram
		})]
	}), open && b.profiles.map((prof) => {
		const pOpen = openProfile.has(prof.key);
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProfileRows, {
			prof,
			open: pOpen,
			onToggle: () => setOpenProfile((prev) => {
				const next = new Set(prev);
				if (next.has(prof.key)) next.delete(prof.key);
				else next.add(prof.key);
				return next;
			})
		}, prof.key);
	})] });
}
function ProfileRows({ prof, open, onToggle }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
		className: "cursor-pointer bg-background/40 hover:bg-cardhover/60",
		onClick: onToggle,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
			className: "py-1.5 pl-8 pr-2",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex min-w-0 items-center gap-2",
				children: [
					open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "size-3 shrink-0 text-muted-foreground" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-3 shrink-0 text-muted-foreground" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "size-3.5 shrink-0 text-muted-foreground" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "truncate text-xs",
							children: [
								"Profile: ",
								prof.name,
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "ml-1.5 font-mono text-[10px] text-muted-foreground",
									children: [
										"(",
										prof.count,
										")"
									]
								})
							]
						}), prof.windowTitle && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "truncate text-[10px] text-muted-foreground",
							children: prof.windowTitle
						})]
					})
				]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
			cpu: prof.cpu,
			ram: prof.ram
		})]
	}), open && prof.processes.map((proc) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
		className: "bg-background/60",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
			className: "py-1 pl-16 pr-2",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "truncate font-mono text-[10px] text-muted-foreground",
				children: [
					proc.role ? `${proc.role} · ` : "",
					"PID ",
					proc.pid
				]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
			cpu: proc.cpu ?? 0,
			ram: proc.ram ?? 0
		})]
	}, proc.pid))] });
}
function TasksCard({ p }) {
	const classified = (0, import_react.useMemo)(() => classifyProcesses(p.processes), [p.processes]);
	const sections = [
		{
			key: "apps",
			count: classified.apps.length
		},
		{
			key: "browsers",
			count: classified.browsers.length
		},
		{
			key: "windows",
			count: classified.windows.length
		},
		{
			key: "background",
			count: classified.background.length
		}
	];
	const [collapsed, setCollapsed] = (0, import_react.useState)(/* @__PURE__ */ new Set(["windows", "background"]));
	const toggle = (k) => setCollapsed((prev) => {
		const next = new Set(prev);
		if (next.has(k)) next.delete(k);
		else next.add(k);
		return next;
	});
	const totalRam = p.processes.reduce((s, x) => s + (x.ram ?? 0), 0);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardShell, {
		icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppWindow, { className: "size-4" }),
		title: "Running tasks",
		subtitle: `${p.device} · ${classified.total} processes · ${formatBytes(totalRam)} used`,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "max-h-[26rem] overflow-y-auto no-scrollbar",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "w-full table-fixed border-collapse text-left",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
					className: "sticky top-0 z-10 bg-card",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "text-[10px] uppercase tracking-wider text-muted-foreground",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-3 py-1.5 font-semibold",
								children: "Name"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "w-14 px-2 py-1.5 text-right font-semibold",
								children: "CPU"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "w-20 px-2 py-1.5 text-right font-semibold",
								children: "Memory"
							})
						]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: sections.map(({ key, count }) => {
					if (count === 0) return null;
					const isCollapsed = collapsed.has(key);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionRows, {
						category: key,
						count,
						collapsed: isCollapsed,
						onToggle: () => toggle(key),
						children: !isCollapsed && (key === "browsers" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrowserRows, { p }) : classified[key].map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GroupRow, { g }, g.key)))
					}, key);
				}) })]
			})
		})
	});
}
function SectionRows({ category, count, collapsed, onToggle, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
		className: "cursor-pointer bg-cardhover/50 hover:bg-cardhover",
		onClick: onToggle,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
			colSpan: 3,
			className: "px-3 py-1.5",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground",
				children: [
					collapsed ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-3" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "size-3" }),
					CATEGORY_ICON[category],
					CATEGORY_LABELS[category],
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "font-mono font-normal",
						children: [
							"(",
							count,
							")"
						]
					})
				]
			})
		})
	}), children] });
}
function ImageCard({ p }) {
	const [full, setFull] = (0, import_react.useState)(false);
	const time = p.takenAt ? new Date(p.takenAt).toLocaleTimeString() : "";
	const ext = p.mime.includes("png") ? "png" : "jpg";
	if (!p.src) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardShell, {
		icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image, { className: "size-4" }),
		title: p.caption,
		subtitle: time,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "px-4 py-6 text-center text-xs text-muted-foreground",
			children: "Screenshots aren’t kept in saved chats. Ask again to capture a new one."
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardShell, {
		icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image, { className: "size-4" }),
		title: p.caption,
		subtitle: time,
		right: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-1",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
				href: p.src,
				download: `screenshot-${p.device.replace(/\W+/g, "_")}-${p.takenAt ?? Date.now()}.${ext}`,
				"aria-label": "Download screenshot",
				className: "ios-btn grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-cardhover hover:text-foreground",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-4" })
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: () => setFull(true),
				"aria-label": "View full screen",
				className: "ios-btn grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-cardhover hover:text-foreground",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Maximize2, { className: "size-4" })
			})]
		}),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			onClick: () => setFull(true),
			className: "block w-full bg-black",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: p.src,
				alt: p.caption,
				className: "mx-auto max-h-80 w-full object-contain"
			})
		})
	}), full && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed inset-0 z-[90] flex flex-col bg-black/95",
		onClick: () => setFull(false),
		role: "dialog",
		"aria-label": p.caption,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between gap-3 p-3 text-white",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "truncate text-sm font-medium",
				children: p.caption
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
					href: p.src,
					download: `screenshot-${Date.now()}.${ext}`,
					onClick: (e) => e.stopPropagation(),
					className: "ios-btn flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/20",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "size-3.5" }), " Save"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => setFull(false),
					"aria-label": "Close",
					className: "ios-btn grid size-8 place-items-center rounded-lg bg-white/10 hover:bg-white/20",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
				})]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex min-h-0 flex-1 items-center justify-center overflow-auto p-2",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: p.src,
				alt: p.caption,
				onClick: (e) => e.stopPropagation(),
				className: "max-h-full max-w-full object-contain"
			})
		})]
	})] });
}
function ChoicesCard({ p, interactive, onAnswer }) {
	const [picked, setPicked] = (0, import_react.useState)(/* @__PURE__ */ new Set());
	const [other, setOther] = (0, import_react.useState)("");
	const done = !interactive;
	function toggle(o) {
		if (done) return;
		setPicked((prev) => {
			const next = new Set(prev);
			if (p.multi) {
				if (next.has(o.id)) next.delete(o.id);
				else next.add(o.id);
			} else {
				next.clear();
				next.add(o.id);
			}
			return next;
		});
	}
	function submit() {
		const text = [...p.options.filter((o) => picked.has(o.id)).map((o) => o.value), ...other.trim() ? [other.trim()] : []].join("\n");
		if (text) onAnswer(text);
	}
	const canSubmit = picked.size > 0 || other.trim().length > 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `w-full overflow-hidden rounded-2xl border bg-card shadow-sm ${done ? "border-border/60 opacity-70" : "border-primary/40"}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "border-b border-border/60 px-3.5 py-2.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm font-semibold",
					children: p.question
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[11px] text-muted-foreground",
					children: done ? "Answered" : p.multi ? "Pick one or more" : "Pick one"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "max-h-80 divide-y divide-border/40 overflow-y-auto no-scrollbar",
				children: p.options.map((o) => {
					const on = picked.has(o.id);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						disabled: done,
						onClick: () => toggle(o),
						className: `flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors ${on ? "bg-primary/10" : done ? "" : "hover:bg-cardhover/60"}`,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileTypeIcon, {
								name: o.label,
								kind: o.kind ?? "file",
								className: "size-5"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block truncate text-sm font-medium",
									children: o.label
								}), o.description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block break-all font-mono text-[10px] leading-snug text-muted-foreground",
									children: o.description
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: `grid size-5 shrink-0 place-items-center border ${p.multi ? "rounded-md" : "rounded-full"} ${on ? "border-primary bg-primary text-primary-foreground" : "border-border"}`,
								children: on && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-3" })
							})
						]
					}) }, o.id);
				})
			}),
			!done && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-2 border-t border-border/60 p-3",
				children: [p.allowOther && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: other,
					onChange: (e) => setOther(e.target.value),
					placeholder: "Something else…",
					className: "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: submit,
					disabled: !canSubmit,
					className: "ios-btn w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-40",
					children: "Continue"
				})]
			})
		]
	});
}
var RISK_STYLE = {
	safe: "border-accent/40 bg-accent/5",
	low: "border-primary/40 bg-primary/5",
	medium: "border-warning/50 bg-warning/5",
	high: "border-destructive/50 bg-destructive/5",
	critical: "border-destructive bg-destructive/10"
};
function ConfirmCard({ p, interactive, onAnswer }) {
	const details = p.details ? Object.entries(p.details) : [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `w-full overflow-hidden rounded-2xl border shadow-sm ${RISK_STYLE[p.risk] ?? RISK_STYLE.medium} ${interactive ? "" : "opacity-70"}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start gap-3 px-3.5 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldAlert, { className: `mt-0.5 size-5 shrink-0 ${p.risk === "high" || p.risk === "critical" ? "text-destructive" : "text-warning"}` }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0 flex-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-semibold",
						children: p.question
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-[11px] uppercase tracking-wide text-muted-foreground",
						children: [p.risk, " risk · needs your approval"]
					})]
				})]
			}),
			details.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dl", {
				className: "space-y-1 border-t border-border/50 px-3.5 py-2.5",
				children: details.map(([k, v]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2 text-xs",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
						className: "w-16 shrink-0 text-muted-foreground",
						children: k
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
						className: "min-w-0 flex-1 break-all font-mono",
						children: v
					})]
				}, k))
			}),
			interactive ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2 border-t border-border/50 p-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => onAnswer(`${APPROVAL_PREFIX} — go ahead: ${p.question}`),
					className: "ios-btn flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground",
					children: "Approve"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => onAnswer(`${CANCEL_PREFIX} — do not do that.`),
					className: "ios-btn flex-1 rounded-xl border border-border bg-card py-2.5 text-sm font-semibold hover:bg-cardhover",
					children: "Cancel"
				})]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "border-t border-border/50 px-3.5 py-2 text-[11px] text-muted-foreground",
				children: "Answered"
			})
		]
	});
}
var SUGGESTIONS = [
	"Show running tasks on my PC",
	"Take a screenshot of my device",
	"List the files in my Downloads folder",
	"Find a file called report and show where it is"
];
function makeMsg(role, content, ui) {
	return {
		id: crypto.randomUUID(),
		task_id: "",
		role,
		content,
		tool_name: null,
		tool_call: null,
		created_at: (/* @__PURE__ */ new Date()).toISOString(),
		...ui && ui.length ? { ui } : {}
	};
}
/** Reads an SSE response body and calls onEvent for each complete event. */
async function readSSE(res, onEvent, signal) {
	const reader = res.body?.getReader();
	if (!reader) throw new Error("No response stream");
	const decoder = new TextDecoder();
	let buf = "";
	while (!signal.aborted) {
		const { value, done } = await reader.read();
		if (done) break;
		buf += decoder.decode(value, { stream: true });
		let idx;
		while ((idx = buf.indexOf("\n\n")) !== -1) {
			const block = buf.slice(0, idx);
			buf = buf.slice(idx + 2);
			let event = "message";
			const dataLines = [];
			for (const line of block.split("\n")) if (line.startsWith("event:")) event = line.slice(6).trim();
			else if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart());
			if (!dataLines.length) continue;
			try {
				onEvent(event, JSON.parse(dataLines.join("\n")));
			} catch {}
		}
	}
}
function AIChat({ session, selectedDevices }) {
	const store = useAIChatStore();
	const [messages, setMessages] = (0, import_react.useState)([]);
	const [input, setInput] = (0, import_react.useState)("");
	const [activity, setActivity] = (0, import_react.useState)("idle");
	const [thinkingText, setThinkingText] = (0, import_react.useState)("");
	const [steps, setSteps] = (0, import_react.useState)([]);
	const [liveUi, setLiveUi] = (0, import_react.useState)([]);
	const [streaming, setStreaming] = (0, import_react.useState)("");
	const [error, setError] = (0, import_react.useState)("");
	const endRef = (0, import_react.useRef)(null);
	const abortRef = (0, import_react.useRef)(null);
	const messagesRef = (0, import_react.useRef)([]);
	const chatIdRef = (0, import_react.useRef)(null);
	messagesRef.current = messages;
	const busy = activity !== "idle";
	(0, import_react.useEffect)(() => {
		endRef.current?.scrollIntoView({
			behavior: "smooth",
			block: "end"
		});
	}, [
		messages,
		steps,
		liveUi,
		streaming,
		thinkingText
	]);
	(0, import_react.useEffect)(() => {
		aiChatStore.refresh(session);
	}, [session]);
	(0, import_react.useEffect)(() => {
		if (store.chatId === chatIdRef.current) return;
		abortRef.current?.abort();
		chatIdRef.current = store.chatId;
		setSteps([]);
		setLiveUi([]);
		setStreaming("");
		setActivity("idle");
		setThinkingText("");
		setError("");
		if (!store.chatId) {
			setMessages([]);
			return;
		}
		let cancelled = false;
		chatGet(session, store.chatId).then((c) => !cancelled && setMessages(c.messages)).catch(() => !cancelled && setError("Couldn't open that chat."));
		return () => {
			cancelled = true;
		};
	}, [store.chatId, session]);
	const nonceRef = (0, import_react.useRef)(store.resetNonce);
	(0, import_react.useEffect)(() => {
		if (nonceRef.current === store.resetNonce) return;
		nonceRef.current = store.resetNonce;
		abortRef.current?.abort();
		setMessages([]);
		setSteps([]);
		setLiveUi([]);
		setStreaming("");
		setActivity("idle");
		setError("");
		chatIdRef.current = null;
	}, [store.resetNonce]);
	const persist = (0, import_react.useCallback)(async (all) => {
		const title = (all.find((m) => m.role === "user")?.content ?? "New chat").replace(/\s+/g, " ").slice(0, 80);
		try {
			const id = await chatSave(session, chatIdRef.current, title, all);
			if (id !== chatIdRef.current) {
				chatIdRef.current = id;
				aiChatStore.adopt(id);
			}
			aiChatStore.refresh(session);
		} catch {}
	}, [session]);
	const send = (0, import_react.useCallback)(async (text) => {
		const message = text.trim();
		if (!message || activity !== "idle") return;
		setInput("");
		setSteps([]);
		setLiveUi([]);
		setStreaming("");
		setError("");
		const history = messagesRef.current;
		const userMsg = makeMsg("user", message);
		const withUser = [...history, userMsg];
		setMessages(withUser);
		setActivity("thinking");
		setThinkingText("Understanding your request…");
		const ctrl = new AbortController();
		abortRef.current = ctrl;
		let currentStep = null;
		let finished = false;
		const patchStep = (id, patch) => {
			if (!id) return;
			setSteps((prev) => prev.map((s) => s.id === id ? patch(s) : s));
		};
		try {
			const res = await fetch("/api/ai-stream", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				signal: ctrl.signal,
				body: JSON.stringify({
					message,
					deviceId: session.deviceId,
					deviceToken: session.deviceToken,
					selectedDevices,
					conversationHistory: history
				})
			});
			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				throw new Error(body.error || `Request failed (${res.status})`);
			}
			await readSSE(res, (event, raw) => {
				const d = raw;
				switch (event) {
					case "thinking":
						setActivity("thinking");
						setThinkingText(d.message || "Thinking…");
						break;
					case "tool_start": {
						const id = crypto.randomUUID();
						currentStep = id;
						setActivity("executing");
						setThinkingText(`Running ${d.tool}…`);
						setSteps((prev) => [...prev, {
							id,
							task_id: "",
							device_id: null,
							device_name: d.input?.device ? String(d.input.device) : null,
							type: "command",
							title: d.tool,
							status: "running",
							command: JSON.stringify(d.input, null, 2),
							working_directory: null,
							input: d.input,
							output: "",
							error: null,
							diff: null,
							risk_level: "medium",
							started_at: d.timestamp,
							completed_at: null
						}]);
						break;
					}
					case "tool_chunk":
						patchStep(currentStep, (s) => ({
							...s,
							output: (s.output || "") + d.chunk
						}));
						break;
					case "tool_progress":
						setThinkingText(d.status);
						break;
					case "tool_ui":
						setLiveUi((prev) => [...prev, d.ui]);
						break;
					case "tool_result":
						patchStep(currentStep, (s) => ({
							...s,
							status: "success",
							output: s.output || d.result,
							completed_at: d.timestamp
						}));
						currentStep = null;
						break;
					case "tool_error":
						patchStep(currentStep, (s) => ({
							...s,
							status: "error",
							error: d.error,
							completed_at: d.timestamp
						}));
						currentStep = null;
						break;
					case "complete": {
						finished = true;
						const known = new Set(withUser.map((m) => m.id));
						const fresh = (d.messages ?? []).filter((m) => m.role === "assistant" && !known.has(m.id));
						const last = fresh[fresh.length - 1];
						const finalMsgs = [...withUser, ...fresh];
						const finish = () => {
							setMessages(finalMsgs);
							setStreaming("");
							setLiveUi([]);
							setSteps([]);
							setActivity("idle");
							setThinkingText("");
							persist(finalMsgs);
						};
						if (last?.content) {
							setActivity("streaming");
							setThinkingText("");
							const parts = last.content.split(/(\s+)/);
							let acc = "";
							let i = 0;
							const tick = () => {
								if (ctrl.signal.aborted) return finish();
								for (let n = 0; n < 6 && i < parts.length; n++, i++) acc += parts[i];
								setStreaming(acc);
								if (i < parts.length) setTimeout(tick, 18);
								else finish();
							};
							tick();
						} else finish();
						break;
					}
					case "error":
						finished = true;
						throw new Error(d.message || "An error occurred");
				}
			}, ctrl.signal);
			if (!finished && !ctrl.signal.aborted) throw new Error("Connection lost before the answer finished.");
		} catch (e) {
			if (e?.name === "AbortError" || ctrl.signal.aborted) {
				setActivity("idle");
				setThinkingText("");
				return;
			}
			const msg = e instanceof Error ? e.message : "Something went wrong";
			setActivity("idle");
			setThinkingText("");
			setLiveUi([]);
			setMessages((prev) => [...prev, makeMsg("assistant", `❌ ${msg}`)]);
		}
	}, [
		activity,
		persist,
		selectedDevices,
		session
	]);
	const stop = () => {
		abortRef.current?.abort();
		setActivity("idle");
		setThinkingText("");
		setStreaming("");
	};
	const lastIdx = messages.length - 1;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-full flex-col bg-background",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "no-scrollbar flex-1 space-y-3 overflow-y-auto p-3 sm:p-4",
			children: [
				messages.length === 0 && !busy && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex h-full flex-col items-center justify-center text-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "mb-4 size-12 text-primary/40" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "mb-1 text-base font-semibold",
							children: "How can I help?"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mb-5 max-w-sm text-xs text-muted-foreground",
							children: "I can answer questions, search the web and work on your connected devices. If I’m not sure which file or device you mean, I’ll ask."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid w-full max-w-md gap-2",
							children: SUGGESTIONS.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setInput(s),
								className: "ios-btn rounded-xl border border-border bg-card/60 px-4 py-2.5 text-left text-xs transition-all hover:border-primary/50 hover:bg-card/80",
								children: s
							}, s))
						})
					]
				}),
				error && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, { className: "size-4 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: error })]
				}),
				messages.map((msg, i) => {
					if (msg.role === "tool") return null;
					const isUser = msg.role === "user";
					const cards = msg.ui ?? [];
					const answerable = i === lastIdx && !busy;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: `flex flex-col gap-2 ${isUser ? "items-end" : "items-start"}`,
						children: [msg.content && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: isUser ? "max-w-[88%] whitespace-pre-wrap break-words rounded-2xl rounded-tr-sm bg-primary px-3.5 py-2.5 text-sm text-primary-foreground" : "max-w-[92%] whitespace-pre-wrap break-words rounded-2xl rounded-tl-sm border border-border bg-card px-3.5 py-2.5 text-sm",
							children: msg.content
						}), cards.map((c, ci) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "w-full max-w-xl",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AIRichResult, {
								payload: c,
								interactive: answerable && isQuestionPayload(c),
								onAnswer: (t) => void send(t)
							})
						}, ci))]
					}, msg.id);
				}),
				steps.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AIExecutionCard, { step: s }, s.id)),
				liveUi.map((c, ci) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "w-full max-w-xl",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AIRichResult, {
						payload: c,
						interactive: false,
						onAnswer: () => {}
					})
				}, `live-${ci}`)),
				busy && thinkingText && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2 px-1 text-xs text-muted-foreground",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-3.5 animate-spin" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: thinkingText })]
				}),
				streaming && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex justify-start",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "max-w-[92%] whitespace-pre-wrap break-words rounded-2xl rounded-tl-sm border border-border bg-card px-3.5 py-2.5 text-sm",
						children: streaming
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref: endRef })
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "border-t border-border bg-background p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-end gap-2 rounded-2xl border border-border bg-card px-3 py-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
					value: input,
					onChange: (e) => setInput(e.target.value),
					onKeyDown: (e) => {
						if (e.key === "Enter" && !e.shiftKey) {
							e.preventDefault();
							send(input);
						}
					},
					placeholder: "Message FileLink AI…",
					className: "max-h-32 flex-1 resize-none bg-transparent py-1 text-sm placeholder:text-muted-foreground focus:outline-none",
					rows: 1,
					disabled: busy
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => busy ? stop() : void send(input),
					disabled: !busy && !input.trim(),
					"aria-label": busy ? "Stop" : "Send",
					className: "ios-btn flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-40",
					children: [busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Square, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "hidden sm:inline",
						children: busy ? "Stop" : "Send"
					})]
				})]
			})
		})]
	});
}
function AITab({ session, devices }) {
	const [selectedDevices, setSelectedDevices] = (0, import_react.useState)([]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-lg",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex shrink-0 items-center justify-between border-b border-border/50 p-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-sm font-semibold text-foreground",
				children: "AI Assistant"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[10px] text-muted-foreground",
				children: "Powered by Claude"
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AIDeviceSelector, {
				devices,
				selectedDevices,
				onSelectionChange: setSelectedDevices
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "min-h-0 flex-1 overflow-hidden",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AIChat, {
				session,
				devices,
				selectedDevices
			})
		})]
	});
}
function RecentChats({ session, onPicked, limit = 20 }) {
	const { recent, chatId, loading } = useAIChatStore();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-1",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				onClick: () => {
					aiChatStore.newChat();
					onPicked?.();
				},
				className: "ios-btn flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-foreground hover:bg-cardhover",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "grid size-6 place-items-center rounded-full bg-primary text-primary-foreground",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-3.5" })
				}), "New chat"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
				children: "Recents"
			}),
			recent.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "px-4 py-2 text-xs text-muted-foreground",
				children: loading ? "Loading…" : "No chats yet — your conversations will show up here."
			}),
			recent.slice(0, limit).map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: `group flex items-center rounded-xl ${chatId === c.id ? "bg-cardhover" : "hover:bg-cardhover/70"}`,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => {
						aiChatStore.openChat(c.id);
						onPicked?.();
					},
					className: "flex min-w-0 flex-1 items-center gap-3 px-4 py-2 text-left",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageSquare, { className: "size-3.5 shrink-0 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "truncate text-sm",
						children: c.title || "Untitled chat"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => {
						if (window.confirm("Delete this chat?")) aiChatStore.remove(session, c.id);
					},
					"aria-label": "Delete chat",
					className: "mr-2 grid size-7 shrink-0 place-items-center rounded-lg text-muted-foreground opacity-100 hover:text-destructive md:opacity-0 md:group-hover:opacity-100",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3.5" })
				})]
			}, c.id))
		]
	});
}
function MobileDrawer({ open, onClose, items, active, onSelect, session, user, onAddDevice, onPlan, onExit }) {
	const inAI = active === "ai";
	const [moreOpen, setMoreOpen] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (!open) setMoreOpen(false);
	}, [open]);
	(0, import_react.useEffect)(() => {
		if (!open) return;
		const prev = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = prev;
		};
	}, [open]);
	const pick = (k) => {
		onSelect(k);
		onClose();
	};
	const row = (it) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		onClick: () => pick(it.key),
		className: `ios-btn flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${active === it.key ? "bg-primary/15 text-primary" : "text-foreground hover:bg-cardhover"}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(it.Icon, { className: "size-[18px]" }),
			it.label,
			!!it.badge && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "ml-auto rounded-full bg-primary/20 px-2 py-0.5 font-mono text-[10px] text-primary",
				children: it.badge
			})
		]
	}, it.key);
	const initial = (user.username || "?").slice(0, 1).toUpperCase();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `fixed inset-0 z-50 md:hidden ${open ? "" : "pointer-events-none"}`,
		"aria-hidden": !open,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			onClick: onClose,
			className: `absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
			role: "dialog",
			"aria-label": "Menu",
			className: `absolute inset-y-0 left-0 flex w-[84%] max-w-sm flex-col border-r border-border bg-card pt-[env(safe-area-inset-top)] shadow-2xl transition-transform duration-250 ease-out ${open ? "translate-x-0" : "-translate-x-full"}`,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex shrink-0 items-center gap-3 px-4 py-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid size-8 place-items-center rounded-lg border border-primary/30 bg-primary/20 text-primary",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SendHorizontal, { className: "size-4" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "flex-1 text-lg font-bold tracking-tight",
							children: "FileLink"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: onClose,
							"aria-label": "Close menu",
							className: "ios-btn grid size-9 place-items-center rounded-xl text-muted-foreground hover:bg-cardhover",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-5" })
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
					className: "no-scrollbar min-h-0 flex-1 space-y-1 overflow-y-auto px-2 pb-3",
					children: inAI ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RecentChats, {
							session,
							onPicked: onClose
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "my-2 border-t border-border/60" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => setMoreOpen((v) => !v),
							"aria-expanded": moreOpen,
							className: "ios-btn flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-cardhover",
							children: ["Sections", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: `size-4 transition-transform duration-200 ${moreOpen ? "rotate-180" : ""}` })]
						}),
						moreOpen && items.map(row)
					] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [items.map(row), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => {
							onAddDevice();
							onClose();
						},
						className: "ios-btn flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-cardhover",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MonitorSmartphone, { className: "size-[18px]" }), " Add PC Target"]
					})] })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "shrink-0 space-y-2 border-t border-border/60 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => {
							onPlan();
							onClose();
						},
						className: "ios-btn flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-cardhover",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "grid size-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground",
							children: initial
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block truncate text-sm font-semibold",
								children: user.username
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "flex items-center gap-1 text-[11px] text-muted-foreground",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Crown, { className: "size-3 text-primary" }),
									" ",
									user.tierLabel,
									" plan"
								]
							})]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: onExit,
						className: "ios-btn flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/50 py-2 text-xs font-semibold text-destructive",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "size-4" }), " Exit room"]
					})]
				})
			]
		})]
	});
}
function AccountLogin({ onLoggedIn }) {
	const [mode, setMode] = (0, import_react.useState)("login");
	const [username, setUsername] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	async function submit() {
		if (!username.trim() || !password) return;
		setBusy(true);
		setError(null);
		try {
			const user = mode === "login" ? await userLogin(username.trim(), password) : await signup(username.trim(), password);
			saveUserSession(user);
			onLoggedIn(user, mode === "signup");
		} catch (e) {
			setError(e.message);
		}
		setBusy(false);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background p-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-sm rounded-[28px] border border-border bg-card p-7 shadow-2xl",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-6 text-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "text-xl font-bold text-foreground",
						children: "FileLink"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-xs text-muted-foreground",
						children: mode === "login" ? "Log in to continue" : "Create an account"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mb-1 block text-[11px] uppercase tracking-wider text-muted-foreground",
							children: "Username"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: username,
								onChange: (e) => setUsername(e.target.value),
								onKeyDown: (e) => e.key === "Enter" && void submit(),
								placeholder: "yourname",
								className: "w-full rounded-xl border border-border bg-cardhover py-2.5 pl-10 pr-3 text-sm text-foreground outline-none focus:border-primary"
							})]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mb-1 block text-[11px] uppercase tracking-wider text-muted-foreground",
							children: "Password"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "password",
								value: password,
								onChange: (e) => setPassword(e.target.value),
								onKeyDown: (e) => e.key === "Enter" && void submit(),
								placeholder: "••••••••",
								className: "w-full rounded-xl border border-border bg-cardhover py-2.5 pl-10 pr-3 text-sm text-foreground outline-none focus:border-primary"
							})]
						})]
					})]
				}),
				error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-xs text-destructive",
					children: error
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					disabled: busy || !username.trim() || !password,
					onClick: () => void submit(),
					className: "ios-btn mt-5 w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-40",
					children: busy ? "…" : mode === "login" ? "Log in" : "Create account"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => {
						setMode(mode === "login" ? "signup" : "login");
						setError(null);
					},
					className: "mt-4 w-full text-center text-xs text-muted-foreground hover:text-primary",
					children: mode === "login" ? "No account yet? Create one" : "Already have an account? Log in"
				})
			]
		})
	});
}
var PLANS = {
	free: {
		name: "Free",
		icon: Zap,
		price: 0,
		tagline: "Get started with the basics",
		features: [
			{
				title: "3 rooms",
				note: "30 devices per room"
			},
			{
				title: "1 GB storage per room",
				note: "500 MB limit per file"
			},
			{
				title: "Task List",
				note: "Preview tasks only"
			},
			{
				title: "Device Browsing",
				note: "View only (edit freely in room)"
			},
			{
				title: "Control Center",
				note: "Agent, Copy/Paste only"
			},
			{
				title: "Terminal Access",
				note: "CMD only, non-admin"
			}
		],
		footnote: "Free rooms are paused after 1 week of inactivity. Limit of 3 active rooms."
	},
	pro: {
		name: "Pro",
		icon: Star,
		price: 8,
		tagline: "For everyday remote work",
		badge: "Most popular",
		features: [
			{
				title: "30 rooms",
				note: "100 devices per room"
			},
			{
				title: "50 GB storage per room",
				note: "5 GB limit per file"
			},
			{
				title: "Task Manager",
				note: "Preview & end tasks with sub-items"
			},
			{
				title: "Full Device Browsing",
				note: "preview, list by tree, copy, send, bundle"
			},
			{
				title: "Control Center",
				note: "Power, Agent, Copy/Paste (daily clipboard history log), Open file/link"
			},
			{
				title: "Terminal Access",
				note: "Admin mode, CMD only"
			},
			{
				title: "Display Hub",
				note: "Screenshot/camera preview only"
			},
			{
				title: "Audit Trail",
				note: "View only, last 7 days"
			}
		]
	},
	extended: {
		name: "Extended",
		icon: Crown,
		price: 25,
		tagline: "Full control, nothing held back",
		badge: "Best value",
		features: [
			{
				title: "Unlimited rooms",
				note: "Unlimited devices per room"
			},
			{
				title: "500 GB storage per room (scalable)",
				note: "20 GB limit per file"
			},
			{
				title: "Advanced Task Manager",
				note: "App icons, profile/tab UI automation, target sub-items"
			},
			{
				title: "Full Screen Device Browsing",
				note: "copy, send, bundle, delete, cut, rename"
			},
			{
				title: "All Control Center",
				note: "Power (with schedule time), Agent, Copy/Paste, Open file/link, Alert"
			},
			{
				title: "Terminal Access",
				note: "Admin mode + shell switcher (CMD/PowerShell/Node/Python)"
			},
			{
				title: "Full Display Hub",
				note: "Screenshot, screen/camera recording, save to cloud"
			},
			{
				title: "Full Audit Trail",
				note: "Full history + CSV/JSON export"
			}
		]
	}
};
var DURATIONS = [
	{
		months: 1,
		label: "1 month",
		discount: 0
	},
	{
		months: 3,
		label: "3 months",
		discount: 5
	},
	{
		months: 6,
		label: "6 months",
		discount: 10
	},
	{
		months: 12,
		label: "12 months",
		discount: 20
	}
];
function PricingDialog({ open, onClose, user, onUpdated }) {
	const [buyPlan, setBuyPlan] = (0, import_react.useState)(null);
	const [months, setMonths] = (0, import_react.useState)(1);
	const [busy, setBusy] = (0, import_react.useState)(false);
	if (!open) return null;
	const chosen = buyPlan ? PLANS[buyPlan] : null;
	const duration = DURATIONS.find((d) => d.months === months) ?? DURATIONS[0];
	const total = chosen ? Math.round(chosen.price * months * (1 - duration.discount / 100)) : 0;
	async function confirmBuy() {
		if (!buyPlan) return;
		setBusy(true);
		try {
			onUpdated(await setTier(user, buyPlan, months));
			setBuyPlan(null);
		} catch {}
		setBusy(false);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed inset-0 z-[120] grid place-items-center bg-black/75 p-4 backdrop-blur-md",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[28px] border border-border bg-card p-6 shadow-2xl md:p-8",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-6 flex items-start justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-xl font-bold text-foreground",
					children: "Choose your plan"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 text-xs text-muted-foreground",
					children: [
						"Signed in as ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-foreground",
							children: user.username
						}),
						" — currently on",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-semibold text-primary",
							children: user.tierLabel
						})
					]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: onClose,
					className: "ios-btn grid size-9 place-items-center rounded-full bg-cardhover text-muted-foreground",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid gap-4 md:grid-cols-3",
				children: Object.keys(PLANS).map((key) => {
					const plan = PLANS[key];
					const Icon = plan.icon;
					const isCurrent = user.tier === key;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: `relative flex flex-col rounded-2xl border p-5 ${isCurrent ? "border-primary bg-primary/5" : "border-border bg-cardhover/40"}`,
						children: [
							plan.badge && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "absolute -top-3 left-5 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold text-primary-foreground",
								children: plan.badge
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-6 text-primary" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "mt-3 text-base font-bold text-foreground",
								children: plan.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted-foreground",
								children: plan.tagline
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-3 text-2xl font-bold text-foreground",
								children: [
									"$",
									plan.price,
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-xs font-normal text-muted-foreground",
										children: "/mo"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "mt-4 flex-1 space-y-2.5",
								children: plan.features.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "flex items-start gap-2 text-xs",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "mt-0.5 size-3.5 shrink-0 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-foreground",
										children: f.title
									}), f.note && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "block text-[11px] text-muted-foreground",
										children: f.note
									})] })]
								}, f.title))
							}),
							plan.footnote && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 font-mono text-[10px] leading-relaxed text-muted-foreground",
								children: plan.footnote
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								disabled: isCurrent,
								onClick: () => {
									setBuyPlan(key);
									setMonths(1);
								},
								className: `ios-btn mt-5 w-full rounded-xl py-2.5 text-xs font-bold disabled:opacity-40 ${key === "free" ? "border border-border bg-cardhover text-foreground" : "bg-primary text-primary-foreground"}`,
								children: isCurrent ? "Current plan" : key === "free" ? "Downgrade to Free" : "Subscribe"
							})
						]
					}, key);
				})
			})]
		}), chosen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "fixed inset-0 z-[130] grid place-items-center bg-black/80 p-4 backdrop-blur-md",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "w-full max-w-sm rounded-[28px] border border-border bg-card p-6 shadow-2xl",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-4 flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-base font-bold text-foreground",
							children: chosen.name === "Free" ? "Confirm downgrade" : `Subscribe to ${chosen.name}`
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setBuyPlan(null),
							className: "ios-btn grid size-8 place-items-center rounded-full bg-cardhover text-muted-foreground",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
						})]
					}),
					chosen.price > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mb-4 grid grid-cols-2 gap-2",
						children: DURATIONS.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => setMonths(d.months),
							className: `rounded-xl border px-3 py-2 text-left text-xs ${months === d.months ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "font-semibold",
								children: d.label
							}), d.discount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "text-[10px]",
								children: [d.discount, "% off"]
							})]
						}, d.months))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "rounded-xl border border-border bg-cardhover/60 p-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-muted-foreground",
								children: [
									chosen.name,
									" · ",
									months,
									" mo"
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "font-bold text-foreground",
								children: ["$", total]
							})]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-[10px] leading-relaxed text-muted-foreground",
						children: "No payment processor is connected yet — this updates your plan directly without charging anything. Real billing needs a Stripe (or similar) account wired in first."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						disabled: busy,
						onClick: () => void confirmBuy(),
						className: "ios-btn mt-4 w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-40",
						children: busy ? "…" : chosen.price > 0 ? `Buy — $${total}` : "Confirm"
					})
				]
			})
		})]
	});
}
var TOUR_STEPS = [
	{
		icon: FolderOpen,
		title: "Send files, PC to PC",
		body: "Drop a file in one room and it's on the other machine in seconds — no USB stick, no email to yourself."
	},
	{
		icon: Terminal,
		title: "Full remote terminal",
		body: "Run real commands on a connected PC from anywhere, with live streamed output."
	},
	{
		icon: Sparkles,
		title: "An AI that can act",
		body: "Ask it to check disk space, grab a screenshot, or fix a broken file — it uses the same tools you do."
	},
	{
		icon: Power,
		title: "Control Center",
		body: "Shut down, restart, or wake a machine on a schedule, right from your dashboard."
	},
	{
		icon: Laptop,
		title: "Every device, one room",
		body: "Add as many PCs as your plan allows and switch between them instantly."
	}
];
function Onboarding({ user, onUpdated, onFinished }) {
	const [stage, setStage] = (0, import_react.useState)("welcome");
	const [tourIndex, setTourIndex] = (0, import_react.useState)(0);
	const [entered, setEntered] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const t = setTimeout(() => setEntered(true), 30);
		return () => clearTimeout(t);
	}, []);
	if (stage === "plan") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PricingDialog, {
		open: true,
		onClose: onFinished,
		user,
		onUpdated: (u) => {
			onUpdated(u);
			onFinished();
		}
	});
	if (stage === "welcome") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen flex-col items-center justify-center bg-background p-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col items-center text-center transition-all duration-700 ease-out",
			style: {
				opacity: entered ? 1 : 0,
				transform: entered ? "scale(1)" : "scale(0.85)",
				filter: entered ? "blur(0px)" : "blur(8px)"
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute -inset-5 animate-pulse rounded-full bg-primary/25 blur-2xl" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "relative size-20 rounded-[22px] bg-gradient-to-tr from-primary via-blue-400 to-indigo-500 p-px shadow-2xl",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid size-full place-items-center rounded-[21px] bg-card",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SendHorizontal, { className: "size-9 text-primary" })
						})
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
					className: "mt-6 text-3xl font-bold tracking-tight text-foreground",
					children: ["Welcome, ", user.username]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 font-mono text-xs uppercase tracking-widest text-muted-foreground",
					children: "Your account is ready"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => setStage("tour"),
					className: "ios-btn mt-8 flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30",
					children: ["Let's take a look ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-4" })]
				})
			]
		})
	});
	const step = TOUR_STEPS[tourIndex];
	const Icon = step.icon;
	const isLast = tourIndex === TOUR_STEPS.length - 1;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-screen flex-col items-center justify-center bg-background p-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex w-full max-w-sm flex-col items-center text-center",
			style: { animation: "filelink-tour-in 0.4s cubic-bezier(0.16,1,0.3,1)" },
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid size-16 place-items-center rounded-2xl border border-primary/30 bg-primary/15 text-primary",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-7" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-5 text-xl font-bold text-foreground",
					children: step.title
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm leading-relaxed text-muted-foreground",
					children: step.body
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6 flex items-center gap-1.5",
					children: TOUR_STEPS.map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "h-1.5 rounded-full transition-all duration-300",
						style: {
							width: i === tourIndex ? "20px" : "6px",
							backgroundColor: i === tourIndex ? "var(--color-primary)" : "var(--color-border)"
						}
					}, i))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-8 flex w-full gap-3",
					children: [tourIndex > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setTourIndex((i) => i - 1),
						className: "ios-btn flex-1 rounded-xl border border-border bg-card py-3 text-sm font-semibold text-foreground",
						children: "Back"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => isLast ? setStage("plan") : setTourIndex((i) => i + 1),
						className: "ios-btn flex-1 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground",
						children: isLast ? "Choose a plan" : "Next"
					})]
				}),
				!isLast && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => setStage("plan"),
					className: "mt-4 text-xs text-muted-foreground hover:text-primary",
					children: "Skip to plans"
				})
			]
		}, tourIndex), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `
        @keyframes filelink-tour-in {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      ` })]
	});
}
function loadSeenDeviceIds(roomCode) {
	try {
		const raw = localStorage.getItem(`filelink:seen-devices:${roomCode}`);
		return new Set(raw ? JSON.parse(raw) : []);
	} catch {
		return /* @__PURE__ */ new Set();
	}
}
function markDeviceSeen(roomCode, id) {
	try {
		const set = loadSeenDeviceIds(roomCode);
		set.add(id);
		localStorage.setItem(`filelink:seen-devices:${roomCode}`, JSON.stringify([...set]));
	} catch {}
}
function Index() {
	const [user, setUser] = (0, import_react.useState)(null);
	const [onboarding, setOnboarding] = (0, import_react.useState)(false);
	const [checkingUser, setCheckingUser] = (0, import_react.useState)(true);
	const [pricingOpen, setPricingOpen] = (0, import_react.useState)(false);
	const [session, setSession] = (0, import_react.useState)(null);
	const [cwd, setCwd] = (0, import_react.useState)("/");
	const [devices, setDevices] = (0, import_react.useState)([]);
	const [sent, setSent] = (0, import_react.useState)([]);
	const [received, setReceived] = (0, import_react.useState)([]);
	const [source, setSource] = (0, import_react.useState)("");
	const [tab, setTab] = (0, import_react.useState)("files");
	const [transfersView, setTransfersView] = (0, import_react.useState)("received");
	const [transferManagerHidden, setTransferManagerHidden] = (0, import_react.useState)(false);
	const [transferManagerCollapsed, setTransferManagerCollapsed] = (0, import_react.useState)(false);
	const [addDeviceOpen, setAddDeviceOpen] = (0, import_react.useState)(false);
	const [menuOpen, setMenuOpen] = (0, import_react.useState)(false);
	const [leftSidebarOpen, setLeftSidebarOpen] = (0, import_react.useState)(true);
	const [rightSidebarOpen, setRightSidebarOpen] = (0, import_react.useState)(false);
	const [newDevice, setNewDevice] = (0, import_react.useState)(null);
	const [rename, setRename] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		const stored = loadUserSession();
		if (!stored) {
			setCheckingUser(false);
			return;
		}
		userMe(stored).then((fresh) => {
			setUser(fresh);
			saveUserSession(fresh);
		}).catch(() => {
			saveUserSession(null);
			setUser(null);
		}).finally(() => setCheckingUser(false));
	}, []);
	(0, import_react.useEffect)(() => {
		setSession(loadSession());
	}, []);
	const refresh = (0, import_react.useCallback)(async () => {
		if (!session) return;
		try {
			const hb = await api("heartbeat", {}, session);
			setDevices(hb.devices);
			const t = await api("tasks", {}, session);
			setSent(t.sent);
			setReceived(t.received);
		} catch {}
	}, [session]);
	(0, import_react.useEffect)(() => {
		refresh();
	}, [refresh]);
	(0, import_react.useEffect)(() => {
		if (!session) return;
		const seen = loadSeenDeviceIds(session.roomCode);
		const arrived = devices.find((d) => !seen.has(d.id) && d.id !== session.deviceId);
		if (arrived && !newDevice) {
			setNewDevice(arrived);
			setRename(arrived.name);
			markDeviceSeen(session.roomCode, arrived.id);
		}
	}, [
		devices,
		session,
		newDevice
	]);
	if (checkingUser) return null;
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AccountLogin, { onLoggedIn: (u, isNewSignup) => {
		setUser(u);
		setOnboarding(isNewSignup);
	} });
	if (onboarding) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Onboarding, {
		user,
		onUpdated: (u) => {
			setUser(u);
			saveUserSession(u);
		},
		onFinished: () => setOnboarding(false)
	});
	if (!session) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Connect, {
		onConnected: setSession,
		user
	});
	typeof window !== "undefined" && `${window.location.origin}${session.roomCode}`;
	const queued = sent.filter((t) => t.status === "pending").length;
	const waiting = received.filter((t) => t.status === "pending").length;
	const onlineCount = devices.filter((d) => d.online).length;
	const backgroundCount = devices.filter((d) => d.online && d.agent).length;
	const inUseCount = onlineCount - backgroundCount;
	const terminalPanel = /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "h-full min-h-0 rounded-xl border border-border bg-card p-3",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Terminal$1, {
			session,
			cwd,
			setCwd,
			onChanged: refresh
		})
	});
	const sidePanel = /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SidePanel, {
		session,
		devices,
		sent,
		received,
		onRefresh: refresh,
		onOpenDevice: (name) => {
			setSource(name);
			setTab("files");
		}
	});
	async function confirmRename() {
		if (!newDevice || !session) return;
		try {
			const r = await updateDevice(session, newDevice.id, rename.trim() || newDevice.name);
			setDevices(r.devices);
		} catch {}
		setNewDevice(null);
	}
	const panel = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		tab === "ai" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AITab, {
			session,
			devices
		}),
		tab === "files" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileExplorerTab, {
			session,
			devices,
			source,
			setSource,
			onChanged: refresh
		}),
		tab === "tasks" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TasksTab, {
			session,
			devices
		}),
		tab === "pcinfo" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PcInfoTab, {
			session,
			devices
		}),
		tab === "control" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ControlTab, {
			session,
			devices
		}),
		tab === "devices" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DevicesTab, {
			session,
			devices,
			onChanged: setDevices
		}),
		tab === "transfers" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TransfersPanel, {
			session,
			sent,
			received,
			defaultView: transfersView
		}),
		tab === "terminal" && terminalPanel
	] });
	const navItems = NAV_ITEMS;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-screen w-full overflow-hidden bg-background text-foreground",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CursorGlow, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Splash, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: `z-20 h-full shrink-0 flex-col border-r border-border bg-card p-6 shadow-2xl transition-all duration-300 ease-in-out ${leftSidebarOpen ? "md:flex md:w-72" : "md:hidden"}`,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => setLeftSidebarOpen(false),
						title: "Hide sidebar",
						className: "group mb-8 flex w-full items-center gap-3 rounded-xl px-2 py-1 text-left transition-colors hover:bg-cardhover",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid size-8 shrink-0 place-items-center rounded-lg border border-primary/30 bg-primary/20 text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SendHorizontal, { className: "size-4" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "text-lg font-bold tracking-tight",
								children: "FileLink"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PanelLeft, { className: "ml-auto size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
						className: "no-scrollbar flex flex-1 flex-col gap-1.5 overflow-y-auto",
						children: [
							navItems.map(({ key, label, Icon }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									onClick: () => setTab(key),
									className: `ios-btn flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${tab === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-cardhover hover:text-foreground"}`,
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4" }),
										label,
										key === "transfers" && waiting + queued > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: `ml-auto rounded-full px-2 py-0.5 font-mono text-[10px] ${tab === key ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary/20 text-primary"}`,
											children: waiting + queued
										})
									]
								}), key === "ai" && tab === "ai" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mb-1 ml-3 max-h-64 overflow-y-auto border-l border-border/60 pl-1 no-scrollbar",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RecentChats, {
										session,
										limit: 12
									})
								})]
							}, key)),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "my-2 w-full border-t border-border/50" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => setAddDeviceOpen(true),
								className: "ios-btn flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-cardhover hover:text-foreground",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MonitorSmartphone, { className: "size-4" }), "Add PC Target"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => setPricingOpen(true),
								className: "ios-btn flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-cardhover hover:text-foreground",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "flex items-center gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Crown, { className: "size-4" }), "My plan"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary",
									children: user.tierLabel
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "shrink-0 space-y-3 border-t border-border/60 pt-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-center gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary",
									children: ["In use ", inUseCount]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-medium text-warning",
									children: ["Background ", backgroundCount]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => {
									saveSession(null);
									setSession(null);
								},
								className: "ios-btn flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/50 py-2.5 text-xs font-semibold text-destructive",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "size-4" }), " Exit room"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-center font-mono text-[10px] text-muted-foreground",
								children: "FileLink v2.5"
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "animate-main-ui relative flex flex-1 flex-col overflow-hidden",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
						className: "flex items-center justify-between gap-3 border-b border-border px-4 py-2.5 md:px-6 md:py-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex min-w-0 items-center gap-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => setLeftSidebarOpen(!leftSidebarOpen),
									"aria-label": "Toggle sidebar",
									className: "ios-btn hidden size-10 shrink-0 place-items-center rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground md:grid",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PanelLeft, { className: "size-5" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => setMenuOpen(true),
									"aria-label": "Open menu",
									className: "ios-btn grid size-10 shrink-0 place-items-center rounded-xl bg-primary/20 text-primary md:hidden",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, { className: "size-5" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
										className: "truncate text-base font-bold leading-tight md:text-2xl",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "md:hidden",
											children: navItems.find((n) => n.key === tab)?.label ?? session.roomName
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "hidden md:inline",
											children: session.roomName
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "font-mono text-xs uppercase tracking-widest text-primary",
										children: ["Room: ", session.roomCode]
									})]
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex shrink-0 items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => {
									setTransferManagerHidden(false);
									setTransferManagerCollapsed(false);
								},
								"aria-label": "Transfers",
								className: `ios-btn relative grid size-10 place-items-center rounded-xl border ${!transferManagerHidden && !transferManagerCollapsed ? "border-primary bg-primary/15 text-primary" : "border-border bg-card text-muted-foreground hover:text-foreground"}`,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-4" }), waiting + queued > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground",
									children: waiting + queued
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setRightSidebarOpen(!rightSidebarOpen),
								className: `ios-btn grid size-10 place-items-center rounded-xl border ${rightSidebarOpen ? "border-primary bg-primary/15 text-primary" : "border-border bg-card text-muted-foreground hover:text-foreground"}`,
								"aria-label": "Room info & devices",
								title: "Room storage & devices",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PanelRight, { className: "size-4" })
							})]
						})]
					}),
					newDevice && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "px-4 pt-3 md:px-8",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-2 rounded-2xl border border-primary/30 bg-primary/5 p-3 sm:flex-row sm:items-center sm:justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-sm",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-semibold",
										children: "New device connected!"
									}),
									" ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted-foreground",
										children: newDevice.name
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										value: rename,
										onChange: (e) => setRename(e.target.value),
										className: "ios-btn rounded-xl border border-border bg-cardhover/60 px-3 py-1.5 font-mono text-sm outline-none focus:border-primary"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: confirmRename,
										className: "ios-btn rounded-xl bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground",
										children: "Save"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: () => setNewDevice(null),
										className: "ios-btn rounded-xl border border-border px-3 py-1.5 text-sm",
										children: "Dismiss"
									})
								]
							})]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
						className: "flex min-h-0 flex-1 overflow-hidden p-3 md:p-6",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex min-h-0 w-full flex-1 flex-col overflow-hidden",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex min-h-0 flex-1 flex-col overflow-hidden",
								children: panel
							})
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: `fixed right-0 top-0 z-40 h-full w-[380px] border-l border-border bg-card shadow-2xl transition-transform duration-300 ease-in-out ${rightSidebarOpen ? "translate-x-0" : "translate-x-full"}`,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex h-full flex-col",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between border-b border-border/50 p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-sm font-semibold",
							children: "Room Info"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setRightSidebarOpen(false),
							className: "ios-btn grid size-8 place-items-center rounded-lg text-muted-foreground hover:text-foreground",
							"aria-label": "Close",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex-1 overflow-y-auto p-4 no-scrollbar",
						children: sidePanel
					})]
				})
			}),
			rightSidebarOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-30 bg-black/20 backdrop-blur-sm",
				onClick: () => setRightSidebarOpen(false)
			}),
			tab === "files" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: () => window.dispatchEvent(new Event("filelink:upload")),
				className: "ios-btn fixed bottom-6 right-5 z-30 grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-terminal md:hidden",
				"aria-label": "Add files",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-6" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MobileDrawer, {
				open: menuOpen,
				onClose: () => setMenuOpen(false),
				items: navItems.map((n) => ({
					key: n.key,
					label: n.label,
					Icon: n.Icon,
					badge: n.key === "transfers" ? waiting + queued : void 0
				})),
				active: tab,
				onSelect: setTab,
				session,
				user,
				onAddDevice: () => setAddDeviceOpen(true),
				onPlan: () => setPricingOpen(true),
				onExit: () => {
					saveSession(null);
					setSession(null);
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AddDeviceDialog, {
				open: addDeviceOpen,
				onOpenChange: setAddDeviceOpen,
				session
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PricingDialog, {
				open: pricingOpen,
				onClose: () => setPricingOpen(false),
				user,
				onUpdated: (u) => {
					setUser(u);
					saveUserSession(u);
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TransferManager, {
				hidden: transferManagerHidden,
				setHidden: setTransferManagerHidden,
				collapsed: transferManagerCollapsed,
				setCollapsed: setTransferManagerCollapsed
			})
		]
	});
}
var NAV_ITEMS = [
	{
		key: "files",
		label: "File Explorer",
		short: "Files",
		Icon: FolderOpen
	},
	{
		key: "ai",
		label: "AI Assistant",
		short: "AI",
		Icon: Sparkles
	},
	{
		key: "tasks",
		label: "Tasks",
		short: "Tasks",
		Icon: Inbox
	},
	{
		key: "pcinfo",
		label: "PC Setup",
		short: "PC",
		Icon: Settings
	},
	{
		key: "control",
		label: "Control Center",
		short: "Ctrl",
		Icon: Power
	},
	{
		key: "devices",
		label: "Devices",
		short: "Devices",
		Icon: Laptop
	},
	{
		key: "transfers",
		label: "Transfers",
		short: "Xfers",
		Icon: SendHorizontal
	},
	{
		key: "terminal",
		label: "Terminal",
		short: "Term",
		Icon: Terminal
	}
];
function CursorGlow() {
	const ref = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const el = ref.current;
		if (!el) return;
		const move = (e) => {
			el.style.opacity = "1";
			el.style.left = `${e.clientX}px`;
			el.style.top = `${e.clientY}px`;
		};
		const leave = () => {
			el.style.opacity = "0";
		};
		window.addEventListener("mousemove", move);
		document.addEventListener("mouseleave", leave);
		return () => {
			window.removeEventListener("mousemove", move);
			document.removeEventListener("mouseleave", leave);
		};
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref,
		className: "cursor-glow hidden opacity-0 md:block",
		"aria-hidden": true
	});
}
function Splash() {
	const [gone, setGone] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const t = setTimeout(() => setGone(true), 2400);
		return () => clearTimeout(t);
	}, []);
	if (gone) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "animate-splash pointer-events-none fixed inset-0 z-[80] flex flex-col items-center justify-center bg-background",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative flex flex-col items-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute -inset-4 animate-pulse rounded-full bg-primary/25 blur-2xl" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "animate-logo relative size-20 rounded-[22px] bg-gradient-to-tr from-primary via-blue-400 to-indigo-500 p-px shadow-2xl",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid size-full place-items-center rounded-[21px] bg-card",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SendHorizontal, { className: "size-9 text-primary" })
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "animate-logo mt-6 text-2xl font-semibold tracking-tight",
					children: "FileLink"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-1.5 animate-ping rounded-full bg-primary" }), "PC to PC Transfer"]
				})
			]
		})
	});
}
function AddDeviceDialog({ open, onOpenChange, session }) {
	const [deviceName, setDeviceName] = (0, import_react.useState)("My PC");
	const origin = typeof window !== "undefined" ? window.location.origin : "";
	const name = deviceName.trim() || "My PC";
	const command = `curl -O ${origin}/filelink.mjs\nnode filelink.mjs connect ${origin}/j/${session.roomCode} "${name}"`;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "max-w-lg",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MonitorSmartphone, { className: "size-5 text-primary" }), " Add a device"]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Run this on the PC you want to connect, or download the background agent installer." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mb-1 block text-[11px] uppercase tracking-wider text-muted-foreground",
							children: "Name this PC"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: deviceName,
							onChange: (e) => setDeviceName(e.target.value),
							placeholder: "My PC",
							className: "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
						className: "overflow-x-auto whitespace-pre-wrap break-all rounded-md border border-border bg-background p-4 font-mono text-[13px] text-primary",
						children: command
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => navigator.clipboard?.writeText(command),
							className: "flex flex-1 items-center justify-center gap-2 rounded-md border border-border py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, { className: "size-4" }), " copy command"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => navigator.clipboard?.writeText(`${origin}/j/${session.roomCode}`),
							className: "flex flex-1 items-center justify-center gap-2 rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90",
							children: "copy link"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-3 rounded-md border border-border bg-card p-3 sm:flex-row sm:items-center",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-medium text-foreground",
								children: "Background agent installer"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted-foreground",
								children: "Installs and runs permanently for this room, starting automatically with Windows."
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BackgroundAgentDownload, {
							session,
							origin,
							defaultName: name
						})]
					})
				]
			})]
		})
	});
}
function Connect({ onConnected, user }) {
	const [code, setCode] = (0, import_react.useState)("");
	const [roomName, setRoomName] = (0, import_react.useState)("");
	const [deviceName, setDeviceName] = (0, import_react.useState)("My browser");
	const [error, setError] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const fromPath = window.location.pathname.match(/^\/j\/([^/]+)/);
		const fromQuery = new URLSearchParams(window.location.search).get("code");
		const found = fromPath?.[1] ?? fromQuery;
		if (found) setCode(found.toUpperCase());
	}, []);
	async function join(joinCode) {
		setBusy(true);
		setError(null);
		try {
			const r = await api("register", {
				code: joinCode,
				deviceName: deviceName || "browser",
				platform: "web browser",
				clientKind: "web"
			});
			const session = {
				roomCode: r.room.code,
				roomName: r.room.name,
				deviceId: r.device.id,
				deviceToken: r.device.token,
				deviceName: r.device.name
			};
			saveSession(session);
			onConnected(session);
		} catch (e) {
			setError(e.message);
		}
		setBusy(false);
	}
	async function create() {
		setBusy(true);
		setError(null);
		try {
			await join((await api("createRoom", {
				name: roomName || "Shared drive",
				userId: user.userId,
				userToken: user.userToken
			})).room.code);
		} catch (e) {
			setError(e.message);
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-12",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CursorGlow, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Splash, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "animate-main-ui w-full max-w-md",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-8 text-center",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "ios-btn mb-4 inline-flex size-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-blue-400 shadow-lg shadow-primary/30",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SendHorizontal, { className: "size-7 text-primary-foreground" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-mono text-[10px] font-semibold uppercase tracking-[0.3em] text-primary",
								children: "filelink"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "mt-1 text-3xl font-bold tracking-tight",
								children: "PC to PC Transfer"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 px-4 text-sm leading-relaxed text-muted-foreground",
								children: "Connect devices instantly. Online gets files now, offline syncs via the cloud."
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "ios-card-hover space-y-5 rounded-[24px] border border-border/65 bg-card/90 p-6 shadow-2xl backdrop-blur-xl",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "mb-2 block text-xs font-medium text-muted-foreground",
								children: "Device Name"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: deviceName,
								onChange: (e) => setDeviceName(e.target.value),
								className: "ios-btn w-full rounded-xl border border-border bg-cardhover/60 px-4 py-3 text-sm outline-none focus:border-primary"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "border-t border-border/50 pt-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "mb-2 block text-xs font-medium text-muted-foreground",
									children: "Join with Code"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										value: code,
										onChange: (e) => setCode(e.target.value.toUpperCase()),
										onKeyDown: (e) => {
											if (e.key === "Enter" && code && !busy) join(code);
										},
										placeholder: "ABC123",
										className: "ios-btn w-full rounded-xl border border-border bg-cardhover/60 px-4 py-3 font-mono text-sm uppercase tracking-widest outline-none focus:border-primary"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										disabled: busy || !code,
										onClick: () => join(code),
										className: "ios-btn shrink-0 rounded-xl bg-primary px-6 py-3 text-xs font-semibold text-primary-foreground disabled:opacity-40",
										children: "Join"
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "border-t border-border/50 pt-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "mb-2 block text-xs font-medium text-muted-foreground",
									children: "Or New Room"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										value: roomName,
										onChange: (e) => setRoomName(e.target.value.replace(/#/g, "")),
										onKeyDown: (e) => {
											if (e.key === "Enter" && !busy) create();
										},
										placeholder: "Shared drive (optional)",
										className: "ios-btn w-full rounded-xl border border-border bg-cardhover/60 px-4 py-3 text-sm outline-none focus:border-primary"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										disabled: busy,
										onClick: create,
										className: "ios-btn shrink-0 rounded-xl border border-primary/30 bg-primary/15 px-6 py-3 text-xs font-semibold text-primary disabled:opacity-40",
										children: "Create"
									})]
								})]
							}),
							error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-mono text-xs text-destructive",
								children: error
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
						className: "mt-6 space-y-1 text-center font-mono text-xs text-muted-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "› cd grade 9 · mkdir homework" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "› send report.pdf --to Laptop · tasks" })]
					})
				]
			})
		]
	});
}
//#endregion
export { Index as component };
