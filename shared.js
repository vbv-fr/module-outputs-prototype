/* Shared sample data + shared state for the Module Outputs prototype screens (reports.html, excel.html). */
(function (g) {
  'use strict';
  const KEY = 'module-outputs-proto';
  const EMBED = (() => { try { return window.self !== window.top; } catch (e) { return true; } })();

  function readStore() {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (!raw) return null;
      const o = JSON.parse(raw);
      return o && typeof o === 'object' ? o : null;
    } catch (e) { return null; }
  }
  function writeStore(o) { try { window.localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) { /* storage blocked */ } }
  function postNav(to, extra) {
    if (!EMBED) return false;
    try { window.parent.postMessage(Object.assign({ type: 'module-outputs-nav', to }, extra || {}), '*'); return true; } catch (e) { return false; }
  }

  // ---------- Edge system keys each capture offers (systemKeyDefinition.ts) ----------
  // t = datatype (1 bool, 2 str, 3 num); s = suffix exactly as stored; sample = Display Name in the sample setup (ticked).
  const K = (t, s, sample) => ({ t, s, sample: sample || null });
  // Keys that add up or average across cycles (pass_count, fail_count, count_till_now, avg_inference_time) are not offered.
  const modKeys = () => [K(1, 'result')];
  const confCard = (cap) => ({ name: `${cap.pos} · ${cap.name}`, code: 'conf', conf: true, keys: [
    K(3, 'completion_status'), K(3, 'inference_time'), K(1, 'result')] });
  const clsKeys = (cls, countName) => ({ name: cls, keys: [K(1, 'result'), K(3, 'current_count', countName)] });
  // Dimensions: the same five variant-level keys, listed under each capture the dimension measures.
  const dimCard = (name, sample, cross) => ({ id: 'DIM:' + name, name, type: 'Dimensions', code: 'DIM', cross: cross || null, keys: [
    K(1, 'dim_result'), K(3, 'dim_predicted_value', sample), K(2, 'dim_unit_used'), K(2, 'dim_process'), K(2, 'dim_current_gt')] });
  const seKeys = (shape) => [K(3, `shape:${shape}_angle`), K(3, `shape:${shape}_length`), K(3, `shape:${shape}_error_pct`)];

  const A_CP1 = [
    { name: 'Fastener Check', type: 'Object Detection & Classification', code: 'ODC', keys: modKeys(),
      classes: [clsKeys('Screw', 'Screw count'), clsKeys('Washer', 'Washer count')] },
    { name: 'Slot Check', type: 'Image Classification', code: 'IC', keys: modKeys().concat([
      K(2, 'detected_class (Slot 1)', 'Slot 1 class'), K(2, 'detected_class (Slot 2)', 'Slot 2 class'), K(2, 'correct_class')]) },
    { name: 'Bracket Edge', type: 'Shape Extractor', code: 'SE', keys: seKeys('Bracket') },
    // Cross-capture: measured from Bracket Edge here to Label Edge in CP3; ticked under CP3 only in the sample.
    dimCard('Distance_LabelGap', null, 'Front View, Label Side'),
  ];
  const A_CP3 = [
    { name: 'Serial Reader', type: 'OCR', code: 'OCR', keys: modKeys().concat([
      K(2, 'detected_text', 'Serial No.'), K(2, 'labelName:Serial_gt_text'), K(1, 'labelName:Serial_result')]) },
    { name: 'QR Reader', type: 'Code Reader', code: 'CR', keys: modKeys().concat([
      K(2, 'detected_string', 'QR code'), K(2, 'gt_string')]) },
    { name: 'Surface Check', type: 'Segmentation', code: 'SEG', keys: [] },
    { name: 'Label Edge', type: 'Shape Extractor', code: 'SE', keys: seKeys('Label') },
    dimCard('Distance_LabelGap', 'Label gap', 'Front View, Label Side'),
  ];
  const B_CP1 = [
    { name: 'Seal Check', type: 'Bead Inspection', code: 'BEAD', keys: [
      K(1, 'result', 'Bead result'),
      K(3, 'caliper_pass_percentage', 'Caliper pass %'), K(2, 'bead_class_name'), K(1, 'bead:Door seal_result'),
      K(1, 'bead:Door seal_bead_width'), K(1, 'bead:Door seal_bead_gap/position')] },
    { name: 'Cap Colour', type: 'Colour Detection', code: 'CD', keys: modKeys().concat([
      K(2, 'colorName:Red_detected_color'), K(1, 'colorName:Red_result'),
      K(3, 'colorName:Red_distribution_percentage', 'Red coverage')]) },
    { name: 'Hole Fit', type: 'Shape Extractor', code: 'SE', keys: [
      K(3, 'shape:Hole_radius', 'Hole radius'), K(3, 'shape:Hole_perimeter'), K(3, 'shape:Hole_area'),
      K(3, 'shape:Hole_circularity'), K(3, 'shape:Hole_convexity'),
      K(3, 'shape:Hole_contour_continuity'), K(3, 'shape:Hole_error_pct')] },
    { name: 'Label Tilt', type: 'Orientation & Tilt Check', code: 'OTC', keys: modKeys() },
    // Dimensions keys are variant-level; shown last in this capture's view.
    dimCard('Hole Diameter', 'Hole diameter'),
  ];
  const C_CP1 = [
    { name: 'Cap Presence', type: 'Object Detection & Classification', code: 'ODC', keys: modKeys(), classes: [clsKeys('Cap')] },
  ];
  // Capture keys used in the shared state: "<variant letter>-<camera position>"
  const CAPTURES = [
    { id: 'A-CP1', inst: 'line1', variant: 'Variant A', pos: 'CP1', name: 'Front View', modules: A_CP1 },
    { id: 'A-CP3', inst: 'line1', variant: 'Variant A', pos: 'CP3', name: 'Label Side', modules: A_CP3 },
    { id: 'B-CP1', inst: 'line1', variant: 'Variant B', pos: 'CP1', name: 'Front View', modules: B_CP1 },
    { id: 'C-CP1', inst: 'line2', variant: 'Variant C', pos: 'CP1', name: 'Top View', modules: C_CP1 },
  ];
  const INSTANCES = [{ id: 'line1', name: 'Line 1 Instance' }, { id: 'line2', name: 'Line 2 Instance' }];
  const capsOf = (instId) => CAPTURES.filter((c) => c.inst === instId);
  // Expand every card (capture-level first) into ordered key rows with stable ids.
  CAPTURES.forEach((cap) => {
    cap.cards = [confCard(cap)].concat(cap.modules).map((m) => {
      const row = (k, cls) => Object.assign({}, k, { id: `${m.id || m.code}${cls ? '|cls:' + cls : ''}|${k.s}`, cls: cls || null });
      return Object.assign({}, m, { rows: m.keys.map((k) => row(k)).concat((m.classes || []).flatMap((c) => c.keys.map((k) => row(k, c.name)))) });
    });
  });
  const CAP = Object.fromEntries(CAPTURES.map((c) => [c.id, c]));
  const valuesOf = (cap) => cap.cards.flatMap((m) => m.rows);
  const clone = (o) => JSON.parse(JSON.stringify(o));

  // Setup of one instance: { "<captureKey>": { "<keyId>": "<Display Name>" } } (ticked = has an entry).
  // Stored: { saved, instances: { line1: { mode: 'same'|'separate', setup }, line2: { … } },   <- setup in use
  //           pending: { line1: { mode, setup } } }                                           <- saved on a running instance, waits for a restart
  const RUNNING = new Set(['line1']);
  function emptySetup(instId) { const s = {}; capsOf(instId).forEach((cap) => { s[cap.id] = {}; }); return s; }
  function sampleSetup(instId) {
    const s = emptySetup(instId);
    capsOf(instId).forEach((cap) => valuesOf(cap).forEach((k) => { if (k.sample) s[cap.id][k.id] = k.sample; }));
    return s;
  }
  function normalizeSetup(instId, stored) {
    const s = emptySetup(instId);
    capsOf(instId).forEach((cap) => {
      const m = (stored && stored[cap.id]) || {};
      valuesOf(cap).forEach((k) => { if (typeof m[k.id] === 'string' && m[k.id].trim()) s[cap.id][k.id] = m[k.id].trim().slice(0, 40); });
    });
    return s;
  }
  const normMode = (m) => (m === 'separate' ? 'separate' : 'same');
  // Only the current shape counts; anything older is treated as nothing saved.
  const isObj = (o) => !!o && typeof o === 'object' && !Array.isArray(o);
  const validMap = (o) => isObj(o) && Object.values(o).every((x) => isObj(x) && isObj(x.setup) &&
    Object.values(x.setup).every((m) => isObj(m) && Object.values(m).every((v) => typeof v === 'string')));
  function validStored(st) {
    return !!st && !!st.saved && validMap(st.instances) && (st.pending == null || validMap(st.pending));
  }
  function normalizeState(instances) {
    const out = {};
    INSTANCES.forEach((i) => { const x = (instances && instances[i.id]) || {}; out[i.id] = { mode: normMode(x.mode), setup: normalizeSetup(i.id, x.setup) }; });
    return out;
  }
  function normalizePending(pending) {
    const out = {};
    Object.keys(pending || {}).forEach((id) => { if (INSTANCES.some((i) => i.id === id)) out[id] = normalizeState({ [id]: pending[id] })[id]; });
    return out;
  }
  const ticked = (setup, capId) => Object.keys((setup && setup[capId]) || {}).length;
  const isSetUp = (setup) => Object.keys(setup || {}).some((capId) => ticked(setup, capId) > 0);
  // Separate-columns mode: one column per Display Name, in setup order (capture, module, key); same name = one column.
  function keyColumns(instId, setup) {
    const cols = [], seen = new Set();
    capsOf(instId).forEach((cap) => valuesOf(cap).forEach((k) => {
      const n = setup[cap.id] && setup[cap.id][k.id];
      if (!n) return;
      const low = n.toLowerCase();
      if (!seen.has(low)) { seen.add(low); cols.push(n); }
    }));
    return cols;
  }

  // ---------- Sample cycles (Line 1 Instance, newest first) ----------
  // Per-cycle key copies, saved when each capture finished. The cross-capture dimension (Front View ↔ Label Side)
  // is saved at cycle end on the row of each capture it is ticked under, so both rows carry its copy.
  const b = (x) => (x ? 'true' : 'false');
  function dimOut(gap) {
    const d = 'DIM:Distance_LabelGap|';
    return { [d + 'dim_result']: b(gap >= 12 && gap <= 13), [d + 'dim_predicted_value']: gap.toFixed(2), [d + 'dim_unit_used']: 'mm',
      [d + 'dim_process']: 'distance', [d + 'dim_current_gt']: '12-13' };
  }
  function cp1Out(screws, slot2, ms, angle, gap) {
    const odcOk = screws === 4, icOk = slot2 !== 'Bad';
    return Object.assign({ 'conf|completion_status': '1', 'conf|inference_time': String(ms), 'conf|result': b(odcOk && icOk),
      'ODC|result': b(odcOk), 'ODC|cls:Screw|result': b(odcOk), 'ODC|cls:Screw|current_count': String(screws),
      'ODC|cls:Washer|result': 'true', 'ODC|cls:Washer|current_count': '2',
      'IC|result': b(icOk), 'IC|detected_class (Slot 1)': 'Good', 'IC|detected_class (Slot 2)': slot2, 'IC|correct_class': 'Good',
      'SE|shape:Bracket_angle': angle, 'SE|shape:Bracket_length': '184.30', 'SE|shape:Bracket_error_pct': '0.42' }, dimOut(gap));
  }
  function cp3Out(serial, code, ms, angle, gap) {
    const read = code !== '—';
    return Object.assign({ 'conf|completion_status': '1', 'conf|inference_time': String(ms), 'conf|result': b(read),
      'OCR|result': 'true', 'OCR|detected_text': serial, 'OCR|labelName:Serial_gt_text': serial, 'OCR|labelName:Serial_result': 'true',
      'CR|result': b(read), 'CR|detected_string': code, 'CR|gt_string': read ? code : 'FRK2026A0041',
      'SE|shape:Label_angle': angle, 'SE|shape:Label_length': '62.15', 'SE|shape:Label_error_pct': '0.61' }, dimOut(gap));
  }
  // kind/frame fields feed the image viewer only.
  const cp1 = (result, out, frame) => ({ pos: 'CP1', name: 'Front View', kind: 'front', result, out, frame });
  const cp3 = (result, out, frame) => ({ pos: 'CP3', name: 'Label Side', kind: 'label', result, out, frame });
  const CYCLES = [
    { ts: '20/10/2026, 02:14:07 PM', variant: 'Variant A', result: true, caps: [
      cp1(true, cp1Out(4, 'Empty', 184, '89.62', 12.46), { screw: '4', slot1: 'Good', slot2: 'Empty' }),
      cp3(true, cp3Out('SN-48213', 'FRK2026A0042', 139, '0.84', 12.46), { text: 'SN-48213', code: 'FRK2026A0042', scratch: '2', dent: '0' })] },
    { ts: '20/10/2026, 02:14:01 PM', variant: 'Variant A', result: false, caps: [
      cp1(false, cp1Out(3, 'Bad', 191, '89.71', 13.42), { screw: '3', slot1: 'Good', slot2: 'Bad' }),
      cp3(false, cp3Out('SN-48212', '—', 143, '1.12', 13.42), { text: 'SN-48212', code: '—', scratch: '3', dent: '1' })] },
    // Ran before the Label gap dimension was put in use: its keys were not saved for this cycle.
    { ts: '20/10/2026, 02:13:55 PM', variant: 'Variant A', result: true, notSaved: ['DIM:Distance_LabelGap|'], caps: [
      cp1(true, cp1Out(4, 'Empty', 179, '89.55', 12.39), { screw: '4', slot1: 'Good', slot2: 'Empty' }),
      cp3(true, cp3Out('SN-48211', 'FRK2026A0040', 137, '0.77', 12.39), { text: 'SN-48211', code: 'FRK2026A0040', scratch: '1', dent: '0' })] },
  ];
  const capIdOf = (cycle, cap) => cycle.variant.slice(-1) + '-' + cap.pos;
  // The sample cycles ran with the sample setup in use: only its keys were saved. Any other key shows "Not saved".
  const SAMPLE_IN_USE = new Set(Object.entries(sampleSetup('line1')).flatMap(([capId, m]) => Object.keys(m).map((id) => capId + '::' + id)));
  function valueOf(cycle, cap, capId, k) {
    if (!SAMPLE_IN_USE.has(capId + '::' + k.id) || (cycle.notSaved || []).some((p) => k.id.startsWith(p))) return 'Not saved';
    const v = cap.out[k.id];
    if (v == null || v === '') return '—';
    return k.t === 1 ? (v === 'true' ? 'OK' : v === 'false' ? 'NG' : v) : v;
  }
  // Ticked keys of one capture row (Line 1 Instance cycles), in setup order: [{ name: Display Name, value }]
  function outputLines(cycle, cap, setup) {
    const capId = capIdOf(cycle, cap), conf = setup && setup[capId];
    if (!conf || !CAP[capId]) return [];
    return valuesOf(CAP[capId]).filter((k) => conf[k.id]).map((k) => ({ name: conf[k.id], value: valueOf(cycle, cap, capId, k) }));
  }
  // Separate mode cell: the value of this capture's key with that Display Name, '' when the capture has none.
  function keyCell(cycle, cap, setup, colName) {
    const l = outputLines(cycle, cap, setup).find((x) => x.name.toLowerCase() === colName.toLowerCase());
    return l ? l.value : '';
  }

  // What a screen shows. kind: 'first' (nothing set up yet), 'draft' (window shows the sample, nothing in use),
  // 'pending' (sample saved on running Line 1, waiting for a restart) or 'restarted' (the deployment was restarted:
  // the saved setup is in use). inUse drives the table, Edit Table, Search and Excel; latest is what the window shows.
  function resolveState(kind) {
    const st = readStore();
    if (validStored(st)) {
      const inst = normalizeState(st.instances), pend = normalizePending(st.pending), latest = Object.assign({}, inst, pend);
      // Reaching a step after the restart is the restart: the saved setup goes into use.
      if (kind === 'restarted' && Object.keys(pend).length) writeStore({ saved: true, instances: latest, pending: {} });
      return { stored: true, inUse: kind === 'restarted' ? clone(latest) : inst, latest: clone(latest),
        pendingIds: kind === 'restarted' ? [] : Object.keys(pend) };
    }
    const sample = kind !== 'first', inUse = {}, latest = {};
    INSTANCES.forEach((i) => {
      inUse[i.id] = { mode: 'same', setup: kind === 'restarted' ? sampleSetup(i.id) : emptySetup(i.id) };
      latest[i.id] = { mode: 'same', setup: sample ? sampleSetup(i.id) : emptySetup(i.id) };
    });
    return { stored: false, inUse, latest, pendingIds: kind === 'pending' ? ['line1'] : [] };
  }

  function modeFromUrl() {
    try { return new URLSearchParams(location.search).get('mode') === 'today' ? 'today' : 'after'; } catch (e) { return 'after'; }
  }

  g.MO = { KEY, EMBED, readStore, writeStore, postNav, CAPTURES, CAP, INSTANCES, RUNNING, capsOf, valuesOf, clone, emptySetup, sampleSetup,
    normalizeSetup, normalizeState, ticked, isSetUp, keyColumns, keyCell, CYCLES, capIdOf, outputLines, resolveState, modeFromUrl };
})(window);
