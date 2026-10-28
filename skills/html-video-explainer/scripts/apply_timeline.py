#!/usr/bin/env python3
"""Compile explicit scene windows into a project's editable storyboard."""
import argparse
import copy
import json
import math
from pathlib import Path

def assignment(path):
    return json.JSONDecoder().raw_decode(path.read_text().split('=',1)[1].lstrip())[0]

def finite(value):
    return isinstance(value,(int,float)) and not isinstance(value,bool) and math.isfinite(value)

def compile_plan(plan, existing, allow_auto_fit=False, reset_captions=False):
    duration=plan.get('duration');shots=plan.get('scenes')
    if not finite(duration) or not 1<=duration<=600:raise ValueError('Plan duration must be 1–600 seconds.')
    if not isinstance(shots,list) or not shots:raise ValueError('Provide a non-empty scenes array.')
    previous=0;seen=set();compiled=[];old={s['kind']:s for s in existing['scenes']}
    for index,shot in enumerate(shots):
        kind=shot.get('kind',shot.get('id'));start=shot.get('start');end=shot.get('end')
        if not isinstance(kind,str) or not kind or kind in seen:raise ValueError('Each scene needs a unique kind/id.')
        if not finite(start) or not finite(end) or end<=start or abs(start-previous)>.000001 or end>duration+.000001:raise ValueError(f'{kind}: scene windows must cover 0–duration without gaps or overlaps. Add an explicit hold for an intended gap.')
        if not isinstance(shot.get('title'),str) or not isinstance(shot.get('voice',''),str):raise ValueError(f'{kind}: use text for title/voice.')
        seen.add(kind);length=end-start;preset=shot.get('preset',kind);reference=old.get(preset,{})
        motion=shot.get('motionDuration',reference.get('motionDuration',reference.get('duration',length)))
        if not finite(motion) or motion<=0:raise ValueError(f'{kind}: positive motionDuration required.')
        result={'kind':kind,'duration':length,'motionDuration':motion,'title':shot['title'],'emphasis':shot.get('emphasis',''),'voice':shot.get('voice',''),
                'cue':shot.get('cue','Scene-timed sound'),'audio':copy.deepcopy(shot.get('audio',[]))}
        if not isinstance(result['emphasis'],str) or not isinstance(result['audio'],list):raise ValueError(f'{kind}: invalid emphasis/audio.')
        if preset!=kind:result['visual']={'preset':preset}
        if isinstance(shot.get('visual'),dict):result['visual']={**result.get('visual',{}),**shot['visual']}
        if 'typing' in shot:result['typing']=copy.deepcopy(shot['typing'])
        elif reference.get('typing'):
            ratio=length/reference['duration'];result['typing']={key:reference['typing'][key]*ratio for key in ['start','end']}
        for event in result['audio']:
            if not isinstance(event,dict) or not finite(event.get('at')) or not 0<=event['at']<length or event.get('type') not in ['impact','whoosh','click','tick','pop','ping','chime']:raise ValueError(f'{kind}: invalid scene-relative sound event.')
        if result.get('typing'):
            window=result['typing']
            if not finite(window.get('start')) or not finite(window.get('end')) or not 0<=window['start']<window['end']<=length:raise ValueError(f'{kind}: typing must be inside this shot.')
        beats=shot.get('beats',[])
        if not isinstance(beats,list):raise ValueError(f'{kind}: beats must be an array.')
        for beat in beats:
            if not isinstance(beat,dict) or not finite(beat.get('at')) or not 0<=beat['at']<length or not isinstance(beat.get('action'),str):raise ValueError(f'{kind}: beats need local at/action inside the shot.')
        if beats:result['beats']=copy.deepcopy(beats)
        compiled.append(result);previous=end
    if abs(previous-duration)>.000001:raise ValueError('The last scene must end at the plan duration.')
    config=copy.deepcopy(existing)
    if 'captionStyle' in plan:
        if not isinstance(plan['captionStyle'],dict):raise ValueError('captionStyle must be an object.')
        config['captionStyle']={**config.get('captionStyle',{}),**plan['captionStyle']}
    overrides=copy.deepcopy(config.get('captionStyles',{}))
    for shot in shots:
        if 'captionStyle' in shot:
            if not isinstance(shot['captionStyle'],dict):raise ValueError('Scene captionStyle must be an object.')
            overrides['scene-'+shot.get('kind',shot.get('id'))]=copy.deepcopy(shot['captionStyle'])
    config['captionStyles']=overrides
    captions=copy.deepcopy(existing.get('captionCues'))
    if reset_captions:captions=None
    elif isinstance(captions,list):
        previous_duration=existing.get('targetDuration') or sum(s['duration'] for s in existing['scenes'])
        captions=[{**cue,'start':cue['start']*duration/previous_duration,'end':cue['end']*duration/previous_duration} for cue in captions]
    config.update(scenes=compiled,targetDuration=duration,sceneWeights=None,captionCues=captions,cameraFollowsSpeed=False,autoFitVideo=allow_auto_fit,timingMode='relative' if allow_auto_fit else 'absolute')
    return config

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('project',type=Path);parser.add_argument('timeline',type=Path)
    parser.add_argument('--allow-auto-fit',action='store_true',help='Allow uploads to proportionally retime the explicit windows; use only when requested.')
    parser.add_argument('--reset-captions',action='store_true',help='Explicitly replace custom captions with captions from the new script.')
    args=parser.parse_args();root=args.project.resolve()
    try:
        plan=json.loads(args.timeline.read_text());config_path=root/'assets/codex/template.js'
        config=compile_plan(plan,assignment(config_path),args.allow_auto_fit,args.reset_captions)
        project=json.loads((root/'video.project.json').read_text())
        if 'images' in plan:
            if not isinstance(plan['images'],dict):raise ValueError('images must map asset keys to local paths.')
            for name in plan['images'].values():
                image=(root/name).resolve()
                if not image.is_relative_to(root) or not image.is_file():raise ValueError('Every image must exist inside the project: '+str(name))
            project['images']=plan['images']
        recorded=copy.deepcopy(plan);recorded['mode']='relative' if args.allow_auto_fit else 'absolute'
        config_path.write_text('window.CODEX_SHORT_TEMPLATE = '+json.dumps(config,ensure_ascii=False,indent=2)+';\n')
        (root/'timeline.json').write_text(json.dumps(recorded,ensure_ascii=False,indent=2)+'\n')
        project['timeline']='timeline.json';(root/'video.project.json').write_text(json.dumps(project,indent=2)+'\n')
        print(f'Applied {len(config["scenes"])} scenes at exact times, total {config["targetDuration"]:g}s.')
        print('Next: implement each visual and beat in concept.js, rebuild sound/media, export script, and validate. Existing custom captions are retained unless --reset-captions was requested.')
    except (OSError,ValueError,KeyError,TypeError) as error:parser.error(str(error))

if __name__=='__main__':main()
