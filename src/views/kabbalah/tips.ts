// Kabbalah tab: what its tooltips say.
import { Hebrew } from '#astro';
import { row } from '#lib/format.ts';
import { tips } from '#lib/state.ts';

function tipSefira(i: number) {
  const [he, tr, en, desc] = Hebrew.SEFIROT[i];
  let h = `<div class="th"><span class="he" lang="he">${he}</span> ${tr} · ${en}</div><div class="tplain">${desc}</div>`;
  const days = Hebrew.DAY_SEFIRA.map((s, d) => (s === i ? Hebrew.DAY_NAMES[d] : null)).filter(Boolean);
  if (days.length) h += row('Day of the week', days.join(', '));
  h += row('Position', `${i + 1} of 10${i < 3 ? ' · intellect' : i < 6 ? ' · emotion' : ' · action'}`);
  return h;
}

tips['kb-sefira'] = (v) => tipSefira(+v);
