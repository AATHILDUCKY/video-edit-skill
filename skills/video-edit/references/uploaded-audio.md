# Original and inserted audio

Preserve the original uploaded video's sound through every kept interval. A visual insert changes the picture; it must not remove the speaker's voice. Audio extraction/transcription is an analysis step, not an instruction to discard the original track. Inserted clips retain their own audio by default when a stream exists. Keep source speed at 1×.

## Editor controls

- **Keep original video audio** in Footage explicitly enables/disables the original track. New uploads reset this to enabled and source volume to 100%.
- **Original video volume** in Sound controls the original track independently of effects/music.
- **Inserted videos volume** controls the inserted-clip bus. In Visuals, **Keep inserted clip audio** and **Inserted clip volume** control the selected clip.
- **Speaker button** mutes the monitor only. It does not remove sound from a browser export or offline MP4.
- **Play** starts with sound enabled and resumes the audio context through the user's interaction. Direct-file preview uses native media audio to avoid cross-origin Web Audio silence. Open `npm run studio` for browser export.

A one-time audio-settings migration restores source audio for old browser saves while preserving their visual/caption edits. Later explicit track mutes and saved fader choices remain valid. Loading packaged project footage during offline rendering is distinct from uploading a new clip, so it preserves authored mix settings.

Config defaults are `cameraAudio:true`, `cameraVolume:1`, `insertVolume:1`. Per-scene visual defaults are `videoAudio:true`, `videoVolume:1`. Plan fields are `broll_audio:true` and `broll_volume:1`. A clip without an audio stream stays silent; do not synthesize speech or effects and call them its original sound.

## Shared export mix

`audio-mix.cjs` builds the offline mixer for both full rendering and audio-only changes. The original source is always a separate track, even under B-roll. Insert tracks are trimmed at `videoIn`, placed at the scene's exact output offset, and mixed with their own gain. Main and inserted audio remain at original speed. The outro is mixed once, with sample-based delay. The final limiter compensates latency. `audio-mix-report.json` records source gain, included insert tracks, naturally silent inserts and the outro path status.

Use the normal `npm run render` after picture/scene/caption changes. For an audio-only correction to an existing matching picture:

```bash
npm run remix:audio
# Or apply a saved full-edit template's mix choices:
npm run remix:audio -- --template saved-template.json
```

This writes **final-audio.mp4**, copying existing encoded video packets and rebuilding only audio. It does not apply picture/layout changes from a saved template. Verify the new mix, then promote it to the delivery filename while preserving the previous export. This avoids re-rendering unchanged frames.

## Verify real sound

Check source audibility before, during and after inserted visuals, plus the existing outro. Inspect both browser recording and offline MP4 audio. Distinct-frequency regression fixtures are available:

```bash
python tests/prepare_audio_fixture.py /tmp/video-edit-audio-fixture-new
node tests/audio-browser.cjs /tmp/video-edit-audio-fixture-new/project
node /tmp/video-edit-audio-fixture-new/project/scripts/render-video.cjs
python tests/check_audio_export.py /tmp/video-edit-audio-fixture-new/project
```

Use the installed Python runtime and Playwright module as needed. The fixture uses 440 Hz for original audio, 880 Hz for an inserted video and 1320 Hz for added sound. Assertions require original and added sound throughout, both source and insert during the insert, and no insert leakage afterward. Browser recording is tested with preview muted. These are generated test tones, not production content.

For a real edit, correlate appropriate spoken intervals against the edited source, check peak/clipping and stream durations, and confirm expected inserted tracks in the report. Do not describe an insert with no audio stream as muted by a bug, or mistake a muted monitor for an absent exported source track.
