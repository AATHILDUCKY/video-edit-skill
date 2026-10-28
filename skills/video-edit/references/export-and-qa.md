# Export and inspect

`build` creates `media/camera-edited.mp4` from the source clip list, writes measured captions and source-to-edit mapping, generates audio buses, and copies the editor. The original video is not changed. The camera track contains real footage and original-speed speech. Use the project's `scripts/render-video.cjs`; an older HTML-only renderer may accidentally omit the uploaded camera or its voice.

Preview first:

```bash
cd work/edit-v1
npm run preview:frames
# Inspect renders/frame-*.jpg and desktop/mobile editor screenshots.
npm run render
# Optional UI changes saved as a template:
node scripts/render-video.cjs --template saved-template.json
```

The offline renderer waits for the video element to finish seeking at every output time, captures the canvas, and encodes the frame stream with FFmpeg. It does not record wall-clock playback. Audio is mixed separately from the cut source and aligned scene buses. `is_demo:true` prevents a placeholder plan being accidentally labeled final; finish the author's visual review, then clear it. This is an agent review state, not a request for user permission.

Default export is 1080×1920 at the plan fps (30 by default;60 optional), H.264/yuv420p and AAC stereo 48 kHz. The packaged renderer has no temporal supersampling. If the brief explicitly calls for 60fps/3 subframes motion blur, adapt it deliberately with a centered shutter and deterministic captures; do not claim it was used by default. Avoid heavy blur on text or multiplying render cost without a visible benefit.

## Review actual output

- Read transcript against source audio, especially names/numbers/negations. All corrected captions must still match the speaker.
- Inspect first/last frames, every scene boundary, longest captions, peak motion and each crop change. Additional frames near a boundary matter more than arbitrary equal sampling.
- Play each edited audio join with a little context. No clipped words, duplicated syllables or sudden unwanted background changes. Check both beginning and ending sound.
- Decode frames from the final MP4. Confirm the bottom shows the intended source frame at each sampled output time, not a black frame, placeholder or repeated first frame.
- Check caption appearance at word start/end and in pauses. Segment-only captions must not pretend to have word timing.
- Watch at phone size. Keep captions readable and clear of face, controls and edges. Check the source video reframing and top/bottom extremes.
- Confirm dimension, frame count/duration, audio presence, speech playback rate and no unwanted tail. Accept rounding only within a frame; unexplained drift needs correction.
- Listen at ordinary volume with headphones and a phone speaker if available. SFX cannot mask consonants; keyboard must stop with typing. Measure final loudness/peak when tools permit.
- Scrub backward/forward; test text/timing edits, caption move/resize, visual image/timing changes, split adjustment, saved-template reload and render with those settings. Report only checks actually performed.

`ffprobe -show_streams -show_format` reports container/stream data; PyAV is an available fallback. FFmpeg `ebur128`/`loudnorm` can measure audio. Decoding a contact sheet from the exported MP4 validates the encoder output, while browser screenshots validate only the editor.

Deliver final.mp4, edit.html with its assets/media folder, captions.srt, SOURCES.md, and concise editorial notes. Retain evidence/transcript.json, keywords-edited.json and source-to-edit.json for revisions. A browser export is useful for quick previews; the offline render is the reproducible deliverable. If export cannot run, say exactly which output exists and what failed, rather than linking a missing MP4.

The personal-brand builder appends the actual outro separately, without extending the main source-to-edit map or captions. Inspect both sides of that boundary and verify total duration = content_duration + outro.duration. Run `npm run studio` for browser exports; offline rendering starts its own loopback server to avoid tainted local-file canvases. The editor records frame rate from the manifest rather than assuming 60 fps. Usage reporting is described in [brand-and-studio.md](brand-and-studio.md).

For Instagram, apply the brand composition profile and read [instagram-reels.md](instagram-reels.md). Render after moving graphics. Inspect caption bounds and important animation with approximate phone/Reels guides, which must remain excluded from capture. A local export check cannot establish actual Instagram playback.

For this creator’s active pace, inspect long unchanged headlines/cards and repeated text across scenes. Confirm each new visual beat supports the phrase at that output time. Review the muted picture for a clear progression, then check the complete audio argument and every cut. Record deliberate longer holds for technical reading or emotional pacing. Frequent change must preserve context, qualifiers, negation, names and the final payoff; do not report improved retention without actual measurements.
