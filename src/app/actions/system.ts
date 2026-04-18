"use server";

import prisma from "@/lib/prisma";
import { ensureAdmin } from "@/lib/security";
import { revalidatePath } from "next/cache";

/**
 * Ensures the initial configuration exists in the database.
 */
async function ensureInitialConfig() {
  try {
    // @ts-ignore
    const current = await prisma.systemSetting.findUnique({
      where: { key: "current_quarter" }
    });

    if (!current) {
      // @ts-ignore
      await prisma.systemSetting.create({
        data: { key: "current_quarter", value: "Q2_2026" }
      });
    }

    // @ts-ignore
    const q2 = await prisma.quarter.findUnique({
      where: { id: "Q2_2026" }
    });

    if (!q2) {
      // @ts-ignore
      await prisma.quarter.create({
        data: { id: "Q2_2026", name: "Q1 2026", isDefault: true }
      });
    }
  } catch (err) {
    console.error("[Prisma Error] Failed to ensure initial config:", err);
  }
}

/**
 * Gets the current active quarter ID.
 */
export async function getCurrentQuarter() {
  await ensureInitialConfig();
  try {
    // @ts-ignore - Ignore stale IDE lint for new Prisma model
    const setting = await prisma.systemSetting.findUnique({
      where: { key: "current_quarter" }
    });
    return setting?.value || "Q2_2026";
  } catch {
    return "Q2_2026";
  }
}

/**
 * Gets all defined quarters.
 */
export async function getQuarters() {
  // @ts-ignore
  return await prisma.quarter.findMany({
    orderBy: { createdAt: "desc" }
  });
}

/**
 * Adds a new quarter to the system.
 */
export async function addQuarter(id: string, name: string) {
  await ensureAdmin();
  try {
    // @ts-ignore
    const q = await prisma.quarter.create({
      data: { id, name }
    });
    revalidatePath("/admin");
    return { success: true, quarter: q };
  } catch (error) {
    console.error("Error adding quarter:", error);
    return { success: false, error: "Fehler beim Erstellen des Quartals." };
  }
}

/**
 * Updates the global active quarter.
 */
export async function setActiveQuarter(quarterId: string) {
  await ensureAdmin();
  try {
    // @ts-ignore
    await prisma.systemSetting.upsert({
      where: { key: "current_quarter" },
      update: { value: quarterId },
      create: { key: "current_quarter", value: quarterId }
    });
    
    // Also revalidate everything that depends on the current quarter
    revalidatePath("/dashboard", "layout");
    revalidatePath("/admin", "layout");
    
    return { success: true };
  } catch (error) {
    console.error("Error setting active quarter:", error);
    return { success: false, error: "Fehler beim Setzen des aktiven Quartals." };
  }
}
