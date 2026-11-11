// Fetch osculating orbital elements for Chiron and the four main asteroids from JPL Horizons and write them to
// src/astro/orbits.ts. Run it again only to change the range or the spacing:
//   node scripts/fetch-orbits.mjs
// Heliocentric, J2000 ecliptic, au and degrees. Chiron's orbit changes slowly, so it is sampled every 720 days;
// the asteroids, pulled about by Jupiter, every 360. Measured against Horizons' own apparent positions, a
// position worked out from the nearest row is within 0.5′ (Chiron) and 1.4′ (the asteroids) from 1900 to 2100.
import { writeFileSync } from 'node:fs';

const START = '1899-12-01',
  STOP = '2101-02-01',
  BASE_STEP = 30; // days between the rows Horizons sends; the table keeps every n-th
const BODIES = [
  ['Chiron', '2060', 720],
  ['Ceres', '1', 360],
  ['Pallas', '2', 360],
  ['Juno', '3', 360],
  ['Vesta', '4', 360],
];

async function elements(id) {
  const q = new URLSearchParams({
    format: 'text',
    COMMAND: `'${id};'`,
    OBJ_DATA: "'NO'",
    MAKE_EPHEM: "'YES'",
    EPHEM_TYPE: "'ELEMENTS'",
    CENTER: "'500@10'",
    REF_PLANE: "'ECLIPTIC'",
    REF_SYSTEM: "'J2000'",
    OUT_UNITS: "'AU-D'",
    START_TIME: `'${START}'`,
    STOP_TIME: `'${STOP}'`,
    STEP_SIZE: `'${BASE_STEP}d'`,
    CSV_FORMAT: "'YES'",
  });
  const res = await fetch(`https://ssd.jpl.nasa.gov/api/horizons.api?${q}`);
  if (!res.ok) throw new Error(`Horizons answered ${res.status} for ${id}`);
  const text = await res.text();
  const body = text.slice(text.indexOf('$$SOE') + 5, text.indexOf('$$EOE')).trim();
  if (!body) throw new Error(`no elements for ${id}:\n${text.slice(0, 500)}`);
  // JDTDB, date, EC, QR, IN, OM, W, Tp, N, MA, TA, A, AD, PR
  return body.split('\n').map((line) => {
    const c = line.split(',').map((s) => s.trim());
    return { jd: +c[0], e: +c[2], i: +c[4], O: +c[5], w: +c[6], M: +c[9], a: +c[11] };
  });
}

const fix = (x, d) => Number(x.toFixed(d));
let out = `// Osculating orbital elements from JPL Horizons, written by scripts/fetch-orbits.mjs; do not edit by hand.
// Heliocentric, J2000 ecliptic: [a (au), e, i, node, perihelion, mean anomaly M (degrees)], one row every \`step\`
// days from \`start\` (Julian Day, TDB). Within 1′ or so of Horizons from 1900 to 2100 (see the script).

export interface OrbitTable {
  start: number;
  step: number;
  rows: [a: number, e: number, i: number, O: number, w: number, M: number][];
}

export const ORBITS: Record<string, OrbitTable> = {
`;
for (const [name, id, step] of BODIES) {
  const all = await elements(id);
  const every = step / BASE_STEP;
  const rows = all.filter((_, k) => k % every === 0);
  out += `  ${name}: {\n    start: ${rows[0].jd},\n    step: ${step},\n    rows: [\n`;
  for (const r of rows)
    out += `      [${fix(r.a, 5)}, ${fix(r.e, 5)}, ${fix(r.i, 3)}, ${fix(r.O, 3)}, ${fix(r.w, 3)}, ${fix(r.M, 3)}],\n`;
  out += '    ],\n  },\n';
  console.log(`${name}: ${rows.length} rows`);
}
out += '};\n';
writeFileSync('src/astro/orbits.ts', out);
