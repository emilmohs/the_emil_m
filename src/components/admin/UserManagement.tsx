"use client";

import { useTransition, useState } from "react";
import { createUser, toggleUserStatus, updateUserClasses, resetUserPassword } from "@/app/actions/user";

interface UserManagementProps {
  users: any[];
  allClasses: any[];
}

export default function UserManagement({ users, allClasses }: UserManagementProps) {
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(users.length > 0 ? users[0].id : null);

  const selectedUser = users.find(u => u.id === selectedUserId) || null;

  async function handleCreateUser(formData: FormData) {
    setError("");
    const name = formData.get("name") as string;
    const username = formData.get("username") as string;
    const email = formData.get("email") as string;
    const role = formData.get("role") as any;
    const managedClassIds = formData.getAll("classes") as string[];

    startTransition(async () => {
      const res = await createUser({ name, username, email, role, managedClassIds });
      if (res.error) {
        setError(res.error);
      } else {
        setShowModal(false);
        if (res.userId) {
          setSelectedUserId(res.userId);
        }
      }
    });
  }

  function toggleClass(classId: string) {
    if (!selectedUser) return;
    
    startTransition(async () => {
      const currentClasses = selectedUser.managedClasses.map((c: any) => c.id);
      let newClasses;
      if (currentClasses.includes(classId)) {
        newClasses = currentClasses.filter((id: string) => id !== classId);
      } else {
        newClasses = [...currentClasses, classId];
      }
      await updateUserClasses(selectedUser.id, newClasses);
    });
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 animate-in fade-in duration-500">
      {/* LINKE SPALTE: LEHRER-LISTE */}
      <div className="w-full md:w-1/3 bg-white border border-gray-200 rounded-3xl p-6 shadow-sm flex flex-col min-h-[600px] h-[75vh]">
        <button 
          onClick={() => setShowModal(true)}
          className="w-full py-3 mb-6 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 shadow-xl shadow-gray-200 transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
          Neuen Lehrer-Account anlegen
        </button>

        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 px-2">Alle Lehrkräfte ({users.length})</h3>
        
        <div className="overflow-y-auto flex-1 space-y-2 pr-2">
          {users.map(user => {
            const isSelected = selectedUserId === user.id;
            return (
              <div 
                key={user.id}
                onClick={() => setSelectedUserId(user.id)}
                className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                  isSelected 
                    ? "bg-blue-50 border-blue-200 shadow-sm" 
                    : "bg-white border-transparent hover:bg-gray-50 hover:border-gray-200"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className={`font-bold ${isSelected ? "text-blue-900" : "text-gray-900"}`}>{user.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
                  </div>
                  {!user.isActive && (
                    <span className="w-2 h-2 rounded-full bg-red-500 mt-1.5" title="Gesperrt" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RECHTE SPALTE: DETAILS UND MATRIX */}
      <div className="w-full md:w-2/3 bg-white border border-gray-200 rounded-3xl p-8 shadow-sm min-h-[600px] flex flex-col relative overflow-hidden">
        {!selectedUser ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
            <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
            <p className="font-medium text-lg">Bitte wähle links eine Lehrkraft aus.</p>
          </div>
        ) : (
          <>
            <div className={`absolute top-0 right-0 w-64 h-64 -mr-20 -mt-20 rounded-full transition-colors ${selectedUser.isActive ? "bg-blue-50" : "bg-red-50"}`} />
            
            <div className="relative z-10 flex justify-between items-start mb-10 pb-8 border-b border-gray-100">
              <div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">{selectedUser.name}</h2>
                <div className="flex flex-col gap-1 mb-4">
                  <p className="text-gray-500 font-medium">
                    {selectedUser.username && <span className="text-gray-900 font-bold">@{selectedUser.username}</span>}
                    {selectedUser.email && <span className="ml-2 text-gray-400">({selectedUser.email})</span>}
                  </p>
                  <p className="text-xs text-gray-400 bg-gray-50 border border-gray-100 px-2 py-1 rounded fit-content inline-flex items-center gap-2 max-w-max">
                    Initial-Passwort: <strong className="font-mono text-gray-700 tracking-widest">Start123!</strong>
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase ${
                    selectedUser.role === "ADMIN" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                  }`}>
                    {selectedUser.role}
                  </span>
                  <span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase flex items-center gap-1 ${
                    selectedUser.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${selectedUser.isActive ? "bg-green-500" : "bg-gray-400"}`} />
                    {selectedUser.isActive ? "Account Aktiv" : "Gesperrt"}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 items-end">
                <button 
                  onClick={() => {
                    if(confirm("Möchtest du das Passwort dieses Benutzers auf 'Start123!' zurücksetzen?")) {
                      startTransition(async () => {
                        const res = await resetUserPassword(selectedUser.id);
                        if (res.error) alert(res.error);
                        else alert("Das Passwort wurde erfolgreich auf 'Start123!' zurückgesetzt. Der Benutzer sollte dieses nach dem ersten Login ändern.");
                      });
                    }
                  }}
                  disabled={isPending}
                  className="px-4 py-2 text-sm font-bold rounded-xl transition-all shadow-sm disabled:opacity-50 bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                >
                  Passwort zurücksetzen
                </button>
                <button 
                  onClick={() => startTransition(() => { toggleUserStatus(selectedUser.id, !selectedUser.isActive) })}
                  disabled={isPending}
                  className={`px-4 py-2 text-sm font-bold rounded-xl transition-all shadow-sm disabled:opacity-50 ${
                    selectedUser.isActive 
                      ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-100" 
                      : "bg-green-50 text-green-600 hover:bg-green-100 border border-green-100"
                  }`}
                >
                  {selectedUser.isActive ? "Account sperren" : "Account aktivieren"}
                </button>
              </div>
            </div>

            <div className="relative z-10 flex-1">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Zuweisungs-Matrix (Klassen)</h3>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-full">{selectedUser.managedClasses.length} Zugewiesen</span>
              </div>
              <p className="text-sm text-gray-500 mb-6">Klicke auf die Klassen unten, um dem Lehrer Zugriff auf die entsprechenden Schüler-Profile zu erteilen oder zu entziehen.</p>

              <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 transition-opacity ${isPending ? "opacity-50" : "opacity-100"}`}>
                {allClasses.map((cl) => {
                  const isAssigned = selectedUser.managedClasses.some((mc: any) => mc.id === cl.id);
                  return (
                    <button
                      key={cl.id}
                      onClick={() => toggleClass(cl.id)}
                      disabled={isPending}
                      className={`flex items-center justify-center p-4 rounded-2xl border-2 transition-all group ${
                        isAssigned 
                          ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200" 
                          : "bg-white border-gray-200 hover:border-gray-400 text-gray-600"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        {isAssigned ? (
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                        ) : (
                          <svg className="w-6 h-6 text-gray-300 group-hover:text-gray-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                        )}
                        <span className="font-bold text-lg">{cl.id}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* CREATE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in-95 duration-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 -mr-16 -mt-16 rounded-full" />
            <h3 className="text-2xl font-black text-gray-900 mb-8 relative">Neuen Lehrer anlegen</h3>
            
            <form action={handleCreateUser} className="space-y-5 relative">
              {error && <p className="text-red-500 text-sm font-bold bg-red-50 p-3 rounded-xl border border-red-100">{error}</p>}
              
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Vollständiger Name</label>
                <input name="name" required placeholder="z.B. Maria Meyer" className="w-full bg-white border-2 border-gray-100 focus:border-blue-500 rounded-2xl px-5 py-3.5 text-gray-900 font-medium outline-none transition-all shadow-sm" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Benutzername</label>
                <input name="username" required placeholder="z.B. mmeyer" className="w-full bg-white border-2 border-gray-100 focus:border-blue-500 rounded-2xl px-5 py-3.5 text-gray-900 font-medium outline-none transition-all shadow-sm" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">E-Mail Adresse (Optional)</label>
                <input name="email" type="email" placeholder="lehrer@schule.de" className="w-full bg-white border-2 border-gray-100 focus:border-blue-500 rounded-2xl px-5 py-3.5 text-gray-900 font-medium outline-none transition-all shadow-sm" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Rolle</label>
                <select name="role" className="w-full bg-white border-2 border-gray-100 focus:border-blue-500 rounded-2xl px-5 py-3.5 text-gray-900 font-medium outline-none transition-all shadow-sm appearance-none cursor-pointer">
                  <option value="TEACHER">Lehrkraft</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>

              <div className="pt-6 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-5 py-3.5 text-sm font-bold text-gray-500 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-all active:scale-95"
                >
                  Abbrechen
                </button>
                <button 
                  type="submit" 
                  disabled={isPending}
                  className="flex-1 px-5 py-3.5 text-sm font-bold text-white bg-blue-600 rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all disabled:opacity-50 active:scale-95"
                >
                  {isPending ? "Lädt..." : "Speichern"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
