import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hashPassword } from "@/lib/auth"
import { randomBytes } from "crypto"
import { readFileSync } from "fs"
import { join } from "path"
import path from "path"

// Endpoint de inicialización de la base de datos.
// Lee los datos de prisma/seed-data.json (generado por prisma/import-excel.py).
// Usar solo en la primera instalación.
const SETUP_TOKEN = "droglab-setup-2024"

function genQrCode(): string {
  return "DL-" + randomBytes(4).toString("hex").toUpperCase()
}

type SeedData = {
  warehouses: Array<{ name: string; code: string; type: string; location: string }>
  users: Array<{ email: string; name: string; password: string; role: string }>
  drugs: Array<{
    code: string
    chemicalName: string
    clases: string[]
    state: string
    unit: string
    purity: string | null
    warehouse: string
    armario: number
    estante: string
    correlativo: number
    lotes: Array<{
      lotNumber: string
      supplier: string | null
      initialQuantity: number
      currentQuantity: number
      purity: string | null
    }>
  }>
}

function loadSeedData(): SeedData {
  // Intentar varias rutas (dev y producción)
  const paths = [
    join(process.cwd(), "prisma", "seed-data.json"),
    join(process.cwd(), "..", "prisma", "seed-data.json"),
    "/app/prisma/seed-data.json",
  ]
  for (const p of paths) {
    try {
      return JSON.parse(readFileSync(p, "utf-8"))
    } catch {}
  }
  throw new Error("No se pudo cargar seed-data.json")
}

export async function GET() {
  const userCount = await db.user.count()
  return NextResponse.json({
    initialized: userCount > 0,
    userCount,
  })
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization")
  const token = auth?.replace("Bearer ", "")
  if (token !== SETUP_TOKEN) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 })
  }

  try {
    const data = loadSeedData()

    // Limpiar
    await db.movement.deleteMany()
    await db.alert.deleteMany()
    await db.lot.deleteMany()
    await db.drug.deleteMany()
    await db.warehouse.deleteMany()
    await db.user.deleteMany()

    // Usuarios
    let adminId: string | null = null
    for (const u of data.users) {
      const user = await db.user.create({
        data: {
          email: u.email,
          name: u.name,
          password: hashPassword(u.password),
          role: u.role as any,
        },
      })
      if (u.role === "ADMIN" && !adminId) adminId = user.id
    }
    if (!adminId) throw new Error("No se creó usuario admin")

    // Depósitos
    const warehouseMap: Record<string, string> = {}
    for (const w of data.warehouses) {
      const created = await db.warehouse.create({
        data: {
          name: w.name,
          code: w.code,
          type: w.type as any,
          location: w.location,
        },
      })
      warehouseMap[w.name] = created.id
    }

    // Drogas y lotes
    let drugCount = 0
    let lotCount = 0

    for (const d of data.drugs) {
      const defaultWarehouseId = warehouseMap[d.warehouse]
      const defaultLocation = `Armario ${d.armario}-Estante ${d.estante}`

      const drug = await db.drug.create({
        data: {
          code: d.code,
          chemicalName: d.chemicalName,
          physicalState: d.state,
          pictograms: JSON.stringify([]),
          chemicalClasses: JSON.stringify(d.clases),
          defaultWarehouseId,
          defaultLocation,
          unit: d.unit,
          purity: d.purity,
        },
      })
      drugCount++

      for (const lote of d.lotes) {
        const lot = await db.lot.create({
          data: {
            drugId: drug.id,
            lotNumber: lote.lotNumber,
            qrCode: genQrCode(),
            initialQuantity: lote.initialQuantity,
            currentQuantity: lote.currentQuantity,
            unit: d.unit,
            warehouseId: defaultWarehouseId,
            location: defaultLocation,
            purity: lote.purity ?? d.purity,
            status: "ACTIVO",
            receivedDate: new Date(),
          },
        })
        lotCount++

        await db.movement.create({
          data: {
            lotId: lot.id,
            type: "INGRESO",
            toWarehouseId: defaultWarehouseId,
            quantity: lote.initialQuantity,
            balanceAfter: lote.initialQuantity,
            userId: adminId,
            reason: `Ingreso desde droguero antiguo (cód. ${d.code})`,
          },
        })
      }
    }

    return NextResponse.json({
      ok: true,
      message: "Base de datos inicializada correctamente",
      data: {
        users: data.users.length,
        warehouses: data.warehouses.length,
        drugs: drugCount,
        lots: lotCount,
      },
    })
  } catch (e: any) {
    console.error("Error en setup:", e)
    return NextResponse.json({ error: e.message ?? "Error desconocido" }, { status: 500 })
  }
}
