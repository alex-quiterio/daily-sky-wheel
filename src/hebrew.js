// Hebrew calendar and Kabbalistic correspondences.
// Calendar arithmetic follows Dershowitz & Reingold, "Calendrical Calculations" (fixed day numbers, R.D.).
(function (root) {
  const EPOCH = -1373427; // R.D. of 1 Tishrei AM 1
  const RD_TO_JDN = 1721425;

  const isLeap = (y) => ((7 * y + 1) % 19) < 7;
  function elapsedDays(y) {
    const months = Math.floor((235 * y - 234) / 19);
    const parts = 12084 + 13753 * months;
    const day = months * 29 + Math.floor(parts / 25920);
    return (3 * (day + 1)) % 7 < 3 ? day + 1 : day;
  }
  function yearDelay(y) {
    const ny0 = elapsedDays(y - 1), ny1 = elapsedDays(y), ny2 = elapsedDays(y + 1);
    if (ny2 - ny1 === 356) return 2;
    if (ny1 - ny0 === 382) return 1;
    return 0;
  }
  const newYear = (y) => EPOCH + elapsedDays(y) + yearDelay(y);
  const daysInYear = (y) => newYear(y + 1) - newYear(y);
  const longHeshvan = (y) => daysInYear(y) % 10 === 5;
  const shortKislev = (y) => daysInYear(y) % 10 === 3;
  const lastMonth = (y) => (isLeap(y) ? 13 : 12);
  function monthLength(y, m) {
    if ([2, 4, 6, 10, 13].includes(m)) return 29;
    if (m === 12 && !isLeap(y)) return 29;
    if (m === 8 && !longHeshvan(y)) return 29;
    if (m === 9 && shortKislev(y)) return 29;
    return 30;
  }
  // months are numbered from Nisan = 1; the year starts at Tishrei = 7
  function fixedFromHebrew(y, m, d) {
    let rd = newYear(y) + d - 1;
    if (m < 7) {
      for (let k = 7; k <= lastMonth(y); k++) rd += monthLength(y, k);
      for (let k = 1; k < m; k++) rd += monthLength(y, k);
    } else for (let k = 7; k < m; k++) rd += monthLength(y, k);
    return rd;
  }
  function hebrewFromFixed(rd) {
    let y = Math.floor((rd - EPOCH) / (35975351 / 98496)) + 1;
    while (newYear(y + 1) <= rd) y++;
    while (newYear(y) > rd) y--;
    let m = rd < fixedFromHebrew(y, 1, 1) ? 7 : 1;
    while (rd > fixedFromHebrew(y, m, monthLength(y, m))) m++;
    return { year: y, month: m, day: rd - fixedFromHebrew(y, m, 1) + 1, leap: isLeap(y) };
  }
  function jdn(y, m, d) {
    const a = Math.floor((14 - m) / 12), yy = y + 4800 - a, mm = m + 12 * a - 3;
    return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
  }
  const rdFromCivil = (y, m, d) => jdn(y, m, d) - RD_TO_JDN;
  function civilFromRd(rd) {
    const j = rd + RD_TO_JDN;
    const a = j + 32044, b = Math.floor((4 * a + 3) / 146097), c = a - Math.floor(146097 * b / 4);
    const d = Math.floor((4 * c + 3) / 1461), e = c - Math.floor(1461 * d / 4), m = Math.floor((5 * e + 2) / 153);
    return { d: e - Math.floor((153 * m + 2) / 5) + 1, m: m + 3 - 12 * Math.floor(m / 10), y: 100 * b + d - 4800 + Math.floor(m / 10) };
  }

  function monthName(y, m) {
    const names = ['', 'Nisan', 'Iyar', 'Sivan', 'Tammuz', 'Av', 'Elul', 'Tishrei', 'Cheshvan', 'Kislev', 'Tevet', 'Shevat', 'Adar', 'Adar II'];
    if (m === 12 && isLeap(y)) return 'Adar I';
    return names[m];
  }
  function monthNameHe(y, m) {
    const names = ['', 'ניסן', 'אייר', 'סיון', 'תמוז', 'אב', 'אלול', 'תשרי', 'חשון', 'כסלו', 'טבת', 'שבט', 'אדר', 'אדר ב׳'];
    if (m === 12 && isLeap(y)) return 'אדר א׳';
    return names[m];
  }

  // Hebrew numerals (gematria), e.g. 15 → ט״ו, 5787 → תשפ״ז
  function gematria(n) {
    const units = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
    const tens = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'];
    const hundreds = ['', 'ק', 'ר', 'ש', 'ת', 'תק', 'תר', 'תש', 'תת', 'תתק'];
    n %= 1000;
    let s = hundreds[Math.floor(n / 100)];
    const r = n % 100;
    if (r === 15) s += 'טו'; else if (r === 16) s += 'טז'; else s += tens[Math.floor(r / 10)] + units[r % 10];
    return s.length > 1 ? s.slice(0, -1) + '״' + s.slice(-1) : s + '׳';
  }

  // Sefer Yetzirah: the twelve simple letters, signs, tribes and senses of the months (Nisan = 1)
  const MONTH_KABBALAH = [null,
    ['ה', 'Heh', 'Aries', 'Judah', 'Speech'], ['ו', 'Vav', 'Taurus', 'Issachar', 'Thought'], ['ז', 'Zayin', 'Gemini', 'Zebulun', 'Walking'],
    ['ח', 'Chet', 'Cancer', 'Reuben', 'Sight'], ['ט', 'Tet', 'Leo', 'Simeon', 'Hearing'], ['י', 'Yud', 'Virgo', 'Gad', 'Action'],
    ['ל', 'Lamed', 'Libra', 'Ephraim', 'Touch'], ['נ', 'Nun', 'Scorpio', 'Manasseh', 'Smell'], ['ס', 'Samekh', 'Sagittarius', 'Benjamin', 'Sleep'],
    ['ע', 'Ayin', 'Capricorn', 'Dan', 'Anger'], ['צ', 'Tzadi', 'Aquarius', 'Asher', 'Taste'], ['ק', 'Kuf', 'Pisces', 'Naphtali', 'Laughter'],
    ['ק', 'Kuf', 'Pisces', 'Naphtali', 'Laughter'],
  ];
  // [Hebrew, transliteration, English, short description]
  const SEFIROT = [
    ['כתר', 'Keter', 'Crown', 'The will above all will. The source before anything takes form.'],
    ['חכמה', 'Chokhmah', 'Wisdom', 'The first flash of insight, the seed point of every idea.'],
    ['בינה', 'Binah', 'Understanding', 'The mind that develops the seed, giving it shape and detail.'],
    ['חסד', 'Chesed', 'Lovingkindness', 'Giving without limit. Generosity, warmth, expansion.'],
    ['גבורה', 'Gevurah', 'Strength', 'Restraint and judgment. Boundaries that make giving possible.'],
    ['תפארת', 'Tiferet', 'Beauty', 'Harmony of giving and restraint. Compassion and truth.'],
    ['נצח', 'Netzach', 'Endurance', 'Perseverance and initiative. The drive to prevail.'],
    ['הוד', 'Hod', 'Splendour', 'Humility and acknowledgement. Devotion, gratitude, form.'],
    ['יסוד', 'Yesod', 'Foundation', 'Bonding and connection. Channels everything above into the world.'],
    ['מלכות', 'Malkhut', 'Kingdom', 'Presence in the world, the Shekhinah. Receiving and making real.'],
  ];
  // Days of the week (Sunday = 0) and their sefira and planet
  const DAY_SEFIRA = [3, 4, 5, 6, 7, 8, 9];
  const DAY_PLANET = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
  const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Shabbat'];

  // Counting of the Omer: from 16 Nisan (day 1) to 5 Sivan (day 49)
  function omer(h) {
    let n = 0;
    if (h.month === 1 && h.day >= 16) n = h.day - 15;
    else if (h.month === 2) n = 15 + h.day;
    else if (h.month === 3 && h.day <= 5) n = 44 + h.day;
    if (!n) return null;
    const week = Math.floor((n - 1) / 7), day = (n - 1) % 7;
    return { day: n, weeks: week, rest: day + 1, inner: 3 + day, outer: 3 + week };
  }

  // Holy days and notable days of a Hebrew date (diaspora custom for second days is not listed)
  function holidays(h) {
    const { month: m, day: d, year: y } = h;
    const out = [];
    const adar = isLeap(y) ? 13 : 12;
    if (m === 7 && (d === 1 || d === 2)) out.push('Rosh Hashanah');
    if (m === 7 && d === 10) out.push('Yom Kippur');
    if (m === 7 && d >= 15 && d <= 21) out.push(d === 21 ? 'Hoshana Rabbah' : 'Sukkot');
    if (m === 7 && d === 22) out.push('Shemini Atzeret');
    if (m === 7 && d === 23) out.push('Simchat Torah (diaspora)');
    const kislevLen = monthLength(y, 9);
    if ((m === 9 && d >= 25) || (m === 10 && d <= (kislevLen === 29 ? 3 : 2))) out.push('Chanukah');
    if (m === 11 && d === 15) out.push('Tu BiShvat');
    if (m === adar && d === 14) out.push('Purim');
    if (m === adar && d === 15) out.push('Shushan Purim');
    if (m === 1 && d >= 15 && d <= 22) out.push('Pesach');
    if (m === 2 && d === 18) out.push("Lag BaOmer · hillula of Rabbi Shimon bar Yochai");
    if (m === 3 && (d === 6 || d === 7)) out.push('Shavuot');
    if (m === 5 && d === 15) out.push("Tu B'Av");
    if ((d === 1 && m !== 7) || d === 30) out.push('Rosh Chodesh');
    // Tisha B'Av: 9 Av, or 10 Av when the 9th falls on Shabbat
    const av9 = fixedFromHebrew(y, 5, 9), av9dow = ((av9 % 7) + 7) % 7; // R.D. 0 is a Sunday
    if (m === 5 && ((d === 9 && av9dow !== 6) || (d === 10 && av9dow === 6))) out.push("Tisha B'Av");
    return out;
  }

  // Hebrew date for a civil date; after sunset it is already the next Hebrew day
  function hebrewDate(y, m, d, afterSunset) {
    const rd = rdFromCivil(y, m, d) + (afterSunset ? 1 : 0);
    const h = hebrewFromFixed(rd);
    h.rd = rd;
    h.dow = ((rd % 7) + 7) % 7; // 0 = Sunday
    h.monthName = monthName(h.year, h.month);
    h.monthNameHe = monthNameHe(h.year, h.month);
    h.monthLength = monthLength(h.year, h.month);
    return h;
  }

  root.Hebrew = { hebrewDate, hebrewFromFixed, fixedFromHebrew, rdFromCivil, civilFromRd, gematria, monthName, monthNameHe, monthLength, isLeap, omer, holidays, MONTH_KABBALAH, SEFIROT, DAY_SEFIRA, DAY_PLANET, DAY_NAMES };
})(typeof window !== 'undefined' ? window : globalThis);
