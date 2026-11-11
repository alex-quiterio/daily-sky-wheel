// Islamic tab: SVG drawing.
import { el } from '#lib/dom.ts';

export function drawQibla(svg: SVGSVGElement, bearing: number) {
  svg.innerHTML = '';
  const c = 150,
    R = 128;
  el(
    'circle',
    { cx: c, cy: c, r: R, fill: 'var(--wheel-bg)', 'fill-opacity': 0.7, stroke: 'var(--gold)', 'stroke-width': 1.4 },
    svg,
  );
  el('circle', { cx: c, cy: c, r: R - 22, fill: 'none', stroke: 'var(--rule)' }, svg);
  // eight-pointed star rosette at the centre
  for (const rot of [0, 45])
    el(
      'rect',
      {
        x: c - 34,
        y: c - 34,
        width: 68,
        height: 68,
        fill: 'none',
        stroke: 'var(--gold)',
        'stroke-opacity': 0.55,
        transform: `rotate(${rot} ${c} ${c})`,
      },
      svg,
    );
  for (let d = 0; d < 360; d += 10) {
    const a = ((d - 90) * Math.PI) / 180,
      len = d % 90 === 0 ? 14 : d % 30 === 0 ? 9 : 5;
    el(
      'line',
      {
        x1: c + R * Math.cos(a),
        y1: c + R * Math.sin(a),
        x2: c + (R - len) * Math.cos(a),
        y2: c + (R - len) * Math.sin(a),
        stroke: 'var(--muted)',
        'stroke-width': d % 90 === 0 ? 1.6 : 0.8,
      },
      svg,
    );
  }
  (
    [
      ['N', 0],
      ['E', 90],
      ['S', 180],
      ['W', 270],
    ] as [string, number][]
  ).forEach(([l, d]) => {
    const a = ((d - 90) * Math.PI) / 180;
    el(
      'text',
      {
        x: c + (R - 30) * Math.cos(a),
        y: c + (R - 30) * Math.sin(a),
        'text-anchor': 'middle',
        'dominant-baseline': 'central',
        'font-size': 14,
        fill: l === 'N' ? 'var(--gold-bright)' : 'var(--muted)',
        'font-family': 'var(--f-display)',
      },
      svg,
      l,
    );
  });
  const g = el(
    'g',
    { class: 'qibla-needle', style: `transform-origin:${c}px ${c}px; transform: rotate(${bearing}deg)` },
    svg,
  );
  el(
    'path',
    {
      d: `M${c} ${c - R + 18} L${c + 9} ${c} L${c} ${c + 14} L${c - 9} ${c} Z`,
      fill: 'var(--gold-bright)',
      stroke: 'var(--gold)',
      filter: 'drop-shadow(0 0 6px rgba(246,220,142,0.6))',
    },
    g,
  );
  el(
    'rect',
    {
      x: c - 9,
      y: c - R - 2,
      width: 18,
      height: 18,
      rx: 2,
      fill: '#101418',
      stroke: 'var(--gold-bright)',
      'stroke-width': 1.5,
    },
    g,
  );
  el('rect', { x: c - 9, y: c - R + 2, width: 18, height: 3, fill: 'var(--gold-bright)' }, g);
  el('circle', { cx: c, cy: c, r: 4, fill: 'var(--wheel-core)', stroke: 'var(--gold-bright)' }, svg);
}
