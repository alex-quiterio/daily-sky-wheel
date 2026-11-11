// Specs for astro/western.ts, one rule at a time.
// The rules are checked on made-up points; the event searches are checked against the sky itself.
import { describe, test } from 'node:test';
import assert from 'node:assert';
import { Core as C, Western as E } from '#astro';

const pt = (name: string, lon: number, speed = 0): C.Point => ({
  name,
  lon,
  lat: 0,
  decl: 0,
  speed,
  retro: speed < 0,
});
const SIGN = (name: string) => E.SIGNS.indexOf(name);
const near = (a: number, b: number, tol: number, msg?: string) =>
  assert.ok(Math.abs(a - b) <= tol, `${msg ?? ''} ${a} vs ${b} (±${tol})`);

describe('sep', () => {
  test('is the shorter arc between two longitudes', () => {
    assert.strictEqual(E.sep(10, 40), 30);
    assert.strictEqual(E.sep(40, 10), 30);
    assert.strictEqual(E.sep(0, 180), 180);
    assert.strictEqual(E.sep(90, 90), 0);
  });

  test('crosses 0° Aries', () => {
    assert.strictEqual(E.sep(350, 10), 20);
    assert.strictEqual(E.sep(10, 350), 20);
  });

  test('takes longitudes outside 0-360', () => {
    assert.strictEqual(E.sep(-10, 10), 20);
    assert.strictEqual(E.sep(725, 0), 5);
  });
});

describe('aspects', () => {
  test('names each aspect at its exact angle', () => {
    const want: [number, E.AspectKey][] = [
      [0, 'conj'],
      [60, 'sex'],
      [90, 'sq'],
      [120, 'tri'],
      [150, 'qx'],
      [180, 'opp'],
    ];
    for (const [angle, key] of want) {
      const [a] = E.aspects([pt('Sun', 10), pt('Mars', 10 + angle)]);
      assert.strictEqual(a.type.key, key, `${angle}°`);
      assert.strictEqual(a.orb, 0);
      assert.deepStrictEqual([a.a, a.b], ['Sun', 'Mars']);
    }
  });

  test('finds the same aspect on either side', () => {
    const [a] = E.aspects([pt('Sun', 10), pt('Mars', 280)]); // 90° behind
    assert.strictEqual(a.type.key, 'sq');
  });

  test('finds a conjunction across 0° Aries', () => {
    const [a] = E.aspects([pt('Sun', 358), pt('Mars', 2)]);
    assert.strictEqual(a.type.key, 'conj');
    near(a.orb, 4, 1e-9);
  });

  test('allows each aspect its own orb and no more', () => {
    for (const { angle, orb, name } of E.ASPECTS) {
      const at = (off: number) => E.aspects([pt('Sun', 0), pt('Mars', angle + off)]);
      // inside the orb on the side away from 180°, so the offset is not folded back
      const side = angle === 180 ? -1 : 1;
      assert.strictEqual(at(side * orb).length, 1, `${name} at the edge of its orb`);
      assert.strictEqual(at(side * (orb + 0.5)).length, 0, `${name} half a degree past its orb`);
    }
  });

  test('says nothing in the gaps between aspects', () => {
    assert.deepStrictEqual(E.aspects([pt('Sun', 0), pt('Mars', 30)]), []);
    assert.deepStrictEqual(E.aspects([pt('Sun', 0), pt('Mars', 135)]), []);
  });

  test('is applying when the orb is closing', () => {
    // the Moon at 13° a day runs up to the Sun
    const [closing] = E.aspects([pt('Sun', 5, 1), pt('Moon', 0, 13)]);
    assert.strictEqual(closing.applying, true);
    // and away from it once past
    const [opening] = E.aspects([pt('Sun', 5, 1), pt('Moon', 10, 13)]);
    assert.strictEqual(opening.applying, false);
  });

  test('a retrograde planet applies by moving backwards', () => {
    const [back] = E.aspects([pt('Sun', 5, 1), pt('Mercury', 10, -1)]);
    assert.strictEqual(back.applying, true);
    const [away] = E.aspects([pt('Sun', 5, 1), pt('Mercury', 2, -1)]);
    assert.strictEqual(away.applying, false);
  });

  test('applying works for a square as well as a conjunction', () => {
    const [closing] = E.aspects([pt('Saturn', 0, 0.03), pt('Mars', 87, 0.6)]);
    assert.deepStrictEqual([closing.type.key, closing.applying], ['sq', true]);
    const [opening] = E.aspects([pt('Saturn', 0, 0.03), pt('Mars', 93, 0.6)]);
    assert.deepStrictEqual([opening.type.key, opening.applying], ['sq', false]);
  });

  test('lists the tightest aspect first', () => {
    const list = E.aspects([pt('Sun', 0), pt('Moon', 6), pt('Mars', 91), pt('Jupiter', 120.5)]);
    assert.ok(list.length >= 3);
    assert.ok(list.every((a, i) => i === 0 || a.orb >= list[i - 1].orb));
    assert.deepStrictEqual([list[0].a, list[0].b, list[0].type.key], ['Sun', 'Jupiter', 'tri']);
  });

  test('gives one aspect to a pair', () => {
    const list = E.aspects([pt('Sun', 0), pt('Moon', 60), pt('Mars', 120)]);
    assert.strictEqual(list.length, 3);
    assert.strictEqual(new Set(list.map((a) => a.a + a.b)).size, 3);
  });

  test('leaves out the node, Lilith and the asteroids, and keeps Chiron', () => {
    const out = E.aspects([pt('Sun', 0), pt('Node', 0), pt('Lilith', 90), pt('Ceres', 120), pt('Vesta', 180)]);
    assert.deepStrictEqual(out, []);
    assert.strictEqual(E.aspects([pt('Sun', 0), pt('Chiron', 0)]).length, 1);
  });

  test('has nothing to say about one point or none', () => {
    assert.deepStrictEqual(E.aspects([]), []);
    assert.deepStrictEqual(E.aspects([pt('Sun', 0)]), []);
  });
});

