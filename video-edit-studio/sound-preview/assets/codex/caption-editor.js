/* Caption workspace. Uses the same caption data for preview, templates, and export. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  function boot() {
    const api = window.codexShort;
    if (!api?.ready) { requestAnimationFrame(boot); return; }
    let duration = api.duration;
    const lane = $('captionLane'), list = $('captionList');
    let cues = api.captions, selectedId = cues[0]?.id || null, zoom = 1;
    let drag = null, editing = null, applying = false, previewEnd = null, rulerPointer = null;
    let previousTime = -1, previousCurrent = null, previousLocked = null, noticeTimer;
    const undo = [], redo = [], clipNodes = new Map();
    const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
    const round = n => Math.round(n * 1000) / 1000;
    const short = n => `${Number(n).toFixed(2)}s`;
    const display = n => `${String(Math.floor(n / 60)).padStart(2, '0')}:${(n % 60).toFixed(2).padStart(5, '0')}`;
    const locked = () => api.state.recording || api.state.startingExport;
    const cueById = id => cues.find(c => c.id === id);
    const selected = () => cueById(selectedId);
    const uid = () => `caption-${globalThis.crypto?.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2, 8)}`;
    const snapshot = () => ({ cues: api.template.captionCues === null ? null : api.captions, selectedId, style: api.captionStyle, overrides: api.captionStyles });
    const historyText = () => JSON.stringify({ cues: api.captions, style: api.captionStyle, overrides: api.captionStyles });
    let appearanceEdit = null;
    function note(message, error = false) {
      clearTimeout(noticeTimer); $('captionEditNote').textContent = message; $('captionEditNote').classList.toggle('is-error', error);
      noticeTimer = setTimeout(() => { $('captionEditNote').textContent = 'Drag a block to move it. Drag its edges to trim.'; $('captionEditNote').classList.remove('is-error'); }, 3500);
    }
    function putHistory(before, beforeText) {
      if (beforeText === historyText()) return;
      undo.push(before); if (undo.length > 60) undo.shift(); redo.length = 0; updateButtons();
    }
    function apply(next, before = null, beforeText = null) {
      if (locked()) return false;
      try {
        applying = true; api.setCaptions(next); applying = false;
        if (before) putHistory(before, beforeText); return true;
      } catch (e) { applying = false; note(e.message, true); return false; }
    }
    function restore(s) {
      applying = true;
      if (s.cues === null) api.resetCaptions(); else api.setCaptions(s.cues);
      api.restoreCaptionAppearance({ style: s.style, overrides: s.overrides });
      applying = false; selectedId = s.selectedId; refresh();
    }
    function finishEdit() {
      if (!editing) return;
      const e = editing; editing = null; putHistory(e.before, e.text);
    }
    function beginEdit() {
      if (locked()) return;
      api.pause(); previewEnd = null;
      if (!editing) editing = { before: snapshot(), text: historyText() };
    }
    function perform(next, id = selectedId) {
      finishEdit(); const before = snapshot(), text = historyText();
      if (apply(next, before, text)) { selectedId = id; refresh(); }
    }
    function select(id, shouldSeek = true) {
      if (locked() || !cueById(id)) return;
      finishEdit(); selectedId = id; api.pause(); previewEnd = null;
      if (shouldSeek) api.seek(cueById(id).start + .001);
      refresh();
    }
    function limits(cue) {
      const i = cues.findIndex(c => c.id === cue.id);
      return { left: i ? cues[i - 1].end : 0, right: i < cues.length - 1 ? cues[i + 1].start : duration };
    }
    function updateForm() {
      const c = selected(), disabled = !c || locked();
      $('selectedCaptionTitle').textContent = c ? `Caption ${cues.indexOf(c) + 1}` : 'No caption selected';
      $('captionDuration').textContent = c ? `${short(c.end - c.start)} duration` : '';
      for (const [id, value] of [['captionText', c?.text || ''], ['captionStart', c ? c.start.toFixed(2) : ''], ['captionEnd', c ? c.end.toFixed(2) : '']]) {
        $(id).disabled = disabled;
        if (document.activeElement !== $(id)) $(id).value = value;
      }
      if (c) {
        const b = limits(c); $('captionStart').min = b.left; $('captionStart').max = round(c.end - .1);
        $('captionEnd').min = round(c.start + .1); $('captionEnd').max = b.right;
      }
      for (const id of ['captionStartHere', 'captionEndHere', 'previewCaption', 'deleteCaption']) $(id).disabled = disabled;
      $('captionVisibility').checked = api.template.captions;
      updateButtons();
    }
    function updateButtons() {
      const busy = locked(), c = selected(), t = api.state.time;
      $('captionUndo').disabled = busy || !undo.length; $('captionRedo').disabled = busy || !redo.length;
      $('splitCaption').disabled = busy || !c || t < c.start + .1 || t > c.end - .1;
      $('timelineZoomOut').disabled = zoom <= 1; $('timelineZoomIn').disabled = zoom >= 4;
      for (const id of ['addCaption', 'downloadSrt', 'captionsFromScript', 'captionVisibility']) $(id).disabled = busy;
    }
    function buildList() {
      const scroll = list.scrollTop; list.replaceChildren();
      if (!cues.length) { const empty = document.createElement('p'); empty.className = 'caption-empty'; empty.textContent = 'Your caption track is empty. Add a caption at the cursor, or use your script.'; list.append(empty); }
      cues.forEach((cue, i) => {
        const button = document.createElement('button'); button.type = 'button'; button.className = 'caption-card'; button.dataset.caption = cue.id;
        button.classList.toggle('is-selected', cue.id === selectedId); button.setAttribute('aria-pressed', String(cue.id === selectedId));
        const timing = document.createElement('span'); timing.className = 'caption-card-time'; timing.textContent = `${String(i + 1).padStart(2, '0')}   ${display(cue.start)} — ${display(cue.end)}`;
        const text = document.createElement('span'); text.className = 'caption-card-text'; text.textContent = cue.text || 'Empty caption';
        button.append(timing, text); button.onclick = () => select(cue.id); list.append(button);
      });
      list.scrollTop = scroll;
    }
    function positionClip(c, node) {
      node.style.left = `${c.start / duration * 100}%`; node.style.width = `calc(${(c.end - c.start) / duration * 100}% - 2px)`;
      node.classList.toggle('is-selected', c.id === selectedId);
      node.title = `${c.text}\n${display(c.start)} – ${display(c.end)}`;
      node.querySelector('.clip-body').textContent = c.text || 'Empty caption';
      for (const [mode, value] of [['start', c.start], ['end', c.end]]) {
        const edge = node.querySelector(`[data-mode="${mode}"]`); edge.setAttribute('aria-valuenow', value.toFixed(2));
        edge.setAttribute('aria-valuetext', display(value));
      }
    }
    function buildClips() {
      lane.replaceChildren(); clipNodes.clear();
      cues.forEach(c => {
        const node = document.createElement('div'); node.className = 'caption-clip'; node.dataset.caption = c.id;
        for (const mode of ['start', 'move', 'end']) {
          const b = document.createElement('button'); b.type = 'button'; b.dataset.mode = mode; b.dataset.caption = c.id;
          b.className = mode === 'move' ? 'clip-body' : 'trim-handle';
          b.setAttribute('aria-label', mode === 'move' ? `Move caption: ${c.text}` : `Trim caption ${mode}: ${c.text}`);
          if (mode !== 'move') { b.setAttribute('role', 'slider'); b.setAttribute('aria-valuemin', '0'); b.setAttribute('aria-valuemax', String(duration)); }
          b.addEventListener('pointerdown', startDrag); b.addEventListener('pointermove', moveDrag);
          for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) b.addEventListener(event, endDrag);
          b.addEventListener('keydown', clipKey); node.append(b);
        }
        positionClip(c, node); lane.append(node); clipNodes.set(c.id, node);
      });
    }
    function refresh() {
      cues = api.captions;
      if (!cueById(selectedId)) selectedId = cues[0]?.id || null;
      if (drag) { cues.forEach(c => { const node = clipNodes.get(c.id); if (node) positionClip(c, node); }); }
      else { buildList(); buildClips(); }
      updateForm(); updateCursor(true);
      $('captionSaveState').textContent = 'Saved automatically';
    }
    function snap(value, cue, mode, width) {
      const threshold = 7 / Math.max(1, lane.clientWidth) * duration;
      const marks = [0, duration, api.state.time, ...api.cuts, ...cues.filter(c => c.id !== cue.id).flatMap(c => [c.start, c.end])];
      let best = value, distance = threshold;
      for (const point of marks) {
        const start = Math.abs(value - point); if (start < distance) { distance = start; best = point; }
        if (mode === 'move') { const end = Math.abs(value + width - point); if (end < distance) { distance = end; best = point - width; } }
      }
      return round(best);
    }
    function changedCue(cue, mode, delta, snapping = false) {
      const b = limits(cue), length = cue.end - cue.start;
      if (mode === 'move') {
        let start = cue.start + delta; if (snapping) start = snap(start, cue, mode, length);
        start = clamp(start, b.left, Math.max(b.left, b.right - length));
        return { ...cue, start: round(start), end: round(start + length) };
      }
      if (mode === 'start') { let start = cue.start + delta; if (snapping) start = snap(start, cue, mode, length); return { ...cue, start: round(clamp(start, b.left, cue.end - .1)) }; }
      let end = cue.end + delta; if (snapping) end = snap(end, cue, mode, length);
      return { ...cue, end: round(clamp(end, cue.start + .1, b.right)) };
    }
    function startDrag(e) {
      if (locked() || e.button > 0) return;
      e.preventDefault(); e.stopPropagation(); finishEdit();
      const id = e.currentTarget.dataset.caption; select(id);
      // select() rebuilds the block; capture the replacement element for a stable drag.
      const target = clipNodes.get(id).querySelector(`[data-mode="${e.currentTarget.dataset.mode}"]`);
      target.focus({ preventScroll: true }); target.setPointerCapture(e.pointerId);
      drag = { id, mode: target.dataset.mode, pointerId: e.pointerId, x: e.clientX, width: lane.clientWidth, cue: { ...cueById(id) }, original: api.captions, before: snapshot(), text: historyText(), moved: false };
      document.body.classList.add('is-caption-dragging');
    }
    function moveDrag(e) {
      if (!drag || e.pointerId !== drag.pointerId) return;
      e.preventDefault(); e.stopPropagation(); if (Math.abs(e.clientX - drag.x) < 3 && !drag.moved) return;
      drag.moved = true;
      const delta = (e.clientX - drag.x) / Math.max(1, drag.width) * duration;
      const next = changedCue(drag.cue, drag.mode, delta, true);
      apply(drag.original.map(c => c.id === drag.id ? next : c));
    }
    function endDrag(e) {
      if (!drag || e.pointerId !== drag.pointerId) return;
      const done = drag; drag = null; document.body.classList.remove('is-caption-dragging');
      if (done.moved) putHistory(done.before, done.text);
      refresh(); const c = selected(); if (c) api.seek(c.start + .001);
    }
    function clipKey(e) {
      if (!['ArrowLeft', 'ArrowRight', 'Enter', ' '].includes(e.key) || locked()) return;
      e.preventDefault(); e.stopPropagation();
      const id = e.currentTarget.dataset.caption, mode = e.currentTarget.dataset.mode; select(id, false);
      if (e.key === 'Enter' || e.key === ' ') { api.seek(selected().start + .001); $('captionText').focus(); return; }
      const next = changedCue(selected(), mode, (e.key === 'ArrowLeft' ? -1 : 1) * (e.shiftKey ? .25 : .05));
      perform(cues.map(c => c.id === id ? next : c)); api.seek(next.start + .001);
    }
    function timing(edge, value, final = false) {
      const c = selected(); if (!c || locked()) return;
      if (!Number.isFinite(value)) { if (final) updateForm(); return; }
      const next = changedCue(c, edge, value - c[edge]);
      apply(cues.map(item => item.id === c.id ? next : item));
      if (final) $(edge === 'start' ? 'captionStart' : 'captionEnd').value = next[edge].toFixed(2);
    }
    function splitAt(cue, at) {
      const words = cue.text.trim().split(/\s+/).filter(Boolean);
      const count = clamp(Math.round(words.length * (at - cue.start) / (cue.end - cue.start)), 1, Math.max(1, words.length - 1));
      const id = uid();
      const left = { ...cue, end: round(at), text: words.length > 1 ? words.slice(0, count).join(' ') : cue.text };
      const right = { ...(cue.style ? { style: structuredClone(cue.style) } : {}), id, start: round(at), end: cue.end, text: words.length > 1 ? words.slice(count).join(' ') : cue.text || 'New caption' };
      perform(cues.flatMap(c => c.id === cue.id ? [left, right] : [c]), id); api.seek(right.start + .001);
      return id;
    }
    $('addCaption').onclick = () => {
      if (locked()) return; finishEdit(); const t = api.state.time;
      const gaps = []; let end = 0;
      for (const cue of cues) { if (cue.start - end >= .1) gaps.push({ start: end, end: cue.start }); end = cue.end; }
      if (duration - end >= .1) gaps.push({ start: end, end: duration });
      const gap = gaps.find(g => t >= g.start && t <= g.end - .1) || gaps.sort((a, b) => Math.abs(a.start - t) - Math.abs(b.start - t))[0];
      if (gap) {
        const start = round(clamp(t, gap.start, Math.max(gap.start, gap.end - .1))), id = uid();
        perform([...cues, { id, start, end: round(Math.min(start + 2, gap.end)), text: 'New caption' }], id); api.seek(start + .001);
      } else {
        const c = cues.find(item => t > item.start + .1 && t < item.end - .1) || selected() || cues[0];
        if (!c || c.end - c.start < .2) { note('Trim an edge to make room for a new caption.', true); return; }
        splitAt(c, t > c.start + .1 && t < c.end - .1 ? t : (c.start + c.end) / 2);
      }
      $('captionText').focus(); $('captionText').select(); note('Caption ready. Edit the words on the right.');
    };
    $('splitCaption').onclick = () => { const c = selected(), t = api.state.time; if (c && !locked() && t >= c.start + .1 && t <= c.end - .1) splitAt(c, t); };
    $('deleteCaption').onclick = () => { const c = selected(); if (!c || locked()) return; const i = cues.indexOf(c), next = cues.filter(item => item.id !== c.id); perform(next, next[Math.min(i, next.length - 1)]?.id || null); note('Caption deleted. Undo restores it.'); };
    $('captionText').addEventListener('focus', beginEdit);
    $('captionText').addEventListener('input', e => { const c = selected(); if (c && !locked()) { beginEdit(); apply(cues.map(item => item.id === c.id ? { ...item, text: e.target.value } : item)); } });
    $('captionText').addEventListener('blur', finishEdit);
    for (const [id, edge] of [['captionStart', 'start'], ['captionEnd', 'end']]) {
      $(id).addEventListener('focus', beginEdit);
      $(id).addEventListener('input', e => { beginEdit(); timing(edge, e.target.valueAsNumber); });
      $(id).addEventListener('change', e => timing(edge, e.target.valueAsNumber, true));
      $(id).addEventListener('blur', () => { finishEdit(); updateForm(); });
    }
    for (const [id, edge] of [['captionStartHere', 'start'], ['captionEndHere', 'end']]) $(id).onclick = () => { const c = selected(); if (!c || locked()) return; finishEdit(); const before = snapshot(), text = historyText(); timing(edge, api.state.time, true); putHistory(before, text); };
    $('captionVisibility').onchange = e => { if (!locked()) api.setCaptionVisibility(e.target.checked); };
    $('previewCaption').onclick = () => { const c = selected(); if (!c || locked()) return; finishEdit(); api.seek(c.start); previewEnd = c.end; api.play(); };
    $('captionUndo').onclick = () => { if (!undo.length || locked()) return; finishEdit(); const s = undo.pop(); redo.push(snapshot()); restore(s); };
    $('captionRedo').onclick = () => { if (!redo.length || locked()) return; const s = redo.pop(); undo.push(snapshot()); restore(s); };
    $('captionsFromScript').onclick = () => { if (locked()) return; finishEdit(); const before = snapshot(), text = historyText(); applying = true; api.resetCaptions(); applying = false; putHistory(before, text); refresh(); note('Captions restored from the recording script.'); };
    function srtStamp(t) { const ms = Math.round(t * 1000); return `${String(Math.floor(ms / 3600000)).padStart(2, '0')}:${String(Math.floor(ms / 60000) % 60).padStart(2, '0')}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`; }
    $('downloadSrt').onclick = () => {
      finishEdit(); const text = cues.map((c, i) => `${i + 1}\n${srtStamp(c.start)} --> ${srtStamp(c.end)}\n${c.text.trim()}\n`).join('\n');
      const blob = new Blob([text], { type: 'application/x-subrip' }), url = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = url; a.download = 'codex-edited-captions.srt'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 60000);
    };
    function seekAt(clientX) { const r = $('timelineRuler').getBoundingClientRect(); api.pause(); previewEnd = null; api.seek(clamp((clientX - r.left) / r.width * duration, 0, duration)); }
    for (const target of [$('timelineRuler'), lane]) {
      target.addEventListener('pointerdown', e => { if (locked() || e.target.closest('.caption-clip')) return; e.preventDefault(); rulerPointer = e.pointerId; target.setPointerCapture(e.pointerId); seekAt(e.clientX); });
      target.addEventListener('pointermove', e => { if (rulerPointer === e.pointerId) { e.preventDefault(); seekAt(e.clientX); } });
      for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) target.addEventListener(event, () => { rulerPointer = null; });
    }
    $('timelineRuler').onkeydown = e => { if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key) || locked()) return; e.preventDefault(); e.stopPropagation(); api.pause(); api.seek(e.key === 'Home' ? 0 : e.key === 'End' ? duration : clamp(api.state.time + (e.key === 'ArrowLeft' ? -1 : 1) * (e.shiftKey ? 1 : .1), 0, duration)); };
    function buildRuler() {
      const ruler = $('timelineRuler'); ruler.replaceChildren();
      const ideal = duration / (zoom >= 2 ? 80 : 40);
      const step = [.5, 1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 1800, 3600].find(value => value >= Math.max(ideal, zoom >= 2 ? .5 : 1)) || Math.ceil(ideal / 3600) * 3600;
      for (let t = 0; t <= duration; t += step) {
        const tick = document.createElement('span'); tick.className = 'ruler-tick'; tick.style.left = `${t / duration * 100}%`;
        const major = step >= 2 ? Math.round(t / step) % 2 === 0 : zoom >= 2 ? Number.isInteger(t) : t % 2 === 0 || t === duration;
        if (major) { const label = document.createElement('span'); label.textContent = `${t}s`; tick.append(label); } else tick.classList.add('minor');
        if (t < duration) ruler.append(tick);
      }
    }
    function buildScenes() {
      const sceneLane = $('sceneLane'); sceneLane.replaceChildren();
      api.template.scenes.forEach((s,index) => {
        const node = document.createElement('div'); node.className = 'scene-clip';
        node.style.left = `${s.start / duration * 100}%`; node.style.width = `calc(${s.duration / duration * 100}% - 2px)`;
        node.title = `${s.title} ${s.emphasis} · ${s.start.toFixed(2)}–${s.end.toFixed(2)}s`;
        for (const mode of ['start','move','end']) {
          const button = document.createElement('button'); button.type = 'button'; button.dataset.visualIndex = index; button.dataset.visualMode = mode;
          button.className = mode === 'move' ? 'scene-body' : 'scene-edge';
          button.setAttribute('aria-label', mode === 'move' ? `Edit visual: ${s.title}` : `Trim visual ${mode}: ${s.title}`);
          if (mode === 'move') button.textContent = s.title;
          else { button.setAttribute('role','slider'); button.setAttribute('aria-valuemin','0'); button.setAttribute('aria-valuemax',String(duration)); button.setAttribute('aria-valuenow',String(mode === 'start' ? s.start : s.end)); }
          node.append(button);
        }
        sceneLane.append(node);
      });
    }
    function resizeTimeline(centre = false) {
      const scroll = $('timelineScroll'); $('timelineContent').style.width = `${Math.max(780, scroll.clientWidth) * zoom}px`;
      if (centre) scroll.scrollLeft = 72 + lane.clientWidth * api.state.time / duration - scroll.clientWidth / 2;
      buildRuler(); updateCursor(true); updateButtons();
    }
    $('timelineZoomIn').onclick = () => { zoom = Math.min(4, zoom * 1.4); resizeTimeline(true); };
    $('timelineZoomOut').onclick = () => { zoom = Math.max(1, zoom / 1.4); resizeTimeline(true); };
    $('timelineZoomFit').onclick = () => { zoom = 1; resizeTimeline(); $('timelineScroll').scrollLeft = 0; };
    function updateCursor(force = false) {
      const state = api.state;
      const busy = state.recording || state.startingExport;
      if (!force && Math.abs(state.time - previousTime) < .0001 && busy === previousLocked) return;
      previousTime = state.time;
      const x = 72 + lane.clientWidth * state.time / duration;
      $('timelinePlayhead').style.left = `${x}px`; $('timelineRuler').setAttribute('aria-valuenow', state.time.toFixed(2)); $('timelineRuler').setAttribute('aria-valuetext', display(state.time));
      const current = cues.find(c => state.time >= c.start && state.time < c.end)?.id || null;
      if (force || current !== previousCurrent) { previousCurrent = current; list.querySelectorAll('.caption-card').forEach(b => b.classList.toggle('is-current', b.dataset.caption === current)); }
      if (state.playing && zoom > 1) { const scroll = $('timelineScroll'); if (x > scroll.scrollLeft + scroll.clientWidth - 35 || x < scroll.scrollLeft + 72) scroll.scrollLeft = Math.max(0, x - scroll.clientWidth * .35); }
      if (previousLocked !== busy) { previousLocked = busy; updateForm(); }
      updateButtons();
    }
    window.addEventListener('codex:caption-style-start', () => { if (locked()) return; finishEdit(); if (!appearanceEdit) appearanceEdit = { before: snapshot(), text: historyText() }; });
    window.addEventListener('codex:caption-style-end', () => { if (!appearanceEdit) return; const edit = appearanceEdit; appearanceEdit = null; putHistory(edit.before,edit.text); refresh(); });
    window.addEventListener('codex:captions', () => { if (!applying) previewEnd = null; refresh(); });
    window.addEventListener('codex:visuals', e => { buildScenes(); if (e.detail?.timing) { undo.length = 0; redo.length = 0; previewEnd = null; refresh(); } });
    window.addEventListener('codex:duration', () => {
      duration = api.duration; appearanceEdit = null; editing = null; previewEnd = null; drag = null; rulerPointer = null;
      document.body.classList.remove('is-caption-dragging');
      undo.length = 0; redo.length = 0; previousTime = -1; previousCurrent = null;
      buildScenes(); refresh(); resizeTimeline();
    });
    document.addEventListener('keydown', e => {
      if (!e.target.closest?.('#captionEditor,#captionTimeline') || /INPUT|TEXTAREA/.test(e.target.tagName) || locked()) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.stopPropagation(); $(e.shiftKey ? 'captionRedo' : 'captionUndo').click(); }
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); e.stopPropagation(); $('deleteCaption').click(); }
      if (e.key === 'Escape' && drag) { const before = drag.before; drag = null; document.body.classList.remove('is-caption-dragging'); restore(before); }
    });
    const resizeObserver = new ResizeObserver(() => resizeTimeline()); resizeObserver.observe($('timelineScroll'));
    function frame() {
      if (previewEnd !== null && api.state.time >= previewEnd) { const end = previewEnd; previewEnd = null; api.pause(); api.seek(Math.max(0, end - .001)); }
      updateCursor(); requestAnimationFrame(frame);
    }
    refresh(); buildScenes(); resizeTimeline(); requestAnimationFrame(frame);
    window.codexCaptionEditor = { get selectedId() { return selectedId; }, select, get ready() { return true; } };
  }
  boot();
})();
