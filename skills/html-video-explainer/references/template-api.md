# Editor and scene API

## Project files

| File | Purpose |
| --- | --- |
| Entry HTML | Player, camera controls, settings, Visuals/Captions sidebar, timeline; preserve editor controls |
| `video.project.json` | Entry HTML, MP4 output, image manifest, demo status, optional timeline path |
| `assets/codex/template.js` | JSON-compatible storyboard/config assigned to `window.CODEX_SHORT_TEMPLATE` |
| `assets/codex/concept.js` | Concept-specific `window.CONCEPT_VIDEO_SCENES` drawing functions |
| `short.js` | Compositor, source/runtime timing, uploaded camera, sound mixer, save/load, export |
| `visual-editor.js/css` | Scene artwork controls and visual timeline dragging/trimming |
| `caption-editor.js`, `caption-style.js/css`, `editor.css` | Caption text/timing, size/position/appearance, preview drag/resize, split/undo |
| `palettes.js` | Six selectable light-mode accent palettes and common neutral tokens |
| `media.js`, `fonts.css` | Generated embedded runtime media; rebuild after asset/audio changes |

`assets/codex` and `window.codexShort` are compatibility names, not required branding in the video.

## Timing model

Source scene `duration`, scene-relative `audio`, and `typing` define the authored timebase. Their sum is `sourceDuration`. `targetDuration` is the opening preview length. Runtime `start/end/duration` are computed proportionally; optional `sceneWeights` preserve per-scene edits. Each runtime scene retains a `motionDuration` for its natural animation timebase.

- `autoFitVideo:true`: upload matches detected camera duration, preserves edited shot proportions, and centres/framing-fits the replacement. Camera and voice always remain 1×.
- `timingMode:"absolute"`, `autoFitVideo:false`: honor explicit scene seconds. The timeline helper makes source duration equal to the requested output duration. Do not re-enable upload matching unless those exact times may scale.
- `captionCues:null`: scene narration generates caption cues; scene trims move them together.
- An explicit caption array is independent; local visual trims leave it alone. Global duration changes scale its ranges while retaining text.

Example scene:

```js
{
  "kind":"grow",
  "duration":4,
  "title":"Small steps add up.",
  "emphasis":"",
  "voice":"Each contribution adds to the total.",
  "cue":"Three soft count ticks",
  "audio":[{"at":0.5,"type":"tick"},{"at":1.5,"type":"tick"}],
  "visual":{"preset":"grow","accent":"#3D5AFE","scale":1,"x":0,"y":0}
}
```

Use unique scene identities. A visual preset can be reused, while captions/timing remain tied to the identity. `scripts/apply_timeline.py` accepts `kind` or `id` plus a separate `preset`; see [timestamped direction](timestamped-direction.md).

## Draw a custom scene

```js
window.CONCEPT_VIDEO_SCENES = {
  grow(scene, t, h) {
    h.bg();
    if (h.visualPass !== 'art') h.reveal(scene.title, 540, 172, 90, t);
    const p = h.enter(t, .4, 1.2);
    h.box(180, 780 - 360*p, 720, 360*p, h.accent, 18);
  }
};
```

Each renderer draws in **1080 × 960**; the compositor uniformly centres it inside the selected top height. Keep headings above y=310 and artwork below y=310 for the advanced visual size/position controls. Respect `h.visualPass==='art'`: skip drawing headings in the artwork-only pass. A scene image upload replaces the artwork while retaining editable title/subline. The original video1 composition remains available as its own style reference.

Everything must be derivable from `t`: no accumulating transforms, frame-count physics, or `Math.random()` while drawing. For a runtime scene, `h.localSeconds(scene,t)` gives actual local seconds and `h.typingProgress(scene,t)` follows its scaled typing window. With a distinct `motionDuration`, map requested event seconds deliberately.

Helpers:

- `h.ctx`, `h.W=1080`, `h.BASE_TOP=960`, `h.C` neutral colors, `h.accent` (respects per-scene accent), `h.visualPass`.
- `h.bg(color)`, `h.box(x,y,w,height,color,radius)`.
- `h.txt(text,x,baseline,size,color,weight,align,maxWidth,mono)`, `h.reveal(text,x,baseline,size,t,color,delay,maxWidth)`.
- `h.image(key,x,y,w,height,zoom,radius)`, `h.rotatedImage(key,cx,cy,w,height,rotation,zoom)` from the manifest/media bundle.
- `h.icon(name,x,y,size,color,width)`: play, code, terminal, camera, film, scissors, sound, download, sliders, check, arrow, down, image, file, cursor. Draw purpose-built geometry when these do not fit.
- `h.thinArrow`, `h.bar`, `h.clamp`, `h.mix`, `h.enter`, `h.out`, `h.io`.

