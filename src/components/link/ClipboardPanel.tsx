import { useEffect, useState } from "react";
import { Clipboard, Copy, RefreshCw, Send, Trash2 } from "lucide-react";
import { remoteCall, type Session } from "@/lib/linkClient";
import { addAudit } from "@/lib/audit";


type Entry = { id: string; ts: number; text: string; device: string };

const KEY = "filelink.clipboard.v1";

function load(): Entry[] {
  if (typeof window === "undefined") return [];
  try {
    const list = JSON.parse(window.localStorage.getItem(KEY) || "[]") as Entry[];
    // Daily auto-flush: drop anything from a previous calendar day.
    const today = new Date().toDateString();
    return list.filter((e) => new Date(e.ts).toDateString() === today);
  } catch {
    return [];
  }
}

function save(list: Entry[]) {
  window.localStorage.setItem(KEY, JSON.stringify(list.slice(-100)));
}


export function ClipboardPanel({ session, target }: { session: Session; target: string }) {
  const [history, setHistory] = useState<Entry[]>([]);
  const [text, setText] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setHistory(load());
  }, []);

  function record(entry: Entry) {
    const next = [...history, entry];
    setHistory(next);
    save(next);
  }

  async function syncClipboard() {
    const value = text.trim();
    if (!value) return;
    record({ id: crypto.randomUUID(), ts: Date.now(), text: value, device: target || "Local" });
    setText("");
    if (!target) {
      setNote("Pick a target PC first.");
      return;
    }
    setBusy(true);
    try {
      await remoteCall<{ ok: boolean }>(session, target, "clipboardWrite", { text: value });
      setNote(`Synced to ${target}`);
      addAudit("Clipboard", `Synced clipboard text to ${target}`, "SUCCESS", target);
    } catch (e) {
      setNote(`Failed: ${(e as Error).message}`);
    }
    setBusy(false);
  }

  async function refreshRemoteHistory() {
    if (!target) return;
    setBusy(true);
    try {
      const r = await remoteCall<{ entries: { ts: number; text: string; source: string }[] }>(
        session,
        target,
        "clipboardHistory",
      );
      const merged = [
        ...history,
        ...(r.entries || []).map((e) => ({
          id: `${target}-${e.ts}`,
          ts: e.ts,
          text: e.text,
          device: target,
        })),
      ].filter((v, i, a) => a.findIndex((x) => x.text === v.text && x.device === v.device) === i);
      setHistory(merged);
      save(merged);
      setNote(`${r.entries?.length || 0} entries from ${target}`);
      addAudit("Clipboard", `Pulled remote clipboard history from ${target}`, "INFO", target);
    } catch (e) {
      setNote(`Failed: ${(e as Error).message}`);
    }
    setBusy(false);
  }


  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[20px] border border-border bg-card p-5 md:p-7">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-2xl bg-primary/15 text-primary">
            <Clipboard className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Remote Clipboard &amp; Input Sync</h3>
            <p className="text-xs text-muted-foreground">
              Push text straight into the clipboard of {target || "the selected PC"}.
            </p>
          </div>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="Type or paste text to send…"
          className="w-full resize-none rounded-2xl border border-border bg-cardhover p-4 font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
        />
        <button
          disabled={busy || !text.trim()}
          onClick={() => void syncClipboard()}
          className="ios-btn mt-3 flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-40"
        >
          <Send className="size-4" /> Sync to host clipboard
        </button>
        {note && <p className="mt-4 font-mono text-xs text-muted-foreground">{note}</p>}
      </div>

      <div className="rounded-[20px] border border-border bg-card p-5 md:p-7">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-foreground">Daily Clipboard History Log</h3>
            <p className="text-xs text-muted-foreground">Auto-flushes every day at midnight. Pull from the target PC to see what it copied.</p>
          </div>
          <div className="flex gap-2">
            <button
              disabled={busy || !target}
              onClick={() => void refreshRemoteHistory()}
              className="ios-btn flex shrink-0 items-center gap-1.5 rounded-xl border border-border bg-cardhover px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-primary disabled:opacity-40"
            >
              <RefreshCw className="size-4" /> Pull from {target || "device"}
            </button>
            <button
              onClick={() => {
                setHistory([]);
                save([]);
                addAudit("Clipboard", "Clipboard history flushed manually", "INFO");
              }}
              className="ios-btn flex shrink-0 items-center gap-1.5 rounded-xl border border-border bg-cardhover px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-4" /> Flush
            </button>
          </div>
        </div>

        {history.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No entries today.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {history
              .slice()
              .reverse()
              .map((e) => (
                <li
                  key={e.id}
                  className="flex items-center gap-3 rounded-xl border border-border/60 bg-cardhover px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-xs text-foreground">{e.text}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {new Date(e.ts).toLocaleTimeString()} · {e.device}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      void navigator.clipboard.writeText(e.text);
                      addAudit("Clipboard", `Copied entry locally: ${e.text.slice(0, 40)}`, "SUCCESS");
                    }}
                    className="ios-btn shrink-0 rounded-lg border border-border p-2 text-muted-foreground hover:text-primary"
                    aria-label="Copy"
                  >
                    <Copy className="size-4" />
                  </button>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
}
