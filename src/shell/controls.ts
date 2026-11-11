// The moment and the place: one store holds what the controls show, and everything that changes it is here.
// The form, the quick bar and the tabs read the store; the render loop in app.tsx casts the chart whenever
// the moment, the place or the house system in it changes.
import type { HouseSystem } from '#astro';
import { HOUSE_ALIASES, PLACES, VIEWS } from '#lib/constants.ts';
import { $, isCompact, flash, unflash } from '#lib/dom.ts';
import { pad, slug } from '#lib/format.ts';
import { createStore } from '#lib/store.ts';
import { store as saved } from '#lib/storage.ts';
import { dateFormat, localParts } from '#lib/time.ts';
import type { Place } from '#lib/types.ts';
import { shareImage } from '#shell/share.ts';

export interface ControlsState {
  date: string; // YYYY-MM-DD, in the place's time zone
  time: string; // HH:MM
  place: string; // an index into PLACES, or 'custom'
  lat: string; // the custom place, as typed
  lon: string;
  tz: string;
  hsys: HouseSystem;
  view: string; // the open tab
  fromGeo: boolean; // the custom place came from the device's location
  urlSync: boolean; // true once the address bar should follow the controls
  playing: boolean; // Play is running through the next 24 hours
  locating: boolean; // waiting for the device's location
  installable: boolean; // the browser offered to install the page as an app
  note: string; // why a link or the location could not be used; '' when all is well
}

export const controls = createStore<ControlsState>({
  date: '',
  time: '12:00',
  place: '0',
  lat: '38.72',
  lon: '-9.14',
  tz: 'Europe/Lisbon',
  hsys: 'placidus',
  view: 'western',
  fromGeo: false,
  urlSync: false,
  playing: false,
  locating: false,
  installable: false,
  note: '',
});

// what the chart is cast from: when any of these change, the chart is cast again
export const CHART_KEYS = ['date', 'time', 'place', 'lat', 'lon', 'tz', 'hsys'] as const;

// every time zone the browser knows, for the Custom place
export const ZONES: string[] = (() => {
  try {
    return Intl.supportedValuesOf('timeZone');
  } catch (e) {
    return [...new Set(PLACES.map((p) => p[3]))].concat(['UTC']);
  }
})();

// ---------- places and time zones ----------
export function currentPlace(s: ControlsState = controls.get()): Place {
  if (s.place === 'custom') {
    const lat = parseFloat(s.lat),
      lon = parseFloat(s.lon);
    const coords = `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lon).toFixed(2)}°${lon >= 0 ? 'E' : 'W'}`;
    return {
      name: s.fromGeo ? `My location (${coords})` : coords,
      lat: isFinite(lat) ? lat : 0,
      lon: isFinite(lon) ? lon : 0,
      tz: s.tz || 'UTC',
    };
  }
  const p = PLACES[+s.place] || PLACES[0];
  return { name: p[0], lat: p[1], lon: p[2], tz: p[3] };
}

function browserTZ() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch (e) {
    return 'UTC';
  }
}
// Canonical zone name, so aliases match (Asia/Saigon = Asia/Ho_Chi_Minh, Europe/Kiev = Europe/Kyiv, ...)
function canonTZ(tz: string) {
  try {
    return dateFormat('en', { timeZone: tz }).resolvedOptions().timeZone;
  } catch (e) {
    return null;
  }
}
const sameTZ = (a: string, b: string) => a === b || (canonTZ(a) !== null && canonTZ(a) === canonTZ(b));
// The zone to show in the custom list for `tz`, matching aliases; null when the zone is unknown.
// A zone the list lacks but the browser knows is used as it is (the form adds it as an option).
function resolveTZ(tz: string): string | null {
  return ZONES.find((z) => sameTZ(z, tz)) ?? (canonTZ(tz) ? tz : null);
}

