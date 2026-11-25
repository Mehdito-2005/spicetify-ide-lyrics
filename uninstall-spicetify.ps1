# ==============================================================================
# Spicetify IDE Lyrics — Windows Uninstaller
# ==============================================================================
$ErrorActionPreference = "SilentlyContinue"

Write-Host "Checking for Spicetify IDE Lyrics extension..." -ForegroundColor Cyan

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

# 2. Locate Extensions directory
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

# 3. Unregister and Remove
$ExtFile = Join-Path $ExtensionsDir "ideLyrics.js"
$Found = $false

if (Test-Path $ExtFile) {
    Remove-Item -Force $ExtFile -ErrorAction SilentlyContinue
    Write-Host "Removed Spicetify extension file: $ExtFile" -ForegroundColor Green
    $Found = $true
}

if ($SpicetifyExe) {
    try {
        $currentExts = & $SpicetifyExe config extensions 2>$null
        if ($LASTEXITCODE -eq 0 -and ($currentExts -match "ideLyrics\.js")) {
            Write-Host "Deregistering ideLyrics.js from Spicetify config..." -ForegroundColor DarkGray
            & $SpicetifyExe config extensions ideLyrics.js- | Out-Null
            if ($LASTEXITCODE -ne 0) { throw "spicetify config deregister failed with exit code $LASTEXITCODE" }
            & $SpicetifyExe apply | Out-Null
            if ($LASTEXITCODE -ne 0) { throw "spicetify apply failed with exit code $LASTEXITCODE" }
            Write-Host "Spicetify updated successfully." -ForegroundColor Green
            $Found = $true
        }
    } catch {
        Write-Host "Notice updating Spicetify: $_" -ForegroundColor DarkGray
    }
}

if (-not $Found) {
    Write-Host "No active Spicetify IDE Lyrics extension found." -ForegroundColor DarkGray
}
