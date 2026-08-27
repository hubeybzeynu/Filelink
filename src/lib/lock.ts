/**
 * Simple shared-passcode gate for sensitive actions in the browser UI
 * (fullscreen mode, deleting, moving). This is a convenience lock for the
 * people sharing a room — it is not user authentication.
 */
const PASSCODE = "hube1848@";
const KEY = "filelink.unlocked";

export function isUnlocked() {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(KEY) === "1";
}

export function tryUnlock(input: string) {
  if (input !== PASSCODE) return false;
  sessionStorage.setItem(KEY, "1");
  return true;
}

export function relock() {
  sessionStorage.removeItem(KEY);
}
