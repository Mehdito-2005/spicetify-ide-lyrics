#!/usr/bin/env bash
# ==============================================================================
# Spicetify IDE Lyrics — Linux & macOS Installer
# ==============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXT_SOURCE="$SCRIPT_DIR/ideLyrics.js"

if [ ! -f "$EXT_SOURCE" ]; then
  echo "Error: Extension file not found: $EXT_SOURCE"
  exit 1
fi

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

if [ -z "$SPICETIFY_BIN" ]; then
  echo "Error: Spicetify CLI not found in PATH."
  echo "Install Spicetify first: https://spicetify.app/docs/getting-started/"
  exit 1
fi

EXT_DIR=""

RAW_PATH="$("$SPICETIFY_BIN" path -e root 2>/dev/null | tr -d '\r' | tail -n 1 || true)"
if [ -n "$RAW_PATH" ] && [ -d "$RAW_PATH" ]; then
  EXT_DIR="$RAW_PATH"
fi

if [ -z "$EXT_DIR" ]; then
  CONFIG_PATH="$("$SPICETIFY_BIN" -c 2>/dev/null | tr -d '\r' || true)"
  if [ -n "$CONFIG_PATH" ] && [ -f "$CONFIG_PATH" ]; then
    CONFIG_DIR="$(dirname "$CONFIG_PATH")"
    if [ -d "$CONFIG_DIR" ]; then
      EXT_DIR="$CONFIG_DIR/Extensions"
    fi
  fi
fi

if [ -z "$EXT_DIR" ]; then
  OS_NAME="$(uname -s)"
  if [ "$OS_NAME" = "Darwin" ]; then
    CANDIDATES=(
      "$HOME/spicetify_data/Extensions"
      "$HOME/.config/spicetify/Extensions"
      "$HOME/.spicetify/Extensions"
    )
  else
    CANDIDATES=(
      "$HOME/.config/spicetify/Extensions"
      "$HOME/.spicetify/Extensions"
      "$HOME/spicetify_data/Extensions"
    )
  fi

  for C in "${CANDIDATES[@]}"; do
    PARENT="$(dirname "$C")"
    if [ -d "$PARENT" ]; then
      EXT_DIR="$C"
      break
    fi
  done
fi

if [ -z "$EXT_DIR" ]; then
  EXT_DIR="$HOME/.config/spicetify/Extensions"
fi

mkdir -p "$EXT_DIR"
DEST_FILE="$EXT_DIR/ideLyrics.js"

cp -f "$EXT_SOURCE" "$DEST_FILE"
echo "Installed: $DEST_FILE"

"$SPICETIFY_BIN" config extensions ideLyrics.js
"$SPICETIFY_BIN" apply

echo "Spicetify extension applied. Restart Spotify to load IDE Lyrics."
