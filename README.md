# I edit videos with HTML — Codex short template

The [video-edit bundle](skills/video-edit/SKILL.md) now installs all 37 included skills together: your custom editor plus Remotion, GSAP, Three.js, FFmpeg and RunComfy companions. Run `python3 skills/video-edit/install.py --agent codex --agent opencode`. RunComfy’s upstream video-edit is namespaced as runcomfy-video-edit, with runcomfy-cli guidance beside it.


Latest supplied-footage edit: [Codex Reel — final video](codex-reel/instagram-ready.mp4) · [HTML editor](codex-reel/edit-v1/edit.html) · [edit notes and verification](codex-reel/QA.md). This 22.87-second edit uses original voice, timed captions, GSAP motion, an actual editor capture, subtle CC0 effects and the supplied signature outro. The previous [My niche edit](my-niche/instagram-ready.mp4) remains available.


Open `video1.html` in Chrome or Edge. The workspace has the video preview on the left, a caption editor on the right, and a timeline below. The default video layout is an equal split, with animated visuals above and your camera footage below. Drag the divider or use the layout presets to choose each section's height. The exported composition stays 1080 × 1920 and 25 seconds long.

The reusable video-edit skill now keeps spoken captions in the bottom section, with automatic bottom anchoring above Instagram’s reserved footer. Placement controls and split limits keep captions inside that section for future edits. Its active-pacing guidance now calls for shorter text holds and frequent meaningful cuts/visual beats, with four-word/about 1.6-second caption chunks by default and full spoken meaning preserved.

For supplied-footage editing, the skill now starts with a compact cache/skill preflight and reuses matching analysis, assets and the shared editor. See the [efficient workflow](skills/video-edit/references/efficient-workflow.md) for focused companion routing and revision commands.

## Make your short

1. Open **Template → Your footage** and choose **Balanced**, **More camera**, or **More visuals**. The slider and preview divider adjust the animated section from 30% to 70% of the height.
2. Read the clean script in **Story + script**, make any changes, and record your talking-head clip.
3. Click the bottom section, drop a clip onto the preview, or choose **Template → Your footage**.
4. Choose **Reframe**. Drag the image to select your area, zoom with the slider or scroll wheel, and choose **Done**. On a phone, drag with one finger or pinch with two fingers.
5. Preview with sound, then choose **Export**. Your selected layout and crop are composited into one video, with captions and sound. Save the template once; for the next reel, load it and replace the clip.

MP4 is preferred; browsers without MP4 recording support fall back to WebM. Keep the tab visible while a browser export runs. The supplied `codex-html-template-1080x1920.mp4` is a frame-accurate preview of the template with the empty camera slot. Add your footage and use Export for your finished short.

## Edit captions like a video editor

1. Select a caption block in the bottom timeline, or select its card in the right panel. The video jumps to that caption.
2. Edit **Caption text** on the right. The preview updates immediately.
3. Drag the whole block to move its timing; drag either edge to trim its start or end. The start/end fields let you enter precise seconds. Neighbouring captions stay in order.
4. Move the timeline cursor and use **Start at cursor** or **End at cursor** to match a spoken phrase. **Preview** plays only the selected caption's range.
5. Use **Add**, **Split**, or **Delete** to change the caption track. Undo/redo restores text and timing changes. Timeline plus/minus buttons zoom in for shorter phrases; **Fit** shows the whole video.

Caption text and timing are independent of the animation shots and the recording script, so retiming a subtitle does not move a scene. Gaps are allowed. Empty text is not rendered. Start/end fields and dragging prevent overlaps and keep captions inside the 25-second video.

**Export SRT** downloads your edited subtitle timings. **Save template** includes the caption track, and edits also persist in this browser. **Use script captions** restores the narration-based defaults; Undo can restore the edited version. Before any caption edits, changes to the narration still update the default captions automatically.

Keyboard: arrow keys move a focused caption block or trim a focused edge by 0.05 seconds; Shift changes this to 0.25 seconds. Delete removes the selected caption. Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z undo/redo when the caption workspace is focused; normal text undo remains available inside the text field. The ruler also supports arrow-key scrubbing. On phones, the timeline and caption panel stack below the preview.

Only the video canvas is exported. The right panel, timeline, cursor, and handles are editing controls and do not appear in the finished video.

## The recording script

> I made this reel with HTML. Here’s how. First, I asked Codex to build an HTML template. It animated the visuals, timed the cuts, and added sound effects. Then I added my clip and adjusted the frame. I previewed it, tweaked the timing, and exported the video. Now I can reuse it. New clip, same template.

This is a 56-word read, averaging about 134 words per minute. Speak naturally and pause briefly after “Here’s how.” **Story + script** includes a clean reading card, a clean-copy button, and each timed line. `codex-reel-narration.txt` is the clean read; `codex-recording-script.txt` includes timings and visual/sound cues. `codex-script-captions.srt` contains the matching planned captions.

