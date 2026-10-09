// Structured "rich result" payloads the AI can show in the chat.
//
// Tool results go to the model as TEXT (so it can reason about them), but the
// person should see a proper UI — a file list with icons, a tasks table, a
// screenshot in an image viewer, a choice card — not a wall of JSON. The
// server builds these payloads from the raw tool result and streams them to
// the browser as `tool_ui` events; they never go into the model's context
// (a screenshot is megabytes of base64 — it must not).
//
// Shared by client and server: types and tiny pure helpers only.

import type { RawProcess } from "../processGroups";
import type { AIRiskLevel } from "./ai.types";

export type AIChoiceOption = {
  id: string;
  label: string;
  /** Second line under the label — e.g. the full path when names collide. */
  description?: string;
  /** Exact text sent back to the AI when this option is picked. */
  value: string;
  kind?: "file" | "folder" | "device" | "generic";
};

export type AIFileEntry = {
  name: string;
  /** Full path on the device. */
  path: string;
  size?: number;
};

export type AIUiPayload =
  | {
      kind: "choices";
      question: string;
      options: AIChoiceOption[];
      /** Let the person pick several options at once. */
      multi?: boolean;
      /** Show a free-text box too ("something else…"). */
      allowOther?: boolean;
    }
  | {
      kind: "confirm";
      question: string;
      risk: AIRiskLevel;
      details?: Record<string, string>;
    }
  | {
      kind: "files";
      device: string;
      path: string;
      mode: "list" | "search";
      query?: string;
      folders: AIFileEntry[];
      files: AIFileEntry[];
      truncated?: boolean;
    }
  | {
      kind: "tasks";
      device: string;
      processes: RawProcess[];
    }
  | {
      kind: "image";
      device: string;
      /** data: URI. Absent once a chat has been saved (images aren't stored). */
      src?: string;
      mime: string;
      caption: string;
      takenAt?: number;
    };

/** Pick the "answerable" payloads — the ones that pause the AI and wait. */
export function isQuestionPayload(p: AIUiPayload): boolean {
  return p.kind === "choices" || p.kind === "confirm";
}

/** Replace heavy fields so a payload is safe to store in the database. */
export function stripForStorage(p: AIUiPayload): AIUiPayload {
  if (p.kind === "image") return { ...p, src: undefined };
  if (p.kind === "tasks") {
    // Icons are base64 PNGs — drop them, keep the rows.
    return { ...p, processes: p.processes.map((proc) => ({ ...proc, icon: undefined })) };
  }
  return p;
}

/** Windows paths use "\", the PC agent's shared-folder paths use "/".
 * Normalise just enough to join and compare. */
export function joinPath(dir: string, name: string): string {
  if (!dir || dir === "/") return `/${name}`;
  const sep = dir.includes("\\") && !dir.includes("/") ? "\\" : "/";
  return dir.endsWith(sep) ? `${dir}${name}` : `${dir}${sep}${name}`;
}

/** Prefix of the message the Approve button sends back. The server treats a
 * user turn that starts with this as approval for ONE risky action. */
export const APPROVAL_PREFIX = "✅ Approved";
export const CANCEL_PREFIX = "❌ Cancelled";
