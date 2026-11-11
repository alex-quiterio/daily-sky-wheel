// The pieces tooltips are made of: a heading, a line of plain text, label-value rows and sub-headings.
// The tabs build their tooltips from these (see views/<tab>/tips.tsx).
import type { ComponentChildren } from 'preact';
import * as Western from '#astro/western.ts';
import { dms, g, label, norm, sg } from '#lib/format.ts';

export const TipHead = ({ children }: { children: ComponentChildren }) => <div class="th">{children}</div>;
export const TipText = ({ children }: { children: ComponentChildren }) => <div class="tplain">{children}</div>;
export const TipSub = ({ children }: { children: ComponentChildren }) => <div class="tsub">{children}</div>;
export const TipNote = ({ children }: { children: ComponentChildren }) => <div class="muted tnote">{children}</div>;
export const TipPos = ({ children }: { children: ComponentChildren }) => <div class="tpos">{children}</div>;

export function TipRow({ k, children }: { k: ComponentChildren; children: ComponentChildren }) {
  return (
    <div class="tr">
      <span>{k}</span>
      <span>{children}</span>
    </div>
  );
}

// ☉ Sun, ☊ North Node
export const PlanetName = ({ name }: { name: string }) => (
  <>
    <span class="tg">{g(name)}</span> {label(name)}
  </>
);

// 12°34′56″ ♈ Aries
export function Dms({ lon }: { lon: number }) {
  const s = Math.floor(norm(lon) / 30);
  return (
    <>
      {dms(lon)} <span class="tg">{sg(s)}</span> {Western.SIGNS[s]}
    </>
  );
}
