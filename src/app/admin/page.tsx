import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getAllUsers, getAllClasses } from "@/app/actions/user";
import UserManagement from "@/components/admin/UserManagement";
import StudentManagement from "@/components/admin/StudentManagement";
import TagManagement from "@/components/admin/TagManagement";
import CriteriaBuilder from "@/components/admin/CriteriaBuilder";
import AdminTabs from "@/components/admin/AdminTabs";
import { getAllStudentTags } from "@/app/actions/tags";
import { getAllGradeCriteria } from "@/app/actions/criteria";

import BackupManagement from "@/components/admin/BackupManagement";
import SystemSettings from "@/components/admin/SystemSettings";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any)?.role !== "ADMIN") {
    redirect("/dashboard?error=forbidden");
  }

  const activeTab = tab || "students";
  const [users, classes, tags, gradeCriteria] = await Promise.all([
    getAllUsers(),
    getAllClasses(),
    getAllStudentTags(),
    getAllGradeCriteria(),
  ]);

  return (
    <div className="min-h-screen bg-gray-50 text-black">
      {/* Modern Header */}
      <header className="bg-white px-4 py-4 md:px-8 md:py-6 shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center text-white font-bold text-lg md:text-xl shadow-lg shadow-blue-200 shrink-0">
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight leading-tight">Admin Zentrale</h1>
              <p className="text-[10px] md:text-sm font-medium text-gray-500 uppercase tracking-wide">Systemverwaltung</p>
            </div>
          </div>
          <a 
            href="/novum/dashboard"
            className="w-full sm:w-auto text-center px-5 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all"
          >
            Zurück zum Dashboard
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        <AdminTabs activeTab={activeTab} />

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === "teachers" && <UserManagement users={users} allClasses={classes} />}
          {activeTab === "students" && <StudentManagement allClasses={classes} allTags={tags} />}
          {activeTab === "criteria" && <CriteriaBuilder initialCriteria={gradeCriteria} />}
          {activeTab === "tags" && <TagManagement tags={tags} />}
          {activeTab === "backups" && <BackupManagement />}
          {activeTab === "system" && <SystemSettings />}
        </div>
      </main>
    </div>
  );
}
