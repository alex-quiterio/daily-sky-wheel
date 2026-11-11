// Aspects, patterns and day events. Needs AstroCore.
import * as Core from './core.ts';
import * as Astronomy from 'astronomy-engine';
import type { Chart, Point } from './core.ts';

export type AspectKey = 'conj' | 'opp' | 'tri' | 'sq' | 'sex' | 'qx';
export interface AspectType {
  name: string;
  angle: number;
  orb: number;
  key: AspectKey;
}
export interface Aspect {
  a: string;
  b: string;
  type: AspectType;
  orb: number;
  applying: boolean;
}
export interface Pattern {
  type: 'Yod' | 'T-square' | 'Grand Trine' | 'Stellium';
  members: string[];
  focus?: string; // the apex planet, or the sign of a stellium
}
export interface MoonPhase {
  elong: number; // Moon's elongation from the Sun, 0-360
  illum: number; // lit fraction, 0-1
  name: string;
}

// Something that happens in the sky on a given day
export interface DayEvent {
  t: Date;
  kind: 'ingress' | 'lunation' | 'aspect' | 'station';
  body: string;
  text: string;
  title?: string; // lunations: "Scorpio New Moon"
  other?: string; // aspects: the second body
  type?: AspectType;
}
// An entry in the year ahead
export interface YearEvent {
  t: Date;
  cat: 'eclipse' | 'retro' | 'ingress' | 'aspect' | 'venus' | 'season';
  body: string;
  title: string;
  detail: string;
  retro?: boolean; // stations: turning retrograde
  sign?: number; // ingresses and seasons: the sign entered
  other?: string; // aspects: the second body
  aspKey?: AspectKey;
}
export interface PlanetaryHour {
  n: number; // 1-24, from sunrise
  isDay: boolean;
  ruler: string;
  start: Date;
  end: Date;
  minutes: number;
}

const norm = Core.norm;
const SIGNS = [
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces',
];
const ELEMENT = ['Fire', 'Earth', 'Air', 'Water'];
const MODE = ['Cardinal', 'Fixed', 'Mutable'];
const RULER = [
  'Mars',
  'Venus',
  'Mercury',
  'Moon',
  'Sun',
  'Mercury',
  'Venus',
  'Pluto',
  'Jupiter',
  'Saturn',
  'Uranus',
  'Neptune',
];
const ASPECTS: AspectType[] = [
  { name: 'Conjunction', angle: 0, orb: 8, key: 'conj' },
  { name: 'Opposition', angle: 180, orb: 8, key: 'opp' },
  { name: 'Trine', angle: 120, orb: 7, key: 'tri' },
  { name: 'Square', angle: 90, orb: 7, key: 'sq' },
  { name: 'Sextile', angle: 60, orb: 5, key: 'sex' },
  { name: 'Quincunx', angle: 150, orb: 3, key: 'qx' },
];
const ASPECT_BODIES = [
  'Sun',
  'Moon',
  'Mercury',
  'Venus',
  'Mars',
  'Jupiter',
  'Saturn',
  'Uranus',
  'Neptune',
  'Pluto',
  'Chiron',
];
const sep = (a: number, b: number) => {
  const d = Math.abs(norm(a - b));
  return d > 180 ? 360 - d : d;
};

function aspects(pts: Point[]): Aspect[] {
  const list = pts.filter((p) => ASPECT_BODIES.includes(p.name));
  const out: Aspect[] = [];
  for (let i = 0; i < list.length; i++)
    for (let j = i + 1; j < list.length; j++) {
      const s = sep(list[i].lon, list[j].lon);
      for (const a of ASPECTS) {
        const orb = Math.abs(s - a.angle);
        if (orb <= a.orb) {
          // applying when the orb shrinks a moment later
          const dt = 0.01,
            la = list[i].lon + (list[i].speed || 0) * dt,
            lb = list[j].lon + (list[j].speed || 0) * dt;
          const applying = Math.abs(sep(la, lb) - a.angle) < orb;
          out.push({ a: list[i].name, b: list[j].name, type: a, orb, applying });
          break;
        }
      }
    }
  return out.sort((x, y) => x.orb - y.orb);
}

