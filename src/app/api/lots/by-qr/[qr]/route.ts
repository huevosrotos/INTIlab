import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireUser, err } from "@/lib/api-helpers"

// Búsqueda de lote por código QR (usado por el escáner)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ qr: string }> }
) {
  const r = await requireUser()
  if (!r.ok) return r.res
  const { qr } = await params
  const code = decodeURIComponent(qr).trim()
  const lot = await db.lot.findFirst({
    where: { qrCode: code },
    include: { drug: true, warehouse: true },
  })
  if (!lot) return err("No se encontró ningún lote con ese código QR", 404)
  return NextResponse.json({ lot })
}
