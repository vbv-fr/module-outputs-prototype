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

  // ---------- What each capture's modules offer (`tick` = ticked in the sample setup) ----------
  const FRONT_MODULES = [
    { name: 'Fastener Check', type: 'Object Detection & Classification', values: [
      { id: 'screw', auto: 'Screw count', ex: '4', tick: true }, { id: 'screwRes', auto: 'Screw result', ex: 'OK' },
      { id: 'washer', auto: 'Washer count', ex: '2', tick: true }, { id: 'washerRes', auto: 'Washer result', ex: 'OK' }] },
    { name: 'Slot Check', type: 'Image Classification', values: [
      { id: 'slot1', auto: 'Slot 1 class', ex: 'Good', tick: true }, { id: 'slot1Conf', auto: 'Slot 1 confidence', ex: '0.98' },
      { id: 'slot1Res', auto: 'Slot 1 result', ex: 'OK' }, { id: 'slot2', auto: 'Slot 2 class', ex: 'Empty', tick: true },
      { id: 'slot2Conf', auto: 'Slot 2 confidence', ex: '0.95' }, { id: 'slot2Res', auto: 'Slot 2 result', ex: 'OK' }] },
  ];
  const LABEL_MODULES = [
    { name: 'Serial Reader', type: 'OCR', values: [
      { id: 'text', auto: 'Detected text', ex: 'SN-48213', tick: true, sampleName: 'Serial No.' },
      { id: 'serialText', auto: 'Serial text', ex: 'SN-48213' }, { id: 'serialRes', auto: 'Serial result', ex: 'Matched' }] },
    { name: 'QR Reader', type: 'Code Reader', values: [
      { id: 'code', auto: 'Detected code', ex: 'FRK2026A0042', tick: true }, { id: 'codeRes', auto: 'Code result', ex: 'OK' }] },
    { name: 'Surface Check', type: 'Segmentation', values: [
      { id: 'scratch', auto: 'Scratch regions', ex: '2', tick: true }, { id: 'dent', auto: 'Dent regions', ex: '0', tick: true },
      { id: 'classes', auto: 'Detected classes', ex: 'Scratch' }, { id: 'segRes', auto: 'Segmentation result', ex: 'OK' }] },
  ];
  const B_FRONT_MODULES = [
    { name: 'Seal Check', type: 'Bead Inspection', values: [
      { id: 'bead', auto: 'Bead result', ex: 'NG', tick: true }, { id: 'calPct', auto: 'Caliper pass %', ex: '76.5%', tick: true },
      { id: 'calBad', auto: 'Incorrect calipers', ex: '47 of 200', tick: true }, { id: 'sealRes', auto: 'Door seal result', ex: 'NG' },
      { id: 'sealGaps', auto: 'Door seal gaps', ex: '2 (largest 80 px)' }, { id: 'sealWidth', auto: 'Door seal width fails', ex: '0' }] },
    { name: 'Cap Colour', type: 'Colour Detection', values: [
      { id: 'red', auto: 'Red coverage', ex: '42%', tick: true }, { id: 'redRes', auto: 'Red result', ex: 'OK' }] },
    { name: 'Hole Fit', type: 'Shape Extractor', values: [
      { id: 'radius', auto: 'Hole radius', ex: '62.7 px' }, { id: 'fit', auto: 'Hole fit', ex: 'OK' }] },
    { name: 'Hole Diameter', type: 'Dimensions', values: [
      { id: 'dia', auto: 'Hole Diameter', ex: '12.4 mm', tick: true }, { id: 'diaExp', auto: 'Hole Diameter expected', ex: '12–13 mm' },
      { id: 'diaRes', auto: 'Hole Diameter result', ex: 'OK' }] },
    { name: 'Label Tilt', type: 'Orientation & Tilt Check', values: [
      { id: 'tilt', auto: 'Tilt', ex: '3.2° clockwise', tick: true }, { id: 'tiltAllowed', auto: 'Tilt allowed', ex: '0–5°' },
      { id: 'tiltRes', auto: 'Tilt result', ex: 'OK' }] },
  ];
  // Capture keys used in the shared state: "<variant letter>-<camera position>"
  const CAPTURES = [
    { id: 'A-CP1', variant: 'Variant A', pos: 'CP1', name: 'Front View', modules: FRONT_MODULES },
    { id: 'A-CP3', variant: 'Variant A', pos: 'CP3', name: 'Label Side', modules: LABEL_MODULES },
    { id: 'B-CP1', variant: 'Variant B', pos: 'CP1', name: 'Front View', modules: B_FRONT_MODULES },
  ];
  const CAP = Object.fromEntries(CAPTURES.map((c) => [c.id, c]));
  const valuesOf = (cap) => cap.modules.flatMap((m) => m.values);
  const clone = (o) => JSON.parse(JSON.stringify(o));

  function emptySetup() {
    const s = {};
    CAPTURES.forEach((cap) => { s[cap.id] = {}; valuesOf(cap).forEach((v) => { s[cap.id][v.id] = { on: false, name: v.auto }; }); });
    return s;
  }
  function sampleSetup() {
    const s = emptySetup();
    CAPTURES.forEach((cap) => valuesOf(cap).forEach((v) => { s[cap.id][v.id] = { on: !!v.tick, name: v.sampleName || v.auto }; }));
    return s;
  }
  // Stored setup laid over the full list, so unknown or missing keys never break a screen.
  function normalizeSetup(stored) {
    const s = emptySetup();
    if (!stored || typeof stored !== 'object') return s;
    CAPTURES.forEach((cap) => valuesOf(cap).forEach((v) => {
      const x = stored[cap.id] && stored[cap.id][v.id];
      if (!x || typeof x !== 'object') return;
      s[cap.id][v.id] = { on: !!x.on, name: typeof x.name === 'string' && x.name.trim() ? x.name : v.auto };
    }));
    return s;
  }
  const ticked = (setup, capId) => Object.values((setup && setup[capId]) || {}).filter((x) => x.on).length;
  const isSetUp = (setup) => CAPTURES.some((c) => ticked(setup, c.id) > 0);

  // ---------- Sample cycles (Line 1 Instance, newest first) ----------
  const front = (screw, slot2, conf2) => ({ screw, screwRes: screw === '4' ? 'OK' : 'NG', washer: '2', washerRes: 'OK',
    slot1: 'Good', slot1Conf: '0.98', slot1Res: 'OK', slot2, slot2Conf: conf2, slot2Res: slot2 === 'Bad' ? 'NG' : 'OK' });
  const label = (serial, code, scratch, dent) => ({ text: serial, serialText: serial, serialRes: 'Matched', code,
    codeRes: code === '—' ? 'NG' : 'OK', scratch, dent,
    classes: [scratch !== '0' && 'Scratch', dent !== '0' && 'Dent'].filter(Boolean).join(', ') || '—', segRes: 'OK' });
  const cp1 = (result, out) => ({ pos: 'CP1', name: 'Front View', kind: 'front', result, out });
  const cp3 = (result, out) => ({ pos: 'CP3', name: 'Label Side', kind: 'label', result, out });
  const CYCLES = [
    { ts: '20/10/2026, 02:14:07 PM', variant: 'Variant A', result: true, caps: [
      cp1(true, front('4', 'Empty', '0.95')), cp3(true, label('SN-48213', 'FRK2026A0042', '2', '0'))] },
    { ts: '20/10/2026, 02:14:01 PM', variant: 'Variant A', result: false, caps: [
      cp1(false, front('3', 'Bad', '0.91')), cp3(false, label('SN-48212', '—', '3', '1'))] },
    { ts: '20/10/2026, 02:13:55 PM', variant: 'Variant A', result: true, caps: [
      cp1(true, front('4', 'Empty', '0.96')), cp3(true, label('SN-48211', 'FRK2026A0040', '1', '0'))] },
  ];
  const capIdOf = (cycle, cap) => cycle.variant.slice(-1) + '-' + cap.pos;
  // Ticked values of one capture row, in module order: [{ name, value }]
  function outputLines(cycle, cap, setup) {
    const capId = capIdOf(cycle, cap), conf = setup && setup[capId];
    if (!conf || !CAP[capId]) return [];
    return valuesOf(CAP[capId]).filter((v) => conf[v.id] && conf[v.id].on && cap.out[v.id] != null)
      .map((v) => ({ name: conf[v.id].name, value: cap.out[v.id] }));
  }

  // Which setup a screen shows: the saved one once the user has saved, else the fallback for that step.
  function resolveSetup(useSample) {
    const st = readStore();
    if (st && st.saved) return { stored: true, setup: normalizeSetup(st.setup) };
    return { stored: false, setup: useSample ? sampleSetup() : emptySetup() };
  }

  function modeFromUrl() {
    try { return new URLSearchParams(location.search).get('mode') === 'today' ? 'today' : 'after'; } catch (e) { return 'after'; }
  }

  g.MO = { KEY, EMBED, readStore, writeStore, postNav, CAPTURES, CAP, valuesOf, clone, emptySetup, sampleSetup,
    normalizeSetup, ticked, isSetUp, CYCLES, capIdOf, outputLines, resolveSetup, modeFromUrl };
})(window);
