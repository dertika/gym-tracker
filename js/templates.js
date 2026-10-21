// Split-Vorlagen mit Übungsvorschlägen. Jede Übung nennt ein typisches Studiogerät und eine Alternative
// mit freien Gewichten. `match` sind Suchbegriffe, um vorhandene Geräte automatisch zuzuordnen;
// `exclude` verhindert Fehltreffer (z. B. „Leg Curl“ bei Bizeps-Curls).

const EX = {
  chest: { name: 'Brustdrücken', machine: 'Brustpresse', alt: ['Bankdrücken', 'barbell'], match: ['brustpresse', 'chest press', 'brustdrücken', 'bankdrücken'], exclude: ['schräg', 'incline'], cat: 'Oberkörper' },
  incline: { name: 'Schrägbankdrücken', machine: 'Schrägbank-Brustpresse', alt: ['Kurzhantel-Schrägbankdrücken', 'dumbbell'], match: ['schräg', 'incline'], cat: 'Oberkörper' },
  row: { name: 'Rudern', machine: 'Rudermaschine', alt: ['Kurzhantel-Rudern', 'dumbbell'], match: ['rudern', 'row'], cat: 'Oberkörper' },
  shoulder: { name: 'Schulterdrücken', machine: 'Schulterpresse', alt: ['Kurzhantel-Schulterdrücken', 'dumbbell'], match: ['schulterpresse', 'shoulder press', 'schulterdrücken'], cat: 'Oberkörper' },
  lat: { name: 'Latziehen', machine: 'Latzug', alt: ['Klimmzüge', 'bodyweight'], match: ['latzug', 'lat pull', 'pulldown', 'latziehen'], exclude: ['klimmz'], cat: 'Oberkörper' },
  fly: { name: 'Butterfly', machine: 'Butterfly', alt: ['Kurzhantel-Flys', 'dumbbell'], match: ['butterfly', 'pec fly', 'pec deck', 'flys'], exclude: ['reverse', 'rear', 'rück'], cat: 'Oberkörper' },
  lateral: { name: 'Seitheben', machine: 'Seitheben-Maschine', alt: ['Kurzhantel-Seitheben', 'dumbbell'], match: ['seitheben', 'lateral raise'], cat: 'Oberkörper' },
  reverseFly: { name: 'Hintere Schulter', machine: 'Reverse Fly', alt: ['Kurzhantel-Reverse-Flys', 'dumbbell'], match: ['reverse fly', 'rear delt', 'reverse'], cat: 'Oberkörper' },
  biceps: { name: 'Bizeps', machine: 'Bizeps-Maschine', alt: ['Kurzhantel-Curls', 'dumbbell'], match: ['bizeps', 'biceps', 'arm curl', 'curl'], exclude: ['leg', 'bein'], cat: 'Oberkörper' },
  triceps: { name: 'Trizeps', machine: 'Trizeps-Maschine', alt: ['Dips', 'bodyweight'], match: ['trizeps', 'triceps', 'dips'], cat: 'Oberkörper' },
  backExt: { name: 'Rückenstrecker', machine: 'Rückenstrecker', alt: ['Hyperextensions', 'bodyweight'], match: ['rückenstrecker', 'back extension', 'hyperextension'], cat: 'Rumpf' },
  legPress: { name: 'Beinpresse', machine: 'Beinpresse', alt: ['Kniebeugen', 'barbell'], match: ['beinpresse', 'leg press'], cat: 'Beine' },
  legCurl: { name: 'Beinbeuger', machine: 'Beinbeuger (Leg Curl)', alt: ['Rumänisches Kreuzheben', 'dumbbell'], match: ['beinbeuger', 'leg curl', 'hamstring'], cat: 'Beine' },
  legExt: { name: 'Beinstrecker', machine: 'Beinstrecker (Leg Extension)', alt: ['Ausfallschritte', 'dumbbell'], match: ['beinstrecker', 'leg extension'], cat: 'Beine' },
  adduction: { name: 'Adduktoren', machine: 'Hip Adduction', alt: null, match: ['adduction', 'adduktor'], cat: 'Beine' },
  abduction: { name: 'Abduktoren', machine: 'Hip Abduction', alt: null, match: ['abduction', 'abduktor'], cat: 'Beine' },
  calf: { name: 'Waden', machine: 'Wadenmaschine', alt: ['Wadenheben', 'bodyweight'], match: ['wade', 'calf'], cat: 'Beine' },
  abs: { name: 'Bauch', machine: 'Bauchmaschine', alt: ['Plank', 'bodyweight'], match: ['bauch', 'abdominal', 'crunch', 'plank'], cat: 'Rumpf' },
};

const NOTE = '3 Sätze à 8–12 Wdh., 1–2 Min. Pause. Schaffst du überall 12 Wdh., beim nächsten Mal etwas mehr Gewicht.';

export const TEMPLATES = [
  {
    id: 'upper-lower',
    name: '2er-Split: Oberkörper / Unterkörper',
    desc: 'Für 2–4 Trainings pro Woche, z. B. Mo Oberkörper, Di Unterkörper, Do Oberkörper, Fr Unterkörper.',
    splits: [
      { name: 'Oberkörper', note: NOTE, exercises: ['chest', 'row', 'shoulder', 'lat', 'fly', 'biceps', 'triceps'] },
      { name: 'Unterkörper', note: NOTE, exercises: ['legPress', 'legCurl', 'legExt', 'adduction', 'abduction', 'calf', 'abs'] },
    ],
  },
  {
    id: 'ppl',
    name: '3er-Split: Push / Pull / Beine',
    desc: 'Für 3 Trainings pro Woche (z. B. Mo/Mi/Fr) oder 6, dann jeden Split zweimal.',
    splits: [
      { name: 'Push', note: NOTE, exercises: ['chest', 'incline', 'shoulder', 'fly', 'lateral', 'triceps'] },
      { name: 'Pull', note: NOTE, exercises: ['lat', 'row', 'backExt', 'reverseFly', 'biceps', 'abs'] },
      { name: 'Beine', note: NOTE, exercises: ['legPress', 'legCurl', 'legExt', 'adduction', 'abduction', 'calf'] },
    ],
  },
];

export const exercise = (key) => ({ key, ...EX[key] });

// Vorhandenes Gerät zu einer Übung finden (erster Treffer nach Suchbegriffen), sonst null.
export function matchMachine(ex, machines) {
  const norm = (s) => s.toLowerCase();
  return (
    machines.find((m) => {
      const n = norm(m.name);
      return ex.match.some((k) => n.includes(k)) && !(ex.exclude || []).some((k) => n.includes(k));
    }) || null
  );
}
