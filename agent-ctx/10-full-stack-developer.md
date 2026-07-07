# Task 10 — full-stack-developer

## Tarea
Crear 4 secciones frontend en `src/components/sections/`:
1. `movements.tsx` → `export function Movements()`
2. `warehouses.tsx` → `export function Warehouses()`
3. `reports.tsx` → `export function Reports()`
4. `users.tsx` → `export function UsersSection()`

Todas ya estaban importadas en `src/components/app-shell.tsx` pero no existían.

## Trabajo realizado

### 1. Movements (`movements.tsx`)
- `"use client"`, TanStack Query con `queryKey: ["movements", typeFilter, warehouseFilter, debounced]`.
- Filtros: Select de tipo (con "Todos"), Select de depósito (con "Todos"), búsqueda de texto con debounce + botón Limpiar.
- Resumen rápido: tarjeta Total + una tarjeta por tipo con `MOVEMENT_TYPE_COLORS`.
- Tabla en desktop (ScrollArea `max-h-[70vh]`, header sticky) y tarjetas en mobile.
- Columnas: fecha/hora (format + formatDistanceToNow), tipo (badge coloreado), droga+lote, cantidad (signo +/-/diff según tipo), origen→destino con flecha, usuario, motivo.
- Botón "Registrar movimiento" visible solo para ADMIN/ENCARGADO/OPERARIO (oculto para AUDITOR).
- Dialog con combobox buscable de lotes activos (Popover + Command), Select de tipo (TRANSFERENCIA/CONSUMO/DEVOLUCION/BAJA/AJUSTE — no INGRESO), cantidad, depósito destino (solo TRANSFERENCIA, filtra el depósito actual del lote), motivo. Para AJUSTE muestra stock actual + nuevo stock + diff calculado. POST /api/movements. Invalida movements/lots/stats/alerts.

### 2. Warehouses (`warehouses.tsx`)
- `"use client"`, grid responsivo de tarjetas.
- PRINCIPAL resaltado con borde teal + ring + badge esquina superior derecha.
- Cada tarjeta muestra: ícono, nombre, código mono, ubicación, responsable, lotes asociados, badges (tipo, "Tu depósito" si es del usuario actual, "Inactivo").
- Click en tarjeta → `setInventoryWarehouseFilter(wh.id); setSection("inventory")`.
- Botones "Nuevo depósito" (ADMIN/ENCARGADO) y "Editar" → mismo Dialog (nombre, código mono uppercase, tipo Select, ubicación, descripción, responsable Select de usuarios activos, switch activo solo en edición). POST/PUT /api/warehouses.

### 3. Reports (`reports.tsx`)
- `"use client"`, 4 Tabs: Inventario, Movimientos, Vencimientos, Stock bajo.
- Cada tab: Card toolbar con filtros + badges de totales + botones CSV e Imprimir.
- Tab Inventario: filtro depósito, tabla de todos los lotes con estado.
- Tab Movimientos: filtros fecha desde/hasta (Input type date) + tipo. Filtrado en cliente.
- Tab Vencimientos: lotes activos con vencimiento en próximos 30 días (EXPIRY_WARNING_DAYS) o ya vencidos, ordenados por fecha, badge contextual con días.
- Tab Stock bajo: lotes activos con `currentQuantity <= drug.minStock`, agotados primero.
- CSV: BOM `\ufeff`, separador `;`, escaping de comas/comillas, descarga con Blob + `<a download>`.
- Imprimir: abre popup con HTML+CSS propios, evita manipular `document.body`. Contenido print en `<div className="hidden" id="print-...">`.

### 4. Users (`users.tsx`)
- `"use client"`, export `UsersSection`.
- Si `user.role !== "ADMIN"` muestra cartel "Acceso restringido a administradores" (icono ShieldAlert).
- Tabla desktop + tarjetas mobile con avatar (iniciales), nombre (badge "Tú" si es el actual, fila resaltada teal), email, rol (badge coloreado por rol), depósito, estado, fecha creación.
- Botones editar/eliminar. Eliminar deshabilitado si es el propio usuario (validado también en backend).
- Dialog Nuevo/Editar: nombre, email, password (opcional en edición con placeholder), rol Select, depósito Select (solo activos, opcional), switch activo.
- Eliminar con AlertDialog de confirmación. DELETE /api/users/[id].

## Decisiones clave
- **No usé `isReadOnly`/`canEdit`/`isAdmin` de `@/lib/auth`** porque ese archivo importa `next/headers` (server-only). En las secciones usé comparaciones directas `user.role === "ADMIN"` (igual que catalog.tsx).
- **Combobox de lotes con Popover + Command** (estándar shadcn) en lugar de Select simple, porque la tarea pedía "Select buscable".
- **Impresión vía popup window** con HTML propio (más robusto que `document.body.innerHTML = ...` que rompería el SPA React).
- **Filtros de texto en cliente** sobre el resultado de la API para poder buscar en múltiples campos (motivo, usuario, etc.).
- **Toggle `active` solo en edición** de warehouses, porque el POST no lo acepta y el backend hace default `true`.

## Cosas a revisar (marcadas en worklog)
1. `app-shell.tsx` y `api-helpers.ts` importan `isReadOnly`/`canEdit`/`isAdmin` de `@/lib/constants` pero esas funciones NO están en `constants.ts` — están en `@/lib/auth.ts`. Bug preexistente que NO toqué. Re-exportar desde constants o corregir imports.
2. Confirmar que `scanner.tsx` y `labels.tsx` existan (son importados en app-shell.tsx). `inventory.tsx` ya existe (creado en paralelo por otro agente).
3. `minStock` en Drug es `Float?` — si es null, el reporte de stock bajo usa 0 como mínimo. Confirmar semántica.

## Archivos creados
- `src/components/sections/movements.tsx`
- `src/components/sections/warehouses.tsx`
- `src/components/sections/reports.tsx`
- `src/components/sections/users.tsx`

## Export verification
```
movements.tsx:108  → export function Movements()
warehouses.tsx:81  → export function Warehouses()
reports.tsx:113    → export function Reports()
users.tsx:101      → export function UsersSection()
```

No corrí `bun run lint` ni reinicié el server, según indicaciones.
