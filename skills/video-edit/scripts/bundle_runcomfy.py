#!/usr/bin/env python3
"""Add reviewed RunComfy companions from a local clone to the pinned offline bundle."""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import zipfile
from install_bundle import PACKAGE,skill_files,tree_hash,unpack

REPO='prime-skills/runcomfy-agent-skills'
NAMES={'video-edit':'runcomfy-video-edit','runcomfy-cli':'runcomfy-cli'}

def bundle(repo,package=PACKAGE):
    repo=Path(repo).resolve();package=Path(package).resolve()
    commit=subprocess.check_output(['git','-C',str(repo),'rev-parse','HEAD'],text=True).strip()
    dirty=subprocess.check_output(['git','-C',str(repo),'status','--porcelain','--','video-edit','runcomfy-cli','LICENSE','README.md'],text=True)
    if dirty.strip():raise ValueError('Review and commit upstream source changes before pinning this snapshot.')
    license_file=repo/'LICENSE'
    if not license_file.is_file():raise ValueError('The upstream license is missing.')
    lock_path=package/'dependencies.lock.json';lock=json.loads(lock_path.read_text());items=[]
    with tempfile.TemporaryDirectory(prefix='video-edit-runcomfy-bundle-') as temp:
        stage=Path(temp);unpack(package,stage)
        for original,name in NAMES.items():
            source=repo/original;target=stage/name
            if not (source/'SKILL.md').is_file():raise ValueError('Missing upstream skill: '+original)
            # Reject symlinks and keep the source fingerprint distinct from the adapted skill.
            source_hash=tree_hash(source)
            if target.exists():shutil.rmtree(target)
            shutil.copytree(source,target/'references',ignore=shutil.ignore_patterns('.git','__pycache__','*.pyc'))
            (target/'references/SKILL.md').rename(target/'references/upstream.md')
            shutil.copy2(package/'assets/companion-wrappers'/(name+'.md'),target/'SKILL.md')
            shutil.copy2(license_file,target/'LICENSE.txt')
            items.append(dict(name=name,path=original,upstream_name=original,upstream_sha256=source_hash,
                adaptation='Namespaced local integration wrapper; complete upstream instructions in references/upstream.md; original MIT license retained.',
                sha256=tree_hash(target),files=sum(1 for _ in skill_files(target))))
        entry=dict(repo=REPO,url='https://github.com/'+REPO,commit=commit,skills=items)
        lock['repositories']=[r for r in lock['repositories'] if r['repo']!=REPO]+[entry]
        payload=package/lock['payload']['file']
        candidate=stage/'companions.zip'
        names=[s['name'] for r in lock['repositories'] for s in r['skills']]+[s['name'] for s in lock.get('local_companions',[])]
        with zipfile.ZipFile(candidate,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as archive:
            for name in sorted(names):
                for file in skill_files(stage/name):
                    info=zipfile.ZipInfo((Path(name)/file.relative_to(stage/name)).as_posix(),date_time=(1980,1,1,0,0,0))
                    info.compress_type=zipfile.ZIP_DEFLATED;info.create_system=3;info.external_attr=0o100644<<16
                    archive.writestr(info,file.read_bytes())
        with zipfile.ZipFile(candidate) as archive:
            if archive.testzip() is not None:raise ValueError('The rebuilt archive failed its CRC check.')
        lock['payload']['sha256']=hashlib.sha256(candidate.read_bytes()).hexdigest()
        shutil.copy2(candidate,payload)
        lock_path.write_text(json.dumps(lock,indent=2)+'\n')
    notices=package/'assets/companion-notices/runcomfy-agent-skills';notices.mkdir(exist_ok=True)
    for name in ['LICENSE','README.md']:shutil.copy2(repo/name,notices/name)
    (notices/'PROVENANCE.json').write_text(json.dumps(entry,indent=2)+'\n')
    # Validate the complete new payload before reporting success.
    with tempfile.TemporaryDirectory(prefix='video-edit-runcomfy-check-') as temp:unpack(package,Path(temp))
    print(json.dumps({'repo':REPO,'commit':commit,'added_skills':[i['name'] for i in items],'companions':len(names)},indent=2))

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--repo',required=True,type=Path)
    bundle(parser.parse_args().repo)
