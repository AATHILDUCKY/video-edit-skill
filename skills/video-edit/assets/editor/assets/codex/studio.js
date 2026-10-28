/* Brand-only portability and shot controls; no duplicate rendering engine. */
(() => {
 const $=id=>document.getElementById(id);
 function boot(){
  const api=window.codexShort;if(!api?.ready||!window.codexVisualEditor?.ready){requestAnimationFrame(boot);return}
  const choose=()=>window.codexVisualEditor.selectedIndex;
  const current=()=>api.template.scenes[choose()];
  const file=(name,value)=>{const a=document.createElement('a'),url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
  const brand=()=>{const t=api.template;return {...t.brand,version:1,creator:t.creator,accent:t.accent,caption_style:t.captionStyle,safe_area:t.safeArea,frame:{...api.state.frame,mirrored:api.state.mirrored},top_percent:api.state.split/1920*100,camera_volume:t.cameraVolume,insert_volume:t.insertVolume,sfx_volume:t.sfxVolume,music_volume:t.musicVolume,keyboard_sound:t.keyboardSound,motion_intensity:t.motionIntensity}};
  function refresh(){
    const t=api.template,s=current(),v=s.visual||{},locked=s.kind==='brand-outro';
    $('studioProject').textContent=t.name;
    const set=(id,value)=>{if(document.activeElement!==$(id))$(id).value=value};
    set('studioLayout',v.layout||'split');set('studioBroll',v.video||'');set('studioBrollIn',v.videoIn||0);set('studioLabels',(s.labels||[]).join('\n'));
    for(const id of ['studioLayout','studioBroll','studioBrollIn','studioLabels'])$(id).disabled=locked;
    set('brandCreator',t.creator);set('brandAccent',t.accent);set('brandMotion',Math.round(t.motionIntensity*100));set('brandLayout',t.brand.default_layout);
    $('brandOutro').textContent=t.outro?`insta-follow-2.mp4 · ${t.outro.duration.toFixed(2)}s`:'Disabled for this project';
  }
  const clips=[...new Set(api.template.scenes.filter(s=>s.kind!=='brand-outro').map(s=>s.visual?.video).filter(Boolean))];
  $('studioBroll').replaceChildren(new Option('None',''),...clips.map(src=>new Option(src.split('/').pop(),src)));
  async function visual(patch){try{await api.setSceneVisual(choose(),patch);$('visualMessage').textContent='Shot saved. Preview and export use these settings.'}catch(e){$('visualMessage').textContent=e.message}refresh()}
  $('studioLayout').onchange=e=>visual({layout:e.target.value});$('studioBroll').onchange=e=>visual({video:e.target.value||null});$('studioBrollIn').onchange=e=>visual({videoIn:Number(e.target.value)});
  $('studioLabels').onchange=e=>api.setSceneLabels(choose(),e.target.value.split('\n').filter(Boolean));
  $('brandBtn').onclick=()=>{api.pause();refresh();$('brandDialog').showModal()};$('brandClose').onclick=()=>$('brandDialog').close();
  $('brandCreator').oninput=e=>api.setBrand({creator:e.target.value});$('brandAccent').oninput=e=>api.setBrand({accent:e.target.value});$('brandMotion').oninput=e=>api.setBrand({motion_intensity:Number(e.target.value)/100});$('brandLayout').onchange=e=>api.setBrand({default_layout:e.target.value});
  $('brandSave').onclick=()=>file('brand.json',{format:'video-edit-brand',settings:brand()});
  $('brandLoad').onclick=()=>$('brandInput').click();$('brandInput').onchange=async e=>{
   try{const f=e.target.files[0];if(!f)return;if(f.size>100000)throw Error('Choose a brand file smaller than 100 KB.');const v=JSON.parse(await f.text());if(v.format!=='video-edit-brand'||v.settings?.version!==1)throw Error('Choose a saved brand file.');api.setBrand(v.settings);refresh()}catch(err){$('studioUsageNote').textContent=err.message}finally{e.target.value=''}
  };
  const usage=window.VIDEO_EDIT_USAGE;if(usage?.status==='measured'){$('studioTokens').textContent=usage.total_tokens.toLocaleString();$('studioUsageNote').textContent=`Input ${usage.input_tokens.toLocaleString()} · Output ${usage.output_tokens.toLocaleString()}`}
  let last=-1;function frame(){if(last!==choose()){last=choose();refresh()}requestAnimationFrame(frame)}
  window.addEventListener('codex:visuals',refresh);window.addEventListener('codex:duration',refresh);refresh();frame();
 }
 boot();
})();
