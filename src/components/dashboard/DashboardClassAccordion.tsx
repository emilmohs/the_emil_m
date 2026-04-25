"use client";

import { useState } from "react";
import Link from "next/link";
import { getTagColor } from "@/lib/colors";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  internalId: string | null;
  classId: string | null;
  tags?: any[];
  assessments?: any[];
}

interface ClassGroup {
  classId: string;
  students: Student[];
}

interface DashboardClassAccordionProps {
  groups: ClassGroup[];
  criteriaCounts: Record<string, number>;
  currentQuarter: string;
}

export default function DashboardClassAccordion({ groups, criteriaCounts, currentQuarter }: DashboardClassAccordionProps) {
  const [openClasses, setOpenClasses] = useState<Record<string, boolean>>({});

  const toggleClass = (classId: string) => {
    setOpenClasses(prev => ({
      ...prev,
      [classId]: !prev[classId]
    }));
  };

  return (
    <div className="space-y-4">
      {groups.map((group) => {
        const isOpen = openClasses[group.classId];
        
        return (
          <div key={group.classId} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm transition-all hover:border-blue-200">
            <div 
              onClick={() => toggleClass(group.classId)}
              className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl transition-all ${isOpen ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "bg-blue-50 text-blue-600"}`}>
                  {group.classId || "?"}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Klasse {group.classId || "Ohne Zuordnung"}</h3>
                  <p className="text-sm text-gray-500 font-medium">{group.students.length} Schüler/innen</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className={`text-gray-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"/></svg>
                </div>
              </div>
            </div>

            {/* Accordion Content */}
            <div 
              className={`transition-all duration-300 ease-in-out border-t border-gray-100 ${
                isOpen ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0 overflow-hidden border-transparent"
              }`}
            >
              <div className="p-4 sm:p-6 bg-gray-50/30">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {group.students.map((student) => {
                    const gradeLevel = student.classId ? student.classId.replace(/[^0-9]/g, '') : "1";
                    const totalCriteria = criteriaCounts[gradeLevel] || 23;
                    const percentage = Math.round((student.assessments?.length || 0) / totalCriteria * 100);

                    return (
                      <div
                        key={student.id}
                        className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-lg transition-all relative block group"
                      >
                        <div className="flex justify-between items-start">
                          <Link href={`/dashboard/student/${student.id}`} className="block flex-1 cursor-pointer">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                {student.firstName} {student.lastName}
                              </h3>
                              <div className="flex flex-wrap gap-1">
                                {student.tags?.map((t: any) => (
                                   <span key={t.id} style={{ backgroundColor: getTagColor(t.color) }} className="text-white px-2 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase shadow-sm">
                                     {t.name}
                                   </span>
                                ))}
                              </div>
                            </div>
                            <p className="text-[10px] text-gray-400 font-medium">ID: {student.internalId || String.fromCharCode(8211)}</p>
                            
                            <div className="mt-4">
                              <div className="flex justify-between items-center text-[9px] font-bold text-gray-400 mb-1 uppercase tracking-widest">
                                <span>{currentQuarter.replace('_', ' ')} Status</span>
                                <span className={percentage === 100 ? "text-green-600" : "text-gray-500"}>
                                  {percentage}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                <div 
                                  className={`h-1.5 rounded-full transition-all ${percentage === 100 ? 'bg-green-500' : 'bg-blue-600'}`} 
                                  style={{ width: `${Math.min(100, percentage)}%` }}
                                ></div>
                              </div>
                            </div>
                          </Link>
                          <a
                            href={`/api/students/${student.id}/export?format=json`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors ml-2"
                            title="DSGVO-Export"
                          >
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
