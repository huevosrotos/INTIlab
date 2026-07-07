#!/bin/sh
# Script de arranque del contenedor DrogLab
# 1. Aplica el schema de Prisma a la base SQLite (idempotente)
# 2. Inicia el servidor Next.js en modo standalone

set -e

echo "=== DrogLab — Iniciando ==="
echo "DATABASE_URL: $DATABASE_URL"
echo ""

# Aplicar schema a la base de datos (crea las tablas si no existen)
echo ">> Aplicando schema de Prisma…"
npx prisma db push --skip-generate 2>&1 || {
  echo ">> Aviso: no se pudo aplicar el schema (probablemente ya estaba aplicado)"
}

echo ""
echo ">> Iniciando servidor Next.js en puerto $PORT…"
exec node server.js
