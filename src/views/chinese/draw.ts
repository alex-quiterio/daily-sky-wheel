// Chinese tab: SVG drawing.
import * as Chinese from '#astro/chinese.ts';
import { el } from '#lib/dom.ts';
import { EL_COLOR } from '#views/chinese/constants.ts';

export function drawAnimalWheel(svg: SVGSVGElement, p: Chinese.FourPillars) {
  svg.innerHTML = '';
  const c = 200,
    R0 = 196,
    R1 = 128,
    R2 = 74;
  const ang = (b: number, off = 0) => ((-90 + b * 30 + off) * Math.PI) / 180; // Rat at the top, clockwise
  const P = (b: number, r: number, off = 0): [number, number] => [
    c + r * Math.cos(ang(b, off)),
    c + r * Math.sin(ang(b, off)),
  ];
  el(
    'circle',
    { cx: c, cy: c, r: R0, fill: 'var(--wheel-bg)', 'fill-opacity': 0.85, stroke: 'var(--gold)', 'stroke-width': 1.2 },
    svg,
  );
  const marks: Record<number, string[]> = {};
  const pillars: [mark: string, pillar: Chinese.Pillar][] = [
    ['Y', p.year],
    ['M', p.month],
    ['D', p.day],
    ['H', p.hour],
  ];
  pillars.forEach(([k, x]) => {
    (marks[x.branch] = marks[x.branch] || []).push(k);
  });
  for (let b = 0; b < 12; b++) {
    const [ch, , animal, elx] = Chinese.BRANCHES[b];
    const [x0, y0] = P(b, R0, -15),
      [x1, y1] = P(b, R0, 15),
      [x2, y2] = P(b, R2, 15),
      [x3, y3] = P(b, R2, -15);
    const on = marks[b];
    el(
      'path',
      {
        d: `M${x0} ${y0} A${R0} ${R0} 0 0 1 ${x1} ${y1} L${x2} ${y2} A${R2} ${R2} 0 0 0 ${x3} ${y3}Z`,
        fill: EL_COLOR[elx],
        'fill-opacity': on ? 0.26 : 0.08,
        stroke: 'var(--rule)',
        'stroke-width': 1,
        'data-tip': `cn-branch:${b}`,
        class: 'tipzone',
      },
      svg,
    );
    const [tx, ty] = P(b, (R0 + R1) / 2 + 4);
    el(
      'text',
      {
        x: tx,
        y: ty,
        'text-anchor': 'middle',
        'dominant-baseline': 'central',
        'font-size': 32,
        fill: EL_COLOR[elx],
        'font-family': 'var(--f-brush)',
        'data-tip': `cn-branch:${b}`,
        class: 'tipzone',
        tabindex: 0,
        'aria-label': `${animal} details`,
      },
      svg,
      ch,
    );
    const [ax, ay] = P(b, R1 - 14);
    el(
      'text',
      {
        x: ax,
        y: ay,
        'text-anchor': 'middle',
        'dominant-baseline': 'central',
        'font-size': 12.5,
        fill: on ? 'var(--ink)' : 'var(--muted)',
        'font-family': 'var(--f-body)',
        'pointer-events': 'none',
      },
      svg,
      animal,
    );
    if (on) {
      const [mx, my] = P(b, R2 + 16);
      el(
        'text',
        {
          x: mx,
          y: my,
          'text-anchor': 'middle',
          'dominant-baseline': 'central',
          'font-size': 11,
          'font-weight': 600,
          fill: 'var(--gold-bright)',
          'font-family': 'var(--f-data)',
          'pointer-events': 'none',
        },
        svg,
        on.join(''),
      );
    }
  }
  el('circle', { cx: c, cy: c, r: R1, fill: 'none', stroke: 'var(--rule)' }, svg);
  el('circle', { cx: c, cy: c, r: R2, fill: 'url(#cnCore)', stroke: 'var(--gold)' }, svg);
  const defs = el('defs', {}, svg);
  const grad = el('radialGradient', { id: 'cnCore' }, defs);
  el('stop', { offset: '0%', style: 'stop-color:var(--nebula-1);stop-opacity:0.6' }, grad);
  el('stop', { offset: '100%', style: 'stop-color:var(--wheel-core);stop-opacity:1' }, grad);
  // day clash line
  const [cx0, cy0] = P(p.day.branch, R2),
    [cx1, cy1] = P((p.day.branch + 6) % 12, R2);
  el(
    'line',
    {
      x1: cx0,
      y1: cy0,
      x2: cx1,
      y2: cy1,
      stroke: 'var(--fire)',
      'stroke-width': 1.2,
      'stroke-dasharray': '4 4',
      'stroke-opacity': 0.8,
    },
    svg,
  );
  const yb = Chinese.BRANCHES[p.year.branch];
  el(
    'text',
    {
      x: c,
      y: c - 10,
      'text-anchor': 'middle',
      'dominant-baseline': 'central',
      'font-size': 38,
      fill: 'var(--gold-bright)',
      'font-family': 'var(--f-brush)',
    },
    svg,
    Chinese.STEMS[p.year.stem][0] + yb[0],
  );
  el(
    'text',
    {
      x: c,
      y: c + 22,
      'text-anchor': 'middle',
      'dominant-baseline': 'central',
      'font-size': 12,
      fill: 'var(--muted)',
      'font-family': 'var(--f-display)',
      'letter-spacing': '0.12em',
    },
    svg,
    yb[2].toUpperCase(),
  );
}
