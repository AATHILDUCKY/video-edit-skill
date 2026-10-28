"""Write clean narration, a timed read sheet, and matching SRT from the template."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
template = json.loads((ROOT/'assets/codex/template.js').read_text().split('=', 1)[1].strip().rstrip(';'))
source_duration = sum(s['duration'] for s in template['scenes'])
duration = template.get('targetDuration', source_duration)
ratio = duration / source_duration
clean = ' '.join(s['voice'].strip() for s in template['scenes'])
words = len(clean.split())
project=json.loads((ROOT/'video.project.json').read_text())
notes = [f'{project["title"].upper()} — {duration:g}-SECOND RECORDING SCRIPT',
         f'{words} words · about {round(words/duration*60)} words per minute.',
         'Read conversationally. Follow the scene timings and leave space for each visual.',
         '', 'CLEAN READ', clean, '', 'TIMED READ']
subtitles = []

def stamp(t):
    ms = round(t*1000)
    return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'

clock = 0
for index, scene in enumerate(template['scenes'], 1):
    end = clock+scene['duration']*ratio
    notes.extend(['', f'{clock:04.1f}–{end:04.1f}s | {scene["kind"].upper()}', scene['voice'],
                  f'Visual: {scene["title"]} {scene["emphasis"]}'.strip(), f'Sound: {scene["cue"]}'])
    subtitles.append(f'{index}\n{stamp(clock)} --> {stamp(end)}\n{scene["voice"]}\n')
    clock = end
(ROOT/'codex-recording-script.txt').write_text('\n'.join(notes)+'\n')
(ROOT/'codex-reel-narration.txt').write_text(clean+'\n')
(ROOT/'codex-script-captions.srt').write_text('\n'.join(subtitles))
(ROOT/'recording-script.txt').write_text('\n'.join(notes)+'\n')
(ROOT/'narration.txt').write_text(clean+'\n')
(ROOT/'captions.srt').write_text('\n'.join(subtitles))
print(f'Exported {duration:g}s narration: {words} words, about {round(words/duration*60)} words/min.')
