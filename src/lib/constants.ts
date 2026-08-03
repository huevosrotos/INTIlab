// Constantes y tipos compartidos del sistema DrogLab

export const ROLES = {
  ADMIN: "ADMIN",
  ENCARGADO: "ENCARGADO",
  OPERARIO: "OPERARIO",
  AUDITOR: "AUDITOR",
} as const

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  ENCARGADO: "Encargado de Depósito",
  OPERARIO: "Operario de Laboratorio",
  AUDITOR: "Auditor (solo lectura)",
}

export const WAREHOUSE_TYPES = {
  PRINCIPAL: "PRINCIPAL",
  SECUNDARIO: "SECUNDARIO",
} as const

export const WAREHOUSE_TYPE_LABELS: Record<string, string> = {
  PRINCIPAL: "Depósito Principal",
  SECUNDARIO: "Depósito Local",
}

export const MOVEMENT_TYPES = {
  INGRESO: "INGRESO",
  TRANSFERENCIA: "TRANSFERENCIA",
  HABILITACION: "HABILITACION",
  CONSUMO: "CONSUMO",
  DEVOLUCION: "DEVOLUCION",
  BAJA: "BAJA",
  AJUSTE: "AJUSTE",
} as const

export const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  INGRESO: "Ingreso",
  TRANSFERENCIA: "Transferencia",
  HABILITACION: "Habilitación para uso",
  CONSUMO: "Consumo (frasco completo)",
  DEVOLUCION: "Devolución al depósito",
  BAJA: "Baja / Descarte",
  AJUSTE: "Ajuste de inventario",
}

export const MOVEMENT_TYPE_COLORS: Record<string, string> = {
  INGRESO: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300",
  TRANSFERENCIA: "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-300",
  HABILITACION: "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-950 dark:text-teal-300",
  CONSUMO: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300",
  DEVOLUCION: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-300",
  BAJA: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300",
  AJUSTE: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300",
}

export const PHYSICAL_STATES = {
  SOLIDO: "SOLIDO",
  LIQUIDO: "LIQUIDO",
  GAS: "GAS",
  OTRO: "OTRO",
} as const

export const PHYSICAL_STATE_LABELS: Record<string, string> = {
  SOLIDO: "Sólido",
  LIQUIDO: "Líquido",
  GAS: "Gas",
  OTRO: "Otro",
}

export const LOT_STATUSES = {
  ACTIVO: "ACTIVO",
  EN_USO: "EN_USO",
  CONSUMIDO: "CONSUMIDO",
  VENCIDO: "VENCIDO",
  DADO_DE_BAJA: "DADO_DE_BAJA",
} as const

export const LOT_STATUS_LABELS: Record<string, string> = {
  ACTIVO: "Activo",
  EN_USO: "En uso",
  CONSUMIDO: "Consumido",
  VENCIDO: "Vencido",
  DADO_DE_BAJA: "Dado de baja",
}

export const LOT_STATUS_COLORS: Record<string, string> = {
  ACTIVO: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300",
  EN_USO: "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-950 dark:text-teal-300",
  CONSUMIDO: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300",
  VENCIDO: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300",
  DADO_DE_BAJA: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400",
}

// Pictogramas del Sistema Globalmente Armonizado (SGA / GHS)
export const GHS_PICTOGRAMS = {
  GHS01: { label: "Explosivo", key: "GHS01" },
  GHS02: { label: "Inflamable", key: "GHS02" },
  GHS03: { label: "Comburente", key: "GHS03" },
  GHS04: { label: "Gas a presión", key: "GHS04" },
  GHS05: { label: "Corrosivo", key: "GHS05" },
  GHS06: { label: "Toxicidad aguda (grave)", key: "GHS06" },
  GHS07: { label: "Irritante / Sensibilizante", key: "GHS07" },
  GHS08: { label: "Peligro para la salud", key: "GHS08" },
  GHS09: { label: "Peligro para el medio ambiente", key: "GHS09" },
} as const

export const ALERT_TYPES = {
  VENCIMIENTO: "VENCIMIENTO",
  STOCK_BAJO: "STOCK_BAJO",
  STOCK_AGOTADO: "STOCK_AGOTADO",
} as const

export const ALERT_TYPE_LABELS: Record<string, string> = {
  VENCIMIENTO: "Vencimiento próximo",
  STOCK_BAJO: "Stock bajo",
  STOCK_AGOTADO: "Stock agotado",
}

export const SEVERITY_COLORS: Record<string, string> = {
  INFO: "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-300",
  WARNING: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300",
  CRITICAL: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300",
}

// Unidades comunes en laboratorio
export const UNITS = ["g", "mg", "kg", "mL", "L", "mol", "u"] as const

// Configuración de alertas
export const EXPIRY_WARNING_DAYS = 30 // días antes del vencimiento para alertar

// Tamaños de etiqueta para impresión (en mm)
export const LABEL_SIZES = [
  { id: "XS", name: "Extra chica (30×20 mm)", width: 30, height: 20 },
  { id: "S", name: "Chica (40×25 mm)", width: 40, height: 25 },
  { id: "M", name: "Mediana (50×30 mm)", width: 50, height: 30 },
  { id: "L", name: "Grande (70×40 mm)", width: 70, height: 40 },
  { id: "XL", name: "Extra grande (90×50 mm)", width: 90, height: 50 },
  { id: "CUSTOM", name: "Personalizado", width: 50, height: 30 },
] as const
