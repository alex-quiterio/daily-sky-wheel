// Vedic tab: what its tooltips say.
import { Vedic } from '#astro';
import { pad, row } from '#lib/format.ts';
import { tips } from '#lib/state.ts';
import { DIGNITY_TIP } from '#views/vedic/constants.ts';
import { vdLast } from '#views/vedic/model.ts';

function tipNakshatra(i: number) {
  const [name, deity, meaning] = Vedic.NAKSHATRAS[i];
  const lords = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'];
  const from = (i * 360) / 27,
    sign = (x) =>
      `${Math.floor(x % 30)}°${pad(Math.round(((x % 30) % 1) * 60))}′ ${Vedic.RASHIS[Math.floor(x / 30)][1]}`;
  return `<div class="th">${i + 1}. ${name}</div><div class="tplain">${meaning}</div>${row('Deity', deity)}${row('Ruler', lords[i % 9])}${row('Span', `${sign(from)} – ${sign(from + 360 / 27 - 0.0001)}`)}`;
}

function tipRashi(sign: number) {
  const [en, skt, dev] = Vedic.RASHIS[sign];
  const lords = [
    'Mars',
    'Venus',
    'Mercury',
    'Moon',
    'Sun',
    'Mercury',
    'Venus',
    'Mars',
    'Jupiter',
    'Saturn',
    'Saturn',
    'Jupiter',
  ];
  const inside = vdLast
    ? vdLast.g.list
        .filter((x) => x.sign === sign)
        .map((x) => `${x.key} ${Math.floor(x.deg)}°`)
        .join(', ')
    : '';
  const house = vdLast ? ((sign - vdLast.lagnaSign + 12) % 12) + 1 : '';
  return `<div class="th"><span class="dev">${dev}</span> ${skt} · ${en}</div>${row('House', `H${house}`)}${row('Lord', lords[sign])}${inside ? row('Grahas', inside) : ''}`;
}

function tipGraha(key: string) {
  if (!vdLast) return '';
  const x = vdLast.g.list.find((q) => q.key === key);
  if (!x) return '';
  const [, skt, dev] = Vedic.GRAHAS.find((q) => q[0] === key);
  return `<div class="th"><span class="dev">${dev}</span> ${skt} · ${key}</div>${row('Position', `${Math.floor(x.deg)}°${pad(Math.floor((x.deg % 1) * 60))}′ ${Vedic.RASHIS[x.sign][1]}`)}${row('Nakshatra', `${Vedic.NAKSHATRAS[x.nak.i][0]} · pada ${x.nak.pada}`)}${row('House', `H${((x.sign - vdLast.lagnaSign + 12) % 12) + 1}`)}${x.dignity ? row('Dignity', x.dignity) : ''}${x.retro && key !== 'Rahu' && key !== 'Ketu' ? row('Motion', 'Retrograde (vakri)') : ''}`;
}

Object.assign(tips, {
  'vd-nak': (v: string) => tipNakshatra(+v),
  'vd-rashi': (v: string) => tipRashi(+v),
  'vd-graha': tipGraha,
  'vd-dig': (v: string) => DIGNITY_TIP[v] || '',
});
