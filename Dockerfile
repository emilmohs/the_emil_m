# 1. Stage: Abhängigkeiten
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
# Wichtig: Config für Prisma Generate kopieren
COPY prisma.config.ts ./
RUN npm install
# Wichtig: DATABASE_URL als Platzhalter für Generate bereitstellen
RUN DATABASE_URL="file:./dev.db" npx prisma generate

# 2. Stage: Bauen
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# npx prisma generate ist hier nun optional, da es in deps schon lief, 
# aber wir führen es zur Sicherheit nochmal mit dem kompletten Code aus
RUN DATABASE_URL="file:./dev.db" npx prisma generate
RUN npm run build


# 3. Stage: Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
RUN mkdir -p /app/data

# Ordner für die SQLite-Datenbank erstellen
RUN mkdir -p /app/data

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# WICHTIG: Prisma-Engine für den Runner kopieren
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
# Wir nutzen ein kleines Skript oder npx, um die DB beim Start zu aktualisieren
CMD npx prisma db push --accept-data-loss && npx prisma db seed && node server.js