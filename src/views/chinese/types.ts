// Chinese tab: the shapes its model and components share.
import type { Chinese, Reading } from '#astro';

export interface Model {
  p: Chinese.FourPillars;
  dm: number; // the Day Master: the day pillar's stem
  lun: ReturnType<typeof Chinese.lunarDate>;
  terms: ReturnType<typeof Chinese.solarTerms>;
  zodiac: Chinese.Pillar; // the lunar year, which turns at Chinese New Year
  reading: Reading;
}
