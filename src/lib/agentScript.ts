// Builds the Windows installer for FileLink.
//
// Both options install the same thing — a persistent background agent that
// starts with Windows and connects with `--agent` (the server marks it
// admin:true either way, since that's driven by the --agent flag, not by
// Windows-level UAC). The only difference is whether the person at that PC
// sees an administrator approval prompt during install:
//
//  - elevate: true  -> self-elevates via UAC first. Windows shows a real
//    "Do you want to allow this app..." prompt that must be approved before
//    anything installs.
//  - elevate: false -> installs immediately, no prompt at all.
//
// The self-elevate block and the run_silent.vbs / shortcut lines are
// copied from a manually tested working installer — building the same
// lines at runtime with nested batch/VBS/PowerShell quote-escaping is what
// caused "Unterminated string constant" bugs before. Keep these as-is.
export function buildAgentInstaller(opts: {
  origin: string;
  roomCode: string;
  deviceName: string;
  elevate: boolean;
}): string {
  const origin = opts.origin.replace(/\/+$/, "");
  const mjsUrl = `${origin}/filelink.mjs`;
  const apiUrl = `${origin}/api/public/link`;
  const joinUrl = `${origin}/j/${opts.roomCode}`;
  const code = opts.roomCode.trim().toUpperCase();
  const device = (opts.deviceName || "My PC").replace(/"/g, "");
  const pingDevice = device.replace(/'/g, "");

  function ping(stage: "approved" | "installing" | "starting") {
    return `powershell -Command "Invoke-RestMethod -Uri '${apiUrl}' -Method Post -ContentType 'application/json' -Body (@{action='installPing';code='${code}';deviceName='${pingDevice}';stage='${stage}'} | ConvertTo-Json) -ErrorAction SilentlyContinue" >nul 2>&1`;
  }

  const elevateBlock = opts.elevate
    ? [
        ":: --- self-elevate (asks the person at this PC to approve) ---",
        '>nul 2>&1 "%SYSTEMROOT%\\system32\\cacls.exe" "%SYSTEMROOT%\\system32\\config\\system"',
        "if '%errorlevel%' NEQ '0' (",
        "    goto UACPrompt",
        ") else ( goto gotAdmin )",
        "",
        ":UACPrompt",
        '    echo Set UAC = CreateObject^("Shell.Application"^) > "%temp%\\getadmin.vbs"',
        '    echo UAC.ShellExecute "%~s0", "", "", "runas", 1 >> "%temp%\\getadmin.vbs"',
        '    "%temp%\\getadmin.vbs"',
        '    del "%temp%\\getadmin.vbs"',
        "    exit /B",
        "",
        ":gotAdmin",
        '    pushd "%CD%"',
        '    CD /D "%~dp0"',
        "",
        ":: proves the UAC prompt was actually approved — nothing reaches",
        ":: here otherwise",
        ping("approved"),
        "",
      ]
    : [];

  return [
    "@echo off",
    ...elevateBlock,
    "setlocal",
    'set "ROAMINGDIR=%APPDATA%\\FileLinkAgent"',
    "",
    'if exist "%ROAMINGDIR%" (',
    '  rd /s /q "%ROAMINGDIR%"',
    ")",
    'mkdir "%ROAMINGDIR%"',
    "",
    ping("installing"),
    "",
    `curl -fsSL -o "%ROAMINGDIR%\\filelink.mjs" "${mjsUrl}"`,
    "",
    "(",
    "  echo @echo off",
    '  echo cd /d "%USERPROFILE%"',
    `  echo curl -fsSL -o "%ROAMINGDIR%\\filelink.mjs" "${mjsUrl}"`,
    `  echo node "%ROAMINGDIR%\\filelink.mjs" connect ${joinUrl} "${device}" --shell --agent`,
    ')>"%ROAMINGDIR%\\start_filelink.cmd"',
    "",
    "(",
    '  echo Set WshShell = CreateObject("WScript.Shell"^)',
    '  echo WshShell.Run "cmd /c ""%ROAMINGDIR%\\start_filelink.cmd""", 0, False',
    "  echo Set WshShell = Nothing",
    ')>"%ROAMINGDIR%\\run_silent.vbs"',
    "",
    'powershell -NoProfile -Command "$wsh = New-Object -ComObject WScript.Shell; $startup = [Environment]::GetFolderPath(\'Startup\'); $sc = $wsh.CreateShortcut(\\"$startup\\FileLinkAgent.lnk\\"); $sc.TargetPath = \'%APPDATA%\\FileLinkAgent\\run_silent.vbs\'; $sc.WorkingDirectory = \'%USERPROFILE%\'; $sc.Save()"',
    "",
    ping("starting"),
    "",
    'start "" "%ROAMINGDIR%\\run_silent.vbs"',
    "",
    "timeout /t 3 /nobreak >nul",
    "endlocal",
    "",
    "goto delself",
    ":delself",
    'del "%~f0" & exit',
  ].join("\r\n");
}

export function agentInstallerFileName(roomCode: string, deviceName?: string, elevate = true) {
  const dev = (deviceName || "pc").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const suffix = elevate ? "-admin" : "-noadmin";
  return `filelink-agent-${roomCode.toLowerCase()}-${dev || "pc"}${suffix}.cmd`;
}

export function downloadAgentInstaller(opts: {
  origin: string;
  roomCode: string;
  deviceName: string;
  elevate: boolean;
}) {
  const blob = new Blob([buildAgentInstaller(opts)], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = agentInstallerFileName(opts.roomCode, opts.deviceName, opts.elevate);
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
