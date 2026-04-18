"use client";

import { useTransition, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createLogEntry } from "@/app/actions/log";

export default function ClientForm({ studentId }: { studentId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  async function handleAction(formData: FormData) {
    setError(null);
    const content = formData.get("content") as string;
    const category = formData.get("category") as any;

    if (!content || content.trim().length < 5) {
      setError("Der Text muss mindestens 5 Zeichen umfassen.");
      return;
    }

    startTransition(async () => {
      const res = await createLogEntry({ studentId, content, category });
      if (res.error) {
        setError(res.error);
      } else {
        formRef.current?.reset();
        router.refresh(); // Aktualisiert die Server Component Seite, um den neuen Log zu laden
      }
    });
  }

  return (
    <div className="bg-white p-6 rounded-3xl border border-blue-100 shadow-xl shadow-blue-500/5">
      <h3 className="text-lg font-bold text-gray-900 mb-2">Neuer Eintrag</h3>
      <p className="text-xs text-gray-500 mb-6">Hinweis: Die Daten werden Ende-zu-Ende AES vercshlüsselt gespeichert.</p>

      <form ref={formRef} action={handleAction} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 text-xs font-bold p-3 rounded-xl border border-red-100">
            {error}
          </div>
        )}

        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Kategorie</label>
          <select 
            name="category" 
            required 
            defaultValue="Sozialverhalten"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Sozialverhalten">Sozialverhalten</option>
            <option value="Mathematik">Mathematik</option>
            <option value="Deutsch">Deutsch</option>
            <option value="Sachunterricht">Sachunterricht</option>
            <option value="Motorik">Motorik</option>
            <option value="Sprache">Sprache</option>
            <option value="Arbeitsverhalten">Arbeitsverhalten</option>
            <option value="Sonstiges">Sonstiges</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Beobachtung</label>
          <textarea 
            name="content"
            required
            placeholder="Was möchten Sie dokumentieren?"
            rows={5}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <button 
          type="submit" 
          disabled={isPending}
          className="w-full py-3 mt-4 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] disabled:opacity-50 flex justify-center items-center gap-2"
        >
          {isPending ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              Speichere...
            </>
          ) : (
            "Eintrag speichern"
          )}
        </button>
      </form>
    </div>
  );
}
