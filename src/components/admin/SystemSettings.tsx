"use client";

import { useState, useTransition, useEffect } from "react";
import { getQuarters, addQuarter, setActiveQuarter, getCurrentQuarter } from "@/app/actions/system";

export default function SystemSettings() {
  const [quarters, setQuarters] = useState<any[]>([]);
  const [currentQuarter, setCurrentQuarter] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [newId, setNewId] = useState("");
  const [newName, setNewName] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [qList, cur] = await Promise.all([getQuarters(), getCurrentQuarter()]);
      setQuarters(qList);
      setCurrentQuarter(cur);
    } catch (err) {
      console.error("Failed to fetch system data:", err);
      setError("Daten konnten nicht geladen werden. Bitte Seite neu laden.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddQuarter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newId || !newName) return;

    startTransition(async () => {
      const res = await addQuarter(newId, newName);
      if (res.success) {
        setNewId("");
        setNewName("");
        fetchData();
      } else {
        alert(res.error);
      }
    });
  };

  const handleSetDefault = (id: string) => {
    if (!confirm(`Möchtest du "${id}" wirklich als aktives Quartal für das gesamte System setzen?`)) return;

    startTransition(async () => {
      const res = await setActiveQuarter(id);
      if (res.success) {
        setCurrentQuarter(id);
        alert("Aktives Quartal wurde aktualisiert.");
      } else {
        alert(res.error);
      }
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 -mr-12 -mt-12 rounded-full" />
        <div className="relative">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Zeitraum-Verwaltung</h2>
              <p className="text-gray-400 font-medium mt-1">Definiere, welches Quartal aktuell bearbeitet wird.</p>
            </div>
            <button onClick={fetchData} disabled={loading} className="text-gray-400 hover:text-gray-600 disabled:opacity-30">
               <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
               </svg>
            </button>
          </div>
          
          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 text-sm font-bold rounded-xl border border-red-100 italic">
              {error}
            </div>
          )}
        </div>

        <div className="mt-10 max-w-lg">
          <h3 className="font-bold text-gray-900 mb-4">Neues Quartal hinzufügen</h3>
          <form onSubmit={handleAddQuarter} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input 
                value={newId}
                onChange={(e) => setNewId(e.target.value)}
                placeholder="ID (z.B. Q3_2026)" 
                className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs text-black"
              />
              <input 
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Name (z.B. Q3 2026)" 
                className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm text-black"
              />
            </div>
            <button 
              disabled={isPending || !newId || !newName}
              className="w-full py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-black transition-all disabled:opacity-50"
            >
              Hinzufügen
            </button>
          </form>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden text-black">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              <th className="px-8 py-4">ID / Bezeichnung</th>
              <th className="px-8 py-4">Status</th>
              <th className="px-8 py-4 text-right">Aktion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={3} className="px-8 py-12 text-center text-gray-400">Lädt Konfiguration...</td></tr>
            ) : quarters.length === 0 ? (
              <tr><td colSpan={3} className="px-8 py-12 text-center text-gray-400">Keine Datensätze vorhanden.</td></tr>
            ) : (
              quarters.map((q) => (
                <tr key={q.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-4">
                    <p className="font-bold text-gray-900">{q.name}</p>
                    <code className="text-[10px] text-gray-400 font-mono">{q.id}</code>
                  </td>
                  <td className="px-8 py-4">
                    {currentQuarter === q.id ? (
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        AKTIV
                      </span>
                    ) : (
                      <span className="text-gray-300 text-[10px] font-bold uppercase">Inaktiv</span>
                    )}
                  </td>
                  <td className="px-8 py-4 text-right">
                    {currentQuarter !== q.id && (
                      <button 
                        onClick={() => handleSetDefault(q.id)}
                        disabled={isPending}
                        className="px-4 py-2 bg-blue-50 text-blue-700 text-xs font-bold rounded-xl hover:bg-blue-100 transition-all font-bold"
                      >
                        Aktivieren
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
