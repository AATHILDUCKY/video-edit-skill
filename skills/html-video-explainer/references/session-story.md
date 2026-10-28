# Installed companion: session-story

Source: [heygen-com/hyperframes-community-skills](https://github.com/heygen-com/hyperframes-community-skills/tree/ba7a0bb6d3567d124c51f6074625043bfe0b32eb/skills/session-story).

The user's upstream command is:

```sh
npx skills add heygen-com/hyperframes-community-skills --skill session-story
```

Our installer also installs this companion as a sibling of `html-video-explainer` in the selected agent's skill directory. The package contains a pinned, unmodified source snapshot and upstream license/notice files inside `assets/companions/session-story.zip`. `companions.lock.json` records its origin, revision and checksum. The installer normalizes only an angle-bracket placeholder in the upstream metadata description for Codex validation; it preserves the exact original in `UPSTREAM-SKILL.md.txt` and records this in `UPSTREAM.json`. Workflow instructions are unchanged. This gives repeatable local installation without requiring npx or network access each time. A direct upstream CLI install remains available independently.

Installation copies skill files only. It does not run `setup.sh`, install npm libraries, harvest local transcripts, generate a session film, or connect a paid service. The upstream skill's runtime dependencies and setup remain its own workflow. Do not misreport copied skill files as a working HyperFrames/music-rendering environment.

## When to use it

Invoke it for a film about the user's actual sessions with their agent. Read the installed companion's own `SKILL.md`; do not substitute it for ordinary product marketing, an abstract motion reel, or a content explainer. Its watercolor/room/objects/orchestral treatment is a specific story form, not the default design for every video.

The upstream workflow explicitly requires the user's yes before local transcript access, source-backed real lines, and approval of on-screen lines before rendering. Installing this skill does not grant that permission. Do not harvest history during installation or for an unrelated concept. Follow its own scope, rendering and review requirements when that workflow is actually requested.

Other companion capabilities in `companion-workflows.md` remain conditional. `session-story` is the one explicitly requested automatic installation dependency; do not silently add the entire HyperFrames community collection.
