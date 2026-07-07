import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireUser, err } from "@/lib/api-helpers"
import { isAdmin } from "@/lib/auth"

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const r = await requireUser()
  if (!r.ok) return r.res
  if (!isAdmin(r.user.role)) return err("Solo el administrador puede editar usuarios", 403)
  const { id } = await params
  const body = await req.json()

  const data: any = {
    name: body.name,
    email: String(body.email).toLowerCase(),
    role: body.role,
    warehouseId: body.warehouseId || null,
    active: body.active ?? true,
  }
  if (body.password) {
    const { hashPassword } = await import("@/lib/auth")
    data.password = hashPassword(body.password)
  }

  const user = await db.user.update({
    where: { id },
    data,
    include: { warehouse: { select: { id: true, name: true, code: true } } },
  })
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      active: user.active,
      warehouseId: user.warehouseId,
      warehouse: user.warehouse,
    },
  })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const r = await requireUser()
  if (!r.ok) return r.res
  if (!isAdmin(r.user.role)) return err("Solo el administrador puede eliminar usuarios", 403)
  const { id } = await params
  if (id === r.user.id) return err("No puede eliminar su propio usuario", 400)
  await db.user.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
