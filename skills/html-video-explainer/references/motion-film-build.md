# Single-file, deterministic motion-film workflow

Use this mode only when the request calls for a full-frame authored film or the strict motion-design pipeline. Keep the existing split editor for normal talking-head reels.

```sh
python3 <skill>/scripts/create_motion_film.py --output ./film.html --title "My concept" --duration 15 --bpm 120 --accent '#D76A4E'
```

The helper embeds the font and its license in one 1920×1080 HTML file. It supplies analytical spring/exponential helpers, `window.seek(t)`, `window.filmConfig`, and an OfflineAudioContext score/WAV encoder. It is deliberately marked `isDemo:true`. Replace its `drawFilm` function, scene layout/copy/camera and score with the actual storyboard, then set `isDemo:false`. This shell is not the promised original showreel.

## Frame contract

- `window.seek(t)` reconstructs every visual from t and immutable design/content. It may draw Canvas, SVG or DOM layers. No prior-frame integration, CSS animations/transitions, visual timers, or random state. Initialize fonts/assets once before rendering and expose `window.motionFilmReady` if needed.
- `window.filmConfig` includes `duration`, `bpm`, and `isDemo`; optional `loop:true` asks the renderer to check first/last output frames. Durations must align to a 60fps frame boundary.
- `window.renderSoundtrack()` returns a Promise of base64 PCM WAV generated with OfflineAudioContext. The supplied implementation places a kick on every beat and hits at `sceneChanges` (or five default boundaries). Optional `riser:true` adds a riser into the final section. Adapt notes, timbres and action cues to the film; this is not a requirement to reuse one generic track.
- An authorized, licensed external track can be passed as `--audio path/to/track.wav`. Measure its beat map; a guessed BPM is not synchronization.

Measure reconstructed UI/text bounds after the actual font/layout is ready. Keep scene transforms related to those anchors. Do not put will-change on camera-scaled layers. A frame-filling circle needs radius greater than the distance to the furthest corner from its centre, not just half the width.

## Beat review before full export

With Node/Playwright/Chromium and FFmpeg available:

```sh
node <skill>/scripts/render_motion_film.cjs ./film.html --preview
```

The tool checks random-access determinism, exposes active CSS animation/camera will-change issues, and writes one frame per beat, an end frame, contact sheets of up to 16 beats, and a hash-linked manifest. Open the sheets and important frames. Check continuity, cursor contact, font size, text handoffs, exact beat actions, overlap, camera crops, and reading time. Fix problems and regenerate preview. A script saving PNGs is not proof that they were inspected.

When the user explicitly asks to see four stills or approve inputs before rendering, show those selected stills and follow that sequence. Otherwise perform this review yourself and continue; no extra user approval gate is implied.

## 60fps, three temporal samples, audio mux

```sh
node <skill>/scripts/render_motion_film.cjs ./film.html --reviewed
```

`--reviewed` asserts that the agent actually inspected the current preview; the source hash must still match. The renderer samples each output frame three times around its exact time, pipes PNGs at 180 samples/sec, and uses ffmpeg `tmix` plus selection of every third sample to average **disjoint triplets**. It probes the installed ffmpeg’s averaging behavior and applies a warm-up only when required, preserving the first triplet and full output-frame count across filter versions. It then muxes the offline WAV into H.264/AAC MP4 at 60fps. Temporal sampling makes blur follow actual direction/speed. Keep type sharp during reading windows; blur is not a substitute for correct motion.

`--subframes 1` is a deliberate lower-cost render; do not call it a three-subframe master. `--allow-demo` is only for pipeline tests, not finished delivery. `CHROME_PATH`, `PLAYWRIGHT_MODULE`, and `FFMPEG_PATH` are environment overrides, not paths to hard-code in shipped files. Default outputs sit beside the HTML: MP4, WAV, and `<film>-review/`.

After export, decode the actual file, verify resolution/frame count/duration/audio, and inspect key rendered moments. For a loop, plan a smooth return and match cursor, camera, typography and shape at the final output frame; a matching background alone does not prove a seamless loop. Deliver HTML and MP4, plus WAV and storyboard when useful.
