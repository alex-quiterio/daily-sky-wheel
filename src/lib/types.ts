// The shapes the page and its tabs agree on. Every tab implements ViewDef; every component that
// draws a tab takes ViewProps. Strict type-checking of the page starts from this file.
import type { ComponentChildren, FunctionComponent } from 'preact';
import type { Aspect, Chart, GlossaryEntry, HouseSystem, Point, Reading } from '#astro';

export interface Place {
  name: string;
  lat: number;
  lon: number;
  tz: string;
}

// The chosen moment and place with its chart: what every view renders from
export interface Moment {
  when: Date;
  local: { y: number; m: number; d: number; hh: number; mm: number };
  place: Place;
  hsys: HouseSystem;
  chart: Chart;
  asps: Aspect[];
  byName: Record<string, Point>;
}

// The chart the tooltips describe
export interface ChartContext {
  chart: Chart;
  asps: Aspect[];
  byName: Record<string, Point>;
  place: Place;
  houseOf(lon: number): number; // 1-12
}

// What a view puts in the page header
export interface HeaderInfo {
  title: string;
  big3: ComponentChildren; // the three lines on the right
  seal?: string; // Chinese: the year's branch
  emblem?: { mark: ComponentChildren; title: string }; // Maya: the day number
  letter?: string; // Kabbalah: the month's letter
  day?: string; // Islamic: the day of the month
}

// What a tab's top component receives: the moment, and the model its build() made from it
export interface ViewProps<M> {
  moment: Moment;
  model: M;
}

// A tab. build() works everything out for a moment as plain data, header() says what the page
// header shows for it, and View draws it.
export interface ViewDef<M = unknown> {
  build(moment: Moment): M;
  header(model: M, moment: Moment): HeaderInfo;
  View: FunctionComponent<ViewProps<M>>;
}

// What the reading card needs
export interface ReadingCardProps {
  id: string;
  heading: ComponentChildren;
  reading: Reading;
  storageKey: string; // where the open sections are remembered
  open: string[]; // the sections unfolded on a first visit
  title: string; // the heading of a copied reading
  link: () => string; // the address of this moment, added to a copied reading
  note: string;
  glossary: GlossaryEntry[]; // the terms "Explain terms" can explain in this reading
}
