import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireUser, requireEditor, err } from "@/lib/api-helpers"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const r = await requireUser()
  if (!r.ok) return r.res
  const { id } = await params
  const drug = await db.drug.findUnique({
    where: { id },
    include: {
      lots: {
        orderBy: { createdAt: "desc" },
        include: { warehouse: true, movements: { orderBy: { createdAt: "desc" }, take: 5, include: { user: true } } },
      },
    },
  })
  if (!drug) return err("Droga no encontrada", 404)
  return NextResponse.json({ drug })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const r = await requireEditor()
  if (!r.ok) return r.res
  const { id } = await params
  const body = await req.json()
  const existing = await db.drug.findUnique({ where: { id } })
  if (!existing) return err("Droga no encontrada", 404)

  const drug = await db.drug.update({
    where: { id },
    data: {
      code: body.code !== undefined ? body.code : undefined,
      chemicalName: body.chemicalName,
      commercialName: body.commercialName || null,
      cas: body.cas || null,
      formula: body.formula || null,
      molecularWeight: body.molecularWeight ? Number(body.molecularWeight) : null,
      purity: body.purity || null,
      physicalState: body.physicalState || "OTRO",
      hazardClass: body.hazardClass || null,
      pictograms: JSON.stringify(body.pictograms || []),
      hStatements: body.hStatements ? JSON.stringify(body.hStatements) : null,
      chemicalClasses: body.chemicalClasses ? JSON.stringify(body.chemicalClasses) : undefined,
      defaultWarehouseId: body.defaultWarehouseId || null,
      defaultLocation: body.defaultLocation || null,
      minStock: body.minStock != null ? Number(body.minStock) : 0,
      unit: body.unit || "g",
      sdsUrl: body.sdsUrl || null,
      notes: body.notes || null,
      active: body.active ?? true,
    },
  })
  return NextResponse.json({ drug })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const r = await requireEditor()
  if (!r.ok) return r.res
  const { id } = await params
  const lotCount = await db.lot.count({ where: { drugId: id } })
  if (lotCount > 0) return err("No se puede eliminar: tiene lotes asociados. Desactive la droga en su lugar.", 409)
  await db.drug.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
