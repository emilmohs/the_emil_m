# 1. Stage: Abhängigkeiten installieren
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
RUN npm install

# 2. Stage: Die App bauen
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Das baut die App und erstellt den .next/standalone Ordner
RUN npm run build

# 3. Stage: Das finale Image für den Server
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

# Wir kopieren nur die Dateien, die für den Standalone-Modus nötig sind
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Port 3000 freigeben
EXPOSE 3000

# Den Server starten (im Standalone-Modus ist das die server.js)
CMD ["node", "server.js"]