describe('patterns', () => {
  const find = (pts: C.Point[]) => E.patterns(pts, E.aspects(pts));

  test('Yod: two quincunxes to the apex of a sextile', () => {
    const pats = find([pt('Sun', 0), pt('Moon', 60), pt('Mars', 210)]);
    assert.deepStrictEqual(pats, [{ type: 'Yod', members: ['Sun', 'Moon', 'Mars'], focus: 'Mars' }]);
  });

  test('T-square: two squares to the apex of an opposition', () => {
    const pats = find([pt('Sun', 0), pt('Mars', 90), pt('Moon', 180)]);
    assert.strictEqual(pats.length, 1);
    assert.deepStrictEqual([pats[0].type, pats[0].focus], ['T-square', 'Mars']);
    assert.deepStrictEqual([...pats[0].members].sort(), ['Mars', 'Moon', 'Sun']);
  });

  test('Grand Trine: three trines, found once, with no apex', () => {
    const pats = find([pt('Sun', 0), pt('Moon', 120), pt('Mars', 240)]);
    assert.deepStrictEqual(pats, [{ type: 'Grand Trine', members: ['Sun', 'Moon', 'Mars'], focus: undefined }]);
  });

  test('a grand cross reads as four T-squares, one to each corner', () => {
    const pats = find([pt('Sun', 0), pt('Moon', 90), pt('Mars', 180), pt('Jupiter', 270)]);
    assert.strictEqual(pats.length, 4);
    assert.ok(pats.every((p) => p.type === 'T-square'));
    assert.deepStrictEqual(pats.map((p) => p.focus).sort(), ['Jupiter', 'Mars', 'Moon', 'Sun']);
  });

  test('Stellium: four planets in one sign, named by the sign', () => {
    const pats = find([pt('Sun', 121), pt('Moon', 125), pt('Mercury', 130), pt('Venus', 149)]);
    assert.deepStrictEqual(pats, [{ type: 'Stellium', members: ['Sun', 'Moon', 'Mercury', 'Venus'], focus: 'Leo' }]);
  });

  test('three planets are not a stellium, and Chiron does not make a fourth', () => {
    assert.deepStrictEqual(find([pt('Sun', 121), pt('Moon', 125), pt('Mercury', 130)]), []);
    assert.deepStrictEqual(find([pt('Sun', 121), pt('Moon', 125), pt('Mercury', 130), pt('Chiron', 135)]), []);
  });

  test('a stellium stops at the sign boundary', () => {
    // four planets within 8°, but split between Leo and Virgo
    assert.deepStrictEqual(find([pt('Sun', 146), pt('Moon', 148), pt('Mercury', 151), pt('Venus', 153)]), []);
  });

  test('two squares without the opposition are not a T-square', () => {
    // Sun and Moon are 166° apart: both square Mars, too wide to oppose each other
    assert.deepStrictEqual(find([pt('Sun', 7), pt('Mars', 90), pt('Moon', 173)]), []);
  });

  test('finds nothing in an empty sky', () => {
    assert.deepStrictEqual(E.patterns([], []), []);
  });
});

