import { PrismaClient } from '@prisma/client'
// Force re-init: 2026-04-17T16:25:00

import { initBackupScheduler } from './backups'

const prismaClientSingleton = () => {
  return new PrismaClient()
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

// Start the backup scheduler background task
if (typeof window === 'undefined') {
  initBackupScheduler();
}

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
