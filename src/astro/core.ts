// Chart calculations. Needs global `Astronomy` (astronomy-engine 2.1.19).
import * as Astronomy from 'astronomy-engine';
import { ORBITS } from './orbits.ts';

// One body or calculated point on the ecliptic
export interface Point {
  name: string;
  lon: number; // ecliptic longitude, 0-360
  lat: number; // ecliptic latitude
  decl: number; // declination
  speed: number; // degrees a day; negative when retrograde
  retro: boolean;
}

export type HouseSystem = 'placidus' | 'whole' | 'equal' | 'natural';
// which Black Moon Lilith the chart shows: the mean lunar apogee, or the true (osculating) one
export type LilithKind = 'mean' | 'true';

export interface Chart {
  date: Date;
  lat: number;
  lon: number;
  system: HouseSystem;
  lilith: LilithKind;
  pts: Point[];
  asc: number;
  mc: number;
  vertex: number;
  cusps: number[]; // twelve cusp longitudes, the 1st house first
  ramc: number;
  eps: number; // true obliquity of the ecliptic
}

const D2R = Math.PI / 180,
  R2D = 180 / Math.PI;
const norm = (x: number) => ((x % 360) + 360) % 360;

// Chiron and the asteroids: two-body orbits from the nearest row of JPL Horizons' osculating elements
// (astro/orbits.ts, 1900-2100). Outside that range the end rows are used, and the error grows with distance.
const GAUSS = 0.9856076686; // the Sun's mean motion at 1 au, degrees a day
const LIGHT_DAYS_PER_AU = 0.0057755183;

function jdTT(date: Date) {
  return Astronomy.MakeTime(date).tt + 2451545.0;
}

// whether a date falls inside the table of elements, where the positions are good to about an arcminute
function orbitsCover(date: Date) {
  const jd = jdTT(date);
  return Object.values(ORBITS).every((o) => jd >= o.start - o.step && jd <= o.start + o.step * o.rows.length);
}

// heliocentric position (au, EQJ axes) of a minor body at Julian Day `jd` (TT)
function helioMinor(name: string, jd: number): [number, number, number] {
  const o = ORBITS[name];
  const k = Math.min(o.rows.length - 1, Math.max(0, Math.round((jd - o.start) / o.step)));
  const [a, e, inc, node, peri, M0] = o.rows[k];
  const M = norm(M0 + (GAUSS / Math.pow(a, 1.5)) * (jd - (o.start + k * o.step))) * D2R;
  let E = M;
  for (let n = 0; n < 30; n++) E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  const xv = a * (Math.cos(E) - e),
    yv = a * Math.sqrt(1 - e * e) * Math.sin(E);
  const v = Math.atan2(yv, xv),
    r = Math.hypot(xv, yv);
  const O = node * D2R,
    w = peri * D2R,
    i = inc * D2R,
    u = v + w;
  const x = r * (Math.cos(O) * Math.cos(u) - Math.sin(O) * Math.sin(u) * Math.cos(i));
  const y = r * (Math.sin(O) * Math.cos(u) + Math.cos(O) * Math.sin(u) * Math.cos(i));
  const z = r * Math.sin(u) * Math.sin(i);
  // J2000 ecliptic -> EQJ
  const eps = 23.4392911 * D2R;
  return [x, y * Math.cos(eps) - z * Math.sin(eps), y * Math.sin(eps) + z * Math.cos(eps)];
}

// where a minor body appears from the Earth, on the ecliptic of date, allowing for the light's travel time
function minorEcliptic(name: string, date: Date) {
  const t = Astronomy.MakeTime(date),
    jd = t.tt + 2451545.0;
  const earth = Astronomy.HelioVector(Astronomy.Body.Earth, t);
  let p = helioMinor(name, jd);
  const dist = Math.hypot(p[0] - earth.x, p[1] - earth.y, p[2] - earth.z);
  p = helioMinor(name, jd - dist * LIGHT_DAYS_PER_AU);
  return Astronomy.Ecliptic(new Astronomy.Vector(p[0] - earth.x, p[1] - earth.y, p[2] - earth.z, t));
}

