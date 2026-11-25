$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition

$EdgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $EdgePath)) {
    $EdgePath = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
}
if (-not (Test-Path $EdgePath)) {
    throw "msedge.exe not found on system!"
}

$TempHtml = Join-Path ([System.IO.Path]::GetTempPath()) "spicetify_test.html"
$JsContent = Get-Content -Raw -Encoding UTF8 (Join-Path $ScriptDir "ideLyrics.js")

$Head = @'
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>
<div id="res">PENDING</div>
<script>
window.onerror = function(msg, url, line, col, err) {
  document.getElementById("res").textContent = "ERROR: " + msg + " at line " + line + ":" + col;
};
window.Spicetify = {
  Player: {
    data: { item: { uri: "spotify:track:test123", name: "Song Title", metadata: { title: "Song Title", artist_name: "Artist" } } },
    isPlaying: function() { return true; },
    addEventListener: function() {},
    seek: function() {}
  },
  CosmosAsync: {
    get: async function() { return { lyrics: { lines: [{ startTimeMs: "1000", words: "Test word" }] } }; }
  },
  Topbar: {
    Button: class { constructor(name, icon, onClick) { this.name = name; } }
  }
};
</script>
<script>
'@

$Tail = @'
</script>
<script>
(async function runVerification() {
  const resEl = document.getElementById("res");
  if (resEl.textContent.startsWith("ERROR")) return;

  const results = [];
  function assert(name, condition, msg) {
    results.push({ name, pass: !!condition, msg: condition ? "OK" : msg });
  }

  try {
    const ext = window.__SPICETIFY_IDE_LYRICS_ACTIVE__;
    assert("ExtensionMounted", !!ext, "Extension instance must exist");
    assert("RootCreated", !!document.getElementById("spicetify-ide-visualizer-root"), "Root DOM must exist");
    assert("CanvasCreated", !!document.getElementById("spicetify-ide-canvas"), "Canvas element must exist");
    assert("PillCreated", !!document.getElementById("spicetify-ide-floating-pill"), "Floating pill must exist");
    assert("SettingsPanelCreated", !!document.getElementById("spicetify-ide-settings-panel"), "Settings panel must exist");
    assert("LockOverlayCreated", !!document.getElementById("spicetify-ide-lock-overlay"), "Lock overlay must exist");
    assert("ScreensaverClockCreated", !!document.getElementById("spicetify-ide-screensaver-clock"), "Screensaver clock must exist");

    // Test Show Visualizer
    ext.showVisualizer();
    assert("VisualizerVisible", ext.root.classList.contains("is-active"), "Visualizer must have is-active class");

    // Test Synced Lyrics compile & DOM
    ext.compiledLines = ext.compileLyrics([
      { startTime: 0, text: "const melody = await play();" },
      { startTime: 4, text: "return audio.flow();" }
    ]);
    ext.buildCodeDOM();
    assert("LinesRendered", ext.cachedLineNodes.length === 2, "Compiled lines must be rendered in DOM");

    // Test Word Cursor & Bounce
    ext.syncWordCursor(1.0);
    assert("ActiveLineSelected", ext.activeLineIndex === 0, "Active line 0 must be selected");

    // Test Lock button in pill
    const pillLockBtn = ext.pill.querySelector('button[data-act="toggle-lock"]');
    assert("PillLockBtnExists", !!pillLockBtn, "Pill must have a Lock button");

    // Test Ambient Lock Screen activation via Ctrl+Alt+S
    window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyS", key: "s", ctrlKey: true, altKey: true, bubbles: true }));
    assert("LockScreenActivatedViaCtrlAltS", ext.isLockActive === true && ext.currentLockMode === "lock", "Ctrl+Alt+S failed: isLockActive=" + ext.isLockActive + " currentLockMode=" + ext.currentLockMode);
    assert("LockOverlayVisible", ext.lockOverlay.style.display === "flex", "Lock overlay must be visible, got=" + ext.lockOverlay.style.display);
    assert("LockPulseDotPresent", !!ext.lockOverlay.querySelector(".spicetify-lock-pulse-dot"), "Lock screen pulse dot must exist");
    assert("LockStatusLabelPlaying", ext.lockOverlay.querySelector(".spicetify-lock-status-label")?.textContent === "Now Playing", "Lock status label must say Now Playing when active");

    // Test Paused status in lock overlay
    Spicetify.Player.isPlaying = function() { return false; };
    ext.updateLockClockAndTrack();
    assert("LockStatusLabelPaused", ext.lockOverlay.querySelector(".spicetify-lock-status-label")?.textContent === "Paused", "Lock status label must say Paused when track is paused");
    assert("LockPulseDotPaused", ext.lockOverlay.querySelector(".spicetify-lock-pulse-dot")?.classList.contains("is-paused"), "Pulse dot must have is-paused class when paused");
    Spicetify.Player.isPlaying = function() { return true; };

    // Test Escape dismisses lock
    window.dispatchEvent(new KeyboardEvent("keydown", { code: "Escape", key: "Escape", bubbles: true }));
    assert("EscapeDismissesLock", ext.isLockActive === false && ext.lockOverlay.style.display === "none", "Escape must dismiss lock screen");

    // Test Clean Screensaver mode
    ext.settings.idleMode = "screensaver";
    ext.activateLockOrScreensaver(true);
    assert("ScreensaverModeActive", ext.isLockActive === true && ext.currentLockMode === "screensaver", "Screensaver mode must be active");
    assert("ScreensaverClockVisible", ext.screensaverClock.style.display === "flex", "Screensaver minimal clock must be visible");
    assert("RootHasScreensaverClass", ext.root.classList.contains("is-screensaver-active"), "Visualizer root must have is-screensaver-active class");

    // Wake dismisses screensaver
    ext.deactivateLockOrScreensaver();
    assert("ScreensaverDeactivated", ext.isLockActive === false && ext.screensaverClock.style.display === "none", "Screensaver must deactivate cleanly");

    // Test Pre-lock visibility restoration
    ext.hideVisualizer();
    assert("VisualizerHiddenInitially", !ext.root.classList.contains("is-active"), "Visualizer must be hidden initially");
    ext.settings.idleMode = "lock";
    ext.activateLockOrScreensaver(true);
    assert("LockActivatedWhenPreviouslyHidden", ext.isLockActive === true, "Lock should activate");
    ext.deactivateLockOrScreensaver();
    assert("PreLockVisibilityRestored", !ext.root.classList.contains("is-active"), "Visualizer must return to hidden state if it was hidden prior to lock");

    // Test Keydown updates idle activity timestamp
    ext._lastActivityTime = 1000;
    window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyX", key: "x", bubbles: true }));
    assert("KeydownUpdatesIdleActivity", ext._lastActivityTime > 1000, "Keydown must update _lastActivityTime so idle timer does not trigger during typing");

    // Test macOS MetaKey (Cmd) shortcuts
    ext.deactivateLockOrScreensaver();
    window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyS", key: "s", metaKey: true, altKey: true, bubbles: true }));
    assert("MacCmdAltSActivatesLock", ext.isLockActive === true, "Cmd+Option+S on macOS must activate lock/screensaver");
    ext.deactivateLockOrScreensaver();

    ext.hideVisualizer();
    window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyL", key: "l", metaKey: true, altKey: true, bubbles: true }));
    assert("MacCmdAltLTogglesVisualizer", ext.root.classList.contains("is-active"), "Cmd+Option+L on macOS must toggle visualizer");

    // Test Cross-Platform Font Stacks
    const styleTag = document.getElementById("spicetify-ide-lyrics-styles");
    assert("MacLinuxFontsPresent", styleTag && styleTag.textContent.includes("SF Mono") && styleTag.textContent.includes("Ubuntu Mono") && styleTag.textContent.includes("DejaVu Sans Mono"), "Cross-platform font stack must include SF Mono, Ubuntu Mono, and DejaVu Sans Mono");

    // Test Fix A: cleanIdent preserves Arabic/Persian/CJK/Cyrillic
    assert("CleanIdentPersian", ext.cleanIdent("سلام دنیا!") === "سلام_دنیا", "cleanIdent must preserve Persian/Arabic chars, got=" + ext.cleanIdent("سلام دنیا!"));
    assert("CleanIdentCJK", ext.cleanIdent("日本語 テスト") === "日本語_テスト", "cleanIdent must preserve CJK chars");
    assert("CleanIdentCyrillic", ext.cleanIdent("Привет мир") === "Привет_мир", "cleanIdent must preserve Cyrillic chars");

    // Test Fix A: Auto RTL detection in compileLyrics & textDirection toggle (no crash)
    ext.settings.textDirection = "auto";
    ext.compiledLines = ext.compileLyrics([
      { startTime: 0, text: "سلام دنیا" },
      { startTime: 4, text: "شب بخیر" }
    ]);
    ext.buildCodeDOM();
    assert("AutoRtlDetected", ext.isRtlSong === true, "compileLyrics must auto-detect isRtlSong for RTL lyrics");
    assert("CodePlaneRtlClass", ext.codePlane.classList.contains("is-rtl"), "codePlane must have is-rtl class");
    assert("LineRowRtlClass", ext.cachedLineNodes[0]?.row?.classList?.contains("is-rtl"), "cachedLineNodes[0].row must have is-rtl class");

    const ltrBtn = ext.settingsPanel.querySelector('[data-group="textDirection"] button[data-val="ltr"]');
    const rtlBtn = ext.settingsPanel.querySelector('[data-group="textDirection"] button[data-val="rtl"]');
    const autoBtn = ext.settingsPanel.querySelector('[data-group="textDirection"] button[data-val="auto"]');
    ltrBtn.click();
    assert("TextDirToggleLtr", ext.isRtlSong === false && !ext.cachedLineNodes[0].row.classList.contains("is-rtl"), "Toggling textDirection to LTR must update isRtlSong and row class without crashing");
    rtlBtn.click();
    assert("TextDirToggleRtl", ext.isRtlSong === true && ext.cachedLineNodes[0].row.classList.contains("is-rtl"), "Toggling textDirection to RTL must update isRtlSong and row class");
    autoBtn.click();
    assert("TextDirToggleAuto", ext.isRtlSong === true, "Toggling textDirection back to Auto must detect RTL from compiledLines");

    // Test Fix C: toggleSettings ('S'), keybind recording, and matchesKeybind
    ext.showVisualizer();
    if (ext.settingsPanelOpen) ext.toggleSettingsPanel();
    window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyS", key: "s", bubbles: true }));
    assert("ToggleSettingsViaKeyS", ext.settingsPanelOpen === true, "Pressing S when visualizer is active must open settings");
    window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyS", key: "s", bubbles: true }));
    assert("ToggleSettingsClosedViaKeyS", ext.settingsPanelOpen === false, "Pressing S again must close settings");

    const settingsKbBadge = ext.settingsPanel.querySelector('.spicetify-keybind-badge[data-act-key="toggleSettings"]');
    assert("SettingsKeybindBadgeExists", !!settingsKbBadge, "toggleSettings keybind badge must exist");
    settingsKbBadge.click();
    assert("KeybindRecordingStarted", ext.recordingKeybindAction === "toggleSettings", "Clicking keybind badge must start recording");
    window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyG", key: "g", bubbles: true }));
    assert("KeybindRecorded", ext.recordingKeybindAction === null && ext.keybinds.toggleSettings.code === "KeyG", "Pressing G during recording must bind KeyG to toggleSettings");
    assert("MatchesKeybindWorks", ext.matchesKeybind({ code: "KeyG", key: "g", ctrlKey: false, altKey: false, shiftKey: false, metaKey: false }, ext.keybinds.toggleSettings) === true, "matchesKeybind must match newly recorded keybind");
    window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyG", key: "g", bubbles: true }));
    assert("CustomKeybindTriggersAction", ext.settingsPanelOpen === true, "Custom keybind KeyG must toggle settings");
    if (ext.settingsPanelOpen) ext.toggleSettingsPanel();
    ext.settingsPanel.querySelector('button[data-act="reset-keybinds"]').click();

    // Test Feat 1: syncOffsetMs default, UI slider/badge, localStorage, and lyric sync offset
    assert("SyncOffsetDefaultZero", ext.settings.syncOffsetMs === 0, "syncOffsetMs must default to 0");
    const syncSlider = ext.settingsPanel.querySelector('input[data-cfg="syncOffsetMs"]');
    const syncBadge = ext.settingsPanel.querySelector('[data-val="syncOffsetMs"]');
    assert("SyncOffsetUIExists", !!syncSlider && !!syncBadge && syncSlider.min === "-1000" && syncSlider.max === "1000" && syncSlider.step === "25", "syncOffsetMs slider (-1000..1000, step 25) and badge must exist");
    syncSlider.value = "500";
    syncSlider.dispatchEvent(new Event("input", { bubbles: true }));
    assert("SyncOffsetUpdated", ext.settings.syncOffsetMs === 500 && syncBadge.textContent === "+500ms", "Slider input must update syncOffsetMs and badge");
    const savedSettingsStr = localStorage.getItem("spicetify_ide_lyrics_settings") || "";
    assert("SyncOffsetPersisted", savedSettingsStr.includes('"syncOffsetMs":500'), "syncOffsetMs must persist to localStorage");

    ext.settings.textDirection = "ltr";
    ext.compiledLines = ext.compileLyrics([
      { startTime: 0, text: "line zero" },
      { startTime: 2, text: "line one" }
    ]);
    ext.buildCodeDOM();
    ext.settings.syncOffsetMs = 0;
    ext.syncWordCursor(1.6);
    assert("SyncWithoutOffset", ext.activeLineIndex === 0, "At t=1.6 with 0ms offset, line 0 must be active");
    ext.settings.syncOffsetMs = 500;
    ext.syncWordCursor(1.6);
    assert("SyncWithPositiveOffset", ext.activeLineIndex === 1, "At t=1.6 with +500ms offset (effective 2.1s), line 1 must be active");

    // Test Zoom & Transform Order + Single-Word Typed-Edge Tracking
    assert("PlaneNoCssTransition", !styleTag.textContent.includes("transition: transform 0.12s"), ".spicetify-ide-plane must not have CSS transition: transform fighting rAF");
    assert("PlaneTransformOriginCenter", styleTag.textContent.includes("transform-origin: center center"), ".spicetify-ide-plane must set transform-origin: center center");
    ext.applyVisualStyles();
    const tf = ext.codePlane.style.transform || "";
    const tIdx = tf.indexOf("translate3d(");
    const sIdx = tf.indexOf("scale(");
    assert("TransformTranslateBeforeScale", tIdx >= 0 && sIdx > tIdx, "translate3d must precede scale in codePlane.style.transform, got=" + tf);

    // Ensure visualizer is visible and laid out for offsetLeft/offsetWidth measurements
    ext.showVisualizer();
    ext.settings.syncOffsetMs = 0;
    ext.settings.textDirection = "ltr";
    ext.settings.dynamicWordZoom = true;
    ext.settings.wordTracking = true;
    ext.compiledLines = ext.compileLyrics([
      { startTime: 0, text: "supercalifragilisticexpialidocious tomorrow" },
      { startTime: 4, text: "another line here" }
    ]);
    ext.buildCodeDOM();

    // Stable mode keeps targetPanX at 0
    ext.settings.wordTrackingMode = "stable";
    ext.syncWordCursor(0.5);
    assert("StableModeTargetPanZero", ext.targetPanX === 0, "stable mode must keep targetPanX === 0, got=" + ext.targetPanX);

    // Live mode tracks continuous typed edge within a single word (word 0 spans 0..2s)
    ext.settings.wordTrackingMode = "live";
    ext.syncWordCursor(0.2);
    const livePanEarly = ext.targetPanX;
    ext.syncWordCursor(1.6);
    const livePanLate = ext.targetPanX;
    assert("LiveTypedEdgeUpdatesWithinWord", livePanLate < livePanEarly, "live mode must update targetPanX within a single word as wordProgress advances: early=" + livePanEarly + ", late=" + livePanLate);

    // Anticipate mode blends smoothly toward next word without snapping to 0
    ext.settings.wordTrackingMode = "anticipate";
    ext.syncWordCursor(0.4); // wordProgress = 0.2 (before 0.35 lookahead)
    const antEarly = ext.targetPanX;
    ext.syncWordCursor(1.5); // wordProgress = 0.75 (blending toward next word)
    const antLate = ext.targetPanX;
    assert("AnticipateBlendsTowardNextWord", antLate < antEarly && antLate !== 0, "anticipate mode must blend toward next word without snapping to 0: early=" + antEarly + ", late=" + antLate);

    // Test P1: Visibility-gated rAF & destroy() lifecycle cleanup
    ext.showVisualizer();
    assert("RafIdStoredWhenActive", !!ext.rafId, "rafId must be active when visualizer is shown");
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    document.dispatchEvent(new Event("visibilitychange"));
    assert("RafPausedWhenDocumentHidden", ext.rafId === null, "rafId must pause when document.hidden is true");
    Object.defineProperty(document, "hidden", { configurable: true, get: () => false });
    document.dispatchEvent(new Event("visibilitychange"));
    assert("RafResumedWhenDocumentVisible", !!ext.rafId, "rafId must resume when document becomes visible");
    ext.hideVisualizer();
    assert("RafPausedWhenVisualizerHidden", ext.rafId === null, "rafId must pause when visualizer is hidden");

    // Test Cider Parity: spotify:image: resolution
    assert("ResolveSpotifyImageUri", ext.resolveSpotifyImageUrl("spotify:image:ab67616d0000b273123456") === "https://i.scdn.co/image/ab67616d0000b273123456", "resolveSpotifyImageUrl must convert spotify:image: URIs to https://i.scdn.co/image/");
    assert("ResolveHttpsImageUrl", ext.resolveSpotifyImageUrl("https://i.scdn.co/image/xyz") === "https://i.scdn.co/image/xyz", "resolveSpotifyImageUrl must preserve https URLs");

    // Test Cider Parity: Album & Cover Showcase rendering
    ext.showVisualizer();
    Spicetify.Player.data.item = {
      uri: "spotify:track:albumtest1",
      name: "Midnight Rain",
      metadata: {
        title: "Midnight Rain",
        artist_name: "Taylor Swift",
        album_title: "Midnights",
        image_xlarge_url: "spotify:image:ab67616d0000b273abcdef"
      }
    };
    await ext.onTrackChange();
    const scEl = document.getElementById("spicetify-ide-cover-showcase");
    const dockEl = document.getElementById("spicetify-ide-player-dock");
    assert("CoverShowcaseCreated", !!scEl && !!dockEl, "Cover Showcase and Player Dock must exist");
    assert("CoverShowcaseAlbumRendered", scEl?.querySelector('[data-showcase="album"]')?.textContent === "Midnights", "Cover Showcase must display album name, got=" + scEl?.querySelector('[data-showcase="album"]')?.textContent);
    assert("CoverShowcaseTitleArtist", scEl?.querySelector('[data-showcase="title"]')?.textContent === "Midnight Rain" && scEl?.querySelector('[data-showcase="artist"]')?.textContent === "Taylor Swift", "Cover Showcase must display track title and artist");
    assert("CoverShowcaseArtworkSrc", scEl?.querySelector('[data-showcase="art"]')?.getAttribute("src") === "https://i.scdn.co/image/ab67616d0000b273abcdef", "Cover Showcase artwork src must resolve spotify:image: URI");
    assert("CoverShowcaseActiveClass", ext.root.classList.contains("has-cover-showcase"), "Root must have has-cover-showcase on >=760px viewport");

    // Test toggle-cover sync across pill, dock, settings
    const pillCoverBtn = ext.pill.querySelector('button[data-act="toggle-cover"]');
    const dockCoverBtn = ext.playerDock.querySelector('button[data-act="toggle-cover"]');
    assert("PillCoverBtnExists", !!pillCoverBtn && pillCoverBtn.classList.contains("is-on"), "Pill must have toggle-cover button with is-on");
    pillCoverBtn.click();
    assert("ToggleCoverHidesShowcase", ext.showCoverShowcase === false && !ext.root.classList.contains("has-cover-showcase") && !pillCoverBtn.classList.contains("is-on") && !dockCoverBtn.classList.contains("is-active"), "Clicking toggle-cover must hide Cover Showcase and sync pill/dock");
    pillCoverBtn.click();
    assert("ToggleCoverRestoresShowcase", ext.showCoverShowcase === true && ext.root.classList.contains("has-cover-showcase") && pillCoverBtn.classList.contains("is-on"), "Clicking toggle-cover again must restore Cover Showcase");

    // Test Song-Adaptive Theme, Curated Themes, and Artwork Extraction
    ext.applyThemePreset("tokyoNight");
    assert("CuratedThemeApplied", document.documentElement.style.getPropertyValue("--tok-keyword").trim() === "#bb9af7" && ext.palette.bgCore === "#0d0f18", "applyThemePreset('tokyoNight') must apply Tokyo Night CSS vars");

    const pillThemeBtn = ext.pill.querySelector('button[data-act="toggle-theme"]');
    const dockThemeBtn = ext.playerDock.querySelector('button[data-act="toggle-theme"]');
    const initialThemeState = ext.settings.matchSongTheme;
    pillThemeBtn.click();
    assert("ToggleThemeSyncsPillAndDock", ext.settings.matchSongTheme === !initialThemeState && pillThemeBtn.classList.contains("is-on") === ext.settings.matchSongTheme && dockThemeBtn.classList.contains("is-active") === ext.settings.matchSongTheme, "toggle-theme must sync pill and dock");
    if (!ext.settings.matchSongTheme) pillThemeBtn.click();

    // Test extractAndApplyArtworkUrl using an in-memory canvas data URL
    const sampleCanvas = document.createElement("canvas");
    sampleCanvas.width = 4;
    sampleCanvas.height = 4;
    const sctx = sampleCanvas.getContext("2d");
    sctx.fillStyle = "#00ff88";
    sctx.fillRect(0, 0, 4, 4);
    const sampleDataUrl = sampleCanvas.toDataURL("image/png");
    const prevKw = ext.palette.keyword;
    ext.extractAndApplyArtworkUrl(sampleDataUrl);
    await new Promise((r) => setTimeout(r, 80));
    assert("ExtractArtworkUpdatesPalette", ext.palette.keyword !== prevKw && document.documentElement.style.getPropertyValue("--bg-core").trim() !== "", "extractAndApplyArtworkUrl must dynamically tint palette and --bg-core from artwork");

    // Test Style cycling & sync
    const pillStyleBtn = ext.pill.querySelector('button[data-act="cycle-style"]');
    const dockStyleBtn = ext.playerDock.querySelector('button[data-act="cycle-style"]');
    const styleBefore = ext.settings.syntaxStyle;
    pillStyleBtn.click();
    assert("CycleStyleUpdatesAndSyncs", ext.settings.syntaxStyle !== styleBefore && pillStyleBtn.textContent.includes(ext.settings.syntaxStyle) && dockStyleBtn.textContent.includes(ext.settings.syntaxStyle), "cycle-style must update syntaxStyle and sync pill/dock");

    // Test Focus & Hide Others sync
    const pillFocusBtn = ext.pill.querySelector('button[data-act="toggle-focus"]');
    const dockFocusBtn = ext.playerDock.querySelector('button[data-act="toggle-focus"]');
    const focusBefore = ext.settings.dynamicWordZoom;
    pillFocusBtn.click();
    assert("ToggleFocusSyncsPillAndDock", ext.settings.dynamicWordZoom === !focusBefore && pillFocusBtn.classList.contains("is-on") === ext.settings.dynamicWordZoom && dockFocusBtn.classList.contains("is-active") === ext.settings.dynamicWordZoom, "toggle-focus must sync pill and dock");

    assert("HideOthersRemovedFromSpicetify", !ext.pill.querySelector('button[data-act="toggle-hide-others"]') && !ext.coverShowcase.querySelector('button[data-act="toggle-hide-others"]') && !ext.playerDock.querySelector('button[data-act="toggle-hide-others"]'), "Show/Hide Others button must be removed from Spicetify");
    const spSubBtns = Array.from(ext.coverShowcase.querySelectorAll(".spicetify-cover-sub-transport .spicetify-cover-sub-btn")).map(b => b.dataset.act);
    assert("SpicetifySubTransportRepeatThenShuffle", spSubBtns.length === 2 && spSubBtns[0] === "repeat" && spSubBtns[1] === "shuffle", "Spicetify sub-transport must place repeat then shuffle on the right");
    assert("SpicetifyPillHiddenUntilHover", window.getComputedStyle(ext.pill).opacity === "0", "Spicetify top pill must be hidden (opacity: 0) until hovered");
    pillCoverBtn.click(); // turn showcase off

    // Test Active Line Only
    const activeOnlyTrueBtn = ext.settingsPanel.querySelector('[data-group="activeLineOnly"] button[data-val="true"]');
    const activeOnlyFalseBtn = ext.settingsPanel.querySelector('[data-group="activeLineOnly"] button[data-val="false"]');
    assert("ActiveLineOnlyButtonsExist", !!activeOnlyTrueBtn && !!activeOnlyFalseBtn, "activeLineOnly buttons must exist in settings panel");
    if (activeOnlyTrueBtn && activeOnlyFalseBtn) {
      activeOnlyTrueBtn.click();
      assert("ActiveLineOnlyEnabled", ext.settings.activeLineOnly === true && ext.root.classList.contains("is-active-line-only"), "activeLineOnly ON must add .is-active-line-only to root");
      activeOnlyFalseBtn.click();
      assert("ActiveLineOnlyDisabled", ext.settings.activeLineOnly === false && !ext.root.classList.contains("is-active-line-only"), "activeLineOnly OFF must remove .is-active-line-only from root");
    }

    // Test Quick Sync Nudge ([ / ] / \)
    ext.settings.syncOffsetMs = 0;
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "]", code: "BracketRight", bubbles: true }));
    assert("QuickSyncNudgeUp", ext.settings.syncOffsetMs === 25 && ext.syncHudEl?.classList.contains("is-visible"), "] must nudge syncOffsetMs +25ms and show HUD");
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "[", code: "BracketLeft", bubbles: true }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "[", code: "BracketLeft", bubbles: true }));
    assert("QuickSyncNudgeDown", ext.settings.syncOffsetMs === -25, "[ twice from +25ms must nudge syncOffsetMs to -25ms");
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "\\", code: "Backslash", bubbles: true }));
    assert("QuickSyncNudgeReset", ext.settings.syncOffsetMs === 0, "\\ must reset syncOffsetMs to 0ms");

    // Test Stage Progress Hairline
    ext.updateStageProgress(30, 120);
    assert("StageProgressHairlineWidth", parseFloat(ext.progressHairlineEl?.style.width) === 25, "Progress hairline width must reflect currentTime/duration, got " + ext.progressHairlineEl?.style.width);
    ext.updateStageProgress(10, 0);
    assert("StageProgressHairlineZeroDuration", parseFloat(ext.progressHairlineEl?.style.width) === 0, "Progress hairline width must be 0% when duration is 0");

    // Test Fullscreen Idle Cursor
    ext.isFullscreen = true;
    ext.root.classList.add("is-fullscreen");
    ext.settingsPanelOpen = false;
    ext.resetCursorIdleTimer();
    assert("CursorIdleTimerArmedInFullscreen", !!ext._cursorIdleTimer, "resetCursorIdleTimer must arm timer in fullscreen");
    ext.root.classList.add("is-cursor-idle");
    window.dispatchEvent(new MouseEvent("mousemove", { clientX: 40, clientY: 40, bubbles: true }));
    assert("CursorIdleClearedOnMouseMove", !ext.root.classList.contains("is-cursor-idle"), "mousemove must clear .is-cursor-idle");
    ext.isFullscreen = false;
    ext.root.classList.remove("is-fullscreen");
    ext.clearCursorIdleState();

    // [TRACK1-BUGFIX-REGRESSION-TESTS-SPICETIFY]
    // Bug 17: Mid-song interlude countdown triggers on long gaps & fetchLyrics skips '♪' and avoids duplicating bg vocals
    ext.showVisualizer();
    ext.settings.syncOffsetMs = 0;
    ext.compiledLines = ext.compileLyrics([
      { startTime: 0, text: "opening vocal phrase" },
      { startTime: 16, text: "vocal after long instrumental" }
    ]);
    ext.buildCodeDOM();
    assert("Bug17LongGapCappedForInterlude", ext.compiledLines[0].endTime <= 6.0 && (ext.compiledLines[1].startTime - ext.compiledLines[0].endTime) >= 3.5, "compileLyrics must cap inferred endTime so mid-song interlude gap >= 3.5s, got endTime=" + ext.compiledLines[0].endTime);
    ext.syncWordCursor(9.0);
    assert("Bug17MidSongInterludeVisible", ext.interludeEl?.classList.contains("is-visible"), "Mid-song instrumental interlude countdown must become visible during gap");

    const origCosmosGet = Spicetify.CosmosAsync.get;
    Spicetify.CosmosAsync.get = async () => ({
      lyrics: {
        lines: [
          { startTimeMs: "1000", words: "Main lyric line" },
          { startTimeMs: "2000", words: "echo vocal", isBackground: true },
          { startTimeMs: "4000", words: "\u266A" },
          { startTimeMs: "12000", words: "Next main line" }
        ]
      }
    });
    const fetchedLines = await ext.fetchLyrics("track_bg_marker_test");
    assert("Bug17And21FetchSkipsMarkerAndDedupesBg", fetchedLines.length === 2 && fetchedLines[0].text === "Main lyric line" && fetchedLines[0].bgText === "echo vocal" && fetchedLines[0].endTime === 4.0, "fetchLyrics must attach isBackground to prev bgText without duplicating and use music note marker as end boundary, got=" + JSON.stringify(fetchedLines));

    // Bug 21: Error fallback must not be cached in lyricsCache & stale async onTrackChange must not overwrite newer track
    Spicetify.CosmosAsync.get = async () => { throw new Error("network down"); };
    await ext.fetchLyrics("track_err_nocache");
    assert("Bug21ErrorFallbackNotCached", !ext.lyricsCache.has("track_err_nocache"), "Failed fetchLyrics fallback must not be permanently cached in lyricsCache");
    let resolveSlowA;
    Spicetify.CosmosAsync.get = (url) => {
      if (url.includes("trackSlowA")) {
        return new Promise((resolve) => { resolveSlowA = resolve; });
      }
      return Promise.resolve({ lyrics: { lines: [{ startTimeMs: "1000", words: "Fast Track B" }] } });
    };
    Spicetify.Player.data.item = { uri: "spotify:track:trackSlowA", name: "Slow A", metadata: { title: "Slow A", artist_name: "A" } };
    const pSlowA = ext.onTrackChange();
    Spicetify.Player.data.item = { uri: "spotify:track:trackFastB", name: "Fast B", metadata: { title: "Fast B", artist_name: "B" } };
    await ext.onTrackChange();
    resolveSlowA({ lyrics: { lines: [{ startTimeMs: "1000", words: "Stale Track A" }] } });
    await pSlowA;
    assert("Bug21StaleTrackChangeIgnored", ext.currentTrackId === "trackFastB" && ext.compiledLines[0]?.text === "Fast Track B", "Slow track A lyrics resolving after switching to track B must not overwrite track B");
    Spicetify.CosmosAsync.get = origCosmosGet;

    // Bug 18: Clearing stale .active-word on line change & highlighting token 0 of new line
    ext.compiledLines = ext.compileLyrics([
      { startTime: 0, text: "alpha" },
      { startTime: 3, text: "beta" }
    ]);
    ext.buildCodeDOM();
    ext.syncWordCursor(0.5);
    assert("Bug18Line0Token0Active", !!ext.cachedLineNodes[0].row.querySelector(".spicetify-code-token.active-word"), "Line 0 token 0 must be active");
    ext.syncWordCursor(3.5);
    assert("Bug18LineChangeClearsOldAndHighlightsNewToken0", !ext.cachedLineNodes[0].row.querySelector(".spicetify-code-token.active-word") && !!ext.cachedLineNodes[1].row.querySelector(".spicetify-code-token.active-word"), "Switching from line 0 tok 0 to line 1 tok 0 must clear old .active-word and highlight new token 0");
    ext.syncWordCursor(50.0);
    assert("Bug18NoActiveLineClearsActiveWord", !ext.cachedLineNodes[1].row.querySelector(".spicetify-code-token.active-word"), "When activeLineIdx === -1, old .active-word must be cleared");

    // Bug 19: Pill toggle-enable actually toggles .is-disabled and pauses/resumes render loop
    const pEnableBtn = ext.pill.querySelector('button[data-act="toggle-enable"]');
    pEnableBtn.click();
    assert("Bug19PillDisableAppliesClassAndPausesRaf", ext.enabled === false && ext.root.classList.contains("is-disabled") && !ext.isRenderActive() && ext.rafId === null, "Clicking toggle-enable OFF must add .is-disabled and pause render loop");
    pEnableBtn.click();
    assert("Bug19PillReenableRestoresState", ext.enabled === true && !ext.root.classList.contains("is-disabled") && ext.isRenderActive() && !!ext.rafId, "Clicking toggle-enable ON must remove .is-disabled and resume render loop");

    // Bug 20: toggleFullscreen handles null fullscreenElement cleanly and fullscreenchange syncs state
    ext.isFullscreen = true;
    ext.toggleFullscreen();
    assert("Bug20ToggleFullscreenNoCrashWhenNotNativeFs", ext.isFullscreen === false, "Exiting fullscreen when document.fullscreenElement is null must not throw");

    // Bug 22: Reset settings syncs all sliders & button groups and recompiles lyrics
    ext.settings.rotX = 35;
    ext.settings.wordTrackingMode = "anticipate";
    ext.settings.idleMode = "screensaver";
    ext.settings.syntaxStyle = "pattern";
    ext.syncControlsUI();
    ext.settingsPanel.querySelector('button[data-act="reset-settings"]').click();
    const rotXSlider = ext.settingsPanel.querySelector('input[data-cfg="rotX"]');
    const stableModeActive = ext.settingsPanel.querySelector('[data-group="wordTrackingMode"] button[data-val="stable"]')?.classList.contains("is-active");
    const lockModeActive = ext.settingsPanel.querySelector('[data-group="idleMode"] button[data-val="lock"]')?.classList.contains("is-active");
    assert("Bug22ResetSettingsSyncsAllControls", rotXSlider?.value === "14" && stableModeActive && lockModeActive && ext.settings.syntaxStyle === "mixed", "Reset settings must sync rotX slider, wordTrackingMode, idleMode, and syntaxStyle");

    // Bug 23 & 24: CSS variables, keyframes, RTL fix, and hide-others scoping
    const stText = document.getElementById("spicetify-ide-lyrics-styles")?.textContent || "";
    assert("Bug23SpicetifyCssFixed", stText.includes("@keyframes keybindPulse") && stText.includes("color-mix(in srgb, var(--tok-keyword) 27%, transparent)") && !stText.includes("var(--tok-keyword)44") && !stText.includes("var(--ide-comment") && !stText.includes("var(--ide-accent") && !stText.includes("var(--ide-font-stack") && !stText.includes("flex-direction: row-reverse"), "Spicetify CSS must fix undefined vars, color-mix drop-shadow, @keyframes keybindPulse, and RTL double-reversal");
    assert("Bug24DockHiddenWithShowcase", stText.includes("#spicetify-ide-visualizer-root.has-cover-showcase #spicetify-ide-player-dock"), "Player dock must stay hidden when cover showcase is active without hide-others dependency");

    // Bug 25: toggleFocusMode OFF resets zoom/pan immediately, compact mode flattens transform, drawWaves guards w===0
    ext.audioState.bassPulse = 0;
    ext.settings.dynamicWordZoom = true;
    ext.currentCameraZoom = 1.3;
    ext.currentPanX = -60;
    ext.toggleFocusMode();
    assert("Bug25FocusOffResetsZoomAndPanImmediately", ext.currentCameraZoom === 1.0 && ext.currentPanX === 0 && /scale\(1(\.0+)?\)/.test(ext.codePlane.style.transform), "toggleFocusMode OFF must immediately reset zoom/pan and update transform, got=" + ext.codePlane.style.transform);
    ext.canvas.width = 0;
    let drawZeroThrew = false;
    try { ext.drawWaves(0); } catch (e) { drawZeroThrew = true; }
    assert("Bug25DrawWavesGuardsZeroWidth", !drawZeroThrew, "drawWaves must guard against canvas width === 0");
    ext.resizeCanvas();

    // Bug 26: Scrubber pointercancel/blur clears isScrubbing, key repeat does not unlock, destroy removes Spicetify.Player listeners
    const spDockScrub = ext.playerDock.querySelector('[data-dock="scrubber"]');
    ext.isScrubbing = true;
    spDockScrub.dispatchEvent(new Event("pointercancel", { bubbles: true }));
    assert("Bug26ScrubberPointerCancelClears", ext.isScrubbing === false, "pointercancel on Spicetify scrubber must clear isScrubbing");
    ext.activateLockOrScreensaver(true);
    window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyS", key: "s", ctrlKey: true, altKey: true, repeat: true, bubbles: true }));
    assert("Bug26KeyRepeatDoesNotUnlock", ext.isLockActive === true, "Key repeat must not unlock Spicetify lock screen");
    ext.deactivateLockOrScreensaver();

    let spRemovedCount = 0;
    Spicetify.Player.removeEventListener = () => { spRemovedCount++; };
    // === Edit Studio & Immersion Tests (Spicetify) ===
    const spVignette = document.getElementById("spicetify-ide-vignette");
    const spGuide = document.getElementById("spicetify-ide-frame-guide");
    const spCleanPillBtn = ext.pill.querySelector('button[data-act="toggle-clean-feed"]');
    assert("EditStudioDomExists", !!(spVignette && spGuide && spCleanPillBtn), "Vignette, frame guide, and Clean pill button must exist");
    assert("EditStudioCinematicDefaultOn", ext.settings.cinematicFx === true && ext.root.classList.contains("is-cinematic-fx"), "cinematicFx must default true and set .is-cinematic-fx on desktop ambient");

    // Ambient motes rendered with zero extra DOM nodes
    const spChildrenBefore = ext.root.childElementCount;
    ext.audioState.bassPulse = 0.7;
    ext.drawWaves(0.5, 0.016);
    assert("EditStudioMotesZeroExtraDom", Array.isArray(ext._ambientMotes) && ext._ambientMotes.length > 0 && ext.root.childElementCount === spChildrenBefore, "Ambient motes must initialize and draw on canvas with zero extra DOM nodes");

    // Clean Feed: E key, Esc exits Clean Feed BEFORE Fullscreen, hides chrome, non-persistent
    ext.isFullscreen = true;
    ext.root.classList.add("is-fullscreen");
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "e", code: "KeyE", bubbles: true }));
    assert("EditStudioCleanFeedHotkeyEOn", ext.settings.cleanFeed === true && ext.root.classList.contains("is-clean-feed"), "Pressing E must enable cleanFeed on Spicetify root");
    assert("EditStudioCleanFeedHidesChrome", window.getComputedStyle(ext.pill).display === "none" && window.getComputedStyle(ext.coverShowcase).display === "none" && window.getComputedStyle(ext.playerDock).display === "none" && window.getComputedStyle(ext.progressHairlineEl).display === "none" && window.getComputedStyle(ext.interludeEl).display === "none" && window.getComputedStyle(ext.syncHudEl).display === "none", "Clean Feed must hide pill, cover showcase, dock, hairline, interlude, and sync HUD");
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", code: "Escape", bubbles: true }));
    assert("EditStudioEscExitsCleanFeedBeforeFullscreen", ext.settings.cleanFeed === false && !ext.root.classList.contains("is-clean-feed") && ext.isFullscreen === true, "First Escape must exit Clean Feed while keeping Fullscreen active");
    ext.isFullscreen = false;
    ext.root.classList.remove("is-fullscreen");

    // Clean pill click + non-persistence on fresh constructor
    spCleanPillBtn.click();
    assert("EditStudioCleanPillClickOn", ext.settings.cleanFeed === true && ext.root.classList.contains("is-clean-feed"), "Clicking Clean pill button must enable cleanFeed");
    const savedSpSettings = JSON.parse(localStorage.getItem("spicetify_ide_lyrics_settings") || "{}");
    localStorage.setItem("spicetify_ide_lyrics_settings", JSON.stringify({ ...savedSpSettings, cleanFeed: true }));
    const freshSpEngine = new ext.constructor();
    assert("EditStudioCleanFeedNotPersisted", freshSpEngine.settings.cleanFeed === false && savedSpSettings.cleanFeed === undefined, "cleanFeed must be session-only and forced false on fresh launch");
    localStorage.setItem("spicetify_ide_lyrics_settings", JSON.stringify(savedSpSettings));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "e", code: "KeyE", bubbles: true }));
    assert("EditStudioCleanFeedHotkeyEOff", ext.settings.cleanFeed === false && window.getComputedStyle(ext.pill).display !== "none", "Pressing E again must disable cleanFeed and restore pill");

    // Backdrop / Chroma Key presets
    const clickSpBackdrop = (m) => ext.settingsPanel.querySelector(`[data-group="backdropMode"] button[data-val="${m}"]`)?.click();
    clickSpBackdrop("vignette");
    assert("EditStudioBackdropVignette", ext.root.getAttribute("data-backdrop") === "vignette" && !ext.root.classList.contains("is-solid-backdrop") && ext.root.classList.contains("is-cinematic-fx"), "Vignette backdrop must keep cinematic FX active");
    clickSpBackdrop("black");
    assert("EditStudioBackdropBlack", ext.root.getAttribute("data-backdrop") === "black" && ext.root.classList.contains("is-solid-backdrop") && window.getComputedStyle(ext.root).backgroundColor === "rgb(0, 0, 0)" && window.getComputedStyle(ext.canvas).display === "none" && window.getComputedStyle(spVignette).display === "none" && !ext.root.classList.contains("is-cinematic-fx"), "Black backdrop must set #000000, hide canvas & vignette, and disable cinematic FX");
    clickSpBackdrop("green");
    assert("EditStudioBackdropGreen", ext.root.getAttribute("data-backdrop") === "green" && window.getComputedStyle(ext.root).backgroundColor === "rgb(0, 255, 0)", "Green backdrop must set #00ff00");
    clickSpBackdrop("blue");
    const spStoredBlue = JSON.parse(localStorage.getItem("spicetify_ide_lyrics_settings") || "{}");
    assert("EditStudioBackdropBluePersisted", ext.root.getAttribute("data-backdrop") === "blue" && window.getComputedStyle(ext.root).backgroundColor === "rgb(0, 0, 255)" && spStoredBlue.backdropMode === "blue", "Blue backdrop must set #0000ff and persist");
    clickSpBackdrop("ambient");
    assert("EditStudioBackdropAmbientRestored", ext.root.getAttribute("data-backdrop") === "ambient" && !ext.root.classList.contains("is-solid-backdrop") && ext.root.classList.contains("is-cinematic-fx"), "Ambient backdrop must restore cinematic FX");

    // Frame Ratio (9:16, 16:9, 1:1, off) + showFrameGuide + Clean Feed + RTL + activeLineOnly
    const spDefaultPlaneW = ext.codePlane.getBoundingClientRect().width;
    const clickSpRatio = (r) => ext.settingsPanel.querySelector(`[data-group="frameRatio"] button[data-val="${r}"]`)?.click();
    clickSpRatio("9:16");
    const sp916PlaneW = ext.codePlane.getBoundingClientRect().width;
    assert("EditStudioFrame916ClampsAndShowsGuide", ext.root.classList.contains("has-frame-ratio") && ext.root.getAttribute("data-frame-ratio") === "9:16" && sp916PlaneW < spDefaultPlaneW && window.getComputedStyle(spGuide).display === "block" && spGuide.textContent.includes("9:16 SAFE FRAME"), "9:16 must clamp codePlane narrower (" + sp916PlaneW.toFixed(0) + " vs " + spDefaultPlaneW.toFixed(0) + ") and show safe frame guide");
    ext.settingsPanel.querySelector('[data-group="showFrameGuide"] button[data-val="false"]')?.click();
    assert("EditStudioShowFrameGuideOff", ext.settings.showFrameGuide === false && window.getComputedStyle(spGuide).display === "none" && ext.codePlane.getBoundingClientRect().width < spDefaultPlaneW, "showFrameGuide OFF must hide guide while keeping 9:16 clamping");
    ext.settingsPanel.querySelector('[data-group="showFrameGuide"] button[data-val="true"]')?.click();
    ext.setCleanFeed(true);
    assert("EditStudioCleanFeedHidesGuideKeepsClamp", window.getComputedStyle(spGuide).display === "none" && ext.codePlane.getBoundingClientRect().width < spDefaultPlaneW, "Clean Feed must hide guide while keeping 9:16 clamping");
    ext.setCleanFeed(false);
    ext.settingsPanel.querySelector('[data-group="textDirection"] button[data-val="rtl"]')?.click();
    ext.settingsPanel.querySelector('[data-group="activeLineOnly"] button[data-val="true"]')?.click();
    assert("EditStudioFrameRtlAndActiveLineCompat", ext.isRtlSong === true && ext.codePlane.classList.contains("is-rtl") && ext.root.classList.contains("is-active-line-only") && ext.root.classList.contains("has-frame-ratio"), "9:16 framing must remain compatible with RTL and activeLineOnly");
    ext.settingsPanel.querySelector('[data-group="activeLineOnly"] button[data-val="false"]')?.click();
    ext.settingsPanel.querySelector('[data-group="textDirection"] button[data-val="auto"]')?.click();
    clickSpRatio("16:9");
    assert("EditStudioFrame169", ext.root.getAttribute("data-frame-ratio") === "16:9", "16:9 ratio must apply");
    clickSpRatio("1:1");
    assert("EditStudioFrame11", ext.root.getAttribute("data-frame-ratio") === "1:1", "1:1 ratio must apply");
    clickSpRatio("off");
    assert("EditStudioFrameOff", !ext.root.classList.contains("has-frame-ratio") && window.getComputedStyle(spGuide).display === "none", "Off ratio must remove .has-frame-ratio and hide guide");

    // Cinematic FX toggle + compact auto-disable
    ext.settingsPanel.querySelector('[data-group="cinematicFx"] button[data-val="false"]')?.click();
    assert("EditStudioCinematicToggleOff", ext.settings.cinematicFx === false && !ext.root.classList.contains("is-cinematic-fx"), "cinematicFx OFF must remove .is-cinematic-fx");
    ext.settingsPanel.querySelector('[data-group="cinematicFx"] button[data-val="true"]')?.click();
    assert("EditStudioCinematicToggleOn", ext.settings.cinematicFx === true && ext.root.classList.contains("is-cinematic-fx"), "cinematicFx ON must restore .is-cinematic-fx");

    ext.destroy();
    assert("DestroyCleansUpLifecycle", ext._destroyed === true && ext.rafId === null && ext._idleCheckTimer === null && !document.getElementById("spicetify-ide-visualizer-root") && !window.__SPICETIFY_IDE_LYRICS_ACTIVE__, "destroy() must clear rafId, timers, DOM, and global reference");
    assert("Bug26DestroyRemovesSpicetifyPlayerListeners", spRemovedCount === 3, "destroy() must remove all 3 Spicetify.Player listeners, got=" + spRemovedCount);

    const failed = results.filter(r => !r.pass);
    if (failed.length === 0) {
      resEl.textContent = "ALL_PASS: " + results.length + " tests passed!";
    } else {
      resEl.textContent = "FAIL: " + failed.map(f => f.name + ": " + f.msg).join("; ");
    }
  } catch (e) {
    resEl.textContent = "EXCEPTION: " + e.message + " " + e.stack;
  }
})();
</script>
</body>
</html>
'@

Set-Content -Path $TempHtml -Value ($Head + "`n" + $JsContent + "`n" + $Tail) -Encoding UTF8
$OutFile = Join-Path ([System.IO.Path]::GetTempPath()) "spicetify_out.txt"

$exitCode = 0
try {
    $proc = Start-Process -FilePath $EdgePath -ArgumentList @("--headless", "--disable-gpu", "--window-size=1280,800", "--dump-dom", $TempHtml) -RedirectStandardOutput $OutFile -PassThru -Wait
    $dom = Get-Content -Raw $OutFile
    if ($dom -match '<div id="res">(.*?)</div>') {
        $resText = $matches[1]
        if ($resText -match '^ALL_PASS:') {
            Write-Host ("Edge Test Result: " + $resText) -ForegroundColor Green
        } else {
            Write-Host ("Edge Test Result: " + $resText) -ForegroundColor Red
            $exitCode = 1
        }
    } else {
        Write-Host "No result tag found" -ForegroundColor Red
        $exitCode = 1
    }
} finally {
    Remove-Item -Path $TempHtml -Force -ErrorAction SilentlyContinue
    Remove-Item -Path $OutFile -Force -ErrorAction SilentlyContinue
}
exit $exitCode
