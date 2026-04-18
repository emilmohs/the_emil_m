"use server";

import { ensureAdmin } from "@/lib/security";
import prisma from "@/lib/prisma";
import { createUserSchema, CreateUserInput } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

/**
 * Server Action: Erstellt einen neuen Benutzer account (Lehrer oder Admin).
 * Passwort wird initial auf 'Start123!' gesetzt, sofern nicht anders angegeben.
 */
export async function createUser(input: CreateUserInput) {
  await ensureAdmin();

  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  const { name, email, role, managedClassIds } = parsed.data;

  try {
    // Prüfen ob Email schon existiert
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { error: "Ein Benutzer mit dieser E-Mail existiert bereits." };
    }

    const passwordHash = bcrypt.hashSync("Start123!", 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        role,
        passwordHash,
        managedClasses: {
          connect: managedClassIds?.map((id) => ({ id })) || [],
        },
      },
    });

    revalidatePath("/admin");
    return { success: true, userId: user.id };
  } catch (error) {
    console.error("Fehler beim Erstellen des Benutzers:", error);
    return { error: "Serverfehler beim Speichern des Benutzers" };
  }
}

/**
 * Server Action: Aktualisiert den Status eines Benutzers (Aktiv/Sperren).
 */
export async function toggleUserStatus(userId: string, active: boolean) {
  await ensureAdmin();

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: active },
    });
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return { error: "Fehler beim Aktualisieren des Status" };
  }
}

/**
 * Server Action: Setzt das Passwort eines Benutzers zurück.
 */
export async function resetUserPassword(userId: string) {
  await ensureAdmin();

  try {
    const passwordHash = bcrypt.hashSync("Start123!", 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
    return { success: true };
  } catch (error) {
    return { error: "Fehler beim Zurücksetzen des Passworts" };
  }
}

/**
 * Server Action: Aktualisiert die Klassen-Zuweisung eines Lehrers.
 */
export async function updateUserClasses(userId: string, classIds: string[]) {
  await ensureAdmin();

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        managedClasses: {
          set: classIds.map((id) => ({ id })),
        },
      },
    });
    revalidatePath("/admin");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Fehler beim Zuweisen der Klassen." };
  }
}

/**
 * Server Action: Holt alle Benutzer für die Admin-Tabelle.
 */
export async function getAllUsers() {
  await ensureAdmin();
  return await prisma.user.findMany({
    include: {
      managedClasses: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Server Action: Holt alle verfügbaren Klassen.
 */
export async function getAllClasses() {
  await ensureAdmin();
  return await prisma.schoolClass.findMany({
    orderBy: { id: "asc" },
  });
}

/**
 * Server Action: Erstellt eine neue Klasse (z.B. "3a").
 */
export async function createClass(classId: string) {
  await ensureAdmin();
  if (!classId) return { error: "Klassenname erforderlich" };

  try {
    await prisma.schoolClass.create({
      data: { id: classId },
    });
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return { error: "Klasse existiert bereits oder Fehler beim Speichern" };
  }
}