// True (osculating) Black Moon Lilith: the apogee of the ellipse the Moon would follow if only the Earth pulled
// on it, worked out from the Moon's position and velocity at this instant
const MU_EARTH_MOON = (403503.2357 * 86400 * 86400) / Math.pow(149597870.7, 3); // G(M+m), au^3 / day^2
function trueLilith(date: Date): number {
  const s = Astronomy.GeoMoonState(date);
  const r = [s.x, s.y, s.z],
    v = [s.vx, s.vy, s.vz];
  const cross = (p: number[], q: number[]) => [
    p[1] * q[2] - p[2] * q[1],
    p[2] * q[0] - p[0] * q[2],
    p[0] * q[1] - p[1] * q[0],
  ];
  const h = cross(r, v),
    vh = cross(v, h),
    rl = Math.hypot(r[0], r[1], r[2]);
  // the eccentricity vector points to perigee; apogee is the other way
  const ecc = [0, 1, 2].map((k) => vh[k] / MU_EARTH_MOON - r[k] / rl);
  return Astronomy.Ecliptic(new Astronomy.Vector(-ecc[0], -ecc[1], -ecc[2], s.t)).elon;
}

// ecliptic latitude (degrees); 0 for the calculated points
const body = (name: string) => Astronomy.Body[name as keyof typeof Astronomy.Body];

function latOf(name: string, date: Date): number {
  if (name === 'Sun') return Astronomy.SunPosition(date).elat;
  if (name === 'Moon') return Astronomy.EclipticGeoMoon(date).lat;
  if (MAJOR.includes(name)) return Astronomy.Ecliptic(Astronomy.GeoVector(body(name), date, true)).elat;
  if (ORBITS[name]) return minorEcliptic(name, date).elat;
  return 0;
}

function declination(lon: number, lat: number, eps: number) {
  const l = lon * D2R,
    b = lat * D2R,
    e = eps * D2R;
  return Math.asin(Math.sin(b) * Math.cos(e) + Math.cos(b) * Math.sin(e) * Math.sin(l)) * R2D;
}

const MAJOR = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];

function lonOf(name: string, date: Date): number {
  if (name === 'Sun') return Astronomy.SunPosition(date).elon;
  if (name === 'Moon') return Astronomy.EclipticGeoMoon(date).lon;
  if (MAJOR.includes(name)) return Astronomy.Ecliptic(Astronomy.GeoVector(body(name), date, true)).elon;
  if (ORBITS[name]) return minorEcliptic(name, date).elon;
  const T = (jdTT(date) - 2451545.0) / 36525;
  if (name === 'Node') {
    // true node (Meeus ch. 47 periodic terms)
    const Dm = (297.8501921 + 445267.1114034 * T) * D2R,
      Ms = (357.5291092 + 35999.0502909 * T) * D2R;
    const Mm = (134.9633964 + 477198.8675055 * T) * D2R,
      F = (93.272095 + 483202.0175233 * T) * D2R;
    const mean = 125.0445479 - 1934.1362891 * T + 0.0020754 * T * T;
    return norm(
      mean -
        1.4979 * Math.sin(2 * (Dm - F)) -
        0.15 * Math.sin(Ms) -
        0.1226 * Math.sin(2 * Dm) +
        0.1176 * Math.sin(2 * F) -
        0.0801 * Math.sin(2 * (Mm - F)),
    );
  }
  // mean Black Moon Lilith: the mean lunar apogee
  if (name === 'Lilith') return norm(83.3532465 + 4069.0137287 * T - 0.01032 * T * T + 180);
  if (name === 'TrueLilith') return trueLilith(date);
  throw new Error(name);
}

function speed(name: string, date: Date): number {
  const h = 0.25 * 86400000;
  const a = lonOf(name, new Date(date.getTime() - h)),
    b = lonOf(name, new Date(date.getTime() + h));
  let d = b - a;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d * 2; // deg/day
}

function obliquity(date: Date): number {
  // true obliquity: IAU mean obliquity plus the main nutation terms
  const T = (jdTT(date) - 2451545.0) / 36525;
  const eps0 = 23.43929111 - (46.815 * T + 0.00059 * T * T - 0.001813 * T * T * T) / 3600;
  const om = (125.04452 - 1934.136261 * T) * D2R,
    L = (280.4665 + 36000.7698 * T) * D2R,
    Lp = (218.3165 + 481267.8813 * T) * D2R;
  const deps = (9.2 * Math.cos(om) + 0.57 * Math.cos(2 * L) + 0.1 * Math.cos(2 * Lp) - 0.09 * Math.cos(2 * om)) / 3600;
  return eps0 + deps;
}

