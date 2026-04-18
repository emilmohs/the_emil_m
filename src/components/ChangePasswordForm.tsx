"use client";

import { useState, useTransition } from "react";
import { changePassword } from "@/app/actions/password";

export default function ChangePasswordForm() {
  const [open, setOpen] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (newPw !== confirmPw) {
      setError("Die Passwörter stimmen nicht überein.");
      return;
    }

    startTransition(async () => {
      const res = await changePassword(currentPw, newPw);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(true);
        setCurrentPw("");
        setNewPw("");
        setConfirmPw("");
        setTimeout(() => { setSuccess(false); setOpen(false); }, 2500);
      }
    });
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 text-sm font-bold text-gray-600 bg-gray-100 border border-gray-200 rounded-xl hover:bg-gray-200 transition-all"
      >
        Passwort ändern
      </button>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm max-w-md">
      <h3 className="text-lg font-bold text-gray-900 mb-1">Passwort ändern</h3>
      <p className="text-xs text-gray-500 mb-4">Gib dein aktuelles und ein neues Passwort ein.</p>

      {error && <p className="text-red-600 text-xs font-bold bg-red-50 p-2 rounded-lg mb-3">{error}</p>}
      {success && <p className="text-green-600 text-xs font-bold bg-green-50 p-2 rounded-lg mb-3">✓ Passwort erfolgreich geändert!</p>}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Aktuelles Passwort</label>
          <input type="password" required value={currentPw} onChange={e => setCurrentPw(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Neues Passwort</label>
          <input type="password" required minLength={6} value={newPw} onChange={e => setNewPw(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Neues Passwort bestätigen</label>
          <input type="password" required minLength={6} value={confirmPw} onChange={e => setConfirmPw(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={() => { setOpen(false); setError(""); }} className="flex-1 py-2 text-sm font-bold text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">Abbrechen</button>
          <button type="submit" disabled={isPending} className="flex-1 py-2 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-md">{isPending ? "Speichert…" : "Speichern"}</button>
        </div>
      </form>
    </div>
  );
}
