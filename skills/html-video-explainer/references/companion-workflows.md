# Relevant companion capabilities

Use these only when the requested outcome needs them. Discover availability in the current agent; do not assume another host has Codex tools, subscriptions, credentials, or plugin access. Read an invoked companion's actual instructions before using it. The base editor works without these services. The explicitly requested `session-story` skill package is installed automatically; its runtime and private-history workflow are not run during installation.

| Need | Capability to use when available | Expected handoff |
| --- | --- | --- |
| A film about the user’s real sessions with their agent | Automatically installed `session-story` companion | Follow its own sourced-story, history-authorization and line-review workflow; see `session-story.md` |
| Photorealistic illustration, transparent product cutout, custom texture | `imagegen` skill / image-generation tool | Local bitmap, honest generated-asset credit, suitable crop/resolution |
| A real mesh with depth and material lighting | `3d-model-generation` skill | Local GLB/other supported model plus textures, usage terms, actual viewer/render integration |
| Spoken narration instead of the creator's camera voice | Available AI voice generator or user-supplied recording | Local audio, duration/word timing if provided, independent camera/voice controls |
| An explicit Figma design or animated Figma reference | Relevant Figma design/motion skill | Implemented design/motion with real layout and easing fidelity |
| Actual newly generated action footage | An available video-generation tool, if requested | A real video file; do not describe a panned still as generated live-action footage |
| Exact captions from an arbitrary recording | Available transcription/alignment tool or supplied SRT | Timestamped text; verify important words and preserve the user's language |

Use supplied footage for real people/products when that is what the video needs. Avoid irrelevant stock imagery. Fetch/download licensed assets from suitable primary sources and keep source/creator/terms in `SOURCES.md`. An image-search thumbnail is not a licensed original.

## Realistic visual treatment

Use one coherent light direction, plausible materials, consistent camera perspective, crisp silhouettes, and restrained depth-of-field when a photo/3D treatment helps explain the subject. A camera move should reveal a relationship or detail. Combine actual imagery with precise SVG/Canvas callouts rather than drawing illegible text into a generated bitmap.

For editorial 2.5D work, separate foreground/background with clean masks, keep parallax small, and avoid stretching faces or products. Describe this honestly as animated imagery. For real 3D, integrate and test the model, lighting, browser rendering/capture, loading, and export. A file existing on disk is not proof that a 3D shot works.

Avoid adding 3D simply because it is available. Code/SVG is usually better for icons, UI, charts, text, and exact morphs. Keep fonts/local assets embedded so a screenshot or file:// export is not blocked by cross-origin loading.

If a companion is unavailable, complete useful local work with supplied assets or a deliberate diagram, and state the specific missing asset/voice/model. Do not install unrelated skills, send messages, publish a design, or create paid-service dependencies without the user's scope calling for it.
