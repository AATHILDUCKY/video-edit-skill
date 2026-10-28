#!/usr/bin/env python3
"""Prepare footage, transcribe locally, index keywords, draft plans and build editable reels."""
from __future__ import annotations
import argparse
import csv
import importlib.util
import json
import os
from pathlib import Path
import re
import sys
from common import executable, ffmpeg, probe, read_json, run, sha256, write_json, write_srt
from timeline import caption_chunks, keyword_index, normalize_transcript, validate_plan


def prepare(source, output, fps=30):
    source, output = Path(source).expanduser().resolve(), Path(output).expanduser().resolve()
    if output.exists() and any(output.iterdir()):
        raise ValueError('Analysis output must be a new or empty folder. Reuse an existing analysis with transcribe/keywords instead.')
    meta = probe(source)
    if not meta['has_video'] or meta['duration'] <= 0:
        raise ValueError('Input needs a decodable video stream with a known positive duration.')
    output.mkdir(parents=True, exist_ok=True)
    meta.update(source_sha256=sha256(source), timebase='seconds from the first original video frame', canonical_fps=fps)
    write_json(output/'source.json', meta)
    # Normalize VFR, SAR, rotation (FFmpeg autorotation), and stream offsets once.
    # Caption/cut times refer to this canonical source, whose first video frame is t=0.
    vf=f'scale=trunc(iw*sar/2)*2:trunc(ih/2)*2,setsar=1,fps={fps},setpts=PTS-STARTPTS'
    args=['-y','-i',source]
    if meta['has_audio']:
        offset=meta['audio_start']-meta['video_start']
        audio='asetpts=PTS-STARTPTS,aresample=48000'
        audio += f',adelay={round(offset*1000)}|{round(offset*1000)}' if offset>=0 else f',atrim=start={-offset:.9f},asetpts=PTS-STARTPTS'
        args+=['-map','0:v:0','-map','0:a:0','-af',audio+',apad']
    else:
        args+=['-f','lavfi','-i','anullsrc=r=48000:cl=stereo','-map','0:v:0','-map','1:a:0']
    args+=['-vf',vf,'-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p',
           '-r',str(fps),'-fps_mode','cfr','-c:a','aac','-b:a','192k','-ac','2','-t',str(meta['duration']),'-movflags','+faststart',output/'source.mp4']
    ffmpeg(*args)
    canonical=probe(output/'source.mp4')
    meta['canonical_duration']=canonical['duration'];meta['canonical_sha256']=sha256(output/'source.mp4');write_json(output/'source.json',meta)
    ffmpeg('-y','-i',output/'source.mp4','-vn','-ac','1','-ar','16000','-c:a','pcm_s16le',output/'speech.wav')
    # Full-duration extraction keeps the original timeline intact; never run ASR on concatenated VAD snippets here.
    silence=run([executable('ffmpeg'),'-hide_banner','-nostdin','-i',output/'speech.wav','-af',
                 'silencedetect=noise=-35dB:d=0.6','-f','null','-']).stderr
    gaps=[];start=None
    for line in silence.splitlines():
        match=re.search(r'silence_start: ([0-9.]+)',line)
        if match:start=float(match[1])
        match=re.search(r'silence_end: ([0-9.]+)',line)
        if match and start is not None:gaps.append(dict(start=start,end=float(match[1])));start=None
    if start is not None:gaps.append(dict(start=start,end=canonical['duration']))
    write_json(output/'silence-candidates.json',{'method':'energy threshold, not semantic VAD','threshold_db':-35,'gaps':gaps})
    frames=output/'frames';frames.mkdir()
    times=sorted(set([0.,canonical['duration']/4,canonical['duration']/2,canonical['duration']*.75,max(0,canonical['duration']-.1)]))
    for i,t in enumerate(times):
        ffmpeg('-y','-ss',str(t),'-i',output/'source.mp4','-frames:v','1','-vf','scale=480:-2',frames/f'{i:02}-{t:.2f}.jpg')
    write_json(output/'frames.json',[{'time':t,'file':f'frames/{i:02}-{t:.2f}.jpg'} for i,t in enumerate(times)])
    return output,meta


