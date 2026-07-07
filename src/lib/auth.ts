// Autenticación simple basada en cookies httpOnly.
// Las contraseñas se almacenan hasheadas con SHA-256 + sal.

import { cookies } from "next/headers"
import { db } from "@/lib/db"
import { randomBytes, createHash } from "crypto"

const SESSION_COOKIE = "droglab_session"
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 días

const SALT = "droglab_salt_2024_v1"

export function hashPassword(password: string): string {
  return createHash("sha256").update(SALT + password).digest("hex")
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash
}

export function createSessionToken(userId: string): string {
  // Token simple: userId + random + timestamp, firmado con hash
  const random = randomBytes(16).toString("hex")
  const ts = Date.now().toString(36)
  const payload = `${userId}.${ts}.${random}`
  const sig = createHash("sha256").update(SALT + payload).digest("hex").slice(0, 16)
  return `${payload}.${sig}`
}

export function parseSessionToken(token: string): string | null {
  const parts = token.split(".")
  if (parts.length !== 4) return null
  const [userId, ts, random, sig] = parts
  const payload = `${userId}.${ts}.${random}`
  const expectedSig = createHash("sha256").update(SALT + payload).digest("hex").slice(0, 16)
  if (sig !== expectedSig) return null
  return userId
}

export async function getSessionUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null
  const userId = parseSessionToken(token)
  if (!userId) return null
  const user = await db.user.findUnique({
    where: { id: userId, active: true },
    include: { warehouse: true },
  })
  return user
}

export async function setSessionCookie(userId: string) {
  const cookieStore = await cookies()
  const token = createSessionToken(userId)
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  })
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

// Permisos por rol
export function canEdit(role: string | undefined): boolean {
  return role === "ADMIN" || role === "ENCARGADO"
}

export function canConsume(role: string | undefined): boolean {
  return role === "ADMIN" || role === "ENCARGADO" || role === "OPERARIO"
}

export function isAdmin(role: string | undefined): boolean {
  return role === "ADMIN"
}

export function isReadOnly(role: string | undefined): boolean {
  return role === "AUDITOR"
}
