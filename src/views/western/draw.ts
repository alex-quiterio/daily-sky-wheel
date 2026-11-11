// Western tab: the chart wheel and the Moon picture, drawn as SVG.
import { Western } from '#astro';
import type { Aspect, Chart, MoonPhase } from '#astro';
import { ASPECT_COLOR, EL_VAR, GLYPH, LABEL } from '#lib/constants.ts';
import { el, isCompact } from '#lib/dom.ts';
import { fmtPos, g, norm, pad, sg } from '#lib/format.ts';
import { onTipFocus, chartContext } from '#lib/state.ts';

function drawWheel(svg: SVGSVGElement, chart: Chart, asps: Aspect[]) {
  svg.innerHTML = '';
  // Compact wheel on phones: the SVG renders at about half size, so type and hit areas grow.
  const compact = isCompact();
  svg.classList.toggle('compact', compact);
  const cx = 320,
    cy = 320;
  const R0 = 300,
    R1 = 268,
    R2 = 258,
    RP = compact ? 224 : 222,
    RD = compact ? 186 : 194,
    RH = 168,
    RC = 120;
  const F = compact
    ? {
        sign: 27,
        house: 17,
        houseR: RC + 17,
        houseHit: 15,
        angle: 17,
        angleR: R0 + 26,
        glyph: 34,
        glyphText: 18,
        deg: 19,
        min: 0,
        hit: 19,
        MIN: 13,
      }
    : {
        sign: 19,
        house: 10,
        houseR: RC + 12,
        houseHit: 9,
        angle: 10,
        angleR: R0 + 22,
        glyph: 21,
        glyphText: 12,
        deg: 11.5,
        min: 9,
        hit: 13,
        MIN: 8.6,
      };
  const left = chart.cusps[0];
  const ang = (lon: number) => ((180 + norm(lon) - left) * Math.PI) / 180;
  const P = (lon: number, r: number): [number, number] => [cx + r * Math.cos(ang(lon)), cy - r * Math.sin(ang(lon))];

  const defs = el('defs', {}, svg);
  const grad = el('radialGradient', { id: 'coreGlow', cx: '50%', cy: '50%', r: '50%' }, defs);
  el('stop', { offset: '0%', style: 'stop-color:var(--nebula-1);stop-opacity:0.55' }, grad);
  el('stop', { offset: '100%', style: 'stop-color:var(--wheel-core);stop-opacity:1' }, grad);
  el(
    'circle',
    {
      cx,
      cy,
      r: R0 + 12,
      fill: 'none',
      stroke: 'var(--gold)',
      'stroke-width': 1,
      'stroke-dasharray': '1 6',
      'stroke-linecap': 'round',
      'stroke-opacity': 0.7,
      class: 'halo',
    },
    svg,
  );
  el(
    'circle',
    { cx, cy, r: R0 + 5, fill: 'none', stroke: 'var(--gold)', 'stroke-width': 0.6, 'stroke-opacity': 0.5 },
    svg,
  );
  el(
    'circle',
    {
      cx,
      cy,
      r: R0 + 18,
      fill: 'none',
      stroke: 'var(--violet)',
      'stroke-width': 0.8,
      'stroke-dasharray': '2 14 1 9',
      'stroke-linecap': 'round',
      'stroke-opacity': 0.45,
      class: 'halo rev',
    },
    svg,
  );
  el(
    'circle',
    { cx, cy, r: R0, fill: 'var(--wheel-bg)', 'fill-opacity': 0.85, stroke: 'var(--gold)', 'stroke-width': 1.4 },
    svg,
  );
  // zodiac band segments
  for (let s = 0; s < 12; s++) {
    const a0 = s * 30,
      a1 = s * 30 + 30;
    const [x0, y0] = P(a0, R0),
      [x1, y1] = P(a1, R0),
      [x2, y2] = P(a1, R1),
      [x3, y3] = P(a0, R1);
    el(
      'path',
      {
        d: `M${x0} ${y0} A${R0} ${R0} 0 0 0 ${x1} ${y1} L${x2} ${y2} A${R1} ${R1} 0 0 1 ${x3} ${y3}Z`,
        fill: `var(${EL_VAR[s % 4]})`,
        'fill-opacity': 0.13,
        stroke: 'var(--rule)',
        'stroke-width': 1,
        'data-tip': `sign:${s}`,
        class: 'tipzone',
      },
      svg,
    );
    const [gx, gy] = P(a0 + 15, (R0 + R1) / 2);
    el(
      'text',
      {
        x: gx,
        y: gy,
        'text-anchor': 'middle',
        'dominant-baseline': 'central',
        'font-size': F.sign,
        fill: `var(${EL_VAR[s % 4]})`,
        'font-family': 'var(--f-glyph)',
        'data-tip': `sign:${s}`,
        class: 'tipzone',
        tabindex: 0,
        'aria-label': `${Western.SIGNS[s]} details`,
      },
      svg,
      sg(s),
    );
  }
  // degree ticks
  for (let d = 0; d < 360; d += 1) {
    const len = d % 10 === 0 ? 9 : d % 5 === 0 ? 6 : 3;
    const [x0, y0] = P(d, R1),
      [x1, y1] = P(d, R1 - len);
    el(
      'line',
      {
        x1: x0,
        y1: y0,
        x2: x1,
        y2: y1,
        stroke: 'var(--muted)',
        'stroke-width': d % 10 === 0 ? 0.9 : 0.5,
        'pointer-events': 'none',
      },
      svg,
    );
  }
  el('circle', { cx, cy, r: R1, fill: 'none', stroke: 'var(--gold)', 'stroke-width': 1 }, svg);
  el('circle', { cx, cy, r: RH, fill: 'none', stroke: 'var(--rule)', 'stroke-width': 1 }, svg);
  el('circle', { cx, cy, r: RC, fill: 'url(#coreGlow)', stroke: 'var(--gold)', 'stroke-width': 1 }, svg);

  // house cusps
  chart.cusps.forEach((c, i) => {
    const angle = i % 3 === 0;
    const [x0, y0] = P(c, R1 - 10),
      [x1, y1] = P(c, RC);
    el(
      'line',
      {
        x1: x0,
        y1: y0,
        x2: x1,
        y2: y1,
        stroke: angle ? 'var(--gold)' : 'var(--rule)',
        'stroke-width': angle ? 1.3 : 1,
      },
      svg,
    );
    const next = chart.cusps[(i + 1) % 12];
    const mid = c + norm(next - c) / 2;
    const [hx, hy] = P(mid, F.houseR);
    el(
      'circle',
      { cx: hx, cy: hy, r: F.houseHit, fill: 'rgba(0,0,0,0)', 'data-tip': `house:${i}`, class: 'tipzone' },
      svg,
    );
    el(
      'text',
      {
        x: hx,
        y: hy,
        'text-anchor': 'middle',
        'dominant-baseline': 'central',
        'font-size': F.house,
        fill: 'var(--muted)',
        'font-family': 'var(--f-data)',
        'data-tip': `house:${i}`,
        class: 'tipzone',
        tabindex: 0,
        'aria-label': `House ${i + 1} details`,
      },
      svg,
      String(i + 1),
    );
  });
  // angle markers ASC / MC (always drawn at their real positions)
  const angles: [label: string, lon: number][] = [
    ['AC', chart.asc],
    ['MC', chart.mc],
    ['DC', chart.asc + 180],
    ['IC', chart.mc + 180],
  ];
  angles.forEach(([lab, lon]) => {
    const [x0, y0] = P(lon, R0);
    const [tx, ty] = P(lon, F.angleR);
    el(
      'line',
      { x1: P(lon, R1)[0], y1: P(lon, R1)[1], x2: x0, y2: y0, stroke: 'var(--accent)', 'stroke-width': 2.2 },
      svg,
    );
    el(
      'text',
      {
        x: tx,
        y: ty,
        'text-anchor': 'middle',
        'dominant-baseline': 'central',
        'font-size': F.angle,
        'font-weight': 600,
        fill: 'var(--accent)',
        'font-family': 'var(--f-data)',
        'data-tip': `angle:${lab}`,
        class: 'tipzone',
        tabindex: 0,
        'aria-label': `${lab} details`,
      },
      svg,
      lab,
    );
  });

  // aspect lines
  const byName = Object.fromEntries(chart.pts.map((p) => [p.name, p]));
  const ag = el('g', { class: 'asps' }, svg);
  asps.forEach((a, i) => {
    if (a.type.key === 'conj') return;
    const [x0, y0] = P(byName[a.a].lon, RC - 2),
      [x1, y1] = P(byName[a.b].lon, RC - 2);
    el(
      'line',
      {
        x1: x0,
        y1: y0,
        x2: x1,
        y2: y1,
        stroke: ASPECT_COLOR[a.type.key],
        'stroke-width': a.orb < 2 ? 1.6 : 0.9,
        'stroke-opacity': a.orb < 2 ? 0.95 : 0.6,
        'stroke-dasharray': a.type.key === 'qx' ? '4 3' : null,
        class: 'asp',
        'data-a': a.a,
        'data-b': a.b,
        'pointer-events': 'none',
      },
      ag,
    );
    el(
      'line',
      {
        x1: x0,
        y1: y0,
        x2: x1,
        y2: y1,
        stroke: 'rgba(0,0,0,0)',
        'stroke-width': 9,
        'pointer-events': 'stroke',
        'data-tip': `aspect:${i}`,
        class: 'tipzone',
      },
      ag,
    );
  });

  // planets with collision spreading
  // disp: where the glyph is drawn, once crowded neighbours have been fanned apart
  const items: { name: string; lon: number; disp: number; retro: boolean }[] = chart.pts.map((p) => ({
    ...p,
    disp: p.lon,
  }));
  items.push({ name: 'Vertex', lon: chart.vertex, disp: chart.vertex, retro: false });
  items.sort((a, b) => a.lon - b.lon);
  // spread clusters: group neighbours closer than MIN, fan each group evenly around its centre
  const MIN = F.MIN;
  const groups = items.map((p) => [p]);
  for (let iter = 0; iter < 40; iter++) {
    groups.forEach((gr) => {
      const base = gr[0].lon;
      const mean = base + gr.reduce((s, p) => s + (((norm(p.lon - base) + 180) % 360) - 180), 0) / gr.length;
      gr.forEach((p, k) => {
        p.disp = norm(mean + (k - (gr.length - 1) / 2) * MIN);
      });
    });
    let merged = false;
    for (let i = 0; i < groups.length && groups.length > 1; i++) {
      const a = groups[i],
        b = groups[(i + 1) % groups.length];
      if (a === b) continue;
      const gap = ((b[0].disp - a[a.length - 1].disp + 540) % 360) - 180; // signed, so overlaps count too
      if (gap < MIN) {
        const j = (i + 1) % groups.length;
        groups[i] = a.concat(b);
        groups.splice(j, 1);
        merged = true;
        break;
      }
    }
    if (!merged) break;
  }
  const gp = el('g', { class: 'planets' }, svg);
  items.forEach((p) => {
    const [tx0, ty0] = P(p.lon, R1),
      [tx1, ty1] = P(p.lon, R2);
    el('line', { x1: tx0, y1: ty0, x2: tx1, y2: ty1, stroke: 'var(--gold-bright)', 'stroke-width': 1.4 }, gp);
    const [lx0, ly0] = P(p.lon, R2),
      [lx1, ly1] = P(p.disp, RP + 13);
    el(
      'line',
      { x1: lx0, y1: ly0, x2: lx1, y2: ly1, stroke: 'var(--muted)', 'stroke-width': 0.5, 'stroke-opacity': 0.7 },
      gp,
    );
    const pos = fmtPos(p.lon);
    const color = `var(${EL_VAR[pos.sign % 4]})`;
    const [gx, gy] = P(p.disp, RP);
    const isText = (GLYPH[p.name] || '').length > 1;
    const key = p.name === 'Vertex' ? 'angle:Vx' : `planet:${p.name}`;
    el('circle', { cx: gx, cy: gy, r: F.hit, fill: 'rgba(0,0,0,0)', 'data-tip': key, class: 'tipzone' }, gp);
    el(
      'text',
      {
        x: gx,
        y: gy,
        'text-anchor': 'middle',
        'dominant-baseline': 'central',
        'font-size': isText ? F.glyphText : F.glyph,
        fill: 'var(--ink)',
        'font-family': isText ? 'var(--f-data)' : 'var(--f-glyph)',
        'font-weight': isText ? 600 : 400,
        'data-tip': key,
        class: 'tipzone pglyph',
        tabindex: 0,
        'aria-label': `${LABEL[p.name] || p.name} details`,
      },
      gp,
      g(p.name),
    );
    const [dx, dy] = P(p.disp, RD);
    el(
      'text',
      {
        x: dx,
        y: dy,
        'text-anchor': 'middle',
        'dominant-baseline': 'central',
        'font-size': F.deg,
        fill: color,
        'font-family': 'var(--f-data)',
      },
      gp,
      `${pos.deg}°${p.retro ? 'ʀ' : ''}`,
    );
    if (F.min) {
      const [mx, my] = P(p.disp, RD - 15);
      el(
        'text',
        {
          x: mx,
          y: my,
          'text-anchor': 'middle',
          'dominant-baseline': 'central',
          'font-size': F.min,
          fill: 'var(--muted)',
          'font-family': 'var(--f-data)',
        },
        gp,
        pad(pos.min) + '′',
      );
    }
  });
}

