// The choices remembered between visits.

export const store = {
  get() {
    try {
      return JSON.parse(localStorage.getItem('skywheel') || '{}');
    } catch (e) {
      return {};
    }
  },
  set(v) {
    try {
      localStorage.setItem('skywheel', JSON.stringify(v));
    } catch (e) {
      /* storage unavailable */
    }
  },
};
