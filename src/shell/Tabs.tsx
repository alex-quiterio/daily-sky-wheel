// The tab row: one tab per tradition. The arrow keys move between them.
import { useEffect, useRef } from 'preact/hooks';
import { TAB_NOTES, VIEWS, isHidden } from '#lib/constants.ts';
import { setView } from '#shell/controls.ts';

export function Tabs({ view }: { view: string }) {
  // a hidden tab shows only while it is open
  const shown = VIEWS.filter(([k]) => !isHidden(k) || k === view);
  const bar = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  // keep the chosen tab in view when the tab row scrolls (phones)
  useEffect(() => {
    const row = bar.current,
      tab = row?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (row && tab && row.scrollWidth > row.clientWidth)
      row.scrollTo({
        left: tab.offsetLeft - (row.clientWidth - tab.offsetWidth) / 2,
        behavior: first.current ? 'auto' : 'smooth',
      });
    first.current = false;
  }, [view]);
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const i = shown.findIndex(([k]) => k === view),
      n = shown.length;
    const [next, label] = shown[(i + (e.key === 'ArrowRight' ? 1 : n - 1)) % n];
    setView(next);
    document.getElementById(`tab${label.replace(/\s/g, '')}`)?.focus();
  };
  return (
    <div
      class="tabs"
      role="tablist"
      aria-label="Astrology system, in order of earliest documented practice"
      ref={bar}
      onKeyDown={onKey}
    >
      {shown.map(([name, label]) => {
        const [mark, cls, note] = TAB_NOTES[name];
        const on = name === view;
        return (
          <button
            type="button"
            role="tab"
            id={`tab${label.replace(/\s/g, '')}`}
            aria-controls={`view${label.replace(/\s/g, '')}`}
            aria-selected={on}
            tabindex={on ? 0 : -1}
            title={note}
            onClick={() => setView(name)}
          >
            {label}
            {mark && (
              <>
                {' '}
                <span class={cls}>{mark}</span>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}
