// Kabbalah tab: the shapes its model and components share.
import type { Hebrew } from '#astro';

export interface Model {
  h: Hebrew.HebrewDate;
  after: boolean; // the Hebrew day already turned at sunset
  today: { sunset?: Date; nightfall?: Date };
  omer: ReturnType<typeof Hebrew.omer>;
}
