// Austausch mit den Apple-Watch-Kurzbefehlen. Reine Funktionen ohne DOM.
//
// Der Watch-Kurzbefehl speichert pro Training eine Erinnerung in der Liste „Gym Log“:
//   GT1;<Geräte-ID>;<JJJJ-MM-TT>;12x40/10x42,5/8x45
// Sätze werden mit „/“ getrennt, damit Dezimalkommas (42,5) eindeutig bleiben.

import { loadType, barWeight } from './load.js';

const fmt = (n) => String(n).replace('.', ',');

// Geräteliste für den Watch-Kurzbefehl: { "<Name>": { id, info } }.
// Mit `category` nur die Geräte dieser Kategorie (für einen Kurzbefehl pro Trainingstag).
// Mit `numbered` bekommen die Namen ein Präfix „1 · …“ in der übergebenen Reihenfolge (für Splits);
// `labels` gibt die Präfixe direkt vor (z. B. „3a“, „3b“ für Alternativen auf einem Platz).
// Doppelte Namen bekommen eine Nummer, weil die Namen in der Watch-Auswahl eindeutig sein müssen.
export function buildWatchConfig(machines, lastSessionByMachine = {}, category = null, { numbered = false, labels = null } = {}) {
  const out = {};
  let n = 0;
  for (const [idx, m] of machines.entries()) {
    if (!m) continue;
    if (category && !(m.categories || []).includes(category)) continue;
    n++;
    const prefix = labels ? `${labels[idx]} · ` : numbered ? `${n} · ` : '';
    let name = prefix + (m.name.trim() || 'Gerät');
    const base = name;
    for (let i = 2; out[name]; i++) name = `${base} (${i})`;
    const blocks = [];
    const filled = m.settings.filter((s) => String(s.value ?? '').trim());
    if (filled.length) blocks.push(filled.map((s) => `${s.label}: ${s.value}`).join('\n'));
    const type = loadType(m);
    const hint = {
      level: `Eingabe: Stufe 1–${m.load?.max ?? 12} (bei „Gewicht“ eingeben)`,
      dumbbell: 'Eingabe: kg pro Hand',
      barbell: `Eingabe: Gesamtgewicht inkl. Stange (${fmt(barWeight(m))} kg)`,
      bodyweight: 'Eingabe: Gewicht 0',
    }[type];
    if (hint) blocks.push(hint);
    const value = (w) =>
      ({ level: `Stufe ${fmt(w)}`, dumbbell: `2 × ${fmt(w)} kg`, bodyweight: '' })[type] ?? `${fmt(w)} kg`;
    const last = lastSessionByMachine[m.id];
    if (last) {
      const [, mo, d] = last.date.split('-');
      const sets = last.sets.map((s, i) =>
        type === 'bodyweight' ? `${i + 1}) ${fmt(s.reps ?? 0)} Wdh.` : `${i + 1}) ${fmt(s.reps ?? 0)} × ${value(s.weight ?? 0)}`
      );
      blocks.push([`Zuletzt (${d}.${mo}.):`, ...sets].join('\n'));
    }
    out[name] = { id: m.id, info: blocks.join('\n\n') || 'Keine Einstellungen' };
  }
  return out;
}

// Plätze eines Splits als Geräte-IDs. Ein Platz mit mehreren Geräten ist ein Entweder-oder.
// Ältere Splits haben nur `machineIds` (ein Gerät pro Platz).
export function slotIds(split) {
  const raw = Array.isArray(split.slots) ? split.slots : (split.machineIds || []).map((id) => [id]);
  return raw.map((slot) => (Array.isArray(slot) ? slot : [slot]).filter(Boolean)).filter((slot) => slot.length);
}

// Flache ID-Liste in Reihenfolge (für `machineIds`).
export const slotsToIds = (slots) => [...new Set(slots.flat())];

// Plätze mit Geräte-Objekten; nicht mehr vorhandene Geräte und leere Plätze fallen weg.
export function splitSlots(split, machines) {
  const byId = new Map(machines.map((m) => [m.id, m]));
  return slotIds(split)
    .map((slot) => slot.map((id) => byId.get(id)).filter(Boolean))
    .filter((slot) => slot.length);
}

// Geräte eines Splits in Reihenfolge (alle Alternativen nacheinander).
export function splitMachines(split, machines) {
  return splitSlots(split, machines).flat();
}

// Für die Watch-Liste: Geräte flach plus Präfixe „1“, „2a“, „2b“, „3“ …
export function splitWatchEntries(split, machines) {
  const list = [];
  const labels = [];
  splitSlots(split, machines).forEach((slot, i) =>
    slot.forEach((m, j) => {
      list.push(m);
      labels.push(slot.length > 1 ? `${i + 1}${String.fromCharCode(97 + j)}` : `${i + 1}`);
    })
  );
  return { machines: list, labels };
}

// Alle verwendeten Kategorien, alphabetisch.
export function allCategories(machines) {
  return [...new Set(machines.flatMap((m) => m.categories || []))].sort((a, b) => a.localeCompare(b, 'de'));
}

const num = (v) => {
  const n = parseFloat(String(v).trim().replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? n : null;
};

// Liest die eingefügten Erinnerungen. Ergebnis: { entries: [{ machineId, date, sets }], errors: [{ line, reason }] }
export function parseWatchLog(text) {
  const entries = [];
  const errors = [];
  for (const raw of String(text ?? '').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const parts = line.split(';').map((p) => p.trim());
    if (parts[0] !== 'GT1') {
      errors.push({ line, reason: 'Kein Gym-Tracker-Eintrag' });
      continue;
    }
    const [, machineId, date, setsText] = parts;
    if (!machineId) {
      errors.push({ line, reason: 'Gerät fehlt' });
      continue;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) {
      errors.push({ line, reason: 'Datum ungültig' });
      continue;
    }
    const sets = [];
    let bad = false;
    for (const chunk of (setsText || '').split(/[/|]/)) {
      if (!chunk.trim()) continue;
      const m = chunk.match(/^\s*([\d.,]+)\s*[x×*]\s*([\d.,]+)\s*(?:kg)?\s*$/i);
      const reps = m && num(m[1]);
      const weight = m && num(m[2]);
      if (reps === null || weight === null || !m) {
        bad = true;
        break;
      }
      sets.push({ reps, weight });
    }
    if (bad || !sets.length) {
      errors.push({ line, reason: 'Sätze nicht lesbar' });
      continue;
    }
    entries.push({ machineId, date, sets });
  }
  return { entries, errors };
}

// Schlüssel zum Erkennen doppelter Importe.
export const sessionKey = (s) => `${s.machineId}|${s.date}|${s.sets.map((x) => `${x.reps}x${x.weight}`).join('/')}`;
