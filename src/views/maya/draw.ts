// Maya tab: SVG drawing.
import * as Maya from '#astro/maya.ts';
import { el, one } from '#lib/dom.ts';
import { DIR_COLOR } from '#views/maya/constants.ts';
import type { MayaDate } from '#views/maya/types.ts';

let gearAngles: { a20: number; a13: number } | null = null; // cumulative rotation so the gears always turn the short way

function gearPath(cx: number, cy: number, r: number, teeth: number, depth: number) {
  let d = '';
  const step = (Math.PI * 2) / teeth;
  for (let i = 0; i < teeth; i++) {
    const a = i * step - step / 2;
    const pts = [
      [a, r - depth],
      [a + step * 0.18, r],
      [a + step * 0.5, r],
      [a + step * 0.68, r - depth],
    ];
    pts.forEach(([ang, rad], k) => {
      const x = cx + rad * Math.cos(ang),
        y = cy + rad * Math.sin(ang);
      d += (i === 0 && k === 0 ? 'M' : 'L') + x.toFixed(2) + ' ' + y.toFixed(2);
    });
  }
  return d + 'Z';
}

export function drawGears(svg: SVGSVGElement, r: MayaDate) {
  const g20 = { cx: 290, cy: 150, r: 132 },
    g13 = { cx: 88, cy: 150, r: 74 };
  if (!svg.querySelector('.gear20')) {
    svg.innerHTML = '';
    // 20 day-sign gear
    const a = el('g', { class: 'gear gear20', style: `transform-origin:${g20.cx}px ${g20.cy}px` }, svg);
    el(
      'path',
      { d: gearPath(g20.cx, g20.cy, g20.r, 20, 12), fill: 'var(--gear-a)', stroke: 'var(--gold)', 'stroke-width': 1.2 },
      a,
    );
    el('circle', { cx: g20.cx, cy: g20.cy, r: g20.r - 66, fill: 'var(--wheel-core)', stroke: 'var(--rule)' }, a);
    for (let i = 0; i < 20; i++) {
      const ang = (i * 18 * Math.PI) / 180;
      const x = g20.cx + (g20.r - 34) * Math.cos(ang),
        y = g20.cy + (g20.r - 34) * Math.sin(ang);
      const col = DIR_COLOR[Maya.DIRECTIONS[i % 4][1]];
      el(
        'text',
        {
          x,
          y,
          'text-anchor': 'middle',
          'dominant-baseline': 'central',
          'font-size': 12.5,
          fill: col,
          'font-family': 'var(--f-body)',
          transform: `rotate(${i * 18} ${x} ${y})`,
          'data-tip': `my-sign:${i}`,
          class: 'tipzone',
        },
        a,
        Maya.SIGNS[i][0],
      );
    }
    el(
      'text',
      {
        x: g20.cx,
        y: g20.cy - 8,
        'text-anchor': 'middle',
        'font-size': 13,
        fill: 'var(--muted)',
        'font-family': 'var(--f-display)',
        'letter-spacing': '0.15em',
      },
      svg,
      '20 SIGNS',
    );
    // 13 number gear
    const b = el('g', { class: 'gear gear13', style: `transform-origin:${g13.cx}px ${g13.cy}px` }, svg);
    el(
      'path',
      { d: gearPath(g13.cx, g13.cy, g13.r, 13, 10), fill: 'var(--gear-b)', stroke: 'var(--gold)', 'stroke-width': 1.2 },
      b,
    );
    el('circle', { cx: g13.cx, cy: g13.cy, r: g13.r - 40, fill: 'var(--wheel-core)', stroke: 'var(--rule)' }, b);
    for (let j = 0; j < 13; j++) {
      const ang = (((j * 360) / 13) * Math.PI) / 180;
      const x = g13.cx + (g13.r - 24) * Math.cos(ang),
        y = g13.cy + (g13.r - 24) * Math.sin(ang);
      el(
        'text',
        {
          x,
          y,
          'text-anchor': 'middle',
          'dominant-baseline': 'central',
          'font-size': 14,
          'font-weight': 600,
          fill: 'var(--gold-bright)',
          'font-family': 'var(--f-data)',
          transform: `rotate(${(j * 360) / 13 + 90} ${x} ${y})`,
        },
        b,
        String(j + 1),
      );
    }
    el(
      'text',
      {
        x: g13.cx,
        y: g13.cy + 4,
        'text-anchor': 'middle',
        'font-size': 11,
        fill: 'var(--muted)',
        'font-family': 'var(--f-display)',
        'letter-spacing': '0.12em',
      },
      svg,
      '13',
    );
    // the meeting point
    const mx = (g13.cx + g13.r + g20.cx - g20.r) / 2;
    el('path', { d: `M${mx} 18 l-8 -12 h16 Z`, fill: 'var(--gold-bright)' }, svg);
    el(
      'line',
      { x1: mx, y1: 20, x2: mx, y2: 282, stroke: 'var(--gold)', 'stroke-dasharray': '2 5', 'stroke-opacity': 0.6 },
      svg,
    );
    el(
      'text',
      {
        x: mx,
        y: 296,
        'text-anchor': 'middle',
        'font-size': 12,
        fill: 'var(--gold-bright)',
        'font-family': 'var(--f-body)',
        class: 'gear-label',
      },
      svg,
      '',
    );
  }
  // turn: the current sign sits at 180° on the 20-gear, the current number at 0° on the 13-gear
  const t20 = 180 - r.tz.sign * 18,
    t13 = (-(r.tz.number - 1) * 360) / 13;
  const near = (prev: number, target: number) => prev + (((((target - prev) % 360) + 540) % 360) - 180);
  gearAngles = gearAngles ? { a20: near(gearAngles.a20, t20), a13: near(gearAngles.a13, t13) } : { a20: t20, a13: t13 };
  one<SVGGElement>('.gear20', svg).style.transform = `rotate(${gearAngles.a20}deg)`;
  one<SVGGElement>('.gear13', svg).style.transform = `rotate(${gearAngles.a13}deg)`;
  one('.gear-label', svg).textContent = `${r.tz.number} ${Maya.SIGNS[r.tz.sign][0]}`;
}
