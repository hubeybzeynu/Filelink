import { useEffect, useRef, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { remoteCall, sendControl, type Session } from "@/lib/linkClient";

/**
 * Live remote cursor control over the shared screen. Every action here is
 * still one round trip through the device_rpc queue — the agent checks for
 * new commands every ~2s, and a fresh powershell.exe takes ~100-300ms to
 * start — so dragging feels like directing a cursor with real lag, not
 * smooth 1:1 tracking. Move events are throttled specifically so a drag
 * doesn't flood that queue with more commands than the agent could ever
 * keep up with.
 */
export function CursorTab({ session, target }: { session: Session; target: string }) {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const moveThrottle = useRef(0);
  const scrollThrottle = useRef(0);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const dragMoved = useRef(false);
  const screenTimer = useRef<number | null>(null);

  useEffect(() => {
    setSize(null);
    setLastPoint(null);
    setImage(null);
    setLive(false);
    if (screenTimer.current) window.clearInterval(screenTimer.current);
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
    return () => {
      if (screenTimer.current) window.clearInterval(screenTimer.current);
    };
  }, [target, session]);

  async function captureFrame() {
    if (!target) return;
    try {
      const r = await remoteCall<{ image?: string; error?: string }>(session, target, "screenshot", { preview: true });
      if (r.error) throw new Error(r.error);
      if (r.image) setImage(r.image.startsWith("data:") ? r.image : `data:image/jpeg;base64,${r.image}`);
    } catch (e) {
      setNote(`Screen preview failed: ${(e as Error).message}`);
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
    void captureFrame();
    // Same 2s cadence as Display — the agent's own poll interval means
    // faster wouldn't actually deliver newer frames anyway.
    screenTimer.current = window.setInterval(() => void captureFrame(), 2000);
  }

  function toRemotePoint(clientX: number, clientY: number) {
    const el = surfaceRef.current;
    if (!el || !size) return null;
    const rect = el.getBoundingClientRect();
    const fx = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const fy = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
    return { x: Math.round(fx * size.width), y: Math.round(fy * size.height) };
  }

  function sendMove(point: { x: number; y: number }, force = false) {
    if (!target) return;
    const now = Date.now();
    if (!force && now - moveThrottle.current < 250) return;
    moveThrottle.current = now;
    setLastPoint(point);
    void sendControl(session, target, "cursorMove", { x: point.x, y: point.y }).catch((e) =>
      setNote(`Failed: ${(e as Error).message}`),
    );
  }

  async function clickAt(point: { x: number; y: number }, button: "left" | "right") {
    if (!target) return;
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

  function onPointerDown(clientX: number, clientY: number) {
    const point = toRemotePoint(clientX, clientY);
    if (!point) return;
    dragStart.current = point;
    dragMoved.current = false;
  }

  function onPointerMove(clientX: number, clientY: number) {
    if (!dragStart.current) return;
    const point = toRemotePoint(clientX, clientY);
    if (!point) return;
    if (Math.abs(point.x - dragStart.current.x) > 3 || Math.abs(point.y - dragStart.current.y) > 3) {
      dragMoved.current = true;
    }
    sendMove(point);
  }

  function onPointerUp(clientX: number, clientY: number) {
    const point = toRemotePoint(clientX, clientY);
    dragStart.current = null;
    if (!point) return;
    if (dragMoved.current) {
      // Dragged — make sure the final position lands even if throttled.
      sendMove(point, true);
    } else {
      // Tapped without dragging — treat as a click.
      void clickAt(point, "left");
    }
  }

  function onWheel(e: React.WheelEvent) {
    if (!target) return;
    const now = Date.now();
    if (now - scrollThrottle.current < 200) return;
    scrollThrottle.current = now;
    void sendControl(session, target, "cursorScroll", { amount: e.deltaY > 0 ? -120 : 120, horizontal: false }).catch(
      (err) => setNote(`Failed: ${(err as Error).message}`),
    );
  }

  return (
    <div className="rounded-[20px] border border-border bg-card p-6 md:p-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-foreground">Cursor</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {target ? `Drag to move, tap to click on ${target}.` : "Select one PC first."}
          </p>
        </div>
        <button
          onClick={toggleLive}
          disabled={!target}
          className={`ios-btn flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold disabled:opacity-40 ${
            live ? "border-primary bg-primary/15 text-primary" : "border-border bg-cardhover text-foreground"
          }`}
        >
          <RefreshCw className={`size-3.5 ${live ? "animate-spin" : ""}`} />
          {live ? "Live" : "Show screen"}
        </button>
      </div>

      <div
        ref={surfaceRef}
        onMouseDown={(e) => onPointerDown(e.clientX, e.clientY)}
        onMouseMove={(e) => e.buttons === 1 && onPointerMove(e.clientX, e.clientY)}
        onMouseUp={(e) => onPointerUp(e.clientX, e.clientY)}
        onContextMenu={(e) => {
          e.preventDefault();
          const point = toRemotePoint(e.clientX, e.clientY);
          if (point) void clickAt(point, "right");
        }}
        onWheel={onWheel}
        onTouchStart={(e) => {
          const t = e.touches[0];
          if (t) onPointerDown(t.clientX, t.clientY);
        }}
        onTouchMove={(e) => {
          const t = e.touches[0];
          if (t) onPointerMove(t.clientX, t.clientY);
        }}
        onTouchEnd={(e) => {
          const t = e.changedTouches[0];
          if (t) onPointerUp(t.clientX, t.clientY);
        }}
        className="relative mt-5 flex aspect-video w-full select-none touch-none items-center justify-center overflow-hidden rounded-2xl border-2 border-border bg-cardhover/40 text-muted-foreground"
      >
        {!target ? (
          <span className="text-xs">No device selected</span>
        ) : !size ? (
          <Loader2 className="size-6 animate-spin opacity-40" />
        ) : (
          <>
            {image ? (
              <img src={image} alt="Live screen" className="pointer-events-none h-full w-full object-contain" draggable={false} />
            ) : (
              <span className="text-xs">Tap "Show screen" to see what you're clicking on</span>
            )}
            {lastPoint && (
              <span className="pointer-events-none absolute bottom-2 right-3 rounded bg-black/50 px-1.5 py-0.5 font-mono text-[10px] text-white">
                {lastPoint.x}, {lastPoint.y}
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
        Scroll works with your mouse wheel over the box above.
      </p>

      {note && <p className="mt-4 font-mono text-xs text-muted-foreground">{note}</p>}
    </div>
  );
}
