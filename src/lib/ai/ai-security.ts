// Security, secret redaction, and risk assessment for AI operations

import type { AIRiskLevel } from "./ai.types";

// Patterns for detecting sensitive information that should be redacted
const SECRET_PATTERNS = [
  /sk-[a-zA-Z0-9]{20,}/g, // OpenAI API keys
  /sk-ant-[a-zA-Z0-9_-]{20,}/g, // Anthropic API keys
  /ghp_[a-zA-Z0-9]{36}/g, // GitHub Personal Access Tokens
  /gho_[a-zA-Z0-9]{36}/g, // GitHub OAuth tokens
  /glpat-[a-zA-Z0-9_-]{20,}/g, // GitLab Personal Access Tokens
  /bearer\s+[a-zA-Z0-9_\-.]{20,}/gi, // Bearer tokens
  /password\s*[:=]\s*["']?[^"'\s]{6,}["']?/gi, // Passwords
  /secret\s*[:=]\s*["']?[^"'\s]{6,}["']?/gi, // Generic secrets
  /api[_-]?key\s*[:=]\s*["']?[^"'\s]{8,}["']?/gi, // API keys
  /-----BEGIN\s+.*PRIVATE\s+KEY-----[\s\S]*?-----END\s+.*PRIVATE\s+KEY-----/g, // Private keys
];

/**
 * Redact secrets from text before sending to AI or displaying in UI
 */
export function redactSecrets(text: string): string {
  let result = text;
  for (const pattern of SECRET_PATTERNS) {
    result = result.replace(pattern, "[REDACTED_SECRET]");
  }
  return result;
}

/**
 * Determine risk level for a command
 */
export function assessCommandRisk(command: string): AIRiskLevel {
  const lower = command.toLowerCase().trim();

  // Critical - permanently destructive
  if (
    /format\s+[a-z]:/i.test(lower) ||
    /rm\s+-rf\s+[/\\]/i.test(lower) ||
    /del\s+\/s\s+\/q\s+[c-z]:\\/i.test(lower) ||
    /drop\s+database/i.test(lower) ||
    /mkfs\./i.test(lower) ||
    /dd\s+if=/i.test(lower)
  ) {
    return "critical";
  }

  // High - system modification, shutdown, install
  if (
    /shutdown/i.test(lower) ||
    /reboot|restart-computer/i.test(lower) ||
    /netsh\s+firewall/i.test(lower) ||
    /reg\s+(add|delete)/i.test(lower) ||
    /npm\s+install\s+-g/i.test(lower) ||
    /pip\s+install/i.test(lower) ||
    /apt-get\s+install/i.test(lower) ||
    /choco\s+install/i.test(lower) ||
    /winget\s+install/i.test(lower) ||
    /sc\s+(create|delete|config)/i.test(lower)
  ) {
    return "high";
  }

  // Medium - local file edits, project dependencies, process kills
  if (
    /npm\s+(install|i|add)/i.test(lower) ||
    /git\s+(checkout|reset|clean|rebase)/i.test(lower) ||
    /taskkill/i.test(lower) ||
    /kill\s+-9/i.test(lower) ||
    /del\s+/i.test(lower) ||
    /rm\s+/i.test(lower)
  ) {
    return "medium";
  }

  // Low - directory creation, builds, tests
  if (
    /mkdir|md\s+/i.test(lower) ||
    /npm\s+(run|test|build)/i.test(lower) ||
    /git\s+(status|diff|log|branch)/i.test(lower) ||
    /tsc/i.test(lower) ||
    /vite\s+build/i.test(lower)
  ) {
    return "low";
  }

  // Safe - read-only commands
  if (/dir|ls|type|cat|echo|where|which|node\s+-v|npm\s+-v|git\s+--version/i.test(lower)) {
    return "safe";
  }

  return "medium";
}

/**
 * Check if path is safe to access (not system-critical)
 */
export function isPathSafe(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, "/").toLowerCase();

  // Blocked system paths
  const blockedPrefixes = [
    "c:/windows/system32",
    "c:/windows/syswow64",
    "/etc/shadow",
    "/etc/passwd",
    "/dev/",
    "/proc/",
    "/sys/",
  ];

  for (const blocked of blockedPrefixes) {
    if (normalized.startsWith(blocked)) return false;
  }

  return true;
}

/**
 * Limits for safe operations
 */
export const SAFETY_LIMITS = {
  MAX_FILE_READ_BYTES: 100 * 1024, // 100 KB
  MAX_COMMAND_TIMEOUT_MS: 300 * 1000, // 5 minutes
  MAX_AUTO_RETRIES: 3, // Max error repair attempts
  MAX_CONCURRENT_TASKS: 5,
};
