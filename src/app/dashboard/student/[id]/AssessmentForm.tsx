"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createAssessment } from "@/app/actions/assessments";

// Dynamische Auswahlstruktur
const SUBJECT_DATA: Record<string, string[]> = {
  Deutsch: ["Lesen", "Rechtschreibung", "Sprachgebrauch", "Texte verfassen"],
  Mathematik: ["Rechnen", "Geometrie", "Sachaufgaben", "Zahlenverständnis"],
  Sachunterricht: ["Natur & Leben", "Raum & Umwelt", "Zeit & Wandel"],
  Englisch: ["Wortschatz", "Sprechen", "Leseverstehen", "Hörverstehen"],
  Sozialverhalten: ["Kooperation", "Regelakzeptanz", "Konfliktlösung"],
  Arbeitsverhalten: ["Motivation", "Sorgfalt", "Selbstständigkeit"]
};

export default function AssessmentForm({ studentId }: { studentId: string }) {
  const [isPending, startTransition] = useTransition();
  const [subject, setSubject] = useState<string>("Deutsch");
  const [criteria, setCriteria] = useState<string>(SUBJECT_DATA["Deutsch"][0]);
  const [value, setValue] = useState<number>(3); // Standard in der Mitte (3)
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();

  // Smiley Definitionen
  const SMILEYS = [
    { score: 1, char: "😢", label: "Sehr schwach", activeClass: "bg-red-500", textClass: "text-red-500" },
    { score: 2, char: "😟", label: "Schwach", activeClass: "bg-orange-500", textClass: "text-orange-500" },
    { score: 3, char: "😐", label: "Mittel", activeClass: "bg-yellow-500", textClass: "text-yellow-600" },
    { score: 4, char: "🙂", label: "Gut", activeClass: "bg-blue-500", textClass: "text-blue-500" },
    { score: 5, char: "🤩", label: "Herausragend", activeClass: "bg-green-500", textClass: "text-green-500" },
  ];

  // Wenn das Fach wechselt, setze das erste Kriterium automatisch
  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSubj = e.target.value;
    setSubject(newSubj);
    setCriteria(SUBJECT_DATA[newSubj]?.[0] || "");
  };

  async function handleAction() {
    setError(null);

    startTransition(async () => {
      const res = await createAssessment(studentId, subject, criteria, value.toString());
      if (res.error) {
        setError(res.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="bg-white p-6 rounded-3xl border border-indigo-100 shadow-xl shadow-indigo-500/5">
      <h3 className="text-lg font-bold text-gray-900 mb-2">Leistungsbewertung</h3>
      <p className="text-xs text-gray-500 mb-6">Wähle Fach und Kriterium zur strukturierten Eingabe.</p>

      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 text-red-600 text-xs font-bold p-3 rounded-xl border border-red-100">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Fach</label>
            <select 
              value={subject}
              onChange={handleSubjectChange}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2 py-2.5 text-xs font-medium text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {Object.keys(SUBJECT_DATA).map(subj => (
                <option key={subj} value={subj}>{subj}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Kriterium</label>
            <select 
              value={criteria}
              onChange={(e) => setCriteria(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2 py-2.5 text-xs font-medium text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {SUBJECT_DATA[subject]?.map(crit => (
                <option key={crit} value={crit}>{crit}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4">Bewertung (Stufe 1-5)</label>
          <div className="flex flex-wrap lg:flex-nowrap justify-between items-center gap-1">
            {SMILEYS.map((s) => {
              const isActive = value === s.score;
              return (
                <button
                  key={s.score}
                  onClick={() => setValue(s.score)}
                  type="button"
                  className={`flex-1 min-w-[50px] flex flex-col items-center gap-1 p-2 rounded-2xl transition-all duration-300 border-2 ${
                    isActive 
                      ? `${s.activeClass} border-transparent text-white shadow-lg scale-105` 
                      : "bg-white border-gray-100 text-gray-400 hover:border-gray-300"
                  }`}
                >
                  <span className="text-xl">{s.char}</span>
                  <span className={`text-[8px] font-bold uppercase tracking-tight ${isActive ? "text-white" : "text-gray-400"}`}>
                    {s.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <button 
          onClick={handleAction}
          disabled={isPending}
          className="w-full py-4 text-sm font-bold text-white bg-indigo-600 rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition-all active:scale-[0.98] disabled:opacity-50 flex justify-center items-center gap-2"
        >
          {isPending ? "Speichern..." : "Bewertung speichern"}
        </button>
      </div>
    </div>
  );
}
