import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireUser, requireEditor, err, refreshLotAlerts } from "@/lib/api-helpers"
import { randomBytes } from "crypto"

function genQrCode(): string {
  return "DL-" + randomBytes(4).toString("hex").toUpperCase()
}

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

  const { lotId, type, quantity, toWarehouseId, reason } = body
  if (!lotId || !type) return err("Faltan datos del movimiento")
  const qty = Number(quantity)
  if (isNaN(qty) || qty <= 0) return err("La cantidad debe ser mayor a 0")

  const lot = await db.lot.findUnique({ where: { id: lotId }, include: { drug: true } })
  if (!lot) return err("Lote no encontrado")

  const fromWarehouseId = lot.warehouseId
  let newBalance = lot.currentQuantity
  let updatedLotId = lot.id

  switch (type) {
    case "INGRESO": {
      if (!toWarehouseId) return err("Debe indicar el depósito de destino")
      newBalance = lot.currentQuantity + qty
      await db.lot.update({
        where: { id: lot.id },
        data: {
          currentQuantity: newBalance,
          warehouseId: toWarehouseId,
          initialQuantity: lot.initialQuantity + qty,
          status: "ACTIVO",
        },
      })
      break
    }
    case "TRANSFERENCIA": {
      if (!toWarehouseId) return err("Debe indicar el depósito de destino")
      if (toWarehouseId === fromWarehouseId) return err("El depósito origen y destino son el mismo")
      if (qty >= lot.currentQuantity) {
        // Mover todo el lote
        newBalance = lot.currentQuantity
        await db.lot.update({
          where: { id: lot.id },
          data: { warehouseId: toWarehouseId },
        })
      } else {
        // Transferencia parcial: crear sub-lote en destino
        newBalance = lot.currentQuantity - qty
        await db.lot.update({
          where: { id: lot.id },
          data: { currentQuantity: newBalance },
        })
        const subLot = await db.lot.create({
          data: {
            drugId: lot.drugId,
            lotNumber: lot.lotNumber,
            qrCode: genQrCode(),
            expiryDate: lot.expiryDate,
            supplier: lot.supplier,
            purchaseDate: lot.purchaseDate,
            initialQuantity: qty,
            currentQuantity: qty,
            unit: lot.unit,
            warehouseId: toWarehouseId,
            location: lot.location,
            status: "ACTIVO",
          },
        })
        updatedLotId = subLot.id
        // Registrar movimiento de ingreso del sublote
        await db.movement.create({
          data: {
            lotId: subLot.id,
            type: "INGRESO",
            toWarehouseId,
            quantity: qty,
            balanceAfter: qty,
            userId: r.user.id,
            reason: `Ingreso por transferencia desde ${lot.lotNumber}`,
          },
        })
        await refreshLotAlerts(subLot.id)
      }
      break
    }
    case "CONSUMO": {
      if (qty > lot.currentQuantity) return err("La cantidad a consumir excede el stock disponible")
      newBalance = lot.currentQuantity - qty
      await db.lot.update({
        where: { id: lot.id },
        data: {
          currentQuantity: newBalance,
          status: newBalance <= 0 ? "AGOTADO" : lot.status,
        },
      })
      break
    }
    case "DEVOLUCION": {
      newBalance = lot.currentQuantity + qty
      await db.lot.update({
        where: { id: lot.id },
        data: { currentQuantity: newBalance, status: "ACTIVO" },
      })
      break
    }
    case "BAJA": {
      if (qty > lot.currentQuantity) return err("La cantidad a dar de baja excede el stock disponible")
      newBalance = lot.currentQuantity - qty
      await db.lot.update({
        where: { id: lot.id },
        data: {
          currentQuantity: newBalance,
          status: newBalance <= 0 ? "DADO_DE_BAJA" : lot.status,
        },
      })
      break
    }
    case "AJUSTE": {
      // qty es la diferencia: positivo suma, negativo resta
      const diff = Number(body.diff ?? qty)
      newBalance = Math.max(0, lot.currentQuantity + diff)
      await db.lot.update({
        where: { id: lot.id },
        data: {
          currentQuantity: newBalance,
          status: newBalance <= 0 ? "AGOTADO" : lot.status,
        },
      })
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
      quantity: type === "AJUSTE" ? Number(body.diff ?? qty) : qty,
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
