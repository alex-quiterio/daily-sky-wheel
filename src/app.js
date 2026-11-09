(function () {
  const C = window.AstroCore, E = window.AstroEvents, norm = C.norm;
  const $ = (id) => document.getElementById(id);
  const VS = '︎';
  const GLYPH = { Sun: '☉', Moon: '☽', Mercury: '☿', Venus: '♀', Mars: '♂', Jupiter: '♃', Saturn: '♄', Uranus: '♅', Neptune: '♆', Pluto: '♇', Chiron: '⚷', Node: '☊', Lilith: '⚸', Ceres: '⚳', Pallas: '⚴', Juno: '⚵', Vesta: '⚶', Asc: 'AC', MC: 'MC', Vertex: 'Vx' };
  const LABEL = { Node: 'North Node', Lilith: 'Lilith', Asc: 'Ascendant', MC: 'Midheaven', Vertex: 'Vertex' };
  const SIGN_GLYPH = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];
  const SIGN_ABBR = ['Ari', 'Tau', 'Gem', 'Can', 'Leo', 'Vir', 'Lib', 'Sco', 'Sag', 'Cap', 'Aqu', 'Pis'];
  const EL_VAR = ['--fire', '--earth', '--air', '--water'];
  const APPROX = ['Chiron', 'Ceres', 'Pallas', 'Juno', 'Vesta'];
  const ASPECT_GLYPH = { conj: '☌', opp: '☍', tri: '△', sq: '□', sex: '⚹', qx: '⚻' };
  const ASPECT_COLOR = { conj: 'var(--muted)', opp: 'var(--fire)', sq: 'var(--fire)', tri: 'var(--water)', sex: 'var(--water)', qx: 'var(--air)' };

  const PLACES = [
    ['Lisbon', 38.72, -9.14, 'Europe/Lisbon'],
    ['Porto', 41.15, -8.61, 'Europe/Lisbon'],
    ['Faro', 37.02, -7.93, 'Europe/Lisbon'],
    ['Madrid', 40.42, -3.70, 'Europe/Madrid'],
    ['Amsterdam', 52.37, 4.90, 'Europe/Amsterdam'],
    ['London', 51.51, -0.13, 'Europe/London'],
    ['Paris', 48.86, 2.35, 'Europe/Paris'],
    ['Berlin', 52.52, 13.40, 'Europe/Berlin'],
    ['Bologna', 44.49, 11.34, 'Europe/Rome'],
    ['Francavilla al Mare', 42.42, 14.29, 'Europe/Rome'],
    ['New York', 40.72, -74.00, 'America/New_York'],
    ['Mexico City', 19.43, -99.13, 'America/Mexico_City'],
    ['Mumbai', 19.08, 72.88, 'Asia/Kolkata'],
    ['Hanoi', 21.03, 105.85, 'Asia/Ho_Chi_Minh'],
    ['Sydney', -33.87, 151.21, 'Australia/Sydney'],
  ];

  // ---------- formatting ----------
  const pad = (n) => String(n).padStart(2, '0');
  function fmtPos(l) {
    l = norm(l); const s = Math.floor(l / 30); const d = l - s * 30;
    let deg = Math.floor(d), min = Math.round((d - deg) * 60);
    if (min === 60) { min = 0; deg += 1; }
    return { deg, min, sign: s, text: `${deg}° ${SIGN_ABBR[s]} ${pad(min)}′` };
  }
  const g = (name) => (GLYPH[name] || '') + (GLYPH[name] && GLYPH[name].length === 1 ? VS : '');
  const sg = (s) => SIGN_GLYPH[s] + VS;

  // ---------- time zones ----------
  function tzOffsetMin(utcMs, tz) {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(new Date(utcMs));
    const v = Object.fromEntries(parts.map((p) => [p.type, p.value]));
    const asUTC = Date.UTC(+v.year, +v.month - 1, +v.day, +v.hour % 24, +v.minute, +v.second);
    return (asUTC - utcMs) / 60000;
  }
  function localToUTC(y, m, d, hh, mm, tz) {
    const guess = Date.UTC(y, m - 1, d, hh, mm);
    let t = guess - tzOffsetMin(guess, tz) * 60000;
    t = guess - tzOffsetMin(t, tz) * 60000;
    return new Date(t);
  }
  function localParts(date, tz) {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(date);
    const v = Object.fromEntries(parts.map((p) => [p.type, p.value]));
    return { date: `${v.year}-${v.month}-${v.day}`, time: `${pad(+v.hour % 24)}:${v.minute}` };
  }
  function tzAbbr(date, tz) {
    try {
      const p = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short' }).formatToParts(date).find((x) => x.type === 'timeZoneName');
      return p ? p.value : tz;
    } catch (e) { return tz; }
  }

  // ---------- state ----------
  const store = {
    get() { try { return JSON.parse(localStorage.getItem('skywheel') || '{}'); } catch (e) { return {}; } },
    set(v) { try { localStorage.setItem('skywheel', JSON.stringify(v)); } catch (e) { /* storage unavailable */ } },
  };

  function initControls() {
    const sel = $('place');
    PLACES.forEach((p, i) => { const o = document.createElement('option'); o.value = String(i); o.textContent = p[0]; sel.appendChild(o); });
    const oc = document.createElement('option'); oc.value = 'custom'; oc.textContent = 'Custom…'; sel.appendChild(oc);
    let zones = [];
    try { zones = Intl.supportedValuesOf('timeZone'); } catch (e) { zones = [...new Set(PLACES.map((p) => p[3]))].concat(['UTC']); }
    zones.forEach((z) => { const o = document.createElement('option'); o.value = z; o.textContent = z.replace(/_/g, ' '); $('tz').appendChild(o); });

    const saved = store.get();
    // places are remembered by name, so adding or removing cities never shifts a saved choice
    const savedIdx = saved.place === 'custom' ? 'custom' : PLACES.findIndex((p) => slug(p[0]) === saved.place);
    sel.value = savedIdx === 'custom' ? 'custom' : savedIdx >= 0 ? String(savedIdx) : '0';
    $('hsys').value = ['placidus', 'whole', 'equal', 'natural'].includes(saved.hsys) ? saved.hsys : 'placidus';
    $('lat').value = saved.lat != null ? saved.lat : 38.72;
    $('lon').value = saved.lon != null ? saved.lon : -9.14;
    $('tz').value = saved.tz || 'Europe/Lisbon';
    if (savedIdx !== 'custom' && savedIdx < 0) useBrowserPlace();
    fromGeo = savedIdx === 'custom' && saved.geo === true;
    setNow(false);
    $('time').value = '12:00';
    try { setView(localStorage.getItem('skywheel-view') || 'western'); } catch (e) { setView('western'); }
    applyQuery();
  }

  // ---------- current location ----------
  let fromGeo = false;
  function locate() {
    const btn = $('locate'), label = btn.querySelector('span'), note = $('urlnote');
    if (!navigator.geolocation) { note.textContent = "This browser can't share its location. Pick a place or enter coordinates under Custom."; note.hidden = false; return; }
    btn.disabled = true; label.textContent = 'Locating…';
    navigator.geolocation.getCurrentPosition((pos) => {
      btn.disabled = false; label.textContent = 'My location';
      note.hidden = true;
      urlSync = true; fromGeo = true;
      $('place').value = 'custom';
      $('lat').value = pos.coords.latitude.toFixed(4);
      $('lon').value = pos.coords.longitude.toFixed(4);
      pickTZ(browserTZ());
      render();
    }, (err) => {
      btn.disabled = false; label.textContent = 'My location';
      note.textContent = err.code === 1
        ? 'Location access was blocked. Allow it for this site in the browser, or pick a place from the list.'
        : "Couldn't get your location right now. Try again, or pick a place from the list.";
      note.hidden = false;
    }, { enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 });
  }

  // ---------- install as an app ----------
  let installEvent = null;
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvent = e; $('install').hidden = false; });
  window.addEventListener('appinstalled', () => { installEvent = null; $('install').hidden = true; });
  function install() {
    if (!installEvent) return;
    installEvent.prompt();
    installEvent.userChoice.finally(() => { installEvent = null; $('install').hidden = true; });
  }
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => { /* offline support unavailable */ }); });
  }

  // ---------- URL parameters ----------
  // ?date=2026-11-09&time=02:02&place=new-york&houses=natural
  // ?date=2026-11-09&time=14:30&lat=44.49&lon=11.34&tz=Europe/Rome
  const slug = (x) => String(x).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const HOUSE_ALIASES = { placidus: 'placidus', p: 'placidus', whole: 'whole', 'whole-sign': 'whole', wholesign: 'whole', w: 'whole', equal: 'equal', e: 'equal', natural: 'natural', n: 'natural' };
  let urlSync = false;

  function applyQuery() {
    let q;
    try { q = new URLSearchParams(window.location.search); } catch (e) { return; }
    if (![...q.keys()].length) return;
    urlSync = true;
    const problems = [];

    // place first: date/time are read in the place's time zone
    const placeQ = q.get('place');
    const lat = parseFloat(q.get('lat')), lon = parseFloat(q.get('lon'));
    if (placeQ) {
      const idx = PLACES.findIndex((p) => slug(p[0]) === slug(placeQ));
      if (idx >= 0) $('place').value = String(idx);
      else problems.push(`place "${placeQ}" is not in the list`);
    } else if (isFinite(lat) && isFinite(lon)) {
      if (Math.abs(lat) > 89 || Math.abs(lon) > 180) problems.push('lat/lon out of range');
      else {
        $('place').value = 'custom';
        $('lat').value = lat; $('lon').value = lon;
        const tz = q.get('tz') || browserTZ();
        if (!pickTZ(tz)) { problems.push(`time zone "${tz}" is not recognised`); pickTZ(browserTZ()); }
      }
    } else if (q.has('lat') || q.has('lon')) problems.push('lat and lon must both be numbers');

    if (q.get('view')) setView(slug(q.get('view')));
    const h = q.get('houses') || q.get('hsys');
    if (h) { const v = HOUSE_ALIASES[slug(h)]; if (v) $('hsys').value = v; else problems.push(`house system "${h}" is not supported`); }

    const tz = currentPlace().tz;
    const dq = q.get('date');
    if (dq) {
      if (dq === 'today') $('date').value = localParts(new Date(), tz).date;
      else if (/^\d{4}-\d{2}-\d{2}$/.test(dq) && !isNaN(Date.parse(dq + 'T00:00:00Z'))) $('date').value = dq;
      else problems.push(`date "${dq}" should look like 2026-11-09`);
    }
    const tq = q.get('time');
    if (tq) {
      const m = /^(\d{1,2}):?(\d{2})$/.exec(tq);
      if (tq === 'now') { const lp = localParts(new Date(), tz); $('time').value = lp.time; if (!dq) $('date').value = lp.date; }
      else if (m && +m[1] < 24 && +m[2] < 60) $('time').value = `${pad(+m[1])}:${m[2]}`;
      else problems.push(`time "${tq}" should look like 14:30`);
    }
    const note = $('urlnote');
    if (problems.length) { note.textContent = `Couldn't use part of the link: ${problems.join('; ')}.`; note.hidden = false; }
  }

  function syncURL() {
    if (!urlSync) return;
    const q = new URLSearchParams();
    q.set('date', $('date').value);
    q.set('time', $('time').value || '12:00');
    if ($('place').value === 'custom') { q.set('lat', $('lat').value); q.set('lon', $('lon').value); q.set('tz', $('tz').value); }
    else q.set('place', slug(currentPlace().name));
    q.set('houses', $('hsys').value);
    if (view !== 'western') q.set('view', view);
    const url = `${location.pathname}?${q.toString().replace(/%2F/g, '/').replace(/%3A/g, ':')}${location.hash}`;
    try { history.replaceState(null, '', url); } catch (e) { /* sandboxed */ }
  }
  function shareURL() { urlSync = true; syncURL(); return location.href; }

  function currentPlace() {
    const v = $('place').value;
    if (v === 'custom') {
      const lat = parseFloat($('lat').value), lon = parseFloat($('lon').value);
      const coords = `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lon).toFixed(2)}°${lon >= 0 ? 'E' : 'W'}`;
      return { name: fromGeo ? `My location (${coords})` : coords, lat: isFinite(lat) ? lat : 0, lon: isFinite(lon) ? lon : 0, tz: $('tz').value || 'UTC' };
    }
    const p = PLACES[+v] || PLACES[0];
    return { name: p[0], lat: p[1], lon: p[2], tz: p[3] };
  }

  function browserTZ() { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch (e) { return 'UTC'; } }
  // Pick the place matching the browser's time zone (keeping the current place if it already matches).
  // Canonical zone name, so aliases match (Asia/Saigon = Asia/Ho_Chi_Minh, Europe/Kiev = Europe/Kyiv, ...)
  function canonTZ(tz) { try { return new Intl.DateTimeFormat('en', { timeZone: tz }).resolvedOptions().timeZone; } catch (e) { return null; } }
  const sameTZ = (a, b) => a === b || (canonTZ(a) !== null && canonTZ(a) === canonTZ(b));
  // Select a zone in the custom list, matching aliases; returns false when the zone is unknown.
  function pickTZ(tz) {
    const opt = [...$('tz').options].find((o) => sameTZ(o.value, tz));
    if (opt) { $('tz').value = opt.value; return true; }
    if (canonTZ(tz)) { const o = document.createElement('option'); o.value = tz; o.textContent = tz.replace(/_/g, ' '); $('tz').appendChild(o); $('tz').value = tz; return true; }
    return false;
  }

  function useBrowserPlace() {
    const tz = browserTZ();
    if (sameTZ(currentPlace().tz, tz)) return;
    const idx = PLACES.findIndex((p) => sameTZ(p[3], tz));
    if (idx >= 0) { $('place').value = String(idx); return; }
    $('place').value = 'custom';
    pickTZ(tz);
  }

  function setNow(withTime) {
    const tz = currentPlace().tz;
    const lp = localParts(new Date(), tz);
    $('date').value = lp.date;
    if (withTime) $('time').value = lp.time;
  }

  function shiftDay(n) {
    urlSync = true;
    const [y, m, d] = $('date').value.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d + n));
    $('date').value = dt.toISOString().slice(0, 10);
    render();
  }

  // ---------- wheel ----------
  const NS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs, parent, text) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }

  function drawWheel(chart, asps) {
    const svg = $('wheel'); svg.innerHTML = '';
    // Compact wheel on phones: the SVG renders at about half size, so type and hit areas grow.
    const compact = isCompact();
    svg.classList.toggle('compact', compact);
    const cx = 320, cy = 320;
    const R0 = 300, R1 = 268, R2 = 258, RP = compact ? 224 : 222, RD = compact ? 186 : 194, RH = 168, RC = 120;
    const F = compact
      ? { sign: 27, house: 17, houseR: RC + 17, houseHit: 15, angle: 17, angleR: R0 + 26, glyph: 34, glyphText: 18, deg: 19, min: 0, hit: 19, MIN: 13 }
      : { sign: 19, house: 10, houseR: RC + 12, houseHit: 9, angle: 10, angleR: R0 + 22, glyph: 21, glyphText: 12, deg: 11.5, min: 9, hit: 13, MIN: 8.6 };
    const left = chart.cusps[0];
    const ang = (lon) => (180 + norm(lon) - left) * Math.PI / 180;
    const P = (lon, r) => [cx + r * Math.cos(ang(lon)), cy - r * Math.sin(ang(lon))];

    const defs = el('defs', {}, svg);
    const grad = el('radialGradient', { id: 'coreGlow', cx: '50%', cy: '50%', r: '50%' }, defs);
    el('stop', { offset: '0%', style: 'stop-color:var(--nebula-1);stop-opacity:0.55' }, grad);
    el('stop', { offset: '100%', style: 'stop-color:var(--wheel-core);stop-opacity:1' }, grad);
    el('circle', { cx, cy, r: R0 + 12, fill: 'none', stroke: 'var(--gold)', 'stroke-width': 1, 'stroke-dasharray': '1 6', 'stroke-linecap': 'round', 'stroke-opacity': 0.7, class: 'halo' }, svg);
    el('circle', { cx, cy, r: R0 + 5, fill: 'none', stroke: 'var(--gold)', 'stroke-width': 0.6, 'stroke-opacity': 0.5 }, svg);
    el('circle', { cx, cy, r: R0 + 18, fill: 'none', stroke: 'var(--violet)', 'stroke-width': 0.8, 'stroke-dasharray': '2 14 1 9', 'stroke-linecap': 'round', 'stroke-opacity': 0.45, class: 'halo rev' }, svg);
    el('circle', { cx, cy, r: R0, fill: 'var(--wheel-bg)', 'fill-opacity': 0.85, stroke: 'var(--gold)', 'stroke-width': 1.4 }, svg);
    // zodiac band segments
    for (let s = 0; s < 12; s++) {
      const a0 = s * 30, a1 = s * 30 + 30;
      const [x0, y0] = P(a0, R0), [x1, y1] = P(a1, R0), [x2, y2] = P(a1, R1), [x3, y3] = P(a0, R1);
      el('path', { d: `M${x0} ${y0} A${R0} ${R0} 0 0 0 ${x1} ${y1} L${x2} ${y2} A${R1} ${R1} 0 0 1 ${x3} ${y3}Z`, fill: `var(${EL_VAR[s % 4]})`, 'fill-opacity': 0.13, stroke: 'var(--rule)', 'stroke-width': 1, 'data-tip': `sign:${s}`, class: 'tipzone' }, svg);
      const [gx, gy] = P(a0 + 15, (R0 + R1) / 2);
      el('text', { x: gx, y: gy, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': F.sign, fill: `var(${EL_VAR[s % 4]})`, 'font-family': 'var(--f-glyph)', 'data-tip': `sign:${s}`, class: 'tipzone', tabindex: 0, 'aria-label': `${E.SIGNS[s]} details` }, svg, sg(s));
    }
    // degree ticks
    for (let d = 0; d < 360; d += 1) {
      const len = d % 10 === 0 ? 9 : d % 5 === 0 ? 6 : 3;
      const [x0, y0] = P(d, R1), [x1, y1] = P(d, R1 - len);
      el('line', { x1: x0, y1: y0, x2: x1, y2: y1, stroke: 'var(--muted)', 'stroke-width': d % 10 === 0 ? 0.9 : 0.5, 'pointer-events': 'none' }, svg);
    }
    el('circle', { cx, cy, r: R1, fill: 'none', stroke: 'var(--gold)', 'stroke-width': 1 }, svg);
    el('circle', { cx, cy, r: RH, fill: 'none', stroke: 'var(--rule)', 'stroke-width': 1 }, svg);
    el('circle', { cx, cy, r: RC, fill: 'url(#coreGlow)', stroke: 'var(--gold)', 'stroke-width': 1 }, svg);

    // house cusps
    chart.cusps.forEach((c, i) => {
      const angle = i % 3 === 0;
      const [x0, y0] = P(c, R1 - 10), [x1, y1] = P(c, RC);
      el('line', { x1: x0, y1: y0, x2: x1, y2: y1, stroke: angle ? 'var(--gold)' : 'var(--rule)', 'stroke-width': angle ? 1.3 : 1 }, svg);
      const next = chart.cusps[(i + 1) % 12];
      const mid = c + norm(next - c) / 2;
      const [hx, hy] = P(mid, F.houseR);
      el('circle', { cx: hx, cy: hy, r: F.houseHit, fill: 'rgba(0,0,0,0)', 'data-tip': `house:${i}`, class: 'tipzone' }, svg);
      el('text', { x: hx, y: hy, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': F.house, fill: 'var(--muted)', 'font-family': 'var(--f-data)', 'data-tip': `house:${i}`, class: 'tipzone', tabindex: 0, 'aria-label': `House ${i + 1} details` }, svg, String(i + 1));
    });
    // angle markers ASC / MC (always drawn at their real positions)
    [['AC', chart.asc], ['MC', chart.mc], ['DC', chart.asc + 180], ['IC', chart.mc + 180]].forEach(([lab, lon]) => {
      const [x0, y0] = P(lon, R0), [x1, y1] = P(lon, R0 + 0.01);
      const [tx, ty] = P(lon, F.angleR);
      el('line', { x1: P(lon, R1)[0], y1: P(lon, R1)[1], x2: x0, y2: y0, stroke: 'var(--accent)', 'stroke-width': 2.2 }, svg);
      el('text', { x: tx, y: ty, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': F.angle, 'font-weight': 600, fill: 'var(--accent)', 'font-family': 'var(--f-data)', 'data-tip': `angle:${lab}`, class: 'tipzone', tabindex: 0, 'aria-label': `${lab} details` }, svg, lab);
    });

    // aspect lines
    const byName = Object.fromEntries(chart.pts.map((p) => [p.name, p]));
    const ag = el('g', { class: 'asps' }, svg);
    asps.forEach((a, i) => {
      if (a.type.key === 'conj') return;
      const [x0, y0] = P(byName[a.a].lon, RC - 2), [x1, y1] = P(byName[a.b].lon, RC - 2);
      el('line', { x1: x0, y1: y0, x2: x1, y2: y1, stroke: ASPECT_COLOR[a.type.key], 'stroke-width': a.orb < 2 ? 1.6 : 0.9, 'stroke-opacity': a.orb < 2 ? 0.95 : 0.6, 'stroke-dasharray': a.type.key === 'qx' ? '4 3' : null, class: 'asp', 'data-a': a.a, 'data-b': a.b, 'pointer-events': 'none' }, ag);
      el('line', { x1: x0, y1: y0, x2: x1, y2: y1, stroke: 'rgba(0,0,0,0)', 'stroke-width': 9, 'pointer-events': 'stroke', 'data-tip': `aspect:${i}`, class: 'tipzone' }, ag);
    });

    // planets with collision spreading
    const items = chart.pts.map((p) => ({ ...p, disp: p.lon }));
    items.push({ name: 'Vertex', lon: chart.vertex, disp: chart.vertex, retro: false, minor: true });
    items.sort((a, b) => a.lon - b.lon);
    // spread clusters: group neighbours closer than MIN, fan each group evenly around its centre
    const MIN = F.MIN;
    let groups = items.map((p) => [p]);
    for (let iter = 0; iter < 40; iter++) {
      groups.forEach((gr) => {
        const base = gr[0].lon;
        const mean = base + gr.reduce((s, p) => s + ((norm(p.lon - base) + 180) % 360 - 180), 0) / gr.length;
        gr.forEach((p, k) => { p.disp = norm(mean + (k - (gr.length - 1) / 2) * MIN); });
      });
      let merged = false;
      for (let i = 0; i < groups.length && groups.length > 1; i++) {
        const a = groups[i], b = groups[(i + 1) % groups.length];
        if (a === b) continue;
        const gap = ((b[0].disp - a[a.length - 1].disp + 540) % 360) - 180; // signed, so overlaps count too
        if (gap < MIN) {
          const j = (i + 1) % groups.length;
          groups[i] = a.concat(b); groups.splice(j, 1); merged = true; break;
        }
      }
      if (!merged) break;
    }
    const gp = el('g', { class: 'planets' }, svg);
    items.forEach((p) => {
      const [tx0, ty0] = P(p.lon, R1), [tx1, ty1] = P(p.lon, R2);
      el('line', { x1: tx0, y1: ty0, x2: tx1, y2: ty1, stroke: 'var(--gold-bright)', 'stroke-width': 1.4 }, gp);
      const [lx0, ly0] = P(p.lon, R2), [lx1, ly1] = P(p.disp, RP + 13);
      el('line', { x1: lx0, y1: ly0, x2: lx1, y2: ly1, stroke: 'var(--muted)', 'stroke-width': 0.5, 'stroke-opacity': 0.7 }, gp);
      const pos = fmtPos(p.lon);
      const color = `var(${EL_VAR[pos.sign % 4]})`;
      const [gx, gy] = P(p.disp, RP);
      const isText = (GLYPH[p.name] || '').length > 1;
      const key = p.name === 'Vertex' ? 'angle:Vx' : `planet:${p.name}`;
      el('circle', { cx: gx, cy: gy, r: F.hit, fill: 'rgba(0,0,0,0)', 'data-tip': key, class: 'tipzone' }, gp);
      el('text', { x: gx, y: gy, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': isText ? F.glyphText : F.glyph, fill: 'var(--ink)', 'font-family': isText ? 'var(--f-data)' : 'var(--f-glyph)', 'font-weight': isText ? 600 : 400, 'data-tip': key, class: 'tipzone pglyph', tabindex: 0, 'aria-label': `${LABEL[p.name] || p.name} details` }, gp, g(p.name));
      const [dx, dy] = P(p.disp, RD);
      el('text', { x: dx, y: dy, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': F.deg, fill: color, 'font-family': 'var(--f-data)' }, gp, `${pos.deg}°${p.retro ? 'ʀ' : ''}`);
      if (F.min) {
        const [mx, my] = P(p.disp, RD - 15);
        el('text', { x: mx, y: my, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': F.min, fill: 'var(--muted)', 'font-family': 'var(--f-data)' }, gp, pad(pos.min) + '′');
      }
    });
  }

  // Is this New or Full Moon also an eclipse? Returns " · Total Solar Eclipse" or "".
  function eclipseAt(lun) {
    const A = window.Astronomy, from = new Date(lun.t.getTime() - 2 * 86400000);
    try {
      if (/New Moon/.test(lun.title)) {
        const e = A.SearchGlobalSolarEclipse(from);
        if (Math.abs(e.peak.date - lun.t) < 86400000) return ` · ${e.kind[0].toUpperCase() + e.kind.slice(1)} Solar Eclipse`;
      } else if (/Full Moon/.test(lun.title)) {
        const e = A.SearchLunarEclipse(from);
        if (Math.abs(e.peak.date - lun.t) < 86400000) return ` · ${e.kind[0].toUpperCase() + e.kind.slice(1)} Lunar Eclipse`;
      }
    } catch (err) { /* no eclipse info */ }
    return '';
  }

  function isCompact() { return window.innerWidth < 600; }

  function drawMoon(phase) {
    const svg = $('moonpic'); svg.innerHTML = '';
    const r = 24, c = 28;
    el('circle', { cx: c, cy: c, r, fill: 'var(--wheel-core)', stroke: 'var(--gold)', 'stroke-opacity': 0.5 }, svg);
    const e = phase.elong * Math.PI / 180;
    const k = Math.cos(e); // terminator x-scale
    const waxing = phase.elong < 180;
    // lit portion: right half when waxing (northern view)
    const sweepOuter = waxing ? 1 : 0;
    const rx = Math.abs(k) * r;
    const sweepInner = (k > 0) === waxing ? 0 : 1;
    const d = `M${c} ${c - r} A${r} ${r} 0 0 ${sweepOuter} ${c} ${c + r} A${rx} ${r} 0 0 ${sweepInner} ${c} ${c - r}Z`;
    el('path', { d, fill: 'var(--moonlit)', 'fill-opacity': 0.95 }, svg);
  }


  // ---------- tooltips ----------
  let ctx = null;
  function houseOfCusps(cusps, lon) {
    for (let i = 0; i < 12; i++) {
      const a = cusps[i], b = cusps[(i + 1) % 12];
      if (norm(lon - a) < norm(b - a)) return i + 1;
    }
    return 1;
  }
  function dms(l, withSign = true) {
    l = norm(l); const s = Math.floor(l / 30); let x = l - s * 30;
    let d = Math.floor(x), m = Math.floor((x - d) * 60), sec = Math.round(((x - d) * 60 - m) * 60);
    if (sec === 60) { sec = 0; m += 1; } if (m === 60) { m = 0; d += 1; }
    return `${d}°${pad(m)}′${pad(sec)}″${withSign ? ` <span class="tg">${sg(s)}</span> ${E.SIGNS[s]}` : ''}`;
  }
  const dm = (x) => { const a = Math.abs(x); const d = Math.floor(a); const m = Math.round((a - d) * 60); return `${d}°${pad(m === 60 ? 0 : m)}′`; };
  const row = (k, v) => `<div class="tr"><span>${k}</span><span>${v}</span></div>`;
  const pn = (n) => `<span class="tg">${g(n)}</span> ${LABEL[n] || n}`;

  function rulersOf(sign) { const i = E.signInfo(sign); return i.trad === i.modern ? i.trad : `${i.modern} (modern), ${i.trad} (traditional)`; }
  function whereIs(name) {
    const p = ctx.byName[name]; if (!p) return '';
    return `${fmtPos(p.lon).text}, H${ctx.houseOf(p.lon)}${p.retro ? ', R' : ''}`;
  }

  function tipPlanet(name) {
    const { chart, asps, byName, houseOf } = ctx;
    const p = byName[name]; if (!p) return '';
    const sign = Math.floor(p.lon / 30);
    let h = `<div class="th">${pn(name)}${APPROX.includes(name) ? ' <span class="badge">≈ approx.</span>' : ''}</div>`;
    h += `<div class="tpos">${dms(p.lon)}</div>`;
    h += row('House', `H${houseOf(p.lon)}`);
    const motion = Math.abs(p.speed) < 0.003 ? 'Stationary' : p.retro ? 'Retrograde' : 'Direct';
    h += row('Motion', `${motion} · ${p.speed >= 0 ? '+' : '−'}${dm(p.speed)}/day`);
    if (name !== 'Node' && name !== 'Lilith') h += row('Latitude', `${p.lat >= 0 ? '+' : '−'}${dm(p.lat)}`);
    const oob = Math.abs(p.decl) > chart.eps;
    h += row('Declination', `${dm(p.decl)} ${p.decl >= 0 ? 'N' : 'S'}${oob ? ' <span class="badge warn">out of bounds</span>' : ''}`);
    const dig = E.dignity(name, sign);
    if (dig) h += row('Dignity', dig);
    const rules = [];
    chart.cusps.forEach((c, i) => { const inf = E.signInfo(Math.floor(c / 30)); if (inf.modern === name || inf.trad === name) rules.push(`H${i + 1}${inf.modern !== name ? '*' : ''}`); });
    if (rules.length) h += row('Rules', rules.join(', ') + (rules.some((r) => r.endsWith('*')) ? ' <span class="muted">(*traditional)</span>' : ''));
    if (name === 'Node') h += row('South Node', fmtPos(p.lon + 180).text);
    h += row('Antiscion', fmtPos(180 - p.lon).text);
    h += row('Contra-antiscion', fmtPos(360 - p.lon).text);
    const mine = asps.filter((a) => a.a === name || a.b === name);
    if (mine.length) {
      h += `<div class="tsub">Aspects</div>`;
      h += mine.map((a) => {
        const other = a.a === name ? a.b : a.a;
        return `<div class="tr"><span><span class="tg" style="color:${ASPECT_COLOR[a.type.key]}">${ASPECT_GLYPH[a.type.key]}${VS}</span> ${pn(other)}</span><span>${a.orb.toFixed(2)}° ${a.applying ? 'app.' : 'sep.'}</span></div>`;
      }).join('');
    }
    if (name === 'Lilith') h += `<div class="muted tnote">Mean Black Moon Lilith (lunar apogee)</div>`;
    if (name === 'Node') h += `<div class="muted tnote">True node</div>`;
    return h;
  }

  function tipSign(s) {
    const { chart, houseOf } = ctx;
    const inf = E.signInfo(s);
    let h = `<div class="th"><span class="tg" style="color:var(${EL_VAR[s % 4]})">${sg(s)}</span> ${inf.name}</div>`;
    h += `<div class="muted">${inf.element} · ${inf.mode} · ${inf.polarity}</div>`;
    h += row('Ruler', inf.trad === inf.modern ? inf.trad : `${inf.modern} · trad. ${inf.trad}`);
    h += row('Exaltation', inf.exalted || '—');
    h += row('Detriment', inf.detriment.join(', ') || '—');
    h += row('Fall', inf.fall.join(', ') || '—');
    const cusps = chart.cusps.map((c, i) => [c, i]).filter(([c]) => Math.floor(c / 30) === s).map(([, i]) => `H${i + 1}`);
    h += row('House cusps', cusps.join(', ') || '— (intercepted or none)');
    const inside = ctx.chart.pts.filter((p) => Math.floor(p.lon / 30) === s).sort((a, b) => a.lon - b.lon);
    if (inside.length) {
      h += `<div class="tsub">Bodies in ${inf.name}</div>`;
      h += inside.map((p) => row(pn(p.name), `${fmtPos(p.lon).deg}°${pad(fmtPos(p.lon).min)}′${p.retro ? ' R' : ''} · H${houseOf(p.lon)}`)).join('');
    }
    return h;
  }

  // What each house covers, in plain words, plus its traditional (Latin) name.
  const HOUSE_MEANING = [
    ['Vita', 'Self, body and appearance', 'How you meet the world: your body, temperament, first impressions and the way you start things.'],
    ['Lucrum', 'Money and possessions', 'What you own and earn, your resources, and what you value, including your sense of self-worth.'],
    ['Fratres', 'Communication and surroundings', 'Siblings, neighbours, short trips, everyday talk and writing, and early learning.'],
    ['Genitor', 'Home and roots', 'Family, ancestry, a parent, your home and private life, and how matters end.'],
    ['Nati', 'Creativity and pleasure', 'Children, romance, play, art, hobbies and whatever you do for joy.'],
    ['Valetudo', 'Work and health', 'Daily routines and duties, the work you do, health and illness, service, and pets.'],
    ['Uxor', 'Partners', 'One-to-one relationships: marriage, close partnerships, contracts and open rivals.'],
    ['Mors', 'Shared resources and transformation', "Other people's money, debts, inheritance, intimacy, crisis, death and rebirth."],
    ['Iter', 'Beliefs and long journeys', 'Travel abroad, higher education, philosophy, religion, law and publishing.'],
    ['Regnum', 'Career and reputation', 'Your public role, vocation, ambition, achievements and standing in the world. Also a parent.'],
    ['Benefacta', 'Friends and community', 'Friends, groups and networks, allies and patrons, and your hopes for the future.'],
    ['Carcer', 'The hidden and solitude', 'Retreat and solitude, secrets, hidden enemies, hospitals and other institutions, the unconscious, and self-undoing.'],
  ];
  const HOUSE_KIND = ['Angular', 'Succedent', 'Cadent'];
  const HOUSE_SYSTEMS = {
    placidus: ['Placidus', 'Divides the time each degree takes to rise from the IC to the Ascendant to the Midheaven into thirds. The most widely used modern system. Houses come out unequal, and it breaks down above about 66° latitude.'],
    whole: ['Whole sign', 'Each sign is one house, starting with the rising sign as the 1st. The oldest system, from Hellenistic astrology. The Midheaven can fall in any house from the 9th to the 11th.'],
    equal: ['Equal', 'Twelve 30° houses measured from the exact degree of the Ascendant. The Midheaven floats and is not always the 10th cusp.'],
    natural: ['Natural', 'Aries is the 1st house, Taurus the 2nd, and so on, whatever the time or place. A flat view of the sky itself, useful for daily and mundane charts.'],
  };
  function tipSystem(v) {
    const [name, text] = HOUSE_SYSTEMS[v] || [];
    if (!name) return '';
    const active = ctx && ctx.chart.system === v;
    return `<div class="th">${name} houses${active ? ' <span class="badge">in use</span>' : ''}</div><div class="tplain">${text}</div>`;
  }
  function tipAllHouses() {
    let h = `<div class="th">The twelve houses</div><div class="muted tnote" style="margin:0 0 6px">Each house is one area of life. Hover a house number on the wheel for its cusp, ruler and the planets in it.</div>`;
    h += '<div class="hlist">' + HOUSE_MEANING.map(([latin, topic, plain], i) => `<div><b>${i + 1}</b><span><span class="ht">${topic}</span><span class="hp">${plain}</span></span></div>`).join('') + '</div>';
    return h;
  }

  function tipHouse(i) {
    const { chart, houseOf } = ctx;
    const c = chart.cusps[i], next = chart.cusps[(i + 1) % 12];
    const sign = Math.floor(c / 30);
    const size = norm(next - c);
    const [latin, topic, plain] = HOUSE_MEANING[i];
    let h = `<div class="th">House ${i + 1} · ${topic}</div>`;
    h += `<div class="tplain">${plain}</div>`;
    h += `<div class="tpos">Cusp ${dms(c)}</div>`;
    h += row('Type', `${HOUSE_KIND[i % 3]} · natural sign ${E.SIGNS[i]}`);
    h += row('Traditional name', `<i>${latin}</i>`);
    h += row('Size', `${dm(size)}`);
    const inf = E.signInfo(sign);
    h += row('Cusp ruler', inf.trad === inf.modern ? `${inf.trad} in ${whereIs(inf.trad)}` : `${inf.modern} in ${whereIs(inf.modern)}`);
    if (inf.trad !== inf.modern) h += row('Trad. ruler', `${inf.trad} in ${whereIs(inf.trad)}`);
    const intercepted = [];
    for (let s = 0; s < 12; s++) if (norm(s * 30 - c) < size && norm(s * 30 + 30 - c) <= size && norm(s * 30 - c) > 0) intercepted.push(E.SIGNS[s]);
    if (intercepted.length) h += row('Intercepted', intercepted.join(', '));
    const inside = chart.pts.filter((p) => houseOf(p.lon) === i + 1).sort((a, b) => norm(a.lon - c) - norm(b.lon - c));
    if (inside.length) {
      h += `<div class="tsub">Bodies in house ${i + 1}</div>`;
      h += inside.map((p) => row(pn(p.name), `${fmtPos(p.lon).text}${p.retro ? ' R' : ''}`)).join('');
    } else h += `<div class="muted tnote">Empty house</div>`;
    if (chart.system === 'natural' || chart.system === 'whole' || chart.system === 'equal') h += `<div class="muted tnote">${{ natural: 'Natural houses', whole: 'Whole sign houses', equal: 'Equal houses' }[chart.system]}</div>`;
    return h;
  }

  function tipAngle(lab) {
    const { chart, houseOf } = ctx;
    const map = { AC: ['Ascendant', chart.asc], DC: ['Descendant', chart.asc + 180], MC: ['Midheaven', chart.mc], IC: ['Imum Coeli', chart.mc + 180], Vx: ['Vertex', chart.vertex] };
    const [name, lon] = map[lab];
    const sign = Math.floor(norm(lon) / 30);
    let h = `<div class="th">${name}</div><div class="tpos">${dms(lon)}</div>`;
    const inf = E.signInfo(sign);
    h += row(lab === 'AC' ? 'Chart ruler' : 'Ruler', `${inf.modern} in ${whereIs(inf.modern)}`);
    if (inf.trad !== inf.modern) h += row('Trad. ruler', `${inf.trad} in ${whereIs(inf.trad)}`);
    if (lab === 'Vx') h += row('Anti-vertex', fmtPos(lon + 180).text) + row('House', `H${houseOf(lon)}`);
    if (lab === 'AC' || lab === 'MC') h += row('RAMC', `${chart.ramc.toFixed(2)}°`);
    if (lab === 'AC' || lab === 'DC' || lab === 'MC' || lab === 'IC') {
      const near = chart.pts.map((p) => ({ p, orb: E.sep(p.lon, lon) })).filter((x) => x.orb <= 5).sort((a, b) => a.orb - b.orb);
      if (near.length) { h += `<div class="tsub">Conjunct (≤5°)</div>` + near.map((x) => row(pn(x.p.name), `${x.orb.toFixed(2)}°`)).join(''); }
    }
    h += row('Obliquity', `${chart.eps.toFixed(4)}°`);
    return h;
  }

  function tipAspect(i) {
    const a = ctx.asps[i]; if (!a) return '';
    const pa = ctx.byName[a.a], pb = ctx.byName[a.b];
    let h = `<div class="th">${pn(a.a)} <span class="tg" style="color:${ASPECT_COLOR[a.type.key]}">${ASPECT_GLYPH[a.type.key]}${VS}</span> ${pn(a.b)}</div>`;
    h += `<div class="muted">${a.type.name} (${a.type.angle}°) · orb allowed ${a.type.orb}°</div>`;
    h += row('Orb', `${a.orb.toFixed(2)}° · ${a.applying ? 'applying' : 'separating'}`);
    h += row('Separation', `${E.sep(pa.lon, pb.lon).toFixed(2)}°`);
    h += row(LABEL[a.a] || a.a, `${fmtPos(pa.lon).text}${pa.retro ? ' R' : ''}`);
    h += row(LABEL[a.b] || a.b, `${fmtPos(pb.lon).text}${pb.retro ? ' R' : ''}`);
    return h;
  }

  const tip = document.createElement('div');
  tip.id = 'tip'; tip.setAttribute('role', 'tooltip'); tip.hidden = true;
  document.body.appendChild(tip);
  let pinned = null, current = null;

  function tipHTML(key) {
    const [kind, v] = key.split(':');
    if (!ctx) return '';
    if (kind === 'planet') return tipPlanet(v);
    if (kind === 'sign') return tipSign(+v);
    if (kind === 'house') return tipHouse(+v);
    if (kind === 'angle') return tipAngle(v);
    if (kind === 'aspect') return tipAspect(+v);
    if (kind === 'hsys') return tipSystem(v);
    if (kind === 'houses') return tipAllHouses();
    if (kind === 'cn-stem') return tipCnStem(+v);
    if (kind === 'my-sign') return tipMayaSign(+v);
    if (kind === 'cn-branch') return tipCnBranch(+v);
    return '';
  }
  function focusWheel(key) {
    const svg = $('wheel');
    svg.querySelectorAll('.asp.on').forEach((l) => l.classList.remove('on'));
    svg.querySelectorAll('.pglyph.on').forEach((l) => l.classList.remove('on'));
    svg.classList.remove('focusing');
    if (!key) return;
    const [kind, v] = key.split(':');
    if (kind === 'planet') {
      svg.classList.add('focusing');
      svg.querySelectorAll(`.asp[data-a="${v}"], .asp[data-b="${v}"]`).forEach((l) => l.classList.add('on'));
      svg.querySelectorAll(`.pglyph[data-tip="${key}"]`).forEach((l) => l.classList.add('on'));
    } else if (kind === 'aspect') {
      const a = ctx.asps[+v]; if (!a) return;
      svg.classList.add('focusing');
      svg.querySelectorAll(`.asp[data-a="${a.a}"][data-b="${a.b}"]`).forEach((l) => l.classList.add('on'));
      svg.querySelectorAll(`.pglyph[data-tip="planet:${a.a}"], .pglyph[data-tip="planet:${a.b}"]`).forEach((l) => l.classList.add('on'));
    }
  }
  function showTip(target, x, y) {
    const key = target.getAttribute('data-tip');
    const html = tipHTML(key);
    if (!html) return hideTip(true);
    current = key;
    tip.innerHTML = (isCompact() ? '<button type="button" class="tipclose" aria-label="Close">✕</button>' : '') + html;
    tip.classList.toggle('wide', key === 'houses:all');
    tip.classList.toggle('pinned', !!pinned);
    tip.hidden = false;
    focusWheel(key);
    if (isCompact()) { tip.style.left = ''; tip.style.top = ''; tip.scrollTop = 0; return; } // bottom sheet, placed by CSS
    const r = target.getBoundingClientRect();
    const ax = x != null ? x : r.left + r.width / 2, ay = y != null ? y : r.bottom;
    const tw = tip.offsetWidth, th = tip.offsetHeight, vw = window.innerWidth, vh = window.innerHeight;
    let left = ax + 14, top = ay + 14;
    if (left + tw > vw - 8) left = Math.max(8, ax - tw - 14);
    if (top + th > vh - 8) top = Math.max(8, ay - th - 14);
    tip.style.left = left + 'px'; tip.style.top = top + 'px';
  }
  function hideTip(force) {
    if (pinned && !force) return;
    pinned = null; current = null; tip.hidden = true; focusWheel(null);
  }
  const zoneOf = (e) => e.target.closest && e.target.closest('[data-tip]');
  document.addEventListener('pointermove', (e) => {
    if (pinned || e.pointerType === 'touch') return;
    const z = zoneOf(e);
    if (z) showTip(z, e.clientX, e.clientY); else if (current) hideTip();
  });
  document.addEventListener('click', (e) => {
    if (e.target.closest && e.target.closest('.tipclose')) { hideTip(true); return; }
    const z = zoneOf(e);
    if (z && z.hasAttribute('data-tip-hover')) { hideTip(true); return; }
    if (z) {
      if (pinned === z.getAttribute('data-tip')) { hideTip(true); return; }
      pinned = z.getAttribute('data-tip');
      showTip(z, e.clientX, e.clientY);
    } else if (pinned && !tip.contains(e.target)) hideTip(true);
  });
  document.addEventListener('focusin', (e) => { const z = zoneOf(e); if (z && !pinned) showTip(z); });
  document.addEventListener('focusout', (e) => { if (zoneOf(e) && !pinned) hideTip(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideTip(true);
    if ((e.key === 'Enter' || e.key === ' ') && zoneOf(e) && e.target.tagName !== 'BUTTON') { e.preventDefault(); pinned = zoneOf(e).getAttribute('data-tip'); showTip(zoneOf(e)); }
  });
  window.addEventListener('scroll', () => { if (!pinned) hideTip(); }, { passive: true });

  // ---------- year ahead ----------
  const YEAR_CATS = [['all', 'All'], ['eclipse', 'Eclipses'], ['retro', 'Stations'], ['ingress', 'Ingresses'], ['aspect', 'Outer aspects'], ['venus', 'Venus'], ['season', 'Seasons']];
  let yearEvents = null;
  let yearCat = (() => { try { return localStorage.getItem('skywheel-year') || 'all'; } catch (e) { return 'all'; } })();
  function yearGlyphs(e) {
    const sym = (x) => `<span class="yg-s">${x}</span>`;
    if (e.cat === 'retro') return `${g(e.body)}${sym(e.retro ? '℞' : 'D')}`;
    if (e.cat === 'ingress') return `${g(e.body)}${sym('→')}${sg(e.sign)}`;
    if (e.cat === 'aspect') return `${g(e.body)}<span style="color:${ASPECT_COLOR[e.aspKey]}">${ASPECT_GLYPH[e.aspKey]}${VS}</span>${g(e.other)}`;
    if (e.cat === 'eclipse') return `<span class="ecl ecl-${e.body === 'Sun' ? 'sun' : 'moon'}"></span>`;
    if (e.cat === 'venus') return `${g('Venus')}${ASPECT_GLYPH.conj}${VS}${g('Sun')}`;
    if (e.cat === 'season') return `${g('Sun')}${sym('→')}${sg(e.sign)}`;
    return '';
  }
  function renderYear(place, when) {
    const box = $('yearlist');
    if (!yearEvents) return;
    const chips = $('yearChips');
    if (!chips.childElementCount) {
      YEAR_CATS.forEach(([cat, label]) => {
        const b = document.createElement('button');
        b.type = 'button'; b.dataset.cat = cat;
        b.textContent = cat === 'all' ? label : `${label} ${yearEvents.filter((e) => e.cat === cat).length}`;
        b.addEventListener('click', () => { yearCat = cat; try { localStorage.setItem('skywheel-year', cat); } catch (e) { /* ignore */ } renderYear(currentPlace(), lastWhen); });
        chips.appendChild(b);
      });
    }
    chips.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.cat === yearCat)));
    const list = yearEvents.filter((e) => yearCat === 'all' || e.cat === yearCat);
    const fmtMonth = new Intl.DateTimeFormat('en-GB', { timeZone: place.tz, month: 'long', year: 'numeric' });
    const fmtDay = new Intl.DateTimeFormat('en-GB', { timeZone: place.tz, day: 'numeric', month: 'short' });
    const now = Date.now();
    let month = '', html = '';
    list.forEach((e) => {
      const m = fmtMonth.format(e.t);
      if (m !== month) { html += `<div class="ymonth">${m}</div>`; month = m; }
      const lp = localParts(e.t, place.tz);
      const days = Math.round((e.t - now) / 86400000);
      const active = when && Math.abs(e.t - when) < 90000;
      html += `<button type="button" class="yitem y-${e.cat}${active ? ' active' : ''}" data-t="${e.t.toISOString()}" title="Cast the chart for this moment">
        <span class="yd"><b>${fmtDay.format(e.t)}</b><small>${lp.time}</small></span>
        <span class="yg">${yearGlyphs(e)}</span>
        <span class="yt">${e.title}${e.detail ? `<small>${e.detail}</small>` : ''}</span>
        <span class="yin">${days <= 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} d`}</span>
      </button>`;
    });
    box.innerHTML = html || '<p class="empty">Nothing of this kind in the next 12 months.</p>';
  }
  function jumpTo(iso) {
    const t = new Date(iso), place = currentPlace(), lp = localParts(t, place.tz);
    $('date').value = lp.date; $('time').value = lp.time;
    urlSync = true;
    render();
    if (isCompact()) document.querySelector('.wheelbox').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  let lastWhen = null;


  // ---------- Chinese astrology tab ----------
  const Z = window.Chinese;
  const EL_COLOR = ['var(--wood)', 'var(--fire)', 'var(--earth-el)', 'var(--metal)', 'var(--water-el)'];
  const polarity = (yang) => (yang ? 'Yang' : 'Yin');
  let view = 'western';
  let cn = null; // last computed Chinese chart

  const VIEWS = [['western', 'Western', '#07061a', ''], ['chinese', 'Chinese', '#0d0506', 'theme-cn'], ['maya', 'Maya', '#03110d', 'theme-maya']];
  function setView(v, fromUser) {
    view = VIEWS.some(([k]) => k === v) ? v : 'western';
    VIEWS.forEach(([k, label, color, theme]) => {
      const on = view === k, tab = $('tab' + label), panel = $('view' + label);
      panel.hidden = !on; tab.setAttribute('aria-selected', String(on)); tab.tabIndex = on ? 0 : -1;
      if (theme) document.documentElement.classList.toggle(theme, on);
      if (on) { const meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.setAttribute('content', color); }
    });
    window.dispatchEvent(new Event('skywheel-theme'));
    try { localStorage.setItem('skywheel-view', view); } catch (e) { /* ignore */ }
    if (fromUser) { urlSync = true; render(); }
  }

  function stemCell(s, god, label) {
    const [ch, py, el] = Z.STEMS[s];
    return `<div class="pc-stem tipzone" data-tip="cn-stem:${s}" tabindex="0">
      <span class="pc-god">${god}</span>
      <span class="pc-ch" style="color:${EL_COLOR[el]}">${ch}</span>
      <span class="pc-py">${py}</span>
      <span class="pc-el">${polarity(s % 2 === 0)} ${Z.ELEMENTS[el]}</span>
    </div>`;
  }
  function branchCell(b, dm) {
    const [ch, py, animal, el, , , hidden] = Z.BRANCHES[b];
    return `<div class="pc-branch tipzone" data-tip="cn-branch:${b}" tabindex="0">
      <span class="pc-ch" style="color:${EL_COLOR[el]}">${ch}</span>
      <span class="pc-py">${py} · ${animal}</span>
      <span class="pc-el">${Z.ELEMENTS[el]}</span>
      <span class="pc-hidden">${hidden.map((h) => `<span title="${Z.STEMS[h][1]} ${Z.ELEMENTS[Z.STEMS[h][2]]} · ${Z.tenGod(dm, h)[1]}" style="color:${EL_COLOR[Z.STEMS[h][2]]}">${Z.STEMS[h][0]}</span>`).join('')}</span>
    </div>`;
  }

  function renderChinese(when, local, place) {
    const p = Z.fourPillars(when, local);
    const lun = Z.lunarDate(when);
    const terms = Z.solarTerms(when);
    const dm = p.day.stem;
    cn = { p, lun, terms, dm, place };

    // pillars, shown right to left: hour, day, month, year
    const cols = [['Hour', '時', p.hour], ['Day', '日', p.day], ['Month', '月', p.month], ['Year', '年', p.year]];
    $('pillars').innerHTML = cols.map(([label, zh, x]) => {
      const god = label === 'Day' ? 'Day Master' : Z.tenGod(dm, x.stem)[1];
      return `<div class="pcol${label === 'Day' ? ' pcol-dm' : ''}"><div class="pc-head">${label} <span class="zh">${zh}</span></div>${stemCell(x.stem, god)}${branchCell(x.branch, dm)}</div>`;
    }).join('');

    // five elements
    const counts = Z.elementCount(p), max = Math.max(...counts, 1);
    $('cnElements').innerHTML = Z.ELEMENTS.map((e, i) => `<div class="bar"><span>${e} <span class="zh">${Z.ELEMENT_ZH[i]}</span></span><span class="track"><span class="fill" style="display:block;width:${(counts[i] / max) * 100}%;background:${EL_COLOR[i]};color:${EL_COLOR[i]}"></span></span><span class="n">${counts[i]}</span></div>`).join('');
    const [dch, dpy, del, dimg, dtext] = Z.STEMS[dm];
    const missing = Z.ELEMENTS.filter((e, i) => !counts[i]);
    $('cnDM').innerHTML = `<div class="cn-dm-head"><span class="pc-ch" style="color:${EL_COLOR[del]}">${dch}</span><div><b>Day Master: ${polarity(dm % 2 === 0)} ${Z.ELEMENTS[del]}</b> <span class="muted">(${dpy}, ${dimg})</span><p>${dtext}</p></div></div>`
      + `<p class="cn-note">Counts the eight characters by their main element.${missing.length ? ` Missing: ${missing.join(', ')}.` : ''} If this moment is a birth time, the Day Master stands for the person.</p>`;

    // calendar
    const ly = Z.pillar(lun.year - 4);
    const [ych, , yanimal] = Z.BRANCHES[ly.branch];
    const yel = Z.ELEMENTS[Z.STEMS[ly.stem][2]];
    const fmt = (d) => new Intl.DateTimeFormat('en-GB', { timeZone: place.tz, day: 'numeric', month: 'short', year: 'numeric' }).format(d);
    const fmtCN = (d) => new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Shanghai', day: 'numeric', month: 'short', year: 'numeric' }).format(d); // calendar dates are China dates
    const fmtT = (d) => new Intl.DateTimeFormat('en-GB', { timeZone: place.tz, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(d);
    const nextNY = Z.chineseNewYear(lun.year + 1), nly = Z.pillar(lun.year - 3);
    const cur = Z.TERMS[terms.current.i], nxt = Z.TERMS[terms.next.i];
    const clash = (p.day.branch + 6) % 12;
    const differs = ly.index !== p.year.index;
    $('cnCal').innerHTML = `
      <div class="cn-year">
        <span class="cn-year-ch">${Z.STEMS[ly.stem][0]}${ych}</span>
        <div><div class="cn-year-name">Year of the ${yel} ${yanimal}</div>
        <div class="muted">${polarity(ly.stem % 2 === 0)} ${yel} · since Chinese New Year, ${fmtCN(lun.newYear)}</div></div>
      </div>
      ${row('Lunar date', `${lun.leap ? 'Leap ' : ''}${Z.LUNAR_MONTHS[lun.month]} month, day ${lun.day} <span class="muted">of ${lun.monthLength}</span>`)}
      ${row('Solar term', `<span class="zh">${cur[0]}</span> ${cur[2]} <span class="muted">since ${terms.current.at ? fmt(terms.current.at) : '—'}</span>`)}
      ${row('Next term', `<span class="zh">${nxt[0]}</span> ${nxt[2]} <span class="muted">${terms.next.at ? fmtT(terms.next.at) : '—'}</span>`)}
      ${row('Day', `<span class="zh">${Z.STEMS[p.day.stem][0]}${Z.BRANCHES[p.day.branch][0]}</span> ${Z.BRANCHES[p.day.branch][2]} day · clashes with the ${Z.BRANCHES[clash][2]} <span class="zh">${Z.BRANCHES[clash][0]}</span>`)}
      ${row('Next New Year', `${fmtCN(nextNY)} · ${Z.ELEMENTS[Z.STEMS[nly.stem][2]]} ${Z.BRANCHES[nly.branch][2]}`)}
      ${differs ? `<p class="cn-note">Between Start of Spring and Chinese New Year the year pillar (${Z.STEMS[p.year.stem][0]}${Z.BRANCHES[p.year.branch][0]}) and the zodiac year differ. Four Pillars uses Start of Spring.</p>` : ''}`;

    drawAnimalWheel(p);
    $('sealChar').textContent = Z.BRANCHES[ly.branch][0];
    // header for this view
    $('title').textContent = `${Z.BRANCHES[p.day.branch][2]} Day · ${yel} ${yanimal} Year`;
    $('big3').innerHTML = `<div><b>${Z.STEMS[dm][1]} ${Z.ELEMENTS[del]}</b> Day Master</div><div><b>${Z.LUNAR_MONTHS[lun.month]}</b> lunar month</div><div><b>${cur[2]}</b></div>`;
  }

  function drawAnimalWheel(p) {
    const svg = $('cnWheel'); svg.innerHTML = '';
    const c = 200, R0 = 196, R1 = 128, R2 = 74;
    const ang = (b, off = 0) => (-90 + b * 30 + off) * Math.PI / 180; // Rat at the top, clockwise
    const P = (b, r, off = 0) => [c + r * Math.cos(ang(b, off)), c + r * Math.sin(ang(b, off))];
    el('circle', { cx: c, cy: c, r: R0, fill: 'var(--wheel-bg)', 'fill-opacity': 0.85, stroke: 'var(--gold)', 'stroke-width': 1.2 }, svg);
    const marks = {};
    [['Y', p.year], ['M', p.month], ['D', p.day], ['H', p.hour]].forEach(([k, x]) => { (marks[x.branch] = marks[x.branch] || []).push(k); });
    for (let b = 0; b < 12; b++) {
      const [ch, , animal, elx] = Z.BRANCHES[b];
      const [x0, y0] = P(b, R0, -15), [x1, y1] = P(b, R0, 15), [x2, y2] = P(b, R2, 15), [x3, y3] = P(b, R2, -15);
      const on = marks[b];
      el('path', { d: `M${x0} ${y0} A${R0} ${R0} 0 0 1 ${x1} ${y1} L${x2} ${y2} A${R2} ${R2} 0 0 0 ${x3} ${y3}Z`, fill: EL_COLOR[elx], 'fill-opacity': on ? 0.26 : 0.08, stroke: 'var(--rule)', 'stroke-width': 1, 'data-tip': `cn-branch:${b}`, class: 'tipzone' }, svg);
      const [tx, ty] = P(b, (R0 + R1) / 2 + 4);
      el('text', { x: tx, y: ty, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': 32, fill: EL_COLOR[elx], 'font-family': 'var(--f-brush)', 'data-tip': `cn-branch:${b}`, class: 'tipzone', tabindex: 0, 'aria-label': `${animal} details` }, svg, ch);
      const [ax, ay] = P(b, R1 - 14);
      el('text', { x: ax, y: ay, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': 12.5, fill: on ? 'var(--ink)' : 'var(--muted)', 'font-family': 'var(--f-body)', 'pointer-events': 'none' }, svg, animal);
      if (on) {
        const [mx, my] = P(b, R2 + 16);
        el('text', { x: mx, y: my, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': 11, 'font-weight': 600, fill: 'var(--gold-bright)', 'font-family': 'var(--f-data)', 'pointer-events': 'none' }, svg, on.join(''));
      }
    }
    el('circle', { cx: c, cy: c, r: R1, fill: 'none', stroke: 'var(--rule)' }, svg);
    el('circle', { cx: c, cy: c, r: R2, fill: 'url(#cnCore)', stroke: 'var(--gold)' }, svg);
    const defs = el('defs', {}, svg);
    const grad = el('radialGradient', { id: 'cnCore' }, defs);
    el('stop', { offset: '0%', style: 'stop-color:var(--nebula-1);stop-opacity:0.6' }, grad);
    el('stop', { offset: '100%', style: 'stop-color:var(--wheel-core);stop-opacity:1' }, grad);
    // day clash line
    const [cx0, cy0] = P(p.day.branch, R2), [cx1, cy1] = P((p.day.branch + 6) % 12, R2);
    el('line', { x1: cx0, y1: cy0, x2: cx1, y2: cy1, stroke: 'var(--fire)', 'stroke-width': 1.2, 'stroke-dasharray': '4 4', 'stroke-opacity': 0.8 }, svg);
    const yb = Z.BRANCHES[p.year.branch];
    el('text', { x: c, y: c - 10, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': 38, fill: 'var(--gold-bright)', 'font-family': 'var(--f-brush)' }, svg, Z.STEMS[p.year.stem][0] + yb[0]);
    el('text', { x: c, y: c + 22, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': 12, fill: 'var(--muted)', 'font-family': 'var(--f-display)', 'letter-spacing': '0.12em' }, svg, yb[2].toUpperCase());
    $('cnLegend').innerHTML = '<span><b>Y</b> year · <b>M</b> month · <b>D</b> day · <b>H</b> hour</span><span><i style="border-color:var(--fire);border-top-style:dashed"></i>day clash</span>';
  }

  function tipCnStem(s) {
    const [ch, py, elx, img, text] = Z.STEMS[s];
    let h = `<div class="th"><span class="zh" style="color:${EL_COLOR[elx]}">${ch}</span> ${py} · ${polarity(s % 2 === 0)} ${Z.ELEMENTS[elx]}</div>`;
    h += `<div class="tplain">Heavenly stem, the image of ${img}. ${text}</div>`;
    if (cn) {
      const g2 = Z.tenGod(cn.dm, s);
      h += row('To the Day Master', s === cn.dm ? 'Same stem as the Day Master' : `<span class="zh">${g2[0]}</span> ${g2[1]}`);
    }
    h += row('Element', `${Z.ELEMENTS[elx]} <span class="zh">${Z.ELEMENT_ZH[elx]}</span> · produces ${Z.ELEMENTS[(elx + 1) % 5]}, controls ${Z.ELEMENTS[(elx + 2) % 5]}`);
    return h;
  }
  function tipCnBranch(b) {
    const [ch, py, animal, elx, hours, traits, hidden] = Z.BRANCHES[b];
    let h = `<div class="th"><span class="zh" style="color:${EL_COLOR[elx]}">${ch}</span> ${py} · ${animal}</div>`;
    h += `<div class="tplain">${traits}</div>`;
    h += row('Element', `${Z.ELEMENTS[elx]} <span class="zh">${Z.ELEMENT_ZH[elx]}</span>`);
    h += row('Hours', hours);
    h += row('Hidden stems', hidden.map((x) => `<span class="zh" style="color:${EL_COLOR[Z.STEMS[x][2]]}">${Z.STEMS[x][0]}</span> ${Z.STEMS[x][1]}`).join(', '));
    h += row('Clashes with', `${Z.BRANCHES[(b + 6) % 12][2]} <span class="zh">${Z.BRANCHES[(b + 6) % 12][0]}</span>`);
    const trine = [(b + 4) % 12, (b + 8) % 12].map((x) => Z.BRANCHES[x][2]).join(' and ');
    h += row('Allies (trine)', trine);
    if (cn) {
      const roles = [['year', cn.p.year], ['month', cn.p.month], ['day', cn.p.day], ['hour', cn.p.hour]].filter(([, x]) => x.branch === b).map(([k]) => k);
      if (roles.length) h += `<div class="muted tnote">This moment's ${roles.join(' and ')} branch.</div>`;
    }
    return h;
  }


  // ---------- Maya tab ----------
  const M = window.Maya;
  const DIR_COLOR = { Red: '#e8604a', White: '#f2ead6', Black: '#8e9c95', Yellow: '#f2c54e' }; // black shown as obsidian grey so it reads on dark
  let gearAngles = null; // cumulative rotation so the gears always turn the short way

  // Maya bar-and-dot numeral (0–19) as SVG; 0 is the shell.
  function barDot(n, w = 44) {
    const h = w * 1.25, cx = w / 2;
    let out = `<svg class="bardot" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-label="${n}">`;
    if (n === 0) {
      out += `<ellipse cx="${cx}" cy="${h / 2}" rx="${w * 0.38}" ry="${h * 0.2}" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M${cx - w * 0.24} ${h / 2 - 2} q${w * 0.24} ${h * 0.12} ${w * 0.48} 0" fill="none" stroke="currentColor" stroke-width="1.8"/>`;
      return out + '</svg>';
    }
    const bars = Math.floor(n / 5), dots = n % 5, bh = h * 0.11, gap = h * 0.06;
    const total = bars * (bh + gap) + (dots ? bh * 1.2 + gap : 0);
    let y = (h - total) / 2;
    if (dots) {
      const r = bh * 0.6, span = w * 0.8, step = span / 4;
      const x0 = cx - (step * (dots - 1)) / 2;
      for (let i = 0; i < dots; i++) out += `<circle cx="${x0 + i * step}" cy="${y + r}" r="${r}" fill="currentColor"/>`;
      y += bh * 1.2 + gap;
    }
    for (let i = 0; i < bars; i++) { out += `<rect x="${w * 0.08}" y="${y}" width="${w * 0.84}" height="${bh}" rx="${bh / 2}" fill="currentColor"/>`; y += bh + gap; }
    return out + '</svg>';
  }
  function cartouche(sign, size = '') {
    const [name, eng] = M.SIGNS[sign];
    const [, color] = M.DIRECTIONS[sign % 4];
    return `<span class="cartouche ${size}" style="--dir:${DIR_COLOR[color]}"><b>${name}</b><small>${eng}</small></span>`;
  }

  function renderMaya(local, place) {
    const r = M.mayaDate(local.y, local.m, local.d);
    const [name, eng, meaning] = M.SIGNS[r.tz.sign];
    const [dir, color] = r.direction;
    const posInTrecena = r.tz.number;
    $('myDay').innerHTML = `
      <div class="my-hero tipzone" data-tip="my-sign:${r.tz.sign}" tabindex="0">
        <span class="my-num" style="color:${DIR_COLOR[color]}">${barDot(r.tz.number, 56)}</span>
        ${cartouche(r.tz.sign, 'big')}
        <div class="my-hero-text"><div class="my-title">${r.tz.number} ${name}</div><div class="muted">${eng} · ${dir}, ${color.toLowerCase()}</div></div>
      </div>
      <div class="tplain my-meaning">${meaning}</div>
      ${row('Day of the count', `${r.kin} of 260`)}
      ${row('Trecena', `began on 1 ${M.SIGNS[r.trecena][0]} (${M.SIGNS[r.trecena][1]}) · day ${posInTrecena} of 13`)}
      ${row('Lord of the Night', `G${r.lord} of 9`)}
      ${row('Calendar Round', `${r.tz.number} ${name} ${r.hb.day} ${M.HAAB[r.hb.month]}`)}`;

    $('myLong').innerHTML = M.LC_UNITS.map(([unit, n], i) => `<div class="lc-col"><span class="lc-num">${barDot(r.longCount[i], 40)}</span><b>${r.longCount[i]}</b><small>${unit}</small><small class="muted">${n.toLocaleString('en')} d</small></div>`).join('');
    $('myRound').textContent = `${r.longCount.join('.')} · ${r.days.toLocaleString('en')} days since the Maya creation date, 11 August 3114 BCE.`;

    // Haab'
    const months = M.HAAB.map((mn, i) => `<span class="hb-m${i === r.hb.month ? ' on' : ''}${i === 18 ? ' wayeb' : ''}" title="${mn}">${mn}</span>`).join('');
    const ny = new Date(Date.UTC(local.y, local.m - 1, local.d + r.daysToNewYear));
    const bearerSign = M.SIGNS[r.bearer.sign][0];
    $('myHaab').innerHTML = `
      <div class="hb-now"><span class="my-num">${barDot(r.hb.day, 44)}</span><div><div class="my-title">${r.hb.day} ${M.HAAB[r.hb.month]}</div><div class="muted">${r.hb.month === 18 ? "Wayeb' · the five nameless days" : `Month ${r.hb.month + 1} of 18 · day ${r.hb.day} of 20`}</div></div></div>
      <div class="hb-strip">${months}</div>
      ${row('Year bearer', `${r.bearer.number} ${bearerSign} <span class="muted">(${M.SIGNS[r.bearer.sign][1]})</span>`)}
      ${row('Next 0 Pop', `${new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' }).format(ny)} · in ${r.daysToNewYear} days`)}`;

    // next 20 days
    let nx = '';
    for (let k = 1; k <= 20; k++) {
      const dt = new Date(Date.UTC(local.y, local.m - 1, local.d + k));
      const t = M.tzolkin(r.days + k);
      nx += `<button type="button" class="my-day" data-date="${dt.toISOString().slice(0, 10)}" style="--dir:${DIR_COLOR[M.DIRECTIONS[t.sign % 4][1]]}">
        <span class="my-day-n">${t.number}</span><span class="my-day-s">${M.SIGNS[t.sign][0]}</span><small>${new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short' }).format(dt)}</small></button>`;
    }
    $('myNext').innerHTML = nx;

    drawGears(r);
    $('emblemNum').innerHTML = barDot(r.tz.number, 34);
    $('emblem').title = `${r.tz.number} ${name}`;
    $('title').textContent = `${r.tz.number} ${name} · ${r.hb.day} ${M.HAAB[r.hb.month]}`;
    $('big3').innerHTML = `<div><b>${r.longCount.join('.')}</b></div><div><b>${eng}</b> day · ${dir}</div><div>Lord of the Night <b>G${r.lord}</b></div>`;
  }

  function gearPath(cx, cy, r, teeth, depth) {
    let d = '';
    const step = (Math.PI * 2) / teeth;
    for (let i = 0; i < teeth; i++) {
      const a = i * step - step / 2;
      const pts = [[a, r - depth], [a + step * 0.18, r], [a + step * 0.5, r], [a + step * 0.68, r - depth]];
      pts.forEach(([ang, rad], k) => { const x = cx + rad * Math.cos(ang), y = cy + rad * Math.sin(ang); d += (i === 0 && k === 0 ? 'M' : 'L') + x.toFixed(2) + ' ' + y.toFixed(2); });
    }
    return d + 'Z';
  }

  function drawGears(r) {
    const svg = $('myGears');
    const g20 = { cx: 290, cy: 150, r: 132 }, g13 = { cx: 88, cy: 150, r: 74 };
    if (!svg.querySelector('.gear20')) {
      svg.innerHTML = '';
      // 20 day-sign gear
      const a = el('g', { class: 'gear gear20', style: `transform-origin:${g20.cx}px ${g20.cy}px` }, svg);
      el('path', { d: gearPath(g20.cx, g20.cy, g20.r, 20, 12), fill: 'var(--gear-a)', stroke: 'var(--gold)', 'stroke-width': 1.2 }, a);
      el('circle', { cx: g20.cx, cy: g20.cy, r: g20.r - 66, fill: 'var(--wheel-core)', stroke: 'var(--rule)' }, a);
      for (let i = 0; i < 20; i++) {
        const ang = (i * 18) * Math.PI / 180;
        const x = g20.cx + (g20.r - 34) * Math.cos(ang), y = g20.cy + (g20.r - 34) * Math.sin(ang);
        const col = DIR_COLOR[M.DIRECTIONS[i % 4][1]];
        el('text', { x, y, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': 12.5, fill: col, 'font-family': 'var(--f-body)', transform: `rotate(${i * 18} ${x} ${y})`, 'data-tip': `my-sign:${i}`, class: 'tipzone' }, a, M.SIGNS[i][0]);
      }
      el('text', { x: g20.cx, y: g20.cy - 8, 'text-anchor': 'middle', 'font-size': 13, fill: 'var(--muted)', 'font-family': 'var(--f-display)', 'letter-spacing': '0.15em' }, svg, '20 SIGNS');
      // 13 number gear
      const b = el('g', { class: 'gear gear13', style: `transform-origin:${g13.cx}px ${g13.cy}px` }, svg);
      el('path', { d: gearPath(g13.cx, g13.cy, g13.r, 13, 10), fill: 'var(--gear-b)', stroke: 'var(--gold)', 'stroke-width': 1.2 }, b);
      el('circle', { cx: g13.cx, cy: g13.cy, r: g13.r - 40, fill: 'var(--wheel-core)', stroke: 'var(--rule)' }, b);
      for (let j = 0; j < 13; j++) {
        const ang = (j * 360 / 13) * Math.PI / 180;
        const x = g13.cx + (g13.r - 24) * Math.cos(ang), y = g13.cy + (g13.r - 24) * Math.sin(ang);
        el('text', { x, y, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': 14, 'font-weight': 600, fill: 'var(--gold-bright)', 'font-family': 'var(--f-data)', transform: `rotate(${j * 360 / 13 + 90} ${x} ${y})` }, b, String(j + 1));
      }
      el('text', { x: g13.cx, y: g13.cy + 4, 'text-anchor': 'middle', 'font-size': 11, fill: 'var(--muted)', 'font-family': 'var(--f-display)', 'letter-spacing': '0.12em' }, svg, '13');
      // the meeting point
      const mx = (g13.cx + g13.r + g20.cx - g20.r) / 2;
      el('path', { d: `M${mx} 18 l-8 -12 h16 Z`, fill: 'var(--gold-bright)' }, svg);
      el('line', { x1: mx, y1: 20, x2: mx, y2: 282, stroke: 'var(--gold)', 'stroke-dasharray': '2 5', 'stroke-opacity': 0.6 }, svg);
      el('text', { x: mx, y: 296, 'text-anchor': 'middle', 'font-size': 12, fill: 'var(--gold-bright)', 'font-family': 'var(--f-body)', class: 'gear-label' }, svg, '');
    }
    // turn: the current sign sits at 180° on the 20-gear, the current number at 0° on the 13-gear
    const t20 = 180 - r.tz.sign * 18, t13 = -(r.tz.number - 1) * 360 / 13;
    const near = (prev, target) => prev + ((((target - prev) % 360) + 540) % 360 - 180);
    gearAngles = gearAngles ? { a20: near(gearAngles.a20, t20), a13: near(gearAngles.a13, t13) } : { a20: t20, a13: t13 };
    svg.querySelector('.gear20').style.transform = `rotate(${gearAngles.a20}deg)`;
    svg.querySelector('.gear13').style.transform = `rotate(${gearAngles.a13}deg)`;
    svg.querySelector('.gear-label').textContent = `${r.tz.number} ${M.SIGNS[r.tz.sign][0]}`;
  }

  function tipMayaSign(i) {
    const [name, eng, meaning] = M.SIGNS[i];
    const [dir, color] = M.DIRECTIONS[i % 4];
    let h = `<div class="th">${name} · ${eng}</div><div class="tplain">${meaning}</div>`;
    h += row('Direction', `${dir}, ${color.toLowerCase()}`);
    h += row('Position', `${i + 1} of 20`);
    return h;
  }

  // ---------- render ----------

  function render() {
    hideTip(true);
    setTimeout(syncURL, 0);
    const place = currentPlace();
    const hsys = $('hsys').value;
    document.querySelectorAll('input[name="hsysPick"]').forEach((r) => { r.checked = r.value === hsys; });
    $('customBox').hidden = $('place').value !== 'custom';
    store.set({ geo: fromGeo, place: $('place').value === 'custom' ? 'custom' : slug(currentPlace().name), hsys, lat: $('lat').value, lon: $('lon').value, tz: $('tz').value });
    if (!$('date').value) return;
    const [y, m, d] = $('date').value.split('-').map(Number);
    const [hh, mm] = ($('time').value || '12:00').split(':').map(Number);
    const when = localToUTC(y, m, d, hh, mm, place.tz);
    const chart = C.chart(when, place.lat, place.lon, hsys);
    const asps = E.aspects(chart.pts);
    const pats = E.patterns(chart.pts, asps);
    const byName = Object.fromEntries(chart.pts.map((p) => [p.name, p]));

    // day events (local midnight to midnight)
    const dayStart = localToUTC(y, m, d, 0, 0, place.tz);
    const dayEnd = localToUTC(y, m, d + 1, 0, 0, place.tz);
    const evs = E.dayEvents(dayStart, dayEnd);
    const lunation = evs.find((e) => e.kind === 'lunation');

    // header
    const dateStr = new Intl.DateTimeFormat('en-GB', { timeZone: place.tz, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(when);
    const phase = E.moonPhase(byName.Sun.lon, byName.Moon.lon);
    const moonSign = E.SIGNS[Math.floor(byName.Moon.lon / 30)];
    $('title').textContent = lunation ? lunation.title + eclipseAt(lunation) : `Moon in ${moonSign}`;
    $('subtitle').textContent = `${dateStr} · ${$('time').value} ${tzAbbr(when, place.tz)} · ${place.name}`;
    $('big3').innerHTML = '';
    [['Rising', chart.asc], ['Moon', byName.Moon.lon], ['Sun', byName.Sun.lon]].forEach(([lab, l]) => {
      const div = document.createElement('div');
      div.innerHTML = `<b>${E.SIGNS[Math.floor(norm(l) / 30)]}</b> ${lab}`;
      $('big3').appendChild(div);
    });

    ctx = { chart, asps, byName, place, houseOf: (lon) => houseOfCusps(chart.cusps, lon) };
    lastWhen = when;
    renderYear(place, when);
    drawWheel(chart, asps);
    if (view === 'chinese') renderChinese(when, { y, m, d, hh, mm }, place);
    if (view === 'maya') renderMaya({ y, m, d }, place);

    // today card
    drawMoon(phase);
    $('phase').textContent = `${phase.name} in ${moonSign}`;
    $('phasemeta').textContent = `${Math.round(phase.illum * 100)}% lit · ${Math.round(phase.elong)}° from the Sun`;
    const ul = $('events'); ul.innerHTML = '';
    const shown = evs.filter((e) => e.kind !== 'aspect' || ['conj', 'opp', 'sq', 'tri', 'sex'].includes(e.type.key));
    if (!shown.length) { ul.innerHTML = '<li class="empty" style="display:block">No exact aspects, sign changes or stations on this day.</li>'; }
    shown.forEach((e) => {
      const li = document.createElement('li');
      if (e.kind !== 'aspect') li.className = 'big';
      const lt = localParts(e.t, place.tz).time;
      const glyph = e.kind === 'aspect' ? ASPECT_GLYPH[e.type.key] : e.kind === 'lunation' ? '☽' : g(e.body);
      li.innerHTML = `<span class="t">${lt}</span><span class="g">${glyph}${VS}</span><span class="txt"><button type="button">${e.text}</button></span>`;
      li.querySelector('button').addEventListener('click', () => { $('time').value = lt; render(); });
      li.querySelector('button').title = 'Cast the chart for this moment';
      ul.appendChild(li);
    });

    // ephemeris table
    const houseOf = ctx.houseOf;
    const rows = chart.pts.map((p) => ({ ...p })).concat([
      { name: 'Asc', lon: chart.asc }, { name: 'MC', lon: chart.mc }, { name: 'Vertex', lon: chart.vertex },
    ]);
    const tbl = $('eph'); tbl.innerHTML = '';
    rows.forEach((p) => {
      const pos = fmtPos(p.lon);
      const tr = document.createElement('tr');
      tr.dataset.tip = p.name === 'Asc' ? 'angle:AC' : p.name === 'MC' ? 'angle:MC' : p.name === 'Vertex' ? 'angle:Vx' : `planet:${p.name}`;
      tr.tabIndex = 0;
      tr.classList.add('tipzone');
      if (APPROX.includes(p.name)) tr.classList.add('approx');
      const color = `var(${EL_VAR[pos.sign % 4]})`;
      const isAngle = ['Asc', 'MC', 'Vertex'].includes(p.name);
      tr.innerHTML = `<td class="g" style="${isAngle ? 'font-family:var(--f-data);font-size:11px;font-weight:600' : ''}">${g(p.name)}</td>
        <td class="nm">${LABEL[p.name] || p.name}</td>
        <td class="pos">${pos.deg}° <span style="color:${color};font-family:var(--f-glyph)">${sg(pos.sign)}</span> ${pad(pos.min)}′</td>
        <td class="r">${p.retro ? 'R' : ''}</td>
        <td class="h">${isAngle ? '' : `<span class="tipzone hcell" data-tip="house:${houseOf(p.lon) - 1}" tabindex="0">H${houseOf(p.lon)}</span>`}</td>`;
      tbl.appendChild(tr);
    });

    // balance
    const bal = E.balance(chart);
    const bars = (target, labels, counts, colors) => {
      const box = $(target); box.innerHTML = '';
      const max = Math.max(...counts, 1);
      labels.forEach((lab, i) => {
        const row = document.createElement('div'); row.className = 'bar';
        row.innerHTML = `<span>${lab}</span><span class="track"><span class="fill" style="display:block;width:${(counts[i] / max) * 100}%;background:${colors[i]};color:${colors[i]}"></span></span><span class="n">${counts[i]}</span>`;
        box.appendChild(row);
      });
    };
    bars('elements', E.ELEMENT, bal.el, EL_VAR.map((v) => `var(${v})`));
    bars('modes', E.MODE, bal.md, ['var(--violet)', 'var(--violet)', 'var(--violet)']);
    const ascSign = Math.floor(chart.asc / 30);
    let ph = `<div style="margin-bottom:6px;font-size:13px">Strongest: <b>${bal.strongEl}</b>, <b>${bal.strongMd}</b> · Chart ruler: <b>${E.RULER[ascSign]}</b> (${E.SIGNS[ascSign]} rising) · <span class="note">counts Sun to Pluto plus the Ascendant</span></div>`;
    if (pats.length) {
      ph += pats.map((p) => `<span class="pill"><b>${p.type}</b> ${p.focus && p.type !== 'Stellium' ? `to ${p.focus} · ` : p.type === 'Stellium' ? `in ${p.focus} · ` : ''}${p.members.filter((n) => n !== p.focus).map((n) => g(n) + ' ' + n).join(', ')}</span>`).join('');
    } else ph += '<span class="empty">No Yod, T-square, Grand Trine or stellium right now.</span>';
    $('patterns').innerHTML = ph;

    // aspects list
    const al = $('asplist'); al.innerHTML = '';
    asps.forEach((a, i) => {
      const div = document.createElement('div');
      div.dataset.tip = `aspect:${i}`; div.tabIndex = 0; div.className = 'tipzone';
      div.innerHTML = `<span class="gl">${g(a.a)}</span><span class="gl" style="color:${ASPECT_COLOR[a.type.key]}">${ASPECT_GLYPH[a.type.key]}${VS}</span><span class="gl">${g(a.b)}</span><span>${a.a} ${a.type.name.toLowerCase()} ${a.b}</span><span class="o">${a.applying ? 'a' : 's'} ${a.orb.toFixed(1)}°</span>`;
      al.appendChild(div);
    });
  }

  // ---------- wire up ----------
  function boot() {
    initControls();
    ['controls'].forEach((id) => $(id).addEventListener('change', () => { urlSync = true; $('urlnote').hidden = true; }, true));
    $('copylink').addEventListener('click', () => {
      const url = shareURL(), btn = $('copylink');
      const done = (ok) => { btn.textContent = ok ? 'Link copied' : 'Copy failed'; setTimeout(() => { btn.textContent = 'Copy link'; }, 1600); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(() => done(true), () => done(false));
      else done(false);
    });
    $('locate').addEventListener('click', locate);
    VIEWS.forEach(([k, label]) => $('tab' + label).addEventListener('click', () => setView(k, true)));
    document.querySelector('.tabs').addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault(); e.stopPropagation();
      const i = VIEWS.findIndex(([k]) => k === view), n = VIEWS.length;
      const [next, label] = VIEWS[(i + (e.key === 'ArrowRight' ? 1 : n - 1)) % n];
      setView(next, true); $('tab' + label).focus();
    });
    // redraw the wheel when crossing the phone/desktop width (e.g. rotating a phone)
    let wasCompact = isCompact(), rt = 0;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (isCompact() !== wasCompact) { wasCompact = isCompact(); render(); } }, 150); });
    // swipe the wheel left/right to change day
    let sx = 0, sy = 0, st = 0;
    const wheelbox = document.querySelector('.wheelbox svg');
    wheelbox.addEventListener('touchstart', (e) => { const t = e.touches[0]; sx = t.clientX; sy = t.clientY; st = Date.now(); }, { passive: true });
    wheelbox.addEventListener('touchend', (e) => {
      const t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
      if (Date.now() - st < 600 && Math.abs(dx) > 60 && Math.abs(dy) < 45) shiftDay(dx < 0 ? 1 : -1);
    }, { passive: true });
    $('install').addEventListener('click', install);
    ['lat', 'lon', 'place'].forEach((id) => $(id).addEventListener('change', () => { fromGeo = false; }, true));
    $('prev').addEventListener('click', () => shiftDay(-1));
    $('next').addEventListener('click', () => shiftDay(1));
    $('now').addEventListener('click', () => { urlSync = true; useBrowserPlace(); setNow(true); render(); });
    ['date', 'time', 'place', 'lat', 'lon', 'tz'].forEach((id) => $(id).addEventListener('change', render));
    document.querySelectorAll('input[name="hsysPick"]').forEach((r) => r.addEventListener('change', () => {
      if (!r.checked) return;
      urlSync = true; $('hsys').value = r.value; render();
    }));
    $('controls').addEventListener('submit', (e) => e.preventDefault());
    document.addEventListener('keydown', (e) => {
      if (e.target.matches('input, select, textarea')) return;
      if (e.key === 'ArrowLeft') shiftDay(-1);
      if (e.key === 'ArrowRight') shiftDay(1);
    });
    render();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(render);
    $('myNext').addEventListener('click', (e) => { const b = e.target.closest('.my-day'); if (b) { $('date').value = b.dataset.date; urlSync = true; render(); } });
    $('yearlist').addEventListener('click', (e) => { const b = e.target.closest('.yitem'); if (b) jumpTo(b.dataset.t); });
    setTimeout(() => {
      const d = new Date(); const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
      try { yearEvents = E.yearAhead(start); } catch (err) { yearEvents = []; }
      renderYear(currentPlace(), lastWhen);
    }, 60);
  }
  if (window.Astronomy) boot();
  else document.getElementById('subtitle').textContent = 'The astronomy library did not load. Reload the page to try again.';
})();
