import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hashPassword } from "@/lib/auth"

export async function POST(req: NextRequest) {
  const { token, password } = await req.json().catch(() => ({}))

  if (!token || !password) {
    return NextResponse.json({ error: "Token y contraseña requeridos" }, { status: 400 })
  }

  if (password.length < 4) {
    return NextResponse.json({ error: "La contraseña debe tener al menos 4 caracteres" }, { status: 400 })
  }

  // Buscar usuario por token válido (no expirado)
  const user = await db.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiry: { gt: new Date() },
    },
  })

  if (!user) {
    return NextResponse.json({ error: "Token inválido o expirado" }, { status: 400 })
  }

  // Actualizar contraseña y limpiar token
  await db.user.update({
    where: { id: user.id },
    data: {
      password: hashPassword(password),
      resetToken: null,
      resetTokenExpiry: null,
    },
  })

  return NextResponse.json({ ok: true })
}
