// Checks the calculations against a reference chart:
// Scorpio New Moon, 9 Nov 2026, 2:02 AM EST, New York (40N43, 74W00).
import test from 'node:test';
import assert from 'node:assert';
import {
  Core as C,
  Western as E,
  WesternReading,
  Chinese as Z,
  Maya as M,
  Hebrew as H,
  Vedic as V,
  VedicReading,
  Glossary,
  ChineseReading,
  MayaReading,
  KabbalahReading,
  IslamicReading,
  Islamic as I,
} from '#astro';

const SIGNS = ['Ari', 'Tau', 'Gem', 'Can', 'Leo', 'Vir', 'Lib', 'Sco', 'Sag', 'Cap', 'Aqu', 'Pis'];
const pos = (deg: number, min: number, sign: string) => SIGNS.indexOf(sign) * 30 + deg + min / 60;
const diff = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);

const when = new Date(Date.UTC(2026, 10, 9, 7, 2, 0));
const chart = C.chart(when, 40 + 43 / 60, -74, 'placidus');
const by = Object.fromEntries(chart.pts.map((p) => [p.name, p]));

const REF: Record<string, [deg: number, min: number, sign: string, retro: boolean]> = {
  Sun: [16, 53, 'Sco', false],
  Moon: [16, 53, 'Sco', false],
  Mercury: [6, 52, 'Sco', true],
  Venus: [23, 19, 'Lib', true],
  Mars: [22, 41, 'Leo', false],
  Jupiter: [25, 15, 'Leo', false],
  Saturn: [8, 48, 'Ari', true],
  Uranus: [4, 22, 'Gem', true],
  Neptune: [1, 55, 'Ari', true],
  Pluto: [3, 12, 'Aqu', false],
  Chiron: [27, 42, 'Ari', true],
  Node: [26, 12, 'Aqu', true],
  Lilith: [6, 12, 'Cap', false],
  Ceres: [23, 23, 'Can', false],
  Pallas: [5, 10, 'Ari', true],
  Juno: [4, 9, 'Aqu', false],
  Vesta: [14, 5, 'Ari', true],
};

for (const [name, [d, m, s, retro]] of Object.entries(REF)) {
  test(`${name} position and motion`, () => {
    const tol = name === 'Lilith' || name === 'Node' ? 0.2 : 0.05; // mean Lilith / approximate true node
    assert.ok(
      diff(by[name].lon, pos(d, m, s)) < tol,
      `${name}: ${by[name].lon.toFixed(3)} vs ${pos(d, m, s).toFixed(3)}`,
    );
    if (!['Sun', 'Moon'].includes(name)) assert.strictEqual(by[name].retro, retro);
  });
}

// ---------- a second reference chart: 20 Jul 1975 14:45 UTC, Buenos Aires ----------
// Fifty years from the first, in the southern hemisphere. Planets, node, Lilith and houses from the Swiss
// Ephemeris (Moshier); Chiron and the asteroids from JPL Horizons (apparent, ecliptic of date).
const when1975 = new Date(Date.UTC(1975, 6, 20, 14, 45));
const chart1975 = C.chart(when1975, -34.6037, -58.3816, 'placidus');
const by1975 = Object.fromEntries(chart1975.pts.map((p) => [p.name, p]));
const REF1975: Record<string, [lon: number, retro: boolean, tolerance: number]> = {
  Sun: [117.2719, false, 0.02],
  Moon: [266.7858, false, 0.02],
  Mercury: [104.1755, false, 0.02],
  Venus: [157.0613, false, 0.02],
  Mars: [43.5562, false, 0.02],
  Jupiter: [23.6792, false, 0.02],
  Saturn: [113.1511, false, 0.02],
  Uranus: [208.4371, false, 0.02],
  Neptune: [249.2855, true, 0.02],
  Pluto: [186.7874, false, 0.02],
  Node: [239.5057, true, 0.1], // true node, from the main periodic terms
  Lilith: [348.5009, false, 0.15], // mean Lilith: Meeus, against the Swiss Ephemeris' corrected mean apogee
  Chiron: [28.0999622, false, 0.02],
  Ceres: [58.5030699, false, 0.02],
  Pallas: [6.3949508, false, 0.02],
  Juno: [103.8499067, false, 0.02],
  Vesta: [1.9060653, false, 0.02],
};
for (const [name, [lon, retro, tol]] of Object.entries(REF1975)) {
  test(`1975 chart: ${name}`, () => {
    assert.ok(diff(by1975[name].lon, lon) < tol, `${name}: ${by1975[name].lon.toFixed(4)} vs ${lon}`);
    if (!['Sun', 'Moon'].includes(name)) assert.strictEqual(by1975[name].retro, retro, `${name} retrograde`);
  });
}