def transcribe(folder, model='small', language='ta', transcript=None, device='cpu', threads=4, glossary=None):
    folder=Path(folder).resolve();meta=read_json(folder/'source.json');duration=meta['canonical_duration']
    if transcript:
        raw=read_json(transcript)
    elif not meta['has_audio']:
        raw={'language':'none','segments':[],'timing_quality':'no audio'}
    else:
        try:
            from faster_whisper import WhisperModel
        except ImportError as exc:
            raise ValueError('Local transcription needs faster-whisper. Install requirements.txt in a virtual environment, or import a timed transcript with --transcript.') from exc
        engine=WhisperModel(model,device=device,compute_type='int8' if device=='cpu' else 'float16',cpu_threads=threads)
        segments,info=engine.transcribe(str(folder/'speech.wav'),language=None if language=='auto' else language,task='transcribe',initial_prompt=glossary,word_timestamps=True,
                                       vad_filter=True,beam_size=5,condition_on_previous_text=False)
        raw={'language':info.language,'language_probability':float(info.language_probability),
             'timing_quality':'ASR word estimates; review names and uncertain passages','model':model,'segments':[]}
        for seg in segments:
            raw['segments'].append({'start':seg.start,'end':seg.end,'text':seg.text.strip(),
                'words':[dict(start=w.start,end=w.end,word=w.word.strip(),probability=w.probability) for w in (seg.words or [])]})
    write_json(folder/'transcript-raw.json',raw)
    normalized=normalize_transcript(raw,duration);normalized['source_fps']=meta['canonical_fps'];write_json(folder/'transcript.json',normalized)
    (folder/'transcript.txt').write_text(normalized['text']+'\n',encoding='utf-8')
    write_srt(folder/'source-captions.srt',caption_chunks(normalized['segments']))
    issues=[]
    for seg in normalized['segments']:
        if seg['alignment_incomplete']:issues.append({'start':seg['start'],'end':seg['end'],'reason':'incomplete alignment','text':seg['text']})
        for word in seg['words']:
            if word['probability'] is not None and word['probability']<.45:issues.append(dict(word,reason='low ASR confidence'))
    write_json(folder/'transcript-review.json',{'language':normalized['language'],'language_probability':normalized['language_probability'],
               'needs_language_review':normalized['language'] not in ['en','English','none'], 'issues':issues,
               'note':'Confidence is not accuracy. Listen to names, numbers, negations and edits even when confidence is high.'})
    make_keywords(folder)
    return normalized


def make_keywords(folder, terms=None):
    folder=Path(folder).resolve();transcript=read_json(folder/'transcript.json')
    indexed=keyword_index(transcript,terms);write_json(folder/'keywords.json',indexed)
    with (folder/'keywords.csv').open('w',encoding='utf-8',newline='') as stream:
        writer=csv.DictWriter(stream,fieldnames=['term','source_start','source_end','precision','segment_id','context']);writer.writeheader()
        for item in indexed:
            for occurrence in item['occurrences']:writer.writerow(dict(term=item['term'],**occurrence))
    return indexed


def draft(folder, output, brand=None):
    folder=Path(folder).resolve();meta=read_json(folder/'source.json');transcript=read_json(folder/'transcript.json');duration=transcript['duration']
    # This is a planning aid. The agent supplies meaning, hook choice, visuals and kept takes.
    boundaries=[0.]
    for seg in transcript['segments']:
        if seg['start']-boundaries[-1]>=2 and seg['start']<duration-.5:boundaries.append(seg['start'])
    boundaries.append(duration)
    scenes=[]
    for i,(start,end) in enumerate(zip(boundaries,boundaries[1:])):
        relevant=[s['text'] for s in transcript['segments'] if s['start']<end and s['end']>start]
        scenes.append(dict(id=f'scene-{i:02}',start=round(start,4),end=round(end,4),title='Choose the visual idea',
                           preset='keyword',labels=[],evidence=' '.join(relevant),motion='Author short, content-driven visual beats; retire headlines once read and preserve the complete spoken meaning.'))
    plan=dict(version=1,reviewed=False,visuals_authored=False,title=Path(meta['path']).stem+' — edited',
              source_sha256=meta['source_sha256'],fps=meta['canonical_fps'],top_percent=50,accent='#D76A4E',creator='',
              clips=[dict(start=0,end=duration,reason='Full source retained until editorial review.')],scenes=scenes,sound=[],
              editorial_notes='Watch/listen before cutting. Review unchanged visual/title holds over about 2 seconds in energetic passages; retain context, qualifiers and complete speech. Source times belong to clips; scenes and sound use final output time.')
    from branding import load_brand
    profile=load_brand(brand)
    plan.update(brand=profile, creator=profile['creator'], accent=profile['accent'], caption_style=profile['caption_style'], top_percent=profile['top_percent'])
    for scene in plan['scenes']: scene['layout']=profile['default_layout']
    write_json(output,plan)


def doctor():
    report={'python':sys.version.split()[0],'tools':{},'modules':{}}
    for name in ['ffmpeg','ffprobe','node']:
        try:report['tools'][name]=executable(name)
        except ValueError:report['tools'][name]=None
    for name in ['faster_whisper','av','numpy','PIL']:
        report['modules'][name]=importlib.util.find_spec(name) is not None
    from install_bundle import companion_status
    skill_root=Path(__file__).resolve().parents[1]
    report['companion_skills']=companion_status(skill_root.parent)
    print(json.dumps(report,indent=2))


