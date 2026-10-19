// Belastungsarten eines Geräts bzw. einer Übung. Gemeinsame Regeln für App, Statistik und Watch.
//   kg         Gewicht in kg (Standard, z. B. Maschinen mit Gewichtsblock)
//   level      Stufe 1…max (z. B. Zirkelgeräte)
//   dumbbell   Kurzhanteln: Gewicht pro Hand (zählt im Volumen doppelt)
//   barbell    Langhantel: Gesamtgewicht = Stange + 2 × Scheiben pro Seite
//   bodyweight Körpergewicht: nur Wiederholungen
// Ein Satz bleibt immer { reps, weight }; die Bedeutung von `weight` hängt vom Typ ab.

export const LOAD_TYPES = ['kg', 'level', 'dumbbell', 'barbell', 'bodyweight'];
export const FREE_TYPES = ['dumbbell', 'barbell', 'bodyweight'];
export const DEFAULT_BAR = 20;

export const loadType = (m) => (LOAD_TYPES.includes(m?.load?.type) ? m.load.type : 'kg');

const FACTOR = { kg: 1, level: 0, dumbbell: 2, barbell: 1, bodyweight: 0 };
// Faktor fürs Volumen (Wdh. × Gewicht) in kg.
export const volumeFactor = (m) => FACTOR[loadType(m)];

// Welche Rekorde sind sinnvoll? 'kg' = Gewicht, 1RM und Volumen; 'level' = höchste Stufe; 'reps' = meiste Wdh.
export const recordMode = (type) => (type === 'level' ? 'level' : type === 'bodyweight' ? 'reps' : 'kg');

// Stangengewicht einer Langhantel.
export const barWeight = (m) => {
  const b = Number(m?.load?.bar);
  return Number.isFinite(b) && b >= 0 ? b : DEFAULT_BAR;
};
