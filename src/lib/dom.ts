// The DOM, where it is still touched by hand: form fields by id, SVG elements, the phone breakpoint.

export const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

// an input or select: anything with a value
export const field = (id: string) => $<HTMLInputElement>(id);

// the element matching `selector` that an event happened in, if any
export const hit = (e: Event, selector: string) =>
  e.target instanceof Element ? e.target.closest<HTMLElement>(selector) : null;

export const NS = 'http://www.w3.org/2000/svg';

export function el(
  tag: string,
  attrs: Record<string, string | number | null>,
  parent?: Element | null,
  text?: string | number | null,
) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, String(attrs[k]));
  if (text != null) e.textContent = String(text);
  if (parent) parent.appendChild(e);
  return e;
}

export function isCompact() {
  return window.innerWidth < 600;
}
