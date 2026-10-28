# Template verification — 2026-10-27

- 11 Python regressions passed: Tamil Unicode keywords/alignment, source-frame cuts, caption/source mapping, asset-credit requirements, portable outro resolution and honest token accounting.
- Browser checks passed on a fresh build: camera autoload, Noto Sans Tamil, deterministic B-roll after seeking away and back, caption timing preserved across visual edits, brand-only save/import, full-frame camera crop preview, mobile width and no uncaught exceptions.
- Encoded demonstration: 1080×1920 H.264, 30 fps, AAC stereo 48 kHz, video/audio both exactly 10 seconds (8 seconds of template content + actual 2-second brand outro).
- Inspected frames decoded from the exported MP4, including shaped Tamil captions and the full-frame outro. Source/export outro video SSIM 0.9971. Outro audio correlation after limiter delay compensation >0.99 without time offset. Peak measured below clipping.
- Local loopback server fixes relative-video canvas-origin restrictions; use npm run studio for browser export.
- Fixture limitations: generated camera slot, authored Tamil test captions and existing workspace animation as B-roll. No Tamil recording was supplied, so ASR recognition quality and real spoken cuts were not evaluated here.
- Actual agent-token telemetry was not exposed; usage-report.json correctly records unavailable, with null counts.
