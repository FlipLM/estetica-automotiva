#!/bin/sh
set -e

# Garante que os diretórios persistentes existam com permissão
mkdir -p /app/data /app/public/uploads

# Se o banco de dados SQLite ainda não existir no volume persistente, inicializa com seed
DB_FILE="/app/data/prod.db"
if [ ! -f "$DB_FILE" ]; then
  echo "=> Banco de dados novo detectado em $DB_FILE. Criando schema e seed inicial..."
  DATABASE_URL="file:$DB_FILE" npx prisma db push
  DATABASE_URL="file:$DB_FILE" npx tsx prisma/seed.ts
else
  echo "=> Banco de dados existente encontrado em $DB_FILE. Sincronizando schema..."
  DATABASE_URL="file:$DB_FILE" npx prisma db push
fi

echo "=> Iniciando DetailPro SaaS em 0.0.0.0:${PORT:-3000}..."
exec npm run start
