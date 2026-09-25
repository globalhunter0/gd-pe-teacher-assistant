$ErrorActionPreference = 'Stop'
$installer = (Resolve-Path -LiteralPath 'release/gd-pe-teacher-assistant-0.29.0-x64-setup.exe').Path
# Never replace an existing user installation as part of this test.
foreach ($key in @('HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall', 'HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall', 'HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall')) {
  if (Test-Path -LiteralPath $key) {
    $existing = Get-ChildItem -LiteralPath $key | Get-ItemProperty | Where-Object { $_.DisplayName -eq 'gd-pe-teacher-assistant' }
    if ($existing) { throw 'Existing application installation found; refusing to replace it in smoke test.' }
  }
}
$testBase = Join-Path ([IO.Path]::GetTempPath()) ('gdpe-installer-' + [Guid]::NewGuid().ToString())
$installDir = Join-Path $testBase '中文 安装目录'
New-Item -ItemType Directory -Path $testBase | Out-Null
$isAdmin = [Security.Principal.WindowsPrincipal]::new([Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if ($isAdmin) { throw 'Installer smoke must run without administrator privileges.' }
$process = Start-Process -FilePath $installer -ArgumentList @('/S', "/D=$installDir") -WindowStyle Hidden -Wait -PassThru
if ($process.ExitCode -ne 0) { throw "Installer failed: $($process.ExitCode)" }
$env:GDPE_SMOKE_EXE = Join-Path $installDir 'gd-pe-teacher-assistant.exe'
if (!(Test-Path -LiteralPath $env:GDPE_SMOKE_EXE)) { throw 'Installed executable missing.' }
try {
  node scripts/packaged-smoke.mjs
  if ($LASTEXITCODE -ne 0) { throw 'Installed application smoke failed.' }
  Copy-Item -LiteralPath 'release/rc-smoke-results.json' -Destination 'release/rc-installed-smoke-results.json'
  $first = Get-Content -LiteralPath 'release/rc-smoke-results.json' -Raw | ConvertFrom-Json
  $env:GDPE_RC_REUSE_ROOT = Join-Path $first.root '全新 用户'
  $before = Get-FileHash -LiteralPath (Join-Path $env:GDPE_RC_REUSE_ROOT 'students.json') -Algorithm SHA256
  $process = Start-Process -FilePath $installer -ArgumentList @('/S', "/D=$installDir") -WindowStyle Hidden -Wait -PassThru
  if ($process.ExitCode -ne 0) { throw "Upgrade installer failed: $($process.ExitCode)" }
  $after = Get-FileHash -LiteralPath (Join-Path $env:GDPE_RC_REUSE_ROOT 'students.json') -Algorithm SHA256
  if ($before.Hash -ne $after.Hash) { throw 'Installer changed isolated business data.' }
  node scripts/packaged-smoke.mjs
  if ($LASTEXITCODE -ne 0) { throw 'Reinstalled application smoke failed.' }
  Copy-Item -LiteralPath 'release/rc-smoke-results.json' -Destination 'release/rc-upgrade-smoke-results.json'
  $uninstaller = Get-ChildItem -LiteralPath $installDir -Filter '*Uninstall*.exe' | Select-Object -First 1
  if (!$uninstaller) { throw 'Uninstaller missing.' }
  $process = Start-Process -FilePath $uninstaller.FullName -ArgumentList '/S' -WindowStyle Hidden -Wait -PassThru
  if ($process.ExitCode -ne 0) { throw "Uninstall failed: $($process.ExitCode)" }
  if ((Get-FileHash -LiteralPath (Join-Path $env:GDPE_RC_REUSE_ROOT 'students.json') -Algorithm SHA256).Hash -ne $before.Hash) { throw 'Uninstall changed isolated business data.' }
  @{ passed = $true; administrator = $isAdmin; installDir = $installDir; install = 'passed'; reinstall = 'passed'; uninstallDataPreserved = $true; realUserDataAccessed = $false } | ConvertTo-Json | Set-Content -LiteralPath 'release/rc-installer-results.json'
} finally {
  Remove-Item Env:GDPE_SMOKE_EXE -ErrorAction SilentlyContinue
  Remove-Item Env:GDPE_RC_REUSE_ROOT -ErrorAction SilentlyContinue
}
