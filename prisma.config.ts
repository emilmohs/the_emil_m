// prisma.config.ts
const config = {
  datasource: {
    url: process.env.DATABASE_URL || "file:./dev.db",
  },
};

export default config;