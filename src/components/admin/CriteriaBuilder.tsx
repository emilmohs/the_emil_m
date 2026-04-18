"use client";

import { useState, useTransition } from "react";
import { saveGradeCriteria } from "@/app/actions/criteria";
import { DEFAULT_COMPETENCES } from "@/lib/competences";
import type { CompetenceStructure } from "@/lib/competences";

const GRADE_LEVELS = ["1", "2", "3", "4"];

type CriteriaState = Record<string, CompetenceStructure>;

export default function CriteriaBuilder({
  initialCriteria
}: {
  initialCriteria: { gradeLevel: string; criteria: CompetenceStructure }[];
}) {
  const [activeGrade, setActiveGrade] = useState("1");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  // Build state: For each grade, use saved data or fall back to defaults
  const [allCriteria, setAllCriteria] = useState<CriteriaState>(() => {
    const state: CriteriaState = {};
    GRADE_LEVELS.forEach(g => {
      const found = initialCriteria.find(c => c.gradeLevel === g);
      state[g] = found ? structuredClone(found.criteria) : structuredClone(DEFAULT_COMPETENCES);
    });
    return state;
  });

  const criteria = allCriteria[activeGrade];

  // --- Mutation Helpers ---
  const updateCriteria = (newCriteria: CompetenceStructure) => {
    setAllCriteria(prev => ({ ...prev, [activeGrade]: newCriteria }));
    setSaved(false);
  };

  const addSubject = () => {
    const name = prompt("Name des neuen Faches:");
    if (!name || name.trim() === "") return;
    const updated = { ...criteria, [name.trim()]: {} };
    updateCriteria(updated);
  };

  const removeSubject = (subject: string) => {
    if (!confirm(`Fach "${subject}" wirklich löschen? Alle Kategorien und Items gehen verloren.`)) return;
    const updated = { ...criteria };
    delete updated[subject];
    updateCriteria(updated);
  };

  const renameSubject = (oldName: string) => {
    const newName = prompt("Neuer Name für das Fach:", oldName);
    if (!newName || newName.trim() === "" || newName === oldName) return;
    const updated: CompetenceStructure = {};
    Object.entries(criteria).forEach(([key, val]) => {
      updated[key === oldName ? newName.trim() : key] = val;
    });
    updateCriteria(updated);
  };

  const addCategory = (subject: string) => {
    const name = prompt("Name der neuen Kategorie:");
    if (!name || name.trim() === "") return;
    const updated = { ...criteria, [subject]: { ...criteria[subject], [name.trim()]: [] } };
    updateCriteria(updated);
  };

  const removeCategory = (subject: string, category: string) => {
    if (!confirm(`Kategorie "${category}" wirklich löschen?`)) return;
    const updatedCats = { ...criteria[subject] };
    delete updatedCats[category];
    updateCriteria({ ...criteria, [subject]: updatedCats });
  };

  const addItem = (subject: string, category: string) => {
    const name = prompt("Neues Kompetenz-Item:");
    if (!name || name.trim() === "") return;
    const items = [...criteria[subject][category], name.trim()];
    updateCriteria({
      ...criteria,
      [subject]: { ...criteria[subject], [category]: items }
    });
  };

  const removeItem = (subject: string, category: string, idx: number) => {
    const items = criteria[subject][category].filter((_, i) => i !== idx);
    updateCriteria({
      ...criteria,
      [subject]: { ...criteria[subject], [category]: items }
    });
  };

  const handleSave = () => {
    startTransition(async () => {
      await saveGradeCriteria(activeGrade, allCriteria[activeGrade]);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  };

  const handleReset = () => {
    if (!confirm("Alle Änderungen für diese Klassenstufe zurücksetzen und auf Standard-Kriterien wiederherstellen?")) return;
    setAllCriteria(prev => ({ ...prev, [activeGrade]: structuredClone(DEFAULT_COMPETENCES) }));
    setSaved(false);
  };

  // Count total items
  const totalItems = Object.values(criteria).reduce((sum, cats) =>
    sum + Object.values(cats).reduce((s, items) => s + items.length, 0), 0
  );

  return (
    <div className="space-y-6">
      {/* Grade Selector */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">🏗️</span>
            Kriterien-Builder
          </h3>
          <p className="text-sm text-gray-500 mt-1">Bewertungskriterien pro Klassenstufe anpassen</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-gray-600">Klassenstufe:</span>
          <div className="flex bg-gray-100 rounded-xl p-1">
            {GRADE_LEVELS.map(g => (
              <button
                key={g}
                onClick={() => setActiveGrade(g)}
                className={`px-5 py-2 text-sm font-bold rounded-lg transition-all ${
                  activeGrade === g
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Klasse {g}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center gap-4 px-4">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          {Object.keys(criteria).length} Fächer · {totalItems} Items
        </span>
        <span className="flex-1" />
        <button
          onClick={handleReset}
          className="text-xs font-bold text-gray-400 hover:text-red-600 transition-colors"
        >
          Auf Standard zurücksetzen
        </button>
      </div>

      {/* Subject Cards */}
      <div className="space-y-4">
        {Object.entries(criteria).map(([subject, categories]) => (
          <div key={subject} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Subject Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h4 className="text-lg font-bold text-gray-800">{subject}</h4>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => renameSubject(subject)}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Umbenennen"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
                <button
                  onClick={() => removeSubject(subject)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Löschen"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>

            {/* Categories */}
            <div className="p-6 space-y-6">
              {Object.entries(categories).map(([category, items]) => (
                <div key={category} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h5 className="text-sm font-bold text-indigo-600 uppercase tracking-wider">{category}</h5>
                    <button
                      onClick={() => removeCategory(subject, category)}
                      className="text-[10px] font-bold text-red-400 hover:text-red-600 transition-colors uppercase tracking-wider"
                    >
                      Kategorie entfernen
                    </button>
                  </div>
                  <div className="space-y-1">
                    {items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-gray-50 px-4 py-2.5 rounded-xl group">
                        <span className="text-sm text-gray-700 font-medium">{item}</span>
                        <button
                          onClick={() => removeItem(subject, category, idx)}
                          className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all p-1"
                          title="Item entfernen"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => addItem(subject, category)}
                    className="text-xs font-bold text-indigo-500 hover:text-indigo-700 pl-4 transition-colors"
                  >
                    + Item hinzufügen
                  </button>
                </div>
              ))}

              <button
                onClick={() => addCategory(subject)}
                className="w-full py-3 border-2 border-dashed border-gray-200 hover:border-indigo-300 rounded-xl text-sm font-bold text-gray-400 hover:text-indigo-600 transition-colors"
              >
                + Neue Kategorie
              </button>
            </div>
          </div>
        ))}

        {/* Add Subject */}
        <button
          onClick={addSubject}
          className="w-full py-4 border-2 border-dashed border-gray-200 hover:border-blue-300 rounded-2xl text-sm font-bold text-gray-400 hover:text-blue-600 transition-colors"
        >
          + Neues Fach hinzufügen
        </button>
      </div>

      {/* Save Bar */}
      <div className="sticky bottom-4 bg-white rounded-2xl border border-gray-200 shadow-lg p-4 flex justify-between items-center">
        <p className="text-sm text-gray-500 font-medium">
          {saved ? (
            <span className="text-green-600 font-bold">✓ Erfolgreich gespeichert!</span>
          ) : (
            <>Änderungen an <strong>Klassenstufe {activeGrade}</strong> vornehmen und speichern.</>
          )}
        </p>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-blue-500/30 active:scale-95 disabled:opacity-50"
        >
          {isPending ? "Speichert…" : "Für Klasse " + activeGrade + " speichern"}
        </button>
      </div>
    </div>
  );
}
