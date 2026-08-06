# DrogLab / INTIlab

Sistema de gestión de droguero para laboratorios químicos del INTI Mendoza.

Permite llevar el inventario de reactivos químicos con trazabilidad completa, etiquetas QR para identificación rápida de frascos, multi-depósito, alertas de vencimiento y stock bajo, operación desde PC o celular (con cámara para escanear QR y tomar fotos de envases), y clasificación química automática.

---

## Características principales

### Inventario y catálogo
- **Catálogo de drogas** con número CAS, fórmula, peso molecular, pictogramas SGA/GHS, frases H, clase de peligro y ficha SDS.
- **Código nuevo de drogas**: patrón `TIPO-ARMARIO-ESTANTE-CORR` (ej: `SA-1A-001` = Sal, Armario 1, Estante A, correlativo 001).
- **Lotes (frascos)**: cada frasco es un lote independiente con su propio QR, proveedor, vencimiento, pureza, depósito, ubicación física, observaciones y foto del envase.
- **Pureza por lote**: cada frasco puede tener su propia pureza/distinta calidad (no solo la del catálogo).
- **Observaciones del lote**: notas especiales como "húmedo", "prestado", "contaminado", "no funciona".
- **Modelo de frasco completo**: habilitar para uso → consumir / devolver / dar de baja. Sin registro de consumo parcial.
- **Vista "Por sustancia"**: agrupa los lotes por droga, mostrando total de frascos, activos, purezas distintas y depósitos.
- **Búsqueda insensible a acentos**: escribir "acido" encuentra "Ácido sulfúrico".

### Clasificación química
- **Clases químicas automáticas**: cada droga se categoriza según su nombre en múltiples clases:
  - Naturaleza: Inorgánico / Orgánico
  - Ácido/Base: Ácido / Base / Sal
  - Peligrosidad: Inflamable, Comburente, Explosivo, Tóxico, Corrosivo, Irritante, Carcinógeno
  - Reactividad: Oxidante, Reductor, Reactivo
  - Función: Indicador de pH, Indicador redox, Colorante, Reactivo analítico, Buffer, Solvente, Catalizador
  - Material: Metal, Compuesto metálico, Carbohidrato, Proteína, Lípido, Polímero, Surfactante
- **Filtros combinables**: buscar por múltiples clases a la vez (ej: Ácido + Tóxico + Inorgánico).
- **Editable**: el admin puede ajustar las clases de cada droga desde la ficha.

### Multi-depósito
- 1 depósito principal (Droguero Central) + N depósitos locales (laboratorios).
- Transferencias de frasco completo entre depósitos (no se permiten fracciones).
- Al habilitar un frasco para uso, se selecciona el laboratorio/sector de destino.

### QR y etiquetas
- **Escáner QR** con cámara del celular: al escanear abre directamente la ficha del lote con sus acciones.
- **QR en fichas**: el código QR del lote se muestra al lado del nombre en el detalle.
- **Etiquetas QR imprimibles** con nombre, pictogramas SGA, ubicación, lote, CAS y vencimiento. Tamaño configurable (6 predefinidos + personalizado).
- **Impresión masiva**: seleccionar múltiples lotes e imprimir todas las etiquetas en una hoja A4.
- **QR con URL HTTPS**: al escanear con la cámara nativa del celu, abre la app directamente.

### Trazabilidad
- **Fechas de ciclo de vida**: recibido, apertura (habilitación), consumo y baja por lote.
- **Historial de movimientos**: todos los movimientos quedan registrados con fecha, usuario y motivo.
- **Lotes no se eliminan**: los lotes consumidos/dados de baja se mantienen para trazabilidad.

### Alertas
- **Vencimiento próximo**: avisa N días antes (configurable, default 30).
- **Stock bajo**: avisa cuando el stock está por debajo del mínimo configurado por droga.
- **Stock agotado**: avisa cuando un lote se consumió.

### Usuarios y seguridad
- **Roles**: Administrador, Encargado de depósito, Operario de laboratorio y Auditor (solo lectura).
- **Recuperación de contraseña** por email con link de restablecimiento (expira en 1 hora).
- **Edición de drogas**: solo los administradores pueden editar el catálogo.

### Configuración
- **Sección de Configuración** (solo admin) con:
  - Email/SMTP: servidor, puerto, usuario, contraseña, remitente + email de prueba.
  - Alertas: días de anticipación para vencimiento.
  - Sistema: nombre del sistema, token de setup.
- La configuración se guarda en la base de datos (no se pierde con `git pull`).

### Reportes
- **Inventario actual**: exportable a CSV.
- **Movimientos por período**: con filtros de fecha y tipo.
- **Drogas por vencer**: lotes que vencen en los próximos 30 días.
- **Stock bajo/agotado**: lotes con stock bajo el mínimo.

### Ayuda
- **Menú de ayuda interactivo** con guías paso a paso:
  - Habilitar y consumir un frasco
  - Escanear un código QR
  - Imprimir etiquetas QR
  - Transferir entre depósitos
  - Tomar foto del envase
  - Observaciones del lote
  - Lotes vencidos
  - Vista "Por sustancia"
  - Alertas de vencimiento y stock

---

## Stack tecnológico

