"""Active caption pacing preserves content and real timing, including slow/unaligned speech."""
import sys
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from branding import load_brand
from timeline import caption_chunks

class CaptionPolicyTests(unittest.TestCase):
    def test_short_chunks_keep_all_words_and_timestamps(self):
        labels='என் அனுபவம் API is not ready yet but this is what I learned'.split()
        words=[dict(word=word,start=round(i*.30,2),end=round(i*.30+.24,2)) for i,word in enumerate(labels)]
        cues=caption_chunks([{'words':words}],**load_brand()['caption_chunking'])
        self.assertEqual([w for cue in cues for w in cue['words']],words)
        self.assertGreater(len(cues),1)
        for cue in cues:
            self.assertLessEqual(len(cue['words']),4)
            self.assertLessEqual(cue['end']-cue['start'],1.6)
            self.assertEqual(cue['start'],cue['words'][0]['start'])
            self.assertEqual(cue['end'],cue['words'][-1]['end'])

    def test_slow_word_and_unaligned_segment_are_not_falsely_split(self):
        policy=load_brand()['caption_chunking']
        word={'word':'அனுபவம்','start':.2,'end':2.4}
        cue=caption_chunks([{'words':[word]}],**policy)[0]
        self.assertEqual(cue['words'],[word]);self.assertEqual(cue['end'],2.4)
        segment={'start':0,'end':4,'text':'Timing is not word aligned.','words':[]}
        cue=caption_chunks([segment],**policy)[0]
        self.assertEqual(cue['text'],segment['text']);self.assertEqual(cue['end'],4)
        self.assertNotIn('words',cue)

    def test_partial_customization_keeps_other_default_and_rejects_invalid_limits(self):
        policy=load_brand({'caption_chunking':{'max_words':3}})['caption_chunking']
        self.assertEqual(policy,{'max_words':3,'max_duration':1.6})
        self.assertEqual(load_brand({'caption_chunking':{'max_duration':2.2}})['caption_chunking']['max_words'],4)
        for invalid in [None,{'max_words':0},{'max_words':True},{'max_words':2.5},{'max_duration':.2},{'max_duration':float('nan')}]:
            with self.subTest(invalid=invalid),self.assertRaises(ValueError):load_brand({'caption_chunking':invalid})

if __name__=='__main__':unittest.main()
