# Daily Sky Wheel

A daily astrology chart that runs in the browser. Pick a day, a time and a place, and it draws the chart wheel. Alongside the wheel it shows the planet positions, houses, aspects and patterns, plus everything that happens in the sky that day.

## What it shows

- **Wheel:** Sun to Pluto, Chiron, the true North Node, mean Lilith, Ceres, Pallas, Juno, Vesta and the Vertex. The Ascendant, MC, Descendant and IC are marked on the wheel, and aspect lines are drawn in the centre.
- **The day:** Moon phase, then every lunation, sign change, station and exact aspect between local midnight and the next midnight. Click an event to recast the chart for that moment.
- **Positions:** degree, sign, retrograde flag and house.
- **Balance and patterns:** counts by element and mode, the chart ruler, and any Yod, T-square, Grand Trine or stellium.
- **Houses:** Placidus, Whole sign, Equal or Natural (Aries on the 1st).

Move through days with the ‹ › buttons or the arrow keys.

## Run it

It is a static page with no build step.

```sh
npm start          # serves the folder at http://localhost:3000
```

Opening `index.html` directly in a browser also works.

## Test it

```sh
npm install
npm test
```

The tests compare the calculations against a reference chart: the Scorpio New Moon of 9 Nov 2026 at 2:02 AM EST in New York. They check every body's position and retrograde flag, the angles, the Placidus cusps, the Yod to Mercury, the New Moon time and Mercury's retrograde station on 24 Oct 2026.

## How it works

| File | What it does |
|---|---|
| `src/core.js` | Positions and houses. Planets come from [Astronomy Engine](https://github.com/cosinekitty/astronomy) (MIT). This file also computes the node, Lilith, Chiron and the asteroids, plus the Ascendant, MC, Vertex and house cusps. |
| `src/events.js` | Aspects, patterns, element and mode balance, Moon phase, and the day's events. Events are found by hourly sampling, then bisected to within 30 seconds. |
| `src/app.js` | Controls, time zones and the SVG wheel. |
| `src/styles.css` | Light and dark themes. |

## Accuracy

- **Planets:** Astronomy Engine positions, to under an arcminute.
- **Chiron, Ceres, Pallas, Juno, Vesta:** fixed orbital elements tuned to the reference chart, marked ≈ on the page. They are within a few arcminutes around 2024–2029 and drift further out. Accurate positions across centuries would need the Swiss Ephemeris.
- **Placidus:** falls back to Equal houses above 66° latitude.
- **Places:** there is no city search, because the page makes no network calls. Places outside the preset list go in as custom latitude, longitude and time zone.
