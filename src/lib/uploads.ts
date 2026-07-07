// Helper para guardar imágenes subidas a la carpeta /uploads
import { promises as fs } from "fs"
import path from "path"
import { randomUUID } from "crypto"

const UPLOAD_DIR = path.join(process.cwd(), "uploads")

export async function saveUploadFile(file: File | Blob, prefix = "img"): Promise<string> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true })
  const buf = Buffer.from(await file.arrayBuffer())
  const ext = "jpg"
  const name = `${prefix}_${randomUUID()}.${ext}`
  await fs.writeFile(path.join(UPLOAD_DIR, name), buf)
  return `/api/uploads/${name}`
}

export async function getUploadFile(name: string): Promise<Buffer | null> {
  const filePath = path.join(UPLOAD_DIR, path.basename(name))
  try {
    return await fs.readFile(filePath)
  } catch {
    return null
  }
}
