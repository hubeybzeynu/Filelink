// Rich results the AI shows in chat: file list with icons, tasks table
// (Apps / Browsers / Windows / Background), screenshot viewer, and the two
// "waiting for you" cards — a choice list and an approval card.
//
// Everything here is presentational. Answering a card just calls onAnswer
// with the text that is sent back to the AI as the user's next message.

import { useMemo, useState } from "react";
import {
  AppWindow,
  Check,
  ChevronDown,
  ChevronRight,
  Cog,
  Download,
  ExternalLink,
  Globe,
  ImageIcon,
  Maximize2,
  Monitor,
  ShieldAlert,
  User,
  X,
} from "lucide-react";
import {
  APPROVAL_PREFIX,
  CANCEL_PREFIX,
  type AIChoiceOption,
  type AIFileEntry,
  type AIUiPayload,
} from "@/lib/ai/ai.ui";
import {
  CATEGORY_LABELS,
  classifyProcesses,
  formatBytes,
  type ProcessCategory,
  type ProcessGroup,
  type RawProcess,
} from "@/lib/processGroups";
import { humanSize } from "@/lib/linkClient";
import { FileTypeIcon } from "./fileIcons";

type Payload<K extends AIUiPayload["kind"]> = Extract<AIUiPayload, { kind: K }>;

/* ───────────────────────────── dispatcher ───────────────────────────── */

export function AIRichResult({
  payload,
  interactive,
  onAnswer,
}: {
  payload: AIUiPayload;
  /** Only the latest question card can be answered. */
  interactive: boolean;
  onAnswer: (text: string) => void;
}) {
  switch (payload.kind) {
    case "files":
      return <FilesCard p={payload} />;
    case "tasks":
      return <TasksCard p={payload} />;
    case "image":
      return <ImageCard p={payload} />;
    case "choices":
      return <ChoicesCard p={payload} interactive={interactive} onAnswer={onAnswer} />;
    case "confirm":
      return <ConfirmCard p={payload} interactive={interactive} onAnswer={onAnswer} />;
    default:
      return null;
  }
}

