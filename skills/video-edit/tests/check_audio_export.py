"""Verify the fixture's actual browser and offline mixes, including sound under B-roll."""
from pathlib import Path
import json
import subprocess
import sys
import numpy as np

root=Path(sys.argv[1]).resolve()
def decode(path):
    raw=subprocess.check_output(['ffmpeg','-hide_banner','-loglevel','error','-i',str(path),'-vn','-ar','48000','-ac','1','-f','f32le','pipe:1'])
    return np.frombuffer(raw,dtype='<f4').astype(float)
def amplitude(signal,start,end,hz):
    x=signal[round(start*48000):round(end*48000)];t=np.arange(len(x))/48000;window=np.hanning(len(x))
    return float(2*abs(np.sum(x*window*np.exp(-2j*np.pi*hz*t)))/window.sum())
report={};browser_files=list(root.glob('browser-audio-proof*'))
assert browser_files,'Run audio-browser.cjs to create the actual browser recording first.'
for path in [root/'final.mp4',*browser_files]:
    x=decode(path)
    before={hz:amplitude(x,.35,.8,hz) for hz in [440,880,1320]}
    during={hz:amplitude(x,1.4,2.5,hz) for hz in [440,880,1320]}
    after={hz:amplitude(x,3.3,3.8,hz) for hz in [440,880,1320]}
    assert before[440]>.015,(path,before)
    assert during[440]>.015 and during[880]>.008 and during[1320]>.002,(path,during)
    assert after[440]>.015 and after[880]<during[880]*.1,(path,after)
    report[path.name]={'before_insert':before,'during_insert':during,'after_insert':after}
(root/'frequency-proof.json').write_text(json.dumps(report,indent=2)+'\n')
print('PASS: source, inserted clip and added sound are audible together in browser/offline exports, with no inserted-audio tail outside its scene.')
