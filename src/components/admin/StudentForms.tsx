"use client";

import { useTransition, useState, useRef } from "react";
import { createStudent } from "@/app/actions/students";
import { createClass } from "@/app/actions/user";

export default function StudentForms({ allClasses }: { allClasses: {id: string}[] }) {
  const [isPending, startTransition] = useTransition();
  const [errorStudent, setErrorStudent] = useState("");
  const [errorClass, setErrorClass] = useState("");
  const [successStudent, setSuccessStudent] = useState(false);
  const [successClass, setSuccessClass] = useState(false);

  const studentFormRef = useRef<HTMLFormElement>(null);
  const classFormRef = useRef<HTMLFormElement>(null);

  async function handleCreateStudent(formData: FormData) {
    setErrorStudent("");
    setSuccessStudent(false);
    
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const classIdRaw = formData.get("classId") as string;
    const classId = classIdRaw === "none" ? undefined : classIdRaw;
    
    const birthYearData = formData.get("birthYear");
    const birthYear = birthYearData ? parseInt(birthYearData as string, 10) : undefined;
    
    const internalIdData = formData.get("internalId") as string;
    const internalId = internalIdData || undefined;

    startTransition(async () => {
      const res = await createStudent({ firstName, lastName, classId, birthYear, internalId });
      if (res.error) {
        setErrorStudent(res.error);
      } else {
        setSuccessStudent(true);
        studentFormRef.current?.reset();
        setTimeout(() => setSuccessStudent(false), 3000);
      }
    });
  }

  async function handleCreateClass(formData: FormData) {
    setErrorClass("");
    setSuccessClass(false);
    const classId = formData.get("classId") as string;

    startTransition(async () => {
      const res = await createClass(classId);
      if (res.error) {
        setErrorClass(res.error);
      } else {
        setSuccessClass(true);
        classFormRef.current?.reset();
        setTimeout(() => setSuccessClass(false), 3000);
      }
    });
  }

  return (
    <div className="grid md:grid-cols-2 gap-6 mb-8">
      {/* Schüler anlegen */}
      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 -mr-8 -mt-8 rounded-full" />
        <h3 className="text-lg font-bold text-gray-900 mb-1 relative">Neuen Schüler anlegen</h3>
        <p className="text-xs text-gray-500 mb-6 relative">Erstellt ein Profil und weist es direkt einer Klasse zu.</p>
        
        <form ref={studentFormRef} action={handleCreateStudent} className="space-y-4 relative">
          {errorStudent && <p className="text-red-500 text-xs font-bold bg-red-50 p-2 rounded-lg">{errorStudent}</p>}
          {successStudent && <p className="text-green-600 text-xs font-bold bg-green-50 p-2 rounded-lg">Schüler erfolgreich angelegt!</p>}
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Vorname</label>
              <input name="firstName" required className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Nachname</label>
              <input name="lastName" required className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Schüler-ID</label>
              <input name="internalId" placeholder="Optional" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Geburtsjahr</label>
              <input name="birthYear" type="number" min="2000" max="2030" placeholder="z.B. 2012" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Klasse</label>
              <select name="classId" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                <option value="none">Keine</option>
                {allClasses.map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
              </select>
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={isPending}
            className="w-full py-2.5 mt-2 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all disabled:opacity-50"
          >
            {isPending ? "Speichern..." : "Schüler anlegen"}
          </button>
        </form>
      </div>

      {/* Klasse anlegen */}
      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50 -mr-8 -mt-8 rounded-full" />
        <h3 className="text-lg font-bold text-gray-900 mb-1 relative">Neue Klasse anlegen</h3>
        <p className="text-xs text-gray-500 mb-6 relative">Wird benötigt, um Schüler und Lehrer zuzuordnen.</p>
        
        <form ref={classFormRef} action={handleCreateClass} className="space-y-4 relative">
          {errorClass && <p className="text-red-500 text-xs font-bold bg-red-50 p-2 rounded-lg">{errorClass}</p>}
          {successClass && <p className="text-green-600 text-xs font-bold bg-green-50 p-2 rounded-lg">Klasse erfolgreich erstellt!</p>}
          
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Klassenbezeichnung (z.B. "3b")</label>
            <input name="classId" required placeholder="z.B. 3b" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" />
            <p className="text-[10px] text-gray-400 mt-2">Die Klasse steht anschließend für Zuweisungen bereit.</p>
          </div>
          
          <button 
            type="submit" 
            disabled={isPending}
            className="w-full py-2.5 mt-2 text-sm font-bold text-gray-700 bg-gray-100 border border-gray-200 rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50"
          >
            {isPending ? "Erstelle..." : "Klasse erstellen"}
          </button>
        </form>
      </div>
    </div>
  );
}
