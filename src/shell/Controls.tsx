// The date, time and place form. The fields are plain inputs; shell/controls.ts reads and drives them.
import { PLACES } from '#lib/constants.ts';
import { Icon } from '#components/Icon.tsx';
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
      <button
        type="button"
        id="play"
        class="playbtn"
        aria-pressed="false"
        title="Play the next 24 hours"
        aria-label="Play the next 24 hours"
      >
        <span class="play-ico" aria-hidden="true"></span>
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
      <button type="button" id="locate" class="iconbtn" title="My location" aria-label="My location">
        <Icon name="locate" />
      </button>
      <button type="button" id="now" class="iconbtn" title="Now: this minute, where you are" aria-label="Now">
        <Icon name="now" />
      </button>
      <button type="button" id="copylink" class="iconbtn" title="Copy link" aria-label="Copy link">
        <Icon name="link" />
      </button>
      <button
        type="button"
        id="shareimage"
        class="iconbtn"
        title="Share image: the open tab as a picture"
        aria-label="Share image"
      >
        <Icon name="share" />
      </button>
      <button type="button" id="print" class="iconbtn" title="Print" aria-label="Print">
        <Icon name="print" />
      </button>
      <button type="button" id="install" class="iconbtn primary" hidden title="Install app" aria-label="Install app">
        <Icon name="install" />
      </button>
      {/* what a button just did, for screen readers; sighted readers see it under the button */}
      <p class="sr-only" id="status" role="status"></p>
      {/* the chosen house system; no value here, so a repaint never resets it */}
      <input type="hidden" id="hsys" />
      <p class="urlnote" id="urlnote" role="status" hidden></p>
    </form>
  );
}
