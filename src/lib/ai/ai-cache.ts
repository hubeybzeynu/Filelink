// AI workspace cache for device information
// Prevents redundant tool calls by caching device info during a conversation

interface DeviceInfoCache {
  device: string;
  info: Record<string, unknown>;
  timestamp: number;
  expiresAt: number;
}

// In-memory cache per task
const taskCaches = new Map<string, Map<string, DeviceInfoCache>>();

// Cache duration: 5 minutes (reasonable for a conversation)
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Get cached device info if available and not expired
 */
export function getCachedDeviceInfo(
  taskId: string,
  device: string,
): Record<string, unknown> | null {
  const taskCache = taskCaches.get(taskId);
  if (!taskCache) return null;

  const cached = taskCache.get(device);
  if (!cached) return null;

  // Check if expired
  if (Date.now() > cached.expiresAt) {
    taskCache.delete(device);
    return null;
  }

  console.log(`[AI Cache] HIT for device ${device} in task ${taskId}`);
  return cached.info;
}

/**
 * Store device info in cache
 */
export function setCachedDeviceInfo(
  taskId: string,
  device: string,
  info: Record<string, unknown>,
): void {
  let taskCache = taskCaches.get(taskId);
  if (!taskCache) {
    taskCache = new Map();
    taskCaches.set(taskId, taskCache);
  }

  const now = Date.now();
  taskCache.set(device, {
    device,
    info,
    timestamp: now,
    expiresAt: now + CACHE_TTL,
  });

  console.log(`[AI Cache] STORED device ${device} in task ${taskId}`);
}

/**
 * Build device context string from cache
 * This is injected into the system prompt so the AI doesn't need to call get_device_info again
 */
export function buildDeviceContext(taskId: string, devices: string[]): string {
  const taskCache = taskCaches.get(taskId);
  if (!taskCache || taskCache.size === 0) return "";

  const cachedDevices: string[] = [];

  for (const device of devices) {
    const cached = getCachedDeviceInfo(taskId, device);
    if (cached) {
      cachedDevices.push(`## Device: ${device}\n${JSON.stringify(cached, null, 2)}`);
    }
  }

  if (cachedDevices.length === 0) return "";

  return `\n\n---\nDEVICE INFORMATION CACHE (already fetched, do not call get_device_info again):\n${cachedDevices.join("\n\n")}\n---\n`;
}

/**
 * Clear cache for a task (call when task completes)
 */
export function clearTaskCache(taskId: string): void {
  taskCaches.delete(taskId);
  console.log(`[AI Cache] CLEARED task ${taskId}`);
}

/**
 * Clear all expired caches (periodic cleanup)
 */
export function cleanupExpiredCaches(): void {
  const now = Date.now();
  let cleared = 0;

  for (const [taskId, taskCache] of taskCaches.entries()) {
    for (const [device, cached] of taskCache.entries()) {
      if (now > cached.expiresAt) {
        taskCache.delete(device);
        cleared++;
      }
    }

    // Remove empty task caches
    if (taskCache.size === 0) {
      taskCaches.delete(taskId);
    }
  }

  if (cleared > 0) {
    console.log(`[AI Cache] Cleaned up ${cleared} expired entries`);
  }
}

// Run cleanup every minute
setInterval(cleanupExpiredCaches, 60 * 1000);
