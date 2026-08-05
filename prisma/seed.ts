import { db } from "../src/lib/db"
import { hashPassword } from "../src/lib/auth"
import { randomBytes } from "crypto"
import { readFileSync } from "fs"
import { join } from "path"

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

async function main() {
  console.log("Cargando datos de seed…")
  const dataPath = join(__dirname, "seed-data.json")
  const data: SeedData = JSON.parse(readFileSync(dataPath, "utf-8"))

  console.log("Limpiando base de datos…")
  await db.movement.deleteMany()
  await db.alert.deleteMany()
  await db.lot.deleteMany()
  await db.drug.deleteMany()
  await db.warehouse.deleteMany()
  await db.user.deleteMany()

  console.log("Creando usuarios…")
  for (const u of data.users) {
    await db.user.create({
      data: {
        email: u.email,
        name: u.name,
        password: hashPassword(u.password),
        role: u.role as any,
      },
    })
  }

  console.log("Creando depósitos…")
  const warehouseMap: Record<string, string> = {} // name → id
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

  console.log(`Creando ${data.drugs.length} drogas y ${data.drugs.reduce((s, d) => s + d.lotes.length, 0)} lotes…`)
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

      // Movimiento de ingreso
      await db.movement.create({
        data: {
          lotId: lot.id,
          type: "INGRESO",
          toWarehouseId: defaultWarehouseId,
          quantity: lote.initialQuantity,
          balanceAfter: lote.initialQuantity,
          userId: (await db.user.findFirst())!.id,
          reason: `Ingreso desde droguero antiguo (cód. ${d.code})`,
        },
      })
    }
  }

  console.log(`\n✓ Seed completo.`)
  console.log(`  - ${data.users.length} usuarios`)
  console.log(`  - ${data.warehouses.length} depósitos`)
  console.log(`  - ${drugCount} drogas`)
  console.log(`  - ${lotCount} lotes`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
