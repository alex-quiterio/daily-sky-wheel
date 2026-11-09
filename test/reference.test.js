// Checks the calculations against a reference chart:
// Scorpio New Moon, 9 Nov 2026, 2:02 AM EST, New York (40N43, 74W00).
const test = require('node:test');
const assert = require('node:assert');
globalThis.Astronomy = require('astronomy-engine');
require('../src/core.js');
require('../src/events.js');
const C = globalThis.AstroCore, E = globalThis.AstroEvents;

const SIGNS = ['Ari', 'Tau', 'Gem', 'Can', 'Leo', 'Vir', 'Lib', 'Sco', 'Sag', 'Cap', 'Aqu', 'Pis'];
const pos = (deg, min, sign) => SIGNS.indexOf(sign) * 30 + deg + min / 60;
const diff = (a, b) => Math.abs(((a - b + 540) % 360) - 180);

const when = new Date(Date.UTC(2026, 10, 9, 7, 2, 0));
const chart = C.chart(when, 40 + 43 / 60, -74, 'placidus');
const by = Object.fromEntries(chart.pts.map((p) => [p.name, p]));

const REF = {
  Sun: [16, 53, 'Sco', false], Moon: [16, 53, 'Sco', false], Mercury: [6, 52, 'Sco', true],
  Venus: [23, 19, 'Lib', true], Mars: [22, 41, 'Leo', false], Jupiter: [25, 15, 'Leo', false],
  Saturn: [8, 48, 'Ari', true], Uranus: [4, 22, 'Gem', true], Neptune: [1, 55, 'Ari', true],
  Pluto: [3, 12, 'Aqu', false], Chiron: [27, 42, 'Ari', true], Node: [26, 12, 'Aqu', true],
  Lilith: [6, 12, 'Cap', false], Ceres: [23, 23, 'Can', false], Pallas: [5, 10, 'Ari', true],
  Juno: [4, 9, 'Aqu', false], Vesta: [14, 5, 'Ari', true],
};

for (const [name, [d, m, s, retro]] of Object.entries(REF)) {
  test(`${name} position and motion`, () => {
    const tol = name === 'Lilith' || name === 'Node' ? 0.2 : 0.05; // mean Lilith / approximate true node
    assert.ok(diff(by[name].lon, pos(d, m, s)) < tol, `${name}: ${by[name].lon.toFixed(3)} vs ${pos(d, m, s).toFixed(3)}`);
    if (!['Sun', 'Moon'].includes(name)) assert.strictEqual(by[name].retro, retro);
  });
}

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
  const nm = ev.find((e) => e.kind === 'lunation');
  assert.strictEqual(nm.text, 'New Moon in Scorpio');
  assert.ok(Math.abs(nm.t - when) < 2 * 60000);
});

test('Mercury stations retrograde on 24 Oct 2026', () => {
  const ev = E.dayEvents(new Date(Date.UTC(2026, 9, 24)), new Date(Date.UTC(2026, 9, 25)));
  assert.ok(ev.some((e) => e.text === 'Mercury stations retrograde'));
});

test('Placidus cusps', () => {
  const want = [[22, 2, 'Vir'], [17, 23, 'Lib'], [17, 20, 'Sco'], [20, 47, 'Gem'], [24, 33, 'Can'], [25, 22, 'Leo']];
  const idx = [0, 1, 2, 9, 10, 11];
  idx.forEach((i, k) => assert.ok(diff(chart.cusps[i], pos(...want[k])) < 0.05, `cusp ${i + 1}: ${chart.cusps[i].toFixed(3)}`));
});

test('year ahead: eclipses, stations, ingresses and outer aspects', () => {
  const ev = E.yearAhead(new Date(Date.UTC(2026, 10, 9)));
  const find = (title, y, m, d) => ev.find((e) => e.title === title && e.t.getUTCFullYear() === y && e.t.getUTCMonth() === m - 1 && Math.abs(e.t.getUTCDate() - d) <= 1);
  assert.ok(find('Annular solar eclipse', 2027, 2, 6), 'annular eclipse 6 Feb 2027');
  const total = find('Total solar eclipse', 2027, 8, 2);
  assert.ok(total && /^9°5\d′ Leo/.test(total.detail.replace('Sun ', '')), 'total eclipse 2 Aug 2027 at 9° Leo');
  assert.ok(find('Mars stations retrograde', 2027, 1, 10), 'Mars retrograde 10 Jan 2027');
  assert.ok(find('Mercury stations retrograde', 2027, 2, 9), 'Mercury retrograde 9 Feb 2027');
  assert.ok(find('Jupiter enters Virgo', 2027, 7, 26), 'Jupiter into Virgo late July 2027');
  assert.ok(ev.some((e) => e.title === 'Jupiter trine Saturn'), 'Jupiter trine Saturn in 2027');
  assert.ok(ev.every((e, i) => i === 0 || e.t >= ev[i - 1].t), 'sorted by time');
});

require('../src/chinese.js');
const Z = globalThis.Chinese;
const cstISO = (d) => new Date(d.getTime() + 8 * 3600000).toISOString().slice(0, 10);
const sb = (p) => Z.STEMS[p.stem][0] + Z.BRANCHES[p.branch][0];

test('Chinese New Year dates', () => {
  const want = { 2020: '2020-01-25', 2021: '2021-02-12', 2022: '2022-02-01', 2023: '2023-01-22', 2024: '2024-02-10', 2025: '2025-01-29', 2026: '2026-02-17', 2027: '2027-02-06', 2028: '2028-01-26', 2033: '2033-01-31', 2034: '2034-02-19' };
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
