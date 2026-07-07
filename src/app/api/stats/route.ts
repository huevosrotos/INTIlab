import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireUser } from "@/lib/api-helpers"

export async function GET() {
  const r = await requireUser()
  if (!r.ok) return r.res

  const now = new Date()
  const in30 = new Date(now.getTime() + 30 * 86400000)

  const [
    drugCount,
    lotCount,
    activeLotCount,
    warehouseCount,
    movementCount,
    unresolvedAlerts,
    expiringSoon,
    lowStock,
    recentMovements,
    warehouses,
  ] = await Promise.all([
    db.drug.count(),
    db.lot.count(),
    db.lot.count({ where: { status: "ACTIVO" } }),
    db.warehouse.count({ where: { active: true } }),
    db.movement.count(),
    db.alert.count({ where: { resolved: false } }),
    db.lot.count({
      where: {
        status: "ACTIVO",
        expiryDate: { lte: in30, gte: now },
      },
    }),
    db.lot.count({
      where: {
        status: "ACTIVO",
        currentQuantity: { lte: 0 },
      },
    }),
    db.movement.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        lot: { include: { drug: true } },
        user: { select: { name: true } },
        fromWarehouse: { select: { name: true } },
        toWarehouse: { select: { name: true } },
      },
    }),
    db.warehouse.findMany({
      orderBy: [{ type: "asc" }, { name: "asc" }],
      include: {
        lots: { where: { status: "ACTIVO" }, select: { currentQuantity: true, unit: true, drugId: true } },
      },
    }),
  ])

  // Stock por depósito (conteo de lotes activos y drogas distintas)
  const warehouseStats = warehouses.map((w) => {
    const activeLots = w.lots
    return {
      id: w.id,
      name: w.name,
      code: w.code,
      type: w.type,
      activeLotCount: activeLots.length,
      distinctDrugs: new Set(activeLots.map((l) => l.drugId)).size,
    }
  })

  // Alertas no resueltas agrupadas por severidad
  const alerts = await db.alert.findMany({
    where: { resolved: false },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { lot: { include: { drug: true, warehouse: true } } },
  })

  return NextResponse.json({
    counts: {
      drugs: drugCount,
      lots: lotCount,
      activeLots: activeLotCount,
      warehouses: warehouseCount,
      movements: movementCount,
      unresolvedAlerts,
      expiringSoon,
      lowStock,
    },
    warehouseStats,
    recentMovements,
    alerts,
  })
}
