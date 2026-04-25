import { z } from "zod";

// Muster für sensible Daten, die nicht in Textfeldern auftauchen sollten
const SENSITIVE_PATTERNS = [
  /\b\d{2,4}[-/.]\d{2}[-/.]\d{2,4}\b/,       // Volles Geburtsdatum (dd.mm.yyyy etc.)
  /\b\d{3,4}\s?\d{4}\s?\d{4}\b/,               // Sozialversicherungsnummer
  /\b[A-Z]{2}\d{2}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{2}\b/, // IBAN
  /\b\d{5,}\b/,                                  // Lange Nummernfolgen (IDs, Kontonummern)
];

/**
 * Zod-Schema für das Erstellen eines neuen LearningLog Eintrags.
 */
export const createLogSchema = z.object({
  studentId: z
    .string()
    .min(1, "Student-ID ist erforderlich"),

  content: z
    .string()
    .min(5, "Der Inhalt muss mindestens 5 Zeichen lang sein")
    .max(10000, "Der Inhalt darf maximal 10.000 Zeichen lang sein")
    .refine(
      (val) => !SENSITIVE_PATTERNS.some((pattern) => pattern.test(val)),
      {
        message:
          "Der Text scheint sensible persönliche Daten zu enthalten (z.B. vollständiges Geburtsdatum, Sozialversicherungsnummer oder Kontonummer). Bitte entfernen Sie diese Informationen.",
      }
    ),

  category: z.enum([
    "Sozialverhalten",
    "Mathematik",
    "Deutsch",
    "Sachunterricht",
    "Motorik",
    "Sprache",
    "Arbeitsverhalten",
    "Sonstiges",
  ]),
});

/**
 * Zod-Schema für das Erstellen eines neuen Schülers.
 */
export const createStudentSchema = z.object({
  firstName: z.string().min(1, "Vorname ist erforderlich").max(100),
  lastName: z.string().min(1, "Nachname ist erforderlich").max(100),
  internalId: z.string().optional(),
  classId: z.string().optional(),
  birthYear: z.number().int().min(2000).max(2030).optional(),
  status: z.string().optional(),
});

export type CreateLogInput = z.infer<typeof createLogSchema>;
export type CreateStudentInput = z.infer<typeof createStudentSchema>;

export const createUserSchema = z.object({
  name: z.string().min(2, "Name muss mindestens 2 Zeichen lang sein"),
  username: z.string().min(3, "Benutzername muss mindestens 3 Zeichen lang sein"),
  email: z.string().email("Ungültige E-Mail-Adresse").optional(),
  role: z.enum(["ADMIN", "TEACHER"]),
  managedClassIds: z.array(z.string()).optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