function ascFrom(ramc: number, eps: number, lat: number) {
  const r = ramc * D2R,
    e = eps * D2R,
    f = lat * D2R;
  return norm(Math.atan2(Math.cos(r), -(Math.sin(r) * Math.cos(e) + Math.tan(f) * Math.sin(e))) * R2D);
}
function mcFrom(ramc: number, eps: number) {
  const r = ramc * D2R,
    e = eps * D2R;
  return norm(Math.atan2(Math.sin(r), Math.cos(r) * Math.cos(e)) * R2D);
}

// Placidus: cusps 11/12 trisect the diurnal semi-arc above the horizon, 2/3 the nocturnal one below.
function placidus(ramc: number, eps: number, lat: number, asc: number, mc: number): number[] | null {
  if (Math.abs(lat) > 66) return null;
  const e = eps * D2R,
    f = lat * D2R;
  const raToLon = (ra: number) => norm(Math.atan2(Math.sin(ra * D2R), Math.cos(ra * D2R) * Math.cos(e)) * R2D);
  const diurnalArc = (lon: number) => {
    const dec = Math.asin(Math.sin(e) * Math.sin(lon * D2R));
    return Math.acos(Math.max(-1, Math.min(1, -Math.tan(f) * Math.tan(dec)))) * R2D;
  };
  const solve = (frac: number, above: boolean) => {
    let ra = norm(above ? ramc + frac * 90 : ramc + 180 - frac * 90);
    for (let k = 0; k < 50; k++) {
      const da = diurnalArc(raToLon(ra));
      const next = norm(above ? ramc + frac * da : ramc + 180 - frac * (180 - da));
      if (Math.abs(next - ra) < 1e-7) break;
      ra = next;
    }
    return raToLon(ra);
  };
  const c = new Array(13);
  c[1] = asc;
  c[10] = mc;
  c[4] = norm(mc + 180);
  c[7] = norm(asc + 180);
  c[11] = solve(1 / 3, true);
  c[12] = solve(2 / 3, true);
  c[3] = solve(1 / 3, false);
  c[2] = solve(2 / 3, false);
  c[5] = norm(c[11] + 180);
  c[6] = norm(c[12] + 180);
  c[8] = norm(c[2] + 180);
  c[9] = norm(c[3] + 180);
  return c.slice(1);
}

function houses(system: HouseSystem, asc: number, mc: number, ramc: number, eps: number, lat: number): number[] {
  if (system === 'natural') return Array.from({ length: 12 }, (_, k) => k * 30);
  if (system === 'whole') return Array.from({ length: 12 }, (_, k) => norm(Math.floor(asc / 30) * 30 + k * 30));
  if (system === 'equal') return Array.from({ length: 12 }, (_, k) => norm(asc + k * 30));
  return placidus(ramc, eps, lat, asc, mc) || Array.from({ length: 12 }, (_, k) => norm(asc + k * 30));
}

const BODIES = [
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
  'Node',
  'Lilith',
  'Ceres',
  'Pallas',
  'Juno',
  'Vesta',
];

function chart(date: Date, lat: number, lon: number, system: HouseSystem, lilith: LilithKind = 'mean'): Chart {
  const eps = obliquity(date);
  const pts = BODIES.map((name): Point => {
    const from = name === 'Lilith' && lilith === 'true' ? 'TrueLilith' : name; // still shown as Lilith
    const l = lonOf(from, date);
    const s = speed(from, date);
    const lat = latOf(from, date);
    return { name, lon: l, lat, decl: declination(l, lat, eps), speed: s, retro: s < 0 };
  });
  const ramc = norm(Astronomy.SiderealTime(date) * 15 + lon);
  const asc = ascFrom(ramc, eps, lat),
    mc = mcFrom(ramc, eps);
  const vertex = ascFrom(norm(ramc + 180), eps, 90 - lat); // Ascendant of the co-latitude, from the IC
  const cusps = houses(system, asc, mc, ramc, eps, lat);
  return { date, lat, lon, system, lilith, pts, asc, mc, vertex, cusps, ramc, eps };
}

// which house (1-12) a longitude falls in, given the twelve cusps
function houseOf(cusps: number[], lon: number) {
  for (let i = 0; i < 12; i++) {
    const a = cusps[i],
      b = cusps[(i + 1) % 12];
    if (norm(lon - a) < norm(b - a)) return i + 1;
  }
  return 1;
}

export { houseOf, chart, lonOf, latOf, declination, speed, norm, BODIES, orbitsCover };
