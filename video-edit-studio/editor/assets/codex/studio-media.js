/* Local B-roll and the brand outro. No network assets, no cumulative animation state. */
(() => {
  const records=new Map();
  function record(src){
    if(!/^media\/[a-zA-Z0-9_.-]+$/.test(src))throw Error('Use a packaged media file.');
    if(records.has(src))return records.get(src);
    const video=document.createElement('video');video.preload='auto';video.muted=true;video.playsInline=true;
    const ready=new Promise((resolve,reject)=>{video.onloadeddata=()=>resolve(video);video.onerror=()=>reject(Error('Could not decode '+src))});
    const item={video,ready};records.set(src,item);video.src=src;video.load();return item;
  }
  function active(scene,t){const v=scene.visual||{};return v.video?{...record(v.video),target:Math.max(0,Number(v.videoIn)||0)+Math.max(0,t-scene.start)}:null}
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
  const audio=new Audio();audio.preload='auto';
  const outro=window.CODEX_SHORT_TEMPLATE.outro;if(outro)audio.src=outro.file;
  let routed=false;
  window.videoEditMedia={prepare,sync,draw,
    preload:()=>Promise.all(window.CODEX_SHORT_TEMPLATE.scenes.filter(s=>s.visual?.video).map(s=>record(s.visual.video).ready)),
    connect(context,bus){if(outro&&!routed){context.createMediaElementSource(audio).connect(bus);routed=true}},
    audio(t,playing,audible){
      if(!outro)return;const target=Math.max(0,Math.min(t-outro.start,outro.duration-.01));
      audio.muted=!routed&&!audible;
      if(!audio.seeking&&Math.abs(audio.currentTime-target)>.15)audio.currentTime=target;
      if(playing&&t>=outro.start&&t<outro.start+outro.duration){if(audio.paused)audio.play().catch(()=>{})}else audio.pause();
    },
    pause(){for(const r of records.values())r.video.pause();audio.pause()}
  };
})();
