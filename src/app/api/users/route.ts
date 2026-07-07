import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireUser, err } from "@/lib/api-helpers"
import { isAdmin } from "@/lib/auth"

export async function GET() {
  const r = await requireUser()
  if (!r.ok) return r.res
  const users = await db.user.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      active: true,
      warehouseId: true,
      warehouse: { select: { id: true, name: true, code: true } },
      createdAt: true,
    },
  })
  return NextResponse.json({ users })
}

export async function POST(req: NextRequest) {
  const r = await requireUser()
  if (!r.ok) return r.res
  if (!isAdmin(r.user.role)) return err("Solo el administrador puede crear usuarios", 403)

  const body = await req.json()
  if (!body.email || !body.name || !body.password) return err("Faltan datos")
  const existing = await db.user.findUnique({ where: { email: String(body.email).toLowerCase() } })
  if (existing) return err("Ya existe un usuario con ese correo")

  const { hashPassword } = await import("@/lib/auth")
  const user = await db.user.create({
    data: {
      email: String(body.email).toLowerCase(),
      name: body.name,
      password: hashPassword(body.password),
      role: body.role || "OPERARIO",
      warehouseId: body.warehouseId || null,
      active: body.active ?? true,
    },
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
