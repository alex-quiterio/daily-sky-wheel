// Specs for astro/core.ts: longitudes, motion, declination and the house systems.
import { describe, test } from 'node:test';
import assert from 'node:assert';
import { Core as C } from '#astro';

const when = new Date(Date.UTC(2026, 10, 9, 7, 2));
const NYC: [number, number] = [40 + 43 / 60, -74];
const diff = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);

describe('norm', () => {
  test('brings any angle into 0-360', () => {
    assert.strictEqual(C.norm(370), 10);
    assert.strictEqual(C.norm(-10), 350);
    assert.strictEqual(C.norm(360), 0);
    assert.strictEqual(C.norm(-720), 0);
    assert.strictEqual(C.norm(123.5), 123.5);
  });
});

describe('houseOf', () => {
  const natural = Array.from({ length: 12 }, (_, k) => k * 30);

  test('a cusp belongs to the house it opens', () => {
    assert.strictEqual(C.houseOf(natural, 0), 1);
    assert.strictEqual(C.houseOf(natural, 29.999), 1);
    assert.strictEqual(C.houseOf(natural, 30), 2);
    assert.strictEqual(C.houseOf(natural, 359.9), 12);
  });

  test('works when the houses start anywhere on the wheel', () => {
    const cusps = natural.map((c) => C.norm(c + 172)); // 22° Virgo rising
    assert.strictEqual(C.houseOf(cusps, 172), 1);
    assert.strictEqual(C.houseOf(cusps, 171.9), 12);
    assert.strictEqual(C.houseOf(cusps, 5), 7); // the house holding 0° Aries
    assert.strictEqual(C.houseOf(cusps, 355), 7);
  });

  test('works for houses of unequal size', () => {
    const cusps = [172, 197, 227, 261, 295, 325, 352, 17, 47, 81, 115, 145];
    assert.strictEqual(C.houseOf(cusps, 260), 3);
    assert.strictEqual(C.houseOf(cusps, 261), 4);
    assert.strictEqual(C.houseOf(cusps, 0), 7);
    assert.strictEqual(C.houseOf(cusps, 17), 8);
  });

  test('every point of the reference chart is in exactly one house', () => {
    const chart = C.chart(when, ...NYC, 'placidus');
    for (const p of chart.pts) {
      const h = C.houseOf(chart.cusps, p.lon);
      const a = chart.cusps[h - 1],
        b = chart.cusps[h % 12];
      assert.ok(C.norm(p.lon - a) < C.norm(b - a), `${p.name} in house ${h}`);
    }
  });
});

describe('house systems', () => {
  const cast = (system: C.HouseSystem, lat = NYC[0]) => C.chart(when, lat, NYC[1], system);

  test('the system changes the cusps and nothing else', () => {
    const p = cast('placidus');
    for (const system of ['whole', 'equal', 'natural'] as const) {
      const c = cast(system);
      assert.strictEqual(c.system, system);
      assert.deepStrictEqual([c.asc, c.mc, c.vertex], [p.asc, p.mc, p.vertex]);
      assert.deepStrictEqual(c.pts, p.pts);
    }
  });

  test('natural: Aries is the first house', () => {
    assert.deepStrictEqual(
      cast('natural').cusps,
      Array.from({ length: 12 }, (_, k) => k * 30),
    );
  });

  test('whole sign: the rising sign is the first house', () => {
    const c = cast('whole'); // 22° Virgo rising
    assert.strictEqual(c.cusps[0], 150);
    c.cusps.forEach((x, k) => assert.strictEqual(x, (150 + k * 30) % 360));
    assert.strictEqual(C.houseOf(c.cusps, c.asc), 1);
  });

  test('equal: thirty degrees a house from the Ascendant', () => {
    const c = cast('equal');
    assert.strictEqual(c.cusps[0], c.asc);
    c.cusps.forEach((x, k) => assert.ok(diff(x, c.asc + k * 30) < 1e-9));
  });

  test('Placidus: the angles open houses 1, 4, 7 and 10, and opposite cusps face each other', () => {
    const c = cast('placidus');
    assert.strictEqual(c.cusps[0], c.asc);
    assert.strictEqual(c.cusps[9], c.mc);
    for (let k = 0; k < 6; k++) assert.ok(diff(c.cusps[k + 6], c.cusps[k] + 180) < 1e-9, `houses ${k + 1}/${k + 7}`);
    // the cusps go round the wheel once, in order
    const sizes = c.cusps.map((x, k) => C.norm(c.cusps[(k + 1) % 12] - x));
    assert.ok(sizes.every((s) => s > 0 && s < 90));
    assert.ok(Math.abs(sizes.reduce((a, s) => a + s, 0) - 360) < 1e-9);
  });

  test('Placidus gives way to equal houses inside the polar circles', () => {
    for (const lat of [70, -70]) {
      const p = cast('placidus', lat),
        e = cast('equal', lat);
      assert.strictEqual(p.system, 'placidus');
      assert.deepStrictEqual(p.cusps, e.cusps, `latitude ${lat}`);
    }
  });

  test('on the equator at the same moment the Midheaven is unchanged and the Ascendant is not', () => {
    const north = cast('placidus'),
      equator = cast('placidus', 0);
    assert.strictEqual(equator.mc, north.mc);
    assert.ok(diff(equator.asc, north.asc) > 1);
  });

  test('in the southern hemisphere the same moment is a different chart with the same sky', () => {
    const north = cast('placidus'),
      south = cast('placidus', -NYC[0]);
    assert.deepStrictEqual(south.pts, north.pts);
    assert.strictEqual(south.mc, north.mc);
    assert.ok(diff(south.asc, north.asc) > 1);
    assert.strictEqual(south.cusps[0], south.asc);
    for (let k = 0; k < 6; k++) assert.ok(diff(south.cusps[k + 6], south.cusps[k] + 180) < 1e-9);
  });
});

