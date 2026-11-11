# Explorations

Ideas for where Daily Sky Wheel could go next. None of this is planned or promised. Each item names what it would add, where it would live in the code, and a rough size: **S** (an afternoon), **M** (a few days), **L** (a week or more).

The three sections are independent. Within each, items are ordered by how much they would change the experience for the effort.

## 1. Depth: more to read in the sky

### A birth chart to read against

The readings already say "for someone born at this minute, the same lines describe character", but the page has no way to keep a birth moment. Saving one opens most of what follows.

| Idea | What it adds | Where | Size |
|---|---|---|---|
| Saved moments | Name and keep a date, time and place (yourself, family, an event). Stored in `localStorage`, picked from the controls. | `shell/controls.ts`, a small `lib/saved.ts` | M |
| Transits to a saved chart | A second ring on the wheel for the saved chart, and a reading of today's planets against it: "Saturn is crossing your Moon". | `astro/western.ts` (aspects between two sets of points), `views/western/draw.ts`, a new section in `astro/western-reading.ts` | L |
| Vedic transits from the birth Moon | Sade Sati, tarabala and chandrabala: how today's nakshatra and Saturn sit from the birth Moon. | `astro/vedic.ts`, `astro/vedic-reading.ts` | M |
| Compare two people | Aspects between two saved charts, and the Vedic ashtakoota match. | new `astro/synastry.ts` | L |

### Western reading

| Idea | What it adds | Size |
|---|---|---|
| The Moon's next aspects | "The Moon meets Mars at 13:43": the day's events are already computed in `Western.dayEvents`, so the reading can name what is coming and when. | S |
| Void-of-course Moon | The stretch between the Moon's last aspect and its next sign. Traditionally a time when nothing started comes to much. Belongs in "good for / go easy on". | M |
| Planets on the angles | A planet within a few degrees of the Ascendant or Midheaven is the loudest thing in a chart for a place. The tooltip already finds these; the reading does not use them. | S |
| Sect | Whether the chart is by day or by night changes which planets help. One line, and it sharpens the "strength by sign" section. | S |
| House rulers | "The ruler of the 7th is in the 12th". The Vedic reading does this for every house; the Western one only does it for the Ascendant. | M |
| Mutual reception | Two planets in each other's signs. A small addition to the dignity section. | S |

### Vedic reading

| Idea | What it adds | Size |
|---|---|---|
| Navamsa chart | The navamsa sign of every graha is already computed for the reading. Drawing the D9 beside the rashi chart is mostly a second call to `drawRashi`. | M |
| Antardashas | The sub-periods inside each mahadasha, so the dasha card can be opened one level deeper, the way the reading can. | M |
| Neecha bhanga | The reading says a debilitated graha is weak "unless other factors cancel it". It could check the classical cancellation rules and say so. | M |
| Choghadiya and hora | The other two ways of dividing the day, next to Rahu Kaal in the Muhurta card. | M |
| Special aspects of the nodes | Many traditions give Rahu and Ketu the 5th and 9th aspects. Currently they only cast the 7th. Worth a setting rather than a silent choice. | S |

### The other two tabs

The reading card (`components/ReadingCard.tsx`) takes any `Reading`, so each tradition only needs a module that produces one, and a short glossary in `astro/glossary.ts` for Explain terms. Western, Vedic, Chinese and Maya have theirs.

| Tab | A reading could cover | Size |
|---|---|---|
| Kabbalah | The day's sefira, the month's letter and sense, the Omer pair in season, and what a coming holy day asks for. | M |
| Islamic | Kept factual: the day's occasions and what is recommended on them. The lunar mansions stay labelled as heritage. | S |

A **"today across traditions"** strip at the top of the page, one line from each tab, would let someone see all six without clicking through. **M**, once the readings exist.

### Accuracy

| Idea | Why | Size |
|---|---|---|
| Better orbits for Chiron and the asteroids | They use fixed elements tuned to one reference chart, good for 2024 to 2029 and drifting outside it. A small table of elements by epoch would cover a lifetime of birth dates, which saved charts will need. | M |
| True Black Moon Lilith | Only the mean one is offered. | S |
| A second reference chart | Every test is checked against one chart in 2026. A second, decades away and in the southern hemisphere, would catch what the first cannot. | S |

