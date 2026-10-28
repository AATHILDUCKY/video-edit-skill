---
name: runcomfy-cli
description: Set up, authenticate and use the RunComfy CLI for explicitly requested RunComfy model jobs, schema discovery, status checks and output downloads. Companion guidance for runcomfy-video-edit.
license: MIT
---

# RunComfy CLI companion

Read [references/upstream.md](references/upstream.md) for the complete pinned upstream CLI guidance, supported commands, authentication and runtime installation options. The skill files are installed with the creator's bundle; installing them does not install the CLI binary, sign in, upload footage or submit paid model requests.

Apply setup or cloud-job steps only within the current user's request. Confirm current CLI/model documentation before relying on the snapshot's flags, model identifiers or limits. Keep tokens out of logs and source files. For cloud video transformations, use the sibling `runcomfy-video-edit/SKILL.md`; normal captions/cuts/rendering continue through the local `video-edit` skill.

The original MIT notice is in LICENSE.txt. Source provenance and hashes are recorded in the parent video-edit package's dependencies.lock.json.
