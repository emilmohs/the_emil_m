"use server";

import { ensureAdmin } from "@/lib/security";
import { performBackup, getBackupFilesList, restoreFromSnapshot } from "@/lib/backups";
import { revalidatePath } from "next/cache";
import fs from "fs";
import path from "path";

/**
 * Retrieves the list of available backups.
 * Admin only.
 */
export async function getBackups() {
  await ensureAdmin();
  return getBackupFilesList();
}

/**
 * Manually triggers a new backup.
 * Admin only.
 */
export async function triggerBackup() {
  await ensureAdmin();
  const res = await performBackup();
  revalidatePath("/admin");
  return res;
}

/**
 * Restores the database from an existing snapshot.
 */
export async function restoreBackup(filename: string) {
  await ensureAdmin();
  const res = await restoreFromSnapshot(filename);
  if (res.success) {
    revalidatePath("/admin");
    revalidatePath("/dashboard");
  }
  return res;
}

/**
 * Handles an uploaded .db file and restores the database from it.
 */
export async function uploadBackup(formData: FormData) {
  await ensureAdmin();
  
  const file = formData.get("backupFile") as File;
  if (!file) return { error: "Keine Datei hochgeladen" };
  if (!file.name.endsWith(".db")) return { error: "Nur .db Dateien erlaubt" };

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Save to backups folder first
    const timestamp = Date.now();
    const filename = `uploaded_backup_${timestamp}.db`;
    const filePath = path.join(process.cwd(), "backups", filename);
    
    fs.writeFileSync(filePath, buffer);
    
    // Trigger restore
    const res = await restoreFromSnapshot(filename);
    if (res.success) {
      revalidatePath("/admin");
      revalidatePath("/dashboard");
    }
    return res;
  } catch (error) {
    console.error("Upload error:", error);
    return { error: "Fehler beim Hochladen oder Wiederherstellen" };
  }
}

/**
 * Deletes a specific backup file.
 */
export async function deleteBackup(filename: string) {
  await ensureAdmin();
  
  const safeName = path.basename(filename);
  const filePath = path.join(process.cwd(), "backups", safeName);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    revalidatePath("/admin");
    return { success: true };
  }

  return { error: "Datei nicht gefunden" };
}
