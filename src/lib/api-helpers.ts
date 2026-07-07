import { NextResponse } from "next/server"
import { getSessionUser, type User } from "@/lib/auth"
import { db } from "@/lib/db"
import { isReadOnly, canEdit } from "@/lib/auth"

export async function requireUser(): Promise<
  { ok: true; user: User } | { ok: false; res: NextResponse }
> {
  const user = await getSessionUser()
  if (!user) {
    return {
      ok: false,
      res: NextResponse.json({ error: "No autenticado" }, { status: 401 }),
    }
  }
  return { ok: true, user }
}

export async function requireEditor(): Promise<
  { ok: true; user: User } | { ok: false; res: NextResponse }
> {
  const r = await requireUser()
  if (!r.ok) return r
  if (isReadOnly(r.user.role) || !canEdit(r.user.role)) {
    return {
      ok: false,
      res: NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 }),
    }
  }
  return r
}

export function err(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status })
}

// Recalcula alertas de un lote (vencimiento y stock)
export async function refreshLotAlerts(lotId: string) {
  const lot = await db.lot.findUnique({
    where: { id: lotId },
    include: { drug: true },
  })
  if (!lot) return
  // Marcar existentes como resueltas y regenerar
  await db.alert.updateMany({
    where: { lotId, resolved: false },
    data: { resolved: true, resolvedAt: new Date() },
  })

  const now = new Date()
  const drug = lot.drug
  const minStock = drug.minStock ?? 0

  if (lot.currentQuantity <= 0) {
    await db.alert.create({
      data: {
        lotId,
        type: "STOCK_AGOTADO",
        severity: "CRITICAL",
        message: `Stock agotado: ${drug.chemicalName} (lote ${lot.lotNumber})`,
      },
    })
  } else if (lot.currentQuantity <= minStock) {
    await db.alert.create({
      data: {
        lotId,
        type: "STOCK_BAJO",
        severity: "WARNING",
        message: `Stock bajo: ${drug.chemicalName} (lote ${lot.lotNumber}) - ${lot.currentQuantity} ${lot.unit} (mín. ${minStock})`,
      },
    })
  }

  if (lot.expiryDate) {
    const daysToExpiry = Math.ceil(
      (lot.expiryDate.getTime() - now.getTime()) / 86400000
    )
    if (daysToExpiry < 0) {
      await db.alert.create({
        data: {
          lotId,
          type: "VENCIMIENTO",
          severity: "CRITICAL",
          message: `Vencido: ${drug.chemicalName} (lote ${lot.lotNumber}) venció el ${lot.expiryDate.toLocaleDateString("es-AR")}`,
        },
      })
    } else if (daysToExpiry <= 30) {
      await db.alert.create({
        data: {
          lotId,
          type: "VENCIMIENTO",
          severity: daysToExpiry <= 7 ? "CRITICAL" : "WARNING",
          message: `Vence pronto: ${drug.chemicalName} (lote ${lot.lotNumber}) en ${daysToExpiry} días`,
        },
      })
    }
  }
}