test('1975 chart: angles and Placidus cusps in the southern hemisphere', () => {
  assert.ok(diff(chart1975.asc, 196.3868) < 0.01, `Asc ${chart1975.asc}`);
  assert.ok(diff(chart1975.mc, 99.7698) < 0.01, `MC ${chart1975.mc}`);
  assert.ok(diff(chart1975.vertex, 7.1124) < 0.01, `Vertex ${chart1975.vertex}`);
  const want = [196.3868, 231.7991, 257.3565, 279.7698, 303.6462, 334.075];
  want.forEach((w, i) => assert.ok(diff(chart1975.cusps[i], w) < 0.01, `cusp ${i + 1}: ${chart1975.cusps[i]}`));
  // the opposite cusps
  want.forEach((w, i) => assert.ok(diff(chart1975.cusps[i + 6], w + 180) < 0.01, `cusp ${i + 7}`));
});

test('true Lilith: the osculating apogee, against the Swiss Ephemeris from 1900 to 2099', () => {
  const ref: [y: number, m: number, d: number, lon: number][] = [
    [1900, 1, 1, 135.9653],
    [1939, 11, 3, 356.9763],
    [1979, 9, 4, 163.0133],
    [2019, 7, 6, 313.9779],
    [2059, 5, 7, 181.3661],
    [2099, 3, 8, 339.6195],
  ];
  for (const [y, m, d, lon] of ref) {
    const t = new Date(Date.UTC(y, m - 1, d, 8, 52, 48));
    assert.ok(diff(C.lonOf('TrueLilith', t), lon) < 0.2, `${y}-${m}-${d}: ${C.lonOf('TrueLilith', t)} vs ${lon}`);
  }
  // the chart shows it under the name Lilith when asked for, and says which
  const c = C.chart(when1975, -34.6037, -58.3816, 'placidus', 'true');
  const lilith = c.pts.find((p) => p.name === 'Lilith')!;
  assert.strictEqual(c.lilith, 'true');
  assert.ok(diff(lilith.lon, 340.4542) < 0.2, `true Lilith 1975: ${lilith.lon}`);
});

test('Chiron and the asteroids, against JPL Horizons from 1901 to 2099', () => {
  const ref: Record<string, [date: string, lon: number][]> = {
    Chiron: [
      ['1901-01-08', 269.4721237],
      ['1950-01-19', 257.7166316],
      ['2042-01-12', 122.0818395],
      ['2099-01-24', 230.2136907],
    ],
    Ceres: [
      ['1901-01-08', 325.9203463],
      ['1950-01-19', 241.473922],
      ['2042-01-12', 234.1016368],
      ['2099-01-24', 336.3059827],
    ],
    Pallas: [
      ['1901-01-08', 307.5566932],
      ['1950-01-19', 221.6981236],
      ['2042-01-12', 199.9428106],
      ['2099-01-24', 299.8677321],
    ],
    Juno: [
      ['1901-01-08', 11.8456065],
      ['1950-01-19', 184.2913481],
      ['2042-01-12', 210.9875028],
      ['2099-01-24', 228.9220789],
    ],
    Vesta: [
      ['1901-01-08', 138.375346],
      ['1950-01-19', 319.7209133],
      ['2042-01-12', 67.0581206],
      ['2099-01-24', 338.1802591],
    ],
  };
  for (const [name, rows] of Object.entries(ref))
    for (const [date, lon] of rows) {
      const got = C.lonOf(name, new Date(`${date}T00:00:00Z`));
      assert.ok(
        diff(got, lon) < 1.5 / 60,
        `${name} ${date}: ${got.toFixed(4)} vs ${lon} (${(diff(got, lon) * 60).toFixed(2)}′)`,
      );
    }
  assert.ok(C.orbitsCover(new Date(Date.UTC(1950, 0, 1))));
  assert.ok(!C.orbitsCover(new Date(Date.UTC(1850, 0, 1))), 'before the table, positions are marked approximate');
});

