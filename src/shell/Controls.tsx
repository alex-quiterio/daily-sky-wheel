// The date, time and place form. It shows the controls store and hands every change back to shell/controls.ts.
import { PLACES } from '#lib/constants.ts';
import { useStore } from '#lib/store.ts';
import { Icon } from '#components/Icon.tsx';
import {
  ZONES,
  change,
  changePlace,
  controls,
  copyLink,
  goNow,
  install,
  locate,
  shareAsImage,
  shiftDay,
  togglePlay,
} from '#shell/controls.ts';

const value = (e: Event) => (e.currentTarget as HTMLInputElement).value;

// Play and pause: the same button in the form and the quick bar
export function PlayButton({ id }: { id: string }) {
  const playing = useStore(controls, (s) => s.playing);
  const label = playing ? 'Pause' : 'Play the next 24 hours';
  return (
    <button
      type="button"
      id={id}
      class={`playbtn${playing ? ' on' : ''}`}
      aria-pressed={playing}
      title={label}
      aria-label={label}
      onClick={togglePlay}
    >
      <span class="play-ico" aria-hidden="true"></span>
    </button>
  );
}

export function Controls() {
  const s = useStore(controls, (st) => st);
  const zones = ZONES.includes(s.tz) ? ZONES : [...ZONES, s.tz];
  return (
    <form class="controls" id="controls" autocomplete="off" onSubmit={(e) => e.preventDefault()}>
      <label class="field">
        <span>Day</span>
        <div class="daynav">
          <button type="button" id="prev" aria-label="Previous day" onClick={() => shiftDay(-1)}>
            ‹
          </button>
          <input type="date" id="date" value={s.date} onChange={(e) => change({ date: value(e) })} />
          <button type="button" id="next" aria-label="Next day" onClick={() => shiftDay(1)}>
            ›
          </button>
        </div>
      </label>
      <label class="field">
        <span>Time</span>
        <input type="time" id="time" step="60" value={s.time} onChange={(e) => change({ time: value(e) })} />
      </label>
      <PlayButton id="play" />
      <label class="field">
        <span>Place</span>
        <select id="place" value={s.place} onChange={(e) => changePlace({ place: value(e) })}>
          {PLACES.map((p, i) => (
            <option value={String(i)}>{p[0]}</option>
          ))}
          <option value="custom">Custom…</option>
        </select>
      </label>
      <div class="custom" id="customBox" hidden={s.place !== 'custom'}>
        <label class="field">
          <span>Latitude</span>
          <input
            id="lat"
            type="number"
            step="0.01"
            min="-89"
            max="89"
            value={s.lat}
            onChange={(e) => changePlace({ lat: value(e) })}
          />
        </label>
        <label class="field">
          <span>Longitude</span>
          <input
            id="lon"
            type="number"
            step="0.01"
            min="-180"
            max="180"
            value={s.lon}
            onChange={(e) => changePlace({ lon: value(e) })}
          />
        </label>
        <label class="field">
          <span>Time zone</span>
          <select id="tz" value={s.tz} onChange={(e) => change({ tz: value(e) })}>
            {zones.map((z) => (
              <option value={z}>{z.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </label>
      </div>
      {/* the actions: always at the right-hand end, on whichever line they land */}
      <div class="actions">
        <button
          type="button"
          id="locate"
          class="iconbtn"
          title="My location"
          aria-label="My location"
          disabled={s.locating}
          onClick={locate}
        >
          <Icon name="locate" />
        </button>
        <button
          type="button"
          id="now"
          class="iconbtn"
          title="Now: this minute, where you are"
          aria-label="Now"
          onClick={goNow}
        >
          <Icon name="now" />
        </button>
        <button type="button" id="copylink" class="iconbtn" title="Copy link" aria-label="Copy link" onClick={copyLink}>
          <Icon name="link" />
        </button>
        <button
          type="button"
          id="shareimage"
          class="iconbtn"
          title="Share image: the open tab as a picture"
          aria-label="Share image"
          onClick={shareAsImage}
        >
          <Icon name="share" />
        </button>
        <button
          type="button"
          id="print"
          class="iconbtn"
          title="Print"
          aria-label="Print"
          onClick={() => window.print()}
        >
          <Icon name="print" />
        </button>
        <button
          type="button"
          id="install"
          class="iconbtn primary"
          hidden={!s.installable}
          title="Install app"
          aria-label="Install app"
          onClick={install}
        >
          <Icon name="install" />
        </button>
        {/* what a button just did, for screen readers; sighted readers see it under the button */}
        <p class="sr-only" id="status" role="status"></p>
      </div>
      <p class="urlnote" id="urlnote" role="status" hidden={!s.note}>
        {s.note}
      </p>
    </form>
  );
}
