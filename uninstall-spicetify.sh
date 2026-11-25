#!/usr/bin/env bash
# ==============================================================================
# Spicetify IDE Lyrics — Linux & macOS Uninstaller
# ==============================================================================
set -e

echo "Checking for Spicetify IDE Lyrics extension..."

SPICETIFY_BIN=""
if command -v spicetify >/dev/null 2>&1; then
  SPICETIFY_BIN="$(command -v spicetify)"
elif [ -x "$HOME/.spicetify/spicetify" ]; then
  SPICETIFY_BIN="$HOME/.spicetify/spicetify"
elif [ -x "/opt/homebrew/bin/spicetify" ]; then
  SPICETIFY_BIN="/opt/homebrew/bin/spicetify"
elif [ -x "/usr/local/bin/spicetify" ]; then
  SPICETIFY_BIN="/usr/local/bin/spicetify"
elif [ -x "$HOME/.local/bin/spicetify" ]; then
  SPICETIFY_BIN="$HOME/.local/bin/spicetify"
fi

EXT_DIRS=(
  "$HOME/.config/spicetify/Extensions"
  "$HOME/spicetify_data/Extensions"
  "$HOME/.spicetify/Extensions"
)

if [ -n "$SPICETIFY_BIN" ]; then
  RAW_PATH="$("$SPICETIFY_BIN" path -e root 2>/dev/null | tr -d '\r' | tail -n 1 || true)"
  if [ -n "$RAW_PATH" ] && [ -d "$RAW_PATH" ]; then
    EXT_DIRS=("$RAW_PATH" "${EXT_DIRS[@]}")
  fi
fi

REMOVED_ANY=false

for E_DIR in "${EXT_DIRS[@]}"; do
  EXT_FILE="$E_DIR/ideLyrics.js"
  if [ -f "$EXT_FILE" ]; then
    rm -f "$EXT_FILE"
    echo "Removed Spicetify extension file: $EXT_FILE"
    REMOVED_ANY=true
  fi
done

if [ -n "$SPICETIFY_BIN" ]; then
  CURRENT_EXTS="$("$SPICETIFY_BIN" config extensions 2>/dev/null || true)"
  if echo "$CURRENT_EXTS" | grep -q "ideLyrics.js"; then
    echo "Deregistering ideLyrics.js from Spicetify config..."
    "$SPICETIFY_BIN" config extensions ideLyrics.js- 2>/dev/null || true
    "$SPICETIFY_BIN" apply 2>/dev/null || true
    echo "Spicetify updated successfully."
    REMOVED_ANY=true
  fi
fi

if [ "$REMOVED_ANY" = false ]; then
  echo "No active Spicetify IDE Lyrics extension found."
fi
