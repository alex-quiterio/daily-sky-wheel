// Vedic astrology (Jyotish): sidereal positions with the Lahiri ayanamsa, nakshatras, Panchang,
// Rahu Kaal and friends, the amanta lunar month and Vimshottari dasha. Needs AstroCore and Astronomy.
(function (root) {
  const A = root.Astronomy, C = root.AstroCore;
  const norm = (x) => ((x % 360) + 360) % 360;
  const DAY = 86400000, NAK = 360 / 27;

  // Lahiri (Chitrapaksha) ayanamsa: 23°51′25.5″ at J2000, precessing about 50.29″ a year
  function ayanamsa(date) {
    const years = (A.MakeTime(date).tt) / 365.25;
    return 23.857083 + (50.2879 / 3600) * years + (0.000111 / 3600) * years * years;
  }
  const sidereal = (lon, date) => norm(lon - ayanamsa(date));

  // [English, Sanskrit, Devanagari]
  const RASHIS = [
    ['Aries', 'Mesha', 'मेष'], ['Taurus', 'Vrishabha', 'वृषभ'], ['Gemini', 'Mithuna', 'मिथुन'], ['Cancer', 'Karka', 'कर्क'],
    ['Leo', 'Simha', 'सिंह'], ['Virgo', 'Kanya', 'कन्या'], ['Libra', 'Tula', 'तुला'], ['Scorpio', 'Vrishchika', 'वृश्चिक'],
    ['Sagittarius', 'Dhanu', 'धनु'], ['Capricorn', 'Makara', 'मकर'], ['Aquarius', 'Kumbha', 'कुम्भ'], ['Pisces', 'Meena', 'मीन'],
  ];
  // [key, Sanskrit, Devanagari, short]
  const GRAHAS = [
    ['Sun', 'Surya', 'सूर्य', 'Su'], ['Moon', 'Chandra', 'चन्द्र', 'Mo'], ['Mars', 'Mangala', 'मंगल', 'Ma'], ['Mercury', 'Budha', 'बुध', 'Me'],
    ['Jupiter', 'Guru', 'गुरु', 'Ju'], ['Venus', 'Shukra', 'शुक्र', 'Ve'], ['Saturn', 'Shani', 'शनि', 'Sa'], ['Rahu', 'Rahu', 'राहु', 'Ra'], ['Ketu', 'Ketu', 'केतु', 'Ke'],
  ];
  // [name, deity, meaning]
  const NAKSHATRAS = [
    ['Ashwini', 'the Ashvins', 'Swift healing and new starts.'], ['Bharani', 'Yama', 'Bearing, restraint and transformation.'],
    ['Krittika', 'Agni', 'Cutting, purifying fire.'], ['Rohini', 'Prajapati', 'Growth, beauty and fertility.'],
    ['Mrigashira', 'Soma', 'Searching, curiosity, the seeker.'], ['Ardra', 'Rudra', 'Storms that clear; effort and renewal.'],
    ['Punarvasu', 'Aditi', 'Return of the light, renewal.'], ['Pushya', 'Brihaspati', 'Nourishment; the most auspicious.'],
    ['Ashlesha', 'the Nagas', 'Embrace, hidden wisdom, kundalini.'], ['Magha', 'the Pitris', 'Ancestry, honour, the throne.'],
    ['Purva Phalguni', 'Bhaga', 'Rest, pleasure and creativity.'], ['Uttara Phalguni', 'Aryaman', 'Patronage, contracts and kindness.'],
    ['Hasta', 'Savitar', 'Skill of the hand, craft and wit.'], ['Chitra', 'Tvashtar', 'Brilliance, design, the jewel.'],
    ['Swati', 'Vayu', 'Independence, movement, trade.'], ['Vishakha', 'Indra and Agni', 'Determined pursuit of a goal.'],
    ['Anuradha', 'Mitra', 'Friendship, devotion and success abroad.'], ['Jyeshtha', 'Indra', 'Seniority, protection, power.'],
    ['Mula', 'Nirriti', 'The root; uprooting, investigation.'], ['Purva Ashadha', 'Apas', 'Invincibility, conviction, waters.'],
    ['Uttara Ashadha', 'the Vishvedevas', 'Lasting victory, principle.'], ['Shravana', 'Vishnu', 'Listening, learning, connection.'],
    ['Dhanishta', 'the Vasus', 'Wealth, rhythm and music.'], ['Shatabhisha', 'Varuna', 'The hundred healers; secrecy and cures.'],
    ['Purva Bhadrapada', 'Aja Ekapada', 'Fierce fire of transformation.'], ['Uttara Bhadrapada', 'Ahir Budhnya', 'Depth, patience and wisdom.'],
    ['Revati', 'Pushan', 'Safe journeys, nourishment, the end of the cycle.'],
  ];
  const DASHA_ORDER = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'];
  const DASHA_YEARS = { Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7, Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17 };
  const TITHIS = ['Pratipada', 'Dvitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami', 'Ekadashi', 'Dvadashi', 'Trayodashi', 'Chaturdashi'];
  const YOGAS = ['Vishkambha', 'Priti', 'Ayushman', 'Saubhagya', 'Shobhana', 'Atiganda', 'Sukarma', 'Dhriti', 'Shula', 'Ganda', 'Vriddhi', 'Dhruva', 'Vyaghata', 'Harshana', 'Vajra', 'Siddhi', 'Vyatipata', 'Variyan', 'Parigha', 'Shiva', 'Siddha', 'Sadhya', 'Shubha', 'Shukla', 'Brahma', 'Indra', 'Vaidhriti'];
  const KARANAS_MOVING = ['Bava', 'Balava', 'Kaulava', 'Taitila', 'Gara', 'Vanija', 'Vishti'];
  const VARAS = [['Ravivara', 'Sun'], ['Somavara', 'Moon'], ['Mangalavara', 'Mars'], ['Budhavara', 'Mercury'], ['Guruvara', 'Jupiter'], ['Shukravara', 'Venus'], ['Shanivara', 'Saturn']];
  // amanta month named after the Sun's sidereal sign at the new moon that starts it
  const MONTHS = ['Vaishakha', 'Jyeshtha', 'Ashadha', 'Shravana', 'Bhadrapada', 'Ashvina', 'Kartika', 'Margashirsha', 'Pausha', 'Magha', 'Phalguna', 'Chaitra'];
  // dignities: [exaltation sign, debilitation sign, own signs]
  const DIGNITY = { Sun: [0, 6, [4]], Moon: [1, 7, [3]], Mars: [9, 3, [0, 7]], Mercury: [5, 11, [2, 5]], Jupiter: [3, 9, [8, 11]], Venus: [11, 5, [1, 6]], Saturn: [6, 0, [9, 10]] };
  // Rahu Kaal, Yamaganda and Gulika: which eighth of the daytime, by weekday (Sunday = 0)
  const RAHU = [8, 2, 7, 5, 6, 4, 3], YAMA = [5, 4, 3, 2, 1, 7, 6], GULIKA = [7, 6, 5, 4, 3, 2, 1];

  function meanNode(date) {
    const T = (A.MakeTime(date).tt) / 36525;
    return norm(125.0445479 - 1934.1362891 * T + 0.0020754 * T * T);
  }
  function nakshatraOf(sid) {
    const i = Math.floor(sid / NAK), within = sid - i * NAK;
    return { i, pada: Math.floor(within / (NAK / 4)) + 1, frac: within / NAK, lord: DASHA_ORDER[i % 9] };
  }
  function dignity(name, sign) {
    const d = DIGNITY[name]; if (!d) return '';
    if (d[0] === sign) return 'Exalted';
    if (d[1] === sign) return 'Debilitated';
    if (d[2].includes(sign)) return 'Own sign';
    return '';
  }

  function grahas(date) {
    const ay = ayanamsa(date);
    const list = GRAHAS.slice(0, 7).map(([key]) => {
      const t = C.lonOf(key, date), s = key === 'Sun' || key === 'Moon' ? 1 : C.speed(key, date);
      return { key, sid: norm(t - ay), retro: s < 0 };
    });
    const ra = norm(meanNode(date) - ay);
    list.push({ key: 'Rahu', sid: ra, retro: true }, { key: 'Ketu', sid: norm(ra + 180), retro: true });
    list.forEach((g) => { g.sign = Math.floor(g.sid / 30); g.deg = g.sid - g.sign * 30; g.nak = nakshatraOf(g.sid); g.dignity = dignity(g.key, g.sign); });
    return { list, ayanamsa: ay };
  }

  // find when f(t) crosses a target (f increases with time), searching forward up to `days`
  function nextCrossing(f, target, from, days) {
    const step = 3600000;
    let t0 = from.getTime(), v0 = norm(f(new Date(t0)) - target);
    for (let t = t0 + step; t <= t0 + days * DAY; t += step) {
      const v = norm(f(new Date(t)) - target);
      if (v < v0 - 180) { // wrapped past the target
        let a = t - step, b = t;
        for (let k = 0; k < 30; k++) { const m = (a + b) / 2; if (norm(f(new Date(m)) - target) > 180) a = m; else b = m; }
        return new Date((a + b) / 2);
      }
      v0 = v;
    }
    return null;
  }

  function panchang(date, lat, lon, dayStart) {
    const sunT = C.lonOf('Sun', date), moonT = C.lonOf('Moon', date), ay = ayanamsa(date);
    const elong = norm(moonT - sunT);
    const sunS = norm(sunT - ay), moonS = norm(moonT - ay);
    const elongF = (d) => norm(C.lonOf('Moon', d) - C.lonOf('Sun', d));
    const moonSF = (d) => norm(C.lonOf('Moon', d) - ayanamsa(d));
    const yogaF = (d) => norm(C.lonOf('Moon', d) + C.lonOf('Sun', d) - 2 * ayanamsa(d));

    const ti = Math.floor(elong / 12); // 0..29
    const tithi = { n: ti + 1, paksha: ti < 15 ? 'Shukla' : 'Krishna', name: ti === 14 ? 'Purnima' : ti === 29 ? 'Amavasya' : TITHIS[ti % 15], ends: nextCrossing(elongF, (ti + 1) * 12 % 360, date, 2) };
    const nk = nakshatraOf(moonS);
    const nakshatra = { ...nk, name: NAKSHATRAS[nk.i][0], deity: NAKSHATRAS[nk.i][1], ends: nextCrossing(moonSF, ((nk.i + 1) * NAK) % 360, date, 2) };
    const yi = Math.floor(norm(sunS + moonS) / NAK);
    const yoga = { n: yi + 1, name: YOGAS[yi], ends: nextCrossing(yogaF, ((yi + 1) * NAK) % 360, date, 2) };
    const k = Math.floor(elong / 6);
    const kname = k === 0 ? 'Kimstughna' : k >= 57 ? ['Shakuni', 'Chatushpada', 'Naga'][k - 57] : KARANAS_MOVING[(k - 1) % 7];
    const karana = { n: k + 1, name: kname, ends: nextCrossing(elongF, ((k + 1) * 6) % 360, date, 1.5) };

    // sunrise and sunset of the civil day that starts at local midnight `dayStart`
    let sunrise = null, sunset = null;
    if (dayStart) {
      const obs = new A.Observer(lat, lon, 0);
      const r = A.SearchRiseSet(A.Body.Sun, obs, +1, dayStart, 1), st = A.SearchRiseSet(A.Body.Sun, obs, -1, dayStart, 1);
      sunrise = r && r.date; sunset = st && st.date;
    }
    return { tithi, nakshatra, yoga, karana, sunrise, sunset, ayanamsa: ay, sunSid: sunS, moonSid: moonS };
  }

  // Rahu Kaal etc. from sunrise/sunset and the weekday (0 = Sunday)
  function periods(sunrise, sunset, weekday) {
    if (!sunrise || !sunset) return null;
    const part = (sunset - sunrise) / 8;
    const slot = (n) => ({ start: new Date(sunrise.getTime() + (n - 1) * part), end: new Date(sunrise.getTime() + n * part) });
    const mid = sunrise.getTime() + (sunset - sunrise) / 2, muh = (sunset - sunrise) / 15;
    return { rahu: slot(RAHU[weekday]), yama: slot(YAMA[weekday]), gulika: slot(GULIKA[weekday]), abhijit: { start: new Date(mid - muh / 2), end: new Date(mid + muh / 2) } };
  }

  // amanta lunar month: new moon before and after; named by the Sun's sidereal sign at its starting new moon
  function lunarMonth(date) {
    let t = A.MakeTime(new Date(date.getTime() - 31 * DAY)), prev = null;
    for (let k = 0; k < 3; k++) { const nm = A.SearchMoonPhase(0, t, 40); if (!nm || nm.date > date) break; prev = nm; t = nm.AddDays(1); }
    const next = A.SearchMoonPhase(0, prev ? prev.AddDays(1) : A.MakeTime(date), 40);
    const signAt = (d) => Math.floor(norm(C.lonOf('Sun', d) - ayanamsa(d)) / 30);
    const s0 = signAt(prev.date), s1 = signAt(next.date);
    return { name: MONTHS[s0], adhika: s0 === s1, start: prev.date, end: next.date };
  }

  // Vimshottari dasha sequence for a moment, from the Moon's nakshatra
  function dashas(date, moonSid, count = 9) {
    const nk = nakshatraOf(moonSid);
    let i = DASHA_ORDER.indexOf(nk.lord);
    const out = [];
    let start = date.getTime();
    const yearMs = 365.25 * DAY;
    const firstLeft = (1 - nk.frac) * DASHA_YEARS[nk.lord];
    for (let k = 0; k < count; k++) {
      const lord = DASHA_ORDER[(i + k) % 9];
      const len = k === 0 ? firstLeft : DASHA_YEARS[lord];
      out.push({ lord, start: new Date(start), end: new Date(start + len * yearMs), years: len });
      start += len * yearMs;
    }
    return out;
  }

  // ---------- days ahead: festivals and observances ----------
  // [amanta month, tithi 1-30 (16-30 = Krishna), name, when the tithi is read: sunrise | sunset | midnight, kind]
  const FESTIVALS = [
    ['Chaitra', 1, 'Ugadi · Gudi Padwa', 'sunrise', 'Hindu new year in the south and west'],
    ['Chaitra', 9, 'Rama Navami', 'midday', 'birth of Rama, celebrated at midday'],
    ['Chaitra', 15, 'Hanuman Jayanti', 'sunrise', ''],
    ['Vaishakha', 3, 'Akshaya Tritiya', 'forenoon', 'the undiminishing third'],
    ['Vaishakha', 15, 'Buddha Purnima', 'sunrise', ''],
    ['Ashadha', 15, 'Guru Purnima', 'sunrise', 'honouring teachers'],
    ['Shravana', 15, 'Raksha Bandhan', 'sunrise', ''],
    ['Shravana', 23, 'Krishna Janmashtami', 'midnight', 'birth of Krishna at midnight'],
    ['Bhadrapada', 4, 'Ganesh Chaturthi', 'midday', ''],
    ['Ashvina', 1, 'Navaratri begins', 'sunrise', 'nine nights of the Goddess'],
    ['Ashvina', 8, 'Durga Ashtami', 'sunrise', ''],
    ['Ashvina', 10, 'Dussehra · Vijayadashami', 'afternoon', ''],
    ['Ashvina', 15, 'Sharad Purnima', 'sunset', ''],
    ['Ashvina', 28, 'Dhanteras', 'sunset', ''],
    ['Ashvina', 30, 'Diwali · Lakshmi Puja', 'sunset', 'festival of lights'],
    ['Kartika', 1, 'Govardhan Puja', 'sunrise', ''],
    ['Kartika', 2, 'Bhai Dooj', 'sunrise', ''],
    ['Kartika', 15, 'Kartik Purnima · Dev Deepavali', 'sunrise', ''],
    ['Margashirsha', 11, 'Gita Jayanti', 'sunrise', 'Mokshada Ekadashi'],
    ['Magha', 5, 'Vasant Panchami', 'sunrise', 'Saraswati Puja'],
    ['Magha', 29, 'Maha Shivaratri', 'midnight', 'the great night of Shiva'],
    ['Phalguna', 15, 'Holika Dahan', 'sunset', 'Holi follows the next day'],
  ];

  // Festivals and observances from the civil day starting at local midnight `start` for `days` days.
  // tzOffsetFn(date) → minutes east of UTC at the place, so each civil day can be stepped.
  function daysAhead(start, days, lat, lon) {
    const obs = new A.Observer(lat, lon, 0);
    const tithiAt = (d) => Math.floor(norm(C.lonOf('Moon', d) - C.lonOf('Sun', d)) / 12) + 1;
    const sunSignAt = (d) => Math.floor(norm(C.lonOf('Sun', d) - ayanamsa(d)) / 30);
    // new moons over the window, each naming its amanta month
    const months = [];
    let t = A.MakeTime(new Date(start.getTime() - 35 * DAY));
    for (let k = 0; k < Math.ceil(days / 29) + 3; k++) {
      const nm = A.SearchMoonPhase(0, t, 40); if (!nm) break;
      months.push({ at: nm.date, sign: sunSignAt(nm.date) }); t = nm.AddDays(1);
    }
    months.forEach((m, i) => { m.name = MONTHS[m.sign]; m.adhika = months[i + 1] ? months[i + 1].sign === m.sign : false; });
    const monthAt = (d) => { for (let i = months.length - 1; i >= 0; i--) if (months[i].at <= d) return months[i]; return null; };

    const out = [], seen = new Set();
    const karanaAt = (d) => Math.floor(norm(C.lonOf('Moon', d) - C.lonOf('Sun', d)) / 6);
    const isVishti = (d) => { const k = karanaAt(d); return k > 0 && k < 57 && (k - 1) % 7 === 6; };
    // observation times within a civil day
    const TIMES = {
      sunrise: (x) => x.sunrise,
      forenoon: (x) => new Date(x.sunrise.getTime() + (x.sunset - x.sunrise) * 0.3),
      midday: (x) => new Date(x.sunrise.getTime() + (x.sunset - x.sunrise) * 0.5),
      afternoon: (x) => new Date(x.sunrise.getTime() + (x.sunset - x.sunrise) * 0.7),
      sunset: (x) => new Date(x.sunset.getTime() + 20 * 60000), // pradosh, just after sunset
      midnight: (x) => new Date(x.date.getTime() + DAY), // Nishita: local clock midnight closing the day
    };
    const daysList = [];
    for (let k = 0; k <= days + 1; k++) {
      const midnight = new Date(start.getTime() + k * DAY);
      const r = A.SearchRiseSet(A.Body.Sun, obs, +1, midnight, 1), st = A.SearchRiseSet(A.Body.Sun, obs, -1, midnight, 1);
      if (!r || !st) { daysList.push(null); continue; }
      const day = { k, date: midnight, sunrise: r.date, sunset: st.date, t: {}, m: {} };
      Object.entries(TIMES).forEach(([key, f]) => { const at = f(day); day.t[key] = tithiAt(at); day.m[key] = monthAt(at); day[key + 'At'] = at; });
      daysList.push(day);
    }
    const add = (k, kind, name, note, key) => {
      if (k > days || (key && seen.has(key))) return;
      if (key) seen.add(key);
      out.push({ k, date: new Date(start.getTime() + k * DAY), kind, name, note });
    };
    const mkey = (m) => (m ? m.at.getTime() : 0);
    // which civil day observes tithi tt by rule: the day it holds at that time, or (if it is skipped
    // between two observations) the day on which it began
    // returns { at, m }: the observing day and the lunar month the tithi belongs to
    function observe(rule, tt, k) {
      const d = daysList[k], p = daysList[k - 1];
      if (!d) return null;
      if (d.t[rule] === tt) return { at: k, m: d.m[rule] };
      if (p && ((d.t[rule] - p.t[rule] + 30) % 30) === 2 && ((tt - p.t[rule] + 30) % 30) === 1) return { at: k - 1, m: d.m[rule] };
      return null;
    }
    let prevSunSign = null;
    for (let k = 0; k <= days; k++) {
      const day = daysList[k]; if (!day) continue;
      [11, 26, 15, 30].forEach((tt) => {
        const o = observe('sunrise', tt, k); if (!o || o.at < 0) return;
        const at = o.at, m = o.m;
        if (tt === 11 || tt === 26) add(at, 'ekadashi', `${tt === 11 ? 'Shukla' : 'Krishna'} Ekadashi`, 'fasting day', `ek${mkey(m)}-${tt}`);
        if (tt === 15) add(at, 'moon', 'Purnima', 'full moon', `pu${mkey(m)}`);
        if (tt === 30) add(at, 'moon', 'Amavasya', 'new moon', `am${mkey(m)}`);
      });
      FESTIVALS.forEach(([mn, tt, name, rule, note]) => {
        const o = observe(rule, tt, k); if (!o || o.at < 0) return;
        let at = o.at; const m = o.m;
        if (!m || m.adhika || m.name !== mn) return;
        // Holika Dahan is not done under Bhadra (Vishti karana); then it moves to the next evening
        if (name === 'Holika Dahan' && isVishti(daysList[at].sunsetAt)) at += 1;
        if (add(at, 'festival', name, note, `f${mkey(m)}-${name}`) !== false && name === 'Holika Dahan') add(at + 1, 'festival', 'Holi', 'festival of colours', `holi${mkey(m)}`);
      });
      // Sankranti: the Sun enters a sidereal sign during this civil day
      const ss = sunSignAt(new Date(day.date.getTime() + DAY));
      if (prevSunSign != null && ss !== prevSunSign) add(k, ss === 9 ? 'festival' : 'sankranti', ss === 9 ? 'Makar Sankranti' : `${RASHIS[ss][1]} Sankranti`, ss === 9 ? 'the Sun enters Makara' : `the Sun enters ${RASHIS[ss][1]}`, `sk${k}`);
      prevSunSign = ss;
    }
    return out.sort((a, b) => a.k - b.k);
  }

  root.Vedic = { daysAhead, FESTIVALS, ayanamsa, sidereal, grahas, panchang, periods, lunarMonth, dashas, nakshatraOf, RASHIS, GRAHAS, NAKSHATRAS, VARAS, DASHA_YEARS };
})(typeof window !== 'undefined' ? window : globalThis);
