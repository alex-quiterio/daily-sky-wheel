// The choices remembered between visits.

// what is kept: the place (by name, or custom coordinates) and the house system
export interface Saved {
  geo?: boolean; // the custom place came from the device's location
  place?: string;
  hsys?: string;
  lilith?: string; // 'mean' or 'true'
  lat?: string;
  lon?: string;
  tz?: string;
}

export const store = {
  get(): Saved {
    try {
      return JSON.parse(localStorage.getItem('skywheel') || '{}');
    } catch (e) {
      return {};
    }
  },
  set(v: Saved) {
    try {
      localStorage.setItem('skywheel', JSON.stringify(v));
    } catch (e) {
      /* storage unavailable */
    }
  },
};
