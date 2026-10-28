"""Synthesize synchronized Codex-short effects and a separate, quiet rhythm bed."""
from pathlib import Path
import json
import wave
import os
import subprocess
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
template = json.loads((ROOT / 'assets/codex/template.js').read_text().split('=', 1)[1].strip().rstrip(';'))
RATE = 48000
DURATION = sum(s['duration'] for s in template['scenes'])
rng = np.random.default_rng(742)
fx = np.zeros((round(RATE*DURATION), 2))
bed = np.zeros_like(fx)
keys = np.zeros_like(fx)
starts = []
clock = 0
for scene in template['scenes']:
    starts.append(clock)
    clock += scene['duration']

# Map the original cue positions to each scene's new length. Keep effect pitch intact.
reference_starts = []
reference_clock = 0
for scene in template['scenes']:
    reference_starts.append(reference_clock)
    reference_clock += scene.get('motionDuration', scene['duration'])

def retime(at):
    index = max(i for i, start in enumerate(reference_starts) if at >= start)
    scene = template['scenes'][index]
    return starts[index]+(at-reference_starts[index])*scene['duration']/scene.get('motionDuration', scene['duration'])

def add(bus, at, signal, volume=1, pan=0):
    start = round(max(0, at)*RATE)
    n = min(len(signal), len(bus)-start)
    if n <= 0:
        return
    bus[start:start+n, 0] += signal[:n]*volume*np.sqrt((1-pan)/2)
    bus[start:start+n, 1] += signal[:n]*volume*np.sqrt((1+pan)/2)

def tone(hz, duration=.18, decay=22):
    t = np.arange(round(duration*RATE))/RATE
    return (np.sin(2*np.pi*hz*t)+.15*np.sin(2*np.pi*hz*2*t))*(1-np.exp(-t*900))*np.exp(-t*decay)

def click(at, volume=.25, pan=0):
    t = np.arange(round(.045*RATE))/RATE
    n = rng.normal(0, 1, len(t))
    n = n - np.roll(n, 1)
    add(fx, at, n*np.exp(-t*190), volume, pan)
    add(fx, at, tone(900, .04, 100), volume*.25, pan)

def whoosh(at, volume=.35, duration=.17, down=False):
    t = np.arange(round(duration*RATE))/RATE
    n = rng.normal(0, 1, len(t))
    n = np.convolve(n, np.ones(12)/12, mode='same')
    envelope = np.sin(np.linspace(0, np.pi, len(t)))**1.7
    sweep = np.sin(2*np.pi*((1200 if down else 250)*t + (-1800 if down else 1800)*t*t))*.08
    add(fx, at, (n+sweep)*envelope, volume, -.35)
    add(fx, at+.018, (n[::-1]+sweep)*envelope, volume*.55, .35)

# Hook: short bass impact and the exact photo-to-code change.
t = np.arange(round(.25*RATE))/RATE
impact = np.sin(2*np.pi*(58*t+1.7*(1-np.exp(-t*40))))*np.exp(-t*19)
add(fx, retime(.015), impact, .65)
whoosh(retime(.78), .48, .22)
click(retime(1.42), .16)

# Every scene change gets a precise, short transition instead of constant noise.
for index, at in enumerate(starts[1:], 1):
    whoosh(at-.105, .32 if index not in [3,4] else .18, .13, index == 5)
    click(at+.025, .14, (-1 if index%2 else 1)*.25)

# Recorded IBM M2 keystrokes, gated to the prompt's visible typing interval.
# Source: Anonimski, Wikimedia Commons, CC0 (see SOURCES.md).
raw = subprocess.check_output([os.environ.get('FFMPEG_PATH', 'ffmpeg'), '-hide_banner', '-loglevel', 'error', '-i', str(ROOT/'assets/codex/keyboard-source.ogg'), '-f', 'f32le', '-ar', str(RATE), '-ac', '2', 'pipe:1'])
recording = np.frombuffer(raw, dtype='<f4').reshape(-1, 2).astype(np.float64)
typing_start, typing_end = retime(2.4+.26), retime(2.4+1.65)
count = round((typing_end-typing_start)*RATE)
recording = recording[round(.2*RATE):round(.2*RATE)+count]
recording -= np.mean(recording, axis=0)
fade = min(round(.007*RATE), len(recording)//2)
recording[:fade] *= np.linspace(0, 1, fade)[:, None]
recording[-fade:] *= np.linspace(1, 0, fade)[:, None]
start = round(typing_start*RATE)
keys[start:start+len(recording)] = recording
(ROOT/'assets/codex/keyboard-timing.json').write_text(json.dumps({'start': typing_start, 'end': typing_end}))
click(retime(4.10), .22)
add(fx, retime(4.18), tone(660, .16, 24), .2)
add(fx, retime(4.23), tone(990, .21, 20), .16)

# Graphic photo pops, razor cut snap, and the waveform's stereo ping.
for i, hz in enumerate([240, 310, 410]):
    add(fx, retime(4.66+i*.09), tone(hz, .11, 36), .24, (i-1)*.4)
click(retime(5.77), .28)
add(fx, retime(5.78), tone(180, .10, 45), .22)
add(fx, retime(6.51), tone(880, .27, 16), .25, -.5)
add(fx, retime(6.62), tone(1320, .27, 16), .2, .5)
whoosh(retime(7.82), .23, .31, True)

# Preview → tweak → export, with an audible final confirmation.
click(retime(9.56), .2)
whoosh(retime(10.21), .2, .16)
click(retime(11.06), .16)
for i, hz in enumerate([659.255, 830.609, 987.767]):
    add(fx, retime(11.65+i*.065), tone(hz, .5, 8), .21, (i-1)*.25)
for i, hz in enumerate([261.626, 329.628, 391.995, 523.251]):
    add(fx, retime(12.06+i*.035), tone(hz, 1.7, 3), .14, (i-1.5)*.25)

# Separate bed: very low volume by default so camera speech remains clear.
beat = .46875
notes = [130.813, 164.814, 195.998, 164.814, 146.832, 195.998, 164.814, 130.813]
for i in range(int(np.ceil(starts[-1]/beat))):
    at = i*beat
    add(bed, at, tone(notes[i%8], .32, 12), .24, np.sin(i)*.4)
    tt = np.arange(round(.12*RATE))/RATE
    kick = np.sin(2*np.pi*(48*tt+.6*(1-np.exp(-tt*45))))*np.exp(-tt*32)
    add(bed, at, kick, .38)
    if i%2:
        nn = rng.normal(0, 1, round(.035*RATE))
        add(bed, at+beat*.5, nn*np.exp(-np.arange(len(nn))/RATE*180), .045, .3)

def write(name, bus, peak):
    fade = round(.03*RATE)
    bus[:fade] *= np.linspace(0,1,fade)[:,None]
    bus[-fade:] *= np.linspace(1,0,fade)[:,None]
    bus = np.tanh(bus)
    bus *= peak/max(.01, np.max(np.abs(bus)))
    with wave.open(str(ROOT/'assets/codex'/name), 'wb') as wav:
        wav.setnchannels(2)
        wav.setsampwidth(2)
        wav.setframerate(RATE)
        wav.writeframes((bus*32767).astype('<i2').tobytes())
    print(f'Wrote {name}: {DURATION:.1f}s, stereo, {RATE} Hz')

write('effects.wav', fx, .8)
write('rhythm.wav', bed, .65)
write('keyboard.wav', keys, .78)