function CardShell({
  icon,
  title,
  subtitle,
  right,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-2.5 border-b border-border/60 px-3.5 py-2.5">
        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-tight">{title}</p>
          {subtitle && (
            <p className="truncate font-mono text-[11px] leading-tight text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

/* ───────────────────────────── file list ───────────────────────────── */

function FilesCard({ p }: { p: Payload<"files"> }) {
  const [showAll, setShowAll] = useState(false);
  const LIMIT = 40;
  const rows = useMemo(
    () => [
      ...p.folders.map((f) => ({ ...f, folder: true })),
      ...p.files.map((f) => ({ ...f, folder: false })),
    ],
    [p.folders, p.files],
  );
  const visible = showAll ? rows : rows.slice(0, LIMIT);
  // Same name in different folders? Always show the path then, so the person
  // can tell them apart (this is the "same name, different path" case).
  const dupNames = useMemo(() => {
    const seen = new Map<string, number>();
    for (const r of rows) seen.set(r.name.toLowerCase(), (seen.get(r.name.toLowerCase()) ?? 0) + 1);
    return new Set([...seen].filter(([, n]) => n > 1).map(([k]) => k));
  }, [rows]);
  const showPaths = p.mode === "search";

  return (
    <CardShell
      icon={<Monitor className="size-4" />}
      title={p.mode === "search" ? `Results for “${p.query ?? ""}”` : p.path || "/"}
      subtitle={`${p.device} · ${p.folders.length} folder${p.folders.length === 1 ? "" : "s"}, ${p.files.length} file${p.files.length === 1 ? "" : "s"}`}
    >
      {rows.length === 0 ? (
        <p className="px-4 py-6 text-center text-xs text-muted-foreground">
          {p.mode === "search" ? "Nothing matched." : "This folder is empty."}
        </p>
      ) : (
        <ul className="max-h-80 divide-y divide-border/40 overflow-y-auto no-scrollbar">
          {visible.map((r) => (
            <li key={r.path} className="flex items-center gap-3 px-3.5 py-2">
              <FileTypeIcon name={r.name} kind={r.folder ? "folder" : "file"} className="size-5" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{r.name}</p>
                {(showPaths || dupNames.has(r.name.toLowerCase())) && (
                  <p className="break-all font-mono text-[10px] leading-snug text-muted-foreground">
                    {r.path}
                  </p>
                )}
              </div>
              {!r.folder && (r as AIFileEntry).size !== undefined && (
                <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                  {humanSize((r as AIFileEntry).size ?? 0)}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      {(rows.length > LIMIT || p.truncated) && (
        <div className="flex items-center justify-between border-t border-border/60 px-3.5 py-2 text-[11px] text-muted-foreground">
          <span>{p.truncated ? "Showing the first results only" : `${rows.length} items`}</span>
          {rows.length > LIMIT && (
            <button
              onClick={() => setShowAll((v) => !v)}
              className="font-semibold text-primary hover:underline"
            >
              {showAll ? "Show less" : `Show all ${rows.length}`}
            </button>
          )}
        </div>
      )}
    </CardShell>
  );
}

/* ───────────────────────────── tasks table ───────────────────────────── */

const CATEGORY_ICON: Record<ProcessCategory, React.ReactNode> = {
  apps: <AppWindow className="size-3.5" />,
  browsers: <Globe className="size-3.5" />,
  windows: <Cog className="size-3.5" />,
  background: <User className="size-3.5" />,
};

function ProcIcon({ icon, label }: { icon?: string; label: string }) {
  if (icon) {
    return <img src={icon} alt="" className="size-5 shrink-0 rounded object-contain" />;
  }
  return (
    <span className="grid size-5 shrink-0 place-items-center rounded border border-border bg-cardhover text-[9px] font-bold uppercase text-muted-foreground">
      {label.slice(0, 1)}
    </span>
  );
}

function Stat({ cpu, ram }: { cpu: number; ram: number }) {
  return (
    <>
      <td className="w-14 px-2 py-1.5 text-right font-mono text-[11px] tabular-nums text-muted-foreground">
        {cpu >= 0.1 ? `${cpu.toFixed(cpu >= 10 ? 0 : 1)}%` : "0%"}
      </td>
      <td className="w-20 px-2 py-1.5 text-right font-mono text-[11px] tabular-nums">
        {formatBytes(ram)}
      </td>
    </>
  );
}

function GroupRow({ g }: { g: ProcessGroup }) {
  const [open, setOpen] = useState(false);
  const multi = g.count > 1;
  return (
    <>
      <tr
        className={`border-t border-border/30 ${multi ? "cursor-pointer hover:bg-cardhover/60" : ""}`}
        onClick={() => multi && setOpen((v) => !v)}
      >
        <td className="px-3 py-1.5">
          <div className="flex min-w-0 items-center gap-2">
            {multi ? (
              open ? (
                <ChevronDown className="size-3 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronRight className="size-3 shrink-0 text-muted-foreground" />
              )
            ) : (
              <span className="size-3 shrink-0" />
            )}
            <ProcIcon icon={g.icon} label={g.label} />
            <div className="min-w-0">
              <p className="truncate text-xs font-medium">
                {g.label}
                {multi && (
                  <span className="ml-1.5 font-mono text-[10px] font-normal text-muted-foreground">
                    ({g.count})
                  </span>
                )}
              </p>
              {g.windowTitle && (
                <p className="truncate text-[10px] text-muted-foreground">{g.windowTitle}</p>
              )}
            </div>
          </div>
        </td>
        <Stat cpu={g.cpu} ram={g.ram} />
      </tr>
      {open &&
        g.processes.map((p) => (
          <tr key={p.pid} className="bg-background/40">
            <td className="py-1 pl-12 pr-2">
              <p className="truncate font-mono text-[10px] text-muted-foreground">
                {p.role ? `${p.role} · ` : ""}PID {p.pid}
              </p>
            </td>
            <Stat cpu={p.cpu ?? 0} ram={p.ram ?? 0} />
          </tr>
        ))}
    </>
  );
}

function BrowserRows({ p }: { p: Payload<"tasks"> }) {
  const classified = useMemo(() => classifyProcesses(p.processes), [p.processes]);
  const [openApp, setOpenApp] = useState<Set<string>>(new Set());
  const toggle = (k: string) =>
    setOpenApp((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  return (
    <>
      {classified.browsers.map((b) => (
        <BrowserApp key={b.key} b={b} open={openApp.has(b.key)} onToggle={() => toggle(b.key)} />
      ))}
    </>
  );
}

function BrowserApp({
  b,
  open,
  onToggle,
}: {
  b: ReturnType<typeof classifyProcesses>["browsers"][number];
  open: boolean;
  onToggle: () => void;
}) {
  const [openProfile, setOpenProfile] = useState<Set<string>>(new Set());
  return (
    <>
      <tr className="cursor-pointer border-t border-border/30 hover:bg-cardhover/60" onClick={onToggle}>
        <td className="px-3 py-1.5">
          <div className="flex min-w-0 items-center gap-2">
            {open ? (
              <ChevronDown className="size-3 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="size-3 shrink-0 text-muted-foreground" />
            )}
            <ProcIcon icon={b.icon} label={b.label} />
            <p className="truncate text-xs font-medium">
              {b.label}
              <span className="ml-1.5 font-mono text-[10px] font-normal text-muted-foreground">
                ({b.profiles.length} profile{b.profiles.length === 1 ? "" : "s"} · {b.count})
              </span>
            </p>
          </div>
        </td>
        <Stat cpu={b.cpu} ram={b.ram} />
      </tr>
      {open &&
        b.profiles.map((prof) => {
          const pOpen = openProfile.has(prof.key);
          return (
            <ProfileRows
              key={prof.key}
              prof={prof}
              open={pOpen}
              onToggle={() =>
                setOpenProfile((prev) => {
                  const next = new Set(prev);
                  if (next.has(prof.key)) next.delete(prof.key);
                  else next.add(prof.key);
                  return next;
                })
              }
            />
          );
        })}
    </>
  );
}

function ProfileRows({
  prof,
  open,
  onToggle,
}: {
  prof: ReturnType<typeof classifyProcesses>["browsers"][number]["profiles"][number];
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr className="cursor-pointer bg-background/40 hover:bg-cardhover/60" onClick={onToggle}>
        <td className="py-1.5 pl-8 pr-2">
          <div className="flex min-w-0 items-center gap-2">
            {open ? (
              <ChevronDown className="size-3 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="size-3 shrink-0 text-muted-foreground" />
            )}
            <User className="size-3.5 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="truncate text-xs">
                Profile: {prof.name}
                <span className="ml-1.5 font-mono text-[10px] text-muted-foreground">({prof.count})</span>
              </p>
              {prof.windowTitle && (
                <p className="truncate text-[10px] text-muted-foreground">{prof.windowTitle}</p>
              )}
            </div>
          </div>
        </td>
        <Stat cpu={prof.cpu} ram={prof.ram} />
      </tr>
      {open &&
        prof.processes.map((proc: RawProcess) => (
          <tr key={proc.pid} className="bg-background/60">
            <td className="py-1 pl-16 pr-2">
              <p className="truncate font-mono text-[10px] text-muted-foreground">
                {proc.role ? `${proc.role} · ` : ""}PID {proc.pid}
              </p>
            </td>
            <Stat cpu={proc.cpu ?? 0} ram={proc.ram ?? 0} />
          </tr>
        ))}
    </>
  );
}

function TasksCard({ p }: { p: Payload<"tasks"> }) {
  const classified = useMemo(() => classifyProcesses(p.processes), [p.processes]);
  const sections: { key: ProcessCategory; count: number }[] = [
    { key: "apps", count: classified.apps.length },
    { key: "browsers", count: classified.browsers.length },
    { key: "windows", count: classified.windows.length },
    { key: "background", count: classified.background.length },
  ];
  const [collapsed, setCollapsed] = useState<Set<ProcessCategory>>(
    // Windows + background are long and rarely what you asked about.
    new Set<ProcessCategory>(["windows", "background"]),
  );
  const toggle = (k: ProcessCategory) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  const totalRam = p.processes.reduce((s, x) => s + (x.ram ?? 0), 0);

  return (
    <CardShell
      icon={<AppWindow className="size-4" />}
      title="Running tasks"
      subtitle={`${p.device} · ${classified.total} processes · ${formatBytes(totalRam)} used`}
    >
      <div className="max-h-[26rem] overflow-y-auto no-scrollbar">
        <table className="w-full table-fixed border-collapse text-left">
          <thead className="sticky top-0 z-10 bg-card">
            <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="px-3 py-1.5 font-semibold">Name</th>
              <th className="w-14 px-2 py-1.5 text-right font-semibold">CPU</th>
              <th className="w-20 px-2 py-1.5 text-right font-semibold">Memory</th>
            </tr>
          </thead>
          <tbody>
            {sections.map(({ key, count }) => {
              if (count === 0) return null;
              const isCollapsed = collapsed.has(key);
              return (
                <SectionRows
                  key={key}
                  category={key}
                  count={count}
                  collapsed={isCollapsed}
                  onToggle={() => toggle(key)}
                >
                  {!isCollapsed &&
                    (key === "browsers" ? (
                      <BrowserRows p={p} />
                    ) : (
                      classified[key].map((g) => <GroupRow key={g.key} g={g} />)
                    ))}
                </SectionRows>
              );
            })}
          </tbody>
        </table>
      </div>
    </CardShell>
  );
}

function SectionRows({
  category,
  count,
  collapsed,
  onToggle,
  children,
}: {
  category: ProcessCategory;
  count: number;
  collapsed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      <tr className="cursor-pointer bg-cardhover/50 hover:bg-cardhover" onClick={onToggle}>
        <td colSpan={3} className="px-3 py-1.5">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {collapsed ? <ChevronRight className="size-3" /> : <ChevronDown className="size-3" />}
            {CATEGORY_ICON[category]}
            {CATEGORY_LABELS[category]}
            <span className="font-mono font-normal">({count})</span>
          </div>
        </td>
      </tr>
      {children}
    </>
  );
}

/* ───────────────────────────── screenshot ───────────────────────────── */

function ImageCard({ p }: { p: Payload<"image"> }) {
  const [full, setFull] = useState(false);
  const time = p.takenAt ? new Date(p.takenAt).toLocaleTimeString() : "";
  const ext = p.mime.includes("png") ? "png" : "jpg";

  if (!p.src) {
    return (
      <CardShell icon={<ImageIcon className="size-4" />} title={p.caption} subtitle={time}>
        <p className="px-4 py-6 text-center text-xs text-muted-foreground">
          Screenshots aren’t kept in saved chats. Ask again to capture a new one.
        </p>
      </CardShell>
    );
  }

  return (
    <>
      <CardShell
        icon={<ImageIcon className="size-4" />}
        title={p.caption}
        subtitle={time}
        right={
          <div className="flex items-center gap-1">
            <a
              href={p.src}
              download={`screenshot-${p.device.replace(/\W+/g, "_")}-${p.takenAt ?? Date.now()}.${ext}`}
              aria-label="Download screenshot"
              className="ios-btn grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-cardhover hover:text-foreground"
            >
              <Download className="size-4" />
            </a>
            <button
              onClick={() => setFull(true)}
              aria-label="View full screen"
              className="ios-btn grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-cardhover hover:text-foreground"
            >
              <Maximize2 className="size-4" />
            </button>
          </div>
        }
      >
        <button onClick={() => setFull(true)} className="block w-full bg-black">
          <img src={p.src} alt={p.caption} className="mx-auto max-h-80 w-full object-contain" />
        </button>
      </CardShell>

      {full && (
        <div
          className="fixed inset-0 z-[90] flex flex-col bg-black/95"
          onClick={() => setFull(false)}
          role="dialog"
          aria-label={p.caption}
        >
          <div className="flex items-center justify-between gap-3 p-3 text-white">
            <p className="truncate text-sm font-medium">{p.caption}</p>
            <div className="flex items-center gap-2">
              <a
                href={p.src}
                download={`screenshot-${Date.now()}.${ext}`}
                onClick={(e) => e.stopPropagation()}
                className="ios-btn flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/20"
              >
                <ExternalLink className="size-3.5" /> Save
              </a>
              <button
                onClick={() => setFull(false)}
                aria-label="Close"
                className="ios-btn grid size-8 place-items-center rounded-lg bg-white/10 hover:bg-white/20"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-2">
            <img
              src={p.src}
              alt={p.caption}
              onClick={(e) => e.stopPropagation()}
              className="max-h-full max-w-full object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}

/* ───────────────────────────── choices ───────────────────────────── */

function ChoicesCard({
  p,
  interactive,
  onAnswer,
}: {
  p: Payload<"choices">;
  interactive: boolean;
  onAnswer: (text: string) => void;
}) {
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [other, setOther] = useState("");
  const done = !interactive;

  function toggle(o: AIChoiceOption) {
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
    const chosen = p.options.filter((o) => picked.has(o.id));
    const text = [...chosen.map((o) => o.value), ...(other.trim() ? [other.trim()] : [])].join("\n");
    if (text) onAnswer(text);
  }

  const canSubmit = picked.size > 0 || other.trim().length > 0;

  return (
    <div
      className={`w-full overflow-hidden rounded-2xl border bg-card shadow-sm ${
        done ? "border-border/60 opacity-70" : "border-primary/40"
      }`}
    >
      <div className="border-b border-border/60 px-3.5 py-2.5">
        <p className="text-sm font-semibold">{p.question}</p>
        <p className="text-[11px] text-muted-foreground">
          {done ? "Answered" : p.multi ? "Pick one or more" : "Pick one"}
        </p>
      </div>
      <ul className="max-h-80 divide-y divide-border/40 overflow-y-auto no-scrollbar">
        {p.options.map((o) => {
          const on = picked.has(o.id);
          return (
            <li key={o.id}>
              <button
                disabled={done}
                onClick={() => toggle(o)}
                className={`flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors ${
                  on ? "bg-primary/10" : done ? "" : "hover:bg-cardhover/60"
                }`}
              >
                <FileTypeIcon name={o.label} kind={o.kind ?? "file"} className="size-5" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{o.label}</span>
                  {o.description && (
                    <span className="block break-all font-mono text-[10px] leading-snug text-muted-foreground">
                      {o.description}
                    </span>
                  )}
                </span>
                <span
                  className={`grid size-5 shrink-0 place-items-center border ${
                    p.multi ? "rounded-md" : "rounded-full"
                  } ${on ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}
                >
                  {on && <Check className="size-3" />}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {!done && (
        <div className="space-y-2 border-t border-border/60 p-3">
          {p.allowOther && (
            <input
              value={other}
              onChange={(e) => setOther(e.target.value)}
              placeholder="Something else…"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          )}
          <button
            onClick={submit}
            disabled={!canSubmit}
            className="ios-btn w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-40"
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────────── approval ───────────────────────────── */

const RISK_STYLE: Record<string, string> = {
  safe: "border-accent/40 bg-accent/5",
  low: "border-primary/40 bg-primary/5",
  medium: "border-warning/50 bg-warning/5",
  high: "border-destructive/50 bg-destructive/5",
  critical: "border-destructive bg-destructive/10",
};

function ConfirmCard({
  p,
  interactive,
  onAnswer,
}: {
  p: Payload<"confirm">;
  interactive: boolean;
  onAnswer: (text: string) => void;
}) {
  const details = p.details ? Object.entries(p.details) : [];
  return (
    <div
      className={`w-full overflow-hidden rounded-2xl border shadow-sm ${RISK_STYLE[p.risk] ?? RISK_STYLE.medium} ${
        interactive ? "" : "opacity-70"
      }`}
    >
      <div className="flex items-start gap-3 px-3.5 py-3">
        <ShieldAlert
          className={`mt-0.5 size-5 shrink-0 ${
            p.risk === "high" || p.risk === "critical" ? "text-destructive" : "text-warning"
          }`}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{p.question}</p>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            {p.risk} risk · needs your approval
          </p>
        </div>
      </div>
      {details.length > 0 && (
        <dl className="space-y-1 border-t border-border/50 px-3.5 py-2.5">
          {details.map(([k, v]) => (
            <div key={k} className="flex gap-2 text-xs">
              <dt className="w-16 shrink-0 text-muted-foreground">{k}</dt>
              <dd className="min-w-0 flex-1 break-all font-mono">{v}</dd>
            </div>
          ))}
        </dl>
      )}
      {interactive ? (
        <div className="flex gap-2 border-t border-border/50 p-3">
          <button
            onClick={() => onAnswer(`${APPROVAL_PREFIX} — go ahead: ${p.question}`)}
            className="ios-btn flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Approve
          </button>
          <button
            onClick={() => onAnswer(`${CANCEL_PREFIX} — do not do that.`)}
            className="ios-btn flex-1 rounded-xl border border-border bg-card py-2.5 text-sm font-semibold hover:bg-cardhover"
          >
            Cancel
          </button>
        </div>
      ) : (
        <p className="border-t border-border/50 px-3.5 py-2 text-[11px] text-muted-foreground">Answered</p>
      )}
    </div>
  );
}
