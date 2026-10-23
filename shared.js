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
  // t = datatype (1 bool, 2 str, 3 num); s = suffix exactly as stored; label = how the table shows it for now.
  const K = (t, s, label, tick) => ({ t, s, label, tick: !!tick });
  const modKeys = (name) => [K(1, 'result', name + ' result'), K(3, 'pass_count', name + ' pass count'), K(3, 'fail_count', name + ' fail count')];
  const confCard = (cap) => ({ name: `${cap.pos} · ${cap.name}`, code: 'conf', conf: true, keys: [
    K(3, 'completion_status', 'Completion status'), K(3, 'inference_time', 'Inference time'), K(3, 'avg_inference_time', 'Avg inference time'),
    K(3, 'pass_count', 'Capture pass count'), K(3, 'fail_count', 'Capture fail count'), K(1, 'result', 'Capture result')] });
  const clsKeys = (cls, countTick) => ({ name: cls, keys: [K(1, 'result', cls + ' result'), K(3, 'current_count', cls + ' count', countTick),
    K(3, 'count_till_now', cls + ' count till now')] });

  const A_CP1 = [
    { name: 'Fastener Check', type: 'Object Detection & Classification', code: 'ODC', keys: modKeys('Fastener'),
      classes: [clsKeys('Screw', true), clsKeys('Washer', true)] },
    { name: 'Slot Check', type: 'Image Classification', code: 'IC', keys: modKeys('Slot').concat([
      K(2, 'detected_class (Slot 1)', 'Slot 1 class', true), K(2, 'detected_class (Slot 2)', 'Slot 2 class', true), K(2, 'correct_class', 'Correct class')]) },
  ];
  const A_CP3 = [
    { name: 'Serial Reader', type: 'OCR', code: 'OCR', keys: modKeys('Serial').concat([
      K(2, 'detected_text', 'Detected text', true), K(2, 'labelName:Serial_gt_text', 'Serial expected'), K(1, 'labelName:Serial_result', 'Serial match'),
      K(2, 'labelName:Serial_pass_count', 'Serial match pass count'), K(2, 'labelName:Serial_fail_count', 'Serial match fail count')]) },
    { name: 'QR Reader', type: 'Code Reader', code: 'CR', keys: modKeys('Code').concat([
      K(2, 'detected_string', 'Detected code', true), K(2, 'gt_string', 'Expected code')]) },
    { name: 'Surface Check', type: 'Segmentation', code: 'SEG', keys: [] },
  ];
  const B_CP1 = [
    { name: 'Seal Check', type: 'Bead Inspection', code: 'BEAD', keys: [
      K(1, 'result', 'Seal result', true), K(3, 'pass_count', 'Seal pass count'), K(3, 'fail_count', 'Seal fail count'),
      K(3, 'caliper_pass_percentage', 'Caliper pass %', true), K(2, 'bead_class_name', 'Bead class'), K(1, 'bead:Door seal_result', 'Door seal result'),
      K(3, 'bead:Door seal_pass_count', 'Door seal pass count'), K(3, 'bead:Door seal_fail_count', 'Door seal fail count'),
      K(1, 'bead:Door seal_bead_width', 'Door seal width'), K(1, 'bead:Door seal_bead_gap/position', 'Door seal gap')] },
    { name: 'Cap Colour', type: 'Colour Detection', code: 'CD', keys: modKeys('Colour').concat([
      K(2, 'colorName:Red_detected_color', 'Detected colour'), K(1, 'colorName:Red_result', 'Red result'), K(3, 'colorName:Red_pass_count', 'Red pass count'),
      K(3, 'colorName:Red_fail_count', 'Red fail count'), K(3, 'colorName:Red_distribution_percentage', 'Red coverage', true)]) },
    { name: 'Hole Fit', type: 'Shape Extractor', code: 'SE', keys: [
      K(3, 'shape:Hole_radius', 'Hole radius', true), K(3, 'shape:Hole_perimeter', 'Hole perimeter'), K(3, 'shape:Hole_area', 'Hole area'),
      K(3, 'shape:Hole_circularity', 'Hole circularity'), K(3, 'shape:Hole_convexity', 'Hole convexity'),
      K(3, 'shape:Hole_contour_continuity', 'Hole contour continuity'), K(3, 'shape:Hole_error_pct', 'Hole error %')] },
    { name: 'Label Tilt', type: 'Orientation & Tilt Check', code: 'OTC', keys: modKeys('Tilt') },
    // Dimensions keys are variant-level; shown last in this capture's view.
    { name: 'Hole Diameter', type: 'Dimensions', code: 'DIM', keys: [
      K(1, 'dim_result', 'Hole Diameter result'), K(3, 'dim_predicted_value', 'Hole Diameter', true), K(2, 'dim_unit_used', 'Unit'),
      K(2, 'dim_process', 'Process'), K(2, 'dim_current_gt', 'Hole Diameter expected')] },
  ];
  // Capture keys used in the shared state: "<variant letter>-<camera position>"
  const CAPTURES = [
    { id: 'A-CP1', variant: 'Variant A', pos: 'CP1', name: 'Front View', modules: A_CP1 },
    { id: 'A-CP3', variant: 'Variant A', pos: 'CP3', name: 'Label Side', modules: A_CP3 },
    { id: 'B-CP1', variant: 'Variant B', pos: 'CP1', name: 'Front View', modules: B_CP1 },
  ];
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

  // Setup in memory: { "<captureKey>": { "<keyId>": true } }; stored as arrays of ticked key ids.
  function emptySetup() { const s = {}; CAPTURES.forEach((cap) => { s[cap.id] = {}; }); return s; }
  function sampleSetup() {
    const s = emptySetup();
    CAPTURES.forEach((cap) => valuesOf(cap).forEach((k) => { if (k.tick) s[cap.id][k.id] = true; }));
    return s;
  }
  function normalizeSetup(stored) {
    const s = emptySetup();
    if (!stored || typeof stored !== 'object') return s;
    CAPTURES.forEach((cap) => {
      const ids = new Set(Array.isArray(stored[cap.id]) ? stored[cap.id] : []);
      valuesOf(cap).forEach((k) => { if (ids.has(k.id)) s[cap.id][k.id] = true; });
    });
    return s;
  }
  const toStored = (setup) => Object.fromEntries(CAPTURES.map((cap) => [cap.id, valuesOf(cap).filter((k) => setup[cap.id] && setup[cap.id][k.id]).map((k) => k.id)]));
  const ticked = (setup, capId) => Object.values((setup && setup[capId]) || {}).filter(Boolean).length;
  const isSetUp = (setup) => CAPTURES.some((c) => ticked(setup, c.id) > 0);

  // ---------- Sample cycles (Line 1 Instance, newest first) ----------
  function cp1Out(screws, slot2, pass, fail, ms) {
    const odcOk = screws === 4, icOk = slot2 !== 'Bad', ok = odcOk && icOk, b = (x) => (x ? 'true' : 'false');
    return { 'conf|completion_status': '1', 'conf|inference_time': String(ms), 'conf|avg_inference_time': '176', 'conf|pass_count': String(pass),
      'conf|fail_count': String(fail), 'conf|result': b(ok), 'ODC|result': b(odcOk), 'ODC|pass_count': String(pass + 3), 'ODC|fail_count': String(odcOk ? fail - 1 : fail),
      'ODC|cls:Screw|result': b(odcOk), 'ODC|cls:Screw|current_count': String(screws), 'ODC|cls:Screw|count_till_now': String(512 + screws),
      'ODC|cls:Washer|result': 'true', 'ODC|cls:Washer|current_count': '2', 'ODC|cls:Washer|count_till_now': '258',
      'IC|result': b(icOk), 'IC|pass_count': String(pass + 1), 'IC|fail_count': String(icOk ? fail - 1 : fail),
      'IC|detected_class (Slot 1)': 'Good', 'IC|detected_class (Slot 2)': slot2, 'IC|correct_class': 'Good' };
  }
  function cp3Out(serial, code, pass, fail, ms) {
    const read = code !== '—', b = (x) => (x ? 'true' : 'false');
    return { 'conf|completion_status': '1', 'conf|inference_time': String(ms), 'conf|avg_inference_time': '141', 'conf|pass_count': String(pass),
      'conf|fail_count': String(fail), 'conf|result': b(read), 'OCR|result': 'true', 'OCR|pass_count': String(pass + 1), 'OCR|fail_count': '0',
      'OCR|detected_text': serial, 'OCR|labelName:Serial_gt_text': serial, 'OCR|labelName:Serial_result': 'true',
      'OCR|labelName:Serial_pass_count': String(pass + 1), 'OCR|labelName:Serial_fail_count': '0',
      'CR|result': b(read), 'CR|pass_count': String(read ? pass : pass - 1), 'CR|fail_count': String(fail), 'CR|detected_string': code,
      'CR|gt_string': read ? code : 'FRK2026A0041' };
  }
  // kind/frame fields feed the image viewer only.
  const cp1 = (result, out, frame) => ({ pos: 'CP1', name: 'Front View', kind: 'front', result, out, frame });
  const cp3 = (result, out, frame) => ({ pos: 'CP3', name: 'Label Side', kind: 'label', result, out, frame });
  const CYCLES = [
    { ts: '20/10/2026, 02:14:07 PM', variant: 'Variant A', result: true, caps: [
      cp1(true, cp1Out(4, 'Empty', 127, 5, 184), { screw: '4', slot1: 'Good', slot2: 'Empty' }),
      cp3(true, cp3Out('SN-48213', 'FRK2026A0042', 127, 1, 139), { text: 'SN-48213', code: 'FRK2026A0042', scratch: '2', dent: '0' })] },
    { ts: '20/10/2026, 02:14:01 PM', variant: 'Variant A', result: false, caps: [
      cp1(false, cp1Out(3, 'Bad', 126, 5, 191), { screw: '3', slot1: 'Good', slot2: 'Bad' }),
      cp3(false, cp3Out('SN-48212', '—', 126, 1, 143), { text: 'SN-48212', code: '—', scratch: '3', dent: '1' })] },
    { ts: '20/10/2026, 02:13:55 PM', variant: 'Variant A', result: true, caps: [
      cp1(true, cp1Out(4, 'Empty', 126, 4, 179), { screw: '4', slot1: 'Good', slot2: 'Empty' }),
      cp3(true, cp3Out('SN-48211', 'FRK2026A0040', 126, 0, 137), { text: 'SN-48211', code: 'FRK2026A0040', scratch: '1', dent: '0' })] },
  ];
  const capIdOf = (cycle, cap) => cycle.variant.slice(-1) + '-' + cap.pos;
  // Ticked keys of one capture row, in card order: [{ name, value }]
  function outputLines(cycle, cap, setup) {
    const capId = capIdOf(cycle, cap), conf = setup && setup[capId];
    if (!conf || !CAP[capId]) return [];
    return valuesOf(CAP[capId]).filter((k) => conf[k.id] && cap.out[k.id] != null).map((k) => ({ name: k.label, value: cap.out[k.id] }));
  }

  // Which setup a screen shows: the saved one once the user has saved, else the fallback for that step.
  // A store from an older build (names instead of key ids) counts as nothing saved.
  function resolveSetup(useSample) {
    const st = readStore();
    const valid = st && st.saved && st.setup && typeof st.setup === 'object' && Object.values(st.setup).every(Array.isArray);
    if (valid) return { stored: true, setup: normalizeSetup(st.setup) };
    return { stored: false, setup: useSample ? sampleSetup() : emptySetup() };
  }

  function modeFromUrl() {
    try { return new URLSearchParams(location.search).get('mode') === 'today' ? 'today' : 'after'; } catch (e) { return 'after'; }
  }

  g.MO = { KEY, EMBED, readStore, writeStore, postNav, CAPTURES, CAP, valuesOf, clone, emptySetup, sampleSetup,
    normalizeSetup, ticked, isSetUp, toStored, CYCLES, capIdOf, outputLines, resolveSetup, modeFromUrl };
})(window);
