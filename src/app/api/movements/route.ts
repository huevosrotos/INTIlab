import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireUser, requireEditor, err, refreshLotAlerts } from "@/lib/api-helpers"

export async function GET(req: NextRequest) {
  const r = await requireUser()
  if (!r.ok) return r.res
  const { searchParams } = new URL(req.url)
  const lotId = searchParams.get("lotId")
  const type = searchParams.get("type")
  const warehouseId = searchParams.get("warehouseId")
  const limit = Number(searchParams.get("limit") || 100)

  const where: any = {}
  if (lotId) where.lotId = lotId
  if (type) where.type = type
  if (warehouseId) {
    where.OR = [{ fromWarehouseId: warehouseId }, { toWarehouseId: warehouseId }]
  }

  const movements = await db.movement.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: Math.min(limit, 500),
    include: {
      lot: { include: { drug: true } },
      user: { select: { id: true, name: true, role: true } },
      fromWarehouse: true,
      toWarehouse: true,
    },
  })
  return NextResponse.json({ movements })
}

export async function POST(req: NextRequest) {
  const r = await requireEditor()
  if (!r.ok) return r.res
  const body = await req.json()

  const { lotId, type, toWarehouseId, reason } = body
  if (!lotId || !type) return err("Faltan datos del movimiento")

  const lot = await db.lot.findUnique({ where: { id: lotId }, include: { drug: true } })
  if (!lot) return err("Lote no encontrado")

  const fromWarehouseId = lot.warehouseId
  let newBalance = lot.currentQuantity
  let updatedLotId = lot.id
  let movementQuantity = lot.currentQuantity // por defecto, el frasco completo

  switch (type) {
    case "INGRESO": {
      const qty = Number(body.quantity)
      if (isNaN(qty) || qty <= 0) return err("La cantidad debe ser mayor a 0")
      if (!toWarehouseId) return err("Debe indicar el depósito de destino")
      newBalance = lot.currentQuantity + qty
      await db.lot.update({
        where: { id: lot.id },
        data: {
          currentQuantity: newBalance,
          warehouseId: toWarehouseId,
          initialQuantity: lot.initialQuantity + qty,
          status: "ACTIVO",
          receivedDate: lot.receivedDate ?? new Date(),
        },
      })
      movementQuantity = qty
      break
    }
    case "TRANSFERENCIA": {
      // Transferencia de frasco completo: el lote entero cambia de depósito.
      // No se permiten fracciones (coherente con el modelo de frasco completo).
      if (!toWarehouseId) return err("Debe indicar el depósito de destino")
      if (toWarehouseId === fromWarehouseId) return err("El depósito origen y destino son el mismo")
      // Se pueden transferir lotes activos o vencidos (sigue siendo válido moverlo)
      if (lot.status !== "ACTIVO" && lot.status !== "VENCIDO")
        return err("Solo se pueden transferir lotes activos o vencidos")
      // Mover todo el lote al nuevo depósito
      newBalance = lot.currentQuantity
      movementQuantity = lot.currentQuantity
      await db.lot.update({
        where: { id: lot.id },
        data: { warehouseId: toWarehouseId },
      })
      break
    }
    case "HABILITACION": {
      // Habilitar frasco para uso: ACTIVO o VENCIDO → EN_USO.
      // Si se indica depósito destino, el frasco se traslada ahí (laboratorio/sector).
      if (lot.status !== "ACTIVO" && lot.status !== "VENCIDO")
        return err("Solo se pueden habilitar lotes activos o vencidos")
      await db.lot.update({
        where: { id: lot.id },
        data: {
          status: "EN_USO",
          warehouseId: toWarehouseId || fromWarehouseId,
          openedDate: lot.openedDate ?? new Date(),
        },
      })
      movementQuantity = lot.currentQuantity
      break
    }
    case "CONSUMO": {
      // Consumo de frasco completo: EN_USO o VENCIDO → CONSUMIDO, stock a 0
      if (lot.status !== "EN_USO" && lot.status !== "VENCIDO")
        return err("Solo se pueden consumir lotes habilitados para uso (EN_USO) o vencidos")
      movementQuantity = lot.currentQuantity
      newBalance = 0
      await db.lot.update({
        where: { id: lot.id },
        data: {
          currentQuantity: 0,
          status: "CONSUMIDO",
          consumedDate: new Date(),
        },
      })
      break
    }
    case "DEVOLUCION": {
      // Devolver frasco al depósito: EN_USO → ACTIVO (sin cambiar stock)
      // (los vencidos no se devuelven porque ya no están "en uso")
      if (lot.status !== "EN_USO") return err("Solo se pueden devolver lotes habilitados para uso (EN_USO)")
      await db.lot.update({
        where: { id: lot.id },
        data: { status: "ACTIVO" },
      })
      movementQuantity = lot.currentQuantity
      break
    }
    case "BAJA": {
      // Dar de baja el frasco completo: cualquier estado (excepto DADO_DE_BAJA) → DADO_DE_BAJA, stock a 0
      if (lot.status === "DADO_DE_BAJA") return err("El lote ya está dado de baja")
      movementQuantity = lot.currentQuantity
      newBalance = 0
      await db.lot.update({
        where: { id: lot.id },
        data: {
          currentQuantity: 0,
          status: "DADO_DE_BAJA",
          discardedDate: new Date(),
        },
      })
      break
    }
    case "AJUSTE": {
      // Ajuste manual de inventario (corrección)
      const diff = Number(body.diff)
      if (isNaN(diff) || diff === 0) return err("La diferencia debe ser distinta de 0")
      newBalance = Math.max(0, lot.currentQuantity + diff)
      await db.lot.update({
        where: { id: lot.id },
        data: {
          currentQuantity: newBalance,
          status: newBalance <= 0 ? "CONSUMIDO" : lot.status === "CONSUMIDO" ? "ACTIVO" : lot.status,
        },
      })
      movementQuantity = diff
      break
    }
    default:
      return err("Tipo de movimiento no válido")
  }

  const movement = await db.movement.create({
    data: {
      lotId,
      type,
      fromWarehouseId: fromWarehouseId,
      toWarehouseId: toWarehouseId || null,
      quantity: movementQuantity,
      balanceAfter: newBalance,
      userId: r.user.id,
      reason: reason || null,
    },
    include: {
      lot: { include: { drug: true } },
      user: { select: { id: true, name: true } },
    },
  })

  await refreshLotAlerts(lot.id)
  if (updatedLotId !== lot.id) await refreshLotAlerts(updatedLotId)

  return NextResponse.json({ movement, lot: { id: updatedLotId, currentQuantity: newBalance } })
}
