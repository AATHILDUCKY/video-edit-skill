# Choose motion from the content

Read for a new film concept, product showreel, business explainer, or reference-led motion request. The user's four prompt examples are recipes, not mandatory scenes for every video. Never turn a concept explainer into an abstract reel solely to display techniques.

## Choose a direction before storyboarding

| Content/goal | Suitable direction | Useful recurring object | Needed evidence/assets |
| --- | --- | --- | --- |
| A software product or real workflow | Product UI showreel; cursor-driven interaction; measured camera crops | An actual cursor, button, logo detail, or real data element | Verified product purpose/audience, real UI/brand, 3–6 interface captures or equivalent source access |
| A process or educational mechanism | Clear animated explainer, parts transform to demonstrate causality | The material, signal, item, or quantity being explained | Correct mechanism; only use diagrams/data that support it |
| A business/service proposition | Problem → offer → three steps → real proof → brand/CTA | The customer's task/result or a real brand element | What it sells, who it serves, actual proof/source; never fake testimonials, KPIs, or customer counts |
| An abstract portfolio/showreel | Kinetic type → compatible shapes → dimensional moment → UI/data → end title | One shape, glyph, stroke, or geometric module | One named concept, a deliberate palette, coherent technique progression |
| A graphic looping film | Dot/toggle/type/spring/shape/halftone loop when these suit the idea | One dot or other continuous graphic object | Selected words, graph parameter, final card, colors, beat map |
| A personal reel/talking head | Existing split editor, concept-specific illustrations above, real camera below | A consistent explanatory motif | User's script/clip; editable visuals/captions, original-speed footage |
| A story about the user's work with their agent | `session-story` companion when actually requested | Its source-backed narrative objects | User-authorized session material; follow that skill's history and line-approval gates |

Name the concept and recurring object in one line, then show a concise creative brief: audience, takeaway, aspect ratio, duration, palette/type, motion language, and asset plan. Show the storyboard and continue building when the user asks to proceed without further questions. Do not introduce a storyboard approval gate unless requested. Ask only for essential missing input; batch optional choices with defaults. A prompt saying “ask for inputs / show four stills first” is a different requested review sequence and should be followed for that job.

## Research-led product work

Research a named product before claiming what it does. Prefer its real site, documentation, provided screenshots, and live interface. Record an evidence ledger for claims, screen/state, URL/source, asset origin, logo, font, and colors. Capture the requested real screens yourself when available and authorized; do not invent a dashboard, feature, usage number, or screen behind an unavailable login. If a reference video is supplied, download/inspect actual frames and timing when access permits; otherwise state that it is missing and choose a disclosed direction.

Rebuild the observed UI as independently animatable SVG/DOM/Canvas parts for UI showreels. Screenshots are research references, not a substitute for moving layers. Keep reconstructed labels/layout/states faithful and avoid implying a click/drag does something the product does not do. Drive interactions with a visible cursor and sound at contact. Measure element bounds after fonts/layout load for match cuts and cursor targets, rather than guessing coordinates.

One font and one principal accent are a strong default for product motion. Use the actual brand when supplied or verified, even if it differs from the packaged palettes. Use the accent to track the recurring object or key word; retain only necessary native UI colors. Keep other elements quiet. A clean screen-studio push should show a relevant interaction, not obscure the product behind decoration.

## Beat planning

For expressive motion films, default to 120 BPM when the user has not chosen a track/tempo. At 120 BPM one beat is 0.5s and a four-beat bar is 2s. A 30s film has 60 beats; a 15s film has 30 beats (7 full bars + 2 beats). Do the arithmetic; do not call 15s eight bars.

List every beat with time, scene, object state/action, incoming/outgoing copy, camera/framing, and sound. Something meaningful changes on every beat: a mask, line, relationship, camera move, interaction, or reveal. Readable text can remain while the mechanism evolves. Do not flash unreadable copy just to avoid a hold.

If five scenes must share 30s equally, each gets 6s/12 beats. If five techniques must share 15s equally, each gets 3s/6 beats even though boundaries cross bars. If the user prioritizes whole bars instead, state the allocation and use the last two beats as the end/loop. Preserve explicit seconds and resolve conflicting counts before claiming exact timing.

A useful 15s whole-bar showreel allocation is: hook 0–2, kinetic type 2–4, morph 4–6, dimensional turn 6–8, UI/data 8–10, synthesis 10–12, strongest moment 12–14, end/loop 14–15. Adapt this to the concept; these are timing slots, not generic visuals to recycle.

## Connected motion grammar

Prefer controlled closed-form springs (small overshoot) and exponential eases. Geometry should grow, unfold, move, or be exposed by a mask from an existing object. Avoid crossfades and disconnected cuts in a continuous-film request. Match position, scale, shape topology, velocity, and camera state at handoffs. Never fake an incompatible path morph by distorting shapes.

Use one consistent camera language. For the user's continuous screen-studio treatment, accumulate the gentle 1.00→1.04 scene push from the previous ending zoom. A loop must return camera, cursor, shape and typography to the opening state; plan that return instead of snapping zoom back. Make motion blur depend on speed/direction and keep reading holds sharp.

For the dot/spring recipe, the dot and graph use the same analytical spring response. A displayed overshoot percentage must agree with that response, not be a random label. A designed spring parameter is not a business KPI. Type-to-dot attachment should come from measured glyph geometry. A grid/halftone is deliberate geometry; it is not a random particle burst. Scale any full-frame circle/mask past all four corners. Give outgoing and incoming text separate windows so letters do not overlap.

For these premium motion directions, avoid particles, glows, lens flare, camera shake, RGB split, generic gradients, bouncy easing, and arbitrary transitions. An explicit warm off-white art direction overrides the default white/coral template. Use up to three deliberate colors plus black/white for abstract work unless the user's brand requires otherwise. Generic template-looking shots are a cue to redesign around the concept's object, not a reason to remove useful editing controls.

## Render mode

Keep the existing split editor for normal reels. For a requested single-file 1920×1080 deterministic film, use `scripts/create_motion_film.py` and read `references/motion-film-build.md`. Frame composition must be a pure function of `window.seek(t)`. No CSS animations/transitions, timers, random state, or previous-frame simulation may drive the film. A preview controller may call seek; the seek result must remain independent of that controller.

The helper is an editable neutral motion shell, not a finished original film. Rebuild its draw function, copy, geometry and camera for the concept. Use the Web Audio offline score or a licensed measured track. Inspect one frame per beat before full export; then render 60fps with three temporal samples per frame when requested. Never claim a showreel or motion-blur render exists from a storyboard alone.
