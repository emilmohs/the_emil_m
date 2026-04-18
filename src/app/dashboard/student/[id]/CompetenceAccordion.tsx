"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useState, useEffect, useTransition } from "react";
import { upsertAssessment } from "@/app/actions/assessments";
import type { CompetenceStructure } from "@/lib/competences";

type AssessmentProp = { category: string, value: string, intervention: string | null, quarter: string };

export default function CompetenceAccordion({ 
  studentId,
  nextStudentId,
  initialAssessments = [],
  competences,
  defaultQuarter = "Q2_2026",
  availableQuarters = ["Q1_2026", "Q2_2026", "Q3_2026", "Q4_2026"]
}: { 
  studentId: string;
  nextStudentId: string | null;
  initialAssessments: AssessmentProp[];
  competences: CompetenceStructure;
  defaultQuarter?: string;
  availableQuarters?: string[];
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const activeTab = searchParams.get("tab") || Object.keys(competences)[0] || "Deutsch";
  const activeQuarter = searchParams.get("quarter") || defaultQuarter;
  const quarters = availableQuarters;

  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [interventions, setInterventions] = useState<Record<string, string>>({});
  const [savingKeys, setSavingKeys] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const currentList = initialAssessments.filter(a => a.quarter === activeQuarter);
    const newRatings: Record<string, number> = {};
    const newInterventions: Record<string, string> = {};
    currentList.forEach(ass => {
      newRatings[ass.category] = Number(ass.value);
      if (ass.intervention) newInterventions[ass.category] = ass.intervention;
    });
    setRatings(newRatings);
    setInterventions(newInterventions);
  }, [initialAssessments, activeQuarter]);

  const setQuarter = (q: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("quarter", q);
    router.replace(`${pathname}?${params.toString()}`);
  }

  const handleCopyPrev = async () => {
    // Find previous quarter in the sorted list (descending: newest first)
    const currentIndex = quarters.indexOf(activeQuarter);
    const prevQ = currentIndex !== -1 && currentIndex < quarters.length - 1 ? quarters[currentIndex + 1] : null;
    
    if (!prevQ) return alert("Kein Vorquartal für dieses Quartal hinterlegt.");
    
    const prevAss = initialAssessments.filter(a => a.quarter === prevQ);
    if (prevAss.length === 0) return alert("Vorquartal enthält keine Beurteilungen.");
    
    const newRatings = { ...ratings };
    const newInterventions = { ...interventions };
    
    const promises = prevAss.map(ass => {
      if (newRatings[ass.category] === undefined) {
         newRatings[ass.category] = Number(ass.value);
         if (ass.intervention) newInterventions[ass.category] = ass.intervention;
         return upsertAssessment(studentId, ass.category, ass.value, ass.intervention || undefined, activeQuarter);
      }
      return Promise.resolve();
    });
    
    setRatings(newRatings);
    setInterventions(newInterventions);
    await Promise.all(promises);
    router.refresh();
  };

  const activeSubjectCategories = competences[activeTab] as Record<string, string[]> | undefined;
  const isTabCompleted = activeSubjectCategories ? Object.entries(activeSubjectCategories).every(([cat, items]) => {
    return items.every(item => {
      const key = `${activeTab}: ${cat} - ${item}`;
      return (ratings[key] || 5) !== 5;
    });
  }) : true;

  const setTab = (subject: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (subject) {
      params.set("tab", subject);
    } else {
      params.delete("tab");
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleNextStudent = () => {
    if (nextStudentId) {
      const params = new URLSearchParams(searchParams.toString());
      router.push(`/dashboard/student/${nextStudentId}?${params.toString()}`);
    }
  };

  const saveToDb = async (key: string, value: number, intervention?: string) => {
    setSavingKeys(prev => ({ ...prev, [key]: true }));
    try {
      await upsertAssessment(studentId, key, value.toString(), intervention, activeQuarter);
    } catch (e) {
      console.error(e);
    }
    setSavingKeys(prev => ({ ...prev, [key]: false }));
    router.refresh();
  };

  const handleSliderChange = (key: string, value: number) => {
    setRatings(prev => ({ ...prev, [key]: value }));
  };

  const handleSliderCommit = (key: string) => {
    const val = ratings[key];
    if (val !== undefined && val !== 5) {
      saveToDb(key, val, interventions[key]);
    }
  };

  const handleInterventionBlur = (key: string) => {
    const val = ratings[key];
    if (val !== undefined && val < 5 && val !== 5) {
      saveToDb(key, val, interventions[key]);
    }
  };

  return (
    <div className="space-y-6 mt-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">🎯</span>
          ILE Dokumentation
        </h3>
        <div className="flex items-center gap-3">
          <select 
            value={activeQuarter} 
            onChange={e => setQuarter(e.target.value)}
            className="border border-gray-200 text-gray-800 rounded-xl px-3 py-2 text-sm font-bold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {quarters.map(q => <option key={q} value={q}>{q.replace('_', ' ')}</option>)}
          </select>
          <button 
            onClick={handleCopyPrev}
            className="text-xs font-bold px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl transition-colors border border-indigo-200"
          >
            Aus Vorquartal übernehmen
          </button>
        </div>
      </div>
      
      <div className="bg-amber-50 text-amber-800 p-4 rounded-xl text-sm font-medium border border-amber-200">
        <span className="font-bold mr-1">Hinweis:</span>
        Bitte bewerte alle Punkte. Der Mittelwert (5) dient nur als Startposition und wird nicht gespeichert.
      </div>

      <div className="space-y-4">
        {Object.entries(competences).map(([subject, categories]) => {
          const isOpen = activeTab === subject;
          
          return (
            <div key={subject} className="bg-white border text-black border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <button 
                onClick={() => setTab(isOpen ? "" : subject)}
                className={`w-full px-6 py-4 flex justify-between items-center transition-colors ${isOpen ? 'bg-indigo-50 border-b border-indigo-100' : 'hover:bg-gray-50'}`}
              >
                <span className="font-bold text-lg text-gray-800">{subject}</span>
                <svg className={`w-5 h-5 transform transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {isOpen && (
                <div className="p-6 space-y-8 animate-in slide-in-from-top-2 duration-300">
                  {Object.entries(categories).map(([category, items]) => (
                    <div key={category} className="space-y-5">
                      {category !== "Allgemein" && <h4 className="font-bold text-indigo-600 border-b border-indigo-100 pb-2 bg-indigo-50/30 px-3 py-1 rounded-t-lg">{category}</h4>}
                      <div className="space-y-6 pl-2">
                        {items.map(item => {
                          const key = `${subject}: ${category} - ${item}`;
                          const val = ratings[key] || 5; 
                          const isUntouched = val === 5;
                          const isCritical = val < 5;
                          const isSaving = savingKeys[key];

                          return (
                            <div key={key} className={`flex flex-col gap-3 p-5 rounded-2xl border shadow-sm relative overflow-hidden transition-colors ${
                               isUntouched ? "bg-gray-50 border-gray-200 opacity-80 grayscale-[30%]" 
                               : isCritical ? "bg-red-50 border-red-200" 
                               : "bg-green-50 border-green-200"
                            }`}>
                              {isSaving && (
                                <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase tracking-wider animate-pulse">
                                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
                                  Auto-Save
                                </div>
                              )}
                              
                              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                                <span className="font-bold text-gray-800 w-full xl:w-1/3 leading-tight">{item}</span>
                                
                                <div className="flex flex-col flex-1 w-full gap-1">
                                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider px-1 mb-1">
                                    <span></span>
                                    <span className="text-gray-400 text-center">Score: {val} / 10</span>
                                    <span className="text-gray-400">Exzellent (10)</span>
                                  </div>
                                  <input 
                                    type="range" 
                                    min="1" 
                                    max="10" 
                                    value={val}
                                    onChange={(e) => handleSliderChange(key, Number(e.target.value))}
                                    onMouseUp={() => handleSliderCommit(key)}
                                    onTouchEnd={() => handleSliderCommit(key)}
                                    className={`w-full h-3 rounded-lg appearance-none cursor-pointer transition-colors ${isCritical ? 'bg-red-200 accent-red-600' : 'bg-gray-200 accent-indigo-600'}`}
                                  />
                                </div>
                              </div>

                              {/* Conditional Intervention Input */}
                              {isCritical && (
                                <div className="mt-2 animate-in slide-in-from-top-2 fade-in duration-300">
                                  <label className="block text-xs font-bold text-red-600 mb-2 uppercase tracking-wider">
                                    Pflichtfeld: Fördermaßnahmen eintragen
                                  </label>
                                  <textarea 
                                    required
                                    rows={2}
                                    placeholder="Wie wird die Schülerin/der Schüler gefördert?"
                                    value={interventions[key] || ""}
                                    onChange={(e) => setInterventions(prev => ({ ...prev, [key]: e.target.value }))}
                                    onBlur={() => handleInterventionBlur(key)}
                                    className="w-full bg-white border border-red-200 focus:border-red-500 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-red-500/20 resize-none shadow-inner"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="pt-8 flex justify-end">
        <button 
          onClick={handleNextStudent}
          disabled={!nextStudentId}
          className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-indigo-500/30 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          Nächster Schüler
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
