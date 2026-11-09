// Aspects, patterns and day events. Needs AstroCore.
(function (root) {
  const C = root.AstroCore;
  const norm = C.norm;
  const SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
  const ELEMENT = ['Fire', 'Earth', 'Air', 'Water'];
  const MODE = ['Cardinal', 'Fixed', 'Mutable'];
  const RULER = ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Pluto', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'];
  const ASPECTS = [
    { name: 'Conjunction', angle: 0, orb: 8, key: 'conj' },
    { name: 'Opposition', angle: 180, orb: 8, key: 'opp' },
    { name: 'Trine', angle: 120, orb: 7, key: 'tri' },
    { name: 'Square', angle: 90, orb: 7, key: 'sq' },
    { name: 'Sextile', angle: 60, orb: 5, key: 'sex' },
    { name: 'Quincunx', angle: 150, orb: 3, key: 'qx' },
  ];
  const ASPECT_BODIES = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'Chiron'];
  const sep = (a, b) => { const d = Math.abs(norm(a - b)); return d > 180 ? 360 - d : d; };

  function aspects(pts) {
    const list = pts.filter((p) => ASPECT_BODIES.includes(p.name));
    const out = [];
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
      const s = sep(list[i].lon, list[j].lon);
      for (const a of ASPECTS) {
        const orb = Math.abs(s - a.angle);
        if (orb <= a.orb) {
          // applying when the orb shrinks a moment later
          const dt = 0.01, la = list[i].lon + (list[i].speed || 0) * dt, lb = list[j].lon + (list[j].speed || 0) * dt;
          const applying = Math.abs(sep(la, lb) - a.angle) < orb;
          out.push({ a: list[i].name, b: list[j].name, type: a, orb, applying });
          break;
        }
      }
    }
    return out.sort((x, y) => x.orb - y.orb);
  }

  function patterns(pts, asps) {
    const has = (a, b, key) => asps.some((x) => x.type.key === key && ((x.a === a && x.b === b) || (x.a === b && x.b === a)));
    const names = pts.filter((p) => ASPECT_BODIES.includes(p.name)).map((p) => p.name);
    const out = [];
    const seen = new Set();
    const add = (type, members, focus) => {
      const k = type + [...members].sort().join();
      if (seen.has(k)) return; seen.add(k);
      out.push({ type, members, focus });
    };
    for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) for (let k = 0; k < names.length; k++) {
      if (k === i || k === j) continue;
      const [a, b, c] = [names[i], names[j], names[k]];
      if (has(a, b, 'sex') && has(a, c, 'qx') && has(b, c, 'qx')) add('Yod', [a, b, c], c);
      if (has(a, b, 'opp') && has(a, c, 'sq') && has(b, c, 'sq')) add('T-square', [a, b, c], c);
      if (k > j && has(a, b, 'tri') && has(b, c, 'tri') && has(a, c, 'tri')) add('Grand Trine', [a, b, c]);
    }
    // stellium: 4+ bodies (Sun–Pluto) in one sign
    const bySign = {};
    pts.filter((p) => ASPECT_BODIES.slice(0, 10).includes(p.name)).forEach((p) => {
      const s = Math.floor(p.lon / 30); (bySign[s] = bySign[s] || []).push(p.name);
    });
    Object.entries(bySign).forEach(([s, m]) => { if (m.length >= 4) add('Stellium', m, SIGNS[s]); });
    return out;
  }

  function balance(chart) {
    const use = chart.pts.filter((p) => ASPECT_BODIES.slice(0, 10).includes(p.name)).map((p) => p.lon).concat([chart.asc]);
    const el = [0, 0, 0, 0], md = [0, 0, 0];
    use.forEach((l) => { const s = Math.floor(norm(l) / 30); el[s % 4]++; md[s % 3]++; });
    const strongEl = ELEMENT[el.indexOf(Math.max(...el))];
    const strongMd = MODE[md.indexOf(Math.max(...md))];
    return { el, md, strongEl, strongMd };
  }

  // Essential dignities (domicile incl. modern rulers; traditional exaltations)
  const DOMICILE = { Sun: [4], Moon: [3], Mercury: [2, 5], Venus: [1, 6], Mars: [0, 7], Jupiter: [8, 11], Saturn: [9, 10], Uranus: [10], Neptune: [11], Pluto: [7] };
  const EXALT = { Sun: 0, Moon: 1, Mercury: 5, Venus: 11, Mars: 9, Jupiter: 3, Saturn: 6 };
  function dignity(name, sign) {
    const dom = DOMICILE[name];
    if (!dom) return null;
    if (dom.includes(sign)) return 'Domicile';
    if (EXALT[name] === sign) return 'Exaltation';
    if (dom.some((d) => (d + 6) % 12 === sign)) return 'Detriment';
    if (EXALT[name] != null && (EXALT[name] + 6) % 12 === sign) return 'Fall';
    return 'Peregrine';
  }
  const TRAD_RULER = ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'];
  function signInfo(sign) {
    const exalted = Object.keys(EXALT).find((p) => EXALT[p] === sign) || null;
    return {
      name: SIGNS[sign], element: ELEMENT[sign % 4], mode: MODE[sign % 3], polarity: sign % 2 === 0 ? 'Masculine (yang)' : 'Feminine (yin)',
      trad: TRAD_RULER[sign], modern: RULER[sign], exalted,
      detriment: Object.keys(DOMICILE).filter((p) => DOMICILE[p].some((d) => (d + 6) % 12 === sign)),
      fall: Object.keys(EXALT).filter((p) => (EXALT[p] + 6) % 12 === sign),
    };
  }

  const PHASES = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'];
  function moonPhase(sun, moon) {
    const e = norm(moon - sun);
    const illum = (1 - Math.cos(e * Math.PI / 180)) / 2;
    return { elong: e, illum, name: PHASES[Math.floor(norm(e + 22.5) / 45) % 8] };
  }

  // Events between start and end (Date). Hourly samples, then bisection to the minute.
  const EVENT_BODIES = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'Chiron'];
  function refine(f, t0, t1) {
    let a = t0, b = t1, fa = f(a);
    for (let k = 0; k < 30 && b - a > 30000; k++) {
      const m = (a + b) / 2, fm = f(m);
      if ((fa <= 0) === (fm <= 0)) { a = m; fa = fm; } else b = m;
    }
    return new Date((a + b) / 2);
  }
  const wrap = (x) => { x = norm(x); return x > 180 ? x - 360 : x; };

  function dayEvents(start, end) {
    const step = 3600000;
    const times = [];
    for (let t = start.getTime(); t <= end.getTime() + 1; t += step) times.push(t);
    const lon = {};
    EVENT_BODIES.forEach((b) => { lon[b] = times.map((t) => C.lonOf(b, new Date(t))); });
    const ev = [];
    for (let i = 0; i < times.length - 1; i++) {
      const t0 = times[i], t1 = times[i + 1];
      // ingresses
      EVENT_BODIES.forEach((b) => {
        const s0 = Math.floor(lon[b][i] / 30), s1 = Math.floor(lon[b][i + 1] / 30);
        if (s0 !== s1) {
          const back = wrap(lon[b][i + 1] - lon[b][i]) < 0;
          const target = back ? s0 * 30 : s1 * 30;
          const when = refine((t) => wrap(C.lonOf(b, new Date(t)) - target), t0, t1);
          ev.push({ t: when, kind: 'ingress', body: b, text: `${b} enters ${SIGNS[s1]}${back ? ' (retrograde)' : ''}` });
        }
      });
      // lunations
      const e0 = norm(lon.Moon[i] - lon.Sun[i]), e1 = norm(lon.Moon[i + 1] - lon.Sun[i + 1]);
      [[0, 'New Moon'], [90, 'First Quarter'], [180, 'Full Moon'], [270, 'Last Quarter']].forEach(([ang, nm]) => {
        const d0 = wrap(e0 - ang), d1 = wrap(e1 - ang);
        if (d0 < 0 && d1 >= 0) {
          const when = refine((t) => wrap(norm(C.lonOf('Moon', new Date(t)) - C.lonOf('Sun', new Date(t))) - ang), t0, t1);
          const ml = C.lonOf('Moon', when);
          ev.push({ t: when, kind: 'lunation', body: 'Moon', text: `${nm} in ${SIGNS[Math.floor(ml / 30)]}`, title: `${SIGNS[Math.floor(ml / 30)]} ${nm}` });
        }
      });
      // exact aspects (pairs of event bodies, skipping Sun–Moon handled above)
      for (let a = 0; a < EVENT_BODIES.length; a++) for (let b = a + 1; b < EVENT_BODIES.length; b++) {
        const A = EVENT_BODIES[a], B = EVENT_BODIES[b];
        if (A === 'Sun' && B === 'Moon') continue;
        const d0 = norm(lon[B][i] - lon[A][i]), d1 = norm(lon[B][i + 1] - lon[A][i + 1]);
        ASPECTS.forEach((asp) => {
          const angles = asp.angle === 0 || asp.angle === 180 ? [asp.angle] : [asp.angle, 360 - asp.angle];
          angles.forEach((ang) => {
            const x0 = wrap(d0 - ang), x1 = wrap(d1 - ang);
            if (Math.sign(x0) !== Math.sign(x1) && Math.abs(x0 - x1) < 30) {
              const when = refine((t) => wrap(norm(C.lonOf(B, new Date(t)) - C.lonOf(A, new Date(t))) - ang) * Math.sign(x1 - x0), t0, t1);
              ev.push({ t: when, kind: 'aspect', body: A, other: B, type: asp, text: `${A} ${asp.name.toLowerCase()} ${B}` });
            }
          });
        });
      }
    }
    // stations
    EVENT_BODIES.filter((b) => !['Sun', 'Moon'].includes(b)).forEach((b) => {
      const s0 = C.speed(b, start), s1 = C.speed(b, end);
      if (Math.sign(s0) !== Math.sign(s1)) {
        const when = refine((t) => C.speed(b, new Date(t)) * Math.sign(s1), start.getTime(), end.getTime());
        ev.push({ t: when, kind: 'station', body: b, text: `${b} stations ${s1 < 0 ? 'retrograde' : 'direct'}` });
      }
    });
    return ev.sort((x, y) => x.t - y.t);
  }

  root.AstroEvents = { dignity, signInfo, SIGNS, ELEMENT, MODE, RULER, ASPECTS, aspects, patterns, balance, moonPhase, dayEvents, sep };
})(typeof window !== 'undefined' ? window : globalThis);
