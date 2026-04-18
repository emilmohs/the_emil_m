import 'server-only'
import { createPrismaClient } from './prisma-init'
import { initBackupScheduler } from './backups'


const prismaClientSingleton = () => {
  if (typeof window !== 'undefined') {
    throw new Error('PrismaClient cannot be initialized on the client side.')
  }
  return createPrismaClient()
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
