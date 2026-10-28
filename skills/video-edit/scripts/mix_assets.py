"""Place selected, credited sound files into the generated effects stem."""
import json
from pathlib import Path
import wave
import numpy as np
from common import executable, run


def duck_envelope(voice,rate,frames,duck_db):
    """10ms detector, 15ms attack / 180ms release. Changes the effects bus only."""
    step=max(1,round(rate*.01));floor=10**(-duck_db/20);levels=[];gain=1.
    for start in range(0,frames,step):
        block=voice[start:start+step];rms=float(np.sqrt(np.mean(block*block))) if len(block) else 0.
        activity=min(1.,max(0.,(rms-.004)/.012))
        target=1-(1-floor)*activity
        coefficient=1-np.exp(-.01/(.015 if target<gain else .18))
        gain+=coefficient*(target-gain);levels.append(gain)
    return np.interp(np.arange(frames),np.arange(len(levels))*step,levels)


def mix_assets(project,credits,content_duration=None,duck_db=0):
    project=Path(project)
    path=project/'assets/codex/effects.wav'
    with wave.open(str(path),'rb') as wav:
        rate=wav.getframerate();bus=np.frombuffer(wav.readframes(wav.getnframes()),dtype='<i2').reshape(-1,2).astype(np.float64)/32768
    limit=min(len(bus),round(content_duration*rate)) if content_duration is not None else len(bus)
    import subprocess
    for item in credits:
        # Decode a bounded short excerpt; the documented sound selection step chooses the useful transient.
        decoded=subprocess.run([executable('ffmpeg'),'-hide_banner','-loglevel','error','-i',str(project/item['file']),
                    '-t','10','-ar',str(rate),'-ac','2','-f','f32le','pipe:1'],capture_output=True,check=True).stdout
        sound=np.frombuffer(decoded,dtype='<f4').reshape(-1,2).astype(float)
        if not len(sound):raise ValueError('Downloaded sound decoded to an empty file.')
        sound-=sound.mean(axis=0);peak=float(np.max(np.abs(sound)))
        if peak>.001 and not item.get('pre_normalized'):sound*=.65/peak
        fade=min(round(rate*.006),len(sound)//2)
        if fade:sound[:fade]*=np.linspace(0,1,fade)[:,None];sound[-fade:]*=np.linspace(1,0,fade)[:,None]
        start=round(item['at']*rate)
        # A reveal's pre-roll can begin before t=0; trim that portion, never wrap into the tail.
        if start<0:
            sound=sound[-start:].copy();start=0
            head=min(len(sound),round(rate*.005))
            if head:sound[:head]*=np.linspace(0,1,head)[:,None]
        count=min(len(sound),limit-start)
        if count>0:
            excerpt=sound[:count].copy()
            if count<len(sound):
                tail=min(count,round(rate*.04))
                excerpt[-tail:]*=np.linspace(1,0,tail)[:,None]
            bus[start:start+count]+=excerpt*item['gain']
    if duck_db:
        camera=project/'media/camera-edited.mp4'
        decoded=subprocess.run([executable('ffmpeg'),'-v','error','-i',str(camera),'-vn','-ar',str(rate),'-ac','1','-f','f32le','pipe:1'],capture_output=True,check=True).stdout
        voice=np.frombuffer(decoded,dtype='<f4').astype(float)
        envelope=duck_envelope(voice,rate,len(bus),max(0,min(18,float(duck_db))))
        bus*=envelope[:,None]
        (project/'sfx-ducking-report.json').write_text(json.dumps({'source':'media/camera-edited.mp4','effects_only':True,'maximum_reduction_db':duck_db,'attack_ms':15,'release_ms':180,'minimum_gain':float(envelope.min()),'original_voice_modified':False},indent=2)+'\n')
    peak=float(np.max(np.abs(bus)))
    if peak>.9:bus*=.9/peak
    with wave.open(str(path),'wb') as wav:
        wav.setnchannels(2);wav.setsampwidth(2);wav.setframerate(rate);wav.writeframes((bus*32767).astype('<i2').tobytes())
