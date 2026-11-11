// Vedic tab: fixed lists and colours.

// ---------- days ahead: worked out for a year from the selected day, kept per place and start ----------
export const AHEAD_CATS: [value: string, label: string][] = [
  ['all', 'All'],
  ['festival', 'Festivals'],
  ['ekadashi', 'Ekadashi'],
  ['moon', 'Purnima & Amavasya'],
  ['sankranti', 'Sankranti'],
];

export const DIGNITY_TIP: Record<string, string> = {
  Exalted:
    '<div class="th">Exalted · uchcha</div><div class="tplain">The graha is in the sign where it is strongest and gives its best results, like the Sun in Mesha or the Moon in Vrishabha.</div>',
  Debilitated:
    '<div class="th">Debilitated · neecha</div><div class="tplain">The graha is in the sign opposite its exaltation, where it is weakest and struggles to express itself, like the Sun in Tula or Venus in Kanya. Astrologers also check for neecha bhanga, the conditions that cancel the weakness.</div>',
  'Own sign':
    '<div class="th">Own sign · swakshetra</div><div class="tplain">The graha is in a sign it rules, at home and comfortable, like Mars in Mesha or Saturn in Makara.</div>',
};
