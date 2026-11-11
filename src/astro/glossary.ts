// Plain-language explanations of the terms the readings use, for the reading card's "Explain terms" switch.
// Each entry names a term, the pattern that finds it in a line, and one or two sentences for someone new to it.
// A `section` limits an entry to one section of the reading, where a word means something particular there.

export interface GlossaryEntry {
  term: string;
  match: RegExp;
  text: string;
  section?: string;
}

// the terms in a line, in glossary order, leaving out those already explained (`seen`, which this adds to)
export function termsIn(line: string, glossary: GlossaryEntry[], section: string, seen = new Set<string>()) {
  const found: GlossaryEntry[] = [];
  for (const g of glossary) {
    if (seen.has(g.term) || (g.section && g.section !== section) || !g.match.test(line)) continue;
    seen.add(g.term);
    found.push(g);
  }
  return found;
}

export const WESTERN: GlossaryEntry[] = [
  {
    term: 'Rising sign',
    match: /\brising\b/,
    text: 'The sign coming up over the eastern horizon at this moment and place, also called the Ascendant. It changes about every two hours, so it is the most local part of a chart.',
  },
  {
    term: 'Ruler',
    match: /\bruler\b/,
    text: 'Every sign has a planet that rules it, its owner. Where that planet sits shows where the sign’s energy goes.',
  },
  {
    term: 'Houses',
    match: /\b\d+(st|nd|rd|th) house\b/,
    text: 'The sky around a place is divided into twelve houses, each an area of life: money, home, partners, work. Which house a planet is in depends on the time and the place, not only the date.',
  },
  {
    term: 'Moon phase',
    match: /\b(New|Full) Moon\b|\b(Waxing|Waning) (Crescent|Gibbous)\b|\b(First|Last) Quarter\b/,
    text: 'How far the Moon has moved from the Sun: new when they meet, full when they are opposite. Waxing means growing towards full, waning means shrinking towards new.',
  },
  {
    term: 'Conjunction',
    match: /\bconjunction\b/,
    text: 'Two planets at the same place in the zodiac. Their themes blend and act together.',
  },
  {
    term: 'Sextile',
    match: /\bsextile\b/,
    text: 'Two planets 60° apart, a sixth of the circle. A mild, helpful link that rewards a little effort.',
  },
  {
    term: 'Square',
    match: /(?<!T-)\bsquare\b/,
    text: 'Two planets 90° apart, a quarter of the circle. Friction and tension that push for action.',
  },
  {
    term: 'Trine',
    match: /(?<!Grand )\btrine\b/,
    text: 'Two planets 120° apart, a third of the circle. Things flow easily, sometimes too easily to notice.',
  },
  {
    term: 'Opposition',
    match: /\bopposition\b/,
    text: 'Two planets 180° apart, facing each other across the wheel. A pull between two sides that asks for balance.',
  },
  {
    term: 'Quincunx',
    match: /\bquincunx\b/,
    text: 'Two planets 150° apart, with little in common. They need constant small adjustments to work together.',
  },
  {
    term: 'Orb',
    match: /from exact/,
    text: 'An aspect works within a few degrees either side of its exact angle; that margin is the orb, and the closer to exact, the stronger. Building means the planets are still moving towards exact, fading that they have passed it.',
  },
  {
    term: 'Stellium',
    match: /\bStellium\b/,
    text: 'Four or more planets in one sign, so that sign’s themes dominate.',
  },
  {
    term: 'T-square',
    match: /\bT-square\b/,
    text: 'Two planets in opposition, both square to a third. A tense, driven shape in which the third planet, the focus, carries the strain.',
  },
  {
    term: 'Yod',
    match: /\bYod\b/,
    text: 'Two planets 60° apart, both 150° from a third. Sometimes called the finger of fate: an awkward, lasting pressure on the focus planet.',
  },
  {
    term: 'Grand Trine',
    match: /\bGrand Trine\b/,
    text: 'Three planets each 120° from the others, a triangle usually within one element. Ease and talent, with a risk of complacency.',
  },
  {
    term: 'Elements',
    match: /\b(Fire|Earth|Air|Water)\b|Elements even/,
    section: 'Balance',
    text: 'The signs come in four elements: Fire (Aries, Leo, Sagittarius), Earth (Taurus, Virgo, Capricorn), Air (Gemini, Libra, Aquarius) and Water (Cancer, Scorpio, Pisces). Counting the planets in each shows the temperament.',
  },
  {
    term: 'Modes',
    match: /\b(Cardinal|Fixed|Mutable) signs\b/,
    section: 'Balance',
    text: 'The signs also come in three modes: cardinal signs start things, fixed signs hold on, mutable signs adapt.',
  },
  {
    term: 'Domicile',
    match: /\bdomicile\b/,
    text: 'A planet in a sign it rules: at home, and at its most natural.',
  },
  {
    term: 'Exaltation',
    match: /\bexaltation\b/,
    text: 'A planet in the sign where it is honoured and at its strongest.',
  },
  {
    term: 'Detriment',
    match: /\bdetriment\b/,
    text: 'A planet in the sign opposite its home, where it works against the grain.',
  },
  {
    term: 'Fall',
    match: /\(fall\)/,
    text: 'A planet in the sign opposite its exaltation, where it is at its weakest.',
  },
  {
    term: 'Retrograde',
    match: /\bretrograde\b/,
    text: 'Seen from Earth, a planet seems to move backwards for a while. Its themes turn to review and revision rather than new starts.',
  },
];