// The place matching the browser's time zone (keeping the current place if it already matches).
function browserPlace(s: ControlsState): Partial<ControlsState> {
  const tz = browserTZ();
  if (sameTZ(currentPlace(s).tz, tz)) return {};
  const idx = PLACES.findIndex((p) => sameTZ(p[3], tz));
  if (idx >= 0) return { place: String(idx) };
  return { place: 'custom', tz: resolveTZ(tz) ?? 'UTC' };
}

// ---------- start-up: what was saved, then the link ----------
export function initControls() {
  const s = saved.get();
  // places are remembered by name, so adding or removing cities never shifts a saved choice
  const idx = s.place === 'custom' ? -2 : PLACES.findIndex((p) => slug(p[0]) === s.place);
  let view = 'western';
  try {
    view = localStorage.getItem('skywheel-view') || 'western';
  } catch (e) {
    /* storage unavailable */
  }
  let state: ControlsState = {
    ...controls.get(),
    place: idx === -2 ? 'custom' : idx >= 0 ? String(idx) : '0',
    hsys: s.hsys && ['placidus', 'whole', 'equal', 'natural'].includes(s.hsys) ? (s.hsys as HouseSystem) : 'placidus',
    lat: s.lat ?? '38.72',
    lon: s.lon ?? '-9.14',
    tz: s.tz || 'Europe/Lisbon',
    fromGeo: idx === -2 && s.geo === true,
    view: knownView(view),
  };
  if (idx === -1) state = { ...state, ...browserPlace(state) };
  state.date = localParts(new Date(), currentPlace(state).tz).date;
  state.time = '12:00';
  controls.set(applyQuery(state));
}

const knownView = (v: string) => (VIEWS.some(([k]) => k === v) ? v : 'western');

// ?date=2026-11-09&time=02:02&place=new-york&houses=natural · ?lat=44.49&lon=11.34&tz=Europe/Rome&view=vedic
function applyQuery(s: ControlsState): ControlsState {
  let q;
  try {
    q = new URLSearchParams(window.location.search);
  } catch (e) {
    return s;
  }
  if (![...q.keys()].length) return s;
  s = { ...s, urlSync: true };
  const problems = [];

  // place first: date/time are read in the place's time zone
  const placeQ = q.get('place');
  const lat = parseFloat(q.get('lat') ?? ''),
    lon = parseFloat(q.get('lon') ?? '');
  if (placeQ) {
    const idx = PLACES.findIndex((p) => slug(p[0]) === slug(placeQ));
    if (idx >= 0) s.place = String(idx);
    else problems.push(`place "${placeQ}" is not in the list`);
  } else if (isFinite(lat) && isFinite(lon)) {
    if (Math.abs(lat) > 89 || Math.abs(lon) > 180) problems.push('lat/lon out of range');
    else {
      const tz = q.get('tz') || browserTZ();
      const zone = resolveTZ(tz);
      if (!zone) problems.push(`time zone "${tz}" is not recognised`);
      Object.assign(s, {
        place: 'custom',
        lat: String(lat),
        lon: String(lon),
        tz: zone ?? resolveTZ(browserTZ()) ?? 'UTC',
      });
    }
  } else if (q.has('lat') || q.has('lon')) problems.push('lat and lon must both be numbers');

  if (q.get('view')) s.view = knownView(slug(q.get('view')));
  const h = q.get('houses') || q.get('hsys');
  if (h) {
    const v = HOUSE_ALIASES[slug(h)];
    if (v) s.hsys = v;
    else problems.push(`house system "${h}" is not supported`);
  }

  const tz = currentPlace(s).tz;
  const dq = q.get('date');
  if (dq) {
    if (dq === 'today') s.date = localParts(new Date(), tz).date;
    else if (/^\d{4}-\d{2}-\d{2}$/.test(dq) && !isNaN(Date.parse(dq + 'T00:00:00Z'))) s.date = dq;
    else problems.push(`date "${dq}" should look like 2026-11-09`);
  }
  const tq = q.get('time');
  if (tq) {
    const m = /^(\d{1,2}):?(\d{2})$/.exec(tq);
    if (tq === 'now') {
      const lp = localParts(new Date(), tz);
      s.time = lp.time;
      if (!dq) s.date = lp.date;
    } else if (m && +m[1] < 24 && +m[2] < 60) s.time = `${pad(+m[1])}:${m[2]}`;
    else problems.push(`time "${tq}" should look like 14:30`);
  }
  if (problems.length) s.note = `Couldn't use part of the link: ${problems.join('; ')}.`;
  return s;
}

