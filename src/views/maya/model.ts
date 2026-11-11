// Maya tab: everything worked out for one moment, as plain data. No markup here.
import * as Maya from '#astro/maya.ts';
import * as MayaReading from '#astro/maya-reading.ts';
import type { Moment } from '#lib/types.ts';
import { dateFormat } from '#lib/time.ts';
import type { Model } from '#views/maya/types.ts';

export function build({ local }: Moment): Model {
  const r = Maya.mayaDate(local.y, local.m, local.d);
  return {
    r,
    reading: MayaReading.read(r),
  };
}

export const utcDate = (d: Date, year = false) =>
  dateFormat('en-GB', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'short',
    ...(year ? { year: 'numeric' } : {}),
  }).format(d);
