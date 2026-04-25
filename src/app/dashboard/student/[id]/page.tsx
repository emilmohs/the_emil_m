import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import CompetenceAccordion from "./CompetenceAccordion";
import PrintExport from "./PrintExport";
import { getGradeCriteria } from "@/app/actions/criteria";
import { getTagColor } from "@/lib/colors";

// Disable caching for this sensitive page
export const dynamic = "force-dynamic";

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/auth/signin");
  }

  const { id } = await params;
  const userId = (session.user as any)?.id;
  const isAdmin = (session.user as any)?.role === "ADMIN";

  // Check access control
  let hasAccess = isAdmin;
  if (!hasAccess) {
    const userWithClasses = await prisma.user.findUnique({
      where: { id: userId },
      include: { managedClasses: true },
    });
    const managedClassIds = userWithClasses?.managedClasses.map(c => c.id) || [];
    const directAccess = await prisma.teacherStudentAccess.findUnique({
      where: { teacherId_studentId: { teacherId: userId, studentId: id } }
    });

    const studentBase = await prisma.student.findUnique({ where: { id } });
    if (studentBase && managedClassIds.includes(studentBase.classId || "")) {
      hasAccess = true;
    } else if (directAccess) {
      hasAccess = true;
    }
  }

  if (!hasAccess) {
    notFound(); // Oder redirect zu einer forbidden Seite
  }

  // Lade den kompletten Schüler
  const student = await prisma.student.findUnique({
    where: { id: id },
    include: {
      tags: true,
      schoolClass: true,
      learningLogs: {
        orderBy: { createdAt: "desc" }
      },
      assessments: {
        orderBy: { createdAt: "desc" }
      },
      notes: {
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!student) {
    notFound();
  }

  // Bestimme die ID des "Nächsten Schülers" anhand der Klasse
  let nextStudentId: string | null = null;
  if (student.classId) {
    const classmates = await prisma.student.findMany({
      where: { classId: student.classId },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      select: { id: true }
    });
    const currentIndex = classmates.findIndex(s => s.id === student.id);
    if (currentIndex !== -1 && currentIndex < classmates.length - 1) {
      nextStudentId = classmates[currentIndex + 1].id;
    }
  }

  // Dynamische Kriterien laden basierend auf Klassenstufe
  const gradeLevel = student.classId ? student.classId.replace(/[^0-9]/g, '') : "1";
  const competences = await getGradeCriteria(gradeLevel || "1");

  // Aktuelles Quartal und alle Quartale laden
  const { getCurrentQuarter, getQuarters } = await import("@/app/actions/system");
  const currentQuarter = await getCurrentQuarter();
  const allQuarters = await getQuarters();

  return (
    <div className="min-h-screen bg-gray-50 text-slate-800">
      {/* Header Snippet */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4 flex justify-between items-center shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors">
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Schülerakte: {student.firstName}</h1>
            <p className="text-xs text-gray-500 uppercase font-semibold">Dokumentations-Hub</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 sm:p-6 md:p-10">
        
        {/* Detail Card */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-5 md:p-8 mb-8 flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-2">
              {student.firstName} {student.lastName}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wider">
                Klasse {student.classId || "–"}
              </span>
              {student.birthYear && (
                <span className="bg-gray-100 text-gray-600 font-semibold px-3 py-1 rounded-full text-xs">
                  Jahrgang {student.birthYear}
                </span>
              )}
              {student.internalId && (
                <span className="bg-gray-100 text-gray-600 font-semibold px-3 py-1 rounded-full text-xs">
                  ID: {student.internalId}
                </span>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2">
              {student.tags.map(tag => (
                <span key={tag.id} style={{ backgroundColor: getTagColor(tag.color) }} className="text-white px-2 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase shadow-sm">
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8 md:space-y-12 max-w-4xl mx-auto">
          <PrintExport 
            student={{ id: student.id, firstName: student.firstName, lastName: student.lastName, classId: student.classId }} 
            teacherName={(session.user as any)?.name || "Unbekannt"} 
            assessments={student.assessments} 
            availableQuarters={allQuarters.map((q: any) => q.id)}
          />

          <CompetenceAccordion 
            studentId={student.id} 
            nextStudentId={nextStudentId} 
            initialAssessments={student.assessments}
            competences={competences}
            defaultQuarter={currentQuarter}
            availableQuarters={allQuarters.map((q: any) => q.id)}
          />
        </div>
      </main>
    </div>
  );
}
