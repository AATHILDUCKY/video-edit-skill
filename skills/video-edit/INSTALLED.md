# Local install (this machine)

This skill is fully installed and smoke-tested on 2026-10-27.

| Piece | Path / version |
| --- | --- |
| Skill | `~/.config/opencode/skills/video-edit` (also `~/.codex/skills/video-edit`) |
| Python | 3.12.16 standalone (via uv) — system Python 3.14 has no wheels for the ASR stack |
| Runtime venv | `~/.local/share/video-edit/venv` |
| Interpreter | `~/.local/share/video-edit/venv/bin/python` |
| Packages | faster-whisper, av, numpy, Pillow (see `requirements.txt`) |
| FFmpeg / ffprobe | `~/.local/bin/ffmpeg`, `~/.local/bin/ffprobe` (static 7.0.2 in `~/.local/opt/ffmpeg`) |
| Node / npm | v24.22.0 / 11.19.1 |
| Playwright | npm global `playwright@1.64.1`, module `~/.nvm/versions/node/v24.22.0/lib/node_modules/playwright` |
| Chromium | `~/.cache/ms-playwright/chromium-1248` (launch verified) |

## Run

```bash
PY=~/.local/share/video-edit/venv/bin/python
SKILL=~/.config/opencode/skills/video-edit
$PY "$SKILL/scripts/video_edit.py" doctor
```

No new venv is needed per project. `doctor` should report ffmpeg, ffprobe, node and all
four modules as present.

## Notes

- The first `analyze`/`transcribe` downloads a Whisper model (tiny/base/small…) into the
  Hugging Face cache; later runs are offline. Set `HF_TOKEN` to avoid the anonymous
  rate-limit warning.
- Browser dependencies needed no extra system packages; `chromium.launch()` worked
  out of the box.
- `sudo apt install ffmpeg` was not possible (no passwordless sudo), hence the static build.
- Per-project rendering: `cd <project> && npm install && npm run preview:frames` (uses the
  cached Chromium). Set `PLAYWRIGHT_MODULE` only if a project cannot resolve `playwright`
  locally.

## Personal-brand studio upgrade — 2026-10-27

The maintained source package is also in `/home/ducky/Desktop/html-videos/skills/video-edit`. The Codex and existing OpenCode skill copies receive the same upgraded package. The installed companion is `~/.codex/skills/video-processing-editing` (via the requested Skillfish command).

This version defaults to multilingual `small` / Tamil `ta`, and bundles Noto Sans Tamil, Lucide licensing and the creator's actual 2-second outro. A first `small` run may download weights. Model-cache availability and ASR accuracy are not implied by the UI/export smoke tests.

A template demonstration and its verification notes are under `/home/ducky/Desktop/html-videos/video-edit-studio/editor`. Launch it with `npm run studio`; existing global Playwright can be selected with `PLAYWRIGHT_MODULE` as described above. This upgrade passed 11 Python regression tests, browser interaction checks and a 10-second H.264/AAC export with the real outro. Tamil test captions are authored fixtures; no new Tamil recording was supplied.

## Bundled companion installation — 2026-10-27

The complete installer (`install.py`) includes all 12 Remotion, 8 GSAP and 13 Three.js skills from the requested repositories, plus the prior FFmpeg companion. Full repositories are cloned in the workspace `vendor-repos/`; exact commits and content fingerprints are in `dependencies.lock.json`. The portable package includes an offline payload, so future installations need neither Git nor a network connection. Run `install.py --check` to inspect the destination. Runtime npm libraries are installed only when a project actually uses them.

## Original signature SFX palette — 2026-10-27

`assets/sfx/` now contains 18 original CC0 effects as 48 kHz/24-bit stereo WAV masters, a searchable audition page, an MP3 collection preview, catalogue metadata and provenance. New `asset` sound events resolve directly from this library with designed sync anchors and recommended gains; selected files and credits travel with each project. Samples are reused, not regenerated per edit. Gain handling preserves quieter choices, and pre-roll/tails are faded around story boundaries. This upgrade passed 19 regression tests, browser WAV-playback/filter/mobile checks and a real project build with five credited cues; its effects stem stays silent during the brand outro.

## Uploaded-audio preservation fix — 2026-10-27

Play now starts with sound enabled, new uploads enable their original audio, and inserted videos retain their audio when present. Main source audio continues under B-roll/motion visuals. Source/insert volume controls are saved in full-edit and brand presets. Preview mute affects monitoring only. Direct-file preview uses native media audio; local-studio export uses the shared Web Audio mix. The offline renderer and audio-only remix command share one mixer. A real browser recording and an offline export were verified with independent 440 Hz source, 880 Hz insert and 1320 Hz added-sound tones.

## Instagram composition and tactile sound revision — 2026-10-27

The Reels profile reserves x80–940/y300–1240 for key animation/captions at 1080×1920, with adjustable top/bottom margins and a preview-only phone/UI guide. Brand/template files retain these settings; the supplied outro is inset with its audio intact. The default sound collection now adds eight credited Kenney CC0 derivatives and retains 18 legacy synthesized cues. Music defaults off; effects duck up to 6dB during speech. Ordinary edits reuse the assets.