## 2. Good practices: making the code easier to trust and change

### Finish what the rewrite started

| Idea | Why it matters | Size |
|---|---|---|
| The wheel as JSX | The SVG drawings (each tab's `draw.ts`) are imperative functions wrapped in `<Drawing>`. Fine for now, but the wheel as components would let a planet be a thing that can be focused, tested and animated. Do this only if the wheel needs to change. | L |

### Tests that match how the project is checked

| Idea | Why it matters | Size |
|---|---|---|
| A browser check in CI | The rewrite was verified by loading each tab in headless Chrome and comparing it with the previous version. That was done by hand. A Playwright run that opens all six tabs for the reference moment and fails on a console error would make it permanent. | M |
| Golden readings | The reading tests check structure, not words. A saved copy of each reading for the reference chart would show every wording change in review. | S |
| Component tests | `ReadingCard` has real behaviour (folding, remembered sections, the heading that opens a tooltip without folding). It deserves tests of its own. | M |
| Expert review of the tables | The interpretive tables in `western-reading.ts` and `vedic-reading.ts` are one encoding of traditional rules. Someone who practises each tradition should read a handful of charts. | S, but needs the right person |
| The service worker | It now keeps every bundle the build lists in `dist/files.json`, so each tab opens offline, but that has only been reasoned about, not tried. An offline load of all six tabs in the browser check would cover it. | S |

### Tooling

| Idea | Why | Size |
|---|---|---|
| Text separate from logic | The readings mix rules and English sentences. Moving the phrases into data would make translation possible (Portuguese, Dutch) and wording changes safer. | L |

## 3. Usability: making it easier to use and to understand

### Finding your way around a reading

| Idea | What changes for the reader | Size |
|---|---|---|
| Click the wheel, land in the reading | Headings in the reading already light the wheel. The reverse is missing: clicking a planet should scroll to and open the lines about it. | S |
| A section index | The Vedic reading has 33 lines across six sections. A small index of the sections that stays in view on phones, next to Open all and Close all. | S |
| Remember unfolded lines | Sections are remembered between visits; individual lines are not. | S |

### Moving through time

| Idea | What changes | Size |
|---|---|---|
| A time slider | Play runs the next 24 hours at one speed. A slider under the wheel, with a speed choice and a "by day" mode, would let people scrub to the moment they want. | M |
| Jump to the next event | "Next New Moon", "next Mercury station": the year ahead already knows them. | S |
| Calendar export | An `.ics` file of the year ahead, or of the Vedic, Hebrew and Islamic dates ahead, for a calendar app. | M |

### Places and sharing

| Idea | What changes | Size |
|---|---|---|
| City search | Sixteen preset cities, or latitude and longitude by hand. A bundled list of a few thousand cities with their time zones would keep the page free of network calls and still find most places. | M |

### Accessibility and first impressions

| Idea | What changes | Size |
|---|---|---|
| Check the phone layout | It has not been looked at since the move to Preact. The markup is the same, so it should hold, but nobody has seen it. | S |
| The wheel for screen readers | The wheel is one image with the label "Chart wheel". The reading's summary could be its description. | S |
| Focus when a tab changes | Arrow keys move between tabs, but focus stays on the tab row. Moving it to the panel's first heading helps keyboard and screen-reader users. | S |
| A first-visit hint | One dismissible line: "Hover or tap any symbol. Open a line to go deeper." | S |
| Light theme | Every theme is dark. A light one matters for reading in daylight and for print. Large, because six themes each need a counterpart. | L |

## Suggested first steps

If only a few of these are done, these give the most for the least:

1. **Check the phone layout and add the browser check to CI.** It protects everything else.
2. **Click the wheel, land in the reading.** Small, and it makes the reading feel connected to the chart in both directions.
3. **Saved moments.** It turns a daily almanac into something personal, and unlocks transits, comparisons and the Vedic birth-Moon readings.
4. **The Moon's next aspects and the void-of-course Moon.** They make the Western reading about today rather than about the chart in general.