test('angles', () => {
  assert.ok(diff(chart.asc, pos(22, 3, 'Vir')) < 0.05);
  assert.ok(diff(chart.mc, pos(20, 47, 'Gem')) < 0.05);
  assert.ok(diff(chart.vertex, pos(8, 28, 'Pis')) < 0.05);
});

test('Yod to Mercury', () => {
  const pats = E.patterns(chart.pts, E.aspects(chart.pts));
  assert.ok(pats.some((p) => p.type === 'Yod' && p.focus === 'Mercury'));
});

test('New Moon timing', () => {
  const ev = E.dayEvents(new Date(Date.UTC(2026, 10, 9, 5)), new Date(Date.UTC(2026, 10, 10, 5)));
  const nm = ev.find((e) => e.kind === 'lunation')!;
  assert.strictEqual(nm.text, 'New Moon in Scorpio');
  assert.ok(Math.abs(nm.t.getTime() - when.getTime()) < 2 * 60000);
});

test('Mercury stations retrograde on 24 Oct 2026', () => {
  const ev = E.dayEvents(new Date(Date.UTC(2026, 9, 24)), new Date(Date.UTC(2026, 9, 25)));
  assert.ok(ev.some((e) => e.text === 'Mercury stations retrograde'));
});

test('Placidus cusps', () => {
  const want: [number, number, string][] = [
    [22, 2, 'Vir'],
    [17, 23, 'Lib'],
    [17, 20, 'Sco'],
    [20, 47, 'Gem'],
    [24, 33, 'Can'],
    [25, 22, 'Leo'],
  ];
  const idx = [0, 1, 2, 9, 10, 11];
  idx.forEach((i, k) =>
    assert.ok(diff(chart.cusps[i], pos(...want[k])) < 0.05, `cusp ${i + 1}: ${chart.cusps[i].toFixed(3)}`),
  );
});

test('year ahead: eclipses, stations, ingresses and outer aspects', () => {
  const ev = E.yearAhead(new Date(Date.UTC(2026, 10, 9)));
  const find = (title: string, y: number, m: number, d: number) =>
    ev.find(
      (e) =>
        e.title === title &&
        e.t.getUTCFullYear() === y &&
        e.t.getUTCMonth() === m - 1 &&
        Math.abs(e.t.getUTCDate() - d) <= 1,
    );
  assert.ok(find('Annular solar eclipse', 2027, 2, 6), 'annular eclipse 6 Feb 2027');
  const total = find('Total solar eclipse', 2027, 8, 2);
  assert.ok(total && /^9°5\d′ Leo/.test(total.detail.replace('Sun ', '')), 'total eclipse 2 Aug 2027 at 9° Leo');
  assert.ok(find('Mars stations retrograde', 2027, 1, 10), 'Mars retrograde 10 Jan 2027');
  assert.ok(find('Mercury stations retrograde', 2027, 2, 9), 'Mercury retrograde 9 Feb 2027');
  assert.ok(find('Jupiter enters Virgo', 2027, 7, 26), 'Jupiter into Virgo late July 2027');
  assert.ok(
    ev.some((e) => e.title === 'Jupiter trine Saturn'),
    'Jupiter trine Saturn in 2027',
  );
  assert.ok(
    ev.every((e, i) => i === 0 || e.t >= ev[i - 1].t),
    'sorted by time',
  );
});

const cstISO = (d: Date) => new Date(d.getTime() + 8 * 3600000).toISOString().slice(0, 10);
const sb = (p: Z.Pillar) => Z.STEMS[p.stem][0] + Z.BRANCHES[p.branch][0];

test('Chinese New Year dates', () => {
  const want = {
    2020: '2020-01-25',
    2021: '2021-02-12',
    2022: '2022-02-01',
    2023: '2023-01-22',
    2024: '2024-02-10',
    2025: '2025-01-29',
    2026: '2026-02-17',
    2027: '2027-02-06',
    2028: '2028-01-26',
    2033: '2033-01-31',
    2034: '2034-02-19',
  };
  for (const [y, d] of Object.entries(want)) assert.strictEqual(cstISO(Z.chineseNewYear(+y)), d, `CNY ${y}`);
});

