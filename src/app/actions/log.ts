"use server";

import { ensureTeacher } from "@/lib/security";
import prisma from "@/lib/prisma";
import { createLogSchema, CreateLogInput } from "@/lib/validations";
import { encryptContent } from "@/lib/encryption";

/**
 * Prüft ob der Lehrer Zugriff auf einen bestimmten Schüler hat.
 * Application-Level Row-Level-Security.
 */
async function checkTeacherAccess(teacherId: string, studentId: string): Promise<boolean> {
  const access = await prisma.teacherStudentAccess.findUnique({
    where: {
      teacherId_studentId: { teacherId, studentId },
    },
  });
  return !!access;
}

/**
 * Server Action: Erstellt einen neuen, verschlüsselten Lernlog-Eintrag
 * mit Audit-Trail und RLS-Check.
 */
export async function createLogEntry(input: CreateLogInput) {
  // 1. Auth & Role prüfen
  const session = await ensureTeacher();
  const teacherId = (session.user as any).id;

  // 2. Validierung (Zod)
  const parsed = createLogSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues.map((e) => e.message).join(", ") };
  }

  // 3. RLS-Check: Hat der Lehrer Zugriff auf diesen Schüler?
  // Admins dürfen alles
  const isAdmin = (session.user as any).role === "ADMIN";
  if (!isAdmin) {
    const hasAccess = await checkTeacherAccess(teacherId, parsed.data.studentId);
    if (!hasAccess) {
      return { error: "Kein Zugriff auf diesen Schüler" };
    }
  }

  // 4. Content verschlüsseln
  const encryptedContent = encryptContent(parsed.data.content);

  // 5. Log + Audit in einer Transaction speichern
  try {
    const result = await prisma.$transaction(async (tx) => {
      const log = await tx.learningLog.create({
        data: {
          studentId: parsed.data.studentId,
          teacherId: teacherId,
          content: encryptedContent,
          category: parsed.data.category,
        },
      });

      await tx.logAudit.create({
        data: {
          logId: log.id,
          teacherId: teacherId,
          action: "CREATE",
          newContent: encryptedContent,
        },
      });

      return log;
    });

    return { success: true, logId: result.id };
  } catch (error) {
    console.error("Fehler beim Erstellen des Log-Eintrags:", error);
    return { error: "Serverfehler beim Speichern" };
  }
}
