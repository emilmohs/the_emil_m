"use client";

import { useTransition, useState, useRef } from "react";
import { createStudentTag, deleteStudentTag } from "@/app/actions/tags";
import { getTagColor } from "@/lib/colors";

interface TagManagementProps {
  tags: any[];
}

const TAILWIND_COLORS = [
  { value: "red-500", label: "Rot" },
  { value: "orange-500", label: "Orange" },
  { value: "amber-500", label: "Gelb" },
  { value: "green-500", label: "Grün" },
  { value: "blue-500", label: "Blau" },
  { value: "indigo-500", label: "Indigo" },
  { value: "purple-500", label: "Lila" },
  { value: "pink-500", label: "Pink" },
  { value: "gray-500", label: "Grau" },
];

export default function TagManagement({ tags }: TagManagementProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  async function handleCreateTag(formData: FormData) {
    setError("");
    const name = formData.get("name") as string;
    const color = formData.get("color") as string;

    startTransition(async () => {
      const res = await createStudentTag(name, color);
      if (res.error) {
        setError(res.error);
      } else {
        formRef.current?.reset();
      }
    });
  }

  async function handleDeleteTag(tagId: string) {
    if (!confirm("Soll dieser Tag wirklich gelöscht werden? Er wird bei allen zugewiesenen Schülern entfernt.")) return;
    startTransition(async () => {
      await deleteStudentTag(tagId);
    });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 animate-in fade-in duration-500">
      <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden h-fit">
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 -mr-8 -mt-8 rounded-full" />
        <h3 className="text-xl font-black text-gray-900 mb-2 relative">Neuen Tag erstellen</h3>
        <p className="text-sm text-gray-500 mb-6 relative">Erzeuge farbige Tags (z.B. "LRS", "Inklusion"), um Schülerprofile strukturiert zu markieren.</p>
        
        <form ref={formRef} action={handleCreateTag} className="space-y-4 relative">
          {error && <p className="text-red-500 text-sm font-bold bg-red-50 p-3 rounded-xl border border-red-100">{error}</p>}
          
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Bezeichnung</label>
            <input name="name" required placeholder="z.B. LRS" className="w-full bg-gray-50 border-2 border-gray-100 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-gray-900 font-bold outline-none transition-all shadow-sm" />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Farblabel</label>
            <select name="color" className="w-full bg-gray-50 border-2 border-gray-100 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-gray-900 font-bold outline-none transition-all shadow-sm cursor-pointer appearance-none">
              {TAILWIND_COLORS.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <button 
            type="submit" 
            disabled={isPending}
            className="w-full py-3 mt-4 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all disabled:opacity-50"
          >
            {isPending ? "Erstelle..." : "Tag speichern"}
          </button>
        </form>
      </div>

      <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-200 shadow-sm p-5 md:p-8 min-h-[400px] md:min-h-[500px] overflow-x-auto">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Verfügbare Tags</h2>
            <p className="text-gray-500 font-medium">Bestehende Tags, die Schülern zugewiesen werden können.</p>
          </div>
          <span className="bg-gray-100 text-gray-600 font-bold px-4 py-1.5 rounded-full text-sm">{tags.length} aktiv</span>
        </div>

        {tags.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-16 text-center text-gray-400 font-medium">
            Noch keine Tags erstellt.
          </div>
        ) : (
          <div className="flex flex-wrap gap-4">
            {tags.map((tag) => (
              <div 
                key={tag.id}
                className="group flex items-center bg-gray-50 border border-gray-200 rounded-xl pl-4 pr-1 py-1 shadow-sm hover:shadow-md transition-shadow"
              >
                <div style={{ backgroundColor: getTagColor(tag.color) }} className="w-3 h-3 rounded-full mr-3" />
                <span className="font-bold text-gray-700 mr-4 tracking-wide">{tag.name}</span>
                <button 
                  onClick={() => handleDeleteTag(tag.id)}
                  disabled={isPending}
                  className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Tag löschen"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
