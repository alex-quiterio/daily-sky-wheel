// Chart calculations. Needs global `Astronomy` (astronomy-engine 2.1.19).
import * as Astronomy from 'astronomy-engine';

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

export interface Chart {
  date: Date;
  lat: number;
  lon: number;
  system: HouseSystem;
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

// Osculating elements, J2000 ecliptic. M0 (mean anomaly at EPOCH, JD TT) was fitted against a
// reference chart for 2026-11-09 07:02 UTC. Good to a few arcminutes around 2024-2029; drifts further out.
const EPOCH = 2461353.5; // 2026-11-09 0h
interface Orbit {
  a: number;
  e: number;
  i: number;
  O: number;
  w: number;
  M0: number;
}
const MINOR: Record<string, Orbit> = {
  Chiron: { a: 13.692, e: 0.3789, i: 6.926, O: 209.3, w: 339.25, M0: 219.7 },
  Ceres: { a: 2.767, e: 0.0789, i: 10.588, O: 80.25, w: 73.3, M0: 307.15 },
  Pallas: { a: 2.7704, e: 0.2303, i: 34.93, O: 172.9, w: 310.9, M0: 286.96 },
  Juno: { a: 2.6688, e: 0.2563, i: 12.99, O: 169.85, w: 247.9, M0: 297.32 },
  Vesta: { a: 2.3615, e: 0.0886, i: 7.14, O: 103.8, w: 151.5, M0: 122.77 },
};

function jdTT(date: Date) {
  return Astronomy.MakeTime(date).tt + 2451545.0;
}

function helioMinor(el: Orbit, date: Date) {
  const t = Astronomy.MakeTime(date);
  const jd = t.tt + 2451545.0;
  const n = 0.9856076686 / Math.pow(el.a, 1.5);
  const M = norm(el.M0 + n * (jd - EPOCH)) * D2R;
  let E = M;
  for (let k = 0; k < 30; k++) E = E - (E - el.e * Math.sin(E) - M) / (1 - el.e * Math.cos(E));
  const xv = el.a * (Math.cos(E) - el.e),
    yv = el.a * Math.sqrt(1 - el.e * el.e) * Math.sin(E);
  const v = Math.atan2(yv, xv),
    r = Math.hypot(xv, yv);
  const O = el.O * D2R,
    w = el.w * D2R,
    i = el.i * D2R,
    u = v + w;
  const x = r * (Math.cos(O) * Math.cos(u) - Math.sin(O) * Math.sin(u) * Math.cos(i));
  const y = r * (Math.sin(O) * Math.cos(u) + Math.cos(O) * Math.sin(u) * Math.cos(i));
  const z = r * Math.sin(u) * Math.sin(i);
  // ecliptic J2000 -> EQJ
  const eps = 23.4392911 * D2R;
  return new Astronomy.Vector(x, y * Math.cos(eps) - z * Math.sin(eps), y * Math.sin(eps) + z * Math.cos(eps), t);
}

function minorLon(name: string, date: Date): number {
  const t = Astronomy.MakeTime(date);
  const p = helioMinor(MINOR[name], date);
  const e = Astronomy.HelioVector(Astronomy.Body.Earth, t);
  const g = new Astronomy.Vector(p.x - e.x, p.y - e.y, p.z - e.z, t);
  return Astronomy.Ecliptic(g).elon;
}

// ecliptic latitude (degrees); 0 for the calculated points
const body = (name: string) => Astronomy.Body[name as keyof typeof Astronomy.Body];

function latOf(name: string, date: Date): number {
  if (name === 'Sun') return Astronomy.SunPosition(date).elat;
  if (name === 'Moon') return Astronomy.EclipticGeoMoon(date).lat;
  if (MAJOR.includes(name)) return Astronomy.Ecliptic(Astronomy.GeoVector(body(name), date, true)).elat;
  if (MINOR[name]) {
    const t = Astronomy.MakeTime(date),
      p = helioMinor(MINOR[name], date),
      e = Astronomy.HelioVector(Astronomy.Body.Earth, t);
    return Astronomy.Ecliptic(new Astronomy.Vector(p.x - e.x, p.y - e.y, p.z - e.z, t)).elat;
  }
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
  if (MINOR[name]) return minorLon(name, date);
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
  if (name === 'Lilith') return norm(83.3532465 + 4069.0137287 * T - 0.01032 * T * T + 180);
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

function chart(date: Date, lat: number, lon: number, system: HouseSystem): Chart {
  const eps = obliquity(date);
  const pts = BODIES.map((name): Point => {
    const l = lonOf(name, date);
    const s = speed(name, date);
    const lat = latOf(name, date);
    return { name, lon: l, lat, decl: declination(l, lat, eps), speed: s, retro: s < 0 };
  });
  const ramc = norm(Astronomy.SiderealTime(date) * 15 + lon);
  const asc = ascFrom(ramc, eps, lat),
    mc = mcFrom(ramc, eps);
  const vertex = ascFrom(norm(ramc + 180), eps, 90 - lat); // Ascendant of the co-latitude, from the IC
  const cusps = houses(system, asc, mc, ramc, eps, lat);
  return { date, lat, lon, system, pts, asc, mc, vertex, cusps, ramc, eps };
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

export { houseOf, chart, lonOf, latOf, declination, speed, MINOR, EPOCH, norm, BODIES, minorLon };
