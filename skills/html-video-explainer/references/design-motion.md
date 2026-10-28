# Concept-specific design and motion

Read this when planning a new visual explanation. The starter's editor is reusable; its Codex story is only a demonstration.

## Pick the explanatory device

| Concept | Useful visual mechanism | Avoid |
| --- | --- | --- |
| How something works | Parts assemble; a signal, material, or value travels through them | A paragraph beside unrelated photography |
| Before/after | Match the same object and camera position across the change | Two unrelated stock photos |
| A comparison | Shared baseline and scale; differences highlighted sequentially | Invented numbers or inconsistent scales |
| A process/tutorial | One action per beat, with a visible result | A tiny complete interface nobody can read |
| A numerical idea | Counts, proportional bars, timelines, accumulation | Decorative charts without an explained quantity |
| An abstract idea | A stable, explicitly labelled metaphor that changes with the explanation | Swapping metaphors on every cut |
| A product/brand | Actual product assets, a clear use, a demonstrated payoff | Unrequested Codex/Claude branding left in the template |

Write a compact storyboard before coding: start/end, narration, on-screen words, visual action, and sound cue. Deliver the resulting recording sheet, not a long internal planning essay.

## Readability and hierarchy

Use the viewer's language. A short reel can often carry about 2–2.7 spoken words per second, but a new technical term or demonstration needs space. Check each shot's read speed. A 25-second default is not a command to cram every concept into 25 seconds.

Use one dominant message per shot. Let diagrams explain relationships instead of repeating all spoken words. Keep captions legible against camera footage; avoid covering the face. The default coral/light/charcoal system is a starting point, not a required brand palette. Preserve user-supplied brands and fonts where available.

Photographs should contribute context or a concrete example. Use actual subject matter: a leaf for photosynthesis, components for a machine, relevant product views for an ad. Create precise SVG/code icons rather than mixing emoji, mismatched stock icons, and random stickers. Use generated imagery when it provides a needed image that available photography cannot supply, and follow the active environment's image-generation instructions.

## Motion grammar

- Establish an object before moving or transforming it. Preserve its identity through a match cut or morph.
- Use acceleration and settling instead of constant-speed drift. Keep animation based on time, not frame count or unconstrained physics.
- Alternate explanation holds with short active transitions. Fast pacing comes from meaningful changes, not continuous jitter.
- Draw connecting lines while a relationship is explained. Reveal a chart after establishing its reference or units.
- Use clipping, masks, crops, and scale changes to direct attention. Do not stretch photos, text, circles, or logos to fill a new split height.
- A true path morph needs matching topology or a deliberate resampling scheme. If that is not practical, use a clean masked transition; never disguise a broken shape interpolation as a finished morph.
- Reserve 3D for concepts where depth helps. Avoid unrelated floating rings, spheres, and spinning objects.
- Keep scene backgrounds and boundary wipes consistent. Check first frame, last frame, entrance, exit, and the exact handoff between scenes.

## Reuse without making a complicated editor

Keep primary actions visible: add/replace a clip, drag/reframe, choose layout, edit a caption, export. Put fine per-scene wording in the existing expandable section. Prefer a useful default and a few presets to a large settings panel. Retain keyboard/touch alternatives for timing and framing controls.

Before delivery, view at phone size. Captions, the main idea, and the graphic relationship must still be understandable. Do not judge a reel only from a full-size desktop canvas.

## Palette and template references

The starter supplies Coral studio (`#D76A4E`), Cobalt clarity (`#3D5AFE`), Mint signal (`#087F5B`), Violet motion (`#7950F2`), Rose editorial (`#D6336C`), and Monochrome (`#171C22`). All use white/charcoal neutrals. Select with scaffolder `--palette` or the runtime **Template → Story + script → Color palette**. Per-scene accents stay independent. A supplied brand hex overrides the preset.

Use the advanced `about` style for varied concept-specific diagrams, editable visual images, and precise scene timing. Use `video1` when the user wants the original photo/code/editing direction. Borrow composition/motion relationships, then replace unrelated content. Avoid flattening all requests into the same demo.

Separate hierarchy from ornament: one dominant message, one explaining visual, limited supporting copy, consistent stroke/spacing, and controlled image crops. Use a quiet background and make the subject carry the energy. Readability is more important than a particular palette name.
