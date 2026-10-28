---
name: video-edit
description: Edit supplied Tamil or English spoken footage into engaging personal-brand videos with local transcription, speech-timed captions, story-driven cuts, B-roll, SaaS motion, a reusable HTML editor and a signature outro. Use for actual supplied footage or maintaining this editing workflow; use a separate animation skill for concepts without footage.
---

# Video Edit

`$video-edit sample-video.mp4` means finish the edit: inspect the recording, transcribe, choose truthful cuts, author relevant visuals, export the editable HTML project and final MP4, then inspect the result. This creator shares personal stories, experiences and technologies. Keep their personality and complete meaning central.

## Start with reusable context

Resolve `SKILL` to this package and use the installed Python/FFmpeg/browser runtime; see [runtime.md](references/runtime.md) only for missing setup. Start with:

```bash
PY=~/.local/share/video-edit/venv/bin/python
SKILL=~/.codex/skills/video-edit
$PY "$SKILL/scripts/video_edit.py" context sample-video.mp4 --analysis work/analysis --project work/edit-v1 --motion gsap
```

This read-only command resolves filename case, checks source/canonical fingerprints, summarizes cached evidence and lists focused companion paths. It does not certify recognition accuracy or freshness of an existing final. Read the complete transcript when the summary is truncated. Reuse matching analysis, corrected word times, cuts, assets and installed packages; choose a new analysis folder for a different source. Never reuse another recording's captions. Read [efficient-workflow.md](references/efficient-workflow.md) for revision routing and context limits.

On first use per session, run `install.py --companions-only --check --quiet --dest /path/to/skills-parent`. Install missing companions using `--companions-only --keep-existing` without another confirmation, as this creator requested. Preserve differing custom copies. The full installer includes this editor plus 36 companions; a generic copy has no install hook. See [motion-companions.md](references/motion-companions.md) for installation details.

## Use the supplied skills deliberately

Load the focused companion before implementing that capability; reuse guidance already read in this session. Keep the established HTML/canvas backend and load only the relevant references.

| Current need | Companion |
| --- | --- |
| Footage cuts, conversion, audio mix/export | `video-processing-editing` |
| SaaS UI, kinetic text, choreographed motion | `gsap-core`, `gsap-timeline` |
| A useful 3D explanation | `threejs-fundamentals` plus relevant lighting/animation/geometry guidance |
| Existing/requested Remotion composition | `remotion-best-practices` plus focused captions/render guidance |
| Explicit RunComfy cloud transformation | `runcomfy-video-edit`, `runcomfy-cli`; [runcomfy.md](references/runcomfy.md) |

Use `context --motion none|gsap|threejs|remotion` to select a route. Add `--cloud-runcomfy` only for an actual RunComfy request. Its upstream video-edit is namespaced to preserve this local skill. Skill installation does not install/login to its runtime or authorize uploads/credit spending. Ordinary Reel editing stays local.

## Editorial and brand rules

