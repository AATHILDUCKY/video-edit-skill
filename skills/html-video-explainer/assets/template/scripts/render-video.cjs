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
const project = JSON.parse(fs.readFileSync(path.join(root, 'video.project.json'), 'utf8'));
const target = path.resolve(root, project.video || 'video-preview.mp4');
for (const name of [target, path.resolve(root, project.html || 'video1.html')]) {
  const relative = path.relative(root, name);
  if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Project entry and output must stay inside the project folder.');
}
if (path.extname(target).toLowerCase() !== '.mp4') throw new Error('Video output must have an .mp4 extension.');

(async () => {
  const options = { headless: true, args: ['--autoplay-policy=no-user-gesture-required'] };
  if (process.env.CHROME_PATH) options.executablePath = process.env.CHROME_PATH;
  const browser = await chromium.launch(options);
  let encoder;
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 1 });
    page.on('pageerror', e => { throw e; });
    await page.goto(pathToFileURL(path.join(root, project.html || 'video1.html')).href + '?render', { waitUntil: 'load' });
    await page.waitForFunction(() => window.codexShort?.ready);
    const templateIndex = process.argv.indexOf('--template');
    if (templateIndex !== -1) {
      const settings = JSON.parse(fs.readFileSync(path.resolve(process.argv[templateIndex + 1]), 'utf8'));
      const loaded = await page.evaluate(async data => window.codexShort.loadTemplateFile(new File([JSON.stringify(data)], 'template.json', { type: 'application/json' })), settings);
      if (!loaded) throw new Error('Could not load saved template. Check its format and image files.');
    }
    const durationIndex = process.argv.indexOf('--duration');
    if (durationIndex !== -1) {
      const requested = Number(process.argv[durationIndex + 1]);
      const accepted = await page.evaluate(value => window.codexShort.setDuration(value), requested);
      if (!accepted) throw new Error('Choose a positive --duration in seconds.');
    }
    const { duration, cuts, template, rate, sourceScenes } = await page.evaluate(() => ({ duration: codexShort.duration, cuts: codexShort.cuts, template: codexShort.template, rate: codexShort.playbackRate, sourceScenes: codexShort.sourceScenes }));
    // Chain supported tempo stages so speech/sounds keep their pitch at every allowed duration.
    function tempoFilters(value) {
      const stages = [];
      while (value > 2) { stages.push('atempo=2'); value /= 2; }
      while (value < .5) { stages.push('atempo=0.5'); value /= .5; }
      stages.push(`atempo=${value}`); return stages.join(',');
    }
    const filters = [];
    const busNames = ['sfx','bed','keys'];
    busNames.forEach((bus, busIndex) => {
      const count = template.scenes.length;
      filters.push(`[${busIndex + 1}:a]asplit=${count}${template.scenes.map((_,i) => `[${bus}in${i}]`).join('')}`);
      template.scenes.forEach((scene,i) => {
        const source = sourceScenes[i];
        const gateKeys = busIndex === 2 && (scene.visual?.image || !(sourceScenes.find(s => s.kind === (scene.visual?.preset || scene.kind)) || source).typing);
        filters.push(`[${bus}in${i}]atrim=start=${source.sourceStart}:end=${source.sourceStart + source.duration},asetpts=PTS-STARTPTS,${tempoFilters(source.duration / scene.duration)},apad,atrim=duration=${scene.duration}${gateKeys ? ',volume=0' : ''}[${bus}out${i}]`);
      });
      const gain = busIndex === 0 ? template.sfxVolume : busIndex === 1 ? template.musicVolume : template.keyboardSound ? template.sfxVolume * .85 : 0;
      filters.push(`${template.scenes.map((_,i) => `[${bus}out${i}]`).join('')}concat=n=${count}:v=0:a=1,volume=${gain}[${bus}]`);
    });
    filters.push(`[sfx][bed][keys]amix=inputs=3:duration=longest:dropout_transition=0,volume=2.7,alimiter=limit=0.95,apad,atrim=duration=${duration}[audio]`);
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
      '-filter_complex', filters.join(';'),
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
