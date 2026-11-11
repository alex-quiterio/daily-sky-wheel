// Maya tab: the shapes its model and components share.
import type { Maya, Reading } from '#astro';

export type MayaDate = ReturnType<typeof Maya.mayaDate>;

export interface Model {
  r: MayaDate;
  reading: Reading;
}
