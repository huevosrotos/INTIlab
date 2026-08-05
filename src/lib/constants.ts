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

// ============================================================
// Clases químicas para categorización de sustancias
// Una droga puede tener varias clases (ej: "inorgánico" + "ácido")
// ============================================================

export const CHEMICAL_CLASSES = {
  // Naturaleza
  INORGANICO: "Inorgánico",
  ORGANICO: "Orgánico",
  // Comportamiento ácido/base
  ACIDO: "Ácido",
  BASE: "Base",
  SAL: "Sal",
  // Peligrosidad
  INFLAMABLE: "Inflamable",
  COMBURENTE: "Comburente",
  EXPLOSIVO: "Explosivo",
  TOXICO: "Tóxico",
  CORROSIVO: "Corrosivo",
  IRRITANTE: "Irritante",
  CARCINOGENO: "Carcinógeno",
  // Reactividad
  OXIDANTE: "Oxidante",
  REDUCTOR: "Reductor",
  REACTIVO: "Reactivo",
  // Funcionales
  INDICADOR_PH: "Indicador de pH",
  INDICADOR_REDOX: "Indicador redox",
  COLORANTE: "Colorante",
  REACTIVO_ANALITICO: "Reactivo analítico",
  BUFFER: "Buffer",
  SOLVENTE: "Solvente",
  CATALIZADOR: "Catalizador",
  // Metales
  METAL: "Metal",
  COMPUESTO_METALICO: "Compuesto metálico",
  // Biológicos
  CARBOHIDRATO: "Carbohidrato",
  PROTEINA: "Proteína",
  LIPIDO: "Lípido",
  // Otros
  POLIMERO: "Polímero",
  SURFACTANTE: "Surfactante",
  OTRO: "Otro",
} as const

// Grupos para búsqueda combinada (cada grupo es excluyente entre sus opciones)
export const CHEMICAL_CLASS_GROUPS = {
  naturaleza: {
    label: "Naturaleza",
    options: ["INORGANICO", "ORGANICO"],
  },
  acidez: {
    label: "Ácido/Base",
    options: ["ACIDO", "BASE", "SAL"],
  },
  peligrosidad: {
    label: "Peligrosidad",
    options: ["INFLAMABLE", "COMBURENTE", "EXPLOSIVO", "TOXICO", "CORROSIVO", "IRRITANTE", "CARCINOGENO"],
  },
  reactividad: {
    label: "Reactividad",
    options: ["OXIDANTE", "REDUCTOR", "REACTIVO"],
  },
  funcional: {
    label: "Función",
    options: ["INDICADOR_PH", "INDICADOR_REDOX", "COLORANTE", "REACTIVO_ANALITICO", "BUFFER", "SOLVENTE", "CATALIZADOR"],
  },
  material: {
    label: "Material",
    options: ["METAL", "COMPUESTO_METALICO", "CARBOHIDRATO", "PROTEINA", "LIPIDO", "POLIMERO", "SURFACTANTE"],
  },
} as const

// Paleta de colores para cada clase (badges)
export const CHEMICAL_CLASS_COLORS: Record<string, string> = {
  INORGANICO: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300",
  ORGANICO: "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300",
  ACIDO: "bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950 dark:text-rose-300",
  BASE: "bg-violet-100 text-violet-700 border-violet-300 dark:bg-violet-950 dark:text-violet-300",
  SAL: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300",
  INFLAMABLE: "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-950 dark:text-orange-300",
  COMBURENTE: "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300",
  EXPLOSIVO: "bg-red-100 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300",
  TOXICO: "bg-red-100 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300",
  CORROSIVO: "bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950 dark:text-rose-300",
  IRRITANTE: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300",
  CARCINOGENO: "bg-red-100 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300",
  OXIDANTE: "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300",
  REDUCTOR: "bg-teal-100 text-teal-700 border-teal-300 dark:bg-teal-950 dark:text-teal-300",
  REACTIVO: "bg-sky-100 text-sky-700 border-sky-300 dark:bg-sky-950 dark:text-sky-300",
  INDICADOR_PH: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-300 dark:bg-fuchsia-950 dark:text-fuchsia-300",
  INDICADOR_REDOX: "bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300",
  COLORANTE: "bg-pink-100 text-pink-700 border-pink-300 dark:bg-pink-950 dark:text-pink-300",
  REACTIVO_ANALITICO: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300",
  BUFFER: "bg-cyan-100 text-cyan-700 border-cyan-300 dark:bg-cyan-950 dark:text-cyan-300",
  SOLVENTE: "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-950 dark:text-purple-300",
  CATALIZADOR: "bg-lime-100 text-lime-700 border-lime-300 dark:bg-lime-950 dark:text-lime-300",
  METAL: "bg-zinc-100 text-zinc-700 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300",
  COMPUESTO_METALICO: "bg-stone-100 text-stone-700 border-stone-300 dark:bg-stone-800 dark:text-stone-300",
  CARBOHIDRATO: "bg-green-100 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300",
  PROTEINA: "bg-teal-100 text-teal-700 border-teal-300 dark:bg-teal-950 dark:text-teal-300",
  LIPIDO: "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300",
  POLIMERO: "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300",
  SURFACTANTE: "bg-cyan-100 text-cyan-700 border-cyan-300 dark:bg-cyan-950 dark:text-cyan-300",
  OTRO: "bg-muted text-muted-foreground border-border",
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
