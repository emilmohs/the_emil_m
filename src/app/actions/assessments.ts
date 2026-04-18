"use server";

import { ensureTeacher } from "@/lib/security";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Server Action: Erstellt eine strukturierte Bewertung für ein Fach und Kriterium.
 */
export async function createAssessment(studentId: string, subject: string, criteria: string, value: string) {
  // 1. Auth & Role prüfen
  const session = await ensureTeacher();
  const teacherId = (session.user as any).id;

  if (!subject || !criteria || !value) {
    return { error: "Unvollständige Eingaben" };
  }

  // category wird kombiniert als "Fach: Kriterium" (z.B. "Deutsch: Lesen")
  const categoryStr = `${subject}: ${criteria}`;

  try {
    const assessment = await prisma.assessment.create({
      data: {
        studentId,
        teacherId,
        category: categoryStr,
        value,
      },
    });

    return { success: true, assessmentId: assessment.id };
  } catch (error) {
    console.error("Fehler beim Erstellen des Assessments:", error);
    return { error: "Serverfehler beim Speichern" };
  }
}

/**
 * Server Action: Auto-Save für eine Leistungsbewertung (1-10) plus optionale Förderung.
 */
export async function upsertAssessment(
  studentId: string, 
  categoryStr: string, 
  value: string, 
  intervention?: string | null,
  quarter: string = "Q2_2026"
) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user || !(session.user as any).id) {
    throw new Error("Nicht autorisiert");
  }

  const teacherId = (session.user as any).id;

  // Verify access via explicit permission or managed class
  const studentAccess = await prisma.student.findFirst({
    where: {
      id: studentId,
      OR: [
        { teacherAccess: { some: { teacherId } } },
        { schoolClass: { teachers: { some: { id: teacherId } } } }
      ]
    }
  });

  if (!studentAccess && (session.user as any).role !== "ADMIN") {
    throw new Error("Kein Zugriff auf diesen Schüler");
  }

  try {
    // Global synchronisieren über studentId & category & quarter
    const existing = await prisma.assessment.findFirst({
      where: {
        studentId,
        category: categoryStr,
        quarter
      }
    });

    // Wenn der Score >= 5 ist, MUSS die Intervention gelöscht (null) werden.
    const finalIntervention = Number(value) < 5 ? (intervention || null) : null;

    if (existing) {
      await prisma.assessment.update({
        where: { id: existing.id },
        data: { 
          value, 
          intervention: finalIntervention,
          teacherId // aktualisiere den Autor zum letzten Bearbeiter
        }
      });
    } else {
      await prisma.assessment.create({
        data: {
          studentId,
          teacherId,
          category: categoryStr,
          value,
          intervention: finalIntervention,
          quarter
        }
      });
    }
    return { success: true };
  } catch (error) {
    console.error("Fehler beim Auto-Save:", error);
    return { error: "Serverfehler beim Speichern" };
  }
}