function patterns(pts: Point[], asps: Aspect[]): Pattern[] {
  const has = (a: string, b: string, key: AspectKey) =>
    asps.some((x) => x.type.key === key && ((x.a === a && x.b === b) || (x.a === b && x.b === a)));
  const names = pts.filter((p) => ASPECT_BODIES.includes(p.name)).map((p) => p.name);
  const out: Pattern[] = [];
  const seen = new Set<string>();
  const add = (type: Pattern['type'], members: string[], focus?: string) => {
    const k = type + [...members].sort().join();
    if (seen.has(k)) return;
    seen.add(k);
    out.push({ type, members, focus });
  };
  for (let i = 0; i < names.length; i++)
    for (let j = i + 1; j < names.length; j++)
      for (let k = 0; k < names.length; k++) {
        if (k === i || k === j) continue;
        const [a, b, c] = [names[i], names[j], names[k]];
        if (has(a, b, 'sex') && has(a, c, 'qx') && has(b, c, 'qx')) add('Yod', [a, b, c], c);
        if (has(a, b, 'opp') && has(a, c, 'sq') && has(b, c, 'sq')) add('T-square', [a, b, c], c);
        if (k > j && has(a, b, 'tri') && has(b, c, 'tri') && has(a, c, 'tri')) add('Grand Trine', [a, b, c]);
      }
  // stellium: 4+ bodies (Sun–Pluto) in one sign
  const bySign: Record<number, string[]> = {};
  pts
    .filter((p) => ASPECT_BODIES.slice(0, 10).includes(p.name))
    .forEach((p) => {
      const s = Math.floor(p.lon / 30);
      (bySign[s] = bySign[s] || []).push(p.name);
    });
  Object.entries(bySign).forEach(([s, m]) => {
    if (m.length >= 4) add('Stellium', m, SIGNS[+s]);
  });
  return out;
}

function balance(chart: Chart) {
  const use = chart.pts
    .filter((p) => ASPECT_BODIES.slice(0, 10).includes(p.name))
    .map((p) => p.lon)
    .concat([chart.asc]);
  const el = [0, 0, 0, 0],
    md = [0, 0, 0];
  use.forEach((l: number) => {
    const s = Math.floor(norm(l) / 30);
    el[s % 4]++;
    md[s % 3]++;
  });
  const strongEl = ELEMENT[el.indexOf(Math.max(...el))];
  const strongMd = MODE[md.indexOf(Math.max(...md))];
  return { el, md, strongEl, strongMd };
}

// Essential dignities (domicile incl. modern rulers; traditional exaltations)
const DOMICILE: Record<string, number[]> = {
  Sun: [4],
  Moon: [3],
  Mercury: [2, 5],
  Venus: [1, 6],
  Mars: [0, 7],
  Jupiter: [8, 11],
  Saturn: [9, 10],
  Uranus: [10],
  Neptune: [11],
  Pluto: [7],
};
const EXALT: Record<string, number> = { Sun: 0, Moon: 1, Mercury: 5, Venus: 11, Mars: 9, Jupiter: 3, Saturn: 6 };
function dignity(name: string, sign: number) {
  const dom = DOMICILE[name];
  if (!dom) return null;
  if (dom.includes(sign)) return 'Domicile';
  if (EXALT[name] === sign) return 'Exaltation';
  if (dom.some((d: number) => (d + 6) % 12 === sign)) return 'Detriment';
  if (EXALT[name] != null && (EXALT[name] + 6) % 12 === sign) return 'Fall';
  return 'Peregrine';
}
const TRAD_RULER = [
  'Mars',
  'Venus',
  'Mercury',
  'Moon',
  'Sun',
  'Mercury',
  'Venus',
  'Mars',
  'Jupiter',
  'Saturn',
  'Saturn',
  'Jupiter',
];
function signInfo(sign: number) {
  const exalted = Object.keys(EXALT).find((p) => EXALT[p] === sign) || null;
  return {
    name: SIGNS[sign],
    element: ELEMENT[sign % 4],
    mode: MODE[sign % 3],
    polarity: sign % 2 === 0 ? 'Masculine (yang)' : 'Feminine (yin)',
    trad: TRAD_RULER[sign],
    modern: RULER[sign],
    exalted,
    detriment: Object.keys(DOMICILE).filter((p) => DOMICILE[p].some((d) => (d + 6) % 12 === sign)),
    fall: Object.keys(EXALT).filter((p) => (EXALT[p] + 6) % 12 === sign),
  };
}

