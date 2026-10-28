"""Offline, pinned skill installation. Never executes upstream package scripts."""
from __future__ import annotations
import argparse
from datetime import datetime,timezone
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import stat
import sys
import tempfile
import zipfile

PACKAGE=Path(__file__).resolve().parents[1]

def skill_files(root):
    for file in sorted(Path(root).rglob('*')):
        if '.git' in file.parts or '__pycache__' in file.parts or file.suffix=='.pyc':continue
        if file.is_symlink():raise ValueError('Skill tree contains a symbolic link: '+str(file))
        if file.is_file():yield file

def tree_hash(root):
    digest=hashlib.sha256()
    for file in skill_files(root):
        digest.update(file.relative_to(root).as_posix().encode()+b'\0'+hashlib.sha256(file.read_bytes()).digest())
    return digest.hexdigest()

def manifest(package=PACKAGE):
    lock=json.loads((package/'dependencies.lock.json').read_text())
    if lock.get('version')!=1:raise ValueError('Unsupported skill-bundle version.')
    items=[s for repo in lock['repositories'] for s in repo['skills']]+lock.get('local_companions',[])
    names=[item['name'] for item in items]
    if len(names)!=len(set(names)) or any(not re.fullmatch('[a-z0-9][a-z0-9-]*',name) or name=='video-edit' for name in names):
        raise ValueError('Bundle skill names must be unique safe directory names.')
    return lock,items

def companion_status(dest,package=PACKAGE):
    _,items=manifest(package);dest=Path(dest).expanduser().resolve()
    missing=[];different=[]
    for item in items:
        folder=dest/item['name']
        if not (folder/'SKILL.md').is_file():missing.append(item['name'])
        elif tree_hash(folder)!=item['sha256']:different.append(item['name'])
    return {'expected':len(items),'missing':missing,'different':different,'available':len(items)-len(missing),'skills_directory':str(dest)}

def unpack(package,stage):
    lock,items=manifest(package)
    payload=package/lock['payload']['file']
    if not payload.resolve().is_relative_to(package.resolve()):raise ValueError('Invalid bundle payload path.')
    if hashlib.sha256(payload.read_bytes()).hexdigest()!=lock['payload']['sha256']:
        raise ValueError('Companion archive fingerprint mismatch. Restore the package before installing.')
    names={item['name'] for item in items}
    with zipfile.ZipFile(payload) as archive:
        entries=archive.infolist()
        if sum(e.file_size for e in entries)>128*1024*1024:raise ValueError('Unexpectedly large skill archive.')
        for entry in entries:
            path=Path(entry.filename)
            if path.is_absolute() or '..' in path.parts or not path.parts or path.parts[0] not in names or stat.S_ISLNK(entry.external_attr>>16):
                raise ValueError('Unsupported companion archive entry: '+entry.filename)
        archive.extractall(stage)
    for item in items:
        folder=stage/item['name']
        if not (folder/'SKILL.md').is_file() or tree_hash(folder)!=item['sha256']:
            raise ValueError('Skill fingerprint mismatch: '+item['name'])
    return items

def destinations(args):
    if args.dest:return [Path(args.dest).expanduser().resolve()]
    paths=[]
    for agent in args.agent or ['codex']:
        if agent=='codex':path=Path(os.environ.get('CODEX_HOME',str(Path.home()/'.codex')))/'skills'
        else:path=Path(os.environ.get('XDG_CONFIG_HOME',str(Path.home()/'.config')))/'opencode/skills'
        path=path.expanduser().resolve()
        if path not in paths:paths.append(path)
    return paths

