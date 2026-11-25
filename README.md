# Spicetify IDE Lyrics

![Platform](https://img.shields.io/badge/Spotify-Spicetify-1db954)
![OS](https://img.shields.io/badge/OS-Windows%20%7C%20macOS%20%7C%20Linux-blue)
![Release](https://img.shields.io/github/v/release/Mehdito-2005/spicetify-ide-lyrics)
![License](https://img.shields.io/badge/license-MIT-green)

A zero-dependency 3D IDE-style synchronized lyrics visualizer extension for **Spotify** via **Spicetify**. Renders live synced lyrics as tilted syntax-highlighted code with audio-reactive background waves, album cover showcase, lock screen / screensaver mode, and an Edit / Recording Studio mode.

> **Prefer a GUI installer?** [IDE Lyrics Studio](https://github.com/Mehdito-2005/ide-lyrics-studio) includes a built-in **Setup & Integrations Wizard** that installs and applies this Spicetify extension in one click alongside optional Cider and Live Wallpaper modes.

## Features

- **3D Code Lyrics & Live Typewriter Mode**: Tokenizes Spotify synced lyrics with a smooth **Depth-of-Field cascade** (distance-tier blur and sung vs. upcoming word contrast), dynamic vocal zoom, or **Live Typewriter** mode with character-by-character reveal and a gliding IDE caret (LTR & RTL safe).
- **Spotify Color Lyrics & Album Showcase Glow**: Pulls live synced lyrics from Spotify with automatic album-art color extraction and an optional Album Cover Showcase view enhanced with a theme-reactive ambient **Album Glow**.
- **JSON Preset Export / Import**: Back up or share your visual, layout, and reveal settings with validated **Copy Preset** / **Import Preset** JSON controls in Settings.
- **Adlib Comments & Multi-Language Support**: Formats adlibs as IDE `// comments` (`Separate`, `Hide`, `Inline`), supports inline romanization/translation annotations, and handles Latin, CJK, Cyrillic, and RTL scripts (Persian, Arabic, Hebrew).
- **Edit & Recording Mode**: Toggle **Clean Feed** (`E`), switch backdrops (`Ambient`, `Vignette`, `Black`, `Green`/`Blue` chroma, or custom image/video), and enable `9:16`, `16:9`, or `1:1` framing guides.
- **Lock Screen & Screensaver**: Fullscreen ambient view with clock, date, and track card, plus configurable auto-idle timeouts (`30s`, `1m`, `2m`, `5m`).
- **Self-Contained & Marketplace Ready**: Single-file extension (`ideLyrics.js`) with a Spicetify Marketplace `manifest.json` and preview card.

## Quick 1-Line Install (No Git Required)

### Windows (PowerShell)
```powershell
irm https://raw.githubusercontent.com/Mehdito-2005/spicetify-ide-lyrics/main/install-remote.ps1 | iex
```

### macOS & Linux
```bash
curl -fsSL https://raw.githubusercontent.com/Mehdito-2005/spicetify-ide-lyrics/main/install-remote.sh | bash
```

### Spicetify Marketplace
This repository includes a valid `manifest.json` and the `spicetify-extensions` GitHub topic so it can be discovered or installed via Spicetify Marketplace.

## Local / Manual Installation

1. Copy `ideLyrics.js` (from [Releases](https://github.com/Mehdito-2005/spicetify-ide-lyrics/releases) or a local clone) into your Spicetify Extensions directory:
   - **Windows**: `%APPDATA%\spicetify\Extensions\` (or run `.\install-spicetify.ps1`)
   - **macOS / Linux**: `~/.config/spicetify/Extensions/` (or run `./install-spicetify.sh`)
2. Enable and apply:
   ```bash
   spicetify config extensions ideLyrics.js
   spicetify apply
   ```
3. Restart Spotify and click **IDE Lyrics** in the top bar (or press `Ctrl+Alt+L` / `Cmd+Option+L`).

## Keyboard Shortcuts

| Windows / Linux | macOS | Action | Scope |
| --- | --- | --- | --- |
| `Ctrl + Alt + L` | `Cmd + Option + L` | Toggle visualizer | Global |
| `Ctrl + Shift + L` | `Cmd + Shift + L` | Toggle fullscreen | Global |
| `Ctrl + Alt + S` | `Cmd + Option + S` | Trigger Lock Screen / Screensaver | Global |
| `E` | `E` | Toggle Clean Feed (Edit Mode) | In visualizer |
| `F` | `F` | Toggle fullscreen | In visualizer |
| `Space` / `K` | `Space` / `K` | Play / Pause | In visualizer |
| `Shift + Right` / `N` | `Cmd + Right` / `N` | Next track | In visualizer |
| `Shift + Left` / `P` | `Cmd + Left` / `P` | Previous track | In visualizer |
| `Left` / `Right` | `Left` / `Right` | Seek ±5s | In visualizer |
| `[` / `]` / `\` | `[` / `]` / `\` | Quick lyric sync nudge (`-50ms` / `+50ms` / reset) | In visualizer |
| `Esc` | `Esc` | Wake from lock / Close settings | Active overlay |
| Click lyric line | Click lyric line | Jump playback to line timestamp | In visualizer |

## Recording Spotify Audio (Linux & macOS)

- **Linux (OBS + PipeWire)**: Add an **Application Audio Capture (PipeWire)** source targeting `spotify`, or select **Monitor of Built-in Audio** in `pavucontrol`.
- **macOS (OBS 29+)**: Add **macOS Screen Capture → Application Capture** targeting `Spotify` with audio capture enabled (or route via `brew install blackhole-2ch`).

## Uninstallation

- **Windows**: `powershell -ExecutionPolicy Bypass -File .\uninstall-spicetify.ps1`
- **Linux & macOS**: `chmod +x ./uninstall-spicetify.sh && ./uninstall-spicetify.sh`

## Testing

```powershell
powershell -ExecutionPolicy Bypass -File .\test-spicetify.ps1
```

## License

MIT — see [LICENSE](LICENSE).
