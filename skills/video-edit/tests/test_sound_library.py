"""Check real sound masters, semantic cue placement, audible mixing and gain preservation."""
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
import wave
import numpy as np
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from common import executable
from sound_library import ROOT,catalog,resolve
from mix_assets import mix_assets,duck_envelope
from timeline import normalize_transcript,validate_plan

class SoundLibraryTests(unittest.TestCase):
    def test_working_wavs_are_credited_faded_and_not_clipped(self):
        assets=catalog();self.assertEqual(len(assets),26)
        for item in assets.values():
            path=ROOT/item['file'];self.assertEqual(hashlib.sha256(path.read_bytes()).hexdigest(),item['sha256'])
            with wave.open(str(path)) as audio:
                self.assertEqual((audio.getframerate(),audio.getnchannels(),audio.getsampwidth()),(48000,2,3))
                self.assertAlmostEqual(audio.getnframes()/48000,item['duration'],places=4)
                packed=np.frombuffer(audio.readframes(audio.getnframes()),dtype=np.uint8).reshape(-1,3)
            values=packed[:,0].astype(np.int32)+(packed[:,1].astype(np.int32)<<8)+(packed[:,2].astype(np.int32)<<16)
            values=np.where(values&0x800000,values-0x1000000,values)/8388608
            self.assertLess(np.max(np.abs(values)),.57);self.assertGreater(np.max(np.abs(values)),.4)
            self.assertLess(np.max(np.abs(values[:2])),1e-6);self.assertLess(np.max(np.abs(values[-2:])),1e-6)
            self.assertEqual(item['license'],'CC0-1.0')
            if item.get('source_file'):
                self.assertEqual(hashlib.sha256((ROOT/item['source_file']).read_bytes()).hexdigest(),item['source_sha256'])
    def test_effects_duck_during_voice_and_recover_in_a_gap(self):
        voice=np.zeros(48000*2);voice[12000:48000]=.1
        envelope=duck_envelope(voice,48000,len(voice),6)
        self.assertAlmostEqual(envelope[40000],10**(-6/20),places=3)
        self.assertGreater(envelope[90000],.99)
        self.assertLess(np.max(np.abs(np.diff(envelope))),.002)
    def test_library_anchors_and_unknown_asset_validation(self):
        event=resolve({'asset':'silk-swipe','at':1})
        self.assertAlmostEqual(event['at'],1-catalog()['silk-swipe']['anchor_seconds'])
        self.assertTrue(event['pre_normalized']);self.assertEqual(event['event_at'],1)
        with self.assertRaisesRegex(ValueError,'Unknown'):resolve({'asset':'missing','at':1})
        with self.assertRaisesRegex(ValueError,'instead of'):resolve({'asset':'ui-click','type':'click','at':1})
        transcript=normalize_transcript({'segments':[]},2)
        plan={'version':1,'reviewed':True,'clips':[{'start':0,'end':2}],'scenes':[{'id':'test','start':0,'end':2}],
            'sound':[{'asset':'cursor-tap','at':1}]}
        self.assertEqual(validate_plan(plan,transcript)[1],2)
    def test_preroll_and_tail_do_not_leak_into_outro_or_ignore_gain(self):
        def mix(gain):
            with tempfile.TemporaryDirectory() as temp:
                root=Path(temp);core=root/'assets/codex';core.mkdir(parents=True)
                path=core/'effects.wav'
                with wave.open(str(path),'wb') as audio:
                    audio.setnchannels(2);audio.setsampwidth(2);audio.setframerate(48000)
                    audio.writeframes(bytes(48000*3*2*2))
                items=[resolve({'asset':'silk-swipe','at':0,'gain':gain}),resolve({'asset':'brand-resolve','at':1.9,'gain':gain})]
                mix_assets(root,items,content_duration=2)
                with wave.open(str(path)) as audio:return np.frombuffer(audio.readframes(audio.getnframes()),dtype='<i2').reshape(-1,2)/32768
        loud=mix(.5);soft=mix(.1)
        self.assertGreater(np.max(np.abs(loud[:48000])),.01)
        self.assertTrue(np.all(loud[96000:]==0),'SFX may not enter the signature outro')
        self.assertLess(np.max(np.abs(loud[95998:96000])),.0001)
        self.assertAlmostEqual(float(np.sqrt(np.mean(loud*loud))/np.sqrt(np.mean(soft*soft))),5,delta=.04)

if __name__=='__main__':unittest.main()
