// The moment and the place: date, time and place controls, links, tabs, the quick bar and Play.
import { HOUSE_ALIASES, PLACES, VIEWS } from '#lib/constants.ts';
import { shareImage } from '#shell/share.ts';
import { $, field, isCompact, one } from '#lib/dom.ts';
import { pad, slug } from '#lib/format.ts';
import { render, state as st } from '#lib/state.ts';
import { store } from '#lib/storage.ts';
import { localParts } from '#lib/time.ts';
import type { Place } from '#lib/types.ts';

// every time zone the browser knows, for the Custom place
const ZONES: string[] = (() => {
  try {
    return Intl.supportedValuesOf('timeZone');
  } catch (e) {
    return [...new Set(PLACES.map((p) => p[3]))].concat(['UTC']);
  }
})();

function initControls() {
  const sel = field('place');
  const saved = store.get();
  // places are remembered by name, so adding or removing cities never shifts a saved choice
  const savedIdx = saved.place === 'custom' ? 'custom' : PLACES.findIndex((p) => slug(p[0]) === saved.place);
  sel.value = savedIdx === 'custom' ? 'custom' : savedIdx >= 0 ? String(savedIdx) : '0';
  field('hsys').value =
    saved.hsys && ['placidus', 'whole', 'equal', 'natural'].includes(saved.hsys) ? saved.hsys : 'placidus';
  field('lat').value = saved.lat ?? '38.72';
  field('lon').value = saved.lon ?? '-9.14';
  field('tz').value = saved.tz || 'Europe/Lisbon';
  if (savedIdx !== 'custom' && savedIdx < 0) matchBrowserPlace();
  st.fromGeo = savedIdx === 'custom' && saved.geo === true;
  setNow(false);
  field('time').value = '12:00';
  try {
    setView(localStorage.getItem('skywheel-view') || 'western');
  } catch (e) {
    setView('western');
  }
  applyQuery();
}

// ---------- current location ----------
function locate() {
  const btn = $<HTMLButtonElement>('locate'),
    label = one('span', btn),
    note = $('urlnote');
  if (!navigator.geolocation) {
    note.textContent = "This browser can't share its location. Pick a place or enter coordinates under Custom.";
    note.hidden = false;
    return;
  }
  btn.disabled = true;
  label.textContent = 'Locating…';
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      btn.disabled = false;
      label.textContent = 'My location';
      note.hidden = true;
      st.urlSync = true;
      st.fromGeo = true;
      field('place').value = 'custom';
      field('lat').value = pos.coords.latitude.toFixed(4);
      field('lon').value = pos.coords.longitude.toFixed(4);
      pickTZ(browserTZ());
      render();
    },
    (err) => {
      btn.disabled = false;
      label.textContent = 'My location';
      note.textContent =
        err.code === 1
          ? 'Location access was blocked. Allow it for this site in the browser, or pick a place from the list.'
          : "Couldn't get your location right now. Try again, or pick a place from the list.";
      note.hidden = false;
    },
    { enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 },
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
  $('install').hidden = false;
});
window.addEventListener('appinstalled', () => {
  installEvent = null;
  $('install').hidden = true;
});
function install() {
  if (!installEvent) return;
  installEvent.prompt();
  installEvent.userChoice.finally(() => {
    installEvent = null;
    $('install').hidden = true;
  });
}
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {
      /* offline support unavailable */
    });
  });
}

