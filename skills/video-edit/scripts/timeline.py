"""Validate speech evidence and map source timestamps through editorial cuts."""
from __future__ import annotations
from collections import Counter
import re
import unicodedata
from common import number

STOP = set('இந்த அந்த ஒரு நான் நீ நம்ம இது அது என்று வந்து தான் என்ன எனக்கு உங்களுக்கு இருக்கு'.split()) | set('a an the and or but if so to of for in on at by with from into this that these those is are was were be been being i you he she it we they my your our their me us them can could would should will just really very then than there here have has had do does did not no yes as its how what which when why who'.split())


def tokens(text):
    text = unicodedata.normalize('NFC', text).casefold()
    words, current = [], []
    for char in text:
        if unicodedata.category(char)[0] in 'LNM' or (char in "'’" and current):
            current.append(char)
        elif current:
            words.append(''.join(current).strip("'’")); current = []
    if current: words.append(''.join(current).strip("'’"))
    return [word for word in words if word]


def normalize_transcript(raw, duration):
    """Accept canonical, faster-whisper/WhisperX-style segment JSON; never invent word times."""
    segments = raw.get('segments', [])
    if not isinstance(segments, list):
        raise ValueError('Transcript needs a segments array.')
    result = []
    for i, segment in enumerate(segments):
        start = number(segment.get('start'), f'segment {i} start', 0, duration + .05)
        end = number(segment.get('end'), f'segment {i} end', start + .0001, duration + .05)
        text = str(segment.get('text', '')).strip()
        words = []
        previous = start
        for j, word in enumerate(segment.get('words', [])):
            if word.get('start') is None or word.get('end') is None:
                # WhisperX sometimes cannot align a token. Retain uncertainty, not a fabricated timestamp.
                continue
            ws = number(word['start'], f'word {i}:{j} start', max(0, start-.1), min(duration+.05, end+.1))
            we = number(word['end'], f'word {i}:{j} end', ws, min(duration+.05, end+.1))
            if we <= ws:
                continue  # Zero-length ASR tokens are unaligned, not evidence for a highlight.
            if ws < previous - .08:
                raise ValueError(f'Non-monotonic word timing in segment {i}. Review overlapping speakers/alignment.')
            label = str(word.get('word', word.get('text', ''))).strip()
            if not label:
                continue
            words.append(dict(start=round(max(0, ws), 4), end=round(min(duration, we), 4), word=label,
                              probability=word.get('probability', word.get('score'))))
            previous = we
        # Only call a segment word-timed when all its text is represented.
        aligned = bool(words) and tokens(' '.join(w['word'] for w in words)) == tokens(text)
        result.append(dict(id=f'segment-{i:04}', start=start, end=min(duration, end), text=text,
                           words=words if aligned else [], timing='word' if aligned else 'segment',
                           alignment_incomplete=bool(segment.get('words')) and not aligned))
    result.sort(key=lambda s: s['start'])
    return dict(version=1, duration=duration, language=raw.get('language', 'unknown'),
                language_probability=raw.get('language_probability'),
                timing_quality=raw.get('timing_quality', 'imported'), segments=result,
                text=' '.join(s['text'] for s in result))


def word_records(transcript):
    return [dict(w, segment_id=s['id']) for s in transcript['segments'] for w in s['words']]


def keyword_index(transcript, terms=None):
    if terms is None:
        counts = Counter(token for token in tokens(transcript['text']) if len(token) > 3 and token not in STOP and not token.isdigit())
        terms = [term for term, _ in counts.most_common(30)]
    output = []
    for term in terms:
        wanted = tokens(term)
        if not wanted:
            continue
        occurrences = []
        for seg in transcript['segments']:
            if seg['words']:
                indexed = [(token, word) for word in seg['words'] for token in tokens(word['word'])]
                labels = [token for token, _ in indexed]
                for i in range(len(labels)-len(wanted)+1):
                    if labels[i:i+len(wanted)] == wanted:
                        occurrences.append(dict(source_start=indexed[i][1]['start'], source_end=indexed[i+len(wanted)-1][1]['end'],
                                                precision='word', segment_id=seg['id'], context=seg['text']))
            else:
                labels = tokens(seg['text'])
                if any(labels[i:i+len(wanted)] == wanted for i in range(len(labels)-len(wanted)+1)):
                    occurrences.append(dict(source_start=seg['start'], source_end=seg['end'], precision='segment', segment_id=seg['id'], context=seg['text']))
        output.append(dict(term=term, count=len(occurrences), occurrences=occurrences))
    return output


