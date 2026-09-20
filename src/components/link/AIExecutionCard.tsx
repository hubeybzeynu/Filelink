// AI Execution Card Component
// Displays live action steps with collapsible details, streamed output, diffs, and confirmations

import { useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Code2,
  FileCode,
  FileText,
  Loader2,
  Terminal as TerminalIcon,
  XCircle,
} from "lucide-react";
import type { AITaskStep } from "@/lib/ai/ai.types";

interface AIExecutionCardProps {
  step: AITaskStep;
  onConfirm?: (approved: boolean) => void;
}

export function AIExecutionCard({ step, onConfirm }: AIExecutionCardProps) {
  // Default to collapsed (or expanded only while actively running)
  const [expanded, setExpanded] = useState(step.status === "running");

  const getStatusIcon = () => {
    switch (step.status) {
      case "running":
        return <Loader2 className="size-4 animate-spin text-primary" />;
      case "success":
        return <CheckCircle2 className="size-4 text-green-500" />;
      case "error":
        return <XCircle className="size-4 text-destructive" />;
      case "needs_confirmation":
        return <Clock className="size-4 text-amber-500" />;
      default:
        return <Clock className="size-4 text-muted-foreground" />;
    }
  };

  const getTypeIcon = () => {
    switch (step.type) {
      case "command":
        return <TerminalIcon className="size-3.5 text-primary" />;
      case "file_read":
      case "file_write":
        return <FileCode className="size-3.5 text-blue-400" />;
      case "artifact_generation":
        return <FileText className="size-3.5 text-purple-400" />;
      default:
        return <Code2 className="size-3.5 text-muted-foreground" />;
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card/60 overflow-hidden shadow-sm backdrop-blur">
      {/* Header / Summary */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-3 text-left hover:bg-cardhover/50 transition-colors"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {getStatusIcon()}
          <div className="flex items-center gap-1.5 min-w-0">
            {getTypeIcon()}
            <span className="text-xs font-medium truncate">{step.title}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {step.device_name && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-mono text-primary">
              {step.device_name}
            </span>
          )}
          {expanded ? (
            <ChevronDown className="size-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-border/50 p-3 space-y-3 bg-background/40">
          {/* Command display */}
          {step.command && (
            <div className="space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Command
              </span>
              <pre className="rounded-lg border border-border bg-card p-2.5 font-mono text-xs text-primary overflow-x-auto">
                {step.command}
              </pre>
            </div>
          )}

          {/* Diff view */}
          {step.diff && (
            <div className="space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                File Changes (Diff)
              </span>
              <pre className="rounded-lg border border-border bg-card p-2.5 font-mono text-xs overflow-x-auto text-muted-foreground">
                {step.diff}
              </pre>
            </div>
          )}

          {/* Output display */}
          {step.output && (
            <div className="space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Output
              </span>
              <pre className="max-h-48 rounded-lg border border-border bg-card p-2.5 font-mono text-xs overflow-y-auto no-scrollbar text-muted-foreground">
                {step.output}
              </pre>
            </div>
          )}

          {/* Error display */}
          {step.error && (
            <div className="space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-destructive">
                Error
              </span>
              <pre className="rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 font-mono text-xs text-destructive overflow-x-auto">
                {step.error}
              </pre>
            </div>
          )}

          {/* Confirmation buttons */}
          {step.status === "needs_confirmation" && onConfirm && (
            <div className="flex gap-2 pt-2 border-t border-border/50">
              <button
                onClick={() => onConfirm(true)}
                className="ios-btn flex-1 rounded-lg bg-primary py-1.5 text-xs font-semibold text-primary-foreground"
              >
                Yes, Proceed
              </button>
              <button
                onClick={() => onConfirm(false)}
                className="ios-btn flex-1 rounded-lg border border-border py-1.5 text-xs font-semibold hover:bg-cardhover"
              >
                No, Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
