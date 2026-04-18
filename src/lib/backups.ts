import fs from "fs";
import path from "path";
import cron from "node-cron";

const BACKUP_DIR = path.join(process.cwd(), "backups");
const DB_PATH = path.join(process.cwd(), "prisma", "dev.db");
const MAX_BACKUPS = 10;

/**
 * Creates a backup of the SQLite database.
 */
export async function performBackup() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupName = `db_backup_${timestamp}.db`;
  const backupPath = path.join(BACKUP_DIR, backupName);

  try {
    // For SQLite, it's generally safe to copy the file if no writes are happening.
    // In a more active system, we might want to use SQLite's own backup API or a WAL checkpoint.
    fs.copyFileSync(DB_PATH, backupPath);
    console.log(`[Backup] Created: ${backupName}`);
    
    cleanupOldBackups();
    return { success: true, filename: backupName };
  } catch (error) {
    console.error("[Backup] Error creating backup:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Restores the database from a given snapshot file.
 */
export async function restoreFromSnapshot(filename: string) {
  const safeName = path.basename(filename);
  const backupPath = path.join(BACKUP_DIR, safeName);

  if (!fs.existsSync(backupPath)) {
    return { success: false, error: "Backup-Datei nicht gefunden." };
  }

  try {
    // Create a temporary "pre-restore" backup just in case
    const preRestoreName = `pre_restore_safety_${Date.now()}.db`;
    fs.copyFileSync(DB_PATH, path.join(BACKUP_DIR, preRestoreName));

    // Overwrite the main database
    fs.copyFileSync(backupPath, DB_PATH);
    console.log(`[Backup] Restored database from: ${safeName}`);
    
    return { success: true };
  } catch (error) {
    console.error("[Backup] Error during restoration:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Keeps only the latest 10 backups.
 */
export function cleanupOldBackups() {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith("db_backup_") && f.endsWith(".db"))
      .map(f => ({
        name: f,
        time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time); // Newest first

    if (files.length > MAX_BACKUPS) {
      const toDelete = files.slice(MAX_BACKUPS);
      toDelete.forEach(f => {
        fs.unlinkSync(path.join(BACKUP_DIR, f.name));
        console.log(`[Backup] Deleted old backup: ${f.name}`);
      });
    }
  } catch (error) {
    console.error("[Backup] Error cleaning up old backups:", error);
  }
}

/**
 * Lists all available backup files.
 */
export function getBackupFilesList() {
  if (!fs.existsSync(BACKUP_DIR)) return [];
  
  return fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith("db_backup_") && f.endsWith(".db"))
    .map(f => {
      const stats = fs.statSync(path.join(BACKUP_DIR, f));
      return {
        name: f,
        size: stats.size,
        createdAt: stats.mtime
      };
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * Initializes the automated backup scheduler (3 AM daily).
 */
let isSchedulerInitialized = false;

export function initBackupScheduler() {
  if (isSchedulerInitialized) return;
  
  console.log("[Backup] Initializing scheduler (daily at 03:00)...");
  
  // Schedule: 0 3 * * * (Minutes, Hours, DayOfMonth, Month, DayOfWeek)
  cron.schedule("0 3 * * *", () => {
    console.log("[Backup] Starting scheduled nightly backup...");
    performBackup();
  });

  isSchedulerInitialized = true;
}
