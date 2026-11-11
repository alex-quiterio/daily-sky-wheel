// Vedic tab: SVG drawing.
import * as Vedic from '#astro/vedic.ts';
import { el } from '#lib/dom.ts';
import { vdLast } from '#views/vedic/model.ts';

export function drawRashi(svg: SVGSVGElement, style: string) {
  if (!vdLast) return;
  const { g, lagnaSign } = vdLast;
  svg.innerHTML = '';
  const bySign: Record<number, Vedic.Graha[]> = {};
  g.list.forEach((x) => {
    (bySign[x.sign] = bySign[x.sign] || []).push(x);
  });
  const label = (x: Vedic.Graha) =>
    Vedic.GRAHAS.find((q) => q[0] === x.key)![3] + (x.retro && x.key !== 'Rahu' && x.key !== 'Ketu' ? 'ᴿ' : '');
  const planets = (sign: number, cx: number, cy: number, maxW: number) => {
    const list = bySign[sign] || [];
    list.forEach((x, k) => {
      const perRow = maxW < 70 ? 2 : 3,
        row = Math.floor(k / perRow),
        col = k % perRow,
        n = Math.min(perRow, list.length - row * perRow);
      el(
        'text',
        {
          x: cx + (col - (n - 1) / 2) * 30,
          y: cy + row * 18,
          'text-anchor': 'middle',
          'dominant-baseline': 'central',
          'font-size': 14,
          'font-weight': 600,
          fill:
            x.dignity === 'Exalted' || x.dignity === 'Own sign'
              ? 'var(--gold-bright)'
              : x.dignity === 'Debilitated'
                ? 'var(--fire)'
                : 'var(--ink)',
          'font-family': 'var(--f-data)',
          'data-tip': `vd-graha:${x.key}`,
          class: 'tipzone',
        },
        svg,
        label(x),
      );
    });
  };
  const stroke = { fill: 'none', stroke: 'var(--gold)', 'stroke-width': 1.4 };
  el(
    'rect',
    {
      x: 2,
      y: 2,
      width: 396,
      height: 396,
      rx: 6,
      fill: 'var(--wheel-bg)',
      'fill-opacity': 0.6,
      stroke: 'var(--gold)',
      'stroke-width': 1.6,
    },
    svg,
  );
  if (style === 'north') {
    el('path', { d: 'M2 2 L398 398 M398 2 L2 398 M200 2 L398 200 L200 398 L2 200 Z', ...stroke }, svg);
    const C = [
      [200, 100],
      [100, 40],
      [40, 100],
      [100, 200],
      [40, 300],
      [100, 360],
      [200, 300],
      [300, 360],
      [360, 300],
      [300, 200],
      [360, 100],
      [300, 40],
    ];
    const N = [
      [200, 168],
      [100, 82],
      [82, 100],
      [168, 200],
      [82, 300],
      [100, 318],
      [200, 232],
      [300, 318],
      [318, 300],
      [232, 200],
      [318, 100],
      [300, 82],
    ];
    for (let hNum = 0; hNum < 12; hNum++) {
      const sign = (lagnaSign + hNum) % 12;
      el(
        'text',
        {
          x: N[hNum][0],
          y: N[hNum][1],
          'text-anchor': 'middle',
          'dominant-baseline': 'central',
          'font-size': 12,
          fill: 'var(--muted)',
          'font-family': 'var(--f-data)',
          'data-tip': `vd-rashi:${sign}`,
          class: 'tipzone',
        },
        svg,
        String(sign + 1),
      );
      const big = hNum % 3 === 0;
      planets(sign, C[hNum][0], C[hNum][1] - (big ? 10 : 6), big ? 120 : 60);
    }
    el(
      'text',
      {
        x: 200,
        y: 124,
        'text-anchor': 'middle',
        'font-size': 11,
        fill: 'var(--gold-bright)',
        'font-family': 'var(--f-display)',
        'letter-spacing': '0.15em',
      },
      svg,
      'LAGNA',
    );
  } else {
    // South Indian: fixed signs, Pisces at the top left
    const cells: Record<number, [column: number, row: number]> = {
      11: [0, 0],
      0: [1, 0],
      1: [2, 0],
      2: [3, 0],
      10: [0, 1],
      3: [3, 1],
      9: [0, 2],
      4: [3, 2],
      8: [0, 3],
      7: [1, 3],
      6: [2, 3],
      5: [3, 3],
    };
    for (let sign = 0; sign < 12; sign++) {
      const [cx, cy] = cells[sign],
        x = 2 + cx * 99,
        y = 2 + cy * 99;
      el(
        'rect',
        {
          x,
          y,
          width: 99,
          height: 99,
          ...stroke,
          'stroke-width': 1,
          'data-tip': `vd-rashi:${sign}`,
          class: 'tipzone',
          fill: sign === lagnaSign ? 'rgba(255,190,90,0.08)' : 'rgba(0,0,0,0)',
        },
        svg,
      );
      el(
        'text',
        {
          x: x + 6,
          y: y + 13,
          'font-size': 10.5,
          fill: 'var(--muted)',
          'font-family': 'var(--f-body)',
          'pointer-events': 'none',
        },
        svg,
        Vedic.RASHIS[sign][1],
      );
      if (sign === lagnaSign)
        el('path', { d: `M${x} ${y + 26} L${x + 26} ${y}`, stroke: 'var(--gold-bright)', 'stroke-width': 1.6 }, svg);
      planets(sign, x + 49.5, y + 48, 99);
    }
    el(
      'text',
      {
        x: 200,
        y: 190,
        'text-anchor': 'middle',
        'font-size': 26,
        fill: 'var(--gold-bright)',
        'font-family': 'var(--f-dev)',
      },
      svg,
      'राशि',
    );
    el(
      'text',
      {
        x: 200,
        y: 222,
        'text-anchor': 'middle',
        'font-size': 11,
        fill: 'var(--muted)',
        'font-family': 'var(--f-display)',
        'letter-spacing': '0.14em',
      },
      svg,
      'LAHIRI · WHOLE SIGN',
    );
  }
}
