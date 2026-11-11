// Fixed lists the page shares: glyphs, colours, the preset places and the tabs.

// ---------- glyphs and colours ----------
export const VS = '︎';
export const GLYPH: Record<string, string> = {
  Sun: '☉',
  Moon: '☽',
  Mercury: '☿',
  Venus: '♀',
  Mars: '♂',
  Jupiter: '♃',
  Saturn: '♄',
  Uranus: '♅',
  Neptune: '♆',
  Pluto: '♇',
  Chiron: '⚷',
  Node: '☊',
  Lilith: '⚸',
  Ceres: '⚳',
  Pallas: '⚴',
  Juno: '⚵',
  Vesta: '⚶',
  Asc: 'AC',
  MC: 'MC',
  Vertex: 'Vx',
};
export const LABEL: Record<string, string> = {
  Node: 'North Node',
  Lilith: 'Lilith',
  Asc: 'Ascendant',
  MC: 'Midheaven',
  Vertex: 'Vertex',
};
export const SIGN_GLYPH = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];
export const SIGN_ABBR = ['Ari', 'Tau', 'Gem', 'Can', 'Leo', 'Vir', 'Lib', 'Sco', 'Sag', 'Cap', 'Aqu', 'Pis'];
export const EL_VAR = ['--fire', '--earth', '--air', '--water'];
export const APPROX = ['Chiron', 'Ceres', 'Pallas', 'Juno', 'Vesta'];
export const ASPECT_GLYPH: Record<string, string> = { conj: '☌', opp: '☍', tri: '△', sq: '□', sex: '⚹', qx: '⚻' };
export const ASPECT_COLOR: Record<string, string> = {
  conj: 'var(--muted)',
  opp: 'var(--fire)',
  sq: 'var(--fire)',
  tri: 'var(--water)',
  sex: 'var(--water)',
  qx: 'var(--air)',
};

// ---------- places ----------
export const PLACES: [name: string, lat: number, lon: number, tz: string][] = [
  ['Lisbon', 38.72, -9.14, 'Europe/Lisbon'],
  ['Porto', 41.15, -8.61, 'Europe/Lisbon'],
  ['Faro', 37.02, -7.93, 'Europe/Lisbon'],
  ['Madrid', 40.42, -3.7, 'Europe/Madrid'],
  ['Amsterdam', 52.37, 4.9, 'Europe/Amsterdam'],
  ['London', 51.51, -0.13, 'Europe/London'],
  ['Paris', 48.86, 2.35, 'Europe/Paris'],
  ['Berlin', 52.52, 13.4, 'Europe/Berlin'],
  ['Bologna', 44.49, 11.34, 'Europe/Rome'],
  ['Francavilla al Mare', 42.42, 14.29, 'Europe/Rome'],
  ['New York', 40.72, -74.0, 'America/New_York'],
  ['Mexico City', 19.43, -99.13, 'America/Mexico_City'],
  ['Mumbai', 19.08, 72.88, 'Asia/Kolkata'],
  ['Varanasi', 25.32, 83.01, 'Asia/Kolkata'],
  ['Hanoi', 21.03, 105.85, 'Asia/Ho_Chi_Minh'],
  ['Sydney', -33.87, 151.21, 'Australia/Sydney'],
];

// ---------- tabs ----------
// ---------- tabs ----------
// in order of earliest documented practice
export const VIEWS = [
  ['western', 'Western', '#07061a', ''],
  ['chinese', 'Chinese', '#0d0506', 'theme-cn'],
  ['vedic', 'Vedic', '#1a0712', 'theme-vedic'],
  ['maya', 'Maya', '#03110d', 'theme-maya'],
  ['kabbalah', 'Kabbalah', '#050a24', 'theme-kab'],
  ['islamic', 'Islamic', '#031319', 'theme-islamic'],
];

// what marks each tab, and when its tradition was first documented
export const TAB_NOTES: Record<string, [mark: string, cls: string, note: string]> = {
  western: ['', '', 'Babylonian celestial omens, c. 1600 BCE; Hellenistic horoscopes from the 2nd century BCE'],
  chinese: ['中', 'zh', 'Stem-and-branch day counts on Shang oracle bones, c. 1250 BCE'],
  vedic: ['ॐ', 'dev', 'Nakshatras in the Vedic texts, c. 1200–1000 BCE'],
  maya: ['', '', 'The Mesoamerican 260-day count, c. 600–300 BCE'],
  kabbalah: ['א', 'he', 'Sefer Yetzirah, c. 2nd–6th century CE'],
  islamic: ['هـ', 'ar', 'The Hijri calendar, instituted 638 CE'],
};

// ---------- links ----------
// the spellings of a house system accepted in a link
// ---------- URL parameters ----------
// ?date=2026-11-09&time=02:02&place=new-york&houses=natural
// ?date=2026-11-09&time=14:30&lat=44.49&lon=11.34&tz=Europe/Rome
export const HOUSE_ALIASES = {
  placidus: 'placidus',
  p: 'placidus',
  whole: 'whole',
  'whole-sign': 'whole',
  wholesign: 'whole',
  w: 'whole',
  equal: 'equal',
  e: 'equal',
  natural: 'natural',
  n: 'natural',
};
