import { createPrismaClient } from '../src/lib/prisma-init'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import 'dotenv/config'

const prisma = createPrismaClient()




// Einfache Verschlüsselung für Seed-Daten
function encryptForSeed(text: string): string {
  const key = Buffer.from(process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex'), 'hex')
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  let encrypted = cipher.update(text, 'utf8', 'base64')
  encrypted += cipher.final('base64')
  const authTag = cipher.getAuthTag()
  return [iv.toString('base64'), authTag.toString('base64'), encrypted].join(':')
}

async function main() {
  // 1. Admin-User anlegen
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      email: 'admin@schule.test',
      passwordHash: await bcrypt.hash('admin', 10),
    },
    create: {
      name: 'System Admin',
      username: 'admin',
      email: 'admin@schule.test',
      passwordHash: await bcrypt.hash('admin', 10),
      role: 'ADMIN',
    },
  })

  // 2. Klassen anlegen (Wichtig für Foreign Keys)
  const classes = ["3a", "3b", "4a", "4b", "DAZ"];
  for (const classId of classes) {
    await prisma.schoolClass.upsert({
      where: { id: classId },
      update: {},
      create: { id: classId },
    });
  }

  // 3. Lehrer anlegen
  const teacher = await prisma.user.upsert({
    where: { username: 'lehrer1' },
    update: {},
    create: {
      name: 'Max Mustermann',
      username: 'lehrer1',
      email: 'lehrer@schule.test',
      passwordHash: await bcrypt.hash('testpasswort123', 10),
      role: 'TEACHER',
    },
  })

  // 4. Schüler anlegen (Idempotent via upsert mit internalId als Key falls vorhanden, sonst firstName/lastName Kombination)
  // Da Student kein einfaches Unique Feld für den Seed hat, nutzen wir findFirst + create
  const createStudentIfMissing = async (data: any) => {
    const existing = await prisma.student.findFirst({
      where: { firstName: data.firstName, lastName: data.lastName }
    });
    if (existing) return existing;
    return await prisma.student.create({ data });
  }

  const schueler1 = await createStudentIfMissing({
    firstName: 'Lena',
    lastName: 'Schulze',
    internalId: 'SCH-2024-001',
    classId: '3a',
    birthYear: 2016,
    status: 'Regelschülerin',
  })

  const schueler2 = await createStudentIfMissing({
    firstName: 'Tim',
    lastName: 'Berger',
    internalId: 'SCH-2024-002',
    classId: '3a',
    birthYear: 2015,
    status: 'LRS-Förderung',
  })

  // 5. Zugriff zuweisen (Idempotent)
  await prisma.teacherStudentAccess.upsert({
    where: { teacherId_studentId: { teacherId: teacher.id, studentId: schueler1.id } },
    update: {},
    create: { teacherId: teacher.id, studentId: schueler1.id, subject: 'Klassenlehrerin' }
  });

  await prisma.teacherStudentAccess.upsert({
    where: { teacherId_studentId: { teacherId: teacher.id, studentId: schueler2.id } },
    update: {},
    create: { teacherId: teacher.id, studentId: schueler2.id, subject: 'Klassenlehrerin' }
  });

  // 6. Beispiel-Logs anlegen (Idempotent)
  const createLogIfMissing = async (studentId: string, teacherId: string, content: string, category: string) => {
    const existing = await prisma.learningLog.findFirst({
      where: { studentId, category, content: encryptForSeed(content) }
    });
    // This is a bit tricky due to encryption changing the string every time.
    // For simplicity in seed, we just check if any log exists for this student/category as a proxy.
    const anyExisting = await prisma.learningLog.findFirst({ where: { studentId, category } });
    if (anyExisting) return anyExisting;
    
    const log = await prisma.learningLog.create({
      data: { studentId, teacherId, content: encryptForSeed(content), category }
    });

    await prisma.logAudit.create({
      data: { logId: log.id, teacherId, action: 'CREATE', newContent: log.content }
    });
    return log;
  }

  await createLogIfMissing(
    schueler1.id, 
    teacher.id, 
    'Lena zeigt große Fortschritte im Leseverständnis. Sie kann nun kurze Texte selbstständig zusammenfassen.', 
    'Deutsch'
  );

  await createLogIfMissing(
    schueler2.id, 
    teacher.id, 
    'Tim benötigt weiterhin Unterstützung bei der Rechtschreibung. Die LRS-Förderung zeigt aber erste Wirkung.', 
    'Deutsch'
  );

  console.log('✅ Seed abgeschlossen!')
  console.log(`   Admin:  Benutzername: admin   / Passwort: admin`)
  console.log(`   Lehrer: Benutzername: lehrer1 / Passwort: testpasswort123`)
  console.log(`   Schüler: ${schueler1.firstName} ${schueler1.lastName}, ${schueler2.firstName} ${schueler2.lastName}`)
}

main()
  .then(async () => { await prisma.$disconnect() })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()

    process.exit(1)
  })
