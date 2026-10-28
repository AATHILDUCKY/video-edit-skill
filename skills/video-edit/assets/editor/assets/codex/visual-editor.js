/* Scene visuals and timing. Editor controls are excluded from the canvas/export. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  function boot(){
    const api=window.codexShort;if(!api?.ready){requestAnimationFrame(boot);return}
    let selected=0,drag=null,previewEnd=null;
    const locked=()=>api.state.recording||api.state.startingExport;
    const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
    const current=()=>api.template.scenes[selected];
    const note=(message,error=false)=>{$('visualMessage').textContent=message;$('visualMessage').classList.toggle('error',error)};
    function mode(visuals){$('visualPane').hidden=!visuals;$('captionPane').hidden=visuals;$('visualMode').setAttribute('aria-selected',String(visuals));$('captionMode').setAttribute('aria-selected',String(!visuals))}
    function assign(id,value){if(document.activeElement!==$(id))$(id).value=value}
    function refresh(){
      const scenes=api.template.scenes,s=scenes[selected];if(!s)return;
      const v=s.visual||{};
      $('visualVideoAudio').checked=v.videoAudio!==false;$('visualVideoAudio').disabled=locked()||!v.video||s.kind==='brand-outro';
      assign('visualVideoVolume',Math.round((v.videoVolume??1)*100));$('visualVideoVolume').disabled=locked()||!v.video||s.kind==='brand-outro';
      const chooser=$('visualScene');if(chooser.options.length!==scenes.length){chooser.replaceChildren(...scenes.map((scene,i)=>new Option(`${i+1}. ${scene.title}`,String(i))))}
      scenes.forEach((scene,i)=>{chooser.options[i].textContent=`${i+1}. ${scene.title}`});chooser.value=String(selected);
      assign('visualTitle',s.title);assign('visualSubtitle',s.emphasis);assign('visualStart',s.start.toFixed(3));assign('visualEnd',s.end.toFixed(3));
      $('visualStartHere').disabled=locked()||selected===0;$('visualEndHere').disabled=locked()||selected===scenes.length-1;
      $('visualStart').disabled=locked()||selected===0;$('visualEnd').disabled=locked()||selected===scenes.length-1;
      const minimum=Math.min(.05,api.duration/(scenes.length*4));
      $('visualStart').min=selected?scenes[selected-1].start+minimum:0;$('visualStart').max=s.end-minimum;
      $('visualEnd').min=s.start+minimum;$('visualEnd').max=scenes[selected+1]?scenes[selected+1].end-minimum:api.duration;
      assign('visualPreset',v.preset||s.kind);assign('visualAccent',v.accent||api.template.accent);assign('visualScale',Math.round((v.scale||1)*100));assign('visualX',v.x||0);assign('visualY',v.y||0);
      $('visualLength').textContent=`${(s.end-s.start).toFixed(2)} seconds`;
      $('visualPhoto').hidden=!v.image;if(v.image&&$('visualPhoto').src!==v.image)$('visualPhoto').src=v.image;
      if(!v.image)$('visualPhoto').removeAttribute('src');$('visualRemoveImage').disabled=locked()||!v.image;
      $('sceneLane').querySelectorAll('.scene-clip').forEach((node,i)=>node.classList.toggle('is-visual-selected',i===selected));
    }
    function select(index,seek=true){
      if(locked())return;selected=clamp(Number(index)||0,0,api.template.scenes.length-1);mode(true);refresh();
      if(seek){$('visualPane').scrollTop=0;api.pause();const s=current();api.seek(s.start+Math.min((s.end-s.start)*.4,.5))}
      note('Drag visual blocks or their edges. Edit exact times here.');
    }
    $('visualPreset').replaceChildren(...api.visualPresets.map(p=>new Option(p.label,p.kind)));
    $('visualMode').onclick=()=>select(selected);$('captionMode').onclick=()=>mode(false);
    $('visualScene').onchange=e=>select(e.target.value);
    for(const [id,key] of [['visualTitle','title'],['visualSubtitle','emphasis']])$(id).oninput=()=>{try{api.setSceneText(selected,{[key]:$(id).value})}catch(e){note(e.message,true)}};
    async function edit(patch){try{await api.setSceneVisual(selected,patch);note('Visual saved. Use Save template to reuse it.')}catch(e){note(e.message,true)}refresh()}
    $('visualVideoAudio').onchange=e=>edit({videoAudio:e.target.checked});
    $('visualVideoVolume').oninput=e=>edit({videoVolume:Number(e.target.value)/100});
    $('visualPreset').onchange=e=>edit({preset:e.target.value,image:null});$('visualAccent').oninput=e=>edit({accent:e.target.value});
    $('visualScale').oninput=e=>edit({scale:Number(e.target.value)/100});$('visualX').oninput=e=>edit({x:Number(e.target.value)});$('visualY').oninput=e=>edit({y:Number(e.target.value)});
    function applyTimes(){try{api.setSceneTiming(selected,Number($('visualStart').value),Number($('visualEnd').value));note('Timing saved. Neighbouring visuals adjusted.')}catch(e){note(e.message,true)}refresh()}
    $('visualStart').onchange=applyTimes;$('visualEnd').onchange=applyTimes;
    $('visualStartHere').onclick=()=>{assign('visualStart',api.state.time.toFixed(3));applyTimes()};$('visualEndHere').onclick=()=>{assign('visualEnd',api.state.time.toFixed(3));applyTimes()};
    $('visualPreview').onclick=()=>{if(locked())return;const s=current();api.seek(s.start);previewEnd=s.end;api.play()};
    $('visualResetStyle').onclick=()=>edit({preset:current().kind,accent:null,scale:1,x:0,y:0,image:null});
    $('visualResetTimes').onclick=()=>{api.resetVisualTiming();refresh();note('Original timing proportions restored.')};
    $('visualSave').onclick=()=>$('saveTemplate').click();$('visualUpload').onclick=()=>$('visualImageFile').click();$('visualRemoveImage').onclick=()=>edit({image:null});
    $('visualImageFile').onchange=async e=>{
      const input=e.target,file=input.files[0],index=selected;if(!file||locked())return;
      try{
        if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw new Error('Choose a PNG, JPG, or WebP image.');
        if(file.size>15*1024*1024)throw new Error('Choose an image smaller than 15 MB.');
        note('Preparing your image…');
        const url=URL.createObjectURL(file);let image;
        try{image=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('Could not open that image.'));img.src=url})}finally{URL.revokeObjectURL(url)}
        const scale=Math.min(1,1600/Math.max(image.naturalWidth,image.naturalHeight)),canvas=document.createElement('canvas');canvas.width=Math.round(image.naturalWidth*scale);canvas.height=Math.round(image.naturalHeight*scale);canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
        await api.setSceneVisual(index,{image:canvas.toDataURL('image/webp',.85)});refresh();note('Image added. It is included in Save template and video export.');
      }catch(error){note(error.message,true)}finally{input.value=''}
    };
    // Capture on the stable lane so rebuilding blocks does not interrupt dragging.
    const lane=$('sceneLane');
    lane.addEventListener('pointerdown',e=>{
      const target=e.target.closest('[data-visual-index]');if(!target||locked()||e.button>0)return;
      e.preventDefault();e.stopPropagation();const index=Number(target.dataset.visualIndex);select(index,false);api.pause();
      const scenes=api.template.scenes,s=scenes[index],minimum=Math.min(.05,api.duration/(scenes.length*4));
      drag={index,mode:target.dataset.visualMode,id:e.pointerId,x:e.clientX,start:s.start,end:s.end,left:scenes[index-1]?scenes[index-1].start+minimum:0,right:scenes[index+1]?scenes[index+1].end-minimum:api.duration,minimum,width:lane.clientWidth,duration:api.duration,moved:false};
      lane.setPointerCapture(e.pointerId);document.body.classList.add('is-visual-dragging');
    });
    lane.addEventListener('pointermove',e=>{
      if(!drag||e.pointerId!==drag.id||locked())return;e.preventDefault();const d=drag;if(Math.abs(e.clientX-d.x)<3&&!d.moved)return;
      let delta=(e.clientX-d.x)/Math.max(1,d.width)*d.duration,start=d.start,end=d.end;
      if(d.mode==='start')start=clamp(d.start+delta,d.left,d.end-d.minimum);
      else if(d.mode==='end')end=clamp(d.end+delta,d.start+d.minimum,d.right);
      else{if(d.index===0||d.index===api.template.scenes.length-1)return;delta=clamp(delta,d.left-d.start,d.right-d.end);start+=delta;end+=delta}
      try{api.setSceneTiming(d.index,start,end);d.moved=true;refresh()}catch(error){note(error.message,true)}
    });
    const finish=e=>{if(!drag||drag.id!==e.pointerId)return;const d=drag;drag=null;document.body.classList.remove('is-visual-dragging');if(lane.hasPointerCapture(e.pointerId))lane.releasePointerCapture(e.pointerId);select(d.index);if(d.moved)note('Visual timing saved.')};
    lane.addEventListener('pointerup',finish);lane.addEventListener('pointercancel',finish);
    lane.addEventListener('keydown',e=>{
      const target=e.target.closest('[data-visual-index]');if(!target||locked())return;const index=Number(target.dataset.visualIndex);if(e.key==='Enter'||e.key===' '){e.preventDefault();select(index);return}
      if(!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();e.stopPropagation();select(index,false);const s=current(),delta=(e.key==='ArrowLeft'?-.05:.05)*(e.shiftKey?5:1);
      try{api.setSceneTiming(index,s.start+(target.dataset.visualMode!=='end'?delta:0),s.end+(target.dataset.visualMode!=='start'?delta:0));refresh()}catch(error){note(error.message,true)}
    });
    window.addEventListener('codex:visuals',refresh);window.addEventListener('codex:duration',()=>{previewEnd=null;drag=null;refresh()});
    function frame(){if(previewEnd!==null&&api.state.time>=previewEnd){const end=previewEnd;previewEnd=null;api.pause();api.seek(Math.max(0,end-.001))}requestAnimationFrame(frame)}
    window.codexVisualEditor={select,get selectedIndex(){return selected},get ready(){return true}};refresh();requestAnimationFrame(frame);
  }
  boot();
})();