const PHASES = [
  'New Moon',
  'Waxing Crescent',
  'First Quarter',
  'Waxing Gibbous',
  'Full Moon',
  'Waning Gibbous',
  'Last Quarter',
  'Waning Crescent',
];
function moonPhase(sun: number, moon: number): MoonPhase {
  const e = norm(moon - sun);
  const illum = (1 - Math.cos((e * Math.PI) / 180)) / 2;
  return { elong: e, illum, name: PHASES[Math.floor(norm(e + 22.5) / 45) % 8] };
}

// Events between start and end (Date). Hourly samples, then bisection to the minute.
const EVENT_BODIES = [
  'Sun',
  'Moon',
  'Mercury',
  'Venus',
  'Mars',
  'Jupiter',
  'Saturn',
  'Uranus',
  'Neptune',
  'Pluto',
  'Chiron',
];
function refine(f: (t: number) => number, t0: number, t1: number): Date {
  let a = t0,
    b = t1,
    fa = f(a);
  for (let k = 0; k < 30 && b - a > 30000; k++) {
    const m = (a + b) / 2,
      fm = f(m);
    if (fa <= 0 === fm <= 0) {
      a = m;
      fa = fm;
    } else b = m;
  }
  return new Date((a + b) / 2);
}
const wrap = (x: number) => {
  x = norm(x);
  return x > 180 ? x - 360 : x;
};

function dayEvents(start: Date, end: Date): DayEvent[] {
  const step = 3600000;
  const times: number[] = [];
  for (let t = start.getTime(); t <= end.getTime() + 1; t += step) times.push(t);
  const lon: Record<string, number[]> = {};
  EVENT_BODIES.forEach((b) => {
    lon[b] = times.map((t) => Core.lonOf(b, new Date(t)));
  });
  const ev: DayEvent[] = [];
  for (let i = 0; i < times.length - 1; i++) {
    const t0 = times[i],
      t1 = times[i + 1];
    // ingresses
    EVENT_BODIES.forEach((b) => {
      const s0 = Math.floor(lon[b][i] / 30),
        s1 = Math.floor(lon[b][i + 1] / 30);
      if (s0 !== s1) {
        const back = wrap(lon[b][i + 1] - lon[b][i]) < 0;
        const target = back ? s0 * 30 : s1 * 30;
        const when = refine((t) => wrap(Core.lonOf(b, new Date(t)) - target), t0, t1);
        ev.push({ t: when, kind: 'ingress', body: b, text: `${b} enters ${SIGNS[s1]}${back ? ' (retrograde)' : ''}` });
      }
    });
    // lunations
    const e0 = norm(lon.Moon[i] - lon.Sun[i]),
      e1 = norm(lon.Moon[i + 1] - lon.Sun[i + 1]);
    (
      [
        [0, 'New Moon'],
        [90, 'First Quarter'],
        [180, 'Full Moon'],
        [270, 'Last Quarter'],
      ] as [number, string][]
    ).forEach(([ang, nm]) => {
      const d0 = wrap(e0 - ang),
        d1 = wrap(e1 - ang);
      if (d0 < 0 && d1 >= 0) {
        const when = refine(
          (t) => wrap(norm(Core.lonOf('Moon', new Date(t)) - Core.lonOf('Sun', new Date(t))) - ang),
          t0,
          t1,
        );
        const ml = Core.lonOf('Moon', when);
        ev.push({
          t: when,
          kind: 'lunation',
          body: 'Moon',
          text: `${nm} in ${SIGNS[Math.floor(ml / 30)]}`,
          title: `${SIGNS[Math.floor(ml / 30)]} ${nm}`,
        });
      }
    });
    // exact aspects (pairs of event bodies, skipping Sun–Moon handled above)
    for (let a = 0; a < EVENT_BODIES.length; a++)
      for (let b = a + 1; b < EVENT_BODIES.length; b++) {
        const A = EVENT_BODIES[a],
          B = EVENT_BODIES[b];
        if (A === 'Sun' && B === 'Moon') continue;
        const d0 = norm(lon[B][i] - lon[A][i]),
          d1 = norm(lon[B][i + 1] - lon[A][i + 1]);
        ASPECTS.forEach((asp) => {
          const angles = asp.angle === 0 || asp.angle === 180 ? [asp.angle] : [asp.angle, 360 - asp.angle];
          angles.forEach((ang) => {
            const x0 = wrap(d0 - ang),
              x1 = wrap(d1 - ang);
            if (Math.sign(x0) !== Math.sign(x1) && Math.abs(x0 - x1) < 30) {
              const when = refine(
                (t) => wrap(norm(Core.lonOf(B, new Date(t)) - Core.lonOf(A, new Date(t))) - ang) * Math.sign(x1 - x0),
                t0,
                t1,
              );
              ev.push({
                t: when,
                kind: 'aspect',
                body: A,
                other: B,
                type: asp,
                text: `${A} ${asp.name.toLowerCase()} ${B}`,
              });
            }
          });
        });
      }
  }
  // stations
  EVENT_BODIES.filter((b) => !['Sun', 'Moon'].includes(b)).forEach((b) => {
    const s0 = Core.speed(b, start),
      s1 = Core.speed(b, end);
    if (Math.sign(s0) !== Math.sign(s1)) {
      const when = refine((t) => Core.speed(b, new Date(t)) * Math.sign(s1), start.getTime(), end.getTime());
      ev.push({ t: when, kind: 'station', body: b, text: `${b} stations ${s1 < 0 ? 'retrograde' : 'direct'}` });
    }
  });
  return ev.sort((x, y) => x.t.getTime() - y.t.getTime());
}

