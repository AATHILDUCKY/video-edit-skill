"""Compact context must be read-only, reject stale analysis and select focused skills."""
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from common import sha256,write_json
from edit_context import edit_context,locate_video

class EditContextTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup)
        self.root=Path(self.temp.name);self.video=self.root/'clip.MOV';self.video.write_bytes(b'original recording')
        self.analysis=self.root/'analysis';self.project=self.root/'project';self.skills=self.root/'skills'
        mock=patch('edit_context.probe',return_value=dict(duration=4,width=1080,height=1920,fps=30,has_audio=True,
            raw={'private_metadata':'not for the model context','streams':[{'codec_type':'video','color_transfer':'bt709','side_data_list':[{'rotation':-90}]}]}))
        mock.start();self.addCleanup(mock.stop)
    def context(self,**kwargs):
        return edit_context(self.root/'clip.mov',analysis=self.analysis,project=self.project,skills_dir=self.skills,**kwargs)
    def cache(self,transcript=True):
        self.analysis.mkdir();canonical=self.analysis/'source.mp4';canonical.write_bytes(b'canonical footage')
        write_json(self.analysis/'source.json',dict(source_sha256=sha256(self.video),canonical_sha256=sha256(canonical)))
        if transcript:write_json(self.analysis/'transcript.json',dict(language='ta',segments=[{}],text='என் அனுபவம் '*1000))
    def test_preflight_resolves_case_without_creating_work_folders(self):
        report=self.context();self.assertEqual(report['source']['path'],str(self.video))
        self.assertEqual(report['source']['rotation'],-90)
        self.assertEqual(report['next_action'],'analyze_in_a_new_folder')
        self.assertFalse(self.analysis.exists());self.assertFalse(self.project.exists());self.assertFalse(self.skills.exists())
        self.assertNotIn('not for the model context',json.dumps(report))
    def test_matching_cache_is_bounded_and_unchanged(self):
        self.cache();write_json(self.analysis/'transcript-review.json',{'issues':[{'word':'x'*5000,'reason':'uncertain'}]*12})
        before={p:sha256(p) for p in self.root.rglob('*') if p.is_file()};report=self.context()
        self.assertTrue(report['analysis']['reusable']);self.assertTrue(report['transcript']['text_truncated'])
        self.assertLessEqual(len(report['transcript']['text']),1200);self.assertEqual(len(report['transcript']['issue_preview']),3)
        self.assertEqual(report['transcript']['issue_count'],12)
        self.assertEqual(before,{p:sha256(p) for p in self.root.rglob('*') if p.is_file()})
    def test_another_recording_cannot_inherit_cached_dialogue(self):
        self.cache();self.video.write_bytes(b'a different recording');report=self.context()
        self.assertFalse(report['analysis']['reusable']);self.assertNotIn('transcript',report)
    def test_changed_canonical_cannot_reuse_word_timebase(self):
        self.cache();(self.analysis/'source.mp4').write_bytes(b'changed duration or edit');report=self.context()
        self.assertFalse(report['analysis']['canonical_matches']);self.assertNotIn('transcript',report)
        self.assertEqual(report['next_action'],'review_missing_or_changed_canonical_before_reusing_timestamps')
    def test_missing_transcript_only_requests_the_missing_stage(self):
        self.cache(transcript=False);self.assertEqual(self.context()['next_action'],'extract_missing_audio_then_transcribe')
        (self.analysis/'speech.wav').write_bytes(b'cached PCM')
        self.assertEqual(self.context()['next_action'],'transcribe_cached_audio')
    def test_companion_routes_are_focused_and_cloud_is_explicit(self):
        self.assertEqual([s['name'] for s in self.context()['selected_skills']],['video-processing-editing'])
        self.assertEqual([s['name'] for s in self.context(motion='gsap')['selected_skills']],['video-processing-editing','gsap-core','gsap-timeline'])
        route=[s['name'] for s in self.context(motion='remotion',cloud=True)['selected_skills']]
        self.assertIn('remotion-render',route);self.assertIn('runcomfy-video-edit',route);self.assertNotIn('threejs-animation',route)
    def test_ambiguous_case_match_is_not_guessed(self):
        (self.root/'CLIP.mov').write_bytes(b'other recording')
        with self.assertRaisesRegex(ValueError,'Ambiguous'):locate_video(self.root/'clip.mov')
    def test_project_media_paths_cannot_escape_the_project(self):
        write_json(self.project/'evidence/source.json',{'source_sha256':sha256(self.video)})
        write_json(self.project/'video.project.json',{'camera':'../clip.MOV','video':'final.mp4'})
        with self.assertRaisesRegex(ValueError,'inside the project'):self.context()

if __name__=='__main__':unittest.main()
