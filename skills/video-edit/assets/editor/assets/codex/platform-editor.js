/* Preview guides are DOM only: never included in capture/export. */
(() => {
  function boot(){
    const api=window.codexShort;if(!api?.ready){requestAnimationFrame(boot);return}
    const panel=document.createElement('div');panel.className='platform-settings';
    panel.innerHTML='<strong>Instagram composition</strong><select id="platformPreset" aria-label="Platform composition"><option value="instagram-reels">Reels · protect graphics and captions</option><option value="free">Full frame · no platform margins</option></select><label>Show phone / Reels guides<input id="showPlatformGuides" type="checkbox"></label><label>Top reserve %<input id="platformTop" type="number" min="0" max="30" step="1"></label><label>Bottom reserve %<input id="platformBottom" type="number" min="0" max="45" step="1"></label><p>Guides approximate the phone header, right controls and collapsed description. Expanded descriptions and device layouts vary. Guides stay out of exports. Captions stay in the bottom section above the footer. The motion-height limit keeps that section available; reposition the speaker when changing the split.</p>';
    document.getElementById('panel-footage').prepend(panel);
    const $=id=>document.getElementById(id),guides=$('platformGuides');
    function refresh(){const s=api.template.safeArea;const b=api.safeBounds;$('platformPreset').value=s.preset;$('platformTop').value=Math.round(s.top*100);$('platformBottom').value=Math.round(s.bottom*100);for(const side of ['top','bottom','left','right'])guides.style.setProperty('--safe-'+side,s[side]*100+'%');guides.hidden=!$('showPlatformGuides').checked||!b.enabled}
    function update(patch){api.setSafeArea({...api.template.safeArea,...patch});refresh()}
    $('platformPreset').onchange=e=>update({preset:e.target.value});$('showPlatformGuides').onchange=refresh;
    $('platformTop').onchange=e=>update({top:Number(e.target.value)/100});$('platformBottom').onchange=e=>update({bottom:Number(e.target.value)/100});
    for(const event of ['codex:platform','codex:duration','codex:captions'])window.addEventListener(event,refresh);refresh();
  }
  boot();
})();
