/* Run on a built fixture project. Requires Playwright and an actual local camera/B-roll/outro. */
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {pathToFileURL}=require('node:url'),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const root=path.resolve(process.argv[2]),local=await require('../assets/editor/scripts/project-server.cjs').serve(root),browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1080}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(local.url+'/edit.html');
  await page.waitForFunction(()=>codexShort?.ready&&codexShort.state.hasCamera&&window.codexVisualEditor?.ready);
  await page.evaluate(()=>codexShort.pause());
  assert.equal(await page.evaluate(()=>document.fonts.check('800 60px "Noto Sans Tamil"')),true);
  const check=await page.evaluate(async()=>{
   const api=codexShort,before=api.captions,scene=api.template.scenes.find(s=>s.visual?.video&&s.kind!=='brand-outro');
   const t=scene.start+.9;
   const first=await api.capture(t);await api.capture(t+1);const again=await api.capture(t);
   const index=api.template.scenes.findIndex(s=>s.kind===scene.kind);
   await api.setSceneVisual(index,{layout:'split',videoIn:.2});
   const after=api.captions;
   await api.setSceneVisual(index,scene.visual);
   return {same:first===again,before,after};
  });
  assert.ok(check.same,'B-roll capture must be deterministic after seeking away and back');
  assert.deepEqual(check.before,check.after,'Visual edits must preserve measured caption times');
  await page.evaluate(async()=>{
   const original=codexShort.template.scenes[0].visual;
   await codexShort.setSceneVisual(0,{layout:'camera'});codexShort.seek(.7);
   document.getElementById('reframeBtn').click();
   if(document.getElementById('framingCanvas').height!==1920)throw Error('Full-camera crop preview must match full portrait frame.');
   document.getElementById('settings').close();await codexShort.setSceneVisual(0,original);
  });
  await page.evaluate(()=>{codexShort.seek(4.7);codexVisualEditor.select(2,false);document.getElementById('status').textContent=''});
  await page.screenshot({path:path.join(root,'renders/studio-desktop.png')});
  // Brand-only export must keep the current frame but exclude source captions and cuts.
  await page.locator('#brandBtn').click();
  await page.locator('#brandCreator').fill('@fixture');await page.locator('#brandCreator').dispatchEvent('input');
  const downloadPromise=page.waitForEvent('download');await page.locator('#brandSave').click();const download=await downloadPromise;
  const temp=await download.path(),data=JSON.parse(fs.readFileSync(temp,'utf8'));
  assert.equal(data.settings.creator,'@fixture');assert.equal(data.settings.default_layout,'camera');
  assert.equal(data.settings.captionCues,undefined);assert.equal(data.settings.scenes,undefined);assert.ok(data.settings.frame);
  // Import appearance into this recording without touching its transcript.
  const before=await page.evaluate(()=>codexShort.captions);
  await page.setInputFiles('#brandInput',{name:'brand.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});
  assert.deepEqual(await page.evaluate(()=>codexShort.captions),before);
  await page.locator('#brandClose').click();
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(root,'renders/studio-mobile.png'),fullPage:true});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'Mobile workspace must fit viewport width');
  assert.deepEqual(errors,[]);
  console.log('PASS: automatic camera load, Tamil font, deterministic B-roll, caption isolation, brand portability, responsive editor and no browser exceptions.');
 }finally{await browser.close();local.server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