def install(dest_roots,replace=False,companions_only=False,check=False,package=PACKAGE,keep_existing=False):
    """Preflight all destinations before modifying anything. Back up replacements."""
    package=Path(package).resolve();results=[]
    with tempfile.TemporaryDirectory(prefix='video-edit-companions-') as scratch:
        stage=Path(scratch);items=unpack(package,stage)
        sources=[(item['name'],stage/item['name'],item['sha256']) for item in items]
        if not companions_only:sources.insert(0,('video-edit',package,tree_hash(package)))
        changes=[];conflicts=[]
        for dest in map(Path,dest_roots):
            for name,source,digest in sources:
                target=dest/name
                if target.is_symlink() or (target.exists() and not target.is_dir()):raise ValueError('Destination is not a normal directory: '+str(target))
                exists=target.exists()
                if exists and tree_hash(target)==digest:results.append({'status':'unchanged','path':str(target)});continue
                if exists and keep_existing and not check:
                    results.append({'status':'kept-custom','path':str(target)});continue
                if exists and not replace:conflicts.append(str(target))
                changes.append((dest,name,source,exists))
        if check:
            results += [{'status':'different' if exists else 'missing','path':str(dest/name)} for dest,name,_,exists in changes]
            return results,0 if not changes else 1
        if conflicts:raise ValueError('Existing skills differ; preserved without changes. Use --replace to back them up and replace:\n'+'\n'.join(conflicts))
        for dest,name,source,exists in changes:
            dest.mkdir(parents=True,exist_ok=True)
            with tempfile.TemporaryDirectory(prefix='.video-edit-stage-',dir=dest) as temp:
                local=Path(temp);candidate=local/'new'
                shutil.copytree(source,candidate,ignore=shutil.ignore_patterns('__pycache__','*.pyc','.git'))
                if exists:
                    backup_dir=dest/'.video-edit-backups';backup_dir.mkdir(exist_ok=True)
                    stamp=datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
                    backup=backup_dir/(name+'-'+stamp+'.zip')
                    with zipfile.ZipFile(backup,'w',zipfile.ZIP_DEFLATED) as archive:
                        for file in skill_files(dest/name):archive.write(file,Path(name)/file.relative_to(dest/name))
                    previous=local/'previous';os.replace(dest/name,previous)
                    try:os.replace(candidate,dest/name)
                    except BaseException:
                        os.replace(previous,dest/name);raise
                    results.append({'status':'updated','path':str(dest/name),'backup':str(backup)})
                else:
                    os.replace(candidate,dest/name);results.append({'status':'installed','path':str(dest/name)})
    return results,0

def main(argv=None):
    parser=argparse.ArgumentParser(description=__doc__)
    group=parser.add_mutually_exclusive_group()
    group.add_argument('--agent',choices=['codex','opencode'],action='append',help='May repeat; defaults to Codex.')
    group.add_argument('--dest',help='Custom agent skills directory.')
    conflict=parser.add_mutually_exclusive_group()
    conflict.add_argument('--replace',action='store_true',help='Back up differing installed skills before replacing them.')
    conflict.add_argument('--keep-existing',action='store_true',help='Preserve differing local skills while installing missing ones.')
    parser.add_argument('--companions-only',action='store_true',help='Install companions beside an existing video-edit copy.')
    parser.add_argument('--check',action='store_true',help='Read-only status; exit 1 if anything is missing or differs.')
    parser.add_argument('--quiet',action='store_true',help='Print changes and summary; omit unchanged entries.')
    args=parser.parse_args(argv)
    try:
        results,code=install(destinations(args),args.replace,args.companions_only,args.check,keep_existing=args.keep_existing)
        for result in results:
            if args.quiet and result['status']=='unchanged':continue
            print(result['status']+': '+result['path'])
            if result.get('backup'):print('  backup: '+result['backup'])
        kept=sum(r['status']=='kept-custom' for r in results)
        summary='installation needed.' if code else (f'complete; {kept} custom copies preserved.' if kept else 'bundle matches.')
        print(f'{len(results)} skill checks; '+summary)
        return code
    except (ValueError,OSError,zipfile.BadZipFile,KeyError) as exc:
        print('video-edit installer: '+str(exc),file=sys.stderr);return 2

if __name__=='__main__':raise SystemExit(main())
