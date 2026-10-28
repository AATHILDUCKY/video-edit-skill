/* Only audio changes. Encoded video packets are copied exactly into a new deliverable. */
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const {buildAudioMix,readState}=require('./audio-mix.cjs');
const root=path.resolve(__dirname,'..'),manifest=JSON.parse(fs.readFileSync(path.join(root,'video.project.json'),'utf8'));
const at=process.argv.indexOf('--template'),state=readState(root,at<0?null:process.argv[at+1]);
const mix=buildAudioMix(root,manifest,state),output=path.join(root,'final-audio.mp4');
const args=['-y','-hide_banner','-loglevel','error','-i',path.join(root,manifest.video),...mix.inputs.flatMap(p=>['-i',p]),'-filter_complex',mix.filters.join(';'),'-map','0:v:0','-map','[audio]','-c:v','copy','-c:a','aac','-b:a','192k','-ar','48000','-t',String(state.duration),'-movflags','+faststart',output];
const result=spawnSync(process.env.FFMPEG_PATH||'ffmpeg',args,{stdio:'inherit'});if(result.error)throw result.error;if(result.status)process.exit(result.status);
fs.writeFileSync(path.join(root,'audio-mix-report.json'),JSON.stringify(mix.report,null,2)+'\n');console.log('Updated audio, preserving encoded picture: '+output);
