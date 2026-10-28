# Runtime and installation

Use Python 3.11 or 3.12 for broad dependency-wheel availability, Node.js with npm, FFmpeg (including ffprobe), and Chromium via Playwright. The Python helpers use Python 3.10+ syntax; ASR binary dependencies may support a narrower set of platforms. No paid model API is required. A local speech model downloads on first use; cached weights can then run offline. CPU int 8 is the default; GPU use is optional.

```bash
python3 -m venv .venv
# Windows PowerShell: .venv\Scripts\Activate.ps1
. .venv/bin/activate
python -m pip install -r /path/to/video-edit/requirements.txt
python /path/to/video-edit/scripts/video_edit.py doctor
```

Install FFmpeg through your operating system's package manager. `FFMPEG_PATH` and `FFPROBE_PATH` may point to existing binaries. PyAV provides metadata fallback if ffprobe is absent; FFmpeg is still required for media processing. Avoid changing system Python to satisfy this skill.

After building a project:

```bash
cd work/edit-v1
npm install
npx playwright install chromium
npm run preview:frames
npm run render
```

`CHROME_PATH` can select an existing Chrome/Chromium. `PLAYWRIGHT_MODULE` can select an existing Playwright module path. These overrides are optional, never hard-code this author's machine paths in delivered projects.

Installation copies the **entire video-edit folder**, including assets/scripts/references. Codex discovers it under its skills directory; other agents can use their own skill directory or be told to read SKILL.md directly. Installation conventions vary by host; do not assume `$video-edit` is recognized in every chat app. If the host does not support skills, supply `Read /path/to/video-edit/SKILL.md and edit /path/to/sample-video.mp4`.

Output is a folder-based HTML editor, not one self-contained HTML file: keep its assets, scripts and media alongside it. The final MP4 is standalone. The original recording, caches and model weights are not bundled with the skill.

Run `npm run studio` in the built project and open its loopback URL for the editable HTML workspace. The renderer starts its own temporary loopback server. Direct-file preview is possible, but browser security can taint canvases that draw relative video files; use the local studio for browser export. This server binds only to 127.0.0.1 and supports media byte ranges for seeking.

Install the full skill package with `python3 video-edit/install.py`; it includes all pinned companion skills offline. See [motion-companions.md](motion-companions.md). This copies skill guidance only; the Python/FFmpeg/browser runtime remains a separate setup.