describe('balance', () => {
  const chartOf = (pts: C.Point[], asc: number) => ({ pts, asc }) as C.Chart;

  test('counts the ten planets and the Ascendant by element and mode', () => {
    const b = E.balance(
      chartOf(
        [
          pt('Sun', 5), // Aries: fire, cardinal
          pt('Moon', 35), // Taurus: earth, fixed
          pt('Mercury', 65), // Gemini: air, mutable
          pt('Venus', 95), // Cancer: water, cardinal
          pt('Mars', 125), // Leo: fire, fixed
        ],
        215, // Scorpio rising: water, fixed
      ),
    );
    assert.deepStrictEqual(b.el, [2, 1, 1, 2]);
    assert.deepStrictEqual(b.md, [2, 3, 1]);
    assert.strictEqual(b.strongMd, 'Fixed');
  });

  test('a tie goes to the first in order: fire, earth, air, water', () => {
    const b = E.balance(chartOf([pt('Moon', 35), pt('Sun', 5)], 65));
    assert.deepStrictEqual(b.el, [1, 1, 1, 0]);
    assert.strictEqual(b.strongEl, 'Fire');
    assert.strictEqual(b.strongMd, 'Cardinal');
  });

  test('leaves out Chiron, the node, Lilith and the asteroids', () => {
    const b = E.balance(chartOf([pt('Chiron', 5), pt('Node', 5), pt('Lilith', 5), pt('Ceres', 5)], 100));
    assert.deepStrictEqual(b.el, [0, 0, 0, 1]);
    assert.deepStrictEqual(b.md, [1, 0, 0]);
    assert.deepStrictEqual([b.strongEl, b.strongMd], ['Water', 'Cardinal']);
  });

  test('a full chart adds up to eleven', () => {
    const chart = C.chart(new Date(Date.UTC(2026, 10, 9, 7, 2)), 40 + 43 / 60, -74, 'placidus');
    const b = E.balance(chart);
    const sum = (xs: number[]) => xs.reduce((a, x) => a + x, 0);
    assert.strictEqual(sum(b.el), 11);
    assert.strictEqual(sum(b.md), 11);
    assert.strictEqual(b.strongEl, E.ELEMENT[b.el.indexOf(Math.max(...b.el))]);
  });
});

