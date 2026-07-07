import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireUser, err } from "@/lib/api-helpers"

// Datos para imprimir la etiqueta QR de un lote
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ lotId: string }> }
) {
  const r = await requireUser()
  if (!r.ok) return r.res
  const { lotId } = await params
  const lot = await db.lot.findUnique({
    where: { id: lotId },
    include: { drug: true, warehouse: true },
  })
  if (!lot) return err("Lote no encontrado", 404)

  return NextResponse.json({
    lot: {
      id: lot.id,
      qrCode: lot.qrCode,
      lotNumber: lot.lotNumber,
      expiryDate: lot.expiryDate,
      unit: lot.unit,
      location: lot.location,
    },
    drug: {
      id: lot.drug.id,
      chemicalName: lot.drug.chemicalName,
      commercialName: lot.drug.commercialName,
      cas: lot.drug.cas,
      pictograms: lot.drug.pictograms,
      hazardClass: lot.drug.hazardClass,
    },
    warehouse: lot.warehouse
      ? { id: lot.warehouse.id, name: lot.warehouse.name, code: lot.warehouse.code }
      : null,
  })
}
