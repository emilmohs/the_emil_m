import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { decryptContent } from "@/lib/encryption";
import LogoutButton from "@/components/LogoutButton";
import ChangePasswordForm from "@/components/ChangePasswordForm";
import Link from "next/link";
import { getTagColor } from "@/lib/colors";
import DashboardClassAccordion from "@/components/dashboard/DashboardClassAccordion";

export default async function DashboardPage() {
  // SERVER-SIDE DOUBLE-LOCK: Sofortige Prüfung der Session
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/auth/signin");
  }

  const role = (session.user as any)?.role;
  const userId = (session.user as any)?.id;

  const isAdmin = role === "ADMIN";

  // Aktuelles Quartal laden
  const { getCurrentQuarter } = await import("@/app/actions/system");
  const currentQuarter = await getCurrentQuarter();

  // Schüler laden
  let students: any[] = [];
  if (isAdmin) {
    // Admins sehen alle Schüler
    students = await prisma.student.findMany({
      include: {
        learningLogs: { orderBy: { createdAt: "desc" }, take: 3 },
        teacherAccess: { include: { teacher: true } },
        tags: true,
        assessments: { where: { quarter: currentQuarter } },
      },
    });
  } else {
    // NEU: Lehrer sehen nur Schüler ihrer zugewiesenen Klassen
    // UND Schüler, auf die sie individuellen Zugriff haben
    const userWithClasses = await prisma.user.findUnique({
      where: { id: userId },
      include: { managedClasses: true },
    });

    // Validierung und Typ-Sicherheit
    const managedClassIds: string[] = Array.isArray(userWithClasses?.managedClasses)
      ? userWithClasses.managedClasses
          .map((c) => c.id)
          .filter((id): id is string => typeof id === "string" && id.trim() !== "")
      : [];

    const orConditions: any[] = [
      { teacherAccess: { some: { teacherId: userId } } }
    ];

    if (managedClassIds.length > 0) {
      orConditions.push({ classId: { in: managedClassIds } });
    }

    students = await prisma.student.findMany({
      where: {
        OR: orConditions
      },
      include: {
        schoolClass: true,
        learningLogs: {
          where: { teacherId: userId },
          orderBy: { createdAt: "desc" },
          take: 3,
        },
        tags: true,
        assessments: { where: { quarter: currentQuarter } },
      },
    });
  }
  console.log("Students (before return):", students); // Added   // Lade alle Kriterien-Konfigurationen, um Vollständigkeit zu berechnen
  const allCriteria = await prisma.gradeCriteria.findMany();
  const criteriaCounts: Record<string, number> = {};
  
  console.log(`[Progress Debug] Found ${allCriteria.length} criteria entries in DB.`);

  allCriteria.forEach(c => {
    try {
      const data = JSON.parse(c.jsonSchema);
      let count = 0;
      Object.values(data).forEach((cats: any) => {
        Object.values(cats).forEach((items: any) => {
          count += items.length;
        });
      });
      criteriaCounts[c.gradeLevel] = count;
      console.log(`[Progress Debug] Grade ${c.gradeLevel}: ${count} criteria`);
    } catch (e) {
      console.error("Error parsing criteria count:", e);
    }
  });

  console.log(`[Progress Debug] criteriaCounts Map:`, criteriaCounts);

  return (
    <div className="min-h-screen bg-gray-50 text-black">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <img 
            src="/novum/Logo_full_Novum.png" 
            alt="Novum Logo" 
            className="h-8 sm:h-10 w-auto"
          />
          <div className="hidden sm:block h-6 w-px bg-gray-200 mx-1" />
          <div className="hidden sm:block">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Novum</h1>
            <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">
              {isAdmin ? "Admin-Konsole" : "Lehrer-Dashboard"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          {isAdmin && (
            <Link 
              href="/admin"
              className="px-4 py-2 text-sm font-bold text-blue-700 bg-blue-50 border border-blue-100 hover:bg-blue-100 rounded-xl transition-all shadow-sm"
            >
              Admin-Bereich
            </Link>
          )}
          <div className="text-right hidden md:block">
            <p className="text-sm font-medium text-gray-900">{session.user?.name || session.user?.email}</p>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
              isAdmin ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
            }`}>
              {role}
            </span>
          </div>
          <ChangePasswordForm />
          <LogoutButton />
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-10">
        {/* Admin Quick Actions Area */}
        {isAdmin && (
          <section className="mb-10">
            <h2 className="text-sm font-bold text-gray-400 uppercase mb-4 tracking-widest">Admin Werkzeuge</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <Link 
                href="/admin?tab=teachers"
                className="p-6 bg-white border border-gray-200 rounded-2xl hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/5 transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 -mr-8 -mt-8 rounded-full group-hover:bg-blue-100 transition-colors" />
                <h3 className="text-lg font-bold text-gray-900 mb-1 relative underline decoration-blue-500/30 group-hover:decoration-blue-500">Benutzerverwaltung</h3>
                <p className="text-sm text-gray-500 relative">Lehrkräfte, Accounts & Rollen verwalten.</p>
              </Link>
              
              <Link 
                href="/admin?tab=students"
                className="p-6 bg-white border border-gray-200 rounded-2xl hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/5 transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 -mr-8 -mt-8 rounded-full group-hover:bg-blue-100 transition-colors" />
                <h3 className="text-lg font-bold text-gray-900 mb-1 relative underline decoration-blue-500/30 group-hover:decoration-blue-500">Schülerverwaltung</h3>
                <p className="text-sm text-gray-500 relative">Klassen einteilen & Profile registrieren.</p>
              </Link>

               <Link 
                href="/admin?tab=criteria"
                className="p-6 bg-white border border-gray-200 rounded-2xl hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/5 transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 -mr-8 -mt-8 rounded-full group-hover:bg-blue-100 transition-colors" />
                <h3 className="text-lg font-bold text-gray-900 mb-1 relative underline decoration-blue-500/30 group-hover:decoration-blue-500">Bewertungskriterien</h3>
                <p className="text-sm text-gray-500 relative">Novum-Kompetenzen pro Klassenstufe anpassen.</p>
              </Link>
            </div>
          </section>
        )}

        {/* Dynamic Board Content */}
        <section>
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-2xl font-black text-gray-900">
                {isAdmin ? "Alle Schüler" : "Meine Schüler"}
              </h2>
              <p className="text-gray-500">Gesamtanzahl: {students.length}</p>
            </div>
          </div>

          {students.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-20 text-center">
              <p className="text-gray-400 font-medium">Keine Schülerprofile gefunden.</p>
            </div>
          ) : (
            <DashboardClassAccordion 
              groups={Object.entries(
                students.reduce((acc: Record<string, any[]>, student: any) => {
                  const cid = student.classId || "Ohne Klasse";
                  if (!acc[cid]) acc[cid] = [];
                  acc[cid].push(student);
                  return acc;
                }, {} as Record<string, any[]>)
              )
              .map(([classId, classStudents]: [string, any[]]) => ({
                classId: classId === "Ohne Klasse" ? "" : classId,
                students: classStudents.sort((a: any, b: any) => {
                  const lastCmp = a.lastName.localeCompare(b.lastName);
                  return lastCmp !== 0 ? lastCmp : a.firstName.localeCompare(b.firstName);
                })
              }))
              .sort((a, b) => a.classId.localeCompare(b.classId, undefined, { numeric: true, sensitivity: 'base' }))} 
              criteriaCounts={criteriaCounts}
              currentQuarter={currentQuarter}
            />
          )}
        </section>
      </main>
    </div>
  );
}