export const VEDIC: GlossaryEntry[] = [
  {
    term: 'Tithi',
    match: /\b(Shukla|Krishna) [A-Z]\w+|\btithi\b/,
    text: 'A lunar day: the time the Moon takes to move 12° further from the Sun. A month has 30, fifteen in the bright half (Shukla, waxing) and fifteen in the dark half (Krishna, waning).',
  },
  {
    term: 'Tithi groups',
    match: /\b(Nanda|Bhadra|Jaya|Rikta|Purna) tithi\b/,
    text: 'The tithis repeat in five kinds, Nanda (joy), Bhadra (well-being), Jaya (victory), Rikta (empty) and Purna (full), each suited to different work.',
  },
  {
    term: 'Vara',
    match: /\b[A-Z]\w+vara\b/,
    text: 'The weekday. Each is ruled by a graha: Ravivara (Sunday) by the Sun, Somavara (Monday) by the Moon, and so on through the week.',
  },
  {
    term: 'Nakshatra',
    match: /\bnakshatra\b/,
    text: 'One of 27 lunar mansions, each 13°20′ of the zodiac. The nakshatra the Moon is in sets much of the day’s tone.',
  },
  {
    term: 'Nature of a nakshatra',
    match: /\bIts nature is\b/,
    text: 'Each nakshatra has a nature (fixed, moving, soft, sharp, fierce, swift or mixed) that says which kinds of work it suits.',
  },
  {
    term: 'Yoga of the day',
    match: /\byoga\b/,
    section: 'The day',
    text: 'One of 27 yogas, counted from the Sun’s and the Moon’s longitudes added together. A quality of the day, not the same as the yogas of the chart.',
  },
  {
    term: 'Karana',
    match: /\bkaranas?\b/,
    text: 'Half a tithi. There are eleven: seven moving ones that repeat through the month, and four fixed ones that fall around the new Moon.',
  },
  {
    term: 'Lagna',
    match: /\blagna\b/,
    text: 'The rising sign, the Vedic Ascendant. It is the first house, and so decides which sign falls in every other house.',
  },
  {
    term: 'Sidereal signs',
    match: /\b(Mesha|Vrishabha|Mithuna|Karka|Simha|Kanya|Tula|Vrishchika|Dhanu|Makara|Kumbha|Meena)\b/,
    text: 'The Vedic zodiac has the same twelve signs as the Western one, but measures them against the stars rather than the seasons, so they sit about 24° behind and a planet is often one sign earlier.',
  },
  {
    term: 'Graha',
    match: /\bgrahas?\b/i,
    text: 'The nine bodies of Vedic astrology: Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, and the Moon’s nodes, Rahu and Ketu. The word means one that seizes.',
  },
  {
    term: 'Rahu and Ketu',
    match: /\b(Rahu|Ketu)\b(?! Kaal)/,
    text: 'The points where the Moon’s path crosses the Sun’s, north (Rahu) and south (Ketu). Shadow grahas: Rahu hungers and amplifies, Ketu detaches and lets go.',
  },
  {
    term: 'Lord',
    match: /\blord\b/,
    text: 'The graha that rules a sign. A house’s lord, and the house it sits in, say how that house’s matters fare.',
  },
  {
    term: 'Kendra',
    match: /\bkendra\b|\ban angle\b/,
    text: 'The angles: houses 1, 4, 7 and 10, the pillars of the chart. Grahas here are strong and their effects are easy to see.',
  },
  {
    term: 'Trikona',
    match: /\btrikona\b|\btrine\b/,
    text: 'The trines: houses 1, 5 and 9, the most fortunate houses.',
  },
  {
    term: 'Dusthana',
    match: /\bdusthana\b|\bdifficult house\b/,
    text: 'The difficult houses, 6, 8 and 12: illness and enemies, sudden change, and loss.',
  },
  {
    term: 'Upachaya',
    match: /\bupachaya\b|\bgrowing house\b/,
    text: 'The growing houses, 3, 6, 10 and 11, where things improve with time and effort. Malefics do well here.',
  },
  {
    term: 'Benefic and malefic',
    match: /\b(benefic|malefic)\b/,
    text: 'Jupiter, Venus, and usually Mercury and a bright Moon are natural benefics, helpful by nature. Saturn, Mars, the Sun, Rahu and Ketu are natural malefics, harder by nature.',
  },
  {
    term: 'Exalted and debilitated',
    match: /\b(exalted|debilitated)\b/i,
    text: 'Each graha has one sign where it is strongest (exalted) and, opposite it, one where it is weakest (debilitated).',
  },
  {
    term: 'Own sign',
    match: /\bown sign\b/i,
    text: 'A graha in a sign it rules: at home and comfortable.',
  },
  {
    term: 'Combust',
    match: /\bcombust\b/i,
    text: 'A graha so close to the Sun that it disappears in the glare (asta). Its matters are said to be taken over by the Sun’s.',
  },
  {
    term: 'Navamsa',
    match: /\bnavamsa\b/,
    text: 'The ninth-part chart (D9), with each sign divided into nine. It is read for a graha’s real strength, and for marriage and later life.',
  },
  {
    term: 'Vargottama',
    match: /\bVargottama\b/,
    text: 'A graha in the same sign in the main chart and the navamsa. Consistent in both, it is strengthened.',
  },
  {
    term: 'Yoga in a chart',
    match: /\byogas?\b/,
    section: 'Yogas',
    text: 'A combination: an arrangement of grahas named in the classical texts and read as a result of its own.',
  },
  {
    term: 'Dasha',
    match: /\b(maha)?dasha\b/,
    text: 'The Vimshottari dashas divide a 120-year life into periods ruled by the nine grahas in turn, starting from the Moon’s nakshatra at birth. The mahadasha is the main period.',
  },
  {
    term: 'Rahu Kaal',
    match: /\bRahu Kaal\b/,
    text: 'About an hour and a half each day, an eighth of the daylight, when new undertakings are avoided.',
  },
];

