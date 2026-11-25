# ==============================================================================
# Spicetify IDE Lyrics — Windows Installer
# ==============================================================================
$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition

$SrcFile = Join-Path $ScriptDir "ideLyrics.js"
if (-not (Test-Path $SrcFile)) {
    throw "Source file 'ideLyrics.js' not found in: $ScriptDir"
}

# 1. Locate Spicetify CLI executable
$SpicetifyExe = $null
$SpicetifyCmd = Get-Command "spicetify" -ErrorAction SilentlyContinue
if ($SpicetifyCmd) {
    $SpicetifyExe = $SpicetifyCmd.Source
} else {
    $CandidateExePaths = @(
        (Join-Path $env:LOCALAPPDATA "spicetify\spicetify.exe"),
        (Join-Path $env:USERPROFILE "spicetify-cli\spicetify.exe"),
        (Join-Path $env:APPDATA "spicetify\spicetify.exe"),
        (Join-Path $env:ProgramFiles "spicetify\spicetify.exe")
    )
    foreach ($path in $CandidateExePaths) {
        if (Test-Path $path) {
            $SpicetifyExe = $path
            break
        }
    }
}

# 2. Determine Spicetify Extensions directory
$ExtensionsDir = $null
if ($SpicetifyExe) {
    try {
        $pathOutput = (& $SpicetifyExe path -e 2>$null)
        if ($LASTEXITCODE -eq 0 -and $pathOutput) {
            $firstLine = $pathOutput | Where-Object { $_ -and $_.ToString().Trim() } | Select-Object -First 1
            if ($firstLine) {
                $trimmed = $firstLine.ToString().Trim()
                if ($trimmed.EndsWith(".js", [System.StringComparison]::OrdinalIgnoreCase)) {
                    $ExtensionsDir = Split-Path $trimmed -Parent
                } else {
                    $ExtensionsDir = $trimmed
                }
            }
        }
    } catch {}
}

if (-not $ExtensionsDir) {
    $ExtensionsDir = Join-Path $env:APPDATA "spicetify\Extensions"
}

if (-not (Test-Path $ExtensionsDir)) {
    New-Item -ItemType Directory -Path $ExtensionsDir -Force | Out-Null
}

# 3. Copy extension file
$DestFile = Join-Path $ExtensionsDir "ideLyrics.js"
Copy-Item -Path $SrcFile -Destination $DestFile -Force
Write-Host "Installed: $DestFile" -ForegroundColor Green

# 4. Enable and Apply via Spicetify CLI if available
if ($SpicetifyExe) {
    try {
        & $SpicetifyExe config extensions ideLyrics.js
        if ($LASTEXITCODE -ne 0) { throw "spicetify config extensions failed with exit code $LASTEXITCODE" }
        & $SpicetifyExe apply
        if ($LASTEXITCODE -ne 0) { throw "spicetify apply failed with exit code $LASTEXITCODE" }
        Write-Host "Spicetify extension applied. Restart Spotify to load IDE Lyrics." -ForegroundColor Green
    } catch {
        Write-Host "Error applying extension: $_" -ForegroundColor Red
        Write-Host "Manual steps:`n  spicetify config extensions ideLyrics.js`n  spicetify apply" -ForegroundColor Yellow
    }
} else {
    Write-Host "Note: Spicetify CLI not found in PATH." -ForegroundColor Yellow
    Write-Host "Manual steps once installed:`n  spicetify config extensions ideLyrics.js`n  spicetify apply" -ForegroundColor Yellow
}
