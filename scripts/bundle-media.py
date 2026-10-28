"""Bundle fonts, photos, and audio for reliable file:// canvas and Web Audio export."""
import base64
import json
import os
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'assets/codex'
ffmpeg = os.environ.get('FFMPEG_PATH', 'ffmpeg')
css = []
for weight in [500, 800]:
    data = base64.b64encode((ASSETS/f'manrope-normal-{weight}.ttf').read_bytes()).decode()
    css.append(f'@font-face{{font-family:Manrope;src:url(data:font/ttf;base64,{data}) format("truetype");font-weight:{"400 600" if weight == 500 else "700 900"};font-display:swap}}')
(ASSETS/'fonts.css').write_text('\n'.join(css))
media = {}
for name, key in [('effects', 'sfx'), ('rhythm', 'music'), ('keyboard', 'keyboard')]:
    target = ASSETS/f'{name}.m4a'
    subprocess.run([ffmpeg, '-y', '-hide_banner', '-loglevel', 'error', '-i', str(ASSETS/f'{name}.wav'), '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', str(target)], check=True)
    media[key] = 'data:audio/mp4;base64,'+base64.b64encode(target.read_bytes()).decode()
media['photos'] = {name: 'data:image/jpeg;base64,'+base64.b64encode((ASSETS/f'{name}.jpg').read_bytes()).decode() for name in ['laptop', 'camera', 'workspace']}
media['keyboardWindow'] = json.loads((ASSETS/'keyboard-timing.json').read_text())
(ASSETS/'media.js').write_text('// Embedded AAC avoids file-origin Web Audio restrictions.\nwindow.CODEX_SHORT_MEDIA = '+json.dumps(media)+';\n')
print('Bundled fonts, photos, and compressed sound tracks for direct-file playback and canvas export.')
