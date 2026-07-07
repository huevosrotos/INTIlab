# Worklog - DrogLab

## Contexto general del proyecto
Sistema de gestión de droguero de laboratorio químico (DrogLab). Stack: Next.js 16 App Router, TypeScript, Tailwind 4, shadcn/ui, Prisma+SQLite, Zustand, TanStack Query.

---
Task ID: 1-6
Agent: main (Z.ai Code)
Task: Fundaciones del proyecto (schema, auth, layout, backend API, dashboard, catálogo)

Work Log:
- Schema Prisma definido y aplicado (User, Warehouse, Drug, Lot, Movement, Alert). DB push OK.
- Instaladas dependencias `qrcode` y `html5-qrcode` + `@types/qrcode`.
- Creados: src/lib/constants.ts (roles, tipos, pictogramas SGA, unidades, tamaños de etiqueta), src/lib/auth.ts (cookies, hash SHA-256), src/lib/uploads.ts (guardar imágenes en /uploads), src/lib/api-helpers.ts (requireUser, requireEditor, err, refreshLotAlerts).
- Creado src/components/ghs-pictograms.tsx: SVGs de los 9 pictogramas SGA/GHS (diamante rojo + símbolo blanco).
- Creado src/components/pictogram-selector.tsx: selector de pictogramas reutilizable.
- Creado src/store/app-store.ts (Zustand): section, selectedDrugId, activeLotId, inventoryWarehouseFilter, mobileNavOpen.
- Creado src/components/app-provider.tsx: QueryClientProvider + ThemeProvider + AuthContext (login/logout/refresh vía /api/auth/*).
- Creado src/components/app-shell.tsx: layout responsivo (sidebar desktop + bottom nav mobile + sheet móvil) con 9 secciones.
- Creado src/components/sections/login.tsx: pantalla de login con accesos rápidos de demo.
- Editados src/app/layout.tsx (añade AppProvider + Sonner) y src/app/page.tsx (shell o login).
- Seed ejecutado (prisma/seed.ts): 5 usuarios, 5 depósitos (1 principal + 4 secundarios), 14 drogas reales con pictogramas CAS, 18 lotes con QR, movimientos y alertas.
- Backend completo: API routes para auth (login/logout/me), drugs (GET/POST/[id] GET/PUT/DELETE), lots (GET/POST/[id] GET/PUT/DELETE/by-qr/[qr] GET), warehouses (GET/POST/[id] PUT/DELETE), movements (GET/POST con lógica de stock y sub-lotes), users (GET/POST/[id] PUT/DELETE), alerts (GET/[id]/resolve POST), stats (GET), uploads (POST/[name] GET), labels/[lotId] (GET).
- Frontend: Dashboard (stats, alertas, movimientos recientes, distribución por depósito) y Catalog (lista con búsqueda, detalle de droga con lotes, form alta/edición con selector de pictogramas).

Stage Summary:
- El proyecto compila excepto por las 7 secciones faltantes que se importan en app-shell.tsx: inventory, scanner, labels, movements, warehouses, reports, users.
- Usuarios de demo (password "droglab123"): admin@lab.org, encargado@lab.org, operario@lab.org, auditor@lab.org.
- Convenciones de código: 'use client' en componentes, fetch con cache:'no-store', TanStack Query para server state, toast de sonner, date-fns con locale es, cn de @/lib/utils.
- Los pictogramas se guardan como JSON string en el campo `pictograms` de Drug; parsear con JSON.parse.
- El QR de cada lote está en `lot.qrCode` (formato "DL-XXXXXXXX"). El escáner llama a GET /api/lots/by-qr/[qr].
- Para crear lotes, el backend genera el qrCode automáticamente.
- La app es una SPA: la única ruta es /. La navegación entre secciones se hace con useAppStore().setSection(...).

---
Task ID: 10
Agent: full-stack-developer
Task: Crear secciones movements.tsx, warehouses.tsx, reports.tsx, users.tsx

Work Log:
- Leí worklog.md, app-shell.tsx, store/app-store.ts, lib/constants.ts, app-provider.tsx, API routes (movements, warehouses, users, lots, stats, alerts), prisma/schema.prisma, y las secciones existentes (catalog, dashboard) para entender convenciones.
- Verifiqué exportación de helpers de permisos (isReadOnly/canEdit/isAdmin) — están en @/lib/auth.ts (server-side). En las nuevas secciones usé comparaciones directas de user.role para no importar nada server-only en cliente.
- Creé src/components/sections/movements.tsx (export `Movements`):
  * Filtros tipo/depósito/búsqueda + botón Limpiar.
  * Resumen con contadores total + por tipo.
  * Tabla en desktop (ScrollArea max-h-[70vh], header sticky), tarjetas en mobile.
  * Columnas: fecha/hora, tipo (badge coloreado), droga+lote, cantidad (con signo +/- según tipo), origen→destino, usuario, motivo.
  * Botón Registrar movimiento (visible ADMIN/ENCARGADO/OPERARIO, oculto AUDITOR) → Dialog con combobox buscable de lotes activos (Popover+Command), tipo Select (sin INGRESO), cantidad, depósito destino (solo TRANSFERENCIA), motivo Textarea. Para AJUSTE: stock actual (deshabilitado) + nuevo stock + diff calculado. POST /api/movements. Invalida queries movements/lots/stats/alerts.
  * queryKey: ["movements", typeFilter, warehouseFilter, debounced].
- Creé src/components/sections/warehouses.tsx (export `Warehouses`):
  * Grid de tarjetas con PRINCIPAL resaltado (borde teal + ring + badge esquina).
  * Info: nombre, código mono, ubicación, responsable, lotes asociados.
  * Marca "Tu depósito" si wh.id === user.warehouseId, e "Inactivo" si !active.
  * Click en tarjeta → setInventoryWarehouseFilter + setSection("inventory").
  * Botón Nuevo/Editar (ADMIN/ENCARGADO) → Dialog con form (nombre, código mono uppercase, tipo Select, ubicación, descripción, responsable Select de usuarios activos, switch activo solo en edición). POST/PUT /api/warehouses. Invalida queries warehouses/stats.
- Creé src/components/sections/reports.tsx (export `Reports`):
  * 4 Tabs: Inventario, Movimientos, Vencimientos, Stock bajo.
  * Tab Inventario: filtro por depósito, tabla de lotes (droga/lote/depósito/ubicación/cantidad/vencimiento/estado), badges total y stock total.
  * Tab Movimientos: filtros fecha desde/hasta + tipo. Tabla de movimientos filtrados en cliente.
  * Tab Vencimientos: lotes activos con expiryDate en los próximos 30 días o ya vencidos, ordenados por fecha, badge contextual (vencido/crítico/próximo) con días restantes. Usa EXPIRY_WARNING_DAYS de constants.
  * Tab Stock bajo: lotes activos con currentQuantity <= drug.minStock, agotados primero, badges Agotado/Stock bajo.
  * Cada reporte: botones "CSV" (BOM \ufeff, separador ;, escaping de comas/comillas, descarga con Blob+<a download>) e "Imprimir" (abre ventana popup con HTML+CSS propio, evita manipular document.body). Contenido print oculto en divs .hidden con id `print-{reporte}`.
- Creé src/components/sections/users.tsx (export `UsersSection`):
  * Si user.role !== "ADMIN" muestra cartel "Acceso restringido a administradores" con icono ShieldAlert.
  * Tabla desktop / tarjetas mobile con avatar (iniciales), nombre (con badge "Tú" si es el usuario actual, fila resaltada con bg teal), email, rol (badge coloreado por rol), depósito, estado activo/inactivo, fecha creación.
  * Botón Nuevo usuario → Dialog (nombre, email, password, rol Select, depósito Select opcional solo activos, switch activo). POST /api/users.
  * Editar → mismo form con password opcional (placeholder "vacío = no cambiar"). PUT /api/users/[id].
  * Eliminar → AlertDialog de confirmación, botón deshabilitado si es el propio usuario (también validado en backend). DELETE /api/users/[id].
- Todos los componentes son 'use client', usan TanStack Query, sonner toast, date-fns con locale es, cn de @/lib/utils, componentes shadcn/ui existentes. Diseño mobile-first con sm/md/lg. Sin colores indigo/azul como primarios (uso teal/emerald/violet/sky/amber/rose/slate según constants.ts).

Stage Summary:
- Archivos creados: src/components/sections/movements.tsx, warehouses.tsx, reports.tsx, users.tsx.
- 4 exports verificados: Movements, Warehouses, Reports, UsersSection (coinciden con imports en app-shell.tsx).
- Decisiones:
  * Combobox buscable de lotes con Popover+Command (estándar shadcn) en lugar de Select simple, porque la tarea pedía "Select buscable".
  * Para impresión se abre un popup con HTML propio (más robusto que manipular document.body.innerHTML y respeta el SPA). Se dejó un div .hidden con el contenido imprimible por si se quiere usar @media print después.
  * En warehouses, el toggle `active` solo aparece en edición (no en creación, porque el backend hace default true).
  * En reports, los lotes se cargan una sola vez con fetchLots() y se filtran en cliente por reporte (más simple que 4 queries diferentes).
  * En movements, el filtro de texto se aplica en cliente (sobre el resultado de la API) para poder buscar en usuario/motivo/droga/lote/depósitos.
- Cosas a revisar:
  * app-shell.tsx importa `isReadOnly` de "@/lib/constants" pero esa función NO está en constants.ts — está en "@/lib/auth.ts". Lo mismo hace api-helpers.ts. Esto es un bug preexistente que NO toqué en esta tarea (probablemente hace fallar el build server-side). El agente que arregle esto debería re-exportar isReadOnly/canEdit/isAdmin desde constants.ts o corregir los imports. Mientras tanto, las nuevas secciones NO usan esas funciones (usan comparaciones directas de role), así que no introducen nuevas dependencias rotas.
  * Las secciones inventory.tsx, scanner.tsx y labels.tsx también son importadas en app-shell.tsx; vi que inventory.tsx ya existe (creado por otro agente en paralelo). Falta confirmar que scanner.tsx y labels.tsx existan para que compile el proyecto completo.
  * El campo `minStock` en Drug es Float? (nullable) — si es null, el reporte de stock bajo usa 0 como mínimo. Confirmar semántica con el equipo.

---
Task ID: 7
Agent: full-stack-developer
Task: Crear secciones inventory.tsx, scanner.tsx, labels.tsx

Work Log:
- Leí worklog.md y los archivos existentes (app-shell, catalog, dashboard, app-provider, store, constants, schema, API routes de lots/movements/labels/uploads/by-qr) para entender convenciones y formas de datos.
- Creé `src/components/movement-dialog.tsx`: componente compartido reutilizable para registrar movimientos (CONSUMO, TRANSFERENCIA, DEVOLUCION, BAJA, AJUSTE). Soporta uso controlado (open/onOpenChange) o con trigger. Invalida queries ["lots"], ["lot",id], ["stats"], ["movements"] tras éxito.
- Creé `src/components/sections/inventory.tsx` (`export function Inventory`):
  * Listado con filtros (depósito via store, estado, búsqueda) usando useQuery ["lots", wh, status, q].
  * Tarjetas de lote con droga+pictogramas, n° lote, QR mono, depósito+ubicación, stock actual/inicial + barra de progreso, vencimiento (rojo/ámbar/muted), badge de estado.
  * Botón "Nuevo lote" (ADMIN/ENCARGADO) → Dialog con selector de droga buscable + form completo → POST /api/lots.
  * Detalle inline (vía activeLotId del store): info completa, pictogramas, foto del envase (img + upload → POST /api/uploads → PUT /api/lots/[id]), acciones rápidas (Consumo/Transferir/Devolución/Baja/Ajuste según rol) con MovementDialog, historial de movimientos (GET /api/lots/[id]?full=1).
- Creé `src/components/sections/scanner.tsx` (`export function Scanner`):
  * Botón iniciar/detener cámara con html5-qrcode (facingMode environment), overlay con marco de escaneo, manejo de permisos denegados.
  * Al detectar QR → GET /api/lots/by-qr/[qr] → detiene cámara y muestra tarjeta del lote (droga+pictogramas, lote, depósito, stock, vencimiento).
  * Acciones: Ver en inventario (setActiveLotId + setSection), Registrar consumo, Transferir (MovementDialog controlado), Ver movimientos. Tras movimiento refresca el lote encontrado.
  * Búsqueda manual de QR por texto. Guard anti-doble-decodificación. Limpieza de cámara en unmount.
- Creé `src/components/sections/labels.tsx` (`export function Labels`):
  * Buscador de lotes (GET /api/lots?q=) + lista seleccionable.
  * Vista previa de etiqueta con datos de GET /api/labels/[lotId] y QR generado con qrcode.toDataURL(lot.qrCode).
  * Etiqueta con: QR grande, nombre químico, pictogramas SGA, ubicación (lot.location con fallback a drug.defaultLocation del lote de búsqueda), n° lote, CAS, vencimiento.
  * Selector de tamaño (LABEL_SIZES XS–XL + personalizado con inputs mm). Escalado de QR/texto/pictogramas según minDim.
  * Botón imprimir con CSS @media print inyectado (oculta todo salvo .print-label, posición absoluta, print-color-adjust exact).

Stage Summary:
- Archivos creados: src/components/movement-dialog.tsx, src/components/sections/inventory.tsx, src/components/sections/scanner.tsx, src/components/sections/labels.tsx.
- Decisiones clave: (1) creé un MovementDialog compartido para no duplicar lógica de movimientos entre inventory y scanner; (2) el detalle de lote en inventory es inline (vía activeLotId) para preservar filtros y permitir llegada desde el escáner; (3) el escáner refresca el lote encontrado tras un movimiento en lugar de resetear; (4) la etiqueta usa fallback de defaultLocation del objeto lote de búsqueda porque /api/labels/[lotId] no expone drug.defaultLocation.
- Cosas a revisar: (a) el dev server sigue sin compilar app-shell porque faltan las secciones movements, warehouses, reports, users (no son de esta tarea); (b) para impresión real conviene probar el @media print en el navegador del usuario, ya que el escalado de fuente en mm puede variar entre navegadores; (c) el paquete `qrcode` se usa en cliente como pide el enunciado — si diera problemas de bundle en Next 16, una alternativa es generar el QR en un endpoint API, pero funcionó según la convención indicada.