test('Chinese leap months', () => {
  const l1 = Z.lunarDate(new Date('2023-03-22T06:00:00Z'));
  assert.deepStrictEqual([l1.month, l1.leap, l1.day], [2, true, 1]);
  const l2 = Z.lunarDate(new Date('2025-07-25T06:00:00Z'));
  assert.deepStrictEqual([l2.month, l2.leap, l2.day], [6, true, 1]);
  const l3 = Z.lunarDate(new Date('2020-05-23T06:00:00Z'));
  assert.deepStrictEqual([l3.month, l3.leap, l3.day], [4, true, 1]);
});

test('Four Pillars', () => {
  const a = Z.fourPillars(new Date(Date.UTC(2000, 0, 1, 4)), { y: 2000, m: 1, d: 1, hh: 12, mm: 0 });
  assert.deepStrictEqual([sb(a.year), sb(a.month), sb(a.day), sb(a.hour)], ['己卯', '丙子', '戊午', '戊午']);
  const b = Z.fourPillars(when, { y: 2026, m: 11, d: 9, hh: 2, mm: 2 });
  assert.deepStrictEqual([sb(b.year), sb(b.month), sb(b.day), sb(b.hour)], ['丙午', '己亥', '丁亥', '辛丑']);
});

const mayaText = (r: ReturnType<typeof M.mayaDate>) =>
  `${r.longCount.join('.')} ${r.tz.number} ${M.SIGNS[r.tz.sign][0]} ${r.hb.day} ${M.HAAB[r.hb.month]} G${r.lord}`;

test("Maya calendar: 21 Dec 2012 is 13.0.0.0.0 4 Ajaw 3 K'ank'in", () => {
  assert.strictEqual(mayaText(M.mayaDate(2012, 12, 21)), "13.0.0.0.0 4 Ajaw 3 K'ank'in G9");
});

test('Maya calendar: neighbouring days and the 260-day count', () => {
  assert.strictEqual(mayaText(M.mayaDate(2012, 12, 22)), "13.0.0.0.1 5 Imix' 4 K'ank'in G1");
  const a = M.mayaDate(2026, 11, 9),
    b = M.mayaDate(2027, 7, 27); // 260 days later
  assert.strictEqual(b.days - a.days, 260);
  assert.deepStrictEqual([b.tz.number, b.tz.sign, b.kin], [a.tz.number, a.tz.sign, a.kin]);
  const c = M.mayaDate(2027, 11, 9); // 365 days later: same Haab' date
  assert.deepStrictEqual([c.hb.month, c.hb.day], [a.hb.month, a.hb.day]);
});

const heb = (y: number, m: number, d: number) => {
  const h = H.hebrewDate(y, m, d, false);
  return `${h.day} ${h.monthName} ${h.year}`;
};

test('Hebrew calendar: Rosh Hashanah, Pesach, Chanukah, Purim', () => {
  assert.strictEqual(heb(2024, 10, 3), '1 Tishrei 5785');
  assert.strictEqual(heb(2025, 9, 23), '1 Tishrei 5786');
  assert.strictEqual(heb(2026, 9, 12), '1 Tishrei 5787');
  assert.strictEqual(heb(2026, 4, 2), '15 Nisan 5786');
  assert.strictEqual(heb(2025, 12, 15), '25 Kislev 5786');
  assert.strictEqual(heb(2024, 3, 24), '14 Adar II 5784');
  assert.ok(H.holidays(H.hebrewDate(2026, 7, 23, false)).includes("Tisha B'Av"));
  assert.strictEqual(heb(2026, 11, 8), '28 Cheshvan 5787');
  assert.strictEqual(H.hebrewDate(2026, 11, 8, true).day, 29, 'after sunset it is the next Hebrew day');
});

test('Hebrew numerals and the Omer', () => {
  assert.strictEqual(H.gematria(5787), 'תשפ״ז');
  assert.strictEqual(H.gematria(15), 'ט״ו');
  assert.strictEqual(H.gematria(16), 'ט״ז');
  assert.strictEqual(H.gematria(1), 'א׳');
  const o = H.omer(H.hebrewDate(2026, 5, 5, false))!; // Lag BaOmer
  assert.deepStrictEqual([o.day, H.SEFIROT[o.inner][1], H.SEFIROT[o.outer][1]], [33, 'Hod', 'Hod']);
});

