from pathlib import Path
import json,sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from common import ffmpeg,read_json,write_json
from video_edit import prepare
from timeline import normalize_transcript
from build_project import build_project
root=Path(sys.argv[1]).resolve();root.mkdir(parents=True,exist_ok=True)
ffmpeg('-y','-f','lavfi','-i','color=c=0x243d2a:s=540x960:r=30:d=4','-f','lavfi','-i','sine=frequency=440:sample_rate=48000:duration=4','-af','volume=0.8','-c:v','libx264','-preset','ultrafast','-c:a','aac','-ac','2','-shortest',root/'camera.mp4')
ffmpeg('-y','-f','lavfi','-i','color=c=0x546a35:s=540x960:r=30:d=2','-f','lavfi','-i','sine=frequency=880:sample_rate=48000:duration=2','-af','volume=0.8','-c:v','libx264','-preset','ultrafast','-c:a','aac','-ac','2','-shortest',root/'insert.mp4')
prepare(root/'camera.mp4',root/'analysis')
meta=read_json(root/'analysis/source.json');tr=normalize_transcript({'language':'none','segments':[]},meta['canonical_duration']);tr['source_fps']=30;write_json(root/'analysis/transcript.json',tr)
plan=dict(version=1,reviewed=True,visuals_authored=True,title='Audio preservation fixture',source_sha256=meta['source_sha256'],fps=30,outro=False,clips=[dict(start=0,end=4)],scenes=[dict(id='first',start=0,end=1,title='Camera',layout='camera'),dict(id='insert',start=1,end=3,title='Insert',layout='broll',broll='insert.mp4',broll_in=0,credit=dict(title='Synthetic audio test',source_url='local test fixture',license='original test fixture')),dict(id='last',start=3,end=4,title='Camera',layout='camera')],sound=[])
write_json(root/'plan.json',plan);build_project(root/'analysis',root/'plan.json',root/'project')
project=root/'project';template=project/'assets/codex/template.js';text=template.read_text();data=json.loads(text[text.index('=')+1:].strip().rstrip(';'));data.update(cameraVolume=.8,insertVolume=.6,sfxVolume=.15,musicVolume=0,keyboardSound=False);template.write_text('window.CODEX_SHORT_TEMPLATE = '+json.dumps(data)+';\n')
# Deliberate third frequency proves added sound is mixed alongside both clips.
ffmpeg('-y','-f','lavfi','-i','sine=frequency=1320:sample_rate=48000:duration=4','-af','volume=0.8','-ac','2','-c:a','pcm_s16le',project/'assets/codex/effects.wav')
import subprocess
subprocess.run([sys.executable,str(project/'scripts/bundle-media.py')],check=True)
print('Built audio proof fixture:',project)
