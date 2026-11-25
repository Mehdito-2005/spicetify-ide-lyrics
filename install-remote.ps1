# One-line remote installer for Spicetify IDE Lyrics (Windows)
# Usage: irm https://raw.githubusercontent.com/Mehdito-2005/spicetify-ide-lyrics/main/install-remote.ps1 | iex
$ErrorActionPreference = "Stop"

$ExtUrl = "https://raw.githubusercontent.com/Mehdito-2005/spicetify-ide-lyrics/main/ideLyrics.js"
$ExtFile = "ideLyrics.js"

Write-Host "=== Spicetify IDE Lyrics — Remote Windows Installer ===" -ForegroundColor Cyan

$SpicetifyCmd = Get-Command spicetify -ErrorAction SilentlyContinue
if (-not $SpicetifyCmd) {
    $FallbackExe = Join-Path $env:LOCALAPPDATA "spicetify\spicetify.exe"
    if (Test-Path $FallbackExe) { $SpicetifyCmd = Get-Item $FallbackExe }
}

$ExtDir = Join-Path $env:APPDATA "spicetify\Extensions"
if ($SpicetifyCmd) {
    try {
        $CfgPath = (& $SpicetifyCmd.FullName -c 2>$null | Select-Object -First 1).Trim()
        if ($CfgPath) { $ExtDir = Join-Path (Split-Path -Parent $CfgPath) "Extensions" }
    } catch {}
}

New-Item -ItemType Directory -Force -Path $ExtDir | Out-Null
$Dest = Join-Path $ExtDir $ExtFile

Write-Host "  Downloading $ExtFile -> $Dest..." -ForegroundColor DarkGray
Invoke-WebRequest -UseBasicParsing -Uri $ExtUrl -OutFile $Dest
Write-Host "[OK] Saved $Dest" -ForegroundColor Green

if ($SpicetifyCmd) {
    Write-Host "  Registering and applying extension with Spicetify..." -ForegroundColor Cyan
    & $SpicetifyCmd.FullName config extensions $ExtFile
    & $SpicetifyCmd.FullName apply
    Write-Host "`nDone! Open Spotify and click 'IDE Lyrics' (or press Ctrl+Alt+L)." -ForegroundColor Green
} else {
    Write-Host "`n[NOTE] Spicetify CLI was not found in PATH." -ForegroundColor Yellow
    Write-Host "       Install Spicetify from https://spicetify.app then run:" -ForegroundColor Yellow
    Write-Host "       spicetify config extensions ideLyrics.js && spicetify apply" -ForegroundColor Yellow
}
