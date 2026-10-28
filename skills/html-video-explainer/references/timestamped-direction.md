# Second-by-second direction

Use when the user says “at 3 seconds…”, gives shot windows, or requests specific actions inside a scene.

## Convert the request

Build a table of global start/end, on-screen copy, narration, visual action, assets, and sound. Respect user-specified times first. Fill unspecified intervals with useful setup, a held shot, or a motivated transition. When directions overlap, compose layers in one scene if compatible; ask only if the instructions cannot coexist. An explicit gap needs an explicit hold, not an accidental blank frame.

Keep scene identity (`kind`) stable and unique. Reusing a visual does not require reusing its identity: two shots may have different IDs and the same `preset`. The editor saves caption and timing data by identity. Never reorder saved text by array index.

## Plan format

```json
{
  "duration": 10,
  "scenes": [
    {"kind":"security","preset":"cybersecurity","start":0,"end":3,
     "title":"Protect your ideas.","voice":"Start with security.",
     "audio":[{"at":0.1,"type":"impact","gain":0.2}],
     "beats":[{"at":0.4,"action":"Packets reach the shield; its checkmark draws on."}]},
    {"kind":"board","preset":"arduino","start":3,"end":7,
     "title":"Build something real.","voice":"Connect the board and bring an idea to life.",
     "beats":[{"at":1,"action":"Trace lights up."},{"at":2.5,"action":"LED turns on."}]},
    {"kind":"follow","preset":"follow-tech","start":7,"end":10,
     "title":"Your kind of tech?","emphasis":"Tap follow.",
     "voice":"If this is your space, tap follow.",
     "audio":[{"at":1.4,"type":"click","gain":0.2}]}
  ]
}
```

`start/end` are **global seconds**. `audio[].at`, `typing.start/end`, and `beats[].at` are **seconds inside that shot**. In the board example, a beat at `1` occurs at global `4s`. `duration` and the last end must agree. Windows must be contiguous, ordered, and positive. `images` may optionally map asset keys to existing files inside the project.

Apply with `scripts/apply_timeline.py PROJECT PLAN.json`. The helper validates windows, writes `timeline.json`, replaces storyboard data, clears runtime scene weights, and sets `targetDuration` to the plan length. Exact mode sets `autoFitVideo=false`; normal-speed footage can be trimmed/positioned without silently moving the requested shots. Enabling upload matching later is a deliberate retiming choice.

Custom caption wording/timing is retained and proportionally adjusted if the total duration changes. Use `--reset-captions` only when replacing those captions is intended. `captionCues:null` automatically derives captions from scene narration.

## Implement, don't just label

`beats` are direction metadata for the agent, not a built-in animation engine. The scene renderer must actually implement them. Use the supplied preset only if its content and timing fit the request; otherwise write a custom renderer. If a renderer is authored in a different natural timebase, set `motionDuration` intentionally and translate beat times into that timebase. Never copy a demo's internal delays while promising different event times.

For a newly authored shot, using `motionDuration` equal to its source duration makes local event times direct. Example:

```js
window.CONCEPT_VIDEO_SCENES.board = (scene, t, h) => {
  h.bg();
  if (h.visualPass !== 'art') h.reveal(scene.title, 540, 172, 88, t);
  // Draw the board from the start; the LED settles on at local 1s.
  const led = h.enter(t, 1, .18);
  h.box(280, 400, 520, 300, '#087f91', 24);
  h.ctx.beginPath(); h.ctx.arc(710, 470, 18, 0, Math.PI*2);
  h.ctx.fillStyle = led > .5 ? '#d8fc9e' : '#245d65'; h.ctx.fill();
};
```

When the user says “the LED is fully on at 4s”, account for its entrance duration: start an 180ms animation at 3.82s. When they say “start at 4s”, start there. Match the click sound to visible contact, not the beginning of cursor travel.

After implementation, rebuild audio/media and inspect just before, at, and after every specified beat and boundary. Check the actual video output at those seconds. Runtime proportion edits and loaded templates need the saved timing plan for rendering (`npm run render -- --template saved-template.json`).


A plan may include global `captionStyle` and a scene's `captionStyle` override. Scene overrides target automatic cue ID `scene-<kind>`, preserving automatic scene/caption timing. For independent custom captions, edit that cue's `style` or the `captionStyles` entry for its actual ID. Use normalized x/y and master font sizes as documented in `template-api.md`; keep caption appearance separate from shot timing.
