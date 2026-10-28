/* Decode the real camera frame at every output time; render the same canvas as the editor. */
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {spawn}=require('node:child_process'),{once}=require('node:events');
const {serve}=require('./project-server.cjs');
const {buildAudioMix}=require('./audio-mix.cjs');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),manifest=JSON.parse(fs.readFileSync(path.join(root,'video.project.json'),'utf8'));
const preview=process.argv.includes('--preview');
function inside(relative){const p=path.resolve(root,relative);if(path.relative(root,p).startsWith('..')||!p.startsWith(root+path.sep))throw Error('Project media paths must stay inside the project.');return p}
function tempo(value){const a=[];while(value>2){a.push('atempo=2');value/=2}while(value<.5){a.push('atempo=0.5');value/=.5}a.push(`atempo=${value}`);return a.join(',')}
(async()=>{
  if(manifest.is_demo&&!preview)throw Error('Finish the editorial/visual review before final render (video.project.json is_demo must be false).');
  const local=await serve(root);
  let browser;try{browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,args:['--autoplay-policy=no-user-gesture-required']})}catch(e){local.server.close();throw e}
  let encoder;
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1080}}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(local.url+'/'+manifest.html+'?render');
    await page.waitForFunction(()=>window.codexShort?.ready);
    await page.evaluate(src=>codexShort.loadProjectCamera(src),manifest.camera);
    await page.waitForFunction(()=>codexShort.state.hasCamera&&document.getElementById('sourceVideo').readyState>=2);
    const at=process.argv.indexOf('--template');
    if(at>=0){const data=JSON.parse(fs.readFileSync(process.argv[at+1],'utf8'));if(!await page.evaluate(async v=>codexShort.loadTemplateFile(new File([JSON.stringify(v)],'template.json')),data))throw Error('Could not load template.')}
    await page.evaluate(()=>{const d=document.getElementById('settings');if(d.open)d.close();codexShort.pause()});
    const state=await page.evaluate(()=>({duration:codexShort.duration,cuts:codexShort.cuts,template:codexShort.template,sourceScenes:codexShort.sourceScenes,cameraDuration:document.getElementById('sourceVideo').duration,frame:codexShort.state.frame}));
    const fps=manifest.fps||30;
    if(Math.abs((manifest.content_duration??state.duration)-state.cameraDuration)>1/fps+.005)throw Error('Edited camera duration differs from the timeline. Rebuild cuts/alignment; do not change speech speed.');
    async function capture(t){
      return page.evaluate(async t=>{
        const video=document.getElementById('sourceVideo');video.pause();
        // seek() updates caption time AND camera time; listen before invoking it.
        const target=Math.min(t,Math.max(0,video.duration-.001));
        if(Math.abs(video.currentTime-target)>.0001||video.readyState<2){
          await new Promise((resolve,reject)=>{
            const timer=setTimeout(()=>{cleanup();reject(Error('Camera seek timed out'))},15000);
            const cleanup=()=>{clearTimeout(timer);video.removeEventListener('seeked',done);video.removeEventListener('error',fail)};
            const done=()=>{cleanup();resolve()};const fail=()=>{cleanup();reject(Error('Camera decode failed'))};
            video.addEventListener('seeked',done,{once:true});video.addEventListener('error',fail,{once:true});
            video.currentTime=target;
          });
        }
        return codexShort.capture(t);
      },t);
    }
    if(preview){
      const dir=inside('renders');fs.mkdirSync(dir,{recursive:true});
      const times=[0,...state.cuts.slice(0,-1).map((s,i)=>(s+state.cuts[i+1])/2),Math.max(0,state.duration-1/fps)];
      for(const t of times)fs.writeFileSync(path.join(dir,`frame-${t.toFixed(3)}.jpg`),Buffer.from(await capture(t),'base64'));
      await page.screenshot({path:path.join(dir,'editor-desktop.png')});await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(dir,'editor-mobile.png')});
      if(errors.length)throw Error(errors.join('\n'));console.log('Saved previews with actual camera frames.');return;
    }
    const mix=buildAudioMix(root,manifest,state);
    const args=['-y','-hide_banner','-loglevel','error','-framerate',String(fps),'-f','image2pipe','-vcodec','mjpeg','-i','pipe:0',
      ...mix.inputs.flatMap(file=>['-i',file]),'-filter_complex',mix.filters.join(';'),'-map','0:v:0','-map','[audio]',
      '-vf','scale=out_color_matrix=bt709:out_range=tv,setsar=1','-c:v','libx264','-preset','fast','-crf','18','-profile:v','high','-level:v','4.2','-pix_fmt','yuv420p','-r',String(fps),'-fps_mode','cfr','-g',String(fps*2),'-maxrate','12M','-bufsize','24M','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-color_range','tv','-c:a','aac','-b:a','192k','-ar','48000','-ac','2','-t',String(state.duration),'-movflags','+faststart',inside(manifest.video)];
    encoder=spawn(process.env.FFMPEG_PATH||'ffmpeg',args,{stdio:['pipe','ignore','pipe']});let stderr='';
    encoder.stderr.on('data',d=>stderr+=d.toString());encoder.stdin.on('error',()=>{});
    let failed;
    const finished=new Promise(resolve=>{encoder.on('error',e=>{failed=e;resolve()});encoder.on('close',code=>{if(code)failed=Error(stderr||`Encoder exited ${code}`);resolve()})});
    for(let i=0;i<Math.round(state.duration*fps);i++){
      if(failed)throw failed;
      if(!encoder.stdin.write(Buffer.from(await capture(i/fps),'base64')))await Promise.race([once(encoder.stdin,'drain'),finished]);
      if(i%fps===0)console.log(`Rendered ${i/fps}/${state.duration}s`);
    }
    encoder.stdin.end();await finished;if(failed)throw failed;if(errors.length)throw Error(errors.join('\n'));
    fs.writeFileSync(inside('audio-mix-report.json'),JSON.stringify(mix.report,null,2)+'\n');
    console.log(`Rendered ${inside(manifest.video)} with real footage, original-speed speech, captions and sound.`);
  }finally{if(encoder&&encoder.exitCode===null)encoder.kill();await browser.close();local.server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