// ---------- the address bar ----------
function linkOf(s: ControlsState) {
  const q = new URLSearchParams();
  q.set('date', s.date);
  q.set('time', s.time || '12:00');
  if (s.place === 'custom') {
    q.set('lat', s.lat);
    q.set('lon', s.lon);
    q.set('tz', s.tz);
  } else q.set('place', slug(currentPlace(s).name));
  q.set('houses', s.hsys);
  if (s.view !== 'western') q.set('view', s.view);
  return `${location.pathname}?${q.toString().replace(/%2F/g, '/').replace(/%3A/g, ':')}${location.hash}`;
}
function syncURL() {
  const s = controls.get();
  if (!s.urlSync) return;
  try {
    history.replaceState(null, '', linkOf(s));
  } catch (e) {
    /* sandboxed */
  }
}
export function shareURL() {
  controls.set({ urlSync: true });
  syncURL();
  return location.href;
}

// ---------- changing the moment ----------
// a change the reader made: the address bar follows from now on, and an old warning goes
export function change(patch: Partial<ControlsState>) {
  stopPlay();
  controls.set({ ...patch, urlSync: true, note: '' });
}

// a change to the place by hand: it no longer comes from the device's location
export const changePlace = (patch: Partial<ControlsState>) => change({ ...patch, fromGeo: false });

export function shiftDay(n: number) {
  const [y, m, d] = controls.get().date.split('-').map(Number);
  change({ date: new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10) });
}

export function jumpTo(iso: string) {
  const lp = localParts(new Date(iso), currentPlace().tz);
  change({ date: lp.date, time: lp.time });
  if (isCompact()) document.querySelector('.wheelbox')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// cast the chart for another day or time of day
export function goTo(to: { date?: string; time?: string }) {
  change({ ...(to.date && { date: to.date }), ...(to.time && { time: to.time }) });
}

export const setHouses = (system: HouseSystem) => change({ hsys: system });

export function setView(v: string) {
  controls.set({ view: knownView(v), urlSync: true });
}

// this minute, where the browser is
export function goNow() {
  const s = controls.get(),
    place = browserPlace(s);
  const lp = localParts(new Date(), currentPlace({ ...s, ...place }).tz);
  change({ ...place, date: lp.date, time: lp.time });
}

// ---------- current location ----------
export function locate() {
  if (!navigator.geolocation) {
    controls.set({ note: "This browser can't share its location. Pick a place or enter coordinates under Custom." });
    return;
  }
  const btn = $('locate');
  controls.set({ locating: true });
  flash(btn, 'Locating…', 0);
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      unflash(btn);
      change({
        locating: false,
        fromGeo: true,
        place: 'custom',
        lat: pos.coords.latitude.toFixed(4),
        lon: pos.coords.longitude.toFixed(4),
        tz: resolveTZ(browserTZ()) ?? 'UTC',
      });
    },
    (err) => {
      unflash(btn);
      controls.set({
        locating: false,
        note:
          err.code === 1
            ? 'Location access was blocked. Allow it for this site in the browser, or pick a place from the list.'
            : "Couldn't get your location right now. Try again, or pick a place from the list.",
      });
    },
    { enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 },
  );
}

// ---------- the action buttons ----------
export function copyLink() {
  const url = shareURL(),
    btn = $('copylink');
  const done = (ok: boolean) => flash(btn, ok ? 'Link copied' : 'Copy failed');
  if (navigator.clipboard && navigator.clipboard.writeText)
    navigator.clipboard.writeText(url).then(
      () => done(true),
      () => done(false),
    );
  else done(false);
}

