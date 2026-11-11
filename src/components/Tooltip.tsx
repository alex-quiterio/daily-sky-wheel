// The tooltip: one floating panel for every [data-tip] element. Hover shows it, click or Enter pins it, Esc closes it.
// What it says comes from the components registered in `tips`: 'planet:Mars' renders tips.planet('Mars').
import type { ComponentChildren } from 'preact';
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { hit, isCompact } from '#lib/dom.ts';
import { state as st, tipFocus, tips } from '#lib/state.ts';

let hide: (force?: boolean) => void = () => {};
export const hideTip = (force = false) => hide(force);

interface Shown {
  key: string;
  content: ComponentChildren;
  pinned: boolean;
  target: Element;
  x?: number; // the pointer, when there is one; otherwise the tip sits under the element
  y?: number;
}

// what the tip says for 'kind:value', or null when there is nothing to say
function contentOf(key: string): ComponentChildren {
  const at = key.indexOf(':');
  const kind = at < 0 ? key : key.slice(0, at),
    value = at < 0 ? '' : key.slice(at + 1);
  const make = tips[kind];
  if (!st.ctx || !make) return null;
  return make(value) ?? null;
}

export function Tooltip() {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState<Shown | null>(null);
  const now = useRef<Shown | null>(null); // the same, for the document listeners
  now.current = shown;

  // the listeners: on the whole document, since the [data-tip] elements belong to the tabs and their drawings
  useEffect(() => {
    const close = (force = false) => {
      if (now.current?.pinned && !force) return;
      if (now.current) tipFocus(null);
      now.current = null;
      setShown(null);
    };
    const show = (target: Element, pinned: boolean, x?: number, y?: number) => {
      const key = target.getAttribute('data-tip')!;
      const content = contentOf(key);
      if (content == null || content === false || content === '') return close(true);
      now.current = { key, content, pinned, target, x, y };
      setShown(now.current);
      tipFocus(key);
    };
    const zoneOf = (e: Event) => hit(e, '[data-tip]');
    const pinnedKey = () => (now.current?.pinned ? now.current.key : null);

    const onMove = (e: PointerEvent) => {
      if (pinnedKey() || e.pointerType === 'touch') return;
      const z = zoneOf(e);
      if (z) show(z, false, e.clientX, e.clientY);
      else if (now.current) close();
    };
    const onClick = (e: MouseEvent) => {
      if (hit(e, '.tipclose')) return close(true);
      const z = zoneOf(e);
      if (z && z.hasAttribute('data-tip-hover')) return close(true);
      if (z) {
        if (pinnedKey() === z.getAttribute('data-tip')) return close(true);
        show(z, true, e.clientX, e.clientY);
      } else if (pinnedKey() && !ref.current?.contains(e.target as Node)) close(true);
    };
    const onFocusIn = (e: FocusEvent) => {
      const z = zoneOf(e);
      if (z && !pinnedKey()) show(z, false);
    };
    const onFocusOut = (e: FocusEvent) => {
      if (zoneOf(e) && !pinnedKey()) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(true);
      const z = zoneOf(e);
      if ((e.key === 'Enter' || e.key === ' ') && z && (e.target as Element).tagName !== 'BUTTON') {
        e.preventDefault();
        show(z, true);
      }
    };
    const onScroll = () => {
      if (!pinnedKey()) close();
    };

    hide = close;
    document.addEventListener('pointermove', onMove);
    document.addEventListener('click', onClick);
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      hide = () => {};
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('click', onClick);
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  // place it once it is drawn and its size is known: beside the pointer, kept inside the window
  useLayoutEffect(() => {
    const tip = ref.current;
    if (!tip || !shown) return;
    if (isCompact()) {
      // a bottom sheet, placed by CSS
      tip.style.left = '';
      tip.style.top = '';
      tip.scrollTop = 0;
      return;
    }
    const r = shown.target.getBoundingClientRect();
    const ax = shown.x ?? r.left + r.width / 2,
      ay = shown.y ?? r.bottom;
    const tw = tip.offsetWidth,
      th = tip.offsetHeight,
      vw = window.innerWidth,
      vh = window.innerHeight;
    let left = ax + 14,
      top = ay + 14;
    if (left + tw > vw - 8) left = Math.max(8, ax - tw - 14);
    if (top + th > vh - 8) top = Math.max(8, ay - th - 14);
    tip.style.left = left + 'px';
    tip.style.top = top + 'px';
  }, [shown]);

  return (
    <div id="tip" role="tooltip" class={shown?.pinned ? 'pinned' : undefined} hidden={!shown} ref={ref}>
      {shown && isCompact() && (
        <button type="button" class="tipclose" aria-label="Close">
          ✕
        </button>
      )}
      {shown?.content}
    </div>
  );
}
