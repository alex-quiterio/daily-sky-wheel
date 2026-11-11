// Islamic tab: fixed lists and colours.
import type { PrayerKey } from '#views/islamic/types.ts';

export const PRAYERS: [key: PrayerKey, english: string, arabic: string][] = [
  ['fajr', 'Fajr', 'الفجر'],
  ['sunrise', 'Sunrise', 'الشروق'],
  ['dhuhr', 'Dhuhr', 'الظهر'],
  ['asr', 'Asr', 'العصر'],
  ['maghrib', 'Maghrib', 'المغرب'],
  ['isha', 'Isha', 'العشاء'],
];
