/**
 * Spicetify IDE Lyrics
 * Synchronized lyric visualizer styled as code syntax with 3D perspective and screensaver mode for Spotify.
 */

(function initSpicetifyIDELyrics() {
  if (!window.Spicetify || !Spicetify.Player || !Spicetify.CosmosAsync) {
    setTimeout(initSpicetifyIDELyrics, 250);
    return;
  }

  // Prevent multiple instantiations
  if (window.__SPICETIFY_IDE_LYRICS_ACTIVE__) {
    console.log("[Spicetify IDE Lyrics] Instance already active.");
    return;
  }

  const RTL_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u0590-\u05FF]/u;

  const VALID_BACKDROP_MODES = ["ambient", "simple", "custom", "vignette", "black", "green", "blue"];
  const VALID_FRAME_RATIOS = ["off", "9:16", "16:9", "1:1"];
  const VALID_REVEAL_MODES = ["highlight", "typewriter"];
  const PRESET_FORMAT = "ide-lyrics-preset";
  const PRESET_VERSION = 1;
  const EDIT_FRAME_RATIO_MAP = { "9:16": 9 / 16, "16:9": 16 / 9, "1:1": 1.0 };

  function normalizeBackdropMode(mode) {
    return VALID_BACKDROP_MODES.includes(mode) ? mode : "ambient";
  }

  function normalizeFrameRatio(ratio) {
    return VALID_FRAME_RATIOS.includes(ratio) ? ratio : "off";
  }

  function normalizeRevealMode(mode) {
    return VALID_REVEAL_MODES.includes(mode) ? mode : "highlight";
  }

  function isSolidBackdrop(mode) {
    return mode === "black" || mode === "green" || mode === "blue";
  }

  function isChromaBackdrop(mode) {
    return mode === "green" || mode === "blue";
  }

  const DEFAULT_SETTINGS = {
    rotX: 14,
    rotY: -12,
    rotZ: -4,
    fontSize: 40,
    lineSpacing: 1.0,
    tokenPadding: 4,
    lineGutter: 4,
    waveAmplitude: 1.15,
    dofStrength: 0.55,
    glowIntensity: 1.0,
    dynamicWordZoom: true,
    wordZoomScale: 1.25,
    wordTracking: true,
    wordTrackingMode: "stable",
    beatBounce: true,
    bounceIntensity: 1.2,
    idleMode: "lock",
    idleTimeout: 60,
    textDirection: "auto",
    annotationMode: "both",
    showBackgroundVocals: true,
    adlibMode: "separate",
    syntaxStyle: "mixed",
    matchSongTheme: true,
    themePreset: "cyberpunk",
    showCoverShowcase: true,
    activeLineOnly: false,
    lyricRevealMode: "highlight",
    syncOffsetMs: 0,
    cleanFeed: false,
    backdropMode: "ambient",
    customBgUrl: "",
    customBgType: "image",
    customBgOpacity: 0.6,
    customBgBlur: 0,
    frameRatio: "off",
    showFrameGuide: true,
    cinematicFx: true
  };

  const DEFAULT_PALETTE = {
    bgCore: "#09090f",
    keyword: "#ff4fa8",
    method: "#ff9933",
    string: "#2dd4bf",
    variable: "#60a5fa",
    number: "#a78bfa",
    comment: "rgba(255, 255, 255, 0.45)",
    cursorTop: "#ffbe44",
    cursorMid: "#ff6a00",
    cursorBot: "#ff3d00",
    cursorGlow: "#ff7700",
    waves: [
      "rgba(255, 79, 168, 0.28)",
      "rgba(255, 153, 51, 0.25)",
      "rgba(45, 212, 191, 0.22)",
      "rgba(96, 165, 250, 0.24)",
      "rgba(167, 139, 250, 0.26)"
    ]
  };

  const CURATED_THEMES = {
    cyberpunk: { ...DEFAULT_PALETTE },
    tokyoNight: {
      bgCore: "#0d0f18",
      keyword: "#bb9af7",
      method: "#7aa2f7",
      string: "#9ece6a",
      variable: "#c0caf5",
      number: "#ff9e64",
      comment: "rgba(169, 177, 214, 0.52)",
      cursorTop: "#7dcfff",
      cursorMid: "#7aa2f7",
      cursorBot: "#bb9af7",
      cursorGlow: "#7aa2f7",
      waves: [
        "rgba(187, 154, 247, 0.24)",
        "rgba(122, 162, 247, 0.24)",
        "rgba(125, 207, 255, 0.20)",
        "rgba(158, 206, 106, 0.18)",
        "rgba(255, 158, 100, 0.20)"
      ]
    },
    dracula: {
      bgCore: "#11121b",
      keyword: "#ff79c6",
      method: "#50fa7b",
      string: "#f1fa8c",
      variable: "#f8f8f2",
      number: "#bd93f9",
      comment: "rgba(98, 114, 164, 0.85)",
      cursorTop: "#ff79c6",
      cursorMid: "#bd93f9",
      cursorBot: "#8be9fd",
      cursorGlow: "#ff79c6",
      waves: [
        "rgba(255, 121, 198, 0.24)",
        "rgba(189, 147, 249, 0.24)",
        "rgba(80, 250, 123, 0.18)",
        "rgba(139, 233, 253, 0.20)",
        "rgba(255, 184, 108, 0.20)"
      ]
    },
    nord: {
      bgCore: "#0e131a",
      keyword: "#81a1c1",
      method: "#88c0d0",
      string: "#a3be8c",
      variable: "#eceff4",
      number: "#b48ead",
      comment: "rgba(216, 222, 233, 0.5)",
      cursorTop: "#88c0d0",
      cursorMid: "#81a1c1",
      cursorBot: "#5e81ac",
      cursorGlow: "#88c0d0",
      waves: [
        "rgba(136, 192, 208, 0.22)",
        "rgba(129, 161, 193, 0.24)",
        "rgba(163, 190, 140, 0.18)",
        "rgba(180, 142, 173, 0.20)",
        "rgba(94, 129, 172, 0.22)"
      ]
    },
    monokai: {
      bgCore: "#131210",
      keyword: "#f92672",
      method: "#a6e22e",
      string: "#e6db74",
      variable: "#f8f8f2",
      number: "#ae81ff",
      comment: "rgba(117, 113, 94, 0.9)",
      cursorTop: "#fd971f",
      cursorMid: "#f92672",
      cursorBot: "#ae81ff",
      cursorGlow: "#f92672",
      waves: [
        "rgba(249, 38, 114, 0.24)",
        "rgba(166, 226, 46, 0.18)",
        "rgba(253, 151, 31, 0.22)",
        "rgba(102, 217, 239, 0.20)",
        "rgba(174, 129, 255, 0.22)"
      ]
    }
  };

  const DEFAULT_KEYBINDS = {
    toggleVisualizer: { name: "Toggle Lyrics Visualizer", label: "Ctrl + Alt + L", key: "l", code: "KeyL", ctrl: true, alt: true, shift: false, meta: false },
    toggleFullscreen: { name: "Toggle Fullscreen Mode", label: "Ctrl + Shift + L", key: "l", code: "KeyL", ctrl: true, alt: false, shift: true, meta: false },
    screensaverLock:  { name: "Lock Screen / Screensaver", label: "Ctrl + Alt + S", key: "s", code: "KeyS", ctrl: true, alt: true, shift: false, meta: false },
    toggleSettings:   { name: "Open / Close Settings", label: "S", key: "s", code: "KeyS", ctrl: false, alt: false, shift: false, meta: false },
    toggleCleanFeed:  { name: "Toggle Clean Feed (Edit Mode)", label: "E", key: "e", code: "KeyE", ctrl: false, alt: false, shift: false, meta: false },
    playPause:        { name: "Play / Pause", label: "Space", key: " ", code: "Space", ctrl: false, alt: false, shift: false, meta: false },
    nextTrack:        { name: "Next Track", label: "→", key: "arrowright", code: "ArrowRight", ctrl: false, alt: false, shift: false, meta: false },
    prevTrack:        { name: "Previous Track", label: "←", key: "arrowleft", code: "ArrowLeft", ctrl: false, alt: false, shift: false, meta: false }
  };

  class SpicetifyIDELyricsEngine {
    constructor() {
      this.version = "2.3.0";
      this.enabled = true;
      this.isFullscreen = false;
      this.isLockActive = false;
      this.currentLockMode = "lock";
      this._lockActivatedAt = 0;
      this._lockInitialMouse = null;
      this._preLockFullscreen = false;
      this._lastActivityTime = Date.now();
      this._lockClockTimer = null;
      this._screensaverClockTimer = null;
      this._idleCheckTimer = null;

      let storedSettings = {};
      try {
        const saved = localStorage.getItem("spicetify_ide_lyrics_settings");
        if (saved) storedSettings = JSON.parse(saved);
        const savedEnabled = localStorage.getItem("spicetify_ide_lyrics_enabled");
        if (savedEnabled !== null) this.enabled = savedEnabled === "true";
      } catch (e) {}

      this.settings = { ...DEFAULT_SETTINGS, ...storedSettings, cleanFeed: false };
      this.settings.backdropMode = normalizeBackdropMode(this.settings.backdropMode);
      this.settings.frameRatio = normalizeFrameRatio(this.settings.frameRatio);
      this.settings.lyricRevealMode = normalizeRevealMode(this.settings.lyricRevealMode);
      this.settings.showFrameGuide = this.settings.showFrameGuide !== false;
      this.settings.cinematicFx = this.settings.cinematicFx !== false;
      this._lastRevealMode = null;
      this._presetFeedbackTimer = null;
      this._ambientMotes = null;
      this._lastCinematicBassStr = "";
      this._lastVignetteOpacityStr = "";
      this.showCoverShowcase = this.settings.showCoverShowcase !== false;
      this.dockMinimized = false;
      this.isScrubbing = false;
      this.lastArtworkTrackUrl = "";
      this.rawLyrics = [];
      this.palette = { ...(CURATED_THEMES[this.settings.themePreset] || DEFAULT_PALETTE) };
      this.audioState = { bassPulse: 0 };
      this.currentCameraZoom = 1.0;
      this.isCurrentlySpeaking = false;
      this._lastBeatFired = 0;
      this.compiledLines = [];
      this.cachedLineNodes = [];
      this.activeLineIndex = -1;
      this.activeTokenIndex = -1;
      this.currentScrollRem = 0;
      this.targetScrollRem = 0;
      this.currentTime = 0;
      this.duration = 0;
      this.currentTrackId = null;
      this.lyricsCache = new Map();
      this.settingsPanelOpen = false;
      this.rafId = null;
      this._destroyed = false;
      this._renderCallback = null;
      this._lastCssVarsSig = "";

      let storedKeybinds = {};
      try {
        const savedKb = localStorage.getItem("spicetify_ide_lyrics_keybinds");
        if (savedKb) storedKeybinds = JSON.parse(savedKb);
      } catch (e) {}
      this.keybinds = Object.assign({}, DEFAULT_KEYBINDS, storedKeybinds);
      this.recordingKeybindAction = null;
    }

    init() {
      window.__SPICETIFY_IDE_LYRICS_ACTIVE__ = this;
      this.injectStyles();
      this.mountDOM();
      this.bindPlayerEvents();
      this.bindKeyboardShortcuts();
      this.registerTopbarButton();
      this.initIdleWatcher();
      this.startRenderLoop();
      this.onTrackChange();
      console.log(`[Spicetify IDE Lyrics] Initialized v${this.version}`);
    }

    injectStyles() {
      if (document.getElementById("spicetify-ide-lyrics-styles")) return;
      const style = document.createElement("style");
      style.id = "spicetify-ide-lyrics-styles";
      style.textContent = `
        :root {
          --sp-ide-font: "SF Mono", "JetBrains Mono", "Fira Code", Menlo, Monaco, "Cascadia Code", Consolas, "Ubuntu Mono", "DejaVu Sans Mono", "Vazirmatn", "Segoe UI", "Noto Sans Arabic", "PingFang SC", "Microsoft YaHei", "Meiryo", ui-monospace, monospace;
          --bg-core: ${this.palette.bgCore || "#09090f"};
          --tok-keyword: ${this.palette.keyword};
          --tok-method: ${this.palette.method};
          --tok-string: ${this.palette.string};
          --tok-variable: ${this.palette.variable};
          --tok-number: ${this.palette.number};
          --tok-comment: ${this.palette.comment};
          --cursor-top: ${this.palette.cursorTop};
          --cursor-mid: ${this.palette.cursorMid};
          --cursor-bot: ${this.palette.cursorBot};
          --cursor-glow: ${this.palette.cursorGlow};
          --ide-line-height: 1.48;
          --ide-line-margin: 0.2em;
          --ide-token-padding: 1.4px 4px;
          --ide-plane-padding-left: 4%;
          --ide-glow-mult: 1.00;
        }

        #spicetify-ide-visualizer-root {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: 9990;
          overflow: hidden;
          background: var(--bg-core, #09090f);
          transition: background 0.6s ease;
          font-family: var(--sp-ide-font);
          color: #f8fafc;
          display: none;
          flex-direction: column;
          user-select: none;
        }

        #spicetify-ide-visualizer-root.is-active {
          display: flex;
        }

        #spicetify-ide-visualizer-root.is-disabled {
          background: transparent !important;
          pointer-events: none !important;
        }

        #spicetify-ide-visualizer-root.is-disabled #spicetify-ide-canvas,
        #spicetify-ide-visualizer-root.is-disabled .spicetify-ide-stage,
        #spicetify-ide-visualizer-root.is-disabled #spicetify-ide-cover-showcase,
        #spicetify-ide-visualizer-root.is-disabled #spicetify-ide-player-dock,
        #spicetify-ide-visualizer-root.is-disabled #spicetify-ide-settings-panel {
          display: none !important;
        }

        #spicetify-ide-visualizer-root.is-disabled #spicetify-ide-floating-pill,
        #spicetify-ide-visualizer-root.is-disabled #spicetify-ide-lock-overlay {
          pointer-events: auto !important;
        }

        #spicetify-ide-visualizer-root.is-disabled #spicetify-ide-floating-pill button:not([data-act="toggle-enable"]):not([data-act="close-visualizer"]) {
          display: none !important;
        }

        #spicetify-ide-canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
          pointer-events: none;
        }

        .spicetify-ide-stage {
          position: relative;
          width: 100%;
          height: 100%;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
          perspective: 900px;
          overflow: hidden;
        }

        .spicetify-ide-plane {
          position: relative;
          width: 90%;
          max-width: 1300px;
          transform-style: preserve-3d;
          transform-origin: center center;
          padding-left: var(--ide-plane-padding-left);
          box-sizing: border-box;
          will-change: transform;
        }

        .spicetify-ide-interlude {
          position: absolute;
          left: 50%;
          bottom: 96px;
          transform: translateX(-50%) translateY(8px);
          z-index: 6;
          pointer-events: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
          padding: 8px 14px;
          border-radius: 999px;
          background: rgba(9, 6, 20, 0.78);
          border: 1px solid rgba(125, 207, 255, 0.25);
          box-shadow: 0 6px 24px rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(8px);
          opacity: 0;
          transition: opacity 0.28s ease, transform 0.28s ease;
        }

        .spicetify-ide-interlude.is-visible {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }

        .spicetify-ide-interlude-label {
          display: none;
        }

        .spicetify-ide-interlude-track {
          width: min(460px, 68vw);
          height: 4px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.14);
          overflow: hidden;
        }

        .spicetify-ide-interlude-fill {
          width: 0%;
          height: 100%;
          border-radius: 999px;
          background: var(--tok-keyword, #7dcfff);
          transition: width 0.08s linear;
        }

        .spicetify-ide-line {
          position: relative;
          display: flex;
          align-items: baseline;
          flex-wrap: wrap;
          gap: 6px;
          width: fit-content;
          font-size: var(--ide-font-size, 38px);
          line-height: var(--ide-line-height);
          margin-bottom: var(--ide-line-margin);
          padding: 6px 14px;
          margin-left: -14px;
          border-left: 4px solid transparent;
          border-radius: 8px;
          transition: opacity 0.25s ease, filter 0.25s ease, transform 0.25s ease, background 0.2s ease, border-color 0.2s ease;
          opacity: 0.14;
          filter: blur(2.5px);
          cursor: pointer;
        }

        .spicetify-ide-line.is-near-1 {
          opacity: 0.50;
          filter: blur(0.6px);
        }

        .spicetify-ide-line.is-near-2 {
          opacity: 0.28;
          filter: blur(1.5px);
        }

        .spicetify-ide-line.is-active-line {
          opacity: 1 !important;
          filter: blur(0px) !important;
          transform: translateZ(28px) scale(1.04);
          background: linear-gradient(90deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.03) 75%, transparent 100%) !important;
          border-left-color: var(--tok-keyword) !important;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6), inset 0 0 16px rgba(255, 255, 255, 0.04);
        }

        .spicetify-ide-line.is-active-line .spicetify-line-gutter {
          color: #ffffff !important;
          text-shadow: 0 0 10px var(--tok-keyword);
          font-weight: 800;
        }

        .spicetify-ide-line.is-active-line .spicetify-code-token {
          font-weight: 650;
          filter: brightness(1.3) drop-shadow(0 0 6px color-mix(in srgb, var(--tok-keyword) 27%, transparent));
        }

        .spicetify-ide-plane:not(.is-typewriter) .spicetify-ide-line.is-active-line .spicetify-code-token.is-sung {
          opacity: 0.96;
        }

        .spicetify-ide-plane:not(.is-typewriter) .spicetify-ide-line.is-active-line .spicetify-code-token.is-upcoming {
          opacity: 0.56;
        }

        .spicetify-ide-line:hover {
          opacity: 0.72;
          filter: blur(0px);
        }

        /* L1: Multi-Language Inline Code Comments */
        .spicetify-ide-line-comment,
        .code-comment {
          flex: 1 0 100%;
          width: 100%;
          padding-left: calc(2.5em + 20px);
          font-size: 0.62em;
          line-height: 1.35;
          color: var(--tok-comment, rgba(255, 255, 255, 0.45));
          font-style: italic;
          opacity: 0.78;
          margin-top: 2px;
          white-space: normal;
          word-break: break-word;
          pointer-events: none;
        }

        .spicetify-ide-line.is-active-line .spicetify-ide-line-comment,
        .spicetify-ide-line.is-active-line .code-comment {
          opacity: 0.92;
        }

        .spicetify-ide-line.is-rtl {
          direction: rtl;
          flex-direction: row;
          text-align: right;
          border-left: none;
          border-right: 4px solid transparent;
        }

        .spicetify-ide-line.is-rtl.is-active-line {
          border-right-color: var(--tok-keyword) !important;
        }

        .spicetify-ide-line.is-rtl .spicetify-line-gutter {
          margin-right: 0;
          margin-left: 14px;
          text-align: left;
        }

        .spicetify-ide-line.is-rtl .spicetify-ide-line-comment,
        .spicetify-ide-line.is-rtl .code-comment {
          padding-left: 0;
          padding-right: calc(2.5em + 20px);
          direction: rtl;
          text-align: right;
        }

        /* Adlib Separation (Separate / Hide / Inline) */
        .spicetify-ide-line-adlib {
          flex: 1 0 100%;
          width: 100%;
          padding-left: calc(2.5em + 28px);
          font-size: 0.58em;
          line-height: 1.3;
          color: var(--tok-comment, #8c7db0);
          font-style: italic;
          opacity: 0.68;
          margin-top: 0.14em;
          letter-spacing: 0.02em;
          white-space: normal;
          word-break: break-word;
          pointer-events: none;
          user-select: none;
        }

        .spicetify-ide-line.is-active-line .spicetify-ide-line-adlib {
          opacity: 0.86;
          color: color-mix(in srgb, var(--tok-keyword, #7dcfff) 55%, var(--tok-comment, #8c7db0));
        }

        .spicetify-ide-line.is-rtl .spicetify-ide-line-adlib {
          padding-left: 0;
          padding-right: calc(2.5em + 28px);
          direction: rtl;
          text-align: right;
        }

        .spicetify-ide-line.is-adlib-only-line {
          font-style: italic;
          opacity: 0.78;
          color: var(--tok-comment, #8c7db0);
        }

        .spicetify-ide-line.is-adlib-only-line .spicetify-line-gutter::after {
          content: " //";
          color: var(--tok-comment, #8c7db0);
        }

        .spicetify-ide-line.is-adlib-hidden {
          opacity: 0 !important;
          visibility: hidden !important;
          pointer-events: none !important;
        }

        .spicetify-line-gutter {
          color: rgba(255, 255, 255, 0.35);
          font-size: 0.65em;
          min-width: 2.5em;
          text-align: right;
          margin-right: 14px;
          user-select: none;
          font-weight: 300;
        }

        .spicetify-code-token {
          padding: var(--ide-token-padding);
          border-radius: 4px;
          display: inline-block;
          transition: all 0.14s ease;
        }

        .spicetify-tok-keyword { color: var(--tok-keyword); font-weight: 700; }
        .spicetify-tok-method { color: var(--tok-method); font-weight: 600; }
        .spicetify-tok-string { color: var(--tok-string); }
        .spicetify-tok-variable { color: var(--tok-variable); }
        .spicetify-tok-number { color: var(--tok-number); }
        .spicetify-tok-comment { color: var(--tok-comment); font-style: italic; }
        .spicetify-tok-operator { color: #f43f5e; font-weight: 600; }

        .spicetify-code-token.active-word {
          color: #ffffff !important;
          opacity: 1 !important;
          text-shadow: 0 0 calc(12px * var(--ide-glow-mult)) var(--tok-keyword), 0 0 calc(24px * var(--ide-glow-mult)) var(--tok-method);
          transform: scale(1.18);
          font-weight: 800;
        }

        .spicetify-code-token.is-word-bounce {
          animation: spicetifyTokenBounce 0.24s cubic-bezier(0.18, 0.89, 0.32, 1.28);
        }

        @keyframes spicetifyTokenBounce {
          0% { transform: scale(1); }
          50% { transform: scale(1.24) translateY(-2px); }
          100% { transform: scale(1.18); }
        }

        /* Live Typewriter Mode */
        .spicetify-ide-plane.is-typewriter .spicetify-ide-line.is-future-line {
          opacity: 0 !important;
          visibility: hidden !important;
          pointer-events: none !important;
        }

        .spicetify-ide-plane.is-typewriter .spicetify-code-token {
          transition: color 0.14s ease, text-shadow 0.14s ease;
        }

        .spicetify-ide-plane.is-typewriter .spicetify-code-token.is-untyped {
          opacity: 0 !important;
          visibility: hidden !important;
        }

        .spicetify-ide-plane.is-typewriter .spicetify-code-token.is-typing {
          clip-path: inset(0 calc(100% - var(--type-pct, 100%)) 0 0);
          color: #ffffff;
          text-shadow: 0 0 calc(10px * var(--ide-glow-mult, 1)) #ffffff, 0 0 calc(20px * var(--ide-glow-mult, 1)) var(--tok-keyword);
        }

        .spicetify-ide-plane.is-typewriter .spicetify-ide-line.is-rtl .spicetify-code-token.is-typing {
          clip-path: inset(0 0 0 calc(100% - var(--type-pct, 100%)));
        }

        .spicetify-tw-caret {
          position: absolute;
          top: 0;
          left: 0;
          width: 3px;
          height: 1.12em;
          border-radius: 2px;
          background: var(--tok-keyword, #ff4fa8);
          box-shadow: 0 0 calc(10px * var(--ide-glow-mult, 1)) var(--tok-keyword, #ff4fa8), 0 0 16px rgba(255, 255, 255, 0.85);
          pointer-events: none;
          z-index: 4;
          display: none;
          will-change: transform;
          transition: transform 55ms linear;
          animation: spicetifyTwCaretBlink 0.85s steps(2, start) infinite;
        }

        .spicetify-tw-caret.is-typing-solid {
          animation: none;
          opacity: 1;
        }

        .spicetify-ide-plane.is-typewriter .spicetify-ide-line.is-active-line .spicetify-tw-caret.is-visible {
          display: block;
        }

        @keyframes spicetifyTwCaretBlink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0.22; }
        }

        /* Floating Pill */
        #spicetify-ide-floating-pill {
          position: fixed;
          top: 20px;
          right: 24px;
          z-index: 9995;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-radius: 999px;
          background: rgba(15, 12, 28, 0.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
          opacity: 0;
          transition: opacity 0.22s ease;
        }

        #spicetify-ide-floating-pill:hover,
        #spicetify-ide-floating-pill:focus-within,
        #spicetify-ide-visualizer-root.is-disabled #spicetify-ide-floating-pill {
          opacity: 1;
        }

        #spicetify-ide-floating-pill button {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.14);
          color: rgba(255, 255, 255, 0.88);
          padding: 4px 10px;
          border-radius: 999px;
          cursor: pointer;
          font-size: 11.5px;
          font-family: inherit;
          transition: all 0.18s ease;
        }

        #spicetify-ide-floating-pill button:hover {
          background: rgba(255, 79, 168, 0.35);
          color: #ffffff;
        }

        #spicetify-ide-floating-pill button.is-on {
          background: linear-gradient(135deg, var(--tok-keyword) 0%, var(--tok-method) 100%);
          color: #ffffff;
          font-weight: 700;
        }

        /* Settings Modal */
        #spicetify-ide-settings-panel {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 500px;
          max-width: 92vw;
          max-height: 85vh;
          background: rgba(14, 12, 24, 0.94);
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 18px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.85);
          z-index: 10001;
          display: none;
          flex-direction: column;
          overflow: hidden;
          font-family: system-ui, -apple-system, sans-serif;
        }

        .spicetify-settings-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.12);
        }

        .spicetify-settings-title {
          font-size: 15px;
          font-weight: 700;
          color: #fff;
          margin: 0;
        }

        .spicetify-settings-body {
          padding: 16px 20px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .spicetify-settings-section {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 12px 14px;
        }

        .spicetify-settings-section-title {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--tok-keyword);
          letter-spacing: 0.5px;
          margin-bottom: 10px;
        }

        .spicetify-settings-row {
          margin-bottom: 10px;
        }

        .spicetify-settings-row:last-child {
          margin-bottom: 0;
        }

        .spicetify-settings-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.85);
          margin-bottom: 6px;
        }

        .spicetify-settings-btn-group {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          background: rgba(0, 0, 0, 0.45);
          padding: 3px 4px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.12);
        }

        .spicetify-group-btn {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.65);
          font-size: 11px;
          padding: 3px 9px;
          border-radius: 999px;
          cursor: pointer;
        }

        .spicetify-group-btn.is-active {
          background: linear-gradient(135deg, var(--tok-keyword) 0%, var(--tok-method) 100%);
          color: #fff;
          font-weight: 700;
        }

        .spicetify-settings-slider {
          width: 100%;
          accent-color: var(--tok-keyword);
          cursor: pointer;
        }

        
.spicetify-keybinds-list {
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin-top: 4px;
}

.spicetify-keybind-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  font-size: 11.5px;
}

.spicetify-keybind-action {
  color: rgba(255, 255, 255, 0.88);
  font-weight: 500;
}

.spicetify-keybind-badge {
  background: rgba(255, 255, 255, 0.09);
  border: 1px solid rgba(255, 255, 255, 0.22);
  color: var(--tok-method);
  font-family: var(--sp-ide-font);
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  min-width: 68px;
  text-align: center;
  transition: all 0.2s ease;
}

.spicetify-keybind-badge:hover {
  background: rgba(255, 79, 168, 0.28);
  border-color: var(--tok-keyword);
  color: #fff;
}

.spicetify-keybind-badge.is-recording {
  background: var(--tok-keyword) !important;
  color: #0b0813 !important;
  border-color: #ffffff !important;
  animation: keybindPulse 0.8s infinite alternate;
  font-weight: 800;
}

@keyframes keybindPulse {
  0% { box-shadow: 0 0 4px var(--tok-keyword); }
  100% { box-shadow: 0 0 16px var(--tok-keyword), 0 0 24px rgba(255, 79, 168, 0.6); }
}

.spicetify-settings-footer {
          padding: 12px 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.12);
          display: flex;
          justify-content: space-between;
        }

        .spicetify-preset-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .spicetify-preset-btn {
          flex: 1;
          min-width: 110px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.16);
          color: #f8fafc;
          font-size: 11.5px;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease;
        }

        .spicetify-preset-btn:hover {
          background: color-mix(in srgb, var(--tok-keyword) 28%, rgba(255, 255, 255, 0.08));
          border-color: var(--tok-keyword);
          color: #ffffff;
        }

        .spicetify-preset-btn.is-primary {
          background: linear-gradient(135deg, var(--tok-keyword) 0%, var(--tok-method) 100%);
          border-color: transparent;
          color: #ffffff;
        }

        .spicetify-preset-import-box {
          display: none;
          flex-direction: column;
          gap: 8px;
          margin-top: 10px;
        }

        .spicetify-preset-import-box.is-open {
          display: flex;
        }

        .spicetify-preset-textarea {
          width: 100%;
          box-sizing: border-box;
          resize: vertical;
          min-height: 76px;
          background: rgba(0, 0, 0, 0.42);
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 8px;
          padding: 8px 10px;
          color: #f8fafc;
          font-family: var(--sp-ide-font);
          font-size: 11px;
          line-height: 1.4;
          outline: none;
        }

        .spicetify-preset-textarea:focus {
          border-color: var(--tok-keyword);
        }

        .spicetify-preset-feedback {
          min-height: 16px;
          margin-top: 8px;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.72);
          transition: opacity 0.2s ease, color 0.2s ease;
        }

        .spicetify-preset-feedback.is-ok {
          color: var(--tok-string, #2dd4bf);
        }

        .spicetify-preset-feedback.is-err {
          color: #fb7185;
        }

        /* Ambient Lock Screen Overlay */
        #spicetify-ide-lock-overlay {
          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100vh;
          z-index: 10000;
          display: none;
          flex-direction: column;
          justify-content: space-between;
          align-items: center;
          padding: clamp(24px, 5vh, 60px) 24px;
          box-sizing: border-box;
          background: radial-gradient(circle at 50% 30%, rgba(15, 10, 25, 0.6) 0%, rgba(5, 5, 10, 0.88) 100%);
          backdrop-filter: blur(28px) saturate(180%);
          -webkit-backdrop-filter: blur(28px) saturate(180%);
          color: #ffffff;
          font-family: system-ui, -apple-system, sans-serif;
          user-select: none;
          cursor: pointer;
        }

        .spicetify-lock-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          margin-top: 20px;
        }

        .spicetify-lock-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 14px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 999px;
          font-size: 11.5px;
          font-weight: 600;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.85);
        }

        .spicetify-lock-clock {
          font-size: clamp(3.8rem, 9vw, 6.8rem);
          font-weight: 200;
          line-height: 1.05;
          letter-spacing: -2px;
          color: #ffffff;
          text-shadow: 0 4px 28px rgba(0, 0, 0, 0.6);
          font-variant-numeric: tabular-nums;
        }

        .spicetify-lock-date {
          font-size: clamp(1.1rem, 2.2vw, 1.45rem);
          font-weight: 400;
          color: rgba(255, 255, 255, 0.78);
        }

        .spicetify-lock-track-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px 20px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 20px;
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          max-width: 460px;
          width: 90%;
        }

        .spicetify-lock-art {
          width: 64px;
          height: 64px;
          border-radius: 12px;
          object-fit: cover;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
        }

        .spicetify-lock-track-title {
          font-size: 16px;
          font-weight: 700;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .spicetify-lock-track-artist {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.7);
          margin-top: 2px;
        }

        .spicetify-lock-hint {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.55);
          margin-bottom: 20px;
        }

        .spicetify-lock-track-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: var(--tok-keyword);
          margin-bottom: 2px;
        }

        .spicetify-lock-pulse-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--tok-keyword);
          box-shadow: 0 0 8px var(--tok-keyword);
          animation: spicetifyPulseDot 1.4s ease-in-out infinite alternate;
        }

        .spicetify-lock-pulse-dot.is-paused {
          animation: none !important;
          opacity: 0.35 !important;
        }

        @keyframes spicetifyPulseDot {
          0% { transform: scale(0.85); opacity: 0.6; }
          100% { transform: scale(1.3); opacity: 1; }
        }

        /* Screensaver Clock */
        #spicetify-ide-screensaver-clock {
          position: fixed;
          bottom: 24px;
          left: 28px;
          z-index: 9999;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.45);
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 6px 14px;
          border-radius: 999px;
          display: none;
          pointer-events: none;
        }

        #spicetify-ide-visualizer-root.is-screensaver-active #spicetify-ide-floating-pill,
        #spicetify-ide-visualizer-root.is-screensaver-active #spicetify-ide-cover-showcase,
        #spicetify-ide-visualizer-root.is-screensaver-active #spicetify-ide-player-dock {
          display: none !important;
        }

        /* Cover Showcase */
        #spicetify-ide-cover-showcase {
          position: absolute;
          left: clamp(28px, 4.8vw, 76px);
          top: 50%;
          transform: translateY(-50%);
          z-index: 18;
          width: clamp(248px, 24vw, 368px);
          max-height: 92vh;
          box-sizing: border-box;
          padding: 16px;
          border-radius: 26px;
          background: linear-gradient(
            160deg,
            color-mix(in srgb, var(--tok-keyword) 10%, rgba(14, 12, 24, 0.54)) 0%,
            rgba(10, 9, 18, 0.42) 100%
          );
          border: 1px solid color-mix(in srgb, var(--tok-keyword) 22%, rgba(255, 255, 255, 0.12));
          box-shadow:
            0 18px 48px rgba(0, 0, 0, 0.56),
            0 0 calc(46px * var(--ide-glow-mult, 1)) color-mix(in srgb, var(--tok-keyword) 24%, transparent),
            0 0 calc(84px * var(--ide-glow-mult, 1)) color-mix(in srgb, var(--tok-method) 14%, transparent);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          display: none;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 12px;
          pointer-events: auto;
          overflow-y: auto;
          scrollbar-width: none;
          transition: box-shadow 0.45s ease, border-color 0.45s ease, background 0.45s ease;
        }
        #spicetify-ide-cover-showcase::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          z-index: 0;
          background: radial-gradient(
            circle at 50% 24%,
            color-mix(in srgb, var(--tok-keyword) 22%, transparent) 0%,
            color-mix(in srgb, var(--tok-method) 11%, transparent) 44%,
            transparent 74%
          );
          opacity: 0.85;
          transition: opacity 0.4s ease;
        }
        #spicetify-ide-cover-showcase > * {
          position: relative;
          z-index: 1;
        }
        #spicetify-ide-cover-showcase::-webkit-scrollbar { display: none; }
        #spicetify-ide-visualizer-root.has-cover-showcase #spicetify-ide-cover-showcase { display: flex; }
        #spicetify-ide-visualizer-root.has-cover-showcase .spicetify-ide-stage {
          padding-left: clamp(280px, 28vw, 420px);
        }
        #spicetify-ide-visualizer-root.is-cinematic-fx #spicetify-ide-cover-showcase {
          box-shadow:
            0 18px 48px rgba(0, 0, 0, 0.56),
            0 0 calc((46px + 18px * var(--cinematic-bass, 0)) * var(--ide-glow-mult, 1)) color-mix(in srgb, var(--tok-keyword) 28%, transparent),
            0 0 calc((84px + 26px * var(--cinematic-bass, 0)) * var(--ide-glow-mult, 1)) color-mix(in srgb, var(--tok-method) 16%, transparent);
        }
        #spicetify-ide-visualizer-root.is-solid-backdrop #spicetify-ide-cover-showcase {
          box-shadow: none !important;
          background: rgba(12, 10, 20, 0.86);
          transition: none !important;
        }
        #spicetify-ide-visualizer-root.is-solid-backdrop #spicetify-ide-cover-showcase::before {
          display: none;
        }
        #spicetify-ide-visualizer-root.is-compact #spicetify-ide-cover-showcase { display: none !important; }
        #spicetify-ide-visualizer-root.is-compact #spicetify-ide-floating-pill button[data-act="toggle-focus"],
        #spicetify-ide-visualizer-root.is-compact #spicetify-ide-floating-pill button[data-act="toggle-cover"] {
          display: none !important;
        }

        .spicetify-cover-art-frame {
          position: relative;
          width: 100%;
          aspect-ratio: 1 / 1;
          border-radius: 20px;
          overflow: hidden;
          border: 1.5px solid color-mix(in srgb, var(--tok-keyword) 30%, rgba(255, 255, 255, 0.2));
          background: rgba(15, 8, 28, 0.75);
          box-shadow:
            0 20px 52px rgba(0, 0, 0, 0.78),
            0 0 calc(36px * var(--ide-glow-mult, 1)) color-mix(in srgb, var(--tok-keyword) 28%, transparent),
            0 0 calc(62px * var(--ide-glow-mult, 1)) color-mix(in srgb, var(--tok-method) 15%, transparent);
          cursor: pointer;
          transition: transform 0.28s ease, box-shadow 0.35s ease, border-color 0.28s ease;
        }
        .spicetify-cover-art-frame:hover {
          transform: translateY(-4px) scale(1.02);
          border-color: var(--tok-keyword);
          box-shadow:
            0 24px 58px rgba(0, 0, 0, 0.82),
            0 0 calc(46px * var(--ide-glow-mult, 1)) color-mix(in srgb, var(--tok-keyword) 38%, transparent),
            0 0 calc(78px * var(--ide-glow-mult, 1)) color-mix(in srgb, var(--tok-method) 20%, transparent);
        }
        .spicetify-cover-art-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .spicetify-cover-art-overlay {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle, rgba(0, 0, 0, 0.45) 0%, rgba(0, 0, 0, 0.15) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s ease;
          font-size: 13px;
          font-weight: 700;
          color: #fff;
        }
        .spicetify-cover-art-frame:hover .spicetify-cover-art-overlay { opacity: 1; }

        .spicetify-cover-showcase-meta {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 0 4px;
        }
        .spicetify-cover-meta-left {
          flex: 1;
          min-width: 0;
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .spicetify-cover-showcase-title {
          font-size: clamp(15px, 1.3vw, 20px);
          font-weight: 800;
          color: #ffffff;
          line-height: 1.25;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .spicetify-cover-showcase-artist {
          font-size: clamp(12px, 1.05vw, 15px);
          font-weight: 600;
          color: rgba(255, 255, 255, 0.85);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .spicetify-cover-showcase-album {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.65);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .spicetify-cover-btn-icon {
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #fff;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          cursor: pointer;
        }
        .spicetify-cover-btn-icon.is-active {
          background: var(--tok-keyword);
          color: #111;
        }

        .spicetify-cover-controls {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .spicetify-cover-scrubber-wrap {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .spicetify-cover-scrubber {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 5px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.2);
          outline: none;
          cursor: pointer;
        }
        .spicetify-cover-times {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.65);
          font-variant-numeric: tabular-nums;
        }
        .spicetify-cover-badge {
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 1px 6px;
          background: rgba(255, 255, 255, 0.12);
          border-radius: 4px;
          color: rgba(255, 255, 255, 0.88);
        }
        .spicetify-cover-main-transport {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 24px;
          width: 100%;
        }
        .spicetify-cover-trans-btn {
          background: transparent;
          border: none;
          color: #fff;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 6px;
          border-radius: 50%;
          transition: transform 0.15s ease, color 0.15s ease;
        }
        .spicetify-cover-trans-btn:hover { color: var(--tok-keyword); transform: scale(1.12); }
        .spicetify-cover-trans-btn.is-play-main {
          width: 48px;
          height: 48px;
          background: rgba(255, 255, 255, 0.16);
          border: 1px solid rgba(255, 255, 255, 0.25);
        }
        .spicetify-cover-sub-transport {
          display: flex;
          align-items: center;
          justify-content: space-around;
          width: 100%;
          padding-top: 6px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }
        .spicetify-cover-sub-btn {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.14);
          color: rgba(255, 255, 255, 0.85);
          border-radius: 10px;
          padding: 5px 10px;
          font-size: 11px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }
        .spicetify-cover-sub-btn.is-active {
          background: linear-gradient(
            135deg,
            color-mix(in srgb, var(--tok-keyword) 50%, transparent) 0%,
            color-mix(in srgb, var(--tok-method) 40%, transparent) 100%
          );
          border-color: color-mix(in srgb, var(--tok-keyword) 65%, rgba(255, 255, 255, 0.55));
          color: #fff;
        }

        /* Player Dock */
        #spicetify-ide-player-dock {
          position: fixed;
          bottom: 18px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 9995;
          width: min(92vw, 860px);
          background: rgba(10, 10, 18, 0.82);
          backdrop-filter: blur(18px);
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 16px;
          padding: 8px 14px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.55);
        }
        #spicetify-ide-visualizer-root.has-cover-showcase #spicetify-ide-player-dock {
          display: none !important;
        }
        .spicetify-dock-scrubber-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.7);
          font-variant-numeric: tabular-nums;
        }
        .spicetify-dock-slider {
          flex: 1;
          height: 4px;
          border-radius: 999px;
          cursor: pointer;
        }
        .spicetify-dock-main-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }
        .spicetify-dock-track {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
          flex: 1;
        }
        .spicetify-dock-art {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          object-fit: cover;
          background: rgba(255, 255, 255, 0.08);
          flex-shrink: 0;
        }
        .spicetify-dock-meta {
          min-width: 0;
          display: flex;
          flex-direction: column;
        }
        .spicetify-dock-title {
          font-size: 12px;
          font-weight: 700;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .spicetify-dock-artist {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.68);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .spicetify-dock-transport,
        .spicetify-dock-extra-controls {
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .spicetify-dock-btn {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.14);
          color: #e2e8f0;
          border-radius: 999px;
          padding: 4px 9px;
          font-size: 11px;
          font-family: inherit;
          cursor: pointer;
        }
        .spicetify-dock-btn:hover {
          background: rgba(255, 255, 255, 0.18);
          color: #fff;
        }
        .spicetify-dock-btn.is-active {
          background: linear-gradient(135deg, var(--tok-keyword), var(--tok-method));
          color: #fff;
          border-color: rgba(255, 255, 255, 0.45);
        }
        #spicetify-ide-player-dock.is-minimized .spicetify-dock-scrubber-row,
        #spicetify-ide-player-dock.is-minimized .spicetify-dock-track {
          display: none;
        }
        #spicetify-ide-visualizer-root.is-active-line-only .spicetify-ide-line:not(.is-active-line),
        #spicetify-ide-visualizer-root.is-active-line-only .spicetify-ide-line:not(.is-active-line):hover {
          opacity: 0 !important;
          visibility: hidden !important;
          pointer-events: none !important;
          transition: none !important;
        }
        #spicetify-ide-visualizer-root.is-fullscreen.is-cursor-idle,
        #spicetify-ide-visualizer-root.is-fullscreen.is-cursor-idle * {
          cursor: none !important;
        }
        #spicetify-ide-visualizer-root.is-fullscreen #spicetify-ide-floating-pill {
          transition: opacity 0.25s ease;
        }
        #spicetify-ide-visualizer-root.is-fullscreen.is-cursor-idle #spicetify-ide-floating-pill {
          opacity: 0 !important;
          pointer-events: none !important;
        }
        .spicetify-ide-sync-hud {
          position: absolute;
          top: 22px;
          left: 50%;
          transform: translateX(-50%) translateY(-6px);
          z-index: 9996;
          pointer-events: none;
          padding: 5px 12px;
          border-radius: 999px;
          background: rgba(12, 8, 24, 0.85);
          border: 1px solid rgba(125, 207, 255, 0.35);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(8px);
          font-family: var(--sp-ide-font, monospace);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.03em;
          color: var(--tok-keyword, #7dcfff);
          opacity: 0;
          transition: opacity 0.2s ease, transform 0.2s ease;
          white-space: nowrap;
        }
        .spicetify-ide-sync-hud.is-visible {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
        .spicetify-ide-progress-hairline {
          position: absolute;
          left: 0;
          bottom: 0;
          height: 2px;
          width: 0%;
          z-index: 8;
          pointer-events: none;
          background: linear-gradient(90deg, var(--tok-keyword, #ff4fa8), var(--tok-method, #ff9933));
          opacity: 0.65;
          transition: width 0.12s linear;
        }

        /* === Edit Studio & Immersion === */
        #spicetify-ide-vignette {
          position: absolute;
          inset: 0;
          z-index: 3;
          pointer-events: none;
          background: radial-gradient(
            circle at 38% 50%,
            rgba(0, 0, 0, 0) 42%,
            rgba(4, 2, 9, 0.62) 86%,
            rgba(2, 1, 5, 0.90) 100%
          );
        }

        #spicetify-ide-visualizer-root.is-compact #spicetify-ide-floating-pill button[data-act="toggle-clean-feed"] {
          display: none !important;
        }

        /* Clean Feed / Edit Recording Mode */
        #spicetify-ide-visualizer-root.is-clean-feed #spicetify-ide-floating-pill,
        #spicetify-ide-visualizer-root.is-clean-feed #spicetify-ide-cover-showcase,
        #spicetify-ide-visualizer-root.is-clean-feed #spicetify-ide-player-dock,
        #spicetify-ide-visualizer-root.is-clean-feed .spicetify-ide-progress-hairline,
        #spicetify-ide-visualizer-root.is-clean-feed .spicetify-ide-interlude,
        #spicetify-ide-visualizer-root.is-clean-feed .spicetify-ide-sync-hud,
        #spicetify-ide-visualizer-root.is-clean-feed #spicetify-ide-frame-guide {
          display: none !important;
        }

        #spicetify-ide-visualizer-root.is-clean-feed .spicetify-ide-stage {
          padding-left: 0 !important;
          justify-content: center;
        }

        #spicetify-ide-visualizer-root.is-clean-feed,
        #spicetify-ide-visualizer-root.is-clean-feed * {
          cursor: none !important;
        }

        #spicetify-ide-visualizer-root.is-clean-feed #spicetify-ide-settings-panel,
        #spicetify-ide-visualizer-root.is-clean-feed #spicetify-ide-settings-panel * {
          cursor: auto !important;
        }

        #spicetify-ide-visualizer-root.is-clean-feed #spicetify-ide-settings-panel button,
        #spicetify-ide-visualizer-root.is-clean-feed #spicetify-ide-settings-panel input[type="range"] {
          cursor: pointer !important;
        }

        #spicetify-ide-visualizer-root.is-clean-feed .spicetify-ide-line {
          pointer-events: none !important;
        }

        /* Backdrop & Chroma Key Presets */
        #spicetify-ide-visualizer-root.is-solid-backdrop {
          transition: none !important;
        }

        #spicetify-ide-visualizer-root[data-backdrop="black"] {
          background: #000000 !important;
          background-color: #000000 !important;
        }

        #spicetify-ide-visualizer-root[data-backdrop="green"] {
          background: #00ff00 !important;
          background-color: #00ff00 !important;
        }

        #spicetify-ide-visualizer-root[data-backdrop="blue"] {
          background: #0000ff !important;
          background-color: #0000ff !important;
        }

        #spicetify-ide-visualizer-root.is-solid-backdrop #spicetify-ide-canvas,
        #spicetify-ide-visualizer-root.is-solid-backdrop #spicetify-ide-vignette {
          display: none !important;
        }

        #spicetify-ide-visualizer-root[data-backdrop="black"] .spicetify-ide-line,
        #spicetify-ide-visualizer-root[data-backdrop="black"] .spicetify-ide-line.is-active-line {
          background: transparent !important;
          box-shadow: none !important;
        }

        #spicetify-ide-visualizer-root[data-backdrop="green"] .spicetify-ide-line,
        #spicetify-ide-visualizer-root[data-backdrop="green"] .spicetify-ide-line.is-active-line,
        #spicetify-ide-visualizer-root[data-backdrop="blue"] .spicetify-ide-line,
        #spicetify-ide-visualizer-root[data-backdrop="blue"] .spicetify-ide-line.is-active-line {
          background: transparent !important;
          box-shadow: none !important;
          filter: none !important;
          transition: none !important;
        }

        #spicetify-ide-visualizer-root[data-backdrop="green"] .spicetify-code-token,
        #spicetify-ide-visualizer-root[data-backdrop="blue"] .spicetify-code-token,
        #spicetify-ide-visualizer-root[data-backdrop="green"] .spicetify-code-token.active-word,
        #spicetify-ide-visualizer-root[data-backdrop="blue"] .spicetify-code-token.active-word,
        #spicetify-ide-visualizer-root[data-backdrop="green"] .spicetify-code-token.is-typing,
        #spicetify-ide-visualizer-root[data-backdrop="blue"] .spicetify-code-token.is-typing {
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.85) !important;
          box-shadow: none !important;
          filter: none !important;
        }

        #spicetify-ide-visualizer-root[data-backdrop="green"] .spicetify-tw-caret,
        #spicetify-ide-visualizer-root[data-backdrop="blue"] .spicetify-tw-caret {
          box-shadow: none !important;
        }

        #spicetify-ide-visualizer-root[data-backdrop="vignette"] #spicetify-ide-canvas {
          opacity: 0.72;
        }

        #spicetify-ide-visualizer-root[data-backdrop="vignette"] #spicetify-ide-vignette {
          background: radial-gradient(
            ellipse at center,
            rgba(0, 0, 0, 0) 24%,
            rgba(2, 1, 6, 0.74) 76%,
            rgba(0, 0, 0, 0.96) 100%
          );
        }

        /* Edit Framing Guide & Responsive Line Clamping */
        #spicetify-ide-frame-guide {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: var(--edit-frame-w);
          height: var(--edit-frame-h);
          border: 1px dashed rgba(255, 255, 255, 0.28);
          border-radius: 6px;
          box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.32);
          pointer-events: none;
          z-index: 4;
          display: none;
          box-sizing: border-box;
        }

        #spicetify-ide-visualizer-root.has-frame-ratio.show-frame-guide:not(.is-clean-feed):not(.is-compact) #spicetify-ide-frame-guide {
          display: block;
        }

        #spicetify-ide-visualizer-root.is-solid-backdrop #spicetify-ide-frame-guide {
          box-shadow: none !important;
          border-color: rgba(255, 255, 255, 0.65);
        }

        .spicetify-frame-guide-label {
          position: absolute;
          top: 8px;
          right: 10px;
          font-family: var(--sp-ide-font);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: rgba(255, 255, 255, 0.72);
          background: rgba(0, 0, 0, 0.5);
          padding: 2px 7px;
          border-radius: 4px;
          white-space: nowrap;
        }

        #spicetify-ide-visualizer-root.has-frame-ratio:not(.is-compact) .spicetify-ide-stage {
          padding-left: 0 !important;
          justify-content: center !important;
        }

        #spicetify-ide-visualizer-root.has-frame-ratio:not(.is-compact) .spicetify-ide-plane {
          width: min(94%, var(--edit-plane-max-w, 1300px)) !important;
          max-width: var(--edit-plane-max-w, 1300px) !important;
          padding-left: 16px !important;
          padding-right: 16px !important;
          box-sizing: border-box;
          margin: 0 auto;
        }

        #spicetify-ide-visualizer-root.has-frame-ratio:not(.is-compact) .spicetify-ide-line {
          max-width: 100%;
          box-sizing: border-box;
          margin-left: 0;
        }

        /* Immersive Cinematic Polish (Auto-disabled in .is-compact & .is-solid-backdrop) */
        .spicetify-ide-custom-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
          overflow: hidden;
          pointer-events: none;
          display: none;
          background: #06030a;
        }
        #spicetify-ide-visualizer-root[data-backdrop="custom"].has-custom-bg .spicetify-ide-custom-bg {
          display: block;
        }
        .spicetify-ide-custom-bg-img,
        .spicetify-ide-custom-bg-video {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: none;
          will-change: transform, filter, opacity;
        }
        #spicetify-ide-visualizer-root[data-backdrop="simple"] {
          background: radial-gradient(circle at 50% 42%, rgba(28, 22, 46, 0.96) 0%, #090612 68%, #040208 100%) !important;
        }
        #spicetify-ide-visualizer-root[data-backdrop="simple"] #spicetify-ide-canvas,
        #spicetify-ide-visualizer-root[data-backdrop="custom"] #spicetify-ide-canvas {
          display: none !important;
        }
        #spicetify-ide-visualizer-root[data-backdrop="custom"] {
          background: #06030a !important;
        }
        .spicetify-custom-bg-controls {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 6px;
        }
        .spicetify-custom-bg-url-row {
          display: flex;
          gap: 6px;
          align-items: center;
        }
        .spicetify-custom-bg-url-input {
          flex: 1;
          min-width: 0;
          background: rgba(0, 0, 0, 0.38);
          border: 1px solid rgba(255, 255, 255, 0.16);
          color: #fff;
          border-radius: 8px;
          padding: 6px 10px;
          font-size: 11px;
          outline: none;
        }
        .spicetify-custom-bg-actions {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .spicetify-custom-bg-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.16);
          color: #fff;
          font-size: 11px;
          padding: 5px 10px;
          border-radius: 8px;
          cursor: pointer;
        }
        .spicetify-custom-bg-btn:hover {
          background: rgba(255, 79, 168, 0.35);
        }

        #spicetify-ide-visualizer-root.is-cinematic-fx #spicetify-ide-vignette {
          transition: opacity 0.14s ease-out;
        }

        #spicetify-ide-visualizer-root.is-cinematic-fx .spicetify-ide-line.is-active-line {
          box-shadow:
            0 6px 26px rgba(0, 0, 0, 0.6),
            0 0 calc((20px + 16px * var(--cinematic-bass, 0)) * var(--ide-glow-mult, 1)) rgba(255, 79, 168, 0.22),
            inset 0 0 18px rgba(255, 255, 255, 0.05);
        }

        #spicetify-ide-visualizer-root.is-cinematic-fx .spicetify-code-token.active-word {
          transform: translateY(calc(-1.5px - 1px * var(--cinematic-bass, 0))) scale(1.19);
          text-shadow:
            0 0 calc((12px + 6px * var(--cinematic-bass, 0)) * var(--ide-glow-mult, 1)) #ffffff,
            0 0 calc((22px + 12px * var(--cinematic-bass, 0)) * var(--ide-glow-mult, 1)) var(--tok-keyword),
            0 0 calc((34px + 16px * var(--cinematic-bass, 0)) * var(--ide-glow-mult, 1)) var(--tok-method);
        }
      `;
      document.head.appendChild(style);
    }

    mountDOM() {
      // Main root
      this.root = document.createElement("div");
      this.root.id = "spicetify-ide-visualizer-root";

      // Wave canvas
      this.canvas = document.createElement("canvas");
      this.customBgEl = document.createElement("div");
      this.customBgEl.className = "spicetify-ide-custom-bg";
      this.customBgEl.setAttribute("aria-hidden", "true");
      this.customBgImg = document.createElement("img");
      this.customBgImg.className = "spicetify-ide-custom-bg-img";
      this.customBgImg.alt = "";
      this.customBgVideo = document.createElement("video");
      this.customBgVideo.className = "spicetify-ide-custom-bg-video";
      this.customBgVideo.autoplay = true;
      this.customBgVideo.loop = true;
      this.customBgVideo.muted = true;
      this.customBgVideo.playsInline = true;
      this.customBgEl.appendChild(this.customBgImg);
      this.customBgEl.appendChild(this.customBgVideo);
      this.root.appendChild(this.customBgEl);

      this.canvas.id = "spicetify-ide-canvas";
      this.ctx = this.canvas.getContext("2d");
      this.root.appendChild(this.canvas);

      // Stage & Code plane
      this.stage = document.createElement("div");
      this.stage.className = "spicetify-ide-stage";
      this.codePlane = document.createElement("div");
      this.codePlane.className = "spicetify-ide-plane";
      this.stage.appendChild(this.codePlane);

      this.interludeEl = document.createElement("div");
      this.interludeEl.className = "spicetify-ide-interlude";
      this.interludeEl.setAttribute("aria-hidden", "true");
      this.interludeEl.innerHTML = '<span class="spicetify-ide-interlude-label"></span><div class="spicetify-ide-interlude-track"><div class="spicetify-ide-interlude-fill"></div></div>';
      this.interludeLabelEl = this.interludeEl.querySelector(".spicetify-ide-interlude-label");
      this.interludeFillEl = this.interludeEl.querySelector(".spicetify-ide-interlude-fill");
      this.stage.appendChild(this.interludeEl);

      this.progressHairlineEl = document.createElement("div");
      this.progressHairlineEl.className = "spicetify-ide-progress-hairline";
      this.progressHairlineEl.setAttribute("aria-hidden", "true");
      this.stage.appendChild(this.progressHairlineEl);

      this.syncHudEl = document.createElement("div");
      this.syncHudEl.className = "spicetify-ide-sync-hud";
      this.syncHudEl.setAttribute("aria-hidden", "true");

      this.vignette = document.createElement("div");
      this.vignette.id = "spicetify-ide-vignette";
      this.vignette.setAttribute("aria-hidden", "true");

      this.frameGuideEl = document.createElement("div");
      this.frameGuideEl.id = "spicetify-ide-frame-guide";
      this.frameGuideEl.className = "spicetify-ide-frame-guide";
      this.frameGuideEl.setAttribute("aria-hidden", "true");
      this.frameGuideLabelEl = document.createElement("span");
      this.frameGuideLabelEl.className = "spicetify-frame-guide-label";
      this.frameGuideEl.appendChild(this.frameGuideLabelEl);

      this.root.appendChild(this.stage);
      this.root.appendChild(this.vignette);
      this.root.appendChild(this.frameGuideEl);
      this.root.appendChild(this.syncHudEl);

      // Cover Showcase & Player Dock
      this.mountCoverShowcase();
      this.mountPlayerDock();

      // Floating control pill
      this.pill = document.createElement("div");
      this.pill.id = "spicetify-ide-floating-pill";
      this.pill.innerHTML = `
        <button data-act="toggle-enable" class="${this.enabled ? "is-on" : ""}">⚡ ${this.enabled ? "ON" : "OFF"}</button>
        <button data-act="toggle-theme" class="${this.settings.matchSongTheme ? "is-on" : ""}" title="Toggle Song-Adaptive Album-Art Theme">Song Theme</button>
        <button data-act="cycle-style" title="Cycle Syntax Style">Style: ${this.settings.syntaxStyle || "mixed"}</button>
        <button data-act="toggle-settings">Settings</button>
        <button data-act="toggle-focus" class="${this.settings.dynamicWordZoom ? "is-on" : ""}" title="Focus on active sung word">Focus: ${this.settings.dynamicWordZoom ? "ON" : "OFF"}</button>
        <button data-act="toggle-cover" class="${this.showCoverShowcase ? "is-on" : ""}" title="Toggle Cover Showcase">Cover</button>
        <button data-act="toggle-lock">Lock</button>
        <button data-act="toggle-clean-feed" class="${this.settings.cleanFeed ? "is-on" : ""}" title="Clean Feed / Edit Recording Mode (E)">Clean</button>
        <button data-act="toggle-fs">Fullscreen</button>
        <button data-act="close-visualizer">✕</button>
      `;
      this.root.appendChild(this.pill);

      this.pill.addEventListener("click", (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;
        const act = btn.dataset.act;
        if (act === "toggle-enable") {
          this.enabled = !this.enabled;
          try { localStorage.setItem("spicetify_ide_lyrics_enabled", this.enabled ? "true" : "false"); } catch (err) {}
          if (!this.enabled && this.settings.cleanFeed) {
            this.setCleanFeed(false);
          }
          if (!this.enabled && this.settingsPanelOpen) {
            this.toggleSettingsPanel();
          }
          this.syncControlsUI();
          if (this.isRenderActive()) this.resumeRenderLoop();
          else this.pauseRenderLoop();
        } else if (act === "toggle-theme") {
          this.toggleMatchSongTheme();
        } else if (act === "cycle-style") {
          this.cycleSyntaxStyle();
        } else if (act === "toggle-settings") {
          this.toggleSettingsPanel();
        } else if (act === "toggle-focus") {
          this.toggleFocusMode();
        } else if (act === "toggle-cover") {
          this.toggleCoverShowcase();
        } else if (act === "toggle-lock") {
          if (this.isLockActive) this.deactivateLockOrScreensaver();
          else this.activateLockOrScreensaver(true);
        } else if (act === "toggle-clean-feed") {
          this.setCleanFeed(!this.settings.cleanFeed);
        } else if (act === "toggle-fs") {
          this.toggleFullscreen();
        } else if (act === "close-visualizer") {
          this.hideVisualizer();
        }
      });

      // Settings modal
      this.settingsPanel = document.createElement("div");
      this.settingsPanel.id = "spicetify-ide-settings-panel";
      this.settingsPanel.innerHTML = `
        <div class="spicetify-settings-header">
          <h3 class="spicetify-settings-title">IDE Lyrics Settings</h3>
          <button style="background:none;border:none;color:#fff;font-size:16px;cursor:pointer;" data-act="close-settings">✕</button>
        </div>
        <div class="spicetify-settings-body">
          <div class="spicetify-settings-section">
            <div class="spicetify-settings-section-title">Theme, Style & Showcase</div>
            <div class="spicetify-settings-row">
              <div class="spicetify-settings-label-row">
                <label>Song-Adaptive Theme</label>
                <div class="spicetify-settings-btn-group" data-group="matchSongTheme">
                  <button type="button" class="spicetify-group-btn ${this.settings.matchSongTheme ? 'is-active' : ''}" data-val="true">ON</button>
                  <button type="button" class="spicetify-group-btn ${!this.settings.matchSongTheme ? 'is-active' : ''}" data-val="false">OFF</button>
                </div>
              </div>
            </div>
            <div class="spicetify-settings-row">
              <div class="spicetify-settings-label-row">
                <label>IDE Color Theme</label>
                <div class="spicetify-settings-btn-group" data-group="themePreset">
                  <button type="button" class="spicetify-group-btn ${(this.settings.themePreset || 'cyberpunk') === 'cyberpunk' ? 'is-active' : ''}" data-val="cyberpunk">Cyberpunk</button>
                  <button type="button" class="spicetify-group-btn ${this.settings.themePreset === 'tokyoNight' ? 'is-active' : ''}" data-val="tokyoNight">Tokyo Night</button>
                  <button type="button" class="spicetify-group-btn ${this.settings.themePreset === 'dracula' ? 'is-active' : ''}" data-val="dracula">Dracula</button>
                  <button type="button" class="spicetify-group-btn ${this.settings.themePreset === 'nord' ? 'is-active' : ''}" data-val="nord">Nord</button>
                  <button type="button" class="spicetify-group-btn ${this.settings.themePreset === 'monokai' ? 'is-active' : ''}" data-val="monokai">Monokai</button>
                </div>
              </div>
            </div>
            <div class="spicetify-settings-row">
              <div class="spicetify-settings-label-row">
                <label>Syntax Style</label>
                <div class="spicetify-settings-btn-group" data-group="syntaxStyle">
                  <button type="button" class="spicetify-group-btn ${(this.settings.syntaxStyle || 'mixed') === 'mixed' ? 'is-active' : ''}" data-val="mixed">Mixed</button>
                  <button type="button" class="spicetify-group-btn ${this.settings.syntaxStyle === 'oop' ? 'is-active' : ''}" data-val="oop">OOP</button>
                  <button type="button" class="spicetify-group-btn ${this.settings.syntaxStyle === 'control' ? 'is-active' : ''}" data-val="control">Control</button>
                  <button type="button" class="spicetify-group-btn ${this.settings.syntaxStyle === 'pattern' ? 'is-active' : ''}" data-val="pattern">Pattern</button>
                </div>
              </div>
            </div>
            <div class="spicetify-settings-row">
              <div class="spicetify-settings-label-row">
                <label>Lyric Reveal Mode</label>
                <div class="spicetify-settings-btn-group" data-group="lyricRevealMode">
                  <button type="button" class="spicetify-group-btn ${normalizeRevealMode(this.settings.lyricRevealMode) === 'highlight' ? 'is-active' : ''}" data-val="highlight">Highlight</button>
                  <button type="button" class="spicetify-group-btn ${normalizeRevealMode(this.settings.lyricRevealMode) === 'typewriter' ? 'is-active' : ''}" data-val="typewriter">Typewriter</button>
                </div>
              </div>
            </div>
            <div class="spicetify-settings-row">
              <div class="spicetify-settings-label-row">
                <label>Word Focus Zoom</label>
                <div class="spicetify-settings-btn-group" data-group="dynamicWordZoom">
                  <button type="button" class="spicetify-group-btn ${this.settings.dynamicWordZoom ? 'is-active' : ''}" data-val="true">ON</button>
                  <button type="button" class="spicetify-group-btn ${!this.settings.dynamicWordZoom ? 'is-active' : ''}" data-val="false">OFF</button>
                </div>
              </div>
            </div>
            <div class="spicetify-settings-row">
              <div class="spicetify-settings-label-row">
                <label>Cover Showcase</label>
                <div class="spicetify-settings-btn-group" data-group="showCoverShowcase">
                  <button type="button" class="spicetify-group-btn ${this.showCoverShowcase ? 'is-active' : ''}" data-val="true">ON</button>
                  <button type="button" class="spicetify-group-btn ${!this.showCoverShowcase ? 'is-active' : ''}" data-val="false">OFF</button>
                </div>
              </div>
            </div>
          </div>
          <div class="spicetify-settings-section">
            <div class="spicetify-settings-section-title">Perspective Angles</div>
            <div class="spicetify-settings-row">
              <div class="spicetify-settings-label-row">
                <label>Pitch (Tilt X)</label>
                <span data-val="rotX">${this.settings.rotX}°</span>
              </div>
              <input type="range" class="spicetify-settings-slider" data-cfg="rotX" min="-30" max="45" value="${this.settings.rotX}" />
            </div>
            <div class="spicetify-settings-row">
              <div class="spicetify-settings-label-row">
                <label>Yaw (Tilt Y)</label>
                <span data-val="rotY">${this.settings.rotY}°</span>
              </div>
              <input type="range" class="spicetify-settings-slider" data-cfg="rotY" min="-45" max="45" value="${this.settings.rotY}" />
            </div>
          </div>

          <div class="spicetify-settings-section">
            <div class="spicetify-settings-section-title">Typography & Effects</div>
            <div class="spicetify-settings-row">
              <div class="spicetify-settings-label-row">
                <label>Font Size</label>
                <span data-val="fontSize">${this.settings.fontSize}px</span>
              </div>
              <input type="range" class="spicetify-settings-slider" data-cfg="fontSize" min="16" max="64" value="${this.settings.fontSize}" />
            </div>
            <div class="spicetify-settings-row">
              <div class="spicetify-settings-label-row">
                <label>Glow Intensity</label>
                <span data-val="glowIntensity">${this.settings.glowIntensity}x</span>
              </div>
              <input type="range" class="spicetify-settings-slider" data-cfg="glowIntensity" min="0.2" max="2.5" step="0.05" value="${this.settings.glowIntensity}" />
            </div>
          </div>

          <div class="spicetify-settings-section">
            <div class="spicetify-settings-section-title">Edit Studio &amp; Immersion</div>
            <div class="spicetify-settings-row">
              <div class="spicetify-settings-label-row">
                <label>Clean Feed (Hide UI Chrome — Hotkey E)</label>
                <div class="spicetify-settings-btn-group" data-group="cleanFeed">
                  <button type="button" class="spicetify-group-btn ${this.settings.cleanFeed ? 'is-active' : ''}" data-val="true">ON</button>
                  <button type="button" class="spicetify-group-btn ${!this.settings.cleanFeed ? 'is-active' : ''}" data-val="false">OFF</button>
                </div>
              </div>
            </div>
            <div class="spicetify-settings-row">
              <div class="spicetify-settings-label-row">
                <label>Background Style</label>
                <div class="spicetify-settings-btn-group" data-group="backdropMode">
                  <button type="button" class="spicetify-group-btn ${(this.settings.backdropMode || 'ambient') === 'ambient' ? 'is-active' : ''}" data-val="ambient">Waves</button>
                  <button type="button" class="spicetify-group-btn ${this.settings.backdropMode === 'simple' ? 'is-active' : ''}" data-val="simple">Simple</button>
                  <button type="button" class="spicetify-group-btn ${this.settings.backdropMode === 'custom' ? 'is-active' : ''}" data-val="custom">Custom</button>
                  <button type="button" class="spicetify-group-btn ${this.settings.backdropMode === 'vignette' ? 'is-active' : ''}" data-val="vignette">Vignette</button>
                  <button type="button" class="spicetify-group-btn ${this.settings.backdropMode === 'black' ? 'is-active' : ''}" data-val="black">Black</button>
                  <button type="button" class="spicetify-group-btn ${this.settings.backdropMode === 'green' ? 'is-active' : ''}" data-val="green">Green</button>
                  <button type="button" class="spicetify-group-btn ${this.settings.backdropMode === 'blue' ? 'is-active' : ''}" data-val="blue">Blue</button>
                </div>
              </div>
            </div>
            <div class="spicetify-settings-row" data-row-setting="customBgControls" style="${this.settings.backdropMode === 'custom' ? '' : 'display:none;'}">
              <div class="spicetify-custom-bg-controls">
                <div class="spicetify-custom-bg-actions">
                  <button type="button" class="spicetify-custom-bg-btn" data-act="upload-custom-bg">Upload Image / Video</button>
                  <button type="button" class="spicetify-custom-bg-btn" data-act="clear-custom-bg">Clear</button>
                  <input type="file" accept="image/*,video/*" data-custom-bg-file style="display:none;" />
                </div>
                <div class="spicetify-custom-bg-url-row">
                  <input type="text" class="spicetify-custom-bg-url-input" data-custom-bg-url placeholder="Or paste image / video URL (https://...)" value="${(this.settings.customBgUrl && !String(this.settings.customBgUrl).startsWith('data:') && !String(this.settings.customBgUrl).startsWith('blob:')) ? String(this.settings.customBgUrl).replace(/"/g, '&quot;') : ''}" />
                  <button type="button" class="spicetify-custom-bg-btn" data-act="apply-custom-bg-url">Set</button>
                </div>
                <div class="spicetify-settings-label-row">
                  <label>Background Brightness</label>
                  <span data-val="customBgOpacity">${Math.round((this.settings.customBgOpacity ?? 0.6) * 100)}%</span>
                </div>
                <input type="range" class="spicetify-settings-slider" data-key="customBgOpacity" min="0.15" max="1" step="0.05" value="${this.settings.customBgOpacity ?? 0.6}" />
                <div class="spicetify-settings-label-row">
                  <label>Background Blur</label>
                  <span data-val="customBgBlur">${Math.round(this.settings.customBgBlur ?? 0)}px</span>
                </div>
                <input type="range" class="spicetify-settings-slider" data-key="customBgBlur" min="0" max="16" step="1" value="${this.settings.customBgBlur ?? 0}" />
              </div>
            </div>
            <div class="spicetify-settings-row">
              <div class="spicetify-settings-label-row">
                <label>Edit Framing Ratio</label>
                <div class="spicetify-settings-btn-group" data-group="frameRatio">
                  <button type="button" class="spicetify-group-btn ${(this.settings.frameRatio || 'off') === 'off' ? 'is-active' : ''}" data-val="off">Off</button>
                  <button type="button" class="spicetify-group-btn ${this.settings.frameRatio === '9:16' ? 'is-active' : ''}" data-val="9:16">9:16</button>
                  <button type="button" class="spicetify-group-btn ${this.settings.frameRatio === '16:9' ? 'is-active' : ''}" data-val="16:9">16:9</button>
                  <button type="button" class="spicetify-group-btn ${this.settings.frameRatio === '1:1' ? 'is-active' : ''}" data-val="1:1">1:1</button>
                </div>
              </div>
            </div>
            <div class="spicetify-settings-row" data-row-setting="showFrameGuide" style="${(this.settings.frameRatio || 'off') !== 'off' ? '' : 'opacity:0.4; pointer-events:none;'}">
              <div class="spicetify-settings-label-row">
                <label>Show Safe Frame Guide Lines</label>
                <div class="spicetify-settings-btn-group" data-group="showFrameGuide">
                  <button type="button" class="spicetify-group-btn ${this.settings.showFrameGuide !== false ? 'is-active' : ''}" data-val="true">ON</button>
                  <button type="button" class="spicetify-group-btn ${this.settings.showFrameGuide === false ? 'is-active' : ''}" data-val="false">OFF</button>
                </div>
              </div>
            </div>
            <div class="spicetify-settings-row" data-row-setting="cinematicFx" style="${isSolidBackdrop(this.settings.backdropMode) ? 'opacity:0.4; pointer-events:none;' : ''}">
              <div class="spicetify-settings-label-row">
                <label>Cinematic Polish (Motes &amp; Bloom)</label>
                <div class="spicetify-settings-btn-group" data-group="cinematicFx">
                  <button type="button" class="spicetify-group-btn ${this.settings.cinematicFx !== false ? 'is-active' : ''}" data-val="true">ON</button>
                  <button type="button" class="spicetify-group-btn ${this.settings.cinematicFx === false ? 'is-active' : ''}" data-val="false">OFF</button>
                </div>
              </div>
            </div>
          </div>

          <div class="spicetify-settings-section">
            <div class="spicetify-settings-section-title">Word Tracking Camera Mode</div>
            <div class="spicetify-settings-row">
              <div class="spicetify-settings-label-row">
                <label>Tracking Style</label>
                <div class="spicetify-settings-btn-group" data-group="wordTrackingMode">
                  <button type="button" class="spicetify-group-btn ${(this.settings.wordTrackingMode || 'stable') === 'stable' ? 'is-active' : ''}" data-val="stable">Stable (Zero Bounce)</button>
                  <button type="button" class="spicetify-group-btn ${this.settings.wordTrackingMode === 'live' ? 'is-active' : ''}" data-val="live">Real-Time (Follow Voice)</button>
                  <button type="button" class="spicetify-group-btn ${this.settings.wordTrackingMode === 'anticipate' ? 'is-active' : ''}" data-val="anticipate">Anticipate (Glides Ahead)</button>
                </div>
              </div>
            </div>
          </div>

          <div class="spicetify-settings-section">
            <div class="spicetify-settings-section-title">Language & Script Direction</div>
            <div class="spicetify-settings-row">
              <div class="spicetify-settings-label-row">
                <label>Text Flow Direction</label>
                <div class="spicetify-settings-btn-group" data-group="textDirection">
                  <button type="button" class="spicetify-group-btn ${(this.settings.textDirection || 'auto') === 'auto' ? 'is-active' : ''}" data-val="auto">Auto</button>
                  <button type="button" class="spicetify-group-btn ${this.settings.textDirection === 'ltr' ? 'is-active' : ''}" data-val="ltr">LTR</button>
                  <button type="button" class="spicetify-group-btn ${this.settings.textDirection === 'rtl' ? 'is-active' : ''}" data-val="rtl">RTL (Persian/Arabic)</button>
                </div>
              </div>
            </div>
            <div class="spicetify-settings-row">
              <div class="spicetify-settings-label-row">
                <label>Inline Code Comments</label>
                <div class="spicetify-settings-btn-group" data-group="annotationMode">
                  <button type="button" class="spicetify-group-btn ${this.settings.annotationMode === 'off' ? 'is-active' : ''}" data-val="off">Off</button>
                  <button type="button" class="spicetify-group-btn ${this.settings.annotationMode === 'roman' ? 'is-active' : ''}" data-val="roman">Roman</button>
                  <button type="button" class="spicetify-group-btn ${this.settings.annotationMode === 'trans' ? 'is-active' : ''}" data-val="trans">Trans</button>
                  <button type="button" class="spicetify-group-btn ${(this.settings.annotationMode || 'both') === 'both' ? 'is-active' : ''}" data-val="both">Both</button>
                </div>
              </div>
            </div>
            <div class="spicetify-settings-row">
              <div class="spicetify-settings-label-row">
                <label>Active Line Only (Hide past &amp; future lines)</label>
                <div class="spicetify-settings-btn-group" data-group="activeLineOnly">
                  <button type="button" class="spicetify-group-btn ${this.settings.activeLineOnly ? 'is-active' : ''}" data-val="true">ON</button>
                  <button type="button" class="spicetify-group-btn ${!this.settings.activeLineOnly ? 'is-active' : ''}" data-val="false">OFF</button>
                </div>
              </div>
            </div>
            <div class="spicetify-settings-row">
              <div class="spicetify-settings-label-row">
                <label>Adlibs (Parenthesized &amp; BG)</label>
                <div class="spicetify-settings-btn-group" data-group="adlibMode">
                  <button type="button" class="spicetify-group-btn ${(this.settings.adlibMode || 'separate') === 'separate' ? 'is-active' : ''}" data-val="separate">Separate</button>
                  <button type="button" class="spicetify-group-btn ${this.settings.adlibMode === 'hide' ? 'is-active' : ''}" data-val="hide">Hide</button>
                  <button type="button" class="spicetify-group-btn ${this.settings.adlibMode === 'inline' ? 'is-active' : ''}" data-val="inline">Inline</button>
                </div>
              </div>
            </div>
            <div class="spicetify-settings-row">
              <div class="spicetify-settings-label-row">
                <label>Background Vocals (/* bg: ... */)</label>
                <div class="spicetify-settings-btn-group" data-group="showBackgroundVocals">
                  <button type="button" class="spicetify-group-btn ${this.settings.showBackgroundVocals !== false ? 'is-active' : ''}" data-val="true">ON</button>
                  <button type="button" class="spicetify-group-btn ${this.settings.showBackgroundVocals === false ? 'is-active' : ''}" data-val="false">OFF</button>
                </div>
              </div>
            </div>
          </div>

          <div class="spicetify-settings-section">
            <div class="spicetify-settings-section-title">Lyric Sync Calibration</div>
            <div class="spicetify-settings-row">
              <div class="spicetify-settings-label-row">
                <label>Sync Offset</label>
                <span data-val="syncOffsetMs">${(this.settings.syncOffsetMs || 0) > 0 ? '+' : ''}${Math.round(this.settings.syncOffsetMs || 0)}ms</span>
              </div>
              <input type="range" class="spicetify-settings-slider" data-cfg="syncOffsetMs" min="-1000" max="1000" step="25" value="${this.settings.syncOffsetMs || 0}" />
            </div>
          </div>

          <div class="spicetify-settings-section">
            <div class="spicetify-settings-section-title">Screensaver & Lock Screen</div>
            <div class="spicetify-settings-row">
              <div class="spicetify-settings-label-row">
                <label>Mode</label>
                <div class="spicetify-settings-btn-group" data-group="idleMode">
                  <button type="button" class="spicetify-group-btn ${this.settings.idleMode === 'off' ? 'is-active' : ''}" data-val="off">Off</button>
                  <button type="button" class="spicetify-group-btn ${this.settings.idleMode === 'screensaver' ? 'is-active' : ''}" data-val="screensaver">Screensaver</button>
                  <button type="button" class="spicetify-group-btn ${this.settings.idleMode === 'lock' ? 'is-active' : ''}" data-val="lock">Lock Screen</button>
                </div>
              </div>
            </div>
            <div class="spicetify-settings-row">
              <div class="spicetify-settings-label-row">
                <label>Auto-Idle Timeout (while song plays)</label>
                <div class="spicetify-settings-btn-group" data-group="idleTimeout">
                  <button type="button" class="spicetify-group-btn ${Number(this.settings.idleTimeout) === 0 ? 'is-active' : ''}" data-val="0">Off</button>
                  <button type="button" class="spicetify-group-btn ${Number(this.settings.idleTimeout) === 30 ? 'is-active' : ''}" data-val="30">30s</button>
                  <button type="button" class="spicetify-group-btn ${Number(this.settings.idleTimeout) === 60 ? 'is-active' : ''}" data-val="60">1m</button>
                  <button type="button" class="spicetify-group-btn ${Number(this.settings.idleTimeout) === 120 ? 'is-active' : ''}" data-val="120">2m</button>
                  <button type="button" class="spicetify-group-btn ${Number(this.settings.idleTimeout) === 300 ? 'is-active' : ''}" data-val="300">5m</button>
                </div>
              </div>
            </div>
          </div>
          <div class="spicetify-settings-section">
            <div class="spicetify-settings-section-title">Presets &amp; Backup (JSON)</div>
            <div class="spicetify-preset-actions">
              <button type="button" class="spicetify-preset-btn" data-act="copy-preset">Copy Preset</button>
              <button type="button" class="spicetify-preset-btn" data-act="import-preset">Import Preset</button>
            </div>
            <div class="spicetify-preset-import-box" data-preset-import-box>
              <textarea class="spicetify-preset-textarea" data-preset-input rows="4" placeholder='Paste preset JSON here (e.g. {"themePreset":"dracula","lyricRevealMode":"typewriter"})'></textarea>
              <div class="spicetify-preset-actions">
                <button type="button" class="spicetify-preset-btn is-primary" data-act="apply-preset-import">Apply Preset</button>
                <button type="button" class="spicetify-preset-btn" data-act="cancel-preset-import">Cancel</button>
              </div>
            </div>
            <div class="spicetify-preset-feedback" data-preset-feedback aria-live="polite"></div>
          </div>

          <div class="spicetify-settings-section">
            <div class="spicetify-settings-section-title">Keyboard Shortcuts</div>
            <div class="spicetify-keybinds-list" id="spicetify-keybinds-list"></div>
            <div class="spicetify-settings-row" style="margin-top: 6px;">
              <button type="button" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.18);color:#fff;padding:5px 12px;border-radius:6px;cursor:pointer;width:100%;font-size:11px;" data-act="reset-keybinds">Reset Keybinds to Defaults</button>
            </div>
          </div>
        </div>
        <div class="spicetify-settings-footer">
          <button style="background:rgba(255,255,255,0.1);border:none;color:#fff;padding:6px 14px;border-radius:999px;cursor:pointer;" data-act="reset-settings">Reset</button>
          <button style="background:linear-gradient(135deg,var(--tok-keyword),var(--tok-method));border:none;color:#fff;font-weight:700;padding:6px 18px;border-radius:999px;cursor:pointer;" data-act="close-settings">Done</button>
        </div>
      `;
      this.root.appendChild(this.settingsPanel);
      this.renderKeybindsList();

      this.settingsPanel.addEventListener("input", (e) => {
        const input = e.target.closest("input[data-cfg]");
        if (!input) return;
        const key = input.dataset.cfg;
        const val = parseFloat(input.value);
        this.settings[key] = val;
        const label = this.settingsPanel.querySelector(`[data-val="${key}"]`);
        if (label) {
          if (key === "rotX" || key === "rotY") label.textContent = `${Math.round(val)}°`;
          else if (key === "fontSize" || key === "customBgBlur") label.textContent = `${Math.round(val)}px`;
          else if (key === "customBgOpacity") label.textContent = `${Math.round(val * 100)}%`;
          else if (key === "syncOffsetMs") label.textContent = `${val > 0 ? "+" : ""}${Math.round(val)}ms`;
          else label.textContent = `${val.toFixed(2)}x`;
        }
        this.saveSettings();
        this.applyVisualStyles();
        if (key === "customBgOpacity" || key === "customBgBlur") {
          this.applyCustomBackground();
        }
        if (key === "syncOffsetMs") {
          this.syncWordCursor(this.currentTime || 0);
        }
      });

      const spCustomBgFile = this.settingsPanel.querySelector("input[data-custom-bg-file]");
      if (spCustomBgFile) {
        spCustomBgFile.addEventListener("change", (ev) => {
          const file = ev.target?.files?.[0];
          if (file) this.handleCustomBgFile(file);
          ev.target.value = "";
        });
      }

      this.settingsPanel.addEventListener("click", (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;
        const group = btn.closest("[data-group]");
        if (group) {
          const key = group.dataset.group;
          let val = btn.dataset.val;
          if (key === "cleanFeed") {
            this.setCleanFeed(val === "true");
            return;
          }
          if (key === "idleTimeout") val = parseInt(val, 10);
          else if (key === "backdropMode") val = normalizeBackdropMode(val);
          else if (key === "frameRatio") val = normalizeFrameRatio(val);
          else if (key === "lyricRevealMode") val = normalizeRevealMode(val);
          else if (["showBackgroundVocals", "matchSongTheme", "dynamicWordZoom", "showCoverShowcase", "activeLineOnly", "showFrameGuide", "cinematicFx"].includes(key)) {
            val = (val === "true");
          }
          this.settings[key] = val;
          group.querySelectorAll(".spicetify-group-btn").forEach(b => b.classList.remove("is-active"));
          btn.classList.add("is-active");
          if (key === "textDirection") {
            this.updateTextDirection();
            if (this.codePlane) this.codePlane.classList.toggle("is-rtl", !!this.isRtlSong);
            (this.cachedLineNodes || []).forEach(node => node.row?.classList?.toggle("is-rtl", !!this.isRtlSong));
            this.syncWordCursor(this.currentTime || 0);
          } else if (key === "lyricRevealMode") {
            this.applyLyricRevealMode();
            this.syncWordCursor(this.currentTime || 0);
          } else if (key === "annotationMode" || key === "showBackgroundVocals") {
            this.buildCodeDOM();
            this.syncWordCursor(this.currentTime || 0);
          } else if (key === "adlibMode") {
            this.recompileCurrentLyrics();
          } else if (key === "matchSongTheme") {
            if (val) this.refreshCurrentTrackArtwork(true);
            else {
              this._artworkReqId = (this._artworkReqId || 0) + 1;
              this.applyThemePreset(this.settings.themePreset);
            }
          } else if (key === "themePreset") {
            this.settings.matchSongTheme = false;
            this._artworkReqId = (this._artworkReqId || 0) + 1;
            this.applyThemePreset(val);
          } else if (key === "syntaxStyle") {
            this.recompileCurrentLyrics();
          } else if (key === "showCoverShowcase") {
            this.showCoverShowcase = val;
            this.resizeCanvas();
          } else if (key === "backdropMode" || key === "frameRatio" || key === "showFrameGuide" || key === "cinematicFx") {
            this.applyEditStudioState();
            this.resizeCanvas();
          }
          this.saveSettings();
          this.applyVisualStyles();
          this.syncControlsUI();
          return;
        }
        if (btn.dataset.act === "upload-custom-bg") {
          const fileInput = this.settingsPanel.querySelector("input[data-custom-bg-file]");
          if (fileInput) fileInput.click();
          return;
        } else if (btn.dataset.act === "apply-custom-bg-url") {
          const urlInput = this.settingsPanel.querySelector("input[data-custom-bg-url]");
          const url = (urlInput?.value || "").trim();
          if (url) {
            this.setCustomBackground(url, /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url) ? "video" : "image");
          }
          return;
        } else if (btn.dataset.act === "clear-custom-bg") {
          this.clearCustomBackground();
          const urlInput = this.settingsPanel.querySelector("input[data-custom-bg-url]");
          if (urlInput) urlInput.value = "";
          return;
        }
        if (btn.dataset.act === "copy-preset") {
          this.copySettingsPreset();
          return;
        } else if (btn.dataset.act === "import-preset") {
          const box = this.settingsPanel.querySelector("[data-preset-import-box]");
          const input = this.settingsPanel.querySelector("[data-preset-input]");
          if (box) {
            const isOpen = box.classList.toggle("is-open");
            if (isOpen && input) {
              input.focus();
            }
          }
          return;
        } else if (btn.dataset.act === "apply-preset-import") {
          const box = this.settingsPanel.querySelector("[data-preset-import-box]");
          const input = this.settingsPanel.querySelector("[data-preset-input]");
          const result = this.importSettingsPreset(input ? input.value : "");
          if (result.ok && box) {
            box.classList.remove("is-open");
            if (input) input.value = "";
          }
          return;
        } else if (btn.dataset.act === "cancel-preset-import") {
          const box = this.settingsPanel.querySelector("[data-preset-import-box]");
          const input = this.settingsPanel.querySelector("[data-preset-input]");
          if (box) box.classList.remove("is-open");
          if (input) input.value = "";
          return;
        }
        if (btn.dataset.act === "reset-keybinds") {
          this.keybinds = Object.assign({}, DEFAULT_KEYBINDS);
          try {
            localStorage.removeItem("spicetify_ide_lyrics_keybinds");
          } catch (err) {}
          this.recordingKeybindAction = null;
          this.renderKeybindsList();
          return;
        }
        if (btn.dataset.act === "close-settings") {
          this.toggleSettingsPanel();
        } else if (btn.dataset.act === "reset-settings") {
          Object.assign(this.settings, DEFAULT_SETTINGS);
          this.settings.cleanFeed = false;
          this.settings.lyricRevealMode = normalizeRevealMode(this.settings.lyricRevealMode);
          this.applyEditStudioState();
          this.applyLyricRevealMode();
          this.showCoverShowcase = this.settings.showCoverShowcase !== false;
          this.saveSettings();
          if (this.settings.matchSongTheme) this.refreshCurrentTrackArtwork(true);
          else this.applyThemePreset(this.settings.themePreset);
          this.updateTextDirection();
          if (Array.isArray(this.rawLyrics) && this.rawLyrics.length > 0) {
            this.recompileCurrentLyrics();
          } else if (this.compiledLines.length > 0) {
            this.buildCodeDOM();
            this.syncWordCursor(this.currentTime || 0);
          }
          this.resizeCanvas();
          this.applyVisualStyles();
          this.syncControlsUI();
          this.toggleSettingsPanel();
        }
      });

      // Lock Screen Overlay
      this.lockOverlay = document.createElement("div");
      this.lockOverlay.id = "spicetify-ide-lock-overlay";
      this.lockOverlay.innerHTML = `
        <div class="spicetify-lock-header">
          <div class="spicetify-lock-badge">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
            </svg>
            <span>Lock Screen</span>
          </div>
          <div class="spicetify-lock-clock" id="spicetify-lock-clock">--:--</div>
          <div class="spicetify-lock-date" id="spicetify-lock-date">---</div>
        </div>
        <div class="spicetify-lock-track-card">
          <img class="spicetify-lock-art" id="spicetify-lock-art" src="" alt="" style="display:none;" />
          <div style="overflow:hidden;min-width:0;flex:1;">
            <div class="spicetify-lock-track-status">
              <span class="spicetify-lock-pulse-dot"></span>
              <span class="spicetify-lock-status-label">Now Playing</span>
            </div>
            <div class="spicetify-lock-track-title" id="spicetify-lock-track-title">Spotify</div>
            <div class="spicetify-lock-track-artist" id="spicetify-lock-track-artist">Artist</div>
          </div>
        </div>
        <div class="spicetify-lock-hint">Move mouse, press any key, or Esc to unlock</div>
      `;
      this.lockOverlay.addEventListener("click", () => this.deactivateLockOrScreensaver());
      this.root.appendChild(this.lockOverlay);

      // Screensaver Clock
      this.screensaverClock = document.createElement("div");
      this.screensaverClock.id = "spicetify-ide-screensaver-clock";
      this.root.appendChild(this.screensaverClock);

      document.body.appendChild(this.root);
      this._resizeHandler = () => this.resizeCanvas();
      window.addEventListener("resize", this._resizeHandler);
      this._fullscreenChangeHandler = () => {
        const fsActive = Boolean(document.fullscreenElement);
        if (this.isFullscreen !== fsActive) {
          this.isFullscreen = fsActive;
          if (fsActive) this.resetCursorIdleTimer();
          else this.clearCursorIdleState();
          this.resizeCanvas();
          this.syncControlsUI();
        }
      };
      document.addEventListener("fullscreenchange", this._fullscreenChangeHandler);
      this.resizeCanvas();
      this.applyPaletteToCSS(this.palette);
      this.applyLyricRevealMode();
      this.applyVisualStyles();
      this.syncControlsUI();
    }

    resolveSpotifyImageUrl(rawUrl) {
      if (!rawUrl || typeof rawUrl !== "string") return "";
      const trimmed = rawUrl.trim();
      if (!trimmed) return "";
      if (trimmed.startsWith("spotify:image:")) {
        return "https://i.scdn.co/image/" + trimmed.slice("spotify:image:".length);
      }
      if (trimmed.startsWith("spotify:mosaic:")) {
        const ids = trimmed.slice("spotify:mosaic:".length).split(":").filter(Boolean);
        return ids.length ? "https://mosaic.scdn.co/640/" + ids.join("") : "";
      }
      return trimmed;
    }

    getTrackMetadata(item = Spicetify?.Player?.data?.item) {
      const meta = item?.metadata || {};
      const title = meta.title || item?.name || "Listening on Spotify";
      const artist =
        meta.artist_name ||
        (Array.isArray(item?.artists) ? item.artists.map((a) => a?.name).filter(Boolean).join(", ") : "") ||
        "Spotify Artist";
      const album = meta.album_title || item?.album?.name || "";
      const rawArt =
        meta.image_xlarge_url ||
        meta.image_large_url ||
        meta.image_url ||
        meta.image_small_url ||
        item?.album?.images?.[0]?.url ||
        "";
      const artUrl = this.resolveSpotifyImageUrl(rawArt);
      const rawDurMs = Spicetify?.Player?.getDuration?.() ?? item?.duration?.milliseconds ?? 0;
      const lastLineEnd = this.compiledLines[this.compiledLines.length - 1]?.endTime || 180;
      const duration = rawDurMs > 0 ? rawDurMs / 1000 : Math.max(1, lastLineEnd);
      return { title, artist, album, artUrl, duration };
    }

    formatTime(sec) {
      const s = Math.max(0, Math.floor(sec || 0));
      const m = Math.floor(s / 60);
      const r = s % 60;
      return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
    }

    mountCoverShowcase() {
      if (!this.root) return;
      if (this.coverShowcase) this.coverShowcase.remove();

      const showcase = document.createElement("div");
      showcase.id = "spicetify-ide-cover-showcase";
      showcase.innerHTML = `
        <div class="spicetify-cover-art-frame" data-showcase="frame" title="Click to Play / Pause">
          <img class="spicetify-cover-art-img" data-showcase="art" alt="Album Cover" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" />
          <div class="spicetify-cover-art-overlay" data-showcase="overlay">Play / Pause</div>
        </div>
        <div class="spicetify-cover-showcase-meta">
          <div class="spicetify-cover-meta-left">
            <div class="spicetify-cover-showcase-title" data-showcase="title">Spotify IDE Visualizer</div>
            <div class="spicetify-cover-showcase-artist" data-showcase="artist">Spotify Artist</div>
            <div class="spicetify-cover-showcase-album" data-showcase="album"></div>
          </div>
          <div class="spicetify-cover-meta-right"></div>
        </div>
        <div class="spicetify-cover-controls">
          <div class="spicetify-cover-scrubber-wrap">
            <input type="range" class="spicetify-cover-scrubber" data-showcase="scrubber" min="0" max="200" step="0.1" value="0" title="Drag to seek" />
            <div class="spicetify-cover-times">
              <span class="spicetify-cover-time" data-showcase="time-cur">00:00</span>
              <span class="spicetify-cover-badge" data-showcase="status">Now Playing</span>
              <span class="spicetify-cover-time" data-showcase="time-rem">-00:00</span>
            </div>
          </div>
          <div class="spicetify-cover-main-transport">
            <button type="button" class="spicetify-cover-trans-btn" data-act="prev-track" title="Previous Track">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
            </button>
            <button type="button" class="spicetify-cover-trans-btn is-play-main" data-act="play-pause" title="Play / Pause">
              <svg class="spicetify-icon-play" viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              <svg class="spicetify-icon-pause" viewBox="0 0 24 24" width="28" height="28" fill="currentColor" style="display:none;"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            </button>
            <button type="button" class="spicetify-cover-trans-btn" data-act="next-track" title="Next Track">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
            </button>
          </div>
          <div class="spicetify-cover-sub-transport">
            <button type="button" class="spicetify-cover-sub-btn" data-act="repeat" title="Toggle Repeat">Repeat</button>
            <button type="button" class="spicetify-cover-sub-btn" data-act="shuffle" title="Toggle Shuffle">Shuffle</button>
          </div>
        </div>
      `;

      const frame = showcase.querySelector('[data-showcase="frame"]');
      if (frame) {
        frame.addEventListener("click", (e) => {
          e.stopPropagation();
          Spicetify.Player?.togglePlay?.();
        });
      }

      const scrubber = showcase.querySelector('[data-showcase="scrubber"]');
      const curLabel = showcase.querySelector('[data-showcase="time-cur"]');
      const remLabel = showcase.querySelector('[data-showcase="time-rem"]');
      if (scrubber) {
        const commitScrub = () => {
          if (!this.isScrubbing) return;
          this.isScrubbing = false;
          const val = parseFloat(scrubber.value) || 0;
          Spicetify.Player?.seek?.(val * 1000);
        };
        const cancelScrub = () => { this.isScrubbing = false; };
        scrubber.addEventListener("pointerdown", () => {
          this.isScrubbing = true;
          const onWinEnd = (ev) => {
            window.removeEventListener("pointerup", onWinEnd);
            window.removeEventListener("pointercancel", onWinEnd);
            if (ev.type === "pointercancel") cancelScrub();
            else commitScrub();
          };
          window.addEventListener("pointerup", onWinEnd);
          window.addEventListener("pointercancel", onWinEnd);
        });
        scrubber.addEventListener("input", (e) => {
          this.isScrubbing = true;
          const val = parseFloat(e.target.value) || 0;
          if (curLabel) curLabel.textContent = this.formatTime(val);
          if (remLabel) remLabel.textContent = "-" + this.formatTime(Math.max(0, (this.duration || 0) - val));
        });
        scrubber.addEventListener("change", commitScrub);
        scrubber.addEventListener("pointerup", commitScrub);
        scrubber.addEventListener("pointercancel", cancelScrub);
        scrubber.addEventListener("blur", cancelScrub);
      }

      showcase.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-act]");
        if (!btn) return;
        const act = btn.dataset.act;
        if (act === "play-pause") Spicetify.Player?.togglePlay?.();
        else if (act === "prev-track") Spicetify.Player?.back?.();
        else if (act === "next-track") Spicetify.Player?.next?.();
        else if (act === "shuffle") Spicetify.Player?.toggleShuffle?.();
        else if (act === "repeat") Spicetify.Player?.toggleRepeat?.();
      });

      this.coverShowcase = showcase;
      this.root.appendChild(showcase);
    }

    mountPlayerDock() {
      if (!this.root) return;
      if (this.playerDock) this.playerDock.remove();

      const dock = document.createElement("div");
      dock.id = "spicetify-ide-player-dock";
      if (this.dockMinimized) dock.classList.add("is-minimized");
      dock.innerHTML = `
        <div class="spicetify-dock-scrubber-row">
          <span class="spicetify-dock-time" data-dock="time-cur">00:00</span>
          <input type="range" class="spicetify-dock-slider" data-dock="scrubber" min="0" max="200" step="0.1" value="0" title="Drag to seek" />
          <span class="spicetify-dock-time" data-dock="time-tot">00:00</span>
        </div>
        <div class="spicetify-dock-main-row">
          <div class="spicetify-dock-track">
            <img class="spicetify-dock-art" data-dock="art" alt="Cover" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" />
            <div class="spicetify-dock-meta">
              <div class="spicetify-dock-title" data-dock="title">Spotify IDE Visualizer</div>
              <div class="spicetify-dock-artist" data-dock="artist">Click any code line to seek</div>
            </div>
          </div>
          <div class="spicetify-dock-transport">
            <button type="button" class="spicetify-dock-btn" data-act="prev-track" title="Previous Track">|&lt;&lt;</button>
            <button type="button" class="spicetify-dock-btn is-play" data-act="play-pause" title="Play / Pause">Play</button>
            <button type="button" class="spicetify-dock-btn" data-act="next-track" title="Next Track">&gt;&gt;|</button>
          </div>
          <div class="spicetify-dock-extra-controls">
            <button type="button" class="spicetify-dock-btn" data-act="cycle-style">Style: ${this.settings.syntaxStyle || "mixed"}</button>
            <button type="button" class="spicetify-dock-btn ${this.settings.matchSongTheme ? "is-active" : ""}" data-act="toggle-theme">Theme</button>
            <button type="button" class="spicetify-dock-btn ${this.settings.dynamicWordZoom ? "is-active" : ""}" data-act="toggle-focus">Focus</button>
            <button type="button" class="spicetify-dock-btn ${this.showCoverShowcase ? "is-active" : ""}" data-act="toggle-cover">Cover</button>
            <button type="button" class="spicetify-dock-btn" data-act="toggle-settings">Settings</button>
            <button type="button" class="spicetify-dock-btn" data-act="toggle-fs">Full</button>
            <button type="button" class="spicetify-dock-btn" data-act="minimize">${this.dockMinimized ? "▲" : "▼"}</button>
          </div>
        </div>
      `;

      const scrubber = dock.querySelector('[data-dock="scrubber"]');
      const curLabel = dock.querySelector('[data-dock="time-cur"]');
      if (scrubber) {
        const commitScrub = () => {
          if (!this.isScrubbing) return;
          this.isScrubbing = false;
          const val = parseFloat(scrubber.value) || 0;
          Spicetify.Player?.seek?.(val * 1000);
        };
        const cancelScrub = () => { this.isScrubbing = false; };
        scrubber.addEventListener("pointerdown", () => {
          this.isScrubbing = true;
          const onWinEnd = (ev) => {
            window.removeEventListener("pointerup", onWinEnd);
            window.removeEventListener("pointercancel", onWinEnd);
            if (ev.type === "pointercancel") cancelScrub();
            else commitScrub();
          };
          window.addEventListener("pointerup", onWinEnd);
          window.addEventListener("pointercancel", onWinEnd);
        });
        scrubber.addEventListener("input", (e) => {
          this.isScrubbing = true;
          if (curLabel) curLabel.textContent = this.formatTime(parseFloat(e.target.value) || 0);
        });
        scrubber.addEventListener("change", commitScrub);
        scrubber.addEventListener("pointerup", commitScrub);
        scrubber.addEventListener("pointercancel", cancelScrub);
        scrubber.addEventListener("blur", cancelScrub);
      }

      dock.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-act]");
        if (!btn) return;
        const act = btn.dataset.act;
        if (act === "play-pause") Spicetify.Player?.togglePlay?.();
        else if (act === "prev-track") Spicetify.Player?.back?.();
        else if (act === "next-track") Spicetify.Player?.next?.();
        else if (act === "cycle-style") this.cycleSyntaxStyle();
        else if (act === "toggle-theme") this.toggleMatchSongTheme();
        else if (act === "toggle-focus") this.toggleFocusMode();
        else if (act === "toggle-cover") this.toggleCoverShowcase();
        else if (act === "toggle-settings") this.toggleSettingsPanel();
        else if (act === "toggle-fs") this.toggleFullscreen();
        else if (act === "minimize") {
          this.dockMinimized = !this.dockMinimized;
          dock.classList.toggle("is-minimized", this.dockMinimized);
          btn.textContent = this.dockMinimized ? "▲" : "▼";
        }
      });

      this.playerDock = dock;
      this.root.appendChild(dock);
    }

    toggleCoverShowcase() {
      this.showCoverShowcase = !this.showCoverShowcase;
      this.settings.showCoverShowcase = this.showCoverShowcase;
      this.saveSettings();
      this.resizeCanvas();
      this.syncControlsUI();
    }

    toggleFocusMode() {
      this.settings.dynamicWordZoom = !this.settings.dynamicWordZoom;
      if (!this.settings.dynamicWordZoom) {
        this.currentCameraZoom = 1.0;
        this.currentPanX = 0;
        this.targetPanX = 0;
        this.sustainedPanX = 0;
      }
      this.saveSettings();
      this.applyVisualStyles();
      this.syncControlsUI();
    }

    toggleMatchSongTheme() {
      this.settings.matchSongTheme = !this.settings.matchSongTheme;
      this.saveSettings();
      if (this.settings.matchSongTheme) {
        this.refreshCurrentTrackArtwork(true);
      } else {
        this._artworkReqId = (this._artworkReqId || 0) + 1;
        this.applyThemePreset(this.settings.themePreset);
      }
      this.syncControlsUI();
    }

    cycleSyntaxStyle() {
      const modes = ["mixed", "oop", "control", "pattern"];
      const idx = (modes.indexOf(this.settings.syntaxStyle || "mixed") + 1) % modes.length;
      this.settings.syntaxStyle = modes[idx];
      this.saveSettings();
      this.recompileCurrentLyrics();
      this.syncControlsUI();
    }

    recompileCurrentLyrics() {
      if (Array.isArray(this.rawLyrics) && this.rawLyrics.length > 0) {
        this.compiledLines = this.compileLyrics(this.rawLyrics);
        this.buildCodeDOM();
        this.syncWordCursor(this.currentTime || 0);
      }
    }

    applyThemePreset(presetKey) {
      const key = CURATED_THEMES[presetKey] ? presetKey : "cyberpunk";
      this.settings.themePreset = key;
      this.palette = { ...CURATED_THEMES[key] };
      this.applyPaletteToCSS(this.palette);
    }

    rgbToHsl(r, g, b) {
      const rn = r / 255;
      const gn = g / 255;
      const bn = b / 255;
      const max = Math.max(rn, gn, bn);
      const min = Math.min(rn, gn, bn);
      let h = 0;
      let s = 0;
      const l = (max + min) / 2;
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case rn: h = (gn - bn) / d + (gn < bn ? 6 : 0); break;
          case gn: h = (bn - rn) / d + 2; break;
          default: h = (rn - gn) / d + 4; break;
        }
        h *= 60;
      }
      return { h: (h + 360) % 360, s, l };
    }

    hslToHex(h, s, l) {
      const hue = ((h % 360) + 360) % 360;
      const sat = Math.max(0, Math.min(1, s));
      const lig = Math.max(0, Math.min(1, l));
      const c = (1 - Math.abs(2 * lig - 1)) * sat;
      const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
      const m = lig - c / 2;
      let r1 = 0, g1 = 0, b1 = 0;
      if (hue < 60)      { r1 = c; g1 = x; b1 = 0; }
      else if (hue < 120){ r1 = x; g1 = c; b1 = 0; }
      else if (hue < 180){ r1 = 0; g1 = c; b1 = x; }
      else if (hue < 240){ r1 = 0; g1 = x; b1 = c; }
      else if (hue < 300){ r1 = x; g1 = 0; b1 = c; }
      else               { r1 = c; g1 = 0; b1 = x; }
      const toByte = (v) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
      return `#${toByte(r1)}${toByte(g1)}${toByte(b1)}`;
    }

    hslToRgba(h, s, l, alpha) {
      const hue = ((h % 360) + 360) % 360;
      const sat = Math.max(0, Math.min(1, s));
      const lig = Math.max(0, Math.min(1, l));
      const c = (1 - Math.abs(2 * lig - 1)) * sat;
      const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
      const m = lig - c / 2;
      let r1 = 0, g1 = 0, b1 = 0;
      if (hue < 60)      { r1 = c; g1 = x; b1 = 0; }
      else if (hue < 120){ r1 = x; g1 = c; b1 = 0; }
      else if (hue < 180){ r1 = 0; g1 = c; b1 = x; }
      else if (hue < 240){ r1 = 0; g1 = x; b1 = c; }
      else if (hue < 300){ r1 = x; g1 = 0; b1 = c; }
      else               { r1 = c; g1 = 0; b1 = x; }
      return `rgba(${Math.round((r1 + m) * 255)}, ${Math.round((g1 + m) * 255)}, ${Math.round((b1 + m) * 255)}, ${alpha})`;
    }

    extractAndApplyArtworkUrl(url) {
      const reqId = (this._artworkReqId = (this._artworkReqId || 0) + 1);
      const resolved = this.resolveSpotifyImageUrl(url);
      if (!resolved) {
        this.applyThemePreset(this.settings.themePreset);
        return;
      }
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        if (this._destroyed || !this.settings.matchSongTheme || reqId !== this._artworkReqId) return;
        try {
          const off = document.createElement("canvas");
          off.width = 64;
          off.height = 64;
          const octx = off.getContext("2d");
          if (!octx) {
            this.applyThemePreset(this.settings.themePreset);
            return;
          }
          octx.drawImage(img, 0, 0, 64, 64);
          const data = octx.getImageData(0, 0, 64, 64).data;

          const buckets = [];
          for (let i = 0; i < data.length; i += 16) {
            const { h, s, l } = this.rgbToHsl(data[i], data[i + 1], data[i + 2]);
            if (s > 0.14 && l > 0.08 && l < 0.92) {
              buckets.push({ h, s, l, score: s * (1 - Math.abs(l - 0.5) * 0.8) });
            }
          }

          let h1 = 28;
          let h2 = 330;
          let baseSat = 0.88;
          if (buckets.length >= 5) {
            buckets.sort((a, b) => b.score - a.score);
            h1 = buckets[Math.floor(buckets.length * 0.05)].h;
            const distinct = buckets.find((b) => {
              const diff = Math.abs(b.h - h1);
              return Math.min(diff, 360 - diff) >= 48;
            });
            h2 = distinct ? distinct.h : (h1 + 305) % 360;
          } else {
            baseSat = 0.78;
            h1 = 36;
            h2 = 205;
          }

          const h3 = (h1 + 115) % 360;
          const hOp = (h1 + 175) % 360;
          const hArg = (h2 + 190) % 360;

          this.palette = {
            bgCore: this.hslToHex(h1, 0.38, 0.045),
            keyword: this.hslToHex(h1, Math.min(0.96, baseSat + 0.08), 0.76),
            method: this.hslToHex(h2, Math.min(0.95, baseSat + 0.06), 0.78),
            string: this.hslToHex(h3, Math.min(0.90, baseSat + 0.04), 0.80),
            variable: this.hslToHex(hArg, Math.min(0.88, baseSat), 0.86),
            number: this.hslToHex(hOp, 0.92, 0.80),
            comment: "rgba(255, 255, 255, 0.48)",
            cursorTop: this.hslToHex(h1, 0.98, 0.76),
            cursorMid: this.hslToHex(h2, 0.95, 0.65),
            cursorBot: this.hslToHex(h3, 0.92, 0.58),
            cursorGlow: this.hslToHex(h1, 0.98, 0.68),
            waves: [
              this.hslToRgba(h1, 0.75, 0.46, 0.24),
              this.hslToRgba(h2, 0.72, 0.44, 0.26),
              this.hslToRgba(hOp, 0.68, 0.45, 0.20),
              this.hslToRgba(h3, 0.70, 0.42, 0.22),
              this.hslToRgba(hArg, 0.65, 0.46, 0.22)
            ]
          };
          this.applyPaletteToCSS(this.palette);
        } catch (err) {
          this.applyThemePreset(this.settings.themePreset);
        }
      };
      img.onerror = () => {
        if (this._destroyed || !this.settings.matchSongTheme || reqId !== this._artworkReqId) return;
        this.applyThemePreset(this.settings.themePreset);
      };
      img.src = resolved;
    }

    applyPaletteToCSS(p) {
      if (!p) return;
      const targets = [document.documentElement, this.root].filter(Boolean);
      targets.forEach((el) => {
        el.style.setProperty("--bg-core", p.bgCore || "#09090f");
        el.style.setProperty("--tok-keyword", p.keyword);
        el.style.setProperty("--tok-method", p.method);
        el.style.setProperty("--tok-string", p.string);
        el.style.setProperty("--tok-variable", p.variable);
        el.style.setProperty("--tok-number", p.number);
        el.style.setProperty("--tok-comment", p.comment || "rgba(255, 255, 255, 0.45)");
        el.style.setProperty("--cursor-top", p.cursorTop);
        el.style.setProperty("--cursor-mid", p.cursorMid);
        el.style.setProperty("--cursor-bot", p.cursorBot);
        el.style.setProperty("--cursor-glow", p.cursorGlow);
      });
    }

    refreshCurrentTrackArtwork(force = false) {
      if (!this.settings.matchSongTheme) return;
      const { artUrl } = this.getTrackMetadata();
      if (artUrl && (force || artUrl !== this.lastArtworkTrackUrl)) {
        this.lastArtworkTrackUrl = artUrl;
        this.extractAndApplyArtworkUrl(artUrl);
      } else if (!artUrl) {
        this.applyThemePreset(this.settings.themePreset);
      }
    }

    syncControlsUI() {
      if (this.root) {
        this.root.classList.toggle("is-disabled", !this.enabled);
        this.root.classList.toggle("is-active-line-only", Boolean(this.settings.activeLineOnly));
        this.root.classList.toggle("is-fullscreen", Boolean(this.isFullscreen));
      }
      const { title, artist, album, artUrl, duration } = this.getTrackMetadata();
      const isPlaying = Boolean(Spicetify?.Player?.isPlaying?.());
      const curTime = this.currentTime || 0;
      this.duration = duration;
      this.updateStageProgress(curTime, duration);

      // Sync Cover Showcase
      if (this.coverShowcase) {
        const scArt = this.coverShowcase.querySelector('[data-showcase="art"]');
        const scTitle = this.coverShowcase.querySelector('[data-showcase="title"]');
        const scArtist = this.coverShowcase.querySelector('[data-showcase="artist"]');
        const scAlbum = this.coverShowcase.querySelector('[data-showcase="album"]');
        const scStatus = this.coverShowcase.querySelector('[data-showcase="status"]');
        const scOverlay = this.coverShowcase.querySelector('[data-showcase="overlay"]');
        const scPlayIcon = this.coverShowcase.querySelector(".spicetify-icon-play");
        const scPauseIcon = this.coverShowcase.querySelector(".spicetify-icon-pause");
        const scCur = this.coverShowcase.querySelector('[data-showcase="time-cur"]');
        const scRem = this.coverShowcase.querySelector('[data-showcase="time-rem"]');
        const scScrub = this.coverShowcase.querySelector('[data-showcase="scrubber"]');

        if (scTitle) scTitle.textContent = title;
        if (scArtist) scArtist.textContent = artist;
        if (scAlbum) scAlbum.textContent = album;
        if (scStatus) scStatus.textContent = isPlaying ? "Now Playing" : "Paused";
        if (scOverlay) scOverlay.textContent = isPlaying ? "Pause Track" : "Play Track";
        if (scArt && artUrl && scArt.getAttribute("src") !== artUrl) {
          scArt.src = artUrl;
        }
        if (scPlayIcon && scPauseIcon) {
          scPlayIcon.style.display = isPlaying ? "none" : "block";
          scPauseIcon.style.display = isPlaying ? "block" : "none";
        }
        if (scCur) scCur.textContent = this.formatTime(curTime);
        if (scRem) scRem.textContent = "-" + this.formatTime(Math.max(0, duration - curTime));
        if (scScrub && !this.isScrubbing) {
          scScrub.max = String(Math.max(1, Math.ceil(duration)));
          scScrub.value = String(Math.min(duration, Math.max(0, curTime)));
        }
      }

      // Sync Player Dock
      if (this.playerDock) {
        const dTitle = this.playerDock.querySelector('[data-dock="title"]');
        const dArtist = this.playerDock.querySelector('[data-dock="artist"]');
        const dArt = this.playerDock.querySelector('[data-dock="art"]');
        const dCur = this.playerDock.querySelector('[data-dock="time-cur"]');
        const dTot = this.playerDock.querySelector('[data-dock="time-tot"]');
        const dScrub = this.playerDock.querySelector('[data-dock="scrubber"]');
        const dPlay = this.playerDock.querySelector('button[data-act="play-pause"]');
        const dTheme = this.playerDock.querySelector('button[data-act="toggle-theme"]');
        const dStyle = this.playerDock.querySelector('button[data-act="cycle-style"]');
        const dFocus = this.playerDock.querySelector('button[data-act="toggle-focus"]');
        const dCover = this.playerDock.querySelector('button[data-act="toggle-cover"]');
        const dFs = this.playerDock.querySelector('button[data-act="toggle-fs"]');

        if (dTitle) dTitle.textContent = title;
        if (dArtist) dArtist.textContent = album ? `${artist} • ${album}` : artist;
        if (dArt && artUrl && dArt.getAttribute("src") !== artUrl) dArt.src = artUrl;
        if (dTot) dTot.textContent = this.formatTime(duration);
        if (!this.isScrubbing) {
          if (dCur) dCur.textContent = this.formatTime(curTime);
          if (dScrub) {
            dScrub.max = String(Math.max(1, Math.ceil(duration)));
            dScrub.value = String(Math.min(duration, Math.max(0, curTime)));
          }
        }
        if (dPlay) dPlay.textContent = isPlaying ? "Pause" : "Play";
        if (dTheme) dTheme.classList.toggle("is-active", !!this.settings.matchSongTheme);
        if (dStyle) dStyle.textContent = `Style: ${this.settings.syntaxStyle || "mixed"}`;
        if (dFocus) dFocus.classList.toggle("is-active", !!this.settings.dynamicWordZoom);
        if (dCover) dCover.classList.toggle("is-active", !!this.showCoverShowcase);
        if (dFs) dFs.classList.toggle("is-active", !!this.isFullscreen);
      }

      // Sync Floating Pill
      if (this.pill) {
        const pEnable = this.pill.querySelector('button[data-act="toggle-enable"]');
        const pTheme = this.pill.querySelector('button[data-act="toggle-theme"]');
        const pStyle = this.pill.querySelector('button[data-act="cycle-style"]');
        const pSettings = this.pill.querySelector('button[data-act="toggle-settings"]');
        const pFocus = this.pill.querySelector('button[data-act="toggle-focus"]');
        const pCover = this.pill.querySelector('button[data-act="toggle-cover"]');
        const pFs = this.pill.querySelector('button[data-act="toggle-fs"]');

        if (pEnable) {
          pEnable.classList.toggle("is-on", !!this.enabled);
          pEnable.textContent = `⚡ ${this.enabled ? "ON" : "OFF"}`;
        }
        if (pTheme) pTheme.classList.toggle("is-on", !!this.settings.matchSongTheme);
        if (pStyle) pStyle.textContent = `Style: ${this.settings.syntaxStyle || "mixed"}`;
        if (pSettings) pSettings.classList.toggle("is-on", !!this.settingsPanelOpen);
        if (pFocus) {
          pFocus.classList.toggle("is-on", !!this.settings.dynamicWordZoom);
          pFocus.textContent = `Focus: ${this.settings.dynamicWordZoom ? "ON" : "OFF"}`;
        }
        if (pCover) pCover.classList.toggle("is-on", !!this.showCoverShowcase);
        const pClean = this.pill.querySelector('button[data-act="toggle-clean-feed"]');
        if (pClean) pClean.classList.toggle("is-on", !!this.settings.cleanFeed);
        if (pFs) pFs.classList.toggle("is-on", !!this.isFullscreen);
      }

      // Sync Settings Panel button groups & sliders
      if (this.settingsPanel) {
        const syncGroup = (name, val) => {
          const grp = this.settingsPanel.querySelector(`[data-group="${name}"]`);
          if (!grp) return;
          const strVal = String(val);
          grp.querySelectorAll(".spicetify-group-btn").forEach((b) => {
            b.classList.toggle("is-active", b.dataset.val === strVal);
          });
        };
        syncGroup("matchSongTheme", !!this.settings.matchSongTheme);
        syncGroup("themePreset", this.settings.themePreset || "cyberpunk");
        syncGroup("syntaxStyle", this.settings.syntaxStyle || "mixed");
        syncGroup("lyricRevealMode", normalizeRevealMode(this.settings.lyricRevealMode));
        syncGroup("dynamicWordZoom", !!this.settings.dynamicWordZoom);
        syncGroup("activeLineOnly", !!this.settings.activeLineOnly);
        syncGroup("cleanFeed", !!this.settings.cleanFeed);
        syncGroup("backdropMode", normalizeBackdropMode(this.settings.backdropMode));
        syncGroup("frameRatio", normalizeFrameRatio(this.settings.frameRatio));
        syncGroup("showFrameGuide", this.settings.showFrameGuide !== false);
        syncGroup("cinematicFx", this.settings.cinematicFx !== false);
        const guideRow = this.settingsPanel.querySelector('[data-row-setting="showFrameGuide"]');
        if (guideRow) {
          const hasRatio = normalizeFrameRatio(this.settings.frameRatio) !== "off";
          guideRow.style.opacity = hasRatio ? "1" : "0.4";
          guideRow.style.pointerEvents = hasRatio ? "auto" : "none";
        }
        const cinRow = this.settingsPanel.querySelector('[data-row-setting="cinematicFx"]');
        if (cinRow) {
          const solid = isSolidBackdrop(this.settings.backdropMode);
          cinRow.style.opacity = solid ? "0.4" : "1";
          cinRow.style.pointerEvents = solid ? "none" : "auto";
        }
        syncGroup("showCoverShowcase", !!this.showCoverShowcase);
        syncGroup("wordTrackingMode", this.settings.wordTrackingMode || "stable");
        syncGroup("textDirection", this.settings.textDirection || "auto");
        syncGroup("annotationMode", this.settings.annotationMode || "both");
        syncGroup("showBackgroundVocals", this.settings.showBackgroundVocals !== false);
        syncGroup("adlibMode", ["separate", "hide", "inline"].includes(this.settings.adlibMode) ? this.settings.adlibMode : "separate");
        syncGroup("idleMode", this.settings.idleMode || "lock");
        syncGroup("idleTimeout", Number(this.settings.idleTimeout ?? 60));

        const syncSlider = (cfgKey, fmt) => {
          const sl = this.settingsPanel.querySelector(`input[data-cfg="${cfgKey}"]`);
          const val = this.settings[cfgKey];
          if (sl && val !== undefined) sl.value = String(val);
          const lbl = this.settingsPanel.querySelector(`[data-val="${cfgKey}"]`);
          if (lbl && val !== undefined) lbl.textContent = fmt(val);
        };
        syncSlider("rotX", (v) => `${Math.round(v)}°`);
        syncSlider("rotY", (v) => `${Math.round(v)}°`);
        syncSlider("fontSize", (v) => `${Math.round(v)}px`);
        syncSlider("glowIntensity", (v) => `${Number(v).toFixed(2)}x`);
        syncSlider("syncOffsetMs", (v) => {
          const r = Math.round(v || 0);
          return `${r > 0 ? "+" : ""}${r}ms`;
        });
        const bgOpSl = this.settingsPanel.querySelector('input[data-key="customBgOpacity"]');
        const bgOpLbl = this.settingsPanel.querySelector('[data-val="customBgOpacity"]');
        if (bgOpSl) bgOpSl.value = String(this.settings.customBgOpacity ?? 0.6);
        if (bgOpLbl) bgOpLbl.textContent = `${Math.round((this.settings.customBgOpacity ?? 0.6) * 100)}%`;
        const bgBlurSl = this.settingsPanel.querySelector('input[data-key="customBgBlur"]');
        const bgBlurLbl = this.settingsPanel.querySelector('[data-val="customBgBlur"]');
        if (bgBlurSl) bgBlurSl.value = String(this.settings.customBgBlur ?? 0);
        if (bgBlurLbl) bgBlurLbl.textContent = `${Math.round(this.settings.customBgBlur ?? 0)}px`;
      }
    }

    matchesKeybind(e, kb) {
      if (!kb) return false;
      const keyLower = (e.key || "").toLowerCase();
      const codeMatch = kb.code && e.code === kb.code;
      const keyMatch = kb.key && keyLower === kb.key.toLowerCase();
      if (!codeMatch && !keyMatch) return false;

      const hasCtrlOrCmd = e.ctrlKey || e.metaKey;
      const needCtrl = !!(kb.ctrl || kb.meta);
      if (hasCtrlOrCmd !== needCtrl) return false;
      if (!!e.altKey !== !!kb.alt) return false;
      if (!!e.shiftKey !== !!kb.shift) return false;
      return true;
    }

    formatKeyDisplay(e) {
      const isMac = typeof navigator !== "undefined" && (/Mac|iPod|iPhone|iPad/.test(navigator.platform) || /Macintosh|Mac OS X/.test(navigator.userAgent));
      const parts = [];
      if (e.ctrlKey) parts.push(isMac ? "⌃" : "Ctrl");
      if (e.altKey) parts.push(isMac ? "⌥" : "Alt");
      if (e.shiftKey) parts.push(isMac ? "⇧" : "Shift");
      if (e.metaKey) parts.push(isMac ? "⌘" : "Cmd");

      let keyName = e.key;
      if (e.code === "Space" || keyName === " ") keyName = "Space";
      else if (e.code === "ArrowRight") keyName = "→";
      else if (e.code === "ArrowLeft") keyName = "←";
      else if (e.code === "ArrowUp") keyName = "↑";
      else if (e.code === "ArrowDown") keyName = "↓";
      else if (keyName.length === 1) keyName = keyName.toUpperCase();

      parts.push(keyName);
      return isMac ? parts.join("") : parts.join(" + ");
    }

    renderKeybindsList() {
      if (!this.settingsPanel) return;
      const list = this.settingsPanel.querySelector("#spicetify-keybinds-list");
      if (!list) return;
      list.innerHTML = "";

      Object.keys(this.keybinds).forEach((actKey) => {
        const item = this.keybinds[actKey];
        const row = document.createElement("div");
        row.className = "spicetify-keybind-row";

        const action = document.createElement("span");
        action.className = "spicetify-keybind-action";
        action.textContent = item.name || actKey;

        const badge = document.createElement("button");
        badge.type = "button";
        badge.className = "spicetify-keybind-badge" + (this.recordingKeybindAction === actKey ? " is-recording" : "");
        badge.textContent = this.recordingKeybindAction === actKey ? "Press key..." : item.label;
        badge.dataset.actKey = actKey;

        badge.addEventListener("click", (e) => {
          e.stopPropagation();
          if (this.recordingKeybindAction === actKey) {
            this.recordingKeybindAction = null;
          } else {
            this.recordingKeybindAction = actKey;
          }
          this.renderKeybindsList();
        });

        row.appendChild(action);
        row.appendChild(badge);
        list.appendChild(row);
      });
    }

    applyVisualStyles() {
      const s = this.settings;
      if (!this.root) return;
      const lineHeightVal = (1.48 * (s.lineSpacing || 1)).toFixed(3);
      const glowMultVal = Number(s.glowIntensity || 1).toFixed(2);
      const cssSig = `${s.fontSize}|${lineHeightVal}|${glowMultVal}`;
      if (this._lastCssVarsSig !== cssSig) {
        this._lastCssVarsSig = cssSig;
        this.root.style.setProperty("--ide-font-size", `${s.fontSize}px`);
        this.root.style.setProperty("--ide-line-height", lineHeightVal);
        this.root.style.setProperty("--ide-glow-mult", glowMultVal);
      }
      if (this.codePlane) {
        const isCompact = Boolean(this._isCompact || this.root.classList.contains("is-compact"));
        if (!s.dynamicWordZoom || isCompact) {
          this.currentCameraZoom = 1.0;
          this.currentPanX = 0;
          this.targetPanX = 0;
          this.sustainedPanX = 0;
        }
        if (isCompact) {
          this.codePlane.style.transform = `translateY(${this.currentScrollRem.toFixed(1)}px)`;
        } else {
          const zoom = this.currentCameraZoom || 1.0;
          const bounceScale = s.beatBounce ? (this.audioState.bassPulse * 0.024 * (s.bounceIntensity || 1.2)) : 0;
          const totalScale = zoom + bounceScale;
          const effectiveRotY = this.isRtlSong ? -s.rotY : s.rotY;
          const panX = this.currentPanX ?? 0;
          this.codePlane.style.transform = `
            translate3d(${panX.toFixed(1)}px, ${this.currentScrollRem.toFixed(1)}px, 0px)
            rotateX(${s.rotX}deg)
            rotateY(${effectiveRotY}deg)
            rotateZ(${s.rotZ}deg)
            scale(${totalScale.toFixed(3)})
          `;
        }
      }
    }

    saveSettings() {
      try {
        const { cleanFeed, ...persisted } = this.settings;
        localStorage.setItem("spicetify_ide_lyrics_settings", JSON.stringify(persisted));
      } catch (e) {}
    }

    applyLyricRevealMode() {
      const mode = normalizeRevealMode(this.settings.lyricRevealMode);
      this.settings.lyricRevealMode = mode;
      if (this.codePlane) {
        this.codePlane.classList.toggle("is-typewriter", mode === "typewriter");
      }
      this._lastRevealMode = null;
      this.activeTokenIndex = -1;
    }

    showPresetFeedback(message, isError = false) {
      if (!this.settingsPanel) return;
      const el = this.settingsPanel.querySelector("[data-preset-feedback]");
      if (!el) return;
      el.textContent = String(message || "");
      el.classList.toggle("is-ok", !isError && Boolean(message));
      el.classList.toggle("is-err", isError && Boolean(message));
      if (this._presetFeedbackTimer) {
        clearTimeout(this._presetFeedbackTimer);
        this._presetFeedbackTimer = null;
      }
      if (message) {
        this._presetFeedbackTimer = setTimeout(() => {
          el.textContent = "";
          el.classList.remove("is-ok", "is-err");
          this._presetFeedbackTimer = null;
        }, 4000);
      }
    }

    exportSettingsPreset() {
      const { cleanFeed, ...persisted } = this.settings;
      const safeCustomUrl = typeof persisted.customBgUrl === "string" && /^https?:\/\//i.test(persisted.customBgUrl.trim())
        ? persisted.customBgUrl.trim()
        : "";
      const payload = {
        format: PRESET_FORMAT,
        version: PRESET_VERSION,
        target: "spicetify",
        settings: {
          ...persisted,
          backdropMode: normalizeBackdropMode(persisted.backdropMode),
          frameRatio: normalizeFrameRatio(persisted.frameRatio),
          lyricRevealMode: normalizeRevealMode(persisted.lyricRevealMode),
          customBgUrl: safeCustomUrl
        }
      };
      return JSON.stringify(payload, null, 2);
    }

    copySettingsPreset() {
      const json = this.exportSettingsPreset();
      const onSuccess = () => this.showPresetFeedback("Preset JSON copied to clipboard.", false);
      const fallbackCopy = () => {
        try {
          const ta = document.createElement("textarea");
          ta.value = json;
          ta.setAttribute("readonly", "");
          ta.style.position = "fixed";
          ta.style.opacity = "0";
          ta.style.pointerEvents = "none";
          document.body.appendChild(ta);
          ta.select();
          const ok = typeof document.execCommand === "function" && document.execCommand("copy");
          ta.remove();
          if (ok) {
            onSuccess();
            return;
          }
        } catch (err) {}
        this.showPresetFeedback("Preset ready below (copy manually).", false);
        const box = this.settingsPanel?.querySelector("[data-preset-import-box]");
        const input = this.settingsPanel?.querySelector("[data-preset-input]");
        if (box) box.classList.add("is-open");
        if (input) {
          input.value = json;
          if (typeof input.select === "function") input.select();
        }
      };

      if (typeof navigator !== "undefined" && navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        try {
          const res = navigator.clipboard.writeText(json);
          if (res && typeof res.then === "function") {
            res.then(onSuccess).catch(fallbackCopy);
            return json;
          }
          onSuccess();
          return json;
        } catch (err) {
          fallbackCopy();
          return json;
        }
      }
      fallbackCopy();
      return json;
    }

    importSettingsPreset(rawInput) {
      if (typeof rawInput !== "string" || !rawInput.trim()) {
        const error = "Paste a JSON preset first.";
        this.showPresetFeedback(error, true);
        return { ok: false, error };
      }
      const trimmed = rawInput.trim();
      if (trimmed.length > 50000) {
        const error = "Preset JSON exceeds maximum size.";
        this.showPresetFeedback(error, true);
        return { ok: false, error };
      }

      let parsed;
      try {
        parsed = JSON.parse(trimmed);
      } catch (err) {
        const error = "Invalid JSON syntax.";
        this.showPresetFeedback(error, true);
        return { ok: false, error };
      }

      const isPlainObj = (v) => Boolean(v) && typeof v === "object" && !Array.isArray(v);
      if (!isPlainObj(parsed)) {
        const error = "Preset must be a JSON object.";
        this.showPresetFeedback(error, true);
        return { ok: false, error };
      }

      let sourceSettings = parsed;
      if (Object.prototype.hasOwnProperty.call(parsed, "settings")) {
        if (!isPlainObj(parsed.settings)) {
          const error = "Preset settings field must be an object.";
          this.showPresetFeedback(error, true);
          return { ok: false, error };
        }
        sourceSettings = parsed.settings;
      }

      const numRanges = {
        rotX: [-30, 45],
        rotY: [-45, 45],
        rotZ: [-45, 45],
        fontSize: [16, 64],
        lineSpacing: [0.6, 2.2],
        tokenPadding: [0, 16],
        lineGutter: [0, 20],
        waveAmplitude: [0, 3],
        dofStrength: [0, 1.5],
        glowIntensity: [0.2, 2.5],
        wordZoomScale: [1.0, 2.0],
        bounceIntensity: [0, 3.0],
        idleTimeout: [0, 3600],
        syncOffsetMs: [-1000, 1000],
        customBgOpacity: [0.15, 1.0],
        customBgBlur: [0, 16]
      };
      const boolKeys = new Set([
        "dynamicWordZoom",
        "wordTracking",
        "beatBounce",
        "showBackgroundVocals",
        "matchSongTheme",
        "showCoverShowcase",
        "activeLineOnly",
        "showFrameGuide",
        "cinematicFx"
      ]);
      const enumMap = {
        wordTrackingMode: ["stable", "live", "anticipate"],
        idleMode: ["off", "screensaver", "lock"],
        textDirection: ["auto", "ltr", "rtl"],
        annotationMode: ["off", "roman", "trans", "both"],
        adlibMode: ["separate", "hide", "inline"],
        syntaxStyle: ["mixed", "oop", "control", "pattern"],
        themePreset: Object.keys(CURATED_THEMES),
        backdropMode: VALID_BACKDROP_MODES,
        frameRatio: VALID_FRAME_RATIOS,
        lyricRevealMode: VALID_REVEAL_MODES,
        customBgType: ["image", "video"]
      };

      const validated = {};
      let appliedCount = 0;

      for (const [key, value] of Object.entries(sourceSettings)) {
        if (key === "__proto__" || key === "constructor" || key === "prototype" || key === "cleanFeed") continue;
        if (Object.prototype.hasOwnProperty.call(numRanges, key)) {
          if (typeof value === "number" && Number.isFinite(value)) {
            const [min, max] = numRanges[key];
            validated[key] = Math.max(min, Math.min(max, value));
            appliedCount++;
          }
        } else if (boolKeys.has(key)) {
          if (typeof value === "boolean") {
            validated[key] = value;
            appliedCount++;
          }
        } else if (Object.prototype.hasOwnProperty.call(enumMap, key)) {
          if (typeof value === "string" && enumMap[key].includes(value)) {
            validated[key] = value;
            appliedCount++;
          }
        } else if (key === "customBgUrl") {
          if (typeof value === "string") {
            const url = value.trim();
            if (url === "" || /^https?:\/\//i.test(url)) {
              validated[key] = url;
              appliedCount++;
            }
          }
        }
      }

      if (appliedCount === 0) {
        const error = "No valid settings found in preset.";
        this.showPresetFeedback(error, true);
        return { ok: false, error };
      }

      if (Object.prototype.hasOwnProperty.call(validated, "themePreset") && !Object.prototype.hasOwnProperty.call(validated, "matchSongTheme")) {
        validated.matchSongTheme = false;
      }

      Object.assign(this.settings, validated);
      this.settings.cleanFeed = false;
      this.settings.backdropMode = normalizeBackdropMode(this.settings.backdropMode);
      this.settings.frameRatio = normalizeFrameRatio(this.settings.frameRatio);
      this.settings.lyricRevealMode = normalizeRevealMode(this.settings.lyricRevealMode);
      this.showCoverShowcase = this.settings.showCoverShowcase !== false;

      if (this.settings.matchSongTheme) {
        this.refreshCurrentTrackArtwork(true);
      } else {
        this._artworkReqId = (this._artworkReqId || 0) + 1;
        this.applyThemePreset(this.settings.themePreset);
      }

      this.applyEditStudioState();
      this.applyLyricRevealMode();
      this.updateTextDirection();

      if (Array.isArray(this.rawLyrics) && this.rawLyrics.length > 0) {
        this.recompileCurrentLyrics();
      } else if (this.compiledLines.length > 0) {
        this.buildCodeDOM();
        this.syncWordCursor(this.currentTime || 0);
      }

      this.saveSettings();
      this.resizeCanvas();
      this.applyVisualStyles();
      this.syncControlsUI();

      const msg = `Imported ${appliedCount} setting${appliedCount === 1 ? "" : "s"}.`;
      this.showPresetFeedback(msg, false);
      return { ok: true, appliedCount };
    }

    isCinematicActive() {
      const isCompact = this._isCompact ?? Boolean(this.root?.classList?.contains("is-compact"));
      return this.settings.cinematicFx !== false && !isCompact && !isSolidBackdrop(this.settings.backdropMode);
    }

    setCleanFeed(val) {
      const next = Boolean(val);
      this.settings.cleanFeed = next;
      if (next) {
        if (this.settingsPanelOpen) this.toggleSettingsPanel();
        if (this.isLockActive) this.deactivateLockOrScreensaver();
      }
      this.applyEditStudioState();
      this.resizeCanvas();
      this.syncControlsUI();
    }

    updateEditFrameMetrics(w, h) {
      const ratioKey = normalizeFrameRatio(this.settings.frameRatio);
      const R = EDIT_FRAME_RATIO_MAP[ratioKey];
      if (!this.root) return null;
      if (!R || !w || !h) {
        this.root.style.removeProperty("--edit-frame-w");
        this.root.style.removeProperty("--edit-frame-h");
        this.root.style.removeProperty("--edit-plane-max-w");
        if (this.frameGuideLabelEl) this.frameGuideLabelEl.textContent = "";
        return null;
      }
      let frameW;
      let frameH;
      if (w / Math.max(1, h) > R) {
        frameH = Math.round(h * 0.94);
        frameW = Math.round(frameH * R);
      } else {
        frameW = Math.round(w * 0.94);
        frameH = Math.round(frameW / R);
      }
      frameW = Math.min(Math.round(w), Math.max(160, frameW));
      frameH = Math.min(Math.round(h), Math.max(160, frameH));
      const planeMaxW = Math.max(200, Math.round(frameW * 0.88));
      this.root.style.setProperty("--edit-frame-w", `${frameW}px`);
      this.root.style.setProperty("--edit-frame-h", `${frameH}px`);
      this.root.style.setProperty("--edit-plane-max-w", `${planeMaxW}px`);
      if (this.frameGuideLabelEl) {
        this.frameGuideLabelEl.textContent = `${ratioKey} SAFE FRAME`;
      }
      return { frameW, frameH, planeMaxW };
    }

    applyEditStudioState() {
      const mode = normalizeBackdropMode(this.settings.backdropMode);
      const ratio = normalizeFrameRatio(this.settings.frameRatio);
      const solid = isSolidBackdrop(mode);
      const cleanOn = Boolean(this.settings.cleanFeed);
      const showGuide = this.settings.showFrameGuide !== false;
      const cinematicOn = this.isCinematicActive();

      if (this.root) {
        this.root.classList.toggle("is-clean-feed", cleanOn);
        this.root.setAttribute("data-backdrop", mode);
        this.root.classList.toggle("is-solid-backdrop", solid);
        this.root.setAttribute("data-frame-ratio", ratio);
        this.root.classList.toggle("has-frame-ratio", ratio !== "off");
        this.root.classList.toggle("show-frame-guide", showGuide);
        this.root.classList.toggle("is-cinematic-fx", cinematicOn);
        if (!cinematicOn) {
          if (this._lastCinematicBassStr !== "0") {
            this.root.style.setProperty("--cinematic-bass", "0");
            this._lastCinematicBassStr = "0";
          }
          if (this.vignette && this._lastVignetteOpacityStr !== "") {
            this.vignette.style.opacity = "";
            this._lastVignetteOpacityStr = "";
          }
        }
      }
      if (this.canvas) {
        const isCompact = this._isCompact ?? Boolean(this.root?.classList?.contains("is-compact"));
        this.canvas.style.display = (isCompact || solid || mode === "simple" || mode === "custom") ? "none" : "";
      }
      if (this.settingsPanel) {
        const rowCustom = this.settingsPanel.querySelector('[data-row-setting="customBgControls"]');
        if (rowCustom) rowCustom.style.display = mode === "custom" ? "" : "none";
      }
      this.applyCustomBackground();
    }

    setCustomBackground(url, type = "image") {
      if (this._customBgObjectUrl && this._customBgObjectUrl !== url) {
        try { URL.revokeObjectURL(this._customBgObjectUrl); } catch (e) {}
        this._customBgObjectUrl = null;
      }
      this.settings.customBgUrl = String(url || "").trim();
      this.settings.customBgType = type === "video" ? "video" : "image";
      this.settings.backdropMode = "custom";
      this.saveSettings();
      this.applyEditStudioState();
      this.syncControlsUI();
    }

    clearCustomBackground() {
      if (this._customBgObjectUrl) {
        try { URL.revokeObjectURL(this._customBgObjectUrl); } catch (e) {}
        this._customBgObjectUrl = null;
      }
      this.settings.customBgUrl = "";
      this.settings.customBgType = "image";
      this.saveSettings();
      this.applyCustomBackground();
    }

    handleCustomBgFile(file) {
      if (!file) return;
      const isVideo = Boolean(file.type && file.type.startsWith("video/")) || /\.(mp4|webm|ogg|mov)$/i.test(file.name || "");
      if (!isVideo && file.size <= 2500000 && typeof FileReader !== "undefined") {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") this.setCustomBackground(reader.result, "image");
        };
        reader.readAsDataURL(file);
      } else if (typeof URL !== "undefined" && typeof URL.createObjectURL === "function") {
        const objUrl = URL.createObjectURL(file);
        this.setCustomBackground(objUrl, isVideo ? "video" : "image");
        this._customBgObjectUrl = objUrl;
      }
    }

    applyCustomBackground() {
      if (!this.root || !this.customBgEl) return;
      const mode = normalizeBackdropMode(this.settings.backdropMode);
      const url = typeof this.settings.customBgUrl === "string" ? this.settings.customBgUrl.trim() : "";
      const isVideo = this.settings.customBgType === "video";
      const active = mode === "custom" && url.length > 0;
      this.root.classList.toggle("has-custom-bg", active);
      const op = Math.max(0.1, Math.min(1, typeof this.settings.customBgOpacity === "number" ? this.settings.customBgOpacity : 0.6));
      const blurPx = Math.max(0, Math.min(24, typeof this.settings.customBgBlur === "number" ? this.settings.customBgBlur : 0));
      const filterCss = blurPx > 0 ? `blur(${blurPx}px)` : "none";
      const scaleCss = blurPx > 0 ? "scale(1.05)" : "none";
      if (active && isVideo && this.customBgVideo) {
        if (this.customBgImg) this.customBgImg.style.display = "none";
        if (this.customBgVideo.getAttribute("src") !== url) this.customBgVideo.src = url;
        this.customBgVideo.style.display = "block";
        this.customBgVideo.style.opacity = String(op);
        this.customBgVideo.style.filter = filterCss;
        this.customBgVideo.style.transform = scaleCss;
        try {
          const p = this.customBgVideo.play();
          if (p && typeof p.catch === "function") p.catch(() => {});
        } catch (e) {}
      } else if (active && this.customBgImg) {
        if (this.customBgVideo) {
          this.customBgVideo.style.display = "none";
          try { this.customBgVideo.pause(); } catch (e) {}
        }
        if (this.customBgImg.getAttribute("src") !== url) this.customBgImg.src = url;
        this.customBgImg.style.display = "block";
        this.customBgImg.style.opacity = String(op);
        this.customBgImg.style.filter = filterCss;
        this.customBgImg.style.transform = scaleCss;
      } else {
        if (this.customBgImg) this.customBgImg.style.display = "none";
        if (this.customBgVideo) {
          this.customBgVideo.style.display = "none";
          try { this.customBgVideo.pause(); } catch (e) {}
        }
      }
    }

    updateCinematicVignette(bass) {
      if (!this.root) return;
      if (!this.isCinematicActive()) {
        if (this._lastCinematicBassStr !== "0") {
          this.root.style.setProperty("--cinematic-bass", "0");
          this._lastCinematicBassStr = "0";
        }
        if (this.vignette && this._lastVignetteOpacityStr !== "") {
          this.vignette.style.opacity = "";
          this._lastVignetteOpacityStr = "";
        }
        return;
      }
      const clamped = Math.max(0, Math.min(1, Number(bass) || 0));
      const bassStr = clamped.toFixed(2);
      if (bassStr !== this._lastCinematicBassStr) {
        this.root.style.setProperty("--cinematic-bass", bassStr);
        this._lastCinematicBassStr = bassStr;
      }
      if (this.vignette) {
        const mode = normalizeBackdropMode(this.settings.backdropMode);
        const op = (mode === "vignette" ? (0.90 + clamped * 0.10) : (0.84 + clamped * 0.16)).toFixed(2);
        if (op !== this._lastVignetteOpacityStr) {
          this.vignette.style.opacity = op;
          this._lastVignetteOpacityStr = op;
        }
      }
    }

    initAmbientMotes() {
      const count = 24;
      if (Array.isArray(this._ambientMotes) && this._ambientMotes.length === count) return;
      const motes = [];
      for (let i = 0; i < count; i++) {
        motes.push({
          x: Math.random(),
          y: Math.random(),
          r: 1.2 + Math.random() * 2.4,
          vx: (Math.random() - 0.5) * 0.014,
          vy: -(0.008 + Math.random() * 0.018),
          phase: Math.random() * Math.PI * 2,
          speed: 0.7 + Math.random() * 1.1,
          alpha: 0.16 + Math.random() * 0.24,
          colorIdx: i % 3
        });
      }
      this._ambientMotes = motes;
    }

    drawAmbientMotes(ctx, w, h, dt = 0.016, bass = 0) {
      if (!ctx || !w || !h || !this.isCinematicActive()) return;
      this.initAmbientMotes();
      const colors = [
        this.palette?.keyword || "#ff4fa8",
        this.palette?.method || "#ff9933",
        "#ffffff"
      ];
      const safeDt = Math.max(0.001, Math.min(0.1, Number(dt) || 0.016));
      const b = Math.max(0, Math.min(1, Number(bass) || 0));
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < this._ambientMotes.length; i++) {
        const m = this._ambientMotes[i];
        m.x = (m.x + m.vx * safeDt + 1) % 1;
        m.y += m.vy * safeDt;
        if (m.y < -0.05) {
          m.y = 1.05;
          m.x = Math.random();
        }
        m.phase += m.speed * safeDt;
        const twinkle = 0.65 + 0.35 * Math.sin(m.phase);
        const alpha = Math.min(0.85, m.alpha * twinkle * (0.75 + b * 0.65));
        const px = m.x * w;
        const py = m.y * h;
        const col = colors[m.colorIdx % colors.length];

        ctx.beginPath();
        ctx.globalAlpha = alpha * 0.28;
        ctx.fillStyle = col;
        ctx.arc(px, py, m.r * (3.2 + b * 1.2), 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = col;
        ctx.arc(px, py, m.r * (0.95 + b * 0.25), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    toggleSettingsPanel() {
      this.settingsPanelOpen = !this.settingsPanelOpen;
      if (this.settingsPanel) {
        this.settingsPanel.style.display = this.settingsPanelOpen ? "flex" : "none";
        if (this.settingsPanelOpen) {
          this.renderKeybindsList();
        }
      }
      if (this.settingsPanelOpen) this.clearCursorIdleState();
      else this.resetCursorIdleTimer();
      this.syncControlsUI();
    }

    toggleVisualizer() {
      const isVisible = this.root.classList.contains("is-active");
      if (isVisible) this.hideVisualizer();
      else this.showVisualizer();
    }

    showVisualizer() {
      this.root.classList.add("is-active");
      this.resizeCanvas();
      this.onTrackChange();
      this.syncControlsUI();
      this.resumeRenderLoop();
    }

    hideVisualizer() {
      if (this.settings.cleanFeed) this.setCleanFeed(false);
      this.deactivateLockOrScreensaver();
      this.clearCursorIdleState();
      this.root.classList.remove("is-active");
      this.pauseRenderLoop();
    }

    toggleFullscreen() {
      this.isFullscreen = !this.isFullscreen;
      if (this.isFullscreen) {
        if (document.documentElement.requestFullscreen) {
          Promise.resolve(document.documentElement.requestFullscreen()).catch(() => {});
        }
        this.resetCursorIdleTimer();
      } else {
        if (document.fullscreenElement && document.exitFullscreen) {
          Promise.resolve(document.exitFullscreen()).catch(() => {});
        }
        this.clearCursorIdleState();
      }
      this.resizeCanvas();
      this.syncControlsUI();
    }

    nudgeSyncOffset(deltaMs, exactMs = null) {
      const current = Number(this.settings?.syncOffsetMs) || 0;
      const rawNext = exactMs !== null ? exactMs : current + deltaMs;
      const next = Math.max(-1000, Math.min(1000, Math.round(rawNext)));
      this.settings.syncOffsetMs = next;
      this.saveSettings();
      this.syncControlsUI();
      this.syncWordCursor(this.currentTime || 0);
      this.showSyncOffsetHud(next);
    }

    showSyncOffsetHud(ms) {
      if (!this.syncHudEl) return;
      const rounded = Math.round(ms || 0);
      this.syncHudEl.textContent = `sync: ${rounded > 0 ? "+" : ""}${rounded}ms`;
      this.syncHudEl.classList.add("is-visible");
      if (this._syncHudTimer) clearTimeout(this._syncHudTimer);
      this._syncHudTimer = setTimeout(() => {
        this.syncHudEl?.classList.remove("is-visible");
        this._syncHudTimer = null;
      }, 1200);
    }

    updateStageProgress(curTime, dur) {
      if (!this.progressHairlineEl) return;
      if (!dur || dur <= 0 || !Number.isFinite(dur)) {
        this.progressHairlineEl.style.width = "0%";
        return;
      }
      const pct = Math.min(100, Math.max(0, ((Number(curTime) || 0) / dur) * 100));
      this.progressHairlineEl.style.width = `${pct.toFixed(2)}%`;
    }

    clearCursorIdleState() {
      if (this._cursorIdleTimer) {
        clearTimeout(this._cursorIdleTimer);
        this._cursorIdleTimer = null;
      }
      this.root?.classList.remove("is-cursor-idle");
    }

    resetCursorIdleTimer() {
      this.clearCursorIdleState();
      if (!this.isFullscreen || !this.root?.classList.contains("is-active") || this.settingsPanelOpen || this.isLockActive) {
        return;
      }
      this._cursorIdleTimer = setTimeout(() => {
        if (this.isFullscreen && this.root?.classList.contains("is-active") && !this.settingsPanelOpen && !this.isLockActive) {
          this.root?.classList.add("is-cursor-idle");
        }
        this._cursorIdleTimer = null;
      }, 3000);
    }

    registerTopbarButton() {
      if (Spicetify.Topbar?.Button) {
        new Spicetify.Topbar.Button(
          "3D IDE Lyrics",
          '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>',
          () => this.toggleVisualizer()
        );
      }
    }

    bindPlayerEvents() {
      this._spSongChangeHandler = () => {
        if (!this._destroyed) this.onTrackChange();
      };
      this._spProgressHandler = (e) => {
        if (this._destroyed) return;
        this.currentTime = (e.data || 0) / 1000;
        this._lastProgressWallMs = performance.now();
        this.syncWordCursor(this.currentTime);
        this.syncControlsUI();
      };
      this._spPlayPauseHandler = () => {
        if (this._destroyed) return;
        this._lastActivityTime = Date.now();
        this.syncWordCursor(this.currentTime || 0);
        this.syncControlsUI();
      };
      Spicetify.Player.addEventListener("songchange", this._spSongChangeHandler);
      Spicetify.Player.addEventListener("onprogress", this._spProgressHandler);
      Spicetify.Player.addEventListener("onplaypause", this._spPlayPauseHandler);
    }

    bindKeyboardShortcuts() {
      const isMac = typeof navigator !== "undefined" && (/Mac|iPod|iPhone|iPad/.test(navigator.platform) || /Macintosh|Mac OS X/.test(navigator.userAgent));
      this._keydownHandler = (e) => {
        this._lastActivityTime = Date.now();
        const key = (e.key || "").toLowerCase();
        const code = e.code || "";
        const isInput = ["input", "textarea", "select"].includes(document.activeElement?.tagName?.toLowerCase()) || document.activeElement?.isContentEditable;
        const isVisible = this.root && this.root.classList.contains("is-active");
        const hasCtrlOrCmd = e.ctrlKey || e.metaKey;

        // Keybind recording mode
        if (this.recordingKeybindAction) {
          if (["Control", "Alt", "Shift", "Meta"].includes(e.key)) return;
          e.preventDefault();
          e.stopPropagation();
          if (key === "escape" || code === "Escape") {
            this.recordingKeybindAction = null;
            this.renderKeybindsList();
            return;
          }
          const actKey = this.recordingKeybindAction;
          const prev = this.keybinds[actKey] || {};
          this.keybinds[actKey] = {
            ...prev,
            label: this.formatKeyDisplay(e),
            key,
            code,
            ctrl: !!e.ctrlKey,
            alt: !!e.altKey,
            shift: !!e.shiftKey,
            meta: !!e.metaKey
          };
          this.recordingKeybindAction = null;
          try {
            localStorage.setItem("spicetify_ide_lyrics_keybinds", JSON.stringify(this.keybinds));
          } catch (err) {}
          this.renderKeybindsList();
          return;
        }

        // Escape closes settings or wakes lock or exits fullscreen
        if (key === "escape") {
          if (this.settingsPanelOpen) {
            e.preventDefault();
            this.toggleSettingsPanel();
            return;
          }
          if (this.isLockActive) {
            e.preventDefault();
            if (e.repeat) return;
            this.deactivateLockOrScreensaver();
            return;
          }
          if (this.settings.cleanFeed) {
            e.preventDefault();
            this.setCleanFeed(false);
            return;
          }
          if (this.isFullscreen) {
            e.preventDefault();
            this.toggleFullscreen();
            return;
          }
        }

        // Wake from lock on any non-repeat key
        if (this.isLockActive) {
          e.preventDefault();
          if (e.repeat) return;
          this.deactivateLockOrScreensaver();
          return;
        }

        // Global custom/default keybinds (active even when visualizer is hidden, unless typing in an un-modified input)
        if (!isInput || hasCtrlOrCmd || e.altKey) {
          if (this.matchesKeybind(e, this.keybinds.screensaverLock)) {
            e.preventDefault();
            if (this.isLockActive) this.deactivateLockOrScreensaver();
            else this.activateLockOrScreensaver(true);
            return;
          }

          if (this.matchesKeybind(e, this.keybinds.toggleVisualizer)) {
            e.preventDefault();
            this.toggleVisualizer();
            return;
          }

          if (this.matchesKeybind(e, this.keybinds.toggleFullscreen)) {
            e.preventDefault();
            this.showVisualizer();
            this.toggleFullscreen();
            return;
          }
        }

        if (isInput) return;

        // Visualizer shortcuts when visualizer is open
        if (isVisible) {
          if (this.matchesKeybind(e, this.keybinds.toggleSettings)) {
            e.preventDefault();
            this.toggleSettingsPanel();
            return;
          }

          if (this.matchesKeybind(e, this.keybinds.toggleCleanFeed)) {
            e.preventDefault();
            this.setCleanFeed(!this.settings.cleanFeed);
            return;
          }

          if (this.matchesKeybind(e, this.keybinds.playPause)) {
            e.preventDefault();
            if (Spicetify.Player?.togglePlay) Spicetify.Player.togglePlay();
            return;
          }

          if (this.matchesKeybind(e, this.keybinds.nextTrack)) {
            e.preventDefault();
            if (Spicetify.Player?.next) Spicetify.Player.next();
            return;
          }

          if (this.matchesKeybind(e, this.keybinds.prevTrack)) {
            e.preventDefault();
            if (Spicetify.Player?.back) Spicetify.Player.back();
            return;
          }

          const noModifiers = !e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey;
          const navModifiers = (e.shiftKey || e.ctrlKey || e.metaKey) && !e.altKey;

          // Fallback Play / Pause: KeyK
          if (noModifiers && (code === "KeyK" || key === "k")) {
            e.preventDefault();
            if (Spicetify.Player?.togglePlay) Spicetify.Player.togglePlay();
            return;
          }

          // Fallback Next track: NavModifiers + ArrowRight, or KeyN
          if ((navModifiers && (code === "ArrowRight" || key === "arrowright")) || (noModifiers && (code === "KeyN" || key === "n"))) {
            e.preventDefault();
            if (Spicetify.Player?.next) Spicetify.Player.next();
            return;
          }

          // Fallback Previous track: NavModifiers + ArrowLeft, or KeyP
          if ((navModifiers && (code === "ArrowLeft" || key === "arrowleft")) || (noModifiers && (code === "KeyP" || key === "p"))) {
            e.preventDefault();
            if (Spicetify.Player?.back) Spicetify.Player.back();
            return;
          }

          // Fast seek: ArrowRight (+5s) / ArrowLeft (-5s) when not bound to next/prev
          if (noModifiers && (code === "ArrowRight" || key === "arrowright")) {
            e.preventDefault();
            const cur = (Spicetify.Player?.getProgress?.() ?? (this.currentTime * 1000)) || 0;
            if (Spicetify.Player?.seek) Spicetify.Player.seek(cur + 5000);
            return;
          }
          if (noModifiers && (code === "ArrowLeft" || key === "arrowleft")) {
            e.preventDefault();
            const cur = (Spicetify.Player?.getProgress?.() ?? (this.currentTime * 1000)) || 0;
            if (Spicetify.Player?.seek) Spicetify.Player.seek(Math.max(0, cur - 5000));
            return;
          }

          // Fullscreen: KeyF
          if (noModifiers && (code === "KeyF" || key === "f")) {
            e.preventDefault();
            this.toggleFullscreen();
            return;
          }

          // Quick Sync Nudge: [ (-25ms), ] (+25ms), \ (0ms reset)
          if (!e.ctrlKey && !e.altKey && !e.metaKey) {
            if (code === "BracketLeft" || e.key === "[") {
              e.preventDefault();
              this.nudgeSyncOffset(-25);
              return;
            }
            if (code === "BracketRight" || e.key === "]") {
              e.preventDefault();
              this.nudgeSyncOffset(25);
              return;
            }
            if (code === "Backslash" || e.key === "\\") {
              e.preventDefault();
              this.nudgeSyncOffset(null, 0);
              return;
            }
          }
        }
      };
      window.addEventListener("keydown", this._keydownHandler);
    }

    initIdleWatcher() {
      this._lastActivityTime = Date.now();
      const onUserActivity = (e) => {
        const now = Date.now();
        if (this.isLockActive) {
          if (now - (this._lockActivatedAt || 0) < 400) {
            if (e.type === "mousemove") {
              const curX = e.clientX ?? 0;
              const curY = e.clientY ?? 0;
              this._lockInitialMouse = { x: curX, y: curY };
            }
            return;
          }

          if (e.type === "keydown" || e.type === "mousedown" || e.type === "pointerdown" || e.type === "touchstart") {
            this.deactivateLockOrScreensaver();
          } else if (e.type === "mousemove") {
            const curX = e.clientX ?? 0;
            const curY = e.clientY ?? 0;
            if (!this._lockInitialMouse) {
              this._lockInitialMouse = { x: curX, y: curY };
            } else {
              const dist = Math.hypot(curX - this._lockInitialMouse.x, curY - this._lockInitialMouse.y);
              if (dist > 20) this.deactivateLockOrScreensaver();
            }
          }
        } else {
          this._lastActivityTime = now;
          this.resetCursorIdleTimer();
        }
      };

      this._idleActivityHandler = onUserActivity;
      window.addEventListener("mousemove", this._idleActivityHandler, { passive: true });
      window.addEventListener("mousedown", this._idleActivityHandler, { passive: true });
      window.addEventListener("pointerdown", this._idleActivityHandler, { passive: true });
      window.addEventListener("touchstart", this._idleActivityHandler, { passive: true });
      window.addEventListener("wheel", this._idleActivityHandler, { passive: true });
      window.addEventListener("keydown", this._idleActivityHandler, { passive: true });

      if (this._idleCheckTimer) clearInterval(this._idleCheckTimer);
      this._idleCheckTimer = setInterval(() => {
        if (this.isLockActive || !this.enabled || this.settings.cleanFeed) return;
        const mode = this.settings.idleMode;
        const timeout = Number(this.settings.idleTimeout);
        if (mode === "off" || !timeout || timeout <= 0) return;

        const isPlaying = Boolean(Spicetify.Player.isPlaying());
        if (!isPlaying) return;

        const idleSec = (Date.now() - (this._lastActivityTime || Date.now())) / 1000;
        if (idleSec >= timeout) {
          this.activateLockOrScreensaver(false);
        }
      }, 1000);
    }

    activateLockOrScreensaver(manual = false) {
      if (this.isLockActive) return;
      const modeSetting = this.settings.idleMode;
      const timeout = Number(this.settings.idleTimeout);
      if (!manual && (modeSetting === "off" || !timeout || timeout <= 0)) return;

      const targetMode = modeSetting === "screensaver" ? "screensaver" : "lock";
      this.currentLockMode = targetMode;
      this.isLockActive = true;
      this._lockActivatedAt = Date.now();
      this._lockInitialMouse = null;
      this._preLockFullscreen = this.isFullscreen;
      this._preLockWasVisible = this.root.classList.contains("is-active");

      this.showVisualizer();

      if (targetMode === "lock") {
        this.lockOverlay.style.display = "flex";
        this.updateLockClockAndTrack();
        if (this._lockClockTimer) clearInterval(this._lockClockTimer);
        this._lockClockTimer = setInterval(() => this.updateLockClockAndTrack(), 1000);
      } else {
        this.root.classList.add("is-screensaver-active");
        this.screensaverClock.style.display = "flex";
        this.updateScreensaverClock();
        if (this._screensaverClockTimer) clearInterval(this._screensaverClockTimer);
        this._screensaverClockTimer = setInterval(() => this.updateScreensaverClock(), 1000);
      }
    }

    deactivateLockOrScreensaver() {
      if (!this.isLockActive) return;
      this.isLockActive = false;
      this._lastActivityTime = Date.now();

      if (this._lockClockTimer) clearInterval(this._lockClockTimer);
      if (this._screensaverClockTimer) clearInterval(this._screensaverClockTimer);

      if (this.lockOverlay) this.lockOverlay.style.display = "none";
      if (this.screensaverClock) this.screensaverClock.style.display = "none";
      if (this.root) this.root.classList.remove("is-screensaver-active");
      if (this.pill) this.pill.style.display = "flex";

      if (this._preLockWasVisible === false) {
        this.root.classList.remove("is-active");
        this.pauseRenderLoop();
      }
    }

    updateLockClockAndTrack() {
      if (!this.lockOverlay) return;
      const now = new Date();
      const clockEl = this.lockOverlay.querySelector("#spicetify-lock-clock");
      const dateEl = this.lockOverlay.querySelector("#spicetify-lock-date");
      if (clockEl) clockEl.textContent = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      if (dateEl) dateEl.textContent = now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });

      const { title, artist, artUrl } = this.getTrackMetadata();

      const isPlaying = Boolean(Spicetify.Player?.isPlaying?.());
      const statusLabel = this.lockOverlay.querySelector(".spicetify-lock-status-label");
      const pulseDot = this.lockOverlay.querySelector(".spicetify-lock-pulse-dot");
      if (statusLabel) statusLabel.textContent = isPlaying ? "Now Playing" : "Paused";
      if (pulseDot) {
        pulseDot.classList.toggle("is-paused", !isPlaying);
        pulseDot.style.animationPlayState = isPlaying ? "running" : "paused";
        pulseDot.style.opacity = isPlaying ? "1" : "0.35";
      }

      const titleEl = this.lockOverlay.querySelector("#spicetify-lock-track-title");
      const artistEl = this.lockOverlay.querySelector("#spicetify-lock-track-artist");
      const artEl = this.lockOverlay.querySelector("#spicetify-lock-art");

      if (titleEl) titleEl.textContent = title;
      if (artistEl) artistEl.textContent = artist;
      if (artEl) {
        if (artUrl) {
          if (artEl.src !== artUrl) artEl.src = artUrl;
          artEl.style.display = "block";
        } else {
          artEl.style.display = "none";
        }
      }
    }

    updateScreensaverClock() {
      if (!this.screensaverClock) return;
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      const dateStr = now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
      this.screensaverClock.textContent = `${timeStr}  •  ${dateStr}`;
    }

    updateTextDirection(lines = this.compiledLines) {
      const dir = this.settings.textDirection || "auto";
      if (dir === "rtl") this.isRtlSong = true;
      else if (dir === "ltr") this.isRtlSong = false;
      else this.isRtlSong = (lines || []).some(l => l.isRtl || RTL_REGEX.test(l.text || ""));
    }

    async onTrackChange() {
      const item = Spicetify.Player.data?.item;
      if (!item) return;
      const trackUri = item.uri || "";
      const trackId = trackUri.replace("spotify:track:", "");
      this.syncControlsUI();
      if (this.settings.matchSongTheme) {
        this.refreshCurrentTrackArtwork(false);
      }
      if (this.currentTrackId === trackId) return;
      this.currentTrackId = trackId;
      this.activeLineIndex = -1;
      this.activeTokenIndex = -1;
      this.targetScrollRem = 0;
      this.currentScrollRem = 0;
      this.targetPanX = 0;
      this.currentPanX = 0;
      this._trackedLineIdx = -1;
      this._lineLastPanX = undefined;

      const rawLyrics = await this.fetchLyrics(trackId, item);
      if (this._destroyed || this.currentTrackId !== trackId) return;
      this.rawLyrics = rawLyrics;
      this.compiledLines = this.compileLyrics(rawLyrics);
      this.updateTextDirection(this.compiledLines);
      this.buildCodeDOM();
      this.syncControlsUI();
    }

    async fetchLyrics(trackId, trackItem = null) {
      if (this.lyricsCache.has(trackId)) return this.lyricsCache.get(trackId);

      try {
        const res = await Spicetify.CosmosAsync.get(`https://spclient.wg.spotify.com/color-lyrics/v2/track/${trackId}?format=json&vocalRemoval=false&market=from_token`);
        if (res?.lyrics?.lines) {
          const alts = Array.isArray(res.lyrics.alternatives) ? res.lyrics.alternatives : [];
          const isInstrumentalMarker = (txt) => !txt || /^[\s\u2669\u266A\u266B\u266C\u2022\u00B7.\-\u2013\u2014\u{1F3B5}\u{1F3B6}]+$/u.test(txt);
          const lines = [];
          for (let idx = 0; idx < res.lyrics.lines.length; idx++) {
            const l = res.lyrics.lines[idx];
            const wordsText = String(l?.words || "").trim();
            const startTime = parseInt(l?.startTimeMs, 10) / 1000;
            const rawEndMs = parseInt(l?.endTimeMs, 10);
            const rawStartMs = parseInt(l?.startTimeMs, 10);
            const explicitEnd = Number.isFinite(rawEndMs) && Number.isFinite(rawStartMs) && rawEndMs > rawStartMs
              ? rawEndMs / 1000
              : undefined;
            if (isInstrumentalMarker(wordsText)) {
              if (lines.length > 0 && Number.isFinite(startTime)) {
                const prev = lines[lines.length - 1];
                if (!prev.endTime && startTime > prev.startTime) {
                  prev.endTime = Math.min(startTime, prev.startTime + 6.0);
                }
              }
              continue;
            }
            if (l?.isBackground) {
              if (lines.length > 0) {
                const prev = lines[lines.length - 1];
                prev.bgText = prev.bgText ? `${prev.bgText} · ${wordsText}` : wordsText;
              }
              continue;
            }
            let roman = "";
            let trans = "";
            for (const alt of alts) {
              const altLine = alt?.lines?.[idx];
              const altText = String(altLine?.words || altLine?.text || "").trim();
              if (!altText) continue;
              const lang = String(alt?.language || "").toLowerCase();
              if (lang.includes("roman") || lang.includes("latn") || alt?.isRomanized) {
                if (!roman) roman = altText;
              } else if (!trans) {
                trans = altText;
              }
            }
            const entry = {
              startTime: Number.isFinite(startTime) ? startTime : 0,
              text: wordsText,
              roman,
              trans,
              bgText: ""
            };
            if (explicitEnd !== undefined) entry.endTime = explicitEnd;
            lines.push(entry);
          }
          if (lines.length > 0) {
            this.lyricsCache.set(trackId, lines);
            return lines;
          }
        }
      } catch (err) {
        console.warn("[Spicetify IDE Lyrics] CosmosAsync lyrics endpoint unavailable, using fallback:", err);
      }

      // Fallback simulated lyrics from track metadata (never cached so transient failures can recover)
      const item = trackItem || Spicetify.Player.data?.item;
      const title = item?.metadata?.title || item?.name || "Track";
      const artist = item?.metadata?.artist_name || "Artist";
      return [
        { startTime: 0.0, text: `import { ${this.cleanIdent(title)} } from "${this.cleanIdent(artist)}";` },
        { startTime: 4.0, text: `const melody = await play("${title}");` },
        { startTime: 8.0, text: `if (melody.isSynced()) { return audio.flow(); }` },
        { startTime: 12.0, text: `console.log("Enjoying 3D IDE Synced Lyrics on Spotify");` }
      ];
    }

    extractInlineAdlibs(words) {
      const mainWords = [];
      const adlibParts = [];
      let depth = 0;
      for (let i = 0; i < words.length; i++) {
        const str = String(words[i] || "");
        const opens = (str.match(/[(\uFF08]/g) || []).length;
        const closes = (str.match(/[)\uFF09]/g) || []).length;
        if (depth > 0) {
          const cleaned = str.replace(/[()\uFF08\uFF09]/g, "").trim();
          if (cleaned) adlibParts.push(cleaned);
          depth = Math.max(0, depth + opens - closes);
          continue;
        }
        if (opens > 0) {
          if (/^[(\uFF08]/.test(str.trim())) {
            const cleaned = str.replace(/[()\uFF08\uFF09]/g, "").trim();
            if (cleaned) adlibParts.push(cleaned);
            depth = Math.max(0, opens - closes);
            continue;
          }
          let stripped = str;
          const inlineMatches = str.match(/[(\uFF08][^)\uFF09]*[)\uFF09]/g);
          if (inlineMatches) {
            inlineMatches.forEach((m) => {
              const inner = m.replace(/[()\uFF08\uFF09]/g, "").trim();
              if (inner) adlibParts.push(inner);
            });
            stripped = str.replace(/[(\uFF08][^)\uFF09]*[)\uFF09]/g, "").trim();
          }
          const remOpens = (stripped.match(/[(\uFF08]/g) || []).length;
          const remCloses = (stripped.match(/[)\uFF09]/g) || []).length;
          if (remOpens > remCloses) {
            const idxOpen = stripped.search(/[(\uFF08]/);
            const tail = stripped.slice(idxOpen).replace(/[()\uFF08\uFF09]/g, "").trim();
            if (tail) adlibParts.push(tail);
            stripped = stripped.slice(0, idxOpen).trim();
            depth = Math.max(0, remOpens - remCloses);
          }
          if (stripped) mainWords.push(stripped);
          continue;
        }
        mainWords.push(str);
      }
      return { mainWords, adlibText: adlibParts.join(" ").trim() };
    }

    compileLyrics(rawLines) {
      if (!Array.isArray(rawLines)) return [];
      this.rawLyrics = rawLines;
      const adlibMode = ["separate", "hide", "inline"].includes(this.settings.adlibMode) ? this.settings.adlibMode : "separate";
      const styleMode = this.settings.syntaxStyle || "mixed";
      const keywords = ["const", "let", "function", "async", "await", "return", "import", "from", "export", "class", "if", "else", "true", "false"];

      const compiled = rawLines.map((line, idx) => {
        const text = line.text || "";
        let words = text.split(/\s+/).filter(Boolean);
        let extractedAdlib = "";
        let isAdlibOnlyLine = false;
        let isHiddenAdlibLine = false;
        if (adlibMode !== "inline" && words.length > 0) {
          const splitRes = this.extractInlineAdlibs(words);
          if (splitRes.adlibText) {
            extractedAdlib = splitRes.adlibText;
            if (splitRes.mainWords.length === 0) {
              isAdlibOnlyLine = true;
              if (adlibMode === "hide") isHiddenAdlibLine = true;
            } else {
              words = splitRes.mainWords;
            }
          }
        }
        const tokens = words.map((w, wIdx) => {
          let type = "string";
          const lower = w.toLowerCase().replace(/[^a-z]/g, "");
          if (keywords.includes(lower)) type = "keyword";
          else if (/^\d+$/.test(w)) type = "number";
          else if (w.includes("(") || w.includes(")")) type = "method";
          else if (styleMode === "oop") type = wIdx === 0 ? "keyword" : (wIdx === 1 ? "method" : "variable");
          else if (styleMode === "control") type = wIdx === 0 ? "keyword" : (wIdx % 2 === 1 ? "variable" : "string");
          else if (styleMode === "pattern") type = wIdx % 3 === 0 ? "keyword" : (wIdx % 3 === 1 ? "method" : "number");
          else if (wIdx === 0 && !keywords.includes(lower)) type = "variable";

          return { text: w, type, isWord: true };
        });

        const startTime = line.startTime || 0;
        const nextStart = rawLines[idx + 1]?.startTime;
        let endTime;
        if (typeof line.endTime === "number" && line.endTime > startTime) {
          endTime = line.endTime;
        } else if (typeof nextStart === "number" && nextStart > startTime) {
          endTime = Math.min(nextStart, startTime + 6.0);
        } else {
          endTime = startTime + 4.5;
        }
        const rawDur = Math.max(0.2, endTime - startTime);
        const weights = tokens.map((t) => Math.max(2, (t.text || "").length));
        const totalWeight = weights.reduce((a, b) => a + b, 0) || 1;
        const vocalSpan = rawDur * 0.92;
        let accWeight = 0;
        const wordTimings = tokens.map((t, tIdx) => {
          const propStart = startTime + (vocalSpan * accWeight) / totalWeight;
          accWeight += weights[tIdx];
          const propEnd = startTime + (vocalSpan * accWeight) / totalWeight;
          return { start: propStart, end: Math.max(propStart + 0.06, propEnd) };
        });

        const rawBgText = (line.bgText || "").trim();
        const adlibCombined = isAdlibOnlyLine
          ? rawBgText
          : [rawBgText, extractedAdlib].filter((v, i, arr) => v && arr.indexOf(v) === i).join(" · ").trim();

        return {
          index: idx,
          startTime,
          endTime,
          text,
          roman: (line.roman || "").trim(),
          trans: (line.trans || "").trim(),
          bgText: rawBgText,
          adlibText: adlibCombined,
          isAdlibOnlyLine,
          isHiddenAdlibLine,
          isRtl: RTL_REGEX.test(text),
          tokens,
          wordTimings
        };
      });

      this.updateTextDirection(compiled);
      return compiled;
    }

    buildCodeDOM() {
      if (!this.codePlane) return;
      this.codePlane.innerHTML = "";
      this.cachedLineNodes = [];
      this.activeLineIndex = -1;
      this.activeTokenIndex = -1;
      this._lastRevealMode = null;
      this.codePlane.classList.toggle("is-rtl", !!this.isRtlSong);
      this.codePlane.classList.toggle("is-typewriter", normalizeRevealMode(this.settings.lyricRevealMode) === "typewriter");

      this.compiledLines.forEach((line) => {
        const row = document.createElement("div");
        row.className = "spicetify-ide-line"
          + (this.isRtlSong ? " is-rtl" : "")
          + (line.isAdlibOnlyLine ? " is-adlib-only-line" : "")
          + (line.isHiddenAdlibLine ? " is-adlib-hidden" : "");
        row.dataset.lineIndex = line.index;

        const gutter = document.createElement("span");
        gutter.className = "spicetify-line-gutter";
        gutter.textContent = String(line.index + 1).padStart(2, "0");
        row.appendChild(gutter);

        const tokenNodes = [];
        line.tokens.forEach((tok, tIdx) => {
          const span = document.createElement("span");
          span.className = `spicetify-code-token spicetify-tok-${tok.type}`;
          span.dataset.tokenIndex = tIdx;
          span.textContent = tok.text + " ";
          row.appendChild(span);
          tokenNodes.push(span);
        });

        const annoMode = this.settings.annotationMode || "both";
        const adlibMode = ["separate", "hide", "inline"].includes(this.settings.adlibMode) ? this.settings.adlibMode : "separate";
        const showBg = this.settings.showBackgroundVocals !== false;
        const commentParts = [];
        if ((annoMode === "roman" || annoMode === "both") && line.roman) commentParts.push(line.roman);
        if ((annoMode === "trans" || annoMode === "both") && line.trans) commentParts.push(line.trans);
        const mainComment = commentParts.length ? `// ${commentParts.join(" · ")}` : "";
        const bgComment = (adlibMode === "inline" && showBg && line.bgText) ? `/* bg: ${line.bgText} */` : "";
        const fullComment = [mainComment, bgComment].filter(Boolean).join("  ");
        if (fullComment) {
          const commentEl = document.createElement("div");
          commentEl.className = "spicetify-ide-line-comment code-comment";
          commentEl.textContent = fullComment;
          row.appendChild(commentEl);
        }
        if (adlibMode === "separate" && showBg && line.adlibText) {
          const adlibEl = document.createElement("div");
          adlibEl.className = "spicetify-ide-line-adlib code-comment";
          adlibEl.textContent = `// ${line.adlibText}`;
          row.appendChild(adlibEl);
        }

        row.addEventListener("click", () => {
          if (typeof line.startTime === "number") {
            Spicetify.Player.seek(line.startTime * 1000);
          }
        });

        this.codePlane.appendChild(row);
        this.cachedLineNodes.push({ row, line, tokens: tokenNodes, caretEl: null });
      });
    }

    updateInterludeIndicator(effectiveTime, activeLineIdx) {
      if (!this.interludeEl || !this.interludeLabelEl || !this.interludeFillEl) return;
      const lines = this.compiledLines;
      if (!lines || !lines.length) {
        this.interludeEl.classList.remove("is-visible");
        return;
      }

      let show = false;
      let remaining = 0;
      let progress = 0;
      const firstLine = lines[0];

      if (effectiveTime < firstLine.startTime - 0.15) {
        if (firstLine.startTime >= 3.5) {
          show = true;
          remaining = Math.max(0, firstLine.startTime - effectiveTime);
          progress = Math.max(0, Math.min(1, effectiveTime / Math.max(0.1, firstLine.startTime)));
        }
      } else {
        let prevIdx = activeLineIdx;
        if (prevIdx < 0) {
          for (let i = 0; i < lines.length; i++) {
            if (effectiveTime >= lines[i].startTime) prevIdx = i;
          }
        }
        if (prevIdx >= 0 && prevIdx < lines.length - 1) {
          const curLine = lines[prevIdx];
          const nextLine = lines[prevIdx + 1];
          const gapDur = nextLine.startTime - curLine.endTime;
          if (gapDur >= 3.5 && effectiveTime >= curLine.endTime + 0.15 && effectiveTime < nextLine.startTime - 0.05) {
            show = true;
            remaining = Math.max(0, nextLine.startTime - effectiveTime);
            progress = Math.max(0, Math.min(1, (effectiveTime - curLine.endTime) / Math.max(0.1, gapDur)));
          }
        }
      }

      this.interludeEl.classList.toggle("is-visible", show);
      if (show) {
        this.interludeLabelEl.textContent = `// await vocals(${remaining.toFixed(1)}s)`;
        this.interludeFillEl.style.width = `${(progress * 100).toFixed(1)}%`;
      }
    }

    syncWordCursor(curTime) {
      if (!this.compiledLines.length) return;
      const offsetSec = (Number(this.settings.syncOffsetMs) || 0) / 1000;
      const effectiveTime = curTime + offsetSec;
      const revealMode = normalizeRevealMode(this.settings.lyricRevealMode);
      const isTypewriter = revealMode === "typewriter";
      const modeChanged = this._lastRevealMode !== revealMode;
      this._lastRevealMode = revealMode;

      if (this.codePlane) {
        this.codePlane.classList.toggle("is-typewriter", isTypewriter);
      }

      let activeLineIdx = -1;
      for (let i = 0; i < this.compiledLines.length; i++) {
        const l = this.compiledLines[i];
        if (effectiveTime >= l.startTime && effectiveTime < l.endTime) {
          activeLineIdx = i;
          break;
        }
      }

      this.updateInterludeIndicator(effectiveTime, activeLineIdx);

      const lineChanged = activeLineIdx !== this.activeLineIndex;
      if (lineChanged || modeChanged) {
        const prevNode = this.activeLineIndex >= 0 ? this.cachedLineNodes[this.activeLineIndex] : null;
        if (prevNode?.row) {
          prevNode.row.querySelectorAll(".spicetify-code-token.active-word, .spicetify-code-token.is-word-bounce, .spicetify-code-token.is-sung, .spicetify-code-token.is-upcoming").forEach((tok) => {
            tok.classList.remove("active-word", "is-word-bounce", "is-sung", "is-upcoming");
          });
        }
        this.activeLineIndex = activeLineIdx;
        this.activeTokenIndex = -1;
      }

      if (lineChanged || modeChanged || (isTypewriter && activeLineIdx < 0)) {
        this.cachedLineNodes.forEach((node, idx) => {
          const { row, line } = node;
          const isActive = idx === activeLineIdx;
          const dist = activeLineIdx >= 0 ? Math.abs(idx - activeLineIdx) : 99;
          const isFutureLine = isTypewriter && (activeLineIdx >= 0 ? idx > activeLineIdx : (line.startTime > effectiveTime));
          row.classList.toggle("is-active-line", isActive);
          row.classList.toggle("is-near-1", !isActive && dist === 1);
          row.classList.toggle("is-near-2", !isActive && dist === 2);
          row.classList.toggle("is-future-line", isFutureLine);

          const tokens = node.tokens || Array.from(row.querySelectorAll(".spicetify-code-token"));
          if (!isTypewriter) {
            if (node.caretEl) {
              node.caretEl.classList.remove("is-visible", "is-typing-solid");
            }
            if (modeChanged || !isActive) {
              for (let j = 0; j < tokens.length; j++) {
                const tok = tokens[j];
                tok.classList.remove("is-typing", "is-untyped");
                tok.style.removeProperty("--type-pct");
                if (!isActive) {
                  tok.classList.remove("active-word", "is-word-bounce", "is-sung", "is-upcoming");
                }
              }
            }
          } else if (!isActive) {
            if (node.caretEl) {
              node.caretEl.classList.remove("is-visible", "is-typing-solid");
            }
            const isPastLine = activeLineIdx >= 0 ? idx < activeLineIdx : (line.startTime <= effectiveTime);
            for (let j = 0; j < tokens.length; j++) {
              const tok = tokens[j];
              tok.classList.remove("active-word", "is-word-bounce", "is-sung", "is-upcoming", "is-typing");
              tok.style.removeProperty("--type-pct");
              tok.classList.toggle("is-untyped", !isPastLine);
            }
          }
        });
      }

      if (activeLineIdx >= 0) {
        const rowNode = this.cachedLineNodes[activeLineIdx]?.row;
        const planeCenterY = (this.codePlane?.clientHeight || this.codePlane?.offsetHeight || 0) / 2;
        if (rowNode && planeCenterY > 0 && rowNode.offsetHeight > 0) {
          this.targetScrollRem = planeCenterY - (rowNode.offsetTop + rowNode.offsetHeight / 2);
        } else {
          this.targetScrollRem = -(activeLineIdx * 48);
        }
      }

      // Word tracking, highlight/typewriter reveal & beat punch
      if (activeLineIdx >= 0) {
        const activeLine = this.compiledLines[activeLineIdx];
        const numTokens = activeLine.tokens.length;
        const timings = activeLine.wordTimings;
        const hasTimings = Array.isArray(timings) && timings.length > 0;
        let activeTokIdx = 0;
        let wordProgress = 0;
        let lineDone = false;
        if (hasTimings) {
          for (let w = 0; w < timings.length; w++) {
            if (effectiveTime >= timings[w].start) activeTokIdx = w;
          }
          const lastEnd = timings[timings.length - 1].end;
          if (effectiveTime >= lastEnd) {
            lineDone = true;
            activeTokIdx = timings.length - 1;
            wordProgress = 1;
          } else {
            const wt = timings[Math.min(timings.length - 1, activeTokIdx)];
            wordProgress = wt
              ? Math.min(1, Math.max(0, (effectiveTime - wt.start) / Math.max(0.06, wt.end - wt.start)))
              : 0;
          }
        } else if (numTokens > 0) {
          const lineDuration = Math.max(0.1, activeLine.endTime - activeLine.startTime);
          const progress = Math.min(1, Math.max(0, (effectiveTime - activeLine.startTime) / lineDuration));
          if (progress >= 0.995) {
            lineDone = true;
            activeTokIdx = numTokens - 1;
            wordProgress = 1;
          } else {
            const scaled = progress * numTokens;
            activeTokIdx = Math.min(numTokens - 1, Math.floor(scaled));
            wordProgress = Math.min(1, Math.max(0, scaled - activeTokIdx));
          }
        }

        const isPlaying = Boolean(Spicetify?.Player?.isPlaying?.());
        const curTiming = hasTimings ? timings[Math.min(timings.length - 1, activeTokIdx)] : null;
        const inWordSpan = curTiming
          ? (effectiveTime >= curTiming.start && effectiveTime < curTiming.end)
          : (wordProgress < 0.99);
        const isActivelyTyping = isPlaying && !lineDone && numTokens > 0 && inWordSpan;
        this.isCurrentlySpeaking = isActivelyTyping;

        const activeNode = this.cachedLineNodes[activeLineIdx];
        const rowNode = activeNode?.row;
        if (rowNode) {
          const allTokens = activeNode.tokens || Array.from(rowNode.querySelectorAll(".spicetify-code-token"));
          if (!isTypewriter) {
            if (activeTokIdx !== this.activeTokenIndex || modeChanged) {
              this.activeTokenIndex = activeTokIdx;
              allTokens.forEach((tok, idx) => {
                const isCur = idx === activeTokIdx;
                tok.classList.toggle("active-word", isCur);
                tok.classList.toggle("is-sung", idx < activeTokIdx);
                tok.classList.toggle("is-upcoming", idx > activeTokIdx);
                if (isCur && this.settings.beatBounce) {
                  tok.classList.remove("is-word-bounce");
                  void tok.offsetWidth;
                  tok.classList.add("is-word-bounce");
                  this.audioState.bassPulse = 1.0;
                }
              });
            }
          } else {
            if (activeTokIdx !== this.activeTokenIndex) {
              this.activeTokenIndex = activeTokIdx;
              if (this.settings.beatBounce && !lineDone) {
                this.audioState.bassPulse = 1.0;
              }
            }
            let caretAnchorTok = null;
            let caretPct = 100;
            for (let idx = 0; idx < allTokens.length; idx++) {
              const tok = allTokens[idx];
              tok.classList.remove("active-word", "is-word-bounce", "is-sung", "is-upcoming");
              if (lineDone || idx < activeTokIdx) {
                tok.classList.remove("is-typing", "is-untyped");
                tok.style.removeProperty("--type-pct");
                caretAnchorTok = tok;
                caretPct = 100;
              } else if (idx === activeTokIdx) {
                const rawText = (tok.textContent || "").trim();
                const charCount = Math.max(1, Array.from(rawText).length);
                const typedChars = Math.max(1, Math.ceil(Math.max(0.01, Math.min(1, wordProgress)) * charCount));
                const pct = Math.min(100, (typedChars / charCount) * 100);
                tok.classList.remove("is-untyped");
                tok.classList.add("is-typing");
                tok.style.setProperty("--type-pct", `${pct.toFixed(1)}%`);
                caretAnchorTok = tok;
                caretPct = pct;
              } else {
                tok.classList.remove("is-typing");
                tok.style.removeProperty("--type-pct");
                tok.classList.add("is-untyped");
              }
            }

            if (caretAnchorTok) {
              if (!activeNode.caretEl) {
                const caret = document.createElement("span");
                caret.className = "spicetify-tw-caret tw-caret";
                caret.setAttribute("aria-hidden", "true");
                rowNode.appendChild(caret);
                activeNode.caretEl = caret;
              }
              const isRtlLine = rowNode.classList.contains("is-rtl");
              const frac = Math.max(0, Math.min(1, caretPct / 100));
              const cx = isRtlLine
                ? caretAnchorTok.offsetLeft + caretAnchorTok.offsetWidth * (1 - frac) - 2
                : caretAnchorTok.offsetLeft + caretAnchorTok.offsetWidth * frac + 2;
              const cy = caretAnchorTok.offsetTop + 2;
              const ch = Math.max(16, (caretAnchorTok.offsetHeight || 24) - 4);
              activeNode.caretEl.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0)`;
              activeNode.caretEl.style.height = `${ch.toFixed(1)}px`;
              activeNode.caretEl.classList.add("is-visible");
              activeNode.caretEl.classList.toggle("is-typing-solid", Boolean(isActivelyTyping));
            } else if (activeNode.caretEl) {
              activeNode.caretEl.classList.remove("is-visible", "is-typing-solid");
            }
          }

          if (this.settings.wordTracking === false || this.settings.wordTrackingMode === "stable" || allTokens.length === 0) {
            this.targetPanX = 0;
          } else {
            const activeTok = allTokens[activeTokIdx];
            if (activeTok) {
              // Vertically center the active token's wrapped visual sub-line when a bar wraps
              const planeCenterY = (this.codePlane?.clientHeight || this.codePlane?.offsetHeight || 0) / 2;
              if (planeCenterY > 0 && (activeTok.offsetHeight || 0) > 0) {
                this.targetScrollRem = planeCenterY - ((rowNode.offsetTop || 0) + (activeTok.offsetTop || 0) + activeTok.offsetHeight / 2);
              }

              const planeCenterX = (this.codePlane?.clientWidth || window.innerWidth || 1200) / 2;
              const rowLeft = rowNode.offsetLeft || 0;
              const wordLeft = rowLeft + activeTok.offsetLeft;
              const wordTop = (rowNode.offsetTop || 0) + (activeTok.offsetTop || 0);
              const wordW = activeTok.offsetWidth || 0;
              const edgeX = this.isRtlSong
                ? wordLeft + (1 - wordProgress) * wordW
                : wordLeft + wordProgress * wordW;

              let focusX = edgeX;
              if (this.settings.wordTrackingMode === "anticipate") {
                const nextTok = allTokens[activeTokIdx + 1];
                if (nextTok && Math.abs(((rowNode.offsetTop || 0) + (nextTok.offsetTop || 0)) - wordTop) <= 10) {
                  const t = Math.min(1, Math.max(0, (wordProgress - 0.35) / (0.95 - 0.35)));
                  const lookahead = t * t * (3 - 2 * t);
                  const nextWordCenterX = rowLeft + nextTok.offsetLeft + (nextTok.offsetWidth || 0) / 2;
                  focusX = edgeX + (nextWordCenterX - edgeX) * lookahead;
                }
              }

              const zoomScale = this.settings.wordZoomScale || 1.25;
              const panGain = Math.min(0.85, 0.35 + Math.max(0, zoomScale - 1.0) * 1.2);
              const maxPan = Math.min(380, (window.innerWidth || 1200) * 0.28);
              const rawPan = -(focusX - planeCenterX) * panGain;
              let clampedPan = Math.max(-maxPan, Math.min(maxPan, rawPan));

              // Monotonic progression: within a single visual sub-line, camera pan must only glide
              // in the reading direction, resetting when the same bar wraps onto a new visual line.
              const timeJump = this._lastTrackTimeSec !== undefined &&
                (Math.abs(effectiveTime - this._lastTrackTimeSec) > 2.0 || effectiveTime < this._lastTrackTimeSec - 0.05);
              const wrappedToNewSubLine = this._trackedVisualTop !== undefined && Math.abs(wordTop - this._trackedVisualTop) > 10;
              if (this._trackedLineIdx !== activeLineIdx || wrappedToNewSubLine || timeJump) {
                this._trackedLineIdx = activeLineIdx;
                this._trackedVisualTop = wordTop;
                this._lineLastPanX = this.isRtlSong ? -Infinity : Infinity;
              }
              this._lastTrackTimeSec = effectiveTime;

              if (this.isRtlSong) {
                if (clampedPan < (this._lineLastPanX ?? -Infinity)) {
                  clampedPan = this._lineLastPanX;
                } else {
                  this._lineLastPanX = clampedPan;
                }
              } else {
                if (clampedPan > (this._lineLastPanX ?? Infinity)) {
                  clampedPan = this._lineLastPanX;
                } else {
                  this._lineLastPanX = clampedPan;
                }
              }
              this.targetPanX = clampedPan;
              this.lastSpokenTimestamp = performance.now();
              this.sustainedPanX = this.targetPanX;
            }
          }
        }
      } else {
        this.isCurrentlySpeaking = false;
        this.targetPanX = 0;
        this._trackedLineIdx = -1;
        this._lineLastPanX = this.isRtlSong ? -Infinity : Infinity;
        this._lastTrackTimeSec = effectiveTime;
      }
    }

    isRenderActive() {
      if (this._destroyed) return false;
      if (typeof document !== "undefined" && document.hidden) return false;
      return Boolean(this.enabled && this.root && this.root.classList.contains("is-active"));
    }

    pauseRenderLoop() {
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
    }

    resumeRenderLoop() {
      if (this._destroyed || this.rafId || !this._renderCallback) return;
      if (!this.isRenderActive()) return;
      this._lastRenderTime = performance.now();
      this.rafId = requestAnimationFrame(this._renderCallback);
    }

    destroy() {
      this._destroyed = true;
      this.pauseRenderLoop();
      if (this._idleCheckTimer) {
        clearInterval(this._idleCheckTimer);
        this._idleCheckTimer = null;
      }
      if (this._lockClockTimer) {
        clearInterval(this._lockClockTimer);
        this._lockClockTimer = null;
      }
      if (this._screensaverClockTimer) {
        clearInterval(this._screensaverClockTimer);
        this._screensaverClockTimer = null;
      }
      if (this._syncHudTimer) {
        clearTimeout(this._syncHudTimer);
        this._syncHudTimer = null;
      }
      if (this._presetFeedbackTimer) {
        clearTimeout(this._presetFeedbackTimer);
        this._presetFeedbackTimer = null;
      }
      this.clearCursorIdleState();
      if (this._resizeHandler) {
        window.removeEventListener("resize", this._resizeHandler);
        this._resizeHandler = null;
      }
      if (this._keydownHandler) {
        window.removeEventListener("keydown", this._keydownHandler);
        this._keydownHandler = null;
      }
      if (this._idleActivityHandler) {
        ["mousemove", "mousedown", "pointerdown", "touchstart", "wheel", "keydown"].forEach((evt) => {
          window.removeEventListener(evt, this._idleActivityHandler);
        });
        this._idleActivityHandler = null;
      }
      if (this._fullscreenChangeHandler && typeof document !== "undefined") {
        document.removeEventListener("fullscreenchange", this._fullscreenChangeHandler);
        this._fullscreenChangeHandler = null;
      }
      if (typeof Spicetify !== "undefined" && Spicetify?.Player?.removeEventListener) {
        try {
          if (this._spSongChangeHandler) Spicetify.Player.removeEventListener("songchange", this._spSongChangeHandler);
          if (this._spProgressHandler) Spicetify.Player.removeEventListener("onprogress", this._spProgressHandler);
          if (this._spPlayPauseHandler) Spicetify.Player.removeEventListener("onplaypause", this._spPlayPauseHandler);
        } catch {}
        this._spSongChangeHandler = null;
        this._spProgressHandler = null;
        this._spPlayPauseHandler = null;
      }
      if (this._visibilityChangeHandler && typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", this._visibilityChangeHandler);
        this._visibilityChangeHandler = null;
      }
      this.root?.remove();
      this.pill?.remove();
      this.settingsPanel?.remove();
      if (typeof window !== "undefined" && window.__SPICETIFY_IDE_LYRICS_ACTIVE__ === this) {
        delete window.__SPICETIFY_IDE_LYRICS_ACTIVE__;
      }
    }

    startRenderLoop() {
      this._lastRenderTime = performance.now();
      let wavePhase = 0;

      const render = (time) => {
        if (!this.isRenderActive()) {
          this.rafId = null;
          return;
        }
        const dt = Math.min(0.1, Math.max(0.0001, (time - this._lastRenderTime) / 1000));
        this._lastRenderTime = time;

        // Interpolate sub-frame word cursor at 60fps between onprogress events
        if (this._lastProgressWallMs && Spicetify?.Player?.isPlaying?.()) {
          const subFrameTime = (this.currentTime || 0) + Math.min(0.25, Math.max(0, (time - this._lastProgressWallMs) / 1000));
          this.syncWordCursor(subFrameTime);
        }

        // Smooth code plane scrolling (dt-normalized exponential smoothing)
        const scrollAlpha = 1 - Math.exp(-8 * dt);
        this.currentScrollRem += (this.targetScrollRem - this.currentScrollRem) * scrollAlpha;

        // Decay bass pulse
        this.audioState.bassPulse = Math.max(0, this.audioState.bassPulse - dt * 2.8);

        // Dynamic word zoom camera & word tracking
        const targetZoom = this.settings.dynamicWordZoom && this.activeLineIndex >= 0 ? (this.settings.wordZoomScale || 1.25) : 1.0;
        const zoomAlpha = 1 - Math.exp(-5 * dt);
        this.currentCameraZoom += (targetZoom - this.currentCameraZoom) * zoomAlpha;

        const now = performance.now();
        let targetX = 0;
        if (this.settings.dynamicWordZoom && this.settings.wordTracking !== false && this.settings.wordTrackingMode !== "stable") {
          if (this.activeLineIndex >= 0) {
            targetX = this.targetPanX ?? 0;
          } else if (now - (this.lastSpokenTimestamp || 0) < 1000) {
            targetX = this.sustainedPanX ?? 0;
          } else {
            targetX = 0;
          }
        } else {
          targetX = 0;
          this.sustainedPanX = 0;
          this.currentPanX = 0;
        }
        const panRate = (this.activeLineIndex < 0 && targetX === 0) ? 1.5 : 4.5;
        const panAlpha = 1 - Math.exp(-panRate * dt);
        this.currentPanX = (this.currentPanX || 0) + (targetX - (this.currentPanX || 0)) * panAlpha;
        if (this.settings.wordTrackingMode === "stable" || this.settings.wordTracking === false) {
          this.currentPanX = 0;
        }
        const maxPan = Math.min(380, (window.innerWidth || 1200) * 0.28);
        this.currentPanX = Math.max(-maxPan, Math.min(maxPan, this.currentPanX));

        this.applyVisualStyles();

        // Render synth waves on canvas (skip in compact mode where canvas is hidden)
        if (!this._isCompact && this.ctx && this.canvas && this.root.classList.contains("is-active")) {
          wavePhase += dt * (1.2 * (this.settings.waveAmplitude || 1.15));
          this.drawWaves(wavePhase, dt);
        }

        if (this.isRenderActive()) {
          this.rafId = requestAnimationFrame(render);
        } else {
          this.rafId = null;
        }
      };

      this._renderCallback = render;
      if (!this._visibilityChangeHandler && typeof document !== "undefined") {
        this._visibilityChangeHandler = () => {
          if (document.hidden) this.pauseRenderLoop();
          else this.resumeRenderLoop();
        };
        document.addEventListener("visibilitychange", this._visibilityChangeHandler);
      }
      this.resumeRenderLoop();
    }

    drawWaves(phase, dt = 0.016) {
      const { ctx, canvas } = this;
      if (!ctx || !canvas) return;
      const w = canvas.width;
      const h = canvas.height;
      const bass = Math.max(0, Math.min(1, this.audioState.bassPulse || 0));
      this.updateCinematicVignette(bass);
      if (w <= 0 || h <= 0) return;
      ctx.clearRect(0, 0, w, h);
      if (isSolidBackdrop(this.settings.backdropMode) || this.settings.backdropMode === "simple" || this.settings.backdropMode === "custom") return;

      const amp = this.settings.waveAmplitude || 1.15;
      const pulse = this.audioState.bassPulse * 28;
      const colors = this.palette.waves;

      colors.forEach((color, i) => {
        ctx.beginPath();
        const baseH = h * (0.62 + i * 0.07);
        ctx.moveTo(0, h);

        for (let x = 0; x <= w; x += 12) {
          const normX = x / w;
          const y = baseH +
            Math.sin(normX * 5.0 + phase * (1.0 + i * 0.2) + i) * (26 * amp + pulse) +
            Math.cos(normX * 8.0 - phase * 0.8) * (14 * amp);
          ctx.lineTo(x, y);
        }

        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
      });

      if (this.isCinematicActive()) {
        this.drawAmbientMotes(ctx, w, h, dt, bass);
      }
    }

    resizeCanvas() {
      if (!this.canvas) return;
      const rect = this.root?.getBoundingClientRect?.();
      const w = (this.root && this.root.classList.contains("is-active") && rect?.width) ? rect.width : (window.innerWidth || 1280);
      const h = (this.root && this.root.classList.contains("is-active") && rect?.height) ? rect.height : (window.innerHeight || 720);
      const isCompact = (w > 0 && w < 560 && !this.isFullscreen);
      const showCover = Boolean(!this.settings.cleanFeed && this.showCoverShowcase && (this.isFullscreen || w >= 760));
      const solidBackdrop = isSolidBackdrop(this.settings.backdropMode);
      this._isCompact = isCompact;
      if (this.root) {
        this.root.classList.toggle("is-compact", isCompact);
        this.root.classList.toggle("has-cover-showcase", showCover);
      }
      if (this.pill) {
        this.pill.classList.toggle("is-compact", isCompact);
      }
      this.canvas.style.display = (isCompact || solidBackdrop) ? "none" : "";
      this.updateEditFrameMetrics(w, h);
      this.applyEditStudioState();
      this.canvas.width = w;
      this.canvas.height = h;
    }

    cleanIdent(str) {
      return (str || "").replace(/[^\p{L}\p{N}_\s]/gu, "").trim().replace(/\s+/g, "_") || "item";
    }
  }

  // Instantiate and start engine
  const engine = new SpicetifyIDELyricsEngine();
  engine.init();
})();
