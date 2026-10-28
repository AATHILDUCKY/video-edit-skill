/* Claude / A little curiosity.
 * One deterministic canvas timeline. No WebGL, framework, CDN, or frame-dependent physics.
 * All times are seconds; all scene geometry is in a 1080-wide composition.
 */
(() => {
  'use strict';
  const BRAND = {"word": "M200.168 110.625C190.376 110.625 181.647 108.688 173.98 104.813C166.355 100.896 160.397 95.4167 156.105 88.375C151.814 81.3333 149.668 73.25 149.668 64.125C149.668 54.4167 151.855 45.7917 156.23 38.25C160.647 30.7083 166.751 24.8542 174.543 20.6875C182.335 16.4792 191.189 14.375 201.105 14.375C207.064 14.375 213.001 15.0208 218.918 16.3125C224.876 17.5625 230.105 19.5208 234.605 22.1875V42.75H228.98C227.397 35.2083 224.293 29.7292 219.668 26.3125C215.085 22.8958 208.814 21.1875 200.855 21.1875C193.23 21.1875 186.897 22.8958 181.855 26.3125C176.814 29.7292 173.085 34.5 170.668 40.625C168.251 46.7083 167.043 53.7917 167.043 61.875C167.043 69.8333 168.397 76.9792 171.105 83.3125C173.814 89.6458 177.835 94.6458 183.168 98.3125C188.501 101.979 194.918 103.813 202.418 103.813C207.501 103.813 211.855 102.813 215.48 100.813C219.147 98.8125 222.23 96.0833 224.73 92.625C227.23 89.125 229.564 84.8333 231.73 79.75H237.605L233.605 102.313C229.272 105.104 224.105 107.188 218.105 108.563C212.105 109.938 206.126 110.625 200.168 110.625ZM243.168 103.938C245.626 103.646 247.543 103.271 248.918 102.813C250.335 102.313 251.355 101.646 251.98 100.813C252.605 99.9792 252.918 98.9167 252.918 97.625V29.5625L243.168 25.875V21.6875L262.793 14.375H267.793V97.625C267.793 98.9167 268.105 99.9792 268.73 100.813C269.355 101.646 270.355 102.313 271.73 102.813C273.147 103.271 275.085 103.646 277.543 103.938V109.375H243.168V103.938ZM300.355 110.625C296.772 110.625 293.605 109.958 290.855 108.625C288.105 107.292 285.96 105.417 284.418 103C282.918 100.583 282.168 97.7917 282.168 94.625C282.168 90 283.626 86.1875 286.543 83.1875C289.501 80.1458 294.043 77.75 300.168 76L322.855 69.5625V62.75C322.855 58.2917 321.793 54.9167 319.668 52.625C317.585 50.3333 314.48 49.1875 310.355 49.1875C306.73 49.1875 303.855 50.2917 301.73 52.5C299.647 54.7083 298.605 57.7083 298.605 61.5V67.125H288.48C287.272 66.375 286.335 65.3958 285.668 64.1875C285.043 62.9375 284.73 61.5625 284.73 60.0625C284.73 57.1042 285.876 54.3958 288.168 51.9375C290.46 49.4375 293.564 47.4583 297.48 46C301.397 44.5417 305.689 43.8125 310.355 43.8125C316.189 43.8125 321.147 44.6875 325.23 46.4375C329.314 48.1875 332.418 50.7708 334.543 54.1875C336.668 57.6042 337.73 61.7292 337.73 66.5625V96.25C337.73 97.7083 338.022 98.875 338.605 99.75C339.23 100.625 340.23 101.333 341.605 101.875C343.022 102.375 344.98 102.771 347.48 103.063V108.5C343.855 109.792 340.376 110.438 337.043 110.438C333.001 110.438 329.751 109.479 327.293 107.563C324.876 105.646 323.439 102.896 322.98 99.3125C319.939 103.063 316.522 105.896 312.73 107.813C308.939 109.688 304.814 110.625 300.355 110.625ZM307.668 100.625C310.335 100.625 312.98 100 315.605 98.75C318.272 97.4583 320.689 95.6667 322.855 93.375V75.3125L305.855 80.375C302.939 81.25 300.71 82.625 299.168 84.5C297.626 86.3333 296.855 88.5833 296.855 91.25C296.855 93.0833 297.314 94.7083 298.23 96.125C299.147 97.5417 300.418 98.6458 302.043 99.4375C303.71 100.229 305.585 100.625 307.668 100.625ZM376.543 110.625C369.876 110.625 364.814 108.938 361.355 105.563C357.897 102.146 356.168 97.1667 356.168 90.625V58.375L346.418 54.9375V50.75L366.105 43.8125H371.043V88.0625C371.043 92.0208 372.043 94.9583 374.043 96.875C376.043 98.7917 379.126 99.75 383.293 99.75C385.96 99.75 388.814 99.1458 391.855 97.9375C394.939 96.7292 397.814 95.0625 400.48 92.9375V58.375L390.73 54.9375V50.75L410.418 43.8125H415.355V92.5C415.355 93.9583 415.647 95.125 416.23 96C416.855 96.875 417.855 97.5625 419.23 98.0625C420.605 98.5625 422.564 98.9792 425.105 99.3125V104.75L405.418 110H400.48V98.9375C396.98 102.563 393.085 105.417 388.793 107.5C384.543 109.583 380.46 110.625 376.543 110.625ZM458.73 110.625C453.105 110.625 448.043 109.354 443.543 106.813C439.085 104.229 435.585 100.688 433.043 96.1875C430.501 91.6458 429.23 86.5625 429.23 80.9375C429.23 73.6042 430.751 67.125 433.793 61.5C436.876 55.875 441.189 51.5208 446.73 48.4375C452.272 45.3542 458.689 43.8125 465.98 43.8125C468.355 43.8125 470.772 44.0625 473.23 44.5625C475.73 45.0625 478.085 45.7708 480.293 46.6875V29.5625L470.543 25.875V21.6875L490.168 14.375H495.168V92.5C495.168 93.9583 495.46 95.125 496.043 96C496.668 96.875 497.668 97.5625 499.043 98.0625C500.418 98.5625 502.376 98.9792 504.918 99.3125V104.75L485.23 110H480.293V101.438C477.168 104.396 473.751 106.667 470.043 108.25C466.335 109.833 462.564 110.625 458.73 110.625ZM464.855 100.563C467.355 100.563 469.96 100.042 472.668 99C475.376 97.9167 477.918 96.4583 480.293 94.625V56C476.21 52.6667 471.751 51 466.918 51C462.168 51 458.126 52.125 454.793 54.375C451.46 56.625 448.939 59.7083 447.23 63.625C445.564 67.5417 444.73 71.9792 444.73 76.9375C444.73 81.6458 445.48 85.7708 446.98 89.3125C448.48 92.8542 450.73 95.625 453.73 97.625C456.772 99.5833 460.48 100.563 464.855 100.563ZM541.293 110.625C535.168 110.625 529.647 109.229 524.73 106.438C519.814 103.646 515.96 99.7708 513.168 94.8125C510.418 89.8125 509.043 84.1875 509.043 77.9375C509.043 71.6042 510.46 65.8333 513.293 60.625C516.126 55.4167 520.001 51.3125 524.918 48.3125C529.876 45.3125 535.376 43.8125 541.418 43.8125C546.001 43.8125 550.272 44.7708 554.23 46.6875C558.189 48.6042 561.501 51.2917 564.168 54.75C566.876 58.2083 568.668 62.1667 569.543 66.625L524.168 80.375C525.418 85.875 527.897 90.1875 531.605 93.3125C535.355 96.3958 539.96 97.9375 545.418 97.9375C550.001 97.9375 554.105 96.8542 557.73 94.6875C561.355 92.4792 564.564 89.1458 567.355 84.6875L572.168 86.1875C571.001 91.1042 568.939 95.4167 565.98 99.125C563.064 102.792 559.48 105.625 555.23 107.625C550.98 109.625 546.335 110.625 541.293 110.625ZM553.293 64.75C552.71 61.9583 551.751 59.5208 550.418 57.4375C549.126 55.3125 547.501 53.6875 545.543 52.5625C543.585 51.3958 541.397 50.8125 538.98 50.8125C535.939 50.8125 533.231 51.7083 530.856 53.5C528.481 55.2917 526.626 57.8333 525.293 61.125C523.96 64.375 523.293 68.1458 523.293 72.4375C523.293 73.1458 523.314 73.7083 523.355 74.125L553.293 64.75Z", "spark": "M54.375 118.75L56.125 111L58.125 101L59.75 93L61.25 83.125L62.125 79.875L62 79.625L61.375 79.75L53.875 90L42.5 105.375L33.5 114.875L31.375 115.75L27.625 113.875L28 110.375L30.125 107.375L42.5 91.5L50 81.625L54.875 76L54.75 75.25H54.5L21.5 96.75L15.625 97.5L13 95.125L13.375 91.25L14.625 90L24.5 83.125L49.125 69.375L49.5 68.125L49.125 67.5H47.875L43.75 67.25L29.75 66.875L17.625 66.375L5.75 65.75L2.75 65.125L0 61.375L0.25 59.5L2.75 57.875L6.375 58.125L14.25 58.75L26.125 59.5L34.75 60L47.5 61.375H49.5L49.75 60.5L49.125 60L48.625 59.5L36.25 51.25L23 42.5L16 37.375L12.25 34.75L10.375 32.375L9.625 27.125L13 23.375L17.625 23.75L18.75 24L23.375 27.625L33.25 35.25L46.25 44.875L48.125 46.375L49 45.875V45.5L48.125 44.125L41.125 31.375L33.625 18.375L30.25 13L29.375 9.75C29.0417 8.625 28.875 7.375 28.875 6L32.75 0.750006L34.875 0L40.125 0.750006L42.25 2.625L45.5 10L50.625 21.625L58.75 37.375L61.125 42.125L62.375 46.375L62.875 47.75H63.75V47L64.375 38L65.625 27.125L66.875 13.125L67.25 9.125L69.25 4.375L73.125 1.87501L76.125 3.25L78.625 6.875L78.25 9.125L76.875 18.75L73.875 33.875L72 44.125H73.125L74.375 42.75L79.5 36L88.125 25.25L91.875 21L96.375 16.25L99.25 14H104.625L108.5 19.875L106.75 26L101.25 33L96.625 38.875L90 47.75L86 54.875L86.375 55.375H87.25L102.125 52.125L110.25 50.75L119.75 49.125L124.125 51.125L124.625 53.125L122.875 57.375L112.625 59.875L100.625 62.25L82.75 66.5L82.5 66.625L82.75 67L90.75 67.75L94.25 68H102.75L118.5 69.125L122.625 71.875L125 75.125L124.625 77.75L118.25 80.875L109.75 78.875L89.75 74.125L83 72.5H82V73L87.75 78.625L98.125 88L111.25 100.125L111.875 103.125L110.25 105.625L108.5 105.375L97 96.625L92.5 92.75L82.5 84.375H81.875V85.25L84.125 88.625L96.375 107L97 112.625L96.125 114.375L92.875 115.5L89.5 114.875L82.25 104.875L74.875 93.5L68.875 83.375L68.25 83.875L64.625 121.625L63 123.5L59.25 125L56.125 122.625L54.375 118.75Z"};
  const $ = id => document.getElementById(id);
  const canvas = $('reelCanvas'), ctx = canvas.getContext('2d', { alpha: false });
  const camera = $('sourceVideo'), sound = $('soundtrack');
  const DURATION = 15, W = 1080;
  const C = { white: '#ffffff', ink: '#20201f', orange: '#d97757', red: '#ee573b', blue: '#cce7f3', pale: '#f1f3f3' };
  const cutTimes = [0, 2.1, 4.4, 5.65, 6.9, 8.15, 9.5, 10.8, 12.9, 15];
  const photos = {};
  const sparkPath = new Path2D(BRAND.spark), wordPath = new Path2D(BRAND.word);
  let time = 0, playing = false, origin = 0, ready = false, recording = false;
  let clipURL = null, hasCamera = false, mirror = false, audible = false, hasSound = true;
  let mediaRecorder = null, exportStream = null, exportChunks = [], cancelExport = false;
  let audioContext = null, audioDestination = null, soundGain = null, cameraGain = null;
  let statusTimer = null, lastUI = 0;
  const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
  const mix = (a, b, n) => a + (b - a) * n;
  const out = n => 1 - Math.pow(1 - clamp(n), 4);
  const io = n => { n = clamp(n); return n < .5 ? 8 * n ** 4 : 1 - (-2 * n + 2) ** 4 / 2; };
  const enter = (t, delay = 0, length = .52) => out((t - delay) / length);
  const TAU = Math.PI * 2;

  // Sample the real symbol once. The circle and burst share vertex count and order.
  const svgPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  svgPath.setAttribute('d', BRAND.spark);
  const pathLength = svgPath.getTotalLength();
  const points = Array.from({ length: 320 }, (_, i) => {
    const p = svgPath.getPointAtLength(i / 320 * pathLength);
    return [(p.x - 62.5) / 62.5, (p.y - 62.5) / 62.5];
  });
  const firstAngle = Math.atan2(points[0][1], points[0][0]);
  // Determine winding so the interpolation never twists through itself.
  let signedArea = 0;
  points.forEach((p, i) => { const q = points[(i + 1) % points.length]; signedArea += p[0] * q[1] - q[0] * p[1]; });
  const winding = signedArea > 0 ? 1 : -1;

  function rect(x, y, w, h, color = C.white) {
    ctx.fillStyle = color; ctx.fillRect(x, y, w, h);
  }
  function text(s, x, y, size, { color = C.ink, serif = false, italic = false, align = 'center', weight = 800, spacing = -5 } = {}) {
    ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
    ctx.font = `${italic ? 'italic ' : ''}${serif ? 400 : weight} ${size}px ${serif ? 'Editorial' : 'Manrope'}, ${serif ? 'Georgia' : 'Arial'}`;
    ctx.letterSpacing = `${spacing}px`;
    ctx.fillText(s, x, y);
    ctx.letterSpacing = '0px';
  }
  function reveal(s, x, baseline, size, t, opts = {}) {
    const en = enter(t, opts.delay || 0, opts.length || .48);
    ctx.save(); ctx.beginPath();
    ctx.rect(-300, baseline - size * 1.2, 1680, size * 1.5); ctx.clip();
    ctx.translate(0, (1 - en) * size * 1.4);
    text(s, x, baseline, size, opts); ctx.restore();
  }
  function cover(img, x, y, w, h, zoom = 1, px = .5, py = .5) {
    if (!img || !img.complete || !img.naturalWidth || w <= 0 || h <= 0) return;
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight) * zoom;
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.drawImage(img, x - (img.naturalWidth * scale - w) * px, y - (img.naturalHeight * scale - h) * py, img.naturalWidth * scale, img.naturalHeight * scale);
    ctx.restore();
  }
  function photo(name, x, y, w, h, rotation = 0, zoom = 1) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rotation);
    cover(photos[name], -w / 2, -h / 2, w, h, zoom);
    ctx.restore();
  }
  function spark(x, y, size, angle = 0, color = C.orange) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.scale(size / 125, size / 125); ctx.translate(-62.5, -62.5);
    ctx.fillStyle = color; ctx.fill(sparkPath); ctx.restore();
  }
  function morph(x, y, radius, amount, angle = 0, color = C.orange) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.beginPath();
    points.forEach(([px, py], i) => {
      const a = firstAngle + winding * i / points.length * TAU;
      const xx = mix(Math.cos(a), px, amount) * radius;
      const yy = mix(Math.sin(a), py, amount) * radius;
      i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy);
    });
    ctx.closePath(); ctx.fillStyle = color; ctx.fill(); ctx.restore();
  }
  function brush(points, progress, width = 27, color = C.orange) {
    if (progress <= 0) return;
    const count = Math.max(2, Math.ceil(points.length * clamp(progress)));
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath();
    points.slice(0, count).forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.stroke(); ctx.restore();
  }
  function curve(fn, steps = 90) { return Array.from({ length: steps }, (_, i) => fn(i / (steps - 1))); }
  function ring(x, y, rx, ry, p, color = C.orange, width = 18, rotation = -.13) {
    const ps = curve(f => { const a = f * TAU - .6; return [Math.cos(a) * rx, Math.sin(a) * ry]; });
    ctx.save(); ctx.translate(x, y); ctx.rotate(rotation); brush(ps, p, width, color); ctx.restore();
  }
  function arrow(x, y, length, angle, p, color = C.orange, width = 16) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
    brush(curve(f => [f * length, Math.sin(f * Math.PI) * -34]), p, width, color);
    const e = enter(p, .65, .35);
    brush([[length - 52 * e, -40 * e], [length, 0], [length - 48 * e, 41 * e]], e, width, color); ctx.restore();
  }
  function lockup(x, y, width, alpha = 1) {
    ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x - width / 2, y - width * 125 / 573 / 2); ctx.scale(width / 573, width / 573);
    ctx.fillStyle = C.ink; ctx.fill(wordPath); ctx.fillStyle = C.orange; ctx.fill(sparkPath); ctx.restore();
  }
  function background(h, color = C.white) { rect(0, 0, W, h, color); }

  // 00:00 — The opening mark becomes a small, curious thought.
  function opening(t, h) {
    background(h);
    const size = h < 1300 ? 149 : 164, cy = h * .44;
    const a = enter(t, .02, .5), away = io((t - 1.73) / .37);
    const photoIn = enter(t, .43, .65);
    ctx.save(); ctx.translate(540, cy); ctx.scale(1 + away * .12, 1 + away * .12); ctx.translate(-540, -cy);
    reveal('A little', 540, cy - size * .50, size, t, { delay: .05 });
    reveal('curiosity.', 540, cy + size * .58, size * 1.19, t, { delay: .22, serif: true, italic: true, spacing: -6 });
    brush(curve(f => [216 + f * 649, cy + size * .80 + Math.sin(f * Math.PI * 1.2) * 9]), enter(t, .58, .38), 15);
    const imageH = Math.min(h * .25, 400);
    photo('flower', 540, cy + size * 1.18 + imageH / 2 + (1 - photoIn) * 100, 680 * photoIn, imageH, -.025 + .025 * photoIn, 1.13 - t * .025);
    spark(850, cy + size * 1.35, 130 * photoIn, -.2 + t * .12, C.white);
    ctx.restore();
    morph(mix(540, 820, a), mix(h * .20, cy - size * 1.6, a), mix(22, 56, a), io(t / .65), -.2 + t * .14);
    if (h > 1500) {
      const e = enter(t, .8, .65);
      arrow(225, h * .83, 185, -.4, e, C.ink, 9);
    }
  }

  // 00:02.10 — Photo sizes shift on the edit; gestures are painted over the images.
  function changes(t, h) {
    background(h);
    const en = enter(t, 0, .44), phase = Math.floor(clamp(t / .39, 0, 5));
    const fs = h < 1300 ? 125 : 143;
    const y = h * .27;
    const w = mix(490, 880, en), ph = h * .44;
    const name = phase === 3 ? 'mountain' : 'ocean';
    photo(name, 540, h * .57, w, ph, mix(.12, -.025, en), 1.1 + t * .035);
    const a = enter(t, .28, .40);
    photo('architecture', 850 + (1 - a) * 280, h * .39, 315, h * .25, .085 - a * .025, 1.06);
    const b = enter(t, .55, .42);
    photo('flower', 213 - (1 - b) * 250, h * .76, 333, h * .23, -.09 + b * .04, 1.09);
    reveal('Changes', 88, y - fs * .18, fs, t, { align: 'left', delay: .04 });
    reveal('everything.', 88, y + fs * .78, fs * .96, t, { align: 'left', serif: true, italic: true, delay: .15 });
    ring(554, h * .58, 346, ph * .39, enter(t, .35, .73), C.orange, 24, -.36);
    spark(794, h * .69, 158 * enter(t, .68), t * .5, C.white);
    arrow(330, h * .86, 340, -.27, enter(t, .72, .5), C.orange, 20);
    if (phase >= 4) {
      const small = enter(t, 1.6, .3);
      photo('studio', 530, h * .87, 225 * small, h * .12, .08, 1.04);
    }
  }

  // Three short, deliberately different creative verbs; the baseline is shared.
  function write(t, h) {
    background(h);
    const en = enter(t, 0, .45), cy = h * .49;
    const imgW = mix(430, 820, en), imgH = h * .45;
    ctx.save(); ctx.beginPath(); ctx.ellipse(540, cy, imgW / 2, imgH / 2, -.13, 0, TAU); ctx.clip();
    cover(photos.studio, 90, cy - imgH / 2 - 40, 900, imgH + 80, 1.04 + t * .05); ctx.restore();
    rect(0, cy - 21, W, 42, C.white);
    const fs = h < 1300 ? 214 : 242;
    reveal('Write.', 540, cy + fs * .32, fs, t, { serif: true, italic: true, color: C.orange, delay: .02, length: .36 });
    brush(curve(f => [180 + 720 * f, cy + imgH * .58 + Math.sin(f * 13) * 13]), enter(t, .25, .48), 14, C.ink);
    spark(850, cy - imgH * .48, 100 * enter(t, .17), -.23 + t * .2);
  }
  function build(t, h) {
    background(h, C.blue);
    const en = enter(t, 0, .52), cy = h * .52;
    const iw = mix(600, 900, en), ih = h * .62;
    ctx.save(); ctx.translate(540, cy + (1 - en) * 150); ctx.rotate((1 - en) * -.12);
    cover(photos.architecture, -iw / 2, -ih / 2, iw, ih, 1.05 + t * .045); ctx.restore();
    const fs = h < 1300 ? 210 : 246;
    reveal('Build.', 540, h * .27, fs, t, { delay: .03, length: .4 });
    brush(curve(f => [170 + 725 * f, h * .74 - 200 * Math.sin(Math.PI * f)]), enter(t, .2, .55), 22, C.orange);
    arrow(770, h * .69, h * .19, -Math.PI / 2, enter(t, .35, .45), C.white, 19);
    spark(220, h * .76, 144 * enter(t, .22), -.25 + t * .19, C.orange);
  }
  function explore(t, h) {
    background(h);
    const en = io(t / .56), cy = h * .51;
    const iw = mix(500, 1080, en), ih = mix(h * .46, h, en);
    cover(photos.mountain, 540 - iw / 2, cy - ih / 2, iw, ih, 1.04 + t * .035);
    const fs = h < 1300 ? 174 : 199;
    reveal('Explore.', 540, h * .49, fs, t, { color: C.white, serif: true, italic: true, delay: .08, length: .4 });
    ring(552, h * .46, 443, fs * .8, enter(t, .3, .55), C.orange, 23, -.12);
    spark(790, h * .72, 184 * enter(t, .42), -.1 + t * .4, C.white);
    // The orange line tracks the mountain ridge, rather than decorating a card.
    brush([[48, h * .65], [270, h * .58], [405, h * .62], [577, h * .53], [725, h * .59], [1040, h * .47]], enter(t, .48, .48), 16, C.orange);
  }

  // 00:08.15 — Three crops travel through one aperture. No unrelated 3D props.
  function possibilities(t, h) {
    background(h);
    const cy = h * .54, fs = h < 1300 ? 138 : 159;
    reveal('And then', 540, h * .26, fs, t, { delay: .02, length: .4 });
    reveal('some.', 540, h * .26 + fs * 1.04, fs * 1.17, t, { delay: .14, serif: true, italic: true, length: .42 });
    const en = enter(t, .12, .45), ph = h * .27;
    ['flower', 'ocean', 'architecture'].forEach((name, i) => {
      const x = 540 + (i - 1) * 365 * en;
      photo(name, x, cy + ph * .26 + Math.sin(i * 1.8) * 50, 326, ph, (i - 1) * .085 * en, 1.13 - t * .04);
    });
    const morphT = io((t - .48) / .65);
    morph(540, h * .72, 157 * enter(t, .21), morphT, t * .35, C.orange);
    arrow(135, h * .83, 675, -.035, enter(t, .54, .52), C.ink, 11);
  }

  // 00:09.50 — An extruded, lit version of the actual SVG symbol. Flat at the handoff.
  function dimensional(t, h) {
    background(h);
    const cy = h * .51, en = enter(t, 0, .35), settle = io((t - .69) / .6);
    const angle = mix(-.62, .02, out(t / 1.1));
    const squash = mix(.60 + .20 * Math.sin(t * 2.8), 1, settle);
    const size = mix(300, 548, en) * mix(1, .71, settle);
    ctx.save(); ctx.translate(540, cy); ctx.rotate(angle); ctx.scale(1, squash);
    for (let layer = 24; layer >= 0; layer--) {
      const depth = layer * 1.55 * (1 - settle);
      ctx.save(); ctx.translate(depth * -.45, depth);
      ctx.scale(size / 125, size / 125); ctx.translate(-62.5, -62.5);
      if (layer === 0) {
        const shine = ctx.createLinearGradient(0, 0, 125, 125);
        shine.addColorStop(0, '#ffc7a3'); shine.addColorStop(.30, '#e99b75'); shine.addColorStop(.65, C.orange); shine.addColorStop(1, '#aa4c34');
        ctx.fillStyle = settle > .98 ? C.orange : shine;
      } else ctx.fillStyle = `rgb(${128 + layer * 2},${55 + layer},${37 + layer})`;
      ctx.fill(sparkPath); ctx.restore();
    }
    ctx.restore();
    if (h > 1400) {
      photo('ocean', 170 - 280 * settle, h * .26, 220, 250, -.08, 1.1);
      photo('flower', 910 + 280 * settle, h * .76, 220, 260, .07, 1.1);
    }
  }

  // 00:10.80 — A last photographic crescendo, then a clean typography hold.
  function keepThinking(t, h) {
    background(h);
    const collapse = io((t - 1.27) / .65), en = enter(t, 0, .47);
    const fs = h < 1300 ? 155 : 181, cy = h * .47;
    const photoH = h * .24, spread = 370 * (1 - collapse);
    const names = ['architecture', 'flower', 'ocean'];
    names.forEach((name, i) => {
      ctx.save(); ctx.globalAlpha = 1 - collapse;
      photo(name, 540 + (i - 1) * spread, cy + fs * 1.32 + photoH * .25 + (1 - en) * 150, 310 * (1 - collapse * .8), photoH * (1 - collapse * .6), (i - 1) * .055, 1.10 + t * .02);
      ctx.restore();
    });
    reveal('Keep', 540, cy - fs * .25 - collapse * 45, fs, t, { delay: .02 });
    reveal('thinking.', 540, cy + fs * .80 - collapse * 45, fs * 1.08, t, { serif: true, italic: true, delay: .14 });
    brush(curve(f => [184 + f * 710, cy + fs * 1.05 - collapse * 45 + Math.sin(f * 4) * 12]), enter(t, .34, .45), 15);
    spark(845 - collapse * 305, cy - fs * 1.34 - collapse * 100, 92 + collapse * 10, (1 - collapse) * .25);
  }

  // 00:12.90 — Official SVG lockup. Last 1.5 seconds are completely still.
  function ending(t, h) {
    background(h);
    const en = io(t / .65), cy = h * .48;
    const width = mix(735, 760, out(t / .8));
    if (t < .65) {
      const x = mix(540, 540 - width / 2 + width * 62.5 / 573, en);
      spark(x, mix(cy - 210, cy, en), mix(102, width * 125 / 573, en));
      ctx.save(); ctx.globalAlpha = en; ctx.translate(540 - width / 2, cy - width * 125 / 573 / 2 + (1 - en) * 30); ctx.scale(width / 573, width / 573); ctx.fillStyle = C.ink; ctx.fill(wordPath); ctx.restore();
    } else lockup(540, cy, width);
    const a = enter(t, .32, .4);
    ctx.save(); ctx.globalAlpha = a;
    text('Keep thinking.', 540, cy + 156, 41, { weight: 500, spacing: -.8 });
    ctx.restore();
  }

  const sceneFunctions = [opening, changes, write, build, explore, possibilities, dimensional, keepThinking, ending];
  function composition(t, h) {
    let index = cutTimes.findIndex((start, i) => i < sceneFunctions.length && t >= start && t < cutTimes[i + 1]);
    if (index < 0) index = 8;
    const local = t - cutTimes[index];
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, h); ctx.clip();
    sceneFunctions[index](local, h);
    // A continuous moving edge conceals each edit. No opacity crossfades or ghosted text.
    if (index < 8) {
      const transition = .18, remaining = cutTimes[index + 1] - t;
      if (remaining < transition) {
        const p = io(1 - remaining / transition);
        ctx.save(); ctx.beginPath();
        const vertical = index % 2 === 0;
        vertical ? ctx.rect(W * (1 - p), 0, W * p + 1, h) : ctx.rect(0, h * (1 - p), W, h * p + 1);
        ctx.clip(); sceneFunctions[index + 1](0, h); ctx.restore();
        // Thin orange leading edge ties the cut to the painted graphic language.
        if (p > .02 && p < .98) vertical ? rect(W * (1 - p), 0, 4, h, C.orange) : rect(0, h * (1 - p), W, 4, C.orange);
      }
    }
    ctx.restore();
  }
  function draw(t = time) {
    ctx.setTransform(canvas.width / W, 0, 0, canvas.height / 1920, 0, 0);
    ctx.globalAlpha = 1; ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    if (!hasCamera) composition(clamp(t, 0, DURATION), 1920);
    else {
      composition(clamp(t, 0, DURATION), 1040);
      rect(0, 1040, 1080, 880, '#191919');
      if (camera.readyState >= 2 && camera.videoWidth) {
        const sc = Math.max(1080 / camera.videoWidth, 880 / camera.videoHeight);
        const dw = camera.videoWidth * sc, dh = camera.videoHeight * sc;
        ctx.save(); ctx.beginPath(); ctx.rect(0, 1040, 1080, 880); ctx.clip();
        if (mirror) { ctx.translate(1080, 0); ctx.scale(-1, 1); }
        ctx.drawImage(camera, (1080 - dw) / 2, 1040 + (880 - dh) / 2, dw, dh); ctx.restore();
      }
    }
  }
  function notify(message, timeout = 0) {
    clearTimeout(statusTimer); $('status').textContent = message;
    if (timeout) statusTimer = setTimeout(() => { $('status').textContent = ''; }, timeout);
  }
  function updateUI() {
    const fmt = n => `00:${String(Math.floor(n)).padStart(2, '0')}`;
    $('scrubber').value = time; $('scrubber').style.setProperty('--progress', `${time / DURATION * 100}%`);
    $('timeLabel').textContent = `${fmt(time)} / 00:15`;
    $('playBtn').innerHTML = playing ? '<svg viewBox="0 0 24 24"><path d="M8 5v14M16 5v14" stroke-width="3"/></svg>' : '<svg viewBox="0 0 24 24"><path class="solid" d="M7 4l14 8-14 8z"/></svg>';
    $('playBtn').setAttribute('aria-label', playing ? 'Pause' : time >= DURATION ? 'Replay' : 'Play');
    $('soundBtn').innerHTML = audible ? '<svg viewBox="0 0 24 24"><path d="M11 4L5 9H2v6h3l6 5zM15 8a6 6 0 010 8m3-11a10 10 0 010 14"/></svg>' : '<svg viewBox="0 0 24 24"><path d="M11 4L5 9H2v6h3l6 5zM16 9l6 6m0-6l-6 6"/></svg>';
    $('soundBtn').setAttribute('aria-label', audible ? 'Mute sound' : 'Turn sound on');
  }
  function pause() {
    if (recording) return;
    playing = false; camera.pause(); sound.pause(); updateUI();
  }
  function seek(t) {
    time = clamp(t, 0, DURATION);
    if (hasCamera && Number.isFinite(camera.duration) && camera.duration > 0) camera.currentTime = time % camera.duration;
    if (Number.isFinite(sound.duration)) sound.currentTime = Math.min(time, Math.max(0, sound.duration - .005));
    draw(); updateUI();
  }
  async function play() {
    if (!ready || recording) return;
    if (time >= DURATION) seek(0);
    origin = performance.now() - time * 1000; playing = true;
    camera.muted = !audible || !$('cameraAudio').checked;
    if (hasCamera) camera.play().catch(() => notify('Camera playback could not start. Try an MP4 clip.', 5000));
    sound.muted = !audible || !hasSound;
    if (hasSound && audible) sound.play().catch(() => {});
    if (audioContext) await audioContext.resume();
    updateUI();
  }
  function frame(now) {
    if (playing) {
      time = Math.min((now - origin) / 1000, DURATION);
      draw();
      if (now - lastUI > 80) {
        updateUI(); lastUI = now;
        if (recording) notify(`Rendering ${Math.round(time / DURATION * 100)}%`);
      }
      if (time >= DURATION) {
        if (recording) finishRecording();
        else if ($('loopPreview').checked) { seek(0); play(); }
        else pause();
      }
    }
    requestAnimationFrame(frame);
  }
  async function toggleSound() {
    if (recording) return;
    audible = !audible;
    sound.muted = !audible || !hasSound; camera.muted = !audible || !$('cameraAudio').checked;
    if (soundGain) soundGain.gain.value = hasSound ? 1 : 0;
    if (cameraGain) cameraGain.gain.value = $('cameraAudio').checked ? 1 : 0;
    if (audible && playing) { sound.currentTime = Math.min(time, 14.99); await sound.play().catch(() => {}); }
    else if (!audible) sound.pause();
    if (audioContext) await audioContext.resume();
    updateUI();
  }
  async function attach(file) {
    if (!file || (!file.type.startsWith('video/') && !/\.(mp4|mov|webm|m4v)$/i.test(file.name))) { notify('Choose an MP4, MOV, or WebM video.', 4500); return; }
    pause(); hasCamera = false; camera.pause();
    if (clipURL) URL.revokeObjectURL(clipURL);
    clipURL = URL.createObjectURL(file); camera.src = clipURL; camera.muted = true;
    $('clipName').textContent = `Loading ${file.name}…`;
    camera.onloadeddata = () => {
      hasCamera = true; $('clipName').textContent = file.name; $('removeClip').hidden = false;
      seek(time); notify('Camera added. The animation now fills the top section.', 4500);
    };
    camera.onerror = () => { hasCamera = false; $('clipName').textContent = 'This clip could not be decoded.'; notify('Try an MP4 with H.264 video.', 5000); draw(); };
    camera.load();
  }
  function removeClip() {
    pause(); hasCamera = false; camera.pause(); camera.removeAttribute('src'); camera.load();
    if (clipURL) URL.revokeObjectURL(clipURL); clipURL = null;
    $('clipName').textContent = ''; $('cameraFile').value = ''; $('removeClip').hidden = true; draw();
  }

  async function setupAudio() {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioDestination = audioContext.createMediaStreamDestination();
      const master = audioContext.createGain(); master.gain.value = .85;
      master.connect(audioDestination); master.connect(audioContext.destination);
      soundGain = audioContext.createGain(); cameraGain = audioContext.createGain();
      audioContext.createMediaElementSource(sound).connect(soundGain); soundGain.connect(master);
      audioContext.createMediaElementSource(camera).connect(cameraGain); cameraGain.connect(master);
    }
    soundGain.gain.value = hasSound ? 1 : 0;
    cameraGain.gain.value = $('cameraAudio').checked ? 1 : 0;
    await audioContext.resume();
  }
  function setRecordingUI(on) {
    for (const id of ['playBtn', 'restartBtn', 'scrubber', 'settingsBtn', 'soundBtn', 'exportBtn', 'cameraFile']) $(id).disabled = on;
    $('cancelBtn').style.display = on ? 'inline' : 'none';
    $('exportBtn').textContent = on ? 'Rendering…' : 'Export film ↓';
  }
  function cleanupRecording() {
    exportStream?.getTracks().forEach(track => track.stop()); exportStream = null;
    mediaRecorder = null; recording = false; playing = false;
    camera.pause(); sound.pause(); sound.muted = !audible || !hasSound; camera.muted = !audible || !$('cameraAudio').checked;
    canvas.width = 1080; canvas.height = 1920;
    setRecordingUI(false); updateUI(); draw();
  }
  async function startRecording() {
    if (!ready || recording) return;
    if (!window.MediaRecorder || !canvas.captureStream) { notify('Video export needs a browser with canvas recording support.', 6000); return; }
    pause(); cancelExport = false; exportChunks = [];
    try {
      const mime = ['video/mp4;codecs=avc1.42001E,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find(x => MediaRecorder.isTypeSupported(x));
      if (!mime) throw new Error('This browser has no supported video encoder.');
      await setupAudio(); seek(0);
      sound.muted = !hasSound; camera.muted = !$('cameraAudio').checked;
      if (hasCamera) {
        camera.currentTime = 0;
        await new Promise(resolve => { if (!camera.seeking) return resolve(); camera.addEventListener('seeked', resolve, { once: true }); setTimeout(resolve, 1000); });
      }
      draw(0); exportStream = canvas.captureStream(60);
      // Clone the destination track; stopping a render must not stop the reusable mixer.
      for (const track of audioDestination.stream.getAudioTracks()) exportStream.addTrack(track.clone());
      mediaRecorder = new MediaRecorder(exportStream, { mimeType: mime, videoBitsPerSecond: 14000000, audioBitsPerSecond: 192000 });
      mediaRecorder.ondataavailable = e => { if (e.data.size) exportChunks.push(e.data); };
      mediaRecorder.onerror = () => { cancelExport = true; notify('The browser encoder stopped. Try exporting in Chrome.', 6500); finishRecording(); };
      mediaRecorder.onstop = () => {
        if (!cancelExport && exportChunks.length) {
          const ext = mime.includes('mp4') ? 'mp4' : 'webm';
          const blob = new Blob(exportChunks, { type: `video/${ext}` }), url = URL.createObjectURL(blob);
          const a = document.createElement('a'); a.href = url; a.download = `claude-curiosity${hasCamera ? '-with-camera' : ''}.${ext}`; a.click();
          setTimeout(() => URL.revokeObjectURL(url), 60000);
          notify(`${ext.toUpperCase()} exported · ${(blob.size / 1048576).toFixed(1)} MB`, 5500);
        } else if (cancelExport) notify('Export cancelled.', 3500);
        cleanupRecording(); exportChunks = [];
      };
      recording = true; setRecordingUI(true);
      mediaRecorder.start(500);
      if (hasSound) await sound.play();
      if (hasCamera) await camera.play();
      time = 0; origin = performance.now(); playing = true; notify('Rendering 0%');
    } catch (error) {
      cancelExport = true;
      if (mediaRecorder?.state === 'recording') mediaRecorder.stop(); else cleanupRecording();
      notify(`Export could not start: ${error.message}`, 7000);
    }
  }
  function finishRecording() {
    playing = false; camera.pause(); sound.pause();
    if (!cancelExport) { time = DURATION; draw(); }
    if (mediaRecorder?.state === 'recording') mediaRecorder.stop();
  }

  $('playBtn').onclick = () => playing ? pause() : play();
  $('restartBtn').onclick = () => { if (!recording) { pause(); seek(0); play(); } };
  $('scrubber').oninput = e => { if (!recording) { pause(); seek(Number(e.target.value)); } };
  $('soundBtn').onclick = toggleSound;
  $('settingsBtn').onclick = () => { pause(); $('settings').showModal(); };
  $('closeSettings').onclick = () => $('settings').close();
  $('settings').onclick = e => { if (e.target === $('settings')) { const r = $('settings').getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) $('settings').close(); } };
  $('fullscreenBtn').onclick = () => document.fullscreenElement ? document.exitFullscreen() : $('screen').requestFullscreen?.();
  $('cameraFile').onchange = e => attach(e.target.files[0]);
  $('removeClip').onclick = removeClip;
  $('flipCamera').onchange = e => { mirror = e.target.checked; draw(); };
  $('cameraAudio').onchange = () => { camera.muted = !audible || !$('cameraAudio').checked; if (cameraGain) cameraGain.gain.value = $('cameraAudio').checked ? 1 : 0; };
  $('includeSound').onchange = e => { hasSound = e.target.checked; sound.muted = !audible || !hasSound; if (soundGain) soundGain.gain.value = hasSound ? 1 : 0; if (!hasSound) sound.pause(); else if (audible && playing) { sound.currentTime = time; sound.play().catch(() => {}); } };
  $('exportBtn').onclick = startRecording;
  $('cancelBtn').onclick = () => { cancelExport = true; finishRecording(); };
  camera.addEventListener('seeked', () => { if (!playing) draw(); });
  document.addEventListener('keydown', e => {
    if (recording || $('settings').open || /INPUT|BUTTON|A/.test(e.target.tagName)) return;
    if (e.code === 'Space') { e.preventDefault(); playing ? pause() : play(); }
    if (e.key.toLowerCase() === 'r') { pause(); seek(0); play(); }
    if (e.key.toLowerCase() === 'm') toggleSound();
    if (e.key.toLowerCase() === 'f') $('fullscreenBtn').click();
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); pause(); seek(time + (e.key === 'ArrowRight' ? .25 : -.25)); }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && recording) notify('Keep this tab visible while rendering.');
    else if (document.hidden && playing) pause();
  });
  window.addEventListener('pagehide', () => { if (clipURL) URL.revokeObjectURL(clipURL); });
  ['dragover', 'drop'].forEach(name => $('film').addEventListener(name, e => { e.preventDefault(); if (name === 'drop' && !recording) attach(e.dataTransfer.files[0]); }));

  // Public, small render interface used by the frame-accurate MP4 exporter.
  window.claudeFilm = {
    duration: DURATION, cuts: cutTimes, get ready() { return ready; },
    get state() { return { time, playing, hasCamera, recording, audible }; },
    seek(t) { pause(); seek(t); },
    render(t) { playing = false; time = clamp(t, 0, DURATION); draw(time); updateUI(); },
    play, pause,
    setResolution(w, h) { canvas.width = w; canvas.height = h; draw(); },
    async capture(t) { playing = false; time = clamp(t, 0, DURATION); draw(time); return canvas.toDataURL('image/jpeg', .96).split(',')[1]; }
  };
  updateUI();
  const imageLoads = ['ocean', 'architecture', 'flower', 'mountain', 'studio'].map(name => new Promise((resolve, reject) => {
    const img = new Image(); img.onload = () => { photos[name] = img; resolve(); }; img.onerror = () => reject(new Error(`Missing photo: ${name}`)); img.src = `assets/claude/${name}.jpg`;
  }));
  Promise.all([...imageLoads, document.fonts.load('800 100px Manrope'), document.fonts.load('400 100px Editorial'), document.fonts.load('italic 400 100px Editorial')]).then(() => {
    ready = true; $('loading').classList.add('done'); $('playBtn').disabled = false; $('exportBtn').disabled = false;
    draw(0); requestAnimationFrame(frame);
    const manual = new URLSearchParams(location.search).has('render');
    if (manual || matchMedia('(prefers-reduced-motion: reduce)').matches) { seek(manual ? 0 : 15); }
    else play();
  }).catch(error => { $('loading').querySelector('span').textContent = error.message; notify('Keep the assets/claude folder beside video1.html.'); console.error(error); });
})();
