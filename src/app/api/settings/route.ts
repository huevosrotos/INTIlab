import { NextRequest, NextResponse } from "next/server"
import { requireUser, requireEditor, err } from "@/lib/api-helpers"
import { getSettings, setSettings, SETTING_KEYS, SETTING_LABELS } from "@/lib/settings"
import { sendTestEmail } from "@/lib/email"

export async function GET() {
  const r = await requireUser()
  if (!r.ok) return r.res
  // Solo admin puede ver la configuración completa
  if (r.user.role !== "ADMIN") return err("Permisos insuficientes", 403)

  const allKeys = [
    ...SETTING_KEYS.smtp,
    ...SETTING_KEYS.alerts,
    ...SETTING_KEYS.system,
  ]
  const settings = await getSettings(allKeys)
  return NextResponse.json({ settings, labels: SETTING_LABELS })
}

export async function PUT(req: NextRequest) {
  const r = await requireEditor()
  if (!r.ok) return r.res
  if (r.user.role !== "ADMIN") return err("Permisos insuficientes", 403)

  const body = await req.json()
  const allowedKeys = new Set([
    ...SETTING_KEYS.smtp,
    ...SETTING_KEYS.alerts,
    ...SETTING_KEYS.system,
  ])

  const toSave: Record<string, string> = {}
  for (const [key, value] of Object.entries(body)) {
    if (allowedKeys.has(key)) {
      toSave[key] = String(value)
    }
  }

  await setSettings(toSave)
  return NextResponse.json({ ok: true })
}

// Enviar email de prueba
export async function POST(req: NextRequest) {
  const r = await requireEditor()
  if (!r.ok) return r.res
  if (r.user.role !== "ADMIN") return err("Permisos insuficientes", 403)

  const { testEmail } = await req.json()
  if (!testEmail) return err("Email de prueba requerido")

  const result = await sendTestEmail(testEmail)
  if (!result.ok) return err(result.error || "Error al enviar email")
  return NextResponse.json({ ok: true })
}