test('Vedic: Lahiri ayanamsa, adhika month, dignities', () => {
  assert.ok(Math.abs(V.ayanamsa(new Date(Date.UTC(2000, 0, 1, 12))) - 23.8571) < 0.001);
  assert.ok(Math.abs(V.ayanamsa(new Date(Date.UTC(2026, 0, 1))) - 24.225) < 0.01, '24°13′ in 2026');
  const adhika = V.lunarMonth(new Date(Date.UTC(2026, 5, 1)));
  assert.deepStrictEqual([adhika.name, adhika.adhika], ['Jyeshtha', true], 'Adhika Jyeshtha 2026');
  const diwali = V.lunarMonth(new Date(Date.UTC(2025, 9, 20, 12)));
  assert.strictEqual(diwali.name, 'Ashvina', 'Diwali 2025 closes amanta Ashvina');
  const g = V.grahas(when).list;
  const by = Object.fromEntries(g.map((x) => [x.key, x]));
  assert.strictEqual(V.RASHIS[by.Sun.sign][1], 'Tula');
  assert.strictEqual(by.Sun.dignity, 'Debilitated');
  assert.strictEqual(V.NAKSHATRAS[by.Moon.nak.i][0], 'Vishakha');
  assert.strictEqual(Math.round(Math.abs(by.Rahu.sid - by.Ketu.sid)), 180);
});

test('Vedic panchang at the new moon', () => {
  const p = V.panchang(new Date(when.getTime() + 60000), 28.61, 77.21, new Date(Date.UTC(2026, 10, 8, 18, 30)));
  assert.deepStrictEqual([p.tithi.paksha, p.tithi.name], ['Shukla', 'Pratipada']);
  assert.strictEqual(p.karana.name, 'Kimstughna');
  const before = V.panchang(new Date(when.getTime() - 60000), 28.61, 77.21);
  assert.strictEqual(before.tithi.name, 'Amavasya');
});

const isoDay = (d: Date) => d.toISOString().slice(0, 10);

test('Hijri months by the Umm al-Qura rule', () => {
  assert.strictEqual(isoDay(I.civilOf(1445, 9, 1)), '2024-03-11', 'Ramadan 1445');
  assert.strictEqual(isoDay(I.civilOf(1446, 9, 1)), '2025-03-01', 'Ramadan 1446');
  assert.strictEqual(isoDay(I.civilOf(1446, 10, 1)), '2025-03-30', 'Eid al-Fitr 1446');
  assert.strictEqual(isoDay(I.civilOf(1447, 9, 1)), '2026-02-18', 'Ramadan 1447');
  assert.strictEqual(isoDay(I.civilOf(1447, 10, 1)), '2026-03-20', 'Eid al-Fitr 1447');
  assert.strictEqual(isoDay(I.civilOf(1447, 12, 10)), '2026-05-27', 'Eid al-Adha 1447');
  assert.strictEqual(isoDay(I.civilOf(1448, 1, 1)), '2026-06-16', 'New Year 1448');
  const h = I.hijriDate(2026, 3, 19, true); // evening before Eid: already 1 Shawwal
  assert.deepStrictEqual([h.month, h.day], [10, 1]);
});

test('Prayer times and Qibla', () => {
  const q = I.qibla(52.37, 4.9);
  assert.ok(Math.abs(q.bearing - 125.6) < 0.5 && Math.abs(q.km - 4554) < 20, 'Qibla from Amsterdam');
  const p = I.prayerTimes(new Date(Date.UTC(2026, 10, 8, 23)), 52.37, 4.9, 'mwl', 1);
  const order = (['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'] as const).map((k) => p[k]!.getTime());
  assert.ok(
    order.every((t, i) => i === 0 || t > order[i - 1]),
    'prayers in order',
  );
  const hanafi = I.prayerTimes(new Date(Date.UTC(2026, 10, 8, 23)), 52.37, 4.9, 'mwl', 2);
  assert.ok(hanafi.asr! > p.asr!, 'Hanafi Asr is later');
  const june = I.prayerTimes(new Date(Date.UTC(2026, 5, 20, 22)), 52.37, 4.9, 'mwl', 1);
  assert.ok(june.fajr && june.isha && june.adjusted, 'high-latitude fallback in June');
});

