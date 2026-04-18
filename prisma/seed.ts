import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const prisma = new PrismaClient()

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
    where: { email: 'admin@schule.test' },
    update: {},
    create: {
      name: 'Anna Admin',
      email: 'admin@schule.test',
      passwordHash: bcrypt.hashSync('testpasswort123', 10),
      role: 'ADMIN',
    },
  })

  // 2. Lehrer anlegen
  const teacher = await prisma.user.upsert({
    where: { email: 'lehrer@schule.test' },
    update: {},
    create: {
      name: 'Max Mustermann',
      email: 'lehrer@schule.test',
      passwordHash: bcrypt.hashSync('testpasswort123', 10),
      role: 'TEACHER',
    },
  })

  // 3. Schüler anlegen
  const schueler1 = await prisma.student.create({
    data: {
      firstName: 'Lena',
      lastName: 'Schulze',
      internalId: 'SCH-2024-001',
      classId: '3a',
      birthYear: 2016,
      status: 'Regelschülerin',
    },
  })

  const schueler2 = await prisma.student.create({
    data: {
      firstName: 'Tim',
      lastName: 'Berger',
      internalId: 'SCH-2024-002',
      classId: '3a',
      birthYear: 2015,
      status: 'LRS-Förderung',
    },
  })

  // 4. Zugriff zuweisen
  await prisma.teacherStudentAccess.createMany({
    data: [
      { teacherId: teacher.id, studentId: schueler1.id, subject: 'Klassenlehrerin' },
      { teacherId: teacher.id, studentId: schueler2.id, subject: 'Klassenlehrerin' },
    ],
  })

  // 5. Beispiel-Logs anlegen
  const log1 = await prisma.learningLog.create({
    data: {
      studentId: schueler1.id,
      teacherId: teacher.id,
      content: encryptForSeed('Lena zeigt große Fortschritte im Leseverständnis. Sie kann nun kurze Texte selbstständig zusammenfassen.'),
      category: 'Deutsch',
    },
  })

  await prisma.logAudit.create({
    data: {
      logId: log1.id,
      teacherId: teacher.id,
      action: 'CREATE',
      newContent: log1.content,
    },
  })

  const log2 = await prisma.learningLog.create({
    data: {
      studentId: schueler2.id,
      teacherId: teacher.id,
      content: encryptForSeed('Tim benötigt weiterhin Unterstützung bei der Rechtschreibung. Die LRS-Förderung zeigt aber erste Wirkung.'),
      category: 'Deutsch',
    },
  })

  await prisma.logAudit.create({
    data: {
      logId: log2.id,
      teacherId: teacher.id,
      action: 'CREATE',
      newContent: log2.content,
    },
  })

  console.log('✅ Seed abgeschlossen!')
  console.log(`   Admin: admin@schule.test / testpasswort123`)
  console.log(`   Lehrer: lehrer@schule.test / testpasswort123`)
  console.log(`   Schüler: ${schueler1.firstName} ${schueler1.lastName}, ${schueler2.firstName} ${schueler2.lastName}`)
}

main()
  .then(async () => { await prisma.$disconnect() })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
