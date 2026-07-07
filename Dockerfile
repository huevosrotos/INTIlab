# ============================================================
# DrogLab — Dockerfile multi-stage para producción
# ============================================================
# Build:  docker build -t droglab .
# Run:    docker compose up -d
# ============================================================

# ---------- Stage 1: Instalar dependencias ----------
FROM oven/bun:1.1-debian AS deps
WORKDIR /app

COPY package.json bun.lock* ./
COPY prisma ./prisma

RUN bun install --frozen-lockfile || bun install

# ---------- Stage 2: Build de Next.js ----------
FROM oven/bun:1.1-debian AS builder
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generar cliente Prisma y construir Next.js (standalone)
RUN bun run db:generate
RUN bun run build

# ---------- Stage 3: Runtime ligero ----------
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV DATABASE_URL=file:/app/db/custom.db

# Dependencias del sistema para Prisma (SQLite + openssl)
RUN apt-get update && \
    apt-get install -y --no-install-recommends openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Usuario no-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# --- Copiar el build standalone ---
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# --- Copiar Prisma (schema + cliente + CLI para db push) ---
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.bin ./node_modules/.bin

# --- Crear directorios de datos persistentes ---
RUN mkdir -p /app/db /app/uploads && \
    chown -R nextjs:nodejs /app/db /app/uploads

# Script de arranque: aplica el schema a la DB y levanta el server
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs
EXPOSE 3000

CMD ["./docker-entrypoint.sh"]