test('Vedic festivals 2026 (Delhi) follow the observance rules', () => {
  const ev = V.daysAhead(new Date(Date.UTC(2025, 11, 31, 18, 30)), 365, 28.61, 77.21);
  const ist = (e: V.Observance) => new Date(e.date.getTime() + 5.5 * 3600000).toISOString().slice(0, 10);
  const on = (name: string) => {
    const e = ev.find((x) => x.name === name);
    return e && ist(e);
  };
  const want = {
    'Makar Sankranti': '2026-01-14',
    'Vasant Panchami': '2026-01-23',
    'Maha Shivaratri': '2026-02-15',
    'Holika Dahan': '2026-03-03',
    Holi: '2026-03-04',
    'Ugadi · Gudi Padwa': '2026-03-19',
    'Rama Navami': '2026-03-26',
    'Akshaya Tritiya': '2026-04-19',
    'Raksha Bandhan': '2026-08-28',
    'Krishna Janmashtami': '2026-09-04',
    'Ganesh Chaturthi': '2026-09-14',
    'Navaratri begins': '2026-10-11',
    'Dussehra · Vijayadashami': '2026-10-20',
    Dhanteras: '2026-11-06',
    'Diwali · Lakshmi Puja': '2026-11-08',
    'Bhai Dooj': '2026-11-11',
  };
  for (const [name, date] of Object.entries(want)) assert.strictEqual(on(name), date, name);
  assert.strictEqual(ev.filter((e) => e.kind === 'ekadashi').length, 24, 'two Ekadashis a month');
});

test('Planetary hours: Chaldean order from the day ruler', () => {
  // Monday 9 Nov 2026, illustrative sunrise/sunset/next sunrise
  const sr = new Date('2026-11-09T06:42:00Z'),
    ss = new Date('2026-11-09T16:57:00Z'),
    nx = new Date('2026-11-10T06:44:00Z');
  const ph = E.planetaryHours(sr, ss, nx, 1);
  assert.strictEqual(ph.dayRuler, 'Moon');
  assert.deepStrictEqual(
    ph.hours.slice(0, 8).map((h) => h.ruler),
    ['Moon', 'Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon'],
  );
  assert.strictEqual(ph.hours.length, 24);
  assert.strictEqual(ph.hours[11].end.getTime(), ss.getTime(), 'twelfth day hour ends at sunset');
  assert.strictEqual(ph.hours[23].end.getTime(), nx.getTime(), 'last night hour ends at the next sunrise');
  // the hour after the 24th is the next day's ruler (Tuesday → Mars)
  const next = E.CHALDEAN[(E.CHALDEAN.indexOf(ph.hours[23].ruler) + 1) % 7];
  assert.strictEqual(next, 'Mars');
});

test('reading of the reference chart', () => {
  const asps = E.aspects(chart.pts),
    pats = E.patterns(chart.pts, asps);
  const phase = E.moonPhase(by.Sun.lon, by.Moon.lon);
  const houseOf = (lon: number) => C.houseOf(chart.cusps, lon);
  const r = WesternReading.read({ chart, asps, pats, phase, houseOf });
  assert.match(r.summary, /^New Moon in Scorpio, with the Sun in Scorpio and Virgo rising\./);
  const titles = r.sections.map((s) => s.title);
  for (const t of ['Sun, Moon and Rising', 'Strongest contacts', 'Balance', 'Retrogrades'])
    assert.ok(titles.includes(t), t);
  assert.ok(r.sections.find((s) => s.title === 'Retrogrades')!.items.some((i) => i.head === 'Mercury retrograde'));
  assert.ok(!/undefined|NaN/.test(r.text), r.text);
  // natural houses repeat the signs, so the reading leaves houses out
  const nat = WesternReading.read({ chart: { ...chart, system: 'natural' }, asps, pats, phase, houseOf });
  assert.ok(!/house/.test(nat.text));
});

