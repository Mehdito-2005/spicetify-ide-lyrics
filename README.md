# Spicetify IDE Lyrics

Synchronized lyrics visualizer styled as code syntax with 3D perspective, audio wave animation, and screensaver mode for Spotify.

---

## Features

- **Code Syntax Formatting**: Displays synchronized lyrics tokenized into keywords, methods, strings, variables, numbers, and punctuation.
- **Spotify Synced Lyrics Integration**: Fetches real-time synced lyrics from Spotify's Color Lyrics endpoint with automatic template generation for un-synced tracks.
- **Perspective Camera**: Configurable 3D tilt angles (Pitch, Yaw, Roll) and field-of-view scaling.
- **Background Waveform Animation**: Reactive audio waves drawn on an HTML5 canvas.
- **Word Zoom & Beat Motion**: Optional camera focus on currently sung lyrics with onset pulse animations.
- **Lock Screen & Screensaver**: Fullscreen ambient view with clock, date, and now-playing track card, plus a minimal screensaver with configurable idle timeouts (30s, 1m, 2m, 5m).
- **International Language Support**: Correct rendering for Latin, CJK (Chinese, Japanese, Korean), Cyrillic, and RTL scripts (Persian, Arabic).
- **Zero External Dependencies**: Self-contained script with embedded styles and canvas rendering.

---

## Installation

### Automated (Linux & macOS)

Run the installation script in terminal:

```bash
chmod +x ./install-spicetify.sh
./install-spicetify.sh
```

### Automated (Windows)

Run the installer via PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\install-spicetify.ps1
```

The script copies `ideLyrics.js` to your Spicetify extensions folder, enables it in configuration, and applies the changes.

### Manual Installation

1. Copy `ideLyrics.js` into your Spicetify extensions directory:
   - **Linux**: `~/.config/spicetify/Extensions/`
   - **macOS**: `~/spicetify_data/Extensions/` or `~/.config/spicetify/Extensions/`
   - **Windows**: `%APPDATA%\spicetify\Extensions\`

2. Enable and apply the extension:
   ```bash
   spicetify config extensions ideLyrics.js
   spicetify apply
   ```

3. Restart Spotify and click the **IDE Lyrics** button in the top bar, or press `Ctrl+Alt+L` (`Cmd+Option+L` on macOS).

---

## Keybindings

| Linux / Windows | macOS | Action | Scope |
| :--- | :--- | :--- | :--- |
| `Ctrl + Alt + L` | `Cmd + Option + L` | Toggle visualizer | Global |
| `Ctrl + Shift + L` | `Cmd + Shift + L` | Toggle fullscreen | Global |
| `Ctrl + Alt + S` | `Cmd + Option + S` | Trigger Lock Screen / Screensaver | Global |
| `Space` or `K` | `Space` or `K` | Play / Pause | In visualizer |
| `Shift + Right` / `N` | `Cmd + Right` / `Shift + Right` / `N` | Next track | In visualizer |
| `Shift + Left` / `P` | `Cmd + Left` / `Shift + Left` / `P` | Previous track | In visualizer |
| `Right Arrow` | `Right Arrow` | Seek forward (+5s) | In visualizer |
| `Left Arrow` | `Left Arrow` | Seek backward (-5s) | In visualizer |
| `F` | `F` | Toggle fullscreen | In visualizer |
| `Esc` | `Esc` | Wake from lock / Exit settings | While locked or in settings |
| `Mouse Move / Key` | `Mouse Move / Key` | Dismiss lock screen or screensaver | While locked or in saver |
| Click lyric line | Click lyric line | Jump playback to line timestamp | In visualizer |

---

## Configuration

Click **Settings** on the control pill to adjust:
- **Perspective Angles**: Tilt X (Pitch: -30° to +45°), Tilt Y (Yaw: -45° to +45°), Tilt Z (Roll: -20° to +20°).
- **Typography & Spacing**: Font size (14px–64px), token padding, line spacing, and line gutter indentation.
- **Visual Effects**: Token glow intensity, depth of field blur, and background wave amplitude.
- **Word Zoom & Beat Motion**: Toggle camera zoom on active phrases and rhythm pulse on vocal onsets.
- **Screensaver & Lock Screen**: Choose between Off, Screensaver, or Lock Screen mode, with auto-idle trigger delays (Off, 30s, 1m, 2m, 5m).

All settings persist in `localStorage`.

---

## Audio Recording (Linux & macOS)

### Linux (PipeWire / PulseAudio)
Screen recorders may default to microphone capture rather than the audio output sink:
- **OBS Studio (PipeWire)**: Add source **Application Audio Capture (PipeWire)** -> select `spotify`.
- **PulseAudio Volume Control (`pavucontrol`)**: Under the **Recording** tab, change the recorder input to **Monitor of Built-in Audio Analog Stereo**.

### macOS (BlackHole / ScreenCaptureKit)
macOS restricts system audio recording without a virtual loopback device or ScreenCaptureKit permissions:
- **OBS Studio 29+**: Add source **macOS Screen Capture** -> **Application Capture** -> select `Spotify` with **Audio Capture** enabled.
- **BlackHole 2ch**: Install via `brew install blackhole-2ch`. Create a **Multi-Output Device** in Audio MIDI Setup including your output device and BlackHole, then set your recorder's input to **BlackHole 2ch**.

---

## Uninstallation

### Automated (Linux & macOS)
```bash
chmod +x ./uninstall-spicetify.sh
./uninstall-spicetify.sh
```

### Automated (Windows)
```powershell
powershell -ExecutionPolicy Bypass -File .\uninstall-spicetify.ps1
```

---

## Testing

Run the test suite using Edge headless:

```powershell
powershell -ExecutionPolicy Bypass -File .\test-spicetify.ps1
```
