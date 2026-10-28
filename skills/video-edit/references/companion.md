# Installed FFmpeg companion

The user requested `npx skillfish add erichowens/some_claude_skills video-processing-editing`. It is installed separately at `~/.codex/skills/video-processing-editing`; upstream: https://github.com/erichowens/some_claude_skills/tree/main/.claude/skills/video-processing-editing . Its previously installed snapshot is now included by the offline bundle installer. Read its focused sections for FFmpeg processing tasks; do not load its full manual on every edit or overwrite our brand/editor with it.

Useful principles integrated here: re-encode precise cuts, normalize media before compositing, preserve stream offsets, use explicit maps, and export H.264/AAC with faststart. Prefer existing reusable scripts over recreating command pipelines.

Apply its examples critically. Stream-copy cuts need keyframe care; decoded/re-encoded cuts can be on any source frame. Its generic recommendation to stretch mismatched speech does not fit this creator's 1× speech contract; fix offsets/trims instead. Do not copy codec history, benchmark claims or audio tempo formulas without verification. The HTML canvas compositor remains the source of preview/export visuals.

Primary implementation references: https://ffmpeg.org/ffmpeg-filters.html and https://github.com/SYSTRAN/faster-whisper . Bundled Tamil font: https://github.com/google/fonts/tree/main/ofl/notosanstamil . Icons: https://github.com/lucide-icons/lucide .
