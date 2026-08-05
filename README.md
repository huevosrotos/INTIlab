# DrogLab / INTIlab

Sistema de gestión de droguero para laboratorios químicos.

Permite llevar el inventario de reactivos químicos con trazabilidad completa, etiquetas QR para identificación rápida de frascos, multi-depósito, alertas de vencimiento y stock bajo, y operación desde PC o celular (con cámara para escanear QR y tomar fotos de envases).

---

## Características principales

- **Catálogo de drogas** con número CAS, fórmula, peso molecular, pictogramas SGA/GHS, frases H, clase de peligro y ficha SDS.
- **Lotes (frascos)**: cada frasco es un lote independiente con su propio QR, proveedor, vencimiento, pureza, depósito, ubicación física, observaciones y foto del envase.
- **Modelo de frasco completo**: habilitar para uso → consumir / devolver / dar de baja. Sin registro de consumo parcial.
- **Multi-depósito**: 1 depósito principal + N depósitos locales (laboratorios), con transferencias de frasco completo entre ellos.
- **Escáner QR** con cámara del celular: al escanear abre directamente la ficha del lote con sus acciones.
- **Etiquetas QR imprimibles** con nombre, pictogramas SGA, ubicación, lote, CAS y vencimiento. Tamaño configurable y **impresión masiva** (varias etiquetas en una hoja).
- **Trazabilidad completa**: fechas de recibido, apertura, consumo y baja por lote, más historial de todos los movimientos.
- **Alertas** automáticas de vencimiento próximo y stock bajo.
- **Roles**: Administrador, Encargado de depósito, Operario de laboratorio y Auditor (solo lectura).
- **Reportes** exportables a CSV/impresión: inventario, movimientos, vencimientos, stock bajo.
- **HTTPS automático** con Caddy (cámara funciona en el celu).

---

## Stack tecnológico

- **Next.js 16** (App Router, standalone) + **TypeScript** + **Bun**
- **Prisma ORM** con SQLite (preparado para migrar a MariaDB/MySQL)
- **Tailwind CSS 4** + **shadcn/ui** (New York style) + **Lucide icons**
- **TanStack Query** (server state) + **Zustand** (client state)
- **Caddy** (reverse proxy HTTPS)
- **Docker** + **Docker Compose** para deployment

---

## Rápidas

### Deploy con Docker (rama `docker`)

```bash
git clone https://github.com/huevosrotos/INTIlab.git
cd INTIlab
git checkout docker
docker compose up -d --build

# Inicializar la DB con datos de muestra (solo la primera vez):
sleep 10
curl -X POST http://localhost:3000/api/setup \
  -H "Authorization: Bearer droglab-setup-2024"
```

Acceder a `https://<IP>` (aceptar certificado autofirmado).

**Login demo:** `admin@lab.org` / `droglab123`

### Deploy directo en LXC sin Docker (rama `main`)

```bash
git clone https://github.com/huevosrotos/INTIlab.git /opt/intilab
cd /opt/intilab
bun install
bun run db:push
DATABASE_URL="file:/opt/intilab/db/custom.db" bun run prisma/seed.ts
bun run build

# Configurar systemd service (ver DEPLOY.md)
systemctl start droglab
```

---

## Estructura del proyecto

```
├── src/
│   ├── app/
│   │   ├── api/           # API routes (auth, drugs, lots, movements, ...)
│   │   ├── layout.tsx    # Layout raíz
│   │   └── page.tsx      # SPA (login + shell)
│   ├── components/
│   │   ├── ui/            # Componentes shadcn/ui
│   │   ├── sections/      # Secciones de la app (dashboard, inventory, ...)
│   │   ├── app-shell.tsx  # Layout + navegación
│   │   └── ...
│   ├── lib/              # Auth, DB, helpers, constantes
│   └── store/            # Zustand store
├── prisma/
│   ├── schema.prisma     # Modelo de datos
│   └── seed.ts           # Datos de muestra
├── Dockerfile            # Rama docker
├── docker-compose.yml    # Rama docker
├── Caddyfile             # HTTPS (rama docker)
└── DEPLOY.md             # Guía de deployment completa
```

---

## Usuarios de demostración

Todos con contraseña `droglab123`:

| Rol | Email | Permisos |
|---|---|---|
| Administrador | `admin@lab.org` | Todo (incl. usuarios) |
| Encargado de depósito | `encargado@lab.org` | Editar drogas/lotes/movimientos/depósitos |
| Operario de laboratorio | `operario@lab.org` | Habilitar, consumir, transferir |
| Auditor | `auditor@lab.org` | Solo lectura |

---

## Ramas

- **`main`**: código de la aplicación (sin archivos de Docker).
- **`docker`**: `main` + Dockerfile, docker-compose.yml, Caddyfile y DEPLOY.md para deployment con Docker.

---

## Migrar a MariaDB (futuro)

El sistema está preparado. Ver `DEPLOY.md` para instrucciones detalladas.

---

## Licencia

Privado. © INTI Mendoza.
