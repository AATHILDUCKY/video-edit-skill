"""Read-only, bounded context for an edit; no ASR, asset downloads or rendering."""
from pathlib import Path
from common import probe,read_json,sha256,within

ROUTES={
    'none':[],
    'gsap':['gsap-core','gsap-timeline'],
    'threejs':['threejs-fundamentals','threejs-lighting','threejs-animation'],
    'remotion':['remotion-best-practices','remotion-captions','remotion-render'],
}

def locate_video(path):
    path=Path(path).expanduser()
    if path.is_file():return path.resolve()
    matches=[p for p in path.parent.iterdir() if p.is_file() and p.name.casefold()==path.name.casefold()] if path.parent.is_dir() else []
    if len(matches)==1:return matches[0].resolve()
    if len(matches)>1:raise ValueError('Ambiguous video filename; use the exact filename and extension.')
    raise ValueError('Video not found: '+str(path))

def _json(path):
    return read_json(path) if path.is_file() else {}

def edit_context(video,analysis=None,project=None,motion='none',cloud=False,skills_dir=None):
    source=locate_video(video);fingerprint=sha256(source);meta=probe(source)
    stream=next((s for s in meta.get('raw',{}).get('streams',[]) if s.get('codec_type')=='video'),{})
    rotation=next((s['rotation'] for s in stream.get('side_data_list',[]) if 'rotation' in s),None)
    if motion not in ROUTES:raise ValueError('Unknown motion backend.')
    directory=Path(skills_dir).expanduser().resolve() if skills_dir else Path(__file__).resolve().parents[2]
    names=['video-processing-editing',*ROUTES[motion]]
    if cloud:names+=['runcomfy-video-edit','runcomfy-cli']
    report={'source':{'path':str(source),'sha256':fingerprint,'duration':meta['duration'],
        'width':meta['width'],'height':meta['height'],'fps':meta['fps'],'has_audio':meta['has_audio'],
        'rotation':rotation,'color_transfer':stream.get('color_transfer'),'color_primaries':stream.get('color_primaries')},
        'selected_skills':[{'name':name,'path':str(directory/name/'SKILL.md'),'installed':(directory/name/'SKILL.md').is_file()} for name in names],
        'next_action':'analyze_in_a_new_folder','analysis':None,'project':None}
    reusable=False
    if analysis:
        folder=Path(analysis).expanduser().resolve();saved=_json(folder/'source.json')
        original_matches=saved.get('source_sha256')==fingerprint if saved else False
        canonical=folder/'source.mp4';expected=saved.get('canonical_sha256')
        canonical_matches=bool(original_matches and expected and canonical.is_file() and sha256(canonical)==expected)
        transcript=folder/'transcript.json';audio=folder/'speech.wav'
        reusable=canonical_matches and transcript.is_file()
        report['analysis']={'path':str(folder),'source_matches':original_matches,'canonical_matches':canonical_matches,
            'audio_available':audio.is_file(),'transcript_available':transcript.is_file(),'reusable':reusable}
        if original_matches and not canonical_matches:report['next_action']='review_missing_or_changed_canonical_before_reusing_timestamps'
        elif canonical_matches:
            report['next_action']='review_cached_transcript_and_author_edit' if reusable else ('transcribe_cached_audio' if audio.is_file() else 'extract_missing_audio_then_transcribe')
        if reusable:
            tr=read_json(transcript);text=str(tr.get('text',''));review=_json(folder/'transcript-review.json')
            issues=review.get('issues',[])
            report['transcript']={'path':str(transcript),'language':tr.get('language'),'segments':len(tr.get('segments',[])),
                'text':text[:1200],'text_truncated':len(text)>1200,'review_path':str(folder/'transcript-review.json'),
                'issue_count':len(issues),'issue_preview':[{k:str(item[k])[:160] if isinstance(item[k],str) else item[k] for k in ['start','end','word','reason'] if k in item} for item in issues[:3]]}
            report['evidence_paths']={name:str(folder/name) for name in ['frames.json','keywords.json','silence-candidates.json'] if (folder/name).is_file()}
    if project:
        folder=Path(project).expanduser().resolve();manifest=_json(folder/'video.project.json');evidence=_json(folder/'evidence/source.json')
        matches=bool(manifest and evidence.get('source_sha256')==fingerprint)
        report['project']={'path':str(folder),'source_matches':matches,'manifest_available':bool(manifest)}
        if matches:
            if any(not isinstance(manifest.get(k),str) for k in ['camera','video']):raise ValueError('Project manifest needs relative camera and video paths.')
            report['project'].update(duration=manifest.get('duration'),
                camera_available=within(folder,manifest['camera']).is_file(),
                final_exists=within(folder,manifest['video']).is_file(),
                template_path=str(folder/'assets/codex/template.js'),
                audio_report_path=str(folder/'audio-mix-report.json'))
            if reusable:report['next_action']='revise_existing_project_or_build_a_new_revision_from_cached_analysis'
    report['notes']=[
        'Source/canonical fingerprints gate cache reuse; this summary does not certify ASR accuracy or a current final export.',
        'Read the complete transcript if truncated. Review the actual audio/frames and every essential content point before authoring cuts.',
        'Load selected skill guidance once per session; reuse the shared editor, installed runtime and asset files.',
        'For a revision, classify it first: captions/style need picture rendering; sound-only can use remix:audio; changed cuts need rebuilding from cached word times.',
    ]
    return report
