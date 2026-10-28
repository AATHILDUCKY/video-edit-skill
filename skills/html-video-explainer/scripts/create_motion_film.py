#!/usr/bin/env python3
"""Create a single-file 1920×1080 deterministic motion-film authoring shell."""
import argparse
import base64
import html
import json
from pathlib import Path
import re

SKILL=Path(__file__).resolve().parents[1]
def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',required=True,type=Path);parser.add_argument('--title',required=True)
    parser.add_argument('--duration',type=float,default=15);parser.add_argument('--bpm',type=float,default=120);parser.add_argument('--accent',default='#D76A4E')
    args=parser.parse_args()
    if not 1<=args.duration<=600 or not 30<=args.bpm<=240:parser.error('Use 1–600 seconds and 30–240 BPM.')
    if not re.fullmatch(r'#[0-9a-fA-F]{6}',args.accent):parser.error('Use a six-digit hex accent.')
    path=args.output.expanduser().resolve()
    if path.is_relative_to(SKILL):parser.error('Create projects outside the skill package.')
    if path.exists():parser.error('Refusing to overwrite an existing film.')
    if path.suffix.lower()!='.html':parser.error('Output must be an HTML file.')
    text=(SKILL/'assets/motion-film/film.html').read_text();font=base64.b64encode((SKILL/'assets/template/assets/codex/manrope-normal-800.ttf').read_bytes()).decode()
    text=text.replace('/* EMBED_FONT */',"@font-face{font-family:Manrope;src:url(data:font/ttf;base64,"+font+");font-weight:800;font-display:block}")
    config={'title':args.title,'duration':args.duration,'bpm':args.bpm,'accent':args.accent,'background':'#ffffff','ink':'#171c22','isDemo':True,'riser':False}
    text=re.sub(r'(<script id="film-config" type="application/json">).*?(</script>)',lambda m:m[1]+json.dumps(config,ensure_ascii=False).replace('<','\\u003c')+m[2],text,count=1,flags=re.S)
    text=text.replace('<title>Motion film</title>','<title>'+html.escape(args.title)+'</title>')
    license=(SKILL/'assets/template/assets/codex/manrope-OFL.txt').read_text().replace('--','—')
    text=text.replace('<head>','<head>\n<!-- Embedded Manrope font, SIL Open Font License 1.1.\n'+license+'\n-->',1)
    path.parent.mkdir(parents=True,exist_ok=True);path.write_text(text)
    print('Created '+str(path));print('Authoring shell only: replace drawFilm, implement the storyboard, then set isDemo=false. No MP4 has been rendered.')
if __name__=='__main__':main()
