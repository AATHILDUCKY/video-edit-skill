# Advanced split-video editor reference

Open `video1.html` in a modern browser. Before uploading, the demo preview is 25 seconds at 1080 × 1920, with 11 original animated scenes. Uploading a clip automatically sets the reel to the clip’s detected duration and centres it in the bottom section. The HTML one folder above opens the same editor using these local assets.

1. Read `recording-script.txt` and record your camera clip. The short gaps between topic names leave room for each visualization.
2. Click **Add your camera video**. Upload your MP4, MOV, or WebM.
3. **Match uploaded video length** is enabled by default. Uploading or replacing a clip automatically adjusts every scene, script caption, sound cue, and the timeline to its length. Your camera video and voice always play at their original 1× speed. Adjusting **Clip starts at** matches the remaining clip length. You can turn automatic matching off to use a manual duration; your footage still stays at 1×.
4. Drag or zoom the bottom video to choose your frame. Choose the top/bottom height in the same panel, or drag the divider.
5. Edit captions on the right. Drag or trim the caption blocks on the timeline to match your spoken words.
6. Turn on sound to preview. Click **Export** for the video including your clip, captions, and selected audio mix. Preview mute does not remove exported effects.

Use **Template → Story + script** to change your handle, scene copy, and accent. Save/load a template JSON to reuse the edit; reselect your local camera video after reloading. **Template → Sound** controls camera audio, typing, effects, rhythm, and looping.

The included `about-this-page-preview.mp4`, when rendered, shows the empty camera slot. It has sound effects, not a recorded voiceover. Your camera recording supplies the narration.

## Edit visuals and their timing

Click **Visuals** in the right panel, or select a block on the **Visuals** timeline track.

- Edit the scene headline and second line, choose an illustration, and change its accent.
- Upload a PNG, JPG, or WebP to replace the illustration. Adjust size and position; your headline stays in place.
- Set exact start/end seconds, use **Start/End at playhead**, or drag a visual block and its edges on the timeline. Neighbours resize so every scene still fits your video. The first scene starts at 0 and the last ends with the clip.
- Script captions follow scene timings. Independently edited captions keep their own timing.
- **Save template** includes uploaded images, visual settings, and relative scene durations. Loading another video preserves those proportions and keeps the camera at normal speed.
- **Reset this visual** restores the selected illustration; **Reset visual timing** restores the original shot proportions.

## Preview timing before uploading

- 0.00–1.36s — Cyber security.
- 1.36–2.72s — Pentesting.
- 2.72–4.08s — Web development.
- 4.08–5.44s — Content creation.
- 5.44–6.80s — IoT.
- 6.80–8.16s — Arduino.
- 8.16–9.52s — AI agents.
- 9.52–11.22s — Vibe coding.
- 11.22–12.58s — 3D printing.
- 12.58–14.62s — Explore open-source tools.
- 14.62–17.00s — If this is your space, tap follow.

## Change the project

`assets/codex/template.js` holds narration, source shot durations, sound events, and captions. Its `targetDuration` sets the opening duration (currently 17). Keep source shot timings at their original 25-second baseline; the player scales them at runtime. Save/load template JSON includes the selected duration, automatic matching preference, custom captions, framing, and scene text. Custom caption wording is retained while its time ranges scale with the duration. `assets/codex/concept.js` draws each topic. Runtime assets remain local; no CDN or network is needed. `SOURCES.md` documents illustrations, fonts, and keyboard credit.

After changing durations or sound, rebuild with:

```sh
python3 scripts/make-soundtrack.py
python3 scripts/bundle-media.py
python3 scripts/export-script.py
```

The sound tools need NumPy and FFmpeg. Set `FFMPEG_PATH` if necessary. Install Playwright with `npm install`, then `npx playwright install chromium`. `npm run preview:frames` writes representative images; `npm run render` writes the frame-accurate preview MP4 at the configured default duration, without a camera clip. `npm run render -- --duration 25` overrides it for that render. Audio is retimed with pitch-preserving tempo filters. The generated recording script and SRT follow `targetDuration`; use the player’s Copy script / SRT download for a different duration selected in the editor. Browser Export includes your uploaded camera video at its original speed and, with matching enabled, its detected duration. Captions come from the editable script; this offline HTML does not transcribe audio or detect the exact word being spoken. Use the caption editor to fine-tune timing when your delivery varies.
