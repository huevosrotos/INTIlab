import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireUser, requireEditor, err, refreshLotAlerts } from "@/lib/api-helpers"
import { normalizeText } from "@/lib/search"
import { randomBytes } from "crypto"

function genQrCode(): string {
  return "DL-" + randomBytes(4).toString("hex").toUpperCase()
}

export async function GET(req: NextRequest) {
  const r = await requireUser()
  if (!r.ok) return r.res
  const { searchParams } = new URL(req.url)
  const warehouseId = searchParams.get("warehouseId")
  const drugId = searchParams.get("drugId")
  const status = searchParams.get("status")
  const q = searchParams.get("q")?.trim()

  const where: any = {}
  if (warehouseId && warehouseId !== "ALL") where.warehouseId = warehouseId
  if (drugId) where.drugId = drugId
  if (status) where.status = status
  if (q) {
    const qPrefix = q.substring(0, 3)
    where.OR = [
      { lotNumber: { contains: q } },
      { qrCode: { contains: q } },
      { drug: { chemicalName: { contains: qPrefix } } },
      { drug: { commercialName: { contains: qPrefix } } },
    ]
  }

  let lots = await db.lot.findMany({
    where,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      drug: true,
      warehouse: true,
    },
  })

  // Refinar búsqueda en memoria con normalización de acentos
  if (q) {
    const qNorm = normalizeText(q)
    lots = lots.filter((l) => {
      const fields = [
        l.lotNumber,
        l.qrCode,
        l.drug?.chemicalName || "",
        l.drug?.commercialName || "",
      ]
      return fields.some((f) => normalizeText(f).includes(qNorm))
    })
  }

  return NextResponse.json({ lots })
}

export async function POST(req: NextRequest) {
  const r = await requireEditor()
  if (!r.ok) return r.res
  const body = await req.json()

  if (!body.drugId) return err("Debe seleccionar una droga")
  if (!body.lotNumber) return err("El número de lote es obligatorio")
  if (!body.initialQuantity || Number(body.initialQuantity) <= 0)
    return err("La cantidad inicial debe ser mayor a 0")

  const drug = await db.drug.findUnique({ where: { id: body.drugId } })
  if (!drug) return err("Droga no encontrada")

  const warehouseId = body.warehouseId || drug.defaultWarehouseId
  const quantity = Number(body.initialQuantity)

  const lot = await db.lot.create({
    data: {
      drugId: body.drugId,
      lotNumber: body.lotNumber,
      qrCode: genQrCode(),
      expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
      supplier: body.supplier || null,
      purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
      initialQuantity: quantity,
      currentQuantity: quantity,
      unit: body.unit || drug.unit || "g",
      warehouseId,
      location: body.location || drug.defaultLocation || null,
      purity: body.purity?.trim() || null,
      notes: body.notes?.trim() || null,
      status: "ACTIVO",
      receivedDate: body.receivedDate ? new Date(body.receivedDate) : new Date(),
    },
    include: { drug: true, warehouse: true },
  })

  // Movimiento de ingreso
  await db.movement.create({
    data: {
      lotId: lot.id,
      type: "INGRESO",
      toWarehouseId: warehouseId,
      quantity,
      balanceAfter: quantity,
      userId: r.user.id,
      reason: `Ingreso inicial - Lote ${body.lotNumber}`,
    },
  })

  await refreshLotAlerts(lot.id)
  return NextResponse.json({ lot })
}