function applyQuery() {
  let q;
  try {
    q = new URLSearchParams(window.location.search);
  } catch (e) {
    return;
  }
  if (![...q.keys()].length) return;
  st.urlSync = true;
  const problems = [];

  // place first: date/time are read in the place's time zone
  const placeQ = q.get('place');
  const lat = parseFloat(q.get('lat') ?? ''),
    lon = parseFloat(q.get('lon') ?? '');
  if (placeQ) {
    const idx = PLACES.findIndex((p) => slug(p[0]) === slug(placeQ));
    if (idx >= 0) field('place').value = String(idx);
    else problems.push(`place "${placeQ}" is not in the list`);
  } else if (isFinite(lat) && isFinite(lon)) {
    if (Math.abs(lat) > 89 || Math.abs(lon) > 180) problems.push('lat/lon out of range');
    else {
      field('place').value = 'custom';
      field('lat').value = String(lat);
      field('lon').value = String(lon);
      const tz = q.get('tz') || browserTZ();
      if (!pickTZ(tz)) {
        problems.push(`time zone "${tz}" is not recognised`);
        pickTZ(browserTZ());
      }
    }
  } else if (q.has('lat') || q.has('lon')) problems.push('lat and lon must both be numbers');

  if (q.get('view')) setView(slug(q.get('view')));
  const h = q.get('houses') || q.get('hsys');
  if (h) {
    const v = HOUSE_ALIASES[slug(h)];
    if (v) field('hsys').value = v;
    else problems.push(`house system "${h}" is not supported`);
  }

  const tz = currentPlace().tz;
  const dq = q.get('date');
  if (dq) {
    if (dq === 'today') field('date').value = localParts(new Date(), tz).date;
    else if (/^\d{4}-\d{2}-\d{2}$/.test(dq) && !isNaN(Date.parse(dq + 'T00:00:00Z'))) field('date').value = dq;
    else problems.push(`date "${dq}" should look like 2026-11-09`);
  }
  const tq = q.get('time');
  if (tq) {
    const m = /^(\d{1,2}):?(\d{2})$/.exec(tq);
    if (tq === 'now') {
      const lp = localParts(new Date(), tz);
      field('time').value = lp.time;
      if (!dq) field('date').value = lp.date;
    } else if (m && +m[1] < 24 && +m[2] < 60) field('time').value = `${pad(+m[1])}:${m[2]}`;
    else problems.push(`time "${tq}" should look like 14:30`);
  }
  const note = $('urlnote');
  if (problems.length) {
    note.textContent = `Couldn't use part of the link: ${problems.join('; ')}.`;
    note.hidden = false;
  }
}

function syncURL() {
  if (!st.urlSync) return;
  const q = new URLSearchParams();
  q.set('date', field('date').value);
  q.set('time', field('time').value || '12:00');
  if (field('place').value === 'custom') {
    q.set('lat', field('lat').value);
    q.set('lon', field('lon').value);
    q.set('tz', field('tz').value);
  } else q.set('place', slug(currentPlace().name));
  q.set('houses', field('hsys').value);
  if (st.view !== 'western') q.set('view', st.view);
  const url = `${location.pathname}?${q.toString().replace(/%2F/g, '/').replace(/%3A/g, ':')}${location.hash}`;
  try {
    history.replaceState(null, '', url);
  } catch (e) {
    /* sandboxed */
  }
}
function shareURL() {
  st.urlSync = true;
  syncURL();
  return location.href;
}

function currentPlace(): Place {
  const v = field('place').value;
  if (v === 'custom') {
    const lat = parseFloat(field('lat').value),
      lon = parseFloat(field('lon').value);
    const coords = `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lon).toFixed(2)}°${lon >= 0 ? 'E' : 'W'}`;
    return {
      name: st.fromGeo ? `My location (${coords})` : coords,
      lat: isFinite(lat) ? lat : 0,
      lon: isFinite(lon) ? lon : 0,
      tz: field('tz').value || 'UTC',
    };
  }
  const p = PLACES[+v] || PLACES[0];
  return { name: p[0], lat: p[1], lon: p[2], tz: p[3] };
}

function browserTZ() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch (e) {
    return 'UTC';
  }
}
// Pick the place matching the browser's time zone (keeping the current place if it already matches).
// Canonical zone name, so aliases match (Asia/Saigon = Asia/Ho_Chi_Minh, Europe/Kiev = Europe/Kyiv, ...)
function canonTZ(tz: string) {
  try {
    return new Intl.DateTimeFormat('en', { timeZone: tz }).resolvedOptions().timeZone;
  } catch (e) {
    return null;
  }
}
const sameTZ = (a: string, b: string) => a === b || (canonTZ(a) !== null && canonTZ(a) === canonTZ(b));
// Select a zone in the custom list, matching aliases; returns false when the zone is unknown.
function pickTZ(tz: string) {
  const opt = [...$<HTMLSelectElement>('tz').options].find((o) => sameTZ(o.value, tz));
  if (opt) {
    field('tz').value = opt.value;
    return true;
  }
  if (canonTZ(tz)) {
    const o = document.createElement('option');
    o.value = tz;
    o.textContent = tz.replace(/_/g, ' ');
    $('tz').appendChild(o);
    field('tz').value = tz;
    return true;
  }
  return false;
}

