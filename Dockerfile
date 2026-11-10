FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# 1. Dependências
FROM base AS deps
ENV NODE_ENV=development
COPY package.json package-lock.json ./
RUN npm ci --include=dev

# 2. Build do Next.js
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV DATABASE_URL="file:/app/data/prod.db"

RUN npx prisma generate
RUN npm run build

# 3. Imagem Final de Produção
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL="file:/app/data/prod.db"

# Diretórios para dados e uploads
RUN mkdir -p /app/data /app/public/uploads

COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/entrypoint.sh ./entrypoint.sh

RUN chmod +x ./entrypoint.sh

VOLUME ["/app/data", "/app/public/uploads"]

EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]

