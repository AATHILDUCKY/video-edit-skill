/* Add concept-specific scene renderers here. See references/template-api.md. */
(() => {
  'use strict';
  const COLORS={ink:'#171c22',muted:'#7b818c',soft:'#f3f5f8',line:'#e4e8ee',blue:'#a7c9ff',green:'#a7dfc3',white:'#ffffff'};
  let h,c,A;
  const E=(t,d=0,l=.4)=>h.enter(t,d,l),P=(t,d=0,l=1)=>h.clamp((t-d)/l);
  function stroke(points,color=COLORS.ink,width=6){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke()}
  function circle(x,y,r,fill,outline,width=4){c.beginPath();c.arc(x,y,r,0,Math.PI*2);if(fill){c.fillStyle=fill;c.fill()}if(outline){c.lineWidth=width;c.strokeStyle=outline;c.stroke()}}
  function box(x,y,w,z,color=COLORS.soft,r=20){h.box(x,y,w,z,color,r)}
  function text(s,x,y,size=32,color=COLORS.ink,weight=800,align='center',max=960,mono=false){h.txt(s,x,y,size,color,weight,align,max,mono)}
  function fade(p,fn){c.save();c.globalAlpha*=h.clamp(p);fn();c.restore()}
  function move(t,x,y,fn,delay=.05){const p=E(t,delay);c.save();c.translate(x,y+45*(1-p));c.globalAlpha*=p;fn();c.restore()}
  function panel(x,y,w,z,dark=false){c.save();c.shadowColor='#18213012';c.shadowBlur=32;c.shadowOffsetY=12;box(x,y,w,z,dark?COLORS.ink:COLORS.white,24);c.restore();if(!dark){c.strokeStyle=COLORS.line;c.lineWidth=2;c.beginPath();c.roundRect(x,y,w,z,24);c.stroke()}}
  function chrome(x,y,w,title,dark=false){box(x,y,w,58,dark?'#252b35':'#edf0f5',20);box(x,y+30,w,28,dark?'#252b35':'#edf0f5',0);[A,COLORS.blue,COLORS.green].forEach((col,i)=>circle(x+30+i*24,y+28,6,col));text(title,x+w/2,y+37,21,dark?'#b5bdc9':COLORS.muted,500)}
  function heading(s,t){if(h.visualPass==='art')return;h.reveal(s.title,540,172,s.title.length>17?82:100,t,COLORS.ink,.01,960);if(s.emphasis)h.reveal(s.emphasis,540,281,104,t,A,.08,950)}
  function shield(x,y,size,progress=1){c.save();c.translate(x,y);c.scale(size/240,size/240);c.beginPath();c.moveTo(0,-125);c.bezierCurveTo(48,-101,90,-95,106,-95);c.lineTo(106,-13);c.bezierCurveTo(104,66,63,109,0,140);c.bezierCurveTo(-63,109,-104,66,-106,-13);c.lineTo(-106,-95);c.bezierCurveTo(-90,-95,-48,-101,0,-125);c.closePath();c.fillStyle=COLORS.ink;c.fill();c.save();c.globalAlpha=progress;stroke([[-45,9],[-10,43],[53,-31]],COLORS.white,13);c.restore();c.restore()}
  function chip(x,y,s,color=A){c.save();c.translate(x,y);c.scale(s/100,s/100);box(-38,-38,76,76,color,14);for(let i=0;i<4;i++){let p=-26+i*17;stroke([[p,-49],[p,-39]],COLORS.ink,5);stroke([[p,39],[p,49]],COLORS.ink,5);stroke([[-49,p],[-39,p]],COLORS.ink,5);stroke([[39,p],[49,p]],COLORS.ink,5)}box(-21,-21,42,42,COLORS.ink,7);c.restore()}
  function glyph(kind,x,y,size=70,color=COLORS.ink){
    if(kind==='shield'){shield(x,y,size);return}
    if(kind==='chip'){chip(x,y,size,color);return}
    if(kind==='search'){circle(x-8,y-8,size*.27,null,color,6);stroke([[x+size*.13,y+size*.13],[x+size*.37,y+size*.37]],color,7);return}
    h.icon(kind,x,y,size,color,1.8);
  }
  function tag(textValue,x,y,w,icon,t,delay=0,color=COLORS.white){move(t,x,y,()=>{panel(-w/2,-55,w,110);glyph(icon,-w/2+52,0,45,A);text(textValue,20,12,30,COLORS.ink,800,'center',w-100)},delay)}
  function intro(s,t){
    heading(s,t);const nodes=[['Build',292,445,270,'code'],['Secure',765,445,290,'shield'],['Create',540,610,300,'film'],['Connect',290,775,310,'chip'],['Explore',780,775,290,'search']];
    fade(E(t,.13),()=>{stroke([[292,445],[540,610],[765,445]],COLORS.line,3);stroke([[290,775],[540,610],[780,775]],COLORS.line,3)});
    nodes.forEach(([name,x,y,w,ic],i)=>tag(name,x,y,w,ic,t,.15+i*.06));
  }
  function cyber(s,t){
    heading(s,t);const p=E(t,.05);move(t,540,548,()=>shield(0,0,260,E(t,.5)));
    [[160,380],[900,380],[160,705],[900,705]].forEach(([x,y],i)=>{stroke([[x,y],[x<540?340:740,y],[x<540?405:675,548]],COLORS.line,5);let q=P(t,.15+i*.08,.8);let xx=h.mix(x,x<540?405:675,q),yy=h.mix(y,548,q);circle(xx,yy,13,i%2?COLORS.blue:A);circle(x,y,22,COLORS.white,COLORS.line,3)});
    fade(E(t,.55),()=>{box(371,748,338,64,'#edf7f1',32);text('Protect what matters.',540,790,27,'#3f765b',500)});
  }
  function pentest(s,t){
    heading(s,t);move(t,0,0,()=>{panel(85,300,910,510,true);chrome(85,300,910,'local test environment',true);
      const str='inspect local-demo';const shown=str.slice(0,Math.floor(h.typingProgress(s,t)*str.length));
      text('› '+shown,135,433,34,COLORS.green,500,'left',800,true);
      if(t<1.25)box(135+c.measureText('› '+shown).width+12,403,15,34,A,1);
      ['Define scope','Inspect the app','Find → fix → verify'].forEach((label,i)=>{const p=E(t,.74+i*.17,.3);fade(p,()=>{h.icon('check',154,514+i*83,27,COLORS.green,2);text(label,192,526+i*83,33,'#dce4ef',500,'left')})});
      fade(E(t,1.35),()=>{box(759,713,181,48,A,24);text('Your own lab',849,746,22,COLORS.white,800)});
    });
  }
  function web(s,t){
    heading(s,t);const p=E(t,.2,.65);
    move(t,0,0,()=>{panel(70,318,465,471,true);chrome(70,318,465,'build.html',true);
      const lines=['<main>','  <h1>Hello.</h1>','  <button>Build</button>','</main>'];const amount=h.typingProgress(s,t)*lines.join('').length;let count=0;
      lines.forEach((str,i)=>{const shown=str.slice(0,Math.max(0,Math.floor(amount-count)));count+=str.length;text(shown,99,446+i*72,24,i===0||i===3?A:'#e7ecf5',500,'left',410,true)});
    });
    move(t,0,0,()=>{panel(573,318,437,471);chrome(573,318,437,'live preview');circle(622,429,9,A);box(929,423,34,5,COLORS.ink,2);
      fade(E(t,.62),()=>{text('Hello.',792,556,81);text('An idea, now online.',792,610,23,COLORS.muted,500);box(655,658,270,66,A,33);text('Build something',790,703,24,COLORS.white)});
    },.13);
    fade(E(t,.8),()=>h.thinArrow(510,827,652,827,p,A,5));
  }
  function vibe(s,t){
    heading(s,t);move(t,0,0,()=>{panel(85,291,910,167);glyph('terminal',142,342,41,A);
      const prompt='Build a clean portfolio.';
      const shown=prompt.slice(0,Math.floor(h.typingProgress(s,t)*prompt.length));
      text(shown,184,355,34,COLORS.ink,500,'left',750);
      const p=E(t,1.08,.4);box(116,403,848,9,COLORS.soft,5);box(116,403,848*p,9,A,5);
    });
    move(t,0,0,()=>{panel(85,500,910,324);chrome(85,500,910,'live build');
      fade(E(t,1.18,.4),()=>{circle(201,641,39,A);text('Your next project.',551,646,54);text('Made from an idea.',551,697,29,COLORS.muted,500);box(369,738,366,49,COLORS.ink,24);text('Make it yours',552,772,25,COLORS.white)});
    },.14);
  }
  function content(s,t){
    heading(s,t);move(t,0,0,()=>{panel(110,279,860,300);box(127,296,826,266,COLORS.ink,17);
      const p=E(t,.16);box(369,336,341,177,A,20);circle(540,424,48,COLORS.white);h.icon('play',544,424,39,COLORS.ink,2);text('IDEA → STORY',540,543,21,'#a2afc0',500);
      panel(110,609,860,228);[0,1,2].forEach(i=>{box(139+i*260,659,245,67,[A,COLORS.blue,COLORS.green][i],11);for(let k=0;k<8;k++)box(154+i*260+k*27,671,18,42,'#ffffff45',3)});
      for(let k=0;k<39;k++){const z=10+Math.abs(Math.sin(k*2.7))*29;box(143+k*20,775-z/2,8,z,'#bac6d8',4)}
      const x=h.mix(145,920,P(t,.28,1.43));box(x,637,4,174,COLORS.ink,2);circle(x+2,638,9,COLORS.ink);
    });
  }
  function iot(s,t){
    heading(s,t);const nodes=[[250,350,'chip','Sensor'],[824,350,'sound','Speaker'],[250,760,'sliders','Home'],[824,760,'image','Display']];
    nodes.forEach(([x,y,ic,name],i)=>{
      const p=E(t,.08+i*.055);stroke([[540,550],[x,550],[x,y]],COLORS.line,6);
      const q=P(t,.10+i*.055,.72),sx=540,sy=550;circle(h.mix(sx,x,q),h.mix(sy,y,q),10,i%2?COLORS.blue:A);
      move(t,x,y,()=>{panel(-76,-62,152,124);glyph(ic,0,-3,59,A);text(name,0,100,26,COLORS.muted,500)},.06+i*.04);
    });move(t,540,550,()=>{circle(0,0,102,COLORS.ink);glyph('chip',0,0,94,COLORS.blue)});
  }
  function arduino(s,t){
    heading(s,t);move(t,0,0,()=>{
      c.save();c.translate(540,554);c.rotate(-.045);panel(-346,-224,692,450);box(-329,-207,658,416,'#087f91',29);
      [[-290,-169],[290,-169],[-290,169],[290,169]].forEach(([x,y])=>circle(x,y,10,null,'#8dc6c9',4));
      box(-355,-123,106,103,'#d9e2e7',9);box(-355,40,85,88,COLORS.ink,8);
      for(let k=0;k<13;k++){box(-235+k*39,-183,27,43,'#172f37',4);box(-235+k*39,146,27,43,'#172f37',4)}
      const p=E(t,.1,.8);for(let k=0;k<5;k++){stroke([[-210+k*47,-136],[-210+k*47,-51],[-105+k*33,-51]],'#5ab0b7',4);stroke([[55+k*34,48],[55+k*34,110],[214,110]],'#5ab0b7',4)}
      box(-110,-42,285,94,'#17313a',8);for(let k=0;k<11;k++){box(-100+k*25,-52,10,12,'#a3b5b3',2);box(-100+k*25,51,10,12,'#a3b5b3',2)}
      text('Arduino',17,-100,46,'#ffffff',800);text('Build. Connect. Repeat.',14,122,23,'#b9e9eb',500);
      const led=E(t,.4,.25);circle(245,-70,13,'#1b5960');fade(led,()=>{c.shadowColor='#c7ee80';c.shadowBlur=25;circle(245,-70,9,'#d8fc9e')});c.restore();
    });
  }
  function agents(s,t){
    heading(s,t);const xs=[204,540,876];const names=['Your task','Tools','Result'];
    xs.forEach((x,i)=>move(t,x,489,()=>{panel(-125,-115,250,250,i===1);glyph(['file','chip','check'][i],0,-26,75,i===1?COLORS.blue:A);text(names[i],0,87,31,i===1?COLORS.white:COLORS.ink)},.06+i*.12));
    [0,1].forEach(i=>{const p=E(t,.4+i*.45,.5);h.thinArrow(xs[i]+140,489,xs[i+1]-140,489,p,A,4)});
    fade(E(t,.8),()=>{box(253,727,574,80,COLORS.soft,40);text('Plan → act → check',540,781,36,COLORS.ink,500)});
  }
  function printer(s,t){
    heading(s,t);move(t,0,0,()=>{
      box(212,741,656,81,COLORS.ink,22);box(250,306,24,437,'#b8c4d0',9);box(806,306,24,437,'#b8c4d0',9);box(235,299,610,30,COLORS.ink,9);box(323,700,434,23,'#abb9c9',5);
      const amount=P(t,.15,1.55),layers=Math.floor(amount*15);
      for(let i=0;i<layers;i++){const y=689-i*15;c.beginPath();c.moveTo(446,y);c.lineTo(540,y-43);c.lineTo(636,y);c.lineTo(540,y+43);c.closePath();c.fillStyle=i%2?A:'#e09a81';c.fill();stroke([[446,y],[540,y+43],[636,y]],'#c66c53',2)}
      const nozzleY=654-layers*15,nozzleX=540+Math.sin(t*18)*74*(1-amount*.45);
      box(267,nozzleY-110,550,19,'#8c9dad',5);box(nozzleX-38,nozzleY-128,76,85,COLORS.ink,10);
      c.beginPath();c.moveTo(nozzleX-19,nozzleY-43);c.lineTo(nozzleX+19,nozzleY-43);c.lineTo(nozzleX,nozzleY-17);c.closePath();c.fillStyle=A;c.fill();
    });
  }
  function opensource(s,t){
    heading(s,t);move(t,0,0,()=>{panel(145,370,790,245,true);glyph('code',238,447,60,COLORS.blue);
      text('open-source / toolbox',302,459,36,COLORS.white,800,'left',570);
      text('Discover. Tinker. Make it yours.',540,554,32,'#b7c3d4',500);
    });
    const xs=[245,540,835];
    xs.forEach((x,i)=>{
      fade(E(t,.40+i*.13),()=>stroke([[540,615],[540,660],[x,660],[x,712]],COLORS.line,5));
      const p=P(t,.40+i*.13,.6);circle(h.mix(540,x,p),h.mix(624,712,p),8,A);
      move(t,x,776,()=>{panel(-125,-58,250,116);glyph(['search','code','sliders'][i],-75,-2,39,A);text(['Discover','Adapt','Build'][i],22,12,30)},.55+i*.12);
    });
  }
  function follow(s,t){
    heading(s,t);move(t,540,459,()=>{circle(0,0,91,COLORS.ink);text('d.',0,31,101,COLORS.white);circle(64,61,10,A)});
    const handle=window.codexShort?.template?.creator||'@yourname';
    fade(E(t,.12),()=>text(handle,540,624,61));
    const done=P(t,1.85,.22),p=E(t,.18);let press=1-.04*Math.sin(P(t,1.85,.22)*Math.PI);
    c.save();c.translate(540,756+25*(1-p));c.scale(press,press);c.globalAlpha=p;box(-245,-64,490,128,done>.6?A:COLORS.ink,64);
    if(done>.6){h.icon('check',-145,0,36,COLORS.white,2.4);text('Following',29,16,42,COLORS.white)}else{text('Follow',25,16,46,COLORS.white);stroke([[-124,-13],[-124,13]],COLORS.white,4);stroke([[-137,0],[-111,0]],COLORS.white,4)}c.restore();
    const travel=E(t,1,.80),leave=P(t,2.40,.35);
    fade(E(t,1,.15)*(1-leave),()=>h.icon('cursor',h.mix(892,699,travel)+leave*40,h.mix(892,786,travel)+leave*25,75,COLORS.ink,1.5));
    if(t>=1.85&&t<2.25){const q=P(t,1.85,.40);fade(1-q,()=>circle(699,772,16+q*65,null,A,3))}
  }
  const scenes={cybersecurity:cyber,pentesting:pentest,webdevelopment:web,contentcreation:content,iot,arduino,aiagents:agents,vibecoding:vibe,printing:printer,opensource,'follow-tech':follow};
  window.CONCEPT_VIDEO_SCENES=Object.fromEntries(Object.entries(scenes).map(([name,fn])=>[name,(scene,t,tools)=>{h=tools;c=h.ctx;A=h.accent;c.lineJoin='round';h.bg('#ffffff');fn(scene,t)}]));
})();
