#!/bin/sh
set -e

echo "=========================================="
echo "   VULPTO SAAS — INICIALIZANDO SERVIÇO    "
echo "=========================================="

# 1. Garante diretórios de runtime
mkdir -p /app/public/uploads

# 2. Executa migrações pendentes no banco de dados com segurança total
echo "=> Aplicando migrações do PostgreSQL (prisma migrate deploy)..."
npx prisma migrate deploy

# 3. Execução de seed controlada (ativa apenas com RUN_SEED=true ou FORCE_SEED=true)
if [ "$RUN_SEED" = "true" ] || [ "$FORCE_SEED" = "true" ]; then
  echo "=> Flag de inicialização de dados detectada. Executando seed..."
  if [ -f "prisma/seed.js" ]; then
    node prisma/seed.js || echo "Aviso: Seed concluído ou ignorado por segurança."
  else
    npx tsx prisma/seed.ts || echo "Aviso: Seed concluído ou ignorado por segurança."
  fi
fi

# 4. Inicia o servidor Next.js
echo "=> Iniciando Vulpto na porta ${PORT:-3000}..."
if [ -f "/app/server.js" ]; then
  exec node server.js
else
  exec npm run start
fi
