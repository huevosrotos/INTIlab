# DrogLab / INTIlab

Sistema de gestión de droguero de laboratorio químico.

## Características

- Gestión de catálogo de drogas con pictogramas SGA/GHS
- Inventario por lotes (frascos) con QR escaneable
- Multi-depósito (1 principal + N laboratorios)
- Trazabilidad completa: recibido, apertura, consumo, baja
- Escáner QR con cámara para uso móvil
- Etiquetas QR imprimibles (individual y masiva)
- Alertas de vencimiento y stock bajo
- Reportes exportables (CSV/PDF)
- Login con roles (Admin, Encargado, Operario, Auditor)
- Responsivo (PC y celular)
- HTTPS incluido (Caddy)

## Ramas

- `main` — Deploy directo sobre LXC/VM con Bun + systemd
- `docker` — Empaquetado en Docker para máxima portabilidad

## Deploy rápido (rama docker)

```bash
git clone https://github.com/huevosrotos/INTIlab.git
cd INTIlab
git checkout docker
docker compose up -d --build
curl -X POST http://localhost:3000/api/setup \
  -H "Authorization: Bearer droglab-setup-2024"
```

Acceder a https://localhost (aceptar certificado).

Login: `admin@lab.org` / `droglab123`

Ver [DEPLOY.md](DEPLOY.md) para detalles completos, backup, migración a MariaDB, etc.
