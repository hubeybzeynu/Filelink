import { useEffect, useState } from "react";
import {
  SendHorizontal,
  FolderOpen,
  TerminalIcon,
  Sparkles,
  Power,
  Laptop,
  ChevronRight,
} from "lucide-react";
import type { UserSession } from "@/lib/linkClient";
import { PricingDialog } from "@/components/link/PricingDialog";

type Stage = "welcome" | "tour" | "plan";

const TOUR_STEPS = [
  {
    icon: FolderOpen,
    title: "Send files, PC to PC",
    body: "Drop a file in one room and it's on the other machine in seconds — no USB stick, no email to yourself.",
  },
  {
    icon: TerminalIcon,
    title: "Full remote terminal",
    body: "Run real commands on a connected PC from anywhere, with live streamed output.",
  },
  {
    icon: Sparkles,
    title: "An AI that can act",
    body: "Ask it to check disk space, grab a screenshot, or fix a broken file — it uses the same tools you do.",
  },
  {
    icon: Power,
    title: "Control Center",
    body: "Shut down, restart, or wake a machine on a schedule, right from your dashboard.",
  },
  {
    icon: Laptop,
    title: "Every device, one room",
    body: "Add as many PCs as your plan allows and switch between them instantly.",
  },
];

export function Onboarding({
  user,
  onUpdated,
  onFinished,
}: {
  user: UserSession;
  onUpdated: (user: UserSession) => void;
  onFinished: () => void;
}) {
  const [stage, setStage] = useState<Stage>("welcome");
  const [tourIndex, setTourIndex] = useState(0);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    // Mirrors the splash screen's entrance timing (see styles.css
    // `animate-logo`) so this feels like the same app, not a bolted-on
    // extra screen.
    const t = setTimeout(() => setEntered(true), 30);
    return () => clearTimeout(t);
  }, []);

  if (stage === "plan") {
    return (
      <PricingDialog
        open
        onClose={onFinished}
        user={user}
        onUpdated={(u) => {
          onUpdated(u);
          onFinished();
        }}
      />
    );
  }

  if (stage === "welcome") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div
          className="flex flex-col items-center text-center transition-all duration-700 ease-out"
          style={{
            opacity: entered ? 1 : 0,
            transform: entered ? "scale(1)" : "scale(0.85)",
            filter: entered ? "blur(0px)" : "blur(8px)",
          }}
        >
          <div className="relative">
            <div className="absolute -inset-5 animate-pulse rounded-full bg-primary/25 blur-2xl" />
            <div className="relative size-20 rounded-[22px] bg-gradient-to-tr from-primary via-blue-400 to-indigo-500 p-px shadow-2xl">
              <div className="grid size-full place-items-center rounded-[21px] bg-card">
                <SendHorizontal className="size-9 text-primary" />
              </div>
            </div>
          </div>
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-foreground">
            Welcome, {user.username}
          </h1>
          <p className="mt-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Your account is ready
          </p>
          <button
            onClick={() => setStage("tour")}
            className="ios-btn mt-8 flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30"
          >
            Let's take a look <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    );
  }

  // stage === "tour"
  const step = TOUR_STEPS[tourIndex];
  const Icon = step.icon;
  const isLast = tourIndex === TOUR_STEPS.length - 1;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div
        key={tourIndex}
        className="flex w-full max-w-sm flex-col items-center text-center"
        style={{ animation: "filelink-tour-in 0.4s cubic-bezier(0.16,1,0.3,1)" }}
      >
        <div className="grid size-16 place-items-center rounded-2xl border border-primary/30 bg-primary/15 text-primary">
          <Icon className="size-7" />
        </div>
        <h2 className="mt-5 text-xl font-bold text-foreground">{step.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>

        <div className="mt-6 flex items-center gap-1.5">
          {TOUR_STEPS.map((_, i) => (
            <span
              key={i}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === tourIndex ? "20px" : "6px",
                backgroundColor: i === tourIndex ? "var(--color-primary)" : "var(--color-border)",
              }}
            />
          ))}
        </div>

        <div className="mt-8 flex w-full gap-3">
          {tourIndex > 0 && (
            <button
              onClick={() => setTourIndex((i) => i - 1)}
              className="ios-btn flex-1 rounded-xl border border-border bg-card py-3 text-sm font-semibold text-foreground"
            >
              Back
            </button>
          )}
          <button
            onClick={() => (isLast ? setStage("plan") : setTourIndex((i) => i + 1))}
            className="ios-btn flex-1 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground"
          >
            {isLast ? "Choose a plan" : "Next"}
          </button>
        </div>
        {!isLast && (
          <button
            onClick={() => setStage("plan")}
            className="mt-4 text-xs text-muted-foreground hover:text-primary"
          >
            Skip to plans
          </button>
        )}
      </div>

      <style>{`
        @keyframes filelink-tour-in {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