## Editable visuals

`scene.visual` supports `preset`, per-scene hex `accent`, `scale` 0.6–1.6, `x` ±180, `y` ±140, and an embedded PNG/JPEG/WebP `image`. Upload is compressed locally; image data travels inside saved template JSON. Keep the original asset/credit when sourced externally. Local browser storage is finite; a large template should be saved to a file.

The Visuals sidebar offers text, illustration, accent, image, size/position, and exact start/end controls. Moving/trimming a visual changes adjacent scenes to keep the whole duration covered. First start stays at 0; last end stays at video duration. Edited proportions persist when a different clip is uploaded. Keep keyboard controls and captions usable.

## Public API

`window.codexShort` exposes:

- `duration`, `sourceDuration`, `sourceScenes`, `cuts`, `visualPresets`, `availableSceneKinds`, `ready`, `state`, `template`, `script`, `narration`.
- `seek(t)`, `play()`, `pause()`, `render(t)`, `capture(t)`, `setResolution(w,h)`.
- `setDuration(seconds)` for manual preview duration; automatic clip matching prevents an unrelated manual override.
- `fitToUploadedVideo()`, `setLayout(percent)` (30–70%), `state.frame/frameBounds` for framing.
- `setSceneText(index,{title,emphasis})`, `setSceneVisual(index,patch)` (async), `setSceneTiming(index,start,end)`, `resetVisualTiming()`.
- `captions`, `setCaptions(cues)`, `resetCaptions()`, `setCaptionVisibility(boolean)`.
- `loadTemplateFile(file)` (async) restores saved settings and waits for images to decode.

Caption cues are `{id,start,end,text}`, ordered, positive, non-overlapping, inside the output duration. Very short captions may technically render but need a readable hold; do not pack prose into a tiny range.

Save/Load template includes visual images, scene text, scene weights, caption edits, palette, frame, and audio preferences. Footage stays on the device and must be reselected. Browser Export includes the selected footage. Automated render can load a saved template with `npm run render -- --template path/to/settings.json`; it does not silently access a camera file saved on another device.

## Other layouts

A full-frame/landscape request needs coordinated compositor, dimensions, responsive preview, camera behavior, and export changes. The provided full-frame outro is an optional example; it is not a universal landscape mode. Verify exact output dimensions, image proportions, and control exclusion.


## Caption appearance and moving captions

`captionStyle` supplies global defaults. `captionStyles` maps cue IDs to partial overrides without converting automatic script captions into an independent caption array. Imported/manual cues can also have a partial `style`. An explicit All captions edit updates those fields for every cue; a This caption edit only overrides the selected cue.

```json
{
  "captionStyle": {
    "fontSize": 72, "x": 0.5, "y": 0.86, "maxWidth": 0.82,
    "theme": "highlight", "textColor": "#ffffff",
    "backgroundColor": "#0c130f", "backgroundOpacity": 0.92
  },
  "captionStyles": {
    "scene-hook": {"fontSize": 92, "x": 0.5, "y": 0.35}
  }
}
```

`fontSize` is 24–120 master pixels in the 1080-wide design. `x/y` are the caption box centre in normalized full-frame coordinates, 0–1. `y:null` follows the camera section automatically as the split changes. `maxWidth` is 0.30–0.95 of the frame. Themes: `highlight` (active word), `box` (clean static background), `plain` (outlined text). Colors are six-digit hex; opacity is 0–1. Long words are fit to the allowed width; geometry is clamped inside the frame.

Use **Captions → Size & position**. Enable **Move / resize in preview**, drag the caption, or drag its corner. Arrow keys nudge, Shift uses larger steps, +/- changes size, Home restores automatic placement, Escape exits move mode. Presets and sliders provide keyboard/touch alternatives. Appearance participates in the existing Undo/Redo history. Splitting a caption retains partial per-cue styling. Moving/resizing never changes text or timing.

API: `captionStyle`, `captionStyles`, `captionVisibility`, `captionBounds` (logical 1080×1920 box of the active chunk), `getCaptionStyle(id?)`, `setCaptionStyle(patch,id?)`, `resetCaptionStyle(id?)`, and `restoreCaptionAppearance({style,overrides})`. Omitting ID targets all captions. Style operations are blocked during export. Save/Load and offline `--template` rendering use the same styling; SRT intentionally contains only words/times. Preview controls/handles are DOM overlays and never painted into the video.

For a requested style at a specific second, apply a cue-specific style to the cue covering that interval, or split the cue intentionally when the user requests a change. Fixed per-cue placement is not an animated movement; implement time-based interpolation if moving text is explicitly requested.
