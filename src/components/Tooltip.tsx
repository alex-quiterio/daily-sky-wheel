// The tooltip: one floating panel for every [data-tip] element. Hover shows it, click or Enter pins it, Esc closes it.
// What it says comes from the makers in `tips`, as HTML.
import { useEffect, useRef } from 'preact/hooks';
import { hit, isCompact } from '#lib/dom.ts';
import { state as st, tipFocus, tips } from '#lib/state.ts';

let hide: (force?: boolean) => void = () => {};
export const hideTip = (force = false) => hide(force);

export function Tooltip() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tip = ref.current!;
    let pinned: string | null = null,
      current: string | null = null;

    // 'planet:Mars' -> the maker registered under tips.planet, called with 'Mars'
    const tipHTML = (key: string) => {
      const [kind, v] = key.split(':');
      if (!st.ctx) return '';
      const make = tips[kind];
      return make ? make(v) : '';
    };
    const hideNow = (force = false) => {
      if (pinned && !force) return;
      pinned = null;
      current = null;
      tip.hidden = true;
      tipFocus(null);
    };
    const show = (target: Element, x?: number, y?: number) => {
      const key = target.getAttribute('data-tip')!;
      const html = tipHTML(key);
      if (!html) return hideNow(true);
      current = key;
      tip.innerHTML =
        (isCompact() ? '<button type="button" class="tipclose" aria-label="Close">✕</button>' : '') + html;
      tip.classList.toggle('wide', key === 'houses:all');
      tip.classList.toggle('pinned', !!pinned);
      tip.hidden = false;
      tipFocus(key);
      if (isCompact()) {
        // bottom sheet, placed by CSS
        tip.style.left = '';
        tip.style.top = '';
        tip.scrollTop = 0;
        return;
      }
      const r = target.getBoundingClientRect();
      const ax = x != null ? x : r.left + r.width / 2,
        ay = y != null ? y : r.bottom;
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
    };
    const zoneOf = (e: Event) => hit(e, '[data-tip]');

    const onMove = (e: PointerEvent) => {
      if (pinned || e.pointerType === 'touch') return;
      const z = zoneOf(e);
      if (z) show(z, e.clientX, e.clientY);
      else if (current) hideNow();
    };
    const onClick = (e: MouseEvent) => {
      if (hit(e, '.tipclose')) return hideNow(true);
      const z = zoneOf(e);
      if (z && z.hasAttribute('data-tip-hover')) return hideNow(true);
      if (z) {
        if (pinned === z.getAttribute('data-tip')) return hideNow(true);
        pinned = z.getAttribute('data-tip');
        show(z, e.clientX, e.clientY);
      } else if (pinned && !tip.contains(e.target as Node)) hideNow(true);
    };
    const onFocusIn = (e: FocusEvent) => {
      const z = zoneOf(e);
      if (z && !pinned) show(z);
    };
    const onFocusOut = (e: FocusEvent) => {
      if (zoneOf(e) && !pinned) hideNow();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hideNow(true);
      const z = zoneOf(e);
      if ((e.key === 'Enter' || e.key === ' ') && z && (e.target as Element).tagName !== 'BUTTON') {
        e.preventDefault();
        pinned = z.getAttribute('data-tip');
        show(z);
      }
    };
    const onScroll = () => {
      if (!pinned) hideNow();
    };

    hide = hideNow;
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

  return <div id="tip" role="tooltip" hidden ref={ref}></div>;
}