export const CHINESE: GlossaryEntry[] = [
  {
    term: 'Day Master',
    match: /\bDay Master\b/,
    text: 'The stem of the day pillar. In Four Pillars astrology it stands for the self, and everything else is read by how it relates to it.',
  },
  {
    term: 'Stems and branches',
    match: /\b(stem|branch)(es)?\b/,
    text: 'Each pillar is a heavenly stem over an earthly branch. The ten stems are the five elements in a yang and a yin form; the twelve branches are the twelve animals.',
  },
  {
    term: 'Four Pillars',
    match: /\b(year|month|day|hour)\b/i,
    section: 'Branches',
    text: 'The year, month, day and hour of a moment, each written as a stem over a branch: eight characters in all.',
  },
  {
    term: 'Yin and yang',
    match: /\b(Yin|Yang)\b/,
    text: 'Every stem is yang (active, outward) or yin (receptive, inward); the stems alternate between them.',
  },
  {
    term: 'Five elements',
    match: /\b(Wood|Fire|Earth|Metal|Water)\b/,
    text: 'Wood feeds Fire, Fire makes Earth, Earth bears Metal, Metal carries Water, and Water feeds Wood. Each also controls the one two steps on: Wood breaks Earth, Earth dams Water, and so on.',
  },
  {
    term: 'Strength in season',
    match: /\((旺|相|休|囚|死)\)/,
    text: 'How the month’s element treats the Day Master: prosperous (旺) when it is in season, then prime (相), resting (休), trapped (囚), and dead (死) when the season is against it.',
  },
  {
    term: 'Clash',
    match: /\bclash(es)?\b/,
    text: 'Two branches opposite each other on the circle of twelve, like Rat and Horse. They jolt and pull apart.',
  },
  {
    term: 'Six harmonies',
    match: /\bsix-harmony\b|\bcombine\b/,
    text: 'Six pairs of branches that bind together, like Rat and Ox, and make a new element between them.',
  },
  {
    term: 'Three harmonies',
    match: /\bthree-harmony\b|\bframe\b/,
    text: 'Three branches four apart, like Monkey, Rat and Dragon, that together form one strong element. Two of them with the middle one make a half frame.',
  },
  {
    term: 'Twelve officers',
    match: /\bofficers?\b/,
    text: 'An almanac cycle (Jian Chu) counted from the month’s branch to the day’s. Each of the twelve says what the day suits and what it does not.',
  },
];

