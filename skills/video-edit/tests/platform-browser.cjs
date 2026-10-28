/* Integration check against a built, real-footage project. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(process.argv[2]),{serve}=require(path.join(root,'scripts/project-server.cjs'));
(async()=>{
 const local=await serve(root),browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1080}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.goto(local.url+'/edit.html?render');
  await page.waitForFunction(()=>codexShort?.ready&&document.getElementById('platformPreset'));
  await page.evaluate(()=>codexShort.loadProjectCamera('media/camera-edited.mp4'));
  await page.waitForFunction(()=>codexShort.state.hasCamera&&document.getElementById('sourceVideo').readyState>=2);
  const report=await page.evaluate(async()=>{
    const api=codexShort,original=api.template,checks=[];
    function assertBounds(cue,pinned=false){const c=api.captionBounds,b=api.safeBounds,region=api.captionRegion;if(!c)throw Error('Missing caption: '+cue);if(c.x<b.x-.01||c.y<region.y-.01||c.x+c.width>b.right+.01||c.y+c.height>region.bottom+.01)throw Error('Caption leaves bottom section: '+cue+' '+JSON.stringify({c,b,region}));if(pinned&&Math.abs(c.y+c.height-region.bottom)>.01)throw Error('Auto caption is not bottom-anchored: '+cue);checks.push({cue,...c})}
    for(const cue of api.captions){await api.capture((cue.start+cue.end)/2);assertBounds(cue.id)}
    api.setCaptionStyle({x:1,y:1,fontSize:120,maxWidth:.95});
    for(const cue of api.captions){await api.capture((cue.start+cue.end)/2);assertBounds('large-edge-'+cue.id)}
    api.setCaptionStyle({y:0,fontSize:120});
    for(const cue of api.captions){await api.capture((cue.start+cue.end)/2);assertBounds('top-drag-'+cue.id)}
    api.setCaptionStyle({y:null,fontSize:60});
    for(const cue of api.captions){await api.capture((cue.start+cue.end)/2);assertBounds('auto-bottom-'+cue.id,true)}
    const first=api.captions[0],at=(first.start+first.end)/2;
    await api.setSceneVisual(0,{layout:'split',video:null});
    for(const split of [30,48,52,70]){api.setLayout(split);await api.capture(at);assertBounds('split-'+split,true);if(api.state.split+240>api.safeBounds.bottom+.01)throw Error('Divider removed the bottom caption section')}
    api.setSafeArea({preset:'free'});api.setLayout(70);await api.capture(at);assertBounds('free-frame-split',true);
    api.setSafeArea({...original.safeArea,bottom:.45});await api.capture(at);assertBounds('larger-footer',true);
    await api.setSceneVisual(0,{layout:'camera'});await api.capture(at);assertBounds('camera-larger-footer',true);
    await api.loadTemplateFile(new File([JSON.stringify({format:'codex-short-template',version:1,settings:original})],'template.json'));
    await api.capture(at);api.setCaptionStyle({fontSize:120,maxWidth:.3,y:null});assertBounds('fitted-text-slider',true);
    const slider=document.getElementById('captionPositionY'),box=api.captionBounds;
    if(Math.abs(Number(slider.max)*19.2-(api.captionRegion.bottom-box.height/2))>.1)throw Error('Vertical slider does not reflect the fitted text height');
    for(const position of ['top','middle','bottom','auto']){document.querySelector(`[data-caption-position="${position}"]`).click();assertBounds('preset-'+position,position==='bottom'||position==='auto')}
    await api.loadTemplateFile(new File([JSON.stringify({format:'codex-short-template',version:1,settings:original})],'template.json'));
    const hidden=await api.capture(2.3);document.getElementById('showPlatformGuides').checked=true;document.getElementById('showPlatformGuides').dispatchEvent(new Event('change'));
    const shown=await api.capture(2.3);if(hidden!==shown)throw Error('Guides changed exported pixels');
    const saved=api.template;api.setSafeArea({preset:'free'});
    if(api.safeBounds.enabled)throw Error('Full-frame opt-out failed');
    await api.loadTemplateFile(new File([JSON.stringify({format:'codex-short-template',version:1,settings:saved})],'template.json'));
    if(!api.safeBounds.enabled)throw Error('Template did not restore platform profile');
    document.getElementById('showPlatformGuides').checked=true;document.getElementById('showPlatformGuides').dispatchEvent(new Event('change'));
    return {caption_checks:checks,safe_bounds:api.safeBounds,guides_excluded_from_capture:true,template_roundtrip:true,full_frame_opt_out:true};
  });
  // Save-brand includes the platform profile for the next recording.
  const download=page.waitForEvent('download');await page.evaluate(()=>document.getElementById('brandSave').click());
  const d=await download;const saved=JSON.parse(fs.readFileSync(await d.path(),'utf8'));
  assert.equal(saved.settings.safe_area.preset,'instagram-reels');report.brand_roundtrip=true;
  assert.deepEqual(errors,[]);report.page_errors=errors;
  fs.mkdirSync(path.join(root,'renders'),{recursive:true});
  fs.writeFileSync(path.join(root,'renders/platform-check.json'),JSON.stringify(report,null,2)+'\n');
  await page.screenshot({path:path.join(root,'renders/instagram-guide-desktop.png')});
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(root,'renders/instagram-guide-mobile.png'),fullPage:true});
  console.log(JSON.stringify({passed:true,caption_boxes:report.caption_checks.length,safe_bounds:report.safe_bounds,guides_excluded_from_capture:true,template_roundtrip:true,brand_roundtrip:true}));
 }finally{await browser.close();local.server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
