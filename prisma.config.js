module.exports = {
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL || "file:./prisma/dev.db",
  },
};