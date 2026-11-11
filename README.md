<div align="center">

<img src="assets/logo.svg" alt="Daily Sky Wheel logo: a crescent moon and an eight-pointed star inside a ring of zodiac ticks" width="132">

# Daily Sky Wheel

**The astrology chart for any day and place, drawn live in your browser.**

♈ ♉ ♊ ♋ ♌ ♍ ♎ ♏ ♐ ♑ ♒ ♓

[![Open the wheel](https://img.shields.io/badge/open_the_wheel-alex--quiterio.github.io-d8b46a?style=for-the-badge&labelColor=07061a)](https://alex-quiterio.github.io/daily-sky-wheel/)
<br>
[![tests](https://github.com/alex-quiterio/daily-sky-wheel/actions/workflows/test.yml/badge.svg)](https://github.com/alex-quiterio/daily-sky-wheel/actions/workflows/test.yml)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-a58bff?labelColor=15112f)
![dependencies](https://img.shields.io/badge/runtime_deps-2-a58bff?labelColor=15112f)

<br>

<a href="https://alex-quiterio.github.io/daily-sky-wheel/"><img src="docs/screenshot.png" alt="Daily Sky Wheel showing the Scorpio New Moon of 9 November 2026: the chart wheel with aspect lines, the day's events and the positions table" width="900"></a>

</div>

<br>

## ☽ What it shows

Six traditions, in tabs ordered by when each was first documented: **Western** (Babylonian omens, c. 1600 BCE), **Chinese** (Shang oracle bones, c. 1250 BCE), **Vedic** (nakshatras in the Vedas, c. 1200–1000 BCE), **Maya** (the 260-day count, c. 600–300 BCE), **Kabbalah** (Sefer Yetzirah, 2nd–6th century CE) and **Islamic** (the Hijri calendar, 638 CE).

Pick a day, a time and a place and the sky comes back as a chart.

| | |
|---|---|
| **☉ The wheel** | Sun to Pluto, Chiron, the North Node, Lilith, Ceres, Pallas, Juno, Vesta and the Vertex. The signs are coloured by element, and aspect lines run through the centre. Planets that sit close together are fanned out so their labels don't overlap. |
| **☾ The day** | The Moon's phase, then everything that happens between midnight and midnight local time: New and Full Moons, quarters, sign changes, stations and exact aspects, each with its time to the minute. Click any of them to recast the wheel for that moment. |
| **✦ Year ahead** | The next 12 months from today: solar and lunar eclipses, retrograde and direct stations, sign changes of Jupiter through Pluto, Chiron and the North Node, exact aspects between the outer planets, Venus star points, and the equinoxes and solstices. Filter by kind, and click any entry to cast the chart for that moment. |
| **中 Chinese tab** | Four Pillars (BaZi) for the moment: stems, branches, hidden stems and Ten Gods around the Day Master; the Five Elements balance; the Chinese lunar date with leap months; the year's animal (turning at Chinese New Year); the current and next solar term; the day's clash; and a wheel of the twelve animals marking the year, month, day and hour. Add `view=chinese` to a link to open on it. The tab has its own theme: black lacquer, cinnabar and jade, brush-calligraphy characters, a seal of the year's animal, drifting lanterns and a turning ring of the branches and trigrams. |
| **◎ Maya tab** | The Tzolk'in day (number and day sign with meaning, direction and colour), the trecena, the day of the 260-day count, the Lord of the Night, the Long Count in bar-and-dot numerals, the Haab' date and year bearer, the next 20 days, and the 13 and 20 calendar gears turning to the selected day. GMT correlation. Its theme is jungle jade and turquoise, with a carved jade emblem, a pyramid skyline and fireflies. Open with `view=maya`. |
| **א Kabbalah tab** | The Hebrew date in Hebrew letters, with the day turning at local sunset; holy days; sunset, nightfall, and Shabbat candle-lighting and Havdalah times for the place; the month's letter, sign, tribe and sense from Sefer Yetzirah; the coming holy days; the sefira and planet of the weekday; the Counting of the Omer in season; and the Tree of Life with the day's sefirot lit. Its theme is sapphire and white-gold light, with Hebrew letters and rising sparks. Open with `view=kabbalah`. |
| **ॐ Vedic tab** | Jyotish with the Lahiri ayanamsa. The Panchang shows tithi, vara, nakshatra, yoga and karana, each with the time it ends, plus the amanta month with adhika months. It also shows sunrise and sunset, Rahu Kaal, Yamaganda, Gulika and Abhijit muhurta; a North or South Indian rashi chart (whole-sign houses from the Lagna); the grahas with nakshatra, pada, house and dignity; the Vimshottari dasha for someone born at that moment; a **reading** that leads the tab, with the day's five limbs explained (tithi group, the nakshatra's nature and gana, auspicious and inauspicious yogas, Vishti karana), the Lagna, Moon and Sun, classical yogas (Gajakesari, Budha-Aditya, the five Mahapurusha yogas, Kala Sarpa, Kemadruma, combustion, vargottama and more), then every graha and every house as a line that unfolds into its sign lord, nakshatra, navamsa, aspects cast and received, and condition; and the **days ahead**, a year of festivals, Ekadashis, Purnimas, Amavasyas and Sankrantis, each placed by its traditional observance rule (the tithi at sunrise, midday, afternoon, pradosh or midnight, with skipped tithis, Bhadra for Holika Dahan, and no festivals in an adhika month). Its theme is saffron and marigold, with a lotus and a nakshatra ring, falling petals and Devanagari lettering. Open with `view=vedic`. |
| **هـ Islamic tab** | The Hijri date in Arabic, with months by the Umm al-Qura rule and the day turning at Maghrib. Prayer times for the place: five methods, a Shafi'i or Hanafi Asr, the current prayer and a countdown to the next, and a high-latitude fallback. Also the Qibla compass and distance, Islamic dates ahead, and the Moon's age with tonight's crescent visibility. The Arab lunar mansions are shown as heritage sky-lore. Its theme is night teal and gold, with an eight-pointed star tiling, arched panels and Amiri lettering. Open with `view=islamic`. |
| **♄ Planetary hours** | The 24 unequal hours from sunrise to the next sunrise, in Chaldean order from the weekday's ruler. Shows the day ruler, the current hour with a countdown, every hour's start time, and each planet's traditional uses. Click an hour to cast the chart for its start. |
| **✶ Positions** | Degree, sign and minute for every body, with retrograde flags and the house each one falls in. |
| **△ Balance and patterns** | Counts by element and mode, the chart ruler, and any Yod, T-square, Grand Trine or stellium. |
| **❋ Reading** | Beside the wheel: a short summary of the chart in plain words, what the moment is **good for** and what to **go easy on**, then sections that fold open. Sun, Moon, phase and rising sign; the five tightest aspects; patterns; the balance of elements and modes; planets strong or strained by sign; retrogrades; and crowded houses. Each line's heading opens the matching tooltip and lights that planet or aspect on the wheel. **Copy reading** copies it with a link to the moment. |
| **⌂ Houses** | Placidus, Whole sign, Equal, or Natural (Aries on the 1st), switched from the toggle above the wheel. |
| **✧ Hover anything** | Every symbol has a tooltip. **Houses** open with a plain-language line on what that house covers, for anyone new to astrology. **Planets** show position to the arcsecond, house, daily motion, latitude, declination (flagged when out of bounds), dignity, the houses they rule, antiscia, and each aspect with its orb and whether it's applying or separating. **Signs** show element, mode, polarity, rulers, exaltation, detriment and fall, and which cusps and bodies fall in them. **Houses** show the cusp, size, the cusp ruler and where it sits, interceptions and the bodies inside. **Angles and aspect lines** have their own details. Hovering a planet lights up its aspects. Click or tap a symbol to pin its tooltip, and press Esc to close it. |

**My location** uses your device's position (the browser asks first). The **i** next to the house toggle explains all twelve houses, and hovering a house system explains how it divides the chart.

Every button in the controls is an icon: play, my location, now, copy link, share image, print and (when the browser offers it) install. Hover one for its name. **Share image** turns the open tab into a picture (title, date, the tab's drawing and the reading's summary, in that tab's colours) and hands it to the phone's share sheet, or saves it where there is none. **Print** lays the open tab out for paper: ink on white, one column, every section of a reading unfolded, and no controls.

**▶ Play** runs the next 24 hours in 10-minute steps, about 20 seconds in all, so you can watch the Ascendant sweep the houses and every tab change. Once you scroll past the controls, a compact bar stays pinned at the top with the day, time, place and play.

Move through the days with **‹ ›** or the arrow keys. **Now** casts the chart for this minute in your own time zone, picked up from the browser.

## ☾ Install it as an app

In Chrome or Edge, click **Install app** on the page, or use the install icon in the address bar. It opens in its own window with the logo as its icon, and works offline once it has loaded. On iPhone and iPad, use Safari's **Share → Add to Home Screen**.

## ⚹ Link to any moment

Add the date, time and place to the URL and the page opens on that chart. Once a link has parameters, the address keeps up with the form as you change it, and **Copy link** copies it for you.

```
?date=2026-11-09&time=02:02&place=new-york&houses=natural
?date=2026-03-20&time=14:30&lat=44.49&lon=11.34&tz=Europe/Rome
?place=bologna&time=now
```

| Parameter | Format | Notes |
|---|---|---|
| `date` | `YYYY-MM-DD` or `today` | |
| `time` | `HH:MM`, `HHMM` or `now` | Local time at the place. `now` also sets today's date. |
| `place` | a preset name | Any case, with or without accents, hyphens or spaces, e.g. `new-york`, `Francavilla al Mare`, `francavilla-al-mare` |
| `lat`, `lon` | decimal degrees | For places not in the list. North and east are positive. |
| `tz` | IANA zone, e.g. `Europe/Rome` | Used with `lat`/`lon`. Defaults to your browser's zone. |
| `houses` | `placidus`, `whole`, `equal`, `natural` | |
| `view` | `western`, `chinese`, `vedic`, `maya`, `kabbalah` or `islamic` | Which tab opens |

If part of a link can't be read, the page says which part and uses its default for that field.

## ✦ Start

It's a static page built with TypeScript and Preact. `scripts/build.mjs` runs esbuild over `src/`: the page (`dist/app.js`, `dist/app.css`), one bundle per tab (`dist/view-<tab>.js` and `.css`, loaded the first time the tab is opened), the chunks they share, and `dist/worker.js`. Each tab sits behind its own error boundary, so a tab that fails to load or draw shows a Try again card and leaves the rest of the page working.

```sh
git clone https://github.com/alex-quiterio/daily-sky-wheel.git
cd daily-sky-wheel
npm install
npm run dev          # rebuilds on every save → http://localhost:8000
```

| Command | What it does |
|---|---|
| `npm run dev` | Serve the page and rebuild the bundle on every save |
| `npm run build` | Write the minified bundle to `dist/` |
| `npm start` | Build once, then serve on http://localhost:3000 |
| `npm test` | Run the reference tests (Node 24 runs the TypeScript directly) |
| `npm run typecheck` | Type-check the whole project in strict mode |
| `npm run lint` | Lint with ESLint |
| `npm run format` | Format with Prettier |
| `npm run check` | Type-check, lint, test and check formatting in one go |

## ☿ Proven against a real chart

The calculations are checked against two reference charts. The first was cast in desktop astrology software: the **Scorpio New Moon of 9 November 2026, 2:02 AM EST, New York**. The second is fifty years earlier and in the southern hemisphere, **20 July 1975, 11:45 AM, Buenos Aires**, with the planets, node, Lilith and houses from the Swiss Ephemeris and Chiron and the asteroids from JPL Horizons. Chiron, the asteroids and true Lilith are also checked at dates spread from 1900 to 2099.

```sh
npm install && npm test
```

All checks pass:

- every body's degree, sign and retrograde flag
- the Ascendant, Midheaven and Vertex
- the Placidus cusps
- the **Yod to Mercury** in that chart
- the New Moon time, to the minute
- Mercury stationing retrograde on 24 October 2026
- the 2027 eclipses, stations and ingresses in the year ahead
- Chinese New Year from 2020 to 2034 (including the tricky 2033), the 2020, 2023 and 2025 leap months, and Four Pillars for 1 Jan 2000
- Rosh Hashanah 5785–5787, Pesach, Chanukah and Purim (including a leap-year Adar II), Tisha B'Av, the sunset turnover and Lag BaOmer as day 33 of the Omer, Hod she'b'Hod
- the 2026 festival calendar for Delhi, from Makar Sankranti to Diwali (16 festivals checked)
- the Lahiri ayanamsa (24°13′ in 2026), the 2026 Adhika Jyeshtha month, Diwali closing amanta Ashvina, and the tithi turning from Amavasya to Shukla Pratipada at the New Moon
- Ramadan 1445–1447, both Eids, the 1448 New Year, the evening turnover, the Qibla from Amsterdam, the Hanafi Asr and the high-latitude fallback
- the Maya date of 21 Dec 2012: 13.0.0.0.0 4 Ajaw 3 K'ank'in, Lord of the Night G9

GitHub Actions runs the tests on every push.

## ♄ How it works

```
index.html               the head, the sky canvas and the mount point
src/app.tsx              start-up, the render loop, loading each tab on demand, and the <App> component
src/worker.ts            the Web Worker: runs the slow calculations away from the page
src/astro/               the calculations: no DOM, tested with node
  index.ts               one namespace per tradition: Core, Western, Chinese, Vedic, Maya, Hebrew, Islamic
  reading.ts             the shape both readings produce
  core.ts                positions, houses, Ascendant / MC / Vertex (Chart, Point)
  western.ts             aspects, patterns, balance, Moon phase, the day's events, the year ahead, planetary hours
  western-reading.ts     the Western reading, in plain words
  chinese.ts             Four Pillars, solar terms, Chinese lunar calendar
  vedic.ts               Lahiri sidereal positions, nakshatras, Panchang, Rahu Kaal, lunar month, dasha, festivals
  vedic-reading.ts       the Jyotish reading: the day, yogas, every graha and every house
  maya.ts                Long Count, Tzolk'in, Haab', Lords of the Night
  hebrew.ts              Hebrew calendar, holy days, Omer, Sefer Yetzirah correspondences
  islamic.ts             Hijri calendar (Umm al-Qura rule), prayer times, Qibla, crescent, lunar mansions
src/lib/                  what the page shares that is not a component
  types.ts               the contract between the page and its tabs: ViewDef, ViewProps, Moment, Place, HeaderInfo
  constants.ts           glyphs, colours, the preset places, the tabs
  state.ts               the current view and moment; where tabs and tooltips register
  dom.ts                 form fields by id, the SVG helper, the phone breakpoint
  format.ts              positions, glyphs and labels as text
  time.ts                local time at a place
  storage.ts             the choices remembered between visits
  jobs.ts                the slow calculations, as jobs that take and return plain data
  background.ts          runs a job in the worker, or on the main thread if the worker cannot start
src/components/          reusable pieces, one per file
  Card, Row, Bars, Chips, Drawing, ReadingCard, Tooltip, Tip, TabBoundary, useStored
src/shell/               the page around the tabs
  Tabs, Header, Controls, MiniBar, MethodNotes
  controls.ts            the controls store (date, time, place, houses, open tab) and every action on it; links, Play
  stars.ts               the twinkling sky behind it all
  share.ts               the open tab as a picture, to share or save
  base.css, shell.css    the night theme and page layout
  print.css              the page on paper
src/views/<tab>/         one folder per tab: western, chinese, vedic, maya, kabbalah, islamic
  index.tsx              the components, and nothing else
  model.ts               build(moment): everything worked out for one moment, as plain data
  types.ts               the model's shape
  constants.ts           the tab's fixed lists and colours
  draw.ts                its SVG drawing (the wheel, the gears, the Tree of Life, ...)
  tips.tsx               what its tooltips say, as components
  styles.css             its theme
assets/                  the logo and app icons
manifest.webmanifest, sw.js   install as an app, work offline
```

The page is built with [Preact](https://preactjs.com). A tab registers three things under its name, and `ViewDef` in `lib/types.ts` is the contract: `build(moment)` works everything out for the chosen moment and place as plain data, `header(model)` says what the page header shows, and a `View` component draws the model. The render loop in `app.tsx` reads the controls, casts the chart once, and publishes the `moment`; `<App>` hands it to the open tab. The larger SVG drawings are plain drawing functions wrapped in a `<Drawing>` component.

The folders are layers, and ESLint enforces which may import from which (`eslint.config.js`):

```
astro  →  lib  →  components  →  shell  →  views  →  app.tsx
```

A folder may import from itself and from the ones to its left, never from one to its right. On top of that:

- `src/astro` imports nothing but itself and `astronomy-engine`: no Preact, no page code.
- A tab never imports from another tab. What two tabs share belongs in `src/lib` or `src/components`.
- A tab's `model.ts`, `types.ts` and `constants.ts` are plain data: no Preact and no components.
- The tests import from `#astro` only.
- Outside `src/astro`, imports go through an alias, not a relative path.

Imports use aliases instead of relative paths: `#astro` for the calculations, then `#lib/…`, `#components/…`, `#shell/…` and `#views/…`. They are plain Node [subpath imports](https://nodejs.org/api/packages.html#subpath-imports) set in `package.json`, so TypeScript, esbuild and the test runner all resolve them the same way.

- **Planets** come from [Astronomy Engine](https://github.com/cosinekitty/astronomy) (MIT), accurate to well under an arcminute.
- **Houses and angles** are computed from sidereal time and the true obliquity of the ecliptic.
- **The day's events** are found by sampling the sky every hour, then bisecting each crossing to within 30 seconds.
- **The year ahead and the Vedic festival year** are worked out in a Web Worker (`dist/worker.js`), so the page stays responsive while they run. If the worker cannot start, the same code runs on the main thread.
- **Time zones** use the browser's own `Intl` database, so daylight-saving changes come out right.

Ideas for where the project could go next, in depth, code quality and usability, are in [docs/explorations.md](docs/explorations.md).

## ⚷ Accuracy

| Bodies | Method | Accuracy |
|---|---|---|
| Sun to Pluto | Astronomy Engine (VSOP87, ELP) | < 1′ |
| True Node, mean Lilith | Meeus' series | a few arcminutes |
| True Lilith | the osculating lunar apogee, from the Moon's position and velocity | within 10′ of the Swiss Ephemeris |
| Chiron, Ceres, Pallas, Juno, Vesta | two-body orbits from JPL Horizons elements, a row every 1–2 years (`astro/orbits.ts`, made by `scripts/fetch-orbits.mjs`) | within 1.5′ from 1900 to 2100; marked ≈ outside those years |

Placidus falls back to Equal houses above 66° latitude. There's no city search, because the page makes no network calls. A place outside the preset list goes in as custom latitude, longitude and time zone.

<div align="center">
<br>

☉ ☽ ☿ ♀ ♂ ♃ ♄ ♅ ♆ ♇

</div>
