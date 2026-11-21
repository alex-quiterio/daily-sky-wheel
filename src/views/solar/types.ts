// Solar System tab: the shapes its model and components share.
import type { MoonPhase } from '#astro/western.ts';

export interface Body {
  name: string;
  x: number; // heliocentric, J2000 ecliptic, au
  y: number;
  z: number;
  lon: number; // heliocentric ecliptic longitude of date
  lat: number;
  sun: number; // distance from the Sun, au
  earth: number; // distance from the Earth, au (0 for the Earth)
  geoLon: number; // where it appears from the Earth, ecliptic longitude of date (the Earth: the Sun's opposite)
  retro: boolean;
  speed: number; // orbital speed, km/s
  progress: number; // fraction of the orbit since perihelion, 0-1
}

export interface MoonInfo {
  geoLon: number;
  km: number; // centre to centre
  phase: MoonPhase;
  sunLon: number; // the Sun as seen from the Earth
  lilith: number; // Black Moon Lilith, the Moon's apogee: mean or true, as chosen on the wheel
  lilithKind: 'mean' | 'true';
}

export interface Model {
  bodies: Body[];
  byName: Record<string, Body>;
  moon: MoonInfo;
  closest: Body; // the planet nearest the Earth
}
