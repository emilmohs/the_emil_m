"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { getBackups, triggerBackup, deleteBackup, restoreBackup, uploadBackup } from "@/app/actions/backups";

export default function BackupManagement() {
  const [backups, setBackups] = useState<any[]>([]);
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchBackups = async () => {
    const data = await getBackups();
    setBackups(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleManualBackup = () => {
    startTransition(async () => {
      const res = await triggerBackup();
      if ("success" in res && res.success) {
        fetchBackups();
      } else {
        alert("Fehler beim Backup: " + (res as any).error);
      }
    });
  };

  const handleDelete = (name: string) => {
    if (!confirm(`Backup "${name}" wirklich löschen?`)) return;
    startTransition(async () => {
      await deleteBackup(name);
      fetchBackups();
    });
  };

  const handleRestore = (name: string) => {
    if (!confirm(`WARNUNG: Das System wird auf den Stand vom "${name}" zurückgesetzt. Alle aktuellen Änderungen gehen verloren! Fortfahren?`)) return;
    
    startTransition(async () => {
      const res = await restoreBackup(name);
      if ("success" in res && res.success) {
        alert("System wurde erfolgreich wiederhergestellt. Die Seite wird neu geladen.");
        window.location.reload();
      } else {
        alert("Fehler bei der Wiederherstellung: " + (res as any).error);
      }
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm(`Möchtest du die Datenbank wirklich durch die Datei "${file.name}" ersetzen?`)) {
      e.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("backupFile", file);

    startTransition(async () => {
      const res = await uploadBackup(formData);
      if ("success" in res && res.success) {
        alert("Backup erfolgreich hochgeladen und installiert. Die Seite wird neu geladen.");
        window.location.reload();
      } else {
        alert("Fehler beim Upload/Restore: " + (res as any).error);
      }
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col justify-between bg-white p-8 rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 -mr-12 -mt-12 rounded-full" />
          <div className="relative">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Snapshot erstellen</h2>
            <p className="text-gray-400 font-medium mt-1">Sichere den aktuellen Systemzustand sofort.</p>
            <button 
              onClick={handleManualBackup}
              disabled={isPending}
              className="mt-6 w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2v-10a2 2 0 00-2-2h-2M10 7V5a2 2 0 012-2h4a2 2 0 012 2v2M9 17v-5l-2 2m2-2l2 2"/></svg>
              {isPending ? "Verarbeite..." : "Jetzt Backup erstellen"}
            </button>
          </div>
        </div>

        <div className="flex flex-col justify-between bg-white p-8 rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 -mr-12 -mt-12 rounded-full" />
          <div className="relative">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Backup einspielen</h2>
            <p className="text-gray-400 font-medium mt-1">Lade eine externe .db Datei hoch.</p>
            <input 
              type="file" 
              accept=".db" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isPending}
              className="mt-6 w-full py-4 bg-purple-600 text-white font-bold rounded-2xl hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
              {isPending ? "Verarbeite..." : "Datei hochladen & installieren"}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-black text-gray-900">Vorhandene Snapshots</h3>
          <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-500">Max. 10 Dateien</span>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              <th className="px-8 py-4">Zeitpunkt</th>
              <th className="px-8 py-4">Dateiname</th>
              <th className="px-8 py-4">Größe</th>
              <th className="px-8 py-4 text-right">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={4} className="px-8 py-12 text-center text-gray-400">Lade Backups...</td></tr>
            ) : backups.length === 0 ? (
              <tr><td colSpan={4} className="px-8 py-12 text-center text-gray-400 font-medium italic">Keine Snapshots im Speicher.</td></tr>
            ) : (
              backups.map((b) => (
                <tr key={b.name} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-4">
                    <p className="font-bold text-gray-900">{new Date(b.createdAt).toLocaleString("de-DE")}</p>
                  </td>
                  <td className="px-8 py-4">
                    <code className="text-[10px] bg-gray-100 px-2 py-1 rounded text-gray-600 font-mono tracking-tight">{b.name}</code>
                  </td>
                  <td className="px-8 py-4 text-sm text-gray-500 font-medium">
                    {formatSize(b.size)}
                  </td>
                  <td className="px-8 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button 
                        onClick={() => handleRestore(b.name)}
                        disabled={isPending}
                        className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-all flex items-center gap-2 text-xs font-bold"
                        title="Diesen Stand wiederherstellen"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                        Restore
                      </button>
                      <a 
                        href={`/novum/api/admin/backups/${b.name}`}
                        className="p-2.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all"
                        title="Herunterladen"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                      </a>
                      <button 
                        onClick={() => handleDelete(b.name)}
                        disabled={isPending}
                        className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title="Löschen"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-amber-50 border border-amber-200 p-6 rounded-3xl flex items-start gap-4">
        <div className="p-2 bg-amber-100 rounded-xl text-amber-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
        </div>
        <div>
          <h4 className="font-black text-amber-900">Warnung zur Wiederherstellung</h4>
          <p className="text-sm text-amber-800 font-medium mt-1 leading-relaxed">
            Eine Wiederherstellung überschreibt die aktuelle Datenbank unwiderruflich. Bitte stelle sicher, dass du zuvor einen aktuellen Snapshot erstellt hast, falls du den jetzigen Stand sichern möchtest.
          </p>
        </div>
      </div>
    </div>
  );
}
