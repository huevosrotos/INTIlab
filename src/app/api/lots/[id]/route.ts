import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireUser, requireEditor, err, refreshLotAlerts } from "@/lib/api-helpers"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const r = await requireUser()
  if (!r.ok) return r.res
  const { id } = await params
  const { searchParams } = new URL(req.url)
  const full = searchParams.get("full")

  const lot = await db.lot.findUnique({
    where: { id },
    include: {
      drug: true,
      warehouse: true,
      movements: full
        ? { orderBy: { createdAt: "desc" }, include: { user: true, fromWarehouse: true, toWarehouse: true } }
        : { orderBy: { createdAt: "desc" }, take: 10, include: { user: true } },
      alerts: { orderBy: { createdAt: "desc" } },
    },
  })
  if (!lot) return err("Lote no encontrado", 404)
  return NextResponse.json({ lot })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const r = await requireEditor()
  if (!r.ok) return r.res
  const { id } = await params
  const body = await req.json()
  const existing = await db.lot.findUnique({ where: { id } })
  if (!existing) return err("Lote no encontrado", 404)

  // Distinguir "campo no enviado" (undefined) de "campo enviado como null"
  // para permitir eliminar la foto con null explícito.
  const data: any = {
    lotNumber: body.lotNumber,
    expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
    supplier: body.supplier || null,
    purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
    warehouseId: body.warehouseId || null,
    location: body.location || null,
    status: body.status ?? existing.status,
  }
  // Solo actualizar fotos si el campo vino explícitamente en el body
  // (permite setear a null para eliminar)
  if (body.containerPhoto !== undefined) {
    data.containerPhoto = body.containerPhoto
  }
  if (body.labelPhoto !== undefined) {
    data.labelPhoto = body.labelPhoto
  }

  const lot = await db.lot.update({
    where: { id },
    data,
    include: { drug: true, warehouse: true },
  })
  await refreshLotAlerts(id)
  return NextResponse.json({ lot })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const r = await requireEditor()
  if (!r.ok) return r.res
  const { id } = await params
  const movCount = await db.movement.count({ where: { lotId: id } })
  if (movCount > 1) return err("No se puede eliminar: tiene movimientos registrados", 409)
  await db.alert.deleteMany({ where: { lotId: id } })
  await db.movement.deleteMany({ where: { lotId: id } })
  await db.lot.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
