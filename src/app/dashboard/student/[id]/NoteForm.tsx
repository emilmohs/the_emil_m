"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { createNote } from "@/app/actions/students";

export default function NoteForm({ studentId }: { studentId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  async function handleAction(formData: FormData) {
    setError(null);
    const content = formData.get("content") as string;

    if (!content || content.trim().length < 10) {
      setError("Der Bericht ist zu kurz (mindestens 10 Zeichen).");
      return;
    }

    startTransition(async () => {
      const res = await createNote(studentId, content);
      if (res.error) {
        setError(res.error);
      } else {
        formRef.current?.reset();
        router.refresh();
      }
    });
  }

  return (
    <div className="bg-white p-6 rounded-3xl border border-blue-100 shadow-xl shadow-blue-500/5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Lernentwicklungsbericht</h3>
          <p className="text-xs text-gray-500">Freitext-Rückmeldung für das Zeugnis oder Elterngespräche.</p>
        </div>
      </div>

      <form ref={formRef} action={handleAction} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 text-xs font-bold p-3 rounded-xl border border-red-100">
            {error}
          </div>
        )}

        <div>
          <textarea 
            name="content"
            required
            placeholder="Schreiben Sie hier Ihre pädagogische Rückmeldung zum Lernstand..."
            rows={6}
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
          />
        </div>

        <button 
          type="submit" 
          disabled={isPending}
          className="w-full py-4 text-sm font-bold text-white bg-blue-600 rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] disabled:opacity-50 flex justify-center items-center gap-2"
        >
          {isPending ? "Speichern..." : "Bericht speichern"}
        </button>
      </form>
    </div>
  );
}
