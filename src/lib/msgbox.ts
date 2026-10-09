// Builds the PowerShell that shows a message box on a remote PC.
// Sent as -EncodedCommand (UTF-16LE base64) so no quote, $ or newline in the
// title/text/command can break the shell quoting.

export type AlertKind = "info" | "warning" | "error";

const ICON: Record<AlertKind, number> = { info: 0x40, warning: 0x30, error: 0x10 };

function q(v: string, max: number) {
  return v.slice(0, max).replace(/'/g, "''");
}

function encodePs(script: string): string {
  const bytes = new Uint8Array(script.length * 2);
  for (let i = 0; i < script.length; i++) {
    const c = script.charCodeAt(i);
    bytes[i * 2] = c & 0xff;
    bytes[i * 2 + 1] = c >> 8;
  }
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

/** Yes/No question with an Info / Warning / Error icon, always on top.
 * Prints `RESULT:Yes` or `RESULT:No`; runs `yesCommand` only on Yes. */
export function buildQuestionCommand(
  title: string,
  content: string,
  kind: AlertKind,
  yesCommand: string,
): string {
  const flags = ICON[kind] | 4 /* Yes/No */ | 0x10000 /* foreground */ | 0x40000; /* topmost */
  const script = `
Add-Type -TypeDefinition 'using System; using System.Runtime.InteropServices; public class FLMsg { [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int MessageBoxW(IntPtr h, string text, string caption, uint type); }'
$r = [FLMsg]::MessageBoxW([IntPtr]::Zero, '${q(content, 2000)}', '${q(title, 120)}', ${flags})
$ans = if ($r -eq 6) { 'Yes' } elseif ($r -eq 7) { 'No' } else { 'No' }
${yesCommand.trim() ? `if ($ans -eq 'Yes') { Invoke-Expression '${q(yesCommand.trim(), 4000)}' }` : ""}
Write-Output ('RESULT:' + $ans)
`;
  return `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -EncodedCommand ${encodePs(script)}`;
}
