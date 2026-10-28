#!/usr/bin/env python3
"""One-time, offline import of selected CC0 Kenney Interface Sounds; never run per edit."""
from pathlib import Path
import argparse, hashlib, json, subprocess, wave, zipfile
import numpy as np
from common import executable

ROOT=Path(__file__).resolve().parents[1]/'assets/sfx'
SELECTION=[
 ('tactile-click','click_001','Tactile click','A visible button press; one understated dry detail.',.40),
 ('tactile-tap','click_002','Tactile tap','A small card landing or cursor selection.',.42),
 ('tactile-press','click_003','Tactile press','A deliberate interface action; avoid repeating on every word.',.36),
 ('tactile-switch','switch_001','Tactile switch','A visible state change or new tool being selected.',.30),
 ('tactile-shift','switch_002','Tactile shift','A single panel handoff; leave quiet space after it.',.28),
 ('tactile-scroll','scroll_001','Tactile scroll','A short scrolling panel or gentle content move.',.26),
 ('tactile-glide','scroll_002','Tactile glide','A restrained visual slide or B-roll handoff.',.26),
 ('tactile-tick','tick_001','Tactile tick','A precise selection settling; lower it under consonants.',.28),
]

def build(archive):
    library=json.loads((ROOT/'catalog.json').read_text())
    originals=ROOT/'kenney-originals';originals.mkdir(exist_ok=True)
    items=[];montage=[]
    with zipfile.ZipFile(archive) as pack:
        (originals/'License.txt').write_bytes(pack.read('License.txt'))
        for identifier,source,title,use,gain in SELECTION:
            data=pack.read('Audio/'+source+'.ogg');raw=originals/(source+'.ogg');raw.write_bytes(data)
            decoded=subprocess.run([executable('ffmpeg'),'-v','error','-i',str(raw),'-af','highpass=f=110,lowpass=f=6500','-ar','48000','-ac','2','-f','f32le','pipe:1'],capture_output=True,check=True).stdout
            signal=np.frombuffer(decoded,dtype='<f4').reshape(-1,2).astype(float)
            signal-=signal.mean(axis=0);signal*=.45/max(1e-9,np.max(np.abs(signal)))
            fade=min(96,len(signal)//8);tail=min(720,len(signal)//8)
            signal[:fade]*=np.linspace(0,1,fade)[:,None];signal[-tail:]*=np.linspace(1,0,tail)[:,None]
            signal*=.45/max(1e-9,np.max(np.abs(signal)))
            packed=np.rint(signal*8388607).astype('<i4').reshape(-1).view(np.uint8).reshape(-1,4)[:,:3].tobytes()
            target=ROOT/(identifier+'.wav')
            with wave.open(str(target),'wb') as audio:
                audio.setnchannels(2);audio.setsampwidth(3);audio.setframerate(48000);audio.writeframes(packed)
            envelope=np.sqrt(np.mean(signal**2,axis=1));window=240
            # Align the loudest 5ms of the tactile transient with the visible action.
            anchor=int(np.argmax(np.convolve(envelope,np.ones(window)/window,mode='same')))/48000
            item=dict(id=identifier,title=title,category='Tactile',collection='fieldnotes-tactile',file=target.name,
                duration=round(len(signal)/48000,6),anchor_seconds=round(anchor,6),recommended_gain=gain,use=use,
                author='Kenney; Fieldnotes EQ/fades',license='CC0-1.0',source_url='https://kenney.nl/assets/interface-sounds',
                source_file='kenney-originals/'+raw.name,source_sha256=hashlib.sha256(data).hexdigest(),
                processing='Decoded Ogg working WAV, 110Hz high-pass / 6.5kHz low-pass, gentle edge fades, peak -6.94dBFS. 24-bit working format does not restore lossy source detail.',
                sha256=hashlib.sha256(target.read_bytes()).hexdigest(),peak_dbfs=round(20*np.log10(np.max(np.abs(signal))),2),
                rms_dbfs=round(20*np.log10(np.sqrt(np.mean(signal**2))),2),
                waveform=[round(float(np.max(np.abs(part)))/.45,4) for part in np.array_split(signal,34)])
            items.append(item);montage.extend([signal*.7,np.zeros((16800,2))])
    retained=[{**i,'collection':i.get('collection','fieldnotes-synth')} for i in library['assets'] if i['id'] not in {x['id'] for x in items}]
    library.update(version=2,name='Fieldnotes / Tactile + Signature SFX',default_collection='fieldnotes-tactile',
        provenance='8 curated Kenney CC0 derivatives with original Oggs/license; 18 original procedural CC0 effects retained for existing edits.',assets=items+retained)
    (ROOT/'catalog.json').write_text(json.dumps(library,ensure_ascii=False,indent=2)+'\n')
    (ROOT/'catalog.js').write_text('window.FIELDNOTES_SFX = '+json.dumps(library,ensure_ascii=False)+';\n')
    with wave.open(str(ROOT/'tactile-audition.wav'),'wb') as audio:
        audio.setnchannels(2);audio.setsampwidth(2);audio.setframerate(48000);audio.writeframes((np.concatenate(montage)*32767).astype('<i2').tobytes())
    subprocess.run([executable('ffmpeg'),'-y','-v','error','-i',str(ROOT/'tactile-audition.wav'),'-c:a','libmp3lame','-q:a','2',str(ROOT/'tactile-audition.mp3')],check=True)
    (ROOT/'tactile-audition.wav').unlink()
    print('Imported 8 credited tactile cues; retained 18 legacy cues.')

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('archive',type=Path);build(parser.parse_args().archive)
