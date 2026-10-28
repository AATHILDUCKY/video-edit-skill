# Edit plan and timebases

Create a plan with `draft ANALYSIS --out work/edit-plan.json`. Edit its content before building. A minimal authored example for a six-second recording:

```json
{
  "version": 1,
  "reviewed": true,
  "visuals_authored": true,
  "title": "One task, less repetition",
  "source_sha 256": "COPY_FROM_source.json",
  "fps": 30,
  "top_percent": 50,
  "accent": "#3867F 4",
  "creator": "",
  "music_volume": 0.03,
  "clips": [{"start":0,"end":6,"reason":"One complete explanation, no redundant take."}],
  "scenes": [
    {"id":"repeat","start":0,"end":2,"title":"Repeating this?","preset":"process","labels":["Copy","Check","Repeat"],"motion":"Cursor revisits the same task; keep the speaker visible."},
    {"id":"automate","start":2,"end":6,"title":"Build it once","preset":"process","labels":["Input","Run","Result"],"motion":"The repeated task becomes one pipeline; reveal each node on the spoken word."}
  ],
  "concept_js":"concept.js",
  "sound":[{"at":2.1,"type":"click","gain":0.15}]
}
```

This demonstrates structure; replace all times/copy/geometry with the real recording. `concept_js` is optional but recommended for distinctive content-specific motion. Do not mark authoring complete just because placeholders render.

| Field | Meaning |
|---|---|
| `clips[].start/end` | Canonical SOURCE seconds; end-exclusive. Array order is output order. |
| `scenes[].start/end` | OUTPUT seconds. Contiguous, nonoverlapping, cover the entire edit. |
| `scenes[].id` | Unique lowercase hyphenated renderer key. |
| `title`, optional `subtitle` | On-screen copy, not automatically a speech transcript. |
| `preset`, `labels` | Starter primitives: `keyword`, `process`, `compare`; customize through concept.js. |
| `image` | Optional local PNG/JPEG/WebP, relative to plan, under 2.5 MB; embedded for offline use. Record attribution in project SOURCES.md. |
| `typing.start/end` | Optional seconds LOCAL to this scene. Use only where characters actually type. |
| `sound[].at` | OUTPUT second of audible transient. |
| `sound[].type` | Generated `click`, `tick`, `pop`, `ping`, `chime`, `whoosh`, or `impact`. |
| `sound[].file` | Local audio path relative to plan, instead of type. Requires `credit`. |
| `sound[].credit` | Object with `title`, `author`, `source_url`, `license`, preferably license URL and modifications. |
| `caption_style` | Optional size, normalized position, max width, theme/colors. See visual-authoring. |

Every clip boundary must lie on `source_fps` grid: `round(t*fps)/fps`. Choose a speech gap first, then snap; if the snap bisects a word, choose another boundary. Do not change playback rate to satisfy a duration. Final duration is the sum of selected clip lengths, within frame rounding. Clip selection needs ≥0.05 s; packaged editor supports up to 600 s /250 caption blocks, intended for shorts.

Output mapping for a kept interval `[a,b)` starting at `o`: `output_time = source_time - a + o`. Recompute after each cut/reorder. `source-to-edit.json` stores intervals; `keywords-edited.json` stores both clocks. Keep planned visuals on the words after mapping. The validator catches mid-word cuts, absent alignment at a cut, scene gaps/overlaps, invalid sound positions and source identity mismatches.

The helper performs hard picture cuts with 5 ms edge fades in audio to avoid clicks. This does not create an overlapping transition or change the speech timeline. J/L cuts and overlapping video transitions need a richer explicitly mapped plan and compositor; do not silently add them to this schema. Visual overlay transitions can mask/unfold/morph without altering the footage duration.

For personal-brand profiles, per-scene `layout`, `broll`, `broll_in` and `credit`, plus `plan.brand` and the automatic outro, see [brand-and-studio.md](brand-and-studio.md). Plan scenes cover the edited MAIN story only. The builder adds outro duration afterward; never count it in source cuts or duplicate it in authored scenes.

Bundled signature SFX can be referenced as `{"at":4.2,"asset":"silk-swipe"}` with optional `gain`. For these events `at` is the designed visual sync point; the catalogue supplies the pre-roll/anchor. Existing external `file` events retain onset timing and require their own credits. Do not combine `asset` with `type` or `file`. See [signature-sound.md](signature-sound.md).

Inserted videos retain audio by default. Optional scene fields `broll_audio` (boolean) and `broll_volume` (0..1) control explicit per-insert sound choices. Source speech remains under the insert; use [uploaded-audio.md](uploaded-audio.md) to balance both tracks.
