# Signature sound / integration preview

Run `npm run studio` and open the printed loopback URL; the packaged camera footage loads automatically. The source footage lasts 8s; the total with the brand outro is 10s. Use Visuals/Captions to edit; drag the divider to change the split. Save template preserves this edit. Save brand exports style only for new recordings. Project camera footage loads automatically beside the HTML.

For local rendering: `npm install`, `npx playwright install chromium`, then `npm run render`. This renderer automatically includes camera-edited.mp4, its original-speed speech, and the sound mix. Use `npm run preview:frames` first. A draft is not final: finish custom visuals, validate the plan, and set video.project.json is_demo to false only after reviewing the actual frames.

Changing the recording requires a new transcription/alignment; automatic clip fitting is disabled for this measured-caption project. Cosmetic caption edits preserve word times where possible; adding/removing words falls back to unhighlighted chunks until re-aligned.

The original file was not overwritten. Source-to-edit.json maps every kept clip. Captions.srt is in final edit time; evidence/transcript.json remains in source time. Inspect speech at each cut and uncertain ASR names before sharing.
