/* Conservative composition margins, not a simulation of every Instagram/device UI. */
(() => {
  const BASE={preset:'instagram-reels',top:.15625,bottom:.354167,left:.074074,right:.12963};
  function clean(value={}) {
    const v={...BASE,...value};v.preset=v.preset==='free'?'free':'instagram-reels';
    for(const k of ['top','bottom','left','right'])v[k]=Number.isFinite(v[k])?Math.max(0,Math.min(k==='bottom'?.45:.3,v[k])):BASE[k];
    return v;
  }
  function bounds(value) {
    const v=clean(value),enabled=v.preset!=='free';
    const x=enabled?v.left*1080:24,y=enabled?v.top*1920:24;
    const right=enabled?1080*(1-v.right):1056,bottom=enabled?1920*(1-v.bottom):1896;
    return {enabled,x,y,right,bottom,width:right-x,height:bottom-y};
  }
  function stage(value,split) {
    const b=bounds(value),top=b.y+40,bottom=Math.min(split-12,b.bottom-150);
    const scale=Math.min(b.width/1080,Math.max(1,bottom-top)/960);
    return {x:b.x+(b.width-1080*scale)/2,y:top,scale,width:1080*scale,height:960*scale};
  }
  function maxSplitPercent(value) {
    const b=bounds(value);
    // Keep a usable lower caption section above the reserved platform footer.
    return b.enabled?Math.max(30,Math.min(70,Math.floor((b.bottom-240)/19.2))):70;
  }
  function captionRegion(value,split,layout) {
    const b=bounds(value);
    return {...b,y:Math.max(b.y,(layout==='split'?split:960)+24),bottom:b.bottom-24};
  }
  window.videoEditPlatform={clean,bounds,stage,maxSplitPercent,captionRegion};
})();
