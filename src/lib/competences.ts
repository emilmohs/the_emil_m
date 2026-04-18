// Shared types and defaults for the competence system
// This file is NOT a server action, so it can export objects and types.

export type CompetenceStructure = Record<string, Record<string, string[]>>;

export const DEFAULT_COMPETENCES: CompetenceStructure = {
  Deutsch: {
    "Sprechen & Zuhören": ["Deutliches Sprechen", "aktives Zuhören", "Unterrichtsbeiträge"],
    "Lesen": ["Buchstabenkenntnis", "Wort-/Satzverständnis", "flüssiges Vorlesen"],
    "Schreiben": ["Lautgetreues Schreiben", "Wortgrenzen", "eigene Geschichten"]
  },
  Mathe: {
    "Zahl & Operation": ["Zahlenraum-Orientierung", "Grundrechenarten", "Einmaleins"],
    "Größen & Messen": ["Geldwerte", "Uhrzeit", "Messen"],
    "Raum & Form": ["Geometrische Körper", "Symmetrie"]
  },
  Verhalten: {
    "Arbeitsverhalten": ["Konzentration", "Selbstständigkeit", "Sorgfalt"],
    "Sozialverhalten": ["Hilfsbereitschaft", "Regeleinhaltung", "Konfliktlösung"]
  }
};
