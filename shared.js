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
  const modKeys = () => [K(1, 'result'), K(3, 'pass_count'), K(3, 'fail_count')];
  const confCard = (cap) => ({ name: `${cap.pos} · ${cap.name}`, code: 'conf', conf: true, keys: [
    K(3, 'completion_status'), K(3, 'inference_time'), K(3, 'avg_inference_time'),
    K(3, 'pass_count'), K(3, 'fail_count'), K(1, 'result')] });
  const clsKeys = (cls, countName) => ({ name: cls, keys: [K(1, 'result'), K(3, 'current_count', countName),
    K(3, 'count_till_now')] });

  const A_CP1 = [
    { name: 'Fastener Check', type: 'Object Detection & Classification', code: 'ODC', keys: modKeys(),
      classes: [clsKeys('Screw', 'Screw count'), clsKeys('Washer', 'Washer count')] },
    { name: 'Slot Check', type: 'Image Classification', code: 'IC', keys: modKeys().concat([
      K(2, 'detected_class (Slot 1)', 'Slot 1 class'), K(2, 'detected_class (Slot 2)', 'Slot 2 class'), K(2, 'correct_class')]) },
  ];
  const A_CP3 = [
    { name: 'Serial Reader', type: 'OCR', code: 'OCR', keys: modKeys().concat([
      K(2, 'detected_text', 'Serial No.'), K(2, 'labelName:Serial_gt_text'), K(1, 'labelName:Serial_result'),
      K(2, 'labelName:Serial_pass_count'), K(2, 'labelName:Serial_fail_count')]) },
    { name: 'QR Reader', type: 'Code Reader', code: 'CR', keys: modKeys().concat([
      K(2, 'detected_string', 'QR code'), K(2, 'gt_string')]) },
    { name: 'Surface Check', type: 'Segmentation', code: 'SEG', keys: [] },
  ];
  const B_CP1 = [
    { name: 'Seal Check', type: 'Bead Inspection', code: 'BEAD', keys: [
      K(1, 'result', 'Bead result'), K(3, 'pass_count'), K(3, 'fail_count'),
      K(3, 'caliper_pass_percentage', 'Caliper pass %'), K(2, 'bead_class_name'), K(1, 'bead:Door seal_result'),
      K(3, 'bead:Door seal_pass_count'), K(3, 'bead:Door seal_fail_count'),
      K(1, 'bead:Door seal_bead_width'), K(1, 'bead:Door seal_bead_gap/position')] },
    { name: 'Cap Colour', type: 'Colour Detection', code: 'CD', keys: modKeys().concat([
      K(2, 'colorName:Red_detected_color'), K(1, 'colorName:Red_result'), K(3, 'colorName:Red_pass_count'),
      K(3, 'colorName:Red_fail_count'), K(3, 'colorName:Red_distribution_percentage', 'Red coverage')]) },
    { name: 'Hole Fit', type: 'Shape Extractor', code: 'SE', keys: [
      K(3, 'shape:Hole_radius', 'Hole radius'), K(3, 'shape:Hole_perimeter'), K(3, 'shape:Hole_area'),
      K(3, 'shape:Hole_circularity'), K(3, 'shape:Hole_convexity'),
      K(3, 'shape:Hole_contour_continuity'), K(3, 'shape:Hole_error_pct')] },
    { name: 'Label Tilt', type: 'Orientation & Tilt Check', code: 'OTC', keys: modKeys() },
    // Dimensions keys are variant-level; shown last in this capture's view.
    { name: 'Hole Diameter', type: 'Dimensions', code: 'DIM', keys: [
      K(1, 'dim_result'), K(3, 'dim_predicted_value', 'Hole diameter'), K(2, 'dim_unit_used'),
      K(2, 'dim_process'), K(2, 'dim_current_gt')] },
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
      const row = (k, cls) => Object.assign({}, k, { id: `${m.code}${cls ? '|cls:' + cls : ''}|${k.s}`, cls: cls || null });
      return Object.assign({}, m, { rows: m.keys.map((k) => row(k)).concat((m.classes || []).flatMap((c) => c.keys.map((k) => row(k, c.name)))) });
    });
  });
  const CAP = Object.fromEntries(CAPTURES.map((c) => [c.id, c]));
  const valuesOf = (cap) => cap.cards.flatMap((m) => m.rows);
  const clone = (o) => JSON.parse(JSON.stringify(o));

  // Setup of one instance: { "<captureKey>": { "<keyId>": "<Display Name>" } } (ticked = has an entry).
  // Stored: { saved, instances: { line1: { mode: 'same'|'separate', setup }, line2: { … } } }.
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
  function validStored(st) {
    if (!st || !st.saved || !st.instances || typeof st.instances !== 'object' || Array.isArray(st.instances)) return false;
    return Object.values(st.instances).every((x) => x && typeof x === 'object' && x.setup && typeof x.setup === 'object' && !Array.isArray(x.setup) &&
      Object.values(x.setup).every((m) => m && typeof m === 'object' && !Array.isArray(m) && Object.values(m).every((v) => typeof v === 'string')));
  }
  function normalizeState(instances) {
    const out = {};
    INSTANCES.forEach((i) => { const x = (instances && instances[i.id]) || {}; out[i.id] = { mode: normMode(x.mode), setup: normalizeSetup(i.id, x.setup) }; });
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
  // Per-cycle values. Running counters (pass/fail counts, count till now, averages, completion status) have no
  // per-cycle value, so they are absent here and show as "—".
  function cp1Out(screws, slot2, ms) {
    const odcOk = screws === 4, icOk = slot2 !== 'Bad', b = (x) => (x ? 'true' : 'false');
    return { 'conf|inference_time': String(ms), 'conf|result': b(odcOk && icOk), 'ODC|result': b(odcOk),
      'ODC|cls:Screw|result': b(odcOk), 'ODC|cls:Screw|current_count': String(screws),
      'ODC|cls:Washer|result': 'true', 'ODC|cls:Washer|current_count': '2',
      'IC|result': b(icOk), 'IC|detected_class (Slot 1)': 'Good', 'IC|detected_class (Slot 2)': slot2, 'IC|correct_class': 'Good' };
  }
  function cp3Out(serial, code, ms) {
    const read = code !== '—', b = (x) => (x ? 'true' : 'false');
    return { 'conf|inference_time': String(ms), 'conf|result': b(read), 'OCR|result': 'true', 'OCR|detected_text': serial,
      'OCR|labelName:Serial_gt_text': serial, 'OCR|labelName:Serial_result': 'true',
      'CR|result': b(read), 'CR|detected_string': code, 'CR|gt_string': read ? code : 'FRK2026A0041' };
  }
  // kind/frame fields feed the image viewer only.
  const cp1 = (result, out, frame) => ({ pos: 'CP1', name: 'Front View', kind: 'front', result, out, frame });
  const cp3 = (result, out, frame) => ({ pos: 'CP3', name: 'Label Side', kind: 'label', result, out, frame });
  const CYCLES = [
    { ts: '20/10/2026, 02:14:07 PM', variant: 'Variant A', result: true, caps: [
      cp1(true, cp1Out(4, 'Empty', 184), { screw: '4', slot1: 'Good', slot2: 'Empty' }),
      cp3(true, cp3Out('SN-48213', 'FRK2026A0042', 139), { text: 'SN-48213', code: 'FRK2026A0042', scratch: '2', dent: '0' })] },
    { ts: '20/10/2026, 02:14:01 PM', variant: 'Variant A', result: false, caps: [
      cp1(false, cp1Out(3, 'Bad', 191), { screw: '3', slot1: 'Good', slot2: 'Bad' }),
      cp3(false, cp3Out('SN-48212', '—', 143), { text: 'SN-48212', code: '—', scratch: '3', dent: '1' })] },
    { ts: '20/10/2026, 02:13:55 PM', variant: 'Variant A', result: true, caps: [
      cp1(true, cp1Out(4, 'Empty', 179), { screw: '4', slot1: 'Good', slot2: 'Empty' }),
      cp3(true, cp3Out('SN-48211', 'FRK2026A0040', 137), { text: 'SN-48211', code: 'FRK2026A0040', scratch: '1', dent: '0' })] },
  ];
  const capIdOf = (cycle, cap) => cycle.variant.slice(-1) + '-' + cap.pos;
  // Ticked keys of one capture row (Line 1 Instance cycles), in setup order: [{ name: Display Name, value }]
  function outputLines(cycle, cap, setup) {
    const capId = capIdOf(cycle, cap), conf = setup && setup[capId];
    if (!conf || !CAP[capId]) return [];
    return valuesOf(CAP[capId]).filter((k) => conf[k.id]).map((k) => ({ name: conf[k.id], value: cap.out[k.id] != null ? cap.out[k.id] : '—' }));
  }
  // Separate mode cell: the value of this capture's key with that Display Name, '' when the capture has none.
  function keyCell(cycle, cap, setup, colName) {
    const l = outputLines(cycle, cap, setup).find((x) => x.name.toLowerCase() === colName.toLowerCase());
    return l ? l.value : '';
  }

  // What a screen shows: the saved state once the user has saved, else the fallback (Line 1 sample or empty, same column).
  function resolveState(useSample) {
    const st = readStore();
    if (validStored(st)) return { stored: true, instances: normalizeState(st.instances) };
    const instances = {};
    INSTANCES.forEach((i) => { instances[i.id] = { mode: 'same', setup: useSample ? sampleSetup(i.id) : emptySetup(i.id) }; });
    return { stored: false, instances };
  }

  function modeFromUrl() {
    try { return new URLSearchParams(location.search).get('mode') === 'today' ? 'today' : 'after'; } catch (e) { return 'after'; }
  }

  g.MO = { KEY, EMBED, readStore, writeStore, postNav, CAPTURES, CAP, INSTANCES, capsOf, valuesOf, clone, emptySetup, sampleSetup,
    normalizeSetup, normalizeState, ticked, isSetUp, keyColumns, keyCell, CYCLES, capIdOf, outputLines, resolveState, modeFromUrl };
})(window);
