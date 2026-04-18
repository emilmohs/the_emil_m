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
  const [value, setValue] = useState<number>(5);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();

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
    <div className="bg-white p-6 rounded-3xl border border-indigo-100 shadow-xl shadow-indigo-500/5 mt-6">
      <h3 className="text-lg font-bold text-gray-900 mb-2">Leistungsbewertung</h3>
      <p className="text-xs text-gray-500 mb-6">Wähle Fach und Kriterium zur strukturierten Eingabe.</p>

      <div className="space-y-4">
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
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500"
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
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {SUBJECT_DATA[subject]?.map(crit => (
                <option key={crit} value={crit}>{crit}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Bewertung (1-10)</label>
            <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">{value} / 10</span>
          </div>
          <input 
            type="range" 
            min="1" 
            max="10" 
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
          <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-bold">
            <span>Ungenügend</span>
            <span>Sehr Gut</span>
          </div>
        </div>

        <button 
          onClick={handleAction}
          disabled={isPending}
          className="w-full py-3 mt-4 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition-all active:scale-[0.98] disabled:opacity-50 flex justify-center items-center gap-2"
        >
          {isPending ? "Speichern..." : "Bewertung speichern"}
        </button>
      </div>
    </div>
  );
}
