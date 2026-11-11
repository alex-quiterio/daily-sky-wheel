// The quick bar that stays at the top once the controls scroll away. It shows the same store as the form.
import { useEffect, useState } from 'preact/hooks';
import { PLACES } from '#lib/constants.ts';
import { useStore } from '#lib/store.ts';
import { change, changePlace, controls, shiftDay } from '#shell/controls.ts';
import { PlayButton } from '#shell/Controls.tsx';

const value = (e: Event) => (e.currentTarget as HTMLInputElement).value;

export function MiniBar() {
  const { date, time, place } = useStore(controls, (s) => s);
  const [shown, setShown] = useState(false);

  // shown once the main controls have scrolled out of view
  useEffect(() => {
    let raf = 0;
    const check = () => {
      raf = 0;
      const form = document.getElementById('controls');
      setShown(!!form && form.getBoundingClientRect().bottom < 0);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', check);
    check();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', check);
    };
  }, []);

  // hidden, it is out of the tab order as well
  useEffect(() => {
    document
      .getElementById('minibar')
      ?.querySelectorAll<HTMLElement>('button, input, select')
      .forEach((x) => {
        x.tabIndex = shown ? 0 : -1;
      });
  }, [shown]);

  return (
    <div class={`minibar${shown ? ' show' : ''}`} id="minibar" aria-label="Quick controls" aria-hidden={!shown}>
      <div class="mb-row">
        <button type="button" id="mPrev" aria-label="Previous day" onClick={() => shiftDay(-1)}>
          ‹
        </button>
        <input type="date" id="mDate" aria-label="Day" value={date} onChange={(e) => change({ date: value(e) })} />
        <button type="button" id="mNext" aria-label="Next day" onClick={() => shiftDay(1)}>
          ›
        </button>
        <input
          type="time"
          id="mTime"
          step="60"
          aria-label="Time"
          value={time}
          onChange={(e) => change({ time: value(e) })}
        />
        <PlayButton id="mPlay" />
        <select id="mPlace" aria-label="Place" value={place} onChange={(e) => changePlace({ place: value(e) })}>
          {PLACES.map((p, i) => (
            <option value={String(i)}>{p[0]}</option>
          ))}
          <option value="custom">Custom</option>
        </select>
      </div>
    </div>
  );
}
