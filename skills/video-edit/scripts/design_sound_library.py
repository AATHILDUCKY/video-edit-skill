#!/usr/bin/env python3
"""Build the original Fieldnotes SFX collection once; edits reuse the rendered WAV assets."""
from pathlib import Path
import hashlib
import json
import wave
import numpy as np

ROOT=Path(__file__).resolve().parents[1]/'assets/sfx'
RATE=48000

def noise(duration,seed,low=120,high=9000):
    n=round(duration*RATE);rng=np.random.default_rng(seed)
    frequencies=np.fft.rfftfreq(n,1/RATE)
    spectrum=np.fft.rfft(rng.normal(size=n))
    shape=(1-np.exp(-(frequencies/max(1,low))**4))*np.exp(-(frequencies/high)**4)
    signal=np.fft.irfft(spectrum*shape,n)
    return signal/(np.sqrt(np.mean(signal**2))+1e-9)

def fade(signal,attack=.008,release=.08):
    signal=signal.copy();n=len(signal);a=min(n//2,round(attack*RATE));r=min(n//2,round(release*RATE))
    if a:signal[:a]*=np.sin(np.linspace(0,np.pi/2,a))**2
    if r:signal[-r:]*=np.cos(np.linspace(0,np.pi/2,r))**2
    return signal

def air(duration,seed,anchor=.45,body=6000):
    t=np.linspace(0,1,round(duration*RATE));env=np.exp(-.5*((t-anchor)/.14)**2)
    breath=noise(duration,seed,180,body)*env
    ribbon=noise(duration,seed+700,1300,11000)*env**1.8*.13
    return fade(breath+ribbon,.02,.12)

def resonant(duration,frequencies,seed,decay=9,weight=.6):
    t=np.arange(round(duration*RATE))/RATE;signal=np.zeros(len(t))
    for i,f in enumerate(frequencies):
        env=(1-np.exp(-t*(280+i*60)))*np.exp(-t*(decay+i*1.7))
        signal+=np.sin(2*np.pi*(f*t+.015*np.sin(t*18+i)))*env/(i+1)**1.2
    transient=noise(duration,seed,600,8000)*np.exp(-t*85)*.09
    return fade(signal*weight+transient,.002,.08)

def impact(duration,seed,heavy=False):
    t=np.arange(round(duration*RATE))/RATE
    # Rounded mid-bass rather than a huge cinema sub hit; audible on phone speakers.
    phase=2*np.pi*(95*t+2.2*(1-np.exp(-t*27)))
    body=np.sin(phase)*(1-np.exp(-t*900))*np.exp(-t*(10 if heavy else 18))
    knock=noise(duration,seed,220,3200)*np.exp(-t*45)*.38
    sheen=resonant(duration,[420,765],seed+4,decay=18,weight=.08)
    return fade(body+knock+sheen,.003,.10)

def paper(duration,seed):
    t=np.arange(round(duration*RATE))/RATE
    friction=noise(duration,seed,380,6500)*(np.sin(np.pi*np.clip(t/duration,0,1))**2)
    folds=np.zeros(len(t))
    for at,gain in [(.06,.3),(.11,.2),(.18,.13)]:
        index=int(at*RATE);count=len(t)-index
        folds[index:]+=noise(count/RATE,seed+index,1500,10000)*np.exp(-np.arange(count)/RATE*100)*gain
    return fade(friction*.23+folds,.015,.07)

def stereo(signal,seed,width=.18,tail=.08):
    rng=np.random.default_rng(seed);output=np.column_stack([signal,signal])*.82
    for delay,gain in [(.011,.12),(.023,.075),(.041,.045),(.067,.025)]:
        offset=round(delay*RATE)
        if offset<len(signal):
            output[offset:,0]+=signal[:-offset]*gain*(1+width)
            output[offset:,1]+=signal[:-offset]*gain*(1-width)
    # Very small channel decorrelation, retaining a strong mono centre.
    shift=round(.0004*RATE)
    output[shift:,1]+=signal[:-shift]*width*.16
    output-=output.mean(axis=0)
    output=np.column_stack([fade(output[:,i],.003,tail) for i in range(2)])
    peak=np.max(np.abs(output));output*=.56/max(peak,1e-9)
    return output

DESIGNS=[
 ('silk-swipe','Silk swipe','Transitions',.62,'air',.28,.42,'A clean slide or masked reveal; put its crest on the visual handoff.'),
 ('air-whoosh','Air whoosh','Transitions',.88,'air',.41,.32,'A wider B-roll handoff or a purposeful camera reframe.'),
 ('soft-pass','Soft pass','Transitions',.42,'air',.17,.34,'A small panel shift, without drawing attention away from the speaker.'),
 ('reverse-bloom','Reverse bloom','Transitions',.95,'reverse',.69,.24,'Anticipation before a reveal; avoid under dense or emotional dialogue.'),
 ('rounded-impact','Rounded impact','Accents',.60,'impact',.035,.36,'One important title arrival or evidence beat.'),
 ('warm-thump','Warm thump','Accents',.82,'heavy',.045,.28,'A deliberate story turn; restrained and phone-friendly.'),
 ('soft-pop','Soft pop','UI',.23,'pop',.025,.34,'A small card or badge settling into place.'),
 ('glass-tick','Glass tick','UI',.32,'glass',.012,.23,'A precise small highlight; use sparingly around Tamil consonants.'),
 ('cursor-tap','Cursor tap','UI',.16,'tap',.012,.42,'A visible cursor press.'),
 ('ui-click','UI click','UI',.12,'click',.008,.38,'An actual button activation or selection.'),
 ('ui-toggle','UI toggle','UI',.25,'toggle',.018,.35,'A visible switch changing state.'),
 ('ui-confirm','UI confirm','UI',.68,'confirm',.08,.28,'A meaningful completed action, never a fabricated successful result.'),
 ('soft-notice','Soft notice','UI',.48,'notice',.03,.22,'A quiet caution or changed state; no harsh alarm.'),
 ('text-brush','Text brush','Typography',.32,'brush',.10,.23,'One important kinetic phrase; not every caption word.'),
 ('page-turn','Page turn','Foley style',.42,'paper',.12,.34,'A story chapter, note or journal transition; synthesized paper texture.'),
 ('marker-touch','Marker touch','Foley style',.18,'marker',.018,.32,'One underline or highlighted insight; synthesized felt texture.'),
 ('shimmer-rise','Shimmer rise','Reveals',1.30,'shimmer',.75,.20,'A slow product or idea reveal with room for its tail.'),
 ('brand-resolve','Brand resolve','Reveals',1.50,'resolve',.12,.25,'An optional payoff before the existing outro; never double the outro audio.')]

def design(kind,duration,seed):
    if kind=='air':return air(duration,seed)
    if kind=='reverse':return air(duration,seed,anchor=.72,body=4700)+resonant(duration,[260,390],seed,decay=6,weight=.07)[::-1]*np.linspace(0,1,round(duration*RATE))
    if kind in ['impact','heavy']:return impact(duration,seed,kind=='heavy')
    if kind=='pop':return resonant(duration,[345,690],seed,decay=31,weight=.9)
    if kind=='glass':return resonant(duration,[1260,2170,2940],seed,decay=24,weight=.3)
    if kind in ['tap','click','toggle','marker']:
        t=np.arange(round(duration*RATE))/RATE
        texture=noise(duration,seed,380 if kind=='tap' else 1100,5200)*np.exp(-t*(115 if kind=='click' else 75))
        body=resonant(duration,[530 if kind=='toggle' else 340,980],seed,decay=38,weight=.45)
        sound=fade(texture*.32+body,.002,.04)
        if kind=='toggle':
            offset=round(.072*RATE);sound[offset:]+=sound[:-offset]*.38
        return sound
    if kind=='confirm':return resonant(duration,[660,990,1320],seed,decay=9,weight=.5)
    if kind=='notice':return resonant(duration,[440,554],seed,decay=12,weight=.7)
    if kind=='brush':return air(duration,seed,anchor=.28,body=4700)*.6+paper(duration,seed+2)*.25
    if kind=='paper':return paper(duration,seed)
    if kind in ['shimmer','resolve']:
        t=np.arange(round(duration*RATE))/RATE;signal=np.zeros(len(t))
        for i,f in enumerate([330,495,660,990]):
            offset=int((.08+i*.075)*RATE);length=len(t)-offset;local=np.arange(length)/RATE
            signal[offset:]+=np.sin(2*np.pi*f*local)*(1-np.exp(-local*80))*np.exp(-local*(4+i))*.3/(i+1)
        return fade(signal+air(duration,seed,anchor=.53,body=6500)*.12,.02,.25)
    raise ValueError(kind)

def build():
    ROOT.mkdir(parents=True,exist_ok=True);items=[];montage=[];rate=RATE
    for i,(identifier,title,category,duration,kind,anchor,gain,use) in enumerate(DESIGNS):
        signal=stereo(design(kind,duration,1729+i*19),3000+i,tail=min(.12,duration/3))
        data=np.rint(np.clip(signal,-1,1)*8388607).astype('<i4')
        # PCM 24-bit stereo masters, no downloaded stock or hidden network dependency.
        packed=data.reshape(-1).view(np.uint8).reshape(-1,4)[:,:3].tobytes()
        path=ROOT/(identifier+'.wav')
        with wave.open(str(path),'wb') as wav:
            wav.setnchannels(2);wav.setsampwidth(3);wav.setframerate(rate);wav.writeframes(packed)
        item=dict(id=identifier,title=title,category=category,file=path.name,duration=duration,anchor_seconds=anchor,
            recommended_gain=gain,use=use,author='Original Fieldnotes procedural sound design',license='CC0-1.0',
            source_url='local:video-edit/scripts/design_sound_library.py',sha256=hashlib.sha256(path.read_bytes()).hexdigest(),
            peak_dbfs=round(20*np.log10(np.max(np.abs(signal))),2),rms_dbfs=round(20*np.log10(np.sqrt(np.mean(signal**2))),2))
        item['waveform']=[round(float(np.max(np.abs(part)))/.56,4) for part in np.array_split(signal,34)]
        items.append(item);montage.extend([signal*.65,np.zeros((round(.35*RATE),2))])
    # Retain separately imported tactile assets when rebuilding the legacy collection.
    existing=json.loads((ROOT/'catalog.json').read_text()) if (ROOT/'catalog.json').exists() else {}
    imported=[i for i in existing.get('assets',[]) if i.get('collection')=='fieldnotes-tactile']
    catalog=dict(version=1,name='Fieldnotes / Signature SFX',sample_rate=RATE,channels=2,bits_per_sample=24,
        provenance='Original deterministic synthesized sound effects; not purchased stock recordings.',assets=items)
    if imported:catalog.update(version=2,name=existing['name'],provenance=existing['provenance'],default_collection='fieldnotes-tactile',assets=imported+[{**i,'collection':'fieldnotes-synth'} for i in items])
    (ROOT/'catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n')
    (ROOT/'catalog.js').write_text('window.FIELDNOTES_SFX = '+json.dumps(catalog,ensure_ascii=False)+';\n')
    preview=np.concatenate(montage)
    with wave.open(str(ROOT/'audition.wav'),'wb') as wav:
        wav.setnchannels(2);wav.setsampwidth(2);wav.setframerate(RATE);wav.writeframes((preview*32767).astype('<i2').tobytes())
    print(f'Designed {len(items)} original 48kHz/24-bit stereo effects in {ROOT}')

if __name__=='__main__':build()
