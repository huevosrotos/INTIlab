import { db } from "@/lib/db"

// Configuración por defecto del sistema
const DEFAULTS: Record<string, string> = {
  // SMTP / Email
  smtp_host: "",
  smtp_port: "587",
  smtp_user: "",
  smtp_pass: "",
  smtp_from: "",
  // Alertas
  alert_expiry_days: "30",
  // Sistema
  system_name: "DrogLab",
  setup_token: "droglab-setup-2024",
}

export async function getSetting(key: string): Promise<string> {
  // Primero intentar DB
  try {
    const row = await db.setting.findUnique({ where: { id: key } })
    if (row) return row.value
  } catch {}
  // Luego variables de entorno
  const envKey = key.toUpperCase()
  if (process.env[envKey]) return process.env[envKey]
  // Finalmente defaults
  return DEFAULTS[key] ?? ""
}

export async function getSettings(keys: string[]): Promise<Record<string, string>> {
  const result: Record<string, string> = {}
  for (const key of keys) {
    result[key] = await getSetting(key)
  }
  return result
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db.setting.upsert({
    where: { id: key },
    create: { id: key, value },
    update: { value },
  })
}

export async function setSettings(settings: Record<string, string>): Promise<void> {
  for (const [key, value] of Object.entries(settings)) {
    await setSetting(key, value)
  }
}

// Lista de todas las claves de configuración
export const SETTING_KEYS = {
  smtp: ["smtp_host", "smtp_port", "smtp_user", "smtp_pass", "smtp_from"],
  alerts: ["alert_expiry_days"],
  system: ["system_name", "setup_token"],
}

export const SETTING_LABELS: Record<string, string> = {
  smtp_host: "Servidor SMTP",
  smtp_port: "Puerto SMTP",
  smtp_user: "Usuario SMTP",
  smtp_pass: "Contraseña SMTP",
  smtp_from: "Email remitente",
  alert_expiry_days: "Días de anticipación para alertas de vencimiento",
  system_name: "Nombre del sistema",
  setup_token: "Token de setup (para inicializar DB)",
}
