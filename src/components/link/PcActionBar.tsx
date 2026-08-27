import { useState } from "react";
import { Copy, MoreHorizontal, Send, Share2, Upload } from "lucide-react";
import type { Session } from "@/lib/linkClient";

export function PcActionBar({
  session,
  onSend,
  onCopy,
  onShare,
  onUpload,
}: {
  session: Session;
  onSend: () => void;
  onCopy: () => void;
  onShare: () => void;
  onUpload: () => void;
}) {
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onSend}
        className="flex h-10 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        <Send className="size-4" /> Send
      </button>
      <button
        onClick={onCopy}
        className="hidden h-10 items-center gap-1.5 rounded-md border border-border px-3 text-xs text-foreground transition-colors hover:border-primary hover:text-primary sm:flex"
      >
        <Copy className="size-4" /> Copy
      </button>
      <button
        onClick={onShare}
        className="hidden h-10 items-center gap-1.5 rounded-md border border-border px-3 text-xs text-foreground transition-colors hover:border-primary hover:text-primary md:flex"
      >
        <Share2 className="size-4" /> Share
      </button>
      <button
        onClick={onUpload}
        className="flex h-10 items-center gap-1.5 rounded-md border border-border px-3 text-xs text-foreground transition-colors hover:border-primary hover:text-primary"
      >
        <Upload className="size-4" /> Upload
      </button>
      <div className="relative">
        <button
          onClick={() => setMoreOpen((v) => !v)}
          className="grid size-10 place-items-center rounded-md border border-border text-muted-foreground transition-colors hover:text-foreground"
          aria-label="More actions"
        >
          <MoreHorizontal className="size-4" />
        </button>
        {moreOpen && (
          <div className="absolute right-0 top-full z-20 mt-2 w-48 rounded-md border border-border bg-card p-1 shadow-terminal">
            <button
              onClick={() => {
                onCopy();
                setMoreOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-foreground hover:bg-accent sm:hidden"
            >
              <Copy className="size-4" /> Copy
            </button>
            <button
              onClick={() => {
                onShare();
                setMoreOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-foreground hover:bg-accent md:hidden"
            >
              <Share2 className="size-4" /> Share
            </button>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(`${window.location.origin}/j/${session.roomCode}`);
                setMoreOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-foreground hover:bg-accent"
            >
              <Share2 className="size-4" /> Copy room link
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
