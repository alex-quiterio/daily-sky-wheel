<div align="center">

<img src="assets/logo.svg" alt="Daily Sky Wheel logo: a crescent moon and an eight-pointed star inside a ring of zodiac ticks" width="132">

# Daily Sky Wheel

**The astrology chart for any day and place, drawn live in your browser.**

♈ ♉ ♊ ♋ ♌ ♍ ♎ ♏ ♐ ♑ ♒ ♓

[![Open the wheel](https://img.shields.io/badge/open_the_wheel-alex--quiterio.github.io-d8b46a?style=for-the-badge&labelColor=07061a)](https://alex-quiterio.github.io/daily-sky-wheel/)
<br>
[![tests](https://github.com/alex-quiterio/daily-sky-wheel/actions/workflows/test.yml/badge.svg)](https://github.com/alex-quiterio/daily-sky-wheel/actions/workflows/test.yml)
![no build step](https://img.shields.io/badge/build_step-none-a58bff?labelColor=15112f)
![dependencies](https://img.shields.io/badge/runtime_deps-1-a58bff?labelColor=15112f)

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
| **ॐ Vedic tab** | Jyotish with the Lahiri ayanamsa. The Panchang shows tithi, vara, nakshatra, yoga and karana, each with the time it ends, plus the amanta month with adhika months. It also shows sunrise and sunset, Rahu Kaal, Yamaganda, Gulika and Abhijit muhurta; a North or South Indian rashi chart (whole-sign houses from the Lagna); the grahas with nakshatra, pada, house and dignity; the Vimshottari dasha for someone born at that moment; and the **days ahead**, a year of festivals, Ekadashis, Purnimas, Amavasyas and Sankrantis, each placed by its traditional observance rule (the tithi at sunrise, midday, afternoon, pradosh or midnight, with skipped tithis, Bhadra for Holika Dahan, and no festivals in an adhika month). Its theme is saffron and marigold, with a lotus and a nakshatra ring, falling petals and Devanagari lettering. Open with `view=vedic`. |
| **هـ Islamic tab** | The Hijri date in Arabic, with months by the Umm al-Qura rule and the day turning at Maghrib. Prayer times for the place: five methods, a Shafi'i or Hanafi Asr, the current prayer and a countdown to the next, and a high-latitude fallback. Also the Qibla compass and distance, Islamic dates ahead, and the Moon's age with tonight's crescent visibility. The Arab lunar mansions are shown as heritage sky-lore. Its theme is night teal and gold, with an eight-pointed star tiling, arched panels and Amiri lettering. Open with `view=islamic`. |
| **♄ Planetary hours** | The 24 unequal hours from sunrise to the next sunrise, in Chaldean order from the weekday's ruler. Shows the day ruler, the current hour with a countdown, every hour's start time, and each planet's traditional uses. Click an hour to cast the chart for its start. |
| **✶ Positions** | Degree, sign and minute for every body, with retrograde flags and the house each one falls in. |
| **△ Balance and patterns** | Counts by element and mode, the chart ruler, and any Yod, T-square, Grand Trine or stellium. |
| **⌂ Houses** | Placidus, Whole sign, Equal, or Natural (Aries on the 1st), switched from the toggle above the wheel. |
| **✧ Hover anything** | Every symbol has a tooltip. **Houses** open with a plain-language line on what that house covers, for anyone new to astrology. **Planets** show position to the arcsecond, house, daily motion, latitude, declination (flagged when out of bounds), dignity, the houses they rule, antiscia, and each aspect with its orb and whether it's applying or separating. **Signs** show element, mode, polarity, rulers, exaltation, detriment and fall, and which cusps and bodies fall in them. **Houses** show the cusp, size, the cusp ruler and where it sits, interceptions and the bodies inside. **Angles and aspect lines** have their own details. Hovering a planet lights up its aspects. Click or tap a symbol to pin its tooltip, and press Esc to close it. |

**My location** uses your device's position (the browser asks first). The **i** next to the house toggle explains all twelve houses, and hovering a house system explains how it divides the chart.

**▶ Play 24 h** runs the next day in 10-minute steps, about 20 seconds in all, so you can watch the Ascendant sweep the houses and every tab change. Once you scroll past the controls, a compact bar stays pinned at the top with the day, time, place and play.

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

It's a static page with no build step.

```sh
git clone https://github.com/alex-quiterio/daily-sky-wheel.git
cd daily-sky-wheel
npm start            # → http://localhost:3000
```

Opening `index.html` directly works too.

## ☿ Proven against a real chart

The calculations are checked against a reference chart cast in desktop astrology software: the **Scorpio New Moon of 9 November 2026, 2:02 AM EST, New York**.

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
index.html         the page
src/core.js        positions, houses, Ascendant / MC / Vertex
src/events.js      aspects, patterns, element balance, Moon phase, the day's events, the year ahead
src/chinese.js     Four Pillars, solar terms, Chinese lunar calendar
src/maya.js        Long Count, Tzolk'in, Haab', Lords of the Night
src/hebrew.js      Hebrew calendar, holy days, Omer, Sefer Yetzirah correspondences
src/vedic.js       Lahiri sidereal positions, nakshatras, Panchang, Rahu Kaal, lunar month, dasha
src/islamic.js     Hijri calendar (Umm al-Qura rule), prayer times, Qibla, crescent, lunar mansions
src/app.js         controls, time zones, the SVG wheel
src/stars.js       the twinkling sky behind it all
src/styles.css     the night theme
assets/logo.svg    the logo, also the browser tab icon
assets/icons/      app icons
manifest.webmanifest, sw.js   install as an app, work offline
```

- **Planets** come from [Astronomy Engine](https://github.com/cosinekitty/astronomy) (MIT), accurate to well under an arcminute.
- **Houses and angles** are computed from sidereal time and the true obliquity of the ecliptic.
- **The day's events** are found by sampling the sky every hour, then bisecting each crossing to within 30 seconds.
- **Time zones** use the browser's own `Intl` database, so daylight-saving changes come out right.

## ⚷ Accuracy

| Bodies | Method | Accuracy |
|---|---|---|
| Sun to Pluto | Astronomy Engine (VSOP87, ELP) | < 1′ |
| True Node, mean Lilith | Meeus' series | a few arcminutes |
| Chiron, Ceres, Pallas, Juno, Vesta ≈ | Keplerian elements tuned to the reference chart | a few arcminutes over 2024–2029, drifting outside that |

Placidus falls back to Equal houses above 66° latitude. There's no city search, because the page makes no network calls. A place outside the preset list goes in as custom latitude, longitude and time zone.

<div align="center">
<br>

☉ ☽ ☿ ♀ ♂ ♃ ♄ ♅ ♆ ♇

</div>
