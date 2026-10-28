"""Portable brand settings; projects snapshot the profile instead of rewriting the editor."""
from pathlib import Path
import copy
import re
from common import read_json, number

ROOT=Path(__file__).resolve().parents[1]

def load_brand(path=None):
    base=read_json(ROOT/'assets/brand/profile.json')
    chunk_defaults=dict(base.get('caption_chunking',{'max_words':4,'max_duration':1.6}))
    if path:
        custom=path if isinstance(path,dict) else read_json(path)
        if custom.get('format')=='video-edit-brand': custom=custom['settings']
        base.update(custom)
    base=copy.deepcopy(base)
    if base.get('version')!=1: raise ValueError('Unsupported brand version.')
    if not re.fullmatch(r'#[0-9a-fA-F]{6}',base['accent']): raise ValueError('Brand accent needs #RRGGBB.')
    if base['default_layout'] not in ['camera','split','motion']: raise ValueError('Invalid brand default_layout.')
    number(base['top_percent'],'top_percent',30,70)
    number(base['motion_intensity'],'motion_intensity',.2,1.4)
    for key in ['sfx_volume','music_volume','camera_volume','insert_volume']: number(base[key],key,0,1)
    if 'sfx_duck_db' in base:number(base['sfx_duck_db'],'sfx_duck_db',0,18)
    chunks=base.get('caption_chunking',{})
    if not isinstance(chunks,dict):raise ValueError('caption_chunking must be an object.')
    chunks={**chunk_defaults,**chunks}
    if isinstance(chunks['max_words'],bool) or not isinstance(chunks['max_words'],int) or not 1<=chunks['max_words']<=8:
        raise ValueError('caption_chunking.max_words must be an integer from 1 to 8.')
    number(chunks['max_duration'],'caption_chunking.max_duration',.6,3.5)
    base['caption_chunking']={k:chunks[k] for k in ['max_words','max_duration']}
    base['creator']=str(base['creator'])[:32]
    return base

def outro_path(brand, plan_dir):
    outro=brand.get('outro',{})
    if not outro.get('enabled',True): return None
    name=outro.get('file','insta-follow-2.mp4')
    path=Path(name).expanduser()
    candidates=[path] if path.is_absolute() else [Path(plan_dir)/path,Path.cwd()/path,ROOT/'assets/brand'/path]
    for candidate in candidates:
        if candidate.is_file(): return candidate.resolve()
    raise ValueError('Brand outro is missing: '+name+'. Supply it or explicitly disable brand.outro.enabled.')
