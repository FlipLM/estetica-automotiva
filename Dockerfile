FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# 1. Dependências
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# 2. Build do Next.js Standalone
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
# URL padrão para validação do Prisma durante compilação
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/vulpto?schema=public"

RUN npx prisma generate
RUN npm run build
RUN npx esbuild prisma/seed.ts --bundle --platform=node --outfile=prisma/seed.js --external:@prisma/client

# 3. Imagem Final de Produção Standalone
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV PATH="/app/node_modules/.bin:$PATH"

# Usuário de sistema não-root para conformidade de segurança em containers
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Diretório para uploads com permissões adequadas
RUN mkdir -p /app/public/uploads && chown -R nextjs:nodejs /app/public/uploads

# Copia artefatos mínimos do standalone
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.bin ./node_modules/.bin
COPY --from=builder /app/entrypoint.sh ./entrypoint.sh

RUN chmod +x ./entrypoint.sh

USER nextjs

EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]
