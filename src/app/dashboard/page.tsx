import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { decryptContent } from "@/lib/encryption";
import LogoutButton from "@/components/LogoutButton";
import ChangePasswordForm from "@/components/ChangePasswordForm";
import Link from "next/link";
import { getTagColor } from "@/lib/colors";

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
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <img 
            src="/novum/Logo_full_Novum.png" 
            alt="Novum Logo" 
            className="h-10 w-auto"
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

      <main className="max-w-7xl mx-auto p-6 lg:p-10">
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
            <div className="grid lg:grid-cols-2 gap-6">
              {students.map((student: any) => {
                const gradeLevel = student.classId ? student.classId.replace(/[^0-9]/g, '') : "1";
                const totalCriteria = criteriaCounts[gradeLevel] || 23;
                const percentage = Math.round((student.assessments?.length || 0) / totalCriteria * 100);

                console.log(`[Progress Debug] Student: ${student.firstName}, Grade: ${gradeLevel}, Ass: ${student.assessments?.length}, Total: ${totalCriteria}, %: ${percentage}`);

                return (
                  <div
                    key={student.id}
                    className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-xl transition-all relative block group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <Link href={`/dashboard/student/${student.id}`} className="block flex-1 cursor-pointer">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {student.firstName} {student.lastName}
                          </h3>
                          {student.tags?.map((t: any) => (
                             <span key={t.id} style={{ backgroundColor: getTagColor(t.color) }} className="text-white px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase flex items-center shadow-sm">
                               {t.name}
                             </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                            Klasse {student.classId || String.fromCharCode(8211)}
                          </span>
                          <span className="text-[10px] text-gray-400">ID: {student.internalId || String.fromCharCode(8211)}</span>
                        </div>
                        
                        <div className="mt-4">
                          <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">
                            <span>{currentQuarter.replace('_', ' ')} Dokumentation</span>
                            <span className={percentage === 100 ? "text-green-600" : "text-gray-500"}>
                              {percentage}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-1.5 rounded-full transition-all ${percentage === 100 ? 'bg-green-500' : 'bg-indigo-500'}`} 
                              style={{ width: `${Math.min(100, percentage)}%` }}
                            ></div>
                          </div>
                        </div>
                      </Link>
                      <div className="flex gap-2">
                        <a
                          href={`/api/students/${student.id}/export?format=json`}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="DSGVO-Export"
                        >
                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                        </a>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
