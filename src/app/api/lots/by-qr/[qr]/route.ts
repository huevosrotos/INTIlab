import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireUser, err } from "@/lib/api-helpers"

// Extrae el código DL-XXXX de un valor que puede ser:
//  - código plano: "DL-C9368216"
//  - URL completa: "http://.../?qr=DL-C9368216"
function extractCode(raw: string): string {
  const trimmed = raw.trim()
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed)
      const qr = url.searchParams.get("qr")
      if (qr) return qr
    } catch {}
  }
  return trimmed
}

// Búsqueda de lote por código QR (usado por el escáner)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ qr: string }> }
) {
  const r = await requireUser()
  if (!r.ok) return r.res
  const { qr } = await params
  const code = extractCode(decodeURIComponent(qr))
  const lot = await db.lot.findFirst({
    where: { qrCode: code },
    include: { drug: true, warehouse: true },
  })
  if (!lot) return err("No se encontró ningún lote con ese código QR", 404)
  return NextResponse.json({ lot })
}
