# Bundled companion skills

The complete installer adds these sibling skills with video-edit, without downloading or running npm packages during installation:

| Repository | Bundled skills | Use in a video edit |
| --- | --- | --- |
| [remotion-dev/skills](https://github.com/remotion-dev/skills) | 12 | Frame-based React compositions, captions, previews and rendering when a project actually uses Remotion |
| [greensock/gsap-skills](https://github.com/greensock/gsap-skills) | 8 | Choreographed timelines, text/UI transitions, easing and cleanup for GSAP scenes |
| [cloudai-x/threejs-skills](https://github.com/cloudai-x/threejs-skills) | 13 | Purposeful 3D geometry, materials, lighting, animation, models and performance |
| [prime-skills/runcomfy-agent-skills](https://github.com/prime-skills/runcomfy-agent-skills) | 2 | Requested video-edit router, installed as runcomfy-video-edit, plus runcomfy-cli guidance for explicit cloud transformations |

`dependencies.lock.json` records the exact cloned commits and SHA-256 of every installed skill tree. `assets/companion-skills.zip` contains the full skill folders, including their references/assets. Upstream documents and available license notices are retained in `assets/companion-notices`. Remotion's best-practices router contains nested reference directories; preserve them. RunComfy namespace wrappers retain the complete upstream instructions and MIT notice; [runcomfy.md](runcomfy.md) explains the name mapping and runtime boundary. The previously requested `video-processing-editing` snapshot is also bundled, with its original commit explicitly recorded as unknown rather than fabricated.

## Install everything together

After extracting the video-edit package, use standard-library Python (no pip/npm needed for the installer):

```bash
python3 video-edit/install.py
# Both supported agents:
python3 video-edit/install.py --agent codex --agent opencode
# Another agent's skills directory:
python3 video-edit/install.py --dest /path/to/agent/skills
```

Each command installs the custom video-edit plus all 36 companions (37 skills total). Codex defaults to `$CODEX_HOME/skills` or `~/.codex/skills`; OpenCode uses `$XDG_CONFIG_HOME/opencode/skills` or `~/.config/opencode/skills`. Run `--check` for a read-only audit. Repeating an identical installation changes nothing. Differing existing copies are preserved; `--replace` explicitly saves ZIP backups under the destination's `.video-edit-backups` before replacing them.

A generic skill loader or a manual copy does not execute post-install hooks. If video-edit was copied by itself, its workflow checks for companions on first use and installs missing copies from the bundled archive:

```bash
python3 /path/to/video-edit/install.py --companions-only --keep-existing --dest /path/to/agent/skills
```

This operation is within the creator's explicit request to install these companions automatically. With `--keep-existing`, differing companions remain untouched while missing ones install; report preserved differences. Use `--quiet` to omit unchanged entries. `doctor` reports missing/different companions. Do not scan or reload all 36 companion skill bodies on every edit.

## Load only the guidance the edit needs

- Existing HTML/canvas edit: keep the current renderer and template. No migration to React or WebGL just because more skills are installed.
- SaaS/typography transition: load `gsap-core`, `gsap-timeline`, and only the relevant plugin/performance reference. Build a paused timeline and seek it from output time; browser wall-clock playback must not control exported frames.
- Real 3D explanation: load `threejs-fundamentals` and the relevant geometry/materials/lighting/animation skill. Set transforms from absolute output seconds. For mixers, set the sample time explicitly; do not accumulate real-time deltas during export. Await assets and render completion before capturing the 3D canvas into the shared video compositor. A DOM/WebGL animation beside the video canvas is not automatically present in the exported MP4.
- A Remotion project or an explicitly chosen React composition: load `remotion-best-practices`, then the focused markup/caption/render references. Verify APIs against the project's installed version. Reuse source/output mappings and measured Tamil word times. Do not re-transcribe with cloud tools just because an upstream caption example uses them.

The creator has explicitly asked this workflow to deliver finished videos. Remotion's general preview-only default does not cancel that authorization. Preserve 1× speech, truthful story cuts, editable controls, licensed assets and the actual insta-follow-2.mp4 outro across any chosen rendering backend.

Skill installation supplies guidance, not runtime libraries or automatic backend integration. Install npm/pip dependencies into the actual project only when the edit requires them; do not install every possible package globally. Check the runtime package's own license when adopting it; a skill-document license does not license unrelated assets or libraries.

## Refreshing the bundle

Clones live in this workspace's `vendor-repos/`. Ordinary installation is offline and never pulls newer upstream instructions silently. To upgrade, inspect the new commits and their skill inventory, recreate the archive and lock from those exact snapshots, retain notices, test the installer, and repack video-edit.zip. A render or style edit does not require updating the skill repositories.

## Refresh the RunComfy snapshot

After reviewing a local clone, run `python3 scripts/bundle_runcomfy.py --repo /path/to/runcomfy-agent-skills` from this package. It verifies the existing payload, pins the clean upstream commit, applies the templates in assets/companion-wrappers, preserves upstream instructions/license, updates hashes and verifies the complete rebuilt payload. This is a maintenance command; ordinary installs use the bundled archive offline. Repack the outer video-edit.zip after updating.
