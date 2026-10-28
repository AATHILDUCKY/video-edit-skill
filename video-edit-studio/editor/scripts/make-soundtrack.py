"""Build scene-timed effects, a quiet rhythm bed, and recorded keyboard intervals."""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import wave
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
text=(ROOT/'assets/codex/template.js').read_text()
config=json.JSONDecoder().raw_decode(text.split('window.CODEX_SHORT_TEMPLATE =',1)[1].lstrip())[0]
scenes=config['scenes']; RATE=48000; duration=sum(s['duration'] for s in scenes)
if not 0 < duration <= 600: raise ValueError('Use a positive video duration up to 600 seconds for this in-memory renderer.')
rng=np.random.default_rng(742)
fx=np.zeros((round(RATE*duration),2),dtype=np.float32); bed=np.zeros_like(fx); keys=np.zeros_like(fx)

def add(bus,at,signal,gain=1,pan=0):
    offset=max(0,round(at*RATE)); n=min(len(signal),len(bus)-offset)
    if n<=0:return
    if signal.ndim==1:
        bus[offset:offset+n,0]+=signal[:n]*gain*np.sqrt((1-pan)/2)
        bus[offset:offset+n,1]+=signal[:n]*gain*np.sqrt((1+pan)/2)
    else:bus[offset:offset+n]+=signal[:n]*gain

def tone(hz,length=.2,decay=20):
    t=np.arange(round(length*RATE))/RATE
    return (np.sin(2*np.pi*hz*t)+.12*np.sin(4*np.pi*hz*t))*(1-np.exp(-t*800))*np.exp(-t*decay)

def effect(kind,at,gain=.25):
    if kind=='whoosh':
        t=np.arange(round(.18*RATE))/RATE; n=rng.normal(0,1,len(t)); n=np.convolve(n,np.ones(12)/12,mode='same')
        add(fx,at,n*np.sin(np.linspace(0,np.pi,len(t)))**1.7,gain)
    elif kind=='impact':
        t=np.arange(round(.25*RATE))/RATE
        add(fx,at,np.sin(2*np.pi*(55*t+1.4*(1-np.exp(-t*40))))*np.exp(-t*20),gain)
    elif kind in ['click','tick']:
        t=np.arange(round(.045*RATE))/RATE; n=rng.normal(0,1,len(t)); n-=np.roll(n,1)
        add(fx,at,n*np.exp(-t*190),gain*(.5 if kind=='tick' else 1))
    elif kind=='pop':add(fx,at,tone(330,.14,30),gain)
    elif kind=='ping':add(fx,at,tone(880,.35,12),gain)
    elif kind=='chime':
        for i,hz in enumerate([659.255,830.609,987.767]):add(fx,at+i*.065,tone(hz,.55,7),gain,(i-1)*.25)
    else:raise ValueError('Unknown sound effect: '+str(kind))

clock=0; windows=[]
for index,scene in enumerate(scenes):
    if scene['duration']<=0:raise ValueError('Scene durations must be positive.')
    events=scene.get('audio')
    if events is None:
        if index:effect('whoosh',max(0,clock-.10),.25)
        else:effect('impact',.015,.55)
    else:
        for event in events:
            if not 0<=event['at']<scene['duration']:raise ValueError('Sound event is outside its scene.')
            effect(event['type'],clock+event['at'],event.get('gain',.25))
    typing=scene.get('typing')
    if typing is None and scene['kind']=='prompt':
        ratio=scene['duration']/scene.get('motionDuration',scene['duration']);typing={'start':.26*ratio,'end':1.65*ratio}
    if typing:
        if not 0<=typing['start']<typing['end']<=scene['duration']:raise ValueError('Invalid typing interval.')
        windows.append({'start':clock+typing['start'],'end':clock+typing['end']})
    clock+=scene['duration']

if windows:
    raw=subprocess.check_output([os.environ.get('FFMPEG_PATH','ffmpeg'),'-hide_banner','-loglevel','error','-i',str(ROOT/'assets/codex/keyboard-source.ogg'),'-f','f32le','-ar',str(RATE),'-ac','2','pipe:1'])
    source=np.frombuffer(raw,dtype='<f4').reshape(-1,2).copy()[round(.2*RATE):]
    source-=np.mean(source,axis=0)
    for window in windows:
        count=round((window['end']-window['start'])*RATE)
        excerpt=np.tile(source,(int(np.ceil(count/len(source))),1))[:count].copy()
        fade=min(round(.007*RATE),count//2)
        if fade:excerpt[:fade]*=np.linspace(0,1,fade)[:,None];excerpt[-fade:]*=np.linspace(1,0,fade)[:,None]
        add(keys,window['start'],excerpt)

beat=.46875
for i in range(int(max(0,duration-1.2)/beat)):
    add(bed,i*beat,tone([130.813,164.814,195.998,164.814][i%4],.35,12),.2,np.sin(i)*.4)
    t=np.arange(round(.12*RATE))/RATE;add(bed,i*beat,np.sin(2*np.pi*48*t)*np.exp(-t*32),.35)

def write(name,bus,peak):
    fade=min(round(.03*RATE),len(bus)//2)
    bus[:fade]*=np.linspace(0,1,fade)[:,None];bus[-fade:]*=np.linspace(1,0,fade)[:,None]
    bus=np.tanh(bus);bus*=peak/max(.01,float(np.max(np.abs(bus))))
    with wave.open(str(ROOT/f'assets/codex/{name}.wav'),'wb') as wav:
        wav.setnchannels(2);wav.setsampwidth(2);wav.setframerate(RATE);wav.writeframes((bus*32767).astype('<i2').tobytes())
    print(f'Wrote {name}.wav: {duration:g}s')

write('effects',fx,.8);write('rhythm',bed,.65);write('keyboard',keys,.78)
first=windows[0] if windows else {'start':0,'end':0}
(ROOT/'assets/codex/keyboard-timing.json').write_text(json.dumps({**first,'windows':windows}))
plan=[{k:s.get(k) for k in ['kind','duration','motionDuration','typing','audio']} for s in scenes]
(ROOT/'assets/codex/audio-plan.json').write_text(json.dumps({'duration':duration,'signature':hashlib.sha256(json.dumps(plan,sort_keys=True).encode()).hexdigest()},indent=2)+'\n')
