import { useEffect, useRef, useState } from "react";
import { MousePointer2 } from "lucide-react";
import { sendControl, type Session } from "@/lib/linkClient";

/**
 * Live remote cursor control — direct tap-to-move-and-click, not the
 * record/replay approach this was adapted from. Every action is one round
 * trip through the device_rpc queue (agent polls every ~2s, then a fresh
 * powershell.exe takes ~100-300ms to start), so this behaves like tapping a
 * touchpad to place the cursor and click, not smooth 1:1 mouse tracking —
 * there's no way to get that over the current polling transport.
 */
export function CursorTab({ session, target }: { session: Session; target: string }) {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const scrollThrottle = useRef(0);

  useEffect(() => {
    setSize(null);
    setLastPoint(null);
    if (!target) return;
    (async () => {
      try {
        const r = await sendControl(session, target, "cursorInfo");
        const result = r.result as { width: number; height: number } | undefined;
        setSize({ width: result?.width || 1920, height: result?.height || 1080 });
      } catch (e) {
        setNote(`Could not read screen size: ${(e as Error).message}`);
      }
    })();
  }, [target, session]);

  function toRemotePoint(clientX: number, clientY: number) {
    const el = surfaceRef.current;
    if (!el || !size) return null;
    const rect = el.getBoundingClientRect();
    const fx = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const fy = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
    return { x: Math.round(fx * size.width), y: Math.round(fy * size.height) };
  }

  async function clickAt(clientX: number, clientY: number, button: "left" | "right") {
    const point = toRemotePoint(clientX, clientY);
    if (!point || !target) return;
    setLastPoint(point);
    setBusy(true);
    try {
      await sendControl(session, target, "cursorClick", { x: point.x, y: point.y, button });
    } catch (e) {
      setNote(`Failed: ${(e as Error).message}`);
    }
    setBusy(false);
  }

  async function clickLast(button: "left" | "right") {
    if (!lastPoint || !target) return;
    setBusy(true);
    try {
      await sendControl(session, target, "cursorClick", { x: lastPoint.x, y: lastPoint.y, button });
    } catch (e) {
      setNote(`Failed: ${(e as Error).message}`);
    }
    setBusy(false);
  }

  function onWheel(e: React.WheelEvent) {
    if (!target) return;
    const now = Date.now();
    if (now - scrollThrottle.current < 200) return; // avoid flooding the queue
    scrollThrottle.current = now;
    void sendControl(session, target, "cursorScroll", { amount: e.deltaY > 0 ? -120 : 120, horizontal: false }).catch(
      (err) => setNote(`Failed: ${(err as Error).message}`),
    );
  }

  return (
    <div className="rounded-[20px] border border-border bg-card p-6 md:p-8">
      <h3 className="text-lg font-bold text-foreground">Cursor</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        {target ? `Tap anywhere below to move & click on ${target}.` : "Select one PC first."}
      </p>

      <div
        ref={surfaceRef}
        onClick={(e) => void clickAt(e.clientX, e.clientY, "left")}
        onContextMenu={(e) => {
          e.preventDefault();
          void clickAt(e.clientX, e.clientY, "right");
        }}
        onWheel={onWheel}
        onTouchEnd={(e) => {
          const t = e.changedTouches[0];
          if (t) void clickAt(t.clientX, t.clientY, "left");
        }}
        className="relative mt-5 flex aspect-video w-full select-none items-center justify-center rounded-2xl border-2 border-dashed border-border bg-cardhover/40 text-muted-foreground"
      >
        {!target ? (
          <span className="text-xs">No device selected</span>
        ) : !size ? (
          <span className="text-xs">Reading screen size…</span>
        ) : (
          <>
            <MousePointer2 className="size-6 opacity-30" />
            {lastPoint && (
              <span className="absolute bottom-2 right-3 font-mono text-[10px] text-muted-foreground/70">
                last: {lastPoint.x}, {lastPoint.y}
              </span>
            )}
          </>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          disabled={busy || !lastPoint}
          onClick={() => void clickLast("left")}
          className="ios-btn rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-40"
        >
          Left click
        </button>
        <button
          disabled={busy || !lastPoint}
          onClick={() => void clickLast("right")}
          className="ios-btn rounded-xl border border-border bg-cardhover py-3 text-sm font-semibold text-foreground disabled:opacity-40"
        >
          Right click
        </button>
      </div>
      <p className="mt-3 text-center text-[11px] text-muted-foreground">
        Scroll (mouse wheel) works inside the box above too — on touch devices, use two fingers.
      </p>

      {note && <p className="mt-4 font-mono text-xs text-muted-foreground">{note}</p>}
    </div>
  );
}
