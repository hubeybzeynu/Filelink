import { useRef, useState } from "react";
import { Globe, Play, Upload } from "lucide-react";
import { remoteCall, remoteExecStart, remoteUploadFile, type Session } from "@/lib/linkClient";
import { addAudit } from "@/lib/audit";

export function OpenFileLinkTab({ session, target }: { session: Session; target: string }) {
  const [url, setUrl] = useState("");
  const [path, setPath] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function dispatch(command: string, label: string) {
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
      setNote(`Failed: ${(e as Error).message}`);
      addAudit("File/Link", `${label} failed on ${target}: ${(e as Error).message}`, "ERROR", target);
    }
    setBusy(false);
  }

  async function uploadAndOpen(file: File) {
    if (!target) {
      setNote("Pick a target PC first.");
      return;
    }
    setBusy(true);
    setNote(null);
    try {
      await remoteUploadFile(session, target, "/", file);
      const { root } = await remoteCall<{ root: string }>(session, target, "info");
      const fullPath = `${root.replace(/[\\/]+$/, "")}\\${file.name}`;
      await remoteExecStart(session, target, `start "" "${fullPath}"`);
      setNote(`Sent and opened ${file.name} on ${target}`);
      addAudit("File/Link", `Uploaded and opened ${file.name} on ${target}`, "SUCCESS", target);
    } catch (e) {
      // Windows itself shows "how do you want to open this file" if there's
      // no default app for the type — that's an OS-level prompt on that PC,
      // not something a remote script can preview or override.
      setNote(`Failed: ${(e as Error).message}`);
      addAudit("File/Link", `Upload & open failed on ${target}: ${(e as Error).message}`, "ERROR", target);
    }
    setBusy(false);
  }

  return (
    <div className="rounded-[20px] border border-border bg-card p-6 md:p-8">
      <h3 className="text-lg font-bold text-foreground">Open File / Link</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        {target ? `Applies to ${target}.` : "Select at least one PC first."}
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="flex gap-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="min-w-0 flex-1 rounded-xl border border-border bg-cardhover px-3 py-2.5 font-mono text-xs text-foreground outline-none focus:border-primary"
          />
          <button
            disabled={busy || !url.trim() || !target}
            onClick={() => void dispatch(`start "" "${url.trim()}"`, `Opened URL ${url.trim()}`)}
            className="ios-btn flex shrink-0 items-center gap-1.5 rounded-xl border border-border bg-cardhover px-3 text-xs font-semibold text-foreground hover:text-primary disabled:opacity-40"
          >
            <Globe className="size-4" /> Open
          </button>
        </div>
        <div className="flex gap-2">
          <input
            value={path}
            onChange={(e) => setPath(e.target.value)}
            placeholder="C:\Tools\app.exe"
            className="min-w-0 flex-1 rounded-xl border border-border bg-cardhover px-3 py-2.5 font-mono text-xs text-foreground outline-none focus:border-primary"
          />
          <button
            disabled={busy || !path.trim() || !target}
            onClick={() => void dispatch(`start "" "${path.trim()}"`, `Executed path ${path.trim()}`)}
            className="ios-btn flex shrink-0 items-center gap-1.5 rounded-xl border border-border bg-cardhover px-3 text-xs font-semibold text-foreground hover:text-primary disabled:opacity-40"
          >
            <Play className="size-4" /> Run
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-cardhover/40 p-5">
        <h4 className="mb-1 text-sm font-bold text-foreground">Send a file and open it</h4>
        <p className="mb-4 text-[11px] text-muted-foreground">
          Uploads a file straight to {target || "the target PC"} and opens it with whatever app that PC has
          for that file type.
        </p>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void uploadAndOpen(f);
            e.target.value = "";
          }}
        />
        <button
          disabled={busy || !target}
          onClick={() => fileRef.current?.click()}
          className="ios-btn flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-40"
        >
          <Upload className="size-4" /> Upload &amp; open on {target || "device"}
        </button>
      </div>

      {note && <p className="mt-4 font-mono text-xs text-muted-foreground">{note}</p>}
    </div>
  );
}
