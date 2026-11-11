// Vedic tab: the shapes its model and components share.
import type { Vedic, Reading } from '#astro';

export interface Model {
  title: string;
  p: ReturnType<typeof Vedic.panchang>;
  g: ReturnType<typeof Vedic.grahas>;
  lagna: number; // sidereal longitude of the Ascendant
  lagnaSign: number;
  month: ReturnType<typeof Vedic.lunarMonth>;
  vara: number; // the Vedic weekday, which turns at sunrise
  periods: ReturnType<typeof Vedic.periods>;
  dashas: Vedic.Dasha[];
  reading: Reading;
}
