"""Regression checks for Tamil evidence, source cuts and honest usage accounting."""
import json
from pathlib import Path
import sys
import tempfile
import unittest
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from timeline import normalize_transcript,keyword_index,tokens,validate_plan
from branding import load_brand,outro_path
from usage_report import report_usage

class BrandTests(unittest.TestCase):
    def test_tamil_keywords_preserve_vowel_marks_and_measured_time(self):
        raw={'language':'ta','segments':[{'start':0,'end':2,'text':'என் அனுபவம் API','words':[
            {'word':'என்','start':0,'end':.3},{'word':'அனுபவம்','start':.4,'end':1.2},{'word':'API','start':1.4,'end':2}]}]}
        tr=normalize_transcript(raw,2)
        hit=keyword_index(tr,['என் அனுபவம்','API'])[0]['occurrences'][0]
        self.assertEqual(tokens('என் அனுபவம்'),['என்','அனுபவம்'])
        self.assertEqual(hit['precision'],'word');self.assertEqual(hit['source_end'],1.2)
        # Different Tamil words must not compare equal after normalization.
        raw['segments'][0]['words'][1]['word']='வாழ்க்கை'
        tr=normalize_transcript(raw,2)
        self.assertTrue(tr['segments'][0]['alignment_incomplete'])
        self.assertEqual(tr['segments'][0]['words'],[])
    def test_brand_and_packaged_outro_are_portable(self):
        brand=load_brand();self.assertTrue(outro_path(brand,'/tmp').is_file())
        brand['outro']['enabled']=False;self.assertIsNone(outro_path(brand,'/tmp'))
        self.assertTrue(load_brand()['outro']['enabled'])
    def test_unknown_usage_is_not_zero_and_cached_is_subset(self):
        with tempfile.TemporaryDirectory() as folder:
            record=report_usage(folder)
            self.assertIsNone(record['total_tokens']);self.assertEqual(record['status'],'unavailable')
            record=report_usage(folder,100,20,40,'test fixture')
            self.assertEqual(record['total_tokens'],120)
            self.assertEqual(json.loads((Path(folder)/'usage-report.json').read_text())['total_tokens'],120)
            with self.assertRaises(ValueError):report_usage(folder,100,20,101,'test')
            with self.assertRaises(ValueError):report_usage(folder,100,None,None,'test')
    def test_broll_requires_an_asset_and_credit(self):
        tr=normalize_transcript({'segments':[]},2)
        plan={'version':1,'reviewed':True,'clips':[{'start':0,'end':2}],'scenes':[{'id':'test','start':0,'end':2,'layout':'broll'}]}
        with self.assertRaisesRegex(ValueError,'broll file'):validate_plan(plan,tr)
        plan['scenes'][0]['broll']='clip.mp4'
        with self.assertRaisesRegex(ValueError,'credit'):validate_plan(plan,tr)

if __name__=='__main__':unittest.main()