describe('dignity', () => {
  const at = (planet: string, sign: string) => E.dignity(planet, SIGN(sign));

  test('the Sun through its four dignities', () => {
    assert.strictEqual(at('Sun', 'Leo'), 'Domicile');
    assert.strictEqual(at('Sun', 'Aries'), 'Exaltation');
    assert.strictEqual(at('Sun', 'Aquarius'), 'Detriment');
    assert.strictEqual(at('Sun', 'Libra'), 'Fall');
    assert.strictEqual(at('Sun', 'Gemini'), 'Peregrine');
  });

  test('the traditional table', () => {
    const table: [string, string[], string, string[], string][] = [
      // planet, domiciles, exaltation, detriments, fall
      ['Moon', ['Cancer'], 'Taurus', ['Capricorn'], 'Scorpio'],
      ['Venus', ['Taurus', 'Libra'], 'Pisces', ['Scorpio', 'Aries'], 'Virgo'],
      ['Mars', ['Aries', 'Scorpio'], 'Capricorn', ['Libra', 'Taurus'], 'Cancer'],
      ['Jupiter', ['Sagittarius', 'Pisces'], 'Cancer', ['Gemini', 'Virgo'], 'Capricorn'],
      ['Saturn', ['Capricorn', 'Aquarius'], 'Libra', ['Cancer', 'Leo'], 'Aries'],
    ];
    for (const [planet, dom, exalt, det, fall] of table) {
      for (const s of dom) assert.strictEqual(at(planet, s), 'Domicile', `${planet} in ${s}`);
      for (const s of det) assert.strictEqual(at(planet, s), 'Detriment', `${planet} in ${s}`);
      assert.strictEqual(at(planet, exalt), 'Exaltation', `${planet} in ${exalt}`);
      assert.strictEqual(at(planet, fall), 'Fall', `${planet} in ${fall}`);
    }
  });

  test('Mercury in Virgo is at home before it is exalted, and in Pisces in detriment before fall', () => {
    assert.strictEqual(at('Mercury', 'Virgo'), 'Domicile');
    assert.strictEqual(at('Mercury', 'Pisces'), 'Detriment');
    assert.strictEqual(at('Mercury', 'Gemini'), 'Domicile');
    assert.strictEqual(at('Mercury', 'Sagittarius'), 'Detriment');
  });

  test('the modern planets have a home and its opposite, and no exaltation', () => {
    assert.strictEqual(at('Uranus', 'Aquarius'), 'Domicile');
    assert.strictEqual(at('Uranus', 'Leo'), 'Detriment');
    assert.strictEqual(at('Neptune', 'Pisces'), 'Domicile');
    assert.strictEqual(at('Neptune', 'Virgo'), 'Detriment');
    assert.strictEqual(at('Pluto', 'Scorpio'), 'Domicile');
    assert.strictEqual(at('Pluto', 'Taurus'), 'Detriment');
    for (const p of ['Uranus', 'Neptune', 'Pluto'])
      for (let s = 0; s < 12; s++) assert.ok(!['Exaltation', 'Fall'].includes(E.dignity(p, s)!), `${p} in ${s}`);
  });

  test('every planet is somewhere in every sign', () => {
    const planets = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
    const known = ['Domicile', 'Exaltation', 'Detriment', 'Fall', 'Peregrine'];
    for (const p of planets) for (let s = 0; s < 12; s++) assert.ok(known.includes(E.dignity(p, s)!), `${p} in ${s}`);
  });

  test('points that are not planets have no dignity', () => {
    for (const p of ['Chiron', 'Node', 'Lilith', 'Ceres', 'Nobody']) assert.strictEqual(E.dignity(p, 0), null, p);
  });
});

describe('signInfo', () => {
  test('Aries', () => {
    assert.deepStrictEqual(E.signInfo(0), {
      name: 'Aries',
      element: 'Fire',
      mode: 'Cardinal',
      polarity: 'Masculine (yang)',
      trad: 'Mars',
      modern: 'Mars',
      exalted: 'Sun',
      detriment: ['Venus'],
      fall: ['Saturn'],
    });
  });

  test('Scorpio has two rulers and exalts nothing', () => {
    assert.deepStrictEqual(E.signInfo(SIGN('Scorpio')), {
      name: 'Scorpio',
      element: 'Water',
      mode: 'Fixed',
      polarity: 'Feminine (yin)',
      trad: 'Mars',
      modern: 'Pluto',
      exalted: null,
      detriment: ['Venus'],
      fall: ['Moon'],
    });
  });

  test('Pisces: Mercury in both detriment and fall', () => {
    const p = E.signInfo(SIGN('Pisces'));
    assert.deepStrictEqual([p.trad, p.modern, p.exalted], ['Jupiter', 'Neptune', 'Venus']);
    assert.deepStrictEqual(p.detriment, ['Mercury']);
    assert.deepStrictEqual(p.fall, ['Mercury']);
  });

  test('three signs to an element, four to a mode, polarity alternating', () => {
    const all = E.SIGNS.map((_, s) => E.signInfo(s));
    for (const el of E.ELEMENT) assert.strictEqual(all.filter((x) => x.element === el).length, 3, el);
    for (const md of E.MODE) assert.strictEqual(all.filter((x) => x.mode === md).length, 4, md);
    all.forEach((x, s) => assert.strictEqual(x.polarity.startsWith('Masculine'), s % 2 === 0, x.name));
    // fire and air are yang, earth and water yin
    for (const x of all) assert.strictEqual(x.polarity.startsWith('Masculine'), ['Fire', 'Air'].includes(x.element));
  });

  test('agrees with dignity()', () => {
    for (let s = 0; s < 12; s++) {
      const info = E.signInfo(s);
      assert.strictEqual(E.dignity(info.modern, s), 'Domicile', `${info.modern} rules ${info.name}`);
      assert.strictEqual(E.dignity(info.trad, s), 'Domicile', `${info.trad} rules ${info.name}`);
      if (info.exalted && E.dignity(info.exalted, s) !== 'Domicile')
        assert.strictEqual(E.dignity(info.exalted, s), 'Exaltation');
      for (const p of info.detriment) assert.strictEqual(E.dignity(p, s), 'Detriment', `${p} in ${info.name}`);
    }
  });
});

