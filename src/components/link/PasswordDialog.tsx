import { useState } from "react";
import { Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { tryUnlock } from "@/lib/lock";

export function PasswordDialog({
  open,
  onOpenChange,
  reason,
  onUnlocked,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  reason: string;
  onUnlocked: () => void;
}) {
  const [value, setValue] = useState("");
  const [bad, setBad] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (tryUnlock(value)) {
      setValue("");
      setBad(false);
      onOpenChange(false);
      onUnlocked();
    } else {
      setBad(true);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="size-4 text-warning" /> Passcode needed
          </DialogTitle>
          <DialogDescription>{reason}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <input
            autoFocus
            type="password"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setBad(false);
            }}
            placeholder="passcode"
            className="h-11 w-full rounded-md border border-border bg-background px-3 font-mono text-sm text-foreground outline-none focus:border-primary"
          />
          {bad && <p className="font-mono text-xs text-destructive">Wrong passcode</p>}
          <button
            type="submit"
            className="h-11 w-full rounded-md bg-primary text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Unlock
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
