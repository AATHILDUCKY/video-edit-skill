# RunComfy companion installation

The creator requested `npx skills add https://github.com/prime-skills/runcomfy-agent-skills --skill video-edit`. The upstream name collides with the creator's established `video-edit` skill. This package installs the selected RunComfy guidance under a separate name and includes its CLI companion:

| Upstream path/name | Installed sibling | Purpose |
| --- | --- | --- |
| `video-edit` | `runcomfy-video-edit` | Intent-routed cloud video restyling, background/outfit changes and reference motion transfer |
| `runcomfy-cli` | `runcomfy-cli` | Runtime setup, authentication, model-schema discovery, jobs and downloads |

Both come from [prime-skills/runcomfy-agent-skills](https://github.com/prime-skills/runcomfy-agent-skills). Each installed skill has a focused integration wrapper, the complete original `references/upstream.md` and `LICENSE.txt`. The upstream MIT notice is also retained in assets/companion-notices/runcomfy-agent-skills. `dependencies.lock.json` pins the exact repository commit and separate upstream/installed tree fingerprints. Existing Remotion, GSAP, Three.js and FFmpeg companions remain included.

## Automatic installation

Run the custom package's `install.py`; it installs all **37 skills** (custom editor plus **36 companions**) to the chosen agent. From this workspace:

```bash
python3 skills/video-edit/install.py --agent codex --agent opencode
python3 skills/video-edit/install.py --agent codex --agent opencode --check --quiet
```

From the extracted portable package, use `python3 video-edit/install.py`. The payload is bundled offline; no npx/npm execution or account login is needed to copy these skills. Missing companions can also be recovered through the existing first-use `--companions-only --keep-existing` workflow. A generic npx/manual copy of the parent skill does not execute Python installation hooks: use the complete installer for installation-time dependencies; first-use recovery handles a parent-only copy.

## When to load it

For local footage trimming, source-audio preservation, timed captions, HTML editing, Instagram margins and a branded Reel, continue using the custom `video-edit` workflow. Load `runcomfy-video-edit` when the current task actually requests RunComfy/cloud transformations. Its upstream routes and model limits are a pinned snapshot; verify the current official schema before executing a remote model request.

The actual `@runcomfy/cli` executable, account login/token and service credits are runtime requirements, not installed skill files. The CLI companion documents that setup. Installing this package does not authorize uploading footage, starting remote jobs or spending credits. An explicitly requested cloud task can provide that authorization; handle any genuinely missing setup then. No cloud account or token is needed to complete this skill installation.

Bring requested cloud outputs back into the local edit and inspect their content, identity/motion, original-audio retention and timing. Keep speech at 1×, bottom-section captions, the creator's active pacing and actual signature outro. When a route cannot carry original sound, retain/remix the original track through the local mixer rather than replacing it with generated speech.
