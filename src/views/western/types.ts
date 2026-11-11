// Western tab: the shapes its model and components share.
import type { DayEvent, MoonPhase, Pattern, Reading } from '#astro';

export interface Model {
  title: string; // the page title: the day's lunation, or the Moon's sign
  events: DayEvent[];
  phase: MoonPhase;
  moonSign: string;
  pats: Pattern[];
  reading: Reading;
}
