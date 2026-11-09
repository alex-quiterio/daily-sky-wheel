<div align="center">

# ✦ Daily Sky Wheel ✦

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

Pick a day, a time and a place and the sky comes back as a chart.

| | |
|---|---|
| **☉ The wheel** | Sun to Pluto, Chiron, the North Node, Lilith, Ceres, Pallas, Juno, Vesta and the Vertex. The signs are coloured by element, and aspect lines run through the centre. Planets that sit close together are fanned out so their labels don't overlap. |
| **☾ The day** | The Moon's phase, then everything that happens between midnight and midnight local time: New and Full Moons, quarters, sign changes, stations and exact aspects, each with its time to the minute. Click any of them to recast the wheel for that moment. |
| **✶ Positions** | Degree, sign and minute for every body, with retrograde flags and the house each one falls in. |
| **△ Balance and patterns** | Counts by element and mode, the chart ruler, and any Yod, T-square, Grand Trine or stellium. |
| **⌂ Houses** | Placidus, Whole sign, Equal, or Natural (Aries on the 1st). |
| **✧ Hover anything** | Every symbol has a tooltip. **Planets** show position to the arcsecond, house, daily motion, latitude, declination (flagged when out of bounds), dignity, the houses they rule, antiscia, and each aspect with its orb and whether it's applying or separating. **Signs** show element, mode, polarity, rulers, exaltation, detriment and fall, and which cusps and bodies fall in them. **Houses** show the cusp, size, the cusp ruler and where it sits, interceptions and the bodies inside. **Angles and aspect lines** have their own details. Hovering a planet lights up its aspects. Click or tap a symbol to pin its tooltip, and press Esc to close it. |

Move through the days with **‹ ›** or the arrow keys. **Now** casts the chart for this minute in your own time zone, picked up from the browser.

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

All 22 checks pass:

- every body's degree, sign and retrograde flag
- the Ascendant, Midheaven and Vertex
- the Placidus cusps
- the **Yod to Mercury** in that chart
- the New Moon time, to the minute
- Mercury stationing retrograde on 24 October 2026

GitHub Actions runs the tests on every push.

## ♄ How it works

```
index.html         the page
src/core.js        positions, houses, Ascendant / MC / Vertex
src/events.js      aspects, patterns, element balance, Moon phase, the day's events
src/app.js         controls, time zones, the SVG wheel
src/stars.js       the twinkling sky behind it all
src/styles.css     the night theme
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

<sub>Made with Claude Code.</sub>

</div>
