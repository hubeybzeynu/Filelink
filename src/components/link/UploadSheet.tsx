import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { humanSize } from "@/lib/linkClient";

export function UploadSheet({
  open,
  onClose,
  onUpload,
  destination,
}: {
  open: boolean;
  onClose: () => void;
  onUpload: (files: File[]) => void;
  destination: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [over, setOver] = useState(false);

  if (!open) return null;

  function close() {
    setFiles([]);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-black/60 backdrop-blur-sm md:items-center"
      onClick={close}
    >
      <div
        className="animate-sheet-up flex w-full flex-col rounded-t-[36px] border border-border bg-card p-6 pb-10 shadow-terminal md:max-w-lg md:rounded-[28px] md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-muted-foreground/30 md:hidden" />
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-primary/20 text-primary">
              <Upload className="size-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Upload File</h3>
              <p className="font-mono text-[11px] text-muted-foreground">to {destination}</p>
            </div>
          </div>
          <button
            onClick={close}
            aria-label="Close"
            className="ios-btn grid size-8 place-items-center rounded-full bg-border/60 text-muted-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            setFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
          }}
          className={`ios-card-hover mb-6 cursor-pointer rounded-[20px] border-2 border-dashed p-10 text-center transition-colors ${
            over ? "border-primary bg-primary/10" : "border-border/80 bg-cardhover/40 hover:border-primary/50"
          }`}
        >
          <Upload className="mx-auto mb-3 size-10 text-muted-foreground" strokeWidth={1.5} />
          <p className="text-sm font-medium text-foreground md:text-base">
            Tap to browse files or drop here
          </p>
          <p className="mt-1.5 font-mono text-xs text-muted-foreground">
            Multiple files supported
          </p>
        </div>

        {files.length > 0 && (
          <div className="no-scrollbar mb-5 max-h-40 space-y-2 overflow-y-auto">
            {files.map((f, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-cardhover/60 px-3 py-2"
              >
                <span className="min-w-0 truncate font-mono text-xs text-foreground">{f.name}</span>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="font-mono text-[11px] text-muted-foreground">{humanSize(f.size)}</span>
                  <button
                    onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                    aria-label={`Remove ${f.name}`}
                    className="grid size-5 place-items-center rounded-full text-muted-foreground hover:bg-border hover:text-foreground"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={close}
            className="ios-btn flex-1 rounded-xl bg-cardhover py-3.5 text-xs font-semibold text-foreground"
          >
            Cancel
          </button>
          <button
            disabled={files.length === 0}
            onClick={() => {
              onUpload(files);
              setFiles([]);
              onClose();
            }}
            className="ios-btn flex-1 rounded-xl bg-primary py-3.5 text-xs font-semibold text-primary-foreground disabled:opacity-40"
          >
            Upload{files.length > 0 ? ` (${files.length})` : ""}
          </button>
        </div>

        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => setFiles((prev) => [...prev, ...Array.from(e.target.files ?? [])])}
        />
      </div>
    </div>
  );
}