export const MAYA: GlossaryEntry[] = [
  {
    term: "Tzolk'in",
    match: /^(1[0-3]|[1-9]) \S+ · /,
    section: 'The day',
    text: 'The 260-day count: thirteen numbers turning with twenty day signs, so each pairing of number and sign comes round once every 260 days.',
  },
  {
    term: 'Directions',
    match: /\b(east|north|west|south)\b/i,
    text: 'The signs belong in turn to the four directions and their colours: east and red, north and white, west and black, south and yellow.',
  },
  {
    term: 'Numbers',
    match: /\bThe number \d+/,
    text: 'The thirteen numbers carry weight of their own: 1 to 5 are gentle, 6 to 9 balanced, 10 to 13 strong, and a strong number makes a sign’s day more intense.',
  },
  {
    term: 'Trecena',
    match: /\btrecena\b|\bthirteen days\b/,
    text: 'A run of thirteen days, numbered 1 to 13, named after the sign on which it began.',
  },
  {
    term: "Haab'",
    match: /\bHaab'/,
    text: 'The 365-day year: eighteen months of twenty days, and five days more.',
  },
  {
    term: 'Year bearer',
    match: /\byear bearer\b|\bcarries the year\b/,
    text: "The Tzolk'in day on which a Haab' year begins. Only four signs can fall there, and they take turns year by year.",
  },
  {
    term: "Wayeb'",
    match: /\bWayeb'/,
    text: 'The five days left over at the end of the Haab’ year, outside the months and without names of their own.',
  },
];