def main():
    parser=argparse.ArgumentParser(description=__doc__);sub=parser.add_subparsers(dest='command',required=True)
    sub.add_parser('doctor')
    context=sub.add_parser('context',help='Compact read-only source/cache/project status and focused companion routing.')
    context.add_argument('video',type=Path);context.add_argument('--analysis',type=Path);context.add_argument('--project',type=Path)
    context.add_argument('--motion',choices=['none','gsap','threejs','remotion'],default='none')
    context.add_argument('--cloud-runcomfy',action='store_true');context.add_argument('--skills-dir',type=Path)
    sounds=sub.add_parser('sounds',help='List bundled sound effects without reading the full catalogue.');sounds.add_argument('--id');sounds.add_argument('--category')
    analyze=sub.add_parser('analyze');analyze.add_argument('video',type=Path);analyze.add_argument('--out',type=Path,required=True)
    analyze.add_argument('--skip-asr',action='store_true');analyze.add_argument('--fps',type=int,choices=[24,25,30,50,60],default=30)
    trans=sub.add_parser('transcribe');trans.add_argument('analysis',type=Path)
    for p in [analyze,trans]:
        p.add_argument('--model',default='small');p.add_argument('--language',default='ta');p.add_argument('--glossary',help='Names and Tamil/English technical vocabulary as ASR context, not a replacement transcript.');p.add_argument('--transcript',type=Path)
        p.add_argument('--device',choices=['cpu','cuda'],default='cpu');p.add_argument('--threads',type=int,default=4)
    key=sub.add_parser('keywords');key.add_argument('analysis',type=Path);key.add_argument('--terms',help='Comma-separated phrases; omitted: frequency-based candidates.')
    plan=sub.add_parser('draft');plan.add_argument('analysis',type=Path);plan.add_argument('--out',type=Path,required=True);plan.add_argument('--brand',type=Path)
    check=sub.add_parser('validate');check.add_argument('analysis',type=Path);check.add_argument('plan',type=Path)
    build=sub.add_parser('build');build.add_argument('analysis',type=Path);build.add_argument('plan',type=Path);build.add_argument('--out',type=Path,required=True)
    build.add_argument('--draft',action='store_true',help='Build a working draft for authoring; final rendering remains blocked until reviewed.')
    usage=sub.add_parser('usage');usage.add_argument('project',type=Path)
    usage.add_argument('--input-tokens',type=int);usage.add_argument('--output-tokens',type=int)
    usage.add_argument('--cached-input-tokens',type=int);usage.add_argument('--source',default='unavailable')
    args=parser.parse_args()
    if args.command=='context':
        from edit_context import edit_context
        print(json.dumps(edit_context(args.video,args.analysis,args.project,args.motion,args.cloud_runcomfy,args.skills_dir),ensure_ascii=False,indent=2));return
    if args.command=='sounds':
        from sound_library import catalog,ROOT
        items=catalog()
        if args.id:
            if args.id not in items:raise ValueError('Unknown sound asset: '+args.id)
            print(json.dumps(items[args.id],ensure_ascii=False,indent=2));return
        for item in items.values():
            if not args.category or item['category'].casefold()==args.category.casefold():
                print(f"{item['id']:<18} {item['category']:<12} {item['duration']:.2f}s  gain {item['recommended_gain']:.2f}")
        print('Audition: '+str(ROOT/'index.html'));return
    if args.command=='usage':
        from usage_report import report_usage
        report_usage(args.project,args.input_tokens,args.output_tokens,args.cached_input_tokens,args.source)
        return
    if args.command=='doctor':doctor();return
    if args.command=='analyze':
        folder,meta=prepare(args.video,args.out,args.fps)
        if not args.skip_asr:transcribe(folder,args.model,args.language,args.transcript,args.device,args.threads,args.glossary)
        print(f'Analysis saved: {folder}');return
    if args.command=='transcribe':
        result=transcribe(args.analysis,args.model,args.language,args.transcript,args.device,args.threads,args.glossary)
        print(f'Transcribed {len(result["segments"])} segments; language={result["language"]}');return
    if args.command=='keywords':make_keywords(args.analysis,args.terms.split(',') if args.terms else None);print('Wrote keywords.json and keywords.csv');return
    if args.command=='draft':draft(args.analysis,args.out,args.brand);print(f'Editorial draft: {args.out}');return
    if args.command=='validate':
        mappings,duration=validate_plan(read_json(args.plan),read_json(args.analysis/'transcript.json'))
        print(json.dumps({'valid':True,'duration':duration,'clips':len(mappings)},indent=2));return
    if args.command=='build':
        from build_project import build_project
        build_project(args.analysis,args.plan,args.out,args.draft)


if __name__=='__main__':
    try:main()
    except (ValueError,RuntimeError,FileNotFoundError) as exc:
        print(f'video-edit: {exc}',file=sys.stderr);sys.exit(2)
