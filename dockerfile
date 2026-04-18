# 1. Stage: Abhängigkeiten installieren
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
# Wir kopieren das Prisma-Schema schon hier, damit wir generieren können
COPY prisma ./prisma 
RUN npm install
# DAS IST NEU:
RUN npx prisma generate

# 2. Stage: Die App bauen
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Sicherstellen, dass Prisma auch hier bekannt ist
RUN npx prisma generate
RUN npm run build

# 3. Stage: Das finale Image
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]