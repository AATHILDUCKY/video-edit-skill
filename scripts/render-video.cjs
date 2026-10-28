/* Frame-accurate export. Requires Playwright and FFmpeg, no running HTTP server.
 * npm install
 * FFMPEG_PATH=/path/to/ffmpeg npm run render
 * npm run preview:frames
 */
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const preview = process.argv.includes('--preview');
const target = path.resolve(root, 'codex-html-template-1080x1920.mp4');

(async () => {
  const options = { headless: true, args: ['--autoplay-policy=no-user-gesture-required'] };
  if (process.env.CHROME_PATH) options.executablePath = process.env.CHROME_PATH;
  const browser = await chromium.launch(options);
  let encoder;
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 1 });
    page.on('pageerror', e => { throw e; });
    await page.goto(pathToFileURL(path.join(root, 'video1.html')).href + '?render', { waitUntil: 'load' });
    await page.waitForFunction(() => window.codexShort?.ready);
    const { duration, cuts, template } = await page.evaluate(() => ({ duration: codexShort.duration, cuts: codexShort.cuts, template: codexShort.template }));
    if (preview) {
      const dir = path.join(root, 'renders/codex'); fs.mkdirSync(dir, { recursive: true });
      for (const t of cuts.slice(0, -1).map((start, i) => start + Math.min(.65, (cuts[i+1] - start) * .6))) {
        const image = await page.evaluate(t => {
          window.codexShort.render(t);
          return document.getElementById('reelCanvas').toDataURL('image/png').split(',')[1];
        }, t);
        fs.writeFileSync(path.join(dir, `frame-${t.toFixed(2)}.png`), Buffer.from(image, 'base64'));
      }
      await page.screenshot({ path: path.join(dir, 'player-desktop.png') });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.screenshot({ path: path.join(dir, 'player-mobile.png') });
      console.log('Saved scene frames and desktop/mobile previews to renders/.');
      return;
    }
    encoder = spawn(process.env.FFMPEG_PATH || 'ffmpeg', [
      '-y', '-hide_banner', '-loglevel', 'error',
      '-framerate', '60', '-f', 'image2pipe', '-vcodec', 'mjpeg', '-i', 'pipe:0',
      '-i', path.join(root, 'assets/codex/effects.wav'),
      '-i', path.join(root, 'assets/codex/rhythm.wav'),
      '-i', path.join(root, 'assets/codex/keyboard.wav'),
      '-filter_complex', `[1:a]volume=${template.sfxVolume}[sfx];[2:a]volume=${template.musicVolume}[bed];[3:a]volume=${template.keyboardSound && template.promptText.trim() ? template.sfxVolume * .85 : 0}[keys];[sfx][bed][keys]amix=inputs=3:duration=longest:dropout_transition=0,volume=2.7,alimiter=limit=0.95[audio]`,
      '-map', '0:v:0', '-map', '[audio]',
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p',
      '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-t', String(duration),
      '-movflags', '+faststart', target
    ], { stdio: ['pipe', 'ignore', 'pipe'] });
    let encoderError = '';
    encoder.stderr.on('data', data => encoderError += data.toString());
    const finished = new Promise((resolve, reject) => {
      encoder.once('error', reject);
      encoder.once('close', code => code === 0 ? resolve() : reject(new Error(encoderError || `Encoder exited ${code}`)));
    });
    // Capture every frame at its exact timeline time; playback speed cannot affect the master.
    for (let frame = 0; frame < Math.round(duration * 60); frame++) {
      const jpeg = await page.evaluate(t => window.codexShort.capture(t), frame / 60);
      if (!encoder.stdin.write(Buffer.from(jpeg, 'base64'))) await once(encoder.stdin, 'drain');
      if (frame % 60 === 0) console.log(`Rendered ${frame / 60}/${duration} seconds`);
    }
    encoder.stdin.end(); await finished;
    console.log(`Finished ${target} (${(fs.statSync(target).size/1048576).toFixed(1)} MB)`);
  } finally {
    if (encoder && encoder.exitCode === null) encoder.kill();
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
