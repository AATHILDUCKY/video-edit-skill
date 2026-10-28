/* Local inserts retain their own audio. The main voice continues under visual inserts. */
(() => {
  const records=new Map();let context=null,bus=null;
  function route(item){if(context&&!item.gain){item.gain=context.createGain();item.gain.gain.value=0;context.createMediaElementSource(item.video).connect(item.gain);item.gain.connect(bus)}}
  function record(src){
    if(!/^media\/[a-zA-Z0-9_.-]+$/.test(src))throw Error('Use a packaged media file.');
    if(records.has(src))return records.get(src);
    const video=document.createElement('video');video.preload='auto';video.muted=true;video.playsInline=true;
    const ready=new Promise((resolve,reject)=>{video.onloadeddata=()=>resolve(video);video.onerror=()=>reject(Error('Could not decode '+src))});
    const item={video,ready,gain:null};records.set(src,item);route(item);video.src=src;video.load();return item;
  }
  function active(scene,t){const v=scene?.visual||{};return v.video?{...record(v.video),target:Math.max(0,Number(v.videoIn)||0)+Math.max(0,t-scene.start)}:null}
  async function prepare(scene,t){
    const item=active(scene,t);if(!item)return;const video=await item.ready;
    if(item.target>video.duration+.02)throw Error('B-roll in-point plus scene duration exceeds the clip.');
    const target=Math.min(item.target,Math.max(0,video.duration-.001));video.pause();
    if(Math.abs(video.currentTime-target)<.0001&&video.readyState>=2)return;
    await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{clean();reject(Error('B-roll/outro seek timed out'))},15000);
      function clean(){clearTimeout(timer);video.removeEventListener('seeked',done);video.removeEventListener('error',fail)}
      function done(){clean();resolve()}function fail(){clean();reject(Error('B-roll/outro decode failed'))}
      video.addEventListener('seeked',done,{once:true});video.addEventListener('error',fail,{once:true});video.currentTime=target;
    });
  }
  function sync(scene,t,playing){
    const item=active(scene,t);
    for(const r of records.values())if(r.video!==item?.video)r.video.pause();
    if(!item||item.video.readyState<2)return;
    const video=item.video,target=Math.min(item.target,Math.max(0,video.duration-.001));
    if(!video.seeking&&Math.abs(video.currentTime-target)>(playing?.18:.025))video.currentTime=target;
    if(playing&&video.paused&&target<video.duration-.02)video.play().catch(()=>{});else if(!playing)video.pause();
  }
  function draw(ctx,scene,t,w,h,top=0){
    const item=active(scene,t);if(!item||item.video.readyState<2)return false;
    const video=item.video,scale=Math.max(w/video.videoWidth,h/video.videoHeight);
    ctx.save();ctx.beginPath();ctx.rect(0,top,w,h);ctx.clip();ctx.drawImage(video,(w-video.videoWidth*scale)/2,top+(h-video.videoHeight*scale)/2,video.videoWidth*scale,video.videoHeight*scale);ctx.restore();return true;
  }
  const outroAudio=new Audio();outroAudio.preload='auto';
  const outro=window.CODEX_SHORT_TEMPLATE.outro;if(outro)outroAudio.src=outro.file;
  let outroRouted=false;
  window.videoEditMedia={prepare,sync,draw,
    preload:()=>Promise.all(window.CODEX_SHORT_TEMPLATE.scenes.filter(s=>s.visual?.video).map(s=>record(s.visual.video).ready)),
    connect(ctx,target){context=ctx;bus=target;for(const item of records.values())route(item);if(outro&&!outroRouted){ctx.createMediaElementSource(outroAudio).connect(target);outroRouted=true}},
    audio(t,playing,audible,scene,insertVolume=1){
      const visual=scene?.visual||{};
      const audibleInsert=scene?.kind!=='brand-outro'&&['split','broll'].includes(visual.layout||'split')&&visual.videoAudio!==false;
      for(const [src,item]of records){
        const gain=audibleInsert&&visual.video===src?Math.max(0,Math.min(1,insertVolume))*Math.max(0,Math.min(1,visual.videoVolume??1)):0;
        if(item.gain){item.gain.gain.value=gain;item.video.volume=1;item.video.muted=false}
        else{item.video.volume=gain;item.video.muted=!audible||gain===0}
      }
      if(!outro)return;const target=Math.max(0,Math.min(t-outro.start,outro.duration-.01));
      outroAudio.muted=!outroRouted&&!audible;
      if(!outroAudio.seeking&&Math.abs(outroAudio.currentTime-target)>.15)outroAudio.currentTime=target;
      if(playing&&t>=outro.start&&t<outro.start+outro.duration){if(outroAudio.paused)outroAudio.play().catch(()=>{})}else outroAudio.pause();
    },
    pause(){for(const r of records.values())r.video.pause();outroAudio.pause()}
  };
})();
