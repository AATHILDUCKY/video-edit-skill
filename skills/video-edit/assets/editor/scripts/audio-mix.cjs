/* Shared audio plan for offline rendering and lossless picture-preserving audio revisions. */
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
function inside(root,name){const p=path.resolve(root,name);if(!p.startsWith(path.resolve(root)+path.sep))throw Error('Media must stay inside the project.');return p}
function gain(value,fallback=1){if(value===undefined)return fallback;if(!Number.isFinite(value)||value<0||value>1)throw Error('Audio volume must be between 0 and 1.');return value}
function tempo(value){const a=[];while(value>2){a.push('atempo=2');value/=2}while(value<.5){a.push('atempo=0.5');value/=.5}a.push(`atempo=${value}`);return a.join(',')}
function hasAudio(file){const r=spawnSync(process.env.FFPROBE_PATH||'ffprobe',['-v','error','-select_streams','a:0','-show_entries','stream=index','-of','csv=p=0',file],{encoding:'utf8'});if(r.error||r.status)throw Error('Could not inspect inserted clip audio: '+file);return Boolean(r.stdout.trim())}
function buildAudioMix(root,manifest,state){
 const template=state.template,outro=manifest.outro,filters=[],inputs=['assets/codex/effects.wav','assets/codex/rhythm.wav','assets/codex/keyboard.wav',manifest.camera].map(x=>inside(root,x));
 const sources=state.sourceScenes,scenes=template.scenes,duration=state.duration;
 if(outro){const s=scenes.find(x=>x.kind==='brand-outro');if(!s||Math.abs(s.start-outro.start)>.001||Math.abs(s.duration-outro.duration)>.001)throw Error('Rebuild changed outro timing before mixing audio.')}
 ['fx','bed','keys'].forEach((name,bus)=>{
  filters.push(`[${bus+1}:a]asplit=${scenes.length}${scenes.map((_,i)=>`[${name}in${i}]`).join('')}`);
  scenes.forEach((scene,i)=>{
   const source=sources[i],muted=scene.kind==='brand-outro'||(bus===2&&(scene.visual?.image||!source.typing));
   filters.push(`[${name}in${i}]atrim=start=${source.sourceStart}:end=${source.sourceStart+source.duration},asetpts=PTS-STARTPTS,${tempo(source.duration/scene.duration)},apad,atrim=duration=${scene.duration}${muted?',volume=0':''}[${name}out${i}]`);
  });
  const level=bus===0?gain(template.sfxVolume,.24):bus===1?gain(template.musicVolume,.025):template.keyboardSound?gain(template.sfxVolume,.24)*.85:0;
  filters.push(`${scenes.map((_,i)=>`[${name}out${i}]`).join('')}concat=n=${scenes.length}:v=0:a=1,volume=${level}[${name}]`);
 });
 const voiceGain=template.cameraAudio===false?0:gain(template.cameraVolume);
 filters.push(`[4:a]atrim=duration=${manifest.content_duration??duration},asetpts=PTS-STARTPTS,volume=${voiceGain},apad,atrim=duration=${duration}[voice]`);
 const labels=['voice','fx','bed','keys'];
 if(outro){inputs.push(inside(root,outro.file));const delay=Math.round(outro.start*48000);filters.push(`[5:a]aresample=48000,aformat=channel_layouts=stereo,asetpts=PTS-STARTPTS,adelay=${delay}S|${delay}S,apad,atrim=duration=${duration}[outro]`);labels.push('outro')}
 const inserts=[],silentInserts=[];
 for(const [i,scene]of scenes.entries()){
  const v=scene.visual||{};if(scene.kind==='brand-outro'||!v.video||!['split','broll'].includes(v.layout||'split')||v.videoAudio===false)continue;
  const file=inside(root,v.video);if(!hasAudio(file)){silentInserts.push({scene:scene.kind,file:v.video});continue;}
  const index=inputs.length+1;inputs.push(file);const label='insert'+i,level=gain(template.insertVolume)*gain(v.videoVolume),delay=Math.round(scene.start*48000);
  const sourceIn=Number(v.videoIn)||0;if(sourceIn<0)throw Error('Insert audio in-point must be non-negative.');
  filters.push(`[${index}:a]atrim=start=${sourceIn}:duration=${scene.duration},asetpts=PTS-STARTPTS,aresample=48000,aformat=channel_layouts=stereo,volume=${level},adelay=${delay}S|${delay}S,apad,atrim=duration=${duration}[${label}]`);
  labels.push(label);inserts.push({scene:scene.kind,file:v.video,gain:level});
 }
 filters.push(`${labels.map(x=>`[${x}]`).join('')}amix=inputs=${labels.length}:duration=first:dropout_transition=0:normalize=0,alimiter=limit=0.95:level=0:latency=1,apad,atrim=duration=${duration}[audio]`);
 return {inputs,filters,report:{source_audio_enabled:template.cameraAudio!==false,source_gain:voiceGain,insert_tracks:inserts,silent_insert_files:silentInserts,outro_audio:Boolean(outro)}};
}
function readState(root,templateFile){
 const text=fs.readFileSync(path.join(root,'assets/codex/template.js'),'utf8');
 const base=JSON.parse(text.slice(text.indexOf('=')+1).trim().replace(/;$/,''));
 let template=structuredClone(base);
 if(templateFile){const saved=JSON.parse(fs.readFileSync(templateFile,'utf8'));if(saved.format!=='codex-short-template')throw Error('Choose a full edit template.');template={...template,...saved.settings}}
 if(Math.abs(template.targetDuration-base.targetDuration)>.001)throw Error('Rebuild the footage before changing its duration.');
 let clock=0;const sourceScenes=base.scenes.map(s=>{const r={...s,sourceStart:clock};clock+=s.duration;return r});
 const weights=template.scenes.map((s,i)=>template.sceneWeights?.[s.kind]||sourceScenes[i].duration/clock),sum=weights.reduce((a,b)=>a+b,0);clock=0;
 template.scenes=template.scenes.map((s,i)=>{const duration=template.targetDuration*weights[i]/sum,r={...s,start:clock,duration,end:clock+duration};clock+=duration;return r});
 return {duration:template.targetDuration,template,sourceScenes};
}
module.exports={buildAudioMix,readState,hasAudio};
