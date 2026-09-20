-- Migration: FileLink AI Tables
-- Adds persistent storage for AI tasks, steps, messages, artifacts, and confirmations

-- AI Tasks
CREATE TABLE IF NOT EXISTS ai_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID,
  device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  title TEXT NOT NULL,
  user_prompt TEXT NOT NULL,
  target_devices JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'waiting_offline', 'planning', 'running', 'waiting_confirmation', 'failed', 'completed', 'cancelled')),
  priority INTEGER NOT NULL DEFAULT 0,
  requires_confirmation BOOLEAN NOT NULL DEFAULT false,
  confirmation_state JSONB,
  cloud_workspace_path TEXT,
  plan_json JSONB,
  context_json JSONB,
  result_json JSONB,
  error TEXT,
  completed_at TIMESTAMPTZ
);

-- AI Task Steps (detailed execution log)
CREATE TABLE IF NOT EXISTS ai_task_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES ai_tasks(id) ON DELETE CASCADE,
  device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
  device_name TEXT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'success', 'warning', 'error', 'offline', 'waiting', 'needs_confirmation')),
  command TEXT,
  working_directory TEXT,
  input JSONB,
  output TEXT,
  error TEXT,
  diff TEXT,
  risk_level TEXT NOT NULL DEFAULT 'safe' CHECK (risk_level IN ('safe', 'low', 'medium', 'high', 'critical')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- AI Conversation Messages
CREATE TABLE IF NOT EXISTS ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES ai_tasks(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'tool')),
  content TEXT NOT NULL,
  tool_name TEXT,
  tool_call JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI Artifacts (generated files)
CREATE TABLE IF NOT EXISTS ai_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES ai_tasks(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  path TEXT,
  mime_type TEXT NOT NULL,
  size BIGINT NOT NULL DEFAULT 0,
  storage_path TEXT NOT NULL,
  target_device UUID REFERENCES devices(id) ON DELETE SET NULL,
  destination TEXT,
  status TEXT NOT NULL DEFAULT 'generating' CHECK (status IN ('generating', 'ready', 'transferring', 'delivered', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI Confirmations (user approval requests)
CREATE TABLE IF NOT EXISTS ai_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES ai_tasks(id) ON DELETE CASCADE,
  step_id UUID REFERENCES ai_task_steps(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('safe', 'low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  answered_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_tasks_room_id ON ai_tasks(room_id);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_status ON ai_tasks(status);
CREATE INDEX IF NOT EXISTS idx_ai_task_steps_task_id ON ai_task_steps(task_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_task_id ON ai_messages(task_id);
CREATE INDEX IF NOT EXISTS idx_ai_artifacts_task_id ON ai_artifacts(task_id);
CREATE INDEX IF NOT EXISTS idx_ai_confirmations_task_id ON ai_confirmations(task_id);
