/* Exercise actual browser playback/recording; the fixture uses distinct 440/880/1320 Hz sources. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),{serve}=require('../assets/editor/scripts/project-server.cjs');
(async()=>{const root=path.resolve(process.argv[2]),local=await serve(root),browser=await chromium.launch({headless:true});try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(local.url+'/edit.html');await page.waitForFunction(()=>codexShort?.ready&&codexShort.state.hasCamera);
 assert.equal(await page.evaluate(()=>codexShort.state.audible),true,'Playback must start with sound enabled');
 await page.locator('#playBtn').click();await page.waitForFunction(()=>codexShort.state.playing&&codexShort.state.audio.context==='running');
 assert.equal(await page.evaluate(()=>document.getElementById('sourceVideo').muted),false);
 assert.ok(await page.evaluate(()=>codexShort.state.audio.sourceGain>.7),'Source audio reaches the shared mix');
 await page.evaluate(()=>codexShort.pause());await page.locator('#soundBtn').click();
 assert.equal(await page.evaluate(()=>codexShort.state.audible),false);
 // Muted monitoring must not remove any track from the recorded export.
 const downloadPromise=page.waitForEvent('download',{timeout:30000});await page.locator('#exportBtn').click();const download=await downloadPromise;
 await download.saveAs(path.join(root,'browser-audio-proof'+path.extname(download.suggestedFilename())));
 // A deliberately muted prior upload must not silently mute a new recording.
 await page.evaluate(()=>{document.getElementById('cameraAudio').checked=false;document.getElementById('cameraAudio').dispatchEvent(new Event('change'))});
 await page.setInputFiles('#cameraFile',path.join(root,'media/camera-edited.mp4'));
 await page.waitForFunction(()=>codexShort.state.hasCamera&&codexShort.template.cameraAudio&&codexShort.template.cameraVolume===1);
 assert.deepEqual(errors,[]);
 // Direct-file preview uses native audio to avoid silent cross-origin Web Audio routing.
 const filePage=await browser.newPage();await filePage.goto(require('node:url').pathToFileURL(path.join(root,'edit.html')).href);
 await filePage.waitForFunction(()=>codexShort?.ready&&codexShort.state.hasCamera);await filePage.locator('#playBtn').click();
 await filePage.waitForFunction(()=>codexShort.state.playing&&document.getElementById('sourceVideo').currentTime>.1);
 assert.equal(await filePage.evaluate(()=>codexShort.state.audio.context),'native');
 assert.equal(await filePage.evaluate(()=>document.getElementById('sourceVideo').muted),false);
 console.log('PASS: unmuted preview, running audio graph, original-audio gain, export despite muted monitor, new-upload defaults, and native direct-file preview.');
}finally{await browser.close();local.server.close()}})().catch(e=>{console.error(e);process.exitCode=1});