| Time | On-screen visualization | Sound cue |
| --- | --- | --- |
| 0.0–4.0 | “This reel is HTML.” Editing photo wipes into HTML code | Impact, code snap |
| 4.0–8.0 | “Ask Codex. Describe the edit.” Prompt types and runs | Keyboard clicks, run confirmation |
| 8.0–9.5 | “Animated visuals.” Three relevant editing photos | Photo pops |
| 9.5–11.0 | “Timed cuts.” A timeline splits under a scissors icon | Edit snap |
| 11.0–12.5 | “Sound effects.” Animated waveform and sound icons | Stereo ping |
| 12.5–16.5 | “Add my clip. Find my frame.” Split diagram points to the footage | Downward whoosh |
| 16.5–21.0 | “Preview. Refine. Export.” Action icons and export progress | Click, sweep, download chime |
| 21.0–25.0 | “New clip. Same template.” Codex end card | Short resolution and hold |

## Choose the area of your footage

The **Reframe** button appears over your loaded bottom clip when paused or hovered. It opens the live bottom section preview. The same framing math is used in this preview and in the exported canvas.

- Drag the preview to move your shot. Scroll or pinch to zoom from 100% to 300%.
- **Fill** covers the entire bottom section and keeps the edges inside the crop. **Fit all** starts with the whole original shot visible, with dark borders when the aspect ratios differ.
- Horizontal and vertical sliders provide precise positioning; **Centre video** recentres without changing zoom. **Reset frame** restores the original fill crop.
- Arrow keys nudge the image while the framing preview is focused; Shift makes a larger move. Plus/minus zoom, and Home resets.
- The thirds grid and caption guide help place your face. These guides and the player controls are excluded from exports.

Mirror, clip start time, looping, camera sound, and the soundtrack mix remain available. Replacing the clip reuses your saved framing to reduce repeat work. Use **Reset frame** for a fresh crop; your top animation and story remain intact.

## Reusing the template

The three tabs cover layout/footage, story/look, and sound. Edit your creator name, accent colour, prompt, and captions in **Story + script**. **Edit individual scenes** expands the optional scene-by-scene wording controls; leave it closed for quick reuse.

**Save template** downloads a small JSON file with your layout, wording, prompt, colour, crop, mirroring, sound settings, and edited captions. **Load template** restores it without replacing your selected clip. The duration stays 25 seconds. Edits also save automatically in this browser. Camera files require reselection after a reload and never upload to a server.

The source configuration is `assets/codex/template.js`; edit it to set reusable defaults. Keep the scene durations when using the supplied sound effects. Captions initially use the planned script timing, with the current word highlighted. The right panel and timeline can then retime them to match your recording. They are manually editable captions, not automatic transcription of an uploaded clip.

The sound effects and rhythm bed have separate volume controls. Camera audio stays at full level by default, with effects at 60% and the rhythm bed at 12%. **Real keyboard sound** enables a recorded mechanical keyboard during the visible prompt typing interval, approximately 4.47–7.00 seconds. The recording keeps its natural pitch and stops once typing finishes. Editing the prompt preserves the same typing window. The speaker button only mutes preview monitoring; the selected mix is included in the exported file.

Space plays/pauses, R replays, M toggles preview sound, F enters full screen, and arrow keys scrub in quarter-second steps. Reduced-motion users get a static opening until they choose Play.

The runtime uses no CDN or framework. Fonts, photographs, and compressed AAC tracks are embedded in local assets so direct-file playback, canvas export, and Web Audio mixing work without a server. Keep `assets/codex` beside the HTML.

## Rebuild the preview master

With FFmpeg on your path:

```sh
npm install
npx playwright install chromium
npm run render
```

`npm run preview:frames` saves scene and player previews in `renders/codex`. Optional environment variables: `CHROME_PATH`, `FFMPEG_PATH`, and `PLAYWRIGHT_MODULE`. The renderer captures exactly 1500 frames at 60 fps from the default template and adds the selected default sound mix.

To regenerate sound, run `python3 scripts/make-soundtrack.py` with NumPy installed, then `python3 scripts/bundle-media.py` with FFmpeg available. The bundle step updates the embedded AAC audio and fonts used by the page.

Run `python3 scripts/export-script.py` after editing the source template to regenerate the clean narration, timed recording sheet, and SRT file.

## Validation

Checks cover a permanently reserved bottom section, 320/390/768/1440 pixel layouts, editable and persistent story text, captions, uploaded camera footage, clip offset, framing, mirroring, independent sound levels, end-card hold, reduced motion, and a successful camera MP4 export after cancelling an earlier export. The direct-file audio check confirmed real sound samples without browser access flags or CORS errors. Results are saved in `renders/codex/validation.json`.

Additional framing checks cover portrait and landscape sources, mirrored dragging, mouse and keyboard positioning, wheel zoom, real two-finger pinch input, fill/fit, reset, narrow layouts, and a complete 25-second camera export after cancellation. The live framing preview and the exported composition were checked for identical source pixels. Results are in `renders/codex/framing-validation.json`.

Layout/reuse checks cover 30/40/50/60/70% section heights, exact crop-preview pixels at each height, divider dragging and keyboard control, recorded keyboard audio and its toggle, saved-template round trips, retained framing on replacement clips, automatic reload, mobile sizing, and a complete export with a custom split. Results are in `renders/codex/reuse-validation.json`.

Caption checks cover the sidebar/timeline layout, independent text, numeric and cursor-based timing, dragging, edge trimming, overlap protection, split/add/delete, undo/redo, live preview and gaps, SRT output, saved-template caption tracks, reload persistence, narrow screens, and a complete camera export with edited captions. Results are in `renders/codex/caption-validation.json`.
