import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireUser, requireEditor, err } from "@/lib/api-helpers"

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const r = await requireEditor()
  if (!r.ok) return r.res
  const { id } = await params
  const body = await req.json()
  const warehouse = await db.warehouse.update({
    where: { id },
    data: {
      name: body.name,
      code: body.code,
      type: body.type,
      location: body.location || null,
      description: body.description || null,
      responsibleId: body.responsibleId || null,
      active: body.active ?? true,
    },
  })
  return NextResponse.json({ warehouse })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const r = await requireEditor()
  if (!r.ok) return r.res
  const { id } = await params
  const lotCount = await db.lot.count({ where: { warehouseId: id } })
  if (lotCount > 0) return err("No se puede eliminar: tiene lotes asociados. Desactive el depósito.", 409)
  await db.warehouse.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
