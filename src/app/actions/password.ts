"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function changePassword(currentPassword: string, newPassword: string) {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.id) {
    throw new Error("Nicht autorisiert");
  }

  if (newPassword.length < 6) {
    return { error: "Das neue Passwort muss mindestens 6 Zeichen lang sein." };
  }

  const userId = (session.user as any).id;
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user || !user.passwordHash) {
    return { error: "Benutzer nicht gefunden." };
  }

  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) {
    return { error: "Das aktuelle Passwort ist falsch." };
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash }
  });

  return { success: true };
}