describe('chart', () => {
  const chart = C.chart(when, ...NYC, 'placidus');

  test('holds every body once, in a fixed order', () => {
    assert.deepStrictEqual(
      chart.pts.map((p) => p.name),
      C.BODIES,
    );
    assert.strictEqual(new Set(C.BODIES).size, 17);
  });

  test('every number is finite and in range', () => {
    for (const p of chart.pts) {
      assert.ok(p.lon >= 0 && p.lon < 360, `${p.name} lon`);
      assert.ok(Math.abs(p.lat) < 40, `${p.name} lat`); // Pallas strays furthest from the ecliptic
      assert.ok(Math.abs(p.decl) <= 90, `${p.name} decl`);
      assert.ok(Number.isFinite(p.speed), `${p.name} speed`);
      assert.strictEqual(p.retro, p.speed < 0, `${p.name} retro`);
    }
    for (const x of [chart.asc, chart.mc, chart.vertex, chart.ramc, ...chart.cusps]) assert.ok(x >= 0 && x < 360);
    assert.ok(Math.abs(chart.eps - 23.44) < 0.01, 'obliquity');
  });

  test('the Sun stays on the ecliptic and never turns back', () => {
    const sun = chart.pts[0];
    assert.ok(Math.abs(sun.lat) < 0.001);
    assert.ok(sun.speed > 0.95 && sun.speed < 1.02);
    assert.ok(!sun.retro);
  });

  test('the Moon moves about thirteen degrees a day', () => {
    const moon = chart.pts[1];
    assert.ok(moon.speed > 11.5 && moon.speed < 15.5);
    assert.ok(Math.abs(moon.lat) < 5.4);
  });

  test('the node goes backwards round the zodiac in 18.6 years', () => {
    const year = C.norm(
      C.lonOf('Node', new Date(Date.UTC(2026, 0, 1))) - C.lonOf('Node', new Date(Date.UTC(2027, 0, 1))),
    );
    assert.ok(Math.abs(year - 19.3) < 2, `${year.toFixed(2)}° a year`); // 18.6 years round the zodiac
  });

  test('Lilith goes round in a little under nine years', () => {
    const year = C.norm(
      C.lonOf('Lilith', new Date(Date.UTC(2027, 0, 1))) - C.lonOf('Lilith', new Date(Date.UTC(2026, 0, 1))),
    );
    assert.ok(Math.abs(year - 40.7) < 0.1, `${year.toFixed(2)}° a year`);
  });

  test('an unknown body is an error, not a zero', () => {
    assert.throws(() => C.lonOf('Vulcan', when), /Vulcan/);
  });
});

describe('speed', () => {
  test('is the change in longitude over a day', () => {
    for (const name of ['Sun', 'Mercury', 'Mars', 'Saturn']) {
      const a = C.lonOf(name, new Date(when.getTime() - 43200000)),
        b = C.lonOf(name, new Date(when.getTime() + 43200000));
      const moved = ((b - a + 540) % 360) - 180;
      assert.ok(Math.abs(C.speed(name, when) - moved) < 0.02, name);
    }
  });

  test('is not thrown by a body crossing 0° Aries', () => {
    // the March equinox: the Sun goes from 359° to 0°
    const t = new Date(Date.UTC(2027, 2, 20, 20, 25));
    assert.ok(diff(C.lonOf('Sun', t), 0) < 0.01);
    assert.ok(C.speed('Sun', t) > 0.95 && C.speed('Sun', t) < 1.02);
  });
});

describe('declination', () => {
  const eps = 23.44;

  test('is zero at the equinox points and the obliquity at the solstice points', () => {
    assert.ok(Math.abs(C.declination(0, 0, eps)) < 1e-12);
    assert.ok(Math.abs(C.declination(180, 0, eps)) < 1e-12);
    assert.ok(Math.abs(C.declination(90, 0, eps) - eps) < 1e-12);
    assert.ok(Math.abs(C.declination(270, 0, eps) + eps) < 1e-12);
  });

  test('ecliptic latitude can carry a body out of bounds', () => {
    assert.ok(C.declination(90, 5, eps) > eps);
    assert.ok(Math.abs(C.declination(90, 5, eps) - (eps + 5)) < 1e-9);
    assert.ok(Math.abs(C.declination(0, 5, eps) - 5) < 0.5);
  });

  test('the reference chart: a Scorpio Sun is south of the equator', () => {
    const chart = C.chart(when, ...NYC, 'placidus');
    const sun = chart.pts[0];
    assert.ok(Math.abs(sun.decl - C.declination(sun.lon, sun.lat, chart.eps)) < 1e-12);
    assert.ok(sun.decl < -16 && sun.decl > -17.5, sun.decl.toFixed(2));
  });
});