describe('moonPhase', () => {
  test('the eight phases, 45° apart', () => {
    const want = [
      'New Moon',
      'Waxing Crescent',
      'First Quarter',
      'Waxing Gibbous',
      'Full Moon',
      'Waning Gibbous',
      'Last Quarter',
      'Waning Crescent',
    ];
    want.forEach((name, i) => assert.strictEqual(E.moonPhase(100, 100 + i * 45).name, name));
  });

  test('each phase reaches 22.5° to either side of its centre', () => {
    assert.strictEqual(E.moonPhase(0, 22.4).name, 'New Moon');
    assert.strictEqual(E.moonPhase(0, 22.5).name, 'Waxing Crescent');
    assert.strictEqual(E.moonPhase(0, 337.4).name, 'Waning Crescent');
    assert.strictEqual(E.moonPhase(0, 337.5).name, 'New Moon');
    assert.strictEqual(E.moonPhase(0, 157.4).name, 'Waxing Gibbous');
    assert.strictEqual(E.moonPhase(0, 202.4).name, 'Full Moon');
  });

  test('the lit fraction runs from nothing to all and back', () => {
    near(E.moonPhase(0, 0).illum, 0, 1e-12);
    near(E.moonPhase(0, 90).illum, 0.5, 1e-12);
    near(E.moonPhase(0, 180).illum, 1, 1e-12);
    near(E.moonPhase(0, 270).illum, 0.5, 1e-12);
    near(E.moonPhase(0, 60).illum, 0.25, 1e-12);
    near(E.moonPhase(0, 300).illum, E.moonPhase(0, 60).illum, 1e-12, 'waxing and waning match');
  });

  test('elongation is measured from the Sun, across 0° Aries', () => {
    assert.strictEqual(E.moonPhase(350, 10).elong, 20);
    assert.strictEqual(E.moonPhase(10, 350).elong, 340);
    assert.strictEqual(E.moonPhase(10, 350).name, 'New Moon');
  });
});

