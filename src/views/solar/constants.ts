// Solar System tab: fixed lists. Orbits are the J2000 mean elements of Standish (JPL, "Keplerian Elements for
// Approximate Positions of the Major Planets"), used only to draw the orbit lines; the planets themselves come
// from astronomy-engine.

export const PLANETS = ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];

// a (au), e, i, longitude of the ascending node Ω, longitude of perihelion ϖ (degrees), sidereal period (days)
export const ELEMENTS: Record<string, [a: number, e: number, i: number, node: number, peri: number, period: number]> = {
  Mercury: [0.38709927, 0.20563593, 7.00497902, 48.33076593, 77.45779628, 87.969],
  Venus: [0.72333566, 0.00677672, 3.39467605, 76.67984255, 131.60246718, 224.701],
  Earth: [1.00000261, 0.01671123, 0, 0, 102.93768193, 365.256],
  Mars: [1.52371034, 0.0933941, 1.84969142, 49.55953891, -23.94362959, 686.98],
  Jupiter: [5.202887, 0.04838624, 1.30439695, 100.47390909, 14.72847983, 4332.59],
  Saturn: [9.53667594, 0.05386179, 2.48599187, 113.66242448, 92.59887831, 10759.22],
  Uranus: [19.18916464, 0.04725744, 0.77263783, 74.01692503, 170.9542763, 30688.5],
  Neptune: [30.06992276, 0.00859048, 1.77004347, 131.78422574, 44.96476227, 60195],
  Pluto: [39.48211675, 0.2488273, 17.14001206, 110.30393684, 224.06891629, 90560],
};

// colours in the drawing
export const COLOR: Record<string, string> = {
  Mercury: '#b9b2a8',
  Venus: '#f0d9a0',
  Earth: '#6fb7ff',
  Mars: '#ff7a55',
  Jupiter: '#e8b98a',
  Saturn: '#ead08a',
  Uranus: '#9fe6e8',
  Neptune: '#6f8dff',
  Pluto: '#c9a68e',
  Moon: '#f5ecd0',
};

// sizes in the drawing (not to scale)
export const SIZE: Record<string, number> = {
  Mercury: 3.2,
  Venus: 4.6,
  Earth: 4.8,
  Mars: 3.8,
  Jupiter: 8,
  Saturn: 7,
  Uranus: 5.6,
  Neptune: 5.4,
  Pluto: 2.8,
};

export const KM_PER_AU = 149597870.7;
export const LIGHT_MIN_PER_AU = 8.316746;
