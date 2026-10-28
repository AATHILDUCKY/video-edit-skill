# Brand, compositions and reusable controls

`assets/brand/profile.json` contains the identity. `draft --brand /path/to/brand.json` reads either that raw shape or an HTML-exported `{ "format": "video-edit-brand", "settings": { … } }`. The draft snapshots the profile in `plan.brand`; the builder writes a raw `brand.json` beside the project. Editing that snapshot affects that project; changing the installed profile changes future defaults.

Supported fields: `version:1`, `creator`, `accent:#RRGGBB`, `top_percent:30..70`, `default_layout:camera|split|motion`, `caption_style`, `frame` (normalized x/y, zoom 1..3, mode fill/fit, mirrored), `camera_volume:0..1`, `insert_volume:0..1`, `sfx_volume:0..1`, `sfx_duck_db:0..18` (build-time effects attenuation under speech), `safe_area:{preset:"instagram-reels"|"free",top,bottom,left,right}` (normalized reserves), `music_volume:0..1`, `keyboard_sound`, `motion_intensity:.2..1.4`, `outro:{enabled:true,file:"insta-follow-2.mp4"}`. `language` and `asr_model` describe the preference; the ASR CLI flags are authoritative (Tamil/small defaults). A profile does not contain source-specific transcript text, cuts or scene durations.

The HTML **Brand kit** changes creator, accent and motion energy. Caption/crop/audio panels provide detailed appearance. **Save brand** collects those style settings for new recordings. **Save template** saves this recording's scenes, captions and style. Render the saved full-edit file with `npm run render -- --template saved-template.json`; localStorage alone is not read by the offline renderer. Camera media loads automatically from `media/camera-edited.mp4`; keep the folder intact.

## Plan scenes

Existing `start`, `end`, `id`, `title`, `subtitle`, `labels`, `preset`, `image` and `typing` still work. Additional fields:

```json
{
  "id": "proof",
  "start": 4.0,
  "end": 6.0,
  "title": "A real example",
  "layout": "broll",
  "preset": "browser",
  "labels": ["Input", "Action", "Result"],
  "broll": "assets/my-screen-recording.mp4",
  "broll_in": 1.5,
  "credit": {"title":"Creator screen recording","source_url":"user-provided","license":"user-provided"}
}
```

`layout` is `camera` (speaker fills frame), `split` (motion or B-roll above camera), `motion` (motion centred on full frame), or `broll` (B-roll fills frame). Only the builder creates the reserved `brand-outro` scene. `broll_in` is in asset source seconds; visuals play at 1× with their own audio when present, preserving the main speech underneath. `broll_audio` defaults to true and `broll_volume` to 1; explicit user-requested muting uses `broll_audio:false`. Asset duration must cover the scene. Copying B-roll is local; project paths use a content hash. Record title, author if available, license and original source URL, with the actual file permission verified before build. User-owned material uses `user-provided`.

In HTML, **Visuals** edits composition, selects among packaged B-roll clips, sets an in-point, edits motion labels, and chooses a motion preset. Its image uploader embeds resized images in the saved template. Adding a new B-roll file is a plan/build operation; the UI selects existing packaged clips. Preview source alignment and export rejects B-roll overrun. Keep inserted clips short enough to serve the thought; avoid forced visual changes during vulnerable personal moments.

Built-in motion presets: `keyword`, `quote`, `timeline`, `process`, `compare`, `stack`, `browser`, `terminal`. The last two are labelled concepts, not representations of an actual product. All are reusable time-driven functions. Use the custom concept.js API for a genuinely new visual mechanism, not new colors or copy.

## Outro and sound

The builder resolves a profile's relative outro path beside the plan, in the working directory, then in the packaged brand folder. It normalizes the outro separately, preserves/adds its audio, and appends the complete outro shot (uniformly inset in the Reels composition profile). Main camera duration remains `content_duration`; total project duration includes the outro. Speech captions end with the story. The renderer pads speech to total duration and inserts outro audio at its fixed output offset; effect/music/keyboard buses mute during it. The browser does the same. Do not drag the outro into speech or change its duration; rebuild to change the outro asset.

The brand outro and any deliberately owned footage are credited as user-provided. Noto Sans Tamil and Manrope retain OFL licenses; Lucide retains its ISC license. The default tactile sounds are Kenney CC0 derivatives with retained originals/license; the legacy collection comes from the local synthesizer. Commons/Freesound downloads require their individual licenses, never a generic site-level license assumption.

## Usage

Every build creates an unavailable usage report; later call `usage` with measured counts and source to populate it. The editor shows those values from local `assets/codex/usage.js`, including on `file://`. Counts refer to the editing agent, not ASR model tokens. A host can supply counts at task completion; do not scan unrelated sessions or disclose other work's usage. Report unavailable if this host does not expose edit-scoped telemetry.

Run `npm run studio` in the built project and open its loopback URL for the editable HTML workspace. The renderer starts its own temporary loopback server. Direct-file preview is possible, but browser security can taint canvases that draw relative video files; use the local studio for browser export. This server binds only to 127.0.0.1 and supports media byte ranges for seeking.

Uploaded audio is preserved by default in the editor and both export paths. See [uploaded-audio.md](uploaded-audio.md) for per-insert sound controls and efficient audio-only updates.

Instagram composition controls, research and delivery checks: [instagram-reels.md](instagram-reels.md).

Captions default to automatic bottom anchoring (`caption_style.y:null`). The complete box remains in the lower section across camera/split/motion/B-roll layouts. Dragging, presets and imported overrides are constrained there. Reels mode reserves a 240px lower caption band and adapts the maximum split (52% with default reserves); full-frame mode keeps bottom captions without the platform footer reserve.

`caption_chunking:{max_words:4,max_duration:1.6}` controls new builds (1–8 words; 0.6–3.5 seconds). Partial brand overrides retain the other default. This affects the chunk boundaries, not source speech, word timing or the bottom-section rule. Save brand retains this policy through the existing brand snapshot. Rebuild to apply changed chunking to a recording; existing saved captions remain authored data. Active visual/shot/headline pacing is planned from the current content as described in editorial-direction.md.
