# From recording to edit

## Inspect first

Start with the compact `context` command and reuse matching source/canonical analysis before launching media processing. See [efficient-workflow.md](efficient-workflow.md) for stage-specific revisions, bounded context and companion routing.

Keep the input untouched. Create one analysis folder per recording and a new output folder per revision. Run `video_edit.py analyze VIDEO --out work/analysis --skip-asr` to inspect before model download. `source.json` records stream metadata and SHA-256 fingerprints. `frames/` contains five representative frames; inspect these and additional frames around visual events. Five frames do not replace watching motion or listening to the entire selected passage.

The helper produces `source.mp4`: corrected orientation, square pixels, constant frame rate, synchronized audio and a video origin at zero. `speech.wav` is full-duration 16 kHz mono PCM. Audio stream offsets are accounted for; silence is not removed before recognition. All subsequent source timestamps refer to this normalized file. Never mix original container PTS, ASR times from a cropped file, and output seconds without explicitly converting them.

Resume with `video_edit.py transcribe work/analysis --model small --language ta`. Use `--language auto` when unknown. `small` is the multilingual starting point, not a quality guarantee. Escalate to a larger supported model when names/accents fail and resources allow; listen before spending more compute.

## Inspect the analysis

- `transcript.txt`: overall argument and verbal hook candidates.
- `transcript.json`: segment/word estimates in source seconds.
- `transcript-review.json`: missing alignment, low confidence, language flags.
- `source-captions.srt`: source-time caption blocks.
- `keywords.json` and `.csv`: keyword/phrase source spans and contextual text.
- `silence-candidates.json`: energy-based gaps, not a command to delete them.

`keywords --terms "local models,hardware,cloud"` searches normalized exact phrases, not semantic synonyms. Search variants separately. The helper indexes inside ASR segments; for a phrase split across segments, inspect neighboring words and record the joined interval manually. Frequency-based defaults are candidates; the agent identifies meaningful ideas and chooses visuals.

## Choose the story

With a complete concise recording, retain its argument and clean redundant material. With a long recording, select one useful self-contained point. An opening lifted from later in the recording must remain truthful in its new position; avoid repeating the same sentence again unless deliberately illustrating a before/after. Retain qualifiers, negations and necessary setup. Do not fabricate claims, UI results, endorsements, logos or statistics to fill a scene.

Keep breaths that make speech natural. Remove a silent gap only after checking whether it supports a demonstration, reaction or emphasis. Avoid clipped consonants and abrupt background-noise changes. Build cut points in silence on the canonical video frame grid; test by listening across the actual encoded join.

Draft the plan, author the active visual beats/headline handoffs described in editorial-direction.md, then validate. Review long unchanged cards and keep every essential content point. The draft intentionally keeps the complete source and contains unfinished visual prompts. It is not an automatic finished edit. Build with `--draft` only to inspect authoring work; finish it before final export.

No audio: create an empty transcript and plan from visual evidence; do not generate dialogue. Unintelligible audio: retain uncertainty, use a supplied transcript/forced alignment if possible, or deliver an explicitly limited rough cut. Multiple speakers: inspect overlaps; use optional diarization only when identity labels materially help. Do not ask for paid cloud ASR when local tooling suffices.
