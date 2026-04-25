import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

export const createPrismaClient = () => {
  // Use absolute path to avoid ambiguity between root and prisma folder
  const dbUrl = 'file:/home/emil-mohs/Documents/Antigravity/Novum/prisma/dev.db'
  const adapter = new PrismaBetterSqlite3({ url: dbUrl })
  return new PrismaClient({ adapter })
}

