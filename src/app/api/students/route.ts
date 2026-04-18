import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * GET /api/students
 * Gibt Schülerdaten nur für authentifizierte und autorisierte Nutzer zurück.
 * Admins sehen alle Schüler, Lehrer nur ihre zugewiesenen.
 */
export async function GET() {
  // 1. Session prüfen (Double-Lock: Middleware + Server-Check)
  const session = await getServerSession(authOptions);
  
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const role = (session.user as any).role;

  try {
    let students;

    if (role === 'ADMIN') {
      // Admins sehen alle Schüler
      students = await prisma.student.findMany({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          internalId: true,
          classId: true,
          birthYear: true,
          status: true,
        }
      });
    } else {
      // Lehrer: Nur zugewiesene Schüler (RLS via TeacherStudentAccess)
      const access = await prisma.teacherStudentAccess.findMany({
        where: { teacherId: userId },
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              internalId: true,
              classId: true,
              birthYear: true,
              status: true,
            }
          }
        }
      });
      students = access.map(a => a.student);
    }

    return NextResponse.json({ students });
  } catch (error) {
    return NextResponse.json({ error: 'Server Fehler' }, { status: 500 });
  }
}
