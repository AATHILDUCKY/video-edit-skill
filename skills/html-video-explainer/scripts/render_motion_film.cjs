/* Exact-time 16:9 film rendering, offline WAV and 3-sample temporal motion blur. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {spawn}=require('node:child_process'),{once}=require('node:events'),{pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const args=process.argv.slice(2),input=args.find(arg=>!arg.startsWith('-'));
function option(name,fallback){const i=args.indexOf(name);return i>=0?args[i+1]:fallback}
if(!input){console.error('Usage: node render_motion_film.cjs film.html --preview | --reviewed [--output film.mp4] [--allow-demo]');process.exit(1)}
const entry=path.resolve(input),stem=path.basename(entry,'.html'),root=path.dirname(entry),reviewDir=path.join(root,stem+'-review'),sourceHash=crypto.createHash('sha256').update(fs.readFileSync(entry)).digest('hex');
const preview=args.includes('--preview'),ffmpeg=process.env.FFMPEG_PATH||'ffmpeg';
async function command(argv){const child=spawn(ffmpeg,argv,{stdio:['ignore','ignore','pipe']});let log='';child.stderr.on('data',data=>log+=data);await new Promise((resolve,reject)=>{child.on('error',reject);child.on('close',code=>code?reject(new Error(log)):resolve())})}
// FFmpeg releases differ in tmix warm-up behavior. Probe actual triplet averages
// so a legacy filter cannot shift the film or drop its first output frame.
async function mixingLeadIn(){
 const values=Buffer.from([0,30,60,90,120,150,180,210,240]);
 for(const lead of [0,3]){
  const data=Buffer.concat([Buffer.alloc(lead,0),values]);
  const child=spawn(ffmpeg,['-hide_banner','-loglevel','error','-f','rawvideo','-pixel_format','gray','-video_size','1x1','-framerate','180','-i','pipe:0','-vf',"tmix=frames=3:weights='1 1 1',select='eq(mod(n,3),2)'",'-vsync','0','-frames:v','3','-f','rawvideo','-pix_fmt','gray','pipe:1'],{stdio:['pipe','pipe','pipe']});
  const chunks=[];let log='';child.stdout.on('data',x=>chunks.push(x));child.stderr.on('data',x=>log+=x);
  const done=new Promise((resolve,reject)=>{child.on('error',reject);child.on('close',code=>code?reject(new Error(log)):resolve())});
  child.stdin.end(data);await done;const out=Buffer.concat(chunks);
  if(out.length===3&&[30,120,210].every((value,i)=>Math.abs(out[i]-value)<=1))return lead;
 }
 throw Error('This FFmpeg tmix did not produce the expected disjoint triplet averages.');
}
(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,args:['--autoplay-policy=no-user-gesture-required']});let encoder;try{
const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(pathToFileURL(entry).href,{waitUntil:'load'});await page.evaluate(async()=>{await document.fonts.ready;await window.motionFilmReady});
const info=await page.evaluate(()=>({config:window.filmConfig,seek:typeof window.seek,animations:document.getAnimations().filter(animation=>animation.playState==='running').length,cameraWillChange:[...document.querySelectorAll('[data-camera],[data-camera] *')].some(node=>getComputedStyle(node).willChange!=='auto')}));
if(info.seek!=='function'||!info.config)throw Error('Expose window.seek(t) and window.filmConfig with duration/bpm/isDemo.');
const config=info.config,duration=Number(config.duration),bpm=Number(config.bpm),fps=60,samples=Number(option('--subframes',3));
if(!Number.isFinite(duration)||duration<=0||!Number.isFinite(bpm)||bpm<=0||![1,3].includes(samples))throw Error('Positive duration/BPM and 1 or 3 subframes required.');
if(Math.abs(duration*fps-Math.round(duration*fps))>.0001)throw Error('Duration must align with a 60fps frame boundary.');
if(info.animations||info.cameraWillChange)throw Error('Remove active CSS animations and will-change on camera-scaled layers.');
if(config.isDemo&&!args.includes('--allow-demo'))throw Error('This is still an authoring demo. Implement the film and set isDemo=false, or use --allow-demo only to test the pipeline.');
async function capture(t){await page.evaluate(t=>window.seek(t),t);return page.screenshot({type:'png'})}
const a=await capture(duration*.47);await capture(duration*.13);const b=await capture(duration*.47);if(!a.equals(b))throw Error('seek(t) is not deterministic across random-access frame order.');
if(config.loop){const first=await capture(0),last=await capture(duration-1/fps);if(!first.equals(last))throw Error('Loop first/last output frames do not match. Plan the loop return explicitly.');}
fs.mkdirSync(reviewDir,{recursive:true});const manifestPath=path.join(reviewDir,'beats.json');
if(preview){
 const beat=60/bpm,frames=[];for(let i=0;i*beat<duration-.000001;i++){const t=i*beat,file=`beat-${String(i).padStart(3,'0')}.png`;fs.writeFileSync(path.join(reviewDir,file),await capture(t));frames.push({beat:i+1,time:t,file})}
 fs.writeFileSync(path.join(reviewDir,'end.png'),await capture(duration));
 // Small contact sheets keep long beat maps legible during agent inspection.
 for(let start=0;start<frames.length;start+=16){const batch=frames.slice(start,start+16),list=path.join(reviewDir,`sheet-${start}.txt`);fs.writeFileSync(list,batch.map(frame=>`file '${frame.file}'\nduration 1`).join('\n')+'\n');await command(['-y','-hide_banner','-loglevel','error','-f','concat','-safe','0','-i',list,'-vf',`scale=480:270,tile=4x${Math.ceil(batch.length/4)}`,'-frames:v','1',path.join(reviewDir,`sheet-${String(start).padStart(3,'0')}.png`)])}
 if(errors.length)throw Error(errors.join('\n'));
 fs.writeFileSync(manifestPath,JSON.stringify({sourceSha256:sourceHash,duration,bpm,fps,subframes:samples,deterministic:true,frames},null,2)+'\n');
 console.log(`Saved ${frames.length} beat frames and contact sheets in ${reviewDir}. Inspect them and fix issues before --reviewed.`);return;
}
if(!args.includes('--reviewed')||!fs.existsSync(manifestPath))throw Error('Run --preview, inspect every beat/contact sheet, then render with --reviewed.');
const reviewed=JSON.parse(fs.readFileSync(manifestPath,'utf8'));if(reviewed.sourceSha256!==sourceHash||reviewed.duration!==duration||reviewed.bpm!==bpm)throw Error('Film changed after beat preview. Generate and inspect a fresh preview.');
const target=path.resolve(option('--output',path.join(root,stem+'.mp4')));if(path.extname(target).toLowerCase()!=='.mp4'||target===entry)throw Error('Output must be a separate MP4 file.');fs.mkdirSync(path.dirname(target),{recursive:true});
const externalAudio=option('--audio',null),wav=externalAudio?path.resolve(externalAudio):path.join(root,stem+'.wav');
if(!externalAudio){if(await page.evaluate(()=>typeof window.renderSoundtrack)!=='function')throw Error('Expose renderSoundtrack() returning base64 WAV, or supply --audio.');const encoded=await page.evaluate(()=>window.renderSoundtrack());fs.writeFileSync(wav,Buffer.from(encoded,'base64'))}
if(!fs.existsSync(wav))throw Error('Audio file missing.');
const leadIn=samples===3?await mixingLeadIn():0;
const filter=samples===3?"tmix=frames=3:weights='1 1 1',select='eq(mod(n,3),2)',settb=1/60,setpts=N":'settb=1/60,setpts=N';
encoder=spawn(ffmpeg,['-y','-hide_banner','-loglevel','error','-framerate',String(fps*samples),'-f','image2pipe','-vcodec','png','-i','pipe:0','-i',wav,'-vf',filter,'-map','0:v:0','-map','1:a:0','-r','60','-frames:v',String(Math.round(duration*fps)),'-c:v','libx264','-preset','medium','-crf','17','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-t',String(duration),'-movflags','+faststart',target],{stdio:['pipe','ignore','pipe']});
let log='';encoder.stderr.on('data',data=>log+=data);const finished=new Promise((resolve,reject)=>{encoder.on('error',reject);encoder.on('close',code=>code?reject(new Error(log)):resolve())});
for(let frame=0;frame<Math.round(duration*fps);frame++){
 for(let sample=0;sample<samples;sample++){
  // Centre each exposure on its output frame; 3 samples cover a half-frame shutter.
  const offset=samples===1?0:(sample-1)*.25/fps,t=Math.max(0,Math.min(duration,frame/fps+offset)),png=await capture(t);
  if(frame===0&&sample===0)for(let warmup=0;warmup<leadIn;warmup++){if(!encoder.stdin.write(png))await once(encoder.stdin,'drain')}
  if(!encoder.stdin.write(png))await once(encoder.stdin,'drain');
 }
 if(frame%60===0)console.log(`Rendered ${frame/fps}/${duration}s (${samples} temporal samples)`);
}
encoder.stdin.end();await finished;if(errors.length)throw Error(errors.join('\n'));
console.log(`Rendered ${target}; audio ${wav}; ${Math.round(duration*fps)} output frames at 60fps.`);
}finally{if(encoder&&encoder.exitCode===null)encoder.kill();await browser.close()}})().catch(error=>{console.error(error);process.exitCode=1});
