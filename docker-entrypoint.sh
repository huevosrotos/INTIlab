#!/bin/sh
# Script de arranque del contenedor DrogLab
# 1. Aplica el schema de Prisma a la base de datos (SQLite o MySQL/MariaDB)
# 2. Inicia el servidor Next.js en modo standalone
# 3. El seed (datos de muestra) se ejecuta via /api/setup en el primer arranque

set -e

echo "=== DrogLab — Iniciando ==="
echo "DATABASE_URL: $DATABASE_URL"
echo ""

# Aplicar schema a la base de datos (crea las tablas si no existen)
# Funciona tanto para SQLite (file:) como MySQL/MariaDB (mysql://)
echo ">> Aplicando schema de Prisma…"
bunx prisma db push --skip-generate 2>&1 || {
  echo ">> Aviso: no se pudo aplicar el schema (probablemente ya estaba aplicado)"
}

echo ""
echo ">> Iniciando servidor Next.js en puerto $PORT…"
exec bun server.js
