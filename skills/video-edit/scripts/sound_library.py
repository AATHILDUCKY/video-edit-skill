"""Resolve the bundled, credited sound palette without regenerating samples per edit."""
from pathlib import Path
import hashlib
import json
from common import number

ROOT=Path(__file__).resolve().parents[1]/'assets/sfx'

def catalog():
    raw=json.loads((ROOT/'catalog.json').read_text())
    return {item['id']:item for item in raw['assets']}

def resolve(event):
    name=event.get('asset');library=catalog()
    if name not in library:raise ValueError('Unknown bundled sound asset: '+str(name))
    if event.get('file') or event.get('type'):raise ValueError('A bundled sound event uses asset instead of file/type.')
    item=library[name];path=ROOT/item['file']
    if not path.resolve().is_relative_to(ROOT.resolve()):raise ValueError('Sound asset path leaves the library.')
    if hashlib.sha256(path.read_bytes()).hexdigest()!=item['sha256']:raise ValueError('Sound asset fingerprint changed: '+name)
    at=number(event['at'],'sound at',0);gain=number(event.get('gain',item['recommended_gain']),'sound gain',0,1)
    # Library event at denotes the designed sync point; external files keep onset semantics.
    return dict(file=str(path),asset=name,at=round(at-item['anchor_seconds'],6),event_at=at,
        gain=gain,pre_normalized=True,credit={k:item[k] for k in ['title','author','license','source_url','sha256']})