def validate_plan(plan, transcript, allow_draft=False):
    if plan.get('version') != 1:
        raise ValueError('Unsupported plan version; use version 1.')
    if not allow_draft and not plan.get('reviewed'):
        raise ValueError('Read the transcript, inspect the video, and review the edit plan before marking reviewed=true.')
    clips = plan.get('clips', [])
    if not clips:
        raise ValueError('Plan needs at least one source clip.')
    words = word_records(transcript)
    clock, mappings = 0., []
    for i, clip in enumerate(clips):
        start = number(clip.get('start'), f'clip {i} start', 0, transcript['duration'])
        end = number(clip.get('end'), f'clip {i} end', start+.05, transcript['duration']+.001)
        fps = transcript.get('source_fps', 30)
        for boundary in (start, end):
            if abs(boundary*fps-round(boundary*fps)) > .005:
                raise ValueError(f'Clip {i} boundary {boundary:g}s is off the {fps:g}fps frame grid. Use round(seconds*fps)/fps in a speech gap.')
        for boundary in (start, end):
            broken = [w for w in words if w['start']+.025 < boundary < w['end']-.025]
            if broken:
                raise ValueError(f'Clip {i} cuts through “{broken[0]["word"]}” at {boundary:.3f}s. Move the cut to a speech gap.')
        for seg in transcript['segments']:
            if not seg['words'] and any(seg['start']+.02 < b < seg['end']-.02 for b in (start,end)):
                raise ValueError(f'Clip {i} cuts inside a segment without word alignment. Align it or use the segment boundary.')
        length = end-start
        mappings.append(dict(clip=i, source_start=start, source_end=end, output_start=clock, output_end=clock+length))
        clock += length
    if clock > 600:
        raise ValueError('The packaged short editor supports up to 600 seconds. Select a focused excerpt for this project.')
    scenes = plan.get('scenes', [])
    if not scenes:
        raise ValueError('Plan needs authored visual scenes covering the edited timeline.')
    cursor = 0
    ids = set()
    for i, scene in enumerate(scenes):
        start = number(scene.get('start'), f'scene {i} start', 0, clock)
        end = number(scene.get('end'), f'scene {i} end', start+.05, clock+.001)
        if abs(start-cursor) > .002:
            raise ValueError('Scenes must be contiguous in OUTPUT time; preserve gaps in speech inside their scenes.')
        if not re.fullmatch(r'[a-z0-9][a-z0-9-]{0,63}', scene.get('id', '')) or scene['id'] in ids:
            raise ValueError('Scene ids must be unique lowercase hyphenated names.')
        if scene.get('layout', 'split') not in ['split','camera','motion','broll']:
            raise ValueError('Scene layout must be split, camera, motion or broll.')
        if scene.get('layout') == 'broll' and not scene.get('broll'):
            raise ValueError('A broll scene needs a local broll file.')
        if scene.get('broll'):
            number(scene.get('broll_in', 0), 'broll_in', 0)
            number(scene.get('broll_volume',1),'broll_volume',0,1)
            if 'broll_audio' in scene and not isinstance(scene['broll_audio'],bool):raise ValueError('broll_audio must be true or false.')
            if not scene.get('credit'):
                raise ValueError('B-roll needs a credit (including user-provided footage).')
        ids.add(scene['id']); cursor=end
    if abs(cursor-clock) > .002:
        raise ValueError(f'Scenes cover {cursor:g}s; edited footage lasts {clock:g}s.')
    for i, event in enumerate(plan.get('sound', [])):
        at = number(event.get('at'), f'sound {i} at', 0, clock-.001)
        number(event.get('gain', .15), f'sound {i} gain', 0, 1)
        if event.get('asset'):
            from sound_library import resolve
            resolve(event)
        elif event.get('file'):
            if not event.get('credit'):
                raise ValueError('Downloaded sound events need an asset credit record.')
        elif event.get('type') not in ['impact','whoosh','click','tick','pop','ping','chime']:
            raise ValueError('Choose a supported synthesized sound or a credited audio file.')
    return mappings, round(clock, 6)


def remap_transcript(transcript, mappings):
    output = []
    for mapping in mappings:
        lo, hi, offset = mapping['source_start'], mapping['source_end'], mapping['output_start']-mapping['source_start']
        for seg in transcript['segments']:
            if seg['end'] <= lo or seg['start'] >= hi:
                continue
            if seg['words']:
                words = [w for w in seg['words'] if w['start'] >= lo-.025 and w['end'] <= hi+.025]
                if not words:
                    continue
                mapped = [dict(w, start=round(max(lo,w['start'])+offset,4), end=round(min(hi,w['end'])+offset,4),
                               source_start=w['start'], source_end=w['end']) for w in words]
                output.append(dict(start=mapped[0]['start'], end=mapped[-1]['end'], words=mapped,
                                   text=' '.join(w['word'] for w in mapped), clip=mapping['clip']))
            elif seg['start'] >= lo-.025 and seg['end'] <= hi+.025:
                output.append(dict(start=max(lo,seg['start'])+offset,end=min(hi,seg['end'])+offset,words=[],text=seg['text'],clip=mapping['clip']))
    return output


def caption_chunks(segments, max_words=5, max_duration=2.8):
    cues = []
    def add(words):
        if not words:
            return
        cues.append(dict(id=f'caption-{len(cues):04}', start=words[0]['start'], end=words[-1]['end'],
                         text=' '.join(w['word'] for w in words), words=[{k:w[k] for k in ['word','start','end']} for w in words],
                         wordTimebase=dict(start=words[0]['start'], end=words[-1]['end'])))
    for seg in segments:
        if not seg['words']:
            cues.append(dict(id=f'caption-{len(cues):04}', start=seg['start'],end=seg['end'],text=seg['text'],timing='segment'))
            continue
        group=[]
        for word in seg['words']:
            if group and (len(group)>=max_words or word['end']-group[0]['start']>max_duration or word['start']-group[-1]['end']>.45):
                add(group);group=[]
            group.append(word)
            if re.search(r'[.!?;]$',word['word']):
                add(group);group=[]
        add(group)
    # Small overlaps can occur in ASR. Keep a precise conflict instead of silently corrupting captions.
    for i in range(1,len(cues)):
        if cues[i]['start'] < cues[i-1]['end']-.001:
            raise ValueError('Caption intervals overlap. Review the word alignment or overlapping speakers.')
    return cues


def mapped_keyword_index(index, mappings):
    result=[]
    for item in index:
        entries=[]
        for occurrence in item['occurrences']:
            for mapping in mappings:
                if occurrence['source_start'] >= mapping['source_start'] and occurrence['source_end'] <= mapping['source_end']:
                    delta=mapping['output_start']-mapping['source_start']
                    entries.append(dict(occurrence, output_start=round(occurrence['source_start']+delta,4),
                                        output_end=round(occurrence['source_end']+delta,4),clip=mapping['clip']))
        result.append(dict(term=item['term'],count=len(entries),occurrences=entries))
    return result
