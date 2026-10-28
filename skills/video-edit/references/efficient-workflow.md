# Efficient use of the editing workflow

Use local deterministic work for media processing and the agent for understanding, editorial choices and genuinely new visuals. Reuse the shared implementation instead of rewriting it for each recording.

## One compact preflight

```bash
$PY "$SKILL/scripts/video_edit.py" context VIDEO --analysis work/analysis --project work/edit-v1 --motion gsap
```

The command reads source metadata, hashes source/canonical footage, summarizes a matching transcript (up to 1200 characters and three issues), lists evidence paths, and selects focused companion skill paths. It resolves a uniquely matching filename extension/case such as .mov/.MOV. It does not create folders, run ASR, install packages, render, call a cloud service or decide the story. `--skills-dir` supports another installation destination. Full transcript and review files remain the authority; inspect them when the preview is truncated or a phrase is uncertain.

A different source or changed canonical fingerprint prevents transcript reuse in the summary. Missing audio/transcript is reported separately. Project source identity and final-file existence are separate facts: an existing MP4 may be stale after template edits. Do not deliver a cached final solely because it exists. Legacy analysis without a canonical fingerprint needs review before trusting its timebase.

## Route the actual change

| Request | Reuse | Necessary work |
| --- | --- | --- |
| New recording | Installed runtime, brand, masters, shared editor | Inspect/analyze the new source, transcribe once, author its own plan |
| Caption spelling/appearance | Footage, cuts and existing word alignment | Edit measured cues/full template; preview affected captions and render picture |
| Motion, headline, layout or color revision | Source analysis, voice, cuts, assets | Update authored visuals/template; preview affected shots and render picture |
| Sound-only revision | Matching encoded picture, source audio and timing | Rebuild affected stems/mix and use remix:audio; verify retained source/inserts/outro |
| Different cuts/order | Canonical footage and corrected source word times | Revise source intervals, remap captions/keywords/SFX and build a new revision |
| Recognition defect | All valid footage/analysis | Review the uncertain span first; another model/alignment pass only when evidence warrants it |

Cosmetic changes do not justify new recognition. A new source does not inherit the previous recording's dialogue. Keep earlier exports/templates when revising, and keep the current source-to-output map explicit.

## Focused skills and assets

Use FFmpeg guidance for source/cut/audio operations; GSAP core/timeline for SaaS/kinetic choreography; relevant Three.js guidance for an actual 3D explanation; Remotion only for a composition that uses or needs that backend. `context --motion none|gsap|threejs|remotion` lists the starting routes. It selects guidance, not packages or an automatic backend migration. Add focused plugin/geometry/markup references only for the feature being implemented.

Read each companion once per session/capability. Do not load all 36 companions because they are installed. Do not install every npm/pip library or update pinned upstream repositories for an ordinary edit. Reuse cached ASR models and the existing Python/browser runtime. RunComfy companions are for an explicit cloud-transformation request; skill installation does not authorize uploads, account login or billed requests.

Select bundled sound masters through `sounds --category Tactile`; do not print the full waveform catalog or regenerate the library. Reuse real editor captures, supplied/verified clips, fonts and icons when they support the current content. Read asset metadata and inspect visual previews instead of dumping base64 media.js/fonts.css into context. Write only recording-specific plan/data and a custom visual mechanism when the existing vocabulary cannot express it.

## Review with a purpose

Plan the full meaning and beat sequence before coding. Use the creator's active pace and bottom-caption rules. Preview the opening, each relevant cut/change, longest captions, important motion state, B-roll boundaries and outro. A contact sheet is an efficient first visual review; zoom frames where needed. Verify original audio through visual inserts and the actual final outro. A second recognition pass or full render is appropriate for a discovered defect, not as a ritual after every small adjustment.

Finish one reviewed export. After a revision, repeat the affected checks; changes to shared renderer/audio/timing code can warrant broader regression tests. Do not save tokens by skipping the actual final picture/audio check or dropping necessary context. Report only observed validation and actual limitations.

Use host telemetry for token totals when available. These practices reduce repeated context and work; without edit-scoped measurements, do not invent a savings percentage or claim zero agent tokens.
