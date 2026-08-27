import { useState } from "react";
import { AlertTriangle, HelpCircle, Loader2, Send } from "lucide-react";
import { remoteExecStart, remoteExecStatus, sendControl, type Session } from "@/lib/linkClient";
import { addAudit } from "@/lib/audit";

type Mode = "direct" | "question";

function esc(s: string) {
  return s.replace(/'/g, "''");
}

/** Shows a Yes/No question on the target PC and — using PowerShell's own
 * Invoke-Expression, run right there in the same script — runs the given
 * command only if they click Yes. Single-quoting everything (instead of the
 * usual cmd /c "..." pattern) avoids a 3-way cmd/PowerShell/inner-command
 * quote-nesting problem entirely. */
function buildQuestionCommand(title: string, content: string, yesCommand: string) {
  const parts = [
    "Add-Type -AssemblyName PresentationFramework;",
    `$r = [System.Windows.MessageBox]::Show('${esc(content)}', '${esc(title)}', 'YesNo', 'Question');`,
    yesCommand.trim() ? `if ($r -eq 'Yes') { Invoke-Expression '${esc(yesCommand.trim())}' };` : "",
    "Write-Output ('RESULT:' + $r)",
  ].join(" ");
  return `powershell -NoProfile -Command "${parts}"`;
}

export function AlertTab({ session, target }: { session: Session; target: string }) {
  const [mode, setMode] = useState<Mode>("direct");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [yesCommand, setYesCommand] = useState("");
  const [busy, setBusy] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [result, setResult] = useState<{ answer: string; output: string } | null>(null);
  const [note, setNote] = useState<string | null>(null);

  async function sendDirect() {
    if (!target || !content.trim()) return;
    setBusy(true);
    setNote(null);
    try {
      await sendControl(session, target, "alert", { title: title.trim() || "Message", content: content.trim() });
      setNote(`Alert sent to ${target}`);
      addAudit("Alert", `Sent "${title.trim() || "Message"}" to ${target}`, "SUCCESS", target);
      setTitle("");
      setContent("");
    } catch (e) {
      setNote(`Failed: ${(e as Error).message}`);
    }
    setBusy(false);
  }

  async function sendQuestion() {
    if (!target || !content.trim()) return;
    setBusy(true);
    setWaiting(true);
    setResult(null);
    setNote(null);
    const command = buildQuestionCommand(title.trim() || "Confirmation", content.trim(), yesCommand);
    try {
      const { callId } = await remoteExecStart(session, target, command);
      let status = "pending";
      let chunks: string[] = [];
      // No fixed timeout on purpose — the person on that PC might take a
      // while to click something, and that's fine to keep waiting for.
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
      setResult({ answer, output });
      addAudit(
        "Alert",
        `Question "${title.trim() || "Confirmation"}" answered ${answer} on ${target}`,
        "SUCCESS",
        target,
      );
    } catch (e) {
      setNote(`Failed: ${(e as Error).message}`);
      addAudit("Alert", `Question failed on ${target}: ${(e as Error).message}`, "ERROR", target);
    }
    setBusy(false);
    setWaiting(false);
  }

  return (
    <div className="rounded-[20px] border border-border bg-card p-6 md:p-8">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-foreground">Alert</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {target ? `Applies to ${target}.` : "Select at least one PC first."}
          </p>
        </div>
        <div className="flex shrink-0 rounded-xl border border-border bg-cardhover p-1">
          <button
            onClick={() => {
              setMode("direct");
              setResult(null);
            }}
            className={`ios-btn flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
              mode === "direct" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            <AlertTriangle className="size-3.5" /> Run direct
          </button>
          <button
            onClick={() => {
              setMode("question");
              setResult(null);
            }}
            className={`ios-btn flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
              mode === "question" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            <HelpCircle className="size-3.5" /> By question
          </button>
        </div>
      </div>

      <label className="mb-3 block">
        <span className="mb-1 block text-[11px] uppercase tracking-wider text-muted-foreground">Title</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={mode === "direct" ? "Message" : "Confirmation"}
          className="w-full rounded-xl border border-border bg-cardhover px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
        />
      </label>
      <label className="mb-3 block">
        <span className="mb-1 block text-[11px] uppercase tracking-wider text-muted-foreground">
          {mode === "direct" ? "Content" : "Question"}
        </span>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          placeholder={mode === "direct" ? "What do you want them to see?" : "Do you want to proceed?"}
          className="w-full resize-none rounded-xl border border-border bg-cardhover p-3 text-sm text-foreground outline-none focus:border-primary"
        />
      </label>

      {mode === "question" && (
        <label className="mb-4 block">
          <span className="mb-1 block text-[11px] uppercase tracking-wider text-muted-foreground">
            Command to run if they click Yes (optional)
          </span>
          <input
            value={yesCommand}
            onChange={(e) => setYesCommand(e.target.value)}
            placeholder="cd C:\ &amp;&amp; dir"
            className="w-full rounded-xl border border-border bg-cardhover px-3 py-2.5 font-mono text-xs text-foreground outline-none focus:border-primary"
          />
          <span className="mt-1 block text-[10px] text-muted-foreground">
            Clicking No just closes the dialog — nothing runs.
          </span>
        </label>
      )}

      <button
        disabled={busy || !target || !content.trim()}
        onClick={() => void (mode === "direct" ? sendDirect() : sendQuestion())}
        className="ios-btn flex items-center gap-2 rounded-xl bg-warning px-5 py-2.5 text-sm font-bold text-background disabled:opacity-40"
      >
        {waiting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        {waiting ? `Waiting on ${target}…` : `Send to ${target || "device"}`}
      </button>

      {result && (
        <div
          className={`mt-4 rounded-xl border p-3 text-xs ${
            result.answer === "Yes"
              ? "border-primary/30 bg-primary/10 text-primary"
              : "border-border bg-cardhover text-foreground"
          }`}
        >
          <span className="font-bold">{target} clicked: {result.answer}</span>
          {result.output && <p className="mt-1.5 whitespace-pre-wrap font-mono text-[11px] opacity-80">{result.output}</p>}
        </div>
      )}

      {note && <p className="mt-3 font-mono text-xs text-muted-foreground">{note}</p>}
    </div>
  );
}
