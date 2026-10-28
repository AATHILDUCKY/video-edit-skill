#!/usr/bin/env python3
"""Create an isolated HTML video project with the current visual/caption editor."""
import argparse
import hashlib
import html
import json
from pathlib import Path
import re
import shutil
import unicodedata

SKILL=Path(__file__).resolve().parents[1]
def assignment(path):
    return json.JSONDecoder().raw_decode(path.read_text().split('=',1)[1].lstrip())[0]

def main():
    palettes=assignment(SKILL/'assets/template/assets/codex/palettes.js')
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',required=True,type=Path)
    parser.add_argument('--title',required=True)
    parser.add_argument('--html',default='index.html',dest='entry')
    parser.add_argument('--style',choices=['about','video1'],default='about')
    parser.add_argument('--duration',type=float,default=25)
    parser.add_argument('--palette',choices=list(palettes),default='coral')
    parser.add_argument('--accent',help='Optional six-digit hex override.')
    parser.add_argument('--creator',default='')
    parser.add_argument('--caption-size',type=float,default=60,help='Caption font size in the 1080px-wide master: 24–120.')
    parser.add_argument('--caption-position',choices=['auto','top','center','bottom'],default='auto')
    parser.add_argument('--top-percent',type=int,default=50)
    args=parser.parse_args()
    if not 1<=args.duration<=600:parser.error('Duration must be 1–600 seconds.')
    if not 24<=args.caption_size<=120:parser.error('Caption size must be 24–120 px.')
    if not 30<=args.top_percent<=70:parser.error('Top section must be 30–70 percent.')
    if args.accent and not re.fullmatch(r'#[0-9a-fA-F]{6}',args.accent):parser.error('Use a six-digit hex accent.')
    if Path(args.entry).name!=args.entry or not args.entry.endswith('.html'):parser.error('--html must be an HTML filename.')
    source=SKILL/'assets/template';output=args.output.expanduser().resolve()
    if output.exists() and (not output.is_dir() or any(output.iterdir())):parser.error(f'Refusing non-empty output: {output}')
    if output==SKILL or output.is_relative_to(SKILL):parser.error('Output must be outside the skill package.')
    output.mkdir(parents=True,exist_ok=True)
    shutil.copytree(source,output,dirs_exist_ok=True,ignore=shutil.ignore_patterns('__pycache__','*.pyc'))
    config_path=output/'assets/codex/template.js'
    if args.style=='video1':
        resources=SKILL/'assets/styles/video1'
        for name in ['template.js','concept.js','laptop.jpg','camera.jpg','workspace.jpg','codex-mark.svg']:
            shutil.copy2(resources/name,output/'assets/codex'/name)
        shutil.copy2(resources/'SOURCES.md',output/'SOURCES.md')
    config=assignment(config_path)
    for scene in config['scenes']:
        if scene['kind']=='prompt' and not scene.get('typing'):
            ratio=scene['duration']/scene.get('motionDuration',scene['duration'])
            scene['typing']={'start':.26*ratio,'end':1.65*ratio}
    config.update(name=args.title,creator=args.creator[:32],accent=args.accent or palettes[args.palette]['accent'],palette='custom' if args.accent else args.palette,
                  targetDuration=args.duration,topPercent=args.top_percent,captionCues=None,autoFitVideo=True,cameraFollowsSpeed=False,timingMode='relative',sceneWeights=None)
    config['captionStyle']={**config.get('captionStyle',{}),'fontSize':args.caption_size,'x':.5,'y':{'auto':None,'top':.15,'center':.5,'bottom':.9}[args.caption_position]}
    config['captionStyles']={}
    config_path.write_text('window.CODEX_SHORT_TEMPLATE = '+json.dumps(config,ensure_ascii=False,indent=2)+';\n')
    entry=output/'video1.html';page=entry.read_text()
    page=re.sub(r'<title>.*?</title>','<title>'+html.escape(args.title)+' — video editor</title>',page,count=1)
    page=re.sub(r'<meta name="description" content="[^"]*">','<meta name="description" content="'+html.escape('Editable animated video: '+args.title,quote=True)+'">',page,count=1)
    page=re.sub(r'(<canvas id="reelCanvas"[^>]*aria-label=")[^"]*',lambda m:m[1]+html.escape(args.title+' — editable animated video.',quote=True),page,count=1)
    page=page.replace('17-second recording script',f'{args.duration:g}-second recording script').replace('17 seconds · 60 fps',f'{args.duration:g} seconds · 60 fps')
    entry.unlink();(output/args.entry).write_text(page)
    slug=re.sub(r'[^a-z0-9]+','-',unicodedata.normalize('NFKD',args.title).encode('ascii','ignore').decode().lower()).strip('-') or 'video'
    core=output/'assets/codex/short.js';code=core.read_text()
    namespace='concept-video-'+slug+'-'+hashlib.sha256(str(output).encode()).hexdigest()[:8]+'-v2'
    code=re.sub(r'const storageKey = [^;]+;',lambda _: 'const storageKey = '+json.dumps(namespace)+';',code,count=1)
    code=code.replace('html-video-template${hasCamera',slug+'${hasCamera')
    core.write_text(code)
    project_path=output/'video.project.json';project=json.loads(project_path.read_text())
    project.update(title=args.title,html=args.entry,video=slug+'.mp4',is_demo=True,style=args.style,
                   images={key:f'assets/codex/{key}.jpg' for key in ['laptop','camera','workspace']} if args.style=='video1' else {})
    project_path.write_text(json.dumps(project,indent=2)+'\n')
    (output/'BRIEF.md').write_text(f'# {args.title}\n\nPreview: {args.duration:g}s. Style: {args.style}. Palette: {args.palette}.\n\nReplace the demonstration story and assets. Explicit timestamps override automatic clip matching; apply a complete timeline with the skill helper.\n')
    (output/'README.md').write_text(f'''# {args.title}

Open `{args.entry}`. Upload your video: visuals and script captions fit its length while video/voice stay at 1× speed. Use **Visuals** to edit text, illustration, color, images, size, position, and exact timing. In **Captions → Size & position**, resize or drag captions, choose All/This caption, and change colors/background. Save template keeps appearance; SRT keeps text/timing. Drag/trim visual or caption blocks. Save template includes images and timings; reselect camera files on reload.

The default is the **{args.style}** reference style with **{args.palette}** color. In Template → Story + script, change the palette, accent, creator, and script. This is a demo until the concept-specific scenes are implemented and `is_demo` is false.

Edit `assets/codex/template.js` and `concept.js`. `targetDuration` is preview length; source scene durations define the authored animation/sound timebase. Explicit timestamp plans set these to the requested intervals and disable automatic matching. Read `TEMPLATE-README.md` for controls.

After changing the storyboard or assets:

```sh
python3 scripts/make-soundtrack.py
python3 scripts/bundle-media.py
python3 scripts/export-script.py
```

NumPy/FFmpeg are needed for sound. Install Playwright with `npm install` and `npx playwright install chromium`. `npm run render` renders file defaults; `npm run render -- --template saved-template.json` renders saved visual/timing changes. Browser Export includes the uploaded camera clip. Keep source credits in `SOURCES.md`.
''')
    print(f'Created {output/args.entry} ({args.style}, {args.palette}).')
    print('Demo story: adapt scenes/assets, rebuild sound/media, and validate before delivery.')

if __name__=='__main__':main()
