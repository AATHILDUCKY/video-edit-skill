---
name: runcomfy-video-edit
description: Use RunComfy for specifically requested cloud video restyling, background or outfit changes, or reference-driven motion transfer. Use the local video-edit skill for normal Reel cuts, captions, audio mixing and HTML editing.
license: MIT
---

# RunComfy video transformations

This is the namespaced companion to the creator's local `video-edit` workflow. The upstream skill is also named `video-edit`; its complete, pinned instructions are preserved in [references/upstream.md](references/upstream.md). Read those model routes when the current task actually calls for RunComfy transformations, and read the sibling `runcomfy-cli/SKILL.md` for setup, authentication and schema discovery.

Installing this guidance does not submit a cloud job or authorize uploading a recording or spending credits. Keep ordinary Reel editing local. When RunComfy use is within the user's request, verify the current model's documented input schema, authenticate through the CLI, and preserve the requested identity, motion and audio. Request original audio where supported; otherwise retain and mix the original source track at 1× through the local workflow. Generated inserts return to that workflow for content review, bottom-section captions, Instagram composition and the signature outro.

The actual `@runcomfy/cli` runtime and account login are separate setup steps, documented by the CLI companion. The original MIT notice is in LICENSE.txt. Repository, upstream/installed names, source commit and file hashes are recorded in the parent video-edit package's dependencies.lock.json.
