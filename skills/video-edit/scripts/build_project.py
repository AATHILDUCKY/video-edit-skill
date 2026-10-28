"""Build a reusable HTML editor and cut camera footage from a reviewed edit decision list."""
from __future__ import annotations
import html
import json
import re
from pathlib import Path
import shutil
import sys
from common import ffmpeg, number, read_json, run, probe, sha256, write_json, write_srt
from timeline import caption_chunks, keyword_index, mapped_keyword_index, remap_transcript, validate_plan

SKILL=Path(__file__).resolve().parents[1]


def build_project(analysis, plan_path, output, draft=False):
    analysis,plan_path,output=Path(analysis).resolve(),Path(plan_path).resolve(),Path(output).resolve()
    if output==SKILL or output.is_relative_to(SKILL):
        raise ValueError('Build projects outside the skill package.')
    if output.exists() and any(output.iterdir()):
        raise ValueError('Refusing a non-empty output folder. Build a new revision to preserve existing edits.')
    meta=read_json(analysis/'source.json');transcript=read_json(analysis/'transcript.json');plan=read_json(plan_path)
    if plan.get('source_sha256')!=meta['source_sha256']:
        raise ValueError('The edit plan belongs to a different source. Check the source fingerprint.')
    if meta.get('canonical_sha256') and sha256(analysis/'source.mp4')!=meta['canonical_sha256']:
        raise ValueError('The normalized source changed after transcription. Analyze it again.')
    mappings,duration=validate_plan(plan,transcript,allow_draft=draft)
    from branding import load_brand, outro_path
    brand=load_brand(plan.get('brand',{}))
    ending=outro_path(brand,plan_path.parent) if plan.get('outro',True) else None
    fps=plan.get('fps',30)
    if fps not in [24,25,30,50,60]:raise ValueError('Choose an output fps of 24, 25, 30, 50 or 60.')
    number(plan.get('top_percent',50),'top_percent',30,70)
    if not re.fullmatch(r'#[0-9a-fA-F]{6}',plan.get('accent',brand['accent'])):raise ValueError('Accent needs a six-digit hex color.')
    mapped=remap_transcript(transcript,mappings);captions=caption_chunks(mapped,**brand['caption_chunking'])
    if len(captions)>250:raise ValueError('This short has more than 250 caption blocks. Select a tighter excerpt.')
    shutil.copytree(SKILL/'assets/editor',output,dirs_exist_ok=True)
    (output/'media').mkdir();(output/'evidence').mkdir()
    for name in ['source.json','transcript.json','transcript-review.json','keywords.json','keywords.csv','silence-candidates.json']:
        if (analysis/name).is_file():shutil.copy2(analysis/name,output/'evidence'/name)
    write_json(output/'brand.json',brand)
    write_json(output/'edit-plan.json',plan);write_json(output/'source-to-edit.json',mappings)
    write_json(output/'captions.json',captions);write_srt(output/'captions.srt',captions)
    write_json(output/'transcript-edited.json',dict(duration=duration,language=transcript['language'],segments=mapped))
    index=read_json(analysis/'keywords.json') if (analysis/'keywords.json').exists() else keyword_index(transcript)
    write_json(output/'keywords-edited.json',mapped_keyword_index(index,mappings))
    (output/'transcript-edited.txt').write_text(' '.join(s['text'] for s in mapped)+'\n',encoding='utf-8')
    filters=[];vlabels=''.join(f'[vin{i}]' for i in range(len(mappings)));alabels=''.join(f'[ain{i}]' for i in range(len(mappings)))
    filters += [f'[0:v]split={len(mappings)}{vlabels}',f'[0:a]asplit={len(mappings)}{alabels}']
    for i,m in enumerate(mappings):
        length=m['source_end']-m['source_start']
        filters.append(f'[vin{i}]trim=start={m["source_start"]:.9f}:end={m["source_end"]:.9f},setpts=PTS-STARTPTS[v{i}]')
        filters.append(f'[ain{i}]atrim=start={m["source_start"]:.9f}:end={m["source_end"]:.9f},asetpts=PTS-STARTPTS,afade=t=in:d=0.005,afade=t=out:st={max(0,length-.005):.9f}:d=0.005[a{i}]')
    filters.append(''.join(f'[v{i}][a{i}]' for i in range(len(mappings)))+f'concat=n={len(mappings)}:v=1:a=1[video][speech]')
    filters.append('[speech]loudnorm=I=-16:TP=-1.5:LRA=11,apad,atrim=duration='+str(duration)+'[audio]')
    filter_file=output/'evidence/cut-filter.txt';filter_file.write_text(';\n'.join(filters),encoding='utf-8')
    ffmpeg('-y','-i',analysis/'source.mp4','-filter_complex_script',filter_file,'-map','[video]','-map','[audio]',
           '-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-r',str(fps),'-fps_mode','cfr','-c:a','aac','-b:a','192k','-ar','48000',
           '-t',str(duration),'-movflags','+faststart',output/'media/camera-edited.mp4')
    content_duration=duration
    outro=None
    if ending:
        details=probe(ending);length=round(details['duration']*fps)/fps
        if length<=0 or content_duration+length>600: raise ValueError('Invalid outro duration.')
        args=['-y','-i',ending]
        if not details['has_audio']: args+=['-f','lavfi','-i','anullsrc=r=48000:cl=stereo']
        args+=['-map','0:v:0','-map','0:a:0' if details['has_audio'] else '1:a:0','-vf',f'scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1,fps={fps}',
               '-af','apad','-t',str(length),'-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-r',str(fps),'-fps_mode','cfr','-c:a','aac','-ar','48000','-ac','2','-movflags','+faststart',output/'media/outro.mp4']
        ffmpeg(*args)
        outro=dict(file='media/outro.mp4',start=content_duration,duration=length,sha256=sha256(ending))
        duration=round(content_duration+length,6)
    core=output/'assets/codex';config_path=core/'template.js' 
    config=json.loads(config_path.read_text().split('=',1)[1].strip().rstrip(';'))
    config.update(name=plan['title'],creator=plan.get('creator',brand['creator']),accent=plan.get('accent',brand['accent']),
                  palette='custom',contentVersion=1,scenes=[],targetDuration=duration,sceneWeights=None,captionCues=captions,
                  captionStyles={},autoFitVideo=False,cameraFollowsSpeed=False,timingMode='absolute',transcriptMode=True,
                  keyboardSound=brand['keyboard_sound'],sfxVolume=brand['sfx_volume'],musicVolume=plan.get('music_volume',brand['music_volume']),cameraAudio=True,cameraVolume=brand.get('camera_volume',1),insertVolume=brand.get('insert_volume',1),
                  topPercent=plan.get('top_percent',brand['top_percent']),promptText='')
    config.update(brand=brand,motionIntensity=brand['motion_intensity'],outro=outro,contentDuration=content_duration,fps=fps,safeArea=brand.get('safe_area',{}))
    if brand.get('frame'): config['frame'].update(brand['frame'])
    config['captionStyle'].update(brand['caption_style'])
    if plan.get('caption_style'):config['captionStyle'].update(plan['caption_style'])
    visual_credits=[]
    for scene in plan['scenes']:
        item=dict(kind=scene['id'],duration=round(scene['end']-scene['start'],6),title=scene['title'],emphasis=scene.get('subtitle',''),
                  preset=scene.get('preset','keyword'),labels=scene.get('labels',[]),
                  voice=' '.join(c['text'] for c in captions if c['start']>=scene['start'] and c['start']<scene['end']),
                  cue=scene.get('motion',''),audio=[])
        item['visual']={'preset':scene.get('preset','keyword'),'layout':scene.get('layout',brand['default_layout'])}
        if scene.get('broll'):
            asset=(plan_path.parent/scene['broll']).resolve();details=probe(asset)
            start=number(scene.get('broll_in',0),'broll_in',0)
            if not details['has_video'] or start+item['duration']>details['duration']+.02:
                raise ValueError('B-roll must cover the scene at original speed. Select a longer asset or shorten the visual.')
            name='broll-'+sha256(asset)[:16]+asset.suffix.lower()
            shutil.copy2(asset,output/'media'/name)
            item['visual'].update(video='media/'+name,videoIn=start,videoAudio=scene.get('broll_audio',True),videoVolume=scene.get('broll_volume',1))
            credit=scene['credit']
            if not isinstance(credit,dict) or not all(credit.get(k) for k in ['title','source_url','license']):
                raise ValueError('B-roll credit needs title, source_url and license (user-provided is valid).')
            visual_credits.append(dict(credit,file='media/'+name))
        if scene.get('typing'):item['typing']=scene['typing']
        if scene.get('image'):
            asset=(plan_path.parent/scene['image']).resolve()
            import base64,mimetypes
            mime=mimetypes.guess_type(asset.name)[0]
            if mime not in ['image/png','image/jpeg','image/webp'] or asset.stat().st_size>2_500_000:
                raise ValueError('Scene images must be PNG/JPEG/WebP smaller than 2.5MB. Resize the source image first.')
            item['visual'].update(image=f'data:{mime};base64,'+base64.b64encode(asset.read_bytes()).decode())
        for event in plan.get('sound',[]):
            if not event.get('file') and not event.get('asset') and scene['start']<=event['at']<scene['end']:
                item['audio'].append(dict(at=round(event['at']-scene['start'],6),type=event['type'],gain=event.get('gain',.15)))
        config['scenes'].append(item)
    if outro:
        config['scenes'].append(dict(kind='brand-outro',duration=outro['duration'],title='Follow along',emphasis='',voice='',audio=[],preset='keyword',visual={'preset':'keyword','layout':'outro','video':outro['file'],'videoIn':0}))
    config_path.write_text('window.CODEX_SHORT_TEMPLATE = '+json.dumps(config,ensure_ascii=False,indent=2)+';\n',encoding='utf-8')
    page=(output/'edit.html').read_text();page=re.sub(r'<title>.*?</title>','<title>'+html.escape(plan['title'])+' — video editor</title>',page,count=1)
    page=re.sub(r'<meta name="description" content="[^"]*">','<meta name="description" content="Editable video with transcript-timed captions">',page,count=1)
    page=page.replace('Use script captions','Reset transcript captions').replace('25 seconds',f'{duration:g} seconds')
    page=page.replace('17-second recording script','Transcript for this edit').replace('id="autoFitVideo" type="checkbox" checked','id="autoFitVideo" type="checkbox"')
    (output/'edit.html').write_text(page,encoding='utf-8')
    short=core/'short.js';code=short.read_text();code=re.sub(r'const storageKey = [^;]+;',lambda _: 'const storageKey = '+json.dumps('video-edit-'+sha256(config_path)[:12])+';',code,count=1);short.write_text(code)
    project={'title':plan['title'],'html':'edit.html','video':'final.mp4','camera':'media/camera-edited.mp4','images':{},
             'fps':fps,'duration':duration,'content_duration':content_duration,'outro':outro,'is_demo':not(plan.get('reviewed') and plan.get('visuals_authored'))}
    write_json(output/'video.project.json',project)
    # The agent may supply a custom time-driven scene module without editing packaged files.
    if plan.get('concept_js'):
        custom=(plan_path.parent/plan['concept_js']).resolve()
        if custom.suffix!='.js' or not custom.is_file():raise ValueError('concept_js needs an existing local JavaScript scene module.')
        shutil.copy2(custom,core/'concept.js')
    credits=[]
    write_json(output/'visual-assets.json',visual_credits)
    for i,event in enumerate(plan.get('sound',[])):
        if event.get('asset'):
            from sound_library import resolve
            event=resolve(event)
        if not event.get('file'):continue
        original=(plan_path.parent/event['file']).resolve();name=f'sfx-{i:03}'+original.suffix.lower()
        if not original.is_file():raise ValueError(f'Sound file is missing: {original}')
        shutil.copy2(original,output/'media'/name)
        credit=event['credit']
        if not isinstance(credit,dict) or not all(credit.get(k) for k in ['title','source_url','license']):
            raise ValueError('Sound credit needs title, source_url, license, and author when available.')
        credits.append(dict(credit,file='media/'+name,at=event['at'],event_at=event.get('event_at',event['at']),gain=event.get('gain',.15),pre_normalized=event.get('pre_normalized',False),asset=event.get('asset')))
    write_json(output/'sound-assets.json',credits)
    # Read-only asset fetchers are separate. Building never calls a cloud transcription API.
    run([sys.executable,output/'scripts/make-soundtrack.py'])
    if credits:
        from mix_assets import mix_assets
        mix_assets(output,credits,content_duration=content_duration,duck_db=brand.get('sfx_duck_db',6))
    run([sys.executable,output/'scripts/bundle-media.py'])
    (output/'SOURCES.md').write_text('# Sources\n\nUser-provided source video; provenance in evidence/source.json.\n\nManrope and Noto Sans Tamil (OFL), Lucide (ISC), and keyboard recording credits are retained in assets/codex. The Fieldnotes tactile collection contains credited Kenney CC0 derivatives; the older procedural collection is original CC0. sound-assets.json retains selected sample credits and fingerprints. Legacy synthesized effects use the bundled generator. Brand outro: user-provided insta-follow-2.mp4, fingerprint in video.project.json.\n\n'+''.join(f'- {x["title"]} — {x.get("author","author not supplied")} — {x["license"]} — {x["source_url"]}\n' for x in credits+visual_credits),encoding='utf-8')
    (output/'README.md').write_text(f'''# {plan['title']}

Run `npm run studio` and open the printed loopback URL; the packaged camera footage loads automatically. The source footage lasts {content_duration:g}s; the total with the brand outro is {duration:g}s. Use Visuals/Captions to edit; drag the divider to change the split. Save template preserves this edit. Save brand exports style only for new recordings. Project camera footage loads automatically beside the HTML.

For local rendering: `npm install`, `npx playwright install chromium`, then `npm run render`. This renderer automatically includes camera-edited.mp4, its original-speed speech, and the sound mix. Use `npm run preview:frames` first. A draft is not final: finish custom visuals, validate the plan, and set video.project.json is_demo to false only after reviewing the actual frames.

Changing the recording requires a new transcription/alignment; automatic clip fitting is disabled for this measured-caption project. Cosmetic caption edits preserve word times where possible; adding/removing words falls back to unhighlighted chunks until re-aligned.

The original file was not overwritten. Source-to-edit.json maps every kept clip. Captions.srt is in final edit time; evidence/transcript.json remains in source time. Inspect speech at each cut and uncertain ASR names before sharing.
''',encoding='utf-8')
    from usage_report import report_usage
    report_usage(output)
    print(f'Built {output}/edit.html ({duration:g}s, {len(captions)} timed captions).')
