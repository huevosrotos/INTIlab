import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { randomBytes } from "crypto"
import { sendPasswordResetEmail } from "@/lib/email"

export async function POST(req: NextRequest) {
  const { email } = await req.json().catch(() => ({}))
  if (!email) return NextResponse.json({ error: "Email requerido" }, { status: 400 })

  const user = await db.user.findUnique({ where: { email: String(email).toLowerCase() } })
  // Por seguridad, siempre devolver ok (no revelar si el email existe)
  if (!user || !user.active) {
    return NextResponse.json({ ok: true })
  }

  // Generar token de 32 bytes (64 chars hex)
  const token = randomBytes(32).toString("hex")
  const expiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

  await db.user.update({
    where: { id: user.id },
    data: {
      resetToken: token,
      resetTokenExpiry: expiry,
    },
  })

  // Enviar email
  const origin = req.headers.get("origin") || `https://${req.headers.get("host")}`
  const result = await sendPasswordResetEmail(user.email, user.name, token, origin)

  if (result.dev) {
    // En desarrollo (sin SMTP), devolver el link para testing
    return NextResponse.json({ ok: true, devLink: result.link })
  }

  if (!result.ok) {
    return NextResponse.json({ error: "No se pudo enviar el email" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
