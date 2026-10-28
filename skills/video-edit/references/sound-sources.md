# Sound search, licensing and mix

Start with the bundled `assets/sfx/catalog.json` and its `asset` event ids; see [signature-sound.md](signature-sound.md). The eight tactile Kenney CC0 derivatives and 18 original synthesized cues need no search, model call or regeneration per edit. See catalog.json for Ogg-source provenance; working WAV bit depth is not a claim of lossless source quality. Use real recorded SFX when a specific material quality matters; use generated clicks/ticks/pings/impacts when sufficient. The Python generator includes a quiet procedural rhythm bed and a credited recorded keyboard source. There is no need for a paid sound API or voice replacement.

## Public API workflow

```bash
python "$SKILL/scripts/sound_assets.py" search "keyboard click" --provider commons --out work/sound-search.json
python "$SKILL/scripts/sound_assets.py" fetch work/sound-search.json --id SELECTED_ID --out work/sounds
```

Inspect the catalog's source and license, select a relevant candidate, fetch it, then audition it before placement. Search results are not curated choices. Search a couple of precise terms rather than scraping a library. The helper downloads only a selected returned HTTPS asset, caps size at 20 MB, records SHA-256 and provenance, and verifies an audio stream. It handles a bounded retry for rate limits. Configure `VIDEO_EDIT_USER_AGENT` with a meaningful application/contact identifier for repeated public API use.

Commons uses the MediaWiki API with `generator=search`, namespace 6, `filetype:audio`, `prop=imageinfo`, and `iiprop=url|size|mime|extmetadata`. No API key. It can return a small or irrelevant set; if no useful asset appears, generate the sound instead of blocking the edit. Metadata may contain HTML, which the helper converts to inert text.

Freesound is optional:

```bash
# Set FREESOUND_API_KEY in your environment; never commit or print the key.
python "$SKILL/scripts/sound_assets.py" search "short mouse click" --provider freesound --out work/sound-search.json
```

Use the current `/apiv2/search/` endpoint and token header. The helper uses returned preview URLs; original-file downloads require a separate OAuth 2 flow, which is not implemented. Record `quality: preview`; do not describe these files as lossless originals. Check Freesound API terms independently of each sound's license, especially for commercial API use. Do not bypass authentication or assume “open API” means anonymous/unrestricted.

## Credits

Default accepted candidates are CC0/public-domain and CC BY. CC BY-SA requires explicit review and `--allow-sharealike`; unknown, noncommercial, no-derivatives and Sampling licenses are rejected by this helper. A license name parser is a screening aid, not proof of rights. Follow the actual license/source record and retain any required notices. Prefer CC0 when attribution cannot fit the delivery context.

Save title, creator, source page, license name/URL, downloaded file hash and modifications. Copy the `.credit.json` into the plan event's `credit` object. Place required attribution in the delivered project and publication description when applicable. Source files aren't automatically unrestricted just because they are searchable or downloadable.

## Place and mix

Trim leading silence before assigning the event timestamp: the sound's audible onset should coincide with the visible action. Normalize the chosen sample gently, fade its edges, and use an appropriate gain. The packaged external mixer uses up to 10 seconds per asset; prepare a shorter local sample first if needed and record the modification. Event `at` is output time.

Generated SFX support `click`, `tick`, `pop`, `ping`, `chime`, `whoosh`, `impact`. Keyboard sound is a separate bus gated by the scene's visible typing interval. Avoid adding keys to a static screenshot. Default source speech is loudness-normalized near -16LUFS / -1.5dBTP before mixing; these are starting targets, not a promise about final measured loudness. The final mix applies a peak limiter. Measure/listen to the exported result; reduce effects before compressing speech harder.

Keep the bed very quiet or omit it for dense technical speech. If needed, implement speech-driven sidechain compression with FFmpeg, keeping speech as the sidechain and preserving exact timeline duration; verify attack/release audibly. Do not speed up the voice to match music. Effects follow the spoken/visual action; music should support it.

API unavailable or credentials absent: use the other public source or deterministic synthesis, state that choice, and complete the edit. Do not fabricate a downloaded asset or attribution.

Preserve uploaded source and inserted-clip audio by default; effects and music are additional buses. Preview mute controls monitoring only. New source/insert volume controls and audio-only re-mixing are described in [uploaded-audio.md](uploaded-audio.md).
