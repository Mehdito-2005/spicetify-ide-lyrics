# Spicetify IDE Lyrics

![Platform](https://img.shields.io/badge/Spotify-Spicetify-1db954)
![OS](https://img.shields.io/badge/OS-Windows%20%7C%20macOS%20%7C%20Linux-blue)
![License](https://img.shields.io/badge/license-MIT-green)

A zero-dependency 3D IDE-style synchronized lyrics visualizer extension for **Spotify** via **Spicetify**. Renders live synced lyrics as tilted syntax-highlighted code with audio-reactive background waves, album cover showcase, lock screen / screensaver mode, and an Edit / Recording Studio mode.

## Features

- **3D Code Lyrics Stage**: Tokenizes Spotify synced lyrics with live word tracking, depth-of-field blur, and dynamic vocal zoom.
- **Spotify Color Lyrics & Album Showcase**: Pulls live synced lyrics from Spotify with automatic album-art color extraction and an optional Album Cover Showcase view.
- **Adlib Comments & Multi-Language Support**: Formats adlibs as IDE `// comments` (`Separate`, `Hide`, `Inline`), supports inline romanization/translation annotations, and handles Latin, CJK, Cyrillic, and RTL scripts (Persian, Arabic, Hebrew).
- **Edit & Recording Mode**: Toggle **Clean Feed** (`E`), switch backdrops (`Ambient`, `Vignette`, `Black`, `Green`/`Blue` chroma, or custom image/video), and enable `9:16`, `16:9`, or `1:1` framing guides.
- **Lock Screen & Screensaver**: Fullscreen ambient view with clock, date, and track card, plus configurable auto-idle timeouts (`30s`, `1m`, `2m`, `5m`).
- **Self-Contained**: Single-file extension (`ideLyrics.js`) with embedded styles, canvas waves, and persistent `localStorage` settings.

## Installation

### Windows (PowerShell)
```powershell
powershell -ExecutionPolicy Bypass -File .\install-spicetify.ps1
```

### Linux & macOS
```bash
chmod +x ./install-spicetify.sh
./install-spicetify.sh
```

### Manual Installation
1. Copy `ideLyrics.js` into your Spicetify Extensions directory:
   - **Windows**: `%APPDATA%\spicetify\Extensions\`
   - **macOS**: `~/spicetify_data/Extensions/` or `~/.config/spicetify/Extensions/`
   - **Linux**: `~/.config/spicetify/Extensions/`
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
