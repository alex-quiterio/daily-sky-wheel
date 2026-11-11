// The quick bar that stays at the top once the controls scroll away.
import { PLACES } from '#lib/constants.ts';

export function MiniBar() {
  return (
    <div class="minibar" id="minibar" aria-label="Quick controls" aria-hidden="true">
      <div class="mb-row">
        <button type="button" id="mPrev" aria-label="Previous day">
          ‹
        </button>
        <input type="date" id="mDate" aria-label="Day" />
        <button type="button" id="mNext" aria-label="Next day">
          ›
        </button>
        <input type="time" id="mTime" step="60" aria-label="Time" />
        <button type="button" id="mPlay" class="playbtn" aria-pressed="false" aria-label="Play the next 24 hours">
          <span class="play-ico" aria-hidden="true"></span>
        </button>
        <select id="mPlace" aria-label="Place">
          {PLACES.map((p, i) => (
            <option value={String(i)}>{p[0]}</option>
          ))}
          <option value="custom">Custom</option>
        </select>
      </div>
    </div>
  );
}
