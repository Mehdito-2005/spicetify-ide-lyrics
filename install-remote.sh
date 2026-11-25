#!/usr/bin/env bash
# One-line remote installer for Spicetify IDE Lyrics (macOS & Linux)
# Usage: curl -fsSL https://raw.githubusercontent.com/Mehdito-2005/spicetify-ide-lyrics/main/install-remote.sh | bash
set -euo pipefail

EXT_URL="https://raw.githubusercontent.com/Mehdito-2005/spicetify-ide-lyrics/main/ideLyrics.js"
EXT_FILE="ideLyrics.js"

echo "=== Spicetify IDE Lyrics - Remote Installer ==="

SP_BIN="$(command -v spicetify || true)"
if [[ -z "${SP_BIN}" && -x "${HOME}/.spicetify/spicetify" ]]; then
  SP_BIN="${HOME}/.spicetify/spicetify"
fi

EXT_DIR="${XDG_CONFIG_HOME:-${HOME}/.config}/spicetify/Extensions"
if [[ -n "${SP_BIN}" ]]; then
  CFG_PATH="$("${SP_BIN}" -c 2>/dev/null | head -n 1 || true)"
  if [[ -n "${CFG_PATH}" ]]; then
    EXT_DIR="$(dirname "${CFG_PATH}")/Extensions"
  fi
fi

mkdir -p "${EXT_DIR}"
DEST="${EXT_DIR}/${EXT_FILE}"
echo "  Downloading ${EXT_FILE} -> ${DEST}..."
curl -fsSL "${EXT_URL}" -o "${DEST}"
echo "[OK] Saved ${DEST}"

if [[ -n "${SP_BIN}" ]]; then
  echo "  Registering and applying extension with Spicetify..."
  "${SP_BIN}" config extensions "${EXT_FILE}"
  "${SP_BIN}" apply
  echo ""
  echo "Done! Open Spotify and click 'IDE Lyrics' (Ctrl+Alt+L / Cmd+Option+L)."
else
  echo ""
  echo "[NOTE] Spicetify CLI was not found in PATH."
  echo "       Install Spicetify from https://spicetify.app then run:"
  echo "       spicetify config extensions ideLyrics.js && spicetify apply"
fi