describe('planetaryHours', () => {
  // a long summer day: 15 hours of light, 9 of dark
  const sr = new Date('2026-06-21T04:00:00Z'),
    ss = new Date('2026-06-21T19:00:00Z'),
    nx = new Date('2026-06-22T04:00:00Z');

  test('the first hour belongs to the ruler of the day', () => {
    const rulers = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
    rulers.forEach((r, weekday) => {
      const ph = E.planetaryHours(sr, ss, nx, weekday);
      assert.strictEqual(ph.dayRuler, r);
      assert.strictEqual(ph.hours[0].ruler, r);
    });
  });

  test("the hour after the last is the next day's first", () => {
    for (let w = 0; w < 7; w++) {
      const last = E.planetaryHours(sr, ss, nx, w).hours[23].ruler;
      const next = E.CHALDEAN[(E.CHALDEAN.indexOf(last) + 1) % 7];
      assert.strictEqual(next, E.planetaryHours(sr, ss, nx, (w + 1) % 7).dayRuler, `weekday ${w}`);
    }
  });

  test('twelve hours of day and twelve of night, each its own length', () => {
    const { hours } = E.planetaryHours(sr, ss, nx, 0);
    assert.deepStrictEqual(
      hours.map((h) => h.n),
      Array.from({ length: 24 }, (_, i) => i + 1),
    );
    assert.ok(hours.slice(0, 12).every((h) => h.isDay && h.minutes === 75));
    assert.ok(hours.slice(12).every((h) => !h.isDay && h.minutes === 45));
  });

  test('the hours run from sunrise to sunrise without a gap', () => {
    const { hours } = E.planetaryHours(sr, ss, nx, 3);
    assert.strictEqual(hours[0].start.getTime(), sr.getTime());
    assert.strictEqual(hours[12].start.getTime(), ss.getTime());
    assert.strictEqual(hours[23].end.getTime(), nx.getTime());
    hours.slice(1).forEach((h, i) => assert.strictEqual(h.start.getTime(), hours[i].end.getTime(), `hour ${h.n}`));
  });

  test('every ruler has a meaning', () => {
    assert.deepStrictEqual(Object.keys(E.HOUR_MEANING).sort(), [...E.CHALDEAN].sort());
  });
});

describe('dayEvents', () => {
  const utc = (y: number, m: number, d: number, h = 0) => new Date(Date.UTC(y, m - 1, d, h));
  const elong = (t: Date) => C.norm(C.lonOf('Moon', t) - C.lonOf('Sun', t));
  // how far a longitude is from the nearest sign boundary
  const offCusp = (lon: number) => Math.abs(((lon + 15) % 30) - 15);

  test('the December solstice: the Sun enters Capricorn', () => {
    const ev = E.dayEvents(utc(2026, 12, 21), utc(2026, 12, 22));
    const sun = ev.find((e) => e.kind === 'ingress' && e.body === 'Sun')!;
    assert.strictEqual(sun.text, 'Sun enters Capricorn');
    near(sun.t.getTime(), Date.UTC(2026, 11, 21, 20, 50), 2 * 60000, 'solstice at 20:50 UTC');
    const season = E.yearAhead(utc(2026, 12, 1), 31).find((e) => e.cat === 'season')!;
    near(sun.t.getTime(), season.t.getTime(), 60000, 'agrees with the year ahead');
  });

  // three ordinary days, checked against the positions themselves
  const start = utc(2026, 11, 8),
    end = utc(2026, 11, 11);
  const ev = E.dayEvents(start, end);

  test('events come in order and inside the window', () => {
    assert.ok(ev.length > 10);
    assert.ok(ev.every((e, i) => i === 0 || e.t >= ev[i - 1].t));
    assert.ok(ev.every((e) => e.t >= start && e.t <= end));
  });

  test('an ingress is timed to the moment the body crosses the cusp', () => {
    const ins = ev.filter((e) => e.kind === 'ingress');
    assert.ok(
      ins.some((e) => e.body === 'Moon'),
      'the Moon changes sign within three days',
    );
    for (const e of ins) {
      assert.ok(offCusp(C.lonOf(e.body, e.t)) < 0.01, e.text);
      const after = C.lonOf(e.body, new Date(e.t.getTime() + 5 * 60000));
      assert.ok(e.text.includes(`enters ${E.SIGNS[Math.floor(after / 30)]}`), e.text);
    }
  });

  test('an aspect is timed to the moment it is exact', () => {
    const asps = ev.filter((e) => e.kind === 'aspect');
    assert.ok(asps.length > 5);
    for (const e of asps) {
      const s = E.sep(C.lonOf(e.body, e.t), C.lonOf(e.other!, e.t));
      near(s, e.type!.angle, 0.01, e.text);
      assert.strictEqual(e.text, `${e.body} ${e.type!.name.toLowerCase()} ${e.other}`);
    }
  });

  test('the Sun and Moon meet as lunations, never as aspects', () => {
    assert.ok(!ev.some((e) => e.kind === 'aspect' && e.body === 'Sun' && e.other === 'Moon'));
    const lun = ev.filter((e) => e.kind === 'lunation');
    assert.deepStrictEqual(
      lun.map((e) => [e.text, e.title]),
      [['New Moon in Scorpio', 'Scorpio New Moon']],
    );
  });

  test('the four lunations of a month, each at its own elongation', () => {
    const month = [utc(2026, 11, 17), utc(2026, 11, 24), utc(2026, 12, 1), utc(2026, 12, 9)].flatMap((d) =>
      E.dayEvents(d, new Date(d.getTime() + 86400000)).filter((e) => e.kind === 'lunation'),
    );
    assert.deepStrictEqual(
      month.map((e) => e.text.split(' in ')[0]),
      ['First Quarter', 'Full Moon', 'Last Quarter', 'New Moon'],
    );
    [90, 180, 270, 0].forEach((ang, i) => {
      const off = Math.abs(((elong(month[i].t) - ang + 540) % 360) - 180);
      assert.ok(off < 0.01, `${month[i].text}: ${off.toFixed(4)}° from ${ang}°`);
    });
    // a Full Moon stands in the sign opposite the Sun
    const full = month[1];
    assert.strictEqual(full.title, 'Gemini Full Moon');
    assert.strictEqual(Math.floor(C.lonOf('Sun', full.t) / 30), SIGN('Sagittarius'));
  });

  test('a station is timed to the moment the planet stands still', () => {
    const d = E.dayEvents(utc(2026, 11, 13), utc(2026, 11, 14));
    const st = d.find((e) => e.kind === 'station')!;
    assert.strictEqual(st.text, 'Mercury stations direct');
    assert.ok(Math.abs(C.speed('Mercury', st.t)) < 0.005);
    assert.ok(C.speed('Mercury', new Date(st.t.getTime() + 86400000)) > 0);
  });

  test('a planet backing into a sign is marked retrograde', () => {
    // Mercury turns retrograde at 5° Pisces on 9 Feb 2027 and backs into Aquarius
    const back = E.dayEvents(utc(2027, 2, 9), utc(2027, 3, 3)).filter(
      (e) => e.kind === 'ingress' && e.body === 'Mercury',
    );
    assert.deepStrictEqual(
      back.map((e) => e.text),
      ['Mercury enters Aquarius (retrograde)'],
    );
    assert.ok(offCusp(C.lonOf('Mercury', back[0].t)) < 0.01);
    assert.ok(C.speed('Mercury', back[0].t) < 0);
  });

  test('a window shorter than an hour holds nothing', () => {
    assert.deepStrictEqual(E.dayEvents(utc(2026, 11, 9, 7), new Date(Date.UTC(2026, 10, 9, 7, 30))), []);
  });
});

