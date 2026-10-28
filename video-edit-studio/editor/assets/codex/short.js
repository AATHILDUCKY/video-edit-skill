/* Reusable Codex split-screen short. All visuals are deterministic at a given time.
 * Scene content lives in template.js. Media stays local. No runtime dependencies.
 */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const CAPTION_DEFAULTS = { fontSize: 60, x: .5, y: null, maxWidth: .82, theme: 'highlight', textColor: '#ffffff', backgroundColor: '#0c130f', backgroundOpacity: .92 };
  function cleanCaptionStyle(value, partial = false) {
    const input = value && typeof value === 'object' ? value : {}, result = partial ? {} : { ...CAPTION_DEFAULTS };
    for (const [key,low,high] of [['fontSize',24,120],['x',0,1],['y',0,1],['maxWidth',.3,.95],['backgroundOpacity',0,1]]) {
      if (key === 'y' && Object.hasOwn(input,key) && input[key] === null) result.y = null;
      else if (Object.hasOwn(input,key) && Number.isFinite(input[key])) result[key] = Math.max(low, Math.min(high, input[key]));
    }
    if (['highlight','box','plain'].includes(input.theme)) result.theme = input.theme;
    for (const key of ['textColor','backgroundColor']) if (/^#[0-9a-f]{6}$/i.test(input[key] || '')) result[key] = input[key];
    return result;
  }
  function cleanCaptionStyles(value) { return Object.fromEntries(Object.entries(value && typeof value === 'object' ? value : {}).slice(0,250).map(([id,style]) => [id.slice(0,64),cleanCaptionStyle(style,true)])); }
  const defaults = structuredClone(window.CODEX_SHORT_TEMPLATE);
  const config = structuredClone(defaults);
  config.captionStyle = cleanCaptionStyle(config.captionStyle); config.captionStyles = cleanCaptionStyles(config.captionStyles);
  const sourceScenes = structuredClone(defaults.scenes);
  const SOURCE_DURATION = sourceScenes.reduce((sum, scene) => sum + scene.duration, 0);
  let sourceClock = 0;
  sourceScenes.forEach(scene => { scene.sourceStart = sourceClock; sourceClock += scene.duration; });
  function cleanVisual(value, kind) {
    const v = value && typeof value === 'object' ? value : {};
    const numeric = (key, base, low, high) => Number.isFinite(Number(v[key])) ? Math.max(low, Math.min(high, Number(v[key]))) : base;
    return { preset: Object.hasOwn(window.CONCEPT_VIDEO_SCENES || {}, v.preset) || (['hook','prompt','visuals','cuts','sound','camera','export','end'].includes(v.preset) && sourceScenes.some(scene => scene.kind === v.preset)) ? v.preset : (sourceScenes.find(scene => scene.kind === kind)?.visual?.preset || kind),
      accent: /^#[0-9a-f]{6}$/i.test(v.accent || '') ? v.accent : null,
      scale: numeric('scale', 1, .6, 1.6), x: numeric('x', 0, -180, 180), y: numeric('y', 0, -140, 140),
      layout: ['camera','split','motion','broll','outro'].includes(v.layout) ? v.layout : 'split',
      video: typeof v.video === 'string' && /^media\/[a-zA-Z0-9_.-]+$/.test(v.video) ? v.video : null,
      videoIn: numeric('videoIn',0,0,36000),
      image: typeof v.image === 'string' && v.image.length <= 3500000 && /^data:image\/(png|jpeg|webp);base64,/.test(v.image) ? v.image : null };
  }
  let captionTimebase = defaults.targetDuration || SOURCE_DURATION;
  const manual = new URLSearchParams(location.search).has('render');
  const storageKey = "html-video-explainer-demo-v2";
  // Upgrade untouched stock copy while keeping any lines the creator has edited.
  const previousStory = {};
  try {
    const saved = !manual && JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (saved) {
      for (const k of ['creator', 'accent', 'captions', 'cameraAudio', 'sfxVolume', 'musicVolume', 'keyboardSound', 'topPercent', 'promptText', 'targetDuration', 'autoFitVideo', 'palette']) {
        if (k === 'accent' && saved.themeVersion !== defaults.themeVersion) continue;
        if (typeof saved[k] === typeof config[k]) config[k] = saved[k];
      }
      if (saved.captionStyle) config.captionStyle = cleanCaptionStyle(saved.captionStyle);
      if (saved.captionStyles) config.captionStyles = cleanCaptionStyles(saved.captionStyles);
      if (saved.sceneWeights && typeof saved.sceneWeights === 'object') config.sceneWeights = saved.sceneWeights;
      if(saved.brand)config.brand=saved.brand;
      if(Number.isFinite(saved.motionIntensity))config.motionIntensity=saved.motionIntensity;
      if (saved.frame && typeof saved.frame === 'object') config.frame = { ...config.frame, ...saved.frame };
      if (Array.isArray(saved.captionCues)) {
        const oldScriptSnapshot = saved.contentVersion !== defaults.contentVersion && Array.isArray(saved.scenes)
          && saved.captionCues.length === saved.scenes.length && saved.captionCues.every((cue, i) => {
            const scene = saved.scenes[i];
            return cue.text === scene.voice && Math.abs(cue.start - scene.start) < .001 && Math.abs(cue.end - scene.end) < .001;
          });
        if (!oldScriptSnapshot) { config.captionCues = saved.captionCues; captionTimebase = Number(saved.targetDuration) || SOURCE_DURATION; }
      }
      if (Array.isArray(saved.scenes)) saved.scenes.forEach(s => {
        const scene = config.scenes.find(item => item.kind === s.kind);
        if (scene && Array.isArray(s.labels)) scene.labels = s.labels;
        if (scene && s.visual) scene.visual = cleanVisual(s.visual, scene.kind);
        if (scene) for (const k of ['title', 'emphasis', 'voice']) if (typeof s[k] === 'string') {
          if (saved.contentVersion !== defaults.contentVersion && s[k] === previousStory[s.kind]?.[k]) continue;
          scene[k] = s[k].slice(0, k === 'voice' ? 240 : 50);
        }
      });
    }
  } catch (_) { /* The template also works when file-origin storage is unavailable. */ }
  config.cameraFollowsSpeed = false;
  if (defaults.transcriptMode) { config.autoFitVideo = false; config.targetDuration = defaults.targetDuration; }
  if (!/^#[0-9a-f]{6}$/i.test(config.accent)) config.accent = defaults.accent;
  config.topPercent = Math.max(30, Math.min(70, Math.round(Number(config.topPercent) || 50)));
  config.promptText = String(config.promptText).slice(0, 180);
  let DURATION = SOURCE_DURATION;
  const W = 1080, H = 1920, BASE_TOP = 960;
  function rebuildTiming(value) {
    const next = Number(value);
    DURATION = Number.isFinite(next) && next > 0 ? Math.round(next * 1000000) / 1000000 : (defaults.targetDuration || SOURCE_DURATION);
    config.targetDuration = DURATION;
    const weights = config.scenes.map((scene, index) => {
      const custom = Number(config.sceneWeights?.[scene.kind]);
      return Number.isFinite(custom) && custom > 0 ? custom : sourceScenes[index].duration / SOURCE_DURATION;
    });
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let cursor = 0;
    config.scenes.forEach((scene, index) => {
      const source = sourceScenes[index];
      scene.duration = DURATION * weights[index] / totalWeight;
      const ratio = scene.duration / source.duration;
      scene.motionDuration = source.motionDuration || source.duration;
      scene.start = cursor; cursor += scene.duration; scene.end = cursor;
      if (source.typing) scene.typing = { start: source.typing.start * ratio, end: source.typing.end * ratio };
      if (source.audio) scene.audio = source.audio.map(event => ({ ...event, at: event.at * ratio }));
    });
    config.scenes.at(-1).end = DURATION;
  }
  rebuildTiming(config.targetDuration);
  if (Array.isArray(config.captionCues) && captionTimebase !== DURATION) {
    const retimed = config.captionCues.map(cue => ({ ...cue, start: cue.start * DURATION / captionTimebase, end: cue.end * DURATION / captionTimebase }));
    // Preserve very short custom captions instead of silently dropping them on reload.
    if (retimed.some(cue => cue.end - cue.start < .001)) rebuildTiming(captionTimebase);
    else config.captionCues = retimed;
  }
  let SPLIT = Math.round(H * config.topPercent / 100);
  const canvas = $('reelCanvas'), ctx = canvas.getContext('2d', { alpha: false });
  const camera = $('sourceVideo'), sfx = $('soundtrack'), music = $('musictrack'), keyboard = $('keyboardtrack');
  sfx.src = window.CODEX_SHORT_MEDIA.sfx;
  music.src = window.CODEX_SHORT_MEDIA.music;
  keyboard.src = window.CODEX_SHORT_MEDIA.keyboard;
  const C = { ink: '#171c1b', white: '#ffffff', muted: '#75877b', line: '#e7ddd8', blue: '#bcd5ff' };
  let captionBounds = null;
  const photos = {};
  const visualImages = new Map();
  let activeVisual = null, visualPass = null;
  let time = 0, playing = false, origin = 0, ready = false, recording = false, startingExport = false;
  let hasCamera = false, clipURL = null, mirror = Boolean(config.frame.mirrored), audible = false, offset = 0;
  const cameraFrame = { x: Math.max(0, Math.min(1, Number(config.frame.x) || 0)), y: Math.max(0, Math.min(1, Number(config.frame.y) || 0)), zoom: Math.max(1, Math.min(3, Number(config.frame.zoom) || 1)), mode: config.frame.mode === 'fit' ? 'fit' : 'fill' };
  const framingCanvas = $('framingCanvas'), framingCtx = framingCanvas.getContext('2d', { alpha: false });
  const cameraCache = document.createElement('canvas'), cameraCacheCtx = cameraCache.getContext('2d');
  let cameraCacheReady = false;
  const pointers = new Map(); let pinch = null;
  let mediaRecorder = null, exportStream = null, chunks = [], cancelled = false;
  let audioContext = null, mixDestination = null, monitorGain = null, sfxGain = null, musicGain = null, cameraGain = null, keyboardGain = null;
  let storageNotice = false;
  let toastTimer = null, lastUI = 0, previousCameraCheck = 0;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const mix = (a, b, p) => a + (b - a) * p;
  const out = x => 1 - (1 - clamp(x)) ** 4;
  const io = x => { x = clamp(x); return x < .5 ? 8 * x ** 4 : 1 - (-2 * x + 2) ** 4 / 2; };
  const enter = (t, delay = 0, d = .38) => out((t - delay) / d);
  const fmt = t => `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  function validateCaptionCues(cues, limit = DURATION, minimum = .001) {
    if (!Array.isArray(cues) || cues.length > 250) throw new Error('Use a caption list with at most 250 captions.');
    const seen = new Set();
    const clean = cues.map((cue, index) => {
      if (!cue || !Number.isFinite(cue.start) || !Number.isFinite(cue.end) || typeof cue.text !== 'string') throw new Error('Each caption needs text, a start time, and an end time.');
      const start = Math.round(clamp(cue.start, 0, limit) * 1000) / 1000, end = Math.round(clamp(cue.end, 0, limit) * 1000) / 1000;
      if (end - start < minimum - .000001) throw new Error('Each caption needs a positive time range.');
      let id = typeof cue.id === 'string' ? cue.id.slice(0, 64) : `caption-${index}`;
      while (seen.has(id)) id += '-copy'; seen.add(id);
      const text = cue.text.slice(0, 240), labels = text.trim().split(/\s+/).filter(Boolean);
      let aligned = {};
      if (Array.isArray(cue.words) && cue.words.length === labels.length && cue.words.every(w => Number.isFinite(w.start) && Number.isFinite(w.end) && w.end > w.start)) {
        const basis = cue.wordTimebase || { start: cue.start, end: cue.end };
        if (Number.isFinite(basis.start) && Number.isFinite(basis.end) && basis.end > basis.start) {
          const ratio = (end-start)/(basis.end-basis.start);
          const words = cue.words.map((w,i) => ({ word: labels[i], start: clamp(start+(w.start-basis.start)*ratio,start,end), end: clamp(start+(w.end-basis.start)*ratio,start,end) }));
          if (words.every((w,i) => w.end > w.start && (!i || w.start >= words[i-1].end-.001))) aligned = { words, wordTimebase: { start, end } };
        }
      }
      return { id, start, end, text, ...aligned, ...(cue.style && typeof cue.style === 'object' ? { style: cleanCaptionStyle(cue.style,true) } : {}) };
    }).sort((a, b) => a.start - b.start || a.end - b.end);
    for (let i = 1; i < clean.length; i++) if (clean[i].start < clean[i-1].end - .001) throw new Error('Caption times overlap. Move one caption or trim its edge.');
    return clean;
  }
  function activeCaptionCues() {
    const cues = config.captionCues === null ? config.scenes.map(s => ({ id: `scene-${s.kind}`, start: s.start, end: s.end, text: s.voice })) : config.captionCues;
    return cues.map(cue => {
      const style = { ...(cue.style || {}), ...(config.captionStyles[cue.id] || {}) };
      return Object.keys(style).length ? { ...cue, style } : cue;
    });
  }
  function captionStyleFor(id) { const cue = id ? activeCaptionCues().find(cue => cue.id === id) : null; return cleanCaptionStyle({ ...config.captionStyle, ...(cue?.style || {}) }); }
  function setCaptionStyle(patch, id = null) {
    if (recording || startingExport) return false;
    const clean = cleanCaptionStyle(patch,true);
    if (id !== null) {
      if (!activeCaptionCues().some(cue => cue.id === id)) throw new Error('Select a caption first.');
      config.captionStyles = { ...config.captionStyles, [id]: { ...(config.captionStyles[id] || {}), ...clean } };
    } else {
      config.captionStyle = cleanCaptionStyle({ ...config.captionStyle, ...clean });
      // An explicit All captions edit overrides those same fields on individual cues.
      for (const override of Object.values(config.captionStyles)) for (const key of Object.keys(clean)) delete override[key];
      if (config.captionCues) for (const cue of config.captionCues) if (cue.style) for (const key of Object.keys(clean)) delete cue.style[key];
    }
    save(); window.dispatchEvent(new CustomEvent('codex:caption-style')); return true;
  }
  function resetCaptionStyle(id = null) {
    if (recording || startingExport) return;
    if (id === null) { config.captionStyle = { ...CAPTION_DEFAULTS }; config.captionStyles = {}; if (config.captionCues) config.captionCues.forEach(cue => delete cue.style); }
    else { delete config.captionStyles[id]; if (config.captionCues) { const cue = config.captionCues.find(cue => cue.id === id); if (cue) delete cue.style; } }
    save(); captionChanged(); window.dispatchEvent(new CustomEvent('codex:caption-style'));
  }
  function restoreCaptionAppearance(appearance) {
    if (recording || startingExport) return;
    config.captionStyle = cleanCaptionStyle(appearance.style); config.captionStyles = cleanCaptionStyles(appearance.overrides);
    save(); window.dispatchEvent(new CustomEvent('codex:caption-style'));
  }

  function captionChanged() { window.dispatchEvent(new CustomEvent('codex:captions')); }
  function setCaptionCues(cues) { if (recording || startingExport) return; config.captionCues = validateCaptionCues(cues); save(); captionChanged(); }
  function resetCaptionCues() { if (recording || startingExport) return; const scale=DURATION/(defaults.targetDuration||SOURCE_DURATION); config.captionCues = defaults.transcriptMode && Array.isArray(defaults.captionCues) ? validateCaptionCues(defaults.captionCues.map(c=>({...structuredClone(c),start:c.start*scale,end:c.end*scale}))) : null; save(); captionChanged(); }
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
    ctx.font = `${weight} ${size}px ${mono ? 'ui-monospace, monospace' : 'Manrope, \"Noto Sans Tamil\", Arial, sans-serif'}`;
    ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = color;
    ctx.letterSpacing = mono || /[\u0B80-\u0BFF]/.test(s) ? '0px' : `${-size * .045}px`;
    const measured = ctx.measureText(s).width;
    if (measured > maxWidth) ctx.font = `${weight} ${size * maxWidth / measured}px ${mono ? 'ui-monospace, monospace' : 'Manrope, \"Noto Sans Tamil\", Arial, sans-serif'}`;
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
    if (visualPass === 'art') return;
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
      ctx.font = `500 ${fontSize}px Manrope, "Noto Sans Tamil"`; let lines = 1, lineWidth = 0;
      for (const word of str.split(/\s+/)) { const width = ctx.measureText(word + ' ').width; if (lineWidth + width > 775 && lineWidth) { lines++; lineWidth = width; } else lineWidth += width; }
      if (lines <= 4 && (lines - 1) * fontSize * 1.42 <= 145) break;
    }
    ctx.font = `500 ${fontSize}px Manrope, "Noto Sans Tamil"`; ctx.letterSpacing = '-1.1px';
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
  // Concept extension: keep editor/media controls separate from each new explanation.
  const sceneTools = { ctx, W, BASE_TOP, C, box, txt, reveal, image, rotatedImage, icon, codeMark, bar, bg, thinArrow, clamp, mix, out, io, enter,
    get accent() { return activeVisual?.accent || config.accent; },
    get visualPass() { return visualPass; },
    get images() { return photos; },
    localSeconds(scene, t) { return t * scene.duration / (scene.motionDuration || scene.duration); },
    typingProgress(scene, t) {
      const real = t * scene.duration / (scene.motionDuration || scene.duration);
      const range = scene.typing || { start: .26 * scene.duration / (scene.motionDuration || scene.duration), end: 1.65 * scene.duration / (scene.motionDuration || scene.duration) };
      return clamp((real - range.start) / Math.max(.01, range.end - range.start));
    }
  };
  for (const [kind, render] of Object.entries(window.CONCEPT_VIDEO_SCENES || {})) {
    if (typeof render === 'function') renderers[kind] = (scene, t) => render(scene, t, sceneTools);
  }
  function sceneAt(t) { return config.scenes.find(s => t >= s.start && t < s.end) || config.scenes.at(-1); }
  function loadVisualImage(data) {
    if (visualImages.has(data)) return visualImages.get(data).promise;
    const record = { image: new Image(), loaded: false };
    record.promise = new Promise((resolve, reject) => {
      record.image.onload = () => { record.loaded = true; if (ready) draw(); resolve(record.image); };
      record.image.onerror = () => { visualImages.delete(data); reject(new Error('Could not decode this image.')); };
    });
    visualImages.set(data, record); record.image.src = data;
    return record.promise;
  }
  function paintTopScene(s, local) {
    const visual = cleanVisual(s.visual, s.kind);
    box(0, 0, W, SPLIT, C.white);
    const scale = Math.min(1, SPLIT / BASE_TOP);
    ctx.save(); ctx.translate((W - W * scale) / 2, (SPLIT - BASE_TOP * scale) / 2); ctx.scale(scale, scale);
    activeVisual = visual;
    const previousAccent = config.accent; config.accent = visual.accent || config.accent;
    try {
      if (visual.image) {
        bg(); reveal(s.title, 540, 172, s.title.length > 17 ? 82 : 100, local * s.motionDuration / s.duration, C.ink);
        if (s.emphasis) reveal(s.emphasis, 540, 281, 104, local * s.motionDuration / s.duration, sceneTools.accent, .08);
        const record = visualImages.get(visual.image);
        if (record?.loaded) {
          const img = record.image, p = enter(local / s.duration, .025, .18);
          const zoom = visual.scale * (.97 + .03 * p);
          const fit = Math.min(900 / img.naturalWidth, 520 / img.naturalHeight) * zoom;
          ctx.save(); ctx.beginPath(); ctx.rect(0, 310, W, 650); ctx.clip(); ctx.globalAlpha = p;
          ctx.drawImage(img, 540 + visual.x - img.naturalWidth * fit / 2, 605 + visual.y + 24 * (1 - p) - img.naturalHeight * fit / 2, img.naturalWidth * fit, img.naturalHeight * fit); ctx.restore();
        }
      } else {
        const preset = sourceScenes.find(scene => scene.kind === visual.preset) || sourceScenes.find(scene => scene.kind === s.kind);
        const shot = { ...s, motionDuration: preset.motionDuration || preset.duration };
        if (preset.typing) shot.typing = { start: preset.typing.start * s.duration / preset.duration, end: preset.typing.end * s.duration / preset.duration };
        else delete shot.typing;
        const t = local * shot.motionDuration / s.duration;
        const render = renderers[visual.preset] || renderers[s.kind];
        render(shot, t);
        if (visual.scale !== 1 || visual.x || visual.y) {
          ctx.save(); ctx.beginPath(); ctx.rect(0, 310, W, 650); ctx.clip(); box(0, 310, W, 650, C.white);
          ctx.translate(540 + visual.x, 605 + visual.y); ctx.scale(visual.scale, visual.scale); ctx.translate(-540, -605);
          visualPass = 'art'; render(shot, t); visualPass = null; ctx.restore();
        }
      }
    } finally { config.accent = previousAccent; activeVisual = null; visualPass = null; ctx.restore(); }
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
    return $('loopCamera').checked ? start + (t * cameraRate()) % length : Math.min(start + t * cameraRate(), camera.duration - .035);
  }
  function framingHeight(){return ['camera','broll'].includes(sceneAt(time).visual?.layout)?H:H-SPLIT}
  function cameraGeometry() {
    const sw = camera.videoWidth || W, sh = camera.videoHeight || (framingHeight());
    const scale = (cameraFrame.mode === 'fit' ? Math.min(W / sw, (framingHeight()) / sh) : Math.max(W / sw, (framingHeight()) / sh)) * cameraFrame.zoom;
    const w = sw * scale, h = sh * scale;
    return { x: (W - w) * cameraFrame.x, y: (framingHeight() - h) * cameraFrame.y, w, h };
  }
  function paintCamera(target, top = 0) {
    const g = cameraGeometry();
    const source = camera.readyState >= 2 ? camera : cameraCacheReady ? cameraCache : null;
    if (!source) return;
    target.save(); target.beginPath(); target.rect(0, top, W, framingHeight()); target.clip();
    // Mirror within the image bounds, so dragging always follows the pointer.
    if (mirror) { target.translate(g.x + g.w, top + g.y); target.scale(-1, 1); target.drawImage(source, 0, 0, g.w, g.h); }
    else target.drawImage(source, g.x, top + g.y, g.w, g.h);
    target.restore();
  }
  function drawFraming() {
    const height=framingHeight();if(framingCanvas.height!==height)framingCanvas.height=height;
    $('framingStage').style.aspectRatio=`${W} / ${height}`;
    if (!hasCamera || $('settings').open === false || $('panel-footage').hidden) return;
    framingCtx.setTransform(1, 0, 0, 1, 0, 0); framingCtx.fillStyle = '#171d1a'; framingCtx.fillRect(0, 0, W, framingHeight());
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
  function changeZoom(value, anchor = { x: W / 2, y: (framingHeight()) / 2 }) {
    const old = cameraGeometry(), px = (anchor.x - old.x) / old.w, py = (anchor.y - old.y) / old.h;
    cameraFrame.zoom = clamp(value, 1, 3);
    const next = cameraGeometry();
    if (Math.abs(W - next.w) > .01) cameraFrame.x = clamp((anchor.x - px * next.w) / (W - next.w));
    if (Math.abs(framingHeight() - next.h) > .01) cameraFrame.y = clamp((anchor.y - py * next.h) / (framingHeight() - next.h));
    framingControls(); draw();
  }
  function panCamera(dx, dy) {
    const g = cameraGeometry();
    if (Math.abs(W - g.w) > .01) cameraFrame.x = clamp(cameraFrame.x + dx / (W - g.w));
    if (Math.abs(framingHeight() - g.h) > .01) cameraFrame.y = clamp(cameraFrame.y + dy / (framingHeight() - g.h));
    framingControls(); draw();
  }
  function framePoint(clientX, clientY) {
    const r = framingCanvas.getBoundingClientRect(); return { x: (clientX - r.left) * W / r.width, y: (clientY - r.top) * (framingHeight()) / r.height };
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
  function contrastText(color) {
    const values = [1,3,5].map(i => parseInt(color.slice(i,i+2),16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
    const lum = values[0] * .2126 + values[1] * .7152 + values[2] * .0722;
    return (lum + .05) / .05 >= 1.05 / (lum + .05) ? '#000000' : '#ffffff';
  }
  function captions(t) {
    const cues = activeCaptionCues();
    const cue = cues.find(cue => t >= cue.start && t < cue.end) || (t === DURATION && cues.at(-1)?.end === DURATION ? cues.at(-1) : null);
    if (!cue) return;
    const words = cue.text.trim().split(/\s+/).filter(Boolean); if (!words.length) return;
    const style = captionStyleFor(cue.id), progress = clamp((t - cue.start) / (cue.end - cue.start), 0, .9999);
    const measured = Array.isArray(cue.words) && cue.words.length === words.length;
    const activeIndex = measured ? cue.words.findIndex(w=>t>=w.start&&t<w.end) : -1;
    const displayIndex = measured ? Math.max(0,cue.words.reduce((last,w,i)=>t>=w.start?i:last,0)) : Math.floor(progress*words.length);
    const available = W * style.maxWidth - 48;
    let size = style.fontSize;
    function font() { ctx.font = `800 ${size}px Manrope, \"Noto Sans Tamil\", Arial, sans-serif`; ctx.letterSpacing = '0px'; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left'; }
    font(); const widest = Math.max(...words.map(word => ctx.measureText(word).width));
    if (widest > available) { size *= available / widest; font(); }
    const gap = size * .32, groups = []; let group = [], length = 0;
    words.forEach((word,index) => {
      const width = ctx.measureText(word).width;
      if ((length + width + (group.length ? gap : 0) > available || group.length >= 5) && group.length) { groups.push(group); group = []; length = 0; }
      length += width + (group.length ? gap : 0); group.push({ word,index,width });
    });
    if (group.length) groups.push(group);
    const current = groups.find(group => group.some(word => word.index === displayIndex)) || groups.at(-1);
    const total = current.reduce((sum,word) => sum + word.width,0) + gap * (current.length - 1), width = total + 48, height = size * 1.8;
    const centreX = clamp(style.x * W,24 + width / 2,W - 24 - width / 2);
    const defaultY = SPLIT + (H - SPLIT) * .85 - size * .317;
    const centreY = clamp(style.y === null ? defaultY : style.y * H,24 + height / 2,H - 24 - height / 2);
    const baseline = centreY + size * .317;
    captionBounds = { id: cue.id, x: centreX - width / 2, y: centreY - height / 2, width, height, centreX, centreY, fontSize: size };
    if (style.theme !== 'plain') box(captionBounds.x,captionBounds.y,width,height,style.backgroundColor + Math.round(style.backgroundOpacity * 255).toString(16).padStart(2,'0'),17);
    let x = centreX - total / 2;
    current.forEach(({word,index,width}) => {
      if (style.theme === 'highlight' && index === activeIndex) box(x - 8,baseline - size * .983,width + 16,size * 1.3,config.accent,9);
      font(); ctx.fillStyle = style.theme === 'highlight' && index === activeIndex ? contrastText(config.accent) : style.textColor;
      if (style.theme === 'plain') { ctx.strokeStyle = contrastText(style.textColor); ctx.lineWidth = Math.max(2,size * .06); ctx.lineJoin = 'round'; ctx.strokeText(word,x,baseline); }
      ctx.fillText(word,x,baseline); x += width + gap;
    });
    ctx.letterSpacing = '0px';
  }

  function fullCamera() {
    ctx.fillStyle='#101714';ctx.fillRect(0,0,W,H);
    if(!hasCamera||camera.readyState<2)return;
    const fit=cameraFrame.mode==='fit'?Math.min:Math.max;
    const scale=fit(W/camera.videoWidth,H/camera.videoHeight)*cameraFrame.zoom;
    const w=camera.videoWidth*scale,h=camera.videoHeight*scale;
    ctx.save();if(mirror){ctx.translate(W,0);ctx.scale(-1,1)}
    ctx.drawImage(camera,(W-w)*cameraFrame.x,(H-h)*cameraFrame.y,w,h);ctx.restore();
  }
  function draw(t = time) {
    captionBounds = null;
    ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0); ctx.globalAlpha = 1;
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    const scene=sceneAt(t),layout=scene.visual?.layout||'split';
    window.videoEditMedia?.sync(scene,t,playing);
    window.videoEditMedia?.audio(t,playing,audible);
    if(layout==='outro'){
      ctx.fillStyle='#101714';ctx.fillRect(0,0,W,H);
      window.videoEditMedia?.draw(ctx,scene,t,W,H);
    }else if(layout==='camera'||layout==='broll'){
      fullCamera();if(layout==='broll')window.videoEditMedia?.draw(ctx,scene,t,W,H);
      if(config.captions)captions(t);
    }else if(layout==='motion'){
      ctx.fillStyle='#ffffff';ctx.fillRect(0,0,W,H);
      ctx.save();ctx.translate(0,(H-BASE_TOP)/2);const old=SPLIT;SPLIT=BASE_TOP;paintTopScene(scene,t-scene.start);SPLIT=old;ctx.restore();
      if(config.captions)captions(t);
    }else{
      top(clamp(t,0,DURATION));bottom(clamp(t,0,DURATION));
      if(scene.visual?.video){window.videoEditMedia?.draw(ctx,scene,t,W,SPLIT);if(config.captions)captions(t)}
    }
    if(layout!=='outro'&&config.creator){ctx.save();ctx.font='500 26px Manrope';ctx.fillStyle=layout==='camera'||layout==='broll'?'#ffffffbb':'#697570';ctx.fillText(config.creator,52,88);ctx.restore()}
    const split=layout==='split';$('splitHandle').hidden=!split;
    $('cameraTarget').style.top=split?`${config.topPercent}%`:'0';
    $('cameraTools').style.top=split?`calc(${config.topPercent}% + 14px)`:'14px';
    drawFraming();
  }

  function notify(message, timeout = 0) { clearTimeout(toastTimer); $('status').textContent = message; if (timeout) toastTimer = setTimeout(() => $('status').textContent = '', timeout); }
  function persist() { try { localStorage.setItem(storageKey, JSON.stringify(config)); storageNotice = false; } catch (_) { if (!storageNotice) { storageNotice = true; notify('This template exceeds browser storage. Use Save template to keep your images and edits.', 6000); } } }
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
  function durationControls() {
    $('totalDuration').value = DURATION;
    const auto = hasCamera && config.autoFitVideo;
    $('durationReadout').value = `${Number(DURATION.toFixed(3))}s · ${auto ? 'matched to video' : 'preview duration'}`;
    $('autoFitVideo').checked = config.autoFitVideo;
    document.querySelectorAll('[data-duration]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.duration) === DURATION)));
    document.documentElement.style.setProperty('--video-duration', String(DURATION));
    $('scrubber').max = DURATION; $('timelineRuler').setAttribute('aria-valuemax', String(DURATION));
    document.querySelector('.scene-details .script-head strong').textContent = `${DURATION}-second recording script`;
    $('videoDetails').textContent = `9:16 · 1080 × 1920 · ${DURATION} seconds · ${config.fps||30} fps`;
    $('autoFitVideo').disabled = recording || startingExport || defaults.transcriptMode;
    $('totalDuration').disabled = recording || startingExport || auto || defaults.transcriptMode;
    document.querySelectorAll('[data-duration]').forEach(b => b.disabled = recording || startingExport || auto || defaults.transcriptMode);
  }
  function setDuration(value, options = {}) {
    if (defaults.transcriptMode) { notify("Rebuild the cuts and transcript to change the recording duration.", 4000); return false; }
    if (recording || startingExport) return false;
    if (hasCamera && config.autoFitVideo && !options.fromClip) { notify('The reel matches your uploaded clip. Turn off automatic matching to set a manual duration.', 4000); return false; }
    const next = Math.round(Number(value) * 1000000) / 1000000;
    if (!Number.isFinite(next) || next <= 0) { notify('Choose a positive video duration.', 4000); durationControls(); return false; }
    const ratio = next / DURATION;
    let captions = config.captionCues;
    try { if (captions !== null) captions = validateCaptionCues(captions.map(cue => ({ ...cue, start: cue.start * ratio, end: cue.end * ratio })), next); }
    catch (_) { notify('These caption ranges are too small to fit this clip. Adjust their timing first.', 5000); durationControls(); return false; }
    pause(); const nextTime = time * ratio;
    rebuildTiming(next); config.captionCues = captions;
    syncMediaRates(); durationControls(); populateStory(); seek(nextTime); save();
    window.dispatchEvent(new CustomEvent('codex:duration', { detail: { duration: DURATION, ratio } }));
    notify(`${DURATION}-second video. All scenes and captions retimed.`, 3500);
    return true;
  }
  function updateUI() {
    durationControls();
    $('scrubber').value = time; $('scrubber').style.setProperty('--progress', `${time / DURATION * 100}%`); $('timeLabel').textContent = `${fmt(time)} / ${fmt(DURATION)}`;
    $('playBtn').innerHTML = playing ? '<svg viewBox="0 0 24 24"><path d="M8 5v14M16 5v14" stroke-width="3"/></svg>' : '<svg viewBox="0 0 24 24"><path class="solid" d="M7 4l14 8-14 8z"/></svg>';
    $('playBtn').setAttribute('aria-label', playing ? 'Pause' : time >= DURATION ? 'Replay' : 'Play');
    $('soundBtn').innerHTML = audible ? '<svg viewBox="0 0 24 24"><path d="M11 4L5 9H2v6h3l6 5zM15 8a6 6 0 010 8m3-11a10 10 0 010 14"/></svg>' : '<svg viewBox="0 0 24 24"><path d="M11 4L5 9H2v6h3l6 5zM16 9l6 6m0-6l-6 6"/></svg>';
    $('soundBtn').setAttribute('aria-label', audible ? 'Mute preview' : 'Turn sound on');
    $('cameraTarget').hidden = hasCamera || recording || startingExport;
    $('cameraTools').hidden = !hasCamera || recording || startingExport || ['outro','motion'].includes(sceneAt(time).visual?.layout);
    $('framingCard').hidden = !hasCamera;
    document.body.classList.toggle('is-playing', playing);
  }
  function pauseMedia() { camera.pause(); sfx.pause(); music.pause(); keyboard.pause();window.videoEditMedia?.pause(); }
  function setCameraTime(value) {
    if (camera.readyState >= 2 && camera.videoWidth) {
      if (cameraCache.width !== camera.videoWidth || cameraCache.height !== camera.videoHeight) { cameraCache.width = camera.videoWidth; cameraCache.height = camera.videoHeight; }
      cameraCacheCtx.drawImage(camera, 0, 0); cameraCacheReady = true;
    }
    camera.currentTime = value;
  }
  function pause() { if (recording || startingExport) return; playing = false; pauseMedia(); updateUI(); }
  function seek(t) {
    time = clamp(t, 0, DURATION); syncMediaRates();
    if (hasCamera && camera.readyState >= 1) setCameraTime(sourceTime(time));
    for (const media of [sfx, music, keyboard]) if (Number.isFinite(media.duration)) media.currentTime = Math.min(soundPosition().time, Math.max(0, media.duration - .01));
    draw(); updateUI();
  }
  async function setupAudio() {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      mixDestination = audioContext.createMediaStreamDestination();
      const mixBus = audioContext.createGain(); mixBus.gain.value = .9;
      const compressor = audioContext.createDynamicsCompressor(); compressor.threshold.value = -6; compressor.ratio.value = 4;
      window.videoEditMedia?.connect(audioContext,mixBus);
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
  function playbackRate() { return SOURCE_DURATION / DURATION; }
  function soundPosition(at = time) {
    const scene = sceneAt(at), index = config.scenes.indexOf(scene), source = sourceScenes[index];
    return { time: source.sourceStart + clamp((at - scene.start) / scene.duration) * source.duration, rate: source.duration / scene.duration };
  }
  function cameraRate() { return 1; }
  function syncMediaRates() {
    const sound = soundPosition();
    for (const media of [sfx, music, keyboard]) {
      const rate = clamp(sound.rate, .0625, 16);
      if (Math.abs(media.playbackRate - rate) > .000001) media.playbackRate = rate;
      if (playing && (audioContext || audible) && Number.isFinite(media.duration) && Math.abs(media.currentTime - sound.time) > .24) media.currentTime = Math.min(sound.time, Math.max(0, media.duration - .01));
      media.preservesPitch = true;
    }
    camera.playbackRate = cameraRate(); camera.preservesPitch = true;
    if (keyboardGain) {
      const scene = sceneAt(time), visual = cleanVisual(scene.visual, scene.kind);
      const preset = sourceScenes.find(item => item.kind === visual.preset);
      keyboardGain.gain.value = config.keyboardSound && !visual.image && preset?.typing ? config.sfxVolume * .85 : 0;
    }
  }
  function setMix() {
    syncMediaRates();
    const inOutro=Boolean(config.outro&&time>=config.outro.start);
    if(inOutro)camera.pause();
    if (sfxGain) { sfxGain.gain.value = inOutro?0:config.sfxVolume; musicGain.gain.value = inOutro?0:config.musicVolume; cameraGain.gain.value = config.cameraAudio && !inOutro ? 1 : 0; keyboardGain.gain.value = !inOutro && config.keyboardSound && (config.promptText.trim() || config.scenes.some(s => s.typing)) ? config.sfxVolume * .85 : 0; monitorGain.gain.value = audible ? 1 : 0; }
    sfx.muted = !audioContext && !audible; music.muted = !audioContext && !audible; camera.muted = !audioContext && (!audible || !config.cameraAudio || inOutro);
    keyboard.muted = !audioContext && !audible; syncMediaRates();
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
    try { await setupAudio(); setMix(); if (playing) { for (const media of [sfx, music, keyboard]) media.currentTime = Math.min(soundPosition().time, SOURCE_DURATION - .01); await playMedia(); } } catch (e) { audible = false; notify('Sound is not available in this browser.', 4000); }
    updateUI();
  }
  function frame(now) {
    if (playing) {
      time = Math.min((now - origin) / 1000, DURATION);
      if (hasCamera && now - previousCameraCheck > 250 && !camera.seeking && camera.readyState >= 2) {
        const target = sourceTime(time); if (Math.abs(camera.currentTime - target) > .3) setCameraTime(target); previousCameraCheck = now;
      }
      setMix(); draw();
      if (now - lastUI > 85) { updateUI(); lastUI = now; if (recording) notify(`Rendering ${Math.round(time / DURATION * 100)}%`); }
      if (time >= DURATION) {
        if (recording) finishRecording();
        else if ($('loopPreview').checked) { seek(0); play(); }
        else pause();
      }
    }
    requestAnimationFrame(frame);
  }
  function fitUploadedVideo() {
    if (!hasCamera || !Number.isFinite(camera.duration) || camera.duration <= 0) return false;
    const remaining = Math.max(.001, camera.duration - offset);
    const fitted = setDuration(remaining, { fromClip: true });
    if (fitted) { $('loopCamera').checked = false; seek(0); }
    return fitted;
  }
  async function attach(file, localURL=null) {
    if (!file || (!file.type.startsWith('video/') && !/\.(mp4|mov|webm|m4v)$/i.test(file.name))) { notify('Choose a supported video file.', 4000); return; }
    pause(); hasCamera = false; cameraCacheReady = false; camera.pause(); if (clipURL) URL.revokeObjectURL(clipURL);
    framingControls(); updateUI();
    clipURL = localURL || URL.createObjectURL(file); camera.src = clipURL; camera.muted = true; $('clipName').textContent = `Loading ${file.name}…`;
    let initialized = false;
    camera.onloadeddata = () => {
      if (initialized) return;
      if (!Number.isFinite(camera.duration) || camera.duration <= 0) { $('clipName').textContent = 'Could not read this clip’s duration. Try an H.264 MP4.'; return; }
      initialized = true; hasCamera = true; offset = 0;
      $('clipOffset').value = offset; $('clipOffset').max = Math.max(0, camera.duration - .05);
      $('clipName').textContent = `${file.name} · ${camera.videoWidth} × ${camera.videoHeight} · ${camera.duration.toFixed(3)}s · original speed`;
      $('removeClip').hidden = false;
      framingControls();
      if (config.autoFitVideo) fitUploadedVideo(); else seek(0);
      setMix(); save(); updateUI();
      notify(config.autoFitVideo ? 'Clip matched. Visuals and script captions now fit its length. Your video plays at normal speed.' : 'Clip added at its original speed. Use Reframe to adjust the crop.', 4500);
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
    const palette = $('paletteSelect');
    palette.replaceChildren(new Option('Custom accent', 'custom'), ...Object.entries(window.HTML_VIDEO_PALETTES || {}).map(([key,value]) => new Option(value.label, key)));
    palette.value = Object.entries(window.HTML_VIDEO_PALETTES || {}).find(([,value]) => value.accent.toLowerCase() === config.accent.toLowerCase())?.[0] || 'custom';
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
  function visualChanged(timing = false) { window.dispatchEvent(new CustomEvent('codex:visuals', { detail: { timing } })); }
  function editableScene(index) {
    if (recording || startingExport) throw new Error('Wait until export finishes.');
    const scene = config.scenes[index]; if (!scene) throw new Error('Choose a visual scene.'); return scene;
  }
  function setSceneText(index, copy) {
    const scene = editableScene(index); pause();
    for (const key of ['title','emphasis']) if (typeof copy[key] === 'string') scene[key] = copy[key].slice(0, 50);
    populateStory(); save(); visualChanged();
  }
  async function setSceneVisual(index, patch) {
    const scene = editableScene(index), visual = cleanVisual({ ...cleanVisual(scene.visual, scene.kind), ...patch }, scene.kind);
    if(scene.kind==='brand-outro')throw Error('The brand outro is fixed. Change it in your brand preset before building.');
    if (patch.image && !visual.image) throw new Error('Use a PNG, JPG, or WebP image smaller than 2.5 MB after compression.');
    if (visual.image) await loadVisualImage(visual.image);
    editableScene(index); pause(); scene.visual = visual; save(); visualChanged();
  }
  function setSceneTiming(index, start, end) {
    if(config.outro && (index===config.scenes.length-1 || (index===config.scenes.length-2 && Math.abs(end-config.outro.start)>.001))) throw Error('The brand outro stays after the recorded story.');
    const scene = editableScene(index), minimum = Math.min(.05, DURATION / (config.scenes.length * 4));
    start = Number(start); end = Number(end);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end - start < minimum) throw new Error('Give this visual a positive duration.');
    const previous = config.scenes[index - 1], next = config.scenes[index + 1];
    if ((!previous && Math.abs(start) > .000001) || (!next && Math.abs(end - DURATION) > .000001)) throw new Error('The first visual starts at 0; the last ends with your video.');
    if (previous && start < previous.start + minimum - .000001 || next && end > next.end - minimum + .000001) throw new Error('Leave some time for the neighbouring visual.');
    const boundaries = [0, ...config.scenes.map(item => item.end)];
    boundaries[index] = start; boundaries[index + 1] = end;
    config.sceneWeights = Object.fromEntries(config.scenes.map((item, i) => [item.kind, (boundaries[i + 1] - boundaries[i]) / DURATION]));
    pause(); rebuildTiming(DURATION); syncMediaRates(); populateStory(); seek(clamp(time, start, end)); save(); visualChanged(true);
  }
  function resetVisualTiming() {
    if (recording || startingExport) return; pause(); config.sceneWeights = null;
    rebuildTiming(DURATION); populateStory(); seek(time); save(); visualChanged(true);
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
      if (file.size > 40000000) throw new Error('Template file is too large.');
      const data = JSON.parse(await file.text());
      if (data.format !== 'codex-short-template' || data.version !== 1 || !data.settings || !Array.isArray(data.settings.scenes)) throw new Error('Choose a saved video template (.json).');
      const v = data.settings, next = structuredClone(config);
      const incomingDuration = Number(v.targetDuration) || SOURCE_DURATION;
      if (!Number.isFinite(incomingDuration) || incomingDuration <= 0) throw new Error('Template needs a positive video duration.');
      if (defaults.transcriptMode && Math.abs(incomingDuration - defaults.targetDuration) > .001) throw new Error("This template has a different recording duration. Rebuild its transcript first.");
      next.targetDuration = incomingDuration;
      if(v.brand)next.brand=v.brand;
      if(Number.isFinite(v.motionIntensity))next.motionIntensity=clamp(v.motionIntensity,.2,1.4);
      if (v.captionStyle) next.captionStyle = cleanCaptionStyle(v.captionStyle);
      next.captionStyles = cleanCaptionStyles(v.captionStyles);
      next.sceneWeights = v.sceneWeights && typeof v.sceneWeights === 'object' ? v.sceneWeights : null;
      if (Array.isArray(v.captionCues)) next.captionCues = validateCaptionCues(v.captionCues, incomingDuration);
      else next.captionCues = null;
      if (typeof v.palette === 'string') next.palette = v.palette;
      if (typeof v.creator === 'string') next.creator = v.creator.slice(0, 32);
      if (typeof v.accent === 'string' && /^#[0-9a-f]{6}$/i.test(v.accent)) next.accent = v.accent;
      if (typeof v.promptText === 'string') next.promptText = v.promptText.slice(0, 180);
      for (const key of ['captions', 'cameraAudio', 'keyboardSound', 'autoFitVideo']) if (typeof v[key] === 'boolean') next[key] = v[key];
      if (defaults.transcriptMode) next.autoFitVideo = false;
      for (const key of ['sfxVolume', 'musicVolume']) if (typeof v[key] === 'number' && Number.isFinite(v[key])) next[key] = clamp(v[key]);
      if (Number.isFinite(v.topPercent)) next.topPercent = clamp(Math.round(v.topPercent), 30, 70);
      next.scenes.forEach(s => { const incoming = v.scenes.find(x => x.kind === s.kind); if (incoming){s.visual = cleanVisual(incoming.visual, s.kind);if(Array.isArray(incoming.labels))s.labels=incoming.labels.slice(0,6).map(x=>String(x).slice(0,120))} if (incoming) for (const key of ['title', 'emphasis', 'voice']) if (typeof incoming[key] === 'string') s[key] = incoming[key].slice(0, key === 'voice' ? 240 : 50); });
      if (v.frame && typeof v.frame === 'object') {
        for (const key of ['x', 'y', 'zoom']) if (typeof v.frame[key] === 'number' && Number.isFinite(v.frame[key])) next.frame[key] = clamp(v.frame[key], key === 'zoom' ? 1 : 0, key === 'zoom' ? 3 : 1);
        next.frame.mode = v.frame.mode === 'fit' ? 'fit' : 'fill'; next.frame.mirrored = Boolean(v.frame.mirrored);
      }
      await Promise.all(next.scenes.filter(scene => scene.visual?.image).map(scene => loadVisualImage(scene.visual.image)));
      if (recording || startingExport) return;
      pause(); Object.assign(config, next); config.cameraFollowsSpeed = false; rebuildTiming(next.targetDuration); time = 0; for (const key of ['x', 'y', 'zoom', 'mode']) cameraFrame[key] = config.frame[key]; mirror = Boolean(config.frame.mirrored);
      SPLIT = Math.round(H * config.topPercent / 100); layoutControls(); durationControls(); populateStory(); framingControls(); setMix(); seek(0); save(); updateUI();
      window.dispatchEvent(new CustomEvent('codex:duration', { detail: { duration: DURATION } }));
      if (hasCamera && config.autoFitVideo) fitUploadedVideo();
      visualChanged(true);
      notify('Template loaded. Your camera keeps its original speed.', 3500);
      return true;
    } catch (e) { notify(`Could not load template: ${e.message}`, 5000); return false; }
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
        if (!cancelled && chunks.length) { const ext = mime.includes('mp4') ? 'mp4' : 'webm'; downloadBlob(new Blob(chunks, { type: `video/${ext}` }), `html-video-template${hasCamera ? '-with-camera' : '-template'}.${ext}`); notify(`${ext.toUpperCase()} exported.`, 4000); }
        else if (cancelled) notify('Export cancelled.', 3000);
        cleanupRecording(); chunks = [];
      };
      mediaRecorder.start(500); recording = true; startingExport = false;
      await playMedia(); if (cancelled) return; origin = performance.now(); playing = true; notify('Rendering 0%'); updateUI();
    } catch (e) { cancelled = true; if (mediaRecorder?.state === 'recording') mediaRecorder.stop(); else cleanupRecording(); notify(`Export could not start: ${e.message}`, 6000); }
  }
  function finishRecording() { playing = false; pauseMedia(); if (!cancelled) { time = DURATION; draw(); } if (mediaRecorder?.state === 'recording') mediaRecorder.stop(); }

  $('totalDuration').onchange = e => setDuration(e.target.value);
  document.querySelectorAll('[data-duration]').forEach(button => button.onclick = () => setDuration(button.dataset.duration));
  $('autoFitVideo').onchange = e => { if (recording || startingExport) return; const checked = e.target.checked; pause(); config.autoFitVideo = checked; if (checked && hasCamera) fitUploadedVideo(); syncMediaRates(); durationControls(); save(); };
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
  $('clipOffset').oninput = e => { if (recording || startingExport) return; pause(); const requested = Number(e.target.value); offset = clamp(Number.isFinite(requested) ? requested : 0, 0, Math.max(0, (camera.duration || 0) - .05)); e.target.value = offset; if (hasCamera && config.autoFitVideo) fitUploadedVideo(); else seek(time); };
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
  $('accentColor').oninput = e => { config.accent = e.target.value; config.palette = 'custom'; $('paletteSelect').value = 'custom'; save(); };
  $('paletteSelect').onchange = e => { const palette = window.HTML_VIDEO_PALETTES?.[e.target.value]; if (!palette || recording || startingExport) return; config.palette = e.target.value; config.accent = palette.accent; $('accentColor').value = config.accent; save(); };
  $('promptText').oninput = e => { config.promptText = e.target.value; setMix(); save(); };
  $('keyboardSound').onchange = e => { config.keyboardSound = e.target.checked; setMix(); save(); };
  $('saveTemplate').onclick = () => downloadBlob(new Blob([JSON.stringify(templateFile(), null, 2)], { type: 'application/json' }), 'codex-template.json');
  $('loadTemplate').onclick = () => $('templateFile').click(); $('templateFile').onchange = e => loadTemplate(e.target.files[0]);
  $('topHeight').oninput = e => { pause(); setLayout(e.target.value); };
  document.querySelectorAll('[data-layout]').forEach(b => b.onclick = () => { pause(); setLayout(b.dataset.layout); });
  for (const id of ['sfxVolume', 'musicVolume']) $(id).oninput = e => { config[id] = Number(e.target.value) / 100; setMix(); save(); };
  $('resetTemplate').onclick = () => { for (const key of ['creator', 'accent', 'captions', 'captionCues', 'scenes', 'promptText']) config[key] = structuredClone(defaults[key]); rebuildTiming(DURATION); populateStory(); setMix(); seek(Math.min(time, DURATION)); save(); notify('Story reset.', 2000); };
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
    availableSceneKinds: Object.keys(renderers), get duration() { return DURATION; }, get sourceDuration() { return SOURCE_DURATION; }, get playbackRate() { return playbackRate(); }, get cuts() { return [...config.scenes.map(s => s.start), DURATION]; }, get ready() { return ready; },
    get state() { return { time, playing, hasCamera, recording, startingExport, audible, split: SPLIT, offset, framing: cameraFrame.y, frame: { ...cameraFrame }, frameBounds: cameraGeometry(), mirrored: mirror }; },
    setBrand(patch){
      if(recording||startingExport)return false;
      if(typeof patch.creator==='string')config.creator=patch.creator.slice(0,32);
      if(/^#[0-9a-f]{6}$/i.test(patch.accent||''))config.accent=patch.accent;
      if(Number.isFinite(patch.motion_intensity))config.motionIntensity=clamp(patch.motion_intensity,.2,1.4);
      if(patch.caption_style)config.captionStyle=cleanCaptionStyle(patch.caption_style);
      if(Number.isFinite(patch.sfx_volume))config.sfxVolume=clamp(patch.sfx_volume);
      if(Number.isFinite(patch.music_volume))config.musicVolume=clamp(patch.music_volume);
      if(typeof patch.keyboard_sound==='boolean')config.keyboardSound=patch.keyboard_sound;
      if(patch.frame){for(const key of ['x','y','zoom'])if(Number.isFinite(patch.frame[key]))cameraFrame[key]=clamp(patch.frame[key],key==='zoom'?1:0,key==='zoom'?3:1);cameraFrame.mode=patch.frame.mode==='fit'?'fit':'fill';mirror=Boolean(patch.frame.mirrored)}
      if(Number.isFinite(patch.top_percent))setLayout(patch.top_percent);
      config.brand={...config.brand,...patch};populateStory();setMix();save();captionChanged();return true;
    },
    setSceneLabels(index,labels){const scene=editableScene(index);scene.labels=labels.slice(0,6).map(x=>String(x).slice(0,120));save();visualChanged()},
    get template() { return structuredClone(config); }, get script() { return scriptText(); }, get narration() { return cleanScript(); },
    setSceneText, setSceneVisual, setSceneTiming, resetVisualTiming, loadTemplateFile: loadTemplate,
    get sourceScenes() { return structuredClone(sourceScenes); },
    get visualPresets() { const keys = Object.keys(window.CONCEPT_VIDEO_SCENES || {}); return (keys.length ? keys : sourceScenes.map(scene => scene.kind)).map(kind => ({ kind, label: (sourceScenes.find(scene => scene.kind === kind || scene.visual?.preset === kind)?.title || kind.replace(/[-_]/g, ' ')).replace(/\.$/, '') })); },
    setLayout, setDuration, fitToUploadedVideo: fitUploadedVideo, get keyboardWindow() {
      const data = window.CODEX_SHORT_MEDIA.keyboardWindow, ratio = DURATION / SOURCE_DURATION;
      return { start: data.start * ratio, end: data.end * ratio, windows: (data.windows || []).map(w => ({ start: w.start * ratio, end: w.end * ratio })) };
    },
    get captionVisibility() { return config.captions; },
    get captionStyle() { return structuredClone(config.captionStyle); },
    get captionStyles() { return structuredClone(config.captionStyles); },
    get captionBounds() { return captionBounds ? { ...captionBounds } : null; },
    getCaptionStyle: captionStyleFor, setCaptionStyle, resetCaptionStyle, restoreCaptionAppearance,
    get captions() { return structuredClone(activeCaptionCues()); },
    setCaptions: setCaptionCues, resetCaptions: resetCaptionCues,
    setCaptionVisibility(value) { config.captions = Boolean(value); $('showCaptions').checked = config.captions; save(); captionChanged(); },
    seek(t) { pause(); seek(t); }, play, pause,
    render(t) { playing = false; pauseMedia(); time = clamp(t, 0, DURATION); draw(time); updateUI(); },
    setResolution(w, h) { canvas.width = w; canvas.height = h; draw(); },
    async capture(t) { playing = false; time = clamp(t, 0, DURATION); await window.videoEditMedia?.prepare(sceneAt(time),time); draw(time); return canvas.toDataURL('image/jpeg', .96).split(',')[1]; }
  };
  document.documentElement.style.setProperty('--video-duration', String(DURATION));
  $('scrubber').max = DURATION;
  const storyHeading = document.querySelector('.scene-details .script-head strong'); if (storyHeading) storyHeading.textContent = `${DURATION}-second recording script`;
  const sceneCount = document.querySelector('.scene-details summary span'); if (sceneCount) sceneCount.textContent = `${config.scenes.length} timed scenes`; $('timelineRuler').setAttribute('aria-valuemax', String(DURATION));
  if (config.timingMode === 'absolute') $('loopCamera').checked = false;
  layoutControls(); populateStory(); framingControls(); updateUI(); document.documentElement.style.setProperty('--accent', config.accent);
  const imageLoads = Object.keys(window.CODEX_SHORT_MEDIA.photos).map(name => new Promise((resolve, reject) => {
    const img = new Image(); img.onload = () => { photos[name] = img; resolve(); }; img.onerror = () => reject(new Error(`Missing image: ${name}.jpg`)); img.src = window.CODEX_SHORT_MEDIA.photos[name];
  }));
  Promise.all([...config.scenes.filter(scene => scene.visual?.image).map(scene => loadVisualImage(scene.visual.image)), ...imageLoads, document.fonts.load('800 100px Manrope, \"Noto Sans Tamil\"'), document.fonts.load('500 100px Manrope, \"Noto Sans Tamil\"')]).then(() => {
    ready = true; $('loading').classList.add('done'); $('playBtn').disabled = false; $('exportBtn').disabled = false; requestAnimationFrame(frame);
    seek(!manual && matchMedia('(prefers-reduced-motion: reduce)').matches ? .6 : 0);
    if(location.protocol==='file:'){ $('status').textContent='For export, open this project with npm run studio. Direct-file preview is available.'; }
    if (!manual) attach({type:'video/mp4',name:'camera-edited.mp4'},'media/camera-edited.mp4');
  }).catch(e => { $('loading').querySelector('span').textContent = e.message; console.error(e); });
})();