function drawMoon(svg: SVGSVGElement, phase: MoonPhase) {
  svg.innerHTML = '';
  const r = 24,
    c = 28;
  el('circle', { cx: c, cy: c, r, fill: 'var(--wheel-core)', stroke: 'var(--gold)', 'stroke-opacity': 0.5 }, svg);
  const e = (phase.elong * Math.PI) / 180;
  const k = Math.cos(e); // terminator x-scale
  const waxing = phase.elong < 180;
  // lit portion: right half when waxing (northern view)
  const sweepOuter = waxing ? 1 : 0;
  const rx = Math.abs(k) * r;
  const sweepInner = k > 0 === waxing ? 0 : 1;
  const d = `M${c} ${c - r} A${r} ${r} 0 0 ${sweepOuter} ${c} ${c + r} A${rx} ${r} 0 0 ${sweepInner} ${c} ${c - r}Z`;
  el('path', { d, fill: 'var(--moonlit)', 'fill-opacity': 0.95 }, svg);
}

// light up the aspects of the planet or aspect under the pointer
function focusWheel(key: string | null) {
  const svg = document.getElementById('wheel');
  if (!svg) return; // another tab is showing
  svg.querySelectorAll('.asp.on').forEach((l) => l.classList.remove('on'));
  svg.querySelectorAll('.pglyph.on').forEach((l) => l.classList.remove('on'));
  svg.classList.remove('focusing');
  if (!key) return;
  const [kind, v] = key.split(':');
  if (kind === 'planet') {
    svg.classList.add('focusing');
    svg.querySelectorAll(`.asp[data-a="${v}"], .asp[data-b="${v}"]`).forEach((l) => l.classList.add('on'));
    svg.querySelectorAll(`.pglyph[data-tip="${key}"]`).forEach((l) => l.classList.add('on'));
  } else if (kind === 'aspect') {
    const a = chartContext().asps[+v];
    if (!a) return;
    svg.classList.add('focusing');
    svg.querySelectorAll(`.asp[data-a="${a.a}"][data-b="${a.b}"]`).forEach((l) => l.classList.add('on'));
    svg
      .querySelectorAll(`.pglyph[data-tip="planet:${a.a}"], .pglyph[data-tip="planet:${a.b}"]`)
      .forEach((l) => l.classList.add('on'));
  }
}

onTipFocus(focusWheel);

export { drawWheel, drawMoon };
