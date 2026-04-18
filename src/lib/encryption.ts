import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

function getKeyBuffer(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error("ENCRYPTION_KEY ist nicht in .env gesetzt!");
  }
  return Buffer.from(key, "hex");
}

/**
 * Verschlüsselt einen Klartext-String mit AES-256-GCM.
 * Gibt einen Base64-kodierten String zurück: iv:authTag:ciphertext
 */
export function encryptContent(plaintext: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, getKeyBuffer(), iv);

  let encrypted = cipher.update(plaintext, "utf8", "base64");
  encrypted += cipher.final("base64");

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:ciphertext (alle Base64)
  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    encrypted,
  ].join(":");
}

/**
 * Entschlüsselt einen AES-256-GCM verschlüsselten String.
 */
export function decryptContent(encryptedData: string): string {
  const [ivB64, authTagB64, ciphertext] = encryptedData.split(":");

  if (!ivB64 || !authTagB64 || !ciphertext) {
    throw new Error("Ungültiges verschlüsseltes Datenformat");
  }

  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const decipher = crypto.createDecipheriv(ALGORITHM, getKeyBuffer(), iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, "base64", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
