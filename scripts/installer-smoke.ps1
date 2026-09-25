$ErrorActionPreference = 'Stop'
$version = (Get-Content -LiteralPath 'package.json' -Encoding UTF8 -Raw | ConvertFrom-Json).version
$installer = (Resolve-Path -LiteralPath "release/gd-pe-teacher-assistant-$version-Windows-x64-setup.exe").Path
$oldInstaller = (Resolve-Path -LiteralPath 'release/gd-pe-teacher-assistant-0.29.0-x64-setup.exe').Path
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
function Install-TestPackage([string]$path) {
  $process = Start-Process -FilePath $path -ArgumentList @('/S', "/D=$installDir") -WindowStyle Hidden -Wait -PassThru
  if ($process.ExitCode -ne 0) { throw "Installer failed: $($process.ExitCode)" }
}
function Uninstall-TestPackage {
  $uninstaller = Get-ChildItem -LiteralPath $installDir -Filter '*Uninstall*.exe' | Select-Object -First 1
  if (!$uninstaller) { throw 'Uninstaller missing.' }
  $process = Start-Process -FilePath $uninstaller.FullName -ArgumentList '/S' -WindowStyle Hidden -Wait -PassThru
  if ($process.ExitCode -ne 0) { throw "Uninstall failed: $($process.ExitCode)" }
  for ($attempt = 0; $attempt -lt 100 -and (Test-Path -LiteralPath $env:GDPE_SMOKE_EXE); $attempt++) { Start-Sleep -Milliseconds 200 }
  if (Test-Path -LiteralPath $env:GDPE_SMOKE_EXE) { throw 'Uninstall did not remove executable.' }
}
function Run-TestSmoke([string]$label) {
  node scripts/packaged-smoke.mjs | Out-Host
  if ($LASTEXITCODE -ne 0) { throw "$label smoke failed." }
  Copy-Item -LiteralPath 'release/rc-smoke-results.json' -Destination "release/rc-$label-smoke-results.json"
  return (Get-Content -LiteralPath 'release/rc-smoke-results.json' -Encoding UTF8 -Raw | ConvertFrom-Json)
}
function Snapshot-TestData([string]$root) {
  if (!(Split-Path -Leaf (Split-Path -Parent $root)).StartsWith('gdpe-rc-smoke-')) { throw 'Unexpected test root.' }
  if ((Get-Content -LiteralPath (Join-Path $root '.rc-test-root') -Raw) -ne 'isolated-rc-test') { throw 'Missing test sentinel.' }
  $files = @(Get-ChildItem -LiteralPath $root -Filter '*.json' -File)
  $attachments = Join-Path $root 'resources/files'
  if (Test-Path -LiteralPath $attachments) { $files += Get-ChildItem -LiteralPath $attachments -File -Recurse }
  return (($files | Sort-Object FullName | ForEach-Object { $_.FullName + ':' + (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash }) -join "`n")
}
try {
  $env:GDPE_SMOKE_EXE = Join-Path $installDir 'gd-pe-teacher-assistant.exe'
  Install-TestPackage $installer
  $fresh = Run-TestSmoke 'installed'
  $env:GDPE_RC_REUSE_ROOT = Join-Path $fresh.root '全新 用户'
  $before = Snapshot-TestData $env:GDPE_RC_REUSE_ROOT
  Uninstall-TestPackage
  if ((Snapshot-TestData $env:GDPE_RC_REUSE_ROOT) -ne $before) { throw 'Uninstall changed business data.' }
  Install-TestPackage $installer
  $null = Run-TestSmoke 'reinstalled'
  if ((Snapshot-TestData $env:GDPE_RC_REUSE_ROOT) -ne $before) { throw 'Reinstall changed business data.' }
  Uninstall-TestPackage
  Remove-Item Env:GDPE_RC_REUSE_ROOT
  Install-TestPackage $oldInstaller
  $env:GDPE_SMOKE_VERSION = '0.29.0'
  $old = Run-TestSmoke 'old-installed'
  $env:GDPE_RC_REUSE_ROOT = Join-Path $old.root '全新 用户'
  $before = Snapshot-TestData $env:GDPE_RC_REUSE_ROOT
  Remove-Item Env:GDPE_SMOKE_VERSION
  Install-TestPackage $installer
  if ((Snapshot-TestData $env:GDPE_RC_REUSE_ROOT) -ne $before) { throw 'Upgrade installer changed business data.' }
  $null = Run-TestSmoke 'upgrade'
  if ((Snapshot-TestData $env:GDPE_RC_REUSE_ROOT) -ne $before) { throw 'Upgrade startup changed business data.' }
  Uninstall-TestPackage
  @{ passed = $true; version = $version; administrator = $isAdmin; installDir = $installDir; install = 'passed'; reinstallAfterUninstall = 'passed'; upgradeFrom = '0.29.0'; upgrade = 'passed'; uninstallDataPreserved = $true; realUserDataAccessed = $false; completedAt = [DateTime]::UtcNow.ToString('o') } | ConvertTo-Json | Set-Content -Encoding UTF8 -LiteralPath 'release/rc-installer-results.json'
} finally {
  Remove-Item Env:GDPE_SMOKE_EXE -ErrorAction SilentlyContinue
  Remove-Item Env:GDPE_SMOKE_VERSION -ErrorAction SilentlyContinue
  Remove-Item Env:GDPE_RC_REUSE_ROOT -ErrorAction SilentlyContinue
}
