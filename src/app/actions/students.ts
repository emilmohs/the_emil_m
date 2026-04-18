"use server";

import { ensureAdmin, ensureTeacher } from "@/lib/security";
import prisma from "@/lib/prisma";
import { createStudentSchema, CreateStudentInput } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Server Action: Erstellt einen neuen Schüler.
 * Nur für ADMINs erlaubt.
 */
export async function createStudent(input: CreateStudentInput) {
  await ensureAdmin();

  const parsed = createStudentSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  try {
    // Auto-generate internalId if not provided
    let internalId = parsed.data.internalId;
    if (!internalId) {
      const count = await prisma.student.count();
      const year = new Date().getFullYear();
      internalId = `SCH-${year}-${String(count + 1).padStart(3, '0')}`;
    }

    const student = await prisma.student.create({
      data: { ...parsed.data, internalId },
    });

    revalidatePath("/dashboard");
    revalidatePath("/admin");
    return { success: true, studentId: student.id };
  } catch (error) {
    console.error("Fehler beim Erstellen des Schülers:", error);
    return { error: "Serverfehler beim Speichern" };
  }
}

/**
 * Server Action: Aktualisiert einen bestehenden Schüler.
 * Nur für ADMINs erlaubt.
 */
export async function updateStudent(studentId: string, data: {
  firstName?: string;
  lastName?: string;
  classId?: string | null;
  birthYear?: number | null;
  status?: string | null;
}) {
  await ensureAdmin();

  try {
    await prisma.student.update({
      where: { id: studentId },
      data,
    });

    revalidatePath("/dashboard");
    revalidatePath("/admin");
    revalidatePath(`/dashboard/student/${studentId}`);
    return { success: true };
  } catch (error) {
    console.error("Fehler beim Aktualisieren des Schülers:", error);
    return { error: "Serverfehler beim Aktualisieren" };
  }
}

/**
 * Server Action: Löscht einen Schüler.
 * Nur für ADMINs erlaubt.
 */
export async function deleteStudent(studentId: string) {
  await ensureAdmin();

  try {
    await prisma.student.delete({
      where: { id: studentId },
    });

    revalidatePath("/dashboard");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Fehler beim Löschen des Schülers:", error);
    return { error: "Serverfehler beim Löschen" };
  }
}

/**
 * Server Action: Klassen-Versetzung (Bulk-Update).
 * Versetzt ausgewählte Schüler einer Klasse in eine neue Klasse.
 */
export async function promoteStudents(studentIds: string[], targetClassId: string) {
  await ensureAdmin();

  if (!studentIds || studentIds.length === 0) {
    return { error: "Keine Schüler ausgewählt" };
  }

  if (!targetClassId) {
    return { error: "Zielklasse ist erforderlich" };
  }

  try {
    await prisma.student.updateMany({
      where: {
        id: { in: studentIds },
      },
      data: {
        classId: targetClassId,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/admin");
    revalidatePath("/admin/promotion");
    
    return { success: true, count: studentIds.length };
  } catch (error) {
    console.error("Fehler bei der Klassenversetzung:", error);
    return { error: "Serverfehler bei der Versetzung" };
  }
}

/**
 * Hilfsfunktion: Liste aller Klassen abrufen (für den Promotion-Filter).
 */
export async function getActiveClasses() {
  await ensureAdmin();
  const classes = await prisma.schoolClass.findMany({
    select: { id: true },
    orderBy: { id: "asc" },
  });
  return classes.map((c) => c.id);
}

/**
 * Hilfsfunktion: Schüler einer Klasse abrufen.
 */
export async function getStudentsByClass(classId: string) {
  await ensureAdmin();
  return await prisma.student.findMany({
    where: { classId },
    orderBy: { lastName: "asc" },
    include: { tags: true }
  });
}

/**
 * Server Action: Bewertungsraster speichern
 */
export async function createAssessment(studentId: string, category: string, value: string) {
  const session = await ensureTeacher();
  const teacherId = (session.user as any).id;

  try {
    await prisma.assessment.create({
      data: { studentId, teacherId, category, value }
    });
    revalidatePath(`/dashboard/student/${studentId}`);
    return { success: true };
  } catch(e) {
    return { error: "Fehler beim Speichern der Bewertung" };
  }
}

/**
 * Server Action: Freien Fließtext als Note speichern
 */
export async function createNote(studentId: string, content: string) {
  const session = await ensureTeacher();
  const teacherId = (session.user as any).id;

  try {
    await prisma.note.create({
      data: { studentId, teacherId, content }
    });
    revalidatePath(`/dashboard/student/${studentId}`);
    return { success: true };
  } catch(e) {
    return { error: "Fehler beim Speichern der Notiz" };
  }
}