Validation: 20 Python tests; skill validator; 24 caption-box cases including 120px edge text; template/brand persistence; guide exclusion; mobile preview; and browser/offline three-source audio proofs. my-niche/edit-v2 is the updated real-footage export, with decoded-frame/audio checks under my-niche/review/instagram-update. No actual Instagram upload or physical iPhone test was performed. Research and caveats: references/instagram-reels.md and references/signature-sound.md.

## Bottom-section caption rule — 2026-10-27

Spoken captions now default to automatic bottom anchoring (`caption_style.y:null`) and remain entirely in the lower section across camera, split, motion and B-roll. Split captions stay below the divider; the full box sits above the platform footer. Top/centre/bottom presets, dragging, large fonts and old imported y values are constrained to this section. The default Reels geometry reserves a 240px caption band and limits the motion split to 52%; controls adapt when footer reserves change. Full-frame mode retains lower-section captions without platform margins. Reframe the speaker around the reserved caption band during authoring.

Validation: 20 Python regressions, skill validator, and 64 browser caption-placement cases covering all actual cues, attempted top placement, automatic bottom anchoring, large fonts, split limits, footer changes, full-frame mode, fitted-text slider geometry and placement presets. Template/brand persistence and guide exclusion still pass. Checks ran against an isolated copy of the latest real-footage project; results are in the workspace video-edit-studio/caption-bottom-checks.json.

## Active pacing and shorter text — 2026-10-27

Future edits use a stronger opening and frequent content-driven visual changes. Editorial targets: a meaningful visual beat around every 0.8–1.8s, shot/composition change around every 1.5–3s in energetic passages, and short headlines usually held 0.8–1.6s. These are authoring targets with reading/emotional exceptions; source audio remains at 1× and necessary meaning, qualifiers and context must be retained. Long unchanged cards and repeated headlines require review. The draft now carries these authoring reminders.

Actual build defaults now use caption_chunking={max_words:4,max_duration:1.6}; measured words/timestamps remain complete. Long words and segment-only alignment remain intact instead of receiving invented timing. Partial brand overrides are supported. Built-in motion intensity defaults to 1.0 for brisker transitions; bottom-section caption and uploaded-audio rules remain in force.

Validation: 23 Python regressions, skill validator, and a real FFmpeg/HTML project build confirming shorter caption chunks retain every fixture word/time. Evidence: video-edit-studio/pacing-build-check.json. No retention/engagement improvement was measured or guaranteed. Existing exported videos are separate authored revisions; these defaults apply to new builds.

## Bundled RunComfy companions — 2026-10-27

The requested prime-skills/runcomfy-agent-skills video-edit router is pinned at fca19ae084c2ae4667f5c8affbb99da5103d5832 and installed as runcomfy-video-edit to avoid replacing the custom video-edit workflow. Its runcomfy-cli companion is included. Both retain complete original instructions and the upstream MIT license; separate upstream/installed fingerprints record the namespace wrappers. The repository is cloned in vendor-repos/runcomfy-agent-skills.

The full installer now installs 37 skills per destination: the custom video-edit plus 36 companions. Its first-use companion recovery includes the new skills, and future full installs need no RunComfy download. Runtime CLI installation/account authentication and any cloud job are separate from copying skill guidance; ordinary editing remains local. See references/runcomfy.md.

RunComfy bundle verification: 24 Python regressions passed; main and both new skill wrappers passed the skill validator. Rebuilding the companion payload is byte-identical for the same reviewed commit. Fresh offline installation, repeat installation, parent-only companion recovery and preservation of upstream bytes/name separation passed. See video-edit-studio/runcomfy-bundle-check.json.

## Efficient context and staged reuse — 2026-10-27

The main skill entry was reduced from 1,962 to 1,135 words, moving conditional operational detail into references/efficient-workflow.md while retaining the creator’s style, active pacing, bottom captions, original/insert audio, actual outro, local default and honest token reporting. These are instruction word counts, not measured token savings.

New command: video_edit.py context VIDEO --analysis PATH --project PATH --motion none|gsap|threejs|remotion. It resolves filename case, checks source/canonical fingerprints, returns bounded transcript/issue context, reports cached project state and selects focused companion paths. --cloud-runcomfy adds the explicitly requested cloud companions; the command itself is read-only and submits no job. Revision guidance routes caption/style changes to picture rendering, sound-only changes to the existing remix path, and changed cuts to remapping cached word times.

Validation: 32 Python regressions and skill validator passed. The context command was exercised on codex-edit.MOV with the existing codex-reel analysis/project: fingerprints matched and selected FFmpeg/GSAP skills were present, with no new ASR or video render. Tests cover read-only behavior, bounded output, stale/foreign caches, missing stages, case ambiguity, path containment and focused routing. Evidence: video-edit-studio/efficiency-check.json.
