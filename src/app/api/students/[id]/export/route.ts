import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { decryptContent } from "@/lib/encryption";

/**
 * GET /api/students/[id]/export
 * Exportiert alle Daten eines Schülers (Art. 20 DSGVO - Recht auf Datenübertragbarkeit).
 * Unterstützt ?format=csv oder ?format=json (Standard).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Auth prüfen
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  const teacherId = (session!.user as any).id;
  const isAdmin = (session!.user as any).role === "ADMIN";
  const { id: studentId } = await params;

  // 2. RLS: Zugriffsberechtigung prüfen
  if (!isAdmin) {
    const access = await prisma.teacherStudentAccess.findUnique({
      where: { teacherId_studentId: { teacherId, studentId } },
    });
    if (!access) {
      return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });
    }
  }

  // 3. Schülerdaten + Logs laden
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      learningLogs: {
        include: { audits: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!student) {
    return NextResponse.json({ error: "Schüler nicht gefunden" }, { status: 404 });
  }

  // 4. Logs entschlüsseln
  const exportData = {
    student: {
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      internalId: student.internalId,
      classId: student.classId,
      birthYear: student.birthYear,
      status: student.status,
      createdAt: student.createdAt,
    },
    learningLogs: student.learningLogs.map((log) => {
      let decryptedContent = "[Entschlüsselung fehlgeschlagen]";
      try {
        decryptedContent = decryptContent(log.content);
      } catch (e) {
        // Fehler beim Entschlüsseln → Fallback
      }
      return {
        id: log.id,
        category: log.category,
        content: decryptedContent,
        createdAt: log.createdAt,
        updatedAt: log.updatedAt,
        auditHistory: log.audits.map((a) => ({
          action: a.action,
          teacherId: a.teacherId,
          timestamp: a.timestamp,
        })),
      };
    }),
    exportedAt: new Date().toISOString(),
    exportedBy: session!.user!.email,
  };

  // 5. Format bestimmen
  const format = req.nextUrl.searchParams.get("format") || "json";

  if (format === "csv") {
    // CSV-Export
    const csvHeader = "LogId,Kategorie,Inhalt,Erstellt,Aktualisiert\n";
    const csvRows = exportData.learningLogs
      .map((log) =>
        [
          log.id,
          log.category || "",
          `"${log.content.replace(/"/g, '""')}"`,
          log.createdAt,
          log.updatedAt,
        ].join(",")
      )
      .join("\n");

    const csvContent = `Schüler: ${student.firstName} ${student.lastName} (${student.internalId || "N/A"})\nKlasse: ${student.classId || "N/A"}\nExport: ${exportData.exportedAt}\n\n${csvHeader}${csvRows}`;

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="schueler_${studentId}_export.csv"`,
      },
    });
  }

  // JSON (Standard)
  return NextResponse.json(exportData, {
    headers: {
      "Content-Disposition": `attachment; filename="schueler_${studentId}_export.json"`,
    },
  });
}
