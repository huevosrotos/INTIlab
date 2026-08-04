# ============================================================
# DrogLab — Dockerfile multi-stage para producción
# ============================================================
# Build:  docker build -t droglab .
# Run:    docker compose up -d
# ============================================================
# IMPORTANTE: Usamos la misma imagen base (oven/bun:1.3-debian) en
# build y runtime para que el cliente Prisma generado coincida con
# la plataforma del runtime (mismo OpenSSL). Esto evita el error
# "Prisma Client could not locate the Query Engine".
# ============================================================

# ---------- Stage 1: Instalar dependencias ----------
FROM oven/bun:1.3-debian AS deps
WORKDIR /app

COPY package.json bun.lock* ./
COPY prisma ./prisma

RUN bun install --frozen-lockfile

# ---------- Stage 2: Build de Next.js ----------
FROM oven/bun:1.3-debian AS builder
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generar cliente Prisma y construir Next.js (standalone)
RUN bun run db:generate
RUN bun run build

# ---------- Stage 3: Runtime ----------
# Misma imagen base que el builder → mismo OpenSSL → sin mismatch de Prisma
FROM oven/bun:1.3-debian AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV DATABASE_URL=file:/app/db/custom.db

# Usuario no-root
RUN groupadd -r app && useradd -r -g app -u 1001 -s /bin/bash app

# --- Copiar el build standalone ---
COPY --from=builder --chown=app:app /app/.next/standalone ./
COPY --from=builder --chown=app:app /app/.next/static ./.next/static
COPY --from=builder --chown=app:app /app/public ./public

# --- Copiar Prisma y todas sus dependencias para que db push funcione ---
# El CLI de Prisma tiene dependencias transitivas (effect, @effect, etc.)
# que se necesitan en runtime. Copiamos node_modules completo para evitar
# errores de "Cannot find package X" al ejecutar prisma db push.
COPY --from=builder --chown=app:app /app/prisma ./prisma
COPY --from=builder --chown=app:app /app/node_modules ./node_modules

# --- Crear directorios de datos persistentes ---
RUN mkdir -p /app/db /app/uploads && \
    chown -R app:app /app/db /app/uploads

# Script de arranque: aplica el schema a la DB y levanta el server
COPY --chown=app:app docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER app
EXPOSE 3000

CMD ["./docker-entrypoint.sh"]
