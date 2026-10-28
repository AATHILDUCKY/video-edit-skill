// Reusable content: change the words here, or use Template → Story in the player.
// Keep shot durations when replacing the supplied, precisely timed sound effects.
window.CODEX_SHORT_TEMPLATE = {
  "name": "I edit videos with HTML",
  "accent": "#D76A4E",
  "themeVersion": 2,
  "contentVersion": 2,
  "creator": "",
  "captions": true,
  "captionCues": null,
  "cameraAudio": true,
  "sfxVolume": 0.6,
  "musicVolume": 0.12,
  "keyboardSound": true,
  "topPercent": 50,
  "promptText": "Build a split-screen reel. Motion above. My video below. Add cuts + sound.",
  "frame": { "x": 0.5, "y": 0.45, "zoom": 1, "mode": "fill", "mirrored": false },
  "scenes": [
    { "kind": "hook", "duration": 4.0, "motionDuration": 2.4, "title": "This reel", "emphasis": "is HTML.", "voice": "I made this reel with HTML. Here’s how.", "cue": "Impact → code snap" },
    { "kind": "prompt", "duration": 4.0, "motionDuration": 2.2, "title": "Ask Codex.", "emphasis": "Describe the edit.", "voice": "First, I asked Codex to build an HTML template.", "cue": "Keyboard clicks → run" },
    { "kind": "visuals", "duration": 1.5, "motionDuration": 0.9, "title": "Animated visuals.", "emphasis": "", "voice": "It animated the visuals,", "cue": "Photo pops" },
    { "kind": "cuts", "duration": 1.5, "motionDuration": 0.9, "title": "Timed cuts.", "emphasis": "", "voice": "timed the cuts,", "cue": "Edit snap" },
    { "kind": "sound", "duration": 1.5, "motionDuration": 0.9, "title": "Sound effects.", "emphasis": "", "voice": "and added sound effects.", "cue": "Stereo ping" },
    { "kind": "camera", "duration": 4.0, "motionDuration": 2.2, "title": "Add my clip.", "emphasis": "Find my frame.", "voice": "Then I added my clip and adjusted the frame.", "cue": "Downward whoosh" },
    { "kind": "export", "duration": 4.5, "motionDuration": 2.5, "title": "Preview. Refine.", "emphasis": "Export.", "voice": "I previewed it, tweaked the timing, and exported the video.", "cue": "Play click → slider → download" },
    { "kind": "end", "duration": 4.0, "motionDuration": 3.0, "title": "New clip.", "emphasis": "Same template.", "voice": "Now I can reuse it. New clip, same template.", "cue": "Resolve → logo hold" }
  ]
};
