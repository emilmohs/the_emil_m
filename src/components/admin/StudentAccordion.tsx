"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { assignTagToStudent, removeTagFromStudent } from "@/app/actions/tags";
import { updateStudent, deleteStudent } from "@/app/actions/students";

import { getTagColor } from "@/lib/colors";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  internalId: string | null;
  classId: string | null;
  birthYear: number | null;
  status: string | null;
  tags?: any[];
}

interface ClassData {
  id: string;
  students: Student[];
}

export default function StudentAccordion({ classes, allTags = [], allClasses = [] }: { classes: ClassData[], allTags?: any[], allClasses?: {id: string}[] }) {
  const [openClass, setOpenClass] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Student>>({});
  const [isPending, startTransition] = useTransition();

  const startEdit = (student: Student) => {
    setEditingId(student.id);
    setEditForm({ firstName: student.firstName, lastName: student.lastName, classId: student.classId, birthYear: student.birthYear, status: student.status });
  };

  const cancelEdit = () => { setEditingId(null); setEditForm({}); };

  const saveEdit = (studentId: string) => {
    startTransition(async () => {
      await updateStudent(studentId, {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        classId: editForm.classId || null,
        birthYear: editForm.birthYear || null,
        status: editForm.status || null
      });
      setEditingId(null);
      setEditForm({});
    });
  };

  const handleDelete = (studentId: string, name: string) => {
    if (!confirm(`"${name}" wirklich unwiderruflich löschen?`)) return;
    startTransition(async () => {
      await deleteStudent(studentId);
    });
  };

  return (
    <div className="space-y-4">
      {classes.map((cl) => {
        const isOpen = openClass === cl.id;
        return (
          <div key={cl.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm transition-all">
            <div 
              onClick={() => setOpenClass(isOpen ? null : cl.id)}
              className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg transition-colors ${isOpen ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-600"}`}>
                  {cl.id}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Klasse {cl.id}</h3>
                  <p className="text-sm text-gray-500">{cl.students.length} Schüler/innen</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Link 
                  href={`/admin/promotion?class=${cl.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="px-4 py-2 bg-gray-100 text-gray-600 font-bold text-sm rounded-xl hover:bg-gray-200 hover:text-gray-900 transition-all border border-transparent hover:border-gray-300"
                >
                  Diese Klasse versetzen
                </Link>
                <div className={`text-gray-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
                </div>
              </div>
            </div>

            {/* Accordion Content */}
            <div 
              className={`transition-all duration-300 ease-in-out border-t border-gray-100 ${
                isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0 overflow-hidden border-transparent"
              }`}
            >
              <div className="p-6 bg-gray-50/50">
                {cl.students.length === 0 ? (
                  <p className="text-gray-400 text-center py-4 font-medium">Keine Schüler in dieser Klasse.</p>
                ) : (
                  <div className="space-y-3">
                    {cl.students.map(student => {
                      const isEditing = editingId === student.id;

                      return (
                        <div key={student.id} className="bg-white p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                          {isEditing ? (
                            /* Edit Mode */
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div>
                                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Vorname</label>
                                  <input value={editForm.firstName || ""} onChange={e => setEditForm(p => ({...p, firstName: e.target.value}))} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Nachname</label>
                                  <input value={editForm.lastName || ""} onChange={e => setEditForm(p => ({...p, lastName: e.target.value}))} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Klasse</label>
                                  <select value={editForm.classId || ""} onChange={e => setEditForm(p => ({...p, classId: e.target.value || null}))} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="">Keine</option>
                                    {allClasses.map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Geburtsjahr</label>
                                  <input type="number" min="2000" max="2030" value={editForm.birthYear || ""} onChange={e => setEditForm(p => ({...p, birthYear: e.target.value ? parseInt(e.target.value) : null}))} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                              </div>
                              <div className="flex gap-2 justify-end">
                                <button onClick={cancelEdit} className="px-4 py-1.5 text-sm font-bold text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Abbrechen</button>
                                <button onClick={() => saveEdit(student.id)} disabled={isPending} className="px-4 py-1.5 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">{isPending ? "Speichert…" : "Speichern"}</button>
                              </div>
                            </div>
                          ) : (
                            /* View Mode */
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-bold text-gray-900">{student.firstName} {student.lastName}</p>
                                {student.internalId && <p className="text-xs text-gray-400 mt-0.5">ID: {student.internalId}</p>}
                                
                                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                                  {student.tags?.map(t => (
                                     <span key={t.id} style={{ backgroundColor: getTagColor(t.color) }} className="text-white px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase flex items-center gap-1 shadow-sm">
                                       {t.name}
                                       <button 
                                         onClick={() => startTransition(async () => { await removeTagFromStudent(student.id, t.id); })}
                                         disabled={isPending}
                                         className="hover:scale-125 transition-transform ml-1 disabled:opacity-50"
                                         title="Tag entfernen"
                                       >&times;</button>
                                     </span>
                                  ))}
                                  {allTags && allTags.length > 0 && (
                                    <select 
                                      className="text-[10px] bg-gray-50 border border-gray-200 text-gray-500 rounded px-1 min-w-[60px] h-5 outline-none cursor-pointer"
                                      disabled={isPending}
                                      value="+"
                                      onChange={(e) => {
                                        if (e.target.value !== "+") {
                                          startTransition(async () => { await assignTagToStudent(student.id, e.target.value); });
                                        }
                                      }}
                                    >
                                      <option value="+" disabled>+ Tag</option>
                                      {allTags.filter(t => !student.tags?.some(st => st.id === t.id)).map(available => (
                                        <option key={available.id} value={available.id}>{available.name}</option>
                                      ))}
                                    </select>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => startEdit(student)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Bearbeiten">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                </button>
                                <button onClick={() => handleDelete(student.id, `${student.firstName} ${student.lastName}`)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Löschen">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {classes.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Keine Klassen gefunden</h3>
          <p className="text-gray-500">Es sind noch keine Klassen und Schüler im System angelegt.</p>
        </div>
      )}
    </div>
  );
}
