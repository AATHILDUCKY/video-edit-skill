/* Reusable, deterministic motion vocabulary. Content comes from the current recording. */
(() => {
  const ink='#15201c',paper='#F4F6F1',muted='#78847a';
  const ease=(t,h,delay=0)=>h.enter(t,delay,.48/(window.codexShort?.template.motionIntensity||.8));
  function heading(s,t,h){
    if(h.visualPass==='art')return;
    const c=h.ctx;c.font='800 78px Manrope, "Noto Sans Tamil"';let rows=[''];
    for(const w of s.title.split(/\s+/)){const i=rows.length-1,n=(rows[i]+' '+w).trim();if(c.measureText(n).width>900&&rows[i])rows.push(w);else rows[i]=n}
    rows.slice(0,3).forEach((r,i)=>h.reveal(r,540,135+i*91,rows.length>2?61:78,t,ink,i*.07,930));
    if(s.emphasis)h.reveal(s.emphasis,540,327,32,t,muted,.16,930);
  }
  function keyword(s,t,h){
    const p=ease(t,h,.1);h.box(90,425+50*(1-p),900,245,ink,32);
    h.txt(s.labels?.[0]||s.title,540,574,75,'#fff',800,'center',810);
    if(s.labels?.[1])h.reveal(s.labels[1],540,794,36,t,h.accent,.5,890);
    h.box(105,425,48+750*p,5,h.accent,2);
  }
  function process(s,t,h){
    const labels=(s.labels||[]).slice(0,3),n=labels.length||1,w=250,gap=75,left=(1080-n*w-(n-1)*gap)/2;
    labels.forEach((label,i)=>{const p=ease(t,h,i*.22),x=left+i*(w+gap);h.box(x,443+40*(1-p),w,240,ink,28);h.txt(label,x+w/2,575,40,'#fff',800,'center',w-28);if(i<n-1)h.thinArrow(x+w+14,563,x+w+gap-14,563,ease(t,h,.4+i*.22),h.accent,4)})
  }
  function compare(s,t,h){
    (s.labels||[]).slice(0,2).forEach((label,i)=>{const p=ease(t,h,.2*i),x=75+i*480;h.box(x,420+35*(1-p),450,340,i?ink:'#e5eadd',30);h.txt(label,x+225,604,48,i?'#fff':ink,800,'center',390);if(i)h.box(x+28,447,70,6,h.accent,3)})
  }
  function chrome(h,t,label){
    h.box(65,402,950,430,ink,26);h.box(65,402,950,64,'#26352e',26);
    [0,1,2].forEach(i=>h.box(93+i*25,427,12,12,i===0?'#ff947b':i===1?'#ebd386':h.accent,6));
    h.txt(label,540,444,23,'#afc2b1',500,'center',650);
  }
  function terminal(s,t,h){
    chrome(h,t,'CONCEPT / TERMINAL');const lines=(s.labels||[]).slice(0,4);
    lines.forEach((text,i)=>{const p=ease(t,h,.2+i*.34);h.txt((i?'  ':'› ')+text.slice(0,Math.floor(text.length*p)),105,524+i*72,31,i?'#c2d1c7':h.accent,500,'left',865)});
    h.box(100,793,10+860*ease(t,h,.35),3,h.accent,1);
  }
  function browser(s,t,h){
    chrome(h,t,'CONCEPT / INTERFACE');const p=ease(t,h,.12);
    h.box(94,492,180,304,'#24382e',15);[0,1,2,3].forEach(i=>h.box(115,515+i*51,125-(i%2)*25,10,i?'#496554':h.accent,5));
    h.txt(s.labels?.[0]||s.title,314,545,33,'#fff',800,'left',635);
    [1,2,3].forEach((i)=>{const q=ease(t,h,.15+i*.16);h.box(314,583+(i-1)*57,645*q,41,'#354d3e',10);if(s.labels?.[i])h.txt(s.labels[i],331,611+(i-1)*57,23,'#d9e6dc',500,'left',601)});
    h.box(755,757,199*p,44,h.accent,12);h.txt('→',855,789,30,ink);
  }
  function stack(s,t,h){
    (s.labels||[]).slice(0,3).forEach((label,i)=>{const p=ease(t,h,i*.16),y=421+i*121;h.box(125+18*i+80*(1-p),y,810-36*i,103,i===2?ink:'#e5eadd',20);h.txt(label,540,y+67,38,i===2?'#fff':ink,800,'center',705)})
  }
  function quote(s,t,h){
    h.txt('“',140,520,200,h.accent,800);h.box(91,555,5,200,h.accent,2);
    h.reveal(s.labels?.[0]||s.title,556,619,66,t,ink,.13,822);
    if(s.labels?.[1])h.reveal(s.labels[1],540,795,31,t,muted,.35,850);
  }
  function timeline(s,t,h){
    const labels=(s.labels||[]).slice(0,3);
    labels.forEach((label,i)=>{const y=442+i*130,p=ease(t,h,i*.22);h.box(120,y,18,18,h.accent,9);if(i<2)h.box(127,y+23,3,99*p,'#bac9b5',1);h.reveal(label,578,y+23,39,t,ink,i*.22,790)})
  }
  const presets={keyword,process,compare,terminal,browser,stack,quote,timeline};
  window.CONCEPT_VIDEO_SCENES=Object.fromEntries(Object.entries(presets).map(([key,fn])=>[key,(s,t,h)=>{if(h.visualPass!=='art')h.bg(paper);heading(s,t,h);fn(s,t,h)}]));
  for(const base of window.CODEX_SHORT_TEMPLATE.scenes){if(!window.CONCEPT_VIDEO_SCENES[base.kind])window.CONCEPT_VIDEO_SCENES[base.kind]=(s,t,h)=>{if(h.visualPass!=='art')h.bg(paper);heading(s,t,h);(presets[base.preset]||keyword)(s,t,h)}}
})();