export const KABBALAH: GlossaryEntry[] = [
  {
    term: 'Sefirot',
    match: /\bsefir(a|ot)\b|\b(Chesed|Gevurah|Tiferet|Netzach|Hod|Yesod|Malkhut)\b/,
    text: 'The ten attributes through which, in Kabbalah, the infinite is revealed, drawn as the Tree of Life. The seven lower ones, from Chesed (lovingkindness) to Malkhut (kingdom), are the emotional and active ones.',
  },
  {
    term: 'Sefer Yetzirah',
    match: /\bSefer Yetzirah\b/,
    text: 'The Book of Formation, one of the oldest Kabbalistic texts. It gives each of the twelve simple letters of the alphabet a month, a sign, a tribe and a human sense.',
  },
  {
    term: 'The Omer',
    match: /\bOmer\b/,
    text: 'The 49 days counted each evening from the second night of Pesach to Shavuot. Kabbalists pair each week with a sefira and each day with a facet of it, for seven weeks of refining character.',
  },
  {
    term: 'She-be',
    match: /\bshe-be-/,
    text: 'Hebrew for “that is within”: Gevurah she-be-Chesed is the strength within lovingkindness.',
  },
  {
    term: 'Shabbat',
    match: /\bShabbat\b/,
    text: 'The seventh day, from sunset on Friday to nightfall on Saturday: a day of rest from creative work, linked with Malkhut, the presence of the Shekhinah.',
  },
  {
    term: 'Hebrew day',
    match: /\bfrom the evening before\b/,
    text: 'The Hebrew day begins at sunset, so every holy day starts the evening before its civil date.',
  },
  {
    term: 'Teshuvah',
    match: /\bteshuvah\b/,
    text: 'Return: repentance understood as coming back to oneself and to God, the work of Elul and the High Holy Days.',
  },
];

export const ISLAMIC: GlossaryEntry[] = [
  {
    term: 'Hijri calendar',
    match: /\bAH\b|\bcrescent\b/,
    text: 'The Islamic lunar calendar, counted from the Hijra, the Prophet’s move from Mecca to Medina in 622. Its twelve months follow the Moon, so it runs about eleven days a year ahead of the solar calendar.',
  },
  {
    term: 'Umm al-Qura',
    match: /\bUmm al-Qura\b/,
    text: 'The calendar of Saudi Arabia, which starts each month by a calculated rule at Mecca. Many communities instead wait for the crescent to be seen locally.',
  },
  {
    term: 'Sunnah',
    match: /\bsunnah\b/,
    text: 'The practice of the Prophet. Something called a sunnah is recommended and rewarded, but not obligatory.',
  },
  {
    term: "Jumu'ah",
    match: /\bJumu'ah\b/,
    text: 'Friday, and the congregational prayer held at midday in place of Dhuhr, with a sermon (khutbah).',
  },
  {
    term: 'Ayyam al-Bid',
    match: /\bAyyam al-Bid\b|\bwhite days\b/,
    text: 'The 13th, 14th and 15th of each Hijri month, when the Moon is full and the nights are bright.',
  },
  {
    term: 'Sacred months',
    match: /\bsacred months\b/,
    text: 'Muharram, Rajab, Dhu al-Qa’dah and Dhu al-Hijjah, four months named in the Quran in which fighting was forbidden.',
  },
  {
    term: 'Zakat al-Fitr',
    match: /\bZakat al-Fitr\b/,
    text: 'A small charity of food, or its value, given for every member of the household before the Eid al-Fitr prayer.',
  },
  {
    term: 'Udhiyah',
    match: /\budhiyah\b/,
    text: 'The animal sacrifice of Eid al-Adha, remembering Ibrahim; the meat is shared between the household, relatives and the poor.',
  },
  {
    term: 'Takbir',
    match: /\btakbir\b/,
    text: 'Saying “Allahu akbar”, God is greatest, repeated aloud in the days of Eid.',
  },
  {
    term: 'Ayyam al-Tashriq',
    match: /\bTashriq\b/,
    text: 'The 11th to 13th of Dhu al-Hijjah, the days after Eid al-Adha, on which fasting is not done.',
  },
  {
    term: 'Laylat al-Qadr',
    match: /\bLaylat al-Qadr\b/,
    text: 'The Night of Power, when the Quran was first revealed, described as better than a thousand months. Its date is not known; it is sought in the last ten nights of Ramadan.',
  },
  {
    term: 'Maghrib',
    match: /\bMaghrib\b/,
    text: 'The sunset prayer. The Islamic day begins at Maghrib, so an occasion starts the evening before its civil date.',
  },
  {
    term: 'Lunar mansions',
    match: /\bmansions?\b/,
    text: 'The 28 manāzil al-qamar, stations of the Moon through the stars, used by the Arabs before Islam to mark seasons and rain. Kept here as heritage.',
  },
];
