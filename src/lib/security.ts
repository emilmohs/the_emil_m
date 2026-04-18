import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

export async function getSession() {
  return await getServerSession(authOptions);
}

export async function ensureAuthenticated() {
  const session = await getSession();
  if (!session || !session.user) {
    throw new Error("Nicht authentifiziert");
  }
  return session;
}

export async function ensureAdmin() {
  const session = await ensureAuthenticated();
  const role = (session.user as any).role;
  if (role !== "ADMIN") {
    throw new Error("Nicht autorisiert: Admin-Rechte erforderlich");
  }
  return session;
}

export async function ensureTeacher() {
  const session = await ensureAuthenticated();
  const role = (session.user as any).role;
  if (role !== "TEACHER" && role !== "ADMIN") {
    throw new Error("Nicht autorisiert: Lehrkraft-Rechte erforderlich");
  }
  return session;
}
