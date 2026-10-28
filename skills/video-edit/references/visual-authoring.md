# Visual direction and editor contract

The default canvas is 1080×1920, with original-speed footage below an adjustable motion section. Its maximum is 52% with the default Reels caption reserves, or 70% without platform margins. The top's design space is 1080×960; the compositor scales it to the selected split. Keep explanatory art approximately y=340–880, with headings above. Inspect the minimum and maximum split available in the selected platform profile. Use Manrope, white/near-black, and one configurable accent. Built-in palettes are choices, not a demand to recolor a real brand.

Choose a visual language from the recording:

| Spoken idea | Useful visual | Semantic motion |
|---|---|---|
| Repetitive work → automation | Tasks, actual input, pipeline | Repeated items join one flow |
| Hardware / computation | Memory blocks, model size, real hardware reference | Capacity fills; overflow shows constraint |
| Comparison | Two aligned alternatives, equal-scale evidence | Same object changes state; contrast one variable |
| Tutorial / interface | Real screenshots as reference; rebuild only verified UI | Cursor clicks, selection grows, result reveals |
| Process / security / network | Accurate nodes, packets, stages | Follow one request through the system |
| Physical product / making | Actual object photo or schematic | Crop into relevant part; annotated assembly |
| Opinion / personal story | Speaker, selective kinetic type | Key phrase interrupts a controlled reframing |

Never fabricate a software screen, result, statistic or testimonial. Label a conceptual illustration when it could be mistaken for a measured result. Do not force 3D on every topic; a correct diagram usually explains more than a random spinning object. Use supplied/verified assets and retain their source/license. No stock image of a hacker as a substitute for explaining a technical mechanism.

## Custom scene module

Supply `concept_js` relative to the edit plan. The builder copies it as `assets/codex/concept.js`. It must define renderers before the core loads:

```javascript
window.CONCEPT_VIDEO_SCENES = {
  automate(scene, t, h) {
    // t is local design time in seconds, rescaled when scene timing is edited.
    h.bg('#fff');
    if (h.visualPass !== 'art') {
      h.reveal(scene.title, 540, 170, 80, t, '#171c 22', 0, 920);
    }
    const p = h.enter(t, .2, .6);
    h.box(180, 430, 720 * p, 180, h.accent, 24);
    // Replace this basic shape with the explanation's own connected geometry.
  }
};
```

Use one renderer per plan id. Available helpers include `ctx`, `W`, `BASE_TOP`, `accent`, `box`, `txt`, `reveal`, `thinArrow`, `clamp`, `mix`, `enter`. Inspect signatures in short.js before using less obvious helpers. Use `h.visualPass === 'art'` to skip headings while the editor independently transforms artwork. Save/restore the canvas around local transforms. Avoid a full-canvas clear during the art-only pass that erases titles.

Compute every scene from time: no random state, cumulative physics, DOM timers or CSS animation controlling exported content. Randomness must be seeded/position-derived. Seek backward/forward must give the same image. The packaged public API is `window.codexShort`; `capture(t)` draws one frame. The renderer explicitly seeks and awaits the camera first. A new custom compositor can expose `window.seek(t)`, but do not pretend that API is already present.

For smooth transforms, use bounded exponential ease or a damped spring function of elapsed time. Keep overshoot small, preserve shape identity/position across boundaries, and avoid overlapping outgoing/incoming text. Prefer masks, expanding outlines, track movement and semantic match cuts. Hard cuts in footage are fine when meaningful. No decorative glows, particle bursts, camera shake, RGB splits, generic gradients or arbitrary spinning shapes by default. Speech determines emphasis; do not force all topics onto 120 BPM or change something every 0.5 s at the expense of comprehension.

## Editable controls

The copied editor includes caption text/start/end, timeline blocks, per-caption/global font size/position/color/background, draggable caption placement, scene start/end and preset/image controls, artwork scale/position, camera fit/fill/zoom/pan/mirror, and a draggable top/bottom divider. Preserve these controls when authoring visuals. Captions are independent of visual durations. In transcript mode, total-duration fitting is disabled so a user cannot accidentally stretch measured speech captions.

`caption_style` defaults: `fontSize:64`, normalized `x:.5`, `y:null` (automatic bottom anchor in the lower section), `maxWidth:.82`, `theme:'highlight'`, white text, dark background. Confirm available style enums in caption-style.js before adding variants. Keep captions entirely in the lower section, below the split and above the platform footer. Reserve this band before positioning the face; preview at phone size. Use 2 lines at most where practical, not huge paragraphs. Fix overflow in actual rendered frames.

Save template exports JSON; localStorage keeps a convenience copy. Media files must be reselected after reload. Offline rendering accepts `--template saved-template.json`. A new recording needs a new transcript/cut build. Browser edits to visual timing can retime existing effect buses; if an important SFX/keyword moves independently, revise the plan/audio and rebuild rather than trusting broad scene stretching.

The studio now supports true full-camera, full-motion and B-roll compositions as well as split. Use scene `layout` and preset names rather than adapting the compositor. See [brand-and-studio.md](brand-and-studio.md). Manrope falls back to bundled Noto Sans Tamil for shaped Tamil text. The deterministic capture path awaits each B-roll/outro seek as well as the camera, preventing stale auxiliary frames in exports.

## Keep the visual moving with the idea

Follow the active-pacing targets in editorial-direction.md. Plan short beat-level states before writing animation: which phrase introduces the object, which word changes it, what evidence arrives next, and when the headline leaves. A 3–4 second scene can contain several meaningful states without cutting the original speech. Author consecutive short scene intervals for different compositions; use absolute local time in concept.js for progressing one illustration. New copy should introduce the next point rather than loop the previous headline.

Keep speech captions in the bottom section throughout those changes. Use the upper area for a short headline, relevant evidence or the next diagram state. Give technical names, Tamil text and essential comparisons enough reading time. When the visual has finished explaining its beat, return to the speaker or show the next supported detail instead of holding a completed information card. Preserve source-to-output timing and verify sound after moving a visual beat.
