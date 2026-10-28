# Instagram composition and delivery

Research checked 2026-10-27. This creator reported the iPhone Dynamic Island/Reels header covering top animation and the description covering bottom captions. Treat this as composition occlusion: moving HTML controls or increasing bitrate cannot fix text already positioned beneath Instagram's UI.

## Evidence and practical margins

- Meta's [Reels creative guide, page 4](https://d3m889aznlr23d.cloudfront.net/img/events/458925814/assets/e042d2be.reels_ads_guide1.pdf) recommends leaving the bottom 35% of **ads** free of key text, logos and creative elements. This is an ad guideline, used here as a conservative starting point for organic posts; it is not an exact specification for every organic UI.
- Apple's [layout guidance](https://developer.apple.com/design/human-interface-guidelines/layout) identifies safe areas as necessary to avoid display features such as Dynamic Island. A rendered MP4 cannot query the viewer's device safe-area insets; reserve space in the actual composition.
- Instagram's [Reel dimensions help page](https://help.instagram.com/1038071743007909) could not be fetched during this research (HTTP 429). Do not claim its current details were verified. The export settings below are this workflow's practical encoding choices.

At 1080×1920, the default `safe_area` protects **x=80…940, y=300…1240**. These particular top/side pixels are our conservative design choice, not a Meta or Apple guarantee. Keep animated headings, important diagram content, creator identity and the *entire* caption box inside it. Background footage/decoration may fill the frame. Expanded descriptions, accessibility text, navigation and viewer devices can cover more; no one rectangle guarantees every Instagram surface.

The shared canvas scales/repositions its 1080×960 motion stage inside those margins. Captions wrap against the available width and clamp the entire box, including large fonts and per-caption overrides. Captions now anchor to the bottom of the usable lower section, 24px above the reserved footer. Split captions stay entirely below the divider with a 24px gap; other compositions keep them in the lower half. The Reels layout preserves a 240px caption section, limiting the default motion split to 52% (the limit adapts to footer reserves). Large text is fitted to that section. Do not move speech captions into the animation panel. Reserve the caption band before framing the speaker. Check the face against the actual recording; automatic safe margins do not detect faces. Inspect custom `concept_js`, its overlay hooks, and baked-in text in B-roll independently. They cannot be repaired by moving DOM elements.

## Editor and reusable settings

Footage → **Instagram composition** selects Reels or full-frame placement without platform margins, adjusts top/bottom reserve percentages, and shows an approximate phone/Reels guide. The guide is a DOM overlay; it never burns into browser or offline exports. Safe positioning itself is part of the canvas, so it does export. **Save template** retains this edit's `safeArea`; **Save brand** retains the equivalent `safe_area` for new recordings. New builds use the brand profile. Full-frame mode is an explicit opt-out.

The supplied signature outro remains complete at original speed with its own audio. In Reels mode it is uniformly inset against its pale background, moving this specific outro's follow button/cursor upward without cropping its content. `config.outro.safeInset:false` disables that treatment. Review a replacement outro independently.

## Export and QA

Use the offline renderer for the delivery: flattened 1080×1920 MP4, square pixels, progressive H.264 High/yuv420p, constant project fps (normally 30), BT.709 limited-range SDR, AAC stereo 48kHz/192kbps and fast-start. CRF18 with a 12Mbps ceiling is our quality/file-size tradeoff, not an official Instagram bitrate requirement. Input HDR must first be genuinely converted to SDR; adding metadata alone is not tone mapping.

1. Render the actual picture after moving graphics; an audio-only remux cannot apply layout changes.
2. Inspect decoded final frames with the guide at first/last frames, every topic, longest captions and outro. Check motion at multiple times. Check centre crops separately when feed/profile use matters; those previews are not exact Instagram emulators.
3. Run the platform browser check to measure caption boxes, save/reload settings, verify guides do not alter captured frames, and reject page errors. Test original/insert audio independently.
4. Probe the delivered MP4 for codec, frame rate, pixel aspect, color, dimensions and audio. A local compression preview can expose small text problems but cannot reproduce Instagram's private transcoder.
5. Deliver the **final MP4**, not the recording, HTML page or source B-roll. If offered by the installed Instagram app, enable its highest-quality media upload setting and inspect the posting preview before posting. Do not upload/publish on the creator's behalf without authorization.

Local checks cannot confirm actual Instagram playback without a real upload. Document the checks performed and any uncertainty without promising that all devices or expanded descriptions will display identically.

Caption **Auto bottom** uses `caption_style.y:null`. Section top/centre/bottom presets, the vertical slider and drag handles work inside the lower caption section. Old absolute y values are clamped to it. Caption timing and word timestamps remain independent of placement.
