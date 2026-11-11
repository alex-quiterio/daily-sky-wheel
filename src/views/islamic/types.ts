// Islamic tab: the shapes its model and components share.
import type { Islamic } from '#astro';

type Times = ReturnType<typeof Islamic.prayerTimes>;

export type PrayerKey = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export interface Model {
  times: Times;
  method: string;
  asr: number;
  after: boolean; // the Hijri day already turned at Maghrib
  h: ReturnType<typeof Islamic.hijriDate>;
  current: PrayerKey | null;
  next: [key: PrayerKey, english: string, arabic: string] | undefined;
  qibla: ReturnType<typeof Islamic.qibla>;
}
