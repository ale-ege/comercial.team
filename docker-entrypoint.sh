#!/bin/sh
set -e

# Garantir que o banco exista e as tabelas estejam criadas
npx prisma db push --accept-data-loss 2>/dev/null || true

# Popular dados iniciais (seed) – idempotente; falha ignorada se já existir
npm run db:seed 2>/dev/null || true

exec node node_modules/next/dist/bin/next start