- **Next.js 16** (App Router, standalone) + **TypeScript** + **Bun**
- **Prisma ORM** con SQLite (preparado para migrar a MariaDB/MySQL)
- **Tailwind CSS 4** + **shadcn/ui** (New York style) + **Lucide icons**
- **TanStack Query** (server state) + **Zustand** (client state)
- **Caddy** (reverse proxy HTTPS automático)
- **Docker** + **Docker Compose** para deployment
- **Nodemailer** para envío de emails

---

## Deploy con Docker (rama `docker`)

```bash
git clone https://github.com/huevosrotos/INTIlab.git
cd INTIlab
git checkout docker

# Crear directorios de datos con permisos correctos
mkdir -p data/db data/uploads
chown -R 1001:1001 data/

# Construir y levantar
docker compose up -d --build

# Inicializar la DB con datos del droguero (solo la primera vez)
sleep 10
curl -X POST http://localhost:3000/api/setup \
  -H "Authorization: Bearer droglab-setup-2024"
```

Acceder a `https://<IP>` (aceptar certificado autofirmado).

### Configurar SMTP para recuperación de contraseñas

Después del primer login, ir a **Configuración → Email/SMTP** y completar:

| Campo | Valor para Gmail |
|---|---|
| Servidor SMTP | `smtp.gmail.com` |
| Puerto | `587` |
| Usuario SMTP | tu-email@gmail.com |
| Contraseña SMTP | contraseña de aplicación |
| Email remitente | tu-email@gmail.com |

Para obtener la contraseña de aplicación de Google: https://myaccount.google.com/apppasswords

---

## Estructura del proyecto

```
├── src/
│   ├── app/
│   │   ├── api/              # API routes (auth, drugs, lots, movements, settings, ...)
│   │   ├── layout.tsx        # Layout raíz
│   │   └── page.tsx          # SPA (login + shell)
│   ├── components/
│   │   ├── ui/               # Componentes shadcn/ui
│   │   ├── sections/         # Secciones (dashboard, inventory, scanner, labels, ...)
│   │   ├── app-shell.tsx     # Layout + navegación responsiva
│   │   ├── ghs-pictograms.tsx# Pictogramas SGA/GHS en SVG
│   │   ├── qr-badge.tsx      # Componente QR reutilizable
│   │   └── movement-dialog.tsx # Diálogos de movimientos
│   ├── lib/                  # Auth, DB, helpers, constantes, email, settings, search
│   └── store/                # Zustand store
├── prisma/
│   ├── schema.prisma         # Modelo de datos
│   ├── seed.ts               # Script de inicialización
│   ├── seed-data.json        # Datos del droguero real (293 drogas, 540 lotes)
│   └── import-excel.py       # Script que importa del Excel al JSON
├── Dockerfile                # Rama docker
├── docker-compose.yml        # Rama docker
├── Caddyfile                 # HTTPS (rama docker)
└── DEPLOY.md                 # Guía de deployment completa
```

---

## Depósitos

| Código | Nombre | Tipo |
|---|---|---|
| DEP-00 | Depósito Central / Droguero | Principal |
| DEP-01 | Solventes HPLC | Secundario |
| DEP-02 | Solventes | Secundario |
| DEP-03 | Ácidos | Secundario |
| DEP-04 | Consumibles | Secundario |
| LAB-01 | Lab-MEIPA | Secundario |
| LAB-02 | Lab-SERVICIOS | Secundario |
| LAB-03 | Lab-Microbiología | Secundario |
| LAB-04 | Lab-Cromatografía | Secundario |
| LAB-05 | Lab-Bioprocesos | Secundario |

---

## Roles y permisos

| Rol | Permisos |
|---|---|
| Administrador | Todo: editar drogas, lotes, usuarios, configuración, reportes |
| Encargado de depósito | Editar lotes, movimientos, depósitos. No puede editar drogas del catálogo |
| Operario de laboratorio | Habilitar, consumir, transferir lotes. No puede editar |
| Auditor | Solo lectura |

---

## Ramas

- **`main`**: código de la aplicación (sin archivos de Docker).
- **`docker`**: `main` + Dockerfile, docker-compose.yml, Caddyfile y DEPLOY.md para deployment con Docker.

---

## Datos del droguero

El sistema se inicializa con los datos reales del droguero del INTI Mendoza:
- **293 drogas** extraídas del Excel "Stock drogas-CONTROL II.xlsx"
- **540 lotes** (frascos individuales)
- **10 depósitos** (1 central + 4 específicos + 5 laboratorios)
- Clasificación química automática por nombre
- Nombres normalizados (hidratos entre paréntesis, combinación correcta de catión+anión)

Para regenerar los datos desde el Excel:

```bash
python3 prisma/import-excel.py
# Genera prisma/seed-data.json
```

---

## Migrar a MariaDB (futuro)

El sistema está preparado. Ver `DEPLOY.md` para instrucciones detalladas.

---

## Backup

```bash
# Backup de DB + imágenes
tar -czf droglab-backup-$(date +%F).tar.gz data/

# Restaurar
tar -xzf droglab-backup-AAAA-MM-DD.tar.gz
docker compose restart droglab
```

---

## Licencia

Privado. © INTI Mendoza.
