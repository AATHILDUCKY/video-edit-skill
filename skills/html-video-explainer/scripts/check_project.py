#!/usr/bin/env python3
"""Check storyboard, captions, local assets, media freshness, and JavaScript syntax."""
import argparse
import hashlib
from html.parser import HTMLParser
import json
import math
import re
from pathlib import Path
import shutil
import subprocess
import sys
import wave

def assignment(path, variable):
    text = path.read_text(); marker = 'window.'+variable+' ='
    if marker not in text: raise ValueError(f'{path.name}: missing {marker}')
    return json.JSONDecoder().raw_decode(text.split(marker, 1)[1].lstrip())[0]

def audio_signature(scenes):
    plan = [{k: s.get(k) for k in ['kind', 'duration', 'motionDuration', 'typing', 'audio']} for s in scenes]
    return hashlib.sha256(json.dumps(plan, sort_keys=True).encode()).hexdigest()

class Links(HTMLParser):
    def __init__(self): super().__init__(); self.paths = []
    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if key in ['src', 'href'] and value and not value.startswith(('data:', 'http:', 'https:', '#', 'mailto:')): self.paths.append(value.split('?')[0])

def main():
    parser = argparse.ArgumentParser(description=__doc__); parser.add_argument('project', type=Path); parser.add_argument('--allow-demo', action='store_true'); args = parser.parse_args()
    root = args.project.resolve(); errors = []; warnings = []
    def local(name):
        p = (root/name).resolve()
        if not p.is_relative_to(root): raise ValueError('Project path escapes its folder: '+name)
        return p
    def caption_style(value):
        if not isinstance(value,dict):
            errors.append('Caption appearance must be an object.'); return
        for key, low, high in [('fontSize',24,120),('x',0,1),('y',0,1),('maxWidth',.3,.95),('backgroundOpacity',0,1)]:
            if key not in value or key == 'y' and value[key] is None: continue
            number=value[key]
            if not isinstance(number,(int,float)) or isinstance(number,bool) or not math.isfinite(number) or not low <= number <= high: errors.append('Invalid caption appearance value: '+key)
        for key in ['textColor','backgroundColor']:
            if key in value and (not isinstance(value[key],str) or not re.fullmatch(r'#[0-9a-fA-F]{6}',value[key])): errors.append('Caption colors must be six-digit hex values.')
        if 'theme' in value and value['theme'] not in ['highlight','box','plain']: errors.append('Unknown caption appearance theme.')
    try:
        project = json.loads((root/'video.project.json').read_text())
        config = assignment(root/'assets/codex/template.js', 'CODEX_SHORT_TEMPLATE')
        if 'captionStyle' in config: caption_style(config['captionStyle'])
        if 'captionStyles' in config:
            if not isinstance(config['captionStyles'],dict): errors.append('captionStyles must map cue IDs to appearance objects.')
            else:
                for value in config['captionStyles'].values(): caption_style(value)
        scenes = config['scenes']; duration = sum(s['duration'] for s in scenes)
        display_duration = config.get('targetDuration', duration)
        if not isinstance(display_duration, (int,float)) or not math.isfinite(display_duration) or display_duration <= 0: errors.append('A positive targetDuration is required.')
        kinds = [s.get('kind') for s in scenes]
        if len(kinds) != len(set(kinds)): errors.append('Scene identities must be unique; reuse presets with separate scene kinds.')
        if config.get('cameraFollowsSpeed'): errors.append('Camera footage must stay at original 1x speed.')
        if not scenes or duration <= 0: errors.append('A positive-duration storyboard is required.')
        for s in scenes:
            if not isinstance(s.get('kind'), str) or not isinstance(s.get('voice'), str) or not s.get('duration', 0) > 0: errors.append('Each scene needs kind, narration, and positive duration.')
            if len(s.get('voice', '').split()) / s['duration'] * 60 > 190: warnings.append(f'Fast narration in {s["kind"]}; inspect its read speed.')
            if s.get('typing') and not 0 <= s['typing']['start'] < s['typing']['end'] <= s['duration']: errors.append('Typing interval outside scene: '+s['kind'])
            for event in s.get('audio', []):
                if not 0 <= event.get('at', -1) < s['duration']: errors.append('Sound event outside scene: '+s['kind'])
                if event.get('type') not in ['impact','whoosh','click','tick','pop','ping','chime']: errors.append('Unknown sound event type in '+s['kind'])
            for beat in s.get('beats', []):
                if not isinstance(beat.get('at'),(int,float)) or not 0 <= beat['at'] < s['duration'] or not isinstance(beat.get('action'),str): errors.append('Beat must have local at/action inside scene: '+s['kind'])
        if config.get('sceneWeights'):
            for kind in kinds:
                weight = config['sceneWeights'].get(kind)
                if not isinstance(weight,(int,float)) or not math.isfinite(weight) or weight <= 0: errors.append('Each scene weight must be finite and positive.')
        if project.get('timeline'):
            plan = json.loads(local(project['timeline']).read_text())
            if len(plan['scenes']) != len(scenes) or abs(plan['duration']-duration) > .000001: errors.append('Requested timeline differs from source storyboard.')
            clock = 0
            for requested, scene in zip(plan['scenes'], scenes):
                if requested.get('kind',requested.get('id')) != scene['kind'] or abs(requested['start']-clock) > .000001 or abs(requested['end']-(clock+scene['duration'])) > .000001: errors.append('Explicit scene timing differs from timeline plan.')
                clock += scene['duration']
            if plan.get('mode','absolute') == 'absolute' and (config.get('autoFitVideo') or abs(display_duration-duration) > .000001): errors.append('Fixed timestamp plan must retain its duration and disable automatic upload retiming.')
        if project.get('is_demo') and not args.allow_demo: errors.append('Starter is still marked is_demo. Implement the concept and set is_demo=false before delivery.')
        captions = config.get('captionCues'); previous = 0
        if captions is not None:
            for c in sorted(captions, key=lambda v:v['start']):
                if 'style' in c: caption_style(c['style'])
                if c['start'] < previous-.001 or c['end'] > display_duration+.001 or c['end']-c['start'] < .000999 or not isinstance(c['text'],str): errors.append('Invalid, overlapping, or out-of-range caption cue.')
                previous = c['end']
        entry = local(project['html']); links = Links(); links.feed(entry.read_text())
        if local(project.get('video','video-preview.mp4')).suffix.lower() != '.mp4': errors.append('Video output must use an .mp4 filename inside the project.')
        for name in links.paths:
            if not local(name).is_file(): errors.append('Missing HTML asset: '+name)
        for key, name in project['images'].items():
            if not local(name).is_file(): errors.append('Missing image '+key+': '+name)
        for name in ['SOURCES.md', 'assets/codex/manrope-OFL.txt', 'assets/codex/keyboard-credit.txt']:
            if not local(name).is_file(): errors.append('Missing source/license file: '+name)
        media = assignment(root/'assets/codex/media.js','CODEX_SHORT_MEDIA')
        if set(media['photos']) != set(project['images']): errors.append('Embedded image keys differ from project manifest; rebuild media.')
        plan = json.loads((root/'assets/codex/audio-plan.json').read_text())
        if plan['signature'] != audio_signature(scenes): errors.append('Audio timing is stale; run make-soundtrack.py and bundle-media.py.')
        build = json.loads((root/'assets/codex/media-build.json').read_text())
        for name, digest in build['sources'].items():
            if not local(name).is_file() or hashlib.sha256(local(name).read_bytes()).hexdigest() != digest: errors.append('Stale media bundle source: '+name)
        for name in ['effects','rhythm','keyboard']:
            with wave.open(str(root/f'assets/codex/{name}.wav')) as f:
                if abs(f.getnframes()/f.getframerate()-duration)>.02: errors.append(f'{name} audio duration does not match storyboard.')
        node = shutil.which('node')
        if node:
            for script in (root/'assets/codex').glob('*.js'):
                result = subprocess.run([node,'--check',str(script)],capture_output=True,text=True)
                if result.returncode: errors.append(script.name+': '+result.stderr[:500])
        else: warnings.append('Node unavailable; JavaScript syntax was not checked.')
    except (OSError, ValueError, KeyError, TypeError, wave.Error, ZeroDivisionError) as exc:
        errors.append(str(exc))
    report = {'valid':not errors,'errors':errors,'warnings':warnings}
    print(json.dumps(report,indent=2)); return 0 if not errors else 1

if __name__=='__main__': sys.exit(main())
