// Western tab: fixed lists and colours.
import type { HouseSystem } from '#astro';

// ---------- the wheel ----------
export const SYSTEMS: [value: HouseSystem, label: string][] = [
  ['placidus', 'Placidus'],
  ['whole', 'Whole sign'],
  ['equal', 'Equal'],
  ['natural', 'Natural'],
];

// ---------- year ahead ----------
export const YEAR_CATS: [cat: string, label: string][] = [
  ['all', 'All'],
  ['eclipse', 'Eclipses'],
  ['retro', 'Stations'],
  ['ingress', 'Ingresses'],
  ['aspect', 'Outer aspects'],
  ['venus', 'Venus'],
  ['season', 'Seasons'],
];
