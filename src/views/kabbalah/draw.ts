// Kabbalah tab: SVG drawing.
import * as Hebrew from '#astro/hebrew.ts';
import { el } from '#lib/dom.ts';
import { TREE_PATHS, TREE_POS } from '#views/kabbalah/constants.ts';

export function drawTree(svg: SVGSVGElement, daySef: number, om: ReturnType<typeof Hebrew.omer>) {
  svg.innerHTML = '';
  const defs = el('defs', {}, svg);
  const gl = el('radialGradient', { id: 'kbGlow' }, defs);
  el('stop', { offset: '0%', style: 'stop-color:var(--kb-light);stop-opacity:0.95' }, gl);
  el('stop', { offset: '60%', style: 'stop-color:var(--gold);stop-opacity:0.35' }, gl);
  el('stop', { offset: '100%', style: 'stop-color:var(--gold);stop-opacity:0' }, gl);
  const lit = new Set([daySef]);
  if (om) {
    lit.add(om.inner);
    lit.add(om.outer);
  }
  TREE_PATHS.forEach(([a, b]) => {
    const on = lit.has(a) && lit.has(b);
    el(
      'line',
      {
        x1: TREE_POS[a][0],
        y1: TREE_POS[a][1],
        x2: TREE_POS[b][0],
        y2: TREE_POS[b][1],
        stroke: on ? 'var(--gold-bright)' : 'var(--kb-path)',
        'stroke-width': on ? 3 : 2,
        'stroke-linecap': 'round',
        class: 'kb-path',
      },
      svg,
    );
  });
  // Da'at, the hidden sefira
  el('circle', { cx: 180, cy: 160, r: 16, fill: 'none', stroke: 'var(--rule)', 'stroke-dasharray': '3 4' }, svg);
  Hebrew.SEFIROT.forEach(([he, tr], i) => {
    const [x, y] = TREE_POS[i],
      on = lit.has(i),
      main = i === daySef;
    if (on)
      el(
        'circle',
        { cx: x, cy: y, r: 46, fill: 'url(#kbGlow)', class: main ? 'kb-pulse' : '', 'pointer-events': 'none' },
        svg,
      );
    el(
      'circle',
      {
        cx: x,
        cy: y,
        r: 27,
        fill: on ? 'var(--kb-orb-on)' : 'var(--kb-orb)',
        stroke: on ? 'var(--gold-bright)' : 'var(--gold)',
        'stroke-width': on ? 2 : 1.2,
        'data-tip': `kb-sefira:${i}`,
        class: 'tipzone',
        tabindex: 0,
        'aria-label': `${tr} details`,
      },
      svg,
    );
    el(
      'text',
      {
        x,
        y: y - 3,
        'text-anchor': 'middle',
        'dominant-baseline': 'central',
        'font-size': he.length > 4 ? 13 : 15,
        fill: on ? '#1a1640' : 'var(--ink)',
        'font-family': 'var(--f-he)',
        'pointer-events': 'none',
      },
      svg,
      he,
    );
    el(
      'text',
      {
        x,
        y: y + 13,
        'text-anchor': 'middle',
        'dominant-baseline': 'central',
        'font-size': 8.5,
        fill: on ? '#2a2560' : 'var(--muted)',
        'font-family': 'var(--f-body)',
        'pointer-events': 'none',
      },
      svg,
      tr,
    );
  });
}
