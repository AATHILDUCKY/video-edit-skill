"""Check complete offline installs, safe upgrades and archive integrity."""
import hashlib
import json
from pathlib import Path
import sys
import tempfile
import unittest
import zipfile
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from install_bundle import PACKAGE,companion_status,install,manifest,tree_hash

class BundleTests(unittest.TestCase):
    def test_offline_install_is_complete_repeatable_and_usable_in_place(self):
        with tempfile.TemporaryDirectory() as temp:
            dest=Path(temp)/'skills'
            expected=len(manifest()[1])
            results,code=install([dest]);self.assertEqual(code,0);self.assertEqual(len(results),expected+1)
            self.assertTrue((dest/'remotion-best-practices/remotion-create/REFERENCE.md').is_file())
            self.assertTrue((dest/'gsap-timeline/SKILL.md').is_file())
            self.assertTrue((dest/'threejs-animation/SKILL.md').is_file())
            self.assertTrue((dest/'runcomfy-video-edit/references/upstream.md').is_file())
            self.assertTrue((dest/'runcomfy-cli/SKILL.md').is_file())
            results,code=install([dest]);self.assertEqual(code,0)
            self.assertTrue(all(x['status']=='unchanged' for x in results))
            results,code=install([dest],companions_only=True,package=dest/'video-edit')
            self.assertEqual(len(results),expected);self.assertEqual(code,0)
            self.assertEqual(companion_status(dest)['missing'],[])
            self.assertFalse((dest/'.video-edit-backups').exists())
    def test_conflicts_preserve_changes_then_explicit_upgrade_backs_them_up(self):
        with tempfile.TemporaryDirectory() as temp:
            dest=Path(temp)/'skills';install([dest])
            changed=dest/'gsap-core/SKILL.md';changed.write_text('User custom version')
            # Simultaneous missing skill must not get installed before reporting a conflict.
            import shutil
            shutil.rmtree(dest/'threejs-textures')
            with self.assertRaisesRegex(ValueError,'preserved'):install([dest])
            self.assertEqual(changed.read_text(),'User custom version')
            self.assertFalse((dest/'threejs-textures').exists())
            results,code=install([dest],replace=True)
            replacement=next(x for x in results if x['status']=='updated')
            with zipfile.ZipFile(replacement['backup']) as archive:
                self.assertEqual(archive.read('gsap-core/SKILL.md').decode(),'User custom version')
            self.assertEqual(code,0);self.assertEqual(companion_status(dest)['different'],[])
    def test_missing_companions_install_without_overwriting_custom_skills(self):
        with tempfile.TemporaryDirectory() as temp:
            dest=Path(temp)/'skills';(dest/'gsap-core').mkdir(parents=True)
            (dest/'gsap-core/SKILL.md').write_text('Custom GSAP guidance')
            results,code=install([dest],companions_only=True,keep_existing=True)
            self.assertEqual(code,0)
            self.assertEqual((dest/'gsap-core/SKILL.md').read_text(),'Custom GSAP guidance')
            self.assertTrue((dest/'threejs-animation/SKILL.md').is_file())
            self.assertFalse((dest/'video-edit').exists())
            self.assertEqual(sum(x['status']=='kept-custom' for x in results),1)

    def test_corrupt_payload_changes_nothing(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);package=root/'package';(package/'assets').mkdir(parents=True)
            lock,_=manifest();(package/'dependencies.lock.json').write_text(json.dumps(lock))
            (package/'assets/companion-skills.zip').write_bytes(b'corrupt')
            with self.assertRaisesRegex(ValueError,'fingerprint mismatch'):install([root/'dest'],package=package)
            self.assertFalse((root/'dest').exists())
    def test_readonly_audit_does_not_create_destination(self):
        with tempfile.TemporaryDirectory() as temp:
            dest=Path(temp)/'missing';results,code=install([dest],check=True)
            self.assertEqual(code,1);self.assertFalse(dest.exists())
            self.assertEqual(len(results),len(manifest()[1])+1)

    def test_namespaced_runcomfy_keeps_main_skill_and_original_upstream_bytes(self):
        import shutil
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);dest=root/'skills';install([dest])
            self.assertIn('\nname: video-edit\n',(dest/'video-edit/SKILL.md').read_text())
            lock,_=manifest();repo=next(r for r in lock['repositories'] if r['repo']=='prime-skills/runcomfy-agent-skills')
            for item in repo['skills']:
                folder=dest/item['name']
                self.assertIn('\nname: '+item['name']+'\n',(folder/'SKILL.md').read_text())
                self.assertTrue((folder/'LICENSE.txt').is_file())
                upstream=root/('original-'+item['name']);shutil.copytree(folder/'references',upstream)
                (upstream/'upstream.md').rename(upstream/'SKILL.md')
                self.assertEqual(tree_hash(upstream),item['upstream_sha256'])

if __name__=='__main__':unittest.main()
