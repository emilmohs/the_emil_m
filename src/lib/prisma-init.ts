import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

export const createPrismaClient = () => {
  const dbUrl = process.env.DATABASE_URL || 'file:./dev.db'
  // Remove file: and handle cases like file:///app... -> /app...
  const filePath = dbUrl.replace(/^file:\/\/\//, '/').replace(/^file:/, '')
  
  const adapter = new PrismaBetterSqlite3({ url: filePath })
  return new PrismaClient({ adapter })
}
