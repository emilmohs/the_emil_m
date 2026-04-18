"use client";

import { useState, useEffect } from "react";
import { 
  getActiveClasses, 
  getStudentsByClass, 
  promoteStudents 
} from "@/app/actions/students";
import { useRouter } from "next/navigation";

export default function PromotionPage() {
  const [classes, setClasses] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [targetClass, setTargetClass] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  const router = useRouter();

  // Initial Klassen laden
  useEffect(() => {
    getActiveClasses().then(setClasses);
  }, []);

  // Schüler laden wenn Klasse ausgewählt wird
  useEffect(() => {
    if (selectedClass) {
      getStudentsByClass(selectedClass).then((data) => {
        setStudents(data);
        setSelectedStudents(data.map(s => s.id)); // Alle vorauswählen
      });
    } else {
      setStudents([]);
      setSelectedStudents([]);
    }
  }, [selectedClass]);

  const handleToggleStudent = (id: string) => {
    setSelectedStudents(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handlePromote = async () => {
    if (!targetClass) {
      setMessage({ type: "error", text: "Bitte Zielklasse angeben." });
      return;
    }
    if (selectedStudents.length === 0) {
      setMessage({ type: "error", text: "Keine Schüler ausgewählt." });
      return;
    }

    setLoading(true);
    setMessage(null);

    const res = await promoteStudents(selectedStudents, targetClass);

    if (res.success) {
      setMessage({ type: "success", text: `${res.count} Schüler wurden nach ${targetClass} versetzt.` });
      // Reload initial data
      getActiveClasses().then(setClasses);
      setSelectedClass("");
      setTargetClass("");
    } else {
      setMessage({ type: "error", text: res.error || "Ein Fehler ist aufgetreten." });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-black p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <header className="bg-gray-900 px-8 py-6 text-white">
          <h1 className="text-2xl font-bold">Klassen-Versetzung</h1>
          <p className="text-gray-400 text-sm mt-1">Sammel-Promotion von Schülern in das nächste Schuljahr</p>
        </header>

        <div className="p-8 space-y-8">
          {/* Schritt 1: Quellklasse wählen */}
          <section>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">1. Quellklasse auswählen</h2>
            <select 
              value={selectedClass} 
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full md:w-1/2 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">-- Klasse wählen --</option>
              {classes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </section>

          {selectedClass && (
            <>
              {/* Schritt 2: Schülerliste */}
              <section className="animate-in fade-in slide-in-from-top-4 duration-300">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">2. Schüler bestätigen (Wiederholer abwählen)</h2>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-medium">
                      <tr>
                        <th className="px-4 py-3 w-12 text-center">
                          <input 
                            type="checkbox" 
                            checked={selectedStudents.length === students.length && students.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedStudents(students.map(s => s.id));
                              else setSelectedStudents([]);
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </th>
                        <th className="px-4 py-3">Nachname, Vorname</th>
                        <th className="px-4 py-3">Akten-Nr.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {students.map(student => (
                        <tr key={student.id} className="hover:bg-blue-50/30 transition-colors">
                          <td className="px-4 py-3 text-center">
                            <input 
                              type="checkbox" 
                              checked={selectedStudents.includes(student.id)}
                              onChange={() => handleToggleStudent(student.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {student.lastName}, {student.firstName}
                          </td>
                          <td className="px-4 py-3 text-gray-500">
                            {student.internalId || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Schritt 3: Zielklasse & Aktion */}
              <section className="animate-in fade-in slide-in-from-top-4 duration-500">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">3. Zielklasse & Ausführung</h2>
                <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1 w-full">
                    <label className="block text-xs text-gray-500 mb-1 ml-1">Neue Klassenbezeichnung (z.B. {selectedClass.replace(/(\d+)/, (m) => String(parseInt(m)+1))})</label>
                    <input 
                      type="text" 
                      value={targetClass}
                      onChange={(e) => setTargetClass(e.target.value)}
                      placeholder="z.B. 4b"
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <button
                    onClick={handlePromote}
                    disabled={loading || selectedStudents.length === 0}
                    className="w-full md:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold rounded-lg transition-all shadow-lg shadow-blue-200 active:scale-95"
                  >
                    {loading ? "Wird versetzt..." : `Versetzen (${selectedStudents.length} Schüler)`}
                  </button>
                </div>
              </section>
            </>
          )}

          {message && (
            <div className={`p-4 rounded-lg flex items-center gap-3 border ${
              message.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"
            }`}>
              {message.type === "success" ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
              )}
              <span className="font-medium">{message.text}</span>
            </div>
          )}
        </div>
        
        <footer className="bg-gray-50 px-8 py-4 border-t border-gray-200 flex justify-between">
          <button 
             onClick={() => router.push("/admin")}
             className="text-sm text-gray-500 hover:text-gray-900"
          >
            ← Zurück zur Admin-Übersicht
          </button>
        </footer>
      </div>
    </div>
  );
}