test('Vedic reading of the reference chart', () => {
  const p = V.panchang(when, 40 + 43 / 60, -74, new Date(Date.UTC(2026, 10, 9, 5, 0)));
  const g = V.grahas(when),
    moon = g.list.find((x) => x.key === 'Moon')!;
  const r = VedicReading.read({
    p,
    g,
    lagna: V.sidereal(chart.asc, when),
    vara: 0,
    dashas: V.dashas(when, moon.sid),
    rahuKaal: false,
  });
  assert.deepStrictEqual(
    r.sections.map((s) => s.title),
    ['The day', 'Lagna, Moon and Sun', 'Yogas', 'Graha by graha', 'House by house', 'Dasha'],
  );
  const sec = (t: string) => r.sections.find((s) => s.title === t)!.items;
  assert.strictEqual(sec('Graha by graha').length, 9);
  assert.strictEqual(sec('House by house').length, 12);
  assert.ok(sec('Yogas').some((i) => i.head === 'Budha-Aditya yoga')); // Sun and Mercury both in sidereal Libra
  assert.match(sec('Graha by graha')[0].head, /^Surya \(Sun\) in Tula, 3rd house$/);
  assert.ok(sec('Graha by graha').every((i) => (i.more?.length ?? 0) >= 10));
  assert.ok(!/undefined|NaN/.test(r.text), r.text);
});

test('Explain terms finds the jargon in both readings, once per section', () => {
  const asps = E.aspects(chart.pts);
  const w = WesternReading.read({
    chart,
    asps,
    pats: E.patterns(chart.pts, asps),
    phase: E.moonPhase(by.Sun.lon, by.Moon.lon),
    houseOf: (lon: number) => C.houseOf(chart.cusps, lon),
  });
  const g = V.grahas(when);
  const v = VedicReading.read({
    p: V.panchang(when, 40 + 43 / 60, -74, new Date(Date.UTC(2026, 10, 9, 5, 0))),
    g,
    lagna: V.sidereal(chart.asc, when),
    vara: 0,
    dashas: V.dashas(when, g.list.find((x) => x.key === 'Moon')!.sid),
    rahuKaal: false,
  });
  const explained = (r: typeof w, glossary: Glossary.GlossaryEntry[]) =>
    r.sections.map((sec) => {
      const seen = new Set<string>();
      return sec.items.flatMap((i) =>
        Glossary.termsIn(`${i.head} ${i.text}`, glossary, sec.title, seen).map((t) => t.term),
      );
    });
  const west = explained(w, Glossary.WESTERN),
    vedic = explained(v, Glossary.VEDIC);
  for (const t of ['Rising sign', 'Conjunction', 'Quincunx', 'Orb', 'Yod', 'Retrograde', 'Fall', 'Domicile'])
    assert.ok(west.flat().includes(t), t);
  for (const t of [
    'Tithi',
    'Vara',
    'Nakshatra',
    'Yoga of the day',
    'Karana',
    'Lagna',
    'Dusthana',
    'Upachaya',
    'Combust',
  ])
    assert.ok(vedic.flat().includes(t), t);
  // never twice in one section
  for (const sec of [...west, ...vedic]) assert.strictEqual(new Set(sec).size, sec.length);
  // a word that means something else inside a longer name
  assert.ok(
    !Glossary.termsIn('Grand Trine between Sun, Moon and Mars', Glossary.WESTERN, 'Patterns').some(
      (t) => t.term === 'Trine',
    ),
  );
  assert.ok(!Glossary.termsIn('T-square to Mars', Glossary.WESTERN, 'Patterns').some((t) => t.term === 'Square'));
  assert.ok(!Glossary.termsIn('Rahu Kaal is over', Glossary.VEDIC, 'The day').some((t) => t.term === 'Rahu and Ketu'));
});

