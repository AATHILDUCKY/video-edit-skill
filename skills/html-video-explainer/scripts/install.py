#!/usr/bin/env python3
"""Install this skill and its pinned session-story companion locally; run no setup hooks."""
import argparse
from datetime import datetime, timezone
import filecmp
import hashlib
import json
import os
from pathlib import Path
import shutil
import stat
import sys
import tempfile
import zipfile

SOURCE=Path(__file__).resolve().parents[1]
NAME='html-video-explainer'

def files(root):
    return [p for p in root.rglob('*') if p.is_file() and '__pycache__' not in p.parts and p.suffix!='.pyc']

def identical(source,target):
    return target.is_dir() and all((target/p.relative_to(source)).is_file() and filecmp.cmp(p,target/p.relative_to(source),shallow=False) for p in files(source))

def unpack_companions(scratch):
    lock=json.loads((SOURCE/'companions.lock.json').read_text())
    if lock.get('version')!=1:raise ValueError('Unsupported companion manifest.')
    result=[];seen=set()
    for spec in lock['companions']:
        name=spec['name']
        if name!='session-story' or name in seen:raise ValueError('Unexpected or duplicate companion: '+str(name))
        seen.add(name);archive=(SOURCE/spec['archive']).resolve()
        if not archive.is_relative_to(SOURCE) or not archive.is_file():raise ValueError('Companion archive missing or outside package.')
        if hashlib.sha256(archive.read_bytes()).hexdigest()!=spec['sha256']:raise ValueError('Companion checksum mismatch: '+name)
        root=scratch/name;root.mkdir()
        with zipfile.ZipFile(archive) as z:
            entries=z.infolist()
            if len(entries)>200 or sum(entry.file_size for entry in entries)>15000000:raise ValueError('Unexpected companion archive size.')
            for entry in entries:
                path=Path(entry.filename)
                if path.is_absolute() or '..' in path.parts or not path.parts or path.parts[0]!=name or stat.S_ISLNK(entry.external_attr>>16):raise ValueError('Unsafe companion archive path.')
                relative=Path(*path.parts[1:])
                if not relative.parts:continue
                destination=root/relative
                if entry.is_dir():destination.mkdir(parents=True,exist_ok=True)
                else:destination.parent.mkdir(parents=True,exist_ok=True);destination.write_bytes(z.read(entry))
        if not (root/'SKILL.md').is_file() or not (root/'LICENSE').is_file():raise ValueError('Companion skill or license is incomplete.')
        # Keep upstream code/workflow intact; normalize its description placeholder for Codex's metadata validator.
        entry=root/'SKILL.md';original=entry.read_text();parts=original.split('---',2)
        if len(parts)==3 and '<name>' in parts[1]:
            (root/'UPSTREAM-SKILL.md.txt').write_text(original)
            parts[1]=parts[1].replace('<name>','the user')
            notice='\n<!-- Installation compatibility note: only the frontmatter description placeholder was normalized; the original is in UPSTREAM-SKILL.md.txt. Workflow unchanged. -->\n'
            entry.write_text('---'+parts[1]+'---'+notice+parts[2])
            provenance=root/'UPSTREAM.json';record=json.loads(provenance.read_text())
            record['installation_compatibility']='Description placeholder <name> normalized to the user for Codex metadata validation. Exact original saved as UPSTREAM-SKILL.md.txt; workflow unchanged.'
            provenance.write_text(json.dumps(record,indent=2)+'\n')
        result.append((root,name))
    if 'session-story' not in seen:raise ValueError('Required session-story companion is missing.')
    return result

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--agent',choices=['codex','shared','claude','cursor'],default='codex')
    parser.add_argument('--target',type=Path,help='Exact main skill destination; companion installs beside it.')
    parser.add_argument('--replace',action='store_true',help='Back up differing installed copies before updating.')
    parser.add_argument('--dry-run',action='store_true')
    args=parser.parse_args();home=Path.home()
    roots={'codex':Path(os.environ.get('CODEX_HOME',str(home/'.codex')))/'skills','shared':home/'.agents/skills','claude':home/'.claude/skills','cursor':home/'.cursor/skills'}
    target=args.target.expanduser().resolve() if args.target else (roots[args.agent]/NAME).resolve()
    if target!=SOURCE and target.is_relative_to(SOURCE):parser.error('Destination cannot be nested inside the source skill.')
    if target.name=='session-story':parser.error('Main destination cannot use the companion name.')
    with tempfile.TemporaryDirectory(prefix='html-video-companions-') as temporary:
        pairs=[(SOURCE,target)]+[(source,target.parent/name) for source,name in unpack_companions(Path(temporary))]
        changes=[]
        for source,destination in pairs:
            if destination==source or identical(source,destination):
                print('Already installed: '+str(destination));continue
            if destination.exists() and not args.replace and not args.dry_run:parser.error(f'Destination already exists: {destination}. Use --replace to keep a backup and update both skills.')
            changes.append((source,destination))
        if args.dry_run:
            for _,destination in changes:print('Would install: '+str(destination))
            print('Copies skill files only. No npm setup, history reads, or network calls.');return
        if not changes:return
        target.parent.mkdir(parents=True,exist_ok=True)
        stage=Path(tempfile.mkdtemp(prefix='.html-video-install-',dir=target.parent));backups=[];installed=[]
        try:
            for index,(source,_) in enumerate(changes):shutil.copytree(source,stage/str(index),ignore=shutil.ignore_patterns('__pycache__','*.pyc'))
            for index,(_,destination) in enumerate(changes):
                if destination.exists():
                    backup_root=target.parent.parent/'skill-backups' if target.parent.name=='skills' else target.parent/'.skill-backups';backup_root.mkdir(parents=True,exist_ok=True)
                    backup=backup_root/(destination.name+'-'+datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S%f'));destination.rename(backup);backups.append((destination,backup))
                (stage/str(index)).rename(destination);installed.append(destination)
        except Exception:
            for destination in reversed(installed):shutil.rmtree(destination)
            for destination,backup in reversed(backups):
                if not destination.exists():backup.rename(destination)
            raise
        finally:shutil.rmtree(stage,ignore_errors=True)
        for destination in installed:print('Installed: '+str(destination))
        for _,backup in backups:print('Previous copy kept at: '+str(backup))
        print('Both skill packages are available. Reload skills or start a new session. Companion runtime setup remains manual.')

if __name__=='__main__':
    try:main()
    except (OSError,ValueError,KeyError,zipfile.BadZipFile) as error:print('Install failed: '+str(error),file=sys.stderr);sys.exit(1)
