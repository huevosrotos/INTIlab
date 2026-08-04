import { db } from "../src/lib/db"
import { hashPassword } from "../src/lib/auth"
import { randomBytes } from "crypto"

function genQrCode(): string {
  return "DL-" + randomBytes(4).toString("hex").toUpperCase()
}

async function main() {
  console.log("Limpiando base de datos…")
  await db.movement.deleteMany()
  await db.alert.deleteMany()
  await db.lot.deleteMany()
  await db.drug.deleteMany()
  await db.warehouse.deleteMany()
  await db.user.deleteMany()

  console.log("Creando usuarios…")
  const pwd = hashPassword("droglab123")
  const admin = await db.user.create({
    data: { email: "admin@lab.org", name: "Lucía Administradora", password: pwd, role: "ADMIN" },
  })
  const encargado = await db.user.create({
    data: { email: "encargado@lab.org", name: "Martín Encargado", password: pwd, role: "ENCARGADO" },
  })
  const operario1 = await db.user.create({
    data: { email: "operario@lab.org", name: "Sofía Operaria", password: pwd, role: "OPERARIO" },
  })
  const operario2 = await db.user.create({
    data: { email: "j.perez@lab.org", name: "Juan Pérez", password: pwd, role: "OPERARIO" },
  })
  const auditor = await db.user.create({
    data: { email: "auditor@lab.org", name: "Carla Auditora", password: pwd, role: "AUDITOR" },
  })

  console.log("Creando depósitos…")
  const depositoPrincipal = await db.warehouse.create({
    data: {
      name: "Depósito Central",
      code: "DEP-00",
      type: "PRINCIPAL",
      location: "Edificio A - Planta Baja",
      description: "Depósito general de reactivos y drogas",
      responsibleId: encargado.id,
    },
  })
  const labSintesis = await db.warehouse.create({
    data: {
      name: "Lab. Síntesis Orgánica",
      code: "LAB-01",
      type: "SECUNDARIO",
      location: "Edificio B - Aula 101",
      responsibleId: operario1.id,
    },
  })
  const labAnalisis = await db.warehouse.create({
    data: {
      name: "Lab. Análisis Instrumental",
      code: "LAB-02",
      type: "SECUNDARIO",
      location: "Edificio B - Aula 203",
      responsibleId: operario2.id,
    },
  })
  const labMicro = await db.warehouse.create({
    data: {
      name: "Lab. Microbiología",
      code: "LAB-03",
      type: "SECUNDARIO",
      location: "Edificio C - Aula 105",
    },
  })
  const labDocencia = await db.warehouse.create({
    data: {
      name: "Lab. Docencia",
      code: "LAB-04",
      type: "SECUNDARIO",
      location: "Edificio A - Aula 302",
    },
  })

  console.log("Creando drogas…")
  type DrugSeed = {
    chemicalName: string
    commercialName?: string
    cas?: string
    formula?: string
    molecularWeight?: number
    purity?: string
    physicalState: string
    hazardClass?: string
    pictograms: string[]
    hStatements?: string[]
    defaultWarehouseId?: string
    defaultLocation?: string
    minStock?: number
    unit: string
    notes?: string
  }

  const drugs: DrugSeed[] = [
    {
      chemicalName: "Acetona",
      commercialName: "Acetona PA",
      cas: "67-64-1",
      formula: "C3H6O",
      molecularWeight: 58.08,
      purity: "≥99,5%",
      physicalState: "LIQUIDO",
      hazardClass: "Líquido inflamable cat. 2; irritante ocular cat. 2",
      pictograms: ["GHS02", "GHS07"],
      hStatements: ["H225", "H319", "H336"],
      defaultLocation: "Estante A-3",
      minStock: 500,
      unit: "mL",
    },
    {
      chemicalName: "Etanol absoluto",
      commercialName: "Alcohol etílico anhidro",
      cas: "64-17-5",
      formula: "C2H6O",
      molecularWeight: 46.07,
      purity: "≥99,9%",
      physicalState: "LIQUIDO",
      hazardClass: "Líquido inflamable cat. 2",
      pictograms: ["GHS02"],
      hStatements: ["H225", "H319"],
      defaultLocation: "Estante A-3",
      minStock: 1000,
      unit: "mL",
    },
    {
      chemicalName: "Ácido clorhídrico",
      commercialName: "Ácido clorhídrico 37% PA",
      cas: "7647-01-0",
      formula: "HCl",
      molecularWeight: 36.46,
      purity: "37%",
      physicalState: "LIQUIDO",
      hazardClass: "Corrosivo cutáneo cat. 1; toxicidad aguda cat. 3",
      pictograms: ["GHS05", "GHS06"],
      hStatements: ["H314", "H331"],
      defaultLocation: "Cámara ácidos - Estante C-1",
      minStock: 500,
      unit: "mL",
    },
    {
      chemicalName: "Hidróxido de sodio",
      commercialName: "Soda cáustica en lentejas",
      cas: "1310-73-2",
      formula: "NaOH",
      molecularWeight: 40.0,
      purity: "≥98%",
      physicalState: "SOLIDO",
      hazardClass: "Corrosivo cutáneo cat. 1",
      pictograms: ["GHS05"],
      hStatements: ["H314", "H290"],
      defaultLocation: "Estante B-2",
      minStock: 250,
      unit: "g",
    },
    {
      chemicalName: "Ácido sulfúrico",
      commercialName: "Ácido sulfúrico 98% PA",
      cas: "7664-93-9",
      formula: "H2SO4",
      molecularWeight: 98.08,
      purity: "98%",
      physicalState: "LIQUIDO",
      hazardClass: "Corrosivo cat. 1",
      pictograms: ["GHS05"],
      hStatements: ["H314"],
      defaultLocation: "Cámara ácidos - Estante C-2",
      minStock: 500,
      unit: "mL",
    },
    {
      chemicalName: "Metanol",
      cas: "67-56-1",
      formula: "CH4O",
      molecularWeight: 32.04,
      purity: "≥99,8%",
      physicalState: "LIQUIDO",
      hazardClass: "Líquido inflamable cat. 2; toxicidad aguda cat. 3",
      pictograms: ["GHS02", "GHS06", "GHS08"],
      hStatements: ["H225", "H301", "H311", "H331", "H370"],
      defaultLocation: "Estante A-4",
      minStock: 500,
      unit: "mL",
    },
    {
      chemicalName: "Diclorometano",
      commercialName: "Cloruro de metileno",
      cas: "75-09-2",
      formula: "CH2Cl2",
      molecularWeight: 84.93,
      purity: "≥99,9%",
      physicalState: "LIQUIDO",
      hazardClass: "Carcinógeno cat. 2",
      pictograms: ["GHS07", "GHS08"],
      hStatements: ["H315", "H319", "H335", "H351"],
      defaultLocation: "Cámara disolventes - D-1",
      minStock: 250,
      unit: "mL",
    },
    {
      chemicalName: "Peróxido de hidrógeno",
      commercialName: "Agua oxigenada 30%",
      cas: "7722-84-1",
      formula: "H2O2",
      molecularWeight: 34.01,
      purity: "30%",
      physicalState: "LIQUIDO",
      hazardClass: "Comburente cat. 1; corrosivo cat. 1",
      pictograms: ["GHS03", "GHS05"],
      hStatements: ["H272", "H314"],
      defaultLocation: "Refrigerador - R-1",
      minStock: 250,
      unit: "mL",
    },
    {
      chemicalName: "Tolueno",
      cas: "108-88-3",
      formula: "C7H8",
      molecularWeight: 92.14,
      purity: "≥99,5%",
      physicalState: "LIQUIDO",
      hazardClass: "Líquido inflamable cat. 2; toxicidad órgano específico",
      pictograms: ["GHS02", "GHS07", "GHS08"],
      hStatements: ["H225", "H304", "H315", "H336", "H361", "H373"],
      defaultLocation: "Cámara disolventes - D-2",
      minStock: 500,
      unit: "mL",
    },
    {
      chemicalName: "Sulfato de cobre (II) pentahidratado",
      commercialName: "Sulfato cúprico",
      cas: "7758-99-8",
      formula: "CuSO4·5H2O",
      molecularWeight: 249.68,
      purity: "≥99%",
      physicalState: "SOLIDO",
      hazardClass: "Toxicidad acuática aguda cat. 1",
      pictograms: ["GHS07", "GHS09"],
      hStatements: ["H302", "H315", "H319", "H410"],
      defaultLocation: "Estante B-1",
      minStock: 100,
      unit: "g",
    },
    {
      chemicalName: "Éter dietílico",
      commercialName: "Éter etílico",
      cas: "60-29-7",
      formula: "C4H10O",
      molecularWeight: 74.12,
      purity: "≥99%",
      physicalState: "LIQUIDO",
      hazardClass: "Líquido inflamable cat. 1",
      pictograms: ["GHS02", "GHS07"],
      hStatements: ["H224", "H302", "H319", "H336"],
      defaultLocation: "Refrigerador - R-2",
      minStock: 250,
      unit: "mL",
    },
    {
      chemicalName: "Cloruro de sodio",
      commercialName: "Sal de mesa PA",
      cas: "7647-14-5",
      formula: "NaCl",
      molecularWeight: 58.44,
      purity: "≥99,5%",
      physicalState: "SOLIDO",
      hazardClass: "Sin clasificación de peligro",
      pictograms: [],
      hStatements: [],
      defaultLocation: "Estante B-4",
      minStock: 500,
      unit: "g",
    },
    {
      chemicalName: "Nitrato de plata",
      cas: "7761-88-8",
      formula: "AgNO3",
      molecularWeight: 169.87,
      purity: "≥99,8%",
      physicalState: "SOLIDO",
      hazardClass: "Corrosivo cat. 1; peligro ambiental",
      pictograms: ["GHS05", "GHS09"],
      hStatements: ["H314", "H410"],
      defaultLocation: "Estante protegido - E-1",
      minStock: 25,
      unit: "g",
    },
    {
      chemicalName: "Acetonitrilo",
      cas: "75-05-8",
      formula: "C2H3N",
      molecularWeight: 41.05,
      purity: "≥99,9% HPLC",
      physicalState: "LIQUIDO",
      hazardClass: "Líquido inflamable cat. 2; toxicidad aguda",
      pictograms: ["GHS02", "GHS06"],
      hStatements: ["H225", "H302", "H312", "H332"],
      defaultLocation: "Cámara disolventes - D-3",
      minStock: 500,
      unit: "mL",
    },
  ]

  const createdDrugs = []
  for (const d of drugs) {
    const drug = await db.drug.create({
      data: {
        chemicalName: d.chemicalName,
        commercialName: d.commercialName ?? null,
        cas: d.cas ?? null,
        formula: d.formula ?? null,
        molecularWeight: d.molecularWeight ?? null,
        purity: d.purity ?? null,
        physicalState: d.physicalState,
        hazardClass: d.hazardClass ?? null,
        pictograms: JSON.stringify(d.pictograms),
        hStatements: d.hStatements ? JSON.stringify(d.hStatements) : null,
        defaultWarehouseId: depositoPrincipal.id,
        defaultLocation: d.defaultLocation ?? null,
        minStock: d.minStock ?? 0,
        unit: d.unit,
        notes: d.notes ?? null,
      },
    })
    createdDrugs.push(drug)
  }

  console.log("Creando lotes…")
  const now = new Date()
  const daysFromNow = (n: number) => new Date(now.getTime() + n * 86400000)
  const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000)

  const lotDefs: Array<{
    drugIdx: number
    lotNumber: string
    expiry: number // días desde hoy (negativo = vencido)
    supplier: string
    purchaseDaysAgo: number
    initial: number
    warehouseId: string
    location?: string
    purity?: string
    notes?: string
    status: "ACTIVO" | "EN_USO" | "CONSUMIDO" | "VENCIDO"
  }> = [
    { drugIdx: 0, lotNumber: "AC-2401", expiry: 365, supplier: "Cicarrelli", purchaseDaysAgo: 60, initial: 2500, warehouseId: depositoPrincipal.id, location: "Estante A-3", status: "ACTIVO" },
    { drugIdx: 0, lotNumber: "AC-2308", expiry: -15, supplier: "Anedra", purchaseDaysAgo: 300, initial: 1000, warehouseId: depositoPrincipal.id, location: "Estante A-3", status: "VENCIDO", purity: "≥99,0%", notes: "Frasco congelado, descartar" },
    { drugIdx: 1, lotNumber: "ET-2415", expiry: 540, supplier: "Merck", purchaseDaysAgo: 30, initial: 5000, warehouseId: depositoPrincipal.id, location: "Estante A-3", status: "ACTIVO" },
    { drugIdx: 1, lotNumber: "ET-2402", expiry: 60, supplier: "Cicarelli", purchaseDaysAgo: 120, initial: 1000, warehouseId: labSintesis.id, location: "Mesada 1", status: "EN_USO", notes: "Prestado al Lab. Docencia" },
    { drugIdx: 2, lotNumber: "HCl-2403", expiry: 720, supplier: "Anedra", purchaseDaysAgo: 90, initial: 2500, warehouseId: depositoPrincipal.id, location: "Cámara ácidos - C-1", status: "ACTIVO" },
    { drugIdx: 3, lotNumber: "NaOH-2410", expiry: 900, supplier: "Biopack", purchaseDaysAgo: 15, initial: 1000, warehouseId: depositoPrincipal.id, location: "Estante B-2", status: "ACTIVO" },
    { drugIdx: 3, lotNumber: "NaOH-2301", expiry: 20, supplier: "Anedra", purchaseDaysAgo: 350, initial: 500, warehouseId: labAnalisis.id, location: "Mesada 2", status: "CONSUMIDO" },
    { drugIdx: 4, lotNumber: "H2SO4-2420", expiry: 1000, supplier: "Merck", purchaseDaysAgo: 10, initial: 2500, warehouseId: depositoPrincipal.id, location: "Cámara ácidos - C-2", status: "ACTIVO" },
    { drugIdx: 5, lotNumber: "MeOH-2411", expiry: 300, supplier: "Sintorgan", purchaseDaysAgo: 45, initial: 2500, warehouseId: depositoPrincipal.id, location: "Estante A-4", status: "ACTIVO" },
    { drugIdx: 5, lotNumber: "MeOH-2407", expiry: 25, supplier: "Cicarrelli", purchaseDaysAgo: 200, initial: 1000, warehouseId: labSintesis.id, location: "Campana 1", status: "EN_USO", notes: "Tapón roto, manipular con cuidado" },
    { drugIdx: 6, lotNumber: "DCM-2412", expiry: 400, supplier: "Merck", purchaseDaysAgo: 20, initial: 1000, warehouseId: depositoPrincipal.id, location: "Cámara disolventes D-1", status: "ACTIVO" },
    { drugIdx: 7, lotNumber: "H2O2-2413", expiry: 180, supplier: "Cicarelli", purchaseDaysAgo: 40, initial: 1000, warehouseId: depositoPrincipal.id, location: "Refrigerador R-1", status: "ACTIVO" },
    { drugIdx: 8, lotNumber: "TOL-2406", expiry: 250, supplier: "Anedra", purchaseDaysAgo: 100, initial: 2500, warehouseId: depositoPrincipal.id, location: "Cámara disolventes D-2", status: "ACTIVO" },
    { drugIdx: 9, lotNumber: "CuSO4-2409", expiry: 1200, supplier: "Biopack", purchaseDaysAgo: 70, initial: 500, warehouseId: depositoPrincipal.id, location: "Estante B-1", status: "CONSUMIDO", notes: "Contaminado, no usar" },
    { drugIdx: 10, lotNumber: "ET2O-2414", expiry: 90, supplier: "Sintorgan", purchaseDaysAgo: 50, initial: 1000, warehouseId: depositoPrincipal.id, location: "Refrigerador R-2", status: "ACTIVO" },
    { drugIdx: 11, lotNumber: "NaCl-2405", expiry: 1500, supplier: "Anedra", purchaseDaysAgo: 80, initial: 1000, warehouseId: depositoPrincipal.id, location: "Estante B-4", status: "ACTIVO" },
    { drugIdx: 12, lotNumber: "AgNO3-2408", expiry: 600, supplier: "Merck", purchaseDaysAgo: 60, initial: 100, warehouseId: labAnalisis.id, location: "Mesada 3", status: "EN_USO" },
    { drugIdx: 13, lotNumber: "ACN-2416", expiry: 280, supplier: "Sintorgan", purchaseDaysAgo: 25, initial: 2500, warehouseId: labAnalisis.id, location: "Mesada 3", status: "ACTIVO", notes: "Lote nuevo, verificar pureza antes de usar" },
  ]

  const createdLots = []
  for (const ld of lotDefs) {
    const drug = createdDrugs[ld.drugIdx]
    const expiry = daysFromNow(ld.expiry)
    // En el modelo de frasco completo: current = 0 solo si está CONSUMIDO
    const currentQuantity = ld.status === "CONSUMIDO" ? 0 : ld.initial
    // Fechas de trazabilidad según el estado
    const receivedDate = daysAgo(ld.purchaseDaysAgo)
    const openedDate = (ld.status === "EN_USO" || ld.status === "CONSUMIDO")
      ? daysAgo(Math.floor(ld.purchaseDaysAgo / 2))
      : null
    const consumedDate = ld.status === "CONSUMIDO"
      ? daysAgo(Math.floor(ld.purchaseDaysAgo / 3))
      : null
    const discardedDate = null // el seed no crea lotes DADO_DE_BAJA
    const lot = await db.lot.create({
      data: {
        drugId: drug.id,
        lotNumber: ld.lotNumber,
        qrCode: genQrCode(),
        expiryDate: expiry,
        supplier: ld.supplier,
        purchaseDate: daysAgo(ld.purchaseDaysAgo),
        initialQuantity: ld.initial,
        currentQuantity,
        unit: drug.unit ?? "g",
        warehouseId: ld.warehouseId,
        location: ld.location ?? drug.defaultLocation,
        purity: ld.purity ?? null,
        notes: ld.notes ?? null,
        status: ld.status,
        receivedDate,
        openedDate,
        consumedDate,
        discardedDate,
      },
    })
    createdLots.push(lot)

    // Movimiento de ingreso inicial (todos los lotes)
    await db.movement.create({
      data: {
        lotId: lot.id,
        type: "INGRESO",
        toWarehouseId: ld.warehouseId,
        quantity: ld.initial,
        balanceAfter: ld.initial,
        userId: encargado.id,
        reason: `Ingreso inicial - Lote ${ld.lotNumber}`,
      },
    })

    const operario = ld.drugIdx % 2 === 0 ? operario1 : operario2

    // Si está EN_USO: registrar habilitación
    if (ld.status === "EN_USO") {
      await db.movement.create({
        data: {
          lotId: lot.id,
          type: "HABILITACION",
          quantity: ld.initial,
          balanceAfter: ld.initial,
          userId: operario.id,
          reason: "Frasco habilitado para uso",
        },
      })
    }

    // Si está CONSUMIDO: registrar habilitación + consumo completo
    if (ld.status === "CONSUMIDO") {
      await db.movement.create({
        data: {
          lotId: lot.id,
          type: "HABILITACION",
          quantity: ld.initial,
          balanceAfter: ld.initial,
          userId: operario.id,
          reason: "Frasco habilitado para uso",
        },
      })
      await db.movement.create({
        data: {
          lotId: lot.id,
          type: "CONSUMO",
          quantity: ld.initial,
          balanceAfter: 0,
          userId: operario.id,
          reason: "Frasco consumido completamente",
        },
      })
    }
  }

  console.log("Generando alertas…")
  for (const lot of createdLots) {
    const drug = createdDrugs.find((d) => d.id === lot.drugId)!
    const minStock = drug.minStock ?? 0
    if (lot.currentQuantity <= 0) {
      await db.alert.create({
        data: {
          lotId: lot.id,
          type: "STOCK_AGOTADO",
          severity: "CRITICAL",
          message: `Stock agotado: ${drug.chemicalName} (lote ${lot.lotNumber})`,
        },
      })
    } else if (lot.currentQuantity <= minStock) {
      await db.alert.create({
        data: {
          lotId: lot.id,
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
            lotId: lot.id,
            type: "VENCIMIENTO",
            severity: "CRITICAL",
            message: `Vencido: ${drug.chemicalName} (lote ${lot.lotNumber}) venció el ${lot.expiryDate.toLocaleDateString("es-AR")}`,
          },
        })
      } else if (daysToExpiry <= 30) {
        await db.alert.create({
          data: {
            lotId: lot.id,
            type: "VENCIMIENTO",
            severity: "WARNING",
            message: `Vence pronto: ${drug.chemicalName} (lote ${lot.lotNumber}) en ${daysToExpiry} días`,
          },
        })
      }
    }
  }

  console.log("Seed completo.")
  console.log({
    users: 5,
    warehouses: 5,
    drugs: createdDrugs.length,
    lots: createdLots.length,
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
