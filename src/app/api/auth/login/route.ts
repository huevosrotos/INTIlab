import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hashPassword, verifyPassword, setSessionCookie } from "@/lib/auth"

export async function POST(req: NextRequest) {
  const { email, password } = await req.json().catch(() => ({}))
  if (!email || !password) {
    return NextResponse.json({ error: "Faltan credenciales" }, { status: 400 })
  }
  const user = await db.user.findUnique({
    where: { email: String(email).toLowerCase() },
    include: { warehouse: true },
  })
  if (!user || !user.active) {
    return NextResponse.json({ error: "Usuario no encontrado o inactivo" }, { status: 401 })
  }
  if (!verifyPassword(password, user.password)) {
    return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 })
  }
  await setSessionCookie(user.id)
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      warehouseId: user.warehouseId,
      warehouse: user.warehouse
        ? {
            id: user.warehouse.id,
            name: user.warehouse.name,
            code: user.warehouse.code,
            type: user.warehouse.type,
          }
        : null,
    },
  })
}
