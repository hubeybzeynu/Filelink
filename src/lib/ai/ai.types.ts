// AI system type definitions
// Shared between client and server (server-only secrets excluded)

export type AIProvider = "anthropic" | "openai";

export type AITaskStatus =
  | "queued"
  | "waiting_offline"
  | "planning"
  | "running"
  | "waiting_confirmation"
  | "failed"
  | "completed"
  | "cancelled";

export type AIStepStatus =
  | "pending"
  | "running"
  | "success"
  | "warning"
  | "error"
  | "offline"
  | "waiting"
  | "needs_confirmation";

export type AIStepType =
  | "command"
  | "file_read"
  | "file_write"
  | "directory_create"
  | "file_transfer"
  | "screenshot"
  | "system_info"
  | "process_info"
  | "analysis"
  | "confirmation"
  | "artifact_generation";

export type AIRiskLevel = "safe" | "low" | "medium" | "high" | "critical";

export interface AITask {
  id: string;
  room_id: string;
  user_id: string | null;
  created_at: string;
  updated_at: string;
  title: string;
  user_prompt: string;
  target_devices: string[]; // device IDs or ["all"]
  status: AITaskStatus;
  priority: number;
  requires_confirmation: boolean;
  confirmation_state: Record<string, unknown> | null;
  plan_json: Record<string, unknown> | null;
  context_json: Record<string, unknown> | null;
  result_json: Record<string, unknown> | null;
  error: string | null;
  completed_at: string | null;
}

export interface AITaskStep {
  id: string;
  task_id: string;
  device_id: string | null;
  device_name: string | null;
  type: AIStepType;
  title: string;
  status: AIStepStatus;
  command: string | null;
  working_directory: string | null;
  input: Record<string, unknown> | null;
  output: string | null;
  error: string | null;
  diff: string | null;
  risk_level: AIRiskLevel;
  started_at: string | null;
  completed_at: string | null;
}

export interface AIMessage {
  id: string;
  task_id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  tool_name: string | null;
  tool_call: Record<string, unknown> | null;
  created_at: string;
}

export interface AIArtifact {
  id: string;
  task_id: string;
  filename: string;
  path: string | null;
  mime_type: string;
  size: number;
  storage_path: string;
  target_device: string | null;
  destination: string | null;
  status: "generating" | "ready" | "transferring" | "delivered" | "failed";
  created_at: string;
}

export interface AIConfirmation {
  id: string;
  task_id: string;
  step_id: string | null;
  question: string;
  risk_level: AIRiskLevel;
  status: "pending" | "approved" | "rejected";
  details: Record<string, unknown> | null;
  created_at: string;
  answered_at: string | null;
}

// Tool definitions for AI
export interface AIToolDefinition {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

// Server-side execution context
export interface AIExecutionContext {
  taskId: string;
  roomId: string;
  deviceId?: string;
  conversationHistory: AIMessage[];
}
