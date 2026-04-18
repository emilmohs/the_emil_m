import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import fs from "fs";
import path from "path";

/**
 * API Route: /api/admin/backups/[filename]
 * Serves a backup file for download.
 * Admin only.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return new NextResponse("Nicht autorisiert", { status: 401 });
  }

  const { filename } = await params;
  const safeName = path.basename(filename);
  const filePath = path.join(process.cwd(), "backups", safeName);

  if (!fs.existsSync(filePath)) {
    return new NextResponse("Datei nicht gefunden", { status: 404 });
  }

  const fileBuffer = fs.readFileSync(filePath);

  return new NextResponse(fileBuffer, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${safeName}"`,
    },
  });
}