test('Chinese reading: Day Master, branches and the day officer', () => {
  const p = Z.fourPillars(when, { y: 2026, m: 11, d: 9, hh: 2, mm: 2 });
  const r = ChineseReading.read(p);
  assert.deepStrictEqual(
    r.sections.map((s) => s.title),
    ['Day Master', 'Branches', 'The day’s officer'],
  );
  const [zh, name] = ChineseReading.OFFICERS[(p.day.branch - p.month.branch + 12) % 12];
  assert.strictEqual(r.sections[2].items[0].head, `${zh} ${name} day`);
  assert.match(r.sections[0].items[1].head, /^(Strong|Weak|Balanced) Day Master$/);
  assert.ok(!/undefined|NaN/.test(r.text), r.text);
  // Rat year, Horse month, Monkey day, Dragon hour: a clash, and the whole Water frame
  const made = ChineseReading.read({
    year: Z.pillar(0),
    month: Z.pillar(6),
    day: Z.pillar(8),
    hour: Z.pillar(4),
    sun: 0,
  });
  const heads = made.sections.find((s) => s.title === 'Branches')!.items.map((i) => i.head);
  assert.ok(heads.includes('Year and month clash · Rat and Horse'), heads.join(' / '));
  assert.ok(heads.includes('Monkey, Rat, Dragon · Water frame'), heads.join(' / '));
  // the Monkey day in a Horse month is the 3rd officer
  assert.strictEqual(made.sections[2].items[0].head, '滿 Full day');
});

test('Maya reading: the day, the trecena and the year bearer', () => {
  const r = M.mayaDate(2026, 11, 9);
  const m = MayaReading.read(r);
  assert.deepStrictEqual(
    m.sections.map((s) => s.title),
    ['The day', 'The trecena', 'The year'],
  );
  assert.match(
    m.summary,
    /^5 Chuwen, a gentle Monkey day, on day 5 of the trecena of Manik' \(deer\), in a year carried by 2 Manik'\.$/,
  );
  assert.ok(!/undefined|NaN/.test(m.text), m.text);
  // the five nameless days add a line and a caution
  const w = MayaReading.read(M.mayaDate(2026, 3, 25));
  assert.strictEqual(w.sections[2].items[1].head, "Wayeb'");
  assert.ok(w.advice.care[0].includes("Wayeb'"));
});

test('Kabbalah reading: the day, the month, the Omer and the holy days', () => {
  const r = KabbalahReading.read(H.hebrewDate(2026, 11, 9, false));
  assert.deepStrictEqual(
    r.sections.map((s) => s.title),
    ['The day', 'The month', 'Holy days'],
  );
  assert.match(r.summary, /^Monday, 29 Cheshvan 5787, a day of Gevurah \(strength\)\./);
  assert.strictEqual(r.sections[2].items[0].head, 'Next: Chanukah');
  // the sixth day of the Omer is Yesod within Chesed; Pesach is under way, so the next holy day is Lag BaOmer
  const pesach = KabbalahReading.read(H.hebrewDate(2027, 4, 28, false));
  assert.strictEqual(pesach.sections.find((s) => s.title === 'The Omer')!.items[0].head, 'Day 6 · Yesod she-be-Chesed');
  const holy = pesach.sections.find((s) => s.title === 'Holy days')!.items.map((i) => i.head);
  assert.deepStrictEqual(holy, ['Pesach', 'Next: Lag BaOmer · hillula of Rabbi Shimon bar Yochai']);
  assert.ok(!/undefined|NaN/.test(r.text + pesach.text));
});

test('Islamic reading: occasions, the month, the next occasion, and the mansion as heritage', () => {
  const r = IslamicReading.read(I.hijriDate(2026, 11, 9, false), 230, false);
  assert.deepStrictEqual(
    r.sections.map((s) => s.title),
    ['Today', 'The month', 'Next', 'Heritage'],
  );
  assert.match(r.summary, /^Monday \(al-Ithnayn\), 29 Jumada al-Ula 1448 AH\./);
  assert.match(r.sections[3].items[0].text, /heritage, not religious practice/);
  assert.ok(!/undefined|NaN/.test(r.text));
  // Eid al-Fitr: no fasting, and the Eid prayer recommended
  let eid = null;
  for (let k = 0; k < 400 && !eid; k++) {
    const t = new Date(Date.UTC(2026, 0, 1 + k));
    const h = I.hijriDate(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate(), false);
    if (h.month === 10 && h.day === 1) eid = IslamicReading.read(h, 0, false);
  }
  assert.ok(eid);
  assert.ok(eid.advice.care.some((c) => c.startsWith('fasting')));
  assert.ok(eid.advice.good.some((g) => g.includes('Eid prayer')));
});