function matchBrowserPlace() {
  const tz = browserTZ();
  if (sameTZ(currentPlace().tz, tz)) return;
  const idx = PLACES.findIndex((p) => sameTZ(p[3], tz));
  if (idx >= 0) {
    field('place').value = String(idx);
    return;
  }
  field('place').value = 'custom';
  pickTZ(tz);
}

function setNow(withTime: boolean) {
  const tz = currentPlace().tz;
  const lp = localParts(new Date(), tz);
  field('date').value = lp.date;
  if (withTime) field('time').value = lp.time;
}

function shiftDay(n: number) {
  st.urlSync = true;
  const [y, m, d] = field('date').value.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  field('date').value = dt.toISOString().slice(0, 10);
  render();
}

function jumpTo(iso: string) {
  const t = new Date(iso),
    place = currentPlace(),
    lp = localParts(t, place.tz);
  field('date').value = lp.date;
  field('time').value = lp.time;
  st.urlSync = true;
  render();
  if (isCompact()) document.querySelector('.wheelbox')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// cast the chart for another day or time of day
function goTo(to: { date?: string; time?: string }) {
  if (to.date) field('date').value = to.date;
  if (to.time) field('time').value = to.time;
  st.urlSync = true;
  render();
}
function setHouses(system: string) {
  field('hsys').value = system;
  st.urlSync = true;
  render();
}

function setView(v: string, fromUser = false) {
  st.view = VIEWS.some(([k]) => k === v) ? v : 'western';
  VIEWS.forEach(([k, , color, theme]) => {
    const on = st.view === k;
    if (theme) document.documentElement.classList.toggle(theme, on);
    if (on) {
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', color);
    }
  });
  window.dispatchEvent(new Event('skywheel-theme'));
  try {
    localStorage.setItem('skywheel-view', st.view);
  } catch (e) {
    /* ignore */
  }
  if (fromUser) {
    st.urlSync = true;
    render();
  }
}

// ---------- sticky quick bar and play ----------
// Play: the minutes still to run, and the timer for the next step
let play: { left: number; timer: ReturnType<typeof setTimeout> | undefined } | null = null;
function syncMini() {
  field('mDate').value = field('date').value;
  field('mTime').value = field('time').value;
  field('mPlace').value = field('place').value;
}
function setPlaying(on: boolean) {
  ['play', 'mPlay'].forEach((id) => {
    const b = $(id);
    b.setAttribute('aria-pressed', String(on));
    b.classList.toggle('on', on);
  });
  one('.play-label', $('play')).textContent = on ? 'Pause' : 'Play 24 h';
  $('play').title = $('mPlay').ariaLabel = on ? 'Pause' : 'Play the next 24 hours';
}
function stopPlay() {
  if (play) {
    clearTimeout(play.timer);
    play = null;
    setPlaying(false);
  }
}
function stepPlay() {
  if (!play) return;
  const [y, m, d] = field('date').value.split('-').map(Number),
    [hh, mm] = (field('time').value || '12:00').split(':').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d, hh, mm + 10));
  field('date').value = t.toISOString().slice(0, 10);
  field('time').value = `${pad(t.getUTCHours())}:${pad(t.getUTCMinutes())}`;
  const t0 = performance.now();
  render();
  play.left -= 10;
  if (play.left <= 0) {
    stopPlay();
    return;
  }
  play.timer = setTimeout(stepPlay, Math.max(40, 130 - (performance.now() - t0)));
}
function togglePlay() {
  if (play) {
    stopPlay();
    return;
  }
  st.urlSync = true;
  play = { left: 24 * 60, timer: undefined };
  setPlaying(true);
  stepPlay();
}

