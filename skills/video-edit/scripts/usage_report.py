"""Record measured host/model usage without pretending local ASR measures agent tokens."""
from common import write_json
import json
from pathlib import Path

def report_usage(project, input_tokens=None, output_tokens=None, cached_input_tokens=None, source='unavailable'):
    counts=[input_tokens,output_tokens,cached_input_tokens]
    if any(x is not None and (isinstance(x,bool) or not isinstance(x,int) or x<0) for x in counts):
        raise ValueError('Token counts must be non-negative integers from actual usage telemetry.')
    measured=input_tokens is not None and output_tokens is not None
    if any(x is not None for x in counts) and (not measured or source=='unavailable'):
        raise ValueError('Provide input AND output counts and identify the telemetry source.')
    if cached_input_tokens is not None and cached_input_tokens>input_tokens:
        raise ValueError('Cached input is a subset of input tokens; do not add it to the total.')
    record=dict(status='measured' if measured else 'unavailable',source=source,input_tokens=input_tokens,
        output_tokens=output_tokens,cached_input_tokens=cached_input_tokens,
        total_tokens=input_tokens+output_tokens if measured else None,
        local_asr_llm_api_tokens=0,note='Local ASR and FFmpeg do not call an LLM API. Agent tokens require host telemetry scoped to this edit; unavailable is not zero.')
    write_json(Path(project)/'usage-report.json',record)
    assets=Path(project)/'assets/codex'
    if assets.is_dir(): (assets/'usage.js').write_text('window.VIDEO_EDIT_USAGE = '+json.dumps(record)+';\n')
    print('Agent tokens: '+str(record['total_tokens']) if measured else 'Agent tokens: unavailable (host did not supply edit-scoped usage).')
    return record
