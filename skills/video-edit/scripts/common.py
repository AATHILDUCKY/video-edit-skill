"""Portable helpers shared by the video-edit commands. Python 3.10+."""
from __future__ import annotations
import hashlib
import json
import math
import os
from pathlib import Path
import shutil
import subprocess


def read_json(path):
    return json.loads(Path(path).read_text(encoding='utf-8'))


def write_json(path, data):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2, allow_nan=False) + '\n', encoding='utf-8')


def sha256(path):
    digest = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


def executable(name):
    value = os.environ.get(name.upper() + '_PATH') or shutil.which(name)
    if not value or not Path(value).is_file():
        raise ValueError(f'{name} is unavailable. Install it or set {name.upper()}_PATH to its executable.')
    return str(Path(value).resolve())


def run(args, cwd=None):
    result = subprocess.run([str(a) for a in args], cwd=cwd, capture_output=True, text=True)
    if result.returncode:
        raise RuntimeError(f'{Path(str(args[0])).name} failed ({result.returncode}):\n{result.stderr[-5000:]}')
    return result


def ffmpeg(*args):
    return run([executable('ffmpeg'), '-hide_banner', '-nostdin', '-loglevel', 'error', *args])


def number(value, label, low=None, high=None):
    if isinstance(value, bool) or not isinstance(value, (float, int)) or not math.isfinite(value):
        raise ValueError(f'{label} must be a finite number.')
    if low is not None and value < low or high is not None and value > high:
        raise ValueError(f'{label} is outside {low}–{high}.')
    return float(value)


def within(root, relative):
    root = Path(root).resolve()
    path = (root / relative).resolve()
    if not path.is_relative_to(root):
        raise ValueError('Project paths must stay inside the project folder.')
    return path


def probe(path):
    """Prefer ffprobe; PyAV is a structured fallback installed by faster-whisper."""
    path = Path(path).resolve()
    if not path.is_file():
        raise ValueError(f'Media does not exist: {path}')
    probe_bin = os.environ.get('FFPROBE_PATH') or shutil.which('ffprobe')
    if not probe_bin and os.environ.get('FFMPEG_PATH'):
        candidate = Path(os.environ['FFMPEG_PATH']).with_name('ffprobe')
        if candidate.is_file():
            probe_bin = str(candidate)
    if probe_bin:
        raw = json.loads(run([probe_bin, '-v', 'error', '-show_streams', '-show_format', '-of', 'json', path]).stdout)
        videos = [s for s in raw['streams'] if s['codec_type'] == 'video' and not s.get('disposition', {}).get('attached_pic')]
        audios = [s for s in raw['streams'] if s['codec_type'] == 'audio']
        v = videos[0] if videos else {}
        a = audios[0] if audios else {}
        duration = float(v.get('duration') or raw['format'].get('duration') or 0)
        fraction = v.get('avg_frame_rate', '0/1').split('/')
        fps = float(fraction[0]) / max(1, float(fraction[-1]))
        return dict(path=str(path), duration=duration, width=v.get('width', 0), height=v.get('height', 0),
                    fps=fps, has_video=bool(v), has_audio=bool(a),
                    video_start=float(v.get('start_time') or 0), audio_start=float(a.get('start_time') or 0),
                    audio_channels=a.get('channels', 0), backend='ffprobe', raw=raw)
    try:
        import av
    except ImportError as exc:
        raise ValueError('Install ffprobe (normally bundled with FFmpeg) or PyAV: pip install av') from exc
    with av.open(str(path)) as media:
        videos = list(media.streams.video)
        audios = list(media.streams.audio)
        v = videos[0] if videos else None
        a = audios[0] if audios else None
        duration = float(v.duration * v.time_base) if v and v.duration is not None else float((media.duration or 0) / av.time_base)
        return dict(path=str(path), duration=duration, width=v.width if v else 0, height=v.height if v else 0,
                    fps=float(v.average_rate or 0) if v else 0, has_video=bool(v), has_audio=bool(a),
                    video_start=float((v.start_time or 0) * v.time_base) if v else 0,
                    audio_start=float((a.start_time or 0) * a.time_base) if a else 0,
                    audio_channels=len(a.layout.channels) if a else 0, backend='pyav')


def srt_stamp(t):
    ms = round(t * 1000)
    return f'{ms // 3600000:02}:{ms // 60000 % 60:02}:{ms // 1000 % 60:02},{ms % 1000:03}'


def write_srt(path, cues):
    Path(path).write_text('\n'.join(f'{i}\n{srt_stamp(c["start"])} --> {srt_stamp(c["end"])}\n{c["text"]}\n'
                                  for i, c in enumerate(cues, 1)), encoding='utf-8')
