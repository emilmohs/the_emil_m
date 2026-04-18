"use server";

import prisma from "@/lib/prisma";
import { ensureAdmin } from "@/lib/security";
import { DEFAULT_COMPETENCES } from "@/lib/competences";
import type { CompetenceStructure } from "@/lib/competences";

/**
 * Loads the criteria for a given grade level.
 * Falls back to defaults if no custom criteria exist.
 */
export async function getGradeCriteria(gradeLevel: string): Promise<CompetenceStructure> {
  const record = await prisma.gradeCriteria.findUnique({
    where: { gradeLevel }
  });

  if (record) {
    try {
      return JSON.parse(record.jsonSchema) as CompetenceStructure;
    } catch {
      return DEFAULT_COMPETENCES;
    }
  }

  return DEFAULT_COMPETENCES;
}

/**
 * Saves custom criteria for a grade level. Admin only.
 */
export async function saveGradeCriteria(gradeLevel: string, criteria: CompetenceStructure) {
  await ensureAdmin();

  const jsonSchema = JSON.stringify(criteria);

  await prisma.gradeCriteria.upsert({
    where: { gradeLevel },
    update: { jsonSchema },
    create: { gradeLevel, jsonSchema }
  });

  return { success: true };
}

/**
 * Returns all grade criteria records for the admin overview
 */
export async function getAllGradeCriteria(): Promise<{ gradeLevel: string, criteria: CompetenceStructure }[]> {
  const records = await prisma.gradeCriteria.findMany({
    orderBy: { gradeLevel: "asc" }
  });

  return records.map((r: { gradeLevel: string; jsonSchema: string }) => ({
    gradeLevel: r.gradeLevel,
    criteria: JSON.parse(r.jsonSchema) as CompetenceStructure
  }));
}
