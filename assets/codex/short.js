/* Reusable Codex split-screen short. All visuals are deterministic at a given time.
 * Scene content lives in template.js. Media stays local. No runtime dependencies.
 */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const defaults = structuredClone(window.CODEX_SHORT_TEMPLATE);
  const config = structuredClone(defaults);
  const manual = new URLSearchParams(location.search).has('render');
  const storageKey = 'codex-html-short-v1';
  // Upgrade untouched stock copy while keeping any lines the creator has edited.
  const previousStory = {
    hook: { title: 'This video', emphasis: 'is HTML.', voice: 'I edited this video… with HTML.' },
    prompt: { title: 'One prompt.', emphasis: 'Codex builds it.', voice: 'I gave Codex one prompt.' },
    visuals: { title: 'The visuals.', emphasis: '', voice: 'It built the visuals,' },
    cuts: { title: 'The cuts.', emphasis: '', voice: 'the cuts,' },
    sound: { title: 'The sound.', emphasis: '', voice: 'and the sound.' },
    camera: { title: 'My video.', emphasis: 'Right below.', voice: 'My camera clip goes underneath.' },
    export: { title: 'Preview. Tweak.', emphasis: 'Export.', voice: 'Then I preview, tweak, and export.' },
    end: { title: 'One HTML file.', emphasis: 'A whole video.', voice: 'One HTML file. A whole video.' }
  };
  try {
    const saved = !manual && JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (saved) {
      for (const k of ['creator', 'accent', 'captions', 'cameraAudio', 'sfxVolume', 'musicVolume', 'keyboardSound', 'topPercent', 'promptText']) {
        if (k === 'accent' && saved.themeVersion !== defaults.themeVersion) continue;
        if (typeof saved[k] === typeof config[k]) config[k] = saved[k];
      }
      if (saved.frame && typeof saved.frame === 'object') config.frame = { ...config.frame, ...saved.frame };
      if (Array.isArray(saved.captionCues)) config.captionCues = saved.captionCues;
      if (Array.isArray(saved.scenes)) saved.scenes.forEach((s, i) => {
        if (config.scenes[i]) for (const k of ['title', 'emphasis', 'voice']) if (typeof s[k] === 'string') {
          if (saved.contentVersion !== defaults.contentVersion && s[k] === previousStory[config.scenes[i].kind]?.[k]) continue;
          config.scenes[i][k] = s[k].slice(0, k === 'voice' ? 240 : 50);
        }
      });
    }
  } catch (_) { /* The template also works when file-origin storage is unavailable. */ }
  if (!/^#[0-9a-f]{6}$/i.test(config.accent)) config.accent = defaults.accent;
  config.topPercent = Math.max(30, Math.min(70, Math.round(Number(config.topPercent) || 50)));
  config.promptText = String(config.promptText).slice(0, 180);
  let cursor = 0;
  config.scenes.forEach(s => { s.start = cursor; cursor += s.duration; s.end = cursor; });
  const DURATION = Math.round(cursor * 1000) / 1000, W = 1080, H = 1920, BASE_TOP = 960;
  let SPLIT = Math.round(H * config.topPercent / 100);
  const canvas = $('reelCanvas'), ctx = canvas.getContext('2d', { alpha: false });
  const camera = $('sourceVideo'), sfx = $('soundtrack'), music = $('musictrack'), keyboard = $('keyboardtrack');
  sfx.src = window.CODEX_SHORT_MEDIA.sfx;
  music.src = window.CODEX_SHORT_MEDIA.music;
  keyboard.src = window.CODEX_SHORT_MEDIA.keyboard;
  const C = { ink: '#171c1b', white: '#ffffff', muted: '#75877b', line: '#e7ddd8', blue: '#bcd5ff' };
  const photos = {};
  let time = 0, playing = false, origin = 0, ready = false, recording = false, startingExport = false;
  let hasCamera = false, clipURL = null, mirror = Boolean(config.frame.mirrored), audible = false, offset = 0;
  const cameraFrame = { x: Math.max(0, Math.min(1, Number(config.frame.x) || 0)), y: Math.max(0, Math.min(1, Number(config.frame.y) || 0)), zoom: Math.max(1, Math.min(3, Number(config.frame.zoom) || 1)), mode: config.frame.mode === 'fit' ? 'fit' : 'fill' };
  const framingCanvas = $('framingCanvas'), framingCtx = framingCanvas.getContext('2d', { alpha: false });
  const cameraCache = document.createElement('canvas'), cameraCacheCtx = cameraCache.getContext('2d');
  let cameraCacheReady = false;
  const pointers = new Map(); let pinch = null;
  let mediaRecorder = null, exportStream = null, chunks = [], cancelled = false;
  let audioContext = null, mixDestination = null, monitorGain = null, sfxGain = null, musicGain = null, cameraGain = null, keyboardGain = null;
  let toastTimer = null, lastUI = 0, previousCameraCheck = 0;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const mix = (a, b, p) => a + (b - a) * p;
  const out = x => 1 - (1 - clamp(x)) ** 4;
  const io = x => { x = clamp(x); return x < .5 ? 8 * x ** 4 : 1 - (-2 * x + 2) ** 4 / 2; };
  const enter = (t, delay = 0, d = .38) => out((t - delay) / d);
  const fmt = t => `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  function validateCaptionCues(cues) {
    if (!Array.isArray(cues) || cues.length > 250) throw new Error('Use a caption list with at most 250 captions.');
    const seen = new Set();
    const clean = cues.map((cue, index) => {
      if (!cue || !Number.isFinite(cue.start) || !Number.isFinite(cue.end) || typeof cue.text !== 'string') throw new Error('Each caption needs text, a start time, and an end time.');
      const start = Math.round(clamp(cue.start, 0, DURATION) * 1000) / 1000, end = Math.round(clamp(cue.end, 0, DURATION) * 1000) / 1000;
      if (end - start < .099) throw new Error('Each caption must last at least 0.10 seconds.');
      let id = typeof cue.id === 'string' ? cue.id.slice(0, 64) : `caption-${index}`;
      while (seen.has(id)) id += '-copy'; seen.add(id);
      return { id, start, end, text: cue.text.slice(0, 240) };
    }).sort((a, b) => a.start - b.start || a.end - b.end);
    for (let i = 1; i < clean.length; i++) if (clean[i].start < clean[i-1].end - .001) throw new Error('Caption times overlap. Move one caption or trim its edge.');
    return clean;
  }
  function activeCaptionCues() {
    return config.captionCues === null ? config.scenes.map(s => ({ id: `scene-${s.kind}`, start: s.start, end: s.end, text: s.voice })) : config.captionCues;
  }
  function captionChanged() { window.dispatchEvent(new CustomEvent('codex:captions')); }
  function setCaptionCues(cues) { if (recording || startingExport) return; config.captionCues = validateCaptionCues(cues); save(); captionChanged(); }
  function resetCaptionCues() { if (recording || startingExport) return; config.captionCues = null; save(); captionChanged(); }
  try { if (config.captionCues !== null) config.captionCues = validateCaptionCues(config.captionCues); } catch (_) { config.captionCues = null; }
  const paths = {
    play: 'M8 4L21 12L8 20Z',
    code: 'M8 5L1 12L8 19M16 5L23 12L16 19M14 3L10 21',
    terminal: 'M4 5L11 12L4 19M13 19H22',
    camera: 'M3 6H15V18H3ZM15 10L22 6V18L15 14',
    film: 'M3 3H21V21H3ZM7 3V21M17 3V21M3 8H7M3 16H7M17 8H21M17 16H21',
    scissors: 'M8 8L21 21M8 16L21 3M9 5A4 4 0 1 1 1 5A4 4 0 1 1 9 5M9 19A4 4 0 1 1 1 19A4 4 0 1 1 9 19',
    sound: 'M11 3L5 8H1V16H5L11 21ZM15 8Q20 12 15 16M18 4Q27 12 18 20',
    download: 'M12 2V16M6 10L12 16L18 10M3 17V22H21V17',
    sliders: 'M3 6H21M3 18H21M8 2V10M16 14V22',
    check: 'M3 12L9 18L21 5',
    arrow: 'M2 12H22M15 5L22 12L15 19',
    down: 'M12 2V22M5 15L12 22L19 15',
    image: 'M2 3H22V21H2ZM2 17L8 10L14 16L17 12L22 17M18 7H18.01',
    file: 'M5 2H14L21 9V22H5ZM14 2V9H21',
    cursor: 'M4 2L20 12L12 14L8 22Z'
  };
  const icons = Object.fromEntries(Object.entries(paths).map(([k, d]) => [k, new Path2D(d)]));

  function rr(x, y, w, h, r = 16) { ctx.beginPath(); ctx.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))); }
  function box(x, y, w, h, color, r = 0, stroke = null) {
    rr(x, y, Math.max(0, w), Math.max(0, h), r); ctx.fillStyle = color; ctx.fill();
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
  }
  function line(x1, y1, x2, y2, color, width = 4) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.stroke(); }
  function txt(s, x, y, size, color = C.ink, weight = 800, align = 'center', maxWidth = 1000, mono = false) {
    ctx.font = `${weight} ${size}px ${mono ? 'ui-monospace, monospace' : 'Manrope, Arial, sans-serif'}`;
    ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = color;
    ctx.letterSpacing = mono ? '0px' : `${-size * .045}px`;
    const measured = ctx.measureText(s).width;
    if (measured > maxWidth) ctx.font = `${weight} ${size * maxWidth / measured}px ${mono ? 'ui-monospace, monospace' : 'Manrope, Arial, sans-serif'}`;
    ctx.fillText(s, x, y); ctx.letterSpacing = '0px';
  }
  function reveal(s, x, y, size, t, color = C.ink, delay = 0, width = 940) {
    const p = enter(t, delay);
    ctx.save(); ctx.beginPath(); ctx.rect(0, y - size * 1.14, W, size * 1.36); ctx.clip();
    txt(s, x, y + (1 - p) * size * 1.4, size, color, 800, 'center', width); ctx.restore();
  }
  function icon(name, x, y, size, color = C.ink, width = 1.7) {
    ctx.save(); ctx.translate(x - size / 2, y - size / 2); ctx.scale(size / 24, size / 24);
    ctx.lineWidth = width; ctx.strokeStyle = color; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(icons[name]); ctx.restore();
  }
  function image(name, x, y, w, h, zoom = 1, radius = 0) {
    const img = photos[name]; if (!img || w <= 0 || h <= 0) return;
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight) * zoom;
    ctx.save(); rr(x, y, w, h, radius); ctx.clip(); ctx.drawImage(img, x - (img.naturalWidth * scale - w) / 2, y - (img.naturalHeight * scale - h) / 2, img.naturalWidth * scale, img.naturalHeight * scale); ctx.restore();
  }
  function rotatedImage(name, x, y, w, h, angle, zoom = 1) { ctx.save(); ctx.translate(x, y); ctx.rotate(angle); image(name, -w / 2, -h / 2, w, h, zoom, 12); ctx.restore(); }
  function codeMark(x, y, size, accent = config.accent) { box(x - size / 2, y - size / 2, size, size, C.ink, size * .24); icon('terminal', x, y, size * .58, accent, 2); }
  function bar(x, y, w, p, color = config.accent) { box(x, y, w, 10, '#e7ddd8', 5); box(x, y, w * clamp(p), 10, color, 5); }
  function headline(s, t, single = false) {
    reveal(s.title, 540, single ? 240 : 215, single ? 164 : 143, t);
    if (!single) reveal(s.emphasis, 540, 365, 157, t, C.ink, .1);
  }
  function bg(color = C.white) { box(0, 0, W, BASE_TOP, color); }
  function thinArrow(x1, y1, x2, y2, p, color = C.ink, width = 7) {
    p = clamp(p); const x = mix(x1, x2, p), y = mix(y1, y2, p), a = Math.atan2(y2 - y1, x2 - x1);
    line(x1, y1, x, y, color, width);
    if (p > .85) { line(x, y, x - 26 * Math.cos(a - .65), y - 26 * Math.sin(a - .65), color, width); line(x, y, x - 26 * Math.cos(a + .65), y - 26 * Math.sin(a + .65), color, width); }
  }

  function hook(s, t) {
    bg(); headline(s, t);
    const en = enter(t, .1, .5), wipe = io((t - .80) / .65);
    const x = 83, y = 456 + (1 - en) * 130, w = 914, h = 350;
    image('camera', x, y, w, h, 1.08 + t * .015, 16);
    ctx.save(); ctx.globalAlpha = .28; box(x, y, w, h, '#000', 16); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w * wipe, h); ctx.clip();
    box(x, y, w, h, C.ink, 16);
    icon('code', 181, y + 70, 50, config.accent);
    txt('video.html', 230, y + 81, 31, '#c7d9ce', 500, 'left', 680, true);
    const lines = [ ['<section class="short">', config.accent], ['  <canvas id="motion" />', '#e8f0eb'], ['  <video src="me.mp4" />', '#bcd5ff'], ['</section>', config.accent] ];
    lines.forEach(([str, col], i) => txt(str, 138, y + 145 + i * 47, 28, col, 500, 'left', 800, true));
    ctx.restore();
    if (wipe < .99) { ctx.save(); ctx.globalAlpha = 1 - wipe; icon('play', 540, y + 160, 108, C.white, 2); ctx.restore(); }
    if (wipe > .02 && wipe < .98) box(x + w * wipe, y + 8, 5, h - 16, config.accent, 2);
    txt('Yes. The edit you’re watching.', 540, 882, 34, '#718077', 500);
  }
  function prompt(s, t) {
    bg(); reveal(s.title, 540, 190, 143, t); reveal(s.emphasis, 540, 302, 104, t, C.ink, .08);
    const en = enter(t, .06, .4), y = 382 + (1 - en) * 90;
    box(82, y, 916, 460, '#fbf8f6', 20, C.line);
    codeMark(142, y + 61, 60); txt('Codex', 190, y + 76, 38, C.ink, 800, 'left');
    line(108, y + 114, 972, y + 114, C.line, 2);
    const str = config.promptText;
    const shown = str.slice(0, Math.round(clamp((t - .26) / 1.39) * str.length));
    let fontSize = 43;
    for (; fontSize > 27; fontSize--) {
      ctx.font = `500 ${fontSize}px Manrope`; let lines = 1, lineWidth = 0;
      for (const word of str.split(/\s+/)) { const width = ctx.measureText(word + ' ').width; if (lineWidth + width > 775 && lineWidth) { lines++; lineWidth = width; } else lineWidth += width; }
      if (lines <= 4 && (lines - 1) * fontSize * 1.42 <= 145) break;
    }
    ctx.font = `500 ${fontSize}px Manrope`; ctx.letterSpacing = '-1.1px';
    let row = '', yy = y + 187;
    for (const word of shown.split(/\s+/)) { const test = row ? row + ' ' + word : word; if (ctx.measureText(test).width > 775 && row) { txt(row, 130, yy, fontSize, C.ink, 500, 'left', 800); yy += fontSize * 1.42; row = word; } else row = test; }
    txt(row, 130, yy, fontSize, C.ink, 500, 'left', 800); ctx.letterSpacing = '0px';
    const run = enter(t, 1.70, .22);
    box(130, y + 353, 560, 61, run > .5 ? '#f9e4da' : '#ebefed', 10);
    txt(run > .5 ? 'Building your short…' : 'Your idea → one prompt', 154, y + 393, 26, '#895543', 500, 'left');
    box(843, y + 353, 102, 61, config.accent, 10); icon(run > .65 ? 'check' : 'arrow', 894, y + 384, 35, C.ink, 2);
    if (t < 2.07) { ctx.save(); ctx.translate(mix(1040, 918, enter(t, 1.3, .45)), mix(y + 480, y + 407, enter(t, 1.3, .45))); icon('cursor', 0, 0, 43, C.ink, 1.3); ctx.restore(); }
  }
  function visuals(s, t) {
    bg(); headline(s, t, true);
    const p = enter(t, 0, .35);
    rotatedImage('laptop', 540 - 318 * p, 585 + 70 * (1 - p), 330, 383, -.10 * p, 1.06);
    rotatedImage('camera', 540, 552, 365, 420, -.01, 1.06 + t * .025);
    rotatedImage('workspace', 540 + 318 * p, 585 + 70 * (1 - p), 330, 383, .10 * p, 1.1);
    box(442, 482, 196, 144, config.accent, 32); icon('image', 540, 554, 90, C.ink, 1.5);
    thinArrow(330, 842, 750, 842, enter(t, .15, .35), C.ink, 6);
  }
  function cuts(s, t) {
    bg(config.accent); headline(s, t, true);
    const cut = io((t - .22) / .3), split = 25 * cut, x = 88, y = 420;
    box(x, y, 904, 372, C.ink, 19);
    for (let i = 0; i < 3; i++) {
      const yy = y + 50 + i * 93;
      box(x + 32, yy, 840, 70, '#2b3730', 8);
      const leftW = 420 - split;
      image(i === 1 ? 'workspace' : 'camera', x + 37 - split, yy + 5, leftW, 60, 1.04, 5);
      box(x + 464 + split, yy + 5, 370 - split, 60, i === 1 ? C.blue : '#efdcd4', 5);
      for (let n = 0; n < 25; n++) line(x + 482 + split + n * 13, yy + 30 - Math.sin(n * 2) * 13, x + 482 + split + n * 13, yy + 37 + Math.sin(n * 2) * 13, '#a87363', 3);
    }
    const px = x + 451;
    line(px, y + 20, px, y + 348, config.accent, 4);
    box(px - 42, y - 40, 84, 80, C.white, 19); icon('scissors', px, y, 44, C.ink, 1.5);
    txt('Frame-perfect timing.', 540, 882, 34, '#48261d', 500);
  }
  function soundShot(s, t) {
    bg(C.ink); reveal(s.title, 540, 240, 164, t, C.white);
    const en = enter(t, .03, .3);
    for (let i = 0; i < 49; i++) {
      const envelope = Math.exp(-(((i - 24) / 20) ** 2));
      const amp = (28 + Math.abs(Math.sin(i * .73 + t * 7) * Math.cos(i * .19 - t * 3)) * 270) * envelope * en;
      box(120 + i * 17.1, 557 - amp / 2, 9, amp, i > 19 && i < 31 ? config.accent : '#a96c59', 4);
    }
    [['sound', 'Whoosh.', 247], ['scissors', 'Snap.', 540], ['check', 'Chime.', 833]].forEach(([name, label, x], i) => {
      ctx.save(); ctx.globalAlpha = enter(t, i * .09, .23); icon(name, x, 785, 48, config.accent); txt(label, x, 869, 38, C.white, 500); ctx.restore();
    });
  }
  function cameraShot(s, t) {
    bg(); headline(s, t);
    const en = enter(t, .1, .4), x = 244, y = 427;
    box(x, y + (1 - en) * 70, 592, 335, '#eaf1ec', 15, C.line);
    box(x + 13, y + 13 + (1 - en) * 70, 566, 145, config.accent, 8);
    icon('code', 390, y + 83 + (1 - en) * 70, 65, C.ink); txt('Motion', 555, y + 99 + (1 - en) * 70, 49);
    box(x + 13, y + 171 + (1 - en) * 70, 566, 151, C.ink, 8);
    icon('camera', 390, y + 245 + (1 - en) * 70, 60, config.accent); txt('My clip', 555, y + 261 + (1 - en) * 70, 49, C.white);
    thinArrow(540, 801, 540, 935, enter(t, .55, .5), config.accent, 9);
  }
  function exportShot(s, t) {
    bg(); reveal(s.title, 540, 195, 125, t); reveal(s.emphasis, 540, 355, 166, t, C.ink, .07);
    const phase = Math.min(2, Math.floor(t / .78));
    const actions = ['play', 'sliders', 'download'];
    actions.forEach((name, i) => {
      const x = 235 + i * 305, active = phase === i;
      const en = enter(t, i * .10, .35), side = active ? 225 : 183;
      box(x - side / 2, 577 - side / 2 + (1 - en) * 65, side, side, active ? config.accent : '#f5efec', 33);
      icon(name, x, 577 + (1 - en) * 65, active ? 100 : 75, active ? C.ink : '#ad948b', 1.5);
      txt(['Preview', 'Tweak', 'Export'][i], x, 767, 39, active ? C.ink : '#ad948b', 500);
      if (i < 2) thinArrow(x + 139, 577, x + 168, 577, en, '#bca399', 5);
    });
    bar(170, 843, 740, enter(t, 1.55, .62), config.accent);
    if (t > 2.12) { icon('check', 929, 845, 37, '#b25841', 2.2); }
  }
  function ending(s, t) {
    bg(config.accent); reveal(s.title, 540, 212, 134, t); reveal(s.emphasis, 540, 360, 133, t, C.ink, .1);
    const en = enter(t, .12, .55);
    ctx.save(); ctx.translate(540, 610); ctx.scale(.9 + en * .1, .9 + en * .1); ctx.translate(-540, -610);
    codeMark(337, 600, 144); txt('Codex', 445, 640, 123, C.ink, 800, 'left', 500);
    ctx.restore();
    ctx.save(); ctx.globalAlpha = enter(t, .25, .4);
    txt('HTML → motion → video', 540, 806, 37, C.ink, 500);
    if (config.creator) txt(config.creator, 540, 880, 31, C.ink, 500);
    ctx.restore();
  }
  const renderers = { hook, prompt, visuals, cuts, sound: soundShot, camera: cameraShot, export: exportShot, end: ending };
  function sceneAt(t) { return config.scenes.find(s => t >= s.start && t < s.end) || config.scenes.at(-1); }
  function paintTopScene(s, local) {
    const color = ['cuts', 'end'].includes(s.kind) ? config.accent : s.kind === 'sound' ? C.ink : C.white;
    box(0, 0, W, SPLIT, color);
    const scale = Math.min(1, SPLIT / BASE_TOP);
    ctx.save(); ctx.translate((W - W * scale) / 2, (SPLIT - BASE_TOP * scale) / 2); ctx.scale(scale, scale);
    renderers[s.kind](s, local * (s.motionDuration || s.duration) / s.duration); ctx.restore();
  }
  function top(t) {
    const s = sceneAt(t), local = t - s.start;
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, SPLIT); ctx.clip();
    paintTopScene(s, local);
    // Short directional wipes conceal the scene handoffs. Text is never crossfaded.
    const index = config.scenes.indexOf(s), remaining = s.end - t;
    if (index < config.scenes.length - 1 && remaining < .12) {
      const p = io(1 - remaining / .12), next = config.scenes[index + 1];
      ctx.save(); ctx.beginPath(); ctx.rect(W * (1 - p), 0, W * p + 1, SPLIT); ctx.clip(); paintTopScene(next, 0); ctx.restore();
      if (p > .02 && p < .98) box(W * (1 - p), 0, 4, SPLIT, s.kind === 'sound' ? C.white : config.accent);
    }
    ctx.restore();
  }
  function sourceTime(t) {
    if (!Number.isFinite(camera.duration) || camera.duration <= 0) return 0;
    const start = clamp(offset, 0, Math.max(0, camera.duration - .05)), length = camera.duration - start;
    return $('loopCamera').checked ? start + t % length : Math.min(start + t, camera.duration - .035);
  }
  function cameraGeometry() {
    const sw = camera.videoWidth || W, sh = camera.videoHeight || (H - SPLIT);
    const scale = (cameraFrame.mode === 'fit' ? Math.min(W / sw, (H - SPLIT) / sh) : Math.max(W / sw, (H - SPLIT) / sh)) * cameraFrame.zoom;
    const w = sw * scale, h = sh * scale;
    return { x: (W - w) * cameraFrame.x, y: (H - SPLIT - h) * cameraFrame.y, w, h };
  }
  function paintCamera(target, top = 0) {
    const g = cameraGeometry();
    const source = camera.readyState >= 2 ? camera : cameraCacheReady ? cameraCache : null;
    if (!source) return;
    target.save(); target.beginPath(); target.rect(0, top, W, H - SPLIT); target.clip();
    // Mirror within the image bounds, so dragging always follows the pointer.
    if (mirror) { target.translate(g.x + g.w, top + g.y); target.scale(-1, 1); target.drawImage(source, 0, 0, g.w, g.h); }
    else target.drawImage(source, g.x, top + g.y, g.w, g.h);
    target.restore();
  }
  function drawFraming() {
    if (!hasCamera || $('settings').open === false || $('panel-footage').hidden) return;
    framingCtx.setTransform(1, 0, 0, 1, 0, 0); framingCtx.fillStyle = '#171d1a'; framingCtx.fillRect(0, 0, W, H - SPLIT);
    framingCtx.imageSmoothingEnabled = true; framingCtx.imageSmoothingQuality = 'high';
    if (camera.readyState >= 2 || cameraCacheReady) paintCamera(framingCtx);
  }
  function framingControls() {
    $('cameraZoom').value = Math.round(cameraFrame.zoom * 100); $('zoomReadout').value = `${Math.round(cameraFrame.zoom * 100)}%`;
    $('cameraX').value = Math.round(cameraFrame.x * 100); $('cameraPosition').value = Math.round(cameraFrame.y * 100);
    $('fillFrame').setAttribute('aria-pressed', String(cameraFrame.mode === 'fill')); $('fitFrame').setAttribute('aria-pressed', String(cameraFrame.mode === 'fit'));
    config.frame = { ...cameraFrame, mirrored: mirror };
    if (ready) persist();
  }
  function resetFraming(centre = false) {
    if (centre) { cameraFrame.x = .5; cameraFrame.y = .5; }
    else Object.assign(cameraFrame, { x: .5, y: .45, zoom: 1, mode: 'fill' });
    framingControls(); draw();
  }
  function changeZoom(value, anchor = { x: W / 2, y: (H - SPLIT) / 2 }) {
    const old = cameraGeometry(), px = (anchor.x - old.x) / old.w, py = (anchor.y - old.y) / old.h;
    cameraFrame.zoom = clamp(value, 1, 3);
    const next = cameraGeometry();
    if (Math.abs(W - next.w) > .01) cameraFrame.x = clamp((anchor.x - px * next.w) / (W - next.w));
    if (Math.abs(H - SPLIT - next.h) > .01) cameraFrame.y = clamp((anchor.y - py * next.h) / (H - SPLIT - next.h));
    framingControls(); draw();
  }
  function panCamera(dx, dy) {
    const g = cameraGeometry();
    if (Math.abs(W - g.w) > .01) cameraFrame.x = clamp(cameraFrame.x + dx / (W - g.w));
    if (Math.abs(H - SPLIT - g.h) > .01) cameraFrame.y = clamp(cameraFrame.y + dy / (H - SPLIT - g.h));
    framingControls(); draw();
  }
  function framePoint(clientX, clientY) {
    const r = framingCanvas.getBoundingClientRect(); return { x: (clientX - r.left) * W / r.width, y: (clientY - r.top) * (H - SPLIT) / r.height };
  }
  function openFraming() {
    if (!hasCamera || recording || startingExport) return;
    pause(); activateTab('footage'); if (!$('settings').open) $('settings').showModal(); drawFraming();
    $('framingCard').scrollIntoView({ block: 'start', behavior: 'instant' });
    framingCanvas.focus({ preventScroll: true });
  }
  function bottom(t) {
    box(0, SPLIT, W, H - SPLIT, '#171d1a');
    ctx.save(); ctx.beginPath(); ctx.rect(0, SPLIT, W, H - SPLIT); ctx.clip();
    if (hasCamera && camera.videoWidth) {
      paintCamera(ctx, SPLIT);
    } else {
      // A neutral, clearly labelled template slot rather than stock footage of another person.
      const scale = Math.min(1, (H - SPLIT) / BASE_TOP);
      ctx.save(); ctx.translate((W - W * scale) / 2, SPLIT + (H - SPLIT - BASE_TOP * scale) / 2); ctx.scale(scale, scale);
      const cx = 540, cy = 365;
      ctx.strokeStyle = '#594038'; ctx.lineWidth = 3; ctx.setLineDash([8, 12]); rr(164, 140, 752, 515, 24); ctx.stroke(); ctx.setLineDash([]);
      box(cx - 72, cy - 88, 144, 126, '#382924', 27); icon('camera', cx, cy - 24, 68, config.accent, 1.5);
      txt('YOUR VIDEO HERE', cx, cy + 120, 51, '#e9ded8', 800);
      txt('Click or drop your camera clip', cx, cy + 183, 31, '#b09a91', 500);
      txt('Drop a clip. Reuse your edit.', cx, 597, 25, '#9a8277', 500); ctx.restore();
    }
    ctx.restore();
    box(0, SPLIT - 3, W, 6, config.accent);
    if (config.captions) captions(t);
  }
  function captions(t) {
    const cues = activeCaptionCues();
    const s = cues.find(cue => t >= cue.start && t < cue.end) || (t === DURATION && cues.at(-1)?.end === DURATION ? cues.at(-1) : null);
    if (!s) return;
    const words = s.text.trim().split(/\s+/).filter(Boolean); if (!words.length) return;
    const progress = clamp((t - s.start) / (s.end - s.start), 0, .9999), activeIndex = Math.floor(progress * words.length);
    const size = Math.min(60, (H - SPLIT) * .085);
    ctx.font = `800 ${size}px Manrope`; ctx.letterSpacing = '-1px';
    const groups = []; let group = [], length = 0;
    words.forEach((word, index) => { const w = ctx.measureText(word).width + 19; if ((length + w > 824 || group.length >= 5) && group.length) { groups.push(group); group = []; length = 0; } group.push({ word, index, width: w }); length += w; });
    if (group.length) groups.push(group);
    const current = groups.find(g => g.some(w => w.index === activeIndex)) || groups.at(-1);
    const total = current.reduce((sum, w) => sum + w.width, 0), baseline = SPLIT + (H - SPLIT) * .85;
    box(540 - total / 2 - 24, baseline - size * 1.217, total + 48, size * 1.8, '#0c130fea', 17);
    let x = 540 - total / 2;
    current.forEach(({ word, index, width }) => {
      if (index === activeIndex) box(x - 8, baseline - size * .983, width + 2, size * 1.3, config.accent, 9);
      txt(word, x, baseline, size, index === activeIndex ? C.ink : C.white, 800, 'left', 900);
      x += width;
    });
    ctx.letterSpacing = '0px';
  }
  function draw(t = time) {
    ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0); ctx.globalAlpha = 1;
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    top(clamp(t, 0, DURATION)); bottom(clamp(t, 0, DURATION));
    drawFraming();
  }

  function notify(message, timeout = 0) { clearTimeout(toastTimer); $('status').textContent = message; if (timeout) toastTimer = setTimeout(() => $('status').textContent = '', timeout); }
  function persist() { try { localStorage.setItem(storageKey, JSON.stringify(config)); } catch (_) {} }
  function save() { persist(); document.documentElement.style.setProperty('--accent', config.accent); draw(); }
  function layoutControls() {
    const percent = config.topPercent, label = `Motion ${percent}% · Camera ${100 - percent}%`;
    $('film').style.setProperty('--split', `${percent}%`); $('topHeight').value = percent; $('layoutReadout').value = label; $('splitTooltip').textContent = label;
    $('splitHandle').setAttribute('aria-valuenow', String(percent)); $('splitHandle').setAttribute('aria-valuetext', label);
    document.querySelectorAll('[data-layout]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.layout) === percent)));
    const bottomHeight = H - SPLIT;
    if (framingCanvas.height !== bottomHeight) framingCanvas.height = bottomHeight;
    $('framingStage').style.aspectRatio = `${W} / ${bottomHeight}`;
  }
  function setLayout(percent) {
    if (recording || startingExport) return;
    config.topPercent = clamp(Math.round(Number(percent) || 50), 30, 70); SPLIT = Math.round(H * config.topPercent / 100);
    layoutControls(); framingControls(); save();
  }
  function updateUI() {
    $('scrubber').value = time; $('scrubber').style.setProperty('--progress', `${time / DURATION * 100}%`); $('timeLabel').textContent = `${fmt(time)} / ${fmt(DURATION)}`;
    $('playBtn').innerHTML = playing ? '<svg viewBox="0 0 24 24"><path d="M8 5v14M16 5v14" stroke-width="3"/></svg>' : '<svg viewBox="0 0 24 24"><path class="solid" d="M7 4l14 8-14 8z"/></svg>';
    $('playBtn').setAttribute('aria-label', playing ? 'Pause' : time >= DURATION ? 'Replay' : 'Play');
    $('soundBtn').innerHTML = audible ? '<svg viewBox="0 0 24 24"><path d="M11 4L5 9H2v6h3l6 5zM15 8a6 6 0 010 8m3-11a10 10 0 010 14"/></svg>' : '<svg viewBox="0 0 24 24"><path d="M11 4L5 9H2v6h3l6 5zM16 9l6 6m0-6l-6 6"/></svg>';
    $('soundBtn').setAttribute('aria-label', audible ? 'Mute preview' : 'Turn sound on');
    $('cameraTarget').hidden = hasCamera || recording || startingExport;
    $('cameraTools').hidden = !hasCamera || recording || startingExport;
    $('framingCard').hidden = !hasCamera;
    document.body.classList.toggle('is-playing', playing);
  }
  function pauseMedia() { camera.pause(); sfx.pause(); music.pause(); keyboard.pause(); }
  function setCameraTime(value) {
    if (camera.readyState >= 2 && camera.videoWidth) {
      if (cameraCache.width !== camera.videoWidth || cameraCache.height !== camera.videoHeight) { cameraCache.width = camera.videoWidth; cameraCache.height = camera.videoHeight; }
      cameraCacheCtx.drawImage(camera, 0, 0); cameraCacheReady = true;
    }
    camera.currentTime = value;
  }
  function pause() { if (recording || startingExport) return; playing = false; pauseMedia(); updateUI(); }
  function seek(t) {
    time = clamp(t, 0, DURATION);
    if (hasCamera && camera.readyState >= 1) setCameraTime(sourceTime(time));
    for (const media of [sfx, music, keyboard]) if (Number.isFinite(media.duration)) media.currentTime = Math.min(time, Math.max(0, media.duration - .01));
    draw(); updateUI();
  }
  async function setupAudio() {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      mixDestination = audioContext.createMediaStreamDestination();
      const mixBus = audioContext.createGain(); mixBus.gain.value = .9;
      const compressor = audioContext.createDynamicsCompressor(); compressor.threshold.value = -6; compressor.ratio.value = 4;
      mixBus.connect(compressor); compressor.connect(mixDestination);
      monitorGain = audioContext.createGain(); compressor.connect(monitorGain); monitorGain.connect(audioContext.destination);
      sfxGain = audioContext.createGain(); musicGain = audioContext.createGain(); cameraGain = audioContext.createGain(); keyboardGain = audioContext.createGain();
      audioContext.createMediaElementSource(sfx).connect(sfxGain); sfxGain.connect(mixBus);
      audioContext.createMediaElementSource(music).connect(musicGain); musicGain.connect(mixBus);
      audioContext.createMediaElementSource(camera).connect(cameraGain); cameraGain.connect(mixBus);
      audioContext.createMediaElementSource(keyboard).connect(keyboardGain); keyboardGain.connect(mixBus);
    }
    setMix(); await audioContext.resume();
  }
  function setMix() {
    if (sfxGain) { sfxGain.gain.value = config.sfxVolume; musicGain.gain.value = config.musicVolume; cameraGain.gain.value = config.cameraAudio ? 1 : 0; keyboardGain.gain.value = config.keyboardSound && config.promptText.trim() ? config.sfxVolume * .85 : 0; monitorGain.gain.value = audible ? 1 : 0; }
    sfx.muted = !audioContext && !audible; music.muted = !audioContext && !audible; camera.muted = !audioContext && (!audible || !config.cameraAudio);
    keyboard.muted = !audioContext && !audible;
  }
  async function playMedia() {
    const jobs = [];
    if (audioContext || audible) { if (config.sfxVolume > 0) jobs.push(sfx.play()); if (config.musicVolume > 0) jobs.push(music.play()); jobs.push(keyboard.play()); }
    if (hasCamera && sourceTime(time) < camera.duration - .03) jobs.push(camera.play());
    const results = await Promise.allSettled(jobs);
    if (results.some(r => r.status === 'rejected')) notify('A media track could not play. Check the clip format and try again.', 4500);
  }
  async function play() {
    if (!ready || recording || startingExport) return;
    if (time >= DURATION) seek(0);
    setMix(); origin = performance.now() - time * 1000; playing = true; updateUI();
    if (audioContext) await audioContext.resume(); await playMedia();
  }
  async function toggleSound() {
    if (recording || startingExport) return;
    audible = !audible;
    try { await setupAudio(); setMix(); if (playing) { for (const media of [sfx, music, keyboard]) media.currentTime = Math.min(time, DURATION - .01); await playMedia(); } } catch (e) { audible = false; notify('Sound is not available in this browser.', 4000); }
    updateUI();
  }
  function frame(now) {
    if (playing) {
      time = Math.min((now - origin) / 1000, DURATION);
      if (hasCamera && now - previousCameraCheck > 250 && !camera.seeking && camera.readyState >= 2) {
        const target = sourceTime(time); if (Math.abs(camera.currentTime - target) > .3) setCameraTime(target); previousCameraCheck = now;
      }
      draw();
      if (now - lastUI > 85) { updateUI(); lastUI = now; if (recording) notify(`Rendering ${Math.round(time / DURATION * 100)}%`); }
      if (time >= DURATION) {
        if (recording) finishRecording();
        else if ($('loopPreview').checked) { seek(0); play(); }
        else pause();
      }
    }
    requestAnimationFrame(frame);
  }
  async function attach(file) {
    if (!file || (!file.type.startsWith('video/') && !/\.(mp4|mov|webm|m4v)$/i.test(file.name))) { notify('Choose a supported video file.', 4000); return; }
    pause(); hasCamera = false; cameraCacheReady = false; camera.pause(); if (clipURL) URL.revokeObjectURL(clipURL);
    framingControls(); updateUI();
    clipURL = URL.createObjectURL(file); camera.src = clipURL; camera.muted = true; $('clipName').textContent = `Loading ${file.name}…`;
    camera.onloadeddata = () => {
      hasCamera = true; offset = clamp(offset, 0, Math.max(0, camera.duration - .05)); $('clipOffset').value = offset;
      $('clipOffset').max = Math.max(0, camera.duration - .05); $('clipName').textContent = `${file.name} · ${camera.duration.toFixed(1)}s`; $('removeClip').hidden = false;
      seek(time); setMix(); notify('Clip added. Use Reframe to drag, zoom, or fit your video.', 3500);
    };
    camera.onerror = () => { hasCamera = false; $('clipName').textContent = 'This codec could not be decoded. Try an H.264 MP4.'; draw(); updateUI(); };
    camera.load();
  }
  function removeClip() {
    pause(); hasCamera = false; cameraCacheReady = false; camera.pause(); camera.onloadeddata = null; camera.onerror = null; camera.removeAttribute('src'); camera.load();
    if (clipURL) URL.revokeObjectURL(clipURL); clipURL = null; $('cameraFile').value = ''; $('clipName').textContent = 'No clip yet. The bottom section is ready for your video.'; $('removeClip').hidden = true; updateUI(); draw();
  }
  function activateTab(name) {
    document.querySelectorAll('[data-tab]').forEach(btn => { const active = btn.dataset.tab === name; btn.setAttribute('aria-selected', String(active)); btn.tabIndex = active ? 0 : -1; $(`panel-${btn.dataset.tab}`).hidden = !active; });
    if (name === 'footage') drawFraming();
  }
  function populateStory() {
    $('creatorName').value = config.creator; $('accentColor').value = config.accent; $('showCaptions').checked = config.captions;
    $('cameraAudio').checked = config.cameraAudio; $('sfxVolume').value = config.sfxVolume * 100; $('musicVolume').value = config.musicVolume * 100;
    $('promptText').value = config.promptText; $('keyboardSound').checked = config.keyboardSound; $('flipCamera').checked = mirror;
    const list = $('scriptList'); list.replaceChildren();
    config.scenes.forEach((s, index) => {
      const card = document.createElement('article'); card.className = 'script-scene';
      const head = document.createElement('div'); head.className = 'scene-heading';
      const strong = document.createElement('strong'); strong.textContent = `${index + 1}. ${s.kind === 'hook' ? 'Hook' : s.kind === 'end' ? 'Payoff' : s.kind[0].toUpperCase() + s.kind.slice(1)}`;
      const jump = document.createElement('button'); jump.type = 'button'; jump.textContent = `${s.start.toFixed(1)}–${s.end.toFixed(1)}s ↗`; jump.onclick = () => { $('settings').close(); seek(s.start + .35); };
      head.append(strong, jump); card.append(head);
      for (const [key, label, max] of [['title', 'On-screen line', 50], ['emphasis', 'Second line', 50], ['voice', 'Say this', 240]]) {
        if (key === 'emphasis' && ['visuals', 'cuts', 'sound'].includes(s.kind)) continue;
        const field = document.createElement('label'); field.className = 'field'; field.textContent = label;
        const input = document.createElement(key === 'voice' ? 'textarea' : 'input'); input.value = s[key]; input.maxLength = max; input.dataset.scene = index; input.dataset.field = key;
        input.addEventListener('input', () => { s[key] = input.value; updateScriptRead(); save(); if (key === 'voice' && config.captionCues === null) captionChanged(); }); field.append(input); card.append(field);
      }
      const cue = document.createElement('div'); cue.className = 'cue'; cue.textContent = `SFX · ${s.cue}`; card.append(cue); list.append(card);
    });
    updateScriptRead();
    captionChanged();
  }
  function cleanScript() { return config.scenes.map(s => s.voice.trim()).filter(Boolean).join(' '); }
  function updateScriptRead() {
    const script = cleanScript(), words = script.split(/\s+/).filter(Boolean).length;
    $('narrationRead').textContent = script; $('scriptPace').textContent = `${words} words · ~${Math.round(words / DURATION * 60)} words/min`;
  }
  function scriptText() { return config.scenes.map(s => `${s.start.toFixed(1)}–${s.end.toFixed(1)}s\n${s.voice}`).join('\n\n'); }
  function downloadBlob(blob, filename) { const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 60000); }
  function templateFile() { return { format: 'codex-short-template', version: 1, settings: { ...structuredClone(config), frame: { ...cameraFrame, mirrored: mirror } } }; }
  async function loadTemplate(file) {
    if (!file || recording || startingExport) return;
    try {
      if (file.size > 1000000) throw new Error('Template file is too large.');
      const data = JSON.parse(await file.text());
      if (data.format !== 'codex-short-template' || data.version !== 1 || !data.settings || !Array.isArray(data.settings.scenes)) throw new Error('Choose a saved Codex template (.json).');
      const v = data.settings, next = structuredClone(config);
      if (Array.isArray(v.captionCues)) next.captionCues = validateCaptionCues(v.captionCues);
      else next.captionCues = null;
      if (typeof v.creator === 'string') next.creator = v.creator.slice(0, 32);
      if (typeof v.accent === 'string' && /^#[0-9a-f]{6}$/i.test(v.accent)) next.accent = v.accent;
      if (typeof v.promptText === 'string') next.promptText = v.promptText.slice(0, 180);
      for (const key of ['captions', 'cameraAudio', 'keyboardSound']) if (typeof v[key] === 'boolean') next[key] = v[key];
      for (const key of ['sfxVolume', 'musicVolume']) if (typeof v[key] === 'number' && Number.isFinite(v[key])) next[key] = clamp(v[key]);
      if (Number.isFinite(v.topPercent)) next.topPercent = clamp(Math.round(v.topPercent), 30, 70);
      next.scenes.forEach(s => { const incoming = v.scenes.find(x => x.kind === s.kind); if (incoming) for (const key of ['title', 'emphasis', 'voice']) if (typeof incoming[key] === 'string') s[key] = incoming[key].slice(0, key === 'voice' ? 240 : 50); });
      if (v.frame && typeof v.frame === 'object') {
        for (const key of ['x', 'y', 'zoom']) if (typeof v.frame[key] === 'number' && Number.isFinite(v.frame[key])) next.frame[key] = clamp(v.frame[key], key === 'zoom' ? 1 : 0, key === 'zoom' ? 3 : 1);
        next.frame.mode = v.frame.mode === 'fit' ? 'fit' : 'fill'; next.frame.mirrored = Boolean(v.frame.mirrored);
      }
      pause(); Object.assign(config, next); for (const key of ['x', 'y', 'zoom', 'mode']) cameraFrame[key] = config.frame[key]; mirror = Boolean(config.frame.mirrored);
      SPLIT = Math.round(H * config.topPercent / 100); layoutControls(); populateStory(); framingControls(); setMix(); save(); updateUI();
      notify('Template loaded. Add or replace your clip and export.', 3500);
    } catch (e) { notify(`Could not load template: ${e.message}`, 5000); }
    $('templateFile').value = '';
  }

  function recordingUI(on) {
    document.body.classList.toggle('is-recording', on);
    for (const id of ['playBtn', 'restartBtn', 'scrubber', 'settingsBtn', 'soundBtn', 'exportBtn', 'cameraFile']) $(id).disabled = on;
    $('cancelBtn').style.display = on ? 'inline' : 'none'; $('exportBtn').textContent = on ? 'Rendering…' : 'Export ↓'; updateUI();
  }
  function cleanupRecording() {
    exportStream?.getTracks().forEach(track => track.stop()); exportStream = null; mediaRecorder = null; recording = false; startingExport = false; playing = false; pauseMedia(); setMix(); recordingUI(false); draw();
  }
  async function startRecording() {
    if (!ready || recording || startingExport) return;
    if (!window.MediaRecorder || !canvas.captureStream) { notify('Use a browser with canvas video recording support.', 5000); return; }
    pause(); startingExport = true; cancelled = false; chunks = []; recordingUI(true);
    try {
      const mime = ['video/mp4;codecs=avc1.42001E,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find(m => MediaRecorder.isTypeSupported(m));
      if (!mime) throw new Error('No supported video encoder.');
      await setupAudio(); seek(0);
      if (hasCamera && camera.seeking) await new Promise(resolve => { camera.addEventListener('seeked', resolve, { once: true }); setTimeout(resolve, 1200); });
      if (cancelled) { cleanupRecording(); return; }
      draw(0); exportStream = canvas.captureStream(60);
      for (const track of mixDestination.stream.getAudioTracks()) exportStream.addTrack(track.clone());
      mediaRecorder = new MediaRecorder(exportStream, { mimeType: mime, videoBitsPerSecond: 14000000, audioBitsPerSecond: 192000 });
      mediaRecorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
      mediaRecorder.onerror = () => { cancelled = true; finishRecording(); notify('The browser encoder failed. Try Chrome with an H.264 camera clip.', 5000); };
      mediaRecorder.onstop = () => {
        if (!cancelled && chunks.length) { const ext = mime.includes('mp4') ? 'mp4' : 'webm'; downloadBlob(new Blob(chunks, { type: `video/${ext}` }), `codex-html-short${hasCamera ? '-with-camera' : '-template'}.${ext}`); notify(`${ext.toUpperCase()} exported.`, 4000); }
        else if (cancelled) notify('Export cancelled.', 3000);
        cleanupRecording(); chunks = [];
      };
      mediaRecorder.start(500); recording = true; startingExport = false;
      await playMedia(); if (cancelled) return; origin = performance.now(); playing = true; notify('Rendering 0%'); updateUI();
    } catch (e) { cancelled = true; if (mediaRecorder?.state === 'recording') mediaRecorder.stop(); else cleanupRecording(); notify(`Export could not start: ${e.message}`, 6000); }
  }
  function finishRecording() { playing = false; pauseMedia(); if (!cancelled) { time = DURATION; draw(); } if (mediaRecorder?.state === 'recording') mediaRecorder.stop(); }

  $('playBtn').onclick = () => playing ? pause() : play();
  $('restartBtn').onclick = () => { if (!recording && !startingExport) { pause(); seek(0); play(); } };
  $('scrubber').oninput = e => { if (!recording && !startingExport) { pause(); seek(Number(e.target.value)); } };
  $('soundBtn').onclick = toggleSound; $('settingsBtn').onclick = () => { pause(); $('settings').showModal(); drawFraming(); };
  $('closeSettings').onclick = () => $('settings').close();
  $('settings').onclick = e => { if (e.target === $('settings')) { const r = $('settings').getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) $('settings').close(); } };
  document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.onclick = () => activateTab(btn.dataset.tab);
    btn.onkeydown = e => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) { e.preventDefault(); const tabs = [...document.querySelectorAll('[data-tab]')], i = tabs.indexOf(btn); const j = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length; activateTab(tabs[j].dataset.tab); tabs[j].focus(); } };
  });
  $('fullscreenBtn').onclick = () => { const promise = document.fullscreenElement ? document.exitFullscreen() : $('screen').requestFullscreen?.(); promise?.catch(() => notify('Full screen is not available here.', 3000)); };
  $('cameraTarget').onclick = () => { pause(); $('cameraFile').click(); };
  $('reframeBtn').onclick = openFraming;
  $('replaceClip').onclick = () => { pause(); $('cameraFile').click(); };
  $('film').addEventListener('dblclick', e => { if (hasCamera && e.clientY > canvas.getBoundingClientRect().top + canvas.getBoundingClientRect().height / 2 && !e.target.closest('button')) openFraming(); });
  $('cameraFile').onchange = e => attach(e.target.files[0]); $('removeClip').onclick = removeClip;
  $('flipCamera').onchange = e => { mirror = e.target.checked; framingControls(); draw(); };
  $('clipOffset').oninput = e => { offset = clamp(Number(e.target.value) || 0, 0, hasCamera ? Math.max(0, camera.duration - .05) : 86400); pause(); seek(time); };
  $('cameraPosition').oninput = e => { cameraFrame.y = Number(e.target.value) / 100; draw(); };
  $('cameraX').oninput = e => { cameraFrame.x = Number(e.target.value) / 100; draw(); };
  $('cameraZoom').oninput = e => changeZoom(Number(e.target.value) / 100);
  $('resetFraming').onclick = () => resetFraming();
  $('centerFraming').onclick = () => resetFraming(true);
  for (const mode of ['fill', 'fit']) $(`${mode}Frame`).onclick = () => { cameraFrame.mode = mode; cameraFrame.zoom = 1; cameraFrame.x = .5; cameraFrame.y = mode === 'fit' ? .5 : .45; framingControls(); draw(); };
  $('applyFraming').onclick = () => { $('settings').close(); draw(); play(); };
  $('applyFramingTop').onclick = $('applyFraming').onclick;
  $('cameraAudio').onchange = e => { config.cameraAudio = e.target.checked; setMix(); save(); };
  $('showCaptions').onchange = e => { config.captions = e.target.checked; save(); captionChanged(); };
  $('creatorName').oninput = e => { config.creator = e.target.value; save(); };
  $('accentColor').oninput = e => { config.accent = e.target.value; save(); };
  $('promptText').oninput = e => { config.promptText = e.target.value; setMix(); save(); };
  $('keyboardSound').onchange = e => { config.keyboardSound = e.target.checked; setMix(); save(); };
  $('saveTemplate').onclick = () => downloadBlob(new Blob([JSON.stringify(templateFile(), null, 2)], { type: 'application/json' }), 'codex-template.json');
  $('loadTemplate').onclick = () => $('templateFile').click(); $('templateFile').onchange = e => loadTemplate(e.target.files[0]);
  $('topHeight').oninput = e => { pause(); setLayout(e.target.value); };
  document.querySelectorAll('[data-layout]').forEach(b => b.onclick = () => { pause(); setLayout(b.dataset.layout); });
  for (const id of ['sfxVolume', 'musicVolume']) $(id).oninput = e => { config[id] = Number(e.target.value) / 100; setMix(); save(); };
  $('resetTemplate').onclick = () => { for (const key of ['creator', 'accent', 'captions', 'captionCues', 'scenes', 'promptText']) config[key] = structuredClone(defaults[key]); let start = 0; config.scenes.forEach(s => { s.start = start; start += s.duration; s.end = start; }); populateStory(); setMix(); save(); notify('Story reset.', 2000); };
  $('copyScript').onclick = async () => { try { await navigator.clipboard.writeText(scriptText()); notify('Recording script copied.', 2500); } catch (_) { downloadBlob(new Blob([scriptText()], { type: 'text/plain' }), 'codex-short-recording-script.txt'); } };
  $('copyCleanScript').onclick = async () => { try { await navigator.clipboard.writeText(cleanScript()); notify('Clean narration copied.', 2500); } catch (_) { downloadBlob(new Blob([cleanScript()], { type: 'text/plain' }), 'codex-reel-narration.txt'); } };
  $('exportBtn').onclick = startRecording; $('cancelBtn').onclick = () => { cancelled = true; finishRecording(); if (startingExport) notify('Cancelling…'); };
  camera.addEventListener('seeked', () => { if (!playing) draw(); });
  camera.addEventListener('ended', () => { if (playing && $('loopCamera').checked) { setCameraTime(sourceTime(time)); camera.play().catch(() => {}); } });
  framingCanvas.addEventListener('pointerdown', e => {
    if (!hasCamera || recording || startingExport) return;
    e.preventDefault(); pause(); framingCanvas.focus({ preventScroll: true }); framingCanvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY }); $('framingStage').classList.add('is-dragging');
    if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinch = { distance: Math.hypot(a.x - b.x, a.y - b.y), zoom: cameraFrame.zoom, mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } }; }
  });
  framingCanvas.addEventListener('pointermove', e => {
    if (!pointers.has(e.pointerId)) return;
    e.preventDefault(); const old = pointers.get(e.pointerId); pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const r = framingCanvas.getBoundingClientRect();
    if (pointers.size === 1) panCamera((e.clientX - old.x) * W / r.width, (e.clientY - old.y) * (H - SPLIT) / r.height);
    else if (pointers.size === 2 && pinch) {
      const [a, b] = [...pointers.values()], mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      panCamera((mid.x - pinch.mid.x) * W / r.width, (mid.y - pinch.mid.y) * (H - SPLIT) / r.height);
      changeZoom(pinch.zoom * Math.hypot(a.x - b.x, a.y - b.y) / Math.max(1, pinch.distance), framePoint(mid.x, mid.y)); pinch.mid = mid;
    }
  });
  const endPointer = e => { pointers.delete(e.pointerId); pinch = null; if (!pointers.size) $('framingStage').classList.remove('is-dragging'); };
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) framingCanvas.addEventListener(event, endPointer);
  framingCanvas.addEventListener('wheel', e => { if (!hasCamera || recording || startingExport) return; e.preventDefault(); pause(); changeZoom(cameraFrame.zoom * Math.exp(-e.deltaY * (e.deltaMode === 1 ? 16 : 1) * .0015), framePoint(e.clientX, e.clientY)); }, { passive: false });
  framingCanvas.addEventListener('keydown', e => {
    if (!hasCamera) return;
    const step = e.shiftKey ? 40 : 10;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '=', '-', 'Home'].includes(e.key)) {
      e.preventDefault(); e.stopPropagation();
      if (e.key === 'Home') resetFraming();
      else if (['+', '=', '-'].includes(e.key)) changeZoom(cameraFrame.zoom + (e.key === '-' ? -.05 : .05));
      else panCamera(e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0, e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0);
    }
  });
  $('settings').addEventListener('close', () => { pointers.clear(); pinch = null; $('framingStage').classList.remove('is-dragging'); });
  let dividerPointer = null;
  function dividerAt(clientY) { const r = canvas.getBoundingClientRect(); setLayout((clientY - r.top) / r.height * 100); }
  $('splitHandle').addEventListener('pointerdown', e => { if (recording || startingExport) return; e.preventDefault(); pause(); dividerPointer = e.pointerId; $('splitHandle').setPointerCapture(e.pointerId); document.body.classList.add('is-resizing'); dividerAt(e.clientY); });
  $('splitHandle').addEventListener('pointermove', e => { if (e.pointerId === dividerPointer) { e.preventDefault(); dividerAt(e.clientY); } });
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) $('splitHandle').addEventListener(event, () => { dividerPointer = null; document.body.classList.remove('is-resizing'); });
  $('splitHandle').addEventListener('keydown', e => {
    if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault(); e.stopPropagation(); pause(); setLayout(e.key === 'Home' ? 30 : e.key === 'End' ? 70 : config.topPercent + (e.key === 'ArrowUp' ? -1 : 1) * (e.shiftKey ? 5 : 1));
  });
  document.addEventListener('keydown', e => {
    if (recording || startingExport || $('settings').open || /INPUT|TEXTAREA|SELECT|BUTTON|A/.test(e.target.tagName)) return;
    if (e.code === 'Space') { e.preventDefault(); playing ? pause() : play(); }
    if (e.key.toLowerCase() === 'r') { pause(); seek(0); play(); }
    if (e.key.toLowerCase() === 'm') toggleSound();
    if (e.key.toLowerCase() === 'f') $('fullscreenBtn').click();
    if (['ArrowLeft', 'ArrowRight'].includes(e.key)) { e.preventDefault(); pause(); seek(time + (e.key === 'ArrowRight' ? .25 : -.25)); }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && recording) notify('Keep this tab visible while exporting.'); else if (document.hidden && playing) pause(); });
  window.addEventListener('pagehide', () => { if (clipURL) URL.revokeObjectURL(clipURL); });
  for (const target of [$('film'), $('panel-footage')]) for (const name of ['dragover', 'drop']) target.addEventListener(name, e => { e.preventDefault(); if (name === 'drop' && !recording && !startingExport) attach(e.dataTransfer.files[0]); });

  window.codexShort = {
    duration: DURATION, cuts: [...config.scenes.map(s => s.start), DURATION], get ready() { return ready; },
    get state() { return { time, playing, hasCamera, recording, startingExport, audible, split: SPLIT, offset, framing: cameraFrame.y, frame: { ...cameraFrame }, frameBounds: cameraGeometry(), mirrored: mirror }; },
    get template() { return structuredClone(config); }, get script() { return scriptText(); }, get narration() { return cleanScript(); },
    setLayout, get keyboardWindow() { return { ...window.CODEX_SHORT_MEDIA.keyboardWindow }; },
    get captions() { return structuredClone(activeCaptionCues()); },
    setCaptions: setCaptionCues, resetCaptions: resetCaptionCues,
    setCaptionVisibility(value) { config.captions = Boolean(value); $('showCaptions').checked = config.captions; save(); captionChanged(); },
    seek(t) { pause(); seek(t); }, play, pause,
    render(t) { playing = false; pauseMedia(); time = clamp(t, 0, DURATION); draw(time); updateUI(); },
    setResolution(w, h) { canvas.width = w; canvas.height = h; draw(); },
    async capture(t) { playing = false; time = clamp(t, 0, DURATION); draw(time); return canvas.toDataURL('image/jpeg', .96).split(',')[1]; }
  };
  layoutControls(); populateStory(); framingControls(); updateUI(); document.documentElement.style.setProperty('--accent', config.accent);
  const imageLoads = ['laptop', 'camera', 'workspace'].map(name => new Promise((resolve, reject) => {
    const img = new Image(); img.onload = () => { photos[name] = img; resolve(); }; img.onerror = () => reject(new Error(`Missing image: ${name}.jpg`)); img.src = window.CODEX_SHORT_MEDIA.photos[name];
  }));
  Promise.all([...imageLoads, document.fonts.load('800 100px Manrope'), document.fonts.load('500 100px Manrope')]).then(() => {
    ready = true; $('loading').classList.add('done'); $('playBtn').disabled = false; $('exportBtn').disabled = false; requestAnimationFrame(frame);
    seek(!manual && matchMedia('(prefers-reduced-motion: reduce)').matches ? .6 : 0);
    if (!manual && !matchMedia('(prefers-reduced-motion: reduce)').matches) play();
  }).catch(e => { $('loading').querySelector('span').textContent = e.message; console.error(e); });
})();
