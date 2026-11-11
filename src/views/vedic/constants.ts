// Vedic tab: fixed lists and colours.

// ---------- days ahead: worked out for a year from the selected day, kept per place and start ----------
export const AHEAD_CATS: [value: string, label: string][] = [
  ['all', 'All'],
  ['festival', 'Festivals'],
  ['ekadashi', 'Ekadashi'],
  ['moon', 'Purnima & Amavasya'],
  ['sankranti', 'Sankranti'],
];

// what the dignity tooltips say: [heading, text]
export const DIGNITY_TIP: Record<string, [heading: string, text: string]> = {
  Exalted: [
    'Exalted · uchcha',
    'The graha is in the sign where it is strongest and gives its best results, like the Sun in Mesha or the Moon in Vrishabha.',
  ],
  Debilitated: [
    'Debilitated · neecha',
    'The graha is in the sign opposite its exaltation, where it is weakest and struggles to express itself, like the Sun in Tula or Venus in Kanya. Astrologers also check for neecha bhanga, the conditions that cancel the weakness.',
  ],
  'Own sign': [
    'Own sign · swakshetra',
    'The graha is in a sign it rules, at home and comfortable, like Mars in Mesha or Saturn in Makara.',
  ],
};