// ---------- wire up ----------
function wireControls() {
  $('controls').addEventListener(
    'change',
    () => {
      st.urlSync = true;
      $('urlnote').hidden = true;
    },
    true,
  );
  $('copylink').addEventListener('click', () => {
    const url = shareURL(),
      btn = $('copylink');
    const done = (ok: boolean) => {
      btn.textContent = ok ? 'Link copied' : 'Copy failed';
      setTimeout(() => {
        btn.textContent = 'Copy link';
      }, 1600);
    };
    if (navigator.clipboard && navigator.clipboard.writeText)
      navigator.clipboard.writeText(url).then(
        () => done(true),
        () => done(false),
      );
    else done(false);
  });
  $('shareimage').addEventListener('click', () => {
    const btn = $<HTMLButtonElement>('shareimage');
    const say = (text: string) => {
      btn.disabled = false;
      btn.textContent = text;
      setTimeout(() => {
        btn.textContent = 'Share image';
      }, 1800);
    };
    btn.disabled = true;
    btn.textContent = 'Making image…';
    shareImage().then(
      (how) => say(how === 'saved' ? 'Image saved' : how === 'shared' ? 'Shared' : 'Share image'),
      () => say('Could not make it'),
    );
  });
  $('print').addEventListener('click', () => window.print());
  $('locate').addEventListener('click', locate);
  one('.tabs').addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    e.stopPropagation();
    const i = VIEWS.findIndex(([k]) => k === st.view),
      n = VIEWS.length;
    const [next, label] = VIEWS[(i + (e.key === 'ArrowRight' ? 1 : n - 1)) % n];
    setView(next, true);
    $('tab' + label).focus();
  });
  $('install').addEventListener('click', install);
  ['lat', 'lon', 'place'].forEach((id) =>
    $(id).addEventListener(
      'change',
      () => {
        st.fromGeo = false;
      },
      true,
    ),
  );
  $('prev').addEventListener('click', () => {
    stopPlay();
    shiftDay(-1);
  });
  $('next').addEventListener('click', () => {
    stopPlay();
    shiftDay(1);
  });
  $('now').addEventListener('click', () => {
    st.urlSync = true;
    matchBrowserPlace();
    setNow(true);
    render();
  });
  ['date', 'time', 'place', 'lat', 'lon', 'tz'].forEach((id) =>
    $(id).addEventListener('change', () => {
      stopPlay();
      render();
    }),
  );
  // quick bar: mirrors the main controls
  const fromMini = (id: string, mid: string) =>
    $(mid).addEventListener('change', () => {
      stopPlay();
      field(id).value = field(mid).value;
      st.urlSync = true;
      render();
    });
  fromMini('date', 'mDate');
  fromMini('time', 'mTime');
  fromMini('place', 'mPlace');
  $('mPrev').addEventListener('click', () => {
    stopPlay();
    shiftDay(-1);
  });
  $('mNext').addEventListener('click', () => {
    stopPlay();
    shiftDay(1);
  });
  $('play').addEventListener('click', togglePlay);
  $('mPlay').addEventListener('click', togglePlay);
  // show the quick bar once the main controls have scrolled out of view
  let mbShown: boolean | null = null,
    mbRaf = 0;
  const checkMini = () => {
    mbRaf = 0;
    const show = $('controls').getBoundingClientRect().bottom < 0;
    if (show === mbShown) return;
    mbShown = show;
    $('minibar').classList.toggle('show', show);
    $('minibar').setAttribute('aria-hidden', String(!show));
    $('minibar')
      .querySelectorAll<HTMLElement>('button, input, select')
      .forEach((x) => {
        x.tabIndex = show ? 0 : -1;
      });
  };
  window.addEventListener(
    'scroll',
    () => {
      if (!mbRaf) mbRaf = requestAnimationFrame(checkMini);
    },
    { passive: true },
  );
  window.addEventListener('resize', checkMini);
  checkMini();
  $('controls').addEventListener('submit', (e) => e.preventDefault());
  document.addEventListener('keydown', (e) => {
    if (e.target instanceof Element && e.target.matches('input, select, textarea')) return;
    if (e.key === 'ArrowLeft') shiftDay(-1);
    if (e.key === 'ArrowRight') shiftDay(1);
  });
}

export {
  ZONES,
  goTo,
  setHouses,
  currentPlace,
  shareURL,
  syncURL,
  jumpTo,
  setView,
  syncMini,
  stopPlay,
  initControls,
  wireControls,
  shiftDay,
  matchBrowserPlace,
  setNow,
};
