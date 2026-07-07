import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireUser, requireEditor, err } from "@/lib/api-helpers"

export async function GET(req: NextRequest) {
  const r = await requireUser()
  if (!r.ok) return r.res
  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q")?.trim()
  const warehouseId = searchParams.get("warehouseId")

  const where: any = {}
  if (q) {
    where.OR = [
      { chemicalName: { contains: q } },
      { commercialName: { contains: q } },
      { cas: { contains: q } },
      { formula: { contains: q } },
    ]
  }

  const drugs = await db.drug.findMany({
    where,
    orderBy: { chemicalName: "asc" },
    include: {
      lots: {
        where: warehouseId ? { warehouseId } : undefined,
        select: {
          id: true,
          currentQuantity: true,
          unit: true,
          status: true,
          expiryDate: true,
          lotNumber: true,
          warehouseId: true,
        },
      },
    },
  })

  const result = drugs.map((d) => {
    const activeLots = d.lots.filter((l) => l.status === "ACTIVO")
    const totalStock = activeLots.reduce((s, l) => s + l.currentQuantity, 0)
    return {
      id: d.id,
      chemicalName: d.chemicalName,
      commercialName: d.commercialName,
      cas: d.cas,
      formula: d.formula,
      molecularWeight: d.molecularWeight,
      purity: d.purity,
      physicalState: d.physicalState,
      hazardClass: d.hazardClass,
      pictograms: d.pictograms,
      hStatements: d.hStatements,
      defaultWarehouseId: d.defaultWarehouseId,
      defaultLocation: d.defaultLocation,
      minStock: d.minStock,
      unit: d.unit,
      sdsUrl: d.sdsUrl,
      notes: d.notes,
      active: d.active,
      createdAt: d.createdAt,
      lotCount: d.lots.length,
      activeLotCount: activeLots.length,
      totalStock,
    }
  })

  return NextResponse.json({ drugs: result })
}

export async function POST(req: NextRequest) {
  const r = await requireEditor()
  if (!r.ok) return r.res
  const body = await req.json()

  if (!body.chemicalName) return err("El nombre químico es obligatorio")

  const drug = await db.drug.create({
    data: {
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
      defaultWarehouseId: body.defaultWarehouseId || null,
      defaultLocation: body.defaultLocation || null,
      minStock: body.minStock != null ? Number(body.minStock) : 0,
      unit: body.unit || "g",
      sdsUrl: body.sdsUrl || null,
      notes: body.notes || null,
    },
  })
  return NextResponse.json({ drug })
}
