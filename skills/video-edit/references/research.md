# Technical research and source notes

Reviewed for this package on 2026-10-27. Recheck provider documentation when behavior changes; these are primary sources rather than claims that every combination of dependencies is compatible.

- [faster-whisper](https://github.com/SYSTRAN/faster-whisper): local CTranslate 2 inference, CPU int 8, word timestamps, segment iteration and VAD. These informed the transcription helper and its conservative CPU defaults.
- [WhisperX](https://github.com/m-bain/whisperX): optional alignment of supplied/corrected segments and limitations of missing word alignments. Not bundled as a mandatory dependency.
- [Freesound API resources](https://freesound.org/docs/api/resources_apiv 2.html): current search, returned sound fields and preview resources. Use `/apiv 2/search/`; older text-search routes may redirect or be deprecated.
- [Freesound authentication](https://freesound.org/docs/api/authentication.html): token-authenticated search and OAuth 2 original-file download distinction.
- [Freesound API terms](https://freesound.org/help/tos_api/): API use and per-file licensing are separate obligations.
- [MediaWiki Imageinfo API](https://www.mediawiki.org/wiki/API:Imageinfo): source URLs and extended metadata used for Commons sound records.
- [MediaWiki API etiquette](https://www.mediawiki.org/wiki/API:Etiquette): meaningful user agent, restrained requests and rate-limit behavior.
- [FFmpeg filters](https://ffmpeg.org/ffmpeg-filters.html): trim/atrim, timestamp resets, concat, silence detection, loudness normalization and optional sidechain processing. Source-to-output remapping is explicit in this package rather than inferred from screenshots.
- [Playwright screenshots](https://playwright.dev/docs/screenshots): frame capture uses a browser with explicit media seeking; capture alone does not establish audio sync.

The editorial defaults are this package's design choices, not empirically guaranteed engagement improvements. Preserve factual content and actual interface evidence. There is no promise that an edit will increase follows or that a tiny ASR model recognizes every accent accurately.

Bundled editor code derives from the user's existing html-video-explainer template, adapted for measured speech and source cuts. Manrope license and recorded keyboard attribution remain under assets/editor/assets/codex. Imported assets require their own recorded licenses. Third-party Python/npm packages retain their upstream licenses; the skill does not relicense them.
