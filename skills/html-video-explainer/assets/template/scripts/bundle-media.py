"""Embed manifest images, fonts, and encoded stems for origin-clean local export."""
import base64
import hashlib
import json
import mimetypes
import os
from pathlib import Path
import subprocess

ROOT=Path(__file__).resolve().parents[1];ASSETS=ROOT/'assets/codex'
project=json.loads((ROOT/'video.project.json').read_text());ffmpeg=os.environ.get('FFMPEG_PATH','ffmpeg')
sources={}
def local(name):
    p=(ROOT/name).resolve()
    if not p.is_relative_to(ROOT):raise ValueError('Asset must be inside project: '+name)
    data=p.read_bytes();sources[name]=hashlib.sha256(data).hexdigest();return data
css=[]
for weight in [500,800]:
    data=base64.b64encode(local(f'assets/codex/manrope-normal-{weight}.ttf')).decode()
    css.append(f'@font-face{{font-family:Manrope;src:url(data:font/ttf;base64,{data}) format("truetype");font-weight:{"400 600" if weight==500 else "700 900"};font-display:swap}}')
(ASSETS/'fonts.css').write_text('\n'.join(css))
media={}
for name,key in [('effects','sfx'),('rhythm','music'),('keyboard','keyboard')]:
    local(f'assets/codex/{name}.wav');target=ASSETS/f'{name}.m4a'
    subprocess.run([ffmpeg,'-y','-hide_banner','-loglevel','error','-i',str(ASSETS/f'{name}.wav'),'-c:a','aac','-b:a','128k','-movflags','+faststart',str(target)],check=True)
    media[key]='data:audio/mp4;base64,'+base64.b64encode(target.read_bytes()).decode()
media['photos']={}
for key,name in project['images'].items():
    mime=mimetypes.guess_type(name)[0]
    if not mime or not mime.startswith('image/'):raise ValueError('Unsupported image: '+name)
    media['photos'][key]='data:'+mime+';base64,'+base64.b64encode(local(name)).decode()
media['keyboardWindow']=json.loads(local('assets/codex/keyboard-timing.json'))
local('assets/codex/audio-plan.json')
(ASSETS/'media.js').write_text('// Generated local media. Rebuild after changing assets or sound.\nwindow.CODEX_SHORT_MEDIA = '+json.dumps(media)+';\n')
(ASSETS/'media-build.json').write_text(json.dumps({'sources':sources},indent=2)+'\n')
print('Bundled '+str(len(media['photos']))+' images, fonts, and three sound stems.')
