"""Check editorial time mapping and evidence handling without model downloads."""
import sys
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from timeline import normalize_transcript,validate_plan,remap_transcript,caption_chunks,keyword_index,mapped_keyword_index
from sound_assets import license_allowed,safe_url

class TimelineTests(unittest.TestCase):
    def setUp(self):
        self.tr=normalize_transcript({'language':'en','segments':[
            {'start':.2,'end':1.2,'text':'Keep context.','words':[{'start':.2,'end':.5,'word':'Keep'},{'start':.7,'end':1.2,'word':'context.'}]},
            {'start':3.2,'end':4.2,'text':'Keep timing.','words':[{'start':3.2,'end':3.5,'word':'Keep'},{'start':3.7,'end':4.2,'word':'timing.'}]}]},6)
        self.tr['source_fps']=30
        self.plan={'version':1,'reviewed':True,'clips':[{'start':3,'end':5},{'start':0,'end':2}],
                   'scenes':[{'id':'first','start':0,'end':2},{'id':'second','start':2,'end':4}]}
    def test_reorder_maps_captions_and_keywords(self):
        mappings,duration=validate_plan(self.plan,self.tr)
        cues=caption_chunks(remap_transcript(self.tr,mappings))
        self.assertEqual(duration,4)
        self.assertEqual([c['text'] for c in cues],['Keep timing.','Keep context.'])
        self.assertAlmostEqual(cues[0]['start'],.2)
        self.assertAlmostEqual(cues[1]['start'],2.2)
        self.assertAlmostEqual(cues[0]['words'][1]['start'],.7)
        entries=mapped_keyword_index(keyword_index(self.tr,['Keep']),mappings)[0]['occurrences']
        self.assertEqual(sorted(round(x['output_start'],2) for x in entries),[.2,2.2])
    def test_cutting_word_rejected(self):
        self.plan['clips'][0]['start']=3.3
        with self.assertRaisesRegex(ValueError,'cuts through'):validate_plan(self.plan,self.tr)
    def test_frame_grid_rejected(self):
        self.plan['clips'][0]['start']=3.013
        with self.assertRaisesRegex(ValueError,'frame grid'):validate_plan(self.plan,self.tr)
    def test_missing_word_alignment_is_not_invented(self):
        t=normalize_transcript({'segments':[{'start':0,'end':2,'text':'Not exact.','words':[{'start':0,'end':0,'word':'Not'},{'start':1,'end':2,'word':'exact.'}]}]},2)
        self.assertEqual(t['segments'][0]['words'],[])
        self.assertTrue(t['segments'][0]['alignment_incomplete'])
        self.assertNotIn('words',caption_chunks(t['segments'])[0])
    def test_silence_not_highlighted(self):
        cues=caption_chunks([{'words':[{'start':0,'end':.2,'word':'One'},{'start':1,'end':1.2,'word':'two'}]}])
        self.assertEqual(len(cues),2)
        self.assertEqual(cues[0]['end'],.2)
        self.assertEqual(cues[1]['start'],1)
    def test_repeated_clip_gets_new_output_occurrence(self):
        self.plan['clips']=[{'start':0,'end':2},{'start':0,'end':2}]
        mappings,_=validate_plan(self.plan,self.tr)
        hits=mapped_keyword_index(keyword_index(self.tr,['context']),mappings)[0]['occurrences']
        self.assertEqual(len(hits),2)
        self.assertAlmostEqual(hits[1]['output_start'],2.7)
    def test_license_and_url_filters(self):
        self.assertTrue(license_allowed('CC0'))
        self.assertTrue(license_allowed('CC BY 4.0'))
        self.assertFalse(license_allowed('CC BY-NC 4.0'))
        self.assertFalse(license_allowed('CC BY-SA 4.0'))
        self.assertTrue(license_allowed('CC BY-SA 4.0',sharealike=True))
        self.assertFalse(license_allowed('unknown'))
        with self.assertRaises(ValueError):safe_url('http://localhost/private')
        with self.assertRaises(ValueError):safe_url('https://freesound.org@evil.example/clip')

if __name__=='__main__':unittest.main()
