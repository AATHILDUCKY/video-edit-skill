/* Appearance editing is shared by the canvas, saved template and video export. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  function boot(){
    const api=window.codexShort;if(!api?.ready||!window.codexCaptionEditor?.ready){requestAnimationFrame(boot);return}
    let moving=false,drag=null,previous='',editing=false;
    const overlay=$('captionTransform');
    const locked=()=>api.state.recording||api.state.startingExport;
    const selected=()=>window.codexCaptionEditor.selectedId;
    const target=()=>$('captionStyleScope').value==='selected'?selected():null;
    function begin(){if(editing||locked())return;editing=true;window.dispatchEvent(new CustomEvent('codex:caption-style-start'))}
    function end(){if(!editing)return;editing=false;window.dispatchEvent(new CustomEvent('codex:caption-style-end'))}
    function apply(patch,finish=false){
      if(locked())return;begin();api.pause();api.setCaptionStyle(patch,target());if(finish)end();refresh();
    }
    function assign(id,value){if(document.activeElement!==$(id))$(id).value=value}
    function refresh(){
      const id=target(),style=api.getCaptionStyle(id),noSelection=$('captionStyleScope').value==='selected'&&!id;
      assign('captionFontSize',style.fontSize);assign('captionPositionX',Math.round(style.x*100));
      const region=api.captionRegion,height=Math.min(api.captionBounds?.height??style.fontSize*1.8,region.bottom-region.y);
      const low=(region.y+height/2)/1920,high=(region.bottom-height/2)/1920;
      $('captionPositionY').min=low*100;$('captionPositionY').max=high*100;$('captionPositionY').step='.1';
      const effectiveY=api.captionBounds?.centreY/1920||(style.y===null?high:Math.max(low,Math.min(high,style.y)));
      assign('captionPositionY',effectiveY*100);assign('captionMaxWidth',Math.round(style.maxWidth*100));
      assign('captionTheme',style.theme);assign('captionTextColor',style.textColor);assign('captionBackgroundColor',style.backgroundColor);assign('captionBackgroundOpacity',Math.round(style.backgroundOpacity*100));
      $('captionFontSizeValue').textContent=`${Math.round(style.fontSize)} px`;
      for(const element of $('captionAppearance').querySelectorAll('input,select,button'))element.disabled=locked()||noSelection;
      $('captionStyleScope').disabled=locked();$('captionMovePreview').setAttribute('aria-pressed',String(moving));
      $('captionMovePreview').textContent=moving?'Done moving / resizing':'Move / resize in preview';
    }
    const ranges=[['captionFontSize','fontSize',1],['captionPositionX','x',.01],['captionPositionY','y',.01],['captionMaxWidth','maxWidth',.01],['captionBackgroundOpacity','backgroundOpacity',.01]];
    for(const [id,key,scale] of ranges){$(id).oninput=e=>apply({[key]:Number(e.target.value)*scale});$(id).onchange=end;$(id).onblur=end}
    for(const [id,key] of [['captionTextColor','textColor'],['captionBackgroundColor','backgroundColor']]){$(id).oninput=e=>apply({[key]:e.target.value});$(id).onchange=end;$(id).onblur=end}
    $('captionTheme').onchange=e=>apply({theme:e.target.value},true);
    $('captionStyleScope').onchange=()=>{end();previous='';refresh()};
    document.querySelectorAll('[data-caption-position]').forEach(button=>button.onclick=()=>{
      const position=button.dataset.captionPosition;
      const region=api.captionRegion,height=Math.min(api.captionBounds?.height??api.getCaptionStyle(target()).fontSize*1.8,region.bottom-region.y);
      const y=position==='top'?region.y+height/2:position==='middle'?(region.y+region.bottom)/2:region.bottom-height/2;
      apply({x:.5,y:position==='auto'?null:y/1920},true);
    });
    $('captionResetAppearance').onclick=()=>{begin();api.resetCaptionStyle(target());end();refresh()};
    $('captionMovePreview').onclick=()=>{
      if(locked())return;moving=!moving;api.pause();
      if(moving){const cue=api.captions.find(cue=>cue.id===selected());if(cue)api.seek(cue.start+Math.min((cue.end-cue.start)*.35,.3))}
      refresh();updateOverlay();
    };
    function selectVisible(){const id=api.captionBounds?.id;if($('captionStyleScope').value==='selected'&&id&&id!==selected()){window.codexCaptionEditor.select(id,false);refresh()}}
    function updateOverlay(){
      const bounds=api.captionBounds,show=moving&&!locked()&&!api.state.playing&&!$('captionPane').hidden&&api.captionVisibility&&bounds;
      overlay.hidden=!show;if(!show)return;
      overlay.style.left=`${bounds.x/1080*100}%`;overlay.style.top=`${bounds.y/1920*100}%`;
      overlay.style.width=`${bounds.width/1080*100}%`;overlay.style.height=`${bounds.height/1920*100}%`;
    }
    overlay.addEventListener('pointerdown',e=>{
      if(locked()||e.button>0||!api.captionBounds)return;e.preventDefault();e.stopPropagation();
      api.pause();selectVisible();begin();const b=api.captionBounds,rect=$('reelCanvas').getBoundingClientRect();
      drag={id:e.pointerId,mode:e.target.closest('#captionResizeHandle')?'resize':'move',x:e.clientX,y:e.clientY,bounds:b,rect,font:api.getCaptionStyle(target()).fontSize};
      overlay.setPointerCapture(e.pointerId);overlay.focus({preventScroll:true});document.body.classList.add('is-caption-positioning');
    });
    overlay.addEventListener('pointermove',e=>{
      if(!drag||drag.id!==e.pointerId||locked())return;e.preventDefault();e.stopPropagation();
      const dx=(e.clientX-drag.x)*1080/drag.rect.width,dy=(e.clientY-drag.y)*1920/drag.rect.height;
      if(drag.mode==='move')apply({x:(drag.bounds.centreX+dx)/1080,y:(drag.bounds.centreY+dy)/1920});
      else{const amount=(dx*drag.bounds.width+dy*drag.bounds.height)/(drag.bounds.width**2+drag.bounds.height**2);apply({fontSize:drag.font*(1+amount)})}
      updateOverlay();
    });
    const finish=e=>{if(!drag||drag.id!==e.pointerId)return;drag=null;document.body.classList.remove('is-caption-positioning');if(overlay.hasPointerCapture(e.pointerId))overlay.releasePointerCapture(e.pointerId);end()};
    for(const event of ['pointerup','pointercancel','lostpointercapture'])overlay.addEventListener(event,finish);
    overlay.addEventListener('dblclick',e=>e.stopPropagation());
    overlay.addEventListener('keydown',e=>{
      if(locked()||!api.captionBounds||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Home','Escape'].includes(e.key))return;
      e.preventDefault();e.stopPropagation();selectVisible();const bounds=api.captionBounds,size=api.getCaptionStyle(target()).fontSize,step=e.shiftKey?20:4;
      if(e.key==='Escape'){moving=false;refresh();updateOverlay();return}
      if(e.key==='Home')apply({x:.5,y:null},true);
      else if(['+','=','-'].includes(e.key))apply({fontSize:size+(e.key==='-'?-1:1)*(e.shiftKey?10:2)},true);
      else apply({x:(bounds.centreX+(e.key==='ArrowLeft'?-step:e.key==='ArrowRight'?step:0))/1080,y:(bounds.centreY+(e.key==='ArrowUp'?-step:e.key==='ArrowDown'?step:0))/1920},true);
    });
    for(const name of ['codex:caption-style','codex:captions','codex:duration','codex:platform'])window.addEventListener(name,()=>{previous='';refresh();updateOverlay()});
    function frame(){const region=api.captionRegion,key=`${selected()}|${locked()}|${region.y}|${region.bottom}|${api.captionBounds?.id}`;if(key!==previous){previous=key;refresh()}updateOverlay();requestAnimationFrame(frame)}
    window.codexCaptionStyleEditor={get ready(){return true},get moving(){return moving}};refresh();requestAnimationFrame(frame);
  }
  boot();
})();
