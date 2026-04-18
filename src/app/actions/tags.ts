"use server";

import { ensureAdmin } from "@/lib/security";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createStudentTag(name: string, color: string) {
  await ensureAdmin();

  if (!name) return { error: "Name ist erforderlich" };

  try {
    const existing = await prisma.studentTag.findUnique({ where: { name } });
    if (existing) return { error: "Tag existiert bereits" };

    const tag = await prisma.studentTag.create({
      data: { name, color },
    });
    revalidatePath("/admin");
    return { success: true, tag };
  } catch(e) {
    return { error: "Serverfehler beim Erstellen des Tags" };
  }
}

export async function deleteStudentTag(tagId: string) {
  await ensureAdmin();

  try {
    await prisma.studentTag.delete({ where: { id: tagId } });
    revalidatePath("/admin");
    revalidatePath("/dashboard");
    return { success: true };
  } catch(e) {
    return { error: "Fehler beim Löschen des Tags" };
  }
}

export async function getAllStudentTags() {
  await ensureAdmin();
  return await prisma.studentTag.findMany({ orderBy: { name: "asc" } });
}

export async function assignTagToStudent(studentId: string, tagId: string) {
  await ensureAdmin();
  try {
    await prisma.student.update({
      where: { id: studentId },
      data: {
        tags: { connect: { id: tagId } }
      }
    });
    revalidatePath("/admin");
    revalidatePath("/dashboard");
    return { success: true };
  } catch(e) {
    return { error: "Fehler bei der Zuweisung" };
  }
}

export async function removeTagFromStudent(studentId: string, tagId: string) {
  await ensureAdmin();
  try {
    await prisma.student.update({
      where: { id: studentId },
      data: {
        tags: { disconnect: { id: tagId } }
      }
    });
    revalidatePath("/admin");
    revalidatePath("/dashboard");
    return { success: true };
  } catch(e) {
    return { error: "Fehler beim Entfernen" };
  }
}
