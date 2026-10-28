# The Fieldnotes sound palette

The default **Tactile** collection contains eight curated derivatives of [Kenney Interface Sounds](https://kenney.nl/assets/interface-sounds), whose publisher identifies the pack as CC0. The Ogg originals and exact license ship in `assets/sfx/kenney-originals/`. Working WAVs have gentle edge fades, a 110Hz high-pass and 6.5kHz low-pass to soften brittle clicks. Their 48kHz/24-bit format does not restore detail lost in the Ogg source. Fingerprints and processing are recorded per asset. The original 18 procedural CC0 cues remain available for existing edits and optional stronger accents. Do not describe either collection as paid stock or recorded foley without evidence.

Start with `tactile-click`, `tactile-tap` or `tactile-press` for a visible action; `tactile-switch`/`tactile-shift` for a state change; `tactile-scroll`/`tactile-glide` for a panel/B-roll move; and `tactile-tick` for a precise selection. Avoid game-like confirmations, chimes and constant whooshes by default. A short dense technical reel can work with only 2–4 cues. This is an editorial starting point, not a quota.

[Adobe’s mixing guidance](https://helpx.adobe.com/ca/audition/desktop/editing-audio-files/essential-sound-panel.html) describes lowering background material during dialogue. Our implementation follows that general mixing principle: `sfx_duck_db:6` lowers only the effects stem by up to 6dB, with a 15ms attack and 180ms release, driven by the kept voice. It never attenuates or replaces source/insert audio. The builder bakes this envelope into the shared stem so preview and offline export agree. Change 0–18dB in the brand and rebuild the stem after timing/source changes. Default music gain is zero; add a bed only when it helps the story.

Run `video_edit.py sounds` for a concise selection list, or `sounds --id silk-swipe` for one cue's details. Open `assets/sfx/index.html` to search categories, audition individual sounds, hear the new tactile collection, download working WAVs, and copy a plan cue. Its waveforms are generated from the actual sample envelopes. `catalog.json` stores each file's fingerprint, duration, recommended gain, intended use and designed sync anchor. `catalog.js` lets the page run directly from disk without a server.

## Optional legacy synthesized accents

| Action | Good starting cues | Direction |
| --- | --- | --- |
| Soft masked UI/B-roll handoff | `silk-swipe`, `soft-pass`, `air-whoosh` | Choose one, with its crest at the handoff; avoid incessant whooshes |
| Anticipation before a real reveal | `reverse-bloom`, `shimmer-rise` | Leave space for the approach and tail; skip during dense dialogue |
| A significant title or story turn | `rounded-impact`, `warm-thump` | Use sparingly; avoid cinema booms under a personal confession |
| A button, selection, pointer or switch | `ui-click`, `cursor-tap`, `ui-toggle` | Only when the visible action actually happens |
| A small card or precise highlight | `soft-pop`, `glass-tick` | Keep the high transient below consonants |
| Confirmed completion or subtle caution | `ui-confirm`, `soft-notice` | Do not imply a successful result that the footage does not show |
| Kinetic phrase or one underline | `text-brush`, `marker-touch` | One meaningful emphasis; captions do not need continuous sound |
| A chapter or reflective journal moment | `page-turn` | Use when the paper-like material supports the story |
| A completed insight before the CTA | `brand-resolve` | Optional; the existing outro already has its own sound |

## Use the masters in a plan

```json
"sound": [
  {"at": 3.4, "asset": "tactile-glide", "gain": 0.5},
  {"at": 6.2, "asset": "tactile-press"},
  {"at": 10.5, "asset": "tactile-tap", "gain": 0.4}
]
```

These are examples, not a schedule to reuse blindly. Event `at` uses final output seconds and denotes the sample's designed sync point. The resolver subtracts `anchor_seconds` to position its pre-roll. Omitting `gain` uses the catalogue recommendation. Existing external `file` sounds retain their onset-based `at`; generated legacy `type` events remain supported. Use exactly one of `asset`, `file` or `type` for a selected sound.

The builder verifies the master's fingerprint, copies only the selected files to the project, records credits in `sound-assets.json`/`SOURCES.md`, and mixes them into the common effects stem used by HTML preview and MP4 export. Event gains are retained rather than independently normalizing every final mix to the same volume. Pre-roll crossing t=0 is cropped and faded. Tails approaching the outro are faded before the main-story boundary; the outro's own audio remains intact.

Start with the existing main SFX fader around 0.32 and the sample's suggested event gain, then audition against the actual voice. Effects should support the picture without interrupting the speech. These are gain starting points, not a loudness guarantee. For a fast technical passage reduce clicks and high-frequency ticks; for a vulnerable story use silence. Keep rhythmic beds very quiet, and remove them when the speaker's room tone or music already supports the moment.

A cue's transients should land on the visible action or motion settling, not vaguely on the nearest word. When changes to visual timing move an important event independently, revise the plan/audio and rebuild. Listen to joins and tails in the exported MP4, measure clipping/peak, check mono, and compare at phone-sized playback. If one soft cue is enough, do not stack three.

## Maintain the library

Use `scripts/design_sound_library.py` only to intentionally revise/rebuild the palette, never in the ordinary video-edit path. It uses the existing numpy runtime and writes reproducible synthesized masters and retains imported tactile entries. Use `scripts/import_tactile_sounds.py pack.zip` only to intentionally re-import the official Kenney pack; ordinary edits reuse the bundled files. The audition MP3 can be regenerated from its temporary audition WAV with FFmpeg; the temporary long WAV need not ship. Rebuild fingerprints and perform audio checks after changing a master. For a required recorded texture that this original collection cannot supply, follow [sound-sources.md](sound-sources.md), verify its individual license, retain attribution, and do not relabel it as an original Fieldnotes effect.
