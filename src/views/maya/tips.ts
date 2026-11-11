// Maya tab: what its tooltips say.
import { Maya } from '#astro';
import { row } from '#lib/format.ts';
import { tips } from '#lib/state.ts';

function tipMayaSign(i: number) {
  const [name, eng, meaning] = Maya.SIGNS[i];
  const [dir, color] = Maya.DIRECTIONS[i % 4];
  let h = `<div class="th">${name} · ${eng}</div><div class="tplain">${meaning}</div>`;
  h += row('Direction', `${dir}, ${color.toLowerCase()}`);
  h += row('Position', `${i + 1} of 20`);
  return h;
}

tips['my-sign'] = (v) => tipMayaSign(+v);
