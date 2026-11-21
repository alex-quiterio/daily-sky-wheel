// Solar System tab: everything worked out for one moment, as plain data. No markup here.
import * as Astronomy from 'astronomy-engine';
import * as Core from '#astro/core.ts';
import * as Western from '#astro/western.ts';
import type { Moment } from '#lib/types.ts';
import { ELEMENTS, KM_PER_AU, PLANETS } from '#views/solar/constants.ts';
import type { Body, Model } from '#views/solar/types.ts';

const toEcl = Astronomy.Rotation_EQJ_ECL();

// fraction of the orbit since perihelion, from the body's true longitude and its mean elements
function progress(name: string, lon: number): number {
  const [, e, , , peri] = ELEMENTS[name];
  const v = (Core.norm(lon - peri) * Math.PI) / 180; // true anomaly, near enough
  const E = 2 * Math.atan(Math.sqrt((1 - e) / (1 + e)) * Math.tan(v / 2));
  const M = E - e * Math.sin(E);
  return Core.norm((M * 180) / Math.PI) / 360;
}

export function build({ when, byName, chart }: Moment): Model {
  const t = Astronomy.MakeTime(when);
  const bodies: Body[] = PLANETS.map((name) => {
    const b = Astronomy.Body[name as keyof typeof Astronomy.Body];
    const st = Astronomy.HelioState(b, t);
    const v = Astronomy.RotateVector(toEcl, new Astronomy.Vector(st.x, st.y, st.z, t));
    const ecl = Astronomy.Ecliptic(new Astronomy.Vector(st.x, st.y, st.z, t));
    const sun = Math.hypot(st.x, st.y, st.z);
    const speed = (Math.hypot(st.vx, st.vy, st.vz) * KM_PER_AU) / 86400;
    const earthBody = name === 'Earth';
    const geo = earthBody ? null : Astronomy.GeoVector(b, t, true);
    const p = byName[name];
    return {
      name,
      x: v.x,
      y: v.y,
      z: v.z,
      lon: ecl.elon,
      lat: ecl.elat,
      sun,
      earth: geo ? geo.Length() : 0,
      geoLon: p ? p.lon : Core.norm(ecl.elon + 180),
      retro: p ? p.retro : false,
      speed,
      progress: progress(name, ecl.elon),
    };
  });
  const map = Object.fromEntries(bodies.map((b) => [b.name, b]));
  const others = bodies.filter((b) => b.name !== 'Earth');
  const sunLon = byName.Sun.lon,
    moonLon = byName.Moon.lon;
  return {
    bodies,
    byName: map,
    moon: {
      geoLon: moonLon,
      km: Astronomy.GeoMoon(t).Length() * KM_PER_AU,
      phase: Western.moonPhase(sunLon, moonLon),
      sunLon,
      lilith: byName.Lilith.lon,
      lilithKind: chart.lilith,
    },
    closest: others.reduce((a, b) => (b.earth < a.earth ? b : a)),
  };
}
