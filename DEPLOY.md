# DrogLab — Deploy con Docker

Sistema de gestión de droguero de laboratorio químico.
Empaquetado en Docker para máxima portabilidad.

---

## Requisitos

- Docker Engine 20+ (o Docker Desktop)
- Docker Compose v2

---

## Deploy rápido

### 1. Clonar el repo

```bash
git clone https://github.com/huevosrotos/INTIlab.git
cd INTIlab
git checkout docker  # rama con Docker
```

### 2. Construir y levantar

```bash
docker compose up -d --build
```

La primera vez tarda 3-5 min (descarga imágenes, compila Next.js con Bun).

### 3. Inicializar la DB con datos de muestra (solo la primera vez)

```bash
# Esperar a que el server arranque
sleep 10

# Inicializar (crea usuarios, depósitos, drogas, lotes de ejemplo)
curl -X POST http://localhost:3000/api/setup \
  -H "Authorization: Bearer droglab-setup-2024"
```

### 4. Acceder

- **HTTP:** http://localhost:3000
- **HTTPS:** https://localhost (aceptar certificado autofirmado)

**Login demo:** `admin@lab.org` / `droglab123`

---

## Comandos útiles

```bash
# Ver logs
docker compose logs -f droglab

# Reiniciar
docker compose restart droglab

# Detener
docker compose down

# Reconstruir después de cambios
docker compose up -d --build

# Ver estado
docker compose ps
```

---

## Estructura de datos

```
data/
├── db/            # Base SQLite (custom.db)
└── uploads/       # Fotos de envases
```

Toda la información persiste en `data/`. Si borrás esa carpeta, perdés los datos.

---

## Backup

```bash
# Backup completo (DB + imágenes)
tar -czf droglab-backup-$(date +%F).tar.gz data/

# Restaurar
tar -xzf droglab-backup-AAAA-MM-DD.tar.gz
docker compose restart droglab
```

---

## Exportar el contenedor a otra máquina

### Opción A — Imagen + datos (sin Docker Hub)

```bash
# Exportar la imagen Docker
docker save droglab:latest | gzip > droglab-image.tar.gz

# Exportar los datos
tar -czf droglab-data.tar.gz data/
docker-compose.yml Caddyfile

# Copiar a la otra máquina y:
docker load < droglab-image.tar.gz
tar -xzf droglab-data.tar.gz
docker compose up -d
```

### Opción B — Repo Git + build (más limpio)

```bash
# En la nueva máquina:
git clone https://github.com/huevosrotos/INTIlab.git
cd INTIlab
git checkout docker
docker compose up -d --build

# Migrar datos existentes (si hay):
# Copiar data/ desde el backup
```

---

## Migrar la DB a MariaDB (futuro)

El sistema está preparado para migrar de SQLite a MariaDB sin cambiar código:

### 1. Usar MariaDB externa (ya existente)

Editar `docker-compose.yml`:

```yaml
services:
  droglab:
    environment:
      - DATABASE_URL=mysql://admin:inti1957@192.168.2.205:3306/droglab
```

Cambiar `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "mysql"   # era "sqlite"
  url      = env("DATABASE_URL")
}
```

Crear la DB en MariaDB:

```bash
mysql -h 192.168.2.205 -u admin -p'inti1957' \
  -e "CREATE DATABASE droglab CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Reconstruir y reiniciar:

```bash
docker compose up -d --build
# El entrypoint aplica el schema automáticamente (prisma db push)
# Inicializar datos:
curl -X POST http://localhost:3000/api/setup \
  -H "Authorization: Bearer droglab-setup-2024"
```

### 2. Usar MariaDB en un contenedor (incluido)

Descomentar el servicio `db` en `docker-compose.yml` y cambiar `DATABASE_URL`:

```yaml
services:
  droglab:
    environment:
      - DATABASE_URL=mysql://droglab:droglab@db:3306/droglab
  db:
    image: mariadb:11
    # ... (ya está comentado en el archivo)
```

**Nota:** Las imágenes de los envases siguen en disco (`data/uploads/`), no en la DB. Eso es intencional: la DB queda liviana y las imágenes se respaldan por separado.

---

## HTTPS con Caddy

Caddy está incluido en el `docker-compose.yml` y gestiona HTTPS automáticamente:

- **IP local / localhost:** usa certificado autofirmado (`tls internal`). El navegador muestra advertencia la primera vez → aceptar el riesgo.
- **Dominio público:** descomentar la sección de dominio en `Caddyfile` y Caddy obtiene certificados Let's Encrypt automáticamente.

El HTTPS es necesario para que la cámara funcione en el escáner QR y la captura de fotos del envase (los navegadores exigen HTTPS para `getUserMedia`).

---

## Actualizar el código

```bash
git pull origin docker
docker compose up -d --build
```

Los datos en `data/` no se pierden al actualizar.

---

## Troubleshooting

### El server no arranca

```bash
docker compose logs droglab | tail -30
```

### La cámara del escáner no funciona

- Acceder por HTTPS (https://localhost), no HTTP
- Aceptar el certificado autofirmado
- Verificar permisos de cámara en el navegador

### El build falla por Prisma

```bash
# Limpiar todo y reconstruir
docker compose down
docker system prune -af
docker compose up -d --build --no-cache
```
