# 1. Stage: Abhängigkeiten
FROM node:22-alpine AS deps

RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
# Wichtig: Config für Prisma Generate kopieren
COPY prisma.config.js ./

RUN npm install
# Wichtig: DATABASE_URL als Platzhalter für Generate bereitstellen
RUN DATABASE_URL="file:./dev.db" npx prisma generate

# 2. Stage: Bauen
FROM node:22-alpine AS builder

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# npx prisma generate ist hier nun optional, da es in deps schon lief, 
# aber wir führen es zur Sicherheit nochmal mit dem kompletten Code aus
RUN DATABASE_URL="file:./dev.db" npx prisma generate
RUN npm run build


# 3. Stage: Runner
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
RUN mkdir -p /app/data

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=deps /app/node_modules ./node_modules
# WICHTIG: Prisma-Dateien kopieren
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.js ./
COPY --from=builder /app/src/lib/prisma-init.ts ./src/lib/prisma-init.ts

EXPOSE 3000
# Wir nutzen npx prisma für db push & seed beim Start
CMD npx prisma db push --accept-data-loss && npx prisma db seed && node server.js