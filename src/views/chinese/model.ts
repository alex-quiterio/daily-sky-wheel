// Chinese tab: everything worked out for one moment, as plain data. No markup here.
import { Chinese } from '#astro';
import type { Moment } from '#lib/types.ts';
import type { Model } from '#views/chinese/types.ts';

export const polarity = (yang: boolean) => (yang ? 'Yang' : 'Yin');

export let cn: Model | null = null; // the chart the tooltips describe

export function build({ when, local }: Moment): Model {
  const p = Chinese.fourPillars(when, local);
  const lun = Chinese.lunarDate(when);
  const terms = Chinese.solarTerms(when);
  const dm = p.day.stem;
  const zodiac = Chinese.pillar(lun.year - 4);
  cn = {
    p,
    dm,
    lun,
    terms,
    zodiac,
  };
  return cn;
}