export function shareAsImage() {
  const btn = $<HTMLButtonElement>('shareimage');
  const say = (text: string) => {
    btn.disabled = false;
    if (text) flash(btn, text);
    else unflash(btn);
  };
  btn.disabled = true;
  flash(btn, 'Making image…', 0);
  shareImage(controls.get()).then(
    (how) => say(how === 'saved' ? 'Image saved' : how === 'shared' ? 'Shared' : ''),
    () => say('Could not make it'),
  );
}

// ---------- install as an app ----------
// Chrome's install prompt, held until the Install button is pressed (not in the standard DOM types)
interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<unknown>;
}
let installEvent: InstallPromptEvent | null = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  installEvent = e as InstallPromptEvent;
  controls.set({ installable: true });
});
window.addEventListener('appinstalled', () => {
  installEvent = null;
  controls.set({ installable: false });
});
export function install() {
  if (!installEvent) return;
  installEvent.prompt();
  installEvent.userChoice.finally(() => {
    installEvent = null;
    controls.set({ installable: false });
  });
}
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {
      /* offline support unavailable */
    });
  });
}

// ---------- play ----------
// the minutes still to run, and the timer for the next step
let play: { left: number; timer: ReturnType<typeof setTimeout> | undefined } | null = null;
export function stopPlay() {
  if (!play) return;
  clearTimeout(play.timer);
  play = null;
  controls.set({ playing: false });
}
function stepPlay() {
  if (!play) return;
  const s = controls.get();
  const [y, m, d] = s.date.split('-').map(Number),
    [hh, mm] = (s.time || '12:00').split(':').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d, hh, mm + 10));
  const t0 = performance.now();
  controls.set({ date: t.toISOString().slice(0, 10), time: `${pad(t.getUTCHours())}:${pad(t.getUTCMinutes())}` });
  play.left -= 10;
  if (play.left <= 0) {
    stopPlay();
    return;
  }
  play.timer = setTimeout(stepPlay, Math.max(40, 130 - (performance.now() - t0)));
}
export function togglePlay() {
  if (play) {
    stopPlay();
    return;
  }
  controls.set({ urlSync: true, note: '', playing: true });
  play = { left: 24 * 60, timer: undefined };
  stepPlay();
}

// ---------- what follows the store ----------
// Saved choices, the address bar, the tab's theme, and the arrow keys. Called once, after the first state is in.
export function startControls() {
  const theme = (view: string) => {
    VIEWS.forEach(([k, , color, cls]) => {
      const on = view === k;
      if (cls) document.documentElement.classList.toggle(cls, on);
      if (on) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color);
    });
    window.dispatchEvent(new Event('skywheel-theme'));
    try {
      localStorage.setItem('skywheel-view', view);
    } catch (e) {
      /* storage unavailable */
    }
  };
  theme(controls.get().view);

  let urlPending = false;
  controls.subscribe((s, prev) => {
    if (s.view !== prev.view) theme(s.view);
    if ((['place', 'lat', 'lon', 'tz', 'hsys', 'fromGeo'] as const).some((k) => s[k] !== prev[k]))
      saved.set({
        geo: s.fromGeo,
        place: s.place === 'custom' ? 'custom' : slug(currentPlace(s).name),
        hsys: s.hsys,
        lat: s.lat,
        lon: s.lon,
        tz: s.tz,
      });
    // once per burst of changes (Play makes one every few frames)
    if (s.urlSync && !urlPending) {
      urlPending = true;
      setTimeout(() => {
        urlPending = false;
        syncURL();
      }, 0);
    }
  });
  syncURL();

  document.addEventListener('keydown', (e) => {
    if (e.target instanceof Element && e.target.matches('input, select, textarea, [role="tab"]')) return;
    if (e.key === 'ArrowLeft') shiftDay(-1);
    if (e.key === 'ArrowRight') shiftDay(1);
  });
}