- **Identity:** use [assets/brand/profile.json](assets/brand/profile.json): speaker-led 1080×1920, lime accents, near-white panels, charcoal type, Manrope/Noto Sans Tamil. Keep the face and gestures visible; use camera, split, relevant B-roll and purposeful motion to support the actual story.
- **Attention with meaning:** open on a truthful hook in 1–2 seconds. In energetic passages, target a meaningful visual beat around every 0.8–1.8 seconds and a cut/composition change around every 1.5–3 seconds. Headlines are usually 2–6 words, held about 0.8–1.6 seconds, then retired/replaced. Adapt for reading, technical detail and emotion. Preserve context, negation, caveats and payoff at 1×; review long unchanged cards. Read [editorial-direction.md](references/editorial-direction.md).
- **Captions:** preserve spoken Tamil script and English technical terms. New builds use measured chunks up to four words/about 1.6 seconds; use 2–3 words for long Tamil tokens. Never invent word times or truncate a long word to meet the target. Keep the entire caption box in the bottom section, below the divider and above the reserved platform footer. Default `caption_style.y:null` anchors it to the usable bottom; reserve that band before positioning the face.
- **Instagram:** key graphics/text stay within the profile's conservative x80–940/y300–1240 margins. The default split limit is 52% to preserve the caption section. These margins and optional phone/UI guides are approximations; inspect custom overlays and baked B-roll text. Read [instagram-reels.md](references/instagram-reels.md) for controls, evidence and limits.
- **Audio:** keep the uploaded voice and audible inserted tracks at 1× through all retained passages, including under motion/B-roll. New uploads start enabled; preview mute only mutes monitoring. Prefer the bundled tactile CC0 palette, a few action-timed cues, effects-only ducking and no bed by default. Preserve source audio before lowering competing layers. Read [uploaded-audio.md](references/uploaded-audio.md) or [signature-sound.md](references/signature-sound.md) when changing the mix. Use `sounds --category Tactile`; reuse masters and credits.
- **Outro:** append the actual bundled `insta-follow-2.mp4` once, after the completed story, at original speed with its audio and complete picture. The builder handles it and Reels inset; never duplicate it in planned scenes/captions. Explicit opt-out is `outro:false` or `brand.outro.enabled:false`; fail clearly if an enabled asset is missing.

## Finish the edit efficiently

1. **Inspect and transcribe once.** Read [workflow.md](references/workflow.md). For a new recording, `analyze VIDEO --out work/analysis --language ta --model small` creates canonical footage, full-duration audio, evidence and local ASR. Use `en`/`auto` when appropriate. Correct uncertain names against evidence; escalate recognition only for an observed problem. Read [transcription.md](references/transcription.md) for mixed speech, imported timing or alignment issues.
2. **Plan the content.** `draft work/analysis --out work/edit-plan.json` is only a starting point. Author the hook, all essential points, source intervals, output-time visual beats, meaningful inserts and sound cues. Keep SOURCE clip times separate from OUTPUT scene/caption times. Read [timeline-schema.md](references/timeline-schema.md) and [brand-and-studio.md](references/brand-and-studio.md) while authoring.
3. **Reuse the implementation.** Keep the shared editor, caption system, renderer and scene vocabulary. Write only current transcript corrections, plan, labels and genuinely new assets. Use `concept_js` for a necessary new visual mechanism; read [visual-authoring.md](references/visual-authoring.md) then. Retain original/verified asset licenses. Avoid fake software results or stock portrayals of the creator's actual experience.
4. **Build once, inspect, export.** `validate ANALYSIS PLAN`, then `build ANALYSIS PLAN --out work/edit-v1`. Run `npm run preview:frames` and inspect key boundaries, longest captions, peak motion, face crop, inserts and outro. Fix observed defects, then `npm run render`. Render saved HTML edits using `--template saved-template.json`; localStorage is not the offline renderer's source. Read [export-and-qa.md](references/export-and-qa.md). Inspect decoded final frames and real audio before/during/after inserts; audio-track metadata alone is insufficient.
5. **Revise only what changed.** Captions/style/motion require picture rendering; sound-only changes can use `npm run remix:audio` on the matching picture. Changed cuts need remapping/rebuilding from cached word times, not new ASR. Preserve earlier authored revisions. Re-run checks affected by the change, rather than the whole toolchain or repeated full exports.

Do not print encoded media/font blobs or whole libraries into context. Use compact summaries, contact sheets and selected frames. Read implementation files only when extending/debugging them. Local processing is the default; editing does not authorize publishing or remote transcription.

## Delivery and usage

Link `final.mp4`, `edit.html`, `captions.srt`, `brand.json`, `usage-report.json` and the project folder. Keep adjacent media/assets, source transcript/review, source-to-edit map, plan and credits. Summarize the editorial choice, checks and material uncertainty.

Report measured edit-scoped host tokens when supplied; otherwise **Agent tokens: unavailable**. Local ASR/FFmpeg API-token use does not mean the agent consumed zero. Never estimate precise token totals or savings from duration/code size. `usage PROJECT --input-tokens N --output-tokens N --cached-input-tokens N --source "host telemetry for this edit"` accepts real counts only; cached input is already part of input.