// ---------- the year ahead ----------
// Notable sky events between `start` and `start + days`: eclipses, stations, slow-planet ingresses,
// exact aspects between the outer planets, Venus–Sun conjunctions and the equinoxes/solstices.
const STATION_BODIES = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'Chiron'];
const INGRESS_BODIES = ['Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'Chiron', 'Node'];
const OUTER = ['Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'Chiron'];
const DAY = 86400000;
const posText = (l: number) => {
  l = norm(l);
  const s = Math.floor(l / 30),
    d = l - s * 30;
  return `${Math.floor(d)}°${String(Math.floor((d % 1) * 60)).padStart(2, '0')}′ ${SIGNS[s]}`;
};

function yearAhead(start: Date, days = 366): YearEvent[] {
  const t0 = start.getTime(),
    t1 = t0 + days * DAY;
  const out: YearEvent[] = [];
  const add = (
    t: number,
    cat: YearEvent['cat'],
    body: string,
    title: string,
    detail: string,
    extra: Partial<YearEvent> = {},
  ) => {
    if (t >= t0 && t <= t1) out.push({ t: new Date(t), cat, body, title, detail, ...extra });
  };

  // daily samples of the slow-ish bodies
  const names = [...new Set(['Sun', 'Venus', ...STATION_BODIES, ...INGRESS_BODIES])];
  const times: number[] = [];
  for (let t = t0 - DAY; t <= t1 + DAY; t += DAY) times.push(t);
  const lon: Record<string, number[]> = {};
  names.forEach((n) => {
    lon[n] = times.map((t) => Core.lonOf(n, new Date(t)));
  });
  const step = (n: string, i: number) => wrap(lon[n][i + 1] - lon[n][i]);

  for (let i = 0; i < times.length - 2; i++) {
    const ta = times[i],
      tb = times[i + 1];
    // stations: daily motion changes sign
    STATION_BODIES.forEach((b) => {
      const m0 = step(b, i),
        m1 = step(b, i + 1);
      if (Math.sign(m0) !== Math.sign(m1) && m0 !== 0) {
        const when = refine((t) => Core.speed(b, new Date(t)) * Math.sign(m1), ta, times[i + 2]);
        const retro = m1 < 0;
        add(
          when.getTime(),
          'retro',
          b,
          `${b} stations ${retro ? 'retrograde' : 'direct'}`,
          posText(Core.lonOf(b, when)),
          { retro },
        );
      }
    });
    // ingresses of the slow movers
    INGRESS_BODIES.forEach((b) => {
      const s0 = Math.floor(lon[b][i] / 30),
        s1 = Math.floor(lon[b][i + 1] / 30);
      if (s0 !== s1) {
        const back = step(b, i) < 0;
        const target = back ? s0 * 30 : s1 * 30;
        const when = refine((t) => wrap(Core.lonOf(b, new Date(t)) - target), ta, tb);
        const label = b === 'Node' ? 'North Node' : b;
        add(
          when.getTime(),
          'ingress',
          b,
          `${label} enters ${SIGNS[s1]}`,
          back
            ? `back into ${SIGNS[s1]}, retrograde`
            : b === 'Node'
              ? 'South Node enters ' + SIGNS[(s1 + 6) % 12]
              : `leaves ${SIGNS[s0]}`,
          { sign: s1 },
        );
      }
    });
    // exact aspects between outer planets
    for (let a = 0; a < OUTER.length; a++)
      for (let b = a + 1; b < OUTER.length; b++) {
        const P = OUTER[a],
          Q = OUTER[b];
        const d0 = norm(lon[Q][i] - lon[P][i]),
          d1 = norm(lon[Q][i + 1] - lon[P][i + 1]);
        ASPECTS.filter((x) => x.key !== 'qx').forEach((asp) => {
          const angles = asp.angle === 0 || asp.angle === 180 ? [asp.angle] : [asp.angle, 360 - asp.angle];
          angles.forEach((ang) => {
            const x0 = wrap(d0 - ang),
              x1 = wrap(d1 - ang);
            if (Math.sign(x0) !== Math.sign(x1) && Math.abs(x0 - x1) < 5) {
              const when = refine(
                (t) => wrap(norm(Core.lonOf(Q, new Date(t)) - Core.lonOf(P, new Date(t))) - ang) * Math.sign(x1 - x0),
                ta,
                tb,
              );
              add(
                when.getTime(),
                'aspect',
                P,
                `${P} ${asp.name.toLowerCase()} ${Q}`,
                `${posText(Core.lonOf(P, when))} · ${posText(Core.lonOf(Q, when))}`,
                { other: Q, aspKey: asp.key },
              );
            }
          });
        });
      }
    // Venus–Sun conjunctions (Venus star points)
    const v0 = wrap(lon.Venus[i] - lon.Sun[i]),
      v1 = wrap(lon.Venus[i + 1] - lon.Sun[i + 1]);
    if (Math.sign(v0) !== Math.sign(v1) && Math.abs(v0 - v1) < 10) {
      const when = refine(
        (t) => wrap(Core.lonOf('Venus', new Date(t)) - Core.lonOf('Sun', new Date(t))) * Math.sign(v1 - v0),
        ta,
        tb,
      );
      const retro = Core.speed('Venus', when) < 0;
      add(
        when.getTime(),
        'venus',
        'Venus',
        `Venus star point (${retro ? 'inferior' : 'superior'} conjunction)`,
        `${posText(Core.lonOf('Sun', when))}${retro ? ' · Venus retrograde, morning star rising' : ' · Venus direct, evening star rising'}`,
      );
    }
  }

  // eclipses
  try {
    let le = Astronomy.SearchLunarEclipse(new Date(t0));
    while (le.peak.date.getTime() <= t1) {
      const t = le.peak.date,
        ml = Core.lonOf('Moon', t);
      add(
        t.getTime(),
        'eclipse',
        'Moon',
        `${le.kind[0].toUpperCase() + le.kind.slice(1)} lunar eclipse`,
        `Moon ${posText(ml)}${le.obscuration ? ` · ${Math.round(le.obscuration * 100)}% in umbra` : ''}`,
      );
      le = Astronomy.NextLunarEclipse(le.peak);
    }
    let se = Astronomy.SearchGlobalSolarEclipse(new Date(t0));
    while (se.peak.date.getTime() <= t1) {
      const t = se.peak.date,
        sl = Core.lonOf('Sun', t);
      const where =
        se.latitude != null && se.kind !== 'partial'
          ? ` · best seen near ${Math.abs(se.latitude).toFixed(0)}°${se.latitude >= 0 ? 'N' : 'S'}, ${Math.abs(se.longitude ?? 0).toFixed(0)}°${(se.longitude ?? 0) >= 0 ? 'E' : 'W'}`
          : '';
      add(
        t.getTime(),
        'eclipse',
        'Sun',
        `${se.kind[0].toUpperCase() + se.kind.slice(1)} solar eclipse`,
        `Sun ${posText(sl)}${where}`,
      );
      se = Astronomy.NextGlobalSolarEclipse(se.peak);
    }
  } catch (e) {
    /* eclipse search unavailable */
  }

  // equinoxes and solstices
  const y0 = new Date(t0).getUTCFullYear();
  [y0, y0 + 1].forEach((y) => {
    try {
      const s = Astronomy.Seasons(y);
      (
        [
          [s.mar_equinox, 'Aries ingress · March equinox'],
          [s.jun_solstice, 'Cancer ingress · June solstice'],
          [s.sep_equinox, 'Libra ingress · September equinox'],
          [s.dec_solstice, 'Capricorn ingress · December solstice'],
        ] as [Astronomy.AstroTime, string][]
      ).forEach(([at, title]) =>
        add(at.date.getTime(), 'season', 'Sun', `Sun enters ${title.split(' ')[0]}`, title.split(' · ')[1], {
          sign: SIGNS.indexOf(title.split(' ')[0]),
        }),
      );
    } catch (e) {
      /* seasons unavailable */
    }
  });

  return out.sort((a, b) => a.t.getTime() - b.t.getTime());
}

// ---------- planetary hours ----------
// Chaldean order, slowest to fastest. Each hour passes to the next planet in this order.
const CHALDEAN = ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon'];
const DAY_RULER = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn']; // Sunday = 0
const HOUR_MEANING: Record<string, string> = {
  Sun: 'Vitality, leadership, recognition, dealings with people in authority.',
  Moon: 'Home and family, the public, travel, dreams and anything that changes.',
  Mars: 'Courage, competition, physical effort, cutting through obstacles.',
  Mercury: 'Writing, study, messages, trade, contracts and short journeys.',
  Jupiter: 'Growth, generosity, law, teaching, asking for favours.',
  Venus: 'Love, friendship, art, beauty, pleasure and reconciliation.',
  Saturn: 'Structure, discipline, endings, long-term and solitary work.',
};
// sunrise → sunset → next sunrise of one planetary day, and its weekday (0 = Sunday)
function planetaryHours(
  sunrise: Date,
  sunset: Date,
  nextSunrise: Date,
  weekday: number,
): { dayRuler: string; hours: PlanetaryHour[] } {
  const out: PlanetaryHour[] = [];
  const first = CHALDEAN.indexOf(DAY_RULER[weekday]);
  const dayLen = (sunset.getTime() - sunrise.getTime()) / 12,
    nightLen = (nextSunrise.getTime() - sunset.getTime()) / 12;
  for (let i = 0; i < 24; i++) {
    const isDay = i < 12;
    const start = isDay ? sunrise.getTime() + i * dayLen : sunset.getTime() + (i - 12) * nightLen;
    const len = isDay ? dayLen : nightLen;
    out.push({
      n: i + 1,
      isDay,
      ruler: CHALDEAN[(first + i) % 7],
      start: new Date(start),
      end: new Date(start + len),
      minutes: len / 60000,
    });
  }
  return { dayRuler: DAY_RULER[weekday], hours: out };
}

export {
  planetaryHours,
  HOUR_MEANING,
  CHALDEAN,
  yearAhead,
  dignity,
  signInfo,
  SIGNS,
  ELEMENT,
  MODE,
  RULER,
  ASPECTS,
  aspects,
  patterns,
  balance,
  moonPhase,
  dayEvents,
  sep,
};
