# Transcription and caption evidence

The default backend is faster-whisper, run locally through the Python helper. `word_timestamps=True` supplies estimated word boundaries; `vad_filter=True` suppresses non-speech internally. Its segment generator must be consumed. Preserve the full input timebase: do not run recognition on concatenated speech snippets and treat their times as source times.

For an existing transcript, use JSON:

```json
{"language":"en","segments":[{"start":0.4,"end":1.8,"text":"Build useful tools.","words":[{"start":0.4,"end":0.7,"word":"Build"},{"start":0.75,"end":1.1,"word":"useful"},{"start":1.15,"end":1.8,"word":"tools."}]}]}
```

Import using `transcribe ANALYSIS --transcript FILE.json`. Times must refer to `analysis/source.mp 4`. Preserve raw transcription before corrections. Corrections to names/numbers require listening; model confidence is not truth. Translate only if requested, and keep translation separate from original-language transcription.

If text is corrected substantially, optionally use WhisperX forced alignment on the canonical audio and corrected segments:

```python
model_a, metadata = whisperx.load_align_model(language_code="en", device="cpu")
aligned = whisperx.align(corrected_segments, model_a, metadata,
                         whisperx.load_audio("speech.wav"), "cpu",
                         return_char_alignments=False)
```

Install WhisperX only when needed in a compatible isolated environment; it is not a mandatory dependency. Its alignment models can omit tokens such as some numbers, symbols or unsupported words. Keep missing/zero-duration word times as uncertain. The importer falls back to segment captions when complete word alignment is unavailable. It does not distribute words evenly and call them aligned. Overlapping cues require review before building; do not hide overlapping speakers by arbitrarily shortening their words.

Source-analysis captions use conservative evidence chunks. Edited Reel builds default to short chunks of up to four words, roughly 1.6 seconds when word timing exists, controlled by brand.caption_chunking. Split at punctuation and meaningful gaps. Keep actual silence: no highlighted word after its end or before the next begins. Technical identifiers may need smaller text or a deliberate line break. Segment-only transcripts remain readable static chunks; prefer forced alignment before cutting inside them.

The edited caption JSON retains source provenance. Source-to-edit mapping changes timestamps after cuts; SRT uses final output time. Source cues are never reused directly on the shortened video. Reordered/repeated clips get separate output occurrences.

In the HTML editor, changing a cue's range proportionally moves its stored word timing; this is a manual adjustment, not new recognition. Same-count spelling corrections retain alignment; adding/removing words drops word highlighting until re-aligned. Reset restores transcript cues. Changing scene timing does not move captions. Replacing the recording requires reanalysis, not auto-fitting old captions.

## Tamil and English mixed speech

This creator's default is Tamil (`ta`) with technical English words. Use a multilingual model (`small` default); `.en` models cannot transcribe Tamil. `--language auto` enables detection, or `--language en` explicitly handles English. `--glossary` passes a short real-vocabulary initial prompt to faster-whisper; it is contextual help, not proof that a word was spoken. Preserve Tamil script. Never substitute romanized Tanglish or English translations without a request.

Whisper timestamps and confidence are estimates. Review code-switch boundaries, Tamil suffixes attached to English nouns, names, numbers, negatives and repeated takes against audio. If word alignment is missing, retain segment captions and mark uncertainty rather than synthesizing evenly spaced highlights. The Unicode tokenizer preserves Tamil combining marks and exposes both Tamil and English keyword occurrences. It does not infer synonyms: explicitly supply variants such as spoken English, Tamil script and inflected forms when searching a concept. Keyword matches are visual research candidates, not automatic cuts.

The local Noto Sans Tamil font is bundled and loaded before capture; inspect actual phone-scale frames for vowel marks, baseline and readable word groups. Use 2–3 words for long Tamil tokens when four-word chunks become hard to read. Set caption font size/width/position in the plan or HTML; do not rewrite rendering code. No new Tamil recording was supplied for the skill upgrade, so fixture-caption tests validate script/timing mechanics rather than Tamil ASR accuracy.

Shorter caption chunks preserve all measured words and gaps. A word longer than the target duration remains intact. Segment-only captions keep their measured segment interval; obtain real word alignment before splitting them more finely. Shorter text holds never authorize fabricated word timestamps or disappearing caveats.

Review generated chunk boundaries for awkward fragments. Rebalance real word records around negation/predicate pairs, names and technical identifiers when needed, preserving their timestamps and the complete wording. Avoid flashing many tiny one-word cards merely to increase changes.
