// The date, time and place form. The fields are plain inputs; shell/controls.ts reads and drives them.
import { PLACES } from '#lib/constants.ts';
import { ZONES } from '#shell/controls.ts';

export function Controls() {
  return (
    <form class="controls" id="controls" autocomplete="off">
      <label class="field">
        <span>Day</span>
        <div class="daynav">
          <button type="button" id="prev" aria-label="Previous day">
            ‹
          </button>
          <input type="date" id="date" />
          <button type="button" id="next" aria-label="Next day">
            ›
          </button>
        </div>
      </label>
      <label class="field">
        <span>Time</span>
        <input type="time" id="time" step="60" />
      </label>
      <button type="button" id="play" class="playbtn" aria-pressed="false" title="Play the next 24 hours">
        <span class="play-ico" aria-hidden="true"></span>
        <span class="play-label">Play 24 h</span>
      </button>
      <label class="field">
        <span>Place</span>
        <select id="place">
          {PLACES.map((p, i) => (
            <option value={String(i)}>{p[0]}</option>
          ))}
          <option value="custom">Custom…</option>
        </select>
      </label>
      <div class="custom" id="customBox" hidden>
        <label class="field">
          <span>Latitude</span>
          <input id="lat" type="number" step="0.01" min="-89" max="89" />
        </label>
        <label class="field">
          <span>Longitude</span>
          <input id="lon" type="number" step="0.01" min="-180" max="180" />
        </label>
        <label class="field">
          <span>Time zone</span>
          <select id="tz">
            {ZONES.map((z) => (
              <option value={z}>{z.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </label>
      </div>
      <div class="spacer"></div>
      <button type="button" id="locate" class="iconbtn">
        <svg viewBox="0 0 24 24" aria-hidden="true" width="16" height="16">
          <circle cx="12" cy="12" r="3.2" fill="currentColor" />
          <circle cx="12" cy="12" r="7.5" fill="none" stroke="currentColor" stroke-width="1.6" />
          <path
            d="M12 1.5v3.5M12 19v3.5M1.5 12H5M19 12h3.5"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
          />
        </svg>
        <span>My location</span>
      </button>
      <button type="button" id="now">
        Now
      </button>
      <button type="button" id="copylink">
        Copy link
      </button>
      <button type="button" id="install" class="primary" hidden>
        Install app
      </button>
      {/* the chosen house system; no value here, so a repaint never resets it */}
      <input type="hidden" id="hsys" />
      <p class="urlnote" id="urlnote" role="status" hidden></p>
    </form>
  );
}
