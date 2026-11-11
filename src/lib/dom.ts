// The DOM, where it is still touched by hand: form fields by id, SVG elements, the phone breakpoint.

// An element the page always renders, by id. A missing one is a bug in the markup, so it fails loudly.
export function $<T extends HTMLElement = HTMLElement>(id: string): T {
  const found = document.getElementById(id);
  if (!found) throw new Error(`no element with id "${id}"`);
  return found as T;
}

// The first element matching `selector` under `root`; like $, it must exist.
export function one<T extends Element = HTMLElement>(selector: string, root: ParentNode = document): T {
  const found = root.querySelector<T>(selector);
  if (!found) throw new Error(`no element matches "${selector}"`);
  return found;
}

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