describe('yearAhead', () => {
  const start = new Date(Date.UTC(2026, 10, 9));
  const ev = E.yearAhead(start);
  const of = (cat: E.YearEvent['cat']) => ev.filter((e) => e.cat === cat);

  test('everything falls inside the year, in order', () => {
    const end = start.getTime() + 366 * 86400000;
    assert.ok(ev.every((e) => e.t.getTime() >= start.getTime() && e.t.getTime() <= end));
    assert.ok(ev.every((e, i) => i === 0 || e.t >= ev[i - 1].t));
  });

  test('a shorter span holds only its own events', () => {
    const month = E.yearAhead(start, 30);
    assert.deepStrictEqual(
      month.map((e) => e.title),
      ev.filter((e) => e.t.getTime() <= start.getTime() + 30 * 86400000).map((e) => e.title),
    );
    assert.ok(month.length > 0 && month.length < ev.length);
  });

  test('the four seasons, each at 0° of a cardinal sign', () => {
    assert.deepStrictEqual(
      of('season').map((e) => [e.title, e.detail, e.sign]),
      [
        ['Sun enters Capricorn', 'December solstice', 9],
        ['Sun enters Aries', 'March equinox', 0],
        ['Sun enters Cancer', 'June solstice', 3],
        ['Sun enters Libra', 'September equinox', 6],
      ],
    );
    for (const e of of('season')) {
      const lon = C.lonOf('Sun', e.t);
      assert.ok(Math.abs(((lon - e.sign! * 30 + 540) % 360) - 180) < 0.01, e.title);
    }
  });

  test('a planet turns retrograde and direct by turns, standing still each time', () => {
    const st = of('retro');
    for (const body of new Set(st.map((e) => e.body))) {
      const mine = st.filter((e) => e.body === body);
      mine.forEach((e, i) => {
        if (i > 0) assert.notStrictEqual(e.retro, mine[i - 1].retro, `${body} at ${e.t.toISOString()}`);
        assert.strictEqual(e.title, `${body} stations ${e.retro ? 'retrograde' : 'direct'}`);
        assert.ok(Math.abs(C.speed(body, e.t)) < 0.005, e.title);
      });
    }
    // Mercury turns three times a year each way; the Sun and Moon never do
    assert.strictEqual(st.filter((e) => e.body === 'Mercury' && e.retro).length, 3);
    assert.ok(!st.some((e) => e.body === 'Sun' || e.body === 'Moon'));
  });

  test('ingresses name the sign entered and the one left', () => {
    const ins = of('ingress');
    assert.deepStrictEqual(
      ins.map((e) => [e.title, e.detail, e.sign]),
      [
        ['Chiron enters Taurus', 'leaves Aries', 1],
        ['Jupiter enters Virgo', 'leaves Leo', 5],
      ],
    );
    for (const e of ins) assert.ok(Math.abs(((C.lonOf(e.body, e.t) - e.sign! * 30 + 540) % 360) - 180) < 0.01, e.title);
  });

  test('the North Node moves backwards through the signs, the South Node opposite', () => {
    // the node left Pisces for Aquarius in the summer of 2026
    const node = E.yearAhead(new Date(Date.UTC(2026, 5, 1)), 120).filter((e) => e.body === 'Node');
    assert.deepStrictEqual(
      node.map((e) => [e.title, e.sign]),
      [['North Node enters Aquarius', SIGN('Aquarius')]],
    );
  });

  test('outer-planet aspects are exact, and both places are given', () => {
    const asps = of('aspect');
    assert.ok(asps.length >= 5);
    const angle = Object.fromEntries(E.ASPECTS.map((a) => [a.key, a.angle]));
    for (const e of asps) {
      near(E.sep(C.lonOf(e.body, e.t), C.lonOf(e.other!, e.t)), angle[e.aspKey!], 0.01, e.title);
      assert.match(e.detail, /^\d+°\d\d′ \w+ · \d+°\d\d′ \w+$/);
      assert.notStrictEqual(e.aspKey, 'qx', 'no quincunxes in the year ahead');
    }
    // retrograde motion brings a slow aspect back: Jupiter trines Chiron three times
    assert.strictEqual(asps.filter((e) => e.title === 'Jupiter trine Chiron').length, 3);
  });

  test('a Venus star point is a conjunction with the Sun', () => {
    const [v] = of('venus');
    assert.strictEqual(v.title, 'Venus star point (superior conjunction)');
    near(E.sep(C.lonOf('Venus', v.t), C.lonOf('Sun', v.t)), 0, 0.01);
    assert.ok(C.speed('Venus', v.t) > 0, 'direct at a superior conjunction');
    assert.match(v.detail, /^19°\d\d′ Leo · Venus direct/);
  });

  test('eclipses fall at a New or a Full Moon', () => {
    const ecl = of('eclipse');
    assert.deepStrictEqual(
      ecl.map((e) => `${e.t.toISOString().slice(0, 10)} ${e.title}`),
      [
        '2027-02-06 Annular solar eclipse',
        '2027-02-20 Penumbral lunar eclipse',
        '2027-07-18 Penumbral lunar eclipse',
        '2027-08-02 Total solar eclipse',
        '2027-08-17 Penumbral lunar eclipse',
      ],
    );
    for (const e of ecl) {
      const s = E.sep(C.lonOf('Moon', e.t), C.lonOf('Sun', e.t));
      near(s, e.body === 'Sun' ? 0 : 180, 1, e.title);
    }
    assert.match(ecl[3].detail, /best seen near \d+°N, \d+°E/);
    assert.ok(!/best seen/.test(ecl[1].detail));
  });
});
