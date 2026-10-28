---
name: html-video-explainer
description: Create or edit animated HTML videos from concepts, scripts, references, and second-by-second visual directions. Use for reels, shorts, explainers, motion ads, and reusable video templates with editable visuals, movable/resizable captions, and timelines; not ordinary websites or general transcoding.
metadata:
  version: "3.0.0"
---

# HTML Video Explainer

Create the actual HTML/video project, not just a written explanation. Choose a motion direction from the content and the user’s goal. Keep the editable split-video workflow for talking-head reels; choose a full-frame authored film when the request calls for a showreel or continuous motion design. Controls remain outside the exported frame.

## Choose the direction first

Read [content-based motion direction](references/motion-direction.md) for a new concept or showreel. Choose a product UI film, educational mechanism, business story, abstract technique reel, graphic loop, or split-screen edit because it serves the content. Do not copy the same toggle/dot/template sequence into every topic. Name the concept and through-line object before storyboarding when a connected motion film is appropriate.

For product work, research the real product/interface/brand and retain evidence; never invent screens, features, numbers or proof. For unfamiliar businesses, obtain the essential offer/audience/brand details. Use available assets and defaults for optional inputs; ask only for what actually blocks truthful work. Inspect an actual supplied reference, not an imagined one.

For beat-led films, create the timed beat-by-beat storyboard first, including copy, object transformations, cursor actions, camera and audio. Default to 120 BPM for this mode, then honor the user's track and exact times. Show the plan and proceed without a new confirmation when asked to build; follow explicitly requested input/still-review sequences. [Prompt recipes](references/prompt-recipes.md) provide four adaptable briefs.

## Choose the right starting point

Inspect an existing project before editing it. Preserve the user's work and change only the requested scope. For a new project, use the packaged editor:

```sh
python3 <skill-directory>/scripts/create_project.py --output <project> --title "<concept>" --style about --palette coral
```

Resolve paths from this `SKILL.md` directory. `--style about` uses the current `about-this-page.html` editor and illustrated tech demo; `--style video1` uses the original `video1.html` photo/code story with the same upgraded editing controls. Both are reference stories to replace for another subject. Do not leave unrelated Codex branding, tech topics, or handles in a finished video.

Unless specified: 25-second preview, 1080 × 1920, equal adjustable split, white/charcoal/coral. User duration, colors, layout, language, references, and branding override defaults. For a full-screen request, adapt and verify the compositor/export; use `assets/examples/full-frame-outro.html` as an optional short-outro reference. A changed label is not a new aspect ratio.

For a requested single-file 1920×1080 motion film, use `scripts/create_motion_film.py` and [motion-film build/export](references/motion-film-build.md). Its `window.seek(t)` contract, analytical easing, OfflineAudioContext WAV, beat contact sheets, and 60fps three-subframe ffmpeg renderer are separate from the split editor. Replace the authoring demo with the actual concept before final delivery. Do not remove editing/customization features from ordinary reels to meet a different mode's restrictions.

Read [template API](references/template-api.md) before changing the runtime or writing scenes. Read [design and motion](references/design-motion.md) when choosing a treatment. Six light-mode palettes are bundled; use a user's hex colors when supplied.

## Turn concepts and seconds into visuals

For a concept-only request, infer audience and takeaway, then build a brief storyboard, natural narration, relevant visuals, timed sound, and captions. Show a mechanism or useful reference for each idea instead of putting paragraphs beside decorative icons. Keep fast edits readable at phone size. Avoid website sections, decorative eyebrow labels, beige styling unless requested, fake metrics, and unrelated 3D props.

When the user specifies seconds, treat them as timing requirements. Read [timestamped direction](references/timestamped-direction.md). Resolve partial instructions into a complete scene plan, retaining all specified windows. Separate shot boundaries from actions inside a shot. Do not squeeze an explicit 6–8s animation into another interval to satisfy the default duration. Apply the complete plan with:

```sh
python3 <skill-directory>/scripts/apply_timeline.py <project> <plan.json>
```

The helper writes timing/data; implement the requested imagery and every beat in `assets/codex/concept.js`. Selecting a demo preset or storing an action string does not create a new animation. Exact plans disable automatic upload retiming. Use `--allow-auto-fit` only when the user permits those windows to scale. Preserve existing custom captions; use `--reset-captions` only when replacing them is within the request.

## Keep editing simple and dependable

Retain editable headline/subline, illustration choice, scene accent, image upload, size/position, and start/end controls. Visual blocks support selection, movement, edge trimming, and keyboard timing. Neighbouring scenes fill the reel. Preserve caption text/timing, font-size, position, drag-to-move/corner-resize, placement presets, line width, color/background controls, all-caption or individual-caption scope, and undo/redo. Caption style belongs in the shared canvas renderer and saved settings; editing handles never belong in exported frames. Keep automatic script captions automatic when only their appearance changes. Preserve split/undo, camera crop/zoom/fill/fit, section-height adjustment, sound controls, and Save/Load template unless another interface was requested. Save template carries images and relative scene timing; camera files remain local and are reselected after reload.

For untimed concepts, upload matching is on: detect the camera clip's duration, fit visuals and script captions, and keep camera footage/voice at **1× original speed**. Reset framing sensibly for a replacement clip. Script-based timing is not speech transcription; do not claim word-level alignment without an actual transcription/alignment step. For exact second-by-second directions, keep those timings authoritative and explain any conflict with a supplied clip.

Make every frame deterministic from timeline time. Preserve proportions across split changes. Use compatible geometry for true morphs; otherwise use a clean mask, wipe, or match cut. Retiming an individual scene must also retime its sound/typing segment. Preserve custom text, images, captions, framing, and timings across reload and template import.

## Automatically installed session-story companion

The provided installer installs both this skill and the pinned `session-story` companion from `heygen-com/hyperframes-community-skills`. Read [companion installation/routing](references/session-story.md) for its source, upstream command, and scope. Installing copies skill files only; it does not run runtime setup or read any history. Use `session-story` only for an actual film about the user's sessions with their agent, following its own source/authorization/review requirements. It is not the design engine for unrelated marketing or concept videos.

## Assets, realism, and companion capabilities

Use purposeful SVG/Canvas for precise icons, diagrams, UI, typography, and charts. Use real photographs, supplied footage, or generated bitmaps when they explain the subject better. Record sources and reuse terms in `SOURCES.md`; retain font and keyboard licenses. Treat an absent attachment or unavailable asset honestly.

Read [companion workflows](references/companion-workflows.md) when realistic imagery, a real 3D asset, narrated voiceover, or an external design source is needed. Use an available relevant skill/tool conditionally; do not install unrelated skills/plugins or add paid services just because they are listed. Portable agents can follow the workflow without those capabilities and should use supplied/local assets or state the specific missing capability. Browse when claims, current product details, or source attribution require verification.

## Build, verify, and deliver

Follow [media/export](references/media-export.md) after changing the storyboard, assets, sound, or timing. Embed local assets for origin-clean direct-file export. Set `video.project.json` to the actual entry/output and mark `is_demo=false` only after the concept and visuals are implemented.

```sh
python3 <skill-directory>/scripts/check_project.py <project>
```

Inspect representative frames, first/last frames, each explicit timestamp, and transitions. Exercise changed visual timing, an image upload, caption resizing/dragging, individual/global style, style undo/redo, a caption text edit, a new split, camera upload/framing, and Save/Load when those features are part of the result. Check that camera playback stays 1×. A static pass does not prove animation, sound, or export. Render/decode when producing MP4; report only what was actually verified.

Deliver links to the HTML/project, timed recording script/SRT, and MP4 if rendered. Give the shortest useful edit instructions. Never publish or send the result externally without authorization.
