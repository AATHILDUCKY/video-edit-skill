# Media, sound, and export

## Asset selection

Use primary/licensed sources when retrieving photos, recordings, logos, and fonts. Keep downloaded assets local and record the source URL, creator when known, reuse terms, and any adaptation in `SOURCES.md`. Do not confuse a search result thumbnail with a licensed original. Use an official brand asset when logo fidelity matters. Do not carry the demo's editing photos or Codex mark into an unrelated subject.

The bundled Manrope font license and recorded keyboard credit must travel with projects that use those assets. Generated visuals should be identified as generated in source notes; do not present them as documentary photographs. If networking or image generation is unavailable, use purposeful code/SVG illustrations and disclose any missing requested asset instead of pretending to have fetched it.

## Rebuild workflow

After the storyboard and assets are complete:

```sh
python3 scripts/make-soundtrack.py
python3 scripts/bundle-media.py
python3 scripts/export-script.py
```

The first command needs NumPy and FFmpeg; set `FFMPEG_PATH` if FFmpeg is not on the path. The bundle step uses FFmpeg and Python's standard library. Narration/SRT export uses only Python's standard library.

The general sound generator reads scene timing and optional `audio` events. Event `at` is in actual seconds relative to the scene, not frame count. Types: `impact`, `whoosh`, `click`, `tick`, `pop`, `ping`, `chime`. `gain` is optional. An explicit `audio: []` gives a quiet shot; absent events receive a short default transition. Do not add a sound for every decorative movement.

Add `typing: {"start": 0.4, "end": 2.5}` to a typing shot. Use `h.typingProgress(scene,t)` to reveal characters over that interval. A separate recorded-keyboard stem is gated to these intervals and keeps its natural pitch. The supplied recording is short: for a long typing passage, use a suitable longer recording or a deliberate loop with unobtrusive joins. Remove typing intervals from shots without visible typing. `keyboardSound` is the user's on/off preference.

Effects and rhythm remain quieter than the camera voice. Preview mute affects monitoring; exported sound follows the selected mix. A browser export must clone mixer output tracks before stopping them, so exporting again still includes audio.

`bundle-media.py` reads the project's image manifest, fonts, and audio stems. It creates `media.js`, `fonts.css`, and `media-build.json`. Rebuild after changing images or audio. The static checker detects stale source hashes and sound timing.

## Browser verification

Use available browser automation without assuming a particular machine path or browser version. The generated project can be opened directly from disk. With Playwright installed:

```sh
npm install
npx playwright install chromium
npm run preview:frames
npm run render
```

`CHROME_PATH`, `PLAYWRIGHT_MODULE`, and `FFMPEG_PATH` are optional explicit overrides. Do not copy another user's absolute executable or `node_modules` path into a deliverable.

Inspect representative frames and phone-size readability. Verify new custom scene kinds are present in `codexShort.availableSceneKinds`. Check that the scene function works at the start, middle, end, and transition; screenshots alone do not prove playback timing or audio.

For a render, the bundled exporter evaluates exact frame times and encodes H.264/AAC using FFmpeg, avoiding timing drift from real-time recording. A 25-second 60 fps master contains 1500 frames. The page's Export button supports the user's selected clip, crop, captions, layout, and sound mix, preferring MP4 with WebM fallback. Keep real-time export visible.

Do not claim that a file rendered, decoded, or included audio unless it was checked. If a required encoder/browser is unavailable, deliver the working HTML, assets, script, and exact rerender command, and identify the missing MP4. Never substitute a screenshot for the requested video.

## Final handoff

Deliver a project folder or archive containing the HTML, runtime assets, editable storyboard, recording script, SRT, source credits, and MP4 when requested/rendered. A single HTML file can be produced by inlining runtime CSS/JS/media if the user explicitly requests that packaging; the normal bundle uses a small entry HTML plus local assets for maintainability.

## Updated timing and editor behavior

The starter now has separate source and runtime durations. Rebuild audio against source scene durations; `targetDuration`, uploaded-camera matching, and `sceneWeights` retime playback. The camera and its voice stay 1×. Scene-specific sound segments follow individual visual trims; uploaded artwork should not trigger unrelated keyboard clicks. Inspect the real mix when swapping an illustration to a typing scene.

The automated renderer accepts `--duration SECONDS` and `--template saved-template.json`. Saved visual images decode before capture; nonuniform scene durations use per-scene trim/tempo/concat filters. Browser Export uses the current editor state and uploaded footage. The command-line renderer uses file defaults or the explicitly loaded template, and does not include a previously selected private camera file automatically.

Exact timestamp plans set source/target durations equal and turn upload matching off. Inspect every specified beat at its requested output second. A `beats` description or an audio cue in JSON is not a rendered animation. See `timestamped-direction.md` for the plan format.